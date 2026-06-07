import "server-only";
import { createClient } from "@/lib/supabase/server";

/** Forme typée de la configuration cabinet (white-label). */
export interface CabinetConfig {
  id: string;
  nom_cabinet: string;
  nom_avocat_principal: string | null;
  adresse: string | null;
  ville: string | null;
  pays: string | null;
  telephone_1: string | null;
  telephone_2: string | null;
  email: string | null;
  site_web: string | null;
  barreau: string | null;
  numero_barreau: string | null;
  logo_url: string | null;
  couleur_principale: string;
  couleur_secondaire: string;
  pied_de_page_facture: string | null;
  tva_applicable: boolean;
  taux_tva: number;
  devise: string;
  format_date: string;
  updated_at: string | null;
  updated_by: string | null;
}

/** Valeurs de repli (utilisées seulement si la table est injoignable). */
export const CABINET_DEFAUT: CabinetConfig = {
  id: "default",
  nom_cabinet: "Prétoire",
  nom_avocat_principal: null,
  adresse: null,
  ville: null,
  pays: "Cameroun",
  telephone_1: null,
  telephone_2: null,
  email: null,
  site_web: null,
  barreau: "Barreau du Cameroun",
  numero_barreau: null,
  logo_url: null,
  couleur_principale: "#007A5E",
  couleur_secondaire: "#CE1126",
  pied_de_page_facture: null,
  tva_applicable: false,
  taux_tva: 0,
  devise: "FCFA",
  format_date: "JJ/MM/AAAA",
  updated_at: null,
  updated_by: null,
};

/**
 * Récupère la configuration cabinet (server-side).
 * Il n'existe qu'une seule ligne dans cabinet_config.
 */
export async function getCabinetConfig(): Promise<CabinetConfig> {
  try {
    const supabase = createClient();
    const { data, error } = await supabase
      .from("cabinet_config")
      .select("*")
      .limit(1)
      .maybeSingle();
    if (error || !data) return CABINET_DEFAUT;
    return data as unknown as CabinetConfig;
  } catch {
    return CABINET_DEFAUT;
  }
}
