import { PageHeader } from "@/components/ui/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { createClient } from "@/lib/supabase/server";
import { getProfilCourant } from "@/lib/auth";
import { canEdit } from "@/lib/roles";
import {
  CourriersClient,
  type CourrierLigne,
  type OptionDossier,
} from "./_components/courriers-client";

export const dynamic = "force-dynamic";

export default async function CourriersPage() {
  const profil = await getProfilCourant();
  const peutEditer = canEdit(profil?.role, "courriers");

  const supabase = createClient();
  const [courriersRes, dossiersRes] = await Promise.all([
    supabase
      .from("courriers")
      .select(
        "id, type, objet, expediteur, destinataire, date_courrier, fichier_url, notes, dossier_id, dossier:dossiers(id, numero, titre)",
      )
      .order("date_courrier", { ascending: false }),
    supabase
      .from("dossiers")
      .select("id, numero, titre")
      .order("created_at", { ascending: false }),
  ]);

  const courriers = (courriersRes.data ?? []) as unknown as CourrierLigne[];
  const dossiers = (dossiersRes.data ?? []) as unknown as OptionDossier[];

  return (
    <div>
      <PageHeader
        titre="Correspondance"
        description="Courriers entrants et sortants liés aux dossiers du cabinet."
      />
      <Card>
        <CardContent className="pt-6">
          <CourriersClient
            courriers={courriers}
            dossiers={dossiers}
            peutEditer={peutEditer}
          />
        </CardContent>
      </Card>
    </div>
  );
}
