/**
 * 39 kategori için EN/RU/AR CategoryTranslation kayıtları.
 * Kategori kodu (Category.code) üzerinden eşleştirilir. Upsert — idempotent.
 * Marka-isimli kategoriler (RENAULT, VOLVO, MERCEDES vb.) evrensel — çevrilmez.
 */
import { PrismaClient, Locale } from "@prisma/client";

const prisma = new PrismaClient();

type TripleTranslation = { en: string; ru: string; ar: string };

const NAMES: Record<string, TripleTranslation> = {
  AS:    { en: "Emergency Brake Chamber",       ru: "Аварийная тормозная камера",   ar: "غرفة الفرامل الطارئة" },
  BORU:  { en: "Tubular",                       ru: "Трубчатый",                     ar: "أنبوبي" },
  BORU2: { en: "Tubular",                       ru: "Трубчатый",                     ar: "أنبوبي" },
  CEKI:  { en: "Tractor",                       ru: "Тягач",                         ar: "قاطرة" },
  CK:    { en: "Caliper",                       ru: "Суппорт",                       ar: "المكبح" },
  "CK-KIT": { en: "Caliper Repair Kits",        ru: "Ремкомплекты суппортов",       ar: "أطقم إصلاح المكابح" },
  "CK-PRT": { en: "Caliper Parts",              ru: "Детали суппортов",             ar: "قطع المكابح" },
  "CK-SET": { en: "Complete Caliper Sets",      ru: "Полные комплекты суппортов",   ar: "مجموعات مكابح كاملة" },
  DDD:   { en: "Disc",                          ru: "Диск",                          ar: "قرص" },
  DEFR:  { en: "Differential",                  ru: "Дифференциал",                  ar: "التفاضل" },
  DING:  { en: "Axle",                          ru: "Ось",                           ar: "المحور" },
  DISK:  { en: "Disc",                          ru: "Диск",                          ar: "قرص" },
  DISK2: { en: "Disc",                          ru: "Диск",                          ar: "قرص" },
  DORS:  { en: "Trailer",                       ru: "Прицеп",                        ar: "المقطورة" },
  DORS2: { en: "Trailer",                       ru: "Прицеп",                        ar: "المقطورة" },
  DORS3: { en: "Trailer",                       ru: "Прицеп",                        ar: "المقطورة" },
  FLAN:  { en: "Flanged",                       ru: "Фланцевый",                     ar: "مشفّه" },
  FLAN2: { en: "Flanged",                       ru: "Фланцевый",                     ar: "مشفّه" },
  FP:    { en: "Brake Shoes",                   ru: "Тормозные колодки",             ar: "أحذية الفرامل" },
  FT:    { en: "Brake Drums",                   ru: "Тормозные барабаны",            ar: "طبول الفرامل" },
  HT:    { en: "Air Tanks",                     ru: "Воздушные ресиверы",            ar: "خزانات الهواء" },
  IFKDD: { en: "Emergency Brake Chamber D/D",   ru: "Аварийная тормозная камера D/D",ar: "غرفة الفرامل الطارئة D/D" },
  IFKDP: { en: "Emergency Brake Chamber D/P",   ru: "Аварийная тормозная камера D/P",ar: "غرفة الفرامل الطارئة D/P" },
  KDD:   { en: "Short",                         ru: "Короткий",                      ar: "قصير" },
  KISA:  { en: "Short",                         ru: "Короткий",                      ar: "قصير" },
  KISA2: { en: "Short",                         ru: "Короткий",                      ar: "قصير" },
  PNOM:  { en: "Pneumatic",                     ru: "Пневматический",                ar: "هوائي" },
  SFK:   { en: "Service Brake Chamber",         ru: "Рабочая тормозная камера",      ar: "غرفة فرامل الخدمة" },
  UDD:   { en: "Long",                          ru: "Длинный",                       ar: "طويل" },
  UNCAT: { en: "Uncategorised (Needs review)",  ru: "Без категории",                 ar: "غير مصنّف" },
  UZUN:  { en: "Long",                          ru: "Длинный",                       ar: "طويل" },
  UZUN2: { en: "Long",                          ru: "Длинный",                       ar: "طويل" },
  // Marka-isimli kategoriler evrensel — çevrilmez, aynı ad kalır:
  DODG:  { en: "DODGE",     ru: "DODGE",       ar: "DODGE" },
  FATI:  { en: "FATİH",     ru: "FATİH",       ar: "FATİH" },
  FC:    { en: "FORD-CARGO",ru: "FORD-CARGO",  ar: "FORD-CARGO" },
  ISUZ:  { en: "ISUZU",     ru: "ISUZU",       ar: "ISUZU" },
  IVEC:  { en: "IVECO",     ru: "IVECO",       ar: "IVECO" },
  MITS:  { en: "MITSUBISHI",ru: "MITSUBISHI",  ar: "MITSUBISHI" },
  MM:    { en: "MAN-MERCEDES",ru: "MAN-MERCEDES",ar: "MAN-MERCEDES" },
  RENA:  { en: "RENAULT",   ru: "RENAULT",     ar: "RENAULT" },
  SCAN:  { en: "SCANIA",    ru: "SCANIA",      ar: "SCANIA" },
  VOLV:  { en: "VOLVO",     ru: "VOLVO",       ar: "VOLVO" },
};

async function main() {
  const cats = await prisma.category.findMany({ select: { id: true, code: true } });
  let created = 0, updated = 0, missing = 0;

  for (const c of cats) {
    const tr = NAMES[c.code];
    if (!tr) {
      console.log(`  ⚠ ${c.code}: mapping bulunamadı, atlanıyor`);
      missing++;
      continue;
    }
    for (const [loc, name] of [
      ["EN" as Locale, tr.en],
      ["RU" as Locale, tr.ru],
      ["AR" as Locale, tr.ar],
    ] as const) {
      const existing = await prisma.categoryTranslation.findUnique({
        where: { categoryId_locale: { categoryId: c.id, locale: loc } },
      });
      if (existing) {
        if (existing.name !== name) {
          await prisma.categoryTranslation.update({
            where: { id: existing.id },
            data: { name },
          });
          updated++;
        }
      } else {
        await prisma.categoryTranslation.create({
          data: { categoryId: c.id, locale: loc, name },
        });
        created++;
      }
    }
  }

  console.log(`\n✅ TAMAM`);
  console.log(`  Kategori: ${cats.length}`);
  console.log(`  Çeviri: created=${created}, updated=${updated}`);
  console.log(`  Mapping olmayan: ${missing}`);
}

main().catch(e => { console.error(e); process.exit(1); }).finally(() => prisma.$disconnect());
