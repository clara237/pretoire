"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Menu, Search, Bell } from "lucide-react";
import { ThemeToggle } from "./theme-toggle";
import { UserMenu } from "./user-menu";
import type { Role } from "@/lib/roles";

export interface TopbarUtilisateur {
  prenom: string;
  nom: string;
  email: string;
  role: Role;
  photoUrl?: string | null;
}

export function Topbar({
  utilisateur,
  notificationsNonLues = 0,
  onOuvrirMenu,
}: {
  utilisateur: TopbarUtilisateur;
  notificationsNonLues?: number;
  onOuvrirMenu: () => void;
}) {
  const router = useRouter();
  const [recherche, setRecherche] = React.useState("");

  function soumettreRecherche(e: React.FormEvent) {
    e.preventDefault();
    const q = recherche.trim();
    if (q) router.push(`/dossiers?q=${encodeURIComponent(q)}`);
  }

  return (
    <header className="sticky top-0 z-20 flex h-16 items-center gap-3 border-b border-border bg-card/80 px-4 backdrop-blur">
      <button
        type="button"
        onClick={onOuvrirMenu}
        className="rounded-DEFAULT p-2 text-muted-foreground hover:bg-muted lg:hidden"
        aria-label="Ouvrir le menu"
      >
        <Menu className="h-5 w-5" />
      </button>

      <form onSubmit={soumettreRecherche} className="relative flex-1 max-w-md">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <input
          type="search"
          value={recherche}
          onChange={(e) => setRecherche(e.target.value)}
          placeholder="Rechercher un dossier, un client…"
          className="h-9 w-full rounded-DEFAULT border border-input bg-background pl-9 pr-3 text-sm text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        />
      </form>

      <div className="ml-auto flex items-center gap-1">
        <ThemeToggle />
        <Link
          href="/notifications"
          className="relative inline-flex h-9 w-9 items-center justify-center rounded-DEFAULT text-muted-foreground hover:bg-muted hover:text-foreground"
          aria-label="Notifications"
        >
          <Bell className="h-5 w-5" />
          {notificationsNonLues > 0 && (
            <span className="absolute right-1.5 top-1.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-danger px-1 text-[10px] font-bold text-white">
              {notificationsNonLues > 9 ? "9+" : notificationsNonLues}
            </span>
          )}
        </Link>
        <div className="mx-1 h-6 w-px bg-border" />
        <UserMenu
          prenom={utilisateur.prenom}
          nom={utilisateur.nom}
          email={utilisateur.email}
          role={utilisateur.role}
          photoUrl={utilisateur.photoUrl}
        />
      </div>
    </header>
  );
}
