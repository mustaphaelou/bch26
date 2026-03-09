import { NextResponse } from "next/server";
import { StatutBC, Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { getRedis } from "@/lib/redis";
import { CreateBCSchema } from "@/lib/validations";
import { rateLimit } from "@/lib/rate-limit";
import { getClientIp, logError } from "@/lib/server-utils";
import Decimal from "decimal.js";

export const dynamic = "force-dynamic";

// GET /api/bons - Liste des bons de commande
export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const statut = searchParams.get("statut");
        const search = searchParams.get("search");
        const page = parseInt(searchParams.get("page") || "1");
        const limit = parseInt(searchParams.get("limit") || "20");

        const where: Prisma.BonDeCommandeWhereInput = {};
        if (statut) where.statut = statut as StatutBC;
        if (search) {
            where.OR = [
                { numero: { contains: search, mode: "insensitive" } },
                { fournisseur: { nom: { contains: search, mode: "insensitive" } } },
            ];
        }

        const [bons, total] = await Promise.all([
            prisma.bonDeCommande.findMany({
                where,
                include: { fournisseur: true, lignes: true },
                orderBy: { createdAt: "desc" },
                skip: (page - 1) * limit,
                take: limit,
            }),
            prisma.bonDeCommande.count({ where }),
        ]);

        return NextResponse.json({ bons, total, page, limit });
    } catch (error) {
        logError("GET /api/bons", error);
        return NextResponse.json(
            { error: "Erreur lors de la récupération des bons" },
            { status: 500 }
        );
    }
}

/**
 * Génère le prochain numéro de BC de manière séquentielle
 * Utilise Redis pour la performance, avec fallback DB
 */
async function getNextNumero(): Promise<string> {
    let counter: number;
    try {
        counter = await getRedis().incr("bch26:bc_counter");
    } catch (error) {
        console.warn("Redis counter unavailable, falling back to DB:", error);
        const compteur = await prisma.compteur.upsert({
            where: { id: "bc_counter" },
            update: { valeur: { increment: 1 } },
            create: { id: "bc_counter", valeur: 1 },
        });
        counter = compteur.valeur;
    }

    return `BCH26${String(counter).padStart(6, "0")}`;
}

// POST /api/bons - Créer un bon de commande
export async function POST(request: Request) {
    try {
        // Rate limiting
        const ip = await getClientIp();
        const limitResult = await rateLimit(`bc_create:${ip}`, 10, 60);
        if (!limitResult.success) {
            return NextResponse.json(
                { error: "Trop de requêtes. Veuillez patienter." },
                { status: 429, headers: { "Retry-After": limitResult.reset.toString() } }
            );
        }

        const body = await request.json();

        // 1. Validation
        const validation = CreateBCSchema.safeParse(body);
        if (!validation.success) {
            return NextResponse.json(
                { error: "Validation échouée", details: validation.error.format() },
                { status: 400 }
            );
        }

        const data = validation.data;

        // 2. Transaction Atomique
        const bon = await prisma.$transaction(async (tx) => {
            const numero = await getNextNumero();

            const processedLignes = data.lignes.map(l => {
                const qte = new Decimal(l.quantite);
                const pu = new Decimal(l.prixUnitaire);
                const remisePct = new Decimal(l.remise).div(100);

                const montantBrut = qte.times(pu);
                const montantRemise = montantBrut.times(remisePct);
                const montantHT = montantBrut.minus(montantRemise);

                return {
                    reference: l.reference,
                    designation: l.designation,
                    quantite: qte as unknown as Prisma.Decimal,
                    prixUnitaire: pu as unknown as Prisma.Decimal,
                    remise: new Decimal(l.remise) as unknown as Prisma.Decimal,
                    montantHT: (data.avecPrix ? montantHT : new Decimal(0)) as unknown as Prisma.Decimal,
                    dossier: l.dossier,
                };
            });

            const totalHT = processedLignes.reduce(
                (sum, l) => sum.plus(new Decimal(l.montantHT.toString())),
                new Decimal(0)
            );
            const tvaFactor = new Decimal(data.tauxTVA).div(100);
            const totalTVA = totalHT.times(tvaFactor);
            const totalTTC = totalHT.plus(totalTVA);

            return await tx.bonDeCommande.create({
                data: {
                    numero,
                    dateCommande: data.dateCommande,
                    numeroDevis: data.numeroDevis,
                    fournisseurId: data.fournisseurId,
                    avecPrix: data.avecPrix,
                    remarque: data.remarque,
                    responsable: data.responsable,
                    tauxTVA: new Decimal(data.tauxTVA) as unknown as Prisma.Decimal,
                    totalHT: (data.avecPrix ? totalHT : new Decimal(0)) as unknown as Prisma.Decimal,
                    totalTVA: (data.avecPrix ? totalTVA : new Decimal(0)) as unknown as Prisma.Decimal,
                    totalTTC: (data.avecPrix ? totalTTC : new Decimal(0)) as unknown as Prisma.Decimal,
                    lignes: {
                        create: processedLignes,
                    },
                },
                include: { fournisseur: true, lignes: true },
            });
        });

        // Optional: Invalidate caches if needed

        return NextResponse.json(bon, { status: 201 });
    } catch (error) {
        logError("POST /api/bons", error);
        return NextResponse.json(
            { error: "Serveur saturé ou erreur interne. Veuillez réessayer." },
            { status: 500 }
        );
    }
}
