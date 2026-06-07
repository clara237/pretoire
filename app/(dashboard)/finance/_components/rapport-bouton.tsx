"use client";

import { FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useCabinet } from "@/components/providers/cabinet-provider";
import type { DonneesRapportActivite } from "@/lib/pdf/rapport-activite";

export function RapportBouton({
  donnees,
}: {
  donnees: Omit<DonneesRapportActivite, "devise">;
}) {
  const cabinet = useCabinet();

  async function telecharger() {
    const { genererRapportActivite } = await import("@/lib/pdf/rapport-activite");
    genererRapportActivite(cabinet, {
      ...donnees,
      devise: cabinet.devise || "FCFA",
    });
  }

  return (
    <Button
      variante="contour"
      iconeGauche={<FileText className="h-4 w-4" />}
      onClick={telecharger}
    >
      Rapport d&apos;activité (PDF)
    </Button>
  );
}
