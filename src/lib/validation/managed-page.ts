import { z } from "zod";
import type { SectionType } from "@prisma/client";

// ── Alt parçalar ──────────────────────────────────────────────
const ctaLink = z.object({
  label: z.string().trim().max(120),
  href: z.string().trim().max(300),
});

const heroSlide = z.object({
  img: z.string().trim().max(300),
  head: z.string().trim().max(200),
  sub: z.string().trim().max(600),
});

const pillar = z.object({
  num: z.string().trim().max(8),
  title: z.string().trim().max(160),
  body: z.string().trim().max(800),
});

const region = z.object({
  region: z.string().trim().max(120),
  countries: z.string().trim().max(300),
  count: z.coerce.number().int().min(0).max(9999),
});

const stat = z.object({
  v: z.string().trim().max(40),
  l: z.string().trim().max(80),
});

const contact = z.object({
  icon: z.string().trim().max(8),
  label: z.string().trim().max(80),
  value: z.string().trim().max(160),
});

const ruleWidth = z.coerce.number().int().min(0).max(800);

// ── Bölüm tipi → veri şeması ──────────────────────────────────
export const heroData = z.object({
  slides: z.array(heroSlide).min(1).max(8),
  ctaPrimary: ctaLink,
  ctaSecondary: ctaLink,
});

const categoryTile = z.object({
  categorySlug: z.string().trim().max(120),
  image: z.string().trim().max(300),
});

export const categoryGridData = z.object({
  title: z.string().trim().max(200),
  ruleWidth,
  ctaLabel: z.string().trim().max(120),
  ctaHref: z.string().trim().max(300),
  tiles: z.array(categoryTile).max(12),
});

export const featureColumnsData = z.object({
  title: z.string().trim().max(200),
  ruleWidth,
  pillars: z.array(pillar).min(1).max(8),
});

export const regionGridData = z.object({
  title: z.string().trim().max(200),
  ruleWidth,
  regions: z.array(region).min(1).max(12),
  stats: z.array(stat).min(1).max(8),
  mapImage: z.string().trim().max(300),
  cardHead: z.string().trim().max(200),
  cardSub: z.string().trim().max(400),
  cardHref: z.string().trim().max(300),
});

export const featuredProductsData = z.object({
  title: z.string().trim().max(200),
  ruleWidth,
  ctaLabel: z.string().trim().max(120),
  ctaHref: z.string().trim().max(300),
});

export const newsroomData = z.object({
  title: z.string().trim().max(200),
  ruleWidth,
  sideTitle: z.string().trim().max(200),
  sideRuleWidth: ruleWidth,
});

export const partnerMarqueeData = z.object({
  brands: z.array(z.string().trim().max(80)).min(1).max(40),
});

export const contactCtaData = z.object({
  kicker: z.string().trim().max(120),
  head: z.string().trim().max(300),
  sub: z.string().trim().max(600),
  primaryLabel: z.string().trim().max(120),
  primaryHref: z.string().trim().max(300),
  secondaryLabel: z.string().trim().max(120),
  secondaryHref: z.string().trim().max(300),
  contacts: z.array(contact).min(1).max(6),
});

// ── Hakkımızda bölümleri ──────────────────────────────────────
export const aboutHeroData = z.object({
  crumbLabel: z.string().trim().max(120),
});

export const aboutFacilityData = z.object({
  image: z.string().trim().max(300),
  caption: z.string().trim().max(200),
  eyebrow: z.string().trim().max(120),
  title: z.string().trim().max(200),
  body: z.string().trim().max(1000),
  stats: z.array(stat).max(6),
});

export const aboutMvData = z.object({
  columns: z
    .array(
      z.object({
        tag: z.string().trim().max(80),
        title: z.string().trim().max(200),
        body: z.string().trim().max(800),
      }),
    )
    .min(1)
    .max(4),
});

export const aboutTimelineData = z.object({
  eyebrow: z.string().trim().max(120),
  title: z.string().trim().max(200),
  entries: z
    .array(
      z.object({
        year: z.string().trim().max(16),
        title: z.string().trim().max(160),
        body: z.string().trim().max(600),
      }),
    )
    .min(1)
    .max(20),
});

