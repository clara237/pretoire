import { redirect } from "next/navigation";
import { PageHeader } from "@/components/ui/page-header";
import { getProfilCourant } from "@/lib/auth";
import { getCabinetConfig } from "@/lib/cabinet";
import { canEdit } from "@/lib/roles";
import { CabinetForm } from "./_components/cabinet-form";

export const dynamic = "force-dynamic";

export default async function ParametresCabinetPage() {
  const profil = await getProfilCourant();
  // Le middleware protège déjà la route ; double vérification côté serveur.
  if (!profil) redirect("/login");
  if (!canEdit(profil.role, "parametres_cabinet")) {
    redirect("/dashboard");
  }

  const cabinet = await getCabinetConfig();

  return (
    <div>
      <PageHeader
        titre="Paramètres du cabinet"
        description="Personnalisez l'identité du cabinet : nom, coordonnées, logo, couleurs et facturation. Les changements s'appliquent partout (connexion, barre latérale, PDF)."
      />
      <CabinetForm cabinet={cabinet} />
    </div>
  );
}
