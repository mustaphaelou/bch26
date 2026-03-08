"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
} from "@/components/ui/table";
import { toast } from "sonner";
import {
    Add01Icon,
    Edit02Icon,
    Delete02Icon,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";

interface Fournisseur {
    id: string;
    nom: string;
    adresse: string | null;
    ville: string | null;
    ice: string | null;
    tel: string | null;
    fax: string | null;
    email: string | null;
}

const emptyFournisseur = {
    nom: "",
    adresse: "",
    ville: "",
    ice: "",
    tel: "",
    fax: "",
    email: "",
};

export default function FournisseursPage() {
    const [fournisseurs, setFournisseurs] = useState<Fournisseur[]>([]);
    const [loading, setLoading] = useState(true);
    const [dialogOpen, setDialogOpen] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [form, setForm] = useState(emptyFournisseur);

    async function fetchFournisseurs() {
        setLoading(true);
        try {
            const res = await fetch("/api/fournisseurs");
            const data = await res.json();
            setFournisseurs(data);
        } catch {
            toast.error("Erreur lors du chargement");
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => {
        fetchFournisseurs();
    }, []);

    function openNew() {
        setEditingId(null);
        setForm(emptyFournisseur);
        setDialogOpen(true);
    }

    function openEdit(f: Fournisseur) {
        setEditingId(f.id);
        setForm({
            nom: f.nom,
            adresse: f.adresse || "",
            ville: f.ville || "",
            ice: f.ice || "",
            tel: f.tel || "",
            fax: f.fax || "",
            email: f.email || "",
        });
        setDialogOpen(true);
    }

    async function handleSave() {
        if (!form.nom) {
            toast.error("Le nom est obligatoire");
            return;
        }

        try {
            const url = editingId
                ? `/api/fournisseurs/${editingId}`
                : "/api/fournisseurs";
            const method = editingId ? "PUT" : "POST";

            const res = await fetch(url, {
                method,
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(form),
            });

            if (!res.ok) throw new Error();

            toast.success(
                editingId ? "Fournisseur modifié" : "Fournisseur créé"
            );
            setDialogOpen(false);
            fetchFournisseurs();
        } catch {
            toast.error("Erreur lors de la sauvegarde");
        }
    }

    async function handleDelete(id: string, nom: string) {
        if (!confirm(`Supprimer le fournisseur "${nom}" ?`)) return;
        try {
            const res = await fetch(`/api/fournisseurs/${id}`, {
                method: "DELETE",
            });
            if (!res.ok) throw new Error();
            toast.success("Fournisseur supprimé");
            fetchFournisseurs();
        } catch {
            toast.error(
                "Impossible de supprimer. Ce fournisseur est peut-être lié à des bons de commande."
            );
        }
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h1 className="text-2xl font-bold">Fournisseurs</h1>
                <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                    <DialogTrigger asChild>
                        <Button onClick={openNew}>
                            <HugeiconsIcon icon={Add01Icon} size={16} />
                            Nouveau Fournisseur
                        </Button>
                    </DialogTrigger>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>
                                {editingId ? "Modifier le Fournisseur" : "Nouveau Fournisseur"}
                            </DialogTitle>
                        </DialogHeader>
                        <div className="space-y-4 mt-4">
                            <div className="space-y-2">
                                <Label>Nom *</Label>
                                <Input
                                    value={form.nom}
                                    onChange={(e) =>
                                        setForm((p) => ({ ...p, nom: e.target.value }))
                                    }
                                    placeholder="Nom du fournisseur"
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label>Adresse</Label>
                                    <Input
                                        value={form.adresse}
                                        onChange={(e) =>
                                            setForm((p) => ({ ...p, adresse: e.target.value }))
                                        }
                                        placeholder="Adresse"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label>Ville</Label>
                                    <Input
                                        value={form.ville}
                                        onChange={(e) =>
                                            setForm((p) => ({ ...p, ville: e.target.value }))
                                        }
                                        placeholder="Ville"
                                    />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <Label>ICE</Label>
                                <Input
                                    value={form.ice}
                                    onChange={(e) =>
                                        setForm((p) => ({ ...p, ice: e.target.value }))
                                    }
                                    placeholder="N° ICE"
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label>Téléphone</Label>
                                    <Input
                                        value={form.tel}
                                        onChange={(e) =>
                                            setForm((p) => ({ ...p, tel: e.target.value }))
                                        }
                                        placeholder="Téléphone"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label>Fax</Label>
                                    <Input
                                        value={form.fax}
                                        onChange={(e) =>
                                            setForm((p) => ({ ...p, fax: e.target.value }))
                                        }
                                        placeholder="Fax"
                                    />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <Label>Email</Label>
                                <Input
                                    type="email"
                                    value={form.email}
                                    onChange={(e) =>
                                        setForm((p) => ({ ...p, email: e.target.value }))
                                    }
                                    placeholder="email@exemple.com"
                                />
                            </div>
                            <Button className="w-full" onClick={handleSave}>
                                {editingId ? "Enregistrer les Modifications" : "Créer le Fournisseur"}
                            </Button>
                        </div>
                    </DialogContent>
                </Dialog>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>
                        Liste des Fournisseurs ({fournisseurs.length})
                    </CardTitle>
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
                    ) : fournisseurs.length === 0 ? (
                        <div className="text-center py-12 text-muted-foreground">
                            <p>Aucun fournisseur enregistré</p>
                        </div>
                    ) : (
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Nom</TableHead>
                                    <TableHead>Ville</TableHead>
                                    <TableHead>ICE</TableHead>
                                    <TableHead>Téléphone</TableHead>
                                    <TableHead>Email</TableHead>
                                    <TableHead className="text-right">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {fournisseurs.map((f) => (
                                    <TableRow key={f.id}>
                                        <TableCell className="font-medium">{f.nom}</TableCell>
                                        <TableCell>{f.ville || "—"}</TableCell>
                                        <TableCell className="font-mono text-sm">
                                            {f.ice || "—"}
                                        </TableCell>
                                        <TableCell>{f.tel || "—"}</TableCell>
                                        <TableCell>{f.email || "—"}</TableCell>
                                        <TableCell className="text-right">
                                            <div className="flex justify-end gap-1">
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={() => openEdit(f)}
                                                >
                                                    <HugeiconsIcon icon={Edit02Icon} size={14} />
                                                </Button>
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={() => handleDelete(f.id, f.nom)}
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
