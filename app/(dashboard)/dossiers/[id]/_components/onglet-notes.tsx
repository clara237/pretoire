"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { AssistantTexte } from "@/components/ui/assistant-texte";
import { enregistrerNotes } from "@/lib/actions/dossiers";

export function OngletNotes({
  dossierId,
  notes,
  peutEditer,
}: {
  dossierId: string;
  notes: string | null;
  peutEditer: boolean;
}) {
  const router = useRouter();
  const [valeur, setValeur] = React.useState(notes ?? "");
  const [chargement, setChargement] = React.useState(false);
  const modifie = valeur !== (notes ?? "");

  async function enregistrer() {
    setChargement(true);
    const res = await enregistrerNotes(dossierId, valeur);
    setChargement(false);
    if (!res.ok) {
      toast.error(res.message ?? "Enregistrement impossible.");
      return;
    }
    toast.success("Notes enregistrées.");
    router.refresh();
  }

  if (!peutEditer) {
    return (
      <div>
        <h2 className="mb-3 text-base font-semibold text-foreground">
          Notes internes
        </h2>
        {valeur ? (
          <div className="rounded-lg border border-border bg-muted/30 p-4">
            <p className="whitespace-pre-wrap text-sm text-foreground">{valeur}</p>
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">Aucune note interne.</p>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-base font-semibold text-foreground">
          Notes internes
        </h2>
        <Button
          taille="sm"
          enChargement={chargement}
          disabled={!modifie}
          iconeGauche={<Save className="h-4 w-4" />}
          onClick={enregistrer}
        >
          Enregistrer
        </Button>
      </div>
      <Textarea
        value={valeur}
        onChange={(e) => setValeur(e.target.value)}
        rows={12}
        placeholder="Notes confidentielles, stratégie, points de suivi…"
      />
      {peutEditer && <AssistantTexte valeur={valeur} onChange={setValeur} />}
      <p className="text-xs text-muted-foreground">
        Ces notes sont internes au cabinet et n&apos;apparaissent pas dans les
        documents transmis aux clients.
      </p>
    </div>
  );
}
