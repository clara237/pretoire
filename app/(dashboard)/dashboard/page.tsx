import { Suspense } from "react";
import { PageHeader } from "@/components/ui/page-header";
import { SkeletonStat, Skeleton } from "@/components/ui/skeleton";
import { KpiCards } from "./_components/kpi-cards";
import { AgendaJour } from "./_components/agenda-jour";
import { DossiersRecents } from "./_components/dossiers-recents";

export const dynamic = "force-dynamic";

export default function DashboardPage() {
  return (
    <div>
      <PageHeader
        titre="Tableau de bord"
        description="Vue d'ensemble de l'activité du cabinet."
      />

      <Suspense
        fallback={
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <SkeletonStat key={i} />
            ))}
          </div>
        }
      >
        <KpiCards />
      </Suspense>

      <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Suspense fallback={<Skeleton className="h-80 w-full rounded-lg" />}>
          <AgendaJour />
        </Suspense>
        <Suspense fallback={<Skeleton className="h-80 w-full rounded-lg" />}>
          <DossiersRecents />
        </Suspense>
      </div>
    </div>
  );
}
