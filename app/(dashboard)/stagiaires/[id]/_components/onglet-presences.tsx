"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { CheckCircle2, XCircle, Plus, Trash2, CalendarCheck } from "lucide-react";
import { Modal, ConfirmDialog } from "@/components/ui/modal";
import { Button } from "@/components/ui/button";
import { Input, Field } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/components/ui/table";
import { EmptyState } from "@/components/ui/empty-state";
import { formatDate } from "@/lib/utils";
import {
  enregistrerPresence,
  supprimerPresence,
} from "@/lib/actions/stagiaires";

export interface Presence {
  id: string;
  date: string;
  heure_arrivee: string | null;
  heure_depart: string | null;
  present: boolean;
  motif_absence: string | null;
}

function heureToInput(h: string | null): string {
  if (!h) return "";
  // PostgreSQL renvoie "HH:MM:SS"
  return h.slice(0, 5);
}

export function OngletPresences({
  stagiaireId,
  presences,
  peutEditer,
}: {
  stagiaireId: string;
  presences: Presence[];
  peutEditer: boolean;
}) {
  const router = useRouter();
  const [ouvert, setOuvert] = React.useState(false);
  const [present, setPresent] = React.useState(true);
  const [enCours, setEnCours] = React.useState(false);
  const [aSupprimer, setASupprimer] = React.useState<string | null>(null);

  const nbPresent = presences.filter((p) => p.present).length;
  const nbAbsent = presences.length - nbPresent;

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setEnCours(true);
    const res = await enregistrerPresence(stagiaireId, new FormData(e.currentTarget));
    setEnCours(false);
    if (res.ok) {
      toast.success("Pointage enregistré.");
      setOuvert(false);
      router.refresh();
    } else {
      toast.error(res.message ?? "Enregistrement impossible.");
    }
  }

  async function onSupprimer() {
    if (!aSupprimer) return;
    const res = await supprimerPresence(aSupprimer, stagiaireId);
    setASupprimer(null);
    if (res.ok) {
      toast.success("Pointage supprimé.");
      router.refresh();
    } else {
      toast.error(res.message ?? "Suppression impossible.");
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3 text-sm">
          <Badge ton="succes">{nbPresent} présence(s)</Badge>
          <Badge ton="danger">{nbAbsent} absence(s)</Badge>
        </div>
        {peutEditer && (
          <Button
            taille="sm"
            iconeGauche={<Plus className="h-4 w-4" />}
            onClick={() => {
              setPresent(true);
              setOuvert(true);
            }}
          >
            Pointer un jour
          </Button>
        )}
      </div>

      {presences.length === 0 ? (
        <EmptyState
          titre="Aucun pointage"
          description="Enregistrez le premier pointage journalier de ce stagiaire."
          icone={CalendarCheck}
        />
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Date</TableHead>
              <TableHead>Statut</TableHead>
              <TableHead>Arrivée</TableHead>
              <TableHead>Départ</TableHead>
              <TableHead>Motif d&apos;absence</TableHead>
              {peutEditer && <TableHead className="w-10" />}
            </TableRow>
          </TableHeader>
          <TableBody>
            {presences.map((p) => (
              <TableRow key={p.id}>
                <TableCell className="font-medium">{formatDate(p.date)}</TableCell>
                <TableCell>
                  {p.present ? (
                    <span className="inline-flex items-center gap-1 text-sm font-medium text-success">
                      <CheckCircle2 className="h-4 w-4" /> Présent
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 text-sm font-medium text-danger">
                      <XCircle className="h-4 w-4" /> Absent
                    </span>
                  )}
                </TableCell>
                <TableCell className="text-muted-foreground">
                  {p.present ? heureToInput(p.heure_arrivee) || "—" : "—"}
                </TableCell>
                <TableCell className="text-muted-foreground">
                  {p.present ? heureToInput(p.heure_depart) || "—" : "—"}
                </TableCell>
                <TableCell className="text-muted-foreground">
                  {p.motif_absence ?? "—"}
                </TableCell>
                {peutEditer && (
                  <TableCell>
                    <button
                      type="button"
                      aria-label="Supprimer"
                      onClick={() => setASupprimer(p.id)}
                      className="rounded-DEFAULT p-1.5 text-muted-foreground hover:bg-muted hover:text-danger"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
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
        titre="Pointage journalier"
        taille="md"
      >
        <form onSubmit={onSubmit} className="space-y-4">
          <Field label="Date" htmlFor="date" requis>
            <Input
              id="date"
              name="date"
              type="date"
              defaultValue={new Date().toISOString().slice(0, 10)}
              required
            />
          </Field>

          <Field label="Statut" htmlFor="present">
            <Select
              id="present"
              name="present"
              value={present ? "true" : "false"}
              onChange={(e) => setPresent(e.target.value === "true")}
              options={[
                { value: "true", label: "Présent" },
                { value: "false", label: "Absent" },
              ]}
            />
          </Field>

          {present ? (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Field label="Heure d'arrivée" htmlFor="heure_arrivee">
                <Input id="heure_arrivee" name="heure_arrivee" type="time" />
              </Field>
              <Field label="Heure de départ" htmlFor="heure_depart">
                <Input id="heure_depart" name="heure_depart" type="time" />
              </Field>
            </div>
          ) : (
            <Field label="Motif d'absence" htmlFor="motif_absence">
              <Textarea
                id="motif_absence"
                name="motif_absence"
                rows={2}
                placeholder="Ex. Examen universitaire, maladie…"
              />
            </Field>
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
            <Button type="submit" enChargement={enCours}>
              Enregistrer
            </Button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog
        ouvert={aSupprimer !== null}
        onClose={() => setASupprimer(null)}
        onConfirm={onSupprimer}
        titre="Supprimer le pointage"
        message="Ce pointage sera définitivement supprimé."
      />
    </div>
  );
}
