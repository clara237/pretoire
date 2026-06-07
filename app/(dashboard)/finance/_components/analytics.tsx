import { Users, PieChart } from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { formatFCFA } from "@/lib/utils";
import { topClients, revenusParType } from "../_lib/donnees";

/** Barre proportionnelle simple. */
function BarreProportion({
  libelle,
  montant,
  max,
  rang,
}: {
  libelle: string;
  montant: number;
  max: number;
  rang?: number;
}) {
  const pct = max > 0 ? Math.round((montant / max) * 100) : 0;
  return (
    <div>
      <div className="mb-1 flex items-center justify-between gap-2 text-sm">
        <span className="flex min-w-0 items-center gap-2">
          {rang != null && (
            <span className="inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-muted text-[11px] font-semibold text-muted-foreground">
              {rang}
            </span>
          )}
          <span className="truncate text-foreground">{libelle}</span>
        </span>
        <span className="shrink-0 font-medium text-foreground">
          {formatFCFA(montant)}
        </span>
      </div>
      <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
        <div
          className="h-full rounded-full bg-principale"
          style={{ width: `${Math.max(pct, 2)}%` }}
        />
      </div>
    </div>
  );
}

export async function TopClients() {
  const clients = await topClients();
  const max = clients[0]?.montant ?? 0;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Top 10 clients par revenus</CardTitle>
      </CardHeader>
      <CardContent>
        {clients.length === 0 ? (
          <EmptyState
            titre="Aucun revenu"
            description="Les revenus apparaîtront une fois des factures émises."
            icone={Users}
          />
        ) : (
          <div className="space-y-3">
            {clients.map((c, i) => (
              <BarreProportion
                key={`${c.nom}-${i}`}
                libelle={c.nom}
                montant={c.montant}
                max={max}
                rang={i + 1}
              />
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export async function RevenusParType() {
  const types = await revenusParType();
  const max = types[0]?.montant ?? 0;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Revenus par type de dossier</CardTitle>
      </CardHeader>
      <CardContent>
        {types.length === 0 ? (
          <EmptyState
            titre="Aucun revenu"
            description="La répartition par type s'affichera dès la première facture."
            icone={PieChart}
          />
        ) : (
          <div className="space-y-3">
            {types.map((t, i) => (
              <BarreProportion
                key={`${t.libelle}-${i}`}
                libelle={t.libelle}
                montant={t.montant}
                max={max}
              />
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
