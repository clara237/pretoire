"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getProfilCourant } from "@/lib/auth";

export interface ResultatAction {
  ok: boolean;
  message?: string;
  id?: string;
}

const BUCKET = "documents";
const TAILLE_MAX_MO = 25;

function slugFichier(nom: string): string {
  const base = nom
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-zA-Z0-9._-]/g, "_")
    .replace(/_+/g, "_");
  return base || "fichier";
}

/**
 * Upload d'un document vers Supabase Storage (bucket "documents") + insertion
 * de la ligne `documents`. Le fichier arrive via FormData ("fichier").
 * dossier_id optionnel (document général du cabinet ou rattaché à un dossier).
 */
export async function televerserDocument(form: FormData): Promise<ResultatAction> {
  const profil = await getProfilCourant();
  if (!profil || profil.role === "comptable") {
    return { ok: false, message: "Accès refusé." };
  }

  const fichier = form.get("fichier");
  if (!(fichier instanceof File) || fichier.size === 0) {
    return { ok: false, message: "Aucun fichier sélectionné." };
  }
  if (fichier.size > TAILLE_MAX_MO * 1024 * 1024) {
    return {
      ok: false,
      message: `Fichier trop volumineux (max ${TAILLE_MAX_MO} Mo).`,
    };
  }

  const dossierId = (form.get("dossier_id") as string | null)?.trim() || null;
  const nomSaisi = (form.get("nom") as string | null)?.trim();
  const typeSaisi = (form.get("type") as string | null)?.trim();
  const nomAffiche = nomSaisi || fichier.name;

  const supabase = createClient();

  // Chemin : <dossier|general>/<timestamp>-<nom>
  const dossierSegment = dossierId ?? "general";
  const chemin = `${dossierSegment}/${Date.now()}-${slugFichier(fichier.name)}`;

  const { error: erreurUpload } = await supabase.storage
    .from(BUCKET)
    .upload(chemin, fichier, {
      contentType: fichier.type || "application/octet-stream",
      upsert: false,
    });

  if (erreurUpload) {
    return {
      ok: false,
      message:
        "Échec du téléversement. Le service de stockage est peut-être indisponible.",
    };
  }

  const { data, error } = await supabase
    .from("documents")
    .insert({
      nom: nomAffiche,
      type: typeSaisi || fichier.type || null,
      dossier_id: dossierId,
      uploaded_by: profil.id,
      fichier_url: chemin,
      taille_ko: Math.max(1, Math.round(fichier.size / 1024)),
    })
    .select("id")
    .single();

  if (error) {
    // Nettoyage best-effort du fichier orphelin
    await supabase.storage.from(BUCKET).remove([chemin]);
    return { ok: false, message: "Impossible d'enregistrer le document." };
  }

  revalidatePath("/documents");
  if (dossierId) revalidatePath(`/dossiers/${dossierId}`);
  return { ok: true, id: (data as { id: string }).id };
}

/** Génère une URL signée temporaire pour télécharger/consulter un document. */
export async function urlTelechargement(
  chemin: string,
): Promise<{ ok: boolean; url?: string; message?: string }> {
  const profil = await getProfilCourant();
  if (!profil) return { ok: false, message: "Accès refusé." };
  const supabase = createClient();

  // La policy storage du bucket "documents" est ouverte à tout authentifié :
  // on autorise donc la signature UNIQUEMENT si le document correspondant est
  // visible pour cet utilisateur sous RLS (filtrage par dossier). Sans cette
  // vérification, un chemin deviné donnerait accès à n'importe quel fichier.
  const { data: doc } = await supabase
    .from("documents")
    .select("id")
    .eq("fichier_url", chemin)
    .maybeSingle();
  if (!doc) return { ok: false, message: "Document introuvable ou accès refusé." };

  const { data, error } = await supabase.storage
    .from(BUCKET)
    .createSignedUrl(chemin, 60 * 10);
  if (error || !data?.signedUrl) {
    return {
      ok: false,
      message: "Lien indisponible (fichier de démonstration ou stockage hors ligne).",
    };
  }
  return { ok: true, url: data.signedUrl };
}

export async function supprimerDocument(
  id: string,
  chemin: string,
  dossierId?: string | null,
): Promise<ResultatAction> {
  const profil = await getProfilCourant();
  if (
    !profil ||
    !["admin_systeme", "associe_principal", "associe"].includes(profil.role)
  ) {
    return { ok: false, message: "Accès refusé." };
  }
  const supabase = createClient();
  const { error } = await supabase.from("documents").delete().eq("id", id);
  if (error) {
    return { ok: false, message: "Impossible de supprimer le document." };
  }
  // Suppression du fichier (best-effort : ignore les chemins de démo)
  if (chemin && !chemin.startsWith("documents/demo")) {
    await supabase.storage.from(BUCKET).remove([chemin]);
  }
  revalidatePath("/documents");
  if (dossierId) revalidatePath(`/dossiers/${dossierId}`);
  return { ok: true };
}
