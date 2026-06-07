/**
 * Constantes, libellés et helpers PURS de la finance (facturation, temps,
 * dépenses, modèles). AUCUN accès base / server-only ici : ce module est
 * importable côté client (formulaires, filtres, génération PDF navigateur).
 */
import type { BadgeTon } from "@/components/ui/badge";

// ---- Statuts de facture -------------------------------------------------
export const STATUTS_FACTURE = [
  "brouillon",
  "envoyee",
  "payee",
  "partielle",
  "impayee",
  "contentieux",
] as const;
export type StatutFacture = (typeof STATUTS_FACTURE)[number];

export const LIBELLE_STATUT_FACTURE: Record<string, string> = {
  brouillon: "Brouillon",
  envoyee: "Envoyée",
  payee: "Payée",
  partielle: "Partielle",
  impayee: "Impayée",
  contentieux: "Contentieux",
};

export const TON_STATUT_FACTURE: Record<string, BadgeTon> = {
  brouillon: "neutre",
  envoyee: "info",
  payee: "succes",
  partielle: "avertissement",
  impayee: "danger",
  contentieux: "danger",
};

// ---- Statuts de devis ---------------------------------------------------
export const STATUTS_DEVIS = [
  "brouillon",
  "envoye",
  "accepte",
  "refuse",
  "expire",
] as const;
export type StatutDevis = (typeof STATUTS_DEVIS)[number];

export const LIBELLE_STATUT_DEVIS: Record<string, string> = {
  brouillon: "Brouillon",
  envoye: "Envoyé",
  accepte: "Accepté",
  refuse: "Refusé",
  expire: "Expiré",
};

export const TON_STATUT_DEVIS: Record<string, BadgeTon> = {
  brouillon: "neutre",
  envoye: "info",
  accepte: "succes",
  refuse: "danger",
  expire: "avertissement",
};

// ---- Modes de paiement --------------------------------------------------
export const MODES_PAIEMENT = [
  "especes",
  "virement",
  "mobile_money",
  "cheque",
] as const;
export type ModePaiement = (typeof MODES_PAIEMENT)[number];

export const LIBELLE_MODE_PAIEMENT: Record<string, string> = {
  especes: "Espèces",
  virement: "Virement",
  mobile_money: "Mobile Money",
  cheque: "Chèque",
};

// ---- Types de tâche (time tracking) ------------------------------------
export const TYPES_TACHE = [
  "consultation",
  "redaction",
  "audience",
  "recherche",
  "deplacement",
] as const;
export type TypeTache = (typeof TYPES_TACHE)[number];

export const LIBELLE_TYPE_TACHE: Record<string, string> = {
  consultation: "Consultation",
  redaction: "Rédaction",
  audience: "Audience",
  recherche: "Recherche",
  deplacement: "Déplacement",
};

export const TON_TYPE_TACHE: Record<string, BadgeTon> = {
  consultation: "info",
  redaction: "principal",
  audience: "danger",
  recherche: "avertissement",
  deplacement: "neutre",
};

// ---- Catégories de dépenses --------------------------------------------
export const CATEGORIES_DEPENSE = [
  "Frais de justice",
  "Déplacement",
  "Fournitures",
  "Loyer",
  "Documentation",
  "Salaires",
  "Télécommunications",
  "Honoraires externes",
  "Autre",
] as const;

// ---- Catégories de modèles ---------------------------------------------
export const CATEGORIES_MODELE = [
  "Recouvrement",
  "Procédure",
  "Contrats",
  "OHADA",
  "Ressources humaines",
  "Correspondance",
  "Autre",
] as const;

// =====================================================================
// Types de lignes partagés (client + serveur)
// =====================================================================

export interface ClientMini {
  id: string;
  type: string;
  nom: string | null;
  prenom: string | null;
  raison_sociale: string | null;
}

export interface DossierMini {
  id: string;
  numero: string;
  titre: string;
  type_affaire: string;
}

export interface ProfilMini {
  id: string;
  nom: string;
  prenom: string;
  photo_url: string | null;
  taux_horaire: number | null;
}

// =====================================================================
// Helpers purs
// =====================================================================

/** Nom affichable d'un client (physique ou morale). */
export function nomClient(c: ClientMini | null | undefined): string {
  if (!c) return "Client inconnu";
  if (c.type === "morale") return c.raison_sociale || "Personne morale";
  return [c.prenom, c.nom].filter(Boolean).join(" ") || "Client";
}

/** Nom affichable d'un avocat / profil. */
export function nomProfil(
  p: { nom: string; prenom: string } | null | undefined,
): string {
  if (!p) return "—";
  return [p.prenom, p.nom].filter(Boolean).join(" ") || "Avocat";
}

/** Somme des paiements. */
export function totalPaiements(
  paiements: Array<{ montant: number | null }> | null | undefined,
): number {
  return (paiements ?? []).reduce((s, p) => s + (p.montant ?? 0), 0);
}

/** Solde restant dû d'une facture. */
export function soldeRestant(
  ttc: number,
  paiements: Array<{ montant: number | null }> | null | undefined,
): number {
  return Math.max(0, ttc - totalPaiements(paiements));
}

/**
 * Niveau de retard d'une facture non soldée d'après son échéance.
 * Renvoie null si payée, sans échéance, ou pas encore échue (< 30 j).
 */
export function paliersRetard(
  statut: string,
  dateEcheance: string | null,
): { jours: number; palier: 30 | 60 | 90 } | null {
  if (statut === "payee" || !dateEcheance) return null;
  const echeance = new Date(dateEcheance);
  if (Number.isNaN(echeance.getTime())) return null;
  const jours = Math.floor(
    (Date.now() - echeance.getTime()) / (1000 * 60 * 60 * 24),
  );
  if (jours < 30) return null;
  const palier = jours >= 90 ? 90 : jours >= 60 ? 60 : 30;
  return { jours, palier };
}
