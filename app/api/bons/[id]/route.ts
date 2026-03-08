import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

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
        console.error("Erreur récupération BC:", error);
        return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
    }
}

// PUT /api/bons/[id]
export async function PUT(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const body = await request.json();
        const { statut, remarque, responsable } = body;

        const updateData: Record<string, unknown> = {};
        if (statut) updateData.statut = statut;
        if (remarque !== undefined) updateData.remarque = remarque;
        if (responsable) updateData.responsable = responsable;

        const bon = await prisma.bonDeCommande.update({
            where: { id },
            data: updateData,
            include: { fournisseur: true, lignes: true },
        });

        return NextResponse.json(bon);
    } catch (error) {
        console.error("Erreur mise à jour BC:", error);
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
        const { id } = await params;
        await prisma.bonDeCommande.delete({ where: { id } });
        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Erreur suppression BC:", error);
        return NextResponse.json(
            { error: "Erreur lors de la suppression" },
            { status: 500 }
        );
    }
}
