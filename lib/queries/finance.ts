import "server-only";
import { createClient } from "@/lib/supabase/server";
import type { Enums } from "@/lib/database.types";

// =====================================================================
// Requêtes Finance (server-only). Les CONSTANTES, libellés et helpers PURS
// vivent dans "@/lib/finance-constants" (importable côté client).
// On les re-exporte ici pour la commodité du code serveur.
// =====================================================================

export {
  STATUTS_FACTURE,
  LIBELLE_STATUT_FACTURE,
  TON_STATUT_FACTURE,
  STATUTS_DEVIS,
  LIBELLE_STATUT_DEVIS,
  TON_STATUT_DEVIS,
  MODES_PAIEMENT,
  LIBELLE_MODE_PAIEMENT,
  TYPES_TACHE,
  LIBELLE_TYPE_TACHE,
  TON_TYPE_TACHE,
  CATEGORIES_DEPENSE,
  CATEGORIES_MODELE,
  nomClient,
  nomProfil,
  totalPaiements,
  soldeRestant,
  paliersRetard,
} from "@/lib/finance-constants";
export type {
  StatutFacture,
  ModePaiement,
  TypeTache,
  ClientMini,
  DossierMini,
  ProfilMini,
} from "@/lib/finance-constants";

import type {
  ClientMini,
  DossierMini,
  ProfilMini,
} from "@/lib/finance-constants";

// =====================================================================
// SAISIES DE TEMPS
// =====================================================================

export interface SaisieTemps {
  id: string;
  profile_id: string;
  dossier_id: string | null;
  date: string;
  type_tache: string;
  description: string | null;
  duree_heures: number;
  taux_horaire: number | null;
  facturable: boolean;
  facture_id: string | null;
  created_at: string;
  profil: ProfilMini | null;
  dossier: DossierMini | null;
}

const SELECT_SAISIE =
  "id, profile_id, dossier_id, date, type_tache, description, duree_heures, " +
  "taux_horaire, facturable, facture_id, created_at, " +
  "profil:profiles(id, nom, prenom, photo_url, taux_horaire), " +
  "dossier:dossiers(id, numero, titre, type_affaire)";

export interface FiltresSaisies {
  profileId?: string;
  dossierId?: string;
  debut?: string;
  fin?: string;
}

/** Liste des saisies de temps sur un intervalle (timesheet). */
export async function listerSaisies(
  filtres: FiltresSaisies = {},
): Promise<SaisieTemps[]> {
  const supabase = createClient();
  let req = supabase
    .from("saisies_temps")
    .select(SELECT_SAISIE)
    .order("date", { ascending: false })
    .order("created_at", { ascending: false });

  if (filtres.profileId && filtres.profileId !== "tous") {
    req = req.eq("profile_id", filtres.profileId);
  }
  if (filtres.dossierId) req = req.eq("dossier_id", filtres.dossierId);
  if (filtres.debut) req = req.gte("date", filtres.debut);
  if (filtres.fin) req = req.lte("date", filtres.fin);

  const { data } = await req;
  return (data ?? []) as unknown as SaisieTemps[];
}

// =====================================================================
// FACTURES
// =====================================================================

export interface FactureListe {
  id: string;
  numero: string;
  date_emission: string;
  date_echeance: string | null;
  montant_ht: number;
  tva: number;
  montant_ttc: number;
  devise: string;
  statut: string;
  client: ClientMini | null;
  dossier: DossierMini | null;
  paiements: Array<{ montant: number }>;
}

const SELECT_FACTURE_LISTE =
  "id, numero, date_emission, date_echeance, montant_ht, tva, montant_ttc, " +
  "devise, statut, " +
  "client:clients(id, type, nom, prenom, raison_sociale), " +
  "dossier:dossiers(id, numero, titre, type_affaire), " +
  "paiements(montant)";

export interface FiltresFactures {
  statut?: string;
  recherche?: string;
}

