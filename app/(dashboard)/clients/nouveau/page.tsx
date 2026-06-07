import { redirect } from "next/navigation";
import { PageHeader } from "@/components/ui/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { getProfilCourant } from "@/lib/auth";
import { canEdit } from "@/lib/roles";
import { ClientForm } from "../_components/client-form";

export const dynamic = "force-dynamic";

export default async function NouveauClientPage() {
  const profil = await getProfilCourant();
  if (!canEdit(profil?.role, "clients")) {
    redirect("/clients");
  }

  return (
    <div>
      <PageHeader
        titre="Nouveau client"
        description="Enregistrez une personne physique ou morale."
      />
      <Card>
        <CardContent className="pt-6">
          <ClientForm />
        </CardContent>
      </Card>
    </div>
  );
}
