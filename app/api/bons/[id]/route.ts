import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { UpdateBCSchema } from "@/lib/validations";
import { rateLimit } from "@/lib/rate-limit";
import { getClientIp, logError } from "@/lib/server-utils";

export const dynamic = "force-dynamic";

// GET /api/bons/[id]
export async function GET(
    _request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const bon = await prisma.bonDeCommande.findUnique({
            where: { id },
            include: { fournisseur: true, lignes: true },
        });

        if (!bon) {
            return NextResponse.json(
                { error: "Bon de commande non trouvé" },
                { status: 404 }
            );
        }

        return NextResponse.json(bon);
    } catch (error) {
        logError("GET /api/bons/[id]", error);
        return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
    }
}

// PUT /api/bons/[id]
export async function PUT(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const ip = await getClientIp();
        const limitResult = await rateLimit(`bc_update:${ip}`, 20, 60);
        if (!limitResult.success) {
            return NextResponse.json(
                { error: "Trop de requêtes. Veuillez patienter." },
                { status: 429, headers: { "Retry-After": limitResult.reset.toString() } }
            );
        }

        const { id } = await params;
        const body = await request.json();

        // Validate
        const validation = UpdateBCSchema.safeParse(body);
        if (!validation.success) {
            return NextResponse.json(
                { error: "Validation échouée", details: validation.error.format() },
                { status: 400 }
            );
        }

        const bon = await prisma.bonDeCommande.update({
            where: { id },
            data: validation.data,
            include: { fournisseur: true, lignes: true },
        });

        return NextResponse.json(bon);
    } catch (error) {
        logError("PUT /api/bons/[id]", error);
        return NextResponse.json(
            { error: "Erreur lors de la mise à jour" },
            { status: 500 }
        );
    }
}

// DELETE /api/bons/[id]
export async function DELETE(
    _request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const ip = await getClientIp();
        const limitResult = await rateLimit(`bc_delete:${ip}`, 5, 60);
        if (!limitResult.success) {
            return NextResponse.json(
                { error: "Trop de requêtes. Veuillez patienter." },
                { status: 429, headers: { "Retry-After": limitResult.reset.toString() } }
            );
        }

        const { id } = await params;
        await prisma.bonDeCommande.delete({ where: { id } });
        return NextResponse.json({ success: true });
    } catch (error) {
        logError("DELETE /api/bons/[id]", error);
        return NextResponse.json(
            { error: "Erreur lors de la suppression" },
            { status: 500 }
        );
    }
}
