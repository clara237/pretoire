import { Suspense } from "react";
import { Briefcase, CalendarClock, Clock, GraduationCap } from "lucide-react";
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
        {/* @ts-expect-error Async Server Component */}
        <KpiCards />
      </Suspense>

      <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Suspense fallback={<Skeleton className="h-80 w-full rounded-lg" />}>
          {/* @ts-expect-error Async Server Component */}
          <AgendaJour />
        </Suspense>
        <Suspense fallback={<Skeleton className="h-80 w-full rounded-lg" />}>
          {/* @ts-expect-error Async Server Component */}
          <DossiersRecents />
        </Suspense>
      </div>
    </div>
  );
}

export const ICONES_KPI = {
  dossiers: Briefcase,
  rdv: CalendarClock,
  heures: Clock,
  stagiaires: GraduationCap,
};
