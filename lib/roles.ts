/**
 * Rôles & matrice de permissions Prétoire.
 * La source de vérité du rôle d'un utilisateur est la table `profiles`
 * (colonne `role`, lue via auth.uid()).
 */

export const ROLES = [
  "admin_systeme",
  "associe_principal",
  "associe",
  "collaborateur",
  "stagiaire",
  "secretaire",
  "comptable",
] as const;

export type Role = (typeof ROLES)[number];

/** Libellés français des rôles (UI). */
export const LIBELLES_ROLES: Record<Role, string> = {
  admin_systeme: "Administrateur système",
  associe_principal: "Associé principal",
  associe: "Associé",
  collaborateur: "Collaborateur",
  stagiaire: "Stagiaire",
  secretaire: "Secrétaire",
  comptable: "Comptable",
};

/**
 * Sections de navigation de l'application (granularité d'accès).
 * Chaque page de l'app appartient à une section.
 */
export const SECTIONS = [
  "dashboard",
  "dossiers",
  "clients",
  "agenda",
  "equipe",
  "stagiaires",
  "time_tracking",
  "facturation",
  "finance",
  "documents",
  "modeles",
  "courriers",
  "notifications",
  "parametres", // utilisateurs, tarifs
  "parametres_cabinet", // white-label (admin seul)
] as const;

export type Section = (typeof SECTIONS)[number];

/** Niveau d'accès à une section. */
export type Acces = "complet" | "lecture" | "aucun";

/**
 * Matrice de permissions (cf. SPEC — Rôles).
 * - admin_systeme : accès total + paramètres cabinet
 * - associe_principal : accès total sauf paramètres système (cabinet white-label)
 * - associe : dossiers + finance + agenda
 * - collaborateur : dossiers + agenda + time tracking
 * - stagiaire : dossiers assignés + agenda + finance en LECTURE SEULE
 * - secretaire : agenda + clients + dossiers (PAS finance)
 * - comptable : finance UNIQUEMENT
 */
export const MATRICE_PERMISSIONS: Record<Role, Record<Section, Acces>> = {
  admin_systeme: {
    dashboard: "complet",
    dossiers: "complet",
    clients: "complet",
    agenda: "complet",
    equipe: "complet",
    stagiaires: "complet",
    time_tracking: "complet",
    facturation: "complet",
    finance: "complet",
    documents: "complet",
    modeles: "complet",
    courriers: "complet",
    notifications: "complet",
    parametres: "complet",
    parametres_cabinet: "complet",
  },
  associe_principal: {
    dashboard: "complet",
    dossiers: "complet",
    clients: "complet",
    agenda: "complet",
    equipe: "complet",
    stagiaires: "complet",
    time_tracking: "complet",
    facturation: "complet",
    finance: "complet",
    documents: "complet",
    modeles: "complet",
    courriers: "complet",
    notifications: "complet",
    parametres: "complet",
    parametres_cabinet: "aucun",
  },
  associe: {
    dashboard: "complet",
    dossiers: "complet",
    clients: "complet",
    agenda: "complet",
    equipe: "lecture",
    stagiaires: "lecture",
    time_tracking: "complet",
    facturation: "complet",
    finance: "complet",
    documents: "complet",
    modeles: "complet",
    courriers: "complet",
    notifications: "complet",
    parametres: "aucun",
    parametres_cabinet: "aucun",
  },
  collaborateur: {
    dashboard: "complet",
    dossiers: "complet",
    clients: "complet",
    agenda: "complet",
    equipe: "lecture",
    stagiaires: "lecture",
    time_tracking: "complet",
    facturation: "aucun",
    finance: "aucun",
    documents: "complet",
    modeles: "complet",
    courriers: "complet",
    notifications: "complet",
    parametres: "aucun",
    parametres_cabinet: "aucun",
  },
  stagiaire: {
    dashboard: "complet",
    dossiers: "complet", // restreint aux dossiers assignés via RLS
    clients: "lecture",
    agenda: "complet",
    equipe: "aucun",
    stagiaires: "aucun",
    time_tracking: "complet",
    facturation: "lecture",
    finance: "lecture",
    documents: "complet",
    modeles: "complet",
    courriers: "lecture",
    notifications: "complet",
    parametres: "aucun",
    parametres_cabinet: "aucun",
  },
  secretaire: {
    dashboard: "complet",
    dossiers: "complet",
    clients: "complet",
    agenda: "complet",
    equipe: "lecture",
    stagiaires: "complet",
    time_tracking: "aucun",
    facturation: "aucun",
    finance: "aucun",
    documents: "complet",
    modeles: "complet",
    courriers: "complet",
    notifications: "complet",
    parametres: "aucun",
    parametres_cabinet: "aucun",
  },
  comptable: {
    dashboard: "complet",
    dossiers: "lecture",
    clients: "lecture",
    agenda: "aucun",
    equipe: "aucun",
    stagiaires: "aucun",
    time_tracking: "lecture",
    facturation: "complet",
    finance: "complet",
    documents: "lecture",
    modeles: "aucun",
    courriers: "aucun",
    notifications: "complet",
    parametres: "aucun",
    parametres_cabinet: "aucun",
  },
};

/** L'utilisateur a-t-il au moins un accès en lecture à la section ? */
export function hasAccess(role: Role | null | undefined, section: Section): boolean {
  if (!role) return false;
  return MATRICE_PERMISSIONS[role]?.[section] !== "aucun";
}

/** L'utilisateur peut-il modifier (accès complet) la section ? */
export function canEdit(role: Role | null | undefined, section: Section): boolean {
  if (!role) return false;
  return MATRICE_PERMISSIONS[role]?.[section] === "complet";
}

/** Niveau d'accès brut. */
export function niveauAcces(role: Role | null | undefined, section: Section): Acces {
  if (!role) return "aucun";
  return MATRICE_PERMISSIONS[role]?.[section] ?? "aucun";
}

/** Map d'une route (pathname) vers sa section, pour le middleware. */
export function sectionForPath(pathname: string): Section | null {
  if (pathname.startsWith("/parametres/cabinet")) return "parametres_cabinet";
  if (pathname.startsWith("/parametres")) return "parametres";
  if (pathname.startsWith("/dashboard")) return "dashboard";
  if (pathname.startsWith("/dossiers")) return "dossiers";
  if (pathname.startsWith("/clients")) return "clients";
  if (pathname.startsWith("/agenda")) return "agenda";
  if (pathname.startsWith("/equipe")) return "equipe";
  if (pathname.startsWith("/stagiaires")) return "stagiaires";
  if (pathname.startsWith("/time-tracking")) return "time_tracking";
  if (pathname.startsWith("/devis")) return "facturation";
  if (pathname.startsWith("/facturation")) return "facturation";
  if (pathname.startsWith("/finance")) return "finance";
  if (pathname.startsWith("/documents")) return "documents";
  if (pathname.startsWith("/modeles")) return "modeles";
  if (pathname.startsWith("/courriers")) return "courriers";
  if (pathname.startsWith("/notifications")) return "notifications";
  return null;
}
