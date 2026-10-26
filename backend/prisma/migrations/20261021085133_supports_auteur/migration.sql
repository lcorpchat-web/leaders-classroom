-- AlterTable
ALTER TABLE "supports" ADD COLUMN     "depose_par_id" UUID;

-- AddForeignKey
ALTER TABLE "supports" ADD CONSTRAINT "supports_depose_par_id_fkey" FOREIGN KEY ("depose_par_id") REFERENCES "utilisateurs"("id") ON DELETE SET NULL ON UPDATE CASCADE;
