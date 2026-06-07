// =====================================================================
// PRÉTOIRE — Création des comptes auth + profils (service_role)
// =====================================================================
// Crée les utilisateurs d'authentification via l'Admin API Supabase puis
// insère/maj leur profil dans la table `profiles`. Idempotent : relançable.
//
//   node scripts/seed-users.mjs
//
// Lit NEXT_PUBLIC_SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY depuis .env.local.
// =====================================================================

import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";
import { createClient } from "@supabase/supabase-js";

const __dirname = dirname(fileURLToPath(import.meta.url));

// --- Chargement minimal de .env.local --------------------------------
function chargerEnv() {
  const chemin = resolve(__dirname, "..", ".env.local");
  let contenu = "";
  try {
    contenu = readFileSync(chemin, "utf8");
  } catch {
    console.error("❌ .env.local introuvable. Lancez la génération de l'env d'abord.");
    process.exit(1);
  }
  for (const ligne of contenu.split("\n")) {
    const m = ligne.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
    if (m && !process.env[m[1]]) {
      process.env[m[1]] = m[2].replace(/^["']|["']$/g, "");
    }
  }
}
chargerEnv();

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !serviceKey) {
  console.error("❌ NEXT_PUBLIC_SUPABASE_URL ou SUPABASE_SERVICE_ROLE_KEY manquant dans .env.local.");
  process.exit(1);
}

const admin = createClient(url, serviceKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

// --- Utilisateurs à créer (UUID stables → réutilisés par seed.sql) ----
const UTILISATEURS = [
  {
    id: "11111111-1111-1111-1111-111111111111",
    email: "admin@pretoire.cm",
    password: "Admin2024!",
    profil: {
      id: "aaaaaaaa-0000-0000-0000-000000000001",
      nom: "Kengni",
      prenom: "Christophe",
      role: "admin_systeme",
      telephone: "+237 677 776 672",
      barreau_numero: "CM-2008-0142",
      specialites: ["Droit OHADA", "Droit des affaires", "Droit pénal"],
      taux_horaire: 75000,
      date_entree: "2008-01-15",
    },
  },
  {
    id: "22222222-2222-2222-2222-222222222222",
    email: "associe@pretoire.cm",
    password: "Associe2024!",
    profil: {
      id: "aaaaaaaa-0000-0000-0000-000000000002",
      nom: "Nguemo",
      prenom: "Aline",
      role: "associe",
      telephone: "+237 699 112 233",
      barreau_numero: "CM-2014-0521",
      specialites: ["Droit civil", "Droit social"],
      taux_horaire: 50000,
      date_entree: "2014-09-01",
    },
  },
  {
    id: "33333333-3333-3333-3333-333333333333",
    email: "collaborateur@pretoire.cm",
    password: "Collab2024!",
    profil: {
      id: "aaaaaaaa-0000-0000-0000-000000000003",
      nom: "Fotso",
      prenom: "Bertrand",
      role: "collaborateur",
      telephone: "+237 678 445 566",
      barreau_numero: "CM-2020-0987",
      specialites: ["Droit commercial", "Contentieux"],
      taux_horaire: 35000,
      date_entree: "2020-03-10",
    },
  },
];

async function trouverUserParEmail(email) {
  // L'admin API ne propose pas de getUserByEmail ; on pagine listUsers.
  let page = 1;
  // eslint-disable-next-line no-constant-condition
  while (true) {
    const { data, error } = await admin.auth.admin.listUsers({ page, perPage: 1000 });
    if (error) throw error;
    const trouve = data.users.find((u) => u.email === email);
    if (trouve) return trouve;
    if (data.users.length < 1000) return null;
    page += 1;
  }
}

async function main() {
  for (const u of UTILISATEURS) {
    // 1. Compte auth (création ou récupération de l'existant)
    let userId = u.id;
    const { data: cree, error: errCreate } = await admin.auth.admin.createUser({
      id: u.id,
      email: u.email,
      password: u.password,
      email_confirm: true,
      user_metadata: { nom: u.profil.nom, prenom: u.profil.prenom },
    });

    if (errCreate) {
      const existant = await trouverUserParEmail(u.email);
      if (!existant) {
        console.error(`❌ ${u.email} : ${errCreate.message}`);
        process.exitCode = 1;
        continue;
      }
      userId = existant.id;
      // remet le mot de passe à la valeur attendue (idempotence)
      await admin.auth.admin.updateUserById(userId, {
        password: u.password,
        email_confirm: true,
      });
      console.log(`↺ ${u.email} existe déjà (mot de passe réinitialisé)`);
    } else {
      userId = cree.user.id;
      console.log(`✓ ${u.email} créé`);
    }

    // 2. Profil applicatif (upsert sur user_id)
    const { error: errProfil } = await admin
      .from("profiles")
      .upsert(
        {
          id: u.profil.id,
          user_id: userId,
          email: u.email,
          nom: u.profil.nom,
          prenom: u.profil.prenom,
          role: u.profil.role,
          telephone: u.profil.telephone,
          barreau_numero: u.profil.barreau_numero,
          specialites: u.profil.specialites,
          taux_horaire: u.profil.taux_horaire,
          date_entree: u.profil.date_entree,
          actif: true,
        },
        { onConflict: "user_id" },
      );
    if (errProfil) {
      console.error(`❌ profil ${u.email} : ${errProfil.message}`);
      process.exitCode = 1;
    } else {
      console.log(`  → profil ${u.profil.role} OK`);
    }
  }
  console.log("\nComptes de démonstration :");
  for (const u of UTILISATEURS) console.log(`  ${u.email} / ${u.password} (${u.profil.role})`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
