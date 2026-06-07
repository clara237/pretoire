import { Suspense } from "react";
import { redirect } from "next/navigation";
import { UserCog } from "lucide-react";
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
import { formatDate } from "@/lib/utils";
import { NouvelUtilisateur } from "./_components/nouvel-utilisateur";
import { UtilisateurActions } from "./_components/utilisateur-actions";

export const dynamic = "force-dynamic";

interface LigneProfil {
  id: string;
  user_id: string;
  nom: string;
  prenom: string;
  email: string;
  telephone: string | null;
  role: Role;
  photo_url: string | null;
  date_entree: string | null;
  actif: boolean;
}

async function ListeUtilisateurs({ peutEcrire }: { peutEcrire: boolean }) {
  const supabase = createClient();
  const { data } = await supabase
    .from("profiles")
    .select(
      "id, user_id, nom, prenom, email, telephone, role, photo_url, date_entree, actif",
    )
    .order("actif", { ascending: false })
    .order("nom", { ascending: true });

  const profils = (data ?? []) as LigneProfil[];

  if (profils.length === 0) {
    return (
      <EmptyState
        titre="Aucun utilisateur"
        description="Créez le premier compte pour donner accès à l'application."
        icone={UserCog}
        action={peutEcrire ? <NouvelUtilisateur /> : undefined}
      />
    );
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Utilisateur</TableHead>
          <TableHead>Rôle</TableHead>
          <TableHead>Téléphone</TableHead>
          <TableHead>Entrée</TableHead>
          <TableHead>Statut</TableHead>
          {peutEcrire && <TableHead className="text-right">Actions</TableHead>}
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
            <TableCell className="text-muted-foreground">
              {p.telephone ?? "—"}
            </TableCell>
            <TableCell className="text-muted-foreground">
              {p.date_entree ? formatDate(p.date_entree) : "—"}
            </TableCell>
            <TableCell>
              {p.actif ? (
                <Badge ton="succes">Actif</Badge>
              ) : (
                <Badge ton="neutre">Inactif</Badge>
              )}
            </TableCell>
            {peutEcrire && (
              <TableCell className="text-right">
                <UtilisateurActions
                  utilisateur={{
                    id: p.id,
                    nom: p.nom,
                    prenom: p.prenom,
                    email: p.email,
                    telephone: p.telephone,
                    role: p.role,
                    actif: p.actif,
                  }}
                />
              </TableCell>
            )}
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}

export default async function UtilisateursPage() {
  const profil = await getProfilCourant();
  if (!profil) redirect("/login");
  if (!canEdit(profil.role, "parametres")) {
    redirect("/dashboard");
  }
  const peutEcrire = canEdit(profil.role, "parametres");

  return (
    <div>
      <PageHeader
        titre="Utilisateurs"
        description="Comptes et rôles d'accès à l'application."
        actions={peutEcrire ? <NouvelUtilisateur /> : undefined}
      />
      <Card>
        <CardContent className="pt-6">
          <Suspense fallback={<SkeletonTable lignes={5} colonnes={6} />}>
            <ListeUtilisateurs peutEcrire={peutEcrire} />
          </Suspense>
        </CardContent>
      </Card>
    </div>
  );
}
