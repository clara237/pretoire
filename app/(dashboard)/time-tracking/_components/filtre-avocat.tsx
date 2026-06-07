"use client";

import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { Select } from "@/components/ui/select";

export function FiltreAvocat({
  avocats,
}: {
  avocats: { value: string; label: string }[];
}) {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();

  function changer(value: string) {
    const p = new URLSearchParams(Array.from(params.entries()));
    if (value && value !== "tous") p.set("avocat", value);
    else p.delete("avocat");
    const qs = p.toString();
    router.replace(qs ? `${pathname}?${qs}` : pathname);
  }

  return (
    <Select
      defaultValue={params.get("avocat") ?? "tous"}
      onChange={(e) => changer(e.target.value)}
      className="sm:w-64"
      options={[{ value: "tous", label: "Tous les avocats" }, ...avocats]}
    />
  );
}
