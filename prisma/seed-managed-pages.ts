import { PrismaClient, type Prisma } from "@prisma/client";

import { HOME_PAGE, HOME_SECTIONS, type SeedSection } from "../src/lib/pages/home-sections";
import { ABOUT_PAGE, ABOUT_SECTIONS } from "../src/lib/pages/about-sections";
import { QUALITY_PAGE, QUALITY_SECTIONS } from "../src/lib/pages/quality-sections";
import { CAREERS_PAGE, CAREERS_SECTIONS } from "../src/lib/pages/careers-sections";
import { CONTACT_PAGE, CONTACT_SECTIONS } from "../src/lib/pages/contact-sections";
import { CATALOG_PAGE, CATALOG_SECTIONS } from "../src/lib/pages/catalog-sections";

const prisma = new PrismaClient();

type PageMeta = {
  key: string;
  title: string;
  path: string;
  seoTitle: string;
  seoDesc: string;
};

async function seedPage(meta: PageMeta, sections: SeedSection[]) {
  const existing = await prisma.managedPage.findUnique({
    where: { key: meta.key },
    select: { id: true },
  });

  if (existing) {
    console.log(`✓ ManagedPage "${meta.key}" zaten var — atlandı.`);
    return;
  }

  const page = await prisma.managedPage.create({
    data: {
      key: meta.key,
      title: meta.title,
      path: meta.path,
      status: "PUBLISHED",
      seoTitle: meta.seoTitle,
      seoDesc: meta.seoDesc,
      sections: {
        create: sections.map((s) => ({
          key: s.key,
          type: s.type,
          name: s.name,
          kind: s.kind,
          sub: s.sub,
          order: s.order,
          visible: s.visible,
          data: s.data as Prisma.InputJsonValue,
        })),
      },
    },
    select: { _count: { select: { sections: true } } },
  });

  console.log(`✓ ManagedPage "${meta.key}" oluşturuldu (${page._count.sections} bölüm).`);
}

async function main() {
  await seedPage(HOME_PAGE, HOME_SECTIONS);
  await seedPage(ABOUT_PAGE, ABOUT_SECTIONS);
  await seedPage(QUALITY_PAGE, QUALITY_SECTIONS);
  await seedPage(CAREERS_PAGE, CAREERS_SECTIONS);
  await seedPage(CONTACT_PAGE, CONTACT_SECTIONS);
  await seedPage(CATALOG_PAGE, CATALOG_SECTIONS);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
