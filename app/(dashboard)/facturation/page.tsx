import { Suspense } from "react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Plus } from "lucide-react";
import { PageHeader } from "@/components/ui/page-header";
import { Button } from "@/components/ui/button";
import { SkeletonTable } from "@/components/ui/skeleton";
import { getProfilCourant } from "@/lib/auth";
import { hasAccess, canEdit } from "@/lib/roles";
import { FacturesFiltres } from "./_components/factures-filtres";
import { FacturesTable } from "./_components/factures-table";

export const dynamic = "force-dynamic";

export default async function FacturationPage({
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
        titre="Facturation"
        description="Factures du cabinet — honoraires, provisions et temps facturé. Relances J+30 / J+60 / J+90."
        actions={
          peutEditer ? (
            <Link href="/facturation/nouvelle">
              <Button iconeGauche={<Plus className="h-4 w-4" />}>
                Nouvelle facture
              </Button>
            </Link>
          ) : undefined
        }
      />

      <FacturesFiltres />

      <Suspense key={cle} fallback={<SkeletonTable lignes={8} colonnes={7} />}>
        <FacturesTable filtres={filtres} peutEditer={peutEditer} />
      </Suspense>
    </div>
  );
}
