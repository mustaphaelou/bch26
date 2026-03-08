import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

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
        console.error("Erreur récupération fournisseur:", error);
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
        const { id } = await params;
        const body = await request.json();
        const { nom, adresse, ville, ice, tel, fax, email } = body;

        const fournisseur = await prisma.fournisseur.update({
            where: { id },
            data: { nom, adresse, ville, ice, tel, fax, email },
        });

        return NextResponse.json(fournisseur);
    } catch (error) {
        console.error("Erreur mise à jour fournisseur:", error);
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
        const { id } = await params;
        await prisma.fournisseur.delete({ where: { id } });
        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Erreur suppression fournisseur:", error);
        return NextResponse.json(
            { error: "Erreur lors de la suppression" },
            { status: 500 }
        );
    }
}
