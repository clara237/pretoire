"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Pencil, Check, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { formatFCFA } from "@/lib/utils";
import { modifierTauxHoraire } from "@/lib/actions/utilisateurs";

export function TauxInline({
  profileId,
  tauxInitial,
  editable,
}: {
  profileId: string;
  tauxInitial: number | null;
  editable: boolean;
}) {
  const router = useRouter();
  const [edition, setEdition] = React.useState(false);
  const [enCours, setEnCours] = React.useState(false);
  const [valeur, setValeur] = React.useState<string>(
    tauxInitial !== null ? String(tauxInitial) : "",
  );
  const inputRef = React.useRef<HTMLInputElement>(null);

  React.useEffect(() => {
    if (edition) inputRef.current?.focus();
  }, [edition]);

  function annuler() {
    setValeur(tauxInitial !== null ? String(tauxInitial) : "");
    setEdition(false);
  }

  async function enregistrer() {
    setEnCours(true);
    const res = await modifierTauxHoraire(profileId, valeur);
    setEnCours(false);
    if (!res.ok) {
      toast.error(res.message ?? "Mise à jour impossible.");
      return;
    }
    toast.success("Taux horaire mis à jour.");
    setEdition(false);
    router.refresh();
  }

  function onKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter") {
      e.preventDefault();
      void enregistrer();
    } else if (e.key === "Escape") {
      e.preventDefault();
      annuler();
    }
  }

  if (!editable) {
    return (
      <span className="font-medium text-foreground">
        {tauxInitial ? formatFCFA(tauxInitial) : "—"}
      </span>
    );
  }

  if (!edition) {
    return (
      <button
        type="button"
        onClick={() => setEdition(true)}
        className="group inline-flex items-center gap-2 rounded-DEFAULT px-2 py-1 hover:bg-muted"
        title="Modifier le taux horaire"
      >
        <span className="font-medium text-foreground">
          {tauxInitial ? formatFCFA(tauxInitial) : "Non défini"}
        </span>
        <Pencil className="h-3.5 w-3.5 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100" />
      </button>
    );
  }

  return (
    <div className="flex items-center justify-end gap-1.5">
      <Input
        ref={inputRef}
        type="number"
        min={0}
        step={1000}
        value={valeur}
        onChange={(e) => setValeur(e.target.value)}
        onKeyDown={onKeyDown}
        className="h-9 w-32 text-right"
        placeholder="Ex. 25000"
        disabled={enCours}
      />
      <Button
        type="button"
        variante="principal"
        taille="icone"
        className="h-9 w-9"
        onClick={enregistrer}
        enChargement={enCours}
        aria-label="Enregistrer"
      >
        <Check className="h-4 w-4" />
      </Button>
      <Button
        type="button"
        variante="contour"
        taille="icone"
        className="h-9 w-9"
        onClick={annuler}
        disabled={enCours}
        aria-label="Annuler"
      >
        <X className="h-4 w-4" />
      </Button>
    </div>
  );
}