export const aboutCertsData = z.object({
  eyebrow: z.string().trim().max(120),
  title: z.string().trim().max(200),
  certs: z
    .array(
      z.object({
        code: z.string().trim().max(80),
        body: z.string().trim().max(600),
      }),
    )
    .min(1)
    .max(12),
});

export const aboutCtaData = z.object({
  eyebrow: z.string().trim().max(120),
  title: z.string().trim().max(300),
  body: z.string().trim().max(800),
  primaryLabel: z.string().trim().max(120),
  primaryHref: z.string().trim().max(300),
  secondaryLabel: z.string().trim().max(120),
  secondaryHref: z.string().trim().max(300),
  contacts: z.array(contact).max(6),
});

// ── Kalite bölümleri ──────────────────────────────────────────
export const qualityBannerData = z.object({
  crumbLabel: z.string().trim().max(120),
  eyebrow: z.string().trim().max(120),
  title: z.string().trim().max(200),
  sub: z.string().trim().max(800),
  stats: z.array(stat).max(6),
});

export const qualityMissionData = z.object({
  title: z.string().trim().max(200),
  ruleWidth,
  lead: z.string().trim().max(1000),
  body: z.string().trim().max(1000),
  image: z.string().trim().max(300),
});

export const qualityStandardsData = z.object({
  title: z.string().trim().max(200),
  ruleWidth,
  sub: z.string().trim().max(800),
  standards: z
    .array(
      z.object({
        code: z.string().trim().max(80),
        year: z.string().trim().max(40),
        org: z.string().trim().max(160),
        scope: z.string().trim().max(200),
      }),
    )
    .min(1)
    .max(12),
});

export const qualityDocsData = z.object({
  title: z.string().trim().max(200),
  ruleWidth,
  sub: z.string().trim().max(800),
  docs: z
    .array(
      z.object({
        name: z.string().trim().max(160),
        lang: z.string().trim().max(120),
        type: z.string().trim().max(8),
        size: z.string().trim().max(40),
        flag: z.string().trim().max(8),
        fileUrl: z.string().trim().max(400).optional().default(""),
      }),
    )
    .max(24),
});

// ── Kariyer bölümü ────────────────────────────────────────────
export const careersInfoData = z.object({
  crumbLabel: z.string().trim().max(120),
  image: z.string().trim().max(300),
  titleAccent: z.string().trim().max(80),
  titleRest: z.string().trim().max(300),
  lead: z.string().trim().max(800),
  stats: z.array(stat).max(8),
  emailLabel: z.string().trim().max(120),
  emailPre: z.string().trim().max(160),
  emailAddr: z.string().trim().max(160),
  emailPost: z.string().trim().max(160),
});

// ── İletişim bölümleri ────────────────────────────────────────
const lineList = z.array(z.string().trim().max(200)).max(10);

export const contactHeroData = z.object({
  crumbLabel: z.string().trim().max(120),
  eyebrow: z.string().trim().max(120),
  title: z.string().trim().max(200),
  lead: z.string().trim().max(800),
  stats: z.array(stat).max(6),
});

export const contactInfoData = z.object({
  eyebrow: z.string().trim().max(120),
  companyName: z.string().trim().max(200),
  addressLabel: z.string().trim().max(80),
  addressLines: lineList,
  phoneLabel: z.string().trim().max(80),
  emailLabel: z.string().trim().max(80),
  hoursLabel: z.string().trim().max(80),
  hoursLines: lineList,
});

export const contactQuickData = z.object({
  tiles: z
    .array(
      z.object({
        icon: z.string().trim().max(8),
        label: z.string().trim().max(80),
        valueType: z.enum(["email", "phone", "custom"]),
        valueCustom: z.string().trim().max(160),
        sub: z.string().trim().max(120),
      }),
    )
    .max(8),
});

