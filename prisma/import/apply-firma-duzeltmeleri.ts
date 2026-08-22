/**
 * Firma düzeltmeleri (2026-08) — canlı PageSection.data + SiteSetting güncellemesi.
 *
 * Kapsam:
 *   1. SiteSetting.email  export@ → info@moniva.com.tr (footer + iletişim otomatik izler)
 *   2. Hakkımızda         CTA e-postası info@, sertifikalar → ISO 9001 + EAC, 80+ → 50+
 *   3. Anasayfa           80+ → 50+ (istatistik bandı + seo)
 *   4. Kariyer            istatistikler 70+ / 65 Yıl / 50+ (Milliyet silinir), lead 50+
 *   5. Kalite             banner "2 Sertifika" + 50+, standartlar → 2, belgeler → 3
 *   6. İletişim           saatler 08:00–18:20 + Cmt kapalı, havalimanı 5 dk,
 *                         Rusya office2 bloğu + Rusya harita kartı adresi
 *
 * _i18n kuralları (i18n-picker.ts): diziler index bazlı merge → TR dizisi
 * kısalırsa en/ru/ar dizileri AYNI uzunluk/sıraya yeniden yazılır; nesne
 * alanları (office2) her dilde KOMPLE verilir. Serbest metinler dil典e özgü
 * kalıplarla değiştirilir ("80+", "أكثر من 80" …).
 *
 * Departman kartlarına (CONTACT_DEPTS) BİLEREK dokunulmaz (kullanıcı kararı).
 *
 * Kullanım:
 *   TARGET_DATABASE_URL="postgres://…" npx tsx --env-file=.env \
 *     prisma/import/apply-firma-duzeltmeleri.ts --dry-run
 */
import { PrismaClient } from "@prisma/client";
import { writeFileSync } from "node:fs";

const DRY = process.argv.includes("--dry-run");
const prisma = new PrismaClient({
  datasourceUrl: process.env.TARGET_DATABASE_URL || process.env.DATABASE_URL,
});

type J = Record<string, unknown>;
const backups: { where: string; data: unknown }[] = [];
let totalChanges = 0;

function log(msg: string) {
  console.log("  " + msg);
}

// ── Derin string değişimi (kök + _i18n dahil her string alanda) ──
function deepReplace(node: unknown, pairs: [string, string][]): { node: unknown; n: number } {
  let n = 0;
  const walk = (v: unknown): unknown => {
    if (typeof v === "string") {
      let out = v;
      for (const [a, b] of pairs) {
        if (out.includes(a)) {
          out = out.split(a).join(b);
          n++;
        }
      }
      return out;
    }
    if (Array.isArray(v)) return v.map(walk);
    if (v && typeof v === "object") {
      const o: J = {};
      for (const [k, val] of Object.entries(v as J)) o[k] = walk(val);
      return o;
    }
    return v;
  };
  return { node: walk(node), n };
}

const P_5050: [string, string][] = [
  ["80+", "50+"],
  ["أكثر من 80", "أكثر من 50"],
];
const P_EMAIL: [string, string][] = [["export@moniva.com.tr", "info@moniva.com.tr"]];
const P_HOURS: [string, string][] = [
  ["08:00–18:00", "08:00–18:20"],
  ["08:00-18:00", "08:00-18:20"],
];
const P_AIRPORT: [string, string][] = [
  ["Havalimanı'na 45 dakika", "Havalimanı'na 5 dakika"],
  ["45 minutes from Konya Airport", "5 minutes from Konya Airport"],
  ["45 минут", "5 минут"],
  ["45 دقيقة", "5 دقائق"],
];

async function getSection(pageKey: string, sectionKey: string) {
  const page = await prisma.managedPage.findFirst({
    where: { key: pageKey },
    select: {
      id: true,
      seoTitle: true,
      seoDesc: true,
      sections: { where: { key: sectionKey }, select: { id: true, data: true } },
    },
  });
  return { page, section: page?.sections[0] };
}

