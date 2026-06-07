"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Briefcase, Plus, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/select";
import { Field } from "@/components/ui/input";
import { Modal, ConfirmDialog } from "@/components/ui/modal";
import { EmptyState } from "@/components/ui/empty-state";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/components/ui/table";
import {
  assignerDossierStagiaire,
  retirerDossierStagiaire,
} from "@/lib/actions/stagiaires";

export interface DossierAssigne {
  id: string;
  numero: string;
  titre: string;
}

export interface OptionDossier {
  id: string;
  numero: string;
  titre: string;
}

export function OngletDossiers({
  stagiaireId,
  dossiers,
  dossiersDispo,
  peutEditer,
}: {
  stagiaireId: string;
  dossiers: DossierAssigne[];
  dossiersDispo: OptionDossier[];
  peutEditer: boolean;
}) {
  const router = useRouter();
  const [ouvert, setOuvert] = React.useState(false);
  const [choix, setChoix] = React.useState("");
  const [enCours, setEnCours] = React.useState(false);
  const [aRetirer, setARetirer] = React.useState<string | null>(null);

  const dejaAssignes = new Set(dossiers.map((d) => d.id));
  const options = dossiersDispo.filter((d) => !dejaAssignes.has(d.id));

  async function onAssigner() {
    if (!choix) {
      toast.error("Sélectionnez un dossier.");
      return;
    }
    setEnCours(true);
    const res = await assignerDossierStagiaire(stagiaireId, choix);
    setEnCours(false);
    if (res.ok) {
      toast.success("Dossier assigné.");
      setOuvert(false);
      setChoix("");
      router.refresh();
    } else {
      toast.error(res.message ?? "Assignation impossible.");
    }
  }

  async function confirmerRetrait() {
    if (!aRetirer) return;
    const res = await retirerDossierStagiaire(stagiaireId, aRetirer);
    setARetirer(null);
    if (res.ok) {
      toast.success("Dossier retiré.");
      router.refresh();
    } else {
      toast.error(res.message ?? "Retrait impossible.");
    }
  }

  return (
    <div className="space-y-4">
      {peutEditer && (
        <div className="flex justify-end">
          <Button
            iconeGauche={<Plus className="h-4 w-4" />}
            onClick={() => setOuvert(true)}
          >
            Assigner un dossier
          </Button>
        </div>
      )}

      {dossiers.length === 0 ? (
        <EmptyState
          titre="Aucun dossier en supervision"
          description="Assignez des dossiers à ce stagiaire pour son suivi."
          icone={Briefcase}
        />
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Numéro</TableHead>
              <TableHead>Intitulé</TableHead>
              {peutEditer && <TableHead className="text-right">Action</TableHead>}
            </TableRow>
          </TableHeader>
          <TableBody>
            {dossiers.map((d) => (
              <TableRow key={d.id}>
                <TableCell className="font-medium">
                  <Link
                    href={`/dossiers/${d.id}`}
                    className="text-principale hover:underline"
                  >
                    {d.numero}
                  </Link>
                </TableCell>
                <TableCell className="text-muted-foreground">{d.titre}</TableCell>
                {peutEditer && (
                  <TableCell className="text-right">
                    <Button
                      variante="fantome"
                      className="text-danger"
                      onClick={() => setARetirer(d.id)}
                      aria-label="Retirer le dossier"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </TableCell>
                )}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}

      <Modal
        ouvert={ouvert}
        onClose={() => setOuvert(false)}
        titre="Assigner un dossier"
        taille="md"
      >
        <div className="space-y-4">
          <Field label="Dossier" htmlFor="dossier">
            <Select
              id="dossier"
              value={choix}
              onChange={(e) => setChoix(e.target.value)}
            >
              <option value="">— Sélectionner —</option>
              {options.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.numero} — {d.titre}
                </option>
              ))}
            </Select>
          </Field>
          {options.length === 0 && (
            <p className="text-sm text-muted-foreground">
              Tous les dossiers disponibles sont déjà assignés.
            </p>
          )}
          <div className="flex justify-end gap-2 pt-2">
            <Button
              type="button"
              variante="contour"
              onClick={() => setOuvert(false)}
              disabled={enCours}
            >
              Annuler
            </Button>
            <Button onClick={onAssigner} enChargement={enCours}>
              Assigner
            </Button>
          </div>
        </div>
      </Modal>

      <ConfirmDialog
        ouvert={aRetirer !== null}
        onClose={() => setARetirer(null)}
        onConfirm={confirmerRetrait}
        titre="Retirer le dossier"
        message="Le dossier ne sera plus en supervision pour ce stagiaire."
      />
    </div>
  );
}
