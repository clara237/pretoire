/**
 * Objectif mensuel d'heures facturables par défaut.
 *
 * Le schéma `profiles` ne comporte PAS de colonne d'objectif (schéma figé).
 * On retient donc une cible standard de cabinet (heures facturables / mois)
 * pour l'indicateur « objectifs vs réalisé ». À externaliser dans
 * cabinet_config ou profiles lors d'une évolution du schéma (cf. notes).
 */
export const OBJECTIF_HEURES_MENSUEL = 120;

/** Bornes (YYYY-MM-DD) du mois courant pour filtrer les saisies de temps. */
export function bornesMoisCourant(): { debut: string; fin: string } {
  const now = new Date();
  const debut = new Date(now.getFullYear(), now.getMonth(), 1);
  const fin = new Date(now.getFullYear(), now.getMonth() + 1, 0);
  return {
    debut: debut.toISOString().slice(0, 10),
    fin: fin.toISOString().slice(0, 10),
  };
}

/** Bornes du mois indiqué (offset en mois par rapport à aujourd'hui). */
export function bornesMoisOffset(offset: number): { debut: string; fin: string } {
  const now = new Date();
  const debut = new Date(now.getFullYear(), now.getMonth() + offset, 1);
  const fin = new Date(now.getFullYear(), now.getMonth() + offset + 1, 0);
  return {
    debut: debut.toISOString().slice(0, 10),
    fin: fin.toISOString().slice(0, 10),
  };
}
