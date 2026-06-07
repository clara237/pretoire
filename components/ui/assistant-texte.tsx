"use client";

import * as React from "react";
import { toast } from "sonner";
import { Sparkles, SpellCheck, Scale } from "lucide-react";
import { cn } from "@/lib/utils";
import { ameliorerTexte, iaEstConfiguree, type ModeIA } from "@/lib/actions/ia";

/**
 * Barre d'assistant IA à poser sous un champ de texte : corrige l'orthographe,
 * reformule, ou réécrit dans un registre juridique. Ne s'affiche que si la clé
 * IA est configurée côté serveur (dégradation propre sinon).
 *
 * Deux modes d'accrochage :
 *  - contrôlé : passer `valeur` + `onChange` (champ piloté par React) ;
 *  - DOM : passer `cibleId` (id d'un <textarea> non contrôlé, defaultValue).
 */
interface Props {
  valeur?: string;
  onChange?: (texte: string) => void;
  cibleId?: string;
  className?: string;
}

const MODES: Array<{ mode: ModeIA; libelle: string; icone: React.ReactNode }> = [
  { mode: "corriger", libelle: "Corriger", icone: <SpellCheck className="h-3.5 w-3.5" /> },
  { mode: "reformuler", libelle: "Reformuler", icone: <Sparkles className="h-3.5 w-3.5" /> },
  { mode: "juridique", libelle: "Style juridique", icone: <Scale className="h-3.5 w-3.5" /> },
];

export function AssistantTexte({ valeur, onChange, cibleId, className }: Props) {
  const [active, setActive] = React.useState(false);
  const [modeEnCours, setModeEnCours] = React.useState<ModeIA | null>(null);

  React.useEffect(() => {
    let monte = true;
    iaEstConfiguree().then((ok) => {
      if (monte) setActive(ok);
    });
    return () => {
      monte = false;
    };
  }, []);

  if (!active) return null;

  function lireTexte(): string {
    if (valeur !== undefined) return valeur;
    if (cibleId) {
      const el = document.getElementById(cibleId) as HTMLTextAreaElement | null;
      return el?.value ?? "";
    }
    return "";
  }

  function ecrireTexte(texte: string) {
    if (onChange) {
      onChange(texte);
      return;
    }
    if (cibleId) {
      const el = document.getElementById(cibleId) as HTMLTextAreaElement | null;
      if (el) el.value = texte;
    }
  }

  async function lancer(mode: ModeIA) {
    const texte = lireTexte().trim();
    if (!texte) {
      toast.info("Saisissez d'abord un texte à traiter.");
      return;
    }
    setModeEnCours(mode);
    const res = await ameliorerTexte(texte, mode);
    setModeEnCours(null);

    if (!res.ok || !res.texte) {
      toast.error(res.message ?? "L'assistant IA n'a pas pu traiter le texte.");
      return;
    }
    const precedent = texte;
    ecrireTexte(res.texte);
    toast.success(
      mode === "corriger" ? "Texte corrigé." : "Texte reformulé.",
      {
        action: {
          label: "Annuler",
          onClick: () => ecrireTexte(precedent),
        },
      },
    );
  }

  return (
    <div className={cn("mt-1.5 flex flex-wrap items-center gap-1.5", className)}>
      <span className="inline-flex items-center gap-1 text-[11px] font-medium text-muted-foreground">
        <Sparkles className="h-3 w-3" />
        Assistant IA
      </span>
      {MODES.map(({ mode, libelle, icone }) => (
        <button
          key={mode}
          type="button"
          disabled={modeEnCours !== null}
          onClick={() => lancer(mode)}
          className={cn(
            "inline-flex items-center gap-1 rounded-full border border-border bg-card px-2 py-0.5 text-[11px] font-medium text-foreground transition-colors",
            "hover:border-principale/40 hover:text-principale disabled:cursor-not-allowed disabled:opacity-50",
          )}
        >
          {icone}
          {modeEnCours === mode ? "En cours…" : libelle}
        </button>
      ))}
    </div>
  );
}
