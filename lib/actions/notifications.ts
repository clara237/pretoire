"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getProfilCourant } from "@/lib/auth";

export interface ResultatAction {
  ok: boolean;
  message?: string;
}

/**
 * Marque une notification de l'utilisateur courant comme lue.
 * La RLS garantit déjà que l'on ne touche que ses propres notifications,
 * on filtre tout de même explicitement sur user_id par sécurité.
 */
export async function marquerLue(id: string): Promise<ResultatAction> {
  const profil = await getProfilCourant();
  if (!profil) return { ok: false, message: "Session expirée." };

  const supabase = createClient();
  const { error } = await supabase
    .from("notifications")
    .update({ lu: true })
    .eq("id", id)
    .eq("user_id", profil.user_id);

  if (error) {
    return { ok: false, message: "Impossible de marquer la notification." };
  }
  revalidatePath("/notifications");
  revalidatePath("/", "layout"); // met à jour le badge compteur de la topbar
  return { ok: true };
}

/** Bascule l'état lu/non lu d'une notification (utile pour la consultation). */
export async function basculerLue(
  id: string,
  lu: boolean,
): Promise<ResultatAction> {
  const profil = await getProfilCourant();
  if (!profil) return { ok: false, message: "Session expirée." };

  const supabase = createClient();
  const { error } = await supabase
    .from("notifications")
    .update({ lu })
    .eq("id", id)
    .eq("user_id", profil.user_id);

  if (error) {
    return { ok: false, message: "Mise à jour impossible." };
  }
  revalidatePath("/notifications");
  revalidatePath("/", "layout");
  return { ok: true };
}

/** Marque TOUTES les notifications non lues de l'utilisateur courant comme lues. */
export async function toutMarquerLu(): Promise<ResultatAction> {
  const profil = await getProfilCourant();
  if (!profil) return { ok: false, message: "Session expirée." };

  const supabase = createClient();
  const { error } = await supabase
    .from("notifications")
    .update({ lu: true })
    .eq("user_id", profil.user_id)
    .eq("lu", false);

  if (error) {
    return { ok: false, message: "Impossible de tout marquer comme lu." };
  }
  revalidatePath("/notifications");
  revalidatePath("/", "layout");
  return { ok: true };
}

/** Supprime une notification de l'utilisateur courant. */
export async function supprimerNotification(id: string): Promise<ResultatAction> {
  const profil = await getProfilCourant();
  if (!profil) return { ok: false, message: "Session expirée." };

  const supabase = createClient();
  const { error } = await supabase
    .from("notifications")
    .delete()
    .eq("id", id)
    .eq("user_id", profil.user_id);

  if (error) {
    return { ok: false, message: "Suppression impossible." };
  }
  revalidatePath("/notifications");
  revalidatePath("/", "layout");
  return { ok: true };
}
