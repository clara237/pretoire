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
import { DevisCreation } from "./_components/devis-creation";

export const dynamic = "force-dynamic";

export default async function NouveauDevisPage({
  searchParams,
}: {
  searchParams: { dossier?: string };
}) {
  const profil = await getProfilCourant();
  if (!canEdit(profil?.role, "facturation")) {
    redirect("/devis");
  }

  const [clients, dossiers, cabinet] = await Promise.all([
    listerClientsSelecteurFinance(),
    listerDossiersSelecteur(),
    getCabinetConfig(),
  ]);

  return (
    <div>
      <PageHeader
        titre="Nouveau devis"
        description="Établissez un devis (proforma) à présenter à un client avant facturation."
      />
      <Card>
        <CardContent className="pt-6">
          <DevisCreation
            clients={clients.map((c) => ({ value: c.id, label: nomClient(c) }))}
            dossiers={dossiers.map((d) => ({
              value: d.id,
              label: `${d.numero} — ${d.titre}`,
            }))}
            tvaApplicable={cabinet.tva_applicable}
            tauxTva={cabinet.taux_tva}
            devise={cabinet.devise || "FCFA"}
            dossierParDefaut={searchParams.dossier}
          />
        </CardContent>
      </Card>
    </div>
  );
}
