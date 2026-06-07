"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { FileDown, Pencil, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Modal, ConfirmDialog } from "@/components/ui/modal";
import { Select } from "@/components/ui/select";
import { useCabinet } from "@/components/providers/cabinet-provider";
import {
  STATUTS_DOSSIER,
  LIBELLE_STATUT,
} from "@/lib/queries/dossiers-labels";
import {
  changerStatutDossier,
  supprimerDossier,
  type DonneesDossier,
} from "@/lib/actions/dossiers";
import type { DonneesFicheDossier } from "@/lib/pdf/fiche-dossier";
import {
  DossierEditForm,
  type OptionSimple,
} from "./dossier-edit-form";

export function DossierActions({
  dossierId,
  numero,
  statut,
  fiche,
  formInitial,
  clients,
  avocats,
  peutEditer,
  peutSupprimer,
}: {
  dossierId: string;
  numero: string;
  statut: string;
  fiche: DonneesFicheDossier;
  formInitial: DonneesDossier;
  clients: OptionSimple[];
  avocats: OptionSimple[];
  peutEditer: boolean;
  peutSupprimer: boolean;
}) {
  const router = useRouter();
  const cabinet = useCabinet();
  const [editOuvert, setEditOuvert] = React.useState(false);
  const [supprOuvert, setSupprOuvert] = React.useState(false);
  const [suppression, setSuppression] = React.useState(false);
  const [statutCourant, setStatutCourant] = React.useState(statut);
  const [majStatut, setMajStatut] = React.useState(false);

  async function changerStatut(nouveau: string) {
    if (nouveau === statutCourant) return;
    setMajStatut(true);
    const res = await changerStatutDossier(dossierId, nouveau);
    setMajStatut(false);
    if (!res.ok) {
      toast.error(res.message ?? "Changement impossible.");
      return;
    }
    setStatutCourant(nouveau);
    toast.success(`Statut : ${LIBELLE_STATUT[nouveau] ?? nouveau}.`);
    router.refresh();
  }

  async function exporterPdf() {
    try {
      const { genererFicheDossier } = await import("@/lib/pdf/fiche-dossier");
      genererFicheDossier(cabinet, fiche);
      toast.success("Fiche PDF générée.");
    } catch {
      toast.error("Impossible de générer le PDF.");
    }
  }

  async function confirmerSuppression() {
    setSuppression(true);
    const res = await supprimerDossier(dossierId);
    setSuppression(false);
    if (!res.ok) {
      toast.error(res.message ?? "Suppression impossible.");
      setSupprOuvert(false);
      return;
    }
    toast.success("Dossier supprimé.");
    router.push("/dossiers");
    router.refresh();
  }

  return (
    <>
      <div className="flex flex-wrap items-center gap-2">
        {peutEditer && (
          <div className="relative">
            <Select
              value={statutCourant}
              disabled={majStatut}
              onChange={(e) => changerStatut(e.target.value)}
              className="h-9 w-40 text-sm"
              options={STATUTS_DOSSIER.map((s) => ({
                value: s,
                label: LIBELLE_STATUT[s],
              }))}
            />
          </div>
        )}
        <Button
          variante="contour"
          iconeGauche={<FileDown className="h-4 w-4" />}
          onClick={exporterPdf}
        >
          Fiche PDF
        </Button>
        {peutEditer && (
          <Button
            variante="contour"
            iconeGauche={<Pencil className="h-4 w-4" />}
            onClick={() => setEditOuvert(true)}
          >
            Modifier
          </Button>
        )}
        {peutSupprimer && (
          <Button
            variante="contour"
            taille="icone"
            aria-label="Supprimer le dossier"
            onClick={() => setSupprOuvert(true)}
          >
            <Trash2 className="h-4 w-4 text-muted-foreground" />
          </Button>
        )}
      </div>

      <Modal
        ouvert={editOuvert}
        onClose={() => setEditOuvert(false)}
        titre={`Modifier — ${numero}`}
        taille="xl"
      >
        <div className="max-h-[72vh] overflow-y-auto pr-1">
          <DossierEditForm
            dossierId={dossierId}
            initial={formInitial}
            clients={clients}
            avocats={avocats}
            onTermine={() => setEditOuvert(false)}
          />
        </div>
      </Modal>

      <ConfirmDialog
        ouvert={supprOuvert}
        onClose={() => setSupprOuvert(false)}
        onConfirm={confirmerSuppression}
        enChargement={suppression}
        titre="Supprimer ce dossier"
        message="Cette action est irréversible. Le dossier, ses parties, actes, documents et liens seront supprimés."
      />
    </>
  );
}
