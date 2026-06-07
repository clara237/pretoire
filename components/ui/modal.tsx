"use client";

import * as React from "react";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "./button";

export interface ModalProps {
  ouvert: boolean;
  onClose: () => void;
  titre?: string;
  description?: string;
  children?: React.ReactNode;
  pied?: React.ReactNode;
  taille?: "sm" | "md" | "lg" | "xl";
}

const TAILLES = {
  sm: "max-w-sm",
  md: "max-w-md",
  lg: "max-w-2xl",
  xl: "max-w-4xl",
};

export function Modal({
  ouvert,
  onClose,
  titre,
  description,
  children,
  pied,
  taille = "md",
}: ModalProps) {
  React.useEffect(() => {
    if (!ouvert) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [ouvert, onClose]);

  if (!ouvert) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-black/50 animate-fade-in"
        onClick={onClose}
        aria-hidden
      />
      <div
        role="dialog"
        aria-modal="true"
        className={cn(
          "relative z-10 w-full rounded-lg border border-border bg-card shadow-xl animate-scale-in",
          TAILLES[taille],
        )}
      >
        <button
          type="button"
          onClick={onClose}
          aria-label="Fermer"
          className="absolute right-4 top-4 rounded-DEFAULT p-1 text-muted-foreground hover:bg-muted hover:text-foreground"
        >
          <X className="h-4 w-4" />
        </button>
        {(titre || description) && (
          <div className="space-y-1.5 p-5 pb-3 pr-12">
            {titre && (
              <h2 className="text-lg font-semibold text-foreground">{titre}</h2>
            )}
            {description && (
              <p className="text-sm text-muted-foreground">{description}</p>
            )}
          </div>
        )}
        {children && <div className="px-5 py-2">{children}</div>}
        {pied && (
          <div className="flex justify-end gap-2 p-5 pt-3">{pied}</div>
        )}
      </div>
    </div>
  );
}

/** Dialogue de confirmation de suppression (ou action sensible). */
export function ConfirmDialog({
  ouvert,
  onClose,
  onConfirm,
  titre = "Confirmer la suppression",
  message = "Cette action est irréversible. Voulez-vous continuer ?",
  texteConfirmer = "Supprimer",
  texteAnnuler = "Annuler",
  destructif = true,
  enChargement = false,
}: {
  ouvert: boolean;
  onClose: () => void;
  onConfirm: () => void;
  titre?: string;
  message?: string;
  texteConfirmer?: string;
  texteAnnuler?: string;
  destructif?: boolean;
  enChargement?: boolean;
}) {
  return (
    <Modal
      ouvert={ouvert}
      onClose={onClose}
      titre={titre}
      description={message}
      taille="sm"
      pied={
        <>
          <Button variante="contour" onClick={onClose} disabled={enChargement}>
            {texteAnnuler}
          </Button>
          <Button
            variante={destructif ? "danger" : "principal"}
            onClick={onConfirm}
            enChargement={enChargement}
          >
            {texteConfirmer}
          </Button>
        </>
      }
    />
  );
}
