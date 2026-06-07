"use client";

import * as React from "react";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";

export interface OptionDossierFiltre {
  value: string;
  label: string;
}

export function DocumentsFiltres({
  dossiers,
  types,
}: {
  dossiers: OptionDossierFiltre[];
  types: string[];
}) {
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
    <div className="mb-4 grid grid-cols-1 gap-3 sm:grid-cols-3">
      <div className="relative">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={recherche}
          onChange={(e) => setRecherche(e.target.value)}
          placeholder="Rechercher un document…"
          className="pl-9"
        />
      </div>
      <Select
        defaultValue={params.get("dossier") ?? "tous"}
        onChange={(e) => majParam("dossier", e.target.value)}
        options={[
          { value: "tous", label: "Tous les dossiers" },
          { value: "general", label: "Documents généraux (sans dossier)" },
          ...dossiers,
        ]}
      />
      <Select
        defaultValue={params.get("type") ?? "tous"}
        onChange={(e) => majParam("type", e.target.value)}
        options={[
          { value: "tous", label: "Tous les types" },
          ...types.map((t) => ({ value: t, label: t })),
        ]}
      />
    </div>
  );
}
