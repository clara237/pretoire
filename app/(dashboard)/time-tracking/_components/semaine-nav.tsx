"use client";

import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { ChevronLeft, ChevronRight, CalendarDays } from "lucide-react";
import { Button } from "@/components/ui/button";

export function SemaineNav({
  libelle,
  paramPrec,
  paramSuiv,
  paramCourant,
  paramAujourdhui,
}: {
  libelle: string;
  paramPrec: string;
  paramSuiv: string;
  paramCourant: string;
  paramAujourdhui: string;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();

  function aller(semaine: string) {
    const p = new URLSearchParams(Array.from(params.entries()));
    p.set("semaine", semaine);
    router.replace(`${pathname}?${p.toString()}`);
  }

  const estSemaineCourante = paramCourant === paramAujourdhui;

  return (
    <div className="flex items-center gap-2">
      <Button
        variante="contour"
        taille="icone"
        aria-label="Semaine précédente"
        onClick={() => aller(paramPrec)}
      >
        <ChevronLeft className="h-4 w-4" />
      </Button>
      <div className="min-w-[12rem] text-center text-sm font-medium text-foreground">
        {libelle}
      </div>
      <Button
        variante="contour"
        taille="icone"
        aria-label="Semaine suivante"
        onClick={() => aller(paramSuiv)}
      >
        <ChevronRight className="h-4 w-4" />
      </Button>
      <Button
        variante="fantome"
        taille="sm"
        iconeGauche={<CalendarDays className="h-4 w-4" />}
        onClick={() => aller(paramAujourdhui)}
        disabled={estSemaineCourante}
      >
        Cette semaine
      </Button>
    </div>
  );
}
