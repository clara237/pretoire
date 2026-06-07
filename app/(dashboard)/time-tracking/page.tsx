import { Suspense } from "react";
import { redirect } from "next/navigation";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { PageHeader } from "@/components/ui/page-header";
import { Skeleton } from "@/components/ui/skeleton";
import { getProfilCourant } from "@/lib/auth";
import { hasAccess, canEdit } from "@/lib/roles";
import {
  listerProfilsSelecteur,
  listerDossiersSelecteur,
  nomProfil,
} from "@/lib/queries/finance";
import { semaineDepuisParam, bornesSemaine, lundiDe } from "./_lib/semaine";
import { SemaineNav } from "./_components/semaine-nav";
import { FiltreAvocat } from "./_components/filtre-avocat";
import { SaisieForm } from "./_components/saisie-form";
import { Timesheet } from "./_components/timesheet";

export const dynamic = "force-dynamic";

export default async function TimeTrackingPage({
  searchParams,
}: {
  searchParams: { semaine?: string; avocat?: string };
}) {
  const profil = await getProfilCourant();
  if (!hasAccess(profil?.role, "time_tracking")) {
    redirect("/dashboard");
  }
  const peutEditer = canEdit(profil?.role, "time_tracking");

  const [profils, dossiers] = await Promise.all([
    listerProfilsSelecteur(),
    listerDossiersSelecteur(),
  ]);

  const optionsProfils = profils.map((p) => ({
    value: p.id,
    label: nomProfil(p),
  }));
  const optionsDossiers = dossiers.map((d) => ({
    value: d.id,
    label: `${d.numero} — ${d.titre}`,
  }));
  const tauxParProfil: Record<string, number | null> = {};
  for (const p of profils) tauxParProfil[p.id] = p.taux_horaire;

  const lundi = semaineDepuisParam(searchParams.semaine);
  const bornes = bornesSemaine(lundi);
  const libelleSemaine = `${format(bornes.lundi, "d MMM", { locale: fr })} – ${format(
    bornes.dimanche,
    "d MMM yyyy",
    { locale: fr },
  )}`;
  const paramAujourdhui = format(lundiDe(new Date()), "yyyy-MM-dd");

  const profileId = searchParams.avocat;
  const cle = `${bornes.debutISO}|${profileId ?? "tous"}`;

  return (
    <div>
      <PageHeader
        titre="Saisie des heures"
        description="Timesheet hebdomadaire — suivi du temps par avocat et par dossier."
        actions={
          peutEditer ? (
            <SaisieForm
              profils={optionsProfils}
              dossiers={optionsDossiers}
              tauxParProfil={tauxParProfil}
              profilCourantId={profil?.id}
            />
          ) : undefined
        }
      />

      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <SemaineNav
          libelle={libelleSemaine}
          paramPrec={bornes.paramPrec}
          paramSuiv={bornes.paramSuiv}
          paramCourant={bornes.paramCourant}
          paramAujourdhui={paramAujourdhui}
        />
        <FiltreAvocat avocats={optionsProfils} />
      </div>

      <Suspense key={cle} fallback={<Skeleton className="h-96 w-full rounded-lg" />}>
        <Timesheet
          lundi={lundi}
          profileId={profileId}
          peutEditer={peutEditer}
          profils={optionsProfils}
          dossiers={optionsDossiers}
          tauxParProfil={tauxParProfil}
          profilCourantId={profil?.id}
        />
      </Suspense>
    </div>
  );
}
