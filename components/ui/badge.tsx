import * as React from "react";
import { cn } from "@/lib/utils";

export type BadgeTon =
  | "neutre"
  | "principal"
  | "succes"
  | "avertissement"
  | "danger"
  | "info";

const TONS: Record<BadgeTon, string> = {
  neutre: "bg-muted text-muted-foreground border-border",
  principal: "bg-principale/10 text-principale border-principale/20",
  succes: "bg-success/10 text-success border-success/20",
  avertissement: "bg-warning/10 text-warning border-warning/20",
  danger: "bg-danger/10 text-danger border-danger/20",
  info: "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20",
};

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  ton?: BadgeTon;
}

export function Badge({ className, ton = "neutre", ...props }: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs font-medium",
        TONS[ton],
        className,
      )}
      {...props}
    />
  );
}
