"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getProfilCourant } from "@/lib/auth";

export interface ResultatAction {
  ok: boolean;
  message?: string;
  logoUrl?: string;
}

const BUCKET_LOGOS = "logos";
const TAILLE_MAX_LOGO_MO = 5;

function nettoyer(v: FormDataEntryValue | null): string | null {
  if (v === null) return null;
  const s = String(v).trim();
  return s.length > 0 ? s : null;
}

/** Valide grossièrement un code couleur hexadécimal (#RGB ou #RRGGBB). */
function couleurValide(v: string | null, repli: string): string {
  if (!v) return repli;
  return /^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/.test(v) ? v : repli;
}

function slugFichier(nom: string): string {
  const base = nom
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-zA-Z0-9._-]/g, "_")
    .replace(/_+/g, "_");
  return base || "logo";
}

/**
 * Téléverse un nouveau logo vers le bucket public "logos" et renvoie son URL
 * publique. Réservé à l'admin système (la RLS storage le vérifie aussi).
 * Tolérant : si le service storage est indisponible, renvoie un message clair.
 */
export async function televerserLogo(form: FormData): Promise<ResultatAction> {
  const profil = await getProfilCourant();
  if (!profil || profil.role !== "admin_systeme") {
    return { ok: false, message: "Accès refusé." };
  }

  const fichier = form.get("logo");
  if (!(fichier instanceof File) || fichier.size === 0) {
    return { ok: false, message: "Aucun fichier sélectionné." };
  }
  if (!fichier.type.startsWith("image/")) {
    return { ok: false, message: "Le logo doit être une image." };
  }
  if (fichier.size > TAILLE_MAX_LOGO_MO * 1024 * 1024) {
    return {
      ok: false,
      message: `Image trop volumineuse (max ${TAILLE_MAX_LOGO_MO} Mo).`,
    };
  }

  const supabase = createClient();
  const chemin = `cabinet/${Date.now()}-${slugFichier(fichier.name)}`;

  const { error: erreurUpload } = await supabase.storage
    .from(BUCKET_LOGOS)
    .upload(chemin, fichier, {
      contentType: fichier.type || "image/png",
      upsert: true,
    });

  if (erreurUpload) {
    return {
      ok: false,
      message:
        "Échec du téléversement du logo. Le service de stockage est peut-être indisponible.",
    };
  }

  const { data } = supabase.storage.from(BUCKET_LOGOS).getPublicUrl(chemin);
  const url = data?.publicUrl ?? null;
  if (!url) {
    return { ok: false, message: "Impossible d'obtenir l'URL du logo." };
  }

  // Persiste immédiatement l'URL dans la config (et propage partout).
  const { error: errUpd } = await majLogoUrlInterne(url, profil.id);
  if (errUpd) {
    return { ok: false, message: "Logo téléversé mais non enregistré." };
  }

  revalidatePath("/parametres/cabinet");
  revalidatePath("/", "layout");
  return { ok: true, logoUrl: url };
}

/** Met à jour uniquement la colonne logo_url sur la ligne unique. */
async function majLogoUrlInterne(url: string | null, updatedBy: string) {
  const supabase = createClient();
  const { data: ligne } = await supabase
    .from("cabinet_config")
    .select("id")
    .limit(1)
    .maybeSingle();

  if (ligne && (ligne as { id: string }).id) {
    return supabase
      .from("cabinet_config")
      .update({ logo_url: url, updated_by: updatedBy })
      .eq("id", (ligne as { id: string }).id);
  }
  return supabase
    .from("cabinet_config")
    .insert({ nom_cabinet: "Prétoire", logo_url: url, updated_by: updatedBy });
}

/** Supprime le logo personnalisé (retour au logo par défaut). */
export async function retirerLogo(): Promise<ResultatAction> {
  const profil = await getProfilCourant();
  if (!profil || profil.role !== "admin_systeme") {
    return { ok: false, message: "Accès refusé." };
  }
  const { error } = await majLogoUrlInterne(null, profil.id);
  if (error) {
    return { ok: false, message: "Impossible de retirer le logo." };
  }
  revalidatePath("/parametres/cabinet");
  revalidatePath("/", "layout");
  return { ok: true };
}

