-- =====================================================================
-- PRÉTOIRE — Row Level Security
-- Le rôle est lu depuis profiles via role_courant() (security definer).
-- =====================================================================

-- Helpers de groupes de rôles -----------------------------------------
create or replace function a_acces_total()
returns boolean language sql stable security definer set search_path = public as $$
  select role_courant() in ('admin_systeme','associe_principal');
$$;

create or replace function a_acces_dossiers()
returns boolean language sql stable security definer set search_path = public as $$
  select role_courant() in (
    'admin_systeme','associe_principal','associe','collaborateur','secretaire'
  );
$$;

create or replace function a_acces_finance()
returns boolean language sql stable security definer set search_path = public as $$
  select role_courant() in (
    'admin_systeme','associe_principal','associe','comptable'
  );
$$;

create or replace function peut_voir_finance()
returns boolean language sql stable security definer set search_path = public as $$
  -- finance en lecture : + stagiaire (lecture seule), - secretaire
  select role_courant() in (
    'admin_systeme','associe_principal','associe','comptable','stagiaire'
  );
$$;

create or replace function a_acces_agenda()
returns boolean language sql stable security definer set search_path = public as $$
  select role_courant() <> 'comptable';
$$;

-- Le stagiaire courant a-t-il accès à ce dossier ? (assigné) -----------
create or replace function stagiaire_voit_dossier(d_id uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1
    from dossier_stagiaires ds
    join stagiaires s on s.id = ds.stagiaire_id
    join profiles p on (p.email = s.email)
    where ds.dossier_id = d_id and p.user_id = auth.uid()
  );
$$;

