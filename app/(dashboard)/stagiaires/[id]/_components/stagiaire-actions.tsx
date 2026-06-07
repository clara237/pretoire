"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { FileDown, Pencil, Power } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Modal, ConfirmDialog } from "@/components/ui/modal";
import { useCabinet } from "@/components/providers/cabinet-provider";
import {
  StagiaireForm,
  type OptionMaitre,
  type ValeursStagiaire,
} from "../../_components/stagiaire-form";
import { basculerActifStagiaire } from "@/lib/actions/stagiaires";
import {
  genererAttestationStage,
  type DonneesAttestation,
} from "@/lib/pdf/attestation-stage";

export function StagiaireActions({
  valeurs,
  maitres,
  actif,
  attestation,
  peutEditer,
}: {
  valeurs: ValeursStagiaire;
  maitres: OptionMaitre[];
  actif: boolean;
  attestation: DonneesAttestation;
  peutEditer: boolean;
}) {
  const router = useRouter();
  const cabinet = useCabinet();
  const [editOuvert, setEditOuvert] = React.useState(false);
  const [bascule, setBascule] = React.useState(false);

  function telechargerAttestation() {
    try {
      genererAttestationStage(cabinet, attestation);
    } catch {
      toast.error("Impossible de générer l'attestation.");
    }
  }

  async function confirmerBascule() {
    const res = await basculerActifStagiaire(valeurs.id!, !actif);
    setBascule(false);
    if (res.ok) {
      toast.success(actif ? "Stage marqué comme terminé." : "Stage réactivé.");
      router.refresh();
    } else {
      toast.error(res.message ?? "Opération impossible.");
    }
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      <Button
        variante="contour"
        iconeGauche={<FileDown className="h-4 w-4" />}
        onClick={telechargerAttestation}
      >
        Attestation PDF
      </Button>

      {peutEditer && (
        <>
          <Button
            variante="contour"
            iconeGauche={<Pencil className="h-4 w-4" />}
            onClick={() => setEditOuvert(true)}
          >
            Modifier
          </Button>
          <Button
            variante="contour"
            iconeGauche={<Power className="h-4 w-4" />}
            onClick={() => setBascule(true)}
          >
            {actif ? "Terminer le stage" : "Réactiver"}
          </Button>
        </>
      )}

      <Modal
        ouvert={editOuvert}
        onClose={() => setEditOuvert(false)}
        titre="Modifier le stagiaire"
        taille="lg"
      >
        <StagiaireForm
          maitres={maitres}
          valeurs={valeurs}
          apresSucces={() => {
            setEditOuvert(false);
            router.refresh();
          }}
        />
      </Modal>

      <ConfirmDialog
        ouvert={bascule}
        onClose={() => setBascule(false)}
        onConfirm={confirmerBascule}
        titre={actif ? "Terminer le stage" : "Réactiver le stage"}
        message={
          actif
            ? "Le stagiaire sera marqué comme terminé (archivé)."
            : "Le stagiaire redeviendra actif."
        }
        destructif={false}
        texteConfirmer={actif ? "Terminer" : "Réactiver"}
      />
    </div>
  );
}
