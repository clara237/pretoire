"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { decaler, toParam } from "../_lib/dates";
import type { VueAgenda } from "../_lib/evenements";

const VUES: { value: VueAgenda; label: string }[] = [
  { value: "jour", label: "Jour" },
  { value: "semaine", label: "Semaine" },
  { value: "mois", label: "Mois" },
];

export function AgendaToolbar({
  vue,
  dateRef,
  periode,
}: {
  vue: VueAgenda;
  dateRef: Date;
  periode: string;
}) {
  const router = useRouter();

  function naviguer(nouvelleVue: VueAgenda, nouvelleDate: Date) {
    const params = new URLSearchParams();
    params.set("vue", nouvelleVue);
    params.set("date", toParam(nouvelleDate));
    router.push(`/agenda?${params.toString()}`);
  }

  return (
    <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex items-center gap-2">
        <Button
          variante="contour"
          taille="icone"
          aria-label="Précédent"
          onClick={() => naviguer(vue, decaler(vue, dateRef, -1))}
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <Button
          variante="contour"
          taille="sm"
          onClick={() => naviguer(vue, new Date())}
        >
          Aujourd&apos;hui
        </Button>
        <Button
          variante="contour"
          taille="icone"
          aria-label="Suivant"
          onClick={() => naviguer(vue, decaler(vue, dateRef, 1))}
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
        <span className="ml-2 text-base font-semibold capitalize text-foreground">
          {periode}
        </span>
      </div>

      <div className="inline-flex items-center gap-1 rounded-lg border border-border bg-muted/40 p-1">
        {VUES.map((v) => (
          <button
            key={v.value}
            type="button"
            onClick={() => naviguer(v.value, dateRef)}
            className={cn(
              "rounded-DEFAULT px-3 py-1.5 text-sm font-medium transition-colors",
              vue === v.value
                ? "bg-card text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            {v.label}
          </button>
        ))}
      </div>
    </div>
  );
}
