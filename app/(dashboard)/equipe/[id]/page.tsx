import { notFound } from "next/navigation";
import Link from "next/link";
import {
  Briefcase,
  Clock,
  Target,
  Phone,
  Mail,
  Award,
  CalendarDays,
} from "lucide-react";
import { PageHeader } from "@/components/ui/page-header";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar } from "@/components/ui/avatar";
import { StatCard } from "@/components/ui/stat-card";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/components/ui/table";
import { EmptyState } from "@/components/ui/empty-state";
import { createClient } from "@/lib/supabase/server";
import { getProfilCourant } from "@/lib/auth";
import { canEdit, LIBELLES_ROLES, type Role } from "@/lib/roles";
import { formatHeures, formatFCFA, formatDate } from "@/lib/utils";
import {
  LIBELLE_STATUT,
  LIBELLE_TYPE_AFFAIRE as LIBELLE_AFFAIRE,
} from "@/lib/queries/dossiers-labels";
import { ProfilEdit } from "../_components/profil-edit";
import { JaugeObjectif } from "../_components/jauge-objectif";
import { bornesMoisCourant, OBJECTIF_HEURES_MENSUEL } from "../_lib/charge";

export const dynamic = "force-dynamic";

interface DossierLigne {
  id: string;
  numero: string;
  titre: string;
  statut: string;
  type_affaire: string;
}

