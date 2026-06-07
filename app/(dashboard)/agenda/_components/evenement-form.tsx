"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input, Field } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select } from "@/components/ui/select";
import { ConfirmDialog } from "@/components/ui/modal";
import { TYPES_EVENEMENT } from "../_lib/evenements";
import type { TypeEvenement } from "@/lib/actions/agenda";
import {
  creerEvenement,
  modifierEvenement,
  detecterConflit,
} from "@/lib/actions/agenda";

export interface OptionDossier {
  id: string;
  numero: string;
  titre: string;
}
export interface OptionProfile {
  id: string;
  nom: string;
  prenom: string;
}

export interface ValeursEvenement {
  id?: string;
  titre?: string;
  type?: TypeEvenement;
  description?: string | null;
  lieu?: string | null;
  dossier_id?: string | null;
  profile_id?: string | null;
  date_debut?: string | null;
  date_fin?: string | null;
  tribunal?: string | null;
  chambre?: string | null;
  numero_role?: string | null;
  rappel_j7?: boolean | null;
  rappel_j3?: boolean | null;
  rappel_j1?: boolean | null;
}

/** Convertit une date ISO en valeur d'<input type="datetime-local">. */
function toLocalInput(iso?: string | null): string {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(
    d.getHours(),
  )}:${pad(d.getMinutes())}`;
}

export function EvenementForm({
  dossiers,
  profiles,
  valeurs,
  apresSucces,
  dateDefaut,
}: {
  dossiers: OptionDossier[];
  profiles: OptionProfile[];
  valeurs?: ValeursEvenement;
  apresSucces?: () => void;
  dateDefaut?: string;
}) {
  const router = useRouter();
  const estEdition = Boolean(valeurs?.id);
  const [type, setType] = React.useState<TypeEvenement>(valeurs?.type ?? "rdv");
  const [enCours, setEnCours] = React.useState(false);
  const [formEnAttente, setFormEnAttente] = React.useState<FormData | null>(null);
  const [conflit, setConflit] = React.useState<{
    titre: string;
    date_debut: string;
  } | null>(null);

  async function enregistrer(formData: FormData) {
    setEnCours(true);
    const res = estEdition
      ? await modifierEvenement(valeurs!.id!, formData)
      : await creerEvenement(formData);
    setEnCours(false);

    if (res.ok) {
      toast.success(estEdition ? "Événement modifié." : "Événement créé.");
      if (apresSucces) apresSucces();
      else router.push("/agenda");
      router.refresh();
    } else {
      toast.error(res.message ?? "Une erreur est survenue.");
    }
  }

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);

    const profileId = (formData.get("profile_id") as string) || null;
    const dateDebutBrute = (formData.get("date_debut") as string) || "";
    const dateFinBrute = (formData.get("date_fin") as string) || "";

    if (profileId && dateDebutBrute) {
      setEnCours(true);
      const dateDebut = new Date(dateDebutBrute).toISOString();
      const dateFin = dateFinBrute
        ? new Date(dateFinBrute).toISOString()
        : null;
      const rc = await detecterConflit(
        profileId,
        dateDebut,
        dateFin,
        valeurs?.id,
      );
      setEnCours(false);
      if (rc.conflit && rc.avec) {
        setConflit(rc.avec);
        setFormEnAttente(formData);
        return;
      }
    }

    await enregistrer(formData);
  }

  function dateLisible(iso: string): string {
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return iso;
    return d.toLocaleString("fr-FR", {
      dateStyle: "medium",
      timeStyle: "short",
    });
  }

  const dateDebutDefaut =
    toLocalInput(valeurs?.date_debut) ||
    (dateDefaut ? `${dateDefaut}T09:00` : "");

  return (
    <>
    <ConfirmDialog
      ouvert={conflit !== null}
      onClose={() => {
        setConflit(null);
        setFormEnAttente(null);
      }}
      onConfirm={async () => {
        const fd = formEnAttente;
        setConflit(null);
        setFormEnAttente(null);
        if (fd) await enregistrer(fd);
      }}
      titre="Conflit d'agenda"
      message={
        conflit
          ? `Cet intervenant a déjà « ${conflit.titre} » le ${dateLisible(
              conflit.date_debut,
            )}, qui chevauche ce créneau. Créer quand même ?`
          : ""
      }
      texteConfirmer="Créer quand même"
      texteAnnuler="Annuler"
      destructif={false}
      enChargement={enCours}
    />
    <form onSubmit={onSubmit} className="space-y-4">
      <Field label="Titre" htmlFor="titre" requis>
        <Input
          id="titre"
          name="titre"
          defaultValue={valeurs?.titre ?? ""}
          placeholder="Ex. RDV client, Audience TPI…"
          required
        />
      </Field>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Field label="Type" htmlFor="type" requis>
          <Select
            id="type"
            name="type"
            value={type}
            onChange={(e) => setType(e.target.value as TypeEvenement)}
            options={TYPES_EVENEMENT}
          />
        </Field>
        <Field label="Dossier lié" htmlFor="dossier_id">
          <Select
            id="dossier_id"
            name="dossier_id"
            defaultValue={valeurs?.dossier_id ?? ""}
          >
            <option value="">— Aucun —</option>
            {dossiers.map((d) => (
              <option key={d.id} value={d.id}>
                {d.numero} · {d.titre}
              </option>
            ))}
          </Select>
        </Field>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Field label="Début" htmlFor="date_debut" requis>
          <Input
            id="date_debut"
            name="date_debut"
            type="datetime-local"
            defaultValue={dateDebutDefaut}
            required
          />
        </Field>
        <Field
          label="Fin"
          htmlFor="date_fin"
          aide={type === "deadline" ? "Optionnel pour une échéance." : undefined}
        >
          <Input
            id="date_fin"
            name="date_fin"
            type="datetime-local"
            defaultValue={toLocalInput(valeurs?.date_fin)}
          />
        </Field>
      </div>

      {/* Champs conditionnels — AUDIENCE */}
      {type === "audience" && (
        <div className="rounded-DEFAULT border border-border bg-muted/30 p-4 space-y-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Informations d&apos;audience
          </p>
          <Field label="Tribunal / juridiction" htmlFor="tribunal">
            <Input
              id="tribunal"
              name="tribunal"
              defaultValue={valeurs?.tribunal ?? ""}
              placeholder="Ex. TPI Yaoundé"
            />
          </Field>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field label="Chambre" htmlFor="chambre">
              <Input
                id="chambre"
                name="chambre"
                defaultValue={valeurs?.chambre ?? ""}
                placeholder="Ex. Chambre civile"
              />
            </Field>
            <Field label="Numéro de rôle" htmlFor="numero_role">
              <Input
                id="numero_role"
                name="numero_role"
                defaultValue={valeurs?.numero_role ?? ""}
                placeholder="Ex. RG 1234/2026"
              />
            </Field>
          </div>
        </div>
      )}

      {/* Champs conditionnels — RDV / DÉPLACEMENT / RÉUNION : lieu */}
      {type !== "audience" && type !== "deadline" && (
        <Field label="Lieu" htmlFor="lieu">
          <Input
            id="lieu"
            name="lieu"
            defaultValue={valeurs?.lieu ?? ""}
            placeholder="Ex. Cabinet — Mvogbi"
          />
        </Field>
      )}

      <Field label="Intervenant (avocat)" htmlFor="profile_id">
        <Select
          id="profile_id"
          name="profile_id"
          defaultValue={valeurs?.profile_id ?? ""}
        >
          <option value="">— Aucun —</option>
          {profiles.map((p) => (
            <option key={p.id} value={p.id}>
              {p.prenom} {p.nom}
            </option>
          ))}
        </Select>
      </Field>

      <Field label="Description" htmlFor="description">
        <Textarea
          id="description"
          name="description"
          defaultValue={valeurs?.description ?? ""}
          rows={3}
          placeholder="Précisions, ordre du jour…"
        />
      </Field>

      {/* Rappels — pertinents surtout pour les échéances */}
      <div className="rounded-DEFAULT border border-border p-4">
        <p className="mb-2 text-sm font-medium text-foreground">
          Rappels automatiques
        </p>
        <p className="mb-3 text-xs text-muted-foreground">
          Pour les délais de procédure : génère une notification quand l&apos;échéance
          approche.
        </p>
        <div className="flex flex-wrap gap-4">
          {(
            [
              ["rappel_j7", "J-7", valeurs?.rappel_j7],
              ["rappel_j3", "J-3", valeurs?.rappel_j3],
              ["rappel_j1", "J-1", valeurs?.rappel_j1],
            ] as const
          ).map(([name, label, def]) => (
            <label
              key={name}
              className="inline-flex items-center gap-2 text-sm text-foreground"
            >
              <input
                type="checkbox"
                name={name}
                defaultChecked={
                  def ?? (type === "deadline" && !estEdition ? true : false)
                }
                className="h-4 w-4 rounded border-input accent-[color:var(--principale,#007A5E)]"
              />
              {label}
            </label>
          ))}
        </div>
      </div>

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
          {estEdition ? "Enregistrer" : "Créer l'événement"}
        </Button>
      </div>
    </form>
    </>
  );
}
