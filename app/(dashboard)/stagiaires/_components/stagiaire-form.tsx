"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input, Field } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select } from "@/components/ui/select";
import { creerStagiaire, modifierStagiaire } from "@/lib/actions/stagiaires";

export interface OptionMaitre {
  id: string;
  nom: string;
  prenom: string;
}

export interface ValeursStagiaire {
  id?: string;
  nom?: string;
  prenom?: string;
  email?: string | null;
  telephone?: string | null;
  universite?: string | null;
  annee_etude?: string | null;
  date_debut?: string | null;
  date_fin?: string | null;
  maitre_stage_id?: string | null;
  objectifs_stage?: string | null;
}

export function StagiaireForm({
  maitres,
  valeurs,
  apresSucces,
}: {
  maitres: OptionMaitre[];
  valeurs?: ValeursStagiaire;
  apresSucces?: () => void;
}) {
  const router = useRouter();
  const estEdition = Boolean(valeurs?.id);
  const [enCours, setEnCours] = React.useState(false);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setEnCours(true);
    const formData = new FormData(e.currentTarget);
    const res = estEdition
      ? await modifierStagiaire(valeurs!.id!, formData)
      : await creerStagiaire(formData);
    setEnCours(false);

    if (res.ok) {
      toast.success(estEdition ? "Stagiaire mis à jour." : "Stagiaire créé.");
      if (apresSucces) apresSucces();
      else router.push(res.id ? `/stagiaires/${res.id}` : "/stagiaires");
      router.refresh();
    } else {
      toast.error(res.message ?? "Une erreur est survenue.");
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Field label="Nom" htmlFor="nom" requis>
          <Input id="nom" name="nom" defaultValue={valeurs?.nom ?? ""} required />
        </Field>
        <Field label="Prénom" htmlFor="prenom" requis>
          <Input
            id="prenom"
            name="prenom"
            defaultValue={valeurs?.prenom ?? ""}
            required
          />
        </Field>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Field label="Email" htmlFor="email">
          <Input
            id="email"
            name="email"
            type="email"
            defaultValue={valeurs?.email ?? ""}
          />
        </Field>
        <Field label="Téléphone" htmlFor="telephone">
          <Input
            id="telephone"
            name="telephone"
            defaultValue={valeurs?.telephone ?? ""}
            placeholder="+237 …"
          />
        </Field>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Field label="Université" htmlFor="universite">
          <Input
            id="universite"
            name="universite"
            defaultValue={valeurs?.universite ?? ""}
            placeholder="Ex. Université de Yaoundé II"
          />
        </Field>
        <Field label="Année d'étude" htmlFor="annee_etude">
          <Input
            id="annee_etude"
            name="annee_etude"
            defaultValue={valeurs?.annee_etude ?? ""}
            placeholder="Ex. Master 2"
          />
        </Field>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Field label="Début du stage" htmlFor="date_debut">
          <Input
            id="date_debut"
            name="date_debut"
            type="date"
            defaultValue={valeurs?.date_debut ?? ""}
          />
        </Field>
        <Field label="Fin du stage" htmlFor="date_fin">
          <Input
            id="date_fin"
            name="date_fin"
            type="date"
            defaultValue={valeurs?.date_fin ?? ""}
          />
        </Field>
      </div>

      <Field label="Maître de stage" htmlFor="maitre_stage_id">
        <Select
          id="maitre_stage_id"
          name="maitre_stage_id"
          defaultValue={valeurs?.maitre_stage_id ?? ""}
        >
          <option value="">— Aucun —</option>
          {maitres.map((m) => (
            <option key={m.id} value={m.id}>
              {m.prenom} {m.nom}
            </option>
          ))}
        </Select>
      </Field>

      <Field label="Objectifs du stage" htmlFor="objectifs_stage">
        <Textarea
          id="objectifs_stage"
          name="objectifs_stage"
          defaultValue={valeurs?.objectifs_stage ?? ""}
          rows={3}
          placeholder="Missions et compétences visées…"
        />
      </Field>

      <div className="flex justify-end gap-2 pt-2">
        <Button
          type="button"
          variante="contour"
          onClick={() => (apresSucces ? apresSucces() : router.back())}
          disabled={enCours}
        >
          Annuler
        </Button>
        <Button type="submit" enChargement={enCours}>
          {estEdition ? "Enregistrer" : "Créer le stagiaire"}
        </Button>
      </div>
    </form>
  );
}
