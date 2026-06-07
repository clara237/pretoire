import * as React from "react";
import { cn } from "@/lib/utils";

export function Skeleton({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-DEFAULT bg-muted",
        "before:absolute before:inset-0 before:-translate-x-full before:animate-[shimmer_1.5s_infinite]",
        "before:bg-gradient-to-r before:from-transparent before:via-card/40 before:to-transparent",
        className,
      )}
      {...props}
    />
  );
}

/** Squelette de tableau réutilisable. */
export function SkeletonTable({ lignes = 5, colonnes = 4 }: { lignes?: number; colonnes?: number }) {
  return (
    <div className="space-y-2">
      <Skeleton className="h-11 w-full" />
      {Array.from({ length: lignes }).map((_, i) => (
        <div key={i} className="flex gap-3">
          {Array.from({ length: colonnes }).map((_, j) => (
            <Skeleton key={j} className="h-10 flex-1" />
          ))}
        </div>
      ))}
    </div>
  );
}

/** Squelette de carte KPI. */
export function SkeletonStat() {
  return (
    <div className="rounded-lg border border-border bg-card p-5 space-y-3">
      <Skeleton className="h-4 w-24" />
      <Skeleton className="h-8 w-32" />
    </div>
  );
}
