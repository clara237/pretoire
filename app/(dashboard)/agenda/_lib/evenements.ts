import type { BadgeTon } from "@/components/ui/badge";
import type { TypeEvenement } from "@/lib/actions/agenda";

export const LIBELLE_TYPE: Record<TypeEvenement, string> = {
  rdv: "Rendez-vous",
  audience: "Audience",
  reunion: "Réunion",
  deadline: "Échéance",
  deplacement: "Déplacement",
};

export const TON_TYPE: Record<TypeEvenement, BadgeTon> = {
  rdv: "principal",
  audience: "danger",
  reunion: "info",
  deadline: "avertissement",
  deplacement: "neutre",
};

/**
 * Code couleur CONSTANT par type d'événement, utilisé pour les pastilles du
 * calendrier (vues mois/semaine/jour). Classes Tailwind statiques pour rester
 * compatibles avec le purge.
 */
export const COULEUR_PASTILLE: Record<
  TypeEvenement,
  { fond: string; texte: string; point: string; bordure: string }
> = {
  rdv: {
    fond: "bg-principale/10",
    texte: "text-principale",
    point: "bg-principale",
    bordure: "border-principale/30",
  },
  audience: {
    fond: "bg-danger/10",
    texte: "text-danger",
    point: "bg-danger",
    bordure: "border-danger/30",
  },
  reunion: {
    fond: "bg-blue-500/10",
    texte: "text-blue-600 dark:text-blue-400",
    point: "bg-blue-500",
    bordure: "border-blue-500/30",
  },
  deadline: {
    fond: "bg-warning/10",
    texte: "text-warning",
    point: "bg-warning",
    bordure: "border-warning/40",
  },
  deplacement: {
    fond: "bg-muted",
    texte: "text-muted-foreground",
    point: "bg-muted-foreground",
    bordure: "border-border",
  },
};

export const TYPES_EVENEMENT: { value: TypeEvenement; label: string }[] = [
  { value: "rdv", label: "Rendez-vous" },
  { value: "audience", label: "Audience" },
  { value: "reunion", label: "Réunion" },
  { value: "deadline", label: "Échéance / délai" },
  { value: "deplacement", label: "Déplacement" },
];

export interface EvenementLite {
  id: string;
  titre: string;
  type: TypeEvenement;
  description: string | null;
  lieu: string | null;
  date_debut: string;
  date_fin: string | null;
  dossier_id: string | null;
  profile_id: string | null;
  rappel_j7: boolean | null;
  rappel_j3: boolean | null;
  rappel_j1: boolean | null;
  rappel_envoye: boolean | null;
  dossiers?: { numero: string; titre: string } | null;
  profiles?: { nom: string; prenom: string } | null;
}

export type VueAgenda = "mois" | "semaine" | "jour";
