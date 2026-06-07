import "server-only";
import { createClient } from "@/lib/supabase/server";
import type { Role } from "@/lib/roles";

export interface ProfilUtilisateur {
  id: string;
  user_id: string;
  nom: string;
  prenom: string;
  email: string;
  telephone: string | null;
  role: Role;
  photo_url: string | null;
  barreau_numero: string | null;
  specialites: string[] | null;
  taux_horaire: number | null;
  date_entree: string | null;
  actif: boolean;
}

/**
 * Récupère le profil de l'utilisateur connecté (server-side).
 * Renvoie null si non authentifié ou profil absent.
 */
export async function getProfilCourant(): Promise<ProfilUtilisateur | null> {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("user_id", user.id)
    .maybeSingle();
  if (error || !data) return null;
  return data as unknown as ProfilUtilisateur;
}
