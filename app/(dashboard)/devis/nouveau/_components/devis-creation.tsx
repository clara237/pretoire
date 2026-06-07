"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input, Field } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select } from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { formatFCFA } from "@/lib/utils";
import { creerDevis } from "@/lib/actions/devis";

interface Option {
  value: string;
  label: string;
}

function datePlus(jours: number): string {
  const d = new Date();
  d.setDate(d.getDate() + jours);
  return d.toISOString().slice(0, 10);
}

export function DevisCreation({
  clients,
  dossiers,
  tvaApplicable,
  tauxTva,
  devise,
  dossierParDefaut,
}: {
  clients: Option[];
  dossiers: Option[];
  tvaApplicable: boolean;
  tauxTva: number;
  devise: string;
  dossierParDefaut?: string;
}) {
  const router = useRouter();
  const [chargement, setChargement] = React.useState(false);

  const [clientId, setClientId] = React.useState("");
  const [dossierId, setDossierId] = React.useState(dossierParDefaut ?? "");
  const [objet, setObjet] = React.useState("");
  const [dateEmission, setDateEmission] = React.useState(datePlus(0));
  const [dateValidite, setDateValidite] = React.useState(datePlus(30));
  const [montantHt, setMontantHt] = React.useState("");
  const [notes, setNotes] = React.useState("");

  const baseHt = Number(montantHt.replace(/\s/g, "")) || 0;
  const tvaCalc = tvaApplicable ? Math.round((baseHt * tauxTva) / 100) : 0;
  const ttc = baseHt + tvaCalc;

  async function soumettre(e: React.FormEvent) {
    e.preventDefault();
    const montant = Number(montantHt.replace(/\s/g, ""));
    if (!(montant > 0)) {
      toast.error("Saisissez un montant valide.");
      return;
    }
    setChargement(true);
    const res = await creerDevis({
      client_id: clientId || null,
      dossier_id: dossierId || null,
      objet: objet || null,
      date_emission: dateEmission,
      date_validite: dateValidite || null,
      notes: notes || null,
      montant_ht: montant,
    });
    setChargement(false);
    if (!res.ok) {
      toast.error(res.message ?? "Création impossible.");
      return;
    }
    toast.success(res.message ?? "Devis créé.");
    router.push(res.id ? `/devis/${res.id}` : "/devis");
    router.refresh();
  }

  return (
    <form onSubmit={soumettre} className="space-y-6">
      {/* Client / dossier */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Field label="Client" htmlFor="client">
          <Select
            id="client"
            value={clientId}
            onChange={(e) => setClientId(e.target.value)}
            placeholder="Sélectionner un client"
            options={clients}
          />
        </Field>
        <Field label="Dossier" htmlFor="dossier" aide="Optionnel.">
          <Select
            id="dossier"
            value={dossierId}
            onChange={(e) => setDossierId(e.target.value)}
            placeholder="Aucun dossier"
            options={dossiers}
          />
        </Field>
      </div>

      <Field label="Objet du devis" htmlFor="objet">
        <Input
          id="objet"
          value={objet}
          onChange={(e) => setObjet(e.target.value)}
          placeholder="Honoraires de représentation — phase 1"
        />
      </Field>

      <Field label="Montant HT (FCFA)" htmlFor="montant" requis>
        <Input
          id="montant"
          inputMode="numeric"
          value={montantHt}
          onChange={(e) => setMontantHt(e.target.value)}
          placeholder="1500000"
          required
        />
      </Field>

      {/* Dates */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Field label="Date d'émission" htmlFor="emission" requis>
          <Input
            id="emission"
            type="date"
            value={dateEmission}
            onChange={(e) => setDateEmission(e.target.value)}
            required
          />
        </Field>
        <Field
          label="Date de validité"
          htmlFor="validite"
          aide="Date jusqu'à laquelle le devis reste valable."
        >
          <Input
            id="validite"
            type="date"
            value={dateValidite}
            onChange={(e) => setDateValidite(e.target.value)}
          />
        </Field>
      </div>

      <Field label="Notes" htmlFor="notes">
        <Textarea
          id="notes"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Conditions, modalités de règlement…"
        />
      </Field>

      {/* Récapitulatif des montants */}
      <Card>
        <CardContent className="space-y-1.5 py-4 text-sm">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Montant HT</span>
            <span className="font-medium text-foreground">
              {formatFCFA(baseHt, devise)}
            </span>
          </div>
          {tvaApplicable && (
            <div className="flex justify-between">
              <span className="text-muted-foreground">TVA ({tauxTva}%)</span>
              <span className="font-medium text-foreground">
                {formatFCFA(tvaCalc, devise)}
              </span>
            </div>
          )}
          <div className="flex justify-between border-t border-border pt-1.5 text-base">
            <span className="font-semibold text-foreground">Total TTC</span>
            <span className="font-bold text-principale">
              {formatFCFA(ttc, devise)}
            </span>
          </div>
        </CardContent>
      </Card>

      <div className="flex items-center gap-2">
        <Button type="submit" enChargement={chargement}>
          Créer le devis
        </Button>
        <Button
          type="button"
          variante="contour"
          onClick={() => router.back()}
          disabled={chargement}
        >
          Annuler
        </Button>
      </div>
      <p className="text-xs text-muted-foreground">
        Le devis est créé au statut « brouillon ». Le numéro (DEV-AAAA-NNN) est
        généré automatiquement.
      </p>
    </form>
  );
}
