import { Suspense } from "react";
import Link from "next/link";
import { Plus } from "lucide-react";
import { PageHeader } from "@/components/ui/page-header";
import { Button } from "@/components/ui/button";
import { SkeletonTable } from "@/components/ui/skeleton";
import { getProfilCourant } from "@/lib/auth";
import { canEdit } from "@/lib/roles";
import { listerAvocats, nomProfil } from "@/lib/queries/dossiers";
import { DossiersFiltres } from "./_components/dossiers-filtres";
import { DossiersTable } from "./_components/dossiers-table";

export const dynamic = "force-dynamic";

export default async function DossiersPage({
  searchParams,
}: {
  searchParams: { q?: string; statut?: string; type?: string; avocat?: string };
}) {
  const [profil, avocats] = await Promise.all([
    getProfilCourant(),
    listerAvocats(),
  ]);
  const peutCreer = canEdit(profil?.role, "dossiers");

  const filtres = {
    recherche: searchParams.q,
    statut: searchParams.statut,
    type: searchParams.type,
    avocat: searchParams.avocat,
  };
  const cle = `${filtres.recherche ?? ""}|${filtres.statut ?? ""}|${filtres.type ?? ""}|${filtres.avocat ?? ""}`;

  return (
    <div>
      <PageHeader
        titre="Dossiers"
        description="Affaires suivies par le cabinet — civil, pénal, commercial, social, administratif, OHADA."
        actions={
          peutCreer ? (
            <Link href="/dossiers/nouveau">
              <Button iconeGauche={<Plus className="h-4 w-4" />}>
                Nouveau dossier
              </Button>
            </Link>
          ) : undefined
        }
      />

      <DossiersFiltres
        avocats={avocats.map((a) => ({ id: a.id, nom: nomProfil(a) }))}
      />

      <Suspense key={cle} fallback={<SkeletonTable lignes={8} colonnes={6} />}>
        <DossiersTable filtres={filtres} />
      </Suspense>
    </div>
  );
}
