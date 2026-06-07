import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  verifierEcheancesCore,
  marquerFacturesEchuesCore,
} from "@/lib/rappels-core";

/**
 * Déclenchement AUTOMATIQUE des rappels — sans bouton.
 *
 * Appelé à chaque rendu du layout du dashboard, mais réellement exécuté au
 * plus une fois par INTERVALLE_MS (garde-fou en mémoire de processus).
 * Tourne avec le client service_role : le job est un traitement système,
 * indépendant du rôle de l'utilisateur dont la navigation l'a déclenché.
 *
 * En production multi-instances, remplacer par un vrai cron (Vercel Cron,
 * pg_cron, GitHub Actions…) pointant sur ces mêmes fonctions cœur.
 */

const INTERVALLE_MS = 15 * 60 * 1000; // 15 minutes

let derniereExecution = 0;
let enCours = false;

export function declencherRappelsAuto(): void {
  const maintenant = Date.now();
  if (enCours || maintenant - derniereExecution < INTERVALLE_MS) return;
  enCours = true;
  derniereExecution = maintenant;

  // Fire-and-forget : ne bloque jamais le rendu de la page.
  void (async () => {
    try {
      const admin = createAdminClient();
      const [echeances, factures] = await Promise.all([
        verifierEcheancesCore(admin),
        marquerFacturesEchuesCore(admin),
      ]);
      if (echeances.rappels > 0 || factures.relances > 0) {
        console.log(
          `[rappels-auto] ${echeances.rappels} rappel(s) d'échéance, ${factures.relances} facture(s) échue(s).`,
        );
      }
    } catch (e) {
      console.error("[rappels-auto] échec :", e);
    } finally {
      enCours = false;
    }
  })();
}
