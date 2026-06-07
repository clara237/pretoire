"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Download, Trash2, Power } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/modal";
import {
  urlModele,
  basculerModele,
  supprimerModele,
} from "@/lib/actions/modeles";

export function ModeleTelecharger({ chemin }: { chemin: string }) {
  const [chargement, setChargement] = React.useState(false);

  async function ouvrir() {
    setChargement(true);
    const res = await urlModele(chemin);
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

export function ModeleBascule({
  id,
  actif,
}: {
  id: string;
  actif: boolean;
}) {
  const router = useRouter();
  const [chargement, setChargement] = React.useState(false);

  async function basculer() {
    setChargement(true);
    const res = await basculerModele(id, !actif);
    setChargement(false);
    if (!res.ok) {
      toast.error(res.message ?? "Mise à jour impossible.");
      return;
    }
    toast.success(actif ? "Modèle désactivé." : "Modèle activé.");
    router.refresh();
  }

  return (
    <Button
      variante="fantome"
      taille="icone"
      aria-label={actif ? "Désactiver" : "Activer"}
      title={actif ? "Désactiver" : "Activer"}
      enChargement={chargement}
      onClick={basculer}
    >
      <Power
        className={`h-4 w-4 ${actif ? "text-success" : "text-muted-foreground"}`}
      />
    </Button>
  );
}

export function ModeleSupprimer({
  id,
  fichier,
  nom,
}: {
  id: string;
  fichier?: string | null;
  nom: string;
}) {
  const router = useRouter();
  const [ouvert, setOuvert] = React.useState(false);
  const [chargement, setChargement] = React.useState(false);

  async function confirmer() {
    setChargement(true);
    const res = await supprimerModele(id, fichier ?? null);
    setChargement(false);
    if (!res.ok) {
      toast.error(res.message ?? "Suppression impossible.");
      setOuvert(false);
      return;
    }
    toast.success("Modèle supprimé.");
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
        titre="Supprimer le modèle"
        message={`Supprimer définitivement le modèle « ${nom} » ?`}
      />
    </>
  );
}
