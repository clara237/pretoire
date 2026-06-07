"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Plus, Trash2, UsersRound, GraduationCap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input, Field } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Avatar } from "@/components/ui/avatar";
import { Modal, ConfirmDialog } from "@/components/ui/modal";
import { EmptyState } from "@/components/ui/empty-state";
import {
  ajouterMembreEquipe,
  retirerMembreEquipe,
  affecterStagiaire,
  retirerStagiaire,
} from "@/lib/actions/dossiers";

export interface MembreEquipe {
  id: string;
  role_dans_dossier: string | null;
  profile: { id: string; nom: string; prenom: string; photo_url: string | null } | null;
}

export interface StagiaireAffecte {
  id: string;
  date_affectation: string | null;
  stagiaire: { id: string; nom: string; prenom: string; universite: string | null } | null;
}

export interface OptionPersonne {
  value: string;
  label: string;
}

export function OngletEquipe({
  dossierId,
  membres,
  stagiairesAffectes,
  avocatsDispo,
  stagiairesDispo,
  peutEditer,
}: {
  dossierId: string;
  membres: MembreEquipe[];
  stagiairesAffectes: StagiaireAffecte[];
  avocatsDispo: OptionPersonne[];
  stagiairesDispo: OptionPersonne[];
  peutEditer: boolean;
}) {
  const router = useRouter();
  const [avocatOuvert, setAvocatOuvert] = React.useState(false);
  const [stagiaireOuvert, setStagiaireOuvert] = React.useState(false);
  const [chargement, setChargement] = React.useState(false);
  const [aRetirer, setARetirer] = React.useState<
    { type: "avocat" | "stagiaire"; id: string; nom: string } | null
  >(null);
  const [retrait, setRetrait] = React.useState(false);

  const [avocatId, setAvocatId] = React.useState("");
  const [roleDossier, setRoleDossier] = React.useState("Collaborateur");
  const [stagiaireId, setStagiaireId] = React.useState("");

  async function ajouterAvocat(e: React.FormEvent) {
    e.preventDefault();
    setChargement(true);
    const res = await ajouterMembreEquipe(dossierId, avocatId, roleDossier);
    setChargement(false);
    if (!res.ok) {
      toast.error(res.message ?? "Ajout impossible.");
      return;
    }
    toast.success("Membre ajouté à l'équipe.");
    setAvocatId("");
    setRoleDossier("Collaborateur");
    setAvocatOuvert(false);
    router.refresh();
  }

  async function ajouterStagiaire(e: React.FormEvent) {
    e.preventDefault();
    setChargement(true);
    const res = await affecterStagiaire(dossierId, stagiaireId);
    setChargement(false);
    if (!res.ok) {
      toast.error(res.message ?? "Affectation impossible.");
      return;
    }
    toast.success("Stagiaire affecté.");
    setStagiaireId("");
    setStagiaireOuvert(false);
    router.refresh();
  }

  async function confirmerRetrait() {
    if (!aRetirer) return;
    setRetrait(true);
    const res =
      aRetirer.type === "avocat"
        ? await retirerMembreEquipe(aRetirer.id, dossierId)
        : await retirerStagiaire(aRetirer.id, dossierId);
    setRetrait(false);
    if (!res.ok) {
      toast.error(res.message ?? "Retrait impossible.");
      setARetirer(null);
      return;
    }
    toast.success("Retiré du dossier.");
    setARetirer(null);
    router.refresh();
  }

  return (
    <div className="space-y-8">
      {/* Avocats */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="flex items-center gap-2 text-base font-semibold text-foreground">
            <UsersRound className="h-4 w-4 text-principale" />
            Avocats du dossier
          </h2>
          {peutEditer && (
            <Button
              taille="sm"
              variante="contour"
              iconeGauche={<Plus className="h-4 w-4" />}
              onClick={() => setAvocatOuvert(true)}
            >
              Ajouter un avocat
            </Button>
          )}
        </div>

        {membres.length === 0 ? (
          <EmptyState
            titre="Aucun avocat affecté"
            description="Constituez l'équipe en charge du dossier."
            icone={UsersRound}
          />
        ) : (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {membres.map((m) => (
              <div
                key={m.id}
                className="flex items-center justify-between gap-3 rounded-lg border border-border bg-card p-3"
              >
                <div className="flex min-w-0 items-center gap-3">
                  <Avatar
                    prenom={m.profile?.prenom}
                    nom={m.profile?.nom}
                    src={m.profile?.photo_url}
                  />
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-foreground">
                      {m.profile
                        ? `${m.profile.prenom} ${m.profile.nom}`
                        : "Avocat"}
                    </p>
                    <p className="truncate text-xs text-muted-foreground">
                      {m.role_dans_dossier || "Membre"}
                    </p>
                  </div>
                </div>
                {peutEditer && (
                  <Button
                    variante="fantome"
                    taille="icone"
                    aria-label="Retirer"
                    onClick={() =>
                      setARetirer({
                        type: "avocat",
                        id: m.id,
                        nom: m.profile
                          ? `${m.profile.prenom} ${m.profile.nom}`
                          : "ce membre",
                      })
                    }
                  >
                    <Trash2 className="h-4 w-4 text-muted-foreground" />
                  </Button>
                )}
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Stagiaires */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="flex items-center gap-2 text-base font-semibold text-foreground">
            <GraduationCap className="h-4 w-4 text-principale" />
            Stagiaires affectés
          </h2>
          {peutEditer && (
            <Button
              taille="sm"
              variante="contour"
              iconeGauche={<Plus className="h-4 w-4" />}
              onClick={() => setStagiaireOuvert(true)}
            >
              Affecter un stagiaire
            </Button>
          )}
        </div>

        {stagiairesAffectes.length === 0 ? (
          <EmptyState
            titre="Aucun stagiaire"
            description="Affectez des stagiaires en supervision sur ce dossier."
            icone={GraduationCap}
          />
        ) : (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {stagiairesAffectes.map((s) => (
              <div
                key={s.id}
                className="flex items-center justify-between gap-3 rounded-lg border border-border bg-card p-3"
              >
                <div className="flex min-w-0 items-center gap-3">
                  <Avatar
                    prenom={s.stagiaire?.prenom}
                    nom={s.stagiaire?.nom}
                  />
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-foreground">
                      {s.stagiaire
                        ? `${s.stagiaire.prenom} ${s.stagiaire.nom}`
                        : "Stagiaire"}
                    </p>
                    <p className="truncate text-xs text-muted-foreground">
                      {s.stagiaire?.universite || "—"}
                    </p>
                  </div>
                </div>
                {peutEditer && (
                  <Button
                    variante="fantome"
                    taille="icone"
                    aria-label="Retirer"
                    onClick={() =>
                      setARetirer({
                        type: "stagiaire",
                        id: s.id,
                        nom: s.stagiaire
                          ? `${s.stagiaire.prenom} ${s.stagiaire.nom}`
                          : "ce stagiaire",
                      })
                    }
                  >
                    <Trash2 className="h-4 w-4 text-muted-foreground" />
                  </Button>
                )}
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Modal ajout avocat */}
      <Modal
        ouvert={avocatOuvert}
        onClose={() => setAvocatOuvert(false)}
        titre="Ajouter un avocat à l'équipe"
        taille="md"
      >
        <form onSubmit={ajouterAvocat} className="space-y-4">
          <Field label="Avocat" htmlFor="e-avocat" requis>
            <Select
              id="e-avocat"
              value={avocatId}
              onChange={(e) => setAvocatId(e.target.value)}
              placeholder="Sélectionner un avocat"
              options={avocatsDispo}
              required
            />
          </Field>
          <Field label="Rôle dans le dossier" htmlFor="e-role">
            <Input
              id="e-role"
              value={roleDossier}
              onChange={(e) => setRoleDossier(e.target.value)}
              placeholder="Ex. Collaborateur, Associé…"
            />
          </Field>
          <div className="flex justify-end gap-2">
            <Button
              type="button"
              variante="contour"
              onClick={() => setAvocatOuvert(false)}
              disabled={chargement}
            >
              Annuler
            </Button>
            <Button type="submit" enChargement={chargement} disabled={!avocatId}>
              Ajouter
            </Button>
          </div>
        </form>
      </Modal>

      {/* Modal affectation stagiaire */}
      <Modal
        ouvert={stagiaireOuvert}
        onClose={() => setStagiaireOuvert(false)}
        titre="Affecter un stagiaire"
        taille="md"
      >
        <form onSubmit={ajouterStagiaire} className="space-y-4">
          <Field label="Stagiaire" htmlFor="e-stagiaire" requis>
            <Select
              id="e-stagiaire"
              value={stagiaireId}
              onChange={(e) => setStagiaireId(e.target.value)}
              placeholder="Sélectionner un stagiaire"
              options={stagiairesDispo}
              required
            />
          </Field>
          <div className="flex justify-end gap-2">
            <Button
              type="button"
              variante="contour"
              onClick={() => setStagiaireOuvert(false)}
              disabled={chargement}
            >
              Annuler
            </Button>
            <Button
              type="submit"
              enChargement={chargement}
              disabled={!stagiaireId}
            >
              Affecter
            </Button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog
        ouvert={Boolean(aRetirer)}
        onClose={() => setARetirer(null)}
        onConfirm={confirmerRetrait}
        enChargement={retrait}
        titre="Retirer du dossier"
        message={`Retirer ${aRetirer?.nom ?? ""} du dossier ?`}
        texteConfirmer="Retirer"
      />
    </div>
  );
}
