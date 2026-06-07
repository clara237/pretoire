import {
  FileSignature,
  FileText,
  Receipt,
  CalendarClock,
  History,
} from "lucide-react";
import { EmptyState } from "@/components/ui/empty-state";
import { formatDate } from "@/lib/utils";

export type CategorieEvenement = "acte" | "document" | "facture" | "agenda";

export interface EvenementTimeline {
  categorie: CategorieEvenement;
  date: string;
  titre: string;
  detail?: string | null;
}

const META: Record<
  CategorieEvenement,
  { libelle: string; icone: React.ComponentType<{ className?: string }>; classe: string }
> = {
  acte: { libelle: "Acte", icone: FileSignature, classe: "bg-principale/10 text-principale" },
  document: { libelle: "Document", icone: FileText, classe: "bg-blue-500/10 text-blue-600 dark:text-blue-400" },
  facture: { libelle: "Facture", icone: Receipt, classe: "bg-success/10 text-success" },
  agenda: { libelle: "Agenda", icone: CalendarClock, classe: "bg-warning/10 text-warning" },
};

export function Timeline({ evenements }: { evenements: EvenementTimeline[] }) {
  if (evenements.length === 0) {
    return (
      <EmptyState
        titre="Aucun événement"
        description="L'historique du dossier (actes, documents, factures, agenda) apparaîtra ici."
        icone={History}
      />
    );
  }

  return (
    <ol className="relative space-y-5 border-l border-border pl-6">
      {evenements.map((e, i) => {
        const meta = META[e.categorie];
        const Icone = meta.icone;
        return (
          <li key={i} className="relative">
            <span
              className={`absolute -left-[1.95rem] flex h-7 w-7 items-center justify-center rounded-full border-2 border-background ${meta.classe}`}
            >
              <Icone className="h-3.5 w-3.5" />
            </span>
            <div className="flex flex-col gap-0.5">
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-sm font-medium text-foreground">
                  {e.titre}
                </span>
                <span className="text-xs text-muted-foreground">
                  · {meta.libelle}
                </span>
              </div>
              {e.detail && (
                <p className="text-xs text-muted-foreground">{e.detail}</p>
              )}
              <span className="text-xs text-muted-foreground">
                {formatDate(e.date)}
              </span>
            </div>
          </li>
        );
      })}
    </ol>
  );
}
