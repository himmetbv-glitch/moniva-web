/**
 * Kategori seçeneklerini HİYERARŞİK sırayla (ağaç: ebeveyn → çocukları, her
 * seviye kendi `order`'ıyla) ve girintili etiketle üretir. Admin dropdown'ları
 * (ürün listesi filtresi + ürün editörü) bunu paylaşır ki ana/alt kategori
 * ayrımı ve sıra net olsun. `<select>` girintiyi NBSP ile korur.
 */
export type CatTreeInput = {
  id: string;
  slug: string;
  name: string;
  parentId: string | null;
  order: number;
};

export type CatTreeOption = {
  id: string;
  slug: string;
  name: string;
  depth: number;
  label: string; // girintili + işaretli (dropdown'da gösterilecek metin)
};

const NBSP = " ";

export function buildCategoryTreeOptions(items: CatTreeInput[]): CatTreeOption[] {
  const ids = new Set(items.map((c) => c.id));
  const byParent = new Map<string | null, CatTreeInput[]>();
  for (const c of items) {
    // Ebeveyni listede yoksa (pasif/silinmiş) kök gibi davran → yetim kalmasın.
    const key = c.parentId && ids.has(c.parentId) ? c.parentId : null;
    const arr = byParent.get(key);
    if (arr) arr.push(c);
    else byParent.set(key, [c]);
  }
  for (const arr of byParent.values()) {
    arr.sort((a, b) => a.order - b.order || a.name.localeCompare(b.name, "tr"));
  }

  const out: CatTreeOption[] = [];
  const walk = (parentKey: string | null, depth: number) => {
    for (const c of byParent.get(parentKey) ?? []) {
      // NBSP ile girinti (native <select> düz boşlukları kırpar).
      const label = depth === 0 ? c.name : `${NBSP.repeat(depth * 3)}› ${c.name}`;
      out.push({ id: c.id, slug: c.slug, name: c.name, depth, label });
      walk(c.id, depth + 1);
    }
  };
  walk(null, 0);
  return out;
}
