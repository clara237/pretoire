import { Suspense } from "react";
import Link from "next/link";
import { Plus } from "lucide-react";
import { PageHeader } from "@/components/ui/page-header";
import { Button } from "@/components/ui/button";
import { SkeletonTable } from "@/components/ui/skeleton";
import { getProfilCourant } from "@/lib/auth";
import { canEdit } from "@/lib/roles";
import { ClientsFiltres } from "./_components/clients-filtres";
import { ClientsTable } from "./_components/clients-table";

export const dynamic = "force-dynamic";

export default async function ClientsPage({
  searchParams,
}: {
  searchParams: { q?: string; type?: string };
}) {
  const profil = await getProfilCourant();
  const peutCreer = canEdit(profil?.role, "clients");

  const filtres = {
    recherche: searchParams.q,
    type: searchParams.type,
  };
  const cle = `${filtres.recherche ?? ""}|${filtres.type ?? ""}`;

  return (
    <div>
      <PageHeader
        titre="Clients"
        description="Personnes physiques et morales suivies par le cabinet."
        actions={
          peutCreer ? (
            <Link href="/clients/nouveau">
              <Button iconeGauche={<Plus className="h-4 w-4" />}>
                Nouveau client
              </Button>
            </Link>
          ) : undefined
        }
      />

      <ClientsFiltres />

      <Suspense key={cle} fallback={<SkeletonTable lignes={6} colonnes={5} />}>
        <ClientsTable filtres={filtres} />
      </Suspense>
    </div>
  );
}
