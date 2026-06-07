import "server-only";
import { createClient } from "@/lib/supabase/server";
import type { BadgeTon } from "@/components/ui/badge";
import type { Enums } from "@/lib/database.types";

// =====================================================================
// Constantes & libellés — Clients (personnes physiques & morales)
// =====================================================================

export const TYPES_CLIENT = ["physique", "morale"] as const;
export type TypeClient = (typeof TYPES_CLIENT)[number];

export const LIBELLE_TYPE_CLIENT: Record<string, string> = {
  physique: "Personne physique",
  morale: "Personne morale",
};

export const TON_TYPE_CLIENT: Record<string, BadgeTon> = {
  physique: "info",
  morale: "principal",
};

export interface Client {
  id: string;
  type: string;
  nom: string | null;
  prenom: string | null;
  raison_sociale: string | null;
  email: string | null;
  telephone: string | null;
  adresse: string | null;
  ville: string | null;
  cni_numero: string | null;
  rccm_numero: string | null;
  notes: string | null;
  created_at: string;
}

/** Nom affichable d'un client (physique ou morale). */
export function nomAffichage(
  c: Pick<Client, "type" | "nom" | "prenom" | "raison_sociale"> | null | undefined,
): string {
  if (!c) return "Client inconnu";
  if (c.type === "morale") return c.raison_sociale || "Personne morale";
  return [c.prenom, c.nom].filter(Boolean).join(" ") || "Client";
}

export interface FiltresClients {
  recherche?: string;
  type?: string;
}

/** Liste des clients avec recherche (nom/prénom/raison sociale/email) + filtre type. */
export async function listerClients(
  filtres: FiltresClients = {},
): Promise<Client[]> {
  const supabase = createClient();
  let req = supabase
    .from("clients")
    .select("*")
    .order("created_at", { ascending: false });

  if (filtres.type && filtres.type !== "tous") {
    req = req.eq("type", filtres.type as Enums<"type_client">);
  }
  const terme = filtres.recherche?.trim();
  if (terme) {
    const echappe = terme.replace(/[%,]/g, " ");
    req = req.or(
      `nom.ilike.%${echappe}%,prenom.ilike.%${echappe}%,raison_sociale.ilike.%${echappe}%,email.ilike.%${echappe}%,telephone.ilike.%${echappe}%`,
    );
  }

  const { data } = await req;
  return (data ?? []) as unknown as Client[];
}

/** Détail d'un client. */
export async function recupererClient(id: string): Promise<Client | null> {
  const supabase = createClient();
  const { data } = await supabase
    .from("clients")
    .select("*")
    .eq("id", id)
    .maybeSingle();
  return (data as unknown as Client) ?? null;
}

/** Tous les clients (pour les sélecteurs de formulaire dossier). */
export async function listerClientsSelecteur(): Promise<Client[]> {
  const supabase = createClient();
  const { data } = await supabase
    .from("clients")
    .select("*")
    .order("created_at", { ascending: false });
  return (data ?? []) as unknown as Client[];
}
