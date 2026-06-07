import * as React from "react";
import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

export interface StatCardProps {
  libelle: string;
  valeur: string | number;
  icone?: LucideIcon;
  variation?: { valeur: string; positif?: boolean };
  ton?: "principal" | "succes" | "avertissement" | "danger" | "neutre";
  className?: string;
}

const TONS = {
  principal: "text-principale bg-principale/10",
  succes: "text-success bg-success/10",
  avertissement: "text-warning bg-warning/10",
  danger: "text-danger bg-danger/10",
  neutre: "text-muted-foreground bg-muted",
};

export function StatCard({
  libelle,
  valeur,
  icone: Icone,
  variation,
  ton = "principal",
  className,
}: StatCardProps) {
  return (
    <div
      className={cn(
        "rounded-lg border border-border bg-card p-5 shadow-sm",
        className,
      )}
    >
      <div className="flex items-start justify-between">
        <div className="space-y-1">
          <p className="text-sm font-medium text-muted-foreground">{libelle}</p>
          <p className="text-2xl font-bold text-foreground">{valeur}</p>
          {variation && (
            <p
              className={cn(
                "text-xs font-medium",
                variation.positif ? "text-success" : "text-danger",
              )}
            >
              {variation.valeur}
            </p>
          )}
        </div>
        {Icone && (
          <div className={cn("rounded-lg p-2.5", TONS[ton])}>
            <Icone className="h-5 w-5" />
          </div>
        )}
      </div>
    </div>
  );
}
