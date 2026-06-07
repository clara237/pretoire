"use client";

import * as React from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";
import { Mail, Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input, Field } from "@/components/ui/input";
import { createClient } from "@/lib/supabase/client";

export function LoginForm() {
  const router = useRouter();
  const params = useSearchParams();
  const [email, setEmail] = React.useState("");
  const [motDePasse, setMotDePasse] = React.useState("");
  const [chargement, setChargement] = React.useState(false);
  const [erreur, setErreur] = React.useState<string | null>(null);

  async function soumettre(e: React.FormEvent) {
    e.preventDefault();
    setErreur(null);
    setChargement(true);
    const supabase = createClient();
    const { error } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password: motDePasse,
    });
    if (error) {
      const message =
        error.message === "Invalid login credentials"
          ? "Identifiants incorrects. Vérifiez votre email et votre mot de passe."
          : "Une erreur est survenue lors de la connexion. Veuillez réessayer.";
      setErreur(message);
      toast.error(message);
      setChargement(false);
      return;
    }
    toast.success("Connexion réussie");
    const redirect = params.get("redirect") || "/dashboard";
    router.push(redirect);
    router.refresh();
  }

  return (
    <form onSubmit={soumettre} className="space-y-4">
      <Field label="Adresse email" htmlFor="email" requis>
        <div className="relative">
          <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            id="email"
            type="email"
            autoComplete="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="vous@cabinet.cm"
            className="pl-9"
          />
        </div>
      </Field>

      <Field label="Mot de passe" htmlFor="mot-de-passe" requis>
        <div className="relative">
          <Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            id="mot-de-passe"
            type="password"
            autoComplete="current-password"
            required
            value={motDePasse}
            onChange={(e) => setMotDePasse(e.target.value)}
            placeholder="••••••••"
            className="pl-9"
          />
        </div>
      </Field>

      {erreur && (
        <div className="rounded-DEFAULT border border-danger/20 bg-danger/10 px-3 py-2 text-sm text-danger">
          {erreur}
        </div>
      )}

      <Button
        type="submit"
        className="w-full"
        taille="lg"
        enChargement={chargement}
      >
        Se connecter
      </Button>
    </form>
  );
}
