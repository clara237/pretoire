"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input, Field } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { AssistantTexte } from "@/components/ui/assistant-texte";
import { Select } from "@/components/ui/select";
import { modifierDossier, type DonneesDossier } from "@/lib/actions/dossiers";
import {
  TYPES_AFFAIRE,
  LIBELLE_TYPE_AFFAIRE,
  STATUTS_DOSSIER,
  LIBELLE_STATUT,
} from "@/lib/queries/dossiers-labels";

export interface OptionSimple {
  value: string;
  label: string;
}

export function DossierEditForm({
  dossierId,
  initial,
  clients,
  avocats,
  onTermine,
}: {
  dossierId: string;
  initial: DonneesDossier;
  clients: OptionSimple[];
  avocats: OptionSimple[];
  onTermine?: () => void;
}) {
  const router = useRouter();
  const [chargement, setChargement] = React.useState(false);
  const [erreur, setErreur] = React.useState<string | null>(null);
  const [form, setForm] = React.useState<DonneesDossier>(initial);

  function maj<K extends keyof DonneesDossier>(cle: K, valeur: DonneesDossier[K]) {
    setForm((f) => ({ ...f, [cle]: valeur }));
  }

  async function soumettre(e: React.FormEvent) {
    e.preventDefault();
    setErreur(null);
    setChargement(true);
    const res = await modifierDossier(dossierId, form);
    setChargement(false);
    if (!res.ok) {
      setErreur(res.message ?? "Une erreur est survenue.");
      toast.error(res.message ?? "Une erreur est survenue.");
      return;
    }
    toast.success("Dossier modifié.");
    onTermine?.();
    router.refresh();
  }

  return (
    <form onSubmit={soumettre} className="space-y-5">
      <Field label="Intitulé du dossier" htmlFor="e-titre" requis>
        <Input
          id="e-titre"
          value={form.titre}
          onChange={(e) => maj("titre", e.target.value)}
          required
        />
      </Field>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Field label="Type d'affaire" htmlFor="e-type">
          <Select
            id="e-type"
            value={form.type_affaire}
            onChange={(e) => maj("type_affaire", e.target.value)}
            options={TYPES_AFFAIRE.map((t) => ({
              value: t,
              label: LIBELLE_TYPE_AFFAIRE[t],
            }))}
          />
        </Field>
        <Field label="Statut" htmlFor="e-statut">
          <Select
            id="e-statut"
            value={form.statut}
            onChange={(e) => maj("statut", e.target.value)}
            options={STATUTS_DOSSIER.map((s) => ({
              value: s,
              label: LIBELLE_STATUT[s],
            }))}
          />
        </Field>
        <Field label="Client" htmlFor="e-client">
          <Select
            id="e-client"
            value={form.client_id ?? ""}
            onChange={(e) => maj("client_id", e.target.value)}
            options={[{ value: "", label: "— Aucun —" }, ...clients]}
          />
        </Field>
        <Field label="Avocat responsable" htmlFor="e-avocat">
          <Select
            id="e-avocat"
            value={form.avocat_responsable_id ?? ""}
            onChange={(e) => maj("avocat_responsable_id", e.target.value)}
            options={[{ value: "", label: "— Aucun —" }, ...avocats]}
          />
        </Field>
        <Field label="Tribunal / juridiction" htmlFor="e-tribunal" className="sm:col-span-2">
          <Input
            id="e-tribunal"
            value={form.tribunal ?? ""}
            onChange={(e) => maj("tribunal", e.target.value)}
          />
        </Field>
        <Field label="Chambre" htmlFor="e-chambre">
          <Input
            id="e-chambre"
            value={form.chambre ?? ""}
            onChange={(e) => maj("chambre", e.target.value)}
          />
        </Field>
        <Field label="Numéro de rôle" htmlFor="e-role">
          <Input
            id="e-role"
            value={form.numero_role ?? ""}
            onChange={(e) => maj("numero_role", e.target.value)}
          />
        </Field>
        <Field label="Montant en jeu (FCFA)" htmlFor="e-enjeu">
          <Input
            id="e-enjeu"
            inputMode="numeric"
            value={String(form.montant_enjeu ?? "")}
            onChange={(e) => maj("montant_enjeu", e.target.value)}
          />
        </Field>
        <Field label="Date d'ouverture" htmlFor="e-ouverture">
          <Input
            id="e-ouverture"
            type="date"
            value={form.date_ouverture ?? ""}
            onChange={(e) => maj("date_ouverture", e.target.value)}
          />
        </Field>
        <Field label="Clôture prévue" htmlFor="e-clotprev">
          <Input
            id="e-clotprev"
            type="date"
            value={form.date_cloture_prev ?? ""}
            onChange={(e) => maj("date_cloture_prev", e.target.value)}
          />
        </Field>
        <Field label="Clôture effective" htmlFor="e-clotreel">
          <Input
            id="e-clotreel"
            type="date"
            value={form.date_cloture_reel ?? ""}
            onChange={(e) => maj("date_cloture_reel", e.target.value)}
          />
        </Field>
      </div>

      <Field label="Description des faits" htmlFor="e-faits">
        <Textarea
          id="e-faits"
          value={form.description_faits ?? ""}
          onChange={(e) => maj("description_faits", e.target.value)}
        />
        <AssistantTexte
          valeur={form.description_faits ?? ""}
          onChange={(t) => maj("description_faits", t)}
        />
      </Field>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Field label="Prétentions" htmlFor="e-pretentions">
          <Textarea
            id="e-pretentions"
            value={form.pretentions ?? ""}
            onChange={(e) => maj("pretentions", e.target.value)}
          />
        </Field>
        <Field label="Moyens" htmlFor="e-moyens">
          <Textarea
            id="e-moyens"
            value={form.moyens ?? ""}
            onChange={(e) => maj("moyens", e.target.value)}
          />
        </Field>
      </div>

      {erreur && (
        <div className="rounded-DEFAULT border border-danger/20 bg-danger/10 px-3 py-2 text-sm text-danger">
          {erreur}
        </div>
      )}

      <div className="flex justify-end gap-2">
        {onTermine && (
          <Button
            type="button"
            variante="contour"
            onClick={onTermine}
            disabled={chargement}
          >
            Annuler
          </Button>
        )}
        <Button type="submit" enChargement={chargement}>
          Enregistrer
        </Button>
      </div>
    </form>
  );
}
