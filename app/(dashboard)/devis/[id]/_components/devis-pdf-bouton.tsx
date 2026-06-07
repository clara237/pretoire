"use client";

import { FileDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useCabinet } from "@/components/providers/cabinet-provider";
import { genererDevis, type DonneesDevisPdf } from "@/lib/pdf/devis";

export function DevisPdfBouton({ donnees }: { donnees: DonneesDevisPdf }) {
  const cabinet = useCabinet();

  return (
    <Button
      variante="contour"
      iconeGauche={<FileDown className="h-4 w-4" />}
      onClick={() => genererDevis(cabinet, donnees)}
    >
      Télécharger le PDF
    </Button>
  );
}
