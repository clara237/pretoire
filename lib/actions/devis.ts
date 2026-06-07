"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getCabinetConfig } from "@/lib/cabinet";
import { getProfilCourant } from "@/lib/auth";
import { canEdit } from "@/lib/roles";
import { STATUTS_DEVIS } from "@/lib/finance-constants";
import type { Enums } from "@/lib/database.types";

export interface ResultatAction {
  ok: boolean;
  message?: string;
  id?: string;
}

function nettoyer(v: string | null | undefined): string | null {
  if (v === undefined || v === null) return null;
  const t = v.trim();
  return t === "" ? null : t;
}

/**
 * Calcule le prochain numéro de devis pour une année : DEV-AAAA-NNN.
 * Même logique que les factures : max existant de l'année + 1 (robuste vis-à-vis du seed).
 */
async function prochainNumeroDevis(
  supabase: ReturnType<typeof createClient>,
  annee: number,
): Promise<string> {
  const prefixe = `DEV-${annee}-`;
  const { data } = await supabase
    .from("devis")
    .select("numero")
    .ilike("numero", `${prefixe}%`)
    .order("numero", { ascending: false })
    .limit(1);
  const dernier = (data as Array<{ numero: string }> | null)?.[0]?.numero;
  let n = 1;
  if (dernier) {
    const m = dernier.match(/(\d+)$/);
    if (m) n = parseInt(m[1], 10) + 1;
  }
  return `${prefixe}${String(n).padStart(3, "0")}`;
}

/** TVA applicable d'après cabinet_config. */
function calculerMontants(
  ht: number,
  tvaApplicable: boolean,
  tauxTva: number,
): { montant_ht: number; tva: number; montant_ttc: number } {
  const montant_ht = Math.max(0, Math.round(ht));
  const tva = tvaApplicable ? Math.round((montant_ht * tauxTva) / 100) : 0;
  return { montant_ht, tva, montant_ttc: montant_ht + tva };
}

function datePlus(jours: number): string {
  const d = new Date();
  d.setDate(d.getDate() + jours);
  return d.toISOString().slice(0, 10);
}

export interface DonneesDevis {
  client_id?: string | null;
  dossier_id?: string | null;
  objet?: string | null;
  date_emission: string;
  date_validite?: string | null;
  notes?: string | null;
  montant_ht: number;
}

/**
 * Crée un devis (proforma) à montant HT saisi librement.
 * Numéro DEV-AAAA-NNN généré côté serveur. Statut initial « brouillon ».
 */
export async function creerDevis(d: DonneesDevis): Promise<ResultatAction> {
  const profil = await getProfilCourant();
  if (!profil || !canEdit(profil.role, "facturation")) {
    return { ok: false, message: "Accès refusé." };
  }
  if (!d.date_emission) {
    return { ok: false, message: "La date d'émission est obligatoire." };
  }
  if (!(d.montant_ht > 0)) {
    return { ok: false, message: "Le montant doit être supérieur à 0." };
  }

  const supabase = createClient();
  const cabinet = await getCabinetConfig();
  const montants = calculerMontants(
    d.montant_ht,
    cabinet.tva_applicable,
    cabinet.taux_tva,
  );
  const annee =
    new Date(d.date_emission).getFullYear() || new Date().getFullYear();
  const numero = await prochainNumeroDevis(supabase, annee);

  const { data, error } = await supabase
    .from("devis")
    .insert({
      numero,
      client_id: nettoyer(d.client_id ?? null),
      dossier_id: nettoyer(d.dossier_id ?? null),
      objet: nettoyer(d.objet ?? null),
      date_emission: d.date_emission,
      date_validite: nettoyer(d.date_validite ?? null),
      montant_ht: montants.montant_ht,
      tva: montants.tva,
      montant_ttc: montants.montant_ttc,
      devise: cabinet.devise || "FCFA",
      statut: "brouillon",
      notes: nettoyer(d.notes ?? null),
      created_by: profil.id,
    })
    .select("id")
    .single();

  if (error || !data) {
    return { ok: false, message: "Impossible de créer le devis." };
  }
  revalidatePath("/devis");
  return { ok: true, id: (data as { id: string }).id };
}

/** Change manuellement le statut d'un devis. */
export async function modifierStatutDevis(
  id: string,
  statut: string,
): Promise<ResultatAction> {
  const profil = await getProfilCourant();
  if (!profil || !canEdit(profil.role, "facturation")) {
    return { ok: false, message: "Accès refusé." };
  }
  if (!STATUTS_DEVIS.includes(statut as (typeof STATUTS_DEVIS)[number])) {
    return { ok: false, message: "Statut invalide." };
  }
  const supabase = createClient();
  const { error } = await supabase
    .from("devis")
    .update({ statut: statut as Enums<"statut_devis"> })
    .eq("id", id);
  if (error) {
    return { ok: false, message: "Impossible de changer le statut." };
  }
  revalidatePath("/devis");
  revalidatePath(`/devis/${id}`);
  return { ok: true, id };
}

