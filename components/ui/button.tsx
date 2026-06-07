"use client";

import * as React from "react";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

type Variante = "principal" | "secondaire" | "contour" | "fantome" | "danger" | "lien";
type Taille = "sm" | "md" | "lg" | "icone";

const VARIANTES: Record<Variante, string> = {
  principal:
    "bg-principale text-principale-foreground hover:opacity-90 shadow-sm",
  secondaire: "bg-muted text-foreground hover:bg-border",
  contour: "border border-border bg-card text-foreground hover:bg-muted",
  fantome: "text-foreground hover:bg-muted",
  danger: "bg-danger text-white hover:opacity-90 shadow-sm",
  lien: "text-principale underline-offset-4 hover:underline",
};

const TAILLES: Record<Taille, string> = {
  sm: "h-8 px-3 text-sm gap-1.5",
  md: "h-10 px-4 text-sm gap-2",
  lg: "h-11 px-6 text-base gap-2",
  icone: "h-10 w-10 justify-center",
};

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variante?: Variante;
  taille?: Taille;
  enChargement?: boolean;
  iconeGauche?: React.ReactNode;
  iconeDroite?: React.ReactNode;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variante = "principal",
      taille = "md",
      enChargement = false,
      iconeGauche,
      iconeDroite,
      children,
      disabled,
      ...props
    },
    ref,
  ) => {
    return (
      <button
        ref={ref}
        disabled={disabled || enChargement}
        className={cn(
          "inline-flex items-center justify-center rounded-DEFAULT font-medium transition-colors",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
          "disabled:pointer-events-none disabled:opacity-50",
          VARIANTES[variante],
          TAILLES[taille],
          className,
        )}
        {...props}
      >
        {enChargement ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          iconeGauche
        )}
        {children}
        {!enChargement && iconeDroite}
      </button>
    );
  },
);
Button.displayName = "Button";
