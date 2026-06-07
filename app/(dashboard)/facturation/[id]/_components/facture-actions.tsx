"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/select";
import { ConfirmDialog } from "@/components/ui/modal";
import {
  changerStatutFacture,
  supprimerFacture,
} from "@/lib/actions/factures";
import {
  STATUTS_FACTURE,
  LIBELLE_STATUT_FACTURE,
} from "@/lib/finance-constants";

export function FactureStatutSelect({
  id,
  statut,
}: {
  id: string;
  statut: string;
}) {
  const router = useRouter();
  const [valeur, setValeur] = React.useState(statut);
  const [chargement, setChargement] = React.useState(false);

  async function changer(nouveau: string) {
    setValeur(nouveau);
    setChargement(true);
    const res = await changerStatutFacture(id, nouveau);
    setChargement(false);
    if (!res.ok) {
      toast.error(res.message ?? "Changement impossible.");
      setValeur(statut);
      return;
    }
    toast.success("Statut mis à jour.");
    router.refresh();
  }

  return (
    <Select
      value={valeur}
      disabled={chargement}
      onChange={(e) => changer(e.target.value)}
      className="w-44"
      options={STATUTS_FACTURE.map((s) => ({
        value: s,
        label: LIBELLE_STATUT_FACTURE[s],
      }))}
    />
  );
}

export function FactureSupprimer({
  id,
  numero,
}: {
  id: string;
  numero: string;
}) {
  const router = useRouter();
  const [ouvert, setOuvert] = React.useState(false);
  const [chargement, setChargement] = React.useState(false);

  async function confirmer() {
    setChargement(true);
    const res = await supprimerFacture(id);
    setChargement(false);
    if (!res.ok) {
      toast.error(res.message ?? "Suppression impossible.");
      setOuvert(false);
      return;
    }
    toast.success("Facture supprimée.");
    setOuvert(false);
    router.push("/facturation");
    router.refresh();
  }

  return (
    <>
      <Button
        variante="contour"
        iconeGauche={<Trash2 className="h-4 w-4" />}
        onClick={() => setOuvert(true)}
      >
        Supprimer
      </Button>
      <ConfirmDialog
        ouvert={ouvert}
        onClose={() => setOuvert(false)}
        onConfirm={confirmer}
        enChargement={chargement}
        titre="Supprimer la facture"
        message={`Supprimer définitivement la facture ${numero} ? Les paiements seront supprimés et les heures rattachées redeviendront facturables.`}
      />
    </>
  );
}
