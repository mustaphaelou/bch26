import * as XLSX from "xlsx";

export interface LigneExcel {
    reference: string;
    designation: string;
    quantite: number;
    prixUnitaire: number;
    remise: number;
    dossier: string;
}

const COLUMN_MAP: Record<string, keyof LigneExcel> = {
    référence: "reference",
    reference: "reference",
    ref: "reference",
    désignation: "designation",
    designation: "designation",
    quantité: "quantite",
    quantite: "quantite",
    qté: "quantite",
    qte: "quantite",
    "prix unitaire": "prixUnitaire",
    "px unitaire": "prixUnitaire",
    prix: "prixUnitaire",
    pu: "prixUnitaire",
    remise: "remise",
    dossier: "dossier",
};

function normalizeHeader(header: string): keyof LigneExcel | null {
    const normalized = header.trim().toLowerCase();
    return COLUMN_MAP[normalized] || null;
}

export function parseExcelBuffer(buffer: Buffer): LigneExcel[] {
    const workbook = XLSX.read(buffer, { type: "buffer" });
    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];

    const rawData = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, {
        defval: "",
    });

    if (rawData.length === 0) return [];

    // Map headers
    const headers = Object.keys(rawData[0]);
    const headerMap: Record<string, keyof LigneExcel> = {};

    for (const header of headers) {
        const mapped = normalizeHeader(header);
        if (mapped) {
            headerMap[header] = mapped;
        }
    }

    return rawData
        .map((row) => {
            const ligne: Partial<LigneExcel> = {};

            for (const [originalHeader, mappedKey] of Object.entries(headerMap)) {
                const value = row[originalHeader];
                if (
                    mappedKey === "quantite" ||
                    mappedKey === "prixUnitaire" ||
                    mappedKey === "remise"
                ) {
                    ligne[mappedKey] = parseFloat(String(value)) || 0;
                } else {
                    ligne[mappedKey] = String(value || "");
                }
            }

            return {
                reference: ligne.reference || "",
                designation: ligne.designation || "",
                quantite: ligne.quantite || 0,
                prixUnitaire: ligne.prixUnitaire || 0,
                remise: ligne.remise || 0,
                dossier: ligne.dossier || "",
            } as LigneExcel;
        })
        .filter((l) => l.reference || l.designation);
}
