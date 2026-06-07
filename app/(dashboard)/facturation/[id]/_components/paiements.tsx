"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Plus, Trash2, Receipt } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input, Field } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select } from "@/components/ui/select";
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
import { formatFCFA, formatDate } from "@/lib/utils";
import {
  ajouterPaiement,
  supprimerPaiement,
} from "@/lib/actions/factures";
import {
  MODES_PAIEMENT,
  LIBELLE_MODE_PAIEMENT,
} from "@/lib/finance-constants";

export interface PaiementVue {
  id: string;
  date_paiement: string;
  montant: number;
  mode_paiement: string;
  reference: string | null;
  notes: string | null;
}

function aujourdhui() {
  return new Date().toISOString().slice(0, 10);
}

export function Paiements({
  factureId,
  paiements,
  solde,
  devise,
  peutEditer,
}: {
  factureId: string;
  paiements: PaiementVue[];
  solde: number;
  devise: string;
  peutEditer: boolean;
}) {
  const router = useRouter();
  const [ouvert, setOuvert] = React.useState(false);
  const [chargement, setChargement] = React.useState(false);

  const [form, setForm] = React.useState({
    date_paiement: aujourdhui(),
    montant: solde > 0 ? String(solde) : "",
    mode_paiement: "virement",
    reference: "",
    notes: "",
  });

  const [aSupprimer, setASupprimer] = React.useState<PaiementVue | null>(null);
  const [suppressionEnCours, setSuppressionEnCours] = React.useState(false);

  function maj<K extends keyof typeof form>(cle: K, v: (typeof form)[K]) {
    setForm((f) => ({ ...f, [cle]: v }));
  }

  function ouvrir() {
    setForm({
      date_paiement: aujourdhui(),
      montant: solde > 0 ? String(solde) : "",
      mode_paiement: "virement",
      reference: "",
      notes: "",
    });
    setOuvert(true);
  }

  async function soumettre(e: React.FormEvent) {
    e.preventDefault();
    const montant = Number(form.montant.replace(/\s/g, "").replace(",", "."));
    setChargement(true);
    const res = await ajouterPaiement(factureId, {
      date_paiement: form.date_paiement,
      montant,
      mode_paiement: form.mode_paiement,
      reference: form.reference || null,
      notes: form.notes || null,
    });
    setChargement(false);
    if (!res.ok) {
      toast.error(res.message ?? "Enregistrement impossible.");
      return;
    }
    toast.success("Paiement enregistré.");
    setOuvert(false);
    router.refresh();
  }

  async function confirmerSuppression() {
    if (!aSupprimer) return;
    setSuppressionEnCours(true);
    const res = await supprimerPaiement(aSupprimer.id, factureId);
    setSuppressionEnCours(false);
    if (!res.ok) {
      toast.error(res.message ?? "Suppression impossible.");
      setASupprimer(null);
      return;
    }
    toast.success("Paiement supprimé.");
    setASupprimer(null);
    router.refresh();
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-foreground">Paiements</h3>
        {peutEditer && solde > 0 && (
          <Button
            taille="sm"
            iconeGauche={<Plus className="h-4 w-4" />}
            onClick={ouvrir}
          >
            Enregistrer un paiement
          </Button>
        )}
      </div>

      {paiements.length === 0 ? (
        <EmptyState
          titre="Aucun paiement"
          description={
            peutEditer
              ? "Enregistrez les règlements reçus pour suivre le solde."
              : "Aucun règlement enregistré pour cette facture."
          }
          icone={Receipt}
          action={
            peutEditer && solde > 0 ? (
              <Button taille="sm" onClick={ouvrir}>
                Enregistrer un paiement
              </Button>
            ) : undefined
          }
        />
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Date</TableHead>
              <TableHead>Mode</TableHead>
              <TableHead className="hidden sm:table-cell">Référence</TableHead>
              <TableHead className="text-right">Montant</TableHead>
              {peutEditer && <TableHead className="w-px" />}
            </TableRow>
          </TableHeader>
          <TableBody>
            {paiements.map((p) => (
              <TableRow key={p.id}>
                <TableCell className="text-sm">
                  {formatDate(p.date_paiement)}
                </TableCell>
                <TableCell className="text-sm">
                  {LIBELLE_MODE_PAIEMENT[p.mode_paiement] ?? p.mode_paiement}
                </TableCell>
                <TableCell className="hidden sm:table-cell text-sm text-muted-foreground">
                  {p.reference || "—"}
                </TableCell>
                <TableCell className="text-right text-sm font-medium">
                  {formatFCFA(p.montant, devise)}
                </TableCell>
                {peutEditer && (
                  <TableCell className="text-right">
                    <Button
                      variante="fantome"
                      taille="icone"
                      aria-label="Supprimer le paiement"
                      title="Supprimer"
                      onClick={() => setASupprimer(p)}
                    >
                      <Trash2 className="h-4 w-4 text-muted-foreground" />
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
        onClose={() => !chargement && setOuvert(false)}
        titre="Enregistrer un paiement"
        taille="md"
      >
        <form onSubmit={soumettre} className="space-y-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field label="Date" htmlFor="date_paiement" requis>
              <Input
                id="date_paiement"
                type="date"
                value={form.date_paiement}
                onChange={(e) => maj("date_paiement", e.target.value)}
                required
              />
            </Field>
            <Field label="Montant (FCFA)" htmlFor="montant" requis aide={`Solde dû : ${formatFCFA(solde, devise)}`}>
              <Input
                id="montant"
                inputMode="numeric"
                value={form.montant}
                onChange={(e) => maj("montant", e.target.value)}
                placeholder="500000"
                required
              />
            </Field>
          </div>
          <Field label="Mode de paiement" htmlFor="mode_paiement" requis>
            <Select
              id="mode_paiement"
              value={form.mode_paiement}
              onChange={(e) => maj("mode_paiement", e.target.value)}
              options={MODES_PAIEMENT.map((m) => ({
                value: m,
                label: LIBELLE_MODE_PAIEMENT[m],
              }))}
            />
          </Field>
          <Field label="Référence" htmlFor="reference" aide="N° de virement, chèque, transaction Mobile Money…">
            <Input
              id="reference"
              value={form.reference}
              onChange={(e) => maj("reference", e.target.value)}
              placeholder="VIR-2026-0312"
            />
          </Field>
          <Field label="Notes" htmlFor="notes_paiement">
            <Textarea
              id="notes_paiement"
              rows={2}
              value={form.notes}
              onChange={(e) => maj("notes", e.target.value)}
            />
          </Field>
          <div className="flex justify-end gap-2 pt-2">
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
        enChargement={suppressionEnCours}
        titre="Supprimer le paiement"
        message={
          aSupprimer
            ? `Supprimer le paiement de ${formatFCFA(aSupprimer.montant, devise)} du ${formatDate(aSupprimer.date_paiement)} ?`
            : ""
        }
      />
    </div>
  );
}
