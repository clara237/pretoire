"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getProfilCourant } from "@/lib/auth";
import { canEdit } from "@/lib/roles";
import { ROLES, type Role } from "@/lib/roles";

export interface ResultatAction {
  ok: boolean;
  message?: string;
  id?: string;
}

function nettoyer(v: FormDataEntryValue | null): string | null {
  if (v === null) return null;
  const s = String(v).trim();
  return s.length > 0 ? s : null;
}

function roleValide(v: string | null): v is Role {
  return v !== null && (ROLES as readonly string[]).includes(v);
}

/** L'utilisateur courant gère-t-il les comptes (section « parametres ») ? */
async function gardeParametres() {
  const profil = await getProfilCourant();
  if (!profil || !canEdit(profil.role, "parametres")) {
    return { autorise: false as const, profil: null };
  }
  return { autorise: true as const, profil };
}

/**
 * Crée un nouvel utilisateur : compte d'authentification (via le client admin
 * service_role) + ligne `profiles`. Le mot de passe provisoire est défini par
 * l'administrateur. Pattern aligné sur scripts/seed-users.mjs.
 */
export async function creerUtilisateur(
  form: FormData,
): Promise<ResultatAction> {
  const garde = await gardeParametres();
  if (!garde.autorise) return { ok: false, message: "Accès refusé." };

  const email = nettoyer(form.get("email"))?.toLowerCase() ?? null;
  const motDePasse = nettoyer(form.get("mot_de_passe"));
  const nom = nettoyer(form.get("nom"));
  const prenom = nettoyer(form.get("prenom"));
  const telephone = nettoyer(form.get("telephone"));
  const roleBrut = nettoyer(form.get("role"));

  if (!email) return { ok: false, message: "L'email est obligatoire." };
  if (!motDePasse || motDePasse.length < 8) {
    return {
      ok: false,
      message: "Le mot de passe provisoire doit faire au moins 8 caractères.",
    };
  }
  if (!nom) return { ok: false, message: "Le nom est obligatoire." };
  if (!prenom) return { ok: false, message: "Le prénom est obligatoire." };
  if (!roleValide(roleBrut)) {
    return { ok: false, message: "Le rôle sélectionné est invalide." };
  }
  // Seul un admin système peut créer un autre admin système (séparation des
  // pouvoirs : l'associé principal gère les comptes mais pas les admins).
  if (roleBrut === "admin_systeme" && garde.profil.role !== "admin_systeme") {
    return {
      ok: false,
      message: "Seul un administrateur système peut attribuer ce rôle.",
    };
  }

  let admin;
  try {
    admin = createAdminClient();
  } catch {
    return {
      ok: false,
      message:
        "Création indisponible : clé de service Supabase absente côté serveur.",
    };
  }

  // 1. Compte auth
  const { data: cree, error: errCreate } = await admin.auth.admin.createUser({
    email,
    password: motDePasse,
    email_confirm: true,
    user_metadata: { nom, prenom },
  });

  if (errCreate || !cree?.user) {
    const msg = errCreate?.message ?? "";
    if (/already|registered|exists/i.test(msg)) {
      return { ok: false, message: "Un compte existe déjà avec cet email." };
    }
    return { ok: false, message: `Création du compte impossible : ${msg}` };
  }

  // 2. Profil applicatif
  const { data: profilCree, error: errProfil } = await admin
    .from("profiles")
    .insert({
      user_id: cree.user.id,
      email,
      nom,
      prenom,
      telephone,
      role: roleBrut,
      actif: true,
    })
    .select("id")
    .single();

  if (errProfil) {
    // Rollback best-effort du compte auth pour ne pas laisser d'orphelin.
    await admin.auth.admin.deleteUser(cree.user.id);
    return {
      ok: false,
      message: `Compte créé mais profil en échec : ${errProfil.message}`,
    };
  }

  revalidatePath("/parametres/utilisateurs");
  revalidatePath("/parametres/tarifs");
  revalidatePath("/equipe");
  return { ok: true, id: (profilCree as { id: string }).id };
}

