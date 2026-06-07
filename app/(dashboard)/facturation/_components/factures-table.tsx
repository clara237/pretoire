import Link from "next/link";
import { FileText, AlertTriangle } from "lucide-react";
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
  listerFactures,
  nomClient,
  soldeRestant,
  paliersRetard,
  LIBELLE_STATUT_FACTURE,
  TON_STATUT_FACTURE,
  type FiltresFactures,
} from "@/lib/queries/finance";
import { RelanceBouton } from "./relance-bouton";

export async function FacturesTable({
  filtres,
  peutEditer,
}: {
  filtres: FiltresFactures;
  peutEditer: boolean;
}) {
  const factures = await listerFactures(filtres);

  if (factures.length === 0) {
    const filtre = Boolean(
      filtres.recherche || (filtres.statut && filtres.statut !== "tous"),
    );
    return (
      <EmptyState
        titre={filtre ? "Aucune facture trouvée" : "Aucune facture"}
        description={
          filtre
            ? "Aucune facture ne correspond à votre filtre."
            : "Créez votre première facture depuis les saisies de temps ou en honoraires fixes."
        }
        icone={FileText}
        action={
          !filtre && peutEditer ? (
            <Link href="/facturation/nouvelle">
              <Button>Nouvelle facture</Button>
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
          <TableHead className="hidden md:table-cell">Échéance</TableHead>
          <TableHead className="text-right">Montant TTC</TableHead>
          <TableHead className="hidden lg:table-cell text-right">Solde</TableHead>
          <TableHead>Statut</TableHead>
          {peutEditer && <TableHead className="w-px" />}
        </TableRow>
      </TableHeader>
      <TableBody>
        {factures.map((f) => {
          const solde = soldeRestant(f.montant_ttc, f.paiements);
          const retard = paliersRetard(f.statut, f.date_echeance);
          return (
            <TableRow key={f.id}>
              <TableCell>
                <Link href={`/facturation/${f.id}`} className="block">
                  <span className="font-medium text-foreground hover:text-principale">
                    {f.numero}
                  </span>
                </Link>
              </TableCell>
              <TableCell className="text-sm">{nomClient(f.client)}</TableCell>
              <TableCell className="hidden lg:table-cell text-sm text-muted-foreground">
                {formatDate(f.date_emission)}
              </TableCell>
              <TableCell className="hidden md:table-cell text-sm">
                <div className="flex items-center gap-1.5">
                  <span className="text-muted-foreground">
                    {f.date_echeance ? formatDate(f.date_echeance) : "—"}
                  </span>
                  {retard && (
                    <Badge ton="danger" className="whitespace-nowrap">
                      <AlertTriangle className="h-3 w-3" />
                      J+{retard.palier}
                    </Badge>
                  )}
                </div>
              </TableCell>
              <TableCell className="text-right text-sm font-medium">
                {formatFCFA(f.montant_ttc, f.devise)}
              </TableCell>
              <TableCell className="hidden lg:table-cell text-right text-sm">
                {solde > 0 ? (
                  <span className="font-medium text-danger">
                    {formatFCFA(solde, f.devise)}
                  </span>
                ) : (
                  <span className="text-success">Soldée</span>
                )}
              </TableCell>
              <TableCell>
                <Badge ton={TON_STATUT_FACTURE[f.statut] ?? "neutre"}>
                  {LIBELLE_STATUT_FACTURE[f.statut] ?? f.statut}
                </Badge>
              </TableCell>
              {peutEditer && (
                <TableCell className="text-right">
                  {retard ? (
                    <RelanceBouton
                      factureId={f.id}
                      palier={retard.palier}
                      numero={f.numero}
                      taille="icone"
                      variante="fantome"
                    />
                  ) : null}
                </TableCell>
              )}
            </TableRow>
          );
        })}
      </TableBody>
    </Table>
  );
}