export async function listerFactures(
  filtres: FiltresFactures = {},
): Promise<FactureListe[]> {
  const supabase = createClient();
  let req = supabase
    .from("factures")
    .select(SELECT_FACTURE_LISTE)
    .order("date_emission", { ascending: false })
    .order("numero", { ascending: false });

  if (filtres.statut && filtres.statut !== "tous") {
    req = req.eq("statut", filtres.statut as Enums<"statut_facture">);
  }
  const terme = filtres.recherche?.trim();
  if (terme) {
    const echappe = terme.replace(/[%,]/g, " ");
    req = req.ilike("numero", `%${echappe}%`);
  }

  const { data } = await req;
  return (data ?? []) as unknown as FactureListe[];
}

export interface PaiementLigne {
  id: string;
  date_paiement: string;
  montant: number;
  mode_paiement: string;
  reference: string | null;
  notes: string | null;
}

export interface FactureDetail {
  id: string;
  numero: string;
  client_id: string | null;
  dossier_id: string | null;
  date_emission: string;
  date_echeance: string | null;
  montant_ht: number;
  tva: number;
  montant_ttc: number;
  devise: string;
  statut: string;
  notes: string | null;
  created_at: string;
  client: ClientMini | null;
  dossier: DossierMini | null;
  paiements: PaiementLigne[];
  lignes: SaisieTemps[];
}

/** Détail complet d'une facture : client, dossier, paiements, lignes (saisies liées). */
export async function recupererFacture(
  id: string,
): Promise<FactureDetail | null> {
  const supabase = createClient();
  const { data } = await supabase
    .from("factures")
    .select(
      "id, numero, client_id, dossier_id, date_emission, date_echeance, " +
        "montant_ht, tva, montant_ttc, devise, statut, notes, created_at, " +
        "client:clients(id, type, nom, prenom, raison_sociale), " +
        "dossier:dossiers(id, numero, titre, type_affaire), " +
        "paiements(id, date_paiement, montant, mode_paiement, reference, notes), " +
        "lignes:saisies_temps(" +
        "id, profile_id, dossier_id, date, type_tache, description, duree_heures, " +
        "taux_horaire, facturable, facture_id, created_at, " +
        "profil:profiles(id, nom, prenom, photo_url, taux_horaire), " +
        "dossier:dossiers(id, numero, titre, type_affaire))",
    )
    .eq("id", id)
    .maybeSingle();
  if (!data) return null;
  const f = data as unknown as FactureDetail;
  f.paiements = (f.paiements ?? []).sort((a, b) =>
    a.date_paiement < b.date_paiement ? 1 : -1,
  );
  f.lignes = (f.lignes ?? []).sort((a, b) => (a.date < b.date ? -1 : 1));
  return f;
}

// =====================================================================
// DEVIS
// =====================================================================

export interface DevisListe {
  id: string;
  numero: string;
  objet: string | null;
  date_emission: string;
  date_validite: string | null;
  montant_ht: number;
  tva: number;
  montant_ttc: number;
  devise: string;
  statut: string;
  facture_id: string | null;
  client: ClientMini | null;
  dossier: DossierMini | null;
  facture: { id: string; numero: string } | null;
}

const SELECT_DEVIS_LISTE =
  "id, numero, objet, date_emission, date_validite, montant_ht, tva, " +
  "montant_ttc, devise, statut, facture_id, " +
  "client:clients(id, type, nom, prenom, raison_sociale), " +
  "dossier:dossiers(id, numero, titre, type_affaire), " +
  "facture:factures(id, numero)";

export interface FiltresDevis {
  statut?: string;
  recherche?: string;
}

export async function listerDevis(
  filtres: FiltresDevis = {},
): Promise<DevisListe[]> {
  const supabase = createClient();
  let req = supabase
    .from("devis")
    .select(SELECT_DEVIS_LISTE)
    .order("date_emission", { ascending: false })
    .order("numero", { ascending: false });

  if (filtres.statut && filtres.statut !== "tous") {
    req = req.eq("statut", filtres.statut as Enums<"statut_devis">);
  }
  const terme = filtres.recherche?.trim();
  if (terme) {
    const echappe = terme.replace(/[%,]/g, " ");
    req = req.ilike("numero", `%${echappe}%`);
  }

  const { data } = await req;
  return (data ?? []) as unknown as DevisListe[];
}

