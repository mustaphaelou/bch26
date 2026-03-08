import { NextResponse } from "next/server";
import { parseExcelBuffer } from "@/lib/excel-parser";

export const dynamic = "force-dynamic";

// POST /api/import - Import Excel file
export async function POST(request: Request) {
    try {
        const formData = await request.formData();
        const file = formData.get("file") as File | null;

        if (!file) {
            return NextResponse.json(
                { error: "Aucun fichier fourni" },
                { status: 400 }
            );
        }

        const allowedTypes = [
            "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
            "application/vnd.ms-excel",
        ];

        if (!allowedTypes.includes(file.type) && !file.name.endsWith(".xlsx") && !file.name.endsWith(".xls")) {
            return NextResponse.json(
                { error: "Format de fichier non supporté. Utilisez .xlsx ou .xls" },
                { status: 400 }
            );
        }

        const buffer = Buffer.from(await file.arrayBuffer());
        const lignes = parseExcelBuffer(buffer);

        if (lignes.length === 0) {
            return NextResponse.json(
                { error: "Aucune ligne trouvée dans le fichier Excel" },
                { status: 400 }
            );
        }

        return NextResponse.json({ lignes, count: lignes.length });
    } catch (error) {
        console.error("Erreur import Excel:", error);
        return NextResponse.json(
            { error: "Erreur lors de l'importation du fichier Excel" },
            { status: 500 }
        );
    }
}
