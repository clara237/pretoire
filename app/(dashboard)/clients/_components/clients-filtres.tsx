"use client";

import * as React from "react";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";

export function ClientsFiltres() {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();

  const [recherche, setRecherche] = React.useState(params.get("q") ?? "");

  // Applique la recherche (debounced) dans l'URL.
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

  function majType(value: string) {
    const p = new URLSearchParams(Array.from(params.entries()));
    if (value && value !== "tous") p.set("type", value);
    else p.delete("type");
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
          placeholder="Rechercher un client (nom, raison sociale, email…)"
          className="pl-9"
        />
      </div>
      <Select
        defaultValue={params.get("type") ?? "tous"}
        onChange={(e) => majType(e.target.value)}
        className="sm:w-56"
        options={[
          { value: "tous", label: "Tous les types" },
          { value: "physique", label: "Personnes physiques" },
          { value: "morale", label: "Personnes morales" },
        ]}
      />
    </div>
  );
}
