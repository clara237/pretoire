"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  erreur?: boolean;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, erreur, type = "text", ...props }, ref) => {
    return (
      <input
        ref={ref}
        type={type}
        className={cn(
          "flex h-10 w-full rounded-DEFAULT border bg-card px-3 py-2 text-sm text-foreground",
          "placeholder:text-muted-foreground",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1 focus-visible:ring-offset-background",
          "disabled:cursor-not-allowed disabled:opacity-50",
          erreur ? "border-danger" : "border-input",
          className,
        )}
        {...props}
      />
    );
  },
);
Input.displayName = "Input";

/** Bloc libellé + champ + message d'erreur réutilisable. */
export function Field({
  label,
  htmlFor,
  erreur,
  requis,
  children,
  className,
  aide,
}: {
  label: string;
  htmlFor?: string;
  erreur?: string;
  requis?: boolean;
  children: React.ReactNode;
  className?: string;
  aide?: string;
}) {
  return (
    <div className={cn("space-y-1.5", className)}>
      <label
        htmlFor={htmlFor}
        className="block text-sm font-medium text-foreground"
      >
        {label}
        {requis && <span className="ml-0.5 text-danger">*</span>}
      </label>
      {children}
      {aide && !erreur && (
        <p className="text-xs text-muted-foreground">{aide}</p>
      )}
      {erreur && <p className="text-xs text-danger">{erreur}</p>}
    </div>
  );
}
