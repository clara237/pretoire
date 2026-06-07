import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { Clock } from "lucide-react";
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
import { Card } from "@/components/ui/card";
import { formatHeures, formatFCFA, formatDate } from "@/lib/utils";
import {
  listerSaisies,
  nomProfil,
  LIBELLE_TYPE_TACHE,
  TON_TYPE_TACHE,
} from "@/lib/queries/finance";
import { bornesSemaine } from "../_lib/semaine";
import { SaisieForm, type OptionSel } from "./saisie-form";
import { SaisieDelete } from "./saisie-delete";

export async function Timesheet({
  lundi,
  profileId,
  peutEditer,
  profils,
  dossiers,
  tauxParProfil,
  profilCourantId,
}: {
  lundi: Date;
  profileId?: string;
  peutEditer: boolean;
  profils: OptionSel[];
  dossiers: OptionSel[];
  tauxParProfil: Record<string, number | null>;
  profilCourantId?: string | null;
}) {
  const bornes = bornesSemaine(lundi);
  const saisies = await listerSaisies({
    profileId,
    debut: bornes.debutISO,
    fin: bornes.finISO,
  });

  // Totaux par jour (clé YYYY-MM-DD).
  const totauxJour = new Map<string, { heures: number; facturable: number }>();
  for (const j of bornes.jours) {
    totauxJour.set(format(j, "yyyy-MM-dd"), { heures: 0, facturable: 0 });
  }
  // Totaux par dossier.
  const totauxDossier = new Map<
    string,
    { libelle: string; heures: number; valorisation: number }
  >();
  let totalHeures = 0;
  let totalFacturable = 0;
  let totalValorisation = 0;

  for (const s of saisies) {
    const cle = s.date.slice(0, 10);
    const t = totauxJour.get(cle);
    if (t) {
      t.heures += s.duree_heures;
      if (s.facturable) t.facturable += s.duree_heures;
    }
    totalHeures += s.duree_heures;
    if (s.facturable) totalFacturable += s.duree_heures;
    const valo = s.facturable ? s.duree_heures * (s.taux_horaire ?? 0) : 0;
    totalValorisation += valo;

    const cleDossier = s.dossier?.id ?? "__sans__";
    const libelleDossier = s.dossier
      ? `${s.dossier.numero} — ${s.dossier.titre}`
      : "Sans dossier";
    const d = totauxDossier.get(cleDossier) ?? {
      libelle: libelleDossier,
      heures: 0,
      valorisation: 0,
    };
    d.heures += s.duree_heures;
    d.valorisation += valo;
    totauxDossier.set(cleDossier, d);
  }

  const dossiersTries = Array.from(totauxDossier.values()).sort(
    (a, b) => b.heures - a.heures,
  );

  return (
    <div className="space-y-6">
      {/* Bandeau totaux par jour */}
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 lg:grid-cols-7">
        {bornes.jours.map((j) => {
          const cle = format(j, "yyyy-MM-dd");
          const t = totauxJour.get(cle)!;
          const estAujourdhui = cle === new Date().toISOString().slice(0, 10);
          return (
            <Card
              key={cle}
              className={`p-3 text-center ${
                estAujourdhui ? "ring-1 ring-principale" : ""
              }`}
            >
              <p className="text-xs font-medium capitalize text-muted-foreground">
                {format(j, "EEE d", { locale: fr })}
              </p>
              <p className="mt-1 text-lg font-bold text-foreground">
                {formatHeures(t.heures)}
              </p>
              {t.facturable > 0 && (
                <p className="text-[11px] text-success">
                  {formatHeures(t.facturable)} fact.
                </p>
              )}
            </Card>
          );
        })}
      </div>

      {/* Synthèse de la semaine */}
      <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
        <Card className="flex items-center justify-between p-4">
          <span className="text-sm text-muted-foreground">Total heures</span>
          <span className="text-lg font-bold text-foreground">
            {formatHeures(totalHeures)}
          </span>
        </Card>
        <Card className="flex items-center justify-between p-4">
          <span className="text-sm text-muted-foreground">Dont facturables</span>
          <span className="text-lg font-bold text-success">
            {formatHeures(totalFacturable)}
          </span>
        </Card>
        <Card className="flex items-center justify-between p-4">
          <span className="text-sm text-muted-foreground">Valorisation</span>
          <span className="text-lg font-bold text-principale">
            {formatFCFA(totalValorisation)}
          </span>
        </Card>
      </div>

      {/* Détail des saisies */}
      {saisies.length === 0 ? (
        <EmptyState
          titre="Aucune saisie cette semaine"
          description="Enregistrez vos heures pour suivre votre activité et préparer la facturation."
          icone={Clock}
          action={
            peutEditer ? (
              <SaisieForm
                profils={profils}
                dossiers={dossiers}
                tauxParProfil={tauxParProfil}
                profilCourantId={profilCourantId}
              />
            ) : undefined
          }
        />
      ) : (
        <div className="space-y-6">
          <div>
            <h3 className="mb-2 text-sm font-semibold text-foreground">
              Saisies de la semaine
            </h3>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Avocat</TableHead>
                  <TableHead className="hidden md:table-cell">Dossier</TableHead>
                  <TableHead>Tâche</TableHead>
                  <TableHead className="text-right">Durée</TableHead>
                  <TableHead className="hidden lg:table-cell text-right">
                    Valorisation
                  </TableHead>
                  <TableHead className="w-px" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {saisies.map((s) => {
                  const valo = s.facturable
                    ? s.duree_heures * (s.taux_horaire ?? 0)
                    : 0;
                  return (
                    <TableRow key={s.id}>
                      <TableCell className="whitespace-nowrap text-sm">
                        {formatDate(s.date)}
                      </TableCell>
                      <TableCell className="text-sm">
                        {nomProfil(s.profil)}
                      </TableCell>
                      <TableCell className="hidden md:table-cell text-sm text-muted-foreground">
                        {s.dossier ? (
                          <span>
                            <span className="font-medium text-foreground">
                              {s.dossier.numero}
                            </span>{" "}
                            {s.dossier.titre}
                          </span>
                        ) : (
                          "—"
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Badge ton={TON_TYPE_TACHE[s.type_tache] ?? "neutre"}>
                            {LIBELLE_TYPE_TACHE[s.type_tache] ?? s.type_tache}
                          </Badge>
                          {!s.facturable && (
                            <Badge ton="neutre">non facturable</Badge>
                          )}
                          {s.facture_id && <Badge ton="succes">facturée</Badge>}
                        </div>
                        {s.description && (
                          <p className="mt-1 text-xs text-muted-foreground">
                            {s.description}
                          </p>
                        )}
                      </TableCell>
                      <TableCell className="text-right text-sm font-medium">
                        {formatHeures(s.duree_heures)}
                      </TableCell>
                      <TableCell className="hidden lg:table-cell text-right text-sm text-muted-foreground">
                        {valo > 0 ? formatFCFA(valo) : "—"}
                      </TableCell>
                      <TableCell className="text-right">
                        {peutEditer && !s.facture_id ? (
                          <div className="flex justify-end">
                            <SaisieForm
                              profils={profils}
                              dossiers={dossiers}
                              tauxParProfil={tauxParProfil}
                              declencheur="ligne"
                              initiale={{
                                id: s.id,
                                profile_id: s.profile_id,
                                dossier_id: s.dossier_id,
                                date: s.date.slice(0, 10),
                                type_tache: s.type_tache,
                                description: s.description,
                                duree_heures: s.duree_heures,
                                taux_horaire: s.taux_horaire,
                                facturable: s.facturable,
                              }}
                            />
                            <SaisieDelete
                              id={s.id}
                              libelle={`${formatDate(s.date)} — ${
                                LIBELLE_TYPE_TACHE[s.type_tache] ?? s.type_tache
                              }`}
                            />
                          </div>
                        ) : null}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>

          {/* Totaux par dossier */}
          <div>
            <h3 className="mb-2 text-sm font-semibold text-foreground">
              Total par dossier
            </h3>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Dossier</TableHead>
                  <TableHead className="text-right">Heures</TableHead>
                  <TableHead className="text-right">Valorisation</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {dossiersTries.map((d, i) => (
                  <TableRow key={i}>
                    <TableCell className="text-sm">{d.libelle}</TableCell>
                    <TableCell className="text-right text-sm font-medium">
                      {formatHeures(d.heures)}
                    </TableCell>
                    <TableCell className="text-right text-sm text-muted-foreground">
                      {d.valorisation > 0 ? formatFCFA(d.valorisation) : "—"}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>
      )}
    </div>
  );
}
