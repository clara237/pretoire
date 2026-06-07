"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Clock, Banknote, ListPlus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input, Field } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select } from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { cn, formatFCFA, formatDate, formatHeures } from "@/lib/utils";
import {
  creerFactureDepuisTemps,
  creerFactureMontant,
  creerFactureLignes,
  chargerSaisiesFacturables,
  type SaisieFacturableLigne,
} from "@/lib/actions/factures";
import {
  LIBELLE_TYPE_TACHE as LIBELLE_TACHE,
  CATEGORIES_LIGNE_FACTURE,
  LIBELLE_CATEGORIE_LIGNE,
} from "@/lib/finance-constants";

interface Option {
  value: string;
  label: string;
}

interface LigneSaisie {
  libelle: string;
  categorie: string;
  quantite: string;
  montant_unitaire: string;
}

// Options de catégorie pour le mode « lignes détaillées ».
const OPTIONS_CATEGORIE: Option[] = CATEGORIES_LIGNE_FACTURE.map((c) => ({
  value: c,
  label: LIBELLE_CATEGORIE_LIGNE[c],
}));

function datePlus(jours: number): string {
  const d = new Date();
  d.setDate(d.getDate() + jours);
  return d.toISOString().slice(0, 10);
}

export function FactureCreation({
  clients,
  dossiers,
  tvaApplicable,
  tauxTva,
  devise,
  fraisOuverture,
  dossierParDefaut,
}: {
  clients: Option[];
  dossiers: Option[];
  tvaApplicable: boolean;
  tauxTva: number;
  devise: string;
  fraisOuverture: number;
  dossierParDefaut?: string;
}) {
  const router = useRouter();
  const [mode, setMode] = React.useState<"temps" | "montant" | "lignes">("temps");
  const [chargement, setChargement] = React.useState(false);

  // Champs communs
  const [clientId, setClientId] = React.useState("");
  const [dossierId, setDossierId] = React.useState(dossierParDefaut ?? "");
  const [dateEmission, setDateEmission] = React.useState(datePlus(0));
  const [dateEcheance, setDateEcheance] = React.useState(datePlus(30));
  const [notes, setNotes] = React.useState("");

  // Mode montant
  const [montantHt, setMontantHt] = React.useState("");

  // Mode lignes détaillées
  const [lignes, setLignes] = React.useState<LigneSaisie[]>([]);

  function ajouterLigne() {
    setLignes((l) => [
      ...l,
      { libelle: "", categorie: "honoraires", quantite: "1", montant_unitaire: "" },
    ]);
  }

  function ajouterFraisOuverture() {
    setLignes((l) => [
      ...l,
      {
        libelle: "Frais d'ouverture de dossier",
        categorie: "ouverture",
        quantite: "1",
        montant_unitaire: String(fraisOuverture),
      },
    ]);
  }

  function modifierLigne(index: number, champ: keyof LigneSaisie, valeur: string) {
    setLignes((l) =>
      l.map((ligne, i) => (i === index ? { ...ligne, [champ]: valeur } : ligne)),
    );
  }

  function supprimerLigne(index: number) {
    setLignes((l) => l.filter((_, i) => i !== index));
  }

  function montantLigne(ligne: LigneSaisie): number {
    return (
      (Number(ligne.quantite) || 0) *
      (Number(String(ligne.montant_unitaire).replace(/\s/g, "")) || 0)
    );
  }

  // Mode temps
  const [saisies, setSaisies] = React.useState<SaisieFacturableLigne[]>([]);
  const [selection, setSelection] = React.useState<Set<string>>(new Set());
  const [chargementSaisies, setChargementSaisies] = React.useState(false);

  // Charge les saisies facturables quand le dossier change (mode temps).
  React.useEffect(() => {
    let actif = true;
    if (mode !== "temps" || !dossierId) {
      setSaisies([]);
      setSelection(new Set());
      return;
    }
    setChargementSaisies(true);
    chargerSaisiesFacturables(dossierId).then((rows) => {
      if (!actif) return;
      setSaisies(rows);
      setSelection(new Set(rows.map((r) => r.id)));
      // Pré-remplit le client depuis le dossier si disponible.
      const cli = rows.find((r) => r.client_id)?.client_id;
      if (cli) setClientId((c) => c || cli);
      setChargementSaisies(false);
    });
    return () => {
      actif = false;
    };
  }, [dossierId, mode]);

  function basculer(id: string) {
    setSelection((s) => {
      const n = new Set(s);
      if (n.has(id)) n.delete(id);
      else n.add(id);
      return n;
    });
  }

  const totalTempsHt = saisies
    .filter((s) => selection.has(s.id))
    .reduce((acc, s) => acc + s.duree_heures * (s.taux_horaire ?? 0), 0);

  const totalLignesHt = lignes.reduce((acc, l) => acc + montantLigne(l), 0);

  const baseHt =
    mode === "temps"
      ? totalTempsHt
      : mode === "lignes"
        ? totalLignesHt
        : Number(montantHt.replace(/\s/g, "")) || 0;
  const tvaCalc = tvaApplicable ? Math.round((baseHt * tauxTva) / 100) : 0;
  const ttc = baseHt + tvaCalc;

  async function soumettre(e: React.FormEvent) {
    e.preventDefault();
    setChargement(true);

    let res;
    if (mode === "temps") {
      const ids = Array.from(selection);
      if (ids.length === 0) {
        toast.error("Sélectionnez au moins une saisie de temps.");
        setChargement(false);
        return;
      }
      res = await creerFactureDepuisTemps({
        client_id: clientId || null,
        dossier_id: dossierId || null,
        date_emission: dateEmission,
        date_echeance: dateEcheance || null,
        notes: notes || null,
        saisie_ids: ids,
      });
    } else if (mode === "lignes") {
      const lignesValides = lignes.filter(
        (l) => l.libelle.trim() !== "" && montantLigne(l) > 0,
      );
      if (lignesValides.length === 0) {
        toast.error(
          "Ajoutez au moins une ligne avec un libellé et un montant supérieur à zéro.",
        );
        setChargement(false);
        return;
      }
      res = await creerFactureLignes({
        client_id: clientId || null,
        dossier_id: dossierId || null,
        date_emission: dateEmission,
        date_echeance: dateEcheance || null,
        notes: notes || null,
        lignes: lignes.map((l) => ({
          libelle: l.libelle.trim(),
          categorie: l.categorie,
          quantite: Number(l.quantite) || 0,
          montant_unitaire:
            Number(String(l.montant_unitaire).replace(/\s/g, "")) || 0,
        })),
      });
    } else {
      const montant = Number(montantHt.replace(/\s/g, ""));
      if (!(montant > 0)) {
        toast.error("Saisissez un montant valide.");
        setChargement(false);
        return;
      }
      res = await creerFactureMontant({
        client_id: clientId || null,
        dossier_id: dossierId || null,
        date_emission: dateEmission,
        date_echeance: dateEcheance || null,
        notes: notes || null,
        montant_ht: montant,
      });
    }

    setChargement(false);
    if (!res.ok) {
      toast.error(res.message ?? "Création impossible.");
      return;
    }
    toast.success(res.message ?? "Facture créée.");
    router.push(res.id ? `/facturation/${res.id}` : "/facturation");
    router.refresh();
  }

  return (
    <form onSubmit={soumettre} className="space-y-6">
      {/* Sélecteur de mode */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        {(
          [
            {
              id: "temps" as const,
              icone: Clock,
              titre: "Depuis les heures saisies",
              desc: "Facturer le temps facturable non encore facturé d'un dossier.",
            },
            {
              id: "montant" as const,
              icone: Banknote,
              titre: "Honoraires fixes / provision",
              desc: "Saisir un montant forfaitaire ou une provision.",
            },
            {
              id: "lignes" as const,
              icone: ListPlus,
              titre: "Lignes détaillées",
              desc: "Composer la facture ligne par ligne : frais d'ouverture, déplacements, honoraires, débours…",
            },
          ]
        ).map((m) => {
          const actif = mode === m.id;
          const Icone = m.icone;
          return (
            <button
              key={m.id}
              type="button"
              onClick={() => setMode(m.id)}
              className={cn(
                "flex items-start gap-3 rounded-lg border p-4 text-left transition-colors",
                actif
                  ? "border-principale bg-principale/5 ring-1 ring-principale"
                  : "border-border hover:bg-muted",
              )}
            >
              <Icone
                className={cn(
                  "mt-0.5 h-5 w-5 shrink-0",
                  actif ? "text-principale" : "text-muted-foreground",
                )}
              />
              <div>
                <p className="text-sm font-medium text-foreground">{m.titre}</p>
                <p className="text-xs text-muted-foreground">{m.desc}</p>
              </div>
            </button>
          );
        })}
      </div>

      {/* Client / dossier */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Field label="Dossier" htmlFor="dossier" aide={mode === "temps" ? "Requis pour charger les heures facturables." : "Optionnel."}>
          <Select
            id="dossier"
            value={dossierId}
            onChange={(e) => setDossierId(e.target.value)}
            placeholder="Aucun dossier"
            options={dossiers}
          />
        </Field>
        <Field label="Client" htmlFor="client">
          <Select
            id="client"
            value={clientId}
            onChange={(e) => setClientId(e.target.value)}
            placeholder="Sélectionner un client"
            options={clients}
          />
        </Field>
      </div>

      {/* Mode temps : liste des saisies */}
      {mode === "temps" && (
        <div>
          {!dossierId ? (
            <div className="rounded-lg border border-dashed border-border bg-muted/30 px-4 py-8 text-center text-sm text-muted-foreground">
              Sélectionnez un dossier pour afficher ses heures facturables.
            </div>
          ) : chargementSaisies ? (
            <div className="rounded-lg border border-border px-4 py-8 text-center text-sm text-muted-foreground">
              Chargement des saisies…
            </div>
          ) : saisies.length === 0 ? (
            <div className="rounded-lg border border-dashed border-border bg-muted/30 px-4 py-8 text-center text-sm text-muted-foreground">
              Aucune heure facturable non facturée pour ce dossier. Utilisez le mode
              « honoraires fixes » ou saisissez du temps facturable.
            </div>
          ) : (
            <Card>
              <CardContent className="p-0">
                <div className="max-h-80 overflow-y-auto divide-y divide-border">
                  {saisies.map((s) => {
                    const montant = s.duree_heures * (s.taux_horaire ?? 0);
                    const coche = selection.has(s.id);
                    return (
                      <label
                        key={s.id}
                        className="flex cursor-pointer items-center gap-3 px-4 py-2.5 hover:bg-muted/40"
                      >
                        <input
                          type="checkbox"
                          checked={coche}
                          onChange={() => basculer(s.id)}
                          className="h-4 w-4 rounded border-input accent-[var(--couleur-principale)]"
                        />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm text-foreground">
                            <span className="font-medium">
                              {LIBELLE_TACHE[s.type_tache] ?? s.type_tache}
                            </span>{" "}
                            <span className="text-muted-foreground">
                              · {formatDate(s.date)} · {s.nomAvocat}
                            </span>
                          </p>
                          {s.description && (
                            <p className="truncate text-xs text-muted-foreground">
                              {s.description}
                            </p>
                          )}
                        </div>
                        <div className="text-right text-sm">
                          <p className="text-muted-foreground">
                            {formatHeures(s.duree_heures)}
                          </p>
                          <p className="font-medium text-foreground">
                            {formatFCFA(montant, devise)}
                          </p>
                        </div>
                      </label>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {/* Mode montant */}
      {mode === "montant" && (
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
      )}

      {/* Mode lignes détaillées */}
      {mode === "lignes" && (
        <div className="space-y-3">
          {lignes.length === 0 ? (
            <div className="rounded-lg border border-dashed border-border bg-muted/30 px-4 py-8 text-center text-sm text-muted-foreground">
              Aucune ligne pour le moment. Ajoutez une ligne ou les frais
              d&apos;ouverture pour composer la facture.
            </div>
          ) : (
            <div className="space-y-2">
              {lignes.map((ligne, index) => (
                <div
                  key={index}
                  className="flex flex-wrap items-end gap-2 rounded-lg border border-border p-3"
                >
                  <div className="min-w-[12rem] flex-1">
                    <Field label="Libellé" htmlFor={`ligne-libelle-${index}`}>
                      <Input
                        id={`ligne-libelle-${index}`}
                        value={ligne.libelle}
                        onChange={(e) =>
                          modifierLigne(index, "libelle", e.target.value)
                        }
                        placeholder="Description de la prestation"
                      />
                    </Field>
                  </div>
                  <div className="w-44">
                    <Field label="Catégorie" htmlFor={`ligne-categorie-${index}`}>
                      <Select
                        id={`ligne-categorie-${index}`}
                        value={ligne.categorie}
                        onChange={(e) =>
                          modifierLigne(index, "categorie", e.target.value)
                        }
                        options={OPTIONS_CATEGORIE}
                      />
                    </Field>
                  </div>
                  <div className="w-20">
                    <Field label="Qté" htmlFor={`ligne-quantite-${index}`}>
                      <Input
                        id={`ligne-quantite-${index}`}
                        inputMode="numeric"
                        value={ligne.quantite}
                        onChange={(e) =>
                          modifierLigne(index, "quantite", e.target.value)
                        }
                        placeholder="1"
                      />
                    </Field>
                  </div>
                  <div className="w-32">
                    <Field
                      label="Montant unit."
                      htmlFor={`ligne-pu-${index}`}
                    >
                      <Input
                        id={`ligne-pu-${index}`}
                        inputMode="numeric"
                        value={ligne.montant_unitaire}
                        onChange={(e) =>
                          modifierLigne(index, "montant_unitaire", e.target.value)
                        }
                        placeholder="0"
                      />
                    </Field>
                  </div>
                  <div className="min-w-[6rem] pb-2 text-right">
                    <p className="text-xs text-muted-foreground">Montant</p>
                    <p className="text-sm font-medium text-foreground">
                      {formatFCFA(montantLigne(ligne), devise)}
                    </p>
                  </div>
                  <Button
                    type="button"
                    variante="fantome"
                    taille="icone"
                    onClick={() => supprimerLigne(index)}
                    aria-label="Supprimer la ligne"
                    className="mb-1"
                  >
                    <Trash2 className="h-4 w-4 text-danger" />
                  </Button>
                </div>
              ))}
            </div>
          )}
          <div className="flex flex-wrap items-center gap-2">
            <Button type="button" variante="contour" onClick={ajouterLigne}>
              + Ajouter une ligne
            </Button>
            <Button
              type="button"
              variante="contour"
              onClick={ajouterFraisOuverture}
            >
              + Frais d&apos;ouverture ({formatFCFA(fraisOuverture, devise)})
            </Button>
          </div>
        </div>
      )}

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
        <Field label="Date d'échéance" htmlFor="echeance" aide="Sert au calcul des relances J+30 / J+60 / J+90.">
          <Input
            id="echeance"
            type="date"
            value={dateEcheance}
            onChange={(e) => setDateEcheance(e.target.value)}
          />
        </Field>
      </div>

      <Field label="Notes" htmlFor="notes">
        <Textarea
          id="notes"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Objet de la facture, conditions de règlement…"
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
          Créer la facture
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
        La facture est créée au statut « brouillon ». Le numéro
        (FACT-AAAA-NNN) est généré automatiquement.
      </p>
    </form>
  );
}
