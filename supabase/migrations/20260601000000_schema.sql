-- =====================================================================
-- PRÉTOIRE — Schéma complet
-- Cabinet d'avocats (Cameroun, droit OHADA + camerounais)
-- =====================================================================

create extension if not exists "pgcrypto";

-- ---------------------------------------------------------------------
-- ENUMS
-- ---------------------------------------------------------------------
create type role_utilisateur as enum (
  'admin_systeme','associe_principal','associe','collaborateur',
  'stagiaire','secretaire','comptable'
);

create type type_client as enum ('physique','morale');

create type type_affaire as enum (
  'civil','penal','commercial','social','administratif','ohada'
);

create type statut_dossier as enum (
  'ouvert','en_cours','suspendu','cloture','archive'
);

create type type_partie as enum ('demandeur','defendeur','tiers');

create type type_evenement as enum (
  'rdv','audience','reunion','deadline','deplacement'
);

create type type_tache_temps as enum (
  'consultation','redaction','audience','recherche','deplacement'
);

create type statut_facture as enum (
  'brouillon','envoyee','payee','partielle','impayee','contentieux'
);

create type mode_paiement as enum (
  'especes','virement','mobile_money','cheque'
);

create type type_courrier as enum ('entrant','sortant');

-- ---------------------------------------------------------------------
-- FONCTION updated_at
-- ---------------------------------------------------------------------
create or replace function set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- ---------------------------------------------------------------------
-- CABINET_CONFIG (white-label) — ligne unique
-- ---------------------------------------------------------------------
create table cabinet_config (
  id uuid primary key default gen_random_uuid(),
  nom_cabinet text not null,
  nom_avocat_principal text,
  adresse text,
  ville text,
  pays text default 'Cameroun',
  telephone_1 text,
  telephone_2 text,
  email text,
  site_web text,
  barreau text,
  numero_barreau text,
  logo_url text,
  couleur_principale text not null default '#007A5E',
  couleur_secondaire text not null default '#CE1126',
  pied_de_page_facture text,
  tva_applicable boolean not null default false,
  taux_tva numeric(5,2) not null default 0,
  devise text not null default 'FCFA',
  format_date text not null default 'JJ/MM/AAAA',
  updated_at timestamptz default now(),
  updated_by uuid
);

-- ---------------------------------------------------------------------
-- PROFILES
-- ---------------------------------------------------------------------
create table profiles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references auth.users(id) on delete cascade,
  nom text not null,
  prenom text not null,
  email text not null,
  telephone text,
  role role_utilisateur not null default 'collaborateur',
  photo_url text,
  barreau_numero text,
  specialites text[] default '{}',
  taux_horaire numeric(12,2),
  date_entree date,
  actif boolean not null default true,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);
create index idx_profiles_user_id on profiles(user_id);
create index idx_profiles_role on profiles(role);
create trigger trg_profiles_updated before update on profiles
  for each row execute function set_updated_at();

-- Helper: rôle de l'utilisateur courant (SECURITY DEFINER pour éviter récursion RLS)
create or replace function role_courant()
returns role_utilisateur
language sql stable security definer set search_path = public as $$
  select role from profiles where user_id = auth.uid() limit 1;
$$;

create or replace function profile_id_courant()
returns uuid
language sql stable security definer set search_path = public as $$
  select id from profiles where user_id = auth.uid() limit 1;
$$;

-- ---------------------------------------------------------------------
-- STAGIAIRES
-- ---------------------------------------------------------------------
create table stagiaires (
  id uuid primary key default gen_random_uuid(),
  nom text not null,
  prenom text not null,
  email text,
  telephone text,
  universite text,
  annee_etude text,
  date_debut date,
  date_fin date,
  maitre_stage_id uuid references profiles(id) on delete set null,
  objectifs_stage text,
  notes_evaluation jsonb default '[]',
  note_globale numeric(3,1),
  actif boolean not null default true,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);
create trigger trg_stagiaires_updated before update on stagiaires
  for each row execute function set_updated_at();

create table presences_stagiaires (
  id uuid primary key default gen_random_uuid(),
  stagiaire_id uuid not null references stagiaires(id) on delete cascade,
  date date not null,
  heure_arrivee time,
  heure_depart time,
  present boolean not null default true,
  motif_absence text,
  valide_par uuid references profiles(id) on delete set null,
  created_at timestamptz default now(),
  unique (stagiaire_id, date)
);
create index idx_presences_stagiaire on presences_stagiaires(stagiaire_id);
create index idx_presences_date on presences_stagiaires(date);

-- ---------------------------------------------------------------------
-- CLIENTS
-- ---------------------------------------------------------------------
create table clients (
  id uuid primary key default gen_random_uuid(),
  type type_client not null default 'physique',
  nom text,
  prenom text,
  raison_sociale text,
  email text,
  telephone text,
  adresse text,
  ville text,
  cni_numero text,
  rccm_numero text,
  notes text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);
