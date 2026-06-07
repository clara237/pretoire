import { redirect } from "next/navigation";
import { PageHeader } from "@/components/ui/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { getProfilCourant } from "@/lib/auth";
import { canEdit } from "@/lib/roles";
import { StagiaireForm } from "../_components/stagiaire-form";
import { chargerMaitresOptions } from "../_lib/donnees";

export const dynamic = "force-dynamic";

export default async function NouveauStagiairePage() {
  const profil = await getProfilCourant();
  if (!canEdit(profil?.role, "stagiaires")) {
    redirect("/stagiaires");
  }

  const maitres = await chargerMaitresOptions();

  return (
    <div className="mx-auto max-w-3xl">
      <PageHeader
        titre="Nouveau stagiaire"
        description="Renseignez la fiche du stagiaire."
      />
      <Card>
        <CardContent className="pt-6">
          <StagiaireForm maitres={maitres} />
        </CardContent>
      </Card>
    </div>
  );
}
