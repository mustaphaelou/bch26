"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
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
import { Add01Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";

interface BonDeCommande {
  id: string;
  numero: string;
  dateCommande: string;
  avecPrix: boolean;
  totalTTC: number;
  statut: "BROUILLON" | "VALIDE";
  fournisseur: { nom: string };
}

export default function DashboardPage() {
  const [bons, setBons] = useState<BonDeCommande[]>([]);
  const [stats, setStats] = useState({ total: 0, moisEnCours: 0, montantTotal: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      try {
        const res = await fetch("/api/bons?limit=10");
        const data = await res.json();
        setBons(data.bons || []);

        const total = data.total || 0;
        const montantTotal = (data.bons || []).reduce(
          (sum: number, b: BonDeCommande) => sum + b.totalTTC,
          0
        );
        const now = new Date();
        const moisEnCours = (data.bons || []).filter((b: BonDeCommande) => {
          const d = new Date(b.dateCommande);
          return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
        }).length;

        setStats({ total, moisEnCours, montantTotal });
      } catch (error) {
        console.error("Erreur chargement dashboard:", error);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold">Tableau de Bord</h1>
        <div className="grid gap-4 md:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <Card key={i}>
              <CardContent className="p-6">
                <div className="h-16 animate-pulse rounded bg-muted" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Tableau de Bord</h1>
        <Button asChild>
          <Link href="/bons/nouveau">
            <HugeiconsIcon icon={Add01Icon} size={16} />
            Nouveau Bon de Commande
          </Link>
        </Button>
      </div>

      {/* KPI Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total des BC
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{stats.total}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              BC ce mois
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{stats.moisEnCours}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Montant Total (TTC)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">
              {stats.montantTotal.toLocaleString("fr-FR", {
                minimumFractionDigits: 2,
              })}{" "}
              <span className="text-sm font-normal text-muted-foreground">
                DH
              </span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent BC Table */}
      <Card>
        <CardHeader>
          <CardTitle>Derniers Bons de Commande</CardTitle>
        </CardHeader>
        <CardContent>
          {bons.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <p>Aucun bon de commande pour le moment.</p>
              <Button asChild variant="outline" className="mt-4">
                <Link href="/bons/nouveau">Créer votre premier BC</Link>
              </Button>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>N° BC</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Fournisseur</TableHead>
                  <TableHead>Prix</TableHead>
                  <TableHead className="text-right">Total TTC</TableHead>
                  <TableHead>Statut</TableHead>
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
                    <TableCell>{bon.fournisseur.nom}</TableCell>
                    <TableCell>
                      <Badge variant={bon.avecPrix ? "default" : "secondary"}>
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
