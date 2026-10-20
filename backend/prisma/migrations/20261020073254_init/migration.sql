-- CreateEnum
CREATE TYPE "Role" AS ENUM ('ADMIN', 'ENSEIGNANT', 'APPRENANT');

-- CreateEnum
CREATE TYPE "StatutSeance" AS ENUM ('PROGRAMMEE', 'EN_COURS', 'TERMINEE', 'ANNULEE');

-- CreateEnum
CREATE TYPE "StatutPresence" AS ENUM ('PRESENT', 'RETARD', 'ABSENT');

-- CreateEnum
CREATE TYPE "StatutInscription" AS ENUM ('EN_ATTENTE', 'VALIDEE', 'RETIREE');

-- CreateTable
CREATE TABLE "utilisateurs" (
    "id" UUID NOT NULL,
    "nom" TEXT NOT NULL,
    "prenom" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "telephone" TEXT,
    "mot_de_passe_hache" TEXT NOT NULL,
    "role" "Role" NOT NULL,
    "matricule" TEXT,
    "specialite" TEXT,
    "actif" BOOLEAN NOT NULL DEFAULT true,
    "cree_le" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "utilisateurs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "classes" (
    "id" UUID NOT NULL,
    "nom" TEXT NOT NULL,
    "description" TEXT,
    "date_debut" DATE NOT NULL,
    "date_fin" DATE,
    "active" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "classes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "affectations" (
    "classe_id" UUID NOT NULL,
    "enseignant_id" UUID NOT NULL,
    "affecte_le" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "affectations_pkey" PRIMARY KEY ("classe_id","enseignant_id")
);

-- CreateTable
CREATE TABLE "inscriptions" (
    "classe_id" UUID NOT NULL,
    "apprenant_id" UUID NOT NULL,
    "date_inscription" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "statut" "StatutInscription" NOT NULL DEFAULT 'EN_ATTENTE',

    CONSTRAINT "inscriptions_pkey" PRIMARY KEY ("classe_id","apprenant_id")
);

-- CreateTable
CREATE TABLE "seances" (
    "id" UUID NOT NULL,
    "classe_id" UUID NOT NULL,
    "enseignant_id" UUID NOT NULL,
    "titre" TEXT NOT NULL,
    "debut" TIMESTAMP(3) NOT NULL,
    "duree_minutes" INTEGER NOT NULL,
    "statut" "StatutSeance" NOT NULL DEFAULT 'PROGRAMMEE',
    "meeting_id_bbb" TEXT,
    "enregistree" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "seances_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "presences" (
    "id" UUID NOT NULL,
    "seance_id" UUID NOT NULL,
    "utilisateur_id" UUID NOT NULL,
    "arrivee" TIMESTAMP(3),
    "depart" TIMESTAMP(3),
    "duree_minutes" INTEGER NOT NULL DEFAULT 0,
    "statut" "StatutPresence",

    CONSTRAINT "presences_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "supports" (
    "id" UUID NOT NULL,
    "classe_id" UUID NOT NULL,
    "seance_id" UUID,
    "titre" TEXT NOT NULL,
    "nom_fichier" TEXT NOT NULL,
    "type_mime" TEXT NOT NULL,
    "taille_octets" INTEGER NOT NULL,
    "depose_le" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "supports_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "utilisateurs_email_key" ON "utilisateurs"("email");

-- CreateIndex
CREATE UNIQUE INDEX "utilisateurs_matricule_key" ON "utilisateurs"("matricule");

-- CreateIndex
CREATE UNIQUE INDEX "seances_meeting_id_bbb_key" ON "seances"("meeting_id_bbb");

-- CreateIndex
CREATE INDEX "seances_classe_id_debut_idx" ON "seances"("classe_id", "debut");

-- CreateIndex
CREATE INDEX "presences_seance_id_idx" ON "presences"("seance_id");

-- CreateIndex
CREATE INDEX "presences_utilisateur_id_idx" ON "presences"("utilisateur_id");

-- CreateIndex
CREATE INDEX "supports_classe_id_idx" ON "supports"("classe_id");

-- AddForeignKey
ALTER TABLE "affectations" ADD CONSTRAINT "affectations_classe_id_fkey" FOREIGN KEY ("classe_id") REFERENCES "classes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "affectations" ADD CONSTRAINT "affectations_enseignant_id_fkey" FOREIGN KEY ("enseignant_id") REFERENCES "utilisateurs"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "inscriptions" ADD CONSTRAINT "inscriptions_classe_id_fkey" FOREIGN KEY ("classe_id") REFERENCES "classes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "inscriptions" ADD CONSTRAINT "inscriptions_apprenant_id_fkey" FOREIGN KEY ("apprenant_id") REFERENCES "utilisateurs"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "seances" ADD CONSTRAINT "seances_classe_id_fkey" FOREIGN KEY ("classe_id") REFERENCES "classes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "seances" ADD CONSTRAINT "seances_enseignant_id_fkey" FOREIGN KEY ("enseignant_id") REFERENCES "utilisateurs"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "presences" ADD CONSTRAINT "presences_seance_id_fkey" FOREIGN KEY ("seance_id") REFERENCES "seances"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "presences" ADD CONSTRAINT "presences_utilisateur_id_fkey" FOREIGN KEY ("utilisateur_id") REFERENCES "utilisateurs"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "supports" ADD CONSTRAINT "supports_classe_id_fkey" FOREIGN KEY ("classe_id") REFERENCES "classes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "supports" ADD CONSTRAINT "supports_seance_id_fkey" FOREIGN KEY ("seance_id") REFERENCES "seances"("id") ON DELETE SET NULL ON UPDATE CASCADE;
