-- AlterTable
ALTER TABLE "classes" ADD COLUMN     "categorie" TEXT,
ADD COLUMN     "image" TEXT,
ADD COLUMN     "langue" TEXT,
ADD COLUMN     "niveau" TEXT;

-- AlterTable
ALTER TABLE "utilisateurs" ADD COLUMN     "biographie" TEXT,
ADD COLUMN     "photo" TEXT,
ADD COLUMN     "ville" TEXT;
