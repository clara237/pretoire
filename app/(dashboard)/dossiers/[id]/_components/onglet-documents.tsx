"use client";

import * as React from "react";
import { FileText } from "lucide-react";
import { EmptyState } from "@/components/ui/empty-state";
import { formatDate } from "@/lib/utils";
import { UploadDocument } from "@/app/(dashboard)/documents/_components/upload-document";
import {
  BoutonTelecharger,
  BoutonSupprimerDocument,
} from "@/app/(dashboard)/documents/_components/document-actions";

export interface DocumentDossier {
  id: string;
  nom: string;
  type: string | null;
  fichier_url: string;
  taille_ko: number | null;
  created_at: string;
  uploader: { nom: string; prenom: string } | null;
}

function tailleLisible(ko: number | null): string {
  if (!ko) return "—";
  if (ko < 1024) return `${ko} Ko`;
  return `${(ko / 1024).toFixed(1)} Mo`;
}

export function OngletDocuments({
  dossierId,
  documents,
  peutEditer,
  peutSupprimer,
}: {
  dossierId: string;
  documents: DocumentDossier[];
  peutEditer: boolean;
  peutSupprimer: boolean;
}) {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-base font-semibold text-foreground">
          Pièces du dossier
        </h2>
        {peutEditer && (
          <UploadDocument dossierFige={dossierId} taille="sm" libelle="Téléverser" />
        )}
      </div>

      {documents.length === 0 ? (
        <EmptyState
          titre="Aucune pièce"
          description="Téléversez les pièces du dossier (PDF, images, etc.)."
          icone={FileText}
        />
      ) : (
        <ul className="divide-y divide-border rounded-lg border border-border">
          {documents.map((d) => (
            <li
              key={d.id}
              className="flex items-center gap-3 p-3 hover:bg-muted/30"
            >
              <div className="rounded-DEFAULT bg-muted p-2 text-muted-foreground">
                <FileText className="h-4 w-4" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-foreground">
                  {d.nom}
                </p>
                <p className="truncate text-xs text-muted-foreground">
                  {tailleLisible(d.taille_ko)} · {formatDate(d.created_at)}
                  {d.uploader && ` · ${d.uploader.prenom} ${d.uploader.nom}`}
                </p>
              </div>
              <BoutonTelecharger chemin={d.fichier_url} />
              {peutSupprimer && (
                <BoutonSupprimerDocument
                  id={d.id}
                  chemin={d.fichier_url}
                  dossierId={dossierId}
                  nom={d.nom}
                />
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
