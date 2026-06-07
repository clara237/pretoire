import "server-only";
import {
  startOfMonth,
  endOfMonth,
  startOfQuarter,
  startOfYear,
  subMonths,
  format,
} from "date-fns";
import { fr } from "date-fns/locale";
import { createClient } from "@/lib/supabase/server";
import { LIBELLE_TYPE_AFFAIRE } from "@/lib/queries/dossiers";
import { nomClient, nomProfil } from "@/lib/queries/finance";

function iso(d: Date): string {
  return format(d, "yyyy-MM-dd");
}

// ---------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------

export interface FactureBrute {
  id: string;
  date_emission: string;
  montant_ttc: number;
  statut: string;
  client: {
    id: string;
    type: string;
    nom: string | null;
    prenom: string | null;
    raison_sociale: string | null;
  } | null;
  dossier: { type_affaire: string } | null;
  paiements: Array<{ montant: number; date_paiement: string }>;
}

export interface SyntheseFinance {
  caMois: number;
  caTrimestre: number;
  caAnnee: number;
  encaisseMois: number;
  creancesEnCours: number;
  nbFacturesImpayees: number;
}

export interface PointMensuel {
  mois: string; // libellé court "janv."
  facture: number;
  encaisse: number;
}

export interface TopClient {
  nom: string;
  montant: number;
}

export interface RevenuType {
  libelle: string;
  montant: number;
}

export interface RecetteDepenseMois {
  mois: string;
  recettes: number;
  depenses: number;
}

// ---------------------------------------------------------------------
// Chargement brut
// ---------------------------------------------------------------------

async function chargerFactures(): Promise<FactureBrute[]> {
  const supabase = createClient();
  const { data } = await supabase
    .from("factures")
    .select(
      "id, date_emission, montant_ttc, statut, " +
        "client:clients(id, type, nom, prenom, raison_sociale), " +
        "dossier:dossiers(type_affaire), " +
        "paiements(montant, date_paiement)",
    )
    .order("date_emission", { ascending: true });
  return (data ?? []) as unknown as FactureBrute[];
}

async function chargerPaiements(): Promise<
  Array<{ montant: number; date_paiement: string }>
> {
  const supabase = createClient();
  const { data } = await supabase
    .from("paiements")
    .select("montant, date_paiement");
  return (data ?? []) as unknown as Array<{
    montant: number;
    date_paiement: string;
  }>;
}

async function chargerDepenses(): Promise<
  Array<{ montant: number; date_depense: string; categorie: string }>
> {
  const supabase = createClient();
  const { data } = await supabase
    .from("depenses")
    .select("montant, date_depense, categorie");
  return (data ?? []) as unknown as Array<{
    montant: number;
    date_depense: string;
    categorie: string;
  }>;
}

// ---------------------------------------------------------------------
// Agrégations
// ---------------------------------------------------------------------

function dansIntervalle(date: string, debut: string, fin: string): boolean {
  const d = date.slice(0, 10);
  return d >= debut && d <= fin;
}

export async function synthese(): Promise<SyntheseFinance> {
  const factures = await chargerFactures();
  const now = new Date();
  const moisDebut = iso(startOfMonth(now));
  const moisFin = iso(endOfMonth(now));
  const trimDebut = iso(startOfQuarter(now));
  const anneeDebut = iso(startOfYear(now));
  const aujourdhui = iso(now);

  let caMois = 0;
  let caTrimestre = 0;
  let caAnnee = 0;
  let encaisseMois = 0;
  let creancesEnCours = 0;
  let nbFacturesImpayees = 0;

  for (const f of factures) {
    const d = f.date_emission.slice(0, 10);
    if (dansIntervalle(d, moisDebut, moisFin)) caMois += f.montant_ttc;
    if (d >= trimDebut && d <= aujourdhui) caTrimestre += f.montant_ttc;
    if (d >= anneeDebut && d <= aujourdhui) caAnnee += f.montant_ttc;

    const totalPaye = (f.paiements ?? []).reduce(
      (s, p) => s + (p.montant ?? 0),
      0,
    );
    const solde = Math.max(0, f.montant_ttc - totalPaye);
    // Créances : factures non en brouillon, avec solde restant.
    if (f.statut !== "brouillon" && solde > 0) {
      creancesEnCours += solde;
      nbFacturesImpayees += 1;
    }

    for (const p of f.paiements ?? []) {
      if (dansIntervalle(p.date_paiement, moisDebut, moisFin)) {
        encaisseMois += p.montant ?? 0;
      }
    }
  }

  return {
    caMois,
    caTrimestre,
    caAnnee,
    encaisseMois,
    creancesEnCours,
    nbFacturesImpayees,
  };
}

