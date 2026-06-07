"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Plus, Star, Trash2 } from "lucide-react";
import { Modal, ConfirmDialog } from "@/components/ui/modal";
import { Button } from "@/components/ui/button";
import { Input, Field } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select } from "@/components/ui/select";
import { EmptyState } from "@/components/ui/empty-state";
import { Card, CardContent } from "@/components/ui/card";
import { formatDate } from "@/lib/utils";
import {
  CRITERES_EVALUATION,
  ajouterEvaluation,
  supprimerEvaluation,
  type Evaluation,
} from "@/lib/actions/stagiaires";

function libelleAppreciation(note: number): string {
  if (note >= 4.5) return "Excellent";
  if (note >= 3.5) return "Très bien";
  if (note >= 2.5) return "Bien";
  if (note >= 1.5) return "Passable";
  return "Insuffisant";
}

export function OngletEvaluations({
  stagiaireId,
  evaluations,
  peutEditer,
}: {
  stagiaireId: string;
  evaluations: Evaluation[];
  peutEditer: boolean;
}) {
  const router = useRouter();
  const [ouvert, setOuvert] = React.useState(false);
  const [enCours, setEnCours] = React.useState(false);
  const [aSupprimer, setASupprimer] = React.useState<number | null>(null);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setEnCours(true);
    const formData = new FormData(e.currentTarget);
    const res = await ajouterEvaluation(stagiaireId, formData);
    setEnCours(false);
    if (res.ok) {
      toast.success("Évaluation enregistrée.");
      setOuvert(false);
      router.refresh();
    } else {
      toast.error(res.message ?? "Une erreur est survenue.");
    }
  }

  async function confirmerSuppression() {
    if (aSupprimer === null) return;
    const res = await supprimerEvaluation(stagiaireId, aSupprimer);
    setASupprimer(null);
    if (res.ok) {
      toast.success("Évaluation supprimée.");
      router.refresh();
    } else {
      toast.error(res.message ?? "Suppression impossible.");
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
            Nouvelle évaluation
          </Button>
        </div>
      )}

      {evaluations.length === 0 ? (
        <EmptyState
          titre="Aucune évaluation"
          description="Notez le stagiaire (1 à 5) pour suivre sa progression."
          icone={Star}
        />
      ) : (
        <div className="space-y-3">
          {evaluations
            .map((ev, i) => ({ ev, i }))
            .sort((a, b) => (a.ev.date < b.ev.date ? 1 : -1))
            .map(({ ev, i }) => (
              <Card key={`${ev.date}-${i}`}>
                <CardContent className="pt-5">
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="inline-flex items-center gap-1 font-semibold text-foreground">
                          <Star className="h-4 w-4 fill-warning text-warning" />
                          {ev.note.toFixed(1)}/5
                        </span>
                        <span className="text-sm text-muted-foreground">
                          {libelleAppreciation(ev.note)}
                        </span>
                        <span className="text-sm text-muted-foreground">
                          · {formatDate(ev.date)}
                        </span>
                      </div>
                      {ev.evaluateur && (
                        <p className="mt-1 text-xs text-muted-foreground">
                          Évalué par {ev.evaluateur}
                        </p>
                      )}
                    </div>
                    {peutEditer && (
                      <Button
                        variante="fantome"
                        className="text-danger"
                        onClick={() => setASupprimer(i)}
                        aria-label="Supprimer l'évaluation"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>

                  {ev.criteres && Object.keys(ev.criteres).length > 0 && (
                    <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-2">
                      {CRITERES_EVALUATION.filter(
                        (c) => ev.criteres?.[c.cle] != null,
                      ).map((c) => (
                        <div
                          key={c.cle}
                          className="flex items-center justify-between rounded-DEFAULT border border-border px-3 py-1.5 text-sm"
                        >
                          <span className="text-muted-foreground">
                            {c.libelle}
                          </span>
                          <span className="font-medium text-foreground">
                            {ev.criteres?.[c.cle]}/5
                          </span>
                        </div>
                      ))}
                    </div>
                  )}

                  {ev.commentaire && (
                    <p className="mt-3 whitespace-pre-wrap text-sm text-foreground">
                      {ev.commentaire}
                    </p>
                  )}
                </CardContent>
              </Card>
            ))}
        </div>
      )}

      <Modal
        ouvert={ouvert}
        onClose={() => setOuvert(false)}
        titre="Nouvelle évaluation"
        taille="lg"
      >
        <form onSubmit={onSubmit} className="space-y-4">
          <Field label="Date de l'évaluation" htmlFor="date">
            <Input
              id="date"
              name="date"
              type="date"
              defaultValue={new Date().toISOString().slice(0, 10)}
            />
          </Field>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {CRITERES_EVALUATION.map((c) => (
              <Field key={c.cle} label={c.libelle} htmlFor={`critere_${c.cle}`}>
                <Select id={`critere_${c.cle}`} name={`critere_${c.cle}`} defaultValue="">
                  <option value="">— Non noté —</option>
                  {[1, 2, 3, 4, 5].map((n) => (
                    <option key={n} value={n}>
                      {n} / 5
                    </option>
                  ))}
                </Select>
              </Field>
            ))}
          </div>

          <Field label="Commentaire" htmlFor="commentaire">
            <Textarea
              id="commentaire"
              name="commentaire"
              rows={3}
              placeholder="Appréciation générale, axes de progrès…"
            />
          </Field>

          <div className="flex justify-end gap-2 pt-2">
            <Button
              type="button"
              variante="contour"
              onClick={() => setOuvert(false)}
              disabled={enCours}
            >
              Annuler
            </Button>
            <Button type="submit" enChargement={enCours}>
              Enregistrer
            </Button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog
        ouvert={aSupprimer !== null}
        onClose={() => setASupprimer(null)}
        onConfirm={confirmerSuppression}
        titre="Supprimer l'évaluation"
        message="Cette action est irréversible. La note globale sera recalculée."
      />
    </div>
  );
}
