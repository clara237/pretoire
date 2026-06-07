import {
  startOfWeek,
  endOfWeek,
  addWeeks,
  eachDayOfInterval,
  format,
} from "date-fns";

/** Renvoie le lundi de la semaine contenant `ref` (semaine ISO, lundi→dimanche). */
export function lundiDe(ref: Date): Date {
  return startOfWeek(ref, { weekStartsOn: 1 });
}

/** Convertit une chaîne YYYY-MM-DD (ou rien) en lundi de semaine. */
export function semaineDepuisParam(param?: string): Date {
  if (param) {
    const d = new Date(`${param}T00:00:00`);
    if (!Number.isNaN(d.getTime())) return lundiDe(d);
  }
  return lundiDe(new Date());
}

export interface BornesSemaine {
  lundi: Date;
  dimanche: Date;
  debutISO: string; // YYYY-MM-DD
  finISO: string; // YYYY-MM-DD
  jours: Date[];
  paramCourant: string;
  paramPrec: string;
  paramSuiv: string;
}

function iso(d: Date): string {
  return format(d, "yyyy-MM-dd");
}

export function bornesSemaine(lundi: Date): BornesSemaine {
  const dimanche = endOfWeek(lundi, { weekStartsOn: 1 });
  const jours = eachDayOfInterval({ start: lundi, end: dimanche });
  return {
    lundi,
    dimanche,
    debutISO: iso(lundi),
    finISO: iso(dimanche),
    jours,
    paramCourant: iso(lundi),
    paramPrec: iso(addWeeks(lundi, -1)),
    paramSuiv: iso(addWeeks(lundi, 1)),
  };
}
