import {
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  startOfDay,
  endOfDay,
  addMonths,
  addWeeks,
  addDays,
  eachDayOfInterval,
  isSameDay,
  isSameMonth,
  format,
} from "date-fns";
import { fr } from "date-fns/locale";
import type { VueAgenda } from "./evenements";

/** Parse un paramètre ?date=YYYY-MM-DD, sinon aujourd'hui. */
export function parseDateParam(param?: string): Date {
  if (param) {
    const d = new Date(`${param}T12:00:00`);
    if (!Number.isNaN(d.getTime())) return d;
  }
  return new Date();
}

export function toParam(d: Date): string {
  return format(d, "yyyy-MM-dd");
}

/** Bornes [début, fin] (ISO) à charger selon la vue. */
export function bornesVue(vue: VueAgenda, ref: Date): { debut: string; fin: string } {
  if (vue === "jour") {
    return {
      debut: startOfDay(ref).toISOString(),
      fin: endOfDay(ref).toISOString(),
    };
  }
  if (vue === "semaine") {
    return {
      debut: startOfWeek(ref, { weekStartsOn: 1 }).toISOString(),
      fin: endOfWeek(ref, { weekStartsOn: 1 }).toISOString(),
    };
  }
  // mois : on inclut les jours débordants pour remplir la grille
  const debutGrille = startOfWeek(startOfMonth(ref), { weekStartsOn: 1 });
  const finGrille = endOfWeek(endOfMonth(ref), { weekStartsOn: 1 });
  return { debut: debutGrille.toISOString(), fin: finGrille.toISOString() };
}

/** Décalage précédent / suivant selon la vue. */
export function decaler(vue: VueAgenda, ref: Date, sens: -1 | 1): Date {
  if (vue === "jour") return addDays(ref, sens);
  if (vue === "semaine") return addWeeks(ref, sens);
  return addMonths(ref, sens);
}

/** Grille de jours (6 semaines max) pour la vue mois. */
export function joursDuMois(ref: Date): Date[] {
  const debut = startOfWeek(startOfMonth(ref), { weekStartsOn: 1 });
  const fin = endOfWeek(endOfMonth(ref), { weekStartsOn: 1 });
  return eachDayOfInterval({ start: debut, end: fin });
}

/** Les 7 jours de la semaine de `ref` (lundi → dimanche). */
export function joursDeLaSemaine(ref: Date): Date[] {
  const debut = startOfWeek(ref, { weekStartsOn: 1 });
  return Array.from({ length: 7 }, (_, i) => addDays(debut, i));
}

/** Libellé du titre de période selon la vue. */
export function libellePeriode(vue: VueAgenda, ref: Date): string {
  if (vue === "jour") {
    return format(ref, "EEEE d MMMM yyyy", { locale: fr });
  }
  if (vue === "semaine") {
    const jours = joursDeLaSemaine(ref);
    const a = jours[0];
    const b = jours[6];
    if (a.getMonth() === b.getMonth()) {
      return `${format(a, "d", { locale: fr })} – ${format(b, "d MMMM yyyy", { locale: fr })}`;
    }
    return `${format(a, "d MMM", { locale: fr })} – ${format(b, "d MMM yyyy", { locale: fr })}`;
  }
  return format(ref, "MMMM yyyy", { locale: fr });
}

export const JOURS_COURTS = ["Lun", "Mar", "Mer", "Jeu", "Ven", "Sam", "Dim"];

export { isSameDay, isSameMonth, format };
