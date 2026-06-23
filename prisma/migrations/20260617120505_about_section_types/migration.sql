-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "SectionType" ADD VALUE 'ABOUT_HERO';
ALTER TYPE "SectionType" ADD VALUE 'ABOUT_FACILITY';
ALTER TYPE "SectionType" ADD VALUE 'ABOUT_MV';
ALTER TYPE "SectionType" ADD VALUE 'ABOUT_TIMELINE';
ALTER TYPE "SectionType" ADD VALUE 'ABOUT_CERTS';
ALTER TYPE "SectionType" ADD VALUE 'ABOUT_CTA';
