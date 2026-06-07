"use client";

import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { Select } from "@/components/ui/select";
import { CATEGORIES_MODELE } from "@/lib/finance-constants";

export function ModelesFiltres({ peutEditer }: { peutEditer: boolean }) {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();

  function maj(cle: string, value: string, defaut: string) {
    const p = new URLSearchParams(Array.from(params.entries()));
    if (value && value !== defaut) p.set(cle, value);
    else p.delete(cle);
    const qs = p.toString();
    router.replace(qs ? `${pathname}?${qs}` : pathname);
  }

  return (
    <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center">
      <Select
        defaultValue={params.get("categorie") ?? "tous"}
        onChange={(e) => maj("categorie", e.target.value, "tous")}
        className="sm:w-64"
        options={[
          { value: "tous", label: "Toutes les catégories" },
          ...CATEGORIES_MODELE.map((c) => ({ value: c, label: c })),
        ]}
      />
      {peutEditer && (
        <Select
          defaultValue={params.get("etat") ?? "actifs"}
          onChange={(e) => maj("etat", e.target.value, "actifs")}
          className="sm:w-48"
          options={[
            { value: "actifs", label: "Modèles actifs" },
            { value: "tous", label: "Tous (avec inactifs)" },
          ]}
        />
      )}
    </div>
  );
}
