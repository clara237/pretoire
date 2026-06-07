import { Suspense } from "react";
import type { Metadata } from "next";
import { getCabinetConfig } from "@/lib/cabinet";
import { LogoBarreauCameroun } from "@/components/logos/barreau-cameroun";
import { LoginForm } from "./login-form";

export const metadata: Metadata = {
  title: "Connexion — Prétoire",
};

export default async function LoginPage() {
  const cabinet = await getCabinetConfig();

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4 py-12">
      <div className="w-full max-w-md">
        <div className="mb-8 flex flex-col items-center text-center">
          <LogoBarreauCameroun size={88} />
          <h1 className="mt-4 text-2xl font-bold text-foreground">
            {cabinet.nom_cabinet}
          </h1>
          {cabinet.nom_avocat_principal && (
            <p className="mt-1 text-sm text-muted-foreground">
              {cabinet.nom_avocat_principal}
            </p>
          )}
          {cabinet.barreau && (
            <p className="mt-0.5 text-xs uppercase tracking-wider text-muted-foreground">
              {cabinet.barreau}
            </p>
          )}
        </div>

        <div className="rounded-xl border border-border bg-card p-6 shadow-sm sm:p-8">
          <div className="mb-6">
            <h2 className="text-lg font-semibold text-foreground">Connexion</h2>
            <p className="text-sm text-muted-foreground">
              Accédez à votre espace de gestion du cabinet.
            </p>
          </div>
          <Suspense fallback={<div className="h-64" />}>
            <LoginForm />
          </Suspense>
        </div>

        <p className="mt-6 text-center text-xs text-muted-foreground">
          Prétoire — Logiciel de gestion de cabinet d&apos;avocats
        </p>
      </div>
    </div>
  );
}
