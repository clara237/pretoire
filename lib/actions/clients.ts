"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getProfilCourant } from "@/lib/auth";
import { canEdit } from "@/lib/roles";
import type { TablesInsert } from "@/lib/database.types";

export interface ResultatAction {
  ok: boolean;
  message?: string;
  id?: string;
}

export interface DonneesClient {
  type: string;
  nom?: string | null;
  prenom?: string | null;
  raison_sociale?: string | null;
  email?: string | null;
  telephone?: string | null;
  adresse?: string | null;
  ville?: string | null;
  cni_numero?: string | null;
  rccm_numero?: string | null;
  notes?: string | null;
}

function nettoyer(v: string | null | undefined): string | null {
  if (v === undefined || v === null) return null;
  const t = v.trim();
  return t === "" ? null : t;
}

/** Normalise les champs conditionnels selon le type (physique vs morale). */
function normaliser(d: DonneesClient): TablesInsert<"clients"> {
  const type = d.type === "morale" ? "morale" : "physique";
  if (type === "morale") {
    return {
      type,
      nom: null,
      prenom: null,
      raison_sociale: nettoyer(d.raison_sociale),
      email: nettoyer(d.email),
      telephone: nettoyer(d.telephone),
      adresse: nettoyer(d.adresse),
      ville: nettoyer(d.ville),
      cni_numero: null,
      rccm_numero: nettoyer(d.rccm_numero),
      notes: nettoyer(d.notes),
    };
  }
  return {
    type,
    nom: nettoyer(d.nom),
    prenom: nettoyer(d.prenom),
    raison_sociale: null,
    email: nettoyer(d.email),
    telephone: nettoyer(d.telephone),
    adresse: nettoyer(d.adresse),
    ville: nettoyer(d.ville),
    cni_numero: nettoyer(d.cni_numero),
    rccm_numero: null,
    notes: nettoyer(d.notes),
  };
}

function valider(values: ReturnType<typeof normaliser>): string | null {
  if (values.type === "morale") {
    if (!values.raison_sociale) return "La raison sociale est obligatoire.";
  } else {
    if (!values.nom) return "Le nom est obligatoire.";
  }
  return null;
}

export async function creerClient(d: DonneesClient): Promise<ResultatAction> {
  const profil = await getProfilCourant();
  if (!profil || !canEdit(profil.role, "clients")) {
    return { ok: false, message: "Accès refusé." };
  }
  const values = normaliser(d);
  const erreur = valider(values);
  if (erreur) return { ok: false, message: erreur };

  const supabase = createClient();
  const { data, error } = await supabase
    .from("clients")
    .insert(values)
    .select("id")
    .single();

  if (error) {
    return { ok: false, message: "Impossible de créer le client." };
  }
  revalidatePath("/clients");
  return { ok: true, id: (data as { id: string }).id };
}

export async function modifierClient(
  id: string,
  d: DonneesClient,
): Promise<ResultatAction> {
  const profil = await getProfilCourant();
  if (!profil || !canEdit(profil.role, "clients")) {
    return { ok: false, message: "Accès refusé." };
  }
  const values = normaliser(d);
  const erreur = valider(values);
  if (erreur) return { ok: false, message: erreur };

  const supabase = createClient();
  const { error } = await supabase.from("clients").update(values).eq("id", id);

  if (error) {
    return { ok: false, message: "Impossible de modifier le client." };
  }
  revalidatePath("/clients");
  revalidatePath(`/clients/${id}`);
  return { ok: true, id };
}

export async function supprimerClient(id: string): Promise<ResultatAction> {
  const profil = await getProfilCourant();
  if (!profil || !canEdit(profil.role, "clients")) {
    return { ok: false, message: "Accès refusé." };
  }
  const supabase = createClient();

  // Garde-fou : empêcher la suppression d'un client rattaché à des dossiers.
  const { count } = await supabase
    .from("dossiers")
    .select("id", { count: "exact", head: true })
    .eq("client_id", id);
  if ((count ?? 0) > 0) {
    return {
      ok: false,
      message:
        "Ce client est rattaché à des dossiers. Réaffectez ou supprimez d'abord ses dossiers.",
    };
  }

  const { error } = await supabase.from("clients").delete().eq("id", id);
  if (error) {
    return { ok: false, message: "Impossible de supprimer le client." };
  }
  revalidatePath("/clients");
  return { ok: true };
}
