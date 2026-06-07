import { redirect } from "next/navigation";
import { PageHeader } from "@/components/ui/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { getProfilCourant } from "@/lib/auth";
import { canEdit } from "@/lib/roles";
import { EvenementForm } from "../_components/evenement-form";
import {
  chargerDossiersOptions,
  chargerProfilesOptions,
} from "../_lib/donnees";

export const dynamic = "force-dynamic";

export default async function NouvelEvenementPage({
  searchParams,
}: {
  searchParams: { date?: string };
}) {
  const profil = await getProfilCourant();
  if (!canEdit(profil?.role, "agenda")) {
    redirect("/agenda");
  }

  const [dossiers, profiles] = await Promise.all([
    chargerDossiersOptions(),
    chargerProfilesOptions(),
  ]);

  return (
    <div className="mx-auto max-w-3xl">
      <PageHeader
        titre="Nouvel événement"
        description="Planifiez un rendez-vous, une audience, une réunion ou un délai."
      />
      <Card>
        <CardContent className="pt-6">
          <EvenementForm
            dossiers={dossiers}
            profiles={profiles}
            dateDefaut={searchParams.date}
          />
        </CardContent>
      </Card>
    </div>
  );
}
