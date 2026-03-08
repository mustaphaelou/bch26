import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getRedis } from "@/lib/redis";

export const dynamic = "force-dynamic";

// GET /api/bons - Liste des bons de commande
export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const statut = searchParams.get("statut");
        const search = searchParams.get("search");
        const page = parseInt(searchParams.get("page") || "1");
        const limit = parseInt(searchParams.get("limit") || "20");

        const where: Record<string, unknown> = {};
        if (statut) where.statut = statut;
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
        console.error("Erreur liste BC:", error);
        return NextResponse.json(
            { error: "Erreur lors de la récupération des bons" },
            { status: 500 }
        );
    }
}

// Génère le prochain numéro de BC
async function getNextNumero(): Promise<string> {
    // Try Redis counter first for speed
    let counter: number;
    try {
        counter = await getRedis().incr("bch26:bc_counter");
    } catch {
        // Fallback to DB
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
        const body = await request.json();
        const {
            dateCommande,
            numeroDevis,
            fournisseurId,
            avecPrix,
            remarque,
            responsable,
            tauxTVA,
            lignes,
        } = body;

        if (!fournisseurId) {
            return NextResponse.json(
                { error: "Le fournisseur est obligatoire" },
                { status: 400 }
            );
        }

        if (!lignes || lignes.length === 0) {
            return NextResponse.json(
                { error: "Au moins une ligne de commande est requise" },
                { status: 400 }
            );
        }

        const numero = await getNextNumero();
        const tva = tauxTVA || 20;

        // Calculate totals
        const processedLignes = lignes.map(
            (l: {
                reference: string;
                designation: string;
                quantite: number;
                prixUnitaire: number;
                remise: number;
                dossier: string;
            }) => {
                const montantBrut = l.quantite * l.prixUnitaire;
                const montantRemise = montantBrut * (l.remise / 100);
                const montantHT = montantBrut - montantRemise;
                return {
                    reference: l.reference,
                    designation: l.designation,
                    quantite: l.quantite,
                    prixUnitaire: l.prixUnitaire || 0,
                    remise: l.remise || 0,
                    montantHT: avecPrix !== false ? montantHT : 0,
                    dossier: l.dossier || "",
                };
            }
        );

        const totalHT = processedLignes.reduce(
            (sum: number, l: { montantHT: number }) => sum + l.montantHT,
            0
        );
        const totalTVA = totalHT * (tva / 100);
        const totalTTC = totalHT + totalTVA;

        const bon = await prisma.bonDeCommande.create({
            data: {
                numero,
                dateCommande: dateCommande ? new Date(dateCommande) : new Date(),
                numeroDevis: numeroDevis || "",
                fournisseurId,
                avecPrix: avecPrix !== false,
                remarque: remarque || "",
                responsable: responsable || "Oubaha Abdelali",
                tauxTVA: tva,
                totalHT: avecPrix !== false ? totalHT : 0,
                totalTVA: avecPrix !== false ? totalTVA : 0,
                totalTTC: avecPrix !== false ? totalTTC : 0,
                lignes: {
                    create: processedLignes,
                },
            },
            include: { fournisseur: true, lignes: true },
        });

        return NextResponse.json(bon, { status: 201 });
    } catch (error) {
        console.error("Erreur création BC:", error);
        return NextResponse.json(
            { error: "Erreur lors de la création du bon de commande" },
            { status: 500 }
        );
    }
}
