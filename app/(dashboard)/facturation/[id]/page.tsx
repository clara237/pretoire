import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ArrowLeft, AlertTriangle } from "lucide-react";
import { PageHeader } from "@/components/ui/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/components/ui/table";
import { formatFCFA, formatDate } from "@/lib/utils";
import { getProfilCourant } from "@/lib/auth";
import { hasAccess, canEdit } from "@/lib/roles";
import {
  recupererFacture,
  nomClient,
  totalPaiements,
  soldeRestant,
  paliersRetard,
  LIBELLE_STATUT_FACTURE,
  TON_STATUT_FACTURE,
  LIBELLE_TYPE_TACHE,
} from "@/lib/queries/finance";
import { FacturePdfBouton } from "./_components/facture-pdf-bouton";
import {
  FactureStatutSelect,
  FactureSupprimer,
} from "./_components/facture-actions";
import { Paiements } from "./_components/paiements";
import { RelanceBouton } from "../_components/relance-bouton";
import type { DonneesFacturePdf } from "@/lib/pdf/facture";

export const dynamic = "force-dynamic";

export default async function FactureDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const profil = await getProfilCourant();
  if (!hasAccess(profil?.role, "facturation")) {
    redirect("/dashboard");
  }
  const peutEditer = canEdit(profil?.role, "facturation");

  const facture = await recupererFacture(params.id);
  if (!facture) notFound();

  const totalPaye = totalPaiements(facture.paiements);
  const solde = soldeRestant(facture.montant_ttc, facture.paiements);
  const retard = paliersRetard(facture.statut, facture.date_echeance);
  const devise = facture.devise || "FCFA";

  // L'adresse détaillée du client n'est pas chargée ici (référence mini).
  const adresseClient: string | null = null;

  const donneesPdf: DonneesFacturePdf = {
    numero: facture.numero,
    date_emission: facture.date_emission,
    date_echeance: facture.date_echeance,
    statut: facture.statut,
    montant_ht: facture.montant_ht,
    tva: facture.tva,
    montant_ttc: facture.montant_ttc,
    devise,
    notes: facture.notes,
    nomClient: nomClient(facture.client),
    adresseClient,
    numeroDossier: facture.dossier?.numero ?? null,
    intituleDossier: facture.dossier?.titre ?? null,
    lignes: facture.lignes.map((l) => ({
      date: l.date,
      type_tache: l.type_tache,
      description: l.description,
      duree_heures: l.duree_heures,
      taux_horaire: l.taux_horaire,
    })),
    paiements: facture.paiements.map((p) => ({
      date_paiement: p.date_paiement,
      montant: p.montant,
      mode_paiement: p.mode_paiement,
      reference: p.reference,
    })),
  };

  return (
    <div>
      <Link
        href="/facturation"
        className="mb-4 inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" />
        Retour aux factures
      </Link>

      <PageHeader
        titre={facture.numero}
        description={`Émise le ${formatDate(facture.date_emission)}${
          facture.date_echeance
            ? ` · échéance le ${formatDate(facture.date_echeance)}`
            : ""
        }`}
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <Badge ton={TON_STATUT_FACTURE[facture.statut] ?? "neutre"}>
              {LIBELLE_STATUT_FACTURE[facture.statut] ?? facture.statut}
            </Badge>
            <FacturePdfBouton donnees={donneesPdf} />
            {peutEditer && (
              <FactureSupprimer id={facture.id} numero={facture.numero} />
            )}
          </div>
        }
      />

      {/* Bandeau de retard + relance */}
      {retard && (
        <div className="mb-6 flex flex-col gap-3 rounded-lg border border-danger/30 bg-danger/10 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-2 text-sm text-danger">
            <AlertTriangle className="h-5 w-5 shrink-0" />
            <span>
              Facture impayée depuis{" "}
              <strong>{retard.jours} jours</strong> (palier J+{retard.palier}).
            </span>
          </div>
          {peutEditer && (
            <RelanceBouton
              factureId={facture.id}
              palier={retard.palier}
              numero={facture.numero}
              taille="sm"
              variante="contour"
            />
          )}
        </div>
      )}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Colonne principale */}
        <div className="space-y-6 lg:col-span-2">
          {/* Lignes */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Détail</CardTitle>
            </CardHeader>
            <CardContent>
              {facture.lignes.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>Prestation</TableHead>
                      <TableHead className="text-right">Durée</TableHead>
                      <TableHead className="text-right">Taux</TableHead>
                      <TableHead className="text-right">Montant</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {facture.lignes.map((l) => {
                      const montant = l.duree_heures * (l.taux_horaire ?? 0);
                      return (
                        <TableRow key={l.id}>
                          <TableCell className="whitespace-nowrap text-sm">
                            {formatDate(l.date)}
                          </TableCell>
                          <TableCell className="text-sm">
                            <span className="font-medium text-foreground">
                              {LIBELLE_TYPE_TACHE[l.type_tache] ?? l.type_tache}
                            </span>
                            {l.description && (
                              <span className="text-muted-foreground">
                                {" "}
                                — {l.description}
                              </span>
                            )}
                          </TableCell>
                          <TableCell className="text-right text-sm">
                            {l.duree_heures} h
                          </TableCell>
                          <TableCell className="text-right text-sm">
                            {l.taux_horaire != null
                              ? formatFCFA(l.taux_horaire, devise)
                              : "—"}
                          </TableCell>
                          <TableCell className="text-right text-sm font-medium">
                            {formatFCFA(montant, devise)}
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              ) : (
                <p className="text-sm text-muted-foreground">
                  Facture à honoraires fixes / provision —{" "}
                  {formatFCFA(facture.montant_ht, devise)} HT.
                </p>
              )}

              {/* Totaux */}
              <div className="mt-4 ml-auto max-w-xs space-y-1.5 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Montant HT</span>
                  <span className="font-medium text-foreground">
                    {formatFCFA(facture.montant_ht, devise)}
                  </span>
                </div>
                {facture.tva > 0 && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">TVA</span>
                    <span className="font-medium text-foreground">
                      {formatFCFA(facture.tva, devise)}
                    </span>
                  </div>
                )}
                <div className="flex justify-between border-t border-border pt-1.5 text-base">
                  <span className="font-semibold text-foreground">Total TTC</span>
                  <span className="font-bold text-principale">
                    {formatFCFA(facture.montant_ttc, devise)}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Paiements */}
          <Card>
            <CardContent className="pt-5">
              <Paiements
                factureId={facture.id}
                paiements={facture.paiements.map((p) => ({
                  id: p.id,
                  date_paiement: p.date_paiement,
                  montant: p.montant,
                  mode_paiement: p.mode_paiement,
                  reference: p.reference,
                  notes: p.notes,
                }))}
                solde={solde}
                devise={devise}
                peutEditer={peutEditer}
              />
            </CardContent>
          </Card>

          {facture.notes && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Notes</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="whitespace-pre-wrap text-sm text-muted-foreground">
                  {facture.notes}
                </p>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Colonne latérale */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Récapitulatif</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Total TTC</span>
                <span className="font-medium text-foreground">
                  {formatFCFA(facture.montant_ttc, devise)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Réglé</span>
                <span className="font-medium text-success">
                  {formatFCFA(totalPaye, devise)}
                </span>
              </div>
              <div className="flex justify-between border-t border-border pt-3 text-base">
                <span className="font-semibold text-foreground">Solde dû</span>
                <span
                  className={`font-bold ${
                    solde > 0 ? "text-danger" : "text-success"
                  }`}
                >
                  {formatFCFA(solde, devise)}
                </span>
              </div>

              {peutEditer && (
                <div className="border-t border-border pt-3">
                  <p className="mb-1.5 text-xs font-medium text-muted-foreground">
                    Statut de la facture
                  </p>
                  <FactureStatutSelect id={facture.id} statut={facture.statut} />
                  <p className="mt-1.5 text-xs text-muted-foreground">
                    Le statut passe automatiquement à « payée » ou « partielle »
                    selon les paiements.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Client & dossier</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div>
                <p className="text-xs text-muted-foreground">Client</p>
                {facture.client ? (
                  <Link
                    href={`/clients/${facture.client.id}`}
                    className="font-medium text-foreground hover:text-principale"
                  >
                    {nomClient(facture.client)}
                  </Link>
                ) : (
                  <p className="font-medium text-foreground">—</p>
                )}
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Dossier</p>
                {facture.dossier ? (
                  <Link
                    href={`/dossiers/${facture.dossier.id}`}
                    className="font-medium text-foreground hover:text-principale"
                  >
                    {facture.dossier.numero} — {facture.dossier.titre}
                  </Link>
                ) : (
                  <p className="font-medium text-foreground">—</p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
