import { notFound } from "next/navigation";
import Link from "next/link";
import {
  User,
  Building2,
  Mail,
  Phone,
  MapPin,
  IdCard,
  Briefcase,
  ArrowLeft,
  Plus,
} from "lucide-react";
import { PageHeader } from "@/components/ui/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { getProfilCourant } from "@/lib/auth";
import { canEdit } from "@/lib/roles";
import { createClient } from "@/lib/supabase/server";
import { formatDate, formatFCFA } from "@/lib/utils";
import {
  recupererClient,
  nomAffichage,
  LIBELLE_TYPE_CLIENT,
  TON_TYPE_CLIENT,
} from "@/lib/queries/clients";
import {
  LIBELLE_STATUT,
  TON_STATUT,
  LIBELLE_TYPE_AFFAIRE,
} from "@/lib/queries/dossiers";
import { ClientActions } from "../_components/client-actions";

export const dynamic = "force-dynamic";

interface DossierClient {
  id: string;
  numero: string;
  titre: string;
  type_affaire: string;
  statut: string;
  date_ouverture: string;
  montant_enjeu: number | null;
}

function LigneInfo({
  icone: Icone,
  libelle,
  valeur,
}: {
  icone: React.ComponentType<{ className?: string }>;
  libelle: string;
  valeur: string | null | undefined;
}) {
  return (
    <div className="flex items-start gap-3">
      <Icone className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
      <div className="min-w-0">
        <p className="text-xs text-muted-foreground">{libelle}</p>
        <p className="text-sm text-foreground break-words">{valeur || "—"}</p>
      </div>
    </div>
  );
}

export default async function ClientDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const [profil, client] = await Promise.all([
    getProfilCourant(),
    recupererClient(params.id),
  ]);
  if (!client) notFound();

  const peutEditer = canEdit(profil?.role, "clients");

  const supabase = createClient();
  const { data: dossiersData } = await supabase
    .from("dossiers")
    .select("id, numero, titre, type_affaire, statut, date_ouverture, montant_enjeu")
    .eq("client_id", client.id)
    .order("created_at", { ascending: false });
  const dossiers = (dossiersData ?? []) as unknown as DossierClient[];

  const morale = client.type === "morale";

  return (
    <div>
      <Link
        href="/clients"
        className="mb-4 inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" />
        Retour aux clients
      </Link>

      <PageHeader
        titre={nomAffichage(client)}
        actions={peutEditer ? <ClientActions client={client} /> : undefined}
      />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Fiche client */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-principale/10 p-2.5 text-principale">
                {morale ? (
                  <Building2 className="h-5 w-5" />
                ) : (
                  <User className="h-5 w-5" />
                )}
              </div>
              <div>
                <CardTitle className="text-base">{nomAffichage(client)}</CardTitle>
                <Badge ton={TON_TYPE_CLIENT[client.type] ?? "neutre"} className="mt-1">
                  {LIBELLE_TYPE_CLIENT[client.type] ?? client.type}
                </Badge>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <LigneInfo icone={Mail} libelle="Email" valeur={client.email} />
            <LigneInfo icone={Phone} libelle="Téléphone" valeur={client.telephone} />
            <LigneInfo
              icone={MapPin}
              libelle="Adresse"
              valeur={[client.adresse, client.ville].filter(Boolean).join(", ")}
            />
            <LigneInfo
              icone={IdCard}
              libelle={morale ? "Numéro RCCM" : "Numéro CNI"}
              valeur={morale ? client.rccm_numero : client.cni_numero}
            />
            {client.notes && (
              <div className="rounded-DEFAULT border border-border bg-muted/30 p-3">
                <p className="text-xs text-muted-foreground">Notes</p>
                <p className="mt-1 whitespace-pre-wrap text-sm text-foreground">
                  {client.notes}
                </p>
              </div>
            )}
            <p className="pt-1 text-xs text-muted-foreground">
              Client depuis le {formatDate(client.created_at)}
            </p>
          </CardContent>
        </Card>

        {/* Dossiers du client */}
        <Card className="lg:col-span-2">
          <CardHeader className="flex-row items-center justify-between space-y-0">
            <CardTitle className="flex items-center gap-2 text-base">
              <Briefcase className="h-4 w-4 text-principale" />
              Dossiers ({dossiers.length})
            </CardTitle>
            {canEdit(profil?.role, "dossiers") && (
              <Link href={`/dossiers/nouveau?client=${client.id}`}>
                <Button taille="sm" variante="contour" iconeGauche={<Plus className="h-4 w-4" />}>
                  Nouveau dossier
                </Button>
              </Link>
            )}
          </CardHeader>
          <CardContent>
            {dossiers.length === 0 ? (
              <EmptyState
                titre="Aucun dossier"
                description="Ce client n'a pas encore de dossier."
                icone={Briefcase}
              />
            ) : (
              <ul className="divide-y divide-border">
                {dossiers.map((d) => (
                  <li key={d.id}>
                    <Link
                      href={`/dossiers/${d.id}`}
                      className="-mx-2 flex items-center gap-3 rounded-DEFAULT px-2 py-3 hover:bg-muted/40"
                    >
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium text-foreground">
                          {d.titre}
                        </p>
                        <p className="truncate text-xs text-muted-foreground">
                          {d.numero} · {LIBELLE_TYPE_AFFAIRE[d.type_affaire] ?? d.type_affaire}{" "}
                          · {formatDate(d.date_ouverture)}
                          {d.montant_enjeu != null &&
                            ` · ${formatFCFA(d.montant_enjeu)}`}
                        </p>
                      </div>
                      <Badge ton={TON_STATUT[d.statut] ?? "neutre"}>
                        {LIBELLE_STATUT[d.statut] ?? d.statut}
                      </Badge>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
