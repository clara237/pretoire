"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getCabinetConfig } from "@/lib/cabinet";
import { getProfilCourant } from "@/lib/auth";
import { canEdit } from "@/lib/roles";
import {
  STATUTS_FACTURE,
  MODES_PAIEMENT,
  CATEGORIES_LIGNE_FACTURE,
} from "@/lib/finance-constants";
import { envoyerEmail } from "@/lib/email";
import { createAdminClient } from "@/lib/supabase/admin";
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
 * Calcule le prochain numéro de facture pour une année : FACT-AAAA-NNN.
 * Séquence côté serveur = max existant de l'année + 1 (robuste vis-à-vis du seed).
 */
async function prochainNumeroFacture(
  supabase: ReturnType<typeof createClient>,
  annee: number,
): Promise<string> {
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

export interface DonneesFactureBase {
  client_id?: string | null;
  dossier_id?: string | null;
  date_emission: string;
  date_echeance?: string | null;
  notes?: string | null;
}

export interface SaisieFacturableLigne {
  id: string;
  date: string;
  type_tache: string;
  description: string | null;
  duree_heures: number;
  taux_horaire: number | null;
  nomAvocat: string;
  client_id: string | null;
}

/**
 * Charge les saisies de temps facturables (non encore facturées) d'un dossier,
 * pour alimenter le mode « facturation depuis le temps » (composant client).
 */
export async function chargerSaisiesFacturables(
  dossierId: string,
): Promise<SaisieFacturableLigne[]> {
  const profil = await getProfilCourant();
  if (!profil || !canEdit(profil.role, "facturation")) return [];
  if (!dossierId) return [];

  const supabase = createClient();
  const { data } = await supabase
    .from("saisies_temps")
    .select(
      "id, date, type_tache, description, duree_heures, taux_horaire, " +
        "profil:profiles(nom, prenom), dossier:dossiers(client_id)",
    )
    .eq("dossier_id", dossierId)
    .eq("facturable", true)
    .is("facture_id", null)
    .order("date", { ascending: true });

  type Row = {
    id: string;
    date: string;
    type_tache: string;
    description: string | null;
    duree_heures: number;
    taux_horaire: number | null;
    profil: { nom: string; prenom: string } | null;
    dossier: { client_id: string | null } | null;
  };
  return ((data as Row[] | null) ?? []).map((r) => ({
    id: r.id,
    date: r.date,
    type_tache: r.type_tache,
    description: r.description,
    duree_heures: r.duree_heures,
    taux_horaire: r.taux_horaire,
    nomAvocat: [r.profil?.prenom, r.profil?.nom].filter(Boolean).join(" ") || "—",
    client_id: r.dossier?.client_id ?? null,
  }));
}

/**
 * Crée une facture à partir de saisies de temps facturables (non facturées).
 * Le montant HT = somme(durée × taux). Les saisies sont rattachées (facture_id).
 */
export async function creerFactureDepuisTemps(
  base: DonneesFactureBase & { saisie_ids: string[] },
): Promise<ResultatAction> {
  const profil = await getProfilCourant();
  if (!profil || !canEdit(profil.role, "facturation")) {
    return { ok: false, message: "Accès refusé." };
  }
  if (!base.saisie_ids || base.saisie_ids.length === 0) {
    return { ok: false, message: "Sélectionnez au moins une saisie de temps." };
  }
  if (!base.date_emission) {
    return { ok: false, message: "La date d'émission est obligatoire." };
  }

  const supabase = createClient();
  const cabinet = await getCabinetConfig();

  // Recharge les saisies pour recalculer le montant côté serveur (sécurité).
  const { data: saisies, error: errSaisies } = await supabase
    .from("saisies_temps")
    .select("id, dossier_id, duree_heures, taux_horaire, facturable, facture_id")
    .in("id", base.saisie_ids);

  type SaisieRow = {
    id: string;
    dossier_id: string | null;
    duree_heures: number;
    taux_horaire: number | null;
    facturable: boolean;
    facture_id: string | null;
  };
  const lignes = (saisies as SaisieRow[] | null) ?? [];
  if (errSaisies || lignes.length === 0) {
    return { ok: false, message: "Saisies introuvables." };
  }
  const invalide = lignes.find((s) => !s.facturable || s.facture_id);
  if (invalide) {
    return {
      ok: false,
      message:
        "Une des saisies n'est pas facturable ou est déjà rattachée à une facture.",
    };
  }

  const ht = lignes.reduce(
    (s, l) => s + (l.duree_heures ?? 0) * (l.taux_horaire ?? 0),
    0,
  );
  const montants = calculerMontants(
    ht,
    cabinet.tva_applicable,
    cabinet.taux_tva,
  );

  const annee = new Date(base.date_emission).getFullYear() || new Date().getFullYear();
  const numero = await prochainNumeroFacture(supabase, annee);

  // dossier_id : celui fourni, sinon déduit des saisies (si homogène).
  let dossierId = nettoyer(base.dossier_id ?? null);
  if (!dossierId) {
    const ids = Array.from(new Set(lignes.map((l) => l.dossier_id).filter(Boolean)));
    if (ids.length === 1) dossierId = ids[0];
  }

  const { data: facture, error } = await supabase
    .from("factures")
    .insert({
      numero,
      client_id: nettoyer(base.client_id ?? null),
      dossier_id: dossierId,
      date_emission: base.date_emission,
      date_echeance: nettoyer(base.date_echeance ?? null),
      montant_ht: montants.montant_ht,
      tva: montants.tva,
      montant_ttc: montants.montant_ttc,
      devise: cabinet.devise || "FCFA",
      statut: "brouillon",
      notes: nettoyer(base.notes ?? null),
      created_by: profil.id,
    })
    .select("id")
    .single();

  if (error || !facture) {
    return { ok: false, message: "Impossible de créer la facture." };
  }
  const factureId = (facture as { id: string }).id;

  // Rattache les saisies à la facture (elles ne seront plus re-facturables).
  const { error: errLien } = await supabase
    .from("saisies_temps")
    .update({ facture_id: factureId })
    .in("id", base.saisie_ids);
  if (errLien) {
    // Best-effort : la facture existe, on signale mais on ne bloque pas.
    return {
      ok: true,
      id: factureId,
      message:
        "Facture créée, mais le rattachement de certaines saisies a échoué.",
    };
  }

  revalidatePath("/facturation");
  revalidatePath("/time-tracking");
  revalidatePath("/finance");
  return { ok: true, id: factureId };
}

/**
 * Crée une facture à honoraires fixes / provision (montant HT saisi librement).
 */
export async function creerFactureMontant(
  base: DonneesFactureBase & { montant_ht: number },
): Promise<ResultatAction> {
  const profil = await getProfilCourant();
  if (!profil || !canEdit(profil.role, "facturation")) {
    return { ok: false, message: "Accès refusé." };
  }
  if (!base.date_emission) {
    return { ok: false, message: "La date d'émission est obligatoire." };
  }
  if (!(base.montant_ht > 0)) {
    return { ok: false, message: "Le montant doit être supérieur à 0." };
  }

  const supabase = createClient();
  const cabinet = await getCabinetConfig();
  const montants = calculerMontants(
    base.montant_ht,
    cabinet.tva_applicable,
    cabinet.taux_tva,
  );
  const annee = new Date(base.date_emission).getFullYear() || new Date().getFullYear();
  const numero = await prochainNumeroFacture(supabase, annee);

  const { data, error } = await supabase
    .from("factures")
    .insert({
      numero,
      client_id: nettoyer(base.client_id ?? null),
      dossier_id: nettoyer(base.dossier_id ?? null),
      date_emission: base.date_emission,
      date_echeance: nettoyer(base.date_echeance ?? null),
      montant_ht: montants.montant_ht,
      tva: montants.tva,
      montant_ttc: montants.montant_ttc,
      devise: cabinet.devise || "FCFA",
      statut: "brouillon",
      notes: nettoyer(base.notes ?? null),
      created_by: profil.id,
    })
    .select("id")
    .single();

  if (error || !data) {
    return { ok: false, message: "Impossible de créer la facture." };
  }
  revalidatePath("/facturation");
  revalidatePath("/finance");
  return { ok: true, id: (data as { id: string }).id };
}

export interface LigneFactureSaisie {
  libelle: string;
  categorie: string;
  quantite: number;
  montant_unitaire: number;
}

/**
 * Crée une facture « détaillée » à partir de lignes libres saisies par
 * l'admin : frais d'ouverture, déplacements, honoraires, débours (timbres,
 * certifications, certificats…). Le montant HT = somme des lignes.
 */
export async function creerFactureLignes(
  base: DonneesFactureBase & { lignes: LigneFactureSaisie[] },
): Promise<ResultatAction> {
  const profil = await getProfilCourant();
  if (!profil || !canEdit(profil.role, "facturation")) {
    return { ok: false, message: "Accès refusé." };
  }
  if (!base.date_emission) {
    return { ok: false, message: "La date d'émission est obligatoire." };
  }

  // Nettoyage + validation des lignes
  const categoriesOk = new Set(CATEGORIES_LIGNE_FACTURE as readonly string[]);
  const lignes = (base.lignes ?? [])
    .map((l) => {
      const libelle = (l.libelle ?? "").trim();
      const quantite = Math.max(0, Number(l.quantite) || 0);
      const pu = Math.round(Number(l.montant_unitaire) || 0);
      const categorie = categoriesOk.has(l.categorie) ? l.categorie : "autre";
      return { libelle, categorie, quantite, montant_unitaire: pu, montant: Math.round(quantite * pu) };
    })
    .filter((l) => l.libelle && l.montant > 0);

  if (lignes.length === 0) {
    return { ok: false, message: "Ajoutez au moins une ligne valide (libellé + montant)." };
  }

  const supabase = createClient();
  const cabinet = await getCabinetConfig();
  const totalHt = lignes.reduce((s, l) => s + l.montant, 0);
  const montants = calculerMontants(totalHt, cabinet.tva_applicable, cabinet.taux_tva);
  const annee = new Date(base.date_emission).getFullYear() || new Date().getFullYear();
  const numero = await prochainNumeroFacture(supabase, annee);

  const { data, error } = await supabase
    .from("factures")
    .insert({
      numero,
      client_id: nettoyer(base.client_id ?? null),
      dossier_id: nettoyer(base.dossier_id ?? null),
      date_emission: base.date_emission,
      date_echeance: nettoyer(base.date_echeance ?? null),
      montant_ht: montants.montant_ht,
      tva: montants.tva,
      montant_ttc: montants.montant_ttc,
      devise: cabinet.devise || "FCFA",
      statut: "brouillon",
      notes: nettoyer(base.notes ?? null),
      created_by: profil.id,
    })
    .select("id")
    .single();

  if (error || !data) {
    return { ok: false, message: "Impossible de créer la facture." };
  }
  const factureId = (data as { id: string }).id;

  const { error: errLignes } = await supabase.from("lignes_facture").insert(
    lignes.map((l, i) => ({
      facture_id: factureId,
      libelle: l.libelle,
      categorie: l.categorie,
      quantite: l.quantite,
      montant_unitaire: l.montant_unitaire,
      montant: l.montant,
      ordre: i,
    })),
  );
  if (errLignes) {
    // La facture sans lignes serait incohérente : on la supprime.
    await supabase.from("factures").delete().eq("id", factureId);
    return { ok: false, message: "Impossible d'enregistrer les lignes de la facture." };
  }

  revalidatePath("/facturation");
  revalidatePath("/finance");
  return { ok: true, id: factureId };
}

/** Change manuellement le statut d'une facture. */
export async function changerStatutFacture(
  id: string,
  statut: string,
): Promise<ResultatAction> {
  const profil = await getProfilCourant();
  if (!profil || !canEdit(profil.role, "facturation")) {
    return { ok: false, message: "Accès refusé." };
  }
  if (!STATUTS_FACTURE.includes(statut as (typeof STATUTS_FACTURE)[number])) {
    return { ok: false, message: "Statut invalide." };
  }
  const supabase = createClient();
  const { error } = await supabase
    .from("factures")
    .update({ statut: statut as Enums<"statut_facture"> })
    .eq("id", id);
  if (error) {
    return { ok: false, message: "Impossible de changer le statut." };
  }
  revalidatePath("/facturation");
  revalidatePath(`/facturation/${id}`);
  revalidatePath("/finance");
  return { ok: true, id };
}

/**
 * Recalcule le statut d'une facture d'après ses paiements.
 * - total paiements >= TTC  → payée
 * - total paiements > 0     → partielle
 * - sinon                   → statut inchangé (sauf si on quittait payée/partielle)
 */
async function recalculerStatut(
  supabase: ReturnType<typeof createClient>,
  factureId: string,
): Promise<void> {
  const { data: facture } = await supabase
    .from("factures")
    .select("montant_ttc, statut")
    .eq("id", factureId)
    .maybeSingle();
  if (!facture) return;
  const f = facture as { montant_ttc: number; statut: string };

  const { data: paiements } = await supabase
    .from("paiements")
    .select("montant")
    .eq("facture_id", factureId);
  const total = ((paiements as Array<{ montant: number }> | null) ?? []).reduce(
    (s, p) => s + (p.montant ?? 0),
    0,
  );

  let nouveau = f.statut as Enums<"statut_facture">;
  if (total >= f.montant_ttc && f.montant_ttc > 0) {
    nouveau = "payee";
  } else if (total > 0) {
    nouveau = "partielle";
  } else if (f.statut === "payee" || f.statut === "partielle") {
    // Plus aucun paiement : on retombe sur impayée.
    nouveau = "impayee";
  }
  if (nouveau !== f.statut) {
    await supabase.from("factures").update({ statut: nouveau }).eq("id", factureId);
  }
}

export interface DonneesPaiement {
  date_paiement: string;
  montant: number;
  mode_paiement: string;
  reference?: string | null;
  notes?: string | null;
}

export async function ajouterPaiement(
  factureId: string,
  d: DonneesPaiement,
): Promise<ResultatAction> {
  const profil = await getProfilCourant();
  if (!profil || !canEdit(profil.role, "facturation")) {
    return { ok: false, message: "Accès refusé." };
  }
  if (!d.date_paiement) return { ok: false, message: "La date est obligatoire." };
  if (!(d.montant > 0)) return { ok: false, message: "Le montant doit être positif." };
  if (!MODES_PAIEMENT.includes(d.mode_paiement as (typeof MODES_PAIEMENT)[number])) {
    return { ok: false, message: "Mode de paiement invalide." };
  }

  const supabase = createClient();

  // Garde d'intégrité comptable : refuser un encaissement qui dépasserait le
  // montant TTC de la facture (sinon le « reste à payer » devient négatif).
  const { data: facture } = await supabase
    .from("factures")
    .select("montant_ttc, paiements(montant)")
    .eq("id", factureId)
    .maybeSingle();
  if (!facture) return { ok: false, message: "Facture introuvable." };
  const f = facture as unknown as {
    montant_ttc: number;
    paiements: Array<{ montant: number }> | null;
  };
  const dejaPaye = (f.paiements ?? []).reduce((s, p) => s + (p.montant ?? 0), 0);
  const reste = Math.round(f.montant_ttc) - dejaPaye;
  if (Math.round(d.montant) > reste) {
    return {
      ok: false,
      message: `Le paiement (${Math.round(d.montant).toLocaleString("fr-FR")}) dépasse le reste dû (${Math.max(0, reste).toLocaleString("fr-FR")}).`,
    };
  }

  const { error } = await supabase.from("paiements").insert({
    facture_id: factureId,
    date_paiement: d.date_paiement,
    montant: Math.round(d.montant),
    mode_paiement: d.mode_paiement as Enums<"mode_paiement">,
    reference: nettoyer(d.reference ?? null),
    notes: nettoyer(d.notes ?? null),
  });
  if (error) {
    return { ok: false, message: "Impossible d'enregistrer le paiement." };
  }

  await recalculerStatut(supabase, factureId);
  revalidatePath("/facturation");
  revalidatePath(`/facturation/${factureId}`);
  revalidatePath("/finance");
  return { ok: true };
}

export async function supprimerPaiement(
  paiementId: string,
  factureId: string,
): Promise<ResultatAction> {
  const profil = await getProfilCourant();
  if (!profil || !canEdit(profil.role, "facturation")) {
    return { ok: false, message: "Accès refusé." };
  }
  const supabase = createClient();
  const { error } = await supabase.from("paiements").delete().eq("id", paiementId);
  if (error) {
    return { ok: false, message: "Impossible de supprimer le paiement." };
  }
  await recalculerStatut(supabase, factureId);
  revalidatePath("/facturation");
  revalidatePath(`/facturation/${factureId}`);
  revalidatePath("/finance");
  return { ok: true };
}

export async function supprimerFacture(id: string): Promise<ResultatAction> {
  const profil = await getProfilCourant();
  if (!profil || !canEdit(profil.role, "facturation")) {
    return { ok: false, message: "Accès refusé." };
  }
  const supabase = createClient();

  // Libère les saisies rattachées (redeviennent facturables).
  await supabase
    .from("saisies_temps")
    .update({ facture_id: null })
    .eq("facture_id", id);

  // Les paiements sont supprimés en cascade (FK on delete cascade).
  const { error } = await supabase.from("factures").delete().eq("id", id);
  if (error) {
    return { ok: false, message: "Impossible de supprimer la facture." };
  }
  revalidatePath("/facturation");
  revalidatePath("/time-tracking");
  revalidatePath("/finance");
  return { ok: true };
}

/**
 * Relance : insère une notification de retard pour l'émetteur de la facture
 * et envoie un email de relance au client (si son adresse est connue).
 */
export async function relancerFacture(
  factureId: string,
  palier: number,
): Promise<ResultatAction> {
  const profil = await getProfilCourant();
  if (!profil || !canEdit(profil.role, "facturation")) {
    return { ok: false, message: "Accès refusé." };
  }
  const supabase = createClient();

  const { data: facture } = await supabase
    .from("factures")
    .select(
      "numero, montant_ttc, devise, date_echeance, created_by, " +
        "client:clients(type, nom, prenom, raison_sociale, email)",
    )
    .eq("id", factureId)
    .maybeSingle();
  if (!facture) return { ok: false, message: "Facture introuvable." };

  type FactureRelance = {
    numero: string;
    montant_ttc: number;
    devise: string;
    date_echeance: string | null;
    created_by: string | null;
    client: {
      type: string;
      nom: string | null;
      prenom: string | null;
      raison_sociale: string | null;
      email: string | null;
    } | null;
  };
  const f = facture as unknown as FactureRelance;

  const nomCli =
    f.client?.type === "morale"
      ? f.client?.raison_sociale || "Personne morale"
      : [f.client?.prenom, f.client?.nom].filter(Boolean).join(" ") || "le client";

  // Destinataire de la notification : l'émetteur de la facture (son user_id),
  // sinon l'utilisateur courant. On résout le user_id depuis le profil émetteur.
  let destinataire = profil.user_id;
  if (f.created_by) {
    const { data: createur } = await supabase
      .from("profiles")
      .select("user_id")
      .eq("id", f.created_by)
      .maybeSingle();
    const uid = (createur as { user_id: string } | null)?.user_id;
    if (uid) destinataire = uid;
  }

  // Insertion via service_role : une notification cible le user_id de
  // l'émetteur (potentiellement un autre utilisateur), ce que la RLS
  // `notifications_insert` (user_id = auth.uid()) interdit côté client.
  const { error } = await createAdminClient().from("notifications").insert({
    user_id: destinataire,
    titre: `Relance facture ${f.numero} (J+${palier})`,
    message: `La facture ${f.numero} adressée à ${nomCli} est impayée depuis plus de ${palier} jours.`,
    type: "relance",
    lien: `/facturation/${factureId}`,
  });
  if (error) {
    return { ok: false, message: "Impossible d'enregistrer la relance." };
  }

  // Email de relance au client si son adresse est connue.
  let emailClient = false;
  if (f.client?.email) {
    const montant = `${Math.round(f.montant_ttc).toLocaleString("fr-FR")} ${f.devise || "FCFA"}`;
    const echeance = f.date_echeance
      ? ` arrivée à échéance le ${new Date(f.date_echeance).toLocaleDateString("fr-FR")}`
      : "";
    const r = await envoyerEmail({
      a: f.client.email,
      sujet: `Rappel — facture ${f.numero} en attente de règlement`,
      texte:
        `Bonjour,\n\n` +
        `Sauf erreur de notre part, la facture ${f.numero} d'un montant de ${montant}${echeance} demeure impayée à ce jour.\n\n` +
        `Nous vous remercions de bien vouloir procéder à son règlement dans les meilleurs délais. ` +
        `Si votre paiement a déjà été effectué, merci de ne pas tenir compte de ce message.\n\n` +
        `Cordialement.`,
    });
    emailClient = r.ok;
  }

  // Passe en contentieux au-delà de J+90 si la facture n'est pas déjà soldée.
  if (palier >= 90) {
    const { data: maj } = await supabase
      .from("factures")
      .select("statut")
      .eq("id", factureId)
      .maybeSingle();
    const st = (maj as { statut: string } | null)?.statut;
    if (st && st !== "payee" && st !== "partielle" && st !== "contentieux") {
      await supabase
        .from("factures")
        .update({ statut: "contentieux" })
        .eq("id", factureId);
    }
  }

  revalidatePath("/facturation");
  revalidatePath(`/facturation/${factureId}`);
  return {
    ok: true,
    message: `Relance enregistrée${
      emailClient ? " — email envoyé au client" : ""
    }${palier >= 90 ? " — dossier passé en contentieux." : "."}`,
  };
}
