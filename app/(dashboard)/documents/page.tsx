import { Suspense } from "react";
import { PageHeader } from "@/components/ui/page-header";
import { SkeletonTable } from "@/components/ui/skeleton";
import { getProfilCourant } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { DocumentsFiltres } from "./_components/documents-filtres";
import { DocumentsTable } from "./_components/documents-table";
import { UploadDocument } from "./_components/upload-document";

export const dynamic = "force-dynamic";

export default async function DocumentsPage({
  searchParams,
}: {
  searchParams: { q?: string; dossier?: string; type?: string };
}) {
  const profil = await getProfilCourant();
  const peutAjouter = profil ? profil.role !== "comptable" : false;
  const peutSupprimer = ["admin_systeme", "associe_principal", "associe"].includes(
    profil?.role ?? "",
  );

  const supabase = createClient();
  const [dossiersRes, typesRes] = await Promise.all([
    supabase
      .from("dossiers")
      .select("id, numero, titre")
      .order("created_at", { ascending: false }),
    supabase.from("documents").select("type"),
  ]);

  const dossiers = (
    (dossiersRes.data ?? []) as Array<{ id: string; numero: string; titre: string }>
  ).map((d) => ({ value: d.id, label: `${d.numero} — ${d.titre}` }));

  const typesUniques = Array.from(
    new Set(
      ((typesRes.data ?? []) as Array<{ type: string | null }>)
        .map((t) => t.type)
        .filter((t): t is string => Boolean(t)),
    ),
  ).sort();

  const filtres = {
    recherche: searchParams.q,
    dossier: searchParams.dossier,
    type: searchParams.type,
  };
  const cle = `${filtres.recherche ?? ""}|${filtres.dossier ?? ""}|${filtres.type ?? ""}`;

  return (
    <div>
      <PageHeader
        titre="Documents"
        description="Toutes les pièces du cabinet, classées par dossier."
        actions={
          peutAjouter ? <UploadDocument dossiers={dossiers} /> : undefined
        }
      />

      <DocumentsFiltres dossiers={dossiers} types={typesUniques} />

      <Suspense key={cle} fallback={<SkeletonTable lignes={8} colonnes={6} />}>
        <DocumentsTable filtres={filtres} peutSupprimer={peutSupprimer} />
      </Suspense>
    </div>
  );
}
