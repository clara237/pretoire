-- =====================================================================
-- PRÉTOIRE — Durcissement sécurité (audit avant open-source)
-- =====================================================================

-- ---------------------------------------------------------------------
-- 1. CRITIQUE — Empêcher l'auto-élévation de privilège.
--    La policy `profiles_self_update` laisse chaque utilisateur modifier
--    SA ligne (nom, prénom, photo, téléphone…), MAIS sans garde de
--    colonne il pouvait aussi changer `role`/`actif`/`taux_horaire` via
--    un PATCH REST direct (clé anon + JWT publics). Ce trigger rejette
--    toute modification de ces colonnes sensibles par un non-admin.
-- ---------------------------------------------------------------------
create or replace function profiles_garde_champs_sensibles()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  -- Les admins (admin_systeme / associe_principal) gèrent tout via leurs
  -- propres actions ; on ne contraint que les autres rôles.
  if a_acces_total() then
    return new;
  end if;
  if new.role is distinct from old.role then
    raise exception 'Modification du rôle non autorisée.';
  end if;
  if new.actif is distinct from old.actif then
    raise exception 'Modification du statut actif non autorisée.';
  end if;
  if new.taux_horaire is distinct from old.taux_horaire then
    raise exception 'Modification du taux horaire non autorisée.';
  end if;
  return new;
end;
$$;

drop trigger if exists trg_profiles_garde on profiles;
create trigger trg_profiles_garde
  before update on profiles
  for each row execute function profiles_garde_champs_sensibles();

-- ---------------------------------------------------------------------
-- 2. ÉLEVÉE — Anti-spoofing des notifications.
--    `with check (true)` permettait à tout authentifié d'insérer une
--    notification dans la boîte de n'importe qui (phishing interne).
--    On restreint l'insert authentifié à sa propre boîte ; les rappels
--    système (relances, échéances) passent désormais par le service_role
--    (lib/rappels-* et relancerFacture), qui contourne la RLS.
-- ---------------------------------------------------------------------
drop policy if exists notifications_insert on notifications;
create policy notifications_insert on notifications for insert to authenticated
  with check (user_id = auth.uid());
