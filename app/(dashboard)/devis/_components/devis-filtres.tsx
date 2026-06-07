"use client";

import * as React from "react";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import {
  STATUTS_DEVIS,
  LIBELLE_STATUT_DEVIS,
} from "@/lib/finance-constants";

export function DevisFiltres() {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();

  const [recherche, setRecherche] = React.useState(params.get("q") ?? "");

  React.useEffect(() => {
    const t = setTimeout(() => {
      const p = new URLSearchParams(Array.from(params.entries()));
      if (recherche.trim()) p.set("q", recherche.trim());
      else p.delete("q");
      const qs = p.toString();
      router.replace(qs ? `${pathname}?${qs}` : pathname);
    }, 300);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [recherche]);

  function majStatut(value: string) {
    const p = new URLSearchParams(Array.from(params.entries()));
    if (value && value !== "tous") p.set("statut", value);
    else p.delete("statut");
    const qs = p.toString();
    router.replace(qs ? `${pathname}?${qs}` : pathname);
  }

  return (
    <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center">
      <div className="relative flex-1">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={recherche}
          onChange={(e) => setRecherche(e.target.value)}
          placeholder="Rechercher un devis (numéro)…"
          className="pl-9"
        />
      </div>
      <Select
        defaultValue={params.get("statut") ?? "tous"}
        onChange={(e) => majStatut(e.target.value)}
        className="sm:w-56"
        options={[
          { value: "tous", label: "Tous les statuts" },
          ...STATUTS_DEVIS.map((s) => ({
            value: s,
            label: LIBELLE_STATUT_DEVIS[s],
          })),
        ]}
      />
    </div>
  );
}
