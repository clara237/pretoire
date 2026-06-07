import Link from "next/link";
import { FileText } from "lucide-react";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import { createClient } from "@/lib/supabase/server";
import { formatDate } from "@/lib/utils";
import {
  BoutonTelecharger,
  BoutonSupprimerDocument,
} from "./document-actions";

interface LigneDocument {
  id: string;
  nom: string;
  type: string | null;
  fichier_url: string;
  taille_ko: number | null;
  created_at: string;
  dossier_id: string | null;
  dossiers: { id: string; numero: string; titre: string } | null;
  uploader: { nom: string; prenom: string } | null;
}

function tailleLisible(ko: number | null): string {
  if (!ko) return "—";
  if (ko < 1024) return `${ko} Ko`;
  return `${(ko / 1024).toFixed(1)} Mo`;
}

export async function DocumentsTable({
  filtres,
  peutSupprimer,
}: {
  filtres: { recherche?: string; dossier?: string; type?: string };
  peutSupprimer: boolean;
}) {
  const supabase = createClient();
  let req = supabase
    .from("documents")
    .select(
      "id, nom, type, fichier_url, taille_ko, created_at, dossier_id, " +
        "dossiers(id, numero, titre), uploader:profiles(nom, prenom)",
    )
    .order("created_at", { ascending: false });

  if (filtres.dossier === "general") {
    req = req.is("dossier_id", null);
  } else if (filtres.dossier && filtres.dossier !== "tous") {
    req = req.eq("dossier_id", filtres.dossier);
  }
  if (filtres.type && filtres.type !== "tous") {
    req = req.eq("type", filtres.type);
  }
  const terme = filtres.recherche?.trim();
  if (terme) {
    req = req.ilike("nom", `%${terme.replace(/[%,]/g, " ")}%`);
  }

  const { data } = await req;
  const documents = (data ?? []) as unknown as LigneDocument[];

  if (documents.length === 0) {
    const filtre = Boolean(
      filtres.recherche ||
        (filtres.dossier && filtres.dossier !== "tous") ||
        (filtres.type && filtres.type !== "tous"),
    );
    return (
      <EmptyState
        titre={filtre ? "Aucun document trouvé" : "Aucun document"}
        description={
          filtre
            ? "Aucun document ne correspond à vos critères."
            : "Téléversez votre premier document depuis cette page ou un dossier."
        }
        icone={FileText}
      />
    );
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Document</TableHead>
          <TableHead className="hidden md:table-cell">Dossier</TableHead>
          <TableHead className="hidden lg:table-cell">Type</TableHead>
          <TableHead className="hidden lg:table-cell">Taille</TableHead>
          <TableHead className="hidden sm:table-cell">Ajouté le</TableHead>
          <TableHead className="text-right">Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {documents.map((d) => (
          <TableRow key={d.id}>
            <TableCell>
              <div className="flex items-center gap-2.5">
                <div className="rounded-DEFAULT bg-muted p-1.5 text-muted-foreground">
                  <FileText className="h-4 w-4" />
                </div>
                <span className="font-medium text-foreground">{d.nom}</span>
              </div>
            </TableCell>
            <TableCell className="hidden md:table-cell">
              {d.dossiers ? (
                <Link
                  href={`/dossiers/${d.dossiers.id}`}
                  className="text-sm text-principale hover:underline"
                >
                  {d.dossiers.numero}
                </Link>
              ) : (
                <Badge ton="neutre">Général</Badge>
              )}
            </TableCell>
            <TableCell className="hidden lg:table-cell text-sm text-muted-foreground">
              {d.type || "—"}
            </TableCell>
            <TableCell className="hidden lg:table-cell text-sm text-muted-foreground">
              {tailleLisible(d.taille_ko)}
            </TableCell>
            <TableCell className="hidden sm:table-cell text-sm text-muted-foreground">
              {formatDate(d.created_at)}
            </TableCell>
            <TableCell className="text-right">
              <div className="flex items-center justify-end">
                <BoutonTelecharger chemin={d.fichier_url} />
                {peutSupprimer && (
                  <BoutonSupprimerDocument
                    id={d.id}
                    chemin={d.fichier_url}
                    dossierId={d.dossier_id}
                    nom={d.nom}
                  />
                )}
              </div>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
