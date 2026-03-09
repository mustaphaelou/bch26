import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { FournisseurSchema } from "@/lib/validations";
import { rateLimit } from "@/lib/rate-limit";
import { getClientIp, logError } from "@/lib/server-utils";
import { getRedis } from "@/lib/redis";

export const dynamic = "force-dynamic";

const CACHE_KEY = "bch26:fournisseurs_all";

// GET /api/fournisseurs/[id]
export async function GET(
    _request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const fournisseur = await prisma.fournisseur.findUnique({
            where: { id },
        });

        if (!fournisseur) {
            return NextResponse.json(
                { error: "Fournisseur non trouvé" },
                { status: 404 }
            );
        }

        return NextResponse.json(fournisseur);
    } catch (error) {
        logError("GET /api/fournisseurs/[id]", error);
        return NextResponse.json(
            { error: "Erreur serveur" },
            { status: 500 }
        );
    }
}

// PUT /api/fournisseurs/[id]
export async function PUT(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const ip = await getClientIp();
        const limitResult = await rateLimit(`fourn_update:${ip}`, 20, 60);
        if (!limitResult.success) {
            return NextResponse.json(
                { error: "Trop de requêtes. Veuillez patienter." },
                { status: 429, headers: { "Retry-After": limitResult.reset.toString() } }
            );
        }

        const { id } = await params;
        const body = await request.json();

        // Validate
        const validation = FournisseurSchema.safeParse(body);
        if (!validation.success) {
            return NextResponse.json(
                { error: "Validation échouée", details: validation.error.format() },
                { status: 400 }
            );
        }

        const fournisseur = await prisma.fournisseur.update({
            where: { id },
            data: validation.data,
        });

        // Invalidate list cache
        await getRedis().del(CACHE_KEY);

        return NextResponse.json(fournisseur);
    } catch (error) {
        logError("PUT /api/fournisseurs/[id]", error);
        return NextResponse.json(
            { error: "Erreur lors de la mise à jour" },
            { status: 500 }
        );
    }
}

// DELETE /api/fournisseurs/[id]
export async function DELETE(
    _request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const ip = await getClientIp();
        const limitResult = await rateLimit(`fourn_delete:${ip}`, 5, 60);
        if (!limitResult.success) {
            return NextResponse.json(
                { error: "Trop de requêtes. Veuillez patienter." },
                { status: 429, headers: { "Retry-After": limitResult.reset.toString() } }
            );
        }

        const { id } = await params;
        await prisma.fournisseur.delete({ where: { id } });

        // Invalidate list cache
        await getRedis().del(CACHE_KEY);

        return NextResponse.json({ success: true });
    } catch (error) {
        logError("DELETE /api/fournisseurs/[id]", error);
        return NextResponse.json(
            { error: "Erreur lors de la suppression. Ce fournisseur est peut-être lié à des données." },
            { status: 500 }
        );
    }
}
