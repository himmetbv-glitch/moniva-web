/**
 * OEM/parça numarasını arama için normalleştirir: harf ve rakam dışındaki
 * her şeyi (nokta, boşluk, tire, slash, vb.) atar ve küçük harfe çevirir.
 * Hem saklanan değer hem de arama sorgusu aynı şekilde normalleştirilir;
 * böylece "0 308 875 023", "0.308.875.023" ve "0308875023" eşleşir.
 */
export function normalizeOem(value: string): string {
  return value.replace(/[^a-z0-9]/gi, "").toLowerCase();
}
