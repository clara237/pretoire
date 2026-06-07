"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Plus, Trash2, ShieldAlert, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input, Field } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select } from "@/components/ui/select";
import { Modal } from "@/components/ui/modal";
import { Badge } from "@/components/ui/badge";
import {
  creerDossier,
  type DonneesDossier,
  type PartieSaisie,
  type ConflitDetecte,
} from "@/lib/actions/dossiers";
import {
  TYPES_AFFAIRE,
  LIBELLE_TYPE_AFFAIRE,
  STATUTS_DOSSIER,
  LIBELLE_STATUT,
  TYPES_PARTIE,
  LIBELLE_TYPE_PARTIE,
} from "@/lib/queries/dossiers-labels";

export interface OptionSimple {
  value: string;
  label: string;
}

interface LignePartie extends PartieSaisie {
  cle: string;
}

let compteur = 0;
function nouvelleLigne(type = "demandeur"): LignePartie {
  compteur += 1;
  return { cle: `p-${compteur}`, nom: "", type, avocat_adverse: "", contact: "" };
}

export function DossierForm({
  clients,
  avocats,
  clientParDefaut,
}: {
  clients: OptionSimple[];
  avocats: OptionSimple[];
  clientParDefaut?: string;
}) {
  const router = useRouter();
  const [chargement, setChargement] = React.useState(false);
  const [erreur, setErreur] = React.useState<string | null>(null);
  const [conflits, setConflits] = React.useState<ConflitDetecte[] | null>(null);

  const [form, setForm] = React.useState<DonneesDossier>({
    titre: "",
    type_affaire: "civil",
    statut: "ouvert",
    client_id: clientParDefaut ?? "",
    avocat_responsable_id: "",
    tribunal: "",
    chambre: "",
    numero_role: "",
    description_faits: "",
    pretentions: "",
    moyens: "",
    montant_enjeu: "",
    date_ouverture: new Date().toISOString().slice(0, 10),
    date_cloture_prev: "",
  });

  const [parties, setParties] = React.useState<LignePartie[]>([
    nouvelleLigne("demandeur"),
    nouvelleLigne("defendeur"),
  ]);

  function maj<K extends keyof DonneesDossier>(cle: K, valeur: DonneesDossier[K]) {
    setForm((f) => ({ ...f, [cle]: valeur }));
  }

  function majPartie(cle: string, champ: keyof PartieSaisie, valeur: string) {
    setParties((ps) =>
      ps.map((p) => (p.cle === cle ? { ...p, [champ]: valeur } : p)),
    );
  }

  async function envoyer(ignorerConflits: boolean) {
    setChargement(true);
    setErreur(null);
    const partiesPayload: PartieSaisie[] = parties
      .filter((p) => p.nom.trim())
      .map((p) => ({
        nom: p.nom,
        type: p.type,
        avocat_adverse: p.avocat_adverse,
        contact: p.contact,
      }));
    const res = await creerDossier(form, partiesPayload, ignorerConflits);
    setChargement(false);

    if (!res.ok && res.conflits && res.conflits.length > 0) {
      setConflits(res.conflits);
      return;
    }
    if (!res.ok) {
      setErreur(res.message ?? "Une erreur est survenue.");
      toast.error(res.message ?? "Une erreur est survenue.");
      return;
    }
    toast.success("Dossier créé.");
    router.push(`/dossiers/${res.id}`);
    router.refresh();
  }

  async function soumettre(e: React.FormEvent) {
    e.preventDefault();
    if (!form.titre?.trim()) {
      setErreur("L'intitulé du dossier est obligatoire.");
      return;
    }
    await envoyer(false);
  }

  return (
    <>
      <form onSubmit={soumettre} className="space-y-8">
        {/* Identification */}
        <section className="space-y-4">
          <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
            Identification
          </h3>
          <Field label="Intitulé du dossier" htmlFor="titre" requis>
            <Input
              id="titre"
              value={form.titre}
              onChange={(e) => maj("titre", e.target.value)}
              placeholder="Ex. Mbarga c/ Société NOVA"
              required
            />
          </Field>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field label="Type d'affaire" htmlFor="type" requis>
              <Select
                id="type"
                value={form.type_affaire}
                onChange={(e) => maj("type_affaire", e.target.value)}
                options={TYPES_AFFAIRE.map((t) => ({
                  value: t,
                  label: LIBELLE_TYPE_AFFAIRE[t],
                }))}
              />
            </Field>
            <Field label="Statut" htmlFor="statut">
              <Select
                id="statut"
                value={form.statut}
                onChange={(e) => maj("statut", e.target.value)}
                options={STATUTS_DOSSIER.map((s) => ({
                  value: s,
                  label: LIBELLE_STATUT[s],
                }))}
              />
            </Field>
            <Field label="Client" htmlFor="client">
              <Select
                id="client"
                value={form.client_id ?? ""}
                onChange={(e) => maj("client_id", e.target.value)}
                options={[{ value: "", label: "— Sélectionner un client —" }, ...clients]}
              />
            </Field>
            <Field label="Avocat responsable" htmlFor="avocat">
              <Select
                id="avocat"
                value={form.avocat_responsable_id ?? ""}
                onChange={(e) => maj("avocat_responsable_id", e.target.value)}
                options={[{ value: "", label: "— Sélectionner un avocat —" }, ...avocats]}
              />
            </Field>
          </div>
        </section>

        {/* Juridiction */}
        <section className="space-y-4">
          <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
            Juridiction
          </h3>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <Field label="Tribunal / juridiction" htmlFor="tribunal" className="sm:col-span-3">
              <Input
                id="tribunal"
                value={form.tribunal ?? ""}
                onChange={(e) => maj("tribunal", e.target.value)}
                placeholder="Ex. Tribunal de Première Instance de Yaoundé"
              />
            </Field>
            <Field label="Chambre" htmlFor="chambre">
              <Input
                id="chambre"
                value={form.chambre ?? ""}
                onChange={(e) => maj("chambre", e.target.value)}
                placeholder="Chambre civile"
              />
            </Field>
            <Field label="Numéro de rôle" htmlFor="role">
              <Input
                id="role"
                value={form.numero_role ?? ""}
                onChange={(e) => maj("numero_role", e.target.value)}
                placeholder="RG-2026-0142"
              />
            </Field>
            <Field label="Montant en jeu (FCFA)" htmlFor="enjeu">
              <Input
                id="enjeu"
                inputMode="numeric"
                value={String(form.montant_enjeu ?? "")}
                onChange={(e) => maj("montant_enjeu", e.target.value)}
                placeholder="12000000"
              />
            </Field>
            <Field label="Date d'ouverture" htmlFor="ouverture">
              <Input
                id="ouverture"
                type="date"
                value={form.date_ouverture ?? ""}
                onChange={(e) => maj("date_ouverture", e.target.value)}
              />
            </Field>
            <Field label="Clôture prévue" htmlFor="cloture">
              <Input
                id="cloture"
                type="date"
                value={form.date_cloture_prev ?? ""}
                onChange={(e) => maj("date_cloture_prev", e.target.value)}
              />
            </Field>
          </div>
        </section>

        {/* Parties */}
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
              Parties
            </h3>
            <Button
              type="button"
              variante="contour"
              taille="sm"
              iconeGauche={<Plus className="h-4 w-4" />}
              onClick={() => setParties((ps) => [...ps, nouvelleLigne("tiers")])}
            >
              Ajouter une partie
            </Button>
          </div>
          <div className="flex items-start gap-2 rounded-DEFAULT border border-blue-500/20 bg-blue-500/5 p-3 text-xs text-muted-foreground">
            <ShieldAlert className="mt-0.5 h-4 w-4 shrink-0 text-blue-500" />
            <p>
              Les parties adverses (défendeur, tiers) sont automatiquement
              vérifiées pour détecter d&apos;éventuels conflits d&apos;intérêts à
              la création.
            </p>
          </div>

          <div className="space-y-3">
            {parties.map((p) => (
              <div
                key={p.cle}
                className="grid grid-cols-1 gap-3 rounded-lg border border-border p-3 sm:grid-cols-12"
              >
                <div className="sm:col-span-3">
                  <Select
                    value={p.type}
                    onChange={(e) => majPartie(p.cle, "type", e.target.value)}
                    options={TYPES_PARTIE.map((t) => ({
                      value: t,
                      label: LIBELLE_TYPE_PARTIE[t],
                    }))}
                  />
                </div>
                <div className="sm:col-span-4">
                  <Input
                    value={p.nom}
                    onChange={(e) => majPartie(p.cle, "nom", e.target.value)}
                    placeholder="Nom de la partie"
                  />
                </div>
                <div className="sm:col-span-2">
                  <Input
                    value={p.avocat_adverse ?? ""}
                    onChange={(e) =>
                      majPartie(p.cle, "avocat_adverse", e.target.value)
                    }
                    placeholder="Avocat adverse"
                  />
                </div>
                <div className="sm:col-span-2">
                  <Input
                    value={p.contact ?? ""}
                    onChange={(e) => majPartie(p.cle, "contact", e.target.value)}
                    placeholder="Contact"
                  />
                </div>
                <div className="flex items-center justify-end sm:col-span-1">
                  <Button
                    type="button"
                    variante="fantome"
                    taille="icone"
                    aria-label="Retirer"
                    onClick={() =>
                      setParties((ps) => ps.filter((x) => x.cle !== p.cle))
                    }
                  >
                    <Trash2 className="h-4 w-4 text-muted-foreground" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Exposé */}
        <section className="space-y-4">
          <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
            Exposé de l&apos;affaire
          </h3>
          <Field label="Description des faits" htmlFor="faits">
            <Textarea
              id="faits"
              value={form.description_faits ?? ""}
              onChange={(e) => maj("description_faits", e.target.value)}
              placeholder="Résumé des faits…"
            />
          </Field>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field label="Prétentions" htmlFor="pretentions">
              <Textarea
                id="pretentions"
                value={form.pretentions ?? ""}
                onChange={(e) => maj("pretentions", e.target.value)}
                placeholder="Ce que demande le client…"
              />
            </Field>
            <Field label="Moyens" htmlFor="moyens">
              <Textarea
                id="moyens"
                value={form.moyens ?? ""}
                onChange={(e) => maj("moyens", e.target.value)}
                placeholder="Fondements juridiques…"
              />
            </Field>
          </div>
        </section>

        {erreur && (
          <div className="rounded-DEFAULT border border-danger/20 bg-danger/10 px-3 py-2 text-sm text-danger">
            {erreur}
          </div>
        )}

        <div className="flex items-center gap-2">
          <Button type="submit" enChargement={chargement}>
            Créer le dossier
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
      </form>

      {/* Modal conflits d'intérêts */}
      <Modal
        ouvert={Boolean(conflits)}
        onClose={() => setConflits(null)}
        titre="Conflit d'intérêts potentiel"
        taille="lg"
        pied={
          <>
            <Button variante="contour" onClick={() => setConflits(null)}>
              Revoir les parties
            </Button>
            <Button
              variante="danger"
              enChargement={chargement}
              onClick={() => {
                setConflits(null);
                void envoyer(true);
              }}
            >
              Passer outre et créer
            </Button>
          </>
        }
      >
        <div className="space-y-3">
          <div className="flex items-start gap-2 rounded-DEFAULT border border-warning/30 bg-warning/10 p-3 text-sm text-foreground">
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-warning" />
            <p>
              Une ou plusieurs parties adverses saisies correspondent à des
              personnes déjà connues du cabinet. Vérifiez avant de poursuivre.
            </p>
          </div>
          <ul className="space-y-2">
            {(conflits ?? []).map((c, i) => (
              <li
                key={i}
                className="rounded-DEFAULT border border-border bg-muted/30 p-3 text-sm"
              >
                <div className="flex items-center gap-2">
                  <Badge ton={c.origine === "client" ? "danger" : "avertissement"}>
                    {c.origine === "client" ? "Client existant" : "Autre dossier"}
                  </Badge>
                  <span className="font-medium text-foreground">
                    {c.nomCorrespondant}
                  </span>
                </div>
                <p className="mt-1 text-xs text-muted-foreground">
                  Partie saisie « {c.nomSaisi} » — {c.detail}.
                </p>
              </li>
            ))}
          </ul>
        </div>
      </Modal>
    </>
  );
}
