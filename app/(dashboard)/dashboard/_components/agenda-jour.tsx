import Link from "next/link";
import { CalendarClock, MapPin } from "lucide-react";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import { createClient } from "@/lib/supabase/server";
import { formatTime, formatDateLongue } from "@/lib/utils";
import { LIBELLE_TYPE, TON_TYPE } from "../../agenda/_lib/evenements";

export async function AgendaJour() {
  const supabase = createClient();
  const debut = new Date();
  debut.setHours(0, 0, 0, 0);
  const fin = new Date();
  fin.setHours(23, 59, 59, 999);

  const { data } = await supabase
    .from("evenements")
    .select("id, titre, type, lieu, date_debut")
    .gte("date_debut", debut.toISOString())
    .lte("date_debut", fin.toISOString())
    .order("date_debut", { ascending: true });

  const evenements = data ?? [];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <CalendarClock className="h-4 w-4 text-principale" />
          Agenda du jour
        </CardTitle>
        <p className="text-sm text-muted-foreground capitalize">
          {formatDateLongue(new Date())}
        </p>
      </CardHeader>
      <CardContent>
        {evenements.length === 0 ? (
          <EmptyState
            titre="Aucun événement aujourd'hui"
            description="Votre journée est libre."
            icone={CalendarClock}
            action={
              <Link
                href="/agenda/nouveau"
                className="text-sm font-medium text-principale hover:underline"
              >
                Planifier un événement
              </Link>
            }
          />
        ) : (
          <ul className="space-y-2">
            {evenements.map((e) => (
              <li
                key={e.id}
                className="flex items-center gap-3 rounded-DEFAULT border border-border p-3"
              >
                <div className="w-14 shrink-0 text-sm font-semibold text-foreground">
                  {formatTime(e.date_debut)}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-foreground">
                    {e.titre}
                  </p>
                  {e.lieu && (
                    <p className="flex items-center gap-1 truncate text-xs text-muted-foreground">
                      <MapPin className="h-3 w-3" />
                      {e.lieu}
                    </p>
                  )}
                </div>
                <Badge ton={TON_TYPE[e.type] ?? "neutre"}>
                  {LIBELLE_TYPE[e.type] ?? e.type}
                </Badge>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
