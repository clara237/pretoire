"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";
import { NAVIGATION } from "@/lib/navigation";
import { hasAccess, type Role } from "@/lib/roles";
import { PretoireLogo } from "@/components/logos/pretoire-logo";
import { useCabinet } from "@/components/providers/cabinet-provider";

export function Sidebar({
  role,
  mobileOuvert,
  onCloseMobile,
}: {
  role: Role;
  mobileOuvert: boolean;
  onCloseMobile: () => void;
}) {
  const pathname = usePathname();
  const cabinet = useCabinet();

  const groupes = NAVIGATION.map((g) => ({
    ...g,
    items: g.items.filter((i) => hasAccess(role, i.section)),
  })).filter((g) => g.items.length > 0);

  return (
    <>
      {/* Overlay mobile */}
      {mobileOuvert && (
        <div
          className="fixed inset-0 z-30 bg-black/50 lg:hidden"
          onClick={onCloseMobile}
          aria-hidden
        />
      )}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-40 flex w-64 flex-col border-r border-border bg-card transition-transform lg:translate-x-0",
          mobileOuvert ? "translate-x-0" : "-translate-x-full",
        )}
      >
        {/* En-tête : logo + nom cabinet */}
        <div className="flex h-16 items-center justify-between gap-2 border-b border-border px-4">
          <Link href="/dashboard" className="flex items-center gap-2.5 overflow-hidden">
            <PretoireLogo size={32} className="shrink-0" />
            <div className="flex flex-col overflow-hidden">
              <span className="truncate text-sm font-bold leading-tight text-foreground">
                {cabinet.nom_cabinet}
              </span>
              <span className="text-[10px] uppercase tracking-wide text-muted-foreground">
                Prétoire
              </span>
            </div>
          </Link>
          <button
            type="button"
            onClick={onCloseMobile}
            className="rounded-DEFAULT p-1.5 text-muted-foreground hover:bg-muted lg:hidden"
            aria-label="Fermer le menu"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 space-y-5 overflow-y-auto px-3 py-4">
          {groupes.map((g) => (
            <div key={g.titre}>
              <p className="mb-1.5 px-3 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                {g.titre}
              </p>
              <ul className="space-y-0.5">
                {g.items.map((item) => {
                  const actif =
                    pathname === item.href ||
                    (item.href !== "/dashboard" && pathname.startsWith(item.href));
                  const Icone = item.icone;
                  return (
                    <li key={item.href}>
                      <Link
                        href={item.href}
                        onClick={onCloseMobile}
                        className={cn(
                          "flex items-center gap-3 rounded-DEFAULT px-3 py-2 text-sm font-medium transition-colors",
                          actif
                            ? "bg-principale text-principale-foreground"
                            : "text-muted-foreground hover:bg-muted hover:text-foreground",
                        )}
                      >
                        <Icone className="h-4 w-4 shrink-0" />
                        <span className="truncate">{item.label}</span>
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
        </nav>

        <div className="border-t border-border p-3 text-center text-[10px] text-muted-foreground">
          {cabinet.barreau ?? "Barreau du Cameroun"}
        </div>
      </aside>
    </>
  );
}