export default async function AvocatPage({
  params,
}: {
  params: { id: string };
}) {
  const supabase = createClient();
  const { debut, fin } = bornesMoisCourant();

  const { data: avocat } = await supabase
    .from("profiles")
    .select(
      "id, nom, prenom, email, telephone, role, photo_url, barreau_numero, specialites, taux_horaire, date_entree, actif",
    )
    .eq("id", params.id)
    .maybeSingle();

  if (!avocat) notFound();

  const a = avocat as {
    id: string;
    nom: string;
    prenom: string;
    email: string;
    telephone: string | null;
    role: Role;
    photo_url: string | null;
    barreau_numero: string | null;
    specialites: string[] | null;
    taux_horaire: number | null;
    date_entree: string | null;
    actif: boolean;
  };

  const [profilCourant, dossiersRes, heuresMoisRes, heuresTotalRes] =
    await Promise.all([
      getProfilCourant(),
      supabase
        .from("dossiers")
        .select("id, numero, titre, statut, type_affaire")
        .eq("avocat_responsable_id", params.id)
        .order("created_at", { ascending: false }),
      supabase
        .from("saisies_temps")
        .select("duree_heures, facturable")
        .eq("profile_id", params.id)
        .gte("date", debut)
        .lte("date", fin),
      supabase
        .from("saisies_temps")
        .select("duree_heures, facturable")
        .eq("profile_id", params.id),
    ]);

  const peutEditer = canEdit(profilCourant?.role, "equipe");
  const tousDossiers = (dossiersRes.data ?? []) as DossierLigne[];
  const dossiersActifs = tousDossiers.filter((d) =>
    ["ouvert", "en_cours", "suspendu"].includes(d.statut),
  );

  const heuresFactMois = ((heuresMoisRes.data ?? []) as Array<{
    duree_heures: number | null;
    facturable: boolean | null;
  }>)
    .filter((s) => s.facturable)
    .reduce((acc, s) => acc + (s.duree_heures ?? 0), 0);

  const heuresFactTotal = ((heuresTotalRes.data ?? []) as Array<{
    duree_heures: number | null;
    facturable: boolean | null;
  }>)
    .filter((s) => s.facturable)
    .reduce((acc, s) => acc + (s.duree_heures ?? 0), 0);

  const revenuPotentielMois = a.taux_horaire
    ? heuresFactMois * a.taux_horaire
    : null;

  return (
    <div>
      <PageHeader
        titre={`${a.prenom} ${a.nom}`}
        description={LIBELLES_ROLES[a.role] ?? a.role}
        actions={
          peutEditer ? (
            <ProfilEdit
              profileId={a.id}
              valeurs={{
                barreau_numero: a.barreau_numero,
                telephone: a.telephone,
                specialites: a.specialites,
                taux_horaire: a.taux_horaire,
              }}
            />
          ) : undefined
        }
      />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Colonne profil */}
        <Card className="lg:col-span-1">
          <CardContent className="pt-6">
            <div className="flex flex-col items-center text-center">
              <Avatar
                prenom={a.prenom}
                nom={a.nom}
                src={a.photo_url}
                taille="lg"
              />
              <h2 className="mt-3 text-lg font-semibold text-foreground">
                {a.prenom} {a.nom}
              </h2>
              <Badge ton={a.actif ? "succes" : "neutre"} className="mt-1">
                {a.actif ? "Actif" : "Inactif"}
              </Badge>
            </div>

            <dl className="mt-6 space-y-3 text-sm">
              <Ligne icone={Mail} libelle="Email" valeur={a.email} />
              {a.telephone && (
                <Ligne icone={Phone} libelle="Téléphone" valeur={a.telephone} />
              )}
              <Ligne
                icone={Award}
                libelle="Barreau"
                valeur={a.barreau_numero ? `N° ${a.barreau_numero}` : "—"}
              />
              {a.date_entree && (
                <Ligne
                  icone={CalendarDays}
                  libelle="Entrée"
                  valeur={formatDate(a.date_entree)}
                />
              )}
            </dl>

            <div className="mt-6">
              <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Spécialités
              </p>
              {a.specialites && a.specialites.length > 0 ? (
                <div className="flex flex-wrap gap-1.5">
                  {a.specialites.map((s) => (
                    <Badge key={s} ton="principal">
                      {s}
                    </Badge>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">
                  Aucune spécialité renseignée.
                </p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Colonne charge & activité */}
        <div className="space-y-6 lg:col-span-2">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <StatCard
              libelle="Dossiers actifs"
              valeur={dossiersActifs.length}
              icone={Briefcase}
              ton="principal"
            />
            <StatCard
              libelle="Heures fact. (mois)"
              valeur={formatHeures(heuresFactMois)}
              icone={Clock}
              ton="avertissement"
            />
            <StatCard
              libelle="Heures fact. (total)"
              valeur={formatHeures(heuresFactTotal)}
              icone={Clock}
              ton="neutre"
            />
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Target className="h-4 w-4 text-principale" />
                Objectif mensuel d&apos;heures facturables
              </CardTitle>
            </CardHeader>
            <CardContent>
              <JaugeObjectif
                realise={heuresFactMois}
                objectif={OBJECTIF_HEURES_MENSUEL}
              />
              {revenuPotentielMois != null && (
                <p className="mt-3 text-sm text-muted-foreground">
                  Revenu facturable estimé ce mois :{" "}
                  <span className="font-medium text-foreground">
                    {formatFCFA(revenuPotentielMois)}
                  </span>
                  {a.taux_horaire && (
                    <> (taux {formatFCFA(a.taux_horaire)}/h)</>
                  )}
                </p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Briefcase className="h-4 w-4 text-principale" />
                Dossiers en responsabilité
              </CardTitle>
            </CardHeader>
            <CardContent>
              {tousDossiers.length === 0 ? (
                <EmptyState
                  titre="Aucun dossier"
                  description="Ce membre n'est responsable d'aucun dossier."
                  icone={Briefcase}
                />
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Numéro</TableHead>
                      <TableHead>Titre</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Statut</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {tousDossiers.map((d) => (
                      <TableRow key={d.id}>
                        <TableCell className="font-medium">
                          <Link
                            href={`/dossiers/${d.id}`}
                            className="text-principale hover:underline"
                          >
                            {d.numero}
                          </Link>
                        </TableCell>
                        <TableCell>{d.titre}</TableCell>
                        <TableCell className="text-muted-foreground">
                          {LIBELLE_AFFAIRE[d.type_affaire] ?? d.type_affaire}
                        </TableCell>
                        <TableCell>
                          <Badge
                            ton={
                              d.statut === "en_cours"
                                ? "principal"
                                : d.statut === "cloture"
                                  ? "succes"
                                  : d.statut === "suspendu"
                                    ? "avertissement"
                                    : d.statut === "archive"
                                      ? "neutre"
                                      : "info"
                            }
                          >
                            {LIBELLE_STATUT[d.statut] ?? d.statut}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      <div className="mt-6">
        <Link href="/equipe">
          <Button variante="lien" taille="sm">
            ← Retour à l&apos;équipe
          </Button>
        </Link>
      </div>
    </div>
  );
}

function Ligne({
  icone: Icone,
  libelle,
  valeur,
}: {
  icone: typeof Mail;
  libelle: string;
  valeur: string;
}) {
  return (
    <div className="flex items-center gap-2.5">
      <Icone className="h-4 w-4 shrink-0 text-muted-foreground" />
      <span className="text-muted-foreground">{libelle} :</span>
      <span className="ml-auto truncate font-medium text-foreground">
        {valeur}
      </span>
    </div>
  );
}
