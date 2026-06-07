"use client";

import * as React from "react";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import {
  STATUTS_DOSSIER,
  LIBELLE_STATUT,
  TYPES_AFFAIRE,
  LIBELLE_TYPE_AFFAIRE,
} from "@/lib/queries/dossiers-labels";

export interface OptionAvocat {
  id: string;
  nom: string;
}

export function DossiersFiltres({ avocats }: { avocats: OptionAvocat[] }) {
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

  function majParam(cle: string, value: string) {
    const p = new URLSearchParams(Array.from(params.entries()));
    if (value && value !== "tous") p.set(cle, value);
    else p.delete(cle);
    const qs = p.toString();
    router.replace(qs ? `${pathname}?${qs}` : pathname);
  }

  return (
    <div className="mb-4 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
      <div className="relative sm:col-span-2 lg:col-span-1">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={recherche}
          onChange={(e) => setRecherche(e.target.value)}
          placeholder="Numéro, intitulé, juridiction…"
          className="pl-9"
        />
      </div>

      <Select
        defaultValue={params.get("statut") ?? "tous"}
        onChange={(e) => majParam("statut", e.target.value)}
        options={[
          { value: "tous", label: "Tous les statuts" },
          ...STATUTS_DOSSIER.map((s) => ({ value: s, label: LIBELLE_STATUT[s] })),
        ]}
      />

      <Select
        defaultValue={params.get("type") ?? "tous"}
        onChange={(e) => majParam("type", e.target.value)}
        options={[
          { value: "tous", label: "Tous les types" },
          ...TYPES_AFFAIRE.map((t) => ({ value: t, label: LIBELLE_TYPE_AFFAIRE[t] })),
        ]}
      />

      <Select
        defaultValue={params.get("avocat") ?? "tous"}
        onChange={(e) => majParam("avocat", e.target.value)}
        options={[
          { value: "tous", label: "Tous les avocats" },
          ...avocats.map((a) => ({ value: a.id, label: a.nom })),
        ]}
      />
    </div>
  );
}
