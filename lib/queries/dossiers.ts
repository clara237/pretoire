import "server-only";
import { createClient } from "@/lib/supabase/server";
import type { Enums } from "@/lib/database.types";
import type {
  DossierListe,
  DossierDetail,
  ProfilMini,
} from "@/lib/queries/dossiers-labels";

// Ré-export des constantes/types purs pour les consommateurs serveur.
export * from "@/lib/queries/dossiers-labels";

const SELECT_LISTE =
  "id, numero, titre, type_affaire, statut, date_ouverture, montant_enjeu, " +
  "client:clients(id, type, nom, prenom, raison_sociale), " +
  "avocat:profiles!dossiers_avocat_responsable_id_fkey(id, nom, prenom, photo_url)";

export interface FiltresDossiers {
  recherche?: string;
  statut?: string;
  type?: string;
  avocat?: string;
}

/** Liste des dossiers avec recherche plein texte (numéro/titre/tribunal) + filtres. */
export async function listerDossiers(
  filtres: FiltresDossiers = {},
): Promise<DossierListe[]> {
  const supabase = createClient();
  let req = supabase
    .from("dossiers")
    .select(SELECT_LISTE)
    .order("created_at", { ascending: false });

  if (filtres.statut && filtres.statut !== "tous") {
    req = req.eq("statut", filtres.statut as Enums<"statut_dossier">);
  }
  if (filtres.type && filtres.type !== "tous") {
    req = req.eq("type_affaire", filtres.type as Enums<"type_affaire">);
  }
  if (filtres.avocat && filtres.avocat !== "tous") {
    req = req.eq("avocat_responsable_id", filtres.avocat);
  }
  const terme = filtres.recherche?.trim();
  if (terme) {
    const echappe = terme.replace(/[%,]/g, " ");
    req = req.or(
      `numero.ilike.%${echappe}%,titre.ilike.%${echappe}%,tribunal.ilike.%${echappe}%,numero_role.ilike.%${echappe}%`,
    );
  }

  const { data } = await req;
  return (data ?? []) as unknown as DossierListe[];
}

/** Détail complet d'un dossier (avec client + avocat responsable). */
export async function recupererDossier(id: string): Promise<DossierDetail | null> {
  const supabase = createClient();
  const { data } = await supabase
    .from("dossiers")
    .select(
      "*, client:clients(id, type, nom, prenom, raison_sociale), " +
        "avocat:profiles!dossiers_avocat_responsable_id_fkey(id, nom, prenom, photo_url)",
    )
    .eq("id", id)
    .maybeSingle();
  return (data as unknown as DossierDetail) ?? null;
}

/** Liste des avocats (profils actifs) pour les sélecteurs. */
export async function listerAvocats(): Promise<ProfilMini[]> {
  const supabase = createClient();
  const { data } = await supabase
    .from("profiles")
    .select("id, nom, prenom, photo_url")
    .eq("actif", true)
    .order("nom", { ascending: true });
  return (data ?? []) as unknown as ProfilMini[];
}
