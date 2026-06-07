"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Plus, Trash2, Users, Scale, Phone } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input, Field } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Modal, ConfirmDialog } from "@/components/ui/modal";
import { EmptyState } from "@/components/ui/empty-state";
import {
  TYPES_PARTIE,
  LIBELLE_TYPE_PARTIE,
  TON_TYPE_PARTIE,
} from "@/lib/queries/dossiers-labels";
import { ajouterPartie, supprimerPartie } from "@/lib/actions/dossiers";

export interface Partie {
  id: string;
  nom: string;
  type: string;
  avocat_adverse: string | null;
  contact: string | null;
}

export function OngletParties({
  dossierId,
  parties,
  peutEditer,
}: {
  dossierId: string;
  parties: Partie[];
  peutEditer: boolean;
}) {
  const router = useRouter();
  const [ajoutOuvert, setAjoutOuvert] = React.useState(false);
  const [chargement, setChargement] = React.useState(false);
  const [aSupprimer, setASupprimer] = React.useState<Partie | null>(null);
  const [suppression, setSuppression] = React.useState(false);

  const [form, setForm] = React.useState({
    nom: "",
    type: "tiers",
    avocat_adverse: "",
    contact: "",
  });

  async function ajouter(e: React.FormEvent) {
    e.preventDefault();
    setChargement(true);
    const res = await ajouterPartie(dossierId, form);
    setChargement(false);
    if (!res.ok) {
      toast.error(res.message ?? "Ajout impossible.");
      return;
    }
    toast.success("Partie ajoutée.");
    setForm({ nom: "", type: "tiers", avocat_adverse: "", contact: "" });
    setAjoutOuvert(false);
    router.refresh();
  }

  async function confirmerSuppression() {
    if (!aSupprimer) return;
    setSuppression(true);
    const res = await supprimerPartie(aSupprimer.id, dossierId);
    setSuppression(false);
    if (!res.ok) {
      toast.error(res.message ?? "Suppression impossible.");
      setASupprimer(null);
      return;
    }
    toast.success("Partie supprimée.");
    setASupprimer(null);
    router.refresh();
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-base font-semibold text-foreground">
          Parties au dossier
        </h2>
        {peutEditer && (
          <Button
            taille="sm"
            iconeGauche={<Plus className="h-4 w-4" />}
            onClick={() => setAjoutOuvert(true)}
          >
            Ajouter une partie
          </Button>
        )}
      </div>

      {parties.length === 0 ? (
        <EmptyState
          titre="Aucune partie"
          description="Ajoutez les demandeurs, défendeurs et tiers du dossier."
          icone={Users}
          action={
            peutEditer ? (
              <Button taille="sm" onClick={() => setAjoutOuvert(true)}>
                Ajouter une partie
              </Button>
            ) : undefined
          }
        />
      ) : (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {parties.map((p) => (
            <div
              key={p.id}
              className="flex items-start justify-between gap-3 rounded-lg border border-border bg-card p-4"
            >
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <Badge ton={TON_TYPE_PARTIE[p.type] ?? "neutre"}>
                    {LIBELLE_TYPE_PARTIE[p.type] ?? p.type}
                  </Badge>
                </div>
                <p className="mt-1.5 font-medium text-foreground">{p.nom}</p>
                {p.avocat_adverse && (
                  <p className="mt-1 flex items-center gap-1.5 text-xs text-muted-foreground">
                    <Scale className="h-3 w-3" />
                    Avocat adverse : {p.avocat_adverse}
                  </p>
                )}
                {p.contact && (
                  <p className="mt-0.5 flex items-center gap-1.5 text-xs text-muted-foreground">
                    <Phone className="h-3 w-3" />
                    {p.contact}
                  </p>
                )}
              </div>
              {peutEditer && (
                <Button
                  variante="fantome"
                  taille="icone"
                  aria-label="Supprimer"
                  onClick={() => setASupprimer(p)}
                >
                  <Trash2 className="h-4 w-4 text-muted-foreground" />
                </Button>
              )}
            </div>
          ))}
        </div>
      )}

      <Modal
        ouvert={ajoutOuvert}
        onClose={() => setAjoutOuvert(false)}
        titre="Ajouter une partie"
        taille="md"
      >
        <form onSubmit={ajouter} className="space-y-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field label="Qualité" htmlFor="p-type">
              <Select
                id="p-type"
                value={form.type}
                onChange={(e) => setForm((f) => ({ ...f, type: e.target.value }))}
                options={TYPES_PARTIE.map((t) => ({
                  value: t,
                  label: LIBELLE_TYPE_PARTIE[t],
                }))}
              />
            </Field>
            <Field label="Nom" htmlFor="p-nom" requis>
              <Input
                id="p-nom"
                value={form.nom}
                onChange={(e) => setForm((f) => ({ ...f, nom: e.target.value }))}
                placeholder="Nom de la partie"
                required
              />
            </Field>
            <Field label="Avocat adverse" htmlFor="p-av">
              <Input
                id="p-av"
                value={form.avocat_adverse}
                onChange={(e) =>
                  setForm((f) => ({ ...f, avocat_adverse: e.target.value }))
                }
                placeholder="Me …"
              />
            </Field>
            <Field label="Contact" htmlFor="p-contact">
              <Input
                id="p-contact"
                value={form.contact}
                onChange={(e) =>
                  setForm((f) => ({ ...f, contact: e.target.value }))
                }
                placeholder="Téléphone / email"
              />
            </Field>
          </div>
          <div className="flex justify-end gap-2">
            <Button
              type="button"
              variante="contour"
              onClick={() => setAjoutOuvert(false)}
              disabled={chargement}
            >
              Annuler
            </Button>
            <Button type="submit" enChargement={chargement}>
              Ajouter
            </Button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog
        ouvert={Boolean(aSupprimer)}
        onClose={() => setASupprimer(null)}
        onConfirm={confirmerSuppression}
        enChargement={suppression}
        titre="Supprimer la partie"
        message={`Retirer « ${aSupprimer?.nom ?? ""} » du dossier ?`}
      />
    </div>
  );
}
