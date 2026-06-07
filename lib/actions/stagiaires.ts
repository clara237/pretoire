"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getProfilCourant } from "@/lib/auth";
import { canEdit } from "@/lib/roles";
import type { Json } from "@/lib/database.types";

export interface ResultatAction {
  ok: boolean;
  message?: string;
  id?: string;
}

/** Critères d'évaluation notés de 1 à 5 (cf. SPEC). */
export const CRITERES_EVALUATION = [
  { cle: "assiduite", libelle: "Assiduité" },
  { cle: "qualite", libelle: "Qualité du travail" },
  { cle: "initiative", libelle: "Initiative" },
  { cle: "relationnel", libelle: "Relationnel" },
  { cle: "autonomie", libelle: "Autonomie" },
] as const;

export type CleCritere = (typeof CRITERES_EVALUATION)[number]["cle"];

/**
 * Une évaluation stockée dans stagiaires.notes_evaluation (jsonb[]).
 * `note` reste la moyenne globale de l'évaluation (compatibilité avec le seed
 * historique qui ne contient que {date, note, commentaire}).
 */
export interface Evaluation {
  date: string;
  note: number;
  commentaire: string | null;
  criteres?: Partial<Record<CleCritere, number>>;
  evaluateur?: string | null;
}

function nettoyer(v: FormDataEntryValue | null): string | null {
  if (v === null) return null;
  const s = String(v).trim();
  return s.length > 0 ? s : null;
}

function nettoyerDate(v: FormDataEntryValue | null): string | null {
  const s = nettoyer(v);
  if (!s) return null;
  const d = new Date(s);
  return Number.isNaN(d.getTime()) ? null : s;
}

// ---------------------------------------------------------------------------
// CRUD STAGIAIRE
// ---------------------------------------------------------------------------

interface DonneesStagiaire {
  nom: string;
  prenom: string;
  email: string | null;
  telephone: string | null;
  universite: string | null;
  annee_etude: string | null;
  date_debut: string | null;
  date_fin: string | null;
  maitre_stage_id: string | null;
  objectifs_stage: string | null;
}

function lireStagiaire(formData: FormData): DonneesStagiaire | { erreur: string } {
  const nom = nettoyer(formData.get("nom"));
  const prenom = nettoyer(formData.get("prenom"));
  if (!nom) return { erreur: "Le nom est obligatoire." };
  if (!prenom) return { erreur: "Le prénom est obligatoire." };

  const dateDebut = nettoyerDate(formData.get("date_debut"));
  const dateFin = nettoyerDate(formData.get("date_fin"));
  if (dateDebut && dateFin && new Date(dateFin) < new Date(dateDebut)) {
    return { erreur: "La date de fin doit suivre la date de début." };
  }

  return {
    nom,
    prenom,
    email: nettoyer(formData.get("email")),
    telephone: nettoyer(formData.get("telephone")),
    universite: nettoyer(formData.get("universite")),
    annee_etude: nettoyer(formData.get("annee_etude")),
    date_debut: dateDebut,
    date_fin: dateFin,
    maitre_stage_id: nettoyer(formData.get("maitre_stage_id")),
    objectifs_stage: nettoyer(formData.get("objectifs_stage")),
  };
}

export async function creerStagiaire(formData: FormData): Promise<ResultatAction> {
  const profil = await getProfilCourant();
  if (!profil) return { ok: false, message: "Session expirée." };
  if (!canEdit(profil.role, "stagiaires")) {
    return { ok: false, message: "Accès refusé." };
  }

  const lu = lireStagiaire(formData);
  if ("erreur" in lu) return { ok: false, message: lu.erreur };

  const supabase = createClient();
  const { data, error } = await supabase
    .from("stagiaires")
    .insert({ ...lu, notes_evaluation: [], actif: true })
    .select("id")
    .single();

  if (error) {
    return { ok: false, message: `Création impossible : ${error.message}` };
  }

  revalidatePath("/stagiaires");
  return { ok: true, id: (data as { id: string } | null)?.id };
}

export async function modifierStagiaire(
  id: string,
  formData: FormData,
): Promise<ResultatAction> {
  const profil = await getProfilCourant();
  if (!profil) return { ok: false, message: "Session expirée." };
  if (!canEdit(profil.role, "stagiaires")) {
    return { ok: false, message: "Accès refusé." };
  }

  const lu = lireStagiaire(formData);
  if ("erreur" in lu) return { ok: false, message: lu.erreur };

  const supabase = createClient();
  const { error } = await supabase.from("stagiaires").update(lu).eq("id", id);
  if (error) {
    return { ok: false, message: `Modification impossible : ${error.message}` };
  }

  revalidatePath("/stagiaires");
  revalidatePath(`/stagiaires/${id}`);
  return { ok: true, id };
}

