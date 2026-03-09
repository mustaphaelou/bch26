import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { generateBonPDF, PDFBonData } from "@/lib/pdf-generator";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { rateLimit } from "@/lib/rate-limit";
import { getClientIp, logError } from "@/lib/server-utils";

export const dynamic = "force-dynamic";

// GET /api/bons/[id]/pdf
export async function GET(
    _request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const ip = await getClientIp();
        const limitResult = await rateLimit(`bc_pdf:${ip}`, 30, 60); // Allow 30 PDF generations per minute
        if (!limitResult.success) {
            return NextResponse.json(
                { error: "Limite de téléchargement atteinte. Réessayez plus tard." },
                { status: 429 }
            );
        }

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

        const pdfData: PDFBonData = {
            numero: bon.numero,
            dateCommande: format(bon.dateCommande, "dd/MM/yyyy", { locale: fr }),
            numeroDevis: bon.numeroDevis || "",
            avecPrix: bon.avecPrix,
            responsable: bon.responsable,
            remarque: bon.remarque || "",
            tauxTVA: Number(bon.tauxTVA),
            totalHT: Number(bon.totalHT),
            totalTVA: Number(bon.totalTVA),
            totalTTC: Number(bon.totalTTC),
            fournisseur: {
                nom: bon.fournisseur.nom,
                adresse: bon.fournisseur.adresse || "",
                ville: bon.fournisseur.ville || "",
                ice: bon.fournisseur.ice || "",
                tel: bon.fournisseur.tel || "",
                fax: bon.fournisseur.fax || "",
                email: bon.fournisseur.email || "",
            },
            lignes: bon.lignes.map((l) => ({
                reference: l.reference,
                designation: l.designation,
                quantite: Number(l.quantite),
                prixUnitaire: Number(l.prixUnitaire),
                remise: Number(l.remise),
                montantHT: Number(l.montantHT),
                dossier: l.dossier || "",
            })),
        };

        const pdfBuffer = generateBonPDF(pdfData);
        const uint8 = new Uint8Array(pdfBuffer);

        return new NextResponse(uint8, {
            status: 200,
            headers: {
                "Content-Type": "application/pdf",
                "Content-Disposition": `inline; filename="BC_${bon.numero}.pdf"`,
            },
        });
    } catch (error) {
        logError("GET /api/bons/[id]/pdf", error);
        return NextResponse.json(
            { error: "Erreur lors de la génération du PDF" },
            { status: 500 }
        );
    }
}
