"use server";

import { createClient } from "@/lib/supabase/server";
import { getProfilCourant } from "@/lib/auth";
import { hasAccess } from "@/lib/roles";

export interface ResultatRecherche {
  libelle: string;
  sousTitre?: string;
  href: string;
}

export interface GroupeRecherche {
  titre: string;
  resultats: ResultatRecherche[];
}

export interface ReponseRecherche {
  groupes: GroupeRecherche[];
}

/**
 * Construit un motif ilike PostgREST sûr.
 * Les filtres `.or("col.ilike.<motif>,…")` concatènent la valeur dans une
 * chaîne dont la virgule, les parenthèses et le point sont structurels : sans
 * neutralisation, un terme comme `x,id.not.is.null` injecterait une clause
 * arbitraire (contournement du filtre de recherche). On retire donc les
 * caractères réservés de PostgREST, puis on échappe les jokers `%`/`_`.
 */
function motif(q: string): string {
  const sain = q.replace(/[,.()":*\\]/g, " ").trim();
  return `%${sain.replace(/[%_]/g, (c) => `\\${c}`)}%`;
}

/** Libellé d'un client selon son type (physique / morale). */
function libelleClient(c: {
  type: string | null;
  nom: string | null;
  prenom: string | null;
  raison_sociale: string | null;
}): string {
  if (c.type === "morale") {
    return c.raison_sociale?.trim() || "Client (personne morale)";
  }
  const complet = `${c.prenom ?? ""} ${c.nom ?? ""}`.trim();
  return complet || "Client";
}

/**
 * Recherche globale (palette Ctrl+K) : interroge en parallèle les principales
 * entités selon les droits du rôle courant. Renvoie des groupes par section.
 */
export async function rechercheGlobale(q: string): Promise<ReponseRecherche> {
  const terme = q.trim();
  if (terme.length < 2) return { groupes: [] };

  const profil = await getProfilCourant();
  if (!profil) return { groupes: [] };

  const role = profil.role;
  const supabase = createClient();
  const m = motif(terme);

  const peutClients = hasAccess(role, "clients");
  const peutDossiers = hasAccess(role, "dossiers");
  const peutFacturation = hasAccess(role, "facturation");
  const peutAgenda = hasAccess(role, "agenda");

  const [clients, dossiers, factures, devis, evenements] = await Promise.all([
    peutClients
      ? supabase
          .from("clients")
          .select("id, type, nom, prenom, raison_sociale")
          .or(
            `nom.ilike.${m},prenom.ilike.${m},raison_sociale.ilike.${m}`,
          )
          .limit(5)
      : Promise.resolve({ data: null }),
    peutDossiers
      ? supabase
          .from("dossiers")
          .select("id, numero, titre")
          .or(`numero.ilike.${m},titre.ilike.${m}`)
          .limit(5)
      : Promise.resolve({ data: null }),
    peutFacturation
      ? supabase
          .from("factures")
          .select("id, numero")
          .ilike("numero", m)
          .limit(5)
      : Promise.resolve({ data: null }),
    peutFacturation
      ? supabase
          .from("devis")
          .select("id, numero, objet")
          .or(`numero.ilike.${m},objet.ilike.${m}`)
          .limit(5)
      : Promise.resolve({ data: null }),
    peutAgenda
      ? supabase
          .from("evenements")
          .select("id, titre")
          .ilike("titre", m)
          .limit(5)
      : Promise.resolve({ data: null }),
  ]);

  const groupes: GroupeRecherche[] = [];

  const clientsData = (clients.data ?? []) as Array<{
    id: string;
    type: string | null;
    nom: string | null;
    prenom: string | null;
    raison_sociale: string | null;
  }>;
  if (clientsData.length > 0) {
    groupes.push({
      titre: "Clients",
      resultats: clientsData.map((c) => ({
        libelle: libelleClient(c),
        href: `/clients/${c.id}`,
      })),
    });
  }

  const dossiersData = (dossiers.data ?? []) as Array<{
    id: string;
    numero: string;
    titre: string;
  }>;
  if (dossiersData.length > 0) {
    groupes.push({
      titre: "Dossiers",
      resultats: dossiersData.map((d) => ({
        libelle: d.titre,
        sousTitre: d.numero,
        href: `/dossiers/${d.id}`,
      })),
    });
  }

  const facturesData = (factures.data ?? []) as Array<{
    id: string;
    numero: string;
  }>;
  if (facturesData.length > 0) {
    groupes.push({
      titre: "Factures",
      resultats: facturesData.map((f) => ({
        libelle: f.numero,
        href: `/facturation/${f.id}`,
      })),
    });
  }

  const devisData = (devis.data ?? []) as Array<{
    id: string;
    numero: string;
    objet: string | null;
  }>;
  if (devisData.length > 0) {
    groupes.push({
      titre: "Devis",
      resultats: devisData.map((dv) => ({
        libelle: dv.numero,
        sousTitre: dv.objet ?? undefined,
        href: `/devis/${dv.id}`,
      })),
    });
  }

  const evenementsData = (evenements.data ?? []) as Array<{
    id: string;
    titre: string;
  }>;
  if (evenementsData.length > 0) {
    groupes.push({
      titre: "Agenda",
      resultats: evenementsData.map((e) => ({
        libelle: e.titre,
        href: `/agenda`,
      })),
    });
  }

  return { groupes };
}
