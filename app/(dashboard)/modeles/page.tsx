import { Suspense } from "react";
import { redirect } from "next/navigation";
import { PageHeader } from "@/components/ui/page-header";
import { Skeleton } from "@/components/ui/skeleton";
import { getProfilCourant } from "@/lib/auth";
import { hasAccess, canEdit } from "@/lib/roles";
import { ModelesFiltres } from "./_components/modeles-filtres";
import { ModelesListe } from "./_components/modeles-liste";
import { ModeleForm } from "./_components/modele-form";

export const dynamic = "force-dynamic";

export default async function ModelesPage({
  searchParams,
}: {
  searchParams: { categorie?: string; etat?: string };
}) {
  const profil = await getProfilCourant();
  if (!hasAccess(profil?.role, "modeles")) {
    redirect("/dashboard");
  }
  const peutEditer = canEdit(profil?.role, "modeles");

  // Les inactifs ne sont visibles que des utilisateurs pouvant éditer.
  const inclureInactifs = peutEditer && searchParams.etat === "tous";
  const categorie = searchParams.categorie;
  const cle = `${categorie ?? "tous"}|${inclureInactifs ? "tous" : "actifs"}`;

  return (
    <div>
      <PageHeader
        titre="Modèles de documents"
        description="Bibliothèque de modèles réutilisables — mises en demeure, conclusions, contrats…"
        actions={peutEditer ? <ModeleForm /> : undefined}
      />

      <ModelesFiltres peutEditer={peutEditer} />

      <Suspense
        key={cle}
        fallback={
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="h-40 w-full rounded-lg" />
            ))}
          </div>
        }
      >
        <ModelesListe
          categorie={categorie}
          inclureInactifs={inclureInactifs}
          peutEditer={peutEditer}
        />
      </Suspense>
    </div>
  );
}
