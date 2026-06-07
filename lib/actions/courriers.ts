"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getProfilCourant } from "@/lib/auth";
import { canEdit } from "@/lib/roles";

export type TypeCourrier = "entrant" | "sortant";

export interface ResultatAction {
  ok: boolean;
  message?: string;
  id?: string;
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

interface DonneesCourrier {
  type: TypeCourrier;
  objet: string;
  expediteur: string | null;
  destinataire: string | null;
  date_courrier: string;
  dossier_id: string | null;
  fichier_url: string | null;
  notes: string | null;
}

function lireCourrier(formData: FormData): DonneesCourrier | { erreur: string } {
  const objet = nettoyer(formData.get("objet"));
  const type = nettoyer(formData.get("type")) as TypeCourrier | null;
  if (!objet) return { erreur: "L'objet est obligatoire." };
  if (type !== "entrant" && type !== "sortant") {
    return { erreur: "Le type de courrier est invalide." };
  }

  return {
    type,
    objet,
    expediteur: nettoyer(formData.get("expediteur")),
    destinataire: nettoyer(formData.get("destinataire")),
    date_courrier:
      nettoyerDate(formData.get("date_courrier")) ??
      new Date().toISOString().slice(0, 10),
    dossier_id: nettoyer(formData.get("dossier_id")),
    fichier_url: nettoyer(formData.get("fichier_url")),
    notes: nettoyer(formData.get("notes")),
  };
}

export async function creerCourrier(formData: FormData): Promise<ResultatAction> {
  const profil = await getProfilCourant();
  if (!profil) return { ok: false, message: "Session expirée." };
  if (!canEdit(profil.role, "courriers")) {
    return { ok: false, message: "Accès refusé." };
  }

  const lu = lireCourrier(formData);
  if ("erreur" in lu) return { ok: false, message: lu.erreur };

  const supabase = createClient();
  const { data, error } = await supabase
    .from("courriers")
    .insert({ ...lu, created_by: profil.id })
    .select("id")
    .single();

  if (error) {
    return { ok: false, message: `Création impossible : ${error.message}` };
  }

  revalidatePath("/courriers");
  if (lu.dossier_id) revalidatePath(`/dossiers/${lu.dossier_id}`);
  return { ok: true, id: (data as { id: string } | null)?.id };
}

export async function modifierCourrier(
  id: string,
  formData: FormData,
): Promise<ResultatAction> {
  const profil = await getProfilCourant();
  if (!profil) return { ok: false, message: "Session expirée." };
  if (!canEdit(profil.role, "courriers")) {
    return { ok: false, message: "Accès refusé." };
  }

  const lu = lireCourrier(formData);
  if ("erreur" in lu) return { ok: false, message: lu.erreur };

  const supabase = createClient();
  const { error } = await supabase.from("courriers").update(lu).eq("id", id);
  if (error) {
    return { ok: false, message: `Modification impossible : ${error.message}` };
  }

  revalidatePath("/courriers");
  if (lu.dossier_id) revalidatePath(`/dossiers/${lu.dossier_id}`);
  return { ok: true, id };
}

export async function supprimerCourrier(id: string): Promise<ResultatAction> {
  const profil = await getProfilCourant();
  if (!profil) return { ok: false, message: "Session expirée." };
  if (!canEdit(profil.role, "courriers")) {
    return { ok: false, message: "Accès refusé." };
  }

  const supabase = createClient();
  const { error } = await supabase.from("courriers").delete().eq("id", id);
  if (error) {
    return { ok: false, message: `Suppression impossible : ${error.message}` };
  }

  revalidatePath("/courriers");
  return { ok: true };
}
