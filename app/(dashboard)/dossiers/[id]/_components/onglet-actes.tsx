"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Plus, Trash2, FileSignature, Paperclip } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input, Field } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select } from "@/components/ui/select";
import { Modal, ConfirmDialog } from "@/components/ui/modal";
import { EmptyState } from "@/components/ui/empty-state";
import { formatDate } from "@/lib/utils";
import { TYPES_ACTE } from "@/lib/queries/dossiers-labels";
import { ajouterActeFormData, supprimerActe } from "@/lib/actions/dossiers";
import { BoutonTelecharger } from "@/app/(dashboard)/documents/_components/document-actions";

export interface Acte {
  id: string;
  type_acte: string;
  description: string | null;
  date_acte: string;
  fichier_url: string | null;
  auteur: { nom: string; prenom: string } | null;
}

export function OngletActes({
  dossierId,
  actes,
  peutEditer,
}: {
  dossierId: string;
  actes: Acte[];
  peutEditer: boolean;
}) {
  const router = useRouter();
  const [ouvert, setOuvert] = React.useState(false);
  const [chargement, setChargement] = React.useState(false);
  const [aSupprimer, setASupprimer] = React.useState<Acte | null>(null);
  const [suppression, setSuppression] = React.useState(false);
  const formRef = React.useRef<HTMLFormElement>(null);

  async function ajouter(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const data = new FormData(e.currentTarget);
    data.set("dossier_id", dossierId);
    setChargement(true);
    const res = await ajouterActeFormData(data);
    setChargement(false);
    if (!res.ok) {
      toast.error(res.message ?? "Ajout impossible.");
      return;
    }
    toast.success("Acte enregistré.");
    formRef.current?.reset();
    setOuvert(false);
    router.refresh();
  }

  async function confirmerSuppression() {
    if (!aSupprimer) return;
    setSuppression(true);
    const res = await supprimerActe(aSupprimer.id, dossierId);
    setSuppression(false);
    if (!res.ok) {
      toast.error(res.message ?? "Suppression impossible.");
      setASupprimer(null);
      return;
    }
    toast.success("Acte supprimé.");
    setASupprimer(null);
    router.refresh();
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-base font-semibold text-foreground">
          Actes &amp; procédures
        </h2>
        {peutEditer && (
          <Button
            taille="sm"
            iconeGauche={<Plus className="h-4 w-4" />}
            onClick={() => setOuvert(true)}
          >
            Nouvel acte
          </Button>
        )}
      </div>

      {actes.length === 0 ? (
        <EmptyState
          titre="Aucun acte"
          description="Consignez les actes de procédure : assignation, conclusions, jugement, appel…"
          icone={FileSignature}
          action={
            peutEditer ? (
              <Button taille="sm" onClick={() => setOuvert(true)}>
                Nouvel acte
              </Button>
            ) : undefined
          }
        />
      ) : (
        <ol className="relative space-y-4 border-l border-border pl-6">
          {actes.map((a) => (
            <li key={a.id} className="relative">
              <span className="absolute -left-[1.65rem] top-1 h-3 w-3 rounded-full border-2 border-background bg-principale" />
              <div className="rounded-lg border border-border bg-card p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-medium text-foreground">
                        {a.type_acte}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {formatDate(a.date_acte)}
                      </span>
                    </div>
                    {a.description && (
                      <p className="mt-1 whitespace-pre-wrap text-sm text-muted-foreground">
                        {a.description}
                      </p>
                    )}
                    <div className="mt-2 flex items-center gap-3 text-xs text-muted-foreground">
                      {a.auteur && (
                        <span>
                          Par {a.auteur.prenom} {a.auteur.nom}
                        </span>
                      )}
                      {a.fichier_url && (
                        <span className="flex items-center gap-1">
                          <Paperclip className="h-3 w-3" /> Pièce jointe
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center">
                    {a.fichier_url && <BoutonTelecharger chemin={a.fichier_url} />}
                    {peutEditer && (
                      <Button
                        variante="fantome"
                        taille="icone"
                        aria-label="Supprimer"
                        onClick={() => setASupprimer(a)}
                      >
                        <Trash2 className="h-4 w-4 text-muted-foreground" />
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            </li>
          ))}
        </ol>
      )}

      <Modal
        ouvert={ouvert}
        onClose={() => !chargement && setOuvert(false)}
        titre="Nouvel acte de procédure"
        taille="md"
      >
        <form ref={formRef} onSubmit={ajouter} className="space-y-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field label="Type d'acte" htmlFor="a-type" requis>
              <Select
                id="a-type"
                name="type_acte"
                defaultValue="Assignation"
                options={TYPES_ACTE.map((t) => ({ value: t, label: t }))}
              />
            </Field>
            <Field label="Date" htmlFor="a-date">
              <Input
                id="a-date"
                name="date_acte"
                type="date"
                defaultValue={new Date().toISOString().slice(0, 10)}
              />
            </Field>
          </div>
          <Field label="Description" htmlFor="a-desc">
            <Textarea
              id="a-desc"
              name="description"
              placeholder="Détails de l'acte…"
              rows={3}
            />
          </Field>
          <Field label="Fichier joint" htmlFor="a-fichier" aide="Optionnel.">
            <Input
              id="a-fichier"
              name="fichier"
              type="file"
              className="cursor-pointer file:mr-3 file:rounded file:border-0 file:bg-muted file:px-3 file:py-1 file:text-sm"
            />
          </Field>
          <div className="flex justify-end gap-2">
            <Button
              type="button"
              variante="contour"
              onClick={() => setOuvert(false)}
              disabled={chargement}
            >
              Annuler
            </Button>
            <Button type="submit" enChargement={chargement}>
              Enregistrer
            </Button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog
        ouvert={Boolean(aSupprimer)}
        onClose={() => setASupprimer(null)}
        onConfirm={confirmerSuppression}
        enChargement={suppression}
        titre="Supprimer l'acte"
        message={`Supprimer l'acte « ${aSupprimer?.type_acte ?? ""} » ?`}
      />
    </div>
  );
}
