"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getProfilCourant } from "@/lib/auth";
import { canEdit, hasAccess } from "@/lib/roles";
import { STATUTS_DOSSIER, type StatutDossier } from "@/lib/queries/dossiers-labels";
import type { Enums, TablesInsert, TablesUpdate } from "@/lib/database.types";

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

function nombreOuNull(v: string | number | null | undefined): number | null {
  if (v === undefined || v === null || v === "") return null;
  const n = typeof v === "number" ? v : Number(String(v).replace(/\s/g, ""));
  return Number.isFinite(n) ? n : null;
}

// =====================================================================
// Numérotation auto DOS-AAAA-001 (séquence par année, côté serveur)
// =====================================================================

/**
 * Calcule le prochain numéro de dossier pour une année : max existant + 1.
 * Format : DOS-2026-001. Robuste aux trous dans la séquence.
 */
export async function prochainNumeroDossier(annee: number): Promise<string> {
  const profil = await getProfilCourant();
  if (!profil || !canEdit(profil.role, "dossiers")) return `DOS-${annee}-001`;
  const supabase = createClient();
  const prefixe = `DOS-${annee}-`;
  const { data } = await supabase
    .from("dossiers")
    .select("numero")
    .ilike("numero", `${prefixe}%`)
    .order("numero", { ascending: false })
    .limit(1);

  let max = 0;
  const dernier = (data ?? [])[0] as { numero: string } | undefined;
  if (dernier?.numero) {
    const suffixe = dernier.numero.slice(prefixe.length);
    const n = parseInt(suffixe, 10);
    if (Number.isFinite(n)) max = n;
  }
  return `${prefixe}${String(max + 1).padStart(3, "0")}`;
}

// =====================================================================
// Vérification des conflits d'intérêts
// =====================================================================

export interface ConflitDetecte {
  origine: "client" | "partie";
  nomCorrespondant: string;
  nomSaisi: string;
  /** Contexte : nom du client ou numéro/titre du dossier concerné. */
  detail: string;
  dossierId?: string;
}

/**
 * Recherche d'éventuels conflits d'intérêts pour une liste de noms de parties
 * adverses : correspondance (insensible à la casse) avec un client existant
 * OU une partie d'un autre dossier.
 */
