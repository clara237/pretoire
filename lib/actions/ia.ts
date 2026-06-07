"use server";

import { getProfilCourant } from "@/lib/auth";
import { appelerIA, iaConfiguree } from "@/lib/ia";

/** L'assistant IA est-il disponible ? (pilote l'affichage des boutons) */
export async function iaEstConfiguree(): Promise<boolean> {
  return iaConfiguree();
}

/**
 * Assistant IA de rédaction — corrige ou reformule les textes saisis
 * (courriers, notes de dossier, descriptions d'actes…).
 */

export type ModeIA = "corriger" | "reformuler" | "juridique";

const LONGUEUR_MAX = 8000;

const CONSIGNES: Record<ModeIA, string> = {
  corriger:
    "Tu es un correcteur professionnel francophone. Corrige UNIQUEMENT l'orthographe, la grammaire, la conjugaison et la ponctuation du texte fourni, sans changer son sens, son style ni sa mise en forme. Conserve les sauts de ligne. Réponds EXCLUSIVEMENT avec le texte corrigé, sans commentaire, sans préambule, sans guillemets d'encadrement.",
  reformuler:
    "Tu es un assistant de rédaction francophone. Reformule le texte fourni pour le rendre plus clair, fluide et professionnel, en conservant fidèlement toutes les informations. Conserve les sauts de ligne quand ils structurent le texte. Réponds EXCLUSIVEMENT avec le texte reformulé, sans commentaire ni préambule.",
  juridique:
    "Tu es un juriste rédacteur dans un cabinet d'avocats au Cameroun (droit OHADA, usages français de correspondance). Réécris le texte fourni dans un registre juridique formel et courtois : vouvoiement, formulations d'usage des courriers d'avocat, précision terminologique. N'invente AUCUN fait, AUCUNE référence légale absente du texte d'origine. Réponds EXCLUSIVEMENT avec le texte réécrit, sans commentaire ni préambule.",
};

export async function ameliorerTexte(
  texte: string,
  mode: ModeIA,
): Promise<{ ok: boolean; texte?: string; message?: string }> {
  const profil = await getProfilCourant();
  if (!profil) return { ok: false, message: "Session expirée." };

  const contenu = texte?.trim();
  if (!contenu) return { ok: false, message: "Aucun texte à traiter." };
  if (contenu.length > LONGUEUR_MAX) {
    return {
      ok: false,
      message: `Texte trop long (max ${LONGUEUR_MAX.toLocaleString("fr-FR")} caractères).`,
    };
  }
  const consigne = CONSIGNES[mode];
  if (!consigne) return { ok: false, message: "Mode inconnu." };

  return appelerIA(
    [
      { role: "system", content: consigne },
      { role: "user", content: contenu },
    ],
    { maxTokens: Math.min(4096, Math.ceil(contenu.length / 2) + 512) },
  );
}