/**
 * Enregistre l'ensemble de la configuration cabinet (white-label).
 * Tout changement est répercuté immédiatement (login, sidebar, PDFs)
 * grâce à revalidatePath('/', 'layout').
 */
export async function enregistrerCabinet(
  form: FormData,
): Promise<ResultatAction> {
  const profil = await getProfilCourant();
  if (!profil || profil.role !== "admin_systeme") {
    return { ok: false, message: "Accès refusé." };
  }

  const nomCabinet = nettoyer(form.get("nom_cabinet"));
  if (!nomCabinet) {
    return { ok: false, message: "Le nom du cabinet est obligatoire." };
  }

  const tvaApplicable = form.get("tva_applicable") === "on";
  const tauxBrut = nettoyer(form.get("taux_tva"));
  let tauxTva = 0;
  if (tauxBrut) {
    const n = Number(tauxBrut.replace(/\s/g, "").replace(",", "."));
    if (Number.isNaN(n) || n < 0 || n > 100) {
      return { ok: false, message: "Le taux de TVA est invalide (0–100)." };
    }
    tauxTva = n;
  }

  const fraisBrut = nettoyer(form.get("frais_ouverture_dossier"));
  let fraisOuverture = 0;
  if (fraisBrut) {
    const n = Number(fraisBrut.replace(/\s/g, "").replace(",", "."));
    if (Number.isNaN(n) || n < 0) {
      return { ok: false, message: "Les frais d'ouverture sont invalides." };
    }
    fraisOuverture = Math.round(n);
  }

  const valeurs = {
    nom_cabinet: nomCabinet,
    nom_avocat_principal: nettoyer(form.get("nom_avocat_principal")),
    adresse: nettoyer(form.get("adresse")),
    ville: nettoyer(form.get("ville")),
    pays: nettoyer(form.get("pays")) ?? "Cameroun",
    telephone_1: nettoyer(form.get("telephone_1")),
    telephone_2: nettoyer(form.get("telephone_2")),
    email: nettoyer(form.get("email")),
    site_web: nettoyer(form.get("site_web")),
    barreau: nettoyer(form.get("barreau")),
    numero_barreau: nettoyer(form.get("numero_barreau")),
    couleur_principale: couleurValide(
      nettoyer(form.get("couleur_principale")),
      "#007A5E",
    ),
    couleur_secondaire: couleurValide(
      nettoyer(form.get("couleur_secondaire")),
      "#CE1126",
    ),
    pied_de_page_facture: nettoyer(form.get("pied_de_page_facture")),
    tva_applicable: tvaApplicable,
    taux_tva: tauxTva,
    frais_ouverture_dossier: fraisOuverture,
    devise: nettoyer(form.get("devise")) ?? "FCFA",
    format_date: nettoyer(form.get("format_date")) ?? "JJ/MM/AAAA",
    updated_by: profil.id,
  };

  const supabase = createClient();
  // Ligne unique : update si elle existe, sinon insert.
  const { data: ligne } = await supabase
    .from("cabinet_config")
    .select("id")
    .limit(1)
    .maybeSingle();

  let erreur;
  if (ligne && (ligne as { id: string }).id) {
    ({ error: erreur } = await supabase
      .from("cabinet_config")
      .update(valeurs)
      .eq("id", (ligne as { id: string }).id));
  } else {
    ({ error: erreur } = await supabase.from("cabinet_config").insert(valeurs));
  }

  if (erreur) {
    return {
      ok: false,
      message: `Enregistrement impossible : ${erreur.message}`,
    };
  }

  revalidatePath("/parametres/cabinet");
  revalidatePath("/", "layout"); // login, sidebar, PDFs reflètent le changement
  return { ok: true };
}