export async function verifierConflits(
  nomsAdverses: string[],
): Promise<ConflitDetecte[]> {
  const profil = await getProfilCourant();
  if (!profil || !hasAccess(profil.role, "dossiers")) return [];

  const noms = nomsAdverses
    .map((n) => n.trim())
    .filter((n) => n.length >= 2);
  if (noms.length === 0) return [];

  const supabase = createClient();
  const conflits: ConflitDetecte[] = [];

  for (const nom of noms) {
    // Neutralise les caractères structurels PostgREST (cf. lib/actions/recherche.ts).
    const echappe = nom.replace(/[%_,.()":*\\]/g, " ").trim();

    // 1) Client existant portant ce nom (physique ou morale)
    const { data: clients } = await supabase
      .from("clients")
      .select("id, type, nom, prenom, raison_sociale")
      .or(
        `nom.ilike.%${echappe}%,raison_sociale.ilike.%${echappe}%`,
      )
      .limit(5);
    for (const c of (clients ?? []) as Array<{
      id: string;
      type: string;
      nom: string | null;
      prenom: string | null;
      raison_sociale: string | null;
    }>) {
      const nomClient =
        c.type === "morale"
          ? c.raison_sociale || ""
          : [c.prenom, c.nom].filter(Boolean).join(" ");
      conflits.push({
        origine: "client",
        nomCorrespondant: nomClient || nom,
        nomSaisi: nom,
        detail: "déjà enregistré comme client du cabinet",
      });
    }

    // 2) Partie d'un autre dossier portant ce nom
    const { data: parties } = await supabase
      .from("parties")
      .select("nom, type, dossier_id, dossiers(numero, titre)")
      .ilike("nom", `%${echappe}%`)
      .limit(5);
    for (const p of (parties ?? []) as Array<{
      nom: string;
      type: string;
      dossier_id: string;
      dossiers: { numero: string; titre: string } | null;
    }>) {
      conflits.push({
        origine: "partie",
        nomCorrespondant: p.nom,
        nomSaisi: nom,
        detail: p.dossiers
          ? `partie d'un autre dossier (${p.dossiers.numero} — ${p.dossiers.titre})`
          : "partie d'un autre dossier",
        dossierId: p.dossier_id,
      });
    }
  }

  // Dédoublonnage simple
  const vus = new Set<string>();
  return conflits.filter((c) => {
    const cle = `${c.origine}|${c.nomCorrespondant}|${c.nomSaisi}|${c.dossierId ?? ""}`;
    if (vus.has(cle)) return false;
    vus.add(cle);
    return true;
  });
}

// =====================================================================
// CRUD Dossier
// =====================================================================

export interface PartieSaisie {
  nom: string;
  type: string;
  avocat_adverse?: string | null;
  contact?: string | null;
}

export interface DonneesDossier {
  titre: string;
  type_affaire: string;
  statut?: string;
  client_id?: string | null;
  avocat_responsable_id?: string | null;
  tribunal?: string | null;
  chambre?: string | null;
  numero_role?: string | null;
  description_faits?: string | null;
  pretentions?: string | null;
  moyens?: string | null;
  montant_enjeu?: string | number | null;
  date_ouverture?: string | null;
  date_cloture_prev?: string | null;
  date_cloture_reel?: string | null;
  notes_internes?: string | null;
}

function corpsDossier(d: DonneesDossier): Omit<
  TablesInsert<"dossiers">,
  "numero"
> {
  return {
    titre: nettoyer(d.titre) ?? "",
    type_affaire: (d.type_affaire || "civil") as Enums<"type_affaire">,
    statut: (d.statut || "ouvert") as Enums<"statut_dossier">,
    client_id: nettoyer(d.client_id),
    avocat_responsable_id: nettoyer(d.avocat_responsable_id),
    tribunal: nettoyer(d.tribunal),
    chambre: nettoyer(d.chambre),
    numero_role: nettoyer(d.numero_role),
    description_faits: nettoyer(d.description_faits),
    pretentions: nettoyer(d.pretentions),
    moyens: nettoyer(d.moyens),
    montant_enjeu: nombreOuNull(d.montant_enjeu),
    date_cloture_prev: nettoyer(d.date_cloture_prev),
    date_cloture_reel: nettoyer(d.date_cloture_reel),
    notes_internes: nettoyer(d.notes_internes),
  };
}

/**
 * Crée un dossier. Le numéro est calculé côté serveur (DOS-AAAA-001).
 * Les parties initiales sont insérées dans la foulée.
 * `ignorerConflits` doit valoir true pour passer outre une alerte conflit.
 */
export async function creerDossier(
  d: DonneesDossier,
  parties: PartieSaisie[] = [],
  ignorerConflits = false,
): Promise<ResultatAction & { conflits?: ConflitDetecte[] }> {
  const profil = await getProfilCourant();
  if (!profil || !canEdit(profil.role, "dossiers")) {
    return { ok: false, message: "Accès refusé." };
  }
  const corps = corpsDossier(d);
  if (!corps.titre) return { ok: false, message: "L'intitulé du dossier est obligatoire." };

  // Vérification des conflits sur les parties adverses (défendeur/tiers)
  if (!ignorerConflits) {
    const nomsAdverses = parties
      .filter((p) => p.type === "defendeur" || p.type === "tiers")
      .map((p) => p.nom);
    const conflits = await verifierConflits(nomsAdverses);
    if (conflits.length > 0) {
      return { ok: false, conflits, message: "Conflit d'intérêts potentiel détecté." };
    }
  }

  const supabase = createClient();
  const dateOuverture = nettoyer(d.date_ouverture) ?? new Date().toISOString().slice(0, 10);
  const annee = parseInt(dateOuverture.slice(0, 4), 10) || new Date().getFullYear();
  const numero = await prochainNumeroDossier(annee);

  const { data: cree, error } = await supabase
    .from("dossiers")
    .insert({ ...corps, numero, date_ouverture: dateOuverture })
    .select("id")
    .single();

  if (error || !cree) {
    return { ok: false, message: "Impossible de créer le dossier." };
  }
  const dossierId = (cree as { id: string }).id;

  // Parties initiales
  const partiesValides: TablesInsert<"parties">[] = parties
    .map((p) => ({
      dossier_id: dossierId,
      nom: nettoyer(p.nom) ?? "",
      type: p.type as Enums<"type_partie">,
      avocat_adverse: nettoyer(p.avocat_adverse),
      contact: nettoyer(p.contact),
    }))
    .filter((p) => p.nom);
  if (partiesValides.length > 0) {
    await supabase.from("parties").insert(partiesValides);
  }

  // L'avocat responsable est ajouté à l'équipe par défaut
  if (corps.avocat_responsable_id) {
    await supabase.from("dossier_equipe").insert({
      dossier_id: dossierId,
      profile_id: corps.avocat_responsable_id,
      role_dans_dossier: "Responsable",
    });
  }

  revalidatePath("/dossiers");
  return { ok: true, id: dossierId };
}

export async function modifierDossier(
  id: string,
  d: DonneesDossier,
): Promise<ResultatAction> {
  const profil = await getProfilCourant();
  if (!profil || !canEdit(profil.role, "dossiers")) {
    return { ok: false, message: "Accès refusé." };
  }
  const corps = corpsDossier(d);
  if (!corps.titre) return { ok: false, message: "L'intitulé du dossier est obligatoire." };

  const supabase = createClient();
  const dateOuverture = nettoyer(d.date_ouverture);
  const values = dateOuverture ? { ...corps, date_ouverture: dateOuverture } : corps;
  const { error } = await supabase.from("dossiers").update(values).eq("id", id);
  if (error) {
    return { ok: false, message: "Impossible de modifier le dossier." };
  }
  revalidatePath("/dossiers");
  revalidatePath(`/dossiers/${id}`);
  return { ok: true, id };
}

/** Met à jour uniquement le statut d'un dossier (changement rapide). */
export async function changerStatutDossier(
  id: string,
  statut: string,
): Promise<ResultatAction> {
  const profil = await getProfilCourant();
  if (!profil || !canEdit(profil.role, "dossiers")) {
    return { ok: false, message: "Accès refusé." };
  }
  if (!STATUTS_DOSSIER.includes(statut as StatutDossier)) {
    return { ok: false, message: "Statut invalide." };
  }
  const supabase = createClient();
  const patch: TablesUpdate<"dossiers"> = { statut: statut as Enums<"statut_dossier"> };
  if (statut === "cloture" || statut === "archive") {
    patch.date_cloture_reel = new Date().toISOString().slice(0, 10);
  }
  const { error } = await supabase.from("dossiers").update(patch).eq("id", id);
  if (error) return { ok: false, message: "Impossible de changer le statut." };
  revalidatePath("/dossiers");
  revalidatePath(`/dossiers/${id}`);
  return { ok: true, id };
}

/** Met à jour les notes internes du dossier (onglet Notes). */
export async function enregistrerNotes(
  id: string,
  notes: string,
): Promise<ResultatAction> {
  const profil = await getProfilCourant();
  if (!profil || !canEdit(profil.role, "dossiers")) {
    return { ok: false, message: "Accès refusé." };
  }
  const supabase = createClient();
  const { error } = await supabase
    .from("dossiers")
    .update({ notes_internes: nettoyer(notes) })
    .eq("id", id);
  if (error) return { ok: false, message: "Impossible d'enregistrer les notes." };
  revalidatePath(`/dossiers/${id}`);
  return { ok: true, id };
}

export async function supprimerDossier(id: string): Promise<ResultatAction> {
  const profil = await getProfilCourant();
  if (!profil || !canEdit(profil.role, "dossiers")) {
    return { ok: false, message: "Accès refusé." };
  }
  const supabase = createClient();
  const { error } = await supabase.from("dossiers").delete().eq("id", id);
  if (error) {
    return { ok: false, message: "Impossible de supprimer le dossier." };
  }
  revalidatePath("/dossiers");
  return { ok: true };
}

// =====================================================================
// Parties (onglet Parties)
// =====================================================================

export async function ajouterPartie(
  dossierId: string,
  p: PartieSaisie,
): Promise<ResultatAction> {
  const profil = await getProfilCourant();
  if (!profil || !canEdit(profil.role, "dossiers")) {
    return { ok: false, message: "Accès refusé." };
  }
  const nom = nettoyer(p.nom);
  if (!nom) return { ok: false, message: "Le nom de la partie est obligatoire." };
  const supabase = createClient();
  const { error } = await supabase.from("parties").insert({
    dossier_id: dossierId,
    nom,
    type: (p.type || "tiers") as Enums<"type_partie">,
    avocat_adverse: nettoyer(p.avocat_adverse),
    contact: nettoyer(p.contact),
  });
  if (error) return { ok: false, message: "Impossible d'ajouter la partie." };
  revalidatePath(`/dossiers/${dossierId}`);
  return { ok: true };
}

export async function supprimerPartie(
  id: string,
  dossierId: string,
): Promise<ResultatAction> {
  const profil = await getProfilCourant();
  if (!profil || !canEdit(profil.role, "dossiers")) {
    return { ok: false, message: "Accès refusé." };
  }
  const supabase = createClient();
  const { error } = await supabase.from("parties").delete().eq("id", id);
  if (error) return { ok: false, message: "Impossible de supprimer la partie." };
  revalidatePath(`/dossiers/${dossierId}`);
  return { ok: true };
}

// =====================================================================
// Actes de procédure (onglet Actes)
// =====================================================================

export interface ActeSaisi {
  type_acte: string;
  description?: string | null;
  date_acte?: string | null;
  fichier_url?: string | null;
}

export async function ajouterActe(
  dossierId: string,
  a: ActeSaisi,
): Promise<ResultatAction> {
  const profil = await getProfilCourant();
  if (!profil || !canEdit(profil.role, "dossiers")) {
    return { ok: false, message: "Accès refusé." };
  }
  const type = nettoyer(a.type_acte);
  if (!type) return { ok: false, message: "Le type d'acte est obligatoire." };
  const supabase = createClient();
  const { error } = await supabase.from("actes_procedure").insert({
    dossier_id: dossierId,
    type_acte: type,
    description: nettoyer(a.description),
    date_acte: nettoyer(a.date_acte) ?? new Date().toISOString().slice(0, 10),
    auteur_id: profil.id,
    fichier_url: nettoyer(a.fichier_url),
  });
  if (error) return { ok: false, message: "Impossible d'ajouter l'acte." };
  revalidatePath(`/dossiers/${dossierId}`);
  return { ok: true };
}

/**
 * Variante FormData de l'ajout d'acte, avec fichier joint optionnel.
 * Le fichier est téléversé dans le bucket "documents" (sous-dossier "actes")
 * et son chemin est stocké dans actes_procedure.fichier_url.
 */
export async function ajouterActeFormData(
  form: FormData,
): Promise<ResultatAction> {
  const profil = await getProfilCourant();
  if (!profil || !canEdit(profil.role, "dossiers")) {
    return { ok: false, message: "Accès refusé." };
  }
  const dossierId = (form.get("dossier_id") as string | null)?.trim();
  const type = nettoyer(form.get("type_acte") as string | null);
  if (!dossierId) return { ok: false, message: "Dossier manquant." };
  if (!type) return { ok: false, message: "Le type d'acte est obligatoire." };

  const supabase = createClient();
  let fichierUrl: string | null = null;

  const fichier = form.get("fichier");
  if (fichier instanceof File && fichier.size > 0) {
    if (fichier.size > 25 * 1024 * 1024) {
      return { ok: false, message: "Fichier trop volumineux (max 25 Mo)." };
    }
    const nomNettoye = fichier.name
      .normalize("NFD")
      .replace(/[̀-ͯ]/g, "")
      .replace(/[^a-zA-Z0-9._-]/g, "_");
    const chemin = `${dossierId}/actes/${Date.now()}-${nomNettoye}`;
    const { error: errUpload } = await supabase.storage
      .from("documents")
      .upload(chemin, fichier, {
        contentType: fichier.type || "application/octet-stream",
        upsert: false,
      });
    if (errUpload) {
      return {
        ok: false,
        message:
          "Échec du téléversement du fichier joint (stockage indisponible ?).",
      };
    }
    fichierUrl = chemin;

    // On référence aussi la pièce dans la table documents du dossier.
    await supabase.from("documents").insert({
      nom: `${type} — ${fichier.name}`,
      type: fichier.type || null,
      dossier_id: dossierId,
      uploaded_by: profil.id,
      fichier_url: chemin,
      taille_ko: Math.max(1, Math.round(fichier.size / 1024)),
    });
  }

  const { error } = await supabase.from("actes_procedure").insert({
    dossier_id: dossierId,
    type_acte: type,
    description: nettoyer(form.get("description") as string | null),
    date_acte:
      nettoyer(form.get("date_acte") as string | null) ??
      new Date().toISOString().slice(0, 10),
    auteur_id: profil.id,
    fichier_url: fichierUrl,
  });
  if (error) return { ok: false, message: "Impossible d'ajouter l'acte." };
  revalidatePath(`/dossiers/${dossierId}`);
  return { ok: true };
}

export async function supprimerActe(
  id: string,
  dossierId: string,
): Promise<ResultatAction> {
  const profil = await getProfilCourant();
  if (!profil || !canEdit(profil.role, "dossiers")) {
    return { ok: false, message: "Accès refusé." };
  }
  const supabase = createClient();
  const { error } = await supabase.from("actes_procedure").delete().eq("id", id);
  if (error) return { ok: false, message: "Impossible de supprimer l'acte." };
  revalidatePath(`/dossiers/${dossierId}`);
  return { ok: true };
}

// =====================================================================
// Équipe : avocats (dossier_equipe) + stagiaires (dossier_stagiaires)
// =====================================================================

export async function ajouterMembreEquipe(
  dossierId: string,
  profileId: string,
  roleDansDossier: string,
): Promise<ResultatAction> {
  const profil = await getProfilCourant();
  if (!profil || !canEdit(profil.role, "dossiers")) {
    return { ok: false, message: "Accès refusé." };
  }
  if (!profileId) return { ok: false, message: "Sélectionnez un avocat." };
  const supabase = createClient();
  const { error } = await supabase.from("dossier_equipe").insert({
    dossier_id: dossierId,
    profile_id: profileId,
    role_dans_dossier: nettoyer(roleDansDossier) ?? "Collaborateur",
  });
  if (error) {
    return {
      ok: false,
      message: "Cet avocat est peut-être déjà membre de l'équipe.",
    };
  }
  revalidatePath(`/dossiers/${dossierId}`);
  return { ok: true };
}

export async function retirerMembreEquipe(
  id: string,
  dossierId: string,
): Promise<ResultatAction> {
  const profil = await getProfilCourant();
  if (!profil || !canEdit(profil.role, "dossiers")) {
    return { ok: false, message: "Accès refusé." };
  }
  const supabase = createClient();
  const { error } = await supabase.from("dossier_equipe").delete().eq("id", id);
  if (error) return { ok: false, message: "Impossible de retirer ce membre." };
  revalidatePath(`/dossiers/${dossierId}`);
  return { ok: true };
}

export async function affecterStagiaire(
  dossierId: string,
  stagiaireId: string,
): Promise<ResultatAction> {
  const profil = await getProfilCourant();
  if (!profil || !canEdit(profil.role, "dossiers")) {
    return { ok: false, message: "Accès refusé." };
  }
  if (!stagiaireId) return { ok: false, message: "Sélectionnez un stagiaire." };
  const supabase = createClient();
  const { error } = await supabase.from("dossier_stagiaires").insert({
    dossier_id: dossierId,
    stagiaire_id: stagiaireId,
  });
  if (error) {
    return {
      ok: false,
      message: "Ce stagiaire est peut-être déjà affecté au dossier.",
    };
  }
  revalidatePath(`/dossiers/${dossierId}`);
  return { ok: true };
}

export async function retirerStagiaire(
  id: string,
  dossierId: string,
): Promise<ResultatAction> {
  const profil = await getProfilCourant();
  if (!profil || !canEdit(profil.role, "dossiers")) {
    return { ok: false, message: "Accès refusé." };
  }
  const supabase = createClient();
  const { error } = await supabase.from("dossier_stagiaires").delete().eq("id", id);
  if (error) return { ok: false, message: "Impossible de retirer ce stagiaire." };
  revalidatePath(`/dossiers/${dossierId}`);
  return { ok: true };
}
