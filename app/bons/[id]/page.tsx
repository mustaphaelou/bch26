"use client";

import { useEffect, useState, use } from "react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
    TableFooter,
} from "@/components/ui/table";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { toast } from "sonner";
import {
    ArrowLeft02Icon,
    Download04Icon,
    Tick02Icon,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";

interface BonDetail {
    id: string;
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
    statut: "BROUILLON" | "VALIDE";
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
        id: string;
        reference: string;
        designation: string;
        quantite: number;
        prixUnitaire: number;
        remise: number;
        montantHT: number;
        dossier: string;
    }[];
}

export default function BonDetailPage({
    params,
}: {
    params: Promise<{ id: string }>;
}) {
    const { id } = use(params);
    const [bon, setBon] = useState<BonDetail | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetch(`/api/bons/${id}`)
            .then((r) => r.json())
            .then((data) => setBon(data))
            .catch(() => toast.error("Erreur de chargement"))
            .finally(() => setLoading(false));
    }, [id]);

    async function handleValider() {
        try {
            const res = await fetch(`/api/bons/${id}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ statut: "VALIDE" }),
            });
            const data = await res.json();
            setBon(data);
            toast.success("Bon de commande validé");
        } catch {
            toast.error("Erreur lors de la validation");
        }
    }

    function handleDownloadPDF() {
        window.open(`/api/bons/${id}/pdf`, "_blank");
    }

    if (loading) {
        return (
            <div className="space-y-4">
                <div className="h-8 w-64 animate-pulse rounded bg-muted" />
                <div className="h-64 animate-pulse rounded bg-muted" />
            </div>
        );
    }

    if (!bon) {
        return (
            <div className="text-center py-12">
                <p className="text-muted-foreground">Bon de commande non trouvé</p>
                <Button asChild className="mt-4">
                    <Link href="/bons">Retour à la liste</Link>
                </Button>
            </div>
        );
    }

    return (
        <div className="space-y-6 max-w-5xl">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <Button variant="ghost" size="sm" asChild>
                        <Link href="/bons">
                            <HugeiconsIcon icon={ArrowLeft02Icon} size={16} />
                            Retour
                        </Link>
                    </Button>
                    <h1 className="text-2xl font-bold">{bon.numero}</h1>
                    <Badge variant={bon.statut === "VALIDE" ? "default" : "outline"}>
                        {bon.statut === "VALIDE" ? "Validé" : "Brouillon"}
                    </Badge>
                    <Badge variant={bon.avecPrix ? "default" : "secondary"}>
                        {bon.avecPrix ? "Avec Prix" : "Sans Prix"}
                    </Badge>
                </div>
                <div className="flex gap-2">
                    {bon.statut === "BROUILLON" && (
                        <Button variant="outline" onClick={handleValider}>
                            <HugeiconsIcon icon={Tick02Icon} size={16} />
                            Valider
                        </Button>
                    )}
                    <Button onClick={handleDownloadPDF}>
                        <HugeiconsIcon icon={Download04Icon} size={16} />
                        Télécharger PDF
                    </Button>
                </div>
            </div>

            {/* Info Cards */}
            <div className="grid md:grid-cols-2 gap-6">
                <Card>
                    <CardHeader>
                        <CardTitle>Détails de la Commande</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                        <div className="flex justify-between">
                            <span className="text-muted-foreground">N° BC</span>
                            <span className="font-medium">{bon.numero}</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-muted-foreground">Date</span>
                            <span>
                                {format(new Date(bon.dateCommande), "dd MMMM yyyy", {
                                    locale: fr,
                                })}
                            </span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-muted-foreground">N° Devis</span>
                            <span>{bon.numeroDevis || "—"}</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-muted-foreground">Responsable</span>
                            <span>{bon.responsable}</span>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>Fournisseur</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2">
                        <p className="font-semibold text-lg">{bon.fournisseur.nom}</p>
                        {bon.fournisseur.adresse && (
                            <p className="text-sm text-muted-foreground">
                                {bon.fournisseur.adresse}
                            </p>
                        )}
                        {bon.fournisseur.ville && (
                            <p className="text-sm text-muted-foreground">
                                {bon.fournisseur.ville}
                            </p>
                        )}
                        <Separator />
                        {bon.fournisseur.ice && (
                            <p className="text-sm">
                                <span className="font-medium text-red-600">ICE:</span>{" "}
                                {bon.fournisseur.ice}
                            </p>
                        )}
                        {bon.fournisseur.tel && (
                            <p className="text-sm">
                                <span className="font-medium">Tél:</span>{" "}
                                {bon.fournisseur.tel}
                            </p>
                        )}
                        {bon.fournisseur.email && (
                            <p className="text-sm">
                                <span className="font-medium">Email:</span>{" "}
                                {bon.fournisseur.email}
                            </p>
                        )}
                    </CardContent>
                </Card>
            </div>

            {/* Articles Table */}
            <Card>
                <CardHeader>
                    <CardTitle>Articles ({bon.lignes.length})</CardTitle>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Référence</TableHead>
                                <TableHead>Désignation</TableHead>
                                <TableHead className="text-right">Qté</TableHead>
                                {bon.avecPrix && (
                                    <>
                                        <TableHead className="text-right">Px Unitaire</TableHead>
                                        <TableHead className="text-right">Remise</TableHead>
                                        <TableHead className="text-right">Montant HT</TableHead>
                                    </>
                                )}
                                <TableHead>Dossier</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {bon.lignes.map((l) => (
                                <TableRow key={l.id}>
                                    <TableCell className="font-mono">{l.reference}</TableCell>
                                    <TableCell>{l.designation}</TableCell>
                                    <TableCell className="text-right font-mono">
                                        {l.quantite.toLocaleString("fr-FR", {
                                            minimumFractionDigits: 2,
                                        })}
                                    </TableCell>
                                    {bon.avecPrix && (
                                        <>
                                            <TableCell className="text-right font-mono">
                                                {l.prixUnitaire.toLocaleString("fr-FR", {
                                                    minimumFractionDigits: 2,
                                                })}
                                            </TableCell>
                                            <TableCell className="text-right font-mono">
                                                {l.remise.toLocaleString("fr-FR", {
                                                    minimumFractionDigits: 2,
                                                })}
                                            </TableCell>
                                            <TableCell className="text-right font-mono font-medium">
                                                {l.montantHT.toLocaleString("fr-FR", {
                                                    minimumFractionDigits: 2,
                                                })}
                                            </TableCell>
                                        </>
                                    )}
                                    <TableCell>{l.dossier || "—"}</TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                        {bon.avecPrix && (
                            <TableFooter>
                                <TableRow>
                                    <TableCell colSpan={5} className="text-right font-medium">
                                        Total HT
                                    </TableCell>
                                    <TableCell className="text-right font-mono font-bold">
                                        {bon.totalHT.toLocaleString("fr-FR", {
                                            minimumFractionDigits: 2,
                                        })}{" "}
                                        DH
                                    </TableCell>
                                    <TableCell />
                                </TableRow>
                                <TableRow>
                                    <TableCell colSpan={5} className="text-right font-medium">
                                        TVA ({bon.tauxTVA}%)
                                    </TableCell>
                                    <TableCell className="text-right font-mono">
                                        {bon.totalTVA.toLocaleString("fr-FR", {
                                            minimumFractionDigits: 2,
                                        })}{" "}
                                        DH
                                    </TableCell>
                                    <TableCell />
                                </TableRow>
                                <TableRow>
                                    <TableCell
                                        colSpan={5}
                                        className="text-right font-bold text-lg"
                                    >
                                        Total TTC
                                    </TableCell>
                                    <TableCell className="text-right font-mono font-bold text-lg">
                                        {bon.totalTTC.toLocaleString("fr-FR", {
                                            minimumFractionDigits: 2,
                                        })}{" "}
                                        DH
                                    </TableCell>
                                    <TableCell />
                                </TableRow>
                            </TableFooter>
                        )}
                    </Table>
                </CardContent>
            </Card>

            {/* Remarque */}
            {bon.remarque && (
                <Card>
                    <CardHeader>
                        <CardTitle>Remarque</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-muted-foreground">{bon.remarque}</p>
                    </CardContent>
                </Card>
            )}
        </div>
    );
}
