"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Trash2, FileCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/select";
import { ConfirmDialog } from "@/components/ui/modal";
import {
  modifierStatutDevis,
  supprimerDevis,
  convertirDevisEnFacture,
} from "@/lib/actions/devis";
import {
  STATUTS_DEVIS,
  LIBELLE_STATUT_DEVIS,
} from "@/lib/finance-constants";

export function DevisStatutSelect({
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
    const res = await modifierStatutDevis(id, nouveau);
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
      options={STATUTS_DEVIS.map((s) => ({
        value: s,
        label: LIBELLE_STATUT_DEVIS[s],
      }))}
    />
  );
}

export function DevisConvertir({
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
    const res = await convertirDevisEnFacture(id);
    setChargement(false);
    if (!res.ok) {
      toast.error(res.message ?? "Conversion impossible.");
      setOuvert(false);
      return;
    }
    toast.success(res.message ?? "Facture créée à partir du devis.");
    setOuvert(false);
    router.push(res.id ? `/facturation/${res.id}` : "/facturation");
    router.refresh();
  }

  return (
    <>
      <Button
        iconeGauche={<FileCheck className="h-4 w-4" />}
        onClick={() => setOuvert(true)}
      >
        Convertir en facture
      </Button>
      <ConfirmDialog
        ouvert={ouvert}
        onClose={() => setOuvert(false)}
        onConfirm={confirmer}
        enChargement={chargement}
        titre="Convertir le devis en facture"
        message={`Créer une facture (brouillon) à partir du devis ${numero} ? Le devis passera au statut « accepté ».`}
      />
    </>
  );
}

export function DevisSupprimer({
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
    const res = await supprimerDevis(id);
    setChargement(false);
    if (!res.ok) {
      toast.error(res.message ?? "Suppression impossible.");
      setOuvert(false);
      return;
    }
    toast.success("Devis supprimé.");
    setOuvert(false);
    router.push("/devis");
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
        titre="Supprimer le devis"
        message={`Supprimer définitivement le devis ${numero} ?`}
      />
    </>
  );
}
