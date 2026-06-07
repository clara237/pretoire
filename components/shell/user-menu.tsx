"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { LogOut, ChevronDown } from "lucide-react";
import { Avatar } from "@/components/ui/avatar";
import { createClient } from "@/lib/supabase/client";
import { LIBELLES_ROLES, type Role } from "@/lib/roles";
import { cn } from "@/lib/utils";

export function UserMenu({
  prenom,
  nom,
  email,
  role,
  photoUrl,
}: {
  prenom: string;
  nom: string;
  email: string;
  role: Role;
  photoUrl?: string | null;
}) {
  const router = useRouter();
  const [ouvert, setOuvert] = React.useState(false);
  const ref = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOuvert(false);
      }
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  async function deconnexion() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  }

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOuvert((o) => !o)}
        className="flex items-center gap-2 rounded-DEFAULT px-1.5 py-1 hover:bg-muted"
      >
        <Avatar prenom={prenom} nom={nom} src={photoUrl} taille="sm" />
        <div className="hidden text-left sm:block">
          <p className="text-sm font-medium leading-tight text-foreground">
            {prenom} {nom}
          </p>
          <p className="text-[11px] text-muted-foreground">
            {LIBELLES_ROLES[role]}
          </p>
        </div>
        <ChevronDown className="h-4 w-4 text-muted-foreground" />
      </button>

      {ouvert && (
        <div
          className={cn(
            "absolute right-0 top-full z-50 mt-2 w-60 rounded-lg border border-border bg-card p-1.5 shadow-lg animate-scale-in",
          )}
        >
          <div className="border-b border-border px-3 py-2">
            <p className="text-sm font-medium text-foreground">
              {prenom} {nom}
            </p>
            <p className="truncate text-xs text-muted-foreground">{email}</p>
          </div>
          <button
            type="button"
            onClick={deconnexion}
            className="mt-1 flex w-full items-center gap-2 rounded-DEFAULT px-3 py-2 text-sm text-danger hover:bg-danger/10"
          >
            <LogOut className="h-4 w-4" />
            Se déconnecter
          </button>
        </div>
      )}
    </div>
  );
}
