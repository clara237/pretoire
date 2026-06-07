"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getProfilCourant } from "@/lib/auth";
import { canEdit } from "@/lib/roles";
import { TYPES_TACHE } from "@/lib/finance-constants";
import type { Enums } from "@/lib/database.types";

export interface ResultatAction {
  ok: boolean;
  message?: string;
  id?: string;
}

export interface DonneesSaisie {
  profile_id: string;
  dossier_id?: string | null;
  date: string;
  type_tache: string;
  description?: string | null;
  duree_heures: number;
  taux_horaire?: number | null;
  facturable: boolean;
}

function nettoyer(v: string | null | undefined): string | null {
  if (v === undefined || v === null) return null;
  const t = v.trim();
  return t === "" ? null : t;
}

function valider(d: DonneesSaisie): string | null {
  if (!d.profile_id) return "L'avocat est obligatoire.";
  if (!d.date) return "La date est obligatoire.";
  if (!TYPES_TACHE.includes(d.type_tache as (typeof TYPES_TACHE)[number])) {
    return "Type de tâche invalide.";
  }
  if (!(d.duree_heures > 0)) return "La durée doit être supérieure à 0.";
  if (d.duree_heures > 24) return "La durée d'une saisie ne peut excéder 24 h.";
  if (d.taux_horaire != null && d.taux_horaire < 0) {
    return "Le taux horaire ne peut être négatif.";
  }
  return null;
}

export async function creerSaisie(d: DonneesSaisie): Promise<ResultatAction> {
  const profil = await getProfilCourant();
  if (!profil || !canEdit(profil.role, "time_tracking")) {
    return { ok: false, message: "Accès refusé." };
  }
  const erreur = valider(d);
  if (erreur) return { ok: false, message: erreur };

  const supabase = createClient();
  const { data, error } = await supabase
    .from("saisies_temps")
    .insert({
      profile_id: d.profile_id,
      dossier_id: nettoyer(d.dossier_id ?? null),
      date: d.date,
      type_tache: d.type_tache as Enums<"type_tache_temps">,
      description: nettoyer(d.description),
      duree_heures: d.duree_heures,
      taux_horaire: d.taux_horaire ?? null,
      facturable: d.facturable,
    })
    .select("id")
    .single();

  if (error) {
    return { ok: false, message: "Impossible d'enregistrer la saisie." };
  }
  revalidatePath("/time-tracking");
  revalidatePath("/finance");
  return { ok: true, id: (data as { id: string }).id };
}

export async function modifierSaisie(
  id: string,
  d: DonneesSaisie,
): Promise<ResultatAction> {
  const profil = await getProfilCourant();
  if (!profil || !canEdit(profil.role, "time_tracking")) {
    return { ok: false, message: "Accès refusé." };
  }
  const erreur = valider(d);
  if (erreur) return { ok: false, message: erreur };

  const supabase = createClient();

  // Une saisie déjà facturée ne peut plus être modifiée.
  const { data: existante } = await supabase
    .from("saisies_temps")
    .select("facture_id")
    .eq("id", id)
    .maybeSingle();
  if ((existante as { facture_id: string | null } | null)?.facture_id) {
    return {
      ok: false,
      message: "Cette saisie est déjà facturée et ne peut plus être modifiée.",
    };
  }

  const { error } = await supabase
    .from("saisies_temps")
    .update({
      profile_id: d.profile_id,
      dossier_id: nettoyer(d.dossier_id ?? null),
      date: d.date,
      type_tache: d.type_tache as Enums<"type_tache_temps">,
      description: nettoyer(d.description),
      duree_heures: d.duree_heures,
      taux_horaire: d.taux_horaire ?? null,
      facturable: d.facturable,
    })
    .eq("id", id);

  if (error) {
    return { ok: false, message: "Impossible de modifier la saisie." };
  }
  revalidatePath("/time-tracking");
  revalidatePath("/finance");
  return { ok: true, id };
}

export async function supprimerSaisie(id: string): Promise<ResultatAction> {
  const profil = await getProfilCourant();
  if (!profil || !canEdit(profil.role, "time_tracking")) {
    return { ok: false, message: "Accès refusé." };
  }
  const supabase = createClient();

  const { data: existante } = await supabase
    .from("saisies_temps")
    .select("facture_id")
    .eq("id", id)
    .maybeSingle();
  if ((existante as { facture_id: string | null } | null)?.facture_id) {
    return {
      ok: false,
      message: "Cette saisie est déjà facturée et ne peut pas être supprimée.",
    };
  }

  const { error } = await supabase.from("saisies_temps").delete().eq("id", id);
  if (error) {
    return { ok: false, message: "Impossible de supprimer la saisie." };
  }
  revalidatePath("/time-tracking");
  revalidatePath("/finance");
  return { ok: true };
}