create index idx_clients_type on clients(type);
create trigger trg_clients_updated before update on clients
  for each row execute function set_updated_at();

-- ---------------------------------------------------------------------
-- SÉQUENCES & NUMÉROTATION AUTO (DOS-2026-001 / FACT-2026-001)
-- ---------------------------------------------------------------------
create sequence if not exists seq_dossier_2026 start 1;
create sequence if not exists seq_facture_2026 start 1;

create or replace function prochain_numero(prefixe text, annee int)
returns text language plpgsql as $$
declare
  seqname text := format('seq_%s_%s', lower(prefixe), annee);
  v bigint;
begin
  begin
    execute format('create sequence if not exists %I start 1', seqname);
  exception when others then null;
  end;
  execute format('select nextval(%L)', seqname) into v;
  return format('%s-%s-%s', upper(prefixe), annee, lpad(v::text, 3, '0'));
end;
$$;

-- ---------------------------------------------------------------------
-- DOSSIERS
-- ---------------------------------------------------------------------
create table dossiers (
  id uuid primary key default gen_random_uuid(),
  numero text not null unique,
  titre text not null,
  type_affaire type_affaire not null default 'civil',
  description_faits text,
  pretentions text,
  moyens text,
  statut statut_dossier not null default 'ouvert',
  tribunal text,
  chambre text,
  numero_role text,
  client_id uuid references clients(id) on delete set null,
  avocat_responsable_id uuid references profiles(id) on delete set null,
  date_ouverture date not null default current_date,
  date_cloture_prev date,
  date_cloture_reel date,
  montant_enjeu numeric(15,2),
  notes_internes text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);
create index idx_dossiers_client on dossiers(client_id);
create index idx_dossiers_responsable on dossiers(avocat_responsable_id);
create index idx_dossiers_statut on dossiers(statut);
create index idx_dossiers_type on dossiers(type_affaire);
create trigger trg_dossiers_updated before update on dossiers
  for each row execute function set_updated_at();

-- Numéro auto si non fourni
create or replace function dossier_numero_auto()
returns trigger language plpgsql as $$
begin
  if new.numero is null or new.numero = '' then
    new.numero := prochain_numero('dos', extract(year from coalesce(new.date_ouverture, current_date))::int);
  end if;
  return new;
end;
$$;
create trigger trg_dossier_numero before insert on dossiers
  for each row execute function dossier_numero_auto();

create table dossier_equipe (
  id uuid primary key default gen_random_uuid(),
  dossier_id uuid not null references dossiers(id) on delete cascade,
  profile_id uuid not null references profiles(id) on delete cascade,
  role_dans_dossier text,
  created_at timestamptz default now(),
  unique (dossier_id, profile_id)
);
create index idx_equipe_dossier on dossier_equipe(dossier_id);
create index idx_equipe_profile on dossier_equipe(profile_id);

create table dossier_stagiaires (
  id uuid primary key default gen_random_uuid(),
  dossier_id uuid not null references dossiers(id) on delete cascade,
  stagiaire_id uuid not null references stagiaires(id) on delete cascade,
  date_affectation date default current_date,
  unique (dossier_id, stagiaire_id)
);
create index idx_dstagiaires_dossier on dossier_stagiaires(dossier_id);
create index idx_dstagiaires_stagiaire on dossier_stagiaires(stagiaire_id);

create table parties (
  id uuid primary key default gen_random_uuid(),
  dossier_id uuid not null references dossiers(id) on delete cascade,
  nom text not null,
  type type_partie not null,
  avocat_adverse text,
  contact text,
  created_at timestamptz default now()
);
create index idx_parties_dossier on parties(dossier_id);

create table actes_procedure (
  id uuid primary key default gen_random_uuid(),
  dossier_id uuid not null references dossiers(id) on delete cascade,
  type_acte text not null,
  description text,
  date_acte date not null default current_date,
  auteur_id uuid references profiles(id) on delete set null,
  fichier_url text,
  created_at timestamptz default now()
);
create index idx_actes_dossier on actes_procedure(dossier_id);

-- ---------------------------------------------------------------------
-- ÉVÉNEMENTS (agenda)
-- ---------------------------------------------------------------------
create table evenements (
  id uuid primary key default gen_random_uuid(),
  titre text not null,
  type type_evenement not null default 'rdv',
  description text,
  dossier_id uuid references dossiers(id) on delete set null,
  profile_id uuid references profiles(id) on delete set null,
  stagiaire_id uuid references stagiaires(id) on delete set null,
  lieu text,
  date_debut timestamptz not null,
  date_fin timestamptz,
  rappel_j7 boolean default false,
  rappel_j3 boolean default false,
  rappel_j1 boolean default false,
  rappel_envoye boolean default false,
  created_by uuid references profiles(id) on delete set null,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);
