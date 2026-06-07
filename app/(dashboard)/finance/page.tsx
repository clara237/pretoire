import { Suspense } from "react";
import { redirect } from "next/navigation";
import { PageHeader } from "@/components/ui/page-header";
import { SkeletonStat, Skeleton, SkeletonTable } from "@/components/ui/skeleton";
import { getProfilCourant } from "@/lib/auth";
import { hasAccess, canEdit } from "@/lib/roles";
import { donneesRapportMois } from "./_lib/donnees";
import { FinanceKpis } from "./_components/finance-kpis";
import { GraphiquesSection } from "./_components/graphiques-section";
import { TopClients, RevenusParType } from "./_components/analytics";
import { DepensesSection } from "./_components/depenses-section";
import { RapportBouton } from "./_components/rapport-bouton";

export const dynamic = "force-dynamic";

async function ReportingAction() {
  // Données du rapport d'activité du mois courant (pour l'export PDF).
  const donnees = await donneesRapportMois();
  return <RapportBouton donnees={donnees} />;
}

export default async function FinancePage() {
  const profil = await getProfilCourant();
  if (!hasAccess(profil?.role, "finance")) {
    redirect("/dashboard");
  }
  const peutEditer = canEdit(profil?.role, "finance");

  return (
    <div>
      <PageHeader
        titre="Finance & Reporting"
        description="Pilotage financier du cabinet : chiffre d'affaires, créances, comptabilité simplifiée."
        actions={
          <Suspense fallback={null}>
            <ReportingAction />
          </Suspense>
        }
      />

      {/* KPI */}
      <Suspense
        fallback={
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <SkeletonStat key={i} />
            ))}
          </div>
        }
      >
        <FinanceKpis />
      </Suspense>

      {/* Graphiques */}
      <div className="mt-6">
        <Suspense
          fallback={
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
              <Skeleton className="h-96 w-full rounded-lg" />
              <Skeleton className="h-96 w-full rounded-lg" />
            </div>
          }
        >
          <GraphiquesSection />
        </Suspense>
      </div>

      {/* Analytics : top clients + revenus par type */}
      <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Suspense fallback={<Skeleton className="h-80 w-full rounded-lg" />}>
          <TopClients />
        </Suspense>
        <Suspense fallback={<Skeleton className="h-80 w-full rounded-lg" />}>
          <RevenusParType />
        </Suspense>
      </div>

      {/* Comptabilité simplifiée : dépenses */}
      <div className="mt-6">
        <Suspense fallback={<SkeletonTable lignes={5} colonnes={4} />}>
          <DepensesSection peutEditer={peutEditer} />
        </Suspense>
      </div>
    </div>
  );
}
