"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getProfilCourant } from "@/lib/auth";
import { canEdit, hasAccess } from "@/lib/roles";
import { verifierEcheancesCore } from "@/lib/rappels-core";

export type TypeEvenement =
  | "rdv"
  | "audience"
  | "reunion"
  | "deadline"
  | "deplacement";

export interface ResultatAction {
  ok: boolean;
  message?: string;
  id?: string;
}

interface DonneesEvenement {
  titre: string;
  type: TypeEvenement;
  description?: string | null;
  dossier_id?: string | null;
  profile_id?: string | null;
  lieu?: string | null;
  // Champs spécifiques (audience) sérialisés dans la description si colonne absente
  tribunal?: string | null;
  chambre?: string | null;
  numero_role?: string | null;
  date_debut: string;
  date_fin?: string | null;
  rappel_j7?: boolean;
  rappel_j3?: boolean;
  rappel_j1?: boolean;
}

function nettoyer(v: FormDataEntryValue | null): string | null {
  if (v === null) return null;
  const s = String(v).trim();
  return s.length > 0 ? s : null;
}

/**
 * Les colonnes tribunal/chambre/numero_role n'existent PAS sur la table
 * evenements (schéma figé). Pour une audience, on les agrège dans le champ
 * description pour ne pas perdre l'information, via un préfixe structuré.
 */
function composerDescriptionAudience(d: DonneesEvenement): string | null {
  const morceaux: string[] = [];
  if (d.tribunal) morceaux.push(`Tribunal : ${d.tribunal}`);
  if (d.chambre) morceaux.push(`Chambre : ${d.chambre}`);
  if (d.numero_role) morceaux.push(`N° de rôle : ${d.numero_role}`);
  const entete = morceaux.join(" · ");
  if (!entete) return d.description ?? null;
  return d.description ? `${entete}\n${d.description}` : entete;
}

function lireFormulaire(formData: FormData): DonneesEvenement | { erreur: string } {
  const titre = nettoyer(formData.get("titre"));
  const type = nettoyer(formData.get("type")) as TypeEvenement | null;
  const dateDebutBrute = nettoyer(formData.get("date_debut"));

  if (!titre) return { erreur: "Le titre est obligatoire." };
  if (!type) return { erreur: "Le type d'événement est obligatoire." };
  if (!dateDebutBrute) return { erreur: "La date de début est obligatoire." };

  const dateDebut = new Date(dateDebutBrute);
  if (Number.isNaN(dateDebut.getTime())) {
    return { erreur: "La date de début est invalide." };
  }

  const dateFinBrute = nettoyer(formData.get("date_fin"));
  let dateFin: string | null = null;
  if (dateFinBrute) {
    const df = new Date(dateFinBrute);
    if (Number.isNaN(df.getTime())) return { erreur: "La date de fin est invalide." };
    if (df < dateDebut) return { erreur: "La date de fin doit suivre la date de début." };
    dateFin = df.toISOString();
  }

  return {
    titre,
    type,
    description: nettoyer(formData.get("description")),
    dossier_id: nettoyer(formData.get("dossier_id")),
    profile_id: nettoyer(formData.get("profile_id")),
    lieu: nettoyer(formData.get("lieu")),
    tribunal: nettoyer(formData.get("tribunal")),
    chambre: nettoyer(formData.get("chambre")),
    numero_role: nettoyer(formData.get("numero_role")),
    date_debut: dateDebut.toISOString(),
    date_fin: dateFin,
    rappel_j7: formData.get("rappel_j7") === "on" || formData.get("rappel_j7") === "true",
    rappel_j3: formData.get("rappel_j3") === "on" || formData.get("rappel_j3") === "true",
    rappel_j1: formData.get("rappel_j1") === "on" || formData.get("rappel_j1") === "true",
  };
}

export interface ResultatConflit {
  conflit: boolean;
  avec?: { titre: string; date_debut: string };
}

/**
 * Détecte un chevauchement d'agenda pour un intervenant donné.
 * L'intervalle examiné est [dateDebut, dateFin ?? dateDebut + 1h]. Pour les
 * événements existants sans date_fin, on considère également une durée d'1h.
 * Chevauchement : debutA < finB && finA > debutB. On exclut evenementId
 * (utile en modification). Si profileId est null, aucun conflit possible.
 */
export async function detecterConflit(
  profileId: string | null,
  dateDebut: string,
  dateFin: string | null,
  evenementId?: string,
): Promise<ResultatConflit> {
  const profil = await getProfilCourant();
  if (!profil || !hasAccess(profil.role, "agenda")) return { conflit: false };
  if (!profileId) return { conflit: false };

  const debutA = new Date(dateDebut);
  if (Number.isNaN(debutA.getTime())) return { conflit: false };
  const UNE_HEURE = 60 * 60 * 1000;
  const finA = dateFin ? new Date(dateFin) : new Date(debutA.getTime() + UNE_HEURE);
  if (Number.isNaN(finA.getTime())) return { conflit: false };

  const supabase = createClient();
  // On ne ramène que les événements du même intervenant dont le début précède
  // la fin de A ; le chevauchement précis (en tenant compte des fins nulles)
  // est confirmé côté serveur ci-dessous.
  let requete = supabase
    .from("evenements")
    .select("id, titre, date_debut, date_fin")
    .eq("profile_id", profileId)
    .lt("date_debut", finA.toISOString())
    .order("date_debut", { ascending: true });

  if (evenementId) requete = requete.neq("id", evenementId);

  const { data, error } = await requete;
  if (error || !data) return { conflit: false };

  for (const ev of data as Array<{
    id: string;
    titre: string;
    date_debut: string;
    date_fin: string | null;
  }>) {
    const debutB = new Date(ev.date_debut);
    if (Number.isNaN(debutB.getTime())) continue;
    const finB = ev.date_fin
      ? new Date(ev.date_fin)
      : new Date(debutB.getTime() + UNE_HEURE);
    // Chevauchement strict : debutA < finB && finA > debutB
    if (debutA < finB && finA > debutB) {
      return { conflit: true, avec: { titre: ev.titre, date_debut: ev.date_debut } };
    }
  }

  return { conflit: false };
}

