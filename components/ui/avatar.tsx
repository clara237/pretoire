import * as React from "react";
import { cn } from "@/lib/utils";
import { initiales } from "@/lib/utils";

export interface AvatarProps {
  prenom?: string | null;
  nom?: string | null;
  src?: string | null;
  taille?: "sm" | "md" | "lg";
  className?: string;
}

const TAILLES = {
  sm: "h-8 w-8 text-xs",
  md: "h-10 w-10 text-sm",
  lg: "h-14 w-14 text-base",
};

export function Avatar({ prenom, nom, src, taille = "md", className }: AvatarProps) {
  return (
    <div
      className={cn(
        "inline-flex shrink-0 items-center justify-center overflow-hidden rounded-full bg-principale/15 font-semibold text-principale",
        TAILLES[taille],
        className,
      )}
    >
      {src ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={src} alt={`${prenom ?? ""} ${nom ?? ""}`.trim()} className="h-full w-full object-cover" />
      ) : (
        initiales(prenom, nom)
      )}
    </div>
  );
}
