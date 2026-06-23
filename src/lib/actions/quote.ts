"use server";

import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { Locale } from "@prisma/client";
import { z } from "zod";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { notifyNewQuote } from "@/lib/email/notify";
import { DEFAULT_LOCALE, isLocale, pickTranslation } from "@/lib/i18n";
import { quoteFormToObject, quoteRequestSchema } from "@/lib/validation/quote";
import {
  QUOTE_LIST_PATH,
  type CartLine,
  type CartView,
  type QuoteFormState,
} from "./quote-types";

const CART_COOKIE = "moniva_qid";
const CART_COOKIE_MAX_AGE = 60 * 60 * 24 * 365; // 1 yıl

const EMPTY_CART: CartView = {
  exists: false,
  lines: [],
  totalQuantity: 0,
  lineCount: 0,
  oemCount: 0,
  aftermarketCount: 0,
};

// ---------------------------------------------------------------------------
// Session helpers
// ---------------------------------------------------------------------------

async function getCartSessionId(): Promise<string | null> {
  const store = await cookies();
  return store.get(CART_COOKIE)?.value ?? null;
}

/** Sepet oturumunu garanti eder ve cookie'yi set eder. Sadece Server Action içinde çağrılmalı. */
async function ensureCartSessionId(): Promise<string> {
  const store = await cookies();
  const existing = store.get(CART_COOKIE)?.value;
  if (existing) return existing;

  const sessionId = crypto.randomUUID();
  store.set(CART_COOKIE, sessionId, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: CART_COOKIE_MAX_AGE,
  });
  return sessionId;
}

// ---------------------------------------------------------------------------
// Reads
// ---------------------------------------------------------------------------

export async function getCart(
  locale: Locale = DEFAULT_LOCALE,
): Promise<CartView> {
  const sessionId = await getCartSessionId();
  if (!sessionId) return EMPTY_CART;

  const list = await prisma.quoteList.findUnique({
    where: { sessionId },
    include: {
      items: {
        orderBy: { createdAt: "asc" },
        include: {
          product: {
            include: {
              translations: true,
              images: { orderBy: [{ isMain: "desc" }, { order: "asc" }] },
              oemReferences: { orderBy: { oemNumber: "asc" } },
              category: { include: { translations: true } },
            },
          },
        },
      },
    },
  });

  if (!list || list.items.length === 0) return EMPTY_CART;

  const lines: CartLine[] = list.items.map((item) => {
    const tr = pickTranslation(item.product.translations, locale);
    const catTr = pickTranslation(item.product.category.translations, locale);
    return {
      itemId: item.id,
      productId: item.productId,
      sku: item.product.sku,
      slug: item.product.slug,
      name: tr?.name ?? item.product.sku,
      category: catTr?.name ?? null,
      partType: item.product.partType,
      quantity: item.quantity,
      imageUrl: item.product.images[0]?.url ?? null,
      oemNumbers: item.product.oemReferences.map((o) => o.oemNumber),
    };
  });

  return {
    exists: true,
    lines,
    totalQuantity: lines.reduce((sum, l) => sum + l.quantity, 0),
    lineCount: lines.length,
    oemCount: lines.filter((l) => l.partType === "OEM").length,
    aftermarketCount: lines.filter((l) => l.partType === "AFTERMARKET").length,
  };
}

// ---------------------------------------------------------------------------
// Mutations
// ---------------------------------------------------------------------------

const idSchema = z.string().min(1);
const quantitySchema = z.coerce.number().int().min(1).max(9999);

export async function addToCart(productId: string, quantity = 1): Promise<void> {
  const id = idSchema.parse(productId);
  const qty = quantitySchema.parse(quantity);

  const product = await prisma.product.findFirst({
    where: { id, isActive: true },
    select: { id: true },
  });
  if (!product) throw new Error("Ürün bulunamadı");

  const sessionId = await ensureCartSessionId();

  const list = await prisma.quoteList.upsert({
    where: { sessionId },
    create: { sessionId },
    update: {},
  });

  await prisma.quoteItem.upsert({
    where: { quoteListId_productId: { quoteListId: list.id, productId: id } },
    create: { quoteListId: list.id, productId: id, quantity: qty },
    update: { quantity: { increment: qty } },
  });

  revalidatePath(QUOTE_LIST_PATH);
}

export async function updateCartItemQuantity(
  productId: string,
  quantity: number,
): Promise<void> {
  const id = idSchema.parse(productId);
  const qty = quantitySchema.parse(quantity);

  const sessionId = await getCartSessionId();
  if (!sessionId) return;

  const list = await prisma.quoteList.findUnique({
    where: { sessionId },
    select: { id: true },
  });
  if (!list) return;

  await prisma.quoteItem.update({
    where: { quoteListId_productId: { quoteListId: list.id, productId: id } },
    data: { quantity: qty },
  });

  revalidatePath(QUOTE_LIST_PATH);
}