/** Met à jour le rôle et les informations d'un profil existant. */
export async function modifierUtilisateur(
  profileId: string,
  form: FormData,
): Promise<ResultatAction> {
  const garde = await gardeParametres();
  if (!garde.autorise) return { ok: false, message: "Accès refusé." };

  const nom = nettoyer(form.get("nom"));
  const prenom = nettoyer(form.get("prenom"));
  const telephone = nettoyer(form.get("telephone"));
  const roleBrut = nettoyer(form.get("role"));

  if (!nom) return { ok: false, message: "Le nom est obligatoire." };
  if (!prenom) return { ok: false, message: "Le prénom est obligatoire." };
  if (!roleValide(roleBrut)) {
    return { ok: false, message: "Le rôle sélectionné est invalide." };
  }
  if (roleBrut === "admin_systeme" && garde.profil.role !== "admin_systeme") {
    return {
      ok: false,
      message: "Seul un administrateur système peut attribuer ce rôle.",
    };
  }

  // Garde-fou : empêcher de retirer le dernier administrateur système.
  if (roleBrut !== "admin_systeme") {
    const dernier = await empecheDernierAdmin(profileId);
    if (dernier) return dernier;
  }

  const supabase = createClient();
  const { error } = await supabase
    .from("profiles")
    .update({ nom, prenom, telephone, role: roleBrut })
    .eq("id", profileId);

  if (error) {
    return { ok: false, message: `Mise à jour impossible : ${error.message}` };
  }
  revalidatePath("/parametres/utilisateurs");
  revalidatePath("/parametres/tarifs");
  revalidatePath("/equipe");
  return { ok: true };
}

/** Active ou désactive un compte (champ profiles.actif). */
export async function basculerActif(
  profileId: string,
  actif: boolean,
): Promise<ResultatAction> {
  const garde = await gardeParametres();
  if (!garde.autorise) return { ok: false, message: "Accès refusé." };

  // Empêche de désactiver le dernier administrateur actif.
  if (!actif) {
    const dernier = await empecheDernierAdmin(profileId);
    if (dernier) return dernier;
  }

  const supabase = createClient();
  const { error } = await supabase
    .from("profiles")
    .update({ actif })
    .eq("id", profileId);

  if (error) {
    return { ok: false, message: "Changement de statut impossible." };
  }
  revalidatePath("/parametres/utilisateurs");
  revalidatePath("/equipe");
  return { ok: true };
}

/** Édition en ligne du taux horaire d'un avocat (page /parametres/tarifs). */
export async function modifierTauxHoraire(
  profileId: string,
  tauxBrut: string | null,
): Promise<ResultatAction> {
  const garde = await gardeParametres();
  if (!garde.autorise) return { ok: false, message: "Accès refusé." };

  let taux: number | null = null;
  const valeur = tauxBrut?.trim();
  if (valeur) {
    const n = Number(valeur.replace(/\s/g, "").replace(",", "."));
    if (Number.isNaN(n) || n < 0) {
      return { ok: false, message: "Le taux horaire est invalide." };
    }
    taux = n;
  }

  const supabase = createClient();
  const { error } = await supabase
    .from("profiles")
    .update({ taux_horaire: taux })
    .eq("id", profileId);

  if (error) {
    return { ok: false, message: "Mise à jour du taux impossible." };
  }
  revalidatePath("/parametres/tarifs");
  revalidatePath("/equipe");
  return { ok: true };
}

/**
 * Renvoie un résultat d'erreur si l'opération laisserait le système sans
 * administrateur actif, sinon null. Évite de se verrouiller hors de l'app.
 */
async function empecheDernierAdmin(
  profileIdConcerne: string,
): Promise<ResultatAction | null> {
  const supabase = createClient();
  const { data } = await supabase
    .from("profiles")
    .select("id")
    .eq("role", "admin_systeme")
    .eq("actif", true);

  const admins = (data ?? []) as Array<{ id: string }>;
  const restants = admins.filter((a) => a.id !== profileIdConcerne);
  if (admins.some((a) => a.id === profileIdConcerne) && restants.length === 0) {
    return {
      ok: false,
      message:
        "Action refusée : il doit rester au moins un administrateur système actif.",
    };
  }
  return null;
}
