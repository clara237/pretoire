"use client";

import dynamic from "next/dynamic";
import { Skeleton } from "@/components/ui/skeleton";
import type { PointMensuel, RecetteDepenseMois } from "./graphiques";

// recharts (~150 Ko) n'est pas critique au-dessus de la ligne de flottaison :
// on le charge côté client après le montage, hors du bundle initial de /finance.
const fallback = <Skeleton className="h-[340px] w-full rounded-lg" />;

const GraphiqueCA = dynamic(
  () => import("./graphiques").then((m) => m.GraphiqueCA),
  { ssr: false, loading: () => fallback },
);
const GraphiqueTresorerie = dynamic(
  () => import("./graphiques").then((m) => m.GraphiqueTresorerie),
  { ssr: false, loading: () => fallback },
);

export function GraphiquesClient({
  ca,
  tresorerie,
}: {
  ca: PointMensuel[];
  tresorerie: RecetteDepenseMois[];
}) {
  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
      <GraphiqueCA data={ca} />
      <GraphiqueTresorerie data={tresorerie} />
    </div>
  );
}