export async function basculerActifStagiaire(
  id: string,
  actif: boolean,
): Promise<ResultatAction> {
  const profil = await getProfilCourant();
  if (!profil) return { ok: false, message: "Session expirée." };
  if (!canEdit(profil.role, "stagiaires")) {
    return { ok: false, message: "Accès refusé." };
  }

  const supabase = createClient();
  const { error } = await supabase.from("stagiaires").update({ actif }).eq("id", id);
  if (error) return { ok: false, message: error.message };

  revalidatePath("/stagiaires");
  revalidatePath(`/stagiaires/${id}`);
  return { ok: true };
}

export async function supprimerStagiaire(id: string): Promise<ResultatAction> {
  const profil = await getProfilCourant();
  if (!profil) return { ok: false, message: "Session expirée." };
  if (!canEdit(profil.role, "stagiaires")) {
    return { ok: false, message: "Accès refusé." };
  }

  const supabase = createClient();
  const { error } = await supabase.from("stagiaires").delete().eq("id", id);
  if (error) return { ok: false, message: `Suppression impossible : ${error.message}` };

  revalidatePath("/stagiaires");
  return { ok: true };
}

// ---------------------------------------------------------------------------
// PRÉSENCES (pointage journalier)
// ---------------------------------------------------------------------------

export async function enregistrerPresence(
  stagiaireId: string,
  formData: FormData,
): Promise<ResultatAction> {
  const profil = await getProfilCourant();
  if (!profil) return { ok: false, message: "Session expirée." };
  if (!canEdit(profil.role, "stagiaires")) {
    return { ok: false, message: "Accès refusé." };
  }

  const date = nettoyerDate(formData.get("date"));
  if (!date) return { ok: false, message: "La date est obligatoire." };

  const present =
    formData.get("present") === "on" || formData.get("present") === "true";

  const supabase = createClient();
  // upsert sur la contrainte unique (stagiaire_id, date)
  const { error } = await supabase.from("presences_stagiaires").upsert(
    {
      stagiaire_id: stagiaireId,
      date,
      present,
      heure_arrivee: present ? nettoyer(formData.get("heure_arrivee")) : null,
      heure_depart: present ? nettoyer(formData.get("heure_depart")) : null,
      motif_absence: present ? null : nettoyer(formData.get("motif_absence")),
      valide_par: profil.id,
    },
    { onConflict: "stagiaire_id,date" },
  );

  if (error) {
    return { ok: false, message: `Enregistrement impossible : ${error.message}` };
  }

  revalidatePath(`/stagiaires/${stagiaireId}`);
  return { ok: true };
}

export async function supprimerPresence(
  presenceId: string,
  stagiaireId: string,
): Promise<ResultatAction> {
  const profil = await getProfilCourant();
  if (!profil) return { ok: false, message: "Session expirée." };
  if (!canEdit(profil.role, "stagiaires")) {
    return { ok: false, message: "Accès refusé." };
  }

  const supabase = createClient();
  const { error } = await supabase
    .from("presences_stagiaires")
    .delete()
    .eq("id", presenceId);
  if (error) return { ok: false, message: error.message };

  revalidatePath(`/stagiaires/${stagiaireId}`);
  return { ok: true };
}

// ---------------------------------------------------------------------------
// ÉVALUATIONS (notation 1-5 + note globale recalculée)
// ---------------------------------------------------------------------------

function moyenne(valeurs: number[]): number {
  if (valeurs.length === 0) return 0;
  const somme = valeurs.reduce((a, b) => a + b, 0);
  return Math.round((somme / valeurs.length) * 10) / 10;
}

