import { Suspense } from "react";
import Link from "next/link";
import { GraduationCap, Star, CheckCircle2, XCircle } from "lucide-react";
import { PageHeader } from "@/components/ui/page-header";
import { SkeletonTable } from "@/components/ui/skeleton";
import { Card, CardContent } from "@/components/ui/card";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Avatar } from "@/components/ui/avatar";
import { EmptyState } from "@/components/ui/empty-state";
import { createClient } from "@/lib/supabase/server";
import { getProfilCourant } from "@/lib/auth";
import { canEdit } from "@/lib/roles";
import { formatDate } from "@/lib/utils";
import { BoutonNouveauStagiaire } from "./_components/bouton-nouveau";
import { chargerMaitresOptions } from "./_lib/donnees";

export const dynamic = "force-dynamic";

interface LigneStagiaire {
  id: string;
  nom: string;
  prenom: string;
  universite: string | null;
  annee_etude: string | null;
  date_debut: string | null;
  date_fin: string | null;
  note_globale: number | null;
  actif: boolean;
  maitre: { nom: string; prenom: string } | null;
}

async function ListeStagiaires() {
  const supabase = createClient();
  const aujourdHui = new Date().toISOString().slice(0, 10);

  const [stagRes, presRes] = await Promise.all([
    supabase
      .from("stagiaires")
      .select(
        "id, nom, prenom, universite, annee_etude, date_debut, date_fin, note_globale, actif, maitre:profiles!stagiaires_maitre_stage_id_fkey(nom, prenom)",
      )
      .order("actif", { ascending: false })
      .order("nom", { ascending: true }),
    supabase
      .from("presences_stagiaires")
      .select("stagiaire_id, present")
      .eq("date", aujourdHui),
  ]);

  const stagiaires = (stagRes.data ?? []) as unknown as LigneStagiaire[];
  const presenceParStagiaire = new Map<string, boolean>();
  for (const p of (presRes.data ?? []) as Array<{
    stagiaire_id: string;
    present: boolean;
  }>) {
    presenceParStagiaire.set(p.stagiaire_id, p.present);
  }

  if (stagiaires.length === 0) {
    return (
      <EmptyState
        titre="Aucun stagiaire"
        description="Ajoutez votre premier stagiaire pour suivre présences et évaluations."
        icone={GraduationCap}
      />
    );
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Stagiaire</TableHead>
          <TableHead>Université</TableHead>
          <TableHead>Période</TableHead>
          <TableHead>Maître de stage</TableHead>
          <TableHead className="text-center">Aujourd&apos;hui</TableHead>
          <TableHead className="text-right">Note</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {stagiaires.map((s) => {
          const present = presenceParStagiaire.get(s.id);
          return (
            <TableRow key={s.id}>
              <TableCell>
                <Link
                  href={`/stagiaires/${s.id}`}
                  className="flex items-center gap-3 hover:underline"
                >
                  <Avatar prenom={s.prenom} nom={s.nom} taille="sm" />
                  <div className="min-w-0">
                    <p className="truncate font-medium text-foreground">
                      {s.prenom} {s.nom}
                      {!s.actif && (
                        <Badge ton="neutre" className="ml-2">
                          Terminé
                        </Badge>
                      )}
                    </p>
                    {s.annee_etude && (
                      <p className="truncate text-xs text-muted-foreground">
                        {s.annee_etude}
                      </p>
                    )}
                  </div>
                </Link>
              </TableCell>
              <TableCell className="text-muted-foreground">
                {s.universite ?? "—"}
              </TableCell>
              <TableCell className="text-muted-foreground">
                {s.date_debut && s.date_fin
                  ? `${formatDate(s.date_debut)} → ${formatDate(s.date_fin)}`
                  : "—"}
              </TableCell>
              <TableCell className="text-muted-foreground">
                {s.maitre ? `${s.maitre.prenom} ${s.maitre.nom}` : "—"}
              </TableCell>
              <TableCell className="text-center">
                {present === undefined ? (
                  <span className="text-xs text-muted-foreground">
                    Non pointé
                  </span>
                ) : present ? (
                  <span className="inline-flex items-center gap-1 text-xs font-medium text-success">
                    <CheckCircle2 className="h-4 w-4" /> Présent
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 text-xs font-medium text-danger">
                    <XCircle className="h-4 w-4" /> Absent
                  </span>
                )}
              </TableCell>
              <TableCell className="text-right">
                {s.note_globale != null ? (
                  <span className="inline-flex items-center gap-1 font-medium text-foreground">
                    <Star className="h-3.5 w-3.5 fill-warning text-warning" />
                    {s.note_globale.toFixed(1)}/5
                  </span>
                ) : (
                  <span className="text-muted-foreground">—</span>
                )}
              </TableCell>
            </TableRow>
          );
        })}
      </TableBody>
    </Table>
  );
}

export default async function StagiairesPage() {
  const [profil, maitres] = await Promise.all([
    getProfilCourant(),
    chargerMaitresOptions(),
  ]);
  const peutEditer = canEdit(profil?.role, "stagiaires");

  return (
    <div>
      <PageHeader
        titre="Stagiaires"
        description="Suivi des stagiaires : présences, dossiers, évaluations et attestations."
        actions={
          peutEditer ? <BoutonNouveauStagiaire maitres={maitres} /> : undefined
        }
      />
      <Card>
        <CardContent className="pt-6">
          <Suspense fallback={<SkeletonTable lignes={4} colonnes={6} />}>
            <ListeStagiaires />
          </Suspense>
        </CardContent>
      </Card>
    </div>
  );
}
