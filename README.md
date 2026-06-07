# Prétoire — Gestion de cabinet d'avocats

Logiciel **white-label** de gestion de cabinet d'avocats, pensé pour le Cameroun
(droit OHADA + droit camerounais). Construit avec **Next.js 14** (App Router,
TypeScript), **Supabase** (PostgreSQL + Auth + Storage) et **Tailwind CSS**.

Le cabinet par défaut est *Cabinet Maître Kengni Christophe* (Yaoundé). Un
administrateur peut tout reconfigurer (nom, logo, couleurs, coordonnées, TVA,
devise…) depuis `/parametres/cabinet` **sans toucher au code** : le produit est
revendable à n'importe quel autre cabinet.

---

## Prérequis

- **Node.js** ≥ 18 et **npm**
- **Supabase CLI** (`supabase`) + **Docker** (pour la stack Supabase locale)
- **psql** (client PostgreSQL, pour charger les données de démonstration)

---

## Installation & lancement (développement local)

```bash
# 1. Dépendances
npm install

# 2. Démarrer la stack Supabase locale (Postgres + Auth + Storage + Studio)
#    Applique automatiquement les migrations de supabase/migrations/.
supabase start

# 3. Récupérer les clés locales et créer .env.local
cp .env.example .env.local
supabase status        # → copier "API URL", "anon key", "service_role key"
#    Renseigner dans .env.local :
#      NEXT_PUBLIC_SUPABASE_URL       (API URL,        ex. http://127.0.0.1:54321)
#      NEXT_PUBLIC_SUPABASE_ANON_KEY  (anon key)
#      SUPABASE_SERVICE_ROLE_KEY      (service_role key)

# 4. Créer les comptes d'authentification + profils (utilise la clé service_role)
node scripts/seed-users.mjs

# 5. Charger les données de démonstration (clients, dossiers, factures, agenda…)
#    DB_URL = "DB URL" affichée par `supabase status`
#    (par défaut : postgresql://postgres:postgres@127.0.0.1:54322/postgres)
psql "postgresql://postgres:postgres@127.0.0.1:54322/postgres" -f supabase/seed.sql

# 6. Lancer le serveur de développement
npm run dev
```

Ouvrir **http://localhost:3000** → vous êtes redirigé vers `/login`.

> **Ordre important** : `seed-users.mjs` **avant** `seed.sql`. Le script crée les
> comptes auth et les profils avec des UUID **stables** que `seed.sql` référence
> ensuite (avocats responsables de dossiers, auteurs de saisies de temps, etc.).
> Les deux étapes sont **idempotentes** (relançables sans dupliquer).

### Identifiants de démonstration

> ⚠️ **Comptes de démonstration locaux uniquement.** Ces identifiants servent au
> jeu de données de démonstration (`scripts/seed-users.mjs`). **À supprimer ou
> changer impérativement avant toute mise en production.**

| Email | Mot de passe | Rôle |
|---|---|---|
| `admin@pretoire.cm` | `Admin2024!` | Administrateur système |
| `associe@pretoire.cm` | `Associe2024!` | Associé |
| `collaborateur@pretoire.cm` | `Collab2024!` | Collaborateur |

Le compte **admin** donne accès à tout, y compris `/parametres/cabinet`
(white-label, admin uniquement). Le cabinet par défaut est un vrai cabinet
(Cabinet Maître Kengni Christophe) ; les **clients, dossiers et autres personnes**
du seed sont en revanche **fictifs**.

---

## Variables d'environnement

Voir **`.env.example`** (commenté). Les trois premières s'obtiennent via
`supabase status` en local :