async function saveSection(id: string, data: unknown, label: string, n: number) {
  totalChanges += n;
  log(`${label}: ${n} değişiklik`);
  if (!DRY) await prisma.pageSection.update({ where: { id }, data: { data: data as object } });
}

// _i18n içindeki her locale nesnesine erişim (yoksa oluşturmaz)
function locales(data: J): [string, J][] {
  const i18n = data._i18n as Record<string, J> | undefined;
  return i18n ? Object.entries(i18n) : [];
}

async function main() {
  const url = process.env.TARGET_DATABASE_URL || process.env.DATABASE_URL || "";
  console.log(`Hedef DB: ${url.includes("localhost") ? "YEREL" : "UZAK (Neon)"}${DRY ? "  [DRY-RUN]" : ""}\n`);

  // ── 1. SiteSetting.email ────────────────────────────────────
  console.log("— Ayarlar e-postası —");
  const setting = await prisma.siteSetting.findFirst({ select: { id: true, email: true } });
  if (setting) {
    backups.push({ where: "siteSetting", data: { email: setting.email } });
    if (setting.email === "info@moniva.com.tr") log("zaten info@ — atlandı");
    else {
      log(`${setting.email} → info@moniva.com.tr`);
      totalChanges++;
      if (!DRY)
        await prisma.siteSetting.update({
          where: { id: setting.id },
          data: { email: "info@moniva.com.tr" },
        });
    }
  }

  // ── 2-3. Sayfa geneli metin değişimleri (80+→50+, e-posta) ──
  console.log("\n— Sayfa geneli metinler —");
  for (const pageKey of ["home", "about", "careers", "quality"]) {
    const page = await prisma.managedPage.findFirst({
      where: { key: pageKey },
      select: { id: true, seoTitle: true, seoDesc: true, sections: { select: { id: true, key: true, data: true } } },
    });
    if (!page) continue;
    // seo alanları
    const seoPairs = pageKey === "about" ? [...P_5050, ...P_EMAIL] : P_5050;
    const st = deepReplace({ t: page.seoTitle, d: page.seoDesc }, seoPairs);
    if (st.n) {
      const v = st.node as { t: string | null; d: string | null };
      backups.push({ where: `${pageKey}.seo`, data: { seoTitle: page.seoTitle, seoDesc: page.seoDesc } });
      log(`${pageKey}.seo: ${st.n} değişiklik`);
      totalChanges += st.n;
      if (!DRY)
        await prisma.managedPage.update({ where: { id: page.id }, data: { seoTitle: v.t, seoDesc: v.d } });
    }
    // bölümler
    for (const s of page.sections) {
      const pairs =
        pageKey === "about" ? [...P_5050, ...P_EMAIL] : P_5050;
      const r = deepReplace(s.data, pairs);
      if (r.n) {
        backups.push({ where: `${pageKey}/${s.key}`, data: s.data });
        await saveSection(s.id, r.node, `${pageKey}/${s.key} (metin)`, r.n);
      }
    }
  }

  // ── 2b. Hakkımızda sertifikaları → ISO 9001 + EAC ───────────
  console.log("\n— Hakkımızda sertifikalar —");
  {
    const { section } = await getSection("about", "certs");
    if (section) {
      backups.push({ where: "about/certs", data: section.data });
      const d = section.data as J;
      d.certs = [
        { code: "ISO 9001:2015", body: "Tedarik, depolama ve sevkiyat operasyonlarında sertifikalı kalite yönetim sistemi." },
        { code: "EAC", body: "Avrasya Gümrük Birliği (Rusya, Belarus, Kazakistan) uygunluk sertifikası." },
      ];
      const certTr: Record<string, unknown[]> = {
        en: [
          { code: "ISO 9001:2015", body: "Certified quality management system covering sourcing, warehousing and dispatch operations." },
          { code: "EAC", body: "Eurasian Customs Union (Russia, Belarus, Kazakhstan) conformity certificate." },
        ],
        ru: [
          { code: "ISO 9001:2015", body: "Сертифицированная система менеджмента качества: закупки, складирование и отгрузка." },
          { code: "EAC", body: "Сертификат соответствия Евразийского таможенного союза (Россия, Беларусь, Казахстан)." },
        ],
        ar: [
          { code: "ISO 9001:2015", body: "نظام إدارة جودة معتمد يغطي عمليات التوريد والتخزين والشحن." },
          { code: "EAC", body: "شهادة مطابقة الاتحاد الجمركي الأوراسي (روسيا، بيلاروسيا، كازاخستان)." },
        ],
      };
      for (const [loc, o] of locales(d)) if (certTr[loc]) o.certs = certTr[loc];
      await saveSection(section.id, d, "about/certs → 2 sertifika", 1);
    }
  }

  // ── 4. Kariyer istatistikleri (dizi-kilit: 4 dilde birden) ──
  console.log("\n— Kariyer istatistikleri —");
  {
    const { section } = await getSection("careers", "info");
    if (section) {
      backups.push({ where: "careers/info", data: section.data });
      const d = section.data as J;
      d.stats = [
        { v: "70+", l: "Ekip Üyesi" },
        { v: "65 Yıl", l: "Sektörde Tecrübe" },
        { v: "50+", l: "Ülkeye Hizmet" },
      ];
      const statTr: Record<string, unknown[]> = {
        en: [
          { v: "70+", l: "Team Members" },
          { v: "65 Years", l: "Industry Experience" },
          { v: "50+", l: "Countries Served" },
        ],
        ru: [
          { v: "70+", l: "Сотрудников" },
          { v: "65 лет", l: "Опыта в отрасли" },
          { v: "50+", l: "Обслуживаемых стран" },
        ],
        ar: [
          { v: "+70", l: "أعضاء الفريق" },
          { v: "65 سنة", l: "خبرة في القطاع" },
          { v: "+50", l: "دولة نخدمها" },
        ],
      };
      for (const [loc, o] of locales(d)) if (statTr[loc]) o.stats = statTr[loc];
      await saveSection(section.id, d, "careers/info → 3 istatistik (4 dil)", 1);
    }
  }

  // ── 5. Kalite: banner istatistiği + standartlar + belgeler ──
  console.log("\n— Kalite sertifikaları —");
  {
    const { section } = await getSection("quality", "banner");
    if (section) {
      backups.push({ where: "quality/banner", data: section.data });
      const d = section.data as J;
      let n = 0;
      const fix = (arr: unknown) => {
        if (!Array.isArray(arr)) return;
        for (const it of arr as J[]) {
          if (it && it.v === "8") {
            it.v = "2";
            n++;
          }
        }
      };
      fix(d.stats);
      for (const [, o] of locales(d)) fix(o.stats);
      if (n) await saveSection(section.id, d, "quality/banner sertifika sayısı 8→2", n);
      else log("quality/banner: '8' istatistiği bulunamadı (elle kontrol)");
    }
  }
  {
    const { section } = await getSection("quality", "standards");
    if (section) {
      backups.push({ where: "quality/standards", data: section.data });
      const d = section.data as J;
      d.sub = "Kalite yönetimi ve bölgesel pazar girişini düzenleyen temel standartlarda bağımsız denetim ve sertifikasyon.";
      d.standards = [
        { code: "ISO 9001", year: "2015", org: "Uluslararası Standardizasyon Örgütü", scope: "Kalite Yönetim Sistemleri" },
        { code: "EAC", year: "TR-CU", org: "Avrasya Uygunluğu (RU/BY/KZ)", scope: "Gümrük Birliği onayı" },
      ];
      const stdTr: Record<string, { sub: string; standards: unknown[] }> = {
        en: {
          sub: "Independent audit and certification in the core standards governing quality management and regional market access.",
          standards: [
            { code: "ISO 9001", year: "2015", org: "International Organization for Standardization", scope: "Quality Management Systems" },
            { code: "EAC", year: "TR-CU", org: "Eurasian Conformity (RU/BY/KZ)", scope: "Customs Union approval" },
          ],
        },
        ru: {
          sub: "Независимый аудит и сертификация по ключевым стандартам менеджмента качества и доступа на региональные рынки.",
          standards: [
            { code: "ISO 9001", year: "2015", org: "Международная организация по стандартизации", scope: "Системы менеджмента качества" },
            { code: "EAC", year: "TR-CU", org: "Евразийское соответствие (RU/BY/KZ)", scope: "Одобрение Таможенного союза" },
          ],
        },
        ar: {
          sub: "تدقيق مستقل واعتماد وفق المعايير الأساسية لإدارة الجودة والوصول إلى الأسواق الإقليمية.",
          standards: [
            { code: "ISO 9001", year: "2015", org: "المنظمة الدولية للمعايير", scope: "أنظمة إدارة الجودة" },
            { code: "EAC", year: "TR-CU", org: "المطابقة الأوراسية (روسيا/بيلاروسيا/كازاخستان)", scope: "اعتماد الاتحاد الجمركي" },
          ],
        },
      };
      for (const [loc, o] of locales(d))
        if (stdTr[loc]) {
          o.sub = stdTr[loc].sub;
          o.standards = stdTr[loc].standards;
        }
      await saveSection(section.id, d, "quality/standards → 2 standart (4 dil)", 1);
    }
  }
  // Kalite seoDesc + belgeler alt metni: kaldırılan sertifikalara/karta atıf kalmasın
  {
    const page = await prisma.managedPage.findFirst({
      where: { key: "quality" },
      select: { id: true, seoDesc: true },
    });
    if (page?.seoDesc?.includes("IATF")) {
      backups.push({ where: "quality.seoDesc", data: page.seoDesc });
      totalChanges++;
      log("quality.seoDesc → ISO 9001 + EAC");
      if (!DRY)
        await prisma.managedPage.update({
          where: { id: page.id },
          data: {
            seoDesc:
              "Her Moniva komponenti test edilmiş, denetlenmiş ve izlenebilir olarak sevk edilir. ISO 9001 ve EAC sertifikalı — küresel otomotiv standartlarında kalite.",
          },
        });
    }
  }
  {
    const { section } = await getSection("quality", "docs");
    if (section) {
      backups.push({ where: "quality/docs", data: section.data });
      const d = section.data as J;
      // Mevcut EAC kayıtlarının yüklü fileUrl'leri varsa koru.
      const prev = Array.isArray(d.docs) ? (d.docs as J[]) : [];
      const keepUrl = (name: string) => (prev.find((x) => x.name === name)?.fileUrl as string) ?? "";
      d.docs = [
        { name: "ISO 9001:2015 Sertifikası", lang: "Kalite Yönetim Sistemi", type: "pdf", size: "—", flag: "🌐", fileUrl: "" },
        { name: "EAC Sertifikası — Bölüm 1", lang: "Avrasya Uygunluğu", type: "pdf", size: "—", flag: "🇷🇺", fileUrl: keepUrl("EAC Sertifikası — Bölüm 1") },
        { name: "EAC Sertifikası — Bölüm 2", lang: "Avrasya Uygunluğu", type: "pdf", size: "—", flag: "🇷🇺", fileUrl: keepUrl("EAC Sertifikası — Bölüm 2") },
      ];
      d.sub = "İndirilebilir sertifikalar — bölgesel satın alma ekipleri için.";
      const docSubTr: Record<string, string> = {
        en: "Downloadable certificates — for regional purchasing teams.",
        ru: "Сертификаты для скачивания — для региональных отделов закупок.",
        ar: "شهادات قابلة للتنزيل — لفرق المشتريات الإقليمية.",
      };
      const docTr: Record<string, unknown[]> = {
        en: [
          { name: "ISO 9001:2015 Certificate", lang: "Quality Management System" },
          { name: "EAC Certificate — Part 1", lang: "Eurasian Conformity" },
          { name: "EAC Certificate — Part 2", lang: "Eurasian Conformity" },
        ],
        ru: [
          { name: "Сертификат ISO 9001:2015", lang: "Система менеджмента качества" },
          { name: "Сертификат EAC — Часть 1", lang: "Евразийское соответствие" },
          { name: "Сертификат EAC — Часть 2", lang: "Евразийское соответствие" },
        ],
        ar: [
          { name: "شهادة ISO 9001:2015", lang: "نظام إدارة الجودة" },
          { name: "شهادة EAC — الجزء 1", lang: "المطابقة الأوراسية" },
          { name: "شهادة EAC — الجزء 2", lang: "المطابقة الأوراسية" },
        ],
      };
      for (const [loc, o] of locales(d)) {
        if (docTr[loc]) o.docs = docTr[loc];
        if (docSubTr[loc]) o.sub = docSubTr[loc];
      }
      await saveSection(section.id, d, "quality/docs → 3 belge (4 dil)", 1);
    }
  }

  // ── 6. İletişim: saatler + havalimanı + Rusya ───────────────
  console.log("\n— İletişim —");
  {
    const { section } = await getSection("contact", "info");
    if (section) {
      backups.push({ where: "contact/info", data: section.data });
      const d = section.data as J;
      d.hoursLines = ["Pazartesi – Cuma: 08:00 – 18:20", "Cumartesi: Kapalı", "Pazar: Kapalı"];
      const hoursTr: Record<string, string[]> = {
        en: ["Monday – Friday: 08:00 – 18:20", "Saturday: Closed", "Sunday: Closed"],
        ru: ["Понедельник – Пятница: 08:00 – 18:20", "Суббота: выходной", "Воскресенье: выходной"],
        ar: ["الاثنين – الجمعة: 08:00 – 18:20", "السبت: مغلق", "الأحد: مغلق"],
      };
      const office2Base = {
        addressLines: ["Moscow, Yuzhnye Vorota industrial park, bld 4"],
        phone: "+7 (495) 240-18-08",
        email: "sales@moniva.ru",
      };
      d.office2 = { title: "Rusya Ofisi", ...office2Base };
      const o2Title: Record<string, string> = { en: "Russia Office", ru: "Офис в России", ar: "مكتب روسيا" };
      for (const [loc, o] of locales(d)) {
        if (hoursTr[loc]) o.hoursLines = hoursTr[loc];
        if (o2Title[loc]) o.office2 = { title: o2Title[loc], ...office2Base };
      }
      await saveSection(section.id, d, "contact/info saatler + Rusya office2 (4 dil)", 1);
    }
  }
  {
    const { section } = await getSection("contact", "quick");
    if (section) {
      const r = deepReplace(section.data, P_HOURS);
      if (r.n) {
        backups.push({ where: "contact/quick", data: section.data });
        await saveSection(section.id, r.node, "contact/quick saat 18:00→18:20", r.n);
      } else log("contact/quick: saat kalıbı bulunamadı");
    }
  }
  {
    const { section } = await getSection("contact", "loc");
    if (section) {
      backups.push({ where: "contact/loc", data: section.data });
      const r = deepReplace(section.data, P_AIRPORT);
      const d = r.node as J;
      let n = r.n;
      const extra = Array.isArray(d.extra) ? (d.extra as J[]) : [];
      const ru = extra.find((e) => e.cardTitle === "MONIVA RU");
      if (ru) {
        const lines = Array.isArray(ru.cardAddressLines) ? (ru.cardAddressLines as string[]) : [];
        if (lines.length === 0) {
          ru.cardAddressLines = ["Moscow, Yuzhnye Vorota industrial park, bld 4"];
          n++;
        }
      }
      if (n) await saveSection(section.id, d, "contact/loc havalimanı 5 dk + RU adres", n);
      else log("contact/loc: değişiklik yok");
    }
  }

  // ── Yedek + özet ────────────────────────────────────────────
  const stamp = new Date().toISOString().replace(/[:.]/g, "-");
  const out = `/tmp/firma-duzeltme-backup-${stamp}.json`;
  writeFileSync(out, JSON.stringify(backups, null, 1));
  console.log(`\nToplam değişiklik: ${totalChanges}`);
  console.log(`Yedek: ${out}`);
  if (DRY) console.log("(dry-run — yazma yapılmadı)");
  await prisma.$disconnect();
}

main().catch((e) => {
  console.error("HATA:", e.message);
  process.exit(1);
});
