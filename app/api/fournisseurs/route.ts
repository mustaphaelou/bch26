import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

// GET /api/fournisseurs - Liste des fournisseurs
export async function GET() {
    console.log("DATABASE_URL present:", !!process.env.DATABASE_URL);
    try {
        const fournisseurs = await prisma.fournisseur.findMany({
            orderBy: { nom: "asc" },
        });
        return NextResponse.json(fournisseurs);
    } catch (error) {
        const err = error as Error;
        console.error("Erreur détaillée liste fournisseurs:", err.message, err.stack);
        return NextResponse.json(
            { error: "Erreur lors de la récupération des fournisseurs" },
            { status: 500 }
        );
    }
}

// POST /api/fournisseurs - Créer un fournisseur
export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { nom, adresse, ville, ice, tel, fax, email } = body;

        if (!nom) {
            return NextResponse.json(
                { error: "Le nom du fournisseur est obligatoire" },
                { status: 400 }
            );
        }

        const fournisseur = await prisma.fournisseur.create({
            data: { nom, adresse, ville, ice, tel, fax, email },
        });

        return NextResponse.json(fournisseur, { status: 201 });
    } catch (error) {
        console.error("Erreur création fournisseur:", error);
        return NextResponse.json(
            { error: "Erreur lors de la création du fournisseur" },
            { status: 500 }
        );
    }
}
