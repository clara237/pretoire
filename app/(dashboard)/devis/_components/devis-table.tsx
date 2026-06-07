import Link from "next/link";
import { FileSpreadsheet } from "lucide-react";
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
import { formatFCFA, formatDate } from "@/lib/utils";
import {
  listerDevis,
  nomClient,
  LIBELLE_STATUT_DEVIS,
  TON_STATUT_DEVIS,
  type FiltresDevis,
} from "@/lib/queries/finance";

export async function DevisTable({
  filtres,
  peutEditer,
}: {
  filtres: FiltresDevis;
  peutEditer: boolean;
}) {
  const devis = await listerDevis(filtres);

  if (devis.length === 0) {
    const filtre = Boolean(
      filtres.recherche || (filtres.statut && filtres.statut !== "tous"),
    );
    return (
      <EmptyState
        titre={filtre ? "Aucun devis trouvé" : "Aucun devis"}
        description={
          filtre
            ? "Aucun devis ne correspond à votre filtre."
            : "Créez votre premier devis (proforma) pour un client."
        }
        icone={FileSpreadsheet}
        action={
          !filtre && peutEditer ? (
            <Link href="/devis/nouveau">
              <Button>Nouveau devis</Button>
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
          <TableHead>Client</TableHead>
          <TableHead className="hidden lg:table-cell">Émission</TableHead>
          <TableHead className="hidden md:table-cell">Validité</TableHead>
          <TableHead className="text-right">Montant TTC</TableHead>
          <TableHead>Statut</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {devis.map((d) => (
          <TableRow key={d.id}>
            <TableCell>
              <Link href={`/devis/${d.id}`} className="block">
                <span className="font-medium text-foreground hover:text-principale">
                  {d.numero}
                </span>
              </Link>
              {d.facture && (
                <Link
                  href={`/facturation/${d.facture.id}`}
                  className="block text-xs text-muted-foreground hover:text-principale"
                >
                  → {d.facture.numero}
                </Link>
              )}
            </TableCell>
            <TableCell className="text-sm">{nomClient(d.client)}</TableCell>
            <TableCell className="hidden lg:table-cell text-sm text-muted-foreground">
              {formatDate(d.date_emission)}
            </TableCell>
            <TableCell className="hidden md:table-cell text-sm text-muted-foreground">
              {d.date_validite ? formatDate(d.date_validite) : "—"}
            </TableCell>
            <TableCell className="text-right text-sm font-medium">
              {formatFCFA(d.montant_ttc, d.devise)}
            </TableCell>
            <TableCell>
              <Badge ton={TON_STATUT_DEVIS[d.statut] ?? "neutre"}>
                {LIBELLE_STATUT_DEVIS[d.statut] ?? d.statut}
              </Badge>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