/** Série mensuelle (12 derniers mois) : CA facturé + encaissé. */
export async function serieMensuelle(): Promise<PointMensuel[]> {
  const [factures, paiements] = await Promise.all([
    chargerFactures(),
    chargerPaiements(),
  ]);
  const now = new Date();
  const points: PointMensuel[] = [];

  for (let i = 11; i >= 0; i--) {
    const ref = subMonths(now, i);
    const debut = iso(startOfMonth(ref));
    const fin = iso(endOfMonth(ref));
    const facture = factures
      .filter((f) => dansIntervalle(f.date_emission, debut, fin))
      .reduce((s, f) => s + f.montant_ttc, 0);
    const encaisse = paiements
      .filter((p) => dansIntervalle(p.date_paiement, debut, fin))
      .reduce((s, p) => s + (p.montant ?? 0), 0);
    points.push({
      mois: format(ref, "MMM yy", { locale: fr }),
      facture,
      encaisse,
    });
  }
  return points;
}

/** Top 10 clients par revenus facturés (TTC). */
export async function topClients(): Promise<TopClient[]> {
  const factures = await chargerFactures();
  const map = new Map<string, { nom: string; montant: number }>();
  for (const f of factures) {
    const cle = f.client?.id ?? "__inconnu__";
    const nom = nomClient(f.client);
    const e = map.get(cle) ?? { nom, montant: 0 };
    e.montant += f.montant_ttc;
    map.set(cle, e);
  }
  return Array.from(map.values())
    .sort((a, b) => b.montant - a.montant)
    .slice(0, 10);
}

/** Revenus facturés (TTC) par type de dossier. */
export async function revenusParType(): Promise<RevenuType[]> {
  const factures = await chargerFactures();
  const map = new Map<string, number>();
  for (const f of factures) {
    const type = f.dossier?.type_affaire ?? "__autre__";
    map.set(type, (map.get(type) ?? 0) + f.montant_ttc);
  }
  return Array.from(map.entries())
    .map(([type, montant]) => ({
      libelle:
        type === "__autre__"
          ? "Sans dossier / autre"
          : (LIBELLE_TYPE_AFFAIRE[type] ?? type),
      montant,
    }))
    .sort((a, b) => b.montant - a.montant);
}

/** Recettes (paiements encaissés) vs dépenses, 6 derniers mois. */
export async function recettesDepenses(): Promise<RecetteDepenseMois[]> {
  const [paiements, depenses] = await Promise.all([
    chargerPaiements(),
    chargerDepenses(),
  ]);
  const now = new Date();
  const points: RecetteDepenseMois[] = [];
  for (let i = 5; i >= 0; i--) {
    const ref = subMonths(now, i);
    const debut = iso(startOfMonth(ref));
    const fin = iso(endOfMonth(ref));
    const recettes = paiements
      .filter((p) => dansIntervalle(p.date_paiement, debut, fin))
      .reduce((s, p) => s + (p.montant ?? 0), 0);
    const dep = depenses
      .filter((d) => dansIntervalle(d.date_depense, debut, fin))
      .reduce((s, d) => s + (d.montant ?? 0), 0);
    points.push({
      mois: format(ref, "MMM yy", { locale: fr }),
      recettes,
      depenses: dep,
    });
  }
  return points;
}

// ---------------------------------------------------------------------
// Reporting PDF : activité mensuelle + performance par avocat
// ---------------------------------------------------------------------

export interface DonneesRapport {
  periodeLibelle: string;
  debut: string;
  fin: string;
  chiffreAffaires: number;
  totalEncaisse: number;
  creancesEnCours: number;
  totalDepenses: number;
  nbFactures: number;
  nbFacturesPayees: number;
  heuresTotales: number;
  avocats: Array<{
    nom: string;
    heuresFacturables: number;
    heuresNonFacturables: number;
    valorisation: number;
    nbDossiers: number;
  }>;
  revenusParType: Array<{ libelle: string; montant: number }>;
}

