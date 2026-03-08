import { z } from "zod";

export const LigneCommandeSchema = z.object({
    reference: z.string().min(1, "Référence requise"),
    designation: z.string().min(1, "Désignation requise"),
    quantite: z.number().positive("La quantité doit être positive"),
    prixUnitaire: z.number().nonnegative().default(0),
    remise: z.number().min(0).max(100).default(0),
    dossier: z.string().optional().default(""),
});

export const CreateBCSchema = z.object({
    dateCommande: z.string().optional().transform(val => val ? new Date(val) : new Date()),
    numeroDevis: z.string().optional().default(""),
    fournisseurId: z.string().min(1, "Fournisseur obligatoire"),
    avecPrix: z.boolean().default(true),
    remarque: z.string().optional().default(""),
    responsable: z.string().default("Oubaha Abdelali"),
    tauxTVA: z.number().min(0).max(100).default(20),
    lignes: z.array(LigneCommandeSchema).min(1, "Au moins une ligne est requise"),
});

export const FournisseurSchema = z.object({
    nom: z.string().min(1, "Nom requis"),
    adresse: z.string().optional().default(""),
    ville: z.string().optional().default(""),
    ice: z.string().optional().default(""),
    tel: z.string().optional().default(""),
    fax: z.string().optional().default(""),
    email: z.string().email("Email invalide").optional().or(z.literal("")),
});

export const UpdateBCSchema = z.object({
    statut: z.enum(["BROUILLON", "VALIDE", "ANNULE"]).optional(),
    remarque: z.string().optional(),
    responsable: z.string().optional(),
});

export type CreateBCInput = z.infer<typeof CreateBCSchema>;
export type LigneInput = z.infer<typeof LigneCommandeSchema>;
export type FournisseurInput = z.infer<typeof FournisseurSchema>;
export type UpdateBCInput = z.infer<typeof UpdateBCSchema>;
