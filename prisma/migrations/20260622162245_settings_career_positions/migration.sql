-- AlterTable
ALTER TABLE "SiteSetting" ADD COLUMN     "careerPositions" TEXT[] DEFAULT ARRAY['Satış & İhracat', 'Operasyon & Depo', 'Mühendislik & Ar-Ge', 'BT & Dijital', 'Finans & İdari', 'Açık başvuru']::TEXT[];
