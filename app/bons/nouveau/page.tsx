"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
    TableFooter,
} from "@/components/ui/table";
import { toast } from "sonner";
import {
    Add01Icon,
    Delete02Icon,
    Upload04Icon,
    ArrowLeft02Icon,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import Link from "next/link";

interface Fournisseur {
    id: string;
    nom: string;
    adresse: string;
    ville: string;
    ice: string;
    tel: string;
    fax: string;
    email: string;
}

interface LigneArticle {
    reference: string;
    designation: string;
    quantite: number;
    prixUnitaire: number;
    remise: number;
    dossier: string;
}

const emptyLigne: LigneArticle = {
    reference: "",
    designation: "",
    quantite: 0,
    prixUnitaire: 0,
    remise: 0,
    dossier: "",
};

export default function NouveauBonPage() {
    const router = useRouter();

    // Form state
    const [avecPrix, setAvecPrix] = useState(true);
    const [dateCommande, setDateCommande] = useState(
        new Date().toISOString().split("T")[0]
    );
    const [numeroDevis, setNumeroDevis] = useState("");
    const [fournisseurId, setFournisseurId] = useState("");
    const [responsable, setResponsable] = useState("Oubaha Abdelali");
    const [tauxTVA, setTauxTVA] = useState(20);
    const [remarque, setRemarque] = useState("");
    const [lignes, setLignes] = useState<LigneArticle[]>([{ ...emptyLigne }]);
    const [submitting, setSubmitting] = useState(false);

    // Fournisseurs
    const [fournisseurs, setFournisseurs] = useState<Fournisseur[]>([]);
    const [showNewFournisseur, setShowNewFournisseur] = useState(false);
    const [newFournisseur, setNewFournisseur] = useState<Partial<Fournisseur>>({});

    // Excel import
    const [importLoading, setImportLoading] = useState(false);

    useEffect(() => {
        fetch("/api/fournisseurs")
            .then(async (r) => {
                const data = await r.json();
                if (!r.ok) {
                    throw new Error(data.error || "Erreur chargement fournisseurs");
                }
                if (Array.isArray(data)) {
                    setFournisseurs(data);
                } else {
                    console.error("Data is not an array:", data);
                    setFournisseurs([]);
                }
            })
            .catch((err) => {
                console.error(err);
                toast.error(err.message || "Erreur chargement fournisseurs");
                setFournisseurs([]);
            });
    }, []);

    // Ligne calculations
    const calculerMontantHT = useCallback(
        (l: LigneArticle) => {
            if (!avecPrix) return 0;
            const brut = l.quantite * l.prixUnitaire;
            return brut - brut * (l.remise / 100);
        },
        [avecPrix]
    );

    const totalHT = lignes.reduce((sum, l) => sum + calculerMontantHT(l), 0);
    const totalTVA = totalHT * (tauxTVA / 100);
    const totalTTC = totalHT + totalTVA;

    function updateLigne(index: number, field: keyof LigneArticle, value: string | number) {
        setLignes((prev) => {
            const updated = [...prev];
            updated[index] = { ...updated[index], [field]: value };
            return updated;
        });
    }

    function addLigne() {
        setLignes((prev) => [...prev, { ...emptyLigne }]);
    }

    function removeLigne(index: number) {
        if (lignes.length === 1) return;
        setLignes((prev) => prev.filter((_, i) => i !== index));
    }

    // Excel Import
    async function handleImportExcel(e: React.ChangeEvent<HTMLInputElement>) {
        const file = e.target.files?.[0];
        if (!file) return;

        setImportLoading(true);
        try {
            const formData = new FormData();
            formData.append("file", file);

            const res = await fetch("/api/import", {
                method: "POST",
                body: formData,
            });

            const data = await res.json();
            if (!res.ok) {
                toast.error(data.error || "Erreur d'importation");
                return;
            }

            setLignes(data.lignes);
            toast.success(`${data.count} lignes importées avec succès`);
        } catch {
            toast.error("Erreur lors de l'importation du fichier");
        } finally {
            setImportLoading(false);
            e.target.value = "";
        }
    }

    // Create new fournisseur
    async function handleCreateFournisseur() {
        if (!newFournisseur.nom) {
            toast.error("Le nom du fournisseur est obligatoire");
            return;
        }

        try {
            const res = await fetch("/api/fournisseurs", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(newFournisseur),
            });

            const created = await res.json();
            setFournisseurs((prev) => [...prev, created]);
            setFournisseurId(created.id);
            setShowNewFournisseur(false);
            setNewFournisseur({});
            toast.success("Fournisseur créé avec succès");
        } catch {
            toast.error("Erreur lors de la création du fournisseur");
        }
    }

    // Submit BC
    async function handleSubmit() {
        if (!fournisseurId) {
            toast.error("Veuillez sélectionner un fournisseur");
            return;
        }

        const validLignes = lignes.filter((l) => l.reference || l.designation);
        if (validLignes.length === 0) {
            toast.error("Ajoutez au moins une ligne d'article");
            return;
        }

        setSubmitting(true);
        try {
            const res = await fetch("/api/bons", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    dateCommande,
                    numeroDevis,
                    fournisseurId,
                    avecPrix,
                    remarque,
                    responsable,
                    tauxTVA,
                    lignes: validLignes,
                }),
            });

            const data = await res.json();
            if (!res.ok) {
                toast.error(data.error || "Erreur lors de la création");
                return;
            }

            toast.success(`Bon de commande ${data.numero} créé avec succès`);
            router.push(`/bons/${data.id}`);
        } catch {
            toast.error("Erreur lors de la création du bon de commande");
        } finally {
            setSubmitting(false);
        }
    }

    return (
        <div className="space-y-6 max-w-6xl">
            {/* Header */}
            <div className="flex items-center gap-4">
                <Button variant="ghost" size="sm" asChild>
                    <Link href="/bons">
                        <HugeiconsIcon icon={ArrowLeft02Icon} size={16} />
                        Retour
                    </Link>
                </Button>
                <h1 className="text-2xl font-bold">Nouveau Bon de Commande</h1>
            </div>

            {/* Switch: Avec/Sans Prix */}
            <Card>
                <CardContent className="flex items-center justify-between py-4">
                    <div>
                        <Label className="text-base font-medium">Type de Bon de Commande</Label>
                        <p className="text-sm text-muted-foreground mt-1">
                            {avecPrix
                                ? "Les colonnes de prix, remise et montants seront affichées"
                                : "Seules les références, désignations et quantités seront affichées"}
                        </p>
                    </div>
                    <div className="flex items-center gap-3">
                        <span className="text-sm text-muted-foreground">Sans Prix</span>
                        <Switch checked={avecPrix} onCheckedChange={setAvecPrix} />
                        <span className="text-sm font-medium">Avec Prix</span>
                    </div>
                </CardContent>
            </Card>

            {/* BC Info */}
            <Card>
                <CardHeader>
                    <CardTitle>Informations du Bon de Commande</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="date">Date de Commande</Label>
                            <Input
                                id="date"
                                type="date"
                                value={dateCommande}
                                onChange={(e) => setDateCommande(e.target.value)}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="devis">N° Devis</Label>
                            <Input
                                id="devis"
                                placeholder="Ex: 003677"
                                value={numeroDevis}
                                onChange={(e) => setNumeroDevis(e.target.value)}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="responsable">Responsable des Achats</Label>
                            <Input
                                id="responsable"
                                value={responsable}
                                onChange={(e) => setResponsable(e.target.value)}
                            />
                        </div>
                    </div>

                    {avecPrix && (
                        <div className="w-48 space-y-2">
                            <Label htmlFor="tva">Taux TVA (%)</Label>
                            <Input
                                id="tva"
                                type="number"
                                min={0}
                                max={100}
                                value={tauxTVA}
                                onChange={(e) => setTauxTVA(parseFloat(e.target.value) || 0)}
                            />
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Fournisseur */}
            <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                    <CardTitle>Fournisseur</CardTitle>
                    <Dialog open={showNewFournisseur} onOpenChange={setShowNewFournisseur}>
                        <DialogTrigger asChild>
                            <Button variant="outline" size="sm">
                                <HugeiconsIcon icon={Add01Icon} size={14} />
                                Nouveau Fournisseur
                            </Button>
                        </DialogTrigger>
                        <DialogContent>
                            <DialogHeader>
                                <DialogTitle>Ajouter un Fournisseur</DialogTitle>
                            </DialogHeader>
                            <div className="space-y-4 mt-4">
                                <div className="space-y-2">
                                    <Label>Nom *</Label>
                                    <Input
                                        value={newFournisseur.nom || ""}
                                        onChange={(e) =>
                                            setNewFournisseur((p) => ({ ...p, nom: e.target.value }))
                                        }
                                        placeholder="Nom du fournisseur"
                                    />
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label>Adresse</Label>
                                        <Input
                                            value={newFournisseur.adresse || ""}
                                            onChange={(e) =>
                                                setNewFournisseur((p) => ({ ...p, adresse: e.target.value }))
                                            }
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Ville</Label>
                                        <Input
                                            value={newFournisseur.ville || ""}
                                            onChange={(e) =>
                                                setNewFournisseur((p) => ({ ...p, ville: e.target.value }))
                                            }
                                        />
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <Label>ICE</Label>
                                    <Input
                                        value={newFournisseur.ice || ""}
                                        onChange={(e) =>
                                            setNewFournisseur((p) => ({ ...p, ice: e.target.value }))
                                        }
                                    />
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label>Téléphone</Label>
                                        <Input
                                            value={newFournisseur.tel || ""}
                                            onChange={(e) =>
                                                setNewFournisseur((p) => ({ ...p, tel: e.target.value }))
                                            }
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Fax</Label>
                                        <Input
                                            value={newFournisseur.fax || ""}
                                            onChange={(e) =>
                                                setNewFournisseur((p) => ({ ...p, fax: e.target.value }))
                                            }
                                        />
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <Label>Email</Label>
                                    <Input
                                        type="email"
                                        value={newFournisseur.email || ""}
                                        onChange={(e) =>
                                            setNewFournisseur((p) => ({ ...p, email: e.target.value }))
                                        }
                                    />
                                </div>
                                <Button className="w-full" onClick={handleCreateFournisseur}>
                                    Créer le Fournisseur
                                </Button>
                            </div>
                        </DialogContent>
                    </Dialog>
                </CardHeader>
                <CardContent>
                    <Select value={fournisseurId} onValueChange={setFournisseurId}>
                        <SelectTrigger>
                            <SelectValue placeholder="Sélectionnez un fournisseur" />
                        </SelectTrigger>
                        <SelectContent>
                            {fournisseurs.map((f) => (
                                <SelectItem key={f.id} value={f.id}>
                                    {f.nom} {f.ville ? `— ${f.ville}` : ""}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </CardContent>
            </Card>

            {/* Articles */}
            <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                    <CardTitle>Articles</CardTitle>
                    <div className="flex gap-2">
                        <Button variant="outline" size="sm" asChild>
                            <label className="cursor-pointer">
                                <HugeiconsIcon icon={Upload04Icon} size={14} />
                                {importLoading ? "Importation..." : "Importer Excel"}
                                <input
                                    type="file"
                                    accept=".xlsx,.xls"
                                    className="hidden"
                                    onChange={handleImportExcel}
                                    disabled={importLoading}
                                />
                            </label>
                        </Button>
                        <Button variant="outline" size="sm" onClick={addLigne}>
                            <HugeiconsIcon icon={Add01Icon} size={14} />
                            Ajouter Ligne
                        </Button>
                    </div>
                </CardHeader>
                <CardContent>
                    <div className="overflow-x-auto">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead className="w-28">Référence</TableHead>
                                    <TableHead>Désignation</TableHead>
                                    <TableHead className="w-20">Qté</TableHead>
                                    {avecPrix && (
                                        <>
                                            <TableHead className="w-28">Px Unitaire</TableHead>
                                            <TableHead className="w-20">Remise %</TableHead>
                                            <TableHead className="w-28 text-right">Montant HT</TableHead>
                                        </>
                                    )}
                                    <TableHead className="w-20">Dossier</TableHead>
                                    <TableHead className="w-10"></TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {lignes.map((ligne, idx) => {
                                    const montantHT = calculerMontantHT(ligne);
                                    return (
                                        <TableRow key={idx}>
                                            <TableCell>
                                                <Input
                                                    value={ligne.reference}
                                                    onChange={(e) =>
                                                        updateLigne(idx, "reference", e.target.value)
                                                    }
                                                    placeholder="Réf."
                                                    className="h-8"
                                                />
                                            </TableCell>
                                            <TableCell>
                                                <Input
                                                    value={ligne.designation}
                                                    onChange={(e) =>
                                                        updateLigne(idx, "designation", e.target.value)
                                                    }
                                                    placeholder="Désignation de l'article"
                                                    className="h-8"
                                                />
                                            </TableCell>
                                            <TableCell>
                                                <Input
                                                    type="number"
                                                    min={0}
                                                    value={ligne.quantite || ""}
                                                    onChange={(e) =>
                                                        updateLigne(
                                                            idx,
                                                            "quantite",
                                                            parseFloat(e.target.value) || 0
                                                        )
                                                    }
                                                    className="h-8"
                                                />
                                            </TableCell>
                                            {avecPrix && (
                                                <>
                                                    <TableCell>
                                                        <Input
                                                            type="number"
                                                            min={0}
                                                            step={0.01}
                                                            value={ligne.prixUnitaire || ""}
                                                            onChange={(e) =>
                                                                updateLigne(
                                                                    idx,
                                                                    "prixUnitaire",
                                                                    parseFloat(e.target.value) || 0
                                                                )
                                                            }
                                                            className="h-8"
                                                        />
                                                    </TableCell>
                                                    <TableCell>
                                                        <Input
                                                            type="number"
                                                            min={0}
                                                            max={100}
                                                            value={ligne.remise || ""}
                                                            onChange={(e) =>
                                                                updateLigne(
                                                                    idx,
                                                                    "remise",
                                                                    parseFloat(e.target.value) || 0
                                                                )
                                                            }
                                                            className="h-8"
                                                        />
                                                    </TableCell>
                                                    <TableCell className="text-right font-mono text-sm">
                                                        {montantHT.toLocaleString("fr-FR", {
                                                            minimumFractionDigits: 2,
                                                        })}
                                                    </TableCell>
                                                </>
                                            )}
                                            <TableCell>
                                                <Input
                                                    value={ligne.dossier}
                                                    onChange={(e) =>
                                                        updateLigne(idx, "dossier", e.target.value)
                                                    }
                                                    placeholder="D20"
                                                    className="h-8"
                                                />
                                            </TableCell>
                                            <TableCell>
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={() => removeLigne(idx)}
                                                    disabled={lignes.length === 1}
                                                    className="text-destructive hover:text-destructive h-8 w-8 p-0"
                                                >
                                                    <HugeiconsIcon icon={Delete02Icon} size={14} />
                                                </Button>
                                            </TableCell>
                                        </TableRow>
                                    );
                                })}
                            </TableBody>
                            {avecPrix && (
                                <TableFooter>
                                    <TableRow>
                                        <TableCell colSpan={5} className="text-right font-medium">
                                            Total HT :
                                        </TableCell>
                                        <TableCell className="text-right font-mono font-bold">
                                            {totalHT.toLocaleString("fr-FR", {
                                                minimumFractionDigits: 2,
                                            })}
                                        </TableCell>
                                        <TableCell colSpan={2} className="text-sm text-muted-foreground">
                                            DH
                                        </TableCell>
                                    </TableRow>
                                    <TableRow>
                                        <TableCell colSpan={5} className="text-right font-medium">
                                            TVA ({tauxTVA}%) :
                                        </TableCell>
                                        <TableCell className="text-right font-mono">
                                            {totalTVA.toLocaleString("fr-FR", {
                                                minimumFractionDigits: 2,
                                            })}
                                        </TableCell>
                                        <TableCell colSpan={2} className="text-sm text-muted-foreground">
                                            DH
                                        </TableCell>
                                    </TableRow>
                                    <TableRow>
                                        <TableCell colSpan={5} className="text-right font-bold text-lg">
                                            Total TTC :
                                        </TableCell>
                                        <TableCell className="text-right font-mono font-bold text-lg">
                                            {totalTTC.toLocaleString("fr-FR", {
                                                minimumFractionDigits: 2,
                                            })}
                                        </TableCell>
                                        <TableCell colSpan={2} className="text-sm font-bold">
                                            DH
                                        </TableCell>
                                    </TableRow>
                                </TableFooter>
                            )}
                        </Table>
                    </div>
                </CardContent>
            </Card>

            {/* Remarque */}
            <Card>
                <CardHeader>
                    <CardTitle>Remarque</CardTitle>
                </CardHeader>
                <CardContent>
                    <Textarea
                        placeholder="Remarques ou observations..."
                        value={remarque}
                        onChange={(e) => setRemarque(e.target.value)}
                        rows={3}
                    />
                </CardContent>
            </Card>

            <Separator />

            {/* Actions */}
            <div className="flex justify-end gap-3">
                <Button variant="outline" asChild>
                    <Link href="/bons">Annuler</Link>
                </Button>
                <Button onClick={handleSubmit} disabled={submitting}>
                    {submitting ? "Création en cours..." : "Créer le Bon de Commande"}
                </Button>
            </div>
        </div>
    );
}
