"use client";

import * as React from "react";
import { Plus } from "lucide-react";
import { Modal } from "@/components/ui/modal";
import { Button } from "@/components/ui/button";
import {
  StagiaireForm,
  type OptionMaitre,
} from "./stagiaire-form";

export function BoutonNouveauStagiaire({
  maitres,
}: {
  maitres: OptionMaitre[];
}) {
  const [ouvert, setOuvert] = React.useState(false);

  return (
    <>
      <Button
        iconeGauche={<Plus className="h-4 w-4" />}
        onClick={() => setOuvert(true)}
      >
        Nouveau stagiaire
      </Button>
      <Modal
        ouvert={ouvert}
        onClose={() => setOuvert(false)}
        titre="Nouveau stagiaire"
        taille="lg"
      >
        <StagiaireForm maitres={maitres} apresSucces={() => setOuvert(false)} />
      </Modal>
    </>
  );
}