export async function ajouterEvaluation(
  stagiaireId: string,
  formData: FormData,
): Promise<ResultatAction> {
  const profil = await getProfilCourant();
  if (!profil) return { ok: false, message: "Session expirée." };
  if (!canEdit(profil.role, "stagiaires")) {
    return { ok: false, message: "Accès refusé." };
  }

  const date = nettoyerDate(formData.get("date")) ?? new Date().toISOString().slice(0, 10);

  const criteres: Partial<Record<CleCritere, number>> = {};
  const notesPourMoyenne: number[] = [];
  for (const { cle } of CRITERES_EVALUATION) {
    const brut = nettoyer(formData.get(`critere_${cle}`));
    if (brut) {
      const n = Number(brut);
      if (!Number.isNaN(n) && n >= 1 && n <= 5) {
        criteres[cle] = n;
        notesPourMoyenne.push(n);
      }
    }
  }

  if (notesPourMoyenne.length === 0) {
    return { ok: false, message: "Notez au moins un critère (de 1 à 5)." };
  }

  const noteEvaluation = moyenne(notesPourMoyenne);

  const nouvelle: Evaluation = {
    date,
    note: noteEvaluation,
    commentaire: nettoyer(formData.get("commentaire")),
    criteres,
    evaluateur: `${profil.prenom} ${profil.nom}`.trim(),
  };

  const supabase = createClient();
  const { data: existant, error: errLecture } = await supabase
    .from("stagiaires")
    .select("notes_evaluation")
    .eq("id", stagiaireId)
    .single();

  if (errLecture) {
    return { ok: false, message: errLecture.message };
  }

  const liste = Array.isArray(
    (existant as { notes_evaluation: unknown } | null)?.notes_evaluation,
  )
    ? ((existant as unknown as { notes_evaluation: Evaluation[] })
        .notes_evaluation ?? [])
    : [];

  const nouvelleListe = [...liste, nouvelle];
  // note_globale = moyenne des notes de toutes les évaluations
  const noteGlobale = moyenne(
    nouvelleListe
      .map((e) => Number(e?.note))
      .filter((n) => !Number.isNaN(n)),
  );

  const { error } = await supabase
    .from("stagiaires")
    .update({
      notes_evaluation: nouvelleListe as unknown as Json,
      note_globale: noteGlobale,
    })
    .eq("id", stagiaireId);

  if (error) {
    return { ok: false, message: `Évaluation impossible : ${error.message}` };
  }

  revalidatePath(`/stagiaires/${stagiaireId}`);
  revalidatePath("/stagiaires");
  return { ok: true };
}

export async function supprimerEvaluation(
  stagiaireId: string,
  index: number,
): Promise<ResultatAction> {
  const profil = await getProfilCourant();
  if (!profil) return { ok: false, message: "Session expirée." };
  if (!canEdit(profil.role, "stagiaires")) {
    return { ok: false, message: "Accès refusé." };
  }

  const supabase = createClient();
  const { data: existant, error: errLecture } = await supabase
    .from("stagiaires")
    .select("notes_evaluation")
    .eq("id", stagiaireId)
    .single();
  if (errLecture) return { ok: false, message: errLecture.message };

  const liste = Array.isArray(
    (existant as { notes_evaluation: unknown } | null)?.notes_evaluation,
  )
    ? ((existant as unknown as { notes_evaluation: Evaluation[] })
        .notes_evaluation ?? [])
    : [];

  if (index < 0 || index >= liste.length) {
    return { ok: false, message: "Évaluation introuvable." };
  }

  const nouvelleListe = liste.filter((_, i) => i !== index);
  const noteGlobale =
    nouvelleListe.length === 0
      ? null
      : moyenne(
          nouvelleListe.map((e) => Number(e?.note)).filter((n) => !Number.isNaN(n)),
        );

  const { error } = await supabase
    .from("stagiaires")
    .update({
      notes_evaluation: nouvelleListe as unknown as Json,
      note_globale: noteGlobale,
    })
    .eq("id", stagiaireId);
  if (error) return { ok: false, message: error.message };

  revalidatePath(`/stagiaires/${stagiaireId}`);
  return { ok: true };
}

// ---------------------------------------------------------------------------
// DOSSIERS ASSIGNÉS EN SUPERVISION
// ---------------------------------------------------------------------------

export async function assignerDossierStagiaire(
  stagiaireId: string,
  dossierId: string,
): Promise<ResultatAction> {
  const profil = await getProfilCourant();
  if (!profil) return { ok: false, message: "Session expirée." };
  if (!canEdit(profil.role, "stagiaires")) {
    return { ok: false, message: "Accès refusé." };
  }
  if (!dossierId) return { ok: false, message: "Sélectionnez un dossier." };

  const supabase = createClient();
  const { error } = await supabase
    .from("dossier_stagiaires")
    .insert({ stagiaire_id: stagiaireId, dossier_id: dossierId });

  if (error) {
    if (error.code === "23505") {
      return { ok: false, message: "Ce dossier est déjà assigné." };
    }
    return { ok: false, message: `Assignation impossible : ${error.message}` };
  }

  revalidatePath(`/stagiaires/${stagiaireId}`);
  return { ok: true };
}

export async function retirerDossierStagiaire(
  stagiaireId: string,
  dossierId: string,
): Promise<ResultatAction> {
  const profil = await getProfilCourant();
  if (!profil) return { ok: false, message: "Session expirée." };
  if (!canEdit(profil.role, "stagiaires")) {
    return { ok: false, message: "Accès refusé." };
  }

  const supabase = createClient();
  const { error } = await supabase
    .from("dossier_stagiaires")
    .delete()
    .eq("stagiaire_id", stagiaireId)
    .eq("dossier_id", dossierId);
  if (error) return { ok: false, message: error.message };

  revalidatePath(`/stagiaires/${stagiaireId}`);
  return { ok: true };
}
