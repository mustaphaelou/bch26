"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { Add01Icon, Search01Icon, Delete02Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { toast } from "sonner";

interface BonDeCommande {
    id: string;
    numero: string;
    dateCommande: string;
    numeroDevis: string;
    avecPrix: boolean;
    totalHT: number;
    totalTVA: number;
    totalTTC: number;
    statut: "BROUILLON" | "VALIDE";
    fournisseur: { nom: string };
    lignes: unknown[];
}

export default function BonsListPage() {
    const [bons, setBons] = useState<BonDeCommande[]>([]);
    const [search, setSearch] = useState("");
    const [loading, setLoading] = useState(true);

    async function fetchBons(searchQuery?: string) {
        setLoading(true);
        try {
            const params = new URLSearchParams();
            if (searchQuery) params.set("search", searchQuery);
            const res = await fetch(`/api/bons?${params}`);
            const data = await res.json();
            setBons(data.bons || []);
        } catch {
            toast.error("Erreur lors du chargement des bons de commande");
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => {
        fetchBons();
    }, []);

    async function handleDelete(id: string, numero: string) {
        if (!confirm(`Supprimer le bon de commande ${numero} ?`)) return;
        try {
            await fetch(`/api/bons/${id}`, { method: "DELETE" });
            toast.success(`BC ${numero} supprimé`);
            fetchBons(search);
        } catch {
            toast.error("Erreur lors de la suppression");
        }
    }

    async function handleSearch() {
        fetchBons(search);
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h1 className="text-2xl font-bold">Bons de Commande</h1>
                <Button asChild>
                    <Link href="/bons/nouveau">
                        <HugeiconsIcon icon={Add01Icon} size={16} />
                        Nouveau BC
                    </Link>
                </Button>
            </div>

            {/* Search */}
            <div className="flex gap-2">
                <Input
                    placeholder="Rechercher par numéro ou fournisseur..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                    className="max-w-md"
                />
                <Button variant="outline" onClick={handleSearch}>
                    <HugeiconsIcon icon={Search01Icon} size={16} />
                    Rechercher
                </Button>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Liste des Bons de Commande</CardTitle>
                </CardHeader>
                <CardContent>
                    {loading ? (
                        <div className="space-y-3">
                            {[1, 2, 3].map((i) => (
                                <div
                                    key={i}
                                    className="h-12 animate-pulse rounded bg-muted"
                                />
                            ))}
                        </div>
                    ) : bons.length === 0 ? (
                        <div className="text-center py-12 text-muted-foreground">
                            <p className="text-lg">Aucun bon de commande trouvé</p>
                            <Button asChild variant="outline" className="mt-4">
                                <Link href="/bons/nouveau">Créer un BC</Link>
                            </Button>
                        </div>
                    ) : (
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>N° BC</TableHead>
                                    <TableHead>Date</TableHead>
                                    <TableHead>N° Devis</TableHead>
                                    <TableHead>Fournisseur</TableHead>
                                    <TableHead>Articles</TableHead>
                                    <TableHead>Prix</TableHead>
                                    <TableHead className="text-right">Total TTC</TableHead>
                                    <TableHead>Statut</TableHead>
                                    <TableHead className="text-right">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {bons.map((bon) => (
                                    <TableRow key={bon.id}>
                                        <TableCell>
                                            <Link
                                                href={`/bons/${bon.id}`}
                                                className="font-medium text-primary hover:underline"
                                            >
                                                {bon.numero}
                                            </Link>
                                        </TableCell>
                                        <TableCell>
                                            {format(new Date(bon.dateCommande), "dd/MM/yyyy", {
                                                locale: fr,
                                            })}
                                        </TableCell>
                                        <TableCell>{bon.numeroDevis || "—"}</TableCell>
                                        <TableCell>{bon.fournisseur.nom}</TableCell>
                                        <TableCell>{bon.lignes.length}</TableCell>
                                        <TableCell>
                                            <Badge
                                                variant={bon.avecPrix ? "default" : "secondary"}
                                            >
                                                {bon.avecPrix ? "Avec Prix" : "Sans Prix"}
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="text-right font-mono">
                                            {bon.avecPrix
                                                ? `${bon.totalTTC.toLocaleString("fr-FR", {
                                                    minimumFractionDigits: 2,
                                                })} DH`
                                                : "—"}
                                        </TableCell>
                                        <TableCell>
                                            <Badge
                                                variant={
                                                    bon.statut === "VALIDE" ? "default" : "outline"
                                                }
                                            >
                                                {bon.statut === "VALIDE" ? "Validé" : "Brouillon"}
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <div className="flex justify-end gap-1">
                                                <Button variant="ghost" size="sm" asChild>
                                                    <Link href={`/bons/${bon.id}`}>Voir</Link>
                                                </Button>
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={() => handleDelete(bon.id, bon.numero)}
                                                    className="text-destructive hover:text-destructive"
                                                >
                                                    <HugeiconsIcon icon={Delete02Icon} size={14} />
                                                </Button>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
