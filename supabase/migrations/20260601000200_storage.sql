-- =====================================================================
-- PRÉTOIRE — Buckets Storage + policies
-- documents (privé), justificatifs (privé), logos (public)
--
-- TOLÉRANT : le service storage peut être temporairement désactivé
-- (image Docker storage-api indisponible). Dans ce cas le schéma
-- `storage` n'existe pas en base ; cette migration ne fait alors RIEN.
-- La phase d'intégration réactivera storage puis rejouera ce bloc.
-- =====================================================================

do $$
begin
  -- Si le schéma storage / la table buckets n'existe pas, on sort
  -- proprement : aucune erreur, la migration est considérée appliquée.
  if not exists (
    select 1 from information_schema.tables
    where table_schema = 'storage' and table_name = 'buckets'
  ) then
    raise notice 'PRÉTOIRE: schéma storage absent — buckets/policies ignorés (storage désactivé).';
    return;
  end if;

  -- -------------------------------------------------------------------
  -- BUCKETS
  -- -------------------------------------------------------------------
  insert into storage.buckets (id, name, public)
  values
    ('documents', 'documents', false),
    ('justificatifs', 'justificatifs', false),
    ('logos', 'logos', true)
  on conflict (id) do nothing;

  -- -------------------------------------------------------------------
  -- POLICIES (drop-if-exists pour idempotence)
  -- -------------------------------------------------------------------

  -- LOGOS : lecture publique (login, sidebar, PDF) ; écriture admin
  drop policy if exists "logos_lecture_publique" on storage.objects;
  create policy "logos_lecture_publique"
    on storage.objects for select
    using (bucket_id = 'logos');

  drop policy if exists "logos_ecriture_admin" on storage.objects;
  create policy "logos_ecriture_admin"
    on storage.objects for insert to authenticated
    with check (bucket_id = 'logos' and public.role_courant() = 'admin_systeme');

  drop policy if exists "logos_maj_admin" on storage.objects;
  create policy "logos_maj_admin"
    on storage.objects for update to authenticated
    using (bucket_id = 'logos' and public.role_courant() = 'admin_systeme');

  drop policy if exists "logos_suppr_admin" on storage.objects;
  create policy "logos_suppr_admin"
    on storage.objects for delete to authenticated
    using (bucket_id = 'logos' and public.role_courant() = 'admin_systeme');

  -- DOCUMENTS : authentifiés non comptable
  drop policy if exists "documents_lecture" on storage.objects;
  create policy "documents_lecture"
    on storage.objects for select to authenticated
    using (bucket_id = 'documents');

  drop policy if exists "documents_ecriture" on storage.objects;
  create policy "documents_ecriture"
    on storage.objects for insert to authenticated
    with check (bucket_id = 'documents' and public.role_courant() <> 'comptable');

  drop policy if exists "documents_maj" on storage.objects;
  create policy "documents_maj"
    on storage.objects for update to authenticated
    using (bucket_id = 'documents' and public.role_courant() <> 'comptable');

  drop policy if exists "documents_suppr" on storage.objects;
  create policy "documents_suppr"
    on storage.objects for delete to authenticated
    using (bucket_id = 'documents' and public.role_courant() in ('admin_systeme','associe_principal','associe'));

  -- JUSTIFICATIFS (dépenses) : finance uniquement
  drop policy if exists "justificatifs_lecture" on storage.objects;
  create policy "justificatifs_lecture"
    on storage.objects for select to authenticated
    using (bucket_id = 'justificatifs' and public.a_acces_finance());

  drop policy if exists "justificatifs_ecriture" on storage.objects;
  create policy "justificatifs_ecriture"
    on storage.objects for insert to authenticated
    with check (bucket_id = 'justificatifs' and public.a_acces_finance());

  drop policy if exists "justificatifs_maj" on storage.objects;
  create policy "justificatifs_maj"
    on storage.objects for update to authenticated
    using (bucket_id = 'justificatifs' and public.a_acces_finance());

  drop policy if exists "justificatifs_suppr" on storage.objects;
  create policy "justificatifs_suppr"
    on storage.objects for delete to authenticated
    using (bucket_id = 'justificatifs' and public.a_acces_finance());

  raise notice 'PRÉTOIRE: buckets et policies storage appliqués.';
end
$$;
