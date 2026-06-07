"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getProfilCourant } from "@/lib/auth";
import { canEdit } from "@/lib/roles";

export interface ResultatAction {
  ok: boolean;
  message?: string;
}

function nettoyer(v: FormDataEntryValue | null): string | null {
  if (v === null) return null;
  const s = String(v).trim();
  return s.length > 0 ? s : null;
}

/**
 * Met à jour le profil professionnel d'un avocat : barreau, n° d'inscription,
 * spécialités, taux horaire, objectif d'heures facturables.
 * L'objectif mensuel n'a pas de colonne dédiée (schéma figé) : on ne persiste
 * que les champs existants. L'objectif est géré côté page (cf. notes).
 */
export async function modifierProfilAvocat(
  profileId: string,
  formData: FormData,
): Promise<ResultatAction> {
  const profil = await getProfilCourant();
  if (!profil) return { ok: false, message: "Session expirée." };
  if (!canEdit(profil.role, "equipe")) {
    return { ok: false, message: "Accès refusé." };
  }

  const specialitesBrutes = nettoyer(formData.get("specialites"));
  const specialites = specialitesBrutes
    ? specialitesBrutes
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean)
    : [];

  const tauxBrut = nettoyer(formData.get("taux_horaire"));
  let tauxHoraire: number | null = null;
  if (tauxBrut) {
    const n = Number(tauxBrut.replace(/\s/g, "").replace(",", "."));
    if (Number.isNaN(n) || n < 0) {
      return { ok: false, message: "Le taux horaire est invalide." };
    }
    tauxHoraire = n;
  }

  const supabase = createClient();
  const { error } = await supabase
    .from("profiles")
    .update({
      barreau_numero: nettoyer(formData.get("barreau_numero")),
      telephone: nettoyer(formData.get("telephone")),
      specialites,
      taux_horaire: tauxHoraire,
    })
    .eq("id", profileId);

  if (error) {
    return { ok: false, message: `Mise à jour impossible : ${error.message}` };
  }

  revalidatePath("/equipe");
  revalidatePath(`/equipe/${profileId}`);
  return { ok: true };
}
