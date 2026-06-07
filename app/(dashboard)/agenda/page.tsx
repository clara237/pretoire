import { Suspense } from "react";
import Link from "next/link";
import { Plus } from "lucide-react";
import { PageHeader } from "@/components/ui/page-header";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/server";
import { getProfilCourant } from "@/lib/auth";
import { canEdit } from "@/lib/roles";
import { AgendaToolbar } from "./_components/agenda-toolbar";
import { Calendrier } from "./_components/calendrier";
import { BoutonEcheances } from "./_components/bouton-echeances";
import { LegendeTypes } from "./_components/legende-types";
import {
  chargerDossiersOptions,
  chargerProfilesOptions,
} from "./_lib/donnees";
import {
  bornesVue,
  parseDateParam,
  libellePeriode,
  toParam,
} from "./_lib/dates";
import type { EvenementLite, VueAgenda } from "./_lib/evenements";

export const dynamic = "force-dynamic";

function vueValide(v: string | undefined): VueAgenda {
  return v === "jour" || v === "semaine" || v === "mois" ? v : "mois";
}

async function CalendrierData({
  vue,
  dateRef,
}: {
  vue: VueAgenda;
  dateRef: Date;
}) {
  const supabase = createClient();
  const { debut, fin } = bornesVue(vue, dateRef);

  const [evtRes, profil, dossiers, profiles] = await Promise.all([
    supabase
      .from("evenements")
      .select(
        "id, titre, type, description, lieu, date_debut, date_fin, dossier_id, profile_id, rappel_j7, rappel_j3, rappel_j1, rappel_envoye, dossiers(numero, titre), profiles!evenements_profile_id_fkey(nom, prenom)",
      )
      .gte("date_debut", debut)
      .lte("date_debut", fin)
      .order("date_debut", { ascending: true }),
    getProfilCourant(),
    chargerDossiersOptions(),
    chargerProfilesOptions(),
  ]);

  const evenements = (evtRes.data ?? []) as unknown as EvenementLite[];
  const peutEditer = canEdit(profil?.role, "agenda");

  return (
    <Calendrier
      vue={vue}
      dateRef={dateRef.toISOString()}
      evenements={evenements}
      peutEditer={peutEditer}
      dossiers={dossiers}
      profiles={profiles}
    />
  );
}

export default async function AgendaPage({
  searchParams,
}: {
  searchParams: { vue?: string; date?: string };
}) {
  const vue = vueValide(searchParams.vue);
  const ref = parseDateParam(searchParams.date);
  const profil = await getProfilCourant();
  const peutEditer = canEdit(profil?.role, "agenda");

  return (
    <div>
      <PageHeader
        titre="Agenda"
        description="Rendez-vous, audiences, réunions et délais de procédure."
        actions={
          <div className="flex items-center gap-2">
            {peutEditer && <BoutonEcheances />}
            {peutEditer && (
              <Link href={`/agenda/nouveau?date=${toParam(ref)}`}>
                <Button iconeGauche={<Plus className="h-4 w-4" />}>
                  Nouvel événement
                </Button>
              </Link>
            )}
          </div>
        }
      />

      <AgendaToolbar
        vue={vue}
        dateRef={ref}
        periode={libellePeriode(vue, ref)}
      />

      <LegendeTypes />

      <Suspense
        key={`${vue}-${toParam(ref)}`}
        fallback={<Skeleton className="h-[560px] w-full rounded-lg" />}
      >
        <CalendrierData vue={vue} dateRef={ref} />
      </Suspense>
    </div>
  );
}
