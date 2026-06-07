"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Paperclip, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/modal";
import { supprimerDepense, urlJustificatif } from "@/lib/actions/depenses";

export function JustificatifBouton({ chemin }: { chemin: string }) {
  const [chargement, setChargement] = React.useState(false);

  async function ouvrir() {
    setChargement(true);
    const res = await urlJustificatif(chemin);
    setChargement(false);
    if (!res.ok || !res.url) {
      toast.error(res.message ?? "Lien indisponible.");
      return;
    }
    window.open(res.url, "_blank", "noopener,noreferrer");
  }

  return (
    <Button
      variante="fantome"
      taille="icone"
      aria-label="Voir le justificatif"
      title="Justificatif"
      enChargement={chargement}
      onClick={ouvrir}
    >
      <Paperclip className="h-4 w-4 text-muted-foreground" />
    </Button>
  );
}

export function DepenseSupprimer({
  id,
  justificatif,
  libelle,
}: {
  id: string;
  justificatif?: string | null;
  libelle: string;
}) {
  const router = useRouter();
  const [ouvert, setOuvert] = React.useState(false);
  const [chargement, setChargement] = React.useState(false);

  async function confirmer() {
    setChargement(true);
    const res = await supprimerDepense(id, justificatif ?? null);
    setChargement(false);
    if (!res.ok) {
      toast.error(res.message ?? "Suppression impossible.");
      setOuvert(false);
      return;
    }
    toast.success("Dépense supprimée.");
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
        titre="Supprimer la dépense"
        message={`Supprimer définitivement la dépense « ${libelle} » ?`}
      />
    </>
  );
}
