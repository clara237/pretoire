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

// Les modèles sont stockés dans le bucket "documents" (sous-dossier modeles/).
const BUCKET = "documents";
const TAILLE_MAX_MO = 25;

function slugFichier(nom: string): string {
  const base = nom
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-zA-Z0-9._-]/g, "_")
    .replace(/_+/g, "_");
  return base || "modele";
}

function nettoyer(v: string | null | undefined): string | null {
  if (v === undefined || v === null) return null;
  const t = v.trim();
  return t === "" ? null : t;
}

/**
 * Crée un modèle de document. Fichier optionnel téléversé dans Storage.
 * Données reçues via FormData.
 */
export async function creerModele(form: FormData): Promise<ResultatAction> {
  const profil = await getProfilCourant();
  if (!profil || !canEdit(profil.role, "modeles")) {
    return { ok: false, message: "Accès refusé." };
  }

  const nom = nettoyer(form.get("nom") as string | null);
  const categorie = nettoyer(form.get("categorie") as string | null);
  const description = nettoyer(form.get("description") as string | null);
  if (!nom) return { ok: false, message: "Le nom du modèle est obligatoire." };

  const supabase = createClient();

  let fichierUrl: string | null = null;
  const fichier = form.get("fichier");
  if (fichier instanceof File && fichier.size > 0) {
    if (fichier.size > TAILLE_MAX_MO * 1024 * 1024) {
      return { ok: false, message: `Fichier trop volumineux (max ${TAILLE_MAX_MO} Mo).` };
    }
    const chemin = `modeles/${Date.now()}-${slugFichier(fichier.name)}`;
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
          "Échec du téléversement. Le service de stockage est peut-être indisponible.",
      };
    }
    fichierUrl = chemin;
  }

  const { data, error } = await supabase
    .from("modeles_documents")
    .insert({
      nom,
      categorie,
      description,
      fichier_url: fichierUrl,
      uploaded_by: profil.id,
      actif: true,
    })
    .select("id")
    .single();

  if (error) {
    if (fichierUrl) await supabase.storage.from(BUCKET).remove([fichierUrl]);
    return { ok: false, message: "Impossible de créer le modèle." };
  }
  revalidatePath("/modeles");
  return { ok: true, id: (data as { id: string }).id };
}

export async function modifierModele(
  id: string,
  form: FormData,
): Promise<ResultatAction> {
  const profil = await getProfilCourant();
  if (!profil || !canEdit(profil.role, "modeles")) {
    return { ok: false, message: "Accès refusé." };
  }
  const nom = nettoyer(form.get("nom") as string | null);
  const categorie = nettoyer(form.get("categorie") as string | null);
  const description = nettoyer(form.get("description") as string | null);
  if (!nom) return { ok: false, message: "Le nom du modèle est obligatoire." };

  const supabase = createClient();
  const maj: TablesUpdate<"modeles_documents"> = { nom, categorie, description };

  const fichier = form.get("fichier");
  if (fichier instanceof File && fichier.size > 0) {
    if (fichier.size > TAILLE_MAX_MO * 1024 * 1024) {
      return { ok: false, message: `Fichier trop volumineux (max ${TAILLE_MAX_MO} Mo).` };
    }
    const chemin = `modeles/${Date.now()}-${slugFichier(fichier.name)}`;
    const { error: errUpload } = await supabase.storage
      .from(BUCKET)
      .upload(chemin, fichier, {
        contentType: fichier.type || "application/octet-stream",
        upsert: false,
      });
    if (errUpload) {
      return { ok: false, message: "Échec du téléversement du fichier." };
    }
    maj.fichier_url = chemin;
  }

  const { error } = await supabase.from("modeles_documents").update(maj).eq("id", id);
  if (error) {
    return { ok: false, message: "Impossible de modifier le modèle." };
  }
  revalidatePath("/modeles");
  return { ok: true, id };
}

/** Active / désactive un modèle. */
export async function basculerModele(
  id: string,
  actif: boolean,
): Promise<ResultatAction> {
  const profil = await getProfilCourant();
  if (!profil || !canEdit(profil.role, "modeles")) {
    return { ok: false, message: "Accès refusé." };
  }
  const supabase = createClient();
  const { error } = await supabase
    .from("modeles_documents")
    .update({ actif })
    .eq("id", id);
  if (error) {
    return { ok: false, message: "Impossible de mettre à jour le modèle." };
  }
  revalidatePath("/modeles");
  return { ok: true };
}

export async function supprimerModele(
  id: string,
  fichier?: string | null,
): Promise<ResultatAction> {
  const profil = await getProfilCourant();
  if (!profil || !canEdit(profil.role, "modeles")) {
    return { ok: false, message: "Accès refusé." };
  }
  const supabase = createClient();
  const { error } = await supabase.from("modeles_documents").delete().eq("id", id);
  if (error) {
    return { ok: false, message: "Impossible de supprimer le modèle." };
  }
  if (fichier && !fichier.startsWith("documents/demo")) {
    await supabase.storage.from(BUCKET).remove([fichier]);
  }
  revalidatePath("/modeles");
  return { ok: true };
}

/** URL signée pour télécharger un modèle. */
export async function urlModele(
  chemin: string,
): Promise<{ ok: boolean; url?: string; message?: string }> {
  const profil = await getProfilCourant();
  if (!profil) return { ok: false, message: "Accès refusé." };
  const supabase = createClient();

  // Le bucket "documents" est partagé avec des pièces confidentielles : on ne
  // signe que si le chemin correspond bien à un modèle (visible sous RLS),
  // afin qu'un chemin deviné ne donne pas accès à un document de dossier.
  const { data: modele } = await supabase
    .from("modeles_documents")
    .select("id")
    .eq("fichier_url", chemin)
    .maybeSingle();
  if (!modele) return { ok: false, message: "Modèle introuvable ou accès refusé." };

  const { data, error } = await supabase.storage
    .from(BUCKET)
    .createSignedUrl(chemin, 60 * 10);
  if (error || !data?.signedUrl) {
    return {
      ok: false,
      message: "Lien indisponible (modèle de démonstration ou stockage hors ligne).",
    };
  }
  return { ok: true, url: data.signedUrl };
}
