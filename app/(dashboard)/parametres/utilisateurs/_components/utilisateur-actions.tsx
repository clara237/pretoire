"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Pencil, Power, PowerOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input, Field } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Modal, ConfirmDialog } from "@/components/ui/modal";
import { ROLES, LIBELLES_ROLES, type Role } from "@/lib/roles";
import {
  modifierUtilisateur,
  basculerActif,
} from "@/lib/actions/utilisateurs";

const OPTIONS_ROLE = ROLES.map((r) => ({ value: r, label: LIBELLES_ROLES[r] }));

export interface UtilisateurLigne {
  id: string;
  nom: string;
  prenom: string;
  email: string;
  telephone: string | null;
  role: Role;
  actif: boolean;
}

export function UtilisateurActions({
  utilisateur,
}: {
  utilisateur: UtilisateurLigne;
}) {
  const router = useRouter();
  const formRef = React.useRef<HTMLFormElement>(null);
  const [editOuvert, setEditOuvert] = React.useState(false);
  const [edition, setEdition] = React.useState(false);
  const [basculeOuvert, setBasculeOuvert] = React.useState(false);
  const [bascule, setBascule] = React.useState(false);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setEdition(true);
    const res = await modifierUtilisateur(
      utilisateur.id,
      new FormData(e.currentTarget),
    );
    setEdition(false);
    if (!res.ok) {
      toast.error(res.message ?? "Mise à jour impossible.");
      return;
    }
    toast.success("Utilisateur mis à jour.");
    setEditOuvert(false);
    router.refresh();
  }

  async function confirmerBascule() {
    setBascule(true);
    const res = await basculerActif(utilisateur.id, !utilisateur.actif);
    setBascule(false);
    setBasculeOuvert(false);
    if (!res.ok) {
      toast.error(res.message ?? "Action impossible.");
      return;
    }
    toast.success(
      utilisateur.actif ? "Compte désactivé." : "Compte réactivé.",
    );
    router.refresh();
  }

  return (
    <>
      <div className="flex items-center justify-end gap-1">
        <Button
          variante="fantome"
          taille="sm"
          iconeGauche={<Pencil className="h-4 w-4" />}
          onClick={() => setEditOuvert(true)}
        >
          Modifier
        </Button>
        <Button
          variante="fantome"
          taille="sm"
          iconeGauche={
            utilisateur.actif ? (
              <PowerOff className="h-4 w-4" />
            ) : (
              <Power className="h-4 w-4" />
            )
          }
          onClick={() => setBasculeOuvert(true)}
        >
          {utilisateur.actif ? "Désactiver" : "Activer"}
        </Button>
      </div>

      <Modal
        ouvert={editOuvert}
        onClose={() => !edition && setEditOuvert(false)}
        titre="Modifier l'utilisateur"
        description={utilisateur.email}
        taille="md"
      >
        <form ref={formRef} onSubmit={onSubmit} className="space-y-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field label="Prénom" htmlFor={`prenom-${utilisateur.id}`} requis>
              <Input
                id={`prenom-${utilisateur.id}`}
                name="prenom"
                defaultValue={utilisateur.prenom}
                required
              />
            </Field>
            <Field label="Nom" htmlFor={`nom-${utilisateur.id}`} requis>
              <Input
                id={`nom-${utilisateur.id}`}
                name="nom"
                defaultValue={utilisateur.nom}
                required
              />
            </Field>
          </div>
          <Field label="Téléphone" htmlFor={`tel-${utilisateur.id}`}>
            <Input
              id={`tel-${utilisateur.id}`}
              name="telephone"
              defaultValue={utilisateur.telephone ?? ""}
              placeholder="+237 …"
            />
          </Field>
          <Field label="Rôle" htmlFor={`role-${utilisateur.id}`} requis>
            <Select
              id={`role-${utilisateur.id}`}
              name="role"
              defaultValue={utilisateur.role}
              options={OPTIONS_ROLE}
            />
          </Field>
          <p className="text-xs text-muted-foreground">
            L&apos;email et le mot de passe ne sont pas modifiables ici.
          </p>

          <div className="flex justify-end gap-2 pt-2">
            <Button
              type="button"
              variante="contour"
              onClick={() => setEditOuvert(false)}
              disabled={edition}
            >
              Annuler
            </Button>
            <Button type="submit" enChargement={edition}>
              Enregistrer
            </Button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog
        ouvert={basculeOuvert}
        onClose={() => setBasculeOuvert(false)}
        onConfirm={confirmerBascule}
        enChargement={bascule}
        destructif={utilisateur.actif}
        titre={
          utilisateur.actif
            ? "Désactiver ce compte"
            : "Réactiver ce compte"
        }
        message={
          utilisateur.actif
            ? "L'utilisateur ne pourra plus se connecter tant que le compte est désactivé."
            : "L'utilisateur pourra de nouveau se connecter."
        }
        texteConfirmer={utilisateur.actif ? "Désactiver" : "Réactiver"}
      />
    </>
  );
}
