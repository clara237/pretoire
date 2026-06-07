import { Wallet } from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/components/ui/table";
import { formatFCFA, formatDate } from "@/lib/utils";
import { listerDepenses } from "@/lib/queries/finance";
import { DepenseForm } from "./depense-form";
import { JustificatifBouton, DepenseSupprimer } from "./depense-actions";

export async function DepensesSection({ peutEditer }: { peutEditer: boolean }) {
  const depenses = await listerDepenses();
  const total = depenses.reduce((s, d) => s + (d.montant ?? 0), 0);

  return (
    <Card>
      <CardHeader className="flex-row items-center justify-between space-y-0">
        <div>
          <CardTitle className="text-base">Dépenses</CardTitle>
          <p className="mt-1 text-sm text-muted-foreground">
            Comptabilité simplifiée — total :{" "}
            <span className="font-medium text-foreground">
              {formatFCFA(total)}
            </span>
          </p>
        </div>
        {peutEditer && <DepenseForm />}
      </CardHeader>
      <CardContent>
        {depenses.length === 0 ? (
          <EmptyState
            titre="Aucune dépense"
            description="Enregistrez les dépenses du cabinet (frais de justice, loyer, déplacements…)."
            icone={Wallet}
            action={peutEditer ? <DepenseForm /> : undefined}
          />
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Catégorie</TableHead>
                <TableHead className="hidden md:table-cell">Description</TableHead>
                <TableHead className="text-right">Montant</TableHead>
                {peutEditer && <TableHead className="w-px" />}
              </TableRow>
            </TableHeader>
            <TableBody>
              {depenses.map((d) => (
                <TableRow key={d.id}>
                  <TableCell className="whitespace-nowrap text-sm">
                    {formatDate(d.date_depense)}
                  </TableCell>
                  <TableCell>
                    <Badge ton="neutre">{d.categorie}</Badge>
                  </TableCell>
                  <TableCell className="hidden md:table-cell text-sm text-muted-foreground">
                    {d.description || "—"}
                  </TableCell>
                  <TableCell className="text-right text-sm font-medium">
                    {formatFCFA(d.montant)}
                  </TableCell>
                  {peutEditer && (
                    <TableCell className="text-right">
                      <div className="flex justify-end">
                        {d.justificatif_url && (
                          <JustificatifBouton chemin={d.justificatif_url} />
                        )}
                        <DepenseForm
                          declencheur="ligne"
                          initiale={{
                            id: d.id,
                            categorie: d.categorie,
                            description: d.description,
                            montant: d.montant,
                            date_depense: d.date_depense.slice(0, 10),
                          }}
                        />
                        <DepenseSupprimer
                          id={d.id}
                          justificatif={d.justificatif_url}
                          libelle={`${d.categorie} — ${formatFCFA(d.montant)}`}
                        />
                      </div>
                    </TableCell>
                  )}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}
