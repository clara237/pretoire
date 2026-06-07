"use client";

import { FileDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useCabinet } from "@/components/providers/cabinet-provider";
import type { DonneesDevisPdf } from "@/lib/pdf/devis";

export function DevisPdfBouton({ donnees }: { donnees: DonneesDevisPdf }) {
  const cabinet = useCabinet();

  async function telecharger() {
    const { genererDevis } = await import("@/lib/pdf/devis");
    genererDevis(cabinet, donnees);
  }

  return (
    <Button
      variante="contour"
      iconeGauche={<FileDown className="h-4 w-4" />}
      onClick={telecharger}
    >
      Télécharger le PDF
    </Button>
  );
}
