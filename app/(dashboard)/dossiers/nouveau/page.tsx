import { redirect } from "next/navigation";
import { PageHeader } from "@/components/ui/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { getProfilCourant } from "@/lib/auth";
import { canEdit } from "@/lib/roles";
import { listerAvocats, nomProfil } from "@/lib/queries/dossiers";
import { listerClientsSelecteur, nomAffichage } from "@/lib/queries/clients";
import { DossierForm } from "../_components/dossier-form";

export const dynamic = "force-dynamic";

export default async function NouveauDossierPage({
  searchParams,
}: {
  searchParams: { client?: string };
}) {
  const profil = await getProfilCourant();
  if (!canEdit(profil?.role, "dossiers")) {
    redirect("/dossiers");
  }

  const [clients, avocats] = await Promise.all([
    listerClientsSelecteur(),
    listerAvocats(),
  ]);

  return (
    <div>
      <PageHeader
        titre="Nouveau dossier"
        description="Le numéro (DOS-AAAA-001) est généré automatiquement à la création."
      />
      <Card>
        <CardContent className="pt-6">
          <DossierForm
            clients={clients.map((c) => ({ value: c.id, label: nomAffichage(c) }))}
            avocats={avocats.map((a) => ({ value: a.id, label: nomProfil(a) }))}
            clientParDefaut={searchParams.client}
          />
        </CardContent>
      </Card>
    </div>
  );
}
