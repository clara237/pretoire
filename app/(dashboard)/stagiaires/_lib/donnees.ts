import "server-only";
import { createClient } from "@/lib/supabase/server";
import type { OptionMaitre } from "../_components/stagiaire-form";

/** Avocats pouvant être maîtres de stage (profils actifs). */
export async function chargerMaitresOptions(): Promise<OptionMaitre[]> {
  const supabase = createClient();
  const { data } = await supabase
    .from("profiles")
    .select("id, nom, prenom, role, actif")
    .eq("actif", true)
    .order("nom", { ascending: true });
  const lignes = (data ?? []) as Array<{
    id: string;
    nom: string;
    prenom: string;
    role: string;
    actif: boolean;
  }>;
  // On exclut les stagiaires comme maîtres de stage
  return lignes
    .filter((p) => p.role !== "stagiaire")
    .map((p) => ({ id: p.id, nom: p.nom, prenom: p.prenom }));
}

export interface OptionDossier {
  id: string;
  numero: string;
  titre: string;
}

/** Dossiers (non archivés) pour assignation en supervision. */
export async function chargerDossiersOptions(): Promise<OptionDossier[]> {
  const supabase = createClient();
  const { data } = await supabase
    .from("dossiers")
    .select("id, numero, titre, statut")
    .order("created_at", { ascending: false });
  const lignes = (data ?? []) as Array<{
    id: string;
    numero: string;
    titre: string;
    statut: string;
  }>;
  return lignes
    .filter((d) => d.statut !== "archive")
    .map((d) => ({ id: d.id, numero: d.numero, titre: d.titre }));
}
