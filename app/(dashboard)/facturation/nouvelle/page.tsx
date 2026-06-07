import { redirect } from "next/navigation";
import { PageHeader } from "@/components/ui/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { getProfilCourant } from "@/lib/auth";
import { canEdit } from "@/lib/roles";
import { getCabinetConfig } from "@/lib/cabinet";
import {
  listerClientsSelecteurFinance,
  listerDossiersSelecteur,
  nomClient,
} from "@/lib/queries/finance";
import { FactureCreation } from "./_components/facture-creation";

export const dynamic = "force-dynamic";

export default async function NouvelleFacturePage({
  searchParams,
}: {
  searchParams: { dossier?: string };
}) {
  const profil = await getProfilCourant();
  if (!canEdit(profil?.role, "facturation")) {
    redirect("/facturation");
  }

  const [clients, dossiers, cabinet] = await Promise.all([
    listerClientsSelecteurFinance(),
    listerDossiersSelecteur(),
    getCabinetConfig(),
  ]);

  return (
    <div>
      <PageHeader
        titre="Nouvelle facture"
        description="Facturez le temps facturable d'un dossier ou émettez des honoraires fixes / une provision."
      />
      <Card>
        <CardContent className="pt-6">
          <FactureCreation
            clients={clients.map((c) => ({ value: c.id, label: nomClient(c) }))}
            dossiers={dossiers.map((d) => ({
              value: d.id,
              label: `${d.numero} — ${d.titre}`,
            }))}
            tvaApplicable={cabinet.tva_applicable}
            tauxTva={cabinet.taux_tva}
            devise={cabinet.devise || "FCFA"}
            fraisOuverture={cabinet.frais_ouverture_dossier ?? 50000}
            dossierParDefaut={searchParams.dossier}
          />
        </CardContent>
      </Card>
    </div>
  );
}
