import "server-only";
import { createClient } from "@/lib/supabase/server";
import type { OptionDossier, OptionProfile } from "../_components/evenement-form";

/** Charge les dossiers (non archivés) pour les <select> de liaison. */
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

/** Charge les avocats/membres actifs pour les <select> d'intervenant. */
export async function chargerProfilesOptions(): Promise<OptionProfile[]> {
  const supabase = createClient();
  const { data } = await supabase
    .from("profiles")
    .select("id, nom, prenom, actif")
    .eq("actif", true)
    .order("nom", { ascending: true });
  const lignes = (data ?? []) as Array<{
    id: string;
    nom: string;
    prenom: string;
    actif: boolean;
  }>;
  return lignes.map((p) => ({ id: p.id, nom: p.nom, prenom: p.prenom }));
}
