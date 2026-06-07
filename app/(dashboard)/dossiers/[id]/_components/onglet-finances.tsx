import Link from "next/link";
import { Receipt, Clock, CircleDollarSign } from "lucide-react";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import { StatCard } from "@/components/ui/stat-card";
import { formatFCFA, formatDate, formatHeures } from "@/lib/utils";
import {
  LIBELLE_STATUT_FACTURE,
  TON_STATUT_FACTURE,
  LIBELLE_TYPE_TACHE as LIBELLE_TACHE,
} from "@/lib/finance-constants";

export interface FactureDossier {
  id: string;
  numero: string;
  date_emission: string;
  montant_ttc: number | null;
  statut: string;
}

export interface SaisieDossier {
  id: string;
  date: string;
  type_tache: string;
  description: string | null;
  duree_heures: number | null;
  facturable: boolean;
  profile: { nom: string; prenom: string } | null;
}

export function OngletFinances({
  factures,
  saisies,
  devise,
}: {
  factures: FactureDossier[];
  saisies: SaisieDossier[];
  devise: string;
}) {
  const totalFacture = factures.reduce((s, f) => s + (f.montant_ttc ?? 0), 0);
  const totalHeures = saisies.reduce((s, t) => s + (t.duree_heures ?? 0), 0);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard
          libelle="Total facturé"
          valeur={formatFCFA(totalFacture, devise)}
          icone={CircleDollarSign}
          ton="principal"
        />
        <StatCard
          libelle="Factures"
          valeur={factures.length}
          icone={Receipt}
          ton="succes"
        />
        <StatCard
          libelle="Temps saisi"
          valeur={formatHeures(totalHeures)}
          icone={Clock}
          ton="avertissement"
        />
      </div>

      {/* Factures */}
      <section className="space-y-3">
        <h2 className="flex items-center gap-2 text-base font-semibold text-foreground">
          <Receipt className="h-4 w-4 text-principale" />
          Factures
        </h2>
        {factures.length === 0 ? (
          <EmptyState
            titre="Aucune facture"
            description="Les factures de ce dossier apparaîtront ici."
            icone={Receipt}
          />
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Numéro</TableHead>
                <TableHead>Émission</TableHead>
                <TableHead>Montant TTC</TableHead>
                <TableHead>Statut</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {factures.map((f) => (
                <TableRow key={f.id}>
                  <TableCell className="font-mono text-xs">
                    <Link
                      href={`/facturation/${f.id}`}
                      className="text-principale hover:underline"
                    >
                      {f.numero}
                    </Link>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {formatDate(f.date_emission)}
                  </TableCell>
                  <TableCell className="text-sm font-medium">
                    {formatFCFA(f.montant_ttc, devise)}
                  </TableCell>
                  <TableCell>
                    <Badge ton={TON_STATUT_FACTURE[f.statut] ?? "neutre"}>
                      {LIBELLE_STATUT_FACTURE[f.statut] ?? f.statut}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </section>

      {/* Saisies de temps */}
      <section className="space-y-3">
        <h2 className="flex items-center gap-2 text-base font-semibold text-foreground">
          <Clock className="h-4 w-4 text-principale" />
          Saisies de temps
        </h2>
        {saisies.length === 0 ? (
          <EmptyState
            titre="Aucune saisie de temps"
            description="Le temps passé sur ce dossier apparaîtra ici."
            icone={Clock}
          />
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Tâche</TableHead>
                <TableHead className="hidden md:table-cell">Avocat</TableHead>
                <TableHead>Durée</TableHead>
                <TableHead>Facturable</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {saisies.map((t) => (
                <TableRow key={t.id}>
                  <TableCell className="text-sm text-muted-foreground">
                    {formatDate(t.date)}
                  </TableCell>
                  <TableCell>
                    <span className="text-sm font-medium text-foreground">
                      {LIBELLE_TACHE[t.type_tache] ?? t.type_tache}
                    </span>
                    {t.description && (
                      <span className="block text-xs text-muted-foreground">
                        {t.description}
                      </span>
                    )}
                  </TableCell>
                  <TableCell className="hidden md:table-cell text-sm text-muted-foreground">
                    {t.profile ? `${t.profile.prenom} ${t.profile.nom}` : "—"}
                  </TableCell>
                  <TableCell className="text-sm">{formatHeures(t.duree_heures)}</TableCell>
                  <TableCell>
                    {t.facturable ? (
                      <Badge ton="succes">Oui</Badge>
                    ) : (
                      <Badge ton="neutre">Non</Badge>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </section>
    </div>
  );
}