create index idx_evenements_dossier on evenements(dossier_id);
create index idx_evenements_profile on evenements(profile_id);
create index idx_evenements_debut on evenements(date_debut);
create index idx_evenements_type on evenements(type);
create trigger trg_evenements_updated before update on evenements
  for each row execute function set_updated_at();

-- ---------------------------------------------------------------------
-- FINANCE
-- ---------------------------------------------------------------------
create table factures (
  id uuid primary key default gen_random_uuid(),
  numero text not null unique,
  client_id uuid references clients(id) on delete set null,
  dossier_id uuid references dossiers(id) on delete set null,
  date_emission date not null default current_date,
  date_echeance date,
  montant_ht numeric(15,2) not null default 0,
  tva numeric(15,2) not null default 0,
  montant_ttc numeric(15,2) not null default 0,
  devise text not null default 'FCFA',
  statut statut_facture not null default 'brouillon',
  notes text,
  created_by uuid references profiles(id) on delete set null,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);
create index idx_factures_client on factures(client_id);
create index idx_factures_dossier on factures(dossier_id);
create index idx_factures_statut on factures(statut);
create trigger trg_factures_updated before update on factures
  for each row execute function set_updated_at();

create or replace function facture_numero_auto()
returns trigger language plpgsql as $$
begin
  if new.numero is null or new.numero = '' then
    new.numero := prochain_numero('fact', extract(year from coalesce(new.date_emission, current_date))::int);
  end if;
  return new;
end;
$$;
create trigger trg_facture_numero before insert on factures
  for each row execute function facture_numero_auto();

create table paiements (
  id uuid primary key default gen_random_uuid(),
  facture_id uuid not null references factures(id) on delete cascade,
  date_paiement date not null default current_date,
  montant numeric(15,2) not null,
  mode_paiement mode_paiement not null default 'virement',
  reference text,
  notes text,
  created_at timestamptz default now()
);
create index idx_paiements_facture on paiements(facture_id);

create table saisies_temps (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references profiles(id) on delete cascade,
  dossier_id uuid references dossiers(id) on delete set null,
  date date not null default current_date,
  type_tache type_tache_temps not null default 'consultation',
  description text,
  duree_heures numeric(6,2) not null default 0,
  taux_horaire numeric(12,2),
  facturable boolean not null default true,
  facture_id uuid references factures(id) on delete set null,
  created_at timestamptz default now()
);
create index idx_saisies_profile on saisies_temps(profile_id);
create index idx_saisies_dossier on saisies_temps(dossier_id);
create index idx_saisies_date on saisies_temps(date);

create table depenses (
  id uuid primary key default gen_random_uuid(),
  categorie text not null,
  description text,
  montant numeric(15,2) not null,
  date_depense date not null default current_date,
  justificatif_url text,
  created_by uuid references profiles(id) on delete set null,
  created_at timestamptz default now()
);
create index idx_depenses_date on depenses(date_depense);

-- ---------------------------------------------------------------------
-- DOCUMENTS
-- ---------------------------------------------------------------------
create table documents (
  id uuid primary key default gen_random_uuid(),
  nom text not null,
  type text,
  dossier_id uuid references dossiers(id) on delete cascade,
  uploaded_by uuid references profiles(id) on delete set null,
  fichier_url text not null,
  taille_ko integer,
  created_at timestamptz default now()
);
create index idx_documents_dossier on documents(dossier_id);

create table modeles_documents (
  id uuid primary key default gen_random_uuid(),
  nom text not null,
  categorie text,
  description text,
  fichier_url text,
  uploaded_by uuid references profiles(id) on delete set null,
  actif boolean not null default true,
  created_at timestamptz default now()
);

-- ---------------------------------------------------------------------
-- NOTIFICATIONS
-- ---------------------------------------------------------------------
create table notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  titre text not null,
  message text,
  type text default 'info',
  lien text,
  lu boolean not null default false,
  created_at timestamptz default now()
);
create index idx_notifications_user on notifications(user_id);
create index idx_notifications_lu on notifications(lu);

-- ---------------------------------------------------------------------
-- COURRIERS
-- ---------------------------------------------------------------------
create table courriers (
  id uuid primary key default gen_random_uuid(),
  dossier_id uuid references dossiers(id) on delete set null,
  type type_courrier not null default 'entrant',
  objet text not null,
  expediteur text,
  destinataire text,
  date_courrier date not null default current_date,
  fichier_url text,
  notes text,
  created_by uuid references profiles(id) on delete set null,
  created_at timestamptz default now()
);
create index idx_courriers_dossier on courriers(dossier_id);