export async function creerEvenement(formData: FormData): Promise<ResultatAction> {
  const profil = await getProfilCourant();
  if (!profil) return { ok: false, message: "Session expirée." };
  if (!canEdit(profil.role, "agenda")) {
    return { ok: false, message: "Accès refusé." };
  }

  const lu = lireFormulaire(formData);
  if ("erreur" in lu) return { ok: false, message: lu.erreur };

  const description =
    lu.type === "audience" ? composerDescriptionAudience(lu) : lu.description;

  const supabase = createClient();
  const { data, error } = await supabase
    .from("evenements")
    .insert({
      titre: lu.titre,
      type: lu.type,
      description,
      dossier_id: lu.dossier_id,
      profile_id: lu.profile_id,
      lieu: lu.type === "audience" ? lu.tribunal ?? lu.lieu : lu.lieu,
      date_debut: lu.date_debut,
      date_fin: lu.date_fin,
      rappel_j7: lu.rappel_j7 ?? false,
      rappel_j3: lu.rappel_j3 ?? false,
      rappel_j1: lu.rappel_j1 ?? false,
      rappel_envoye: false,
      created_by: profil.id,
    })
    .select("id")
    .single();

  if (error) {
    return { ok: false, message: `Création impossible : ${error.message}` };
  }

  revalidatePath("/agenda");
  if (lu.dossier_id) revalidatePath(`/dossiers/${lu.dossier_id}`);
  return { ok: true, id: (data as { id: string } | null)?.id };
}

export async function modifierEvenement(
  id: string,
  formData: FormData,
): Promise<ResultatAction> {
  const profil = await getProfilCourant();
  if (!profil) return { ok: false, message: "Session expirée." };
  if (!canEdit(profil.role, "agenda")) {
    return { ok: false, message: "Accès refusé." };
  }

  const lu = lireFormulaire(formData);
  if ("erreur" in lu) return { ok: false, message: lu.erreur };

  const description =
    lu.type === "audience" ? composerDescriptionAudience(lu) : lu.description;

  const supabase = createClient();
  const { error } = await supabase
    .from("evenements")
    .update({
      titre: lu.titre,
      type: lu.type,
      description,
      dossier_id: lu.dossier_id,
      profile_id: lu.profile_id,
      lieu: lu.type === "audience" ? lu.tribunal ?? lu.lieu : lu.lieu,
      date_debut: lu.date_debut,
      date_fin: lu.date_fin,
      rappel_j7: lu.rappel_j7 ?? false,
      rappel_j3: lu.rappel_j3 ?? false,
      rappel_j1: lu.rappel_j1 ?? false,
      // On réarme l'envoi des rappels après modification de l'échéance
      rappel_envoye: false,
    })
    .eq("id", id);

  if (error) {
    return { ok: false, message: `Modification impossible : ${error.message}` };
  }

  revalidatePath("/agenda");
  return { ok: true, id };
}

export async function supprimerEvenement(id: string): Promise<ResultatAction> {
  const profil = await getProfilCourant();
  if (!profil) return { ok: false, message: "Session expirée." };
  if (!canEdit(profil.role, "agenda")) {
    return { ok: false, message: "Accès refusé." };
  }

  const supabase = createClient();
  const { error } = await supabase.from("evenements").delete().eq("id", id);
  if (error) {
    return { ok: false, message: `Suppression impossible : ${error.message}` };
  }

  revalidatePath("/agenda");
  return { ok: true };
}

/**
 * Vérifie les délais de procédure (événements de type deadline) et insère des
 * notifications in-app + emails pour les utilisateurs concernés quand un
 * palier J-7 / J-3 / J-1 est atteint et coché. Marque rappel_envoye pour
 * éviter les doublons (le réarmement se fait à la modification de l'échéance).
 *
 * La logique vit dans lib/rappels-core.ts, partagée avec le job automatique
 * (lib/rappels-auto.ts) déclenché par le layout du dashboard.
 */
export async function verifierEcheances(): Promise<{
  ok: boolean;
  rappels: number;
  message?: string;
}> {
  const profil = await getProfilCourant();
  if (!profil || !canEdit(profil.role, "agenda")) {
    return { ok: false, rappels: 0, message: "Accès refusé." };
  }

  // service_role : les notifications ciblent d'autres avocats (responsables
  // d'échéance), ce que la RLS notifications_insert interdit côté client.
  const resultat = await verifierEcheancesCore(createAdminClient(), profil.user_id);

  if (resultat.ok && resultat.rappels > 0) {
    revalidatePath("/agenda");
    revalidatePath("/notifications");
  }
  return resultat;
}
