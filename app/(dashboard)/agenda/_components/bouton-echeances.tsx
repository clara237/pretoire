"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { BellRing } from "lucide-react";
import { Button } from "@/components/ui/button";
import { verifierEcheances } from "@/lib/actions/agenda";

export function BoutonEcheances() {
  const router = useRouter();
  const [enCours, setEnCours] = React.useState(false);

  async function onClick() {
    setEnCours(true);
    const res = await verifierEcheances();
    setEnCours(false);
    if (!res.ok) {
      toast.error(res.message ?? "Vérification impossible.");
      return;
    }
    if (res.rappels === 0) {
      toast.success("Aucune nouvelle échéance à signaler.");
    } else {
      toast.success(
        `${res.rappels} rappel${res.rappels > 1 ? "s" : ""} d'échéance envoyé${
          res.rappels > 1 ? "s" : ""
        }.`,
      );
    }
    router.refresh();
  }

  return (
    <Button
      variante="contour"
      taille="sm"
      onClick={onClick}
      enChargement={enCours}
      iconeGauche={<BellRing className="h-4 w-4" />}
    >
      Vérifier les échéances
    </Button>
  );
}
