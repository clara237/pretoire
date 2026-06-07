"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getProfilCourant } from "@/lib/auth";
import { canEdit } from "@/lib/roles";
import type { TablesUpdate } from "@/lib/database.types";

export interface ResultatAction {
  ok: boolean;
  message?: string;
  id?: string;
}

const BUCKET = "justificatifs";
const TAILLE_MAX_MO = 15;

function slugFichier(nom: string): string {
  const base = nom
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-zA-Z0-9._-]/g, "_")
    .replace(/_+/g, "_");
  return base || "justificatif";
}

function nettoyer(v: string | null | undefined): string | null {
  if (v === undefined || v === null) return null;
  const t = v.trim();
  return t === "" ? null : t;
}

/**
 * Crée une dépense. Justificatif optionnel téléversé dans le bucket
 * "justificatifs" (Storage). Données reçues via FormData.
 */
export async function creerDepense(form: FormData): Promise<ResultatAction> {
  const profil = await getProfilCourant();
  if (!profil || !canEdit(profil.role, "finance")) {
    return { ok: false, message: "Accès refusé." };
  }

  const categorie = nettoyer(form.get("categorie") as string | null);
  const description = nettoyer(form.get("description") as string | null);
  const dateDepense = nettoyer(form.get("date_depense") as string | null);
  const montantBrut = (form.get("montant") as string | null)?.trim();
  const montant = montantBrut ? Number(montantBrut.replace(/\s/g, "")) : NaN;

  if (!categorie) return { ok: false, message: "La catégorie est obligatoire." };
  if (!dateDepense) return { ok: false, message: "La date est obligatoire." };
  if (!Number.isFinite(montant) || montant <= 0) {
    return { ok: false, message: "Le montant doit être supérieur à 0." };
  }

  const supabase = createClient();

  // Justificatif optionnel.
  let justificatifUrl: string | null = null;
  const fichier = form.get("justificatif");
  if (fichier instanceof File && fichier.size > 0) {
    if (fichier.size > TAILLE_MAX_MO * 1024 * 1024) {
      return { ok: false, message: `Justificatif trop volumineux (max ${TAILLE_MAX_MO} Mo).` };
    }
    const chemin = `${Date.now()}-${slugFichier(fichier.name)}`;
    const { error: errUpload } = await supabase.storage
      .from(BUCKET)
      .upload(chemin, fichier, {
        contentType: fichier.type || "application/octet-stream",
        upsert: false,
      });
    if (errUpload) {
      return {
        ok: false,
        message:
          "Échec du téléversement du justificatif. Le service de stockage est peut-être indisponible.",
      };
    }
    justificatifUrl = chemin;
  }

  const { data, error } = await supabase
    .from("depenses")
    .insert({
      categorie,
      description,
      montant: Math.round(montant),
      date_depense: dateDepense,
      justificatif_url: justificatifUrl,
      created_by: profil.id,
    })
    .select("id")
    .single();

  if (error) {
    if (justificatifUrl) await supabase.storage.from(BUCKET).remove([justificatifUrl]);
    return { ok: false, message: "Impossible d'enregistrer la dépense." };
  }
  revalidatePath("/finance");
  return { ok: true, id: (data as { id: string }).id };
}

export async function modifierDepense(
  id: string,
  form: FormData,
): Promise<ResultatAction> {
  const profil = await getProfilCourant();
  if (!profil || !canEdit(profil.role, "finance")) {
    return { ok: false, message: "Accès refusé." };
  }

  const categorie = nettoyer(form.get("categorie") as string | null);
  const description = nettoyer(form.get("description") as string | null);
  const dateDepense = nettoyer(form.get("date_depense") as string | null);
  const montantBrut = (form.get("montant") as string | null)?.trim();
  const montant = montantBrut ? Number(montantBrut.replace(/\s/g, "")) : NaN;

  if (!categorie) return { ok: false, message: "La catégorie est obligatoire." };
  if (!dateDepense) return { ok: false, message: "La date est obligatoire." };
  if (!Number.isFinite(montant) || montant <= 0) {
    return { ok: false, message: "Le montant doit être supérieur à 0." };
  }

  const supabase = createClient();

  const maj: TablesUpdate<"depenses"> = {
    categorie,
    description,
    montant: Math.round(montant),
    date_depense: dateDepense,
  };

  // Nouveau justificatif (remplace l'ancien).
  const fichier = form.get("justificatif");
  if (fichier instanceof File && fichier.size > 0) {
    if (fichier.size > TAILLE_MAX_MO * 1024 * 1024) {
      return { ok: false, message: `Justificatif trop volumineux (max ${TAILLE_MAX_MO} Mo).` };
    }
    const chemin = `${Date.now()}-${slugFichier(fichier.name)}`;
    const { error: errUpload } = await supabase.storage
      .from(BUCKET)
      .upload(chemin, fichier, {
        contentType: fichier.type || "application/octet-stream",
        upsert: false,
      });
    if (errUpload) {
      return {
        ok: false,
        message: "Échec du téléversement du justificatif.",
      };
    }
    maj.justificatif_url = chemin;
  }

  const { error } = await supabase.from("depenses").update(maj).eq("id", id);
  if (error) {
    return { ok: false, message: "Impossible de modifier la dépense." };
  }
  revalidatePath("/finance");
  return { ok: true, id };
}

export async function supprimerDepense(
  id: string,
  justificatif?: string | null,
): Promise<ResultatAction> {
  const profil = await getProfilCourant();
  if (!profil || !canEdit(profil.role, "finance")) {
    return { ok: false, message: "Accès refusé." };
  }
  const supabase = createClient();
  const { error } = await supabase.from("depenses").delete().eq("id", id);
  if (error) {
    return { ok: false, message: "Impossible de supprimer la dépense." };
  }
  if (justificatif) {
    await supabase.storage.from(BUCKET).remove([justificatif]);
  }
  revalidatePath("/finance");
  return { ok: true };
}

/** URL signée pour consulter un justificatif. */
export async function urlJustificatif(
  chemin: string,
): Promise<{ ok: boolean; url?: string; message?: string }> {
  const profil = await getProfilCourant();
  if (!profil || !canEdit(profil.role, "finance")) {
    return { ok: false, message: "Accès refusé." };
  }
  const supabase = createClient();
  const { data, error } = await supabase.storage
    .from(BUCKET)
    .createSignedUrl(chemin, 60 * 10);
  if (error || !data?.signedUrl) {
    return { ok: false, message: "Lien indisponible (stockage hors ligne)." };
  }
  return { ok: true, url: data.signedUrl };
}
