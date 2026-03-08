/* eslint-disable @typescript-eslint/no-explicit-any */
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";

export interface PDFBonData {
    numero: string;
    dateCommande: string;
    numeroDevis: string;
    avecPrix: boolean;
    responsable: string;
    remarque: string;
    tauxTVA: number;
    totalHT: number;
    totalTVA: number;
    totalTTC: number;
    fournisseur: {
        nom: string;
        adresse: string;
        ville: string;
        ice: string;
        tel: string;
        fax: string;
        email: string;
    };
    lignes: {
        reference: string;
        designation: string;
        quantite: number;
        prixUnitaire: number;
        remise: number;
        montantHT: number;
        dossier: string;
    }[];
}

// Company info
const COMPANY = {
    name: "HAY 2010 Sarl",
    activity: "Travaux d'électrification\n& Éclairage public",
    address: "MAG N° 21 HAY EL MENZAH CYM RABAT",
    tel: "05 37 28 11 11",
    fax: "0537 79 40 70",
    email: "contact@hay2010.ma / ste.hay2010@gmail.com",
    patente: "26432530",
    rc: "87305",
    if_: "6580342",
    cnss: "6380951",
    ice: "001459327000056",
    banque: "Crédit Agricole du Maroc - Rabat Hay Riad - 225 825 019 105 940 651 011 263",
};

function formatNumber(n: number): string {
    return n.toLocaleString("fr-FR", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    });
}

