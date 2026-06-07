-- =====================================================================
-- PRÉTOIRE — Facturation détaillée
-- Lignes de facture libres (frais d'ouverture, déplacements, honoraires,
-- débours : timbres / certifications / certificats…), frais d'ouverture
-- configurable (white-label) et paiement en nature (matériel).
-- =====================================================================

-- 1. Mode de paiement « en nature » (terrain, maison, voiture… valorisé)
alter type mode_paiement add value if not exists 'nature';

-- 2. Frais d'ouverture de dossier — montant par défaut configurable
alter table cabinet_config
  add column if not exists frais_ouverture_dossier numeric(15,2) not null default 50000;

-- 3. Lignes de facture (mode « détaillé »)
create table if not exists lignes_facture (
  id uuid primary key default gen_random_uuid(),
  facture_id uuid not null references factures(id) on delete cascade,
  libelle text not null,
  categorie text not null default 'honoraires',
  quantite numeric(12,2) not null default 1,
  montant_unitaire numeric(15,2) not null default 0,
  montant numeric(15,2) not null default 0,
  ordre int not null default 0,
  created_at timestamptz default now()
);
create index if not exists idx_lignes_facture on lignes_facture(facture_id);

alter table lignes_facture enable row level security;

drop policy if exists lignes_facture_select on lignes_facture;
create policy lignes_facture_select on lignes_facture for select to authenticated
  using (peut_voir_finance());

drop policy if exists lignes_facture_write on lignes_facture;
create policy lignes_facture_write on lignes_facture for all to authenticated
  using (a_acces_finance()) with check (a_acces_finance());