export async function removeCartItem(productId: string): Promise<void> {
  const id = idSchema.parse(productId);

  const sessionId = await getCartSessionId();
  if (!sessionId) return;

  const list = await prisma.quoteList.findUnique({
    where: { sessionId },
    select: { id: true },
  });
  if (!list) return;

  await prisma.quoteItem.deleteMany({
    where: { quoteListId: list.id, productId: id },
  });

  revalidatePath(QUOTE_LIST_PATH);
}

export async function clearCart(): Promise<void> {
  const sessionId = await getCartSessionId();
  if (!sessionId) return;

  await prisma.quoteList.deleteMany({ where: { sessionId } });
  revalidatePath(QUOTE_LIST_PATH);
}

// ---------------------------------------------------------------------------
// Submit — sepeti snapshot'layıp QuoteRequest'e dönüştürür
// ---------------------------------------------------------------------------

export async function submitQuoteRequest(
  _prevState: QuoteFormState,
  formData: FormData,
): Promise<QuoteFormState> {
  const localeRaw = formData.get("locale");
  const locale: Locale =
    typeof localeRaw === "string" && isLocale(localeRaw)
      ? localeRaw
      : DEFAULT_LOCALE;

  const sessionId = await getCartSessionId();
  if (!sessionId) {
    return { ok: false, formError: "Teklif listeniz boş." };
  }

  const list = await prisma.quoteList.findUnique({
    where: { sessionId },
    include: {
      items: { include: { product: { include: { translations: true } } } },
    },
  });

  if (!list || list.items.length === 0) {
    return { ok: false, formError: "Teklif listeniz boş." };
  }

  const parsed = quoteRequestSchema.safeParse(quoteFormToObject(formData));
  if (!parsed.success) {
    const { fieldErrors } = z.flattenError(parsed.error);
    return { ok: false, fieldErrors };
  }

  const data = parsed.data;

  // Giriş yapmış müşteri ise teklifi hesabına bağla (anonim de mümkün).
  const session = await auth();
  const userId = session?.user?.id ?? null;

  const snapshotItems = list.items.map((item) => {
    const tr = pickTranslation(item.product.translations, locale);
    return {
      productId: item.productId,
      quantity: item.quantity,
      snapshotSku: item.product.sku,
      snapshotName: tr?.name ?? item.product.sku,
      snapshotLocale: locale,
    };
  });

  // NOT: Sepeti BURADA silmiyoruz. Server Action sonrası Next mevcut rotayı
  // otomatik yeniden render eder; sepet silinseydi sayfa boş duruma düşer ve
  // başarı ekranını taşıyan modal unmount olurdu. Sepet, kullanıcı "Tamam"
  // deyince finalizeQuote() ile temizlenir.
  const request = await prisma.quoteRequest.create({
    data: {
      userId,
      fullName: data.fullName,
      email: data.email,
      phone: `${data.phoneCountryCode} ${data.phone}`,
      companyName: data.companyName,
      country: data.country,
      city: data.city,
      taxNumber: data.taxNumber,
      taxOffice: data.taxOffice,
      address: data.address,
      notes: data.notes,
      kvkkConsent: data.kvkkConsent,
      marketingConsent: data.marketingConsent,
      items: { create: snapshotItems },
    },
    select: { id: true },
  });

  // Giriş yapmış müşterinin panelinde anında görünsün.
  if (userId) revalidatePath("/hesabim");

  // Admin'e e-posta bildirimi (yapılandırılmamışsa sessizce atlar, hata akışı düşürmez).
  await notifyNewQuote({
    id: request.id,
    ref: `QR-${request.id.slice(-6).toUpperCase()}`,
    companyName: data.companyName,
    fullName: data.fullName,
    email: data.email,
    phone: `${data.phoneCountryCode} ${data.phone}`,
    country: data.country,
    itemCount: snapshotItems.length,
    notes: data.notes,
  });

  return { ok: true, requestId: request.id };
}

/** Başarı ekranı kapatılınca sepeti ve cookie'yi temizler. */
export async function finalizeQuote(): Promise<void> {
  const sessionId = await getCartSessionId();
  if (sessionId) {
    await prisma.quoteList.deleteMany({ where: { sessionId } });
    (await cookies()).delete(CART_COOKIE);
  }
  revalidatePath(QUOTE_LIST_PATH);
}
