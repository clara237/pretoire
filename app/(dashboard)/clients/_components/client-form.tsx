"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { User, Building2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input, Field } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import {
  creerClient,
  modifierClient,
  type DonneesClient,
} from "@/lib/actions/clients";

export interface ClientInitial extends DonneesClient {
  id?: string;
}

export function ClientForm({ initial }: { initial?: ClientInitial }) {
  const router = useRouter();
  const enEdition = Boolean(initial?.id);
  const [type, setType] = React.useState<string>(initial?.type ?? "physique");
  const [chargement, setChargement] = React.useState(false);
  const [erreur, setErreur] = React.useState<string | null>(null);

  const [form, setForm] = React.useState<DonneesClient>({
    type: initial?.type ?? "physique",
    nom: initial?.nom ?? "",
    prenom: initial?.prenom ?? "",
    raison_sociale: initial?.raison_sociale ?? "",
    email: initial?.email ?? "",
    telephone: initial?.telephone ?? "",
    adresse: initial?.adresse ?? "",
    ville: initial?.ville ?? "",
    cni_numero: initial?.cni_numero ?? "",
    rccm_numero: initial?.rccm_numero ?? "",
    notes: initial?.notes ?? "",
  });

  function maj<K extends keyof DonneesClient>(cle: K, valeur: DonneesClient[K]) {
    setForm((f) => ({ ...f, [cle]: valeur }));
  }

  async function soumettre(e: React.FormEvent) {
    e.preventDefault();
    setErreur(null);
    setChargement(true);
    const payload: DonneesClient = { ...form, type };
    const res = enEdition
      ? await modifierClient(initial!.id!, payload)
      : await creerClient(payload);
    setChargement(false);
    if (!res.ok) {
      setErreur(res.message ?? "Une erreur est survenue.");
      toast.error(res.message ?? "Une erreur est survenue.");
      return;
    }
    toast.success(enEdition ? "Client modifié." : "Client créé.");
    const id = res.id ?? initial?.id;
    router.push(id ? `/clients/${id}` : "/clients");
    router.refresh();
  }

  return (
    <form onSubmit={soumettre} className="space-y-6">
      {/* Type de client */}
      <div className="grid grid-cols-2 gap-3 sm:max-w-md">
        {(["physique", "morale"] as const).map((t) => {
          const actif = type === t;
          const Icone = t === "physique" ? User : Building2;
          return (
            <button
              key={t}
              type="button"
              onClick={() => setType(t)}
              className={cn(
                "flex items-center gap-3 rounded-lg border p-4 text-left transition-colors",
                actif
                  ? "border-principale bg-principale/5 ring-1 ring-principale"
                  : "border-border hover:bg-muted",
              )}
            >
              <Icone
                className={cn(
                  "h-5 w-5",
                  actif ? "text-principale" : "text-muted-foreground",
                )}
              />
              <div>
                <p className="text-sm font-medium text-foreground">
                  {t === "physique" ? "Personne physique" : "Personne morale"}
                </p>
                <p className="text-xs text-muted-foreground">
                  {t === "physique" ? "Particulier" : "Société, association…"}
                </p>
              </div>
            </button>
          );
        })}
      </div>

      {/* Identité — champs conditionnels */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {type === "physique" ? (
          <>
            <Field label="Nom" htmlFor="nom" requis>
              <Input
                id="nom"
                value={form.nom ?? ""}
                onChange={(e) => maj("nom", e.target.value)}
                placeholder="Mbarga"
                required
              />
            </Field>
            <Field label="Prénom" htmlFor="prenom">
              <Input
                id="prenom"
                value={form.prenom ?? ""}
                onChange={(e) => maj("prenom", e.target.value)}
                placeholder="Jean-Pierre"
              />
            </Field>
            <Field label="Numéro CNI" htmlFor="cni" aide="Carte nationale d'identité">
              <Input
                id="cni"
                value={form.cni_numero ?? ""}
                onChange={(e) => maj("cni_numero", e.target.value)}
                placeholder="11223344"
              />
            </Field>
          </>
        ) : (
          <>
            <Field label="Raison sociale" htmlFor="raison" requis className="sm:col-span-2">
              <Input
                id="raison"
                value={form.raison_sociale ?? ""}
                onChange={(e) => maj("raison_sociale", e.target.value)}
                placeholder="SARL BâtiPlus"
                required
              />
            </Field>
            <Field label="Numéro RCCM" htmlFor="rccm" aide="Registre du commerce et du crédit mobilier">
              <Input
                id="rccm"
                value={form.rccm_numero ?? ""}
                onChange={(e) => maj("rccm_numero", e.target.value)}
                placeholder="RC/DLA/2015/B/1234"
              />
            </Field>
          </>
        )}
      </div>

      {/* Coordonnées */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Field label="Email" htmlFor="email">
          <Input
            id="email"
            type="email"
            value={form.email ?? ""}
            onChange={(e) => maj("email", e.target.value)}
            placeholder="contact@exemple.cm"
          />
        </Field>
        <Field label="Téléphone" htmlFor="tel">
          <Input
            id="tel"
            value={form.telephone ?? ""}
            onChange={(e) => maj("telephone", e.target.value)}
            placeholder="+237 6XX XXX XXX"
          />
        </Field>
        <Field label="Adresse" htmlFor="adresse">
          <Input
            id="adresse"
            value={form.adresse ?? ""}
            onChange={(e) => maj("adresse", e.target.value)}
            placeholder="Quartier, rue…"
          />
        </Field>
        <Field label="Ville" htmlFor="ville">
          <Input
            id="ville"
            value={form.ville ?? ""}
            onChange={(e) => maj("ville", e.target.value)}
            placeholder="Yaoundé"
          />
        </Field>
      </div>

      <Field label="Notes" htmlFor="notes">
        <Textarea
          id="notes"
          value={form.notes ?? ""}
          onChange={(e) => maj("notes", e.target.value)}
          placeholder="Informations utiles sur le client…"
        />
      </Field>

      {erreur && (
        <div className="rounded-DEFAULT border border-danger/20 bg-danger/10 px-3 py-2 text-sm text-danger">
          {erreur}
        </div>
      )}

      <div className="flex items-center gap-2">
        <Button type="submit" enChargement={chargement}>
          {enEdition ? "Enregistrer" : "Créer le client"}
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
  );
}
