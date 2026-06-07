"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input, Field } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Modal } from "@/components/ui/modal";
import { televerserDocument } from "@/lib/actions/documents";

export interface OptionDossier {
  value: string;
  label: string;
}

/** Catégories de pièces fréquentes dans un cabinet. */
const CATEGORIES = [
  "Acte de procédure",
  "Contrat",
  "Pièce justificative",
  "Correspondance",
  "Jugement / décision",
  "Expertise",
  "Identité",
  "Autre",
];

export function UploadDocument({
  dossiers,
  dossierFige,
  variante = "principal",
  taille = "md",
  libelle = "Téléverser un document",
}: {
  dossiers?: OptionDossier[];
  /** Si fourni, le document est rattaché à ce dossier (sélecteur masqué). */
  dossierFige?: string;
  variante?: "principal" | "contour";
  taille?: "sm" | "md";
  libelle?: string;
}) {
  const router = useRouter();
  const [ouvert, setOuvert] = React.useState(false);
  const [chargement, setChargement] = React.useState(false);
  const [nomFichier, setNomFichier] = React.useState("");
  const formRef = React.useRef<HTMLFormElement>(null);

  async function soumettre(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const data = new FormData(e.currentTarget);
    if (dossierFige) data.set("dossier_id", dossierFige);
    const fichier = data.get("fichier");
    if (!(fichier instanceof File) || fichier.size === 0) {
      toast.error("Sélectionnez un fichier.");
      return;
    }
    setChargement(true);
    const res = await televerserDocument(data);
    setChargement(false);
    if (!res.ok) {
      toast.error(res.message ?? "Téléversement impossible.");
      return;
    }
    toast.success("Document téléversé.");
    setOuvert(false);
    setNomFichier("");
    formRef.current?.reset();
    router.refresh();
  }

  return (
    <>
      <Button
        variante={variante}
        taille={taille}
        iconeGauche={<Upload className="h-4 w-4" />}
        onClick={() => setOuvert(true)}
      >
        {libelle}
      </Button>

      <Modal
        ouvert={ouvert}
        onClose={() => !chargement && setOuvert(false)}
        titre="Téléverser un document"
        taille="md"
      >
        <form ref={formRef} onSubmit={soumettre} className="space-y-4">
          <Field label="Fichier" htmlFor="fichier" requis>
            <Input
              id="fichier"
              name="fichier"
              type="file"
              required
              className="cursor-pointer file:mr-3 file:rounded file:border-0 file:bg-muted file:px-3 file:py-1 file:text-sm"
              onChange={(e) => {
                const f = e.target.files?.[0];
                setNomFichier(f?.name ?? "");
              }}
            />
          </Field>

          <Field label="Nom du document" htmlFor="nom" aide="Laisser vide pour utiliser le nom du fichier.">
            <Input
              id="nom"
              name="nom"
              placeholder={nomFichier || "Ex. Assignation Mbarga"}
            />
          </Field>

          <Field label="Catégorie" htmlFor="type">
            <Select
              id="type"
              name="type"
              placeholder="Sélectionner une catégorie"
              options={CATEGORIES.map((c) => ({ value: c, label: c }))}
            />
          </Field>

          {!dossierFige && dossiers && (
            <Field label="Dossier rattaché" htmlFor="dossier_id" aide="Optionnel — document général sinon.">
              <Select
                id="dossier_id"
                name="dossier_id"
                placeholder="Aucun (document général)"
                options={dossiers}
              />
            </Field>
          )}

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
              Téléverser
            </Button>
          </div>
        </form>
      </Modal>
    </>
  );
}
