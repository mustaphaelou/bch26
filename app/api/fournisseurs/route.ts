import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getRedis } from "@/lib/redis";
import { FournisseurSchema } from "@/lib/validations";
import { rateLimit } from "@/lib/rate-limit";
import { getClientIp, logError } from "@/lib/server-utils";

export const dynamic = "force-dynamic";

const CACHE_KEY = "bch26:fournisseurs_all";
const CACHE_TTL = 300; // 5 minutes

// GET /api/fournisseurs - Liste des fournisseurs avec mise en cache
export async function GET() {
    try {
        // Try Cache
        const redis = getRedis();
        const cached = await redis.get(CACHE_KEY);
        if (cached) {
            return NextResponse.json(JSON.parse(cached));
        }

        // Fetch DB
        const fournisseurs = await prisma.fournisseur.findMany({
            orderBy: { nom: "asc" },
        });

        // Store Cache
        await redis.set(CACHE_KEY, JSON.stringify(fournisseurs), "EX", CACHE_TTL);

        return NextResponse.json(fournisseurs);
    } catch (error) {
        logError("GET /api/fournisseurs", error);
        return NextResponse.json(
            { error: "Erreur lors de la récupération des fournisseurs" },
            { status: 500 }
        );
    }
}

// POST /api/fournisseurs - Créer un fournisseur
export async function POST(request: Request) {
    try {
        // Rate limiting
        const ip = await getClientIp();
        const limitResult = await rateLimit(`fourn_create:${ip}`, 5, 60);
        if (!limitResult.success) {
            return NextResponse.json(
                { error: "Limite de création atteinte. Réessayez plus tard." },
                { status: 429 }
            );
        }

        const body = await request.json();

        // Validate
        const validation = FournisseurSchema.safeParse(body);
        if (!validation.success) {
            return NextResponse.json(
                { error: "Données invalides", details: validation.error.format() },
                { status: 400 }
            );
        }

        const fournisseur = await prisma.fournisseur.create({
            data: validation.data,
        });

        // Invalidate Cache
        await getRedis().del(CACHE_KEY);

        return NextResponse.json(fournisseur, { status: 201 });
    } catch (error) {
        logError("POST /api/fournisseurs", error);
        return NextResponse.json(
            { error: "Erreur lors de la création du fournisseur" },
            { status: 500 }
        );
    }
}
