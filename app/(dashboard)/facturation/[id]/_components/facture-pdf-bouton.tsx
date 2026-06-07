"use client";

import { FileDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useCabinet } from "@/components/providers/cabinet-provider";
import { genererFacture, type DonneesFacturePdf } from "@/lib/pdf/facture";

export function FacturePdfBouton({ donnees }: { donnees: DonneesFacturePdf }) {
  const cabinet = useCabinet();

  return (
    <Button
      variante="contour"
      iconeGauche={<FileDown className="h-4 w-4" />}
      onClick={() => genererFacture(cabinet, donnees)}
    >
      Télécharger le PDF
    </Button>
  );
}
