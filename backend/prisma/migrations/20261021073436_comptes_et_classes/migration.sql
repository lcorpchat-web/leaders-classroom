-- AlterTable
ALTER TABLE "classes" ADD COLUMN     "capacite_max" INTEGER,
ADD COLUMN     "cree_le" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- AlterTable
ALTER TABLE "utilisateurs" ADD COLUMN     "doit_changer_mot_de_passe" BOOLEAN NOT NULL DEFAULT false;
