"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Pencil, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Modal, ConfirmDialog } from "@/components/ui/modal";
import { ClientForm, type ClientInitial } from "./client-form";
import { supprimerClient } from "@/lib/actions/clients";

export function ClientActions({ client }: { client: ClientInitial }) {
  const router = useRouter();
  const [editOuvert, setEditOuvert] = React.useState(false);
  const [supprOuvert, setSupprOuvert] = React.useState(false);
  const [suppression, setSuppression] = React.useState(false);

  async function confirmerSuppression() {
    setSuppression(true);
    const res = await supprimerClient(client.id!);
    setSuppression(false);
    if (!res.ok) {
      toast.error(res.message ?? "Suppression impossible.");
      setSupprOuvert(false);
      return;
    }
    toast.success("Client supprimé.");
    router.push("/clients");
    router.refresh();
  }

  return (
    <>
      <div className="flex items-center gap-2">
        <Button
          variante="contour"
          iconeGauche={<Pencil className="h-4 w-4" />}
          onClick={() => setEditOuvert(true)}
        >
          Modifier
        </Button>
        <Button
          variante="contour"
          iconeGauche={<Trash2 className="h-4 w-4" />}
          onClick={() => setSupprOuvert(true)}
        >
          Supprimer
        </Button>
      </div>

      <Modal
        ouvert={editOuvert}
        onClose={() => setEditOuvert(false)}
        titre="Modifier le client"
        taille="xl"
      >
        <div className="max-h-[70vh] overflow-y-auto pr-1">
          <ClientForm initial={client} />
        </div>
      </Modal>

      <ConfirmDialog
        ouvert={supprOuvert}
        onClose={() => setSupprOuvert(false)}
        onConfirm={confirmerSuppression}
        enChargement={suppression}
        titre="Supprimer ce client"
        message="Cette action est irréversible. Le client sera définitivement supprimé."
      />
    </>
  );
}
