import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import { format, parseISO, differenceInCalendarDays } from "date-fns";
import { fr } from "date-fns/locale";

/** Fusionne des classes Tailwind en gérant les conflits. */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/** "1 500 000 FCFA" — format français, séparateur d'espace insécable étroit. */
export function formatFCFA(
  montant: number | null | undefined,
  devise = "FCFA",
): string {
  const valeur = typeof montant === "number" && !Number.isNaN(montant) ? montant : 0;
  const formatte = new Intl.NumberFormat("fr-FR", {
    maximumFractionDigits: 0,
  }).format(Math.round(valeur));
  return `${formatte} ${devise}`;
}

type DateLike = Date | string | null | undefined;

function toDate(value: DateLike): Date | null {
  if (!value) return null;
  if (value instanceof Date) return Number.isNaN(value.getTime()) ? null : value;
  const parsed = value.includes("T") || value.length > 10 ? new Date(value) : parseISO(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

/** JJ/MM/AAAA */
export function formatDate(value: DateLike): string {
  const d = toDate(value);
  return d ? format(d, "dd/MM/yyyy") : "—";
}

/** JJ/MM/AAAA à HH:mm */
export function formatDateTime(value: DateLike): string {
  const d = toDate(value);
  return d ? format(d, "dd/MM/yyyy 'à' HH:mm", { locale: fr }) : "—";
}

/** HH:mm */
export function formatTime(value: DateLike): string {
  const d = toDate(value);
  return d ? format(d, "HH:mm") : "—";
}

/** "lundi 5 juin 2026" */
export function formatDateLongue(value: DateLike): string {
  const d = toDate(value);
  return d ? format(d, "EEEE d MMMM yyyy", { locale: fr }) : "—";
}

/** "1,5 h" — affiche une durée en heures décimales de façon lisible. */
export function formatHeures(heures: number | null | undefined): string {
  const h = typeof heures === "number" && !Number.isNaN(heures) ? heures : 0;
  const formatte = new Intl.NumberFormat("fr-FR", {
    maximumFractionDigits: 2,
  }).format(h);
  return `${formatte} h`;
}

/** Nombre de jours calendaires d'ici une date (négatif = passé). */
export function joursRestants(value: DateLike): number | null {
  const d = toDate(value);
  return d ? differenceInCalendarDays(d, new Date()) : null;
}

/** Initiales à partir d'un nom/prénom. */
export function initiales(prenom?: string | null, nom?: string | null): string {
  const a = (prenom ?? "").trim().charAt(0);
  const b = (nom ?? "").trim().charAt(0);
  return (a + b).toUpperCase() || "?";
}

/** Tronque proprement un texte. */
export function tronquer(texte: string | null | undefined, max = 80): string {
  if (!texte) return "";
  return texte.length > max ? `${texte.slice(0, max).trimEnd()}…` : texte;
}

/** "il y a 3 jours" / "dans 2 jours" relatif simple en français. */
export function formatRelatif(value: DateLike): string {
  const j = joursRestants(value);
  if (j === null) return "—";
  if (j === 0) return "aujourd'hui";
  if (j === 1) return "demain";
  if (j === -1) return "hier";
  if (j > 1) return `dans ${j} jours`;
  return `il y a ${Math.abs(j)} jours`;
}