/** Construit les données de reporting pour un mois (par défaut le mois courant). */
export async function donneesRapportMois(
  refMois?: Date,
): Promise<DonneesRapport> {
  const ref = refMois ?? new Date();
  const debut = iso(startOfMonth(ref));
  const fin = iso(endOfMonth(ref));
  const periodeLibelle = format(ref, "MMMM yyyy", { locale: fr });

  const supabase = createClient();
  const [factures, depenses, saisiesRes] = await Promise.all([
    chargerFactures(),
    chargerDepenses(),
    supabase
      .from("saisies_temps")
      .select(
        "duree_heures, taux_horaire, facturable, dossier_id, " +
          "profil:profiles(id, nom, prenom)",
      )
      .gte("date", debut)
      .lte("date", fin),
  ]);

  // Synthèse financière du mois
  let chiffreAffaires = 0;
  let totalEncaisse = 0;
  let creancesEnCours = 0;
  let nbFactures = 0;
  let nbFacturesPayees = 0;
  const revenusTypeMap = new Map<string, number>();

  for (const f of factures) {
    const inMois = dansIntervalle(f.date_emission, debut, fin);
    if (inMois) {
      chiffreAffaires += f.montant_ttc;
      nbFactures += 1;
      if (f.statut === "payee") nbFacturesPayees += 1;
      const type = f.dossier?.type_affaire ?? "__autre__";
      revenusTypeMap.set(type, (revenusTypeMap.get(type) ?? 0) + f.montant_ttc);
    }
    const totalPaye = (f.paiements ?? []).reduce(
      (s, p) => s + (p.montant ?? 0),
      0,
    );
    const solde = Math.max(0, f.montant_ttc - totalPaye);
    if (f.statut !== "brouillon" && solde > 0) creancesEnCours += solde;
    for (const p of f.paiements ?? []) {
      if (dansIntervalle(p.date_paiement, debut, fin)) {
        totalEncaisse += p.montant ?? 0;
      }
    }
  }

  const totalDepenses = depenses
    .filter((d) => dansIntervalle(d.date_depense, debut, fin))
    .reduce((s, d) => s + (d.montant ?? 0), 0);

  // Performance par avocat
  type SaisieRow = {
    duree_heures: number;
    taux_horaire: number | null;
    facturable: boolean;
    dossier_id: string | null;
    profil: { id: string; nom: string; prenom: string } | null;
  };
  const saisies = (saisiesRes.data as SaisieRow[] | null) ?? [];
  let heuresTotales = 0;
  const avocatsMap = new Map<
    string,
    {
      nom: string;
      heuresFacturables: number;
      heuresNonFacturables: number;
      valorisation: number;
      dossiers: Set<string>;
    }
  >();
  for (const s of saisies) {
    heuresTotales += s.duree_heures ?? 0;
    const cle = s.profil?.id ?? "__inconnu__";
    const e = avocatsMap.get(cle) ?? {
      nom: nomProfil(s.profil),
      heuresFacturables: 0,
      heuresNonFacturables: 0,
      valorisation: 0,
      dossiers: new Set<string>(),
    };
    if (s.facturable) {
      e.heuresFacturables += s.duree_heures ?? 0;
      e.valorisation += (s.duree_heures ?? 0) * (s.taux_horaire ?? 0);
    } else {
      e.heuresNonFacturables += s.duree_heures ?? 0;
    }
    if (s.dossier_id) e.dossiers.add(s.dossier_id);
    avocatsMap.set(cle, e);
  }

  const avocats = Array.from(avocatsMap.values())
    .map((a) => ({
      nom: a.nom,
      heuresFacturables: a.heuresFacturables,
      heuresNonFacturables: a.heuresNonFacturables,
      valorisation: a.valorisation,
      nbDossiers: a.dossiers.size,
    }))
    .sort((a, b) => b.valorisation - a.valorisation);

  const revenusParType = Array.from(revenusTypeMap.entries())
    .map(([type, montant]) => ({
      libelle:
        type === "__autre__"
          ? "Sans dossier / autre"
          : (LIBELLE_TYPE_AFFAIRE[type] ?? type),
      montant,
    }))
    .sort((a, b) => b.montant - a.montant);

  return {
    periodeLibelle,
    debut,
    fin,
    chiffreAffaires,
    totalEncaisse,
    creancesEnCours,
    totalDepenses,
    nbFactures,
    nbFacturesPayees,
    heuresTotales,
    avocats,
    revenusParType,
  };
}
