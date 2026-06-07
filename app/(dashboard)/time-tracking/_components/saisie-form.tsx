"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Plus, Pencil } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input, Field } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select } from "@/components/ui/select";
import { Modal } from "@/components/ui/modal";
import {
  creerSaisie,
  modifierSaisie,
  type DonneesSaisie,
} from "@/lib/actions/temps";
import {
  TYPES_TACHE,
  LIBELLE_TYPE_TACHE,
} from "@/lib/finance-constants";

export interface OptionSel {
  value: string;
  label: string;
}

export interface SaisieInitiale {
  id?: string;
  profile_id?: string;
  dossier_id?: string | null;
  date?: string;
  type_tache?: string;
  description?: string | null;
  duree_heures?: number;
  taux_horaire?: number | null;
  facturable?: boolean;
}

const AUJOURDHUI = () => new Date().toISOString().slice(0, 10);

export function SaisieForm({
  profils,
  dossiers,
  tauxParProfil,
  profilCourantId,
  initiale,
  declencheur,
}: {
  profils: OptionSel[];
  dossiers: OptionSel[];
  /** Map profile_id -> taux horaire par défaut (depuis le profil). */
  tauxParProfil: Record<string, number | null>;
  profilCourantId?: string | null;
  initiale?: SaisieInitiale;
  /** Variante du bouton déclencheur. */
  declencheur?: "principal" | "ligne";
}) {
  const router = useRouter();
  const enEdition = Boolean(initiale?.id);
  const [ouvert, setOuvert] = React.useState(false);
  const [chargement, setChargement] = React.useState(false);

  const profilDefaut =
    initiale?.profile_id ?? profilCourantId ?? profils[0]?.value ?? "";

  const [form, setForm] = React.useState({
    profile_id: profilDefaut,
    dossier_id: initiale?.dossier_id ?? "",
    date: initiale?.date ?? AUJOURDHUI(),
    type_tache: initiale?.type_tache ?? "consultation",
    description: initiale?.description ?? "",
    duree_heures: initiale?.duree_heures != null ? String(initiale.duree_heures) : "",
    taux_horaire:
      initiale?.taux_horaire != null
        ? String(initiale.taux_horaire)
        : profilDefaut
          ? tauxParProfil[profilDefaut] != null
            ? String(tauxParProfil[profilDefaut])
            : ""
          : "",
    facturable: initiale?.facturable ?? true,
  });

  function maj<K extends keyof typeof form>(cle: K, valeur: (typeof form)[K]) {
    setForm((f) => ({ ...f, [cle]: valeur }));
  }

  // Pré-remplit le taux quand on change d'avocat (création uniquement, si vide).
  function changerProfil(id: string) {
    setForm((f) => {
      const tauxDefaut = tauxParProfil[id];
      const prochainTaux =
        !enEdition || !f.taux_horaire
          ? tauxDefaut != null
            ? String(tauxDefaut)
            : f.taux_horaire
          : f.taux_horaire;
      return { ...f, profile_id: id, taux_horaire: prochainTaux };
    });
  }

  async function soumettre(e: React.FormEvent) {
    e.preventDefault();
    const duree = Number(form.duree_heures.replace(",", "."));
    const taux = form.taux_horaire.trim()
      ? Number(form.taux_horaire.replace(/\s/g, "").replace(",", "."))
      : null;

    const payload: DonneesSaisie = {
      profile_id: form.profile_id,
      dossier_id: form.dossier_id || null,
      date: form.date,
      type_tache: form.type_tache,
      description: form.description || null,
      duree_heures: duree,
      taux_horaire: taux,
      facturable: form.facturable,
    };

    setChargement(true);
    const res = enEdition
      ? await modifierSaisie(initiale!.id!, payload)
      : await creerSaisie(payload);
    setChargement(false);

    if (!res.ok) {
      toast.error(res.message ?? "Une erreur est survenue.");
      return;
    }
    toast.success(enEdition ? "Saisie modifiée." : "Saisie enregistrée.");
    setOuvert(false);
    if (!enEdition) {
      setForm((f) => ({ ...f, description: "", duree_heures: "" }));
    }
    router.refresh();
  }

  return (
    <>
      {declencheur === "ligne" ? (
        <Button
          variante="fantome"
          taille="icone"
          aria-label="Modifier"
          title="Modifier"
          onClick={() => setOuvert(true)}
        >
          <Pencil className="h-4 w-4 text-muted-foreground" />
        </Button>
      ) : (
        <Button
          iconeGauche={<Plus className="h-4 w-4" />}
          onClick={() => setOuvert(true)}
        >
          Nouvelle saisie
        </Button>
      )}

      <Modal
        ouvert={ouvert}
        onClose={() => !chargement && setOuvert(false)}
        titre={enEdition ? "Modifier la saisie" : "Nouvelle saisie de temps"}
        taille="lg"
      >
        <form onSubmit={soumettre} className="space-y-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field label="Avocat" htmlFor="profile_id" requis>
              <Select
                id="profile_id"
                value={form.profile_id}
                onChange={(e) => changerProfil(e.target.value)}
                options={profils}
                required
              />
            </Field>
            <Field label="Date" htmlFor="date" requis>
              <Input
                id="date"
                type="date"
                value={form.date}
                onChange={(e) => maj("date", e.target.value)}
                required
              />
            </Field>
          </div>

          <Field label="Dossier" htmlFor="dossier_id" aide="Optionnel — temps non imputé à un dossier sinon.">
            <Select
              id="dossier_id"
              value={form.dossier_id}
              onChange={(e) => maj("dossier_id", e.target.value)}
              placeholder="Aucun dossier"
              options={dossiers}
            />
          </Field>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <Field label="Type de tâche" htmlFor="type_tache" requis>
              <Select
                id="type_tache"
                value={form.type_tache}
                onChange={(e) => maj("type_tache", e.target.value)}
                options={TYPES_TACHE.map((t) => ({
                  value: t,
                  label: LIBELLE_TYPE_TACHE[t],
                }))}
                required
              />
            </Field>
            <Field label="Durée (heures)" htmlFor="duree" requis aide="Ex. 1,5 pour 1h30.">
              <Input
                id="duree"
                inputMode="decimal"
                value={form.duree_heures}
                onChange={(e) => maj("duree_heures", e.target.value)}
                placeholder="2"
                required
              />
            </Field>
            <Field label="Taux horaire (FCFA)" htmlFor="taux" aide="Pré-rempli, modifiable.">
              <Input
                id="taux"
                inputMode="numeric"
                value={form.taux_horaire}
                onChange={(e) => maj("taux_horaire", e.target.value)}
                placeholder="50000"
              />
            </Field>
          </div>

          <Field label="Description" htmlFor="description">
            <Textarea
              id="description"
              rows={3}
              value={form.description}
              onChange={(e) => maj("description", e.target.value)}
              placeholder="Détail de la prestation effectuée…"
            />
          </Field>

          <label className="flex items-center gap-2 text-sm text-foreground">
            <input
              type="checkbox"
              checked={form.facturable}
              onChange={(e) => maj("facturable", e.target.checked)}
              className="h-4 w-4 rounded border-input accent-[var(--couleur-principale)]"
            />
            Temps facturable au client
          </label>

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
              {enEdition ? "Enregistrer" : "Ajouter la saisie"}
            </Button>
          </div>
        </form>
      </Modal>
    </>
  );
}
