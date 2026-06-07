import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ArrowLeft, Receipt } from "lucide-react";
import { PageHeader } from "@/components/ui/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatFCFA, formatDate } from "@/lib/utils";
import { getProfilCourant } from "@/lib/auth";
import { hasAccess, canEdit } from "@/lib/roles";
import {
  recupererDevis,
  nomClient,
  LIBELLE_STATUT_DEVIS,
  TON_STATUT_DEVIS,
} from "@/lib/queries/finance";
import { DevisPdfBouton } from "./_components/devis-pdf-bouton";
import {
  DevisStatutSelect,
  DevisConvertir,
  DevisSupprimer,
} from "./_components/devis-actions";
import type { DonneesDevisPdf } from "@/lib/pdf/devis";

export const dynamic = "force-dynamic";

export default async function DevisDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const profil = await getProfilCourant();
  if (!hasAccess(profil?.role, "facturation")) {
    redirect("/dashboard");
  }
  const peutEditer = canEdit(profil?.role, "facturation");

  const devis = await recupererDevis(params.id);
  if (!devis) notFound();

  const devise = devis.devise || "FCFA";
  const converti = Boolean(devis.facture_id);
  const conversionPossible =
    !converti && devis.statut !== "refuse" && devis.statut !== "expire";

  const donneesPdf: DonneesDevisPdf = {
    numero: devis.numero,
    objet: devis.objet,
    date_emission: devis.date_emission,
    date_validite: devis.date_validite,
    statut: devis.statut,
    montant_ht: devis.montant_ht,
    tva: devis.tva,
    montant_ttc: devis.montant_ttc,
    devise,
    notes: devis.notes,
    nomClient: nomClient(devis.client),
    adresseClient: null,
    numeroDossier: devis.dossier?.numero ?? null,
    intituleDossier: devis.dossier?.titre ?? null,
  };

  return (
    <div>
      <Link
        href="/devis"
        className="mb-4 inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" />
        Retour aux devis
      </Link>

      <PageHeader
        titre={devis.numero}
        description={`Émis le ${formatDate(devis.date_emission)}${
          devis.date_validite
            ? ` · valable jusqu'au ${formatDate(devis.date_validite)}`
            : ""
        }`}
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <Badge ton={TON_STATUT_DEVIS[devis.statut] ?? "neutre"}>
              {LIBELLE_STATUT_DEVIS[devis.statut] ?? devis.statut}
            </Badge>
            <DevisPdfBouton donnees={donneesPdf} />
            {peutEditer && conversionPossible && (
              <DevisConvertir id={devis.id} numero={devis.numero} />
            )}
            {peutEditer && (
              <DevisSupprimer id={devis.id} numero={devis.numero} />
            )}
          </div>
        }
      />

      {/* Bandeau : déjà converti */}
      {converti && devis.facture && (
        <div className="mb-6 flex flex-col gap-3 rounded-lg border border-success/30 bg-success/10 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-2 text-sm text-success">
            <Receipt className="h-5 w-5 shrink-0" />
            <span>Ce devis a été converti en facture.</span>
          </div>
          <Link href={`/facturation/${devis.facture.id}`}>
            <Badge ton="info" className="cursor-pointer">
              Voir la facture {devis.facture.numero}
            </Badge>
          </Link>
        </div>
      )}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Colonne principale */}
        <div className="space-y-6 lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Détail</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-foreground">
                {devis.objet || "Prestation juridique"}
              </p>

              {/* Totaux */}
              <div className="mt-4 ml-auto max-w-xs space-y-1.5 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Montant HT</span>
                  <span className="font-medium text-foreground">
                    {formatFCFA(devis.montant_ht, devise)}
                  </span>
                </div>
                {devis.tva > 0 && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">TVA</span>
                    <span className="font-medium text-foreground">
                      {formatFCFA(devis.tva, devise)}
                    </span>
                  </div>
                )}
                <div className="flex justify-between border-t border-border pt-1.5 text-base">
                  <span className="font-semibold text-foreground">Total TTC</span>
                  <span className="font-bold text-principale">
                    {formatFCFA(devis.montant_ttc, devise)}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          {devis.notes && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Notes</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="whitespace-pre-wrap text-sm text-muted-foreground">
                  {devis.notes}
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
                  {formatFCFA(devis.montant_ttc, devise)}
                </span>
              </div>

              {peutEditer && (
                <div className="border-t border-border pt-3">
                  <p className="mb-1.5 text-xs font-medium text-muted-foreground">
                    Statut du devis
                  </p>
                  <DevisStatutSelect id={devis.id} statut={devis.statut} />
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
                {devis.client ? (
                  <Link
                    href={`/clients/${devis.client.id}`}
                    className="font-medium text-foreground hover:text-principale"
                  >
                    {nomClient(devis.client)}
                  </Link>
                ) : (
                  <p className="font-medium text-foreground">—</p>
                )}
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Dossier</p>
                {devis.dossier ? (
                  <Link
                    href={`/dossiers/${devis.dossier.id}`}
                    className="font-medium text-foreground hover:text-principale"
                  >
                    {devis.dossier.numero} — {devis.dossier.titre}
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
