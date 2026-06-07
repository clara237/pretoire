"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { UserPlus, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input, Field } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Modal } from "@/components/ui/modal";
import { ROLES, LIBELLES_ROLES } from "@/lib/roles";
import { creerUtilisateur } from "@/lib/actions/utilisateurs";

const OPTIONS_ROLE = ROLES.map((r) => ({ value: r, label: LIBELLES_ROLES[r] }));

/** Génère un mot de passe provisoire robuste et lisible. */
function genererMotDePasse(): string {
  const maj = "ABCDEFGHJKMNPQRSTUVWXYZ";
  const min = "abcdefghijkmnpqrstuvwxyz";
  const chiffres = "23456789";
  const speciaux = "!@#$%&*";
  const tous = maj + min + chiffres + speciaux;
  const pioche = (src: string) =>
    src[Math.floor(Math.random() * src.length)];
  let mdp =
    pioche(maj) + pioche(min) + pioche(chiffres) + pioche(speciaux);
  for (let i = 0; i < 8; i++) mdp += pioche(tous);
  return mdp
    .split("")
    .sort(() => Math.random() - 0.5)
    .join("");
}

export function NouvelUtilisateur() {
  const router = useRouter();
  const formRef = React.useRef<HTMLFormElement>(null);
  const [ouvert, setOuvert] = React.useState(false);
  const [enCours, setEnCours] = React.useState(false);
  const [motDePasse, setMotDePasse] = React.useState("");

  function ouvrir() {
    setMotDePasse(genererMotDePasse());
    setOuvert(true);
  }

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setEnCours(true);
    const res = await creerUtilisateur(new FormData(e.currentTarget));
    setEnCours(false);
    if (!res.ok) {
      toast.error(res.message ?? "Création impossible.");
      return;
    }
    toast.success("Utilisateur créé.");
    setOuvert(false);
    formRef.current?.reset();
    router.refresh();
  }

  async function copierMotDePasse() {
    try {
      await navigator.clipboard.writeText(motDePasse);
      toast.success("Mot de passe copié.");
    } catch {
      toast.error("Copie impossible.");
    }
  }

  return (
    <>
      <Button
        iconeGauche={<UserPlus className="h-4 w-4" />}
        onClick={ouvrir}
      >
        Nouvel utilisateur
      </Button>

      <Modal
        ouvert={ouvert}
        onClose={() => !enCours && setOuvert(false)}
        titre="Créer un utilisateur"
        description="Le compte est créé immédiatement avec un mot de passe provisoire à communiquer."
        taille="lg"
      >
        <form ref={formRef} onSubmit={onSubmit} className="space-y-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field label="Prénom" htmlFor="prenom" requis>
              <Input id="prenom" name="prenom" required placeholder="Aline" />
            </Field>
            <Field label="Nom" htmlFor="nom" requis>
              <Input id="nom" name="nom" required placeholder="Nguemo" />
            </Field>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field label="Email" htmlFor="email" requis>
              <Input
                id="email"
                name="email"
                type="email"
                required
                placeholder="prenom.nom@cabinet.cm"
              />
            </Field>
            <Field label="Téléphone" htmlFor="telephone">
              <Input
                id="telephone"
                name="telephone"
                placeholder="+237 6XX XXX XXX"
              />
            </Field>
          </div>

          <Field label="Rôle" htmlFor="role" requis>
            <Select
              id="role"
              name="role"
              defaultValue="collaborateur"
              options={OPTIONS_ROLE}
            />
          </Field>

          <Field
            label="Mot de passe provisoire"
            htmlFor="mot_de_passe"
            requis
            aide="Au moins 8 caractères. L'utilisateur pourra le changer ensuite."
          >
            <div className="flex items-center gap-2">
              <Input
                id="mot_de_passe"
                name="mot_de_passe"
                value={motDePasse}
                onChange={(e) => setMotDePasse(e.target.value)}
                required
                minLength={8}
                className="font-mono"
              />
              <Button
                type="button"
                variante="contour"
                taille="icone"
                onClick={() => setMotDePasse(genererMotDePasse())}
                aria-label="Régénérer"
                title="Régénérer"
              >
                <RefreshCw className="h-4 w-4" />
              </Button>
              <Button
                type="button"
                variante="contour"
                taille="sm"
                onClick={copierMotDePasse}
              >
                Copier
              </Button>
            </div>
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
              Créer le compte
            </Button>
          </div>
        </form>
      </Modal>
    </>
  );
}
