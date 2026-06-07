import Link from "next/link";
import {
  Landmark,
  Hash,
  CalendarClock,
  CircleDollarSign,
  User,
  Building2,
  Gavel,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar } from "@/components/ui/avatar";
import { formatFCFA, formatDate } from "@/lib/utils";
import {
  LIBELLE_TYPE_AFFAIRE,
  nomClient,
  nomProfil,
  type DossierDetail,
} from "@/lib/queries/dossiers-labels";
import { Timeline, type EvenementTimeline } from "./timeline";

function Info({
  icone: Icone,
  libelle,
  valeur,
}: {
  icone: React.ComponentType<{ className?: string }>;
  libelle: string;
  valeur: string;
}) {
  return (
    <div className="flex items-start gap-3">
      <Icone className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
      <div className="min-w-0">
        <p className="text-xs text-muted-foreground">{libelle}</p>
        <p className="text-sm text-foreground break-words">{valeur}</p>
      </div>
    </div>
  );
}

function Expose({ titre, contenu }: { titre: string; contenu: string | null }) {
  return (
    <div>
      <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
        {titre}
      </p>
      {contenu ? (
        <p className="whitespace-pre-wrap text-sm text-foreground">{contenu}</p>
      ) : (
        <p className="text-sm text-muted-foreground">Non renseigné.</p>
      )}
    </div>
  );
}

export function OngletInfos({
  dossier,
  evenements,
}: {
  dossier: DossierDetail;
  evenements: EvenementTimeline[];
}) {
  const morale = dossier.client?.type === "morale";
  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
      <div className="space-y-6 lg:col-span-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Caractéristiques</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Info
              icone={Gavel}
              libelle="Type d'affaire"
              valeur={LIBELLE_TYPE_AFFAIRE[dossier.type_affaire] ?? dossier.type_affaire}
            />
            <Info
              icone={morale ? Building2 : User}
              libelle="Client"
              valeur={nomClient(dossier.client)}
            />
            <Info
              icone={Landmark}
              libelle="Juridiction"
              valeur={dossier.tribunal || "—"}
            />
            <Info icone={Gavel} libelle="Chambre" valeur={dossier.chambre || "—"} />
            <Info
              icone={Hash}
              libelle="Numéro de rôle"
              valeur={dossier.numero_role || "—"}
            />
            <Info
              icone={CircleDollarSign}
              libelle="Montant en jeu"
              valeur={
                dossier.montant_enjeu != null
                  ? formatFCFA(dossier.montant_enjeu)
                  : "—"
              }
            />
            <Info
              icone={CalendarClock}
              libelle="Date d'ouverture"
              valeur={formatDate(dossier.date_ouverture)}
            />
            <Info
              icone={CalendarClock}
              libelle="Clôture prévue"
              valeur={
                dossier.date_cloture_prev
                  ? formatDate(dossier.date_cloture_prev)
                  : "—"
              }
            />
            {dossier.date_cloture_reel && (
              <Info
                icone={CalendarClock}
                libelle="Clôture effective"
                valeur={formatDate(dossier.date_cloture_reel)}
              />
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Exposé de l&apos;affaire</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Expose titre="Faits" contenu={dossier.description_faits} />
            <Expose titre="Prétentions" contenu={dossier.pretentions} />
            <Expose titre="Moyens" contenu={dossier.moyens} />
          </CardContent>
        </Card>
      </div>

      <div className="space-y-6">
        {/* Avocat responsable */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Avocat responsable</CardTitle>
          </CardHeader>
          <CardContent>
            {dossier.avocat ? (
              <div className="flex items-center gap-3">
                <Avatar
                  prenom={dossier.avocat.prenom}
                  nom={dossier.avocat.nom}
                  src={dossier.avocat.photo_url}
                  taille="lg"
                />
                <div>
                  <p className="text-sm font-medium text-foreground">
                    {nomProfil(dossier.avocat)}
                  </p>
                  <p className="text-xs text-muted-foreground">Responsable</p>
                </div>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">Non assigné.</p>
            )}
            {dossier.client && (
              <Link
                href={`/clients/${dossier.client.id}`}
                className="mt-4 inline-flex text-sm text-principale hover:underline"
              >
                Voir la fiche client →
              </Link>
            )}
          </CardContent>
        </Card>

        {/* Timeline */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Chronologie</CardTitle>
          </CardHeader>
          <CardContent>
            <Timeline evenements={evenements} />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
