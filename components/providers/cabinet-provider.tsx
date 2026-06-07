"use client";

import * as React from "react";
import type { CabinetConfig } from "@/lib/cabinet";

const CabinetContext = React.createContext<CabinetConfig | null>(null);

/**
 * Fournit la config cabinet (white-label) à toute l'app côté client.
 * La valeur initiale vient du serveur (RSC) ; on injecte aussi les CSS vars
 * de couleur pour le thème temps réel.
 */
export function CabinetProvider({
  cabinet,
  children,
}: {
  cabinet: CabinetConfig;
  children: React.ReactNode;
}) {
  React.useEffect(() => {
    const root = document.documentElement;
    if (cabinet.couleur_principale) {
      root.style.setProperty("--couleur-principale", cabinet.couleur_principale);
    }
    if (cabinet.couleur_secondaire) {
      root.style.setProperty("--couleur-secondaire", cabinet.couleur_secondaire);
    }
  }, [cabinet.couleur_principale, cabinet.couleur_secondaire]);

  return (
    <CabinetContext.Provider value={cabinet}>{children}</CabinetContext.Provider>
  );
}

/** Accès à la config cabinet depuis n'importe quel composant client. */
export function useCabinet(): CabinetConfig {
  const ctx = React.useContext(CabinetContext);
  if (!ctx) {
    throw new Error("useCabinet() doit être utilisé dans <CabinetProvider>");
  }
  return ctx;
}
