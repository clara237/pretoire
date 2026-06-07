import { cn } from "@/lib/utils";
import { formatHeures } from "@/lib/utils";

/** Barre de progression « réalisé vs objectif » (heures facturables). */
export function JaugeObjectif({
  realise,
  objectif,
}: {
  realise: number;
  objectif: number;
}) {
  const pct =
    objectif > 0 ? Math.min(100, Math.round((realise / objectif) * 100)) : 0;
  const ton =
    pct >= 100
      ? "bg-success"
      : pct >= 60
        ? "bg-principale"
        : pct >= 30
          ? "bg-warning"
          : "bg-danger";

  return (
    <div className="space-y-1.5">
      <div className="flex items-baseline justify-between text-sm">
        <span className="font-medium text-foreground">
          {formatHeures(realise)}
        </span>
        <span className="text-xs text-muted-foreground">
          objectif {formatHeures(objectif)} · {pct}%
        </span>
      </div>
      <div className="h-2.5 w-full overflow-hidden rounded-full bg-muted">
        <div
          className={cn("h-full rounded-full transition-all", ton)}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}
