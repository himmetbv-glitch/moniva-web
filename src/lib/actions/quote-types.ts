// "use server" dosyaları yalnızca async fonksiyon export edebildiği için
// tipler ve sabitler burada (ayrı, server-olmayan modül) tutulur.

export const QUOTE_LIST_PATH = "/teklif-listem";

export type CartLine = {
  itemId: string;
  productId: string;
  sku: string;
  slug: string;
  name: string;
  category: string | null;
  partType: "OEM" | "AFTERMARKET";
  quantity: number;
  imageUrl: string | null;
  oemNumbers: string[];
};

export type CartView = {
  exists: boolean;
  lines: CartLine[];
  totalQuantity: number;
  lineCount: number;
  oemCount: number;
  aftermarketCount: number;
};

export type QuoteFormState = {
  ok: boolean;
  requestId?: string;
  fieldErrors?: Record<string, string[]>;
  formError?: string;
};

// Giriş yapmış müşteri için teklif formu otomatik dolum verisi.
export type QuotePrefill = {
  fullName: string;
  companyName: string;
  email: string;
  phone: string;
  taxNumber: string;
};
