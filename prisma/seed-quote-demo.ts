/**
 * Teklif Takip — demo/sunum senaryosu.
 * 9 teklif, farklı takip durumlarında (açılmadı / görüntülendi / onaylandı /
 * revizyon / uygun değil / görüşme / süresi doluyor / süresi doldu + CANLI demo).
 *
 * publicToken'lar "demo-" ön ekiyle üretilir → script idempotent'tir:
 * her çalışmada önce eski demo teklifleri silinir (cascade: items + events),
 * gerçek veriye DOKUNMAZ. Sadece YEREL veritabanında çalıştırın.
 *
 * Çalıştır: npx tsx prisma/seed-quote-demo.ts
 */
import {
  PrismaClient,
  QuoteEventType,
  QuoteStatus,
  type Currency,
} from "@prisma/client";

const prisma = new PrismaClient();

const DAY = 24 * 60 * 60 * 1000;
const now = Date.now();
const daysAgo = (n: number) => new Date(now - n * DAY);
const fromNow = (n: number) => new Date(now + n * DAY);

type ItemSpec = { pi: number; qty: number; unit: number };
type EventSpec = {
  type: QuoteEventType;
  daysAgo: number;
  device?: string;
  note?: string;
};

type Scenario = {
  token: string;
  company: string;
  contact: string;
  phone: string;
  country: string;
  city?: string;
  email: string;
  currency: Currency;
  status: QuoteStatus;
  quotedDaysAgo: number;
  validUntilFromNow: number;
  discountPct: number;
  shippingCost: number;
  shippingMode: string;
  vatRate: number;
  paymentTerms: string;
  items: ItemSpec[];
  view?: { firstDaysAgo: number; lastDaysAgo: number; count: number };
  events?: EventSpec[];
  tag: string;
};

