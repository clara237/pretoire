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
import { creerDepense, modifierDepense } from "@/lib/actions/depenses";
import { CATEGORIES_DEPENSE } from "@/lib/finance-constants";

export interface DepenseInitiale {
  id?: string;
  categorie?: string;
  description?: string | null;
  montant?: number;
  date_depense?: string;
}

function aujourdhui() {
  return new Date().toISOString().slice(0, 10);
}

export function DepenseForm({
  initiale,
  declencheur = "principal",
}: {
  initiale?: DepenseInitiale;
  declencheur?: "principal" | "ligne";
}) {
  const router = useRouter();
  const enEdition = Boolean(initiale?.id);
  const [ouvert, setOuvert] = React.useState(false);
  const [chargement, setChargement] = React.useState(false);
  const formRef = React.useRef<HTMLFormElement>(null);

  async function soumettre(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const data = new FormData(e.currentTarget);
    setChargement(true);
    const res = enEdition
      ? await modifierDepense(initiale!.id!, data)
      : await creerDepense(data);
    setChargement(false);
    if (!res.ok) {
      toast.error(res.message ?? "Enregistrement impossible.");
      return;
    }
    toast.success(enEdition ? "Dépense modifiée." : "Dépense enregistrée.");
    setOuvert(false);
    formRef.current?.reset();
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
          taille="sm"
          iconeGauche={<Plus className="h-4 w-4" />}
          onClick={() => setOuvert(true)}
        >
          Nouvelle dépense
        </Button>
      )}

      <Modal
        ouvert={ouvert}
        onClose={() => !chargement && setOuvert(false)}
        titre={enEdition ? "Modifier la dépense" : "Nouvelle dépense"}
        taille="md"
      >
        <form ref={formRef} onSubmit={soumettre} className="space-y-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field label="Catégorie" htmlFor="categorie" requis>
              <Select
                id="categorie"
                name="categorie"
                defaultValue={initiale?.categorie ?? ""}
                placeholder="Sélectionner une catégorie"
                options={CATEGORIES_DEPENSE.map((c) => ({ value: c, label: c }))}
                required
              />
            </Field>
            <Field label="Date" htmlFor="date_depense" requis>
              <Input
                id="date_depense"
                name="date_depense"
                type="date"
                defaultValue={initiale?.date_depense ?? aujourdhui()}
                required
              />
            </Field>
          </div>

          <Field label="Montant (FCFA)" htmlFor="montant" requis>
            <Input
              id="montant"
              name="montant"
              inputMode="numeric"
              defaultValue={initiale?.montant != null ? String(initiale.montant) : ""}
              placeholder="150000"
              required
            />
          </Field>

          <Field label="Description" htmlFor="description">
            <Textarea
              id="description"
              name="description"
              rows={2}
              defaultValue={initiale?.description ?? ""}
              placeholder="Objet de la dépense…"
            />
          </Field>

          <Field
            label="Justificatif"
            htmlFor="justificatif"
            aide={
              enEdition
                ? "Optionnel — remplace le justificatif existant."
                : "Optionnel — reçu, facture fournisseur…"
            }
          >
            <Input
              id="justificatif"
              name="justificatif"
              type="file"
              className="cursor-pointer file:mr-3 file:rounded file:border-0 file:bg-muted file:px-3 file:py-1 file:text-sm"
            />
          </Field>

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
              {enEdition ? "Enregistrer" : "Ajouter"}
            </Button>
          </div>
        </form>
      </Modal>
    </>
  );
}
