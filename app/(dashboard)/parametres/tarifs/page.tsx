import { Suspense } from "react";
import { redirect } from "next/navigation";
import { BadgeDollarSign } from "lucide-react";
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
import { canEdit, LIBELLES_ROLES, type Role } from "@/lib/roles";
import { TauxInline } from "./_components/taux-inline";

export const dynamic = "force-dynamic";

interface LigneTarif {
  id: string;
  nom: string;
  prenom: string;
  email: string;
  role: Role;
  photo_url: string | null;
  taux_horaire: number | null;
  actif: boolean;
}

async function ListeTarifs({ peutEcrire }: { peutEcrire: boolean }) {
  const supabase = createClient();
  const { data } = await supabase
    .from("profiles")
    .select("id, nom, prenom, email, role, photo_url, taux_horaire, actif")
    .order("actif", { ascending: false })
    .order("nom", { ascending: true });

  const profils = (data ?? []) as LigneTarif[];

  if (profils.length === 0) {
    return (
      <EmptyState
        titre="Aucun avocat"
        description="Les taux horaires apparaîtront ici une fois les comptes créés."
        icone={BadgeDollarSign}
      />
    );
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Avocat</TableHead>
          <TableHead>Rôle</TableHead>
          <TableHead className="text-right">Taux horaire (FCFA)</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {profils.map((p) => (
          <TableRow key={p.id}>
            <TableCell>
              <div className="flex items-center gap-3">
                <Avatar
                  prenom={p.prenom}
                  nom={p.nom}
                  src={p.photo_url}
                  taille="sm"
                />
                <div className="min-w-0">
                  <p className="truncate font-medium text-foreground">
                    {p.prenom} {p.nom}
                    {!p.actif && (
                      <Badge ton="neutre" className="ml-2">
                        Inactif
                      </Badge>
                    )}
                  </p>
                  <p className="truncate text-xs text-muted-foreground">
                    {p.email}
                  </p>
                </div>
              </div>
            </TableCell>
            <TableCell>
              <Badge ton="info">{LIBELLES_ROLES[p.role] ?? p.role}</Badge>
            </TableCell>
            <TableCell className="text-right">
              <TauxInline
                profileId={p.id}
                tauxInitial={p.taux_horaire}
                editable={peutEcrire}
              />
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}

export default async function TarifsPage() {
  const profil = await getProfilCourant();
  if (!profil) redirect("/login");
  if (!canEdit(profil.role, "parametres")) {
    redirect("/dashboard");
  }
  const peutEcrire = canEdit(profil.role, "parametres");

  return (
    <div>
      <PageHeader
        titre="Tarifs"
        description="Taux horaire de chaque avocat, utilisé pour la valorisation du temps et la facturation."
      />
      <Card>
        <CardContent className="pt-6">
          <Suspense fallback={<SkeletonTable lignes={5} colonnes={3} />}>
            <ListeTarifs peutEcrire={peutEcrire} />
          </Suspense>
        </CardContent>
      </Card>
    </div>
  );
}
