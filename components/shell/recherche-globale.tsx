"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Search, Loader2, CornerDownLeft } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  rechercheGlobale,
  type GroupeRecherche,
} from "@/lib/actions/recherche";

/** Aplatit les groupes en liste ordonnée pour la navigation clavier. */
function aplatir(groupes: GroupeRecherche[]): { href: string }[] {
  return groupes.flatMap((g) => g.resultats.map((r) => ({ href: r.href })));
}

export function RechercheGlobale() {
  const router = useRouter();
  const [ouvert, setOuvert] = React.useState(false);
  const [requete, setRequete] = React.useState("");
  const [groupes, setGroupes] = React.useState<GroupeRecherche[]>([]);
  const [chargement, setChargement] = React.useState(false);
  const [actif, setActif] = React.useState(0);
  const inputRef = React.useRef<HTMLInputElement>(null);

  const plat = React.useMemo(() => aplatir(groupes), [groupes]);

  // Raccourci global Ctrl+K / Cmd+K
  React.useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setOuvert((v) => !v);
      }
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, []);

  // Verrouille le scroll & focus à l'ouverture
  React.useEffect(() => {
    if (!ouvert) return;
    document.body.style.overflow = "hidden";
    const t = setTimeout(() => inputRef.current?.focus(), 0);
    return () => {
      document.body.style.overflow = "";
      clearTimeout(t);
    };
  }, [ouvert]);

  // Réinitialise à la fermeture
  React.useEffect(() => {
    if (ouvert) return;
    setRequete("");
    setGroupes([]);
    setActif(0);
    setChargement(false);
  }, [ouvert]);

  // Recherche avec debounce ~250ms
  React.useEffect(() => {
    const q = requete.trim();
    if (q.length < 2) {
      setGroupes([]);
      setChargement(false);
      return;
    }
    setChargement(true);
    let annule = false;
    const t = setTimeout(async () => {
      try {
        const res = await rechercheGlobale(q);
        if (!annule) {
          setGroupes(res.groupes);
          setActif(0);
        }
      } finally {
        if (!annule) setChargement(false);
      }
    }, 250);
    return () => {
      annule = true;
      clearTimeout(t);
    };
  }, [requete]);

  function fermer() {
    setOuvert(false);
  }

  function naviguer(href: string) {
    fermer();
    router.push(href);
  }

  function onKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Escape") {
      e.preventDefault();
      fermer();
      return;
    }
    if (plat.length === 0) return;
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActif((i) => (i + 1) % plat.length);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActif((i) => (i - 1 + plat.length) % plat.length);
    } else if (e.key === "Enter") {
      e.preventDefault();
      const cible = plat[actif];
      if (cible) naviguer(cible.href);
    }
  }

  const q = requete.trim();

  return (
    <>
      <button
        type="button"
        onClick={() => setOuvert(true)}
        className="inline-flex h-9 items-center gap-2 rounded-DEFAULT border border-input bg-background px-3 text-sm text-muted-foreground hover:bg-muted hover:text-foreground"
        aria-label="Recherche globale"
      >
        <Search className="h-4 w-4" />
        <span className="hidden sm:inline">Rechercher…</span>
        <kbd className="ml-2 hidden items-center gap-0.5 rounded border border-border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground sm:inline-flex">
          Ctrl K
        </kbd>
      </button>

      {ouvert && (
        <div className="fixed inset-0 z-50 flex items-start justify-center p-4 pt-[12vh]">
          <div
            className="absolute inset-0 bg-black/50 animate-fade-in"
            onClick={fermer}
            aria-hidden
          />
          <div
            role="dialog"
            aria-modal="true"
            aria-label="Recherche globale"
            className="relative z-10 w-full max-w-xl overflow-hidden rounded-lg border border-border bg-card shadow-xl animate-scale-in"
            onKeyDown={onKeyDown}
          >
            <div className="flex items-center gap-3 border-b border-border px-4">
              {chargement ? (
                <Loader2 className="h-4 w-4 shrink-0 animate-spin text-muted-foreground" />
              ) : (
                <Search className="h-4 w-4 shrink-0 text-muted-foreground" />
              )}
              <input
                ref={inputRef}
                type="text"
                value={requete}
                onChange={(e) => setRequete(e.target.value)}
                placeholder="Rechercher un client, dossier, facture…"
                className="h-12 w-full bg-transparent text-sm text-foreground placeholder:text-muted-foreground focus:outline-none"
              />
              <kbd className="hidden shrink-0 rounded border border-border bg-muted px-1.5 py-0.5 font-mono text-[10px] text-muted-foreground sm:inline-block">
                Échap
              </kbd>
            </div>

            <div className="max-h-[55vh] overflow-y-auto p-2">
              {q.length < 2 ? (
                <p className="px-3 py-6 text-center text-sm text-muted-foreground">
                  Saisissez au moins 2 caractères.
                </p>
              ) : chargement && groupes.length === 0 ? (
                <p className="px-3 py-6 text-center text-sm text-muted-foreground">
                  Recherche…
                </p>
              ) : groupes.length === 0 ? (
                <p className="px-3 py-6 text-center text-sm text-muted-foreground">
                  Aucun résultat pour «&nbsp;{q}&nbsp;».
                </p>
              ) : (
                (() => {
                  let index = -1;
                  return groupes.map((groupe) => (
                    <div key={groupe.titre} className="mb-2 last:mb-0">
                      <p className="px-3 pb-1 pt-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                        {groupe.titre}
                      </p>
                      <ul>
                        {groupe.resultats.map((r) => {
                          index += 1;
                          const i = index;
                          return (
                            <li key={`${r.href}-${i}`}>
                              <button
                                type="button"
                                onMouseEnter={() => setActif(i)}
                                onClick={() => naviguer(r.href)}
                                className={cn(
                                  "flex w-full items-center justify-between gap-3 rounded-DEFAULT px-3 py-2 text-left text-sm",
                                  i === actif
                                    ? "bg-muted text-foreground"
                                    : "text-foreground hover:bg-muted/60",
                                )}
                              >
                                <span className="min-w-0 flex-1">
                                  <span className="block truncate font-medium">
                                    {r.libelle}
                                  </span>
                                  {r.sousTitre && (
                                    <span className="block truncate text-xs text-muted-foreground">
                                      {r.sousTitre}
                                    </span>
                                  )}
                                </span>
                                {i === actif && (
                                  <CornerDownLeft className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                                )}
                              </button>
                            </li>
                          );
                        })}
                      </ul>
                    </div>
                  ));
                })()
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
