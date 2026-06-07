// =====================================================================
// Constantes, libellés & types partagés — Dossiers
// Module PUR (aucun import server-only) : utilisable côté client ET serveur.
// =====================================================================
import type { BadgeTon } from "@/components/ui/badge";

export const STATUTS_DOSSIER = [
  "ouvert",
  "en_cours",
  "suspendu",
  "cloture",
  "archive",
] as const;
export type StatutDossier = (typeof STATUTS_DOSSIER)[number];

export const LIBELLE_STATUT: Record<string, string> = {
  ouvert: "Ouvert",
  en_cours: "En cours",
  suspendu: "Suspendu",
  cloture: "Clôturé",
  archive: "Archivé",
};

export const TON_STATUT: Record<string, BadgeTon> = {
  ouvert: "info",
  en_cours: "principal",
  suspendu: "avertissement",
  cloture: "succes",
  archive: "neutre",
};

export const TYPES_AFFAIRE = [
  "civil",
  "penal",
  "commercial",
  "social",
  "administratif",
  "ohada",
] as const;
export type TypeAffaire = (typeof TYPES_AFFAIRE)[number];

export const LIBELLE_TYPE_AFFAIRE: Record<string, string> = {
  civil: "Civil",
  penal: "Pénal",
  commercial: "Commercial",
  social: "Social",
  administratif: "Administratif",
  ohada: "OHADA",
};

export const TYPES_PARTIE = ["demandeur", "defendeur", "tiers"] as const;
export type TypePartie = (typeof TYPES_PARTIE)[number];

export const LIBELLE_TYPE_PARTIE: Record<string, string> = {
  demandeur: "Demandeur",
  defendeur: "Défendeur",
  tiers: "Tiers",
};

export const TON_TYPE_PARTIE: Record<string, BadgeTon> = {
  demandeur: "info",
  defendeur: "danger",
  tiers: "neutre",
};

/** Types d'actes de procédure les plus courants (OHADA + camerounais). */
export const TYPES_ACTE = [
  "Assignation",
  "Constitution",
  "Conclusions",
  "Requête",
  "Saisine",
  "Sommation",
  "Mise en demeure",
  "Jugement",
  "Ordonnance",
  "Appel",
  "Pourvoi",
  "Expertise",
  "Transaction",
  "Autre",
] as const;

// ---------------------------------------------------------------------
// Types de lignes
// ---------------------------------------------------------------------

export interface ClientMini {
  id: string;
  type: string;
  nom: string | null;
  prenom: string | null;
  raison_sociale: string | null;
}

export interface ProfilMini {
  id: string;
  nom: string;
  prenom: string;
  photo_url: string | null;
}

export interface DossierListe {
  id: string;
  numero: string;
  titre: string;
  type_affaire: string;
  statut: string;
  date_ouverture: string;
  montant_enjeu: number | null;
  client: ClientMini | null;
  avocat: ProfilMini | null;
}

export interface DossierDetail {
  id: string;
  numero: string;
  titre: string;
  type_affaire: string;
  statut: string;
  description_faits: string | null;
  pretentions: string | null;
  moyens: string | null;
  tribunal: string | null;
  chambre: string | null;
  numero_role: string | null;
  client_id: string | null;
  avocat_responsable_id: string | null;
  date_ouverture: string;
  date_cloture_prev: string | null;
  date_cloture_reel: string | null;
  montant_enjeu: number | null;
  notes_internes: string | null;
  created_at: string;
  client: ClientMini | null;
  avocat: ProfilMini | null;
}

/** Nom affichable d'un client (physique ou morale). */
export function nomClient(c: ClientMini | null | undefined): string {
  if (!c) return "Client inconnu";
  if (c.type === "morale") return c.raison_sociale || "Personne morale";
  return [c.prenom, c.nom].filter(Boolean).join(" ") || "Client";
}

/** Nom affichable d'un avocat/profil. */
export function nomProfil(p: ProfilMini | null | undefined): string {
  if (!p) return "Non assigné";
  return [p.prenom, p.nom].filter(Boolean).join(" ") || "Avocat";
}