export interface DevisDetail {
  id: string;
  numero: string;
  client_id: string | null;
  dossier_id: string | null;
  objet: string | null;
  date_emission: string;
  date_validite: string | null;
  montant_ht: number;
  tva: number;
  montant_ttc: number;
  devise: string;
  statut: string;
  notes: string | null;
  facture_id: string | null;
  created_at: string;
  client: ClientMini | null;
  dossier: DossierMini | null;
  facture: { id: string; numero: string } | null;
}

export async function recupererDevis(id: string): Promise<DevisDetail | null> {
  const supabase = createClient();
  const { data } = await supabase
    .from("devis")
    .select(
      "id, numero, client_id, dossier_id, objet, date_emission, date_validite, " +
        "montant_ht, tva, montant_ttc, devise, statut, notes, facture_id, created_at, " +
        "client:clients(id, type, nom, prenom, raison_sociale), " +
        "dossier:dossiers(id, numero, titre, type_affaire), " +
        "facture:factures(id, numero)",
    )
    .eq("id", id)
    .maybeSingle();
  if (!data) return null;
  return data as unknown as DevisDetail;
}

// =====================================================================
// DÉPENSES
// =====================================================================

export interface Depense {
  id: string;
  categorie: string;
  description: string | null;
  montant: number;
  date_depense: string;
  justificatif_url: string | null;
  created_at: string;
}

export interface FiltresDepenses {
  categorie?: string;
  debut?: string;
  fin?: string;
}

export async function listerDepenses(
  filtres: FiltresDepenses = {},
): Promise<Depense[]> {
  const supabase = createClient();
  let req = supabase
    .from("depenses")
    .select("id, categorie, description, montant, date_depense, justificatif_url, created_at")
    .order("date_depense", { ascending: false });

  if (filtres.categorie && filtres.categorie !== "tous") {
    req = req.eq("categorie", filtres.categorie);
  }
  if (filtres.debut) req = req.gte("date_depense", filtres.debut);
  if (filtres.fin) req = req.lte("date_depense", filtres.fin);

  const { data } = await req;
  return (data ?? []) as unknown as Depense[];
}

// =====================================================================
// MODÈLES DE DOCUMENTS
// =====================================================================

export interface ModeleDocument {
  id: string;
  nom: string;
  categorie: string | null;
  description: string | null;
  fichier_url: string | null;
  actif: boolean;
  created_at: string;
}

export async function listerModeles(opts?: {
  categorie?: string;
  inclureInactifs?: boolean;
}): Promise<ModeleDocument[]> {
  const supabase = createClient();
  let req = supabase
    .from("modeles_documents")
    .select("id, nom, categorie, description, fichier_url, actif, created_at")
    .order("categorie", { ascending: true })
    .order("nom", { ascending: true });
  if (!opts?.inclureInactifs) req = req.eq("actif", true);
  if (opts?.categorie && opts.categorie !== "tous") {
    req = req.eq("categorie", opts.categorie);
  }
  const { data } = await req;
  return (data ?? []) as unknown as ModeleDocument[];
}

// =====================================================================
// Sélecteurs (formulaires)
// =====================================================================

export async function listerProfilsSelecteur(): Promise<ProfilMini[]> {
  const supabase = createClient();
  const { data } = await supabase
    .from("profiles")
    .select("id, nom, prenom, photo_url, taux_horaire")
    .eq("actif", true)
    .order("nom", { ascending: true });
  return (data ?? []) as unknown as ProfilMini[];
}

export async function listerDossiersSelecteur(): Promise<DossierMini[]> {
  const supabase = createClient();
  const { data } = await supabase
    .from("dossiers")
    .select("id, numero, titre, type_affaire")
    .order("created_at", { ascending: false });
  return (data ?? []) as unknown as DossierMini[];
}

export async function listerClientsSelecteurFinance(): Promise<ClientMini[]> {
  const supabase = createClient();
  const { data } = await supabase
    .from("clients")
    .select("id, type, nom, prenom, raison_sociale")
    .order("created_at", { ascending: false });
  return (data ?? []) as unknown as ClientMini[];
}