-- Visibilité d'un dossier selon le rôle courant -----------------------
create or replace function peut_voir_dossier(d_id uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select case
    when role_courant() = 'comptable' then true                -- lecture finance liée
    when role_courant() = 'stagiaire' then stagiaire_voit_dossier(d_id)
    else a_acces_dossiers()
  end;
$$;

-- =====================================================================
-- Activation RLS
-- =====================================================================
alter table cabinet_config enable row level security;
alter table profiles enable row level security;
alter table stagiaires enable row level security;
alter table presences_stagiaires enable row level security;
alter table clients enable row level security;
alter table dossiers enable row level security;
alter table dossier_equipe enable row level security;
alter table dossier_stagiaires enable row level security;
alter table parties enable row level security;
alter table actes_procedure enable row level security;
alter table evenements enable row level security;
alter table factures enable row level security;
alter table paiements enable row level security;
alter table saisies_temps enable row level security;
alter table depenses enable row level security;
alter table documents enable row level security;
alter table modeles_documents enable row level security;
alter table notifications enable row level security;
alter table courriers enable row level security;

-- =====================================================================
-- CABINET_CONFIG : lecture pour tous (white-label), écriture admin
-- =====================================================================
create policy cabinet_select on cabinet_config for select to authenticated using (true);
create policy cabinet_write on cabinet_config for all to authenticated
  using (role_courant() = 'admin_systeme')
  with check (role_courant() = 'admin_systeme');

-- =====================================================================
-- PROFILES : lecture par tous les authentifiés ; chacun modifie le sien ;
-- admin gère tout
-- =====================================================================
create policy profiles_select on profiles for select to authenticated using (true);
create policy profiles_self_update on profiles for update to authenticated
  using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy profiles_admin_all on profiles for all to authenticated
  using (a_acces_total()) with check (a_acces_total());

-- =====================================================================
-- STAGIAIRES & PRÉSENCES
-- =====================================================================
create policy stagiaires_select on stagiaires for select to authenticated
  using (role_courant() in (
    'admin_systeme','associe_principal','associe','collaborateur','secretaire'
  ));
create policy stagiaires_write on stagiaires for all to authenticated
  using (role_courant() in ('admin_systeme','associe_principal','secretaire'))
  with check (role_courant() in ('admin_systeme','associe_principal','secretaire'));

create policy presences_select on presences_stagiaires for select to authenticated
  using (role_courant() in (
    'admin_systeme','associe_principal','associe','collaborateur','secretaire'
  ));
create policy presences_write on presences_stagiaires for all to authenticated
  using (role_courant() in ('admin_systeme','associe_principal','secretaire','collaborateur'))
  with check (role_courant() in ('admin_systeme','associe_principal','secretaire','collaborateur'));

-- =====================================================================
-- CLIENTS : dossiers + finance lecture
-- =====================================================================
create policy clients_select on clients for select to authenticated
  using (a_acces_dossiers() or a_acces_finance() or role_courant() = 'stagiaire');
create policy clients_write on clients for all to authenticated
  using (a_acces_dossiers()) with check (a_acces_dossiers());

-- =====================================================================
-- DOSSIERS
-- =====================================================================
create policy dossiers_select on dossiers for select to authenticated
  using (peut_voir_dossier(id));
create policy dossiers_write on dossiers for all to authenticated
  using (a_acces_dossiers()) with check (a_acces_dossiers());

create policy equipe_select on dossier_equipe for select to authenticated
  using (peut_voir_dossier(dossier_id));
create policy equipe_write on dossier_equipe for all to authenticated
  using (a_acces_dossiers()) with check (a_acces_dossiers());

create policy dstagiaires_select on dossier_stagiaires for select to authenticated
  using (a_acces_dossiers() or role_courant() = 'stagiaire');
create policy dstagiaires_write on dossier_stagiaires for all to authenticated
  using (a_acces_dossiers()) with check (a_acces_dossiers());

create policy parties_select on parties for select to authenticated
  using (peut_voir_dossier(dossier_id));
create policy parties_write on parties for all to authenticated
  using (a_acces_dossiers()) with check (a_acces_dossiers());

create policy actes_select on actes_procedure for select to authenticated
  using (peut_voir_dossier(dossier_id));
create policy actes_write on actes_procedure for all to authenticated
  using (a_acces_dossiers()) with check (a_acces_dossiers());

-- =====================================================================
-- ÉVÉNEMENTS (agenda) : tous sauf comptable
-- =====================================================================
create policy evenements_select on evenements for select to authenticated
  using (a_acces_agenda());
create policy evenements_write on evenements for all to authenticated
  using (a_acces_agenda()) with check (a_acces_agenda());

-- =====================================================================
-- FINANCE : factures / paiements / saisies / depenses
-- secretaire = aucun ; stagiaire = lecture seule ; comptable = complet
-- =====================================================================
create policy factures_select on factures for select to authenticated
  using (peut_voir_finance());
create policy factures_write on factures for all to authenticated
  using (a_acces_finance()) with check (a_acces_finance());

create policy paiements_select on paiements for select to authenticated
  using (peut_voir_finance());
create policy paiements_write on paiements for all to authenticated
  using (a_acces_finance()) with check (a_acces_finance());

-- Saisies de temps : la finance gère tout ; collaborateur/stagiaire gèrent les leurs
create policy saisies_select on saisies_temps for select to authenticated
  using (
    a_acces_finance()
    or profile_id = profile_id_courant()
  );
create policy saisies_insert on saisies_temps for insert to authenticated
  with check (
    a_acces_finance()
    or (role_courant() in ('collaborateur','stagiaire') and profile_id = profile_id_courant())
  );
create policy saisies_update on saisies_temps for update to authenticated
  using (a_acces_finance() or profile_id = profile_id_courant())
  with check (a_acces_finance() or profile_id = profile_id_courant());
create policy saisies_delete on saisies_temps for delete to authenticated
  using (a_acces_finance() or profile_id = profile_id_courant());

create policy depenses_select on depenses for select to authenticated
  using (peut_voir_finance());
create policy depenses_write on depenses for all to authenticated
  using (a_acces_finance()) with check (a_acces_finance());

-- =====================================================================
-- DOCUMENTS & MODÈLES
-- =====================================================================
create policy documents_select on documents for select to authenticated
  using (dossier_id is null or peut_voir_dossier(dossier_id));
create policy documents_write on documents for all to authenticated
  using (role_courant() <> 'comptable') with check (role_courant() <> 'comptable');

create policy modeles_select on modeles_documents for select to authenticated using (true);
create policy modeles_write on modeles_documents for all to authenticated
  using (role_courant() not in ('comptable','stagiaire'))
  with check (role_courant() not in ('comptable','stagiaire'));

-- =====================================================================
-- NOTIFICATIONS : chacun les siennes
-- =====================================================================
create policy notifications_select on notifications for select to authenticated
  using (user_id = auth.uid());
create policy notifications_update on notifications for update to authenticated
  using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy notifications_insert on notifications for insert to authenticated
  with check (true);
create policy notifications_delete on notifications for delete to authenticated
  using (user_id = auth.uid());

-- =====================================================================
-- COURRIERS
-- =====================================================================
create policy courriers_select on courriers for select to authenticated
  using (role_courant() <> 'comptable');
create policy courriers_write on courriers for all to authenticated
  using (role_courant() in (
    'admin_systeme','associe_principal','associe','collaborateur','secretaire'
  ))
  with check (role_courant() in (
    'admin_systeme','associe_principal','associe','collaborateur','secretaire'
  ));
