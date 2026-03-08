-- CreateEnum
CREATE TYPE "StatutBC" AS ENUM ('BROUILLON', 'VALIDE');

-- CreateTable
CREATE TABLE "fournisseurs" (
    "id" TEXT NOT NULL,
    "nom" TEXT NOT NULL,
    "adresse" TEXT,
    "ville" TEXT,
    "ice" TEXT,
    "tel" TEXT,
    "fax" TEXT,
    "email" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "fournisseurs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "bons_de_commande" (
    "id" TEXT NOT NULL,
    "numero" TEXT NOT NULL,
    "dateCommande" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "numeroDevis" TEXT,
    "avecPrix" BOOLEAN NOT NULL DEFAULT true,
    "remarque" TEXT,
    "responsable" TEXT NOT NULL DEFAULT 'Oubaha Abdelali',
    "totalHT" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "totalTVA" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "totalTTC" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "tauxTVA" DOUBLE PRECISION NOT NULL DEFAULT 20,
    "statut" "StatutBC" NOT NULL DEFAULT 'BROUILLON',
    "fournisseurId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "bons_de_commande_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "lignes_commande" (
    "id" TEXT NOT NULL,
    "reference" TEXT NOT NULL,
    "designation" TEXT NOT NULL,
    "quantite" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "prixUnitaire" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "remise" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "montantHT" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "dossier" TEXT,
    "bonId" TEXT NOT NULL,

    CONSTRAINT "lignes_commande_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "compteurs" (
    "id" TEXT NOT NULL DEFAULT 'bc_counter',
    "valeur" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "compteurs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "bons_de_commande_numero_key" ON "bons_de_commande"("numero");

-- CreateIndex
CREATE INDEX "bons_de_commande_fournisseurId_idx" ON "bons_de_commande"("fournisseurId");

-- CreateIndex
CREATE INDEX "lignes_commande_bonId_idx" ON "lignes_commande"("bonId");

-- AddForeignKey
ALTER TABLE "bons_de_commande" ADD CONSTRAINT "bons_de_commande_fournisseurId_fkey" FOREIGN KEY ("fournisseurId") REFERENCES "fournisseurs"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lignes_commande" ADD CONSTRAINT "lignes_commande_bonId_fkey" FOREIGN KEY ("bonId") REFERENCES "bons_de_commande"("id") ON DELETE CASCADE ON UPDATE CASCADE;