| Variable | Rôle |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | URL de l'API Supabase (exposée au navigateur) |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Clé publique « anon » (protégée par les RLS) |
| `SUPABASE_SERVICE_ROLE_KEY` | Clé `service_role`, **serveur uniquement**. Requise par `scripts/seed-users.mjs`, la création d'utilisateurs depuis `/parametres/utilisateurs` et le job système de rappels (`lib/rappels-auto.ts`). Ne JAMAIS préfixer `NEXT_PUBLIC_`. |
| `SMTP_HOST` / `SMTP_PORT` (+ `SMTP_USER`/`SMTP_PASS` en prod) | Serveur SMTP des emails de rappel/relance. En local : Mailpit de la stack Supabase (`127.0.0.1:54325`, messages visibles sur http://127.0.0.1:54324). Si absent, les emails sont désactivés proprement (les notifications in-app restent). |
| `EMAIL_FROM` | Adresse expéditrice des emails (à défaut : email du cabinet, puis fallback). |
| `TOGETHER_API_KEY` | Clé Together AI de l'assistant de rédaction (corriger / reformuler / style juridique). **Serveur uniquement.** Si absente, les boutons IA ne s'affichent pas. `TOGETHER_MODEL` optionnel (défaut : Llama 3.3 70B Turbo). |

> Si `SUPABASE_SERVICE_ROLE_KEY` est absente, la création de comptes via l'UI
> échoue proprement (toast « clé de service absente ») sans planter l'app.

### Rappels automatiques

Un job système throttlé (15 min, `lib/rappels-auto.ts`, déclenché par la
navigation dans le dashboard) vérifie : les **échéances de procédure**
(paliers J-7/J-3/J-1 → notification + email aux avocats concernés) et les
**factures échues** (envoyée/partielle dépassant leur date d'échéance →
statut « impayée » + notification + email à l'émetteur). Le bouton
« Relancer » d'une facture envoie en plus un **email de relance au client**.
La logique partagée vit dans `lib/rappels-core.ts` — en production
multi-instances, la brancher sur un vrai cron (Vercel Cron, pg_cron…).

---

## Architecture des dossiers

```
app/
  page.tsx                      → redirige vers /dashboard (filet de sécurité)
  layout.tsx                    → <html>, polices, CabinetProvider, Toaster
  login/                        → page de connexion (logo Barreau + nom cabinet)
  (dashboard)/                  → groupe protégé (sidebar + topbar)
    layout.tsx                  → AppShell, garde de session, badge notifications
    dashboard/                  → KPI, agenda du jour, dossiers récents
    dossiers/  · nouveau · [id] → onglets Infos/Parties/Actes/Documents/Équipe/Finances/Notes
    clients/   · nouveau · [id]
    agenda/    · nouveau         → vues jour/semaine/mois, échéances J-7/J-3/J-1
    equipe/              · [id]  → avocats : charge, heures, objectif vs réalisé
    stagiaires/· nouveau · [id]  → onglets Profil/Présences/Dossiers/Évaluations/Attestation
    courriers/                   → correspondance entrante/sortante
    time-tracking/               → saisie + timesheet hebdomadaire
    facturation/· nouvelle · [id]
    finance/                     → CA, créances, top clients, graphiques recharts-like
    documents/                   → bibliothèque de pièces (Storage)
    modeles/                     → modèles de documents réutilisables
    notifications/
    parametres/                  → redirige vers /parametres/utilisateurs
      cabinet/                   → WHITE-LABEL (admin uniquement)
      utilisateurs/  · tarifs/

components/
  ui/        → kit UI (Button, Card, Badge, Table, Modal, EmptyState, StatCard…)
  shell/     → AppShell, Sidebar, Topbar, ThemeToggle, UserMenu
  providers/ → CabinetProvider (CSS vars couleurs + contexte cabinet), Theme
  logos/     → logo Barreau du Cameroun + logo Prétoire (SVG)

lib/
  navigation.ts        → arbre de navigation (filtré par rôle dans la Sidebar)
  roles.ts             → rôles, sections, MATRICE_PERMISSIONS, hasAccess/canEdit
  auth.ts              → getProfilCourant() (profil + rôle de l'utilisateur)
  cabinet.ts           → getCabinetConfig() server-side (white-label)
  utils.ts             → formatFCFA, formatDate, formatHeures, cn…
  finance-constants.ts → libellés/tons PURS : statuts factures, types de tâche,
                         modes de paiement, catégories dépenses/modèles (client-safe)
  queries/
    dossiers-labels.ts → libellés/tons PURS dossiers (statut, type d'affaire, parties)
    dossiers.ts        → requêtes server-only dossiers (ré-exporte dossiers-labels)
    clients.ts · finance.ts
  actions/             → Server Actions (CRUD) par domaine
  pdf/                 → génération PDF côté navigateur (jsPDF) :
                         document-base.ts (socle white-label) + facture, attestation
                         stagiaire, fiche dossier, rapport d'activité
  supabase/            → client.ts (browser), server.ts (RSC), middleware.ts, admin.ts (service_role)
  database.types.ts    → types générés depuis le schéma Supabase

supabase/
  migrations/          → 0000 schéma · 0100 RLS · 0200 storage (buckets + policies)
  seed.sql             → données de démonstration (idempotent)
scripts/
  seed-users.mjs       → crée comptes auth + profils (UUID stables) via service_role
```

### Conventions transverses

- **Source unique des libellés/badges.** Les statuts de dossier et types
  d'affaire vivent dans `lib/queries/dossiers-labels.ts` ; les statuts de
  facture, types de tâche, modes de paiement dans `lib/finance-constants.ts` ;
  les types d'événement dans `app/(dashboard)/agenda/_lib/evenements.ts`. **Ne
  pas redéfinir** ces maps localement — importer depuis ces modules pour garder
  des couleurs de badge cohérentes entre tous les domaines.
- **Pages données** = Server Component `async` + `<Suspense>` + skeletons.
- **Mutations** = Server Actions (`lib/actions/*`) avec `revalidatePath`, toasts
  succès/erreur côté client, confirmation avant toute suppression.
- **White-label** : toute couleur/coordonnée/logo provient de `cabinet_config`.
  Les couleurs sont injectées en CSS vars (`--couleur-principale`,
  `--couleur-secondaire`) par le `CabinetProvider`. Les Server Actions de
  `/parametres/cabinet` font `revalidatePath('/', 'layout')` → sidebar, login et
  PDF reflètent le changement immédiatement.

---

## Rôles & permissions

Source de vérité : `lib/roles.ts` (`MATRICE_PERMISSIONS`). Le middleware
(`lib/supabase/middleware.ts` + `sectionForPath`) protège chaque route ; la
sidebar masque les sections inaccessibles ; les Server Actions revérifient
`canEdit(role, section)` côté serveur.

`✓` = accès complet · `L` = lecture seule · `·` = aucun accès

| Section | admin_systeme | associe_principal | associe | collaborateur | stagiaire | secretaire | comptable |
|---|:--:|:--:|:--:|:--:|:--:|:--:|:--:|
| Tableau de bord | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| Dossiers | ✓ | ✓ | ✓ | ✓ | ✓¹ | ✓ | L |
| Clients | ✓ | ✓ | ✓ | ✓ | L | ✓ | L |
| Agenda | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | · |
| Équipe (avocats) | ✓ | ✓ | L | L | · | L | · |
| Stagiaires | ✓ | ✓ | L | L | · | ✓ | · |
| Time tracking | ✓ | ✓ | ✓ | ✓ | ✓ | · | L |
| Facturation | ✓ | ✓ | ✓ | · | L | · | ✓ |
| Finance | ✓ | ✓ | ✓ | · | L | · | ✓ |
| Documents | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | L |
| Modèles | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | · |
| Correspondance | ✓ | ✓ | ✓ | ✓ | L | ✓ | · |
| Notifications | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| Paramètres (utilisateurs, tarifs) | ✓ | ✓ | · | · | · | · | · |
| Paramètres cabinet (white-label) | ✓ | · | · | · | · | · | · |

¹ Le stagiaire ne voit que **les dossiers qui lui sont assignés** (filtré par RLS).

Garde-fous : on ne peut pas rétrograder ni désactiver **le dernier
`admin_systeme` actif** (`lib/actions/utilisateurs.ts`). La suppression de
documents est restreinte à `admin_systeme` / `associe_principal` / `associe`
(cohérent avec la policy Storage).

---

## Storage (Supabase)

Trois buckets, créés par `supabase/migrations/20260601000200_storage.sql` :

| Bucket | Visibilité | Contenu | Écriture |
|---|---|---|---|
| `documents` | privé | pièces de dossiers, pièces jointes d'actes, modèles (sous-dossier `modeles/`) | tous sauf `comptable` |
| `justificatifs` | privé | justificatifs de dépenses | accès finance |
| `logos` | public | logo du cabinet (login, sidebar, PDF) | `admin_systeme` |

> La migration storage est **tolérante** : si le service Storage Docker est
> absent, elle ne crée rien (et ne plante pas). **À l'intégration / en prod**,
> s'assurer que le service Storage est actif puis (re)jouer cette migration,
> sinon tout téléversement échoue proprement (toast d'erreur) mais aucune pièce
> réelle n'est stockée. Les chemins de démonstration (`documents/demo*`) ne sont
> jamais supprimés du Storage et affichent « Lien indisponible » au
> téléchargement tant que le fichier réel n'existe pas — comportement attendu.

---

## PDF

Génération **côté navigateur** (jsPDF) à partir d'un socle commun
`lib/pdf/document-base.ts` qui lit `cabinet_config` via `useCabinet()` :
en-tête (logo + coordonnées), signature = `nom_avocat_principal`, devise et TVA
au moment de la génération. Disponibles : **facture**, **attestation de stage**,
**fiche dossier**, **rapport d'activité**. Tout changement white-label se
répercute donc automatiquement dans les PDF.

---

## Limites connues & contournements (schéma DB figé)

Le schéma de base est **gelé** (aucune migration ajoutée à l'intégration). Les
points suivants sont des contournements applicatifs assumés, à lever par une
évolution de schéma si besoin :

- **Audiences — `tribunal` / `chambre` / `numéro de rôle`.** La table
  `evenements` n'a pas ces colonnes : `tribunal` est stocké dans `lieu`, et
  `chambre` + `numero_role` sont agrégés dans `description` (préfixe structuré).
  Conséquence : à l'édition d'une audience, seul `tribunal` se re-remplit dans
  son champ ; `chambre`/`numero_role` restent visibles uniquement dans la
  description. *Évolution* : ajouter ces 3 colonnes à `evenements`.
- **Objectif d'heures mensuel.** `profiles` n'a pas de colonne d'objectif :
  l'indicateur « objectif vs réalisé » utilise une constante
  `OBJECTIF_HEURES_MENSUEL = 120` (`app/(dashboard)/equipe/_lib/charge.ts`).
  *Évolution* : externaliser dans `cabinet_config` ou par profil.
- **Facturation — 3 modes.** Une facture peut être construite : (1) **depuis les
  heures** saisies (`saisies_temps` rattachées via `facture_id`) ; (2) **montant
  forfaitaire** (honoraires fixes / provision) ; (3) **lignes détaillées**
  (table `lignes_facture`) — l'admin compose la facture ligne par ligne :
  frais d'ouverture (montant par défaut configurable dans `cabinet_config`),
  déplacements, honoraires, débours refacturés (timbres, certifications,
  certificats…), chaque ligne catégorisée. Les **paiements en nature**
  (terrain, véhicule…) sont gérés via le mode de paiement `nature` avec une
  valeur estimée qui réduit le solde dû.
- **Numérotation `DOS-AAAA-001` / `FACT-AAAA-001`.** Calculée côté application
  (max existant de l'année + 1) plutôt que via la RPC `prochain_numero` (qui
  s'appuie sur une séquence non avancée par le seed → risque de collision). La
  logique app est déterministe vis-à-vis du seed. Petite fenêtre de course en
  cas de double création simultanée (acceptable pour un cabinet ; la contrainte
  d'unicité fait échouer le 2e insert). *Évolution* : RPC `max+1` atomique
  (advisory lock) si robustesse multi-utilisateur requise.
- **Pièce jointe de courrier.** Le formulaire `/courriers` attend une **URL
  saisie à la main** (`fichier_url`), pas un upload Storage direct (le helper
  d'upload vit côté Documents). *Évolution* : mutualiser un helper d'upload
  Storage si l'on veut un téléversement depuis `/courriers`.
- **Adresse client sur le PDF facture.** Le bloc « Facturé à » affiche le nom du
  client mais pas son adresse postale (la requête ne sélectionne pas
  `clients.adresse/ville`). Non bloquant.

---

## Échéances & notifications

Les rappels tournent **automatiquement** : un job système throttlé (15 min,
`lib/rappels-auto.ts`, déclenché par la navigation dans le dashboard, exécuté
avec le client `service_role`) insère les notifications in-app aux paliers
**J-7 / J-3 / J-1** cochés sur un événement (puis marque
`evenements.rappel_envoye = true`, réarmé à chaque modification → pas de
doublon) **et** envoie un email aux avocats concernés. Le même job passe les
factures échues (envoyée/partielle dépassant `date_echeance`) en statut
`impayee` avec notification + email à l'émetteur. Le bouton « Vérifier les
échéances » de `/agenda` reste disponible pour un déclenchement manuel. La
logique partagée vit dans `lib/rappels-core.ts` ; en production multi-instances,
la brancher sur un vrai cron (Vercel Cron, pg_cron…).

Les relances de factures (J+30 / J+60 / J+90) insèrent une notification
(`type='relance'`, `lien=/facturation/[id]`) et un email de relance au client ;
au palier J+90 la facture passe automatiquement en statut `contentieux`. Le
badge de notifications non lues du topbar est recalculé par le layout
`(dashboard)` et rafraîchi après chaque action.

---

## Vérifications

```bash
npx tsc --noEmit     # typage : doit être propre (0 erreur)
npm run lint         # ESLint Next.js
npm run build        # build de production
```

---

## Passage en production (Supabase cloud)

1. Créer un projet sur https://supabase.com
2. `supabase link --project-ref <ref>`
3. `supabase db push` (applique les migrations, dont les buckets Storage)
4. `supabase gen types typescript --linked > lib/database.types.ts`
5. Renseigner les variables d'env (Project Settings → API + SMTP réel)
6. `node scripts/seed-users.mjs` (avec les clés prod) **puis changer les mots de passe de démo**
7. *(optionnel)* charger `supabase/seed.sql` pour des données de démonstration

---

## Sécurité

L'application applique une **défense en profondeur** : contrôle d'accès par rôle
dans le middleware (`lib/supabase/middleware.ts`, `getUser()` validé serveur)
**et** dans chaque Server Action (`getProfilCourant` + `hasAccess/canEdit`),
doublé par des **policies RLS** Postgres sur les 20 tables. Points notables :

- **RLS** active sur toutes les tables ; un trigger
  (`20260607000100_securite.sql`) empêche un utilisateur de modifier son propre
  `role`/`actif`/`taux_horaire` (anti-élévation de privilège).
- Les notifications système (rappels, relances) sont émises via `service_role` ;
  l'insertion authentifiée est restreinte à sa propre boîte.
- Les URL signées Storage ne sont délivrées qu'après vérification du droit de
  voir la ressource sous RLS (anti-IDOR).
- Secrets confinés au serveur (`server-only`, jamais de préfixe `NEXT_PUBLIC_`
  sur une clé secrète) ; en-têtes de sécurité dans `next.config.mjs`.

**Suivi avant production réelle :** mettre à jour Next.js (la 14.2.35 embarque
une vulnérabilité *high* connue, correctif dans une version majeure ultérieure)
et configurer un SMTP de production.
