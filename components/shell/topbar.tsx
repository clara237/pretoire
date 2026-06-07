"use client";

import * as React from "react";
import Link from "next/link";
import { Menu, Bell } from "lucide-react";
import { ThemeToggle } from "./theme-toggle";
import { UserMenu } from "./user-menu";
import { RechercheGlobale } from "./recherche-globale";
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

      <RechercheGlobale />

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
