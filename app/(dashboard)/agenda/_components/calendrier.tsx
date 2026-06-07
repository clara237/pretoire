"use client";

import * as React from "react";
import { CalendarClock } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatTime } from "@/lib/utils";
import { EmptyState } from "@/components/ui/empty-state";
import {
  JOURS_COURTS,
  joursDuMois,
  joursDeLaSemaine,
  isSameDay,
  isSameMonth,
  format,
} from "../_lib/dates";
import {
  COULEUR_PASTILLE,
  LIBELLE_TYPE,
  type EvenementLite,
  type VueAgenda,
} from "../_lib/evenements";
import { EvenementDetail } from "./evenement-detail";
import type { OptionDossier, OptionProfile } from "./evenement-form";

interface Props {
  vue: VueAgenda;
  dateRef: string; // ISO du jour de référence
  evenements: EvenementLite[];
  peutEditer: boolean;
  dossiers: OptionDossier[];
  profiles: OptionProfile[];
}

function groupeParJour(evenements: EvenementLite[]): Map<string, EvenementLite[]> {
  const map = new Map<string, EvenementLite[]>();
  for (const e of evenements) {
    const cle = format(new Date(e.date_debut), "yyyy-MM-dd");
    const liste = map.get(cle) ?? [];
    liste.push(e);
    map.set(cle, liste);
  }
  for (const liste of map.values()) {
    liste.sort(
      (a, b) =>
        new Date(a.date_debut).getTime() - new Date(b.date_debut).getTime(),
    );
  }
  return map;
}

export function Calendrier({
  vue,
  dateRef,
  evenements,
  peutEditer,
  dossiers,
  profiles,
}: Props) {
  const [selection, setSelection] = React.useState<EvenementLite | null>(null);
  const refDate = React.useMemo(() => new Date(dateRef), [dateRef]);
  const parJour = React.useMemo(() => groupeParJour(evenements), [evenements]);

  return (
    <>
      {vue === "mois" && (
        <VueMois
          dateRef={refDate}
          parJour={parJour}
          onSelect={setSelection}
        />
      )}
      {vue === "semaine" && (
        <VueSemaine dateRef={refDate} parJour={parJour} onSelect={setSelection} />
      )}
      {vue === "jour" && (
        <VueJour
          dateRef={refDate}
          evenements={parJour.get(format(refDate, "yyyy-MM-dd")) ?? []}
          onSelect={setSelection}
        />
      )}

      {selection && (
        <EvenementDetail
          evenement={selection}
          onClose={() => setSelection(null)}
          peutEditer={peutEditer}
          dossiers={dossiers}
          profiles={profiles}
        />
      )}
    </>
  );
}

