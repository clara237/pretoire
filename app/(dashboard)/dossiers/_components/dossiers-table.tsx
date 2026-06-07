import Link from "next/link";
import { Briefcase } from "lucide-react";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import { Button } from "@/components/ui/button";
import { Avatar } from "@/components/ui/avatar";
import { formatDate, formatFCFA } from "@/lib/utils";
import {
  listerDossiers,
  nomClient,
  nomProfil,
  LIBELLE_STATUT,
  TON_STATUT,
  LIBELLE_TYPE_AFFAIRE,
  type FiltresDossiers,
} from "@/lib/queries/dossiers";

export async function DossiersTable({ filtres }: { filtres: FiltresDossiers }) {
  const dossiers = await listerDossiers(filtres);

  if (dossiers.length === 0) {
    const filtre = Boolean(
      filtres.recherche ||
        (filtres.statut && filtres.statut !== "tous") ||
        (filtres.type && filtres.type !== "tous") ||
        (filtres.avocat && filtres.avocat !== "tous"),
    );
    return (
      <EmptyState
        titre={filtre ? "Aucun dossier trouvé" : "Aucun dossier"}
        description={
          filtre
            ? "Aucun dossier ne correspond à vos critères."
            : "Créez votre premier dossier pour commencer."
        }
        icone={Briefcase}
        action={
          !filtre ? (
            <Link href="/dossiers/nouveau">
              <Button>Nouveau dossier</Button>
            </Link>
          ) : undefined
        }
      />
    );
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Numéro</TableHead>
          <TableHead>Dossier</TableHead>
          <TableHead className="hidden md:table-cell">Type</TableHead>
          <TableHead className="hidden lg:table-cell">Responsable</TableHead>
          <TableHead className="hidden xl:table-cell">Ouverture</TableHead>
          <TableHead>Statut</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {dossiers.map((d) => (
          <TableRow key={d.id}>
            <TableCell className="whitespace-nowrap font-mono text-xs text-muted-foreground">
              <Link href={`/dossiers/${d.id}`} className="hover:text-principale">
                {d.numero}
              </Link>
            </TableCell>
            <TableCell>
              <Link href={`/dossiers/${d.id}`} className="block">
                <span className="font-medium text-foreground hover:text-principale">
                  {d.titre}
                </span>
                <span className="block text-xs text-muted-foreground">
                  {nomClient(d.client)}
                  {d.montant_enjeu != null && ` · ${formatFCFA(d.montant_enjeu)}`}
                </span>
              </Link>
            </TableCell>
            <TableCell className="hidden md:table-cell">
              <Badge ton="neutre">
                {LIBELLE_TYPE_AFFAIRE[d.type_affaire] ?? d.type_affaire}
              </Badge>
            </TableCell>
            <TableCell className="hidden lg:table-cell">
              <div className="flex items-center gap-2">
                {d.avocat && (
                  <Avatar
                    prenom={d.avocat.prenom}
                    nom={d.avocat.nom}
                    src={d.avocat.photo_url}
                    taille="sm"
                  />
                )}
                <span className="text-sm text-foreground">
                  {nomProfil(d.avocat)}
                </span>
              </div>
            </TableCell>
            <TableCell className="hidden xl:table-cell text-sm text-muted-foreground">
              {formatDate(d.date_ouverture)}
            </TableCell>
            <TableCell>
              <Badge ton={TON_STATUT[d.statut] ?? "neutre"}>
                {LIBELLE_STATUT[d.statut] ?? d.statut}
              </Badge>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
