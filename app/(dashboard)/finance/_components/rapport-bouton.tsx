"use client";

import { FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useCabinet } from "@/components/providers/cabinet-provider";
import {
  genererRapportActivite,
  type DonneesRapportActivite,
} from "@/lib/pdf/rapport-activite";

export function RapportBouton({
  donnees,
}: {
  donnees: Omit<DonneesRapportActivite, "devise">;
}) {
  const cabinet = useCabinet();

  return (
    <Button
      variante="contour"
      iconeGauche={<FileText className="h-4 w-4" />}
      onClick={() =>
        genererRapportActivite(cabinet, {
          ...donnees,
          devise: cabinet.devise || "FCFA",
        })
      }
    >
      Rapport d&apos;activité (PDF)
    </Button>
  );
}