// ---------------------------------------------------------------------------
// VUE MOIS — grille 7 colonnes, pastilles colorées
// ---------------------------------------------------------------------------
function VueMois({
  dateRef,
  parJour,
  onSelect,
}: {
  dateRef: Date;
  parJour: Map<string, EvenementLite[]>;
  onSelect: (e: EvenementLite) => void;
}) {
  const jours = joursDuMois(dateRef);
  const aujourdHui = new Date();

  return (
    <div className="overflow-hidden rounded-lg border border-border bg-card">
      <div className="grid grid-cols-7 border-b border-border bg-muted/50">
        {JOURS_COURTS.map((j) => (
          <div
            key={j}
            className="px-2 py-2 text-center text-xs font-semibold text-muted-foreground"
          >
            {j}
          </div>
        ))}
      </div>
      <div className="grid grid-cols-7">
        {jours.map((jour) => {
          const cle = format(jour, "yyyy-MM-dd");
          const evts = parJour.get(cle) ?? [];
          const horsMois = !isSameMonth(jour, dateRef);
          const estAujourdHui = isSameDay(jour, aujourdHui);
          return (
            <div
              key={cle}
              className={cn(
                "min-h-[104px] border-b border-r border-border p-1.5 last:border-r-0 [&:nth-child(7n)]:border-r-0",
                horsMois && "bg-muted/30",
              )}
            >
              <div className="mb-1 flex justify-end">
                <span
                  className={cn(
                    "inline-flex h-6 w-6 items-center justify-center rounded-full text-xs",
                    estAujourdHui
                      ? "bg-principale font-semibold text-principale-foreground"
                      : horsMois
                        ? "text-muted-foreground/60"
                        : "text-foreground",
                  )}
                >
                  {format(jour, "d")}
                </span>
              </div>
              <div className="space-y-1">
                {evts.slice(0, 3).map((e) => {
                  const c = COULEUR_PASTILLE[e.type];
                  return (
                    <button
                      key={e.id}
                      type="button"
                      onClick={() => onSelect(e)}
                      title={`${formatTime(e.date_debut)} — ${e.titre}`}
                      className={cn(
                        "flex w-full items-center gap-1 truncate rounded-DEFAULT px-1.5 py-0.5 text-left text-[11px] font-medium transition-opacity hover:opacity-80",
                        c.fond,
                        c.texte,
                      )}
                    >
                      <span
                        className={cn("h-1.5 w-1.5 shrink-0 rounded-full", c.point)}
                      />
                      <span className="truncate">
                        {formatTime(e.date_debut)} {e.titre}
                      </span>
                    </button>
                  );
                })}
                {evts.length > 3 && (
                  <button
                    type="button"
                    onClick={() => onSelect(evts[3])}
                    className="px-1.5 text-[11px] font-medium text-muted-foreground hover:text-foreground"
                  >
                    +{evts.length - 3} autre{evts.length - 3 > 1 ? "s" : ""}
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// VUE SEMAINE — colonnes par jour avec créneaux horaires
// ---------------------------------------------------------------------------
const HEURE_DEBUT = 7;
const HEURE_FIN = 20;
const HAUTEUR_HEURE = 48; // px

function VueSemaine({
  dateRef,
  parJour,
  onSelect,
}: {
  dateRef: Date;
  parJour: Map<string, EvenementLite[]>;
  onSelect: (e: EvenementLite) => void;
}) {
  const jours = joursDeLaSemaine(dateRef);
  const aujourdHui = new Date();
  const heures = Array.from(
    { length: HEURE_FIN - HEURE_DEBUT + 1 },
    (_, i) => HEURE_DEBUT + i,
  );

  function positionner(e: EvenementLite) {
    const debut = new Date(e.date_debut);
    const minutesDepuisDebut =
      (debut.getHours() - HEURE_DEBUT) * 60 + debut.getMinutes();
    const top = Math.max(0, (minutesDepuisDebut / 60) * HAUTEUR_HEURE);
    const fin = e.date_fin ? new Date(e.date_fin) : null;
    const dureeMin = fin
      ? Math.max(30, (fin.getTime() - debut.getTime()) / 60000)
      : 45;
    const hauteur = (dureeMin / 60) * HAUTEUR_HEURE;
    return { top, hauteur };
  }

  return (
    <div className="overflow-hidden rounded-lg border border-border bg-card">
      {/* En-tête des jours */}
      <div className="grid grid-cols-[3rem_repeat(7,1fr)] border-b border-border bg-muted/50">
        <div className="border-r border-border" />
        {jours.map((jour) => {
          const estAujourdHui = isSameDay(jour, aujourdHui);
          return (
            <div
              key={jour.toISOString()}
              className="border-r border-border px-1 py-2 text-center last:border-r-0"
            >
              <div className="text-xs text-muted-foreground">
                {JOURS_COURTS[(jour.getDay() + 6) % 7]}
              </div>
              <div
                className={cn(
                  "mx-auto mt-0.5 inline-flex h-6 w-6 items-center justify-center rounded-full text-sm",
                  estAujourdHui
                    ? "bg-principale font-semibold text-principale-foreground"
                    : "text-foreground",
                )}
              >
                {format(jour, "d")}
              </div>
            </div>
          );
        })}
      </div>

      {/* Grille horaire */}
      <div className="relative overflow-x-auto">
        <div className="grid grid-cols-[3rem_repeat(7,1fr)]">
          {/* Colonne des heures */}
          <div className="border-r border-border">
            {heures.map((h) => (
              <div
                key={h}
                style={{ height: HAUTEUR_HEURE }}
                className="relative border-b border-border"
              >
                <span className="absolute -top-2 right-1 text-[10px] text-muted-foreground">
                  {String(h).padStart(2, "0")}h
                </span>
              </div>
            ))}
          </div>

          {/* Colonnes des jours */}
          {jours.map((jour) => {
            const cle = format(jour, "yyyy-MM-dd");
            const evts = parJour.get(cle) ?? [];
            return (
              <div
                key={cle}
                className="relative border-r border-border last:border-r-0"
              >
                {heures.map((h) => (
                  <div
                    key={h}
                    style={{ height: HAUTEUR_HEURE }}
                    className="border-b border-border"
                  />
                ))}
                {evts.map((e) => {
                  const { top, hauteur } = positionner(e);
                  const c = COULEUR_PASTILLE[e.type];
                  return (
                    <button
                      key={e.id}
                      type="button"
                      onClick={() => onSelect(e)}
                      style={{ top, height: hauteur }}
                      className={cn(
                        "absolute left-0.5 right-0.5 overflow-hidden rounded-DEFAULT border px-1.5 py-0.5 text-left text-[11px] leading-tight transition-opacity hover:opacity-80",
                        c.fond,
                        c.texte,
                        c.bordure,
                      )}
                    >
                      <span className="block truncate font-semibold">
                        {e.titre}
                      </span>
                      <span className="block truncate opacity-80">
                        {formatTime(e.date_debut)}
                      </span>
                    </button>
                  );
                })}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// VUE JOUR — liste chronologique
// ---------------------------------------------------------------------------
function VueJour({
  dateRef,
  evenements,
  onSelect,
}: {
  dateRef: Date;
  evenements: EvenementLite[];
  onSelect: (e: EvenementLite) => void;
}) {
  if (evenements.length === 0) {
    return (
      <EmptyState
        titre="Aucun événement ce jour"
        description={`Rien de prévu le ${format(dateRef, "dd/MM/yyyy")}.`}
        icone={CalendarClock}
      />
    );
  }

  return (
    <div className="overflow-hidden rounded-lg border border-border bg-card">
      <ul className="divide-y divide-border">
        {evenements.map((e) => {
          const c = COULEUR_PASTILLE[e.type];
          return (
            <li key={e.id}>
              <button
                type="button"
                onClick={() => onSelect(e)}
                className="flex w-full items-stretch gap-3 px-4 py-3 text-left transition-colors hover:bg-muted/40"
              >
                <div className="w-16 shrink-0 pt-0.5 text-sm font-semibold text-foreground">
                  {formatTime(e.date_debut)}
                  {e.date_fin && (
                    <div className="text-xs font-normal text-muted-foreground">
                      {formatTime(e.date_fin)}
                    </div>
                  )}
                </div>
                <div className={cn("w-1 shrink-0 rounded-full", c.point)} />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-foreground">
                    {e.titre}
                  </p>
                  <p className="mt-0.5 flex flex-wrap items-center gap-x-2 text-xs text-muted-foreground">
                    <span className={cn("font-medium", c.texte)}>
                      {LIBELLE_TYPE[e.type]}
                    </span>
                    {e.lieu && <span>· {e.lieu}</span>}
                    {e.dossiers && (
                      <span>· {e.dossiers.numero}</span>
                    )}
                  </p>
                </div>
              </button>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
