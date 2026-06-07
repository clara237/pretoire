"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { BellRing } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/modal";
import { relancerFacture } from "@/lib/actions/factures";

export function RelanceBouton({
  factureId,
  palier,
  numero,
  taille = "sm",
  variante = "contour",
}: {
  factureId: string;
  palier: number;
  numero: string;
  taille?: "sm" | "md" | "icone";
  variante?: "contour" | "fantome" | "principal";
}) {
  const router = useRouter();
  const [ouvert, setOuvert] = React.useState(false);
  const [chargement, setChargement] = React.useState(false);

  async function confirmer() {
    setChargement(true);
    const res = await relancerFacture(factureId, palier);
    setChargement(false);
    if (!res.ok) {
      toast.error(res.message ?? "Relance impossible.");
      setOuvert(false);
      return;
    }
    toast.success(res.message ?? "Relance enregistrée.");
    setOuvert(false);
    router.refresh();
  }

  return (
    <>
      {taille === "icone" ? (
        <Button
          variante={variante}
          taille="icone"
          aria-label="Relancer"
          title={`Relancer (J+${palier})`}
          onClick={() => setOuvert(true)}
        >
          <BellRing className="h-4 w-4" />
        </Button>
      ) : (
        <Button
          variante={variante}
          taille={taille}
          iconeGauche={<BellRing className="h-4 w-4" />}
          onClick={() => setOuvert(true)}
        >
          Relancer
        </Button>
      )}
      <ConfirmDialog
        ouvert={ouvert}
        onClose={() => setOuvert(false)}
        onConfirm={confirmer}
        enChargement={chargement}
        destructif={false}
        titre={`Relancer la facture ${numero}`}
        message={`Une notification de relance (J+${palier}) sera enregistrée${
          palier >= 90 ? " et la facture passera en contentieux" : ""
        }. Continuer ?`}
        texteConfirmer="Relancer"
      />
    </>
  );
}
