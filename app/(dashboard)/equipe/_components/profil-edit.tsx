"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Pencil } from "lucide-react";
import { Modal } from "@/components/ui/modal";
import { Button } from "@/components/ui/button";
import { Input, Field } from "@/components/ui/input";
import { modifierProfilAvocat } from "@/lib/actions/equipe";

export function ProfilEdit({
  profileId,
  valeurs,
}: {
  profileId: string;
  valeurs: {
    barreau_numero: string | null;
    telephone: string | null;
    specialites: string[] | null;
    taux_horaire: number | null;
  };
}) {
  const router = useRouter();
  const [ouvert, setOuvert] = React.useState(false);
  const [enCours, setEnCours] = React.useState(false);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setEnCours(true);
    const res = await modifierProfilAvocat(profileId, new FormData(e.currentTarget));
    setEnCours(false);
    if (res.ok) {
      toast.success("Profil mis à jour.");
      setOuvert(false);
      router.refresh();
    } else {
      toast.error(res.message ?? "Mise à jour impossible.");
    }
  }

  return (
    <>
      <Button
        variante="contour"
        taille="sm"
        iconeGauche={<Pencil className="h-4 w-4" />}
        onClick={() => setOuvert(true)}
      >
        Modifier
      </Button>

      <Modal
        ouvert={ouvert}
        onClose={() => setOuvert(false)}
        titre="Modifier le profil professionnel"
        taille="md"
      >
        <form onSubmit={onSubmit} className="space-y-4">
          <Field label="Numéro d'inscription au Barreau" htmlFor="barreau_numero">
            <Input
              id="barreau_numero"
              name="barreau_numero"
              defaultValue={valeurs.barreau_numero ?? ""}
              placeholder="Ex. 1234"
            />
          </Field>
          <Field label="Téléphone" htmlFor="telephone">
            <Input
              id="telephone"
              name="telephone"
              defaultValue={valeurs.telephone ?? ""}
              placeholder="+237 …"
            />
          </Field>
          <Field
            label="Spécialités"
            htmlFor="specialites"
            aide="Séparées par des virgules (ex. OHADA, Droit pénal, Droit social)."
          >
            <Input
              id="specialites"
              name="specialites"
              defaultValue={(valeurs.specialites ?? []).join(", ")}
              placeholder="OHADA, Droit commercial…"
            />
          </Field>
          <Field label="Taux horaire (FCFA)" htmlFor="taux_horaire">
            <Input
              id="taux_horaire"
              name="taux_horaire"
              type="number"
              min={0}
              step={1000}
              defaultValue={valeurs.taux_horaire ?? ""}
              placeholder="Ex. 25000"
            />
          </Field>

          <div className="flex justify-end gap-2 pt-2">
            <Button
              type="button"
              variante="contour"
              onClick={() => setOuvert(false)}
              disabled={enCours}
            >
              Annuler
            </Button>
            <Button type="submit" enChargement={enCours}>
              Enregistrer
            </Button>
          </div>
        </form>
      </Modal>
    </>
  );
}
