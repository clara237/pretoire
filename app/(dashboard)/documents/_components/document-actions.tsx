"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Download, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/modal";
import { urlTelechargement, supprimerDocument } from "@/lib/actions/documents";

export function BoutonTelecharger({ chemin }: { chemin: string }) {
  const [chargement, setChargement] = React.useState(false);

  async function ouvrir() {
    setChargement(true);
    const res = await urlTelechargement(chemin);
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
      aria-label="Télécharger"
      title="Télécharger"
      enChargement={chargement}
      onClick={ouvrir}
    >
      <Download className="h-4 w-4 text-muted-foreground" />
    </Button>
  );
}

export function BoutonSupprimerDocument({
  id,
  chemin,
  dossierId,
  nom,
}: {
  id: string;
  chemin: string;
  dossierId?: string | null;
  nom: string;
}) {
  const router = useRouter();
  const [ouvert, setOuvert] = React.useState(false);
  const [chargement, setChargement] = React.useState(false);

  async function confirmer() {
    setChargement(true);
    const res = await supprimerDocument(id, chemin, dossierId ?? null);
    setChargement(false);
    if (!res.ok) {
      toast.error(res.message ?? "Suppression impossible.");
      setOuvert(false);
      return;
    }
    toast.success("Document supprimé.");
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
        titre="Supprimer le document"
        message={`Supprimer définitivement « ${nom} » ?`}
      />
    </>
  );
}
