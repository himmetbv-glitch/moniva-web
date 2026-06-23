-- CreateTable
CREATE TABLE "SiteSetting" (
    "id" TEXT NOT NULL DEFAULT 'singleton',
    "companyName" TEXT NOT NULL DEFAULT 'MONIVA Otomotiv ve Gıda San. Tic. A.Ş.',
    "addressLine" TEXT NOT NULL DEFAULT 'Selçuklu / Konya, Türkiye',
    "phone" TEXT NOT NULL DEFAULT '+90 332 239 03 05',
    "email" TEXT NOT NULL DEFAULT 'export@moniva.com.tr',
    "whatsapp" TEXT,
    "linkedinUrl" TEXT,
    "xUrl" TEXT,
    "youtubeUrl" TEXT,
    "instagramUrl" TEXT,
    "metaTitleBase" TEXT NOT NULL DEFAULT 'Moniva',
    "metaDescBase" TEXT,
    "notifyEmail" TEXT,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SiteSetting_pkey" PRIMARY KEY ("id")
);