const SCENARIOS: Scenario[] = [
  {
    token: "demo-canli",
    company: "Yıldız Nakliyat A.Ş.",
    contact: "Mehmet Yıldız",
    phone: "+90 532 111 22 33",
    country: "Türkiye",
    city: "İstanbul",
    email: "mehmet@yildiznakliyat.com.tr",
    currency: "TRY",
    status: QuoteStatus.QUOTED,
    quotedDaysAgo: 0,
    validUntilFromNow: 30,
    discountPct: 5,
    shippingCost: 1500,
    shippingMode: "DAP",
    vatRate: 20,
    paymentTerms: "Net 30",
    items: [
      { pi: 0, qty: 20, unit: 950 },
      { pi: 3, qty: 8, unit: 3450 },
      { pi: 4, qty: 12, unit: 2100 },
    ],
    tag: "CANLI DEMO — linki gizli sekmede açıp müşteri akışını göster",
  },
  {
    token: "demo-acilmadi",
    company: "Demir Kardeşler Treyler",
    contact: "Ali Demir",
    phone: "+90 533 222 33 44",
    country: "Türkiye",
    city: "Konya",
    email: "ali@demirkardeslertreyler.com",
    currency: "TRY",
    status: QuoteStatus.QUOTED,
    quotedDaysAgo: 2,
    validUntilFromNow: 25,
    discountPct: 0,
    shippingCost: 800,
    shippingMode: "FCA",
    vatRate: 20,
    paymentTerms: "Peşin",
    items: [
      { pi: 1, qty: 15, unit: 1250 },
      { pi: 2, qty: 6, unit: 1850 },
    ],
    tag: "Gönderildi, henüz açılmadı",
  },
  {
    token: "demo-goruntulendi",
    company: "Anadolu Lojistik Ltd.",
    contact: "Zeynep Kaya",
    phone: "+90 534 333 44 55",
    country: "Türkiye",
    city: "Ankara",
    email: "zeynep@anadolulojistik.com",
    currency: "TRY",
    status: QuoteStatus.VIEWED,
    quotedDaysAgo: 5,
    validUntilFromNow: 18,
    discountPct: 8,
    shippingCost: 1200,
    shippingMode: "DAP",
    vatRate: 20,
    paymentTerms: "Net 45",
    items: [
      { pi: 0, qty: 30, unit: 920 },
      { pi: 5, qty: 10, unit: 2680 },
    ],
    view: { firstDaysAgo: 4, lastDaysAgo: 0, count: 3 },
    events: [
      { type: QuoteEventType.LINK_OPENED, daysAgo: 4, device: "desktop" },
      { type: QuoteEventType.LINK_OPENED, daysAgo: 2, device: "mobile" },
      { type: QuoteEventType.LINK_OPENED, daysAgo: 0, device: "mobile" },
    ],
    tag: "Açtı, henüz karar yok (sıcak)",
  },
  {
    token: "demo-onaylandi",
    company: "Ege Soğuk Zincir A.Ş.",
    contact: "Burak Şahin",
    phone: "+90 535 444 55 66",
    country: "Türkiye",
    city: "İzmir",
    email: "burak@egesogukzincir.com",
    currency: "USD",
    status: QuoteStatus.APPROVED,
    quotedDaysAgo: 5,
    validUntilFromNow: 12,
    discountPct: 6,
    shippingCost: 320,
    shippingMode: "EXW",
    vatRate: 0,
    paymentTerms: "Net 60",
    items: [
      { pi: 2, qty: 12, unit: 78 },
      { pi: 4, qty: 20, unit: 96 },
    ],
    view: { firstDaysAgo: 4, lastDaysAgo: 1, count: 2 },
    events: [
      { type: QuoteEventType.LINK_OPENED, daysAgo: 4, device: "desktop" },
      { type: QuoteEventType.LINK_OPENED, daysAgo: 1, device: "desktop" },
      { type: QuoteEventType.DECISION_APPROVE, daysAgo: 1, device: "desktop" },
    ],
    tag: "Müşteri onayladı (kazanıldı)",
  },
  {
    token: "demo-revizyon",
    company: "Karadeniz Ağır Vasıta",
    contact: "Hakan Aydın",
    phone: "+90 536 555 66 77",
    country: "Türkiye",
    city: "Samsun",
    email: "hakan@karadenizagirvasita.com",
    currency: "TRY",
    status: QuoteStatus.REVISION_REQUESTED,
    quotedDaysAgo: 3,
    validUntilFromNow: 16,
    discountPct: 4,
    shippingCost: 1000,
    shippingMode: "DAP",
    vatRate: 20,
    paymentTerms: "Net 30",
    items: [
      { pi: 5, qty: 25, unit: 2620 },
      { pi: 1, qty: 10, unit: 1180 },
    ],
    view: { firstDaysAgo: 2, lastDaysAgo: 0, count: 2 },
    events: [
      { type: QuoteEventType.LINK_OPENED, daysAgo: 2, device: "desktop" },
      {
        type: QuoteEventType.DECISION_REVISION,
        daysAgo: 0,
        device: "desktop",
        note: "20 adet körük için toplu iskonto mümkün mü? Ayrıca 90 gün vade ile fiyatı güncelleyebilir misiniz?",
      },
    ],
    tag: "Revizyon istedi (müşteri notlu)",
  },
  {
    token: "demo-uygun-degil",
    company: "Marmara Filo Kiralama",
    contact: "Selin Yılmaz",
    phone: "+90 537 666 77 88",
    country: "Türkiye",
    city: "Bursa",
    email: "selin@marmarafilo.com",
    currency: "EUR",
    status: QuoteStatus.DECLINED,
    quotedDaysAgo: 4,
    validUntilFromNow: 7,
    discountPct: 0,
    shippingCost: 180,
    shippingMode: "FCA",
    vatRate: 0,
    paymentTerms: "Peşin",
    items: [
      { pi: 0, qty: 8, unit: 42 },
      { pi: 3, qty: 4, unit: 155 },
    ],
    view: { firstDaysAgo: 3, lastDaysAgo: 3, count: 1 },
    events: [
      { type: QuoteEventType.LINK_OPENED, daysAgo: 3, device: "mobile" },
      {
        type: QuoteEventType.DECISION_DECLINE,
        daysAgo: 3,
        device: "mobile",
        note: "Bu dönem bütçemiz uygun değil, ilerleyen aylarda tekrar değerlendireceğiz.",
      },
    ],
    tag: "Uygun değil (kaybedildi)",
  },
  {
    token: "demo-gorusme",
    company: "Toros Petrol Taşımacılık",
    contact: "Emre Çelik",
    phone: "+90 538 777 88 99",
    country: "Türkiye",
    city: "Mersin",
    email: "emre@torospetrol.com",
    currency: "TRY",
    status: QuoteStatus.VIEWED,
    quotedDaysAgo: 3,
    validUntilFromNow: 20,
    discountPct: 7,
    shippingCost: 1350,
    shippingMode: "DAP",
    vatRate: 20,
    paymentTerms: "Net 45",
    items: [
      { pi: 4, qty: 18, unit: 2050 },
      { pi: 2, qty: 9, unit: 1820 },
    ],
    view: { firstDaysAgo: 2, lastDaysAgo: 0, count: 4 },
    events: [
      { type: QuoteEventType.LINK_OPENED, daysAgo: 2, device: "desktop" },
      { type: QuoteEventType.LINK_OPENED, daysAgo: 1, device: "mobile" },
      { type: QuoteEventType.LINK_OPENED, daysAgo: 0, device: "mobile" },
      { type: QuoteEventType.DECISION_CONTACT, daysAgo: 0, device: "mobile" },
    ],
    tag: "Temsilciyle görüşmek istiyor",
  },
  {
    token: "demo-suresi-doluyor",
    company: "Başkent Treyler Servis",
    contact: "Okan Arslan",
    phone: "+90 539 888 99 00",
    country: "Türkiye",
    city: "Ankara",
    email: "okan@baskenttreyler.com",
    currency: "TRY",
    status: QuoteStatus.VIEWED,
    quotedDaysAgo: 4,
    validUntilFromNow: 3,
    discountPct: 5,
    shippingCost: 900,
    shippingMode: "DAP",
    vatRate: 20,
    paymentTerms: "Net 30",
    items: [
      { pi: 1, qty: 12, unit: 1220 },
      { pi: 0, qty: 16, unit: 940 },
    ],
    view: { firstDaysAgo: 3, lastDaysAgo: 1, count: 2 },
    events: [
      { type: QuoteEventType.LINK_OPENED, daysAgo: 3, device: "desktop" },
      { type: QuoteEventType.LINK_OPENED, daysAgo: 1, device: "desktop" },
    ],
    tag: "Geçerlilik süresi yakında doluyor (WhatsApp hatırlatma)",
  },
  {
    token: "demo-suresi-doldu",
    company: "Akdeniz Nakliyat",
    contact: "Cem Öztürk",
    phone: "+90 530 999 00 11",
    country: "Türkiye",
    city: "Antalya",
    email: "cem@akdeniznakliyat.com",
    currency: "TRY",
    status: QuoteStatus.EXPIRED,
    quotedDaysAgo: 4,
    validUntilFromNow: -1,
    discountPct: 3,
    shippingCost: 1100,
    shippingMode: "FCA",
    vatRate: 20,
    paymentTerms: "Net 30",
    items: [
      { pi: 3, qty: 6, unit: 3380 },
      { pi: 5, qty: 8, unit: 2600 },
    ],
    view: { firstDaysAgo: 3, lastDaysAgo: 3, count: 1 },
    events: [
      { type: QuoteEventType.LINK_OPENED, daysAgo: 3, device: "mobile" },
    ],
    tag: "Geçerlilik süresi doldu (kaybedildi)",
  },
];

