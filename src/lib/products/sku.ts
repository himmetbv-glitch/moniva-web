/**
 * Import sırasında üretilen yapay SKU'lar MNV-<KATEGORİ>-<sıra> biçimindedir
 * (MNV-KISA2-0005, MNV-CK-0001…). Bunlar Moniva'nın gerçek stok kodu değildir
 * ve müşteriye gösterilmez. Katalogdaki Moniva numaraları (MNV-1016,
 * MNV-A-1101, MON-1024) ve stok kodları (97.1350.200.51) gerçektir, gösterilir.
 */
const SYNTHETIC_SKU = /^MNV-[A-Z][A-Z0-9]+-\d+$/;

export function isSyntheticSku(sku: string): boolean {
  return SYNTHETIC_SKU.test(sku);
}
