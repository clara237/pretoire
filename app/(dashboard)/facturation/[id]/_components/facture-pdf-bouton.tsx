"use client";

import { FileDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useCabinet } from "@/components/providers/cabinet-provider";
import type { DonneesFacturePdf } from "@/lib/pdf/facture";

export function FacturePdfBouton({ donnees }: { donnees: DonneesFacturePdf }) {
  const cabinet = useCabinet();

  // jsPDF (~150 Ko) chargé à la demande au clic, hors du bundle initial.
  async function telecharger() {
    const { genererFacture } = await import("@/lib/pdf/facture");
    genererFacture(cabinet, donnees);
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
