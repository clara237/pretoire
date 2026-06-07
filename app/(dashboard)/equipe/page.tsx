import { Suspense } from "react";
import Link from "next/link";
import { UsersRound } from "lucide-react";
import { PageHeader } from "@/components/ui/page-header";
import { SkeletonTable } from "@/components/ui/skeleton";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/components/ui/table";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar } from "@/components/ui/avatar";
import { EmptyState } from "@/components/ui/empty-state";
import { createClient } from "@/lib/supabase/server";
import { LIBELLES_ROLES, type Role } from "@/lib/roles";
import { formatHeures, formatFCFA } from "@/lib/utils";
import { bornesMoisCourant } from "./_lib/charge";

export const dynamic = "force-dynamic";

interface LigneAvocat {
  id: string;
  nom: string;
  prenom: string;
  email: string;
  role: Role;
  photo_url: string | null;
  taux_horaire: number | null;
  specialites: string[] | null;
  actif: boolean;
}

async function ListeAvocats() {
  const supabase = createClient();
  const { debut, fin } = bornesMoisCourant();

  const { data } = await supabase
    .from("profiles")
    .select(
      "id, nom, prenom, email, role, photo_url, taux_horaire, specialites, actif",
    )
    .order("actif", { ascending: false })
    .order("nom", { ascending: true });

  const avocats = (data ?? []) as LigneAvocat[];

  if (avocats.length === 0) {
    return (
      <EmptyState
        titre="Aucun membre"
        description="Les membres de l'équipe apparaîtront ici."
        icone={UsersRound}
      />
    );
  }

  // Charges en parallèle : dossiers actifs + heures facturables du mois par profil
  const [dossiersRes, heuresRes] = await Promise.all([
    supabase
      .from("dossiers")
      .select("avocat_responsable_id, statut")
      .in("statut", ["ouvert", "en_cours", "suspendu"]),
    supabase
      .from("saisies_temps")
      .select("profile_id, duree_heures, facturable, date")
      .gte("date", debut)
      .lte("date", fin),
  ]);

  const dossiersParAvocat = new Map<string, number>();
  for (const d of (dossiersRes.data ?? []) as Array<{
    avocat_responsable_id: string | null;
  }>) {
    if (!d.avocat_responsable_id) continue;
    dossiersParAvocat.set(
      d.avocat_responsable_id,
      (dossiersParAvocat.get(d.avocat_responsable_id) ?? 0) + 1,
    );
  }

  const heuresParAvocat = new Map<string, number>();
  for (const s of (heuresRes.data ?? []) as Array<{
    profile_id: string;
    duree_heures: number | null;
    facturable: boolean | null;
  }>) {
    if (!s.facturable) continue;
    heuresParAvocat.set(
      s.profile_id,
      (heuresParAvocat.get(s.profile_id) ?? 0) + (s.duree_heures ?? 0),
    );
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Membre</TableHead>
          <TableHead>Rôle</TableHead>
          <TableHead className="text-right">Dossiers actifs</TableHead>
          <TableHead className="text-right">Heures fact. (mois)</TableHead>
          <TableHead className="text-right">Taux horaire</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {avocats.map((a) => (
          <TableRow key={a.id}>
            <TableCell>
              <Link
                href={`/equipe/${a.id}`}
                className="flex items-center gap-3 hover:underline"
              >
                <Avatar prenom={a.prenom} nom={a.nom} src={a.photo_url} taille="sm" />
                <div className="min-w-0">
                  <p className="truncate font-medium text-foreground">
                    {a.prenom} {a.nom}
                    {!a.actif && (
                      <Badge ton="neutre" className="ml-2">
                        Inactif
                      </Badge>
                    )}
                  </p>
                  <p className="truncate text-xs text-muted-foreground">
                    {a.email}
                  </p>
                </div>
              </Link>
            </TableCell>
            <TableCell>
              <Badge ton="info">{LIBELLES_ROLES[a.role] ?? a.role}</Badge>
            </TableCell>
            <TableCell className="text-right font-medium text-foreground">
              {dossiersParAvocat.get(a.id) ?? 0}
            </TableCell>
            <TableCell className="text-right text-foreground">
              {formatHeures(heuresParAvocat.get(a.id) ?? 0)}
            </TableCell>
            <TableCell className="text-right text-muted-foreground">
              {a.taux_horaire ? formatFCFA(a.taux_horaire) : "—"}
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}

export default function EquipePage() {
  return (
    <div>
      <PageHeader
        titre="Avocats"
        description="Membres du cabinet, charge de travail et heures facturables."
      />
      <Card>
        <CardContent className="pt-6">
          <Suspense fallback={<SkeletonTable lignes={5} colonnes={5} />}>
            <ListeAvocats />
          </Suspense>
        </CardContent>
      </Card>
    </div>
  );
}
