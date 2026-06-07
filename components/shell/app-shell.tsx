"use client";

import * as React from "react";
import { Sidebar } from "./sidebar";
import { Topbar, type TopbarUtilisateur } from "./topbar";

export function AppShell({
  utilisateur,
  notificationsNonLues,
  children,
}: {
  utilisateur: TopbarUtilisateur;
  notificationsNonLues?: number;
  children: React.ReactNode;
}) {
  const [mobileOuvert, setMobileOuvert] = React.useState(false);

  return (
    <div className="min-h-screen bg-background">
      <Sidebar
        role={utilisateur.role}
        mobileOuvert={mobileOuvert}
        onCloseMobile={() => setMobileOuvert(false)}
      />
      <div className="lg:pl-64">
        <Topbar
          utilisateur={utilisateur}
          notificationsNonLues={notificationsNonLues}
          onOuvrirMenu={() => setMobileOuvert(true)}
        />
        <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
          {children}
        </main>
      </div>
    </div>
  );
}