export function generateBonPDF(data: PDFBonData): Buffer {
    const doc = new jsPDF({
        orientation: "portrait",
        unit: "mm",
        format: "a4",
    });

    const pageWidth = doc.internal.pageSize.getWidth();
    const margin = 15;

    // ─── Header band (top blue bar) ───
    doc.setFillColor(26, 75, 132);
    doc.rect(0, 0, pageWidth, 8, "F");

    let companyTextX = margin;

    // ─── Logo ───
    try {
        // eslint-disable-next-line @typescript-eslint/no-require-imports
        const fs = require("fs");
        // eslint-disable-next-line @typescript-eslint/no-require-imports
        const path = require("path");
        const logoPath = path.join(process.cwd(), "public", "logo.png");

        if (fs.existsSync(logoPath)) {
            const logoData = fs.readFileSync(logoPath).toString("base64");
            doc.addImage(`data:image/png;base64,${logoData}`, "PNG", margin, 12, 30, 15);
            companyTextX = margin + 35; // Shift company text to the right of the logo
        }
    } catch (e) {
        console.error("Error loading logo:", e);
    }

    // ─── Company name & activity (top left) ───
    doc.setFontSize(14);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(26, 75, 132);
    doc.text(COMPANY.name, companyTextX, 20);
    doc.setFontSize(8);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(51, 51, 51);
    const actLines = COMPANY.activity.split("\n");
    actLines.forEach((line, i) => {
        doc.text(line, companyTextX, 26 + i * 4);
    });

    // ─── BC Info box ───
    const infoX = margin;
    const infoY = 38;
    doc.setDrawColor(26, 75, 132);
    doc.setLineWidth(0.5);

    doc.setFontSize(10);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(26, 75, 132);
    doc.text("Bon de Commande N° :", infoX, infoY);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(0, 0, 0);
    doc.text(data.numero, infoX + 50, infoY);

    doc.setFont("helvetica", "bold");
    doc.setTextColor(26, 75, 132);
    doc.text("Date Commande :", infoX, infoY + 8);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(0, 0, 0);
    doc.text(data.dateCommande, infoX + 50, infoY + 8);

    doc.setFont("helvetica", "bold");
    doc.setTextColor(26, 75, 132);
    doc.text("DEVIS N° :", infoX, infoY + 16);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(0, 0, 0);
    doc.text(data.numeroDevis || "", infoX + 50, infoY + 16);

    // ─── Fournisseur box ───
    const fournX = pageWidth / 2 + 5;
    const fournY = 35;
    const fournW = pageWidth / 2 - margin - 5;
    const fournH = 45;

    doc.setDrawColor(26, 75, 132);
    doc.setLineWidth(0.5);
    doc.rect(fournX, fournY, fournW, fournH);

    doc.setFontSize(11);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(0, 0, 0);
    doc.text(data.fournisseur.nom, fournX + 3, fournY + 7);

    doc.setFontSize(8);
    doc.setFont("helvetica", "normal");
    let fy = fournY + 13;
    if (data.fournisseur.adresse) {
        doc.text(data.fournisseur.adresse, fournX + 3, fy);
        fy += 4;
    }
    if (data.fournisseur.ville) {
        doc.text(data.fournisseur.ville, fournX + 3, fy);
        fy += 6;
    }

    if (data.fournisseur.ice) {
        doc.setFont("helvetica", "bold");
        doc.setTextColor(255, 0, 0);
        doc.text("ICE : ", fournX + 3, fy);
        doc.setFont("helvetica", "normal");
        doc.setTextColor(0, 0, 0);
        doc.text(data.fournisseur.ice, fournX + 15, fy);
        fy += 5;
    }

    if (data.fournisseur.tel) {
        doc.setFont("helvetica", "bold");
        doc.text("Tél : ", fournX + 3, fy);
        doc.setFont("helvetica", "normal");
        doc.text(data.fournisseur.tel, fournX + 15, fy);
        if (data.fournisseur.fax) {
            doc.setFont("helvetica", "bold");
            doc.text("Fax :", fournX + 45, fy);
            doc.setFont("helvetica", "normal");
            doc.text(data.fournisseur.fax, fournX + 55, fy);
        }
        fy += 5;
    }

    if (data.fournisseur.email) {
        doc.setFont("helvetica", "bold");
        doc.text("Email :", fournX + 3, fy);
        doc.setFont("helvetica", "normal");
        doc.text(data.fournisseur.email, fournX + 18, fy);
    }

    // ─── Responsable ───
    const respY = fournY + fournH + 5;
    doc.setFontSize(8);
    doc.setTextColor(26, 75, 132);
    doc.setFont("helvetica", "bold");
    doc.text(data.responsable, fournX + 3, respY);
    doc.setFont("helvetica", "normal");
    doc.text(": Service des achats.", fournX + 3 + doc.getTextWidth(data.responsable) + 2, respY);

    // ─── Articles table ───
    const tableY = respY + 8;

    let head: string[][];
    let body: (string | number)[][];

    if (data.avecPrix) {
        head = [["Référence", "Désignation", "Qté", "Px unitaire", "Remise", "Montant HT", ""]];
        body = data.lignes.map((l) => [
            l.reference,
            l.designation,
            formatNumber(l.quantite),
            formatNumber(l.prixUnitaire),
            formatNumber(l.remise),
            formatNumber(l.montantHT),
            l.dossier || "",
        ]);
    } else {
        head = [["Référence", "Désignation", "Qté", ""]];
        body = data.lignes.map((l) => [
            l.reference,
            l.designation,
            formatNumber(l.quantite),
            l.dossier || "",
        ]);
    }

    autoTable(doc, {
        startY: tableY,
        head,
        body,
        theme: "grid",
        headStyles: {
            fillColor: [240, 240, 240],
            textColor: [0, 0, 0],
            fontStyle: "bold",
            fontSize: 8,
            halign: "center",
        },
        bodyStyles: {
            fontSize: 8,
            textColor: [0, 0, 0],
        },
        columnStyles: data.avecPrix
            ? {
                0: { cellWidth: 22 },
                1: { cellWidth: 60 },
                2: { cellWidth: 18, halign: "right" as const },
                3: { cellWidth: 22, halign: "right" as const },
                4: { cellWidth: 18, halign: "right" as const },
                5: { cellWidth: 25, halign: "right" as const },
                6: { cellWidth: 15, halign: "center" as const },
            }
            : {
                0: { cellWidth: 30 },
                1: { cellWidth: 100 },
                2: { cellWidth: 25, halign: "right" as const },
                3: { cellWidth: 25, halign: "center" as const },
            },
        margin: { left: margin, right: margin },
    });

    const finalY = (doc as any).lastAutoTable?.finalY || tableY + 50;

    // ─── Remarque ───
    if (data.remarque) {
        doc.setFontSize(8);
        doc.setFont("helvetica", "bold");
        doc.setTextColor(26, 75, 132);
        doc.text("Remarque :", margin, finalY + 10);
        doc.setFont("helvetica", "normal");
        doc.setTextColor(0, 0, 0);
        doc.text(data.remarque, margin + 25, finalY + 10);
    }

    // ─── Totals (only if avecPrix) ───
    if (data.avecPrix) {
        const totX = pageWidth / 2 + 10;
        let totY = finalY + 10;

        doc.setFontSize(8);
        doc.setTextColor(100, 100, 100);
        doc.text("Montants exprimés en Dirhams", totX + 20, totY);
        totY += 6;

        doc.setFont("helvetica", "bold");
        doc.setTextColor(0, 0, 0);
        doc.text("TOTAL HT", totX, totY);
        doc.text(formatNumber(data.totalHT), totX + 50, totY, { align: "right" });

        totY += 6;
        doc.text("TOTAL TVA", totX, totY);
        doc.text(formatNumber(data.totalTVA), totX + 50, totY, { align: "right" });

        totY += 6;
        doc.setFont("helvetica", "bold");
        doc.text("TOTAL T.T.C", totX, totY);
        doc.text(formatNumber(data.totalTTC), totX + 50, totY, { align: "right" });

        totY += 10;
        doc.setFont("helvetica", "bold");
        doc.text("Signature :", totX + 15, totY);
    }

    // ─── Footer ───
    const footerY = doc.internal.pageSize.getHeight() - 20;
    doc.setFillColor(26, 75, 132);
    doc.rect(0, footerY - 2, pageWidth, 22, "F");

    doc.setFontSize(6);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(255, 255, 255);
    doc.text(COMPANY.address, margin, footerY + 3);
    doc.setFont("helvetica", "normal");
    doc.text(`TEL: ${COMPANY.tel}   FAX: ${COMPANY.fax}`, margin, footerY + 7);
    doc.text(`EMAIL : ${COMPANY.email}`, margin, footerY + 11);
    doc.text(
        `PATENTE: ${COMPANY.patente} / R.C: ${COMPANY.rc} / IF: ${COMPANY.if_} / CNSS: ${COMPANY.cnss} / ICE: ${COMPANY.ice}`,
        margin,
        footerY + 15
    );

    // Page number
    doc.setFontSize(8);
    doc.text("Page   1", pageWidth - margin - 15, footerY + 14);

    const output = doc.output("arraybuffer");
    return Buffer.from(output);
}
