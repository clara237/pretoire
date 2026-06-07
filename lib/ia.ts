import "server-only";

/**
 * Client minimal pour l'API Together AI (compatible OpenAI chat/completions).
 * Sert l'assistant de rédaction : correction et reformulation de textes.
 *
 * Configuration (serveur uniquement — la clé ne doit JAMAIS être exposée
 * au navigateur, donc pas de préfixe NEXT_PUBLIC_) :
 *   TOGETHER_API_KEY  — clé https://api.together.xyz
 *   TOGETHER_MODEL    — optionnel, modèle à utiliser
 */

const URL_API = "https://api.together.xyz/v1/chat/completions";
const MODELE_DEFAUT = "meta-llama/Llama-3.3-70B-Instruct-Turbo";

/** L'assistant IA est-il configuré ? (affichage conditionnel des boutons) */
export function iaConfiguree(): boolean {
  return Boolean(process.env.TOGETHER_API_KEY);
}

export interface MessageIA {
  role: "system" | "user";
  content: string;
}

export async function appelerIA(
  messages: MessageIA[],
  options?: { maxTokens?: number; temperature?: number },
): Promise<{ ok: boolean; texte?: string; message?: string }> {
  const cle = process.env.TOGETHER_API_KEY;
  if (!cle) {
    return { ok: false, message: "Assistant IA non configuré (TOGETHER_API_KEY absente)." };
  }

  try {
    const reponse = await fetch(URL_API, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${cle}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: process.env.TOGETHER_MODEL || MODELE_DEFAUT,
        messages,
        max_tokens: options?.maxTokens ?? 2048,
        temperature: options?.temperature ?? 0.2,
      }),
      // L'appel part du serveur Next : on borne pour ne pas geler une action.
      signal: AbortSignal.timeout(45_000),
    });

    if (!reponse.ok) {
      const corps = await reponse.text().catch(() => "");
      console.error(`[ia] Together AI ${reponse.status} : ${corps.slice(0, 300)}`);
      return {
        ok: false,
        message:
          reponse.status === 401
            ? "Clé API Together invalide."
            : "Le service IA est momentanément indisponible.",
      };
    }

    const json = (await reponse.json()) as {
      choices?: Array<{ message?: { content?: string } }>;
    };
    const texte = json.choices?.[0]?.message?.content?.trim();
    if (!texte) return { ok: false, message: "Réponse IA vide." };
    return { ok: true, texte };
  } catch (e) {
    console.error("[ia] échec d'appel :", e);
    return { ok: false, message: "Impossible de joindre le service IA (réseau)." };
  }
}