export async function supprimerDevis(id: string): Promise<ResultatAction> {
  const profil = await getProfilCourant();
  if (!profil || !canEdit(profil.role, "facturation")) {
    return { ok: false, message: "Accès refusé." };
  }
  const supabase = createClient();
  const { error } = await supabase.from("devis").delete().eq("id", id);
  if (error) {
    return { ok: false, message: "Impossible de supprimer le devis." };
  }
  revalidatePath("/devis");
  return { ok: true };
}

/**
 * Convertit un devis en facture.
 * - Interdit si le devis est déjà converti (facture_id non nul), refusé ou expiré.
 * - Crée une facture (mêmes montants / client / dossier), statut brouillon,
 *   échéance +30j, notes « Issue du devis DEV-… ».
 * - Met à jour le devis : facture_id renseigné + statut « accepte ».
 * Renvoie l'id de la facture créée.
 */
export async function convertirDevisEnFacture(
  devisId: string,
): Promise<ResultatAction> {
  const profil = await getProfilCourant();
  if (!profil || !canEdit(profil.role, "facturation")) {
    return { ok: false, message: "Accès refusé." };
  }

  const supabase = createClient();
  const { data: devis } = await supabase
    .from("devis")
    .select(
      "id, numero, client_id, dossier_id, montant_ht, tva, montant_ttc, " +
        "devise, statut, facture_id, notes",
    )
    .eq("id", devisId)
    .maybeSingle();

  if (!devis) {
    return { ok: false, message: "Devis introuvable." };
  }
  type DevisRow = {
    id: string;
    numero: string;
    client_id: string | null;
    dossier_id: string | null;
    montant_ht: number;
    tva: number;
    montant_ttc: number;
    devise: string;
    statut: string;
    facture_id: string | null;
    notes: string | null;
  };
  const d = devis as unknown as DevisRow;

  if (d.facture_id) {
    return { ok: false, message: "Ce devis a déjà été converti en facture." };
  }
  if (d.statut === "refuse" || d.statut === "expire") {
    return {
      ok: false,
      message: "Un devis refusé ou expiré ne peut pas être converti.",
    };
  }

  const dateEmission = datePlus(0);
  const annee = new Date(dateEmission).getFullYear();
  const numeroFacture = await (async () => {
    const prefixe = `FACT-${annee}-`;
    const { data } = await supabase
      .from("factures")
      .select("numero")
      .ilike("numero", `${prefixe}%`)
      .order("numero", { ascending: false })
      .limit(1);
    const dernier = (data as Array<{ numero: string }> | null)?.[0]?.numero;
    let n = 1;
    if (dernier) {
      const m = dernier.match(/(\d+)$/);
      if (m) n = parseInt(m[1], 10) + 1;
    }
    return `${prefixe}${String(n).padStart(3, "0")}`;
  })();

  const noteFacture = `Issue du devis ${d.numero}${
    d.notes ? `\n${d.notes}` : ""
  }`;

  const { data: facture, error: errFacture } = await supabase
    .from("factures")
    .insert({
      numero: numeroFacture,
      client_id: d.client_id,
      dossier_id: d.dossier_id,
      date_emission: dateEmission,
      date_echeance: datePlus(30),
      montant_ht: d.montant_ht,
      tva: d.tva,
      montant_ttc: d.montant_ttc,
      devise: d.devise || "FCFA",
      statut: "brouillon",
      notes: noteFacture,
      created_by: profil.id,
    })
    .select("id")
    .single();

  if (errFacture || !facture) {
    return { ok: false, message: "Impossible de créer la facture." };
  }
  const factureId = (facture as { id: string }).id;

  const { error: errMaj } = await supabase
    .from("devis")
    .update({ facture_id: factureId, statut: "accepte" })
    .eq("id", devisId);
  if (errMaj) {
    // La facture existe : on signale mais on ne bloque pas la conversion.
    return {
      ok: true,
      id: factureId,
      message: "Facture créée, mais le devis n'a pas pu être mis à jour.",
    };
  }

  revalidatePath("/devis");
  revalidatePath(`/devis/${devisId}`);
  revalidatePath("/facturation");
  revalidatePath("/finance");
  return { ok: true, id: factureId };
}
