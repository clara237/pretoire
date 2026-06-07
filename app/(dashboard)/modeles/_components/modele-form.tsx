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
import { creerModele, modifierModele } from "@/lib/actions/modeles";
import { CATEGORIES_MODELE } from "@/lib/finance-constants";

export interface ModeleInitial {
  id?: string;
  nom?: string;
  categorie?: string | null;
  description?: string | null;
  aFichier?: boolean;
}

export function ModeleForm({
  initial,
  declencheur = "principal",
}: {
  initial?: ModeleInitial;
  declencheur?: "principal" | "ligne";
}) {
  const router = useRouter();
  const enEdition = Boolean(initial?.id);
  const [ouvert, setOuvert] = React.useState(false);
  const [chargement, setChargement] = React.useState(false);
  const formRef = React.useRef<HTMLFormElement>(null);

  async function soumettre(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const data = new FormData(e.currentTarget);
    setChargement(true);
    const res = enEdition
      ? await modifierModele(initial!.id!, data)
      : await creerModele(data);
    setChargement(false);
    if (!res.ok) {
      toast.error(res.message ?? "Enregistrement impossible.");
      return;
    }
    toast.success(enEdition ? "Modèle modifié." : "Modèle ajouté.");
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
          iconeGauche={<Plus className="h-4 w-4" />}
          onClick={() => setOuvert(true)}
        >
          Nouveau modèle
        </Button>
      )}

      <Modal
        ouvert={ouvert}
        onClose={() => !chargement && setOuvert(false)}
        titre={enEdition ? "Modifier le modèle" : "Nouveau modèle de document"}
        taille="md"
      >
        <form ref={formRef} onSubmit={soumettre} className="space-y-4">
          <Field label="Nom du modèle" htmlFor="nom" requis>
            <Input
              id="nom"
              name="nom"
              defaultValue={initial?.nom ?? ""}
              placeholder="Mise en demeure de payer"
              required
            />
          </Field>

          <Field label="Catégorie" htmlFor="categorie">
            <Select
              id="categorie"
              name="categorie"
              defaultValue={initial?.categorie ?? ""}
              placeholder="Sélectionner une catégorie"
              options={CATEGORIES_MODELE.map((c) => ({ value: c, label: c }))}
            />
          </Field>

          <Field label="Description" htmlFor="description">
            <Textarea
              id="description"
              name="description"
              rows={2}
              defaultValue={initial?.description ?? ""}
              placeholder="À quoi sert ce modèle, quand l'utiliser…"
            />
          </Field>

          <Field
            label="Fichier"
            htmlFor="fichier"
            aide={
              enEdition
                ? initial?.aFichier
                  ? "Optionnel — remplace le fichier existant."
                  : "Optionnel — ajoute un fichier au modèle."
                : "Optionnel — modèle Word, PDF…"
            }
          >
            <Input
              id="fichier"
              name="fichier"
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
              {enEdition ? "Enregistrer" : "Ajouter le modèle"}
            </Button>
          </div>
        </form>
      </Modal>
    </>
  );
}
