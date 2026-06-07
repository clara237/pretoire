-- =====================================================================
-- PRÉTOIRE — Module DEVIS (proforma)
-- Cycle : brouillon → envoyé → accepté/refusé/expiré ; conversion → facture
-- =====================================================================

create type statut_devis as enum (
  'brouillon',
  'envoye',
  'accepte',
  'refuse',
  'expire'
);

create table devis (
  id uuid primary key default gen_random_uuid(),
  numero text not null unique,
  client_id uuid references clients(id) on delete set null,
  dossier_id uuid references dossiers(id) on delete set null,
  objet text,
  date_emission date not null default current_date,
  date_validite date,
  montant_ht numeric(15,2) not null default 0,
  tva numeric(15,2) not null default 0,
  montant_ttc numeric(15,2) not null default 0,
  devise text not null default 'FCFA',
  statut statut_devis not null default 'brouillon',
  notes text,
  -- Facture issue de la conversion (un devis accepté → une facture)
  facture_id uuid references factures(id) on delete set null,
  created_by uuid references profiles(id) on delete set null,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);
create index idx_devis_client on devis(client_id);
create index idx_devis_dossier on devis(dossier_id);
create index idx_devis_statut on devis(statut);
create trigger trg_devis_updated before update on devis
  for each row execute function set_updated_at();

-- Numéro auto DEV-AAAA-NNN si non fourni
create or replace function devis_numero_auto()
returns trigger language plpgsql as $$
begin
  if new.numero is null or new.numero = '' then
    new.numero := prochain_numero('dev', extract(year from coalesce(new.date_emission, current_date))::int);
  end if;
  return new;
end;
$$;
create trigger trg_devis_numero before insert on devis
  for each row execute function devis_numero_auto();

-- RLS : mêmes règles que les factures (finance)
alter table devis enable row level security;
create policy devis_select on devis for select to authenticated
  using (peut_voir_finance());
create policy devis_write on devis for all to authenticated
  using (a_acces_finance()) with check (a_acces_finance());