async function main() {
  const products = await prisma.product.findMany({
    orderBy: { createdAt: "asc" },
    select: {
      id: true,
      sku: true,
      translations: { where: { locale: "TR" }, select: { name: true } },
    },
  });
  if (products.length === 0) {
    throw new Error("Ürün bulunamadı — önce ürün seed'ini çalıştırın.");
  }
  const prod = (i: number) => products[i % products.length];

  // Idempotent temizlik: yalnızca demo- teklifleri (cascade items+events).
  const removed = await prisma.quoteRequest.deleteMany({
    where: { publicToken: { startsWith: "demo-" } },
  });
  console.log(`Eski demo teklifleri silindi: ${removed.count}`);

  for (const s of SCENARIOS) {
    const quotedAt = daysAgo(s.quotedDaysAgo);
    // Talep, fiyatlanmadan önce gelir — createdAt'i geriye tarihle (gerçekçi zaman çizelgesi).
    const createdAt = daysAgo(s.quotedDaysAgo + 1);
    await prisma.quoteRequest.create({
      data: {
        createdAt,
        fullName: s.contact,
        email: s.email,
        phone: s.phone,
        companyName: s.company,
        country: s.country,
        city: s.city ?? null,
        address: `${s.city ?? s.country} Organize Sanayi Bölgesi, Demo Cad. No:1`,
        kvkkConsent: true,
        marketingConsent: true,
        currency: s.currency,
        status: s.status,
        quotedAt,
        sentAt: quotedAt,
        discountPct: s.discountPct,
        shippingCost: s.shippingCost,
        shippingMode: s.shippingMode,
        vatRate: s.vatRate,
        validUntil: fromNow(s.validUntilFromNow),
        paymentTerms: s.paymentTerms,
        publicToken: s.token,
        notes: null,
        notes_admin: `[DEMO] ${s.tag}`,
        viewCount: s.view?.count ?? 0,
        firstViewedAt: s.view ? daysAgo(s.view.firstDaysAgo) : null,
        lastViewedAt: s.view ? daysAgo(s.view.lastDaysAgo) : null,
        items: {
          create: s.items.map((it) => {
            const p = prod(it.pi);
            return {
              productId: p.id,
              quantity: it.qty,
              unitPrice: it.unit,
              snapshotSku: p.sku,
              snapshotName: p.translations[0]?.name ?? p.sku,
              snapshotLocale: "TR",
            };
          }),
        },
        events: s.events
          ? {
              create: s.events.map((e) => ({
                type: e.type,
                device: e.device ?? null,
                note: e.note ?? null,
                createdAt: daysAgo(e.daysAgo),
              })),
            }
          : undefined,
      },
    });
    console.log(`✓ ${s.token.padEnd(20)} ${s.status.padEnd(18)} ${s.company}`);
  }

  console.log(`\n${SCENARIOS.length} demo teklif oluşturuldu.`);
  console.log("CANLI demo linki: /teklif/demo-canli");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