export const contactLocData = z.object({
  eyebrow: z.string().trim().max(120),
  title: z.string().trim().max(200),
  body: z.string().trim().max(800),
  directionsHref: z.string().trim().max(400),
  mapHref: z.string().trim().max(400),
  mapSrc: z.string().trim().max(600),
  cardTitle: z.string().trim().max(120),
  cardLocation: z.string().trim().max(120),
  cardAddressLines: lineList,
  coordLat: z.string().trim().max(40),
  coordLng: z.string().trim().max(40),
});

export const contactDeptsData = z.object({
  eyebrow: z.string().trim().max(120),
  title: z.string().trim().max(200),
  depts: z
    .array(
      z.object({
        name: z.string().trim().max(120),
        contact: z.string().trim().max(120),
        hours: z.string().trim().max(120),
      }),
    )
    .max(12),
});

// ── Katalog bölümleri ─────────────────────────────────────────
export const catalogBannerData = z.object({
  crumbLabel: z.string().trim().max(120),
  kicker: z.string().trim().max(120),
  title: z.string().trim().max(160),
  subtitle: z.string().trim().max(800),
  statProduct: z.string().trim().max(60),
  statFamily: z.string().trim().max(60),
  statBrand: z.string().trim().max(60),
});

export const catalogCardData = z.object({
  quoteText: z.string().trim().max(120),
  addLabel: z.string().trim().max(120),
  addedLabel: z.string().trim().max(120),
});

export const productDetailData = z.object({
  quickHeading: z.string().trim().max(120),
  rows: z
    .array(
      z.object({
        label: z.string().trim().max(80),
        value: z.string().trim().max(80),
      }),
    )
    .max(8),
  specsHeading: z.string().trim().max(120),
  docsHeading: z.string().trim().max(120),
  relatedHeading: z.string().trim().max(120),
  addLabel: z.string().trim().max(120),
  addedLabel: z.string().trim().max(120),
});

const SECTION_SCHEMAS: Record<SectionType, z.ZodTypeAny> = {
  HERO: heroData,
  CATEGORY_GRID: categoryGridData,
  FEATURE_COLUMNS: featureColumnsData,
  REGION_GRID: regionGridData,
  FEATURED_PRODUCTS: featuredProductsData,
  NEWSROOM: newsroomData,
  PARTNER_MARQUEE: partnerMarqueeData,
  CONTACT_CTA: contactCtaData,
  ABOUT_HERO: aboutHeroData,
  ABOUT_FACILITY: aboutFacilityData,
  ABOUT_MV: aboutMvData,
  ABOUT_TIMELINE: aboutTimelineData,
  ABOUT_CERTS: aboutCertsData,
  ABOUT_CTA: aboutCtaData,
  QUALITY_BANNER: qualityBannerData,
  QUALITY_MISSION: qualityMissionData,
  QUALITY_STANDARDS: qualityStandardsData,
  QUALITY_DOCS: qualityDocsData,
  CAREERS_INFO: careersInfoData,
  CONTACT_HERO: contactHeroData,
  CONTACT_INFO: contactInfoData,
  CONTACT_QUICK: contactQuickData,
  CONTACT_LOC: contactLocData,
  CONTACT_DEPTS: contactDeptsData,
  CATALOG_BANNER: catalogBannerData,
  CATALOG_CARD: catalogCardData,
  PRODUCT_DETAIL: productDetailData,
};

// Tip DB'den gelir (client değiştiremez); veri o tipin şemasına göre doğrulanır.
export function parseSectionData(type: SectionType, data: unknown) {
  return SECTION_SCHEMAS[type].parse(data);
}

// ── Kaydetme yükü ─────────────────────────────────────────────
export const savePageSchema = z.object({
  key: z.string().trim().min(1).max(60),
  status: z.enum(["DRAFT", "PUBLISHED", "ARCHIVED"]),
  seoTitle: z.string().trim().max(200).nullable(),
  seoDesc: z.string().trim().max(400).nullable(),
  canonical: z.string().trim().max(300).nullable(),
  sections: z
    .array(
      z.object({
        key: z.string().trim().min(1).max(60),
        order: z.coerce.number().int().min(0).max(99),
        visible: z.boolean(),
        data: z.unknown(),
      }),
    )
    .max(40),
});

export type SavePageInput = z.infer<typeof savePageSchema>;
