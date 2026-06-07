"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/modal";
import { supprimerSaisie } from "@/lib/actions/temps";

export function SaisieDelete({ id, libelle }: { id: string; libelle: string }) {
  const router = useRouter();
  const [ouvert, setOuvert] = React.useState(false);
  const [chargement, setChargement] = React.useState(false);

  async function confirmer() {
    setChargement(true);
    const res = await supprimerSaisie(id);
    setChargement(false);
    if (!res.ok) {
      toast.error(res.message ?? "Suppression impossible.");
      setOuvert(false);
      return;
    }
    toast.success("Saisie supprimée.");
    setOuvert(false);
    router.refresh();
  }

  return (
    <>
      <Button
        variante="fantome"
        taille="icone"
        aria-label="Supprimer"
        title="Supprimer"
        onClick={() => setOuvert(true)}
      >
        <Trash2 className="h-4 w-4 text-muted-foreground" />
      </Button>
      <ConfirmDialog
        ouvert={ouvert}
        onClose={() => setOuvert(false)}
        onConfirm={confirmer}
        enChargement={chargement}
        titre="Supprimer la saisie"
        message={`Supprimer définitivement la saisie « ${libelle} » ?`}
      />
    </>
  );
}
