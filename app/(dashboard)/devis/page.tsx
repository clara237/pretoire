import { Suspense } from "react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Plus } from "lucide-react";
import { PageHeader } from "@/components/ui/page-header";
import { Button } from "@/components/ui/button";
import { SkeletonTable } from "@/components/ui/skeleton";
import { getProfilCourant } from "@/lib/auth";
import { hasAccess, canEdit } from "@/lib/roles";
import { DevisFiltres } from "./_components/devis-filtres";
import { DevisTable } from "./_components/devis-table";

export const dynamic = "force-dynamic";

export default async function DevisPage({
  searchParams,
}: {
  searchParams: { q?: string; statut?: string };
}) {
  const profil = await getProfilCourant();
  if (!hasAccess(profil?.role, "facturation")) {
    redirect("/dashboard");
  }
  const peutEditer = canEdit(profil?.role, "facturation");

  const filtres = {
    recherche: searchParams.q,
    statut: searchParams.statut,
  };
  const cle = `${filtres.recherche ?? ""}|${filtres.statut ?? ""}`;

  return (
    <div>
      <PageHeader
        titre="Devis"
        description="Devis (proforma) du cabinet. Convertissez un devis accepté en facture en un clic."
        actions={
          peutEditer ? (
            <Link href="/devis/nouveau">
              <Button iconeGauche={<Plus className="h-4 w-4" />}>
                Nouveau devis
              </Button>
            </Link>
          ) : undefined
        }
      />

      <DevisFiltres />

      <Suspense key={cle} fallback={<SkeletonTable lignes={8} colonnes={6} />}>
        <DevisTable filtres={filtres} peutEditer={peutEditer} />
      </Suspense>
    </div>
  );
}
