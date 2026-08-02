/**
 * Import sırasında üretilen yapay SKU'lar MNV- önekiyle başlar
 * (MNV-KISA2-0005, MNV-2526…). Bunlar Moniva'nın gerçek stok kodu değildir
 * ve müşteriye gösterilmez; gerçek kodlar (97.1350.200.51 gibi) gösterilir.
 */
export function isSyntheticSku(sku: string): boolean {
  return sku.startsWith("MNV-");
}
