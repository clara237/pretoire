import Link from "next/link";
import { Briefcase } from "lucide-react";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
} from "@/components/ui/card";
import { Badge, type BadgeTon } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import { createClient } from "@/lib/supabase/server";
import { formatDate } from "@/lib/utils";

const TON_STATUT: Record<string, BadgeTon> = {
  ouvert: "info",
  en_cours: "principal",
  suspendu: "avertissement",
  cloture: "succes",
  archive: "neutre",
};

const LIBELLE_STATUT: Record<string, string> = {
  ouvert: "Ouvert",
  en_cours: "En cours",
  suspendu: "Suspendu",
  cloture: "Clôturé",
  archive: "Archivé",
};

export async function DossiersRecents() {
  const supabase = createClient();
  const { data } = await supabase
    .from("dossiers")
    .select("id, numero, titre, statut, date_ouverture, clients(nom, raison_sociale)")
    .order("created_at", { ascending: false })
    .limit(6);

  const dossiers = (data ?? []) as Array<{
    id: string;
    numero: string;
    titre: string;
    statut: string;
    date_ouverture: string;
    clients: { nom: string | null; raison_sociale: string | null } | null;
  }>;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <Briefcase className="h-4 w-4 text-principale" />
          Dossiers récents
        </CardTitle>
      </CardHeader>
      <CardContent>
        {dossiers.length === 0 ? (
          <EmptyState
            titre="Aucun dossier"
            description="Créez votre premier dossier pour commencer."
            icone={Briefcase}
            action={
              <Link
                href="/dossiers/nouveau"
                className="text-sm font-medium text-principale hover:underline"
              >
                Nouveau dossier
              </Link>
            }
          />
        ) : (
          <ul className="divide-y divide-border">
            {dossiers.map((d) => {
              const client =
                d.clients?.raison_sociale || d.clients?.nom || "Client inconnu";
              return (
                <li key={d.id}>
                  <Link
                    href={`/dossiers/${d.id}`}
                    className="flex items-center gap-3 py-3 hover:bg-muted/40 -mx-2 px-2 rounded-DEFAULT"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-foreground">
                        {d.titre}
                      </p>
                      <p className="truncate text-xs text-muted-foreground">
                        {d.numero} · {client} · {formatDate(d.date_ouverture)}
                      </p>
                    </div>
                    <Badge ton={TON_STATUT[d.statut] ?? "neutre"}>
                      {LIBELLE_STATUT[d.statut] ?? d.statut}
                    </Badge>
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
