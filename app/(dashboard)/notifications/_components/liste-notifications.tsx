"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  Bell,
  BellOff,
  Check,
  CheckCheck,
  Trash2,
  CalendarClock,
  Receipt,
  AlertTriangle,
  Info,
  ArrowRight,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge, type BadgeTon } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { ConfirmDialog } from "@/components/ui/modal";
import { cn, formatRelatif, formatDateTime } from "@/lib/utils";
import {
  marquerLue,
  basculerLue,
  toutMarquerLu,
  supprimerNotification,
} from "@/lib/actions/notifications";

export interface NotificationItem {
  id: string;
  titre: string;
  message: string | null;
  type: string | null;
  lien: string | null;
  lu: boolean;
  created_at: string;
}

/** Apparence (icône + ton de badge + libellé) selon le type de notification. */
function apparence(type: string | null): {
  icone: LucideIcon;
  ton: BadgeTon;
  libelle: string;
} {
  switch (type) {
    case "echeance":
    case "deadline":
    case "agenda":
      return { icone: CalendarClock, ton: "avertissement", libelle: "Échéance" };
    case "finance":
    case "facture":
    case "relance":
    case "paiement":
      return { icone: Receipt, ton: "info", libelle: "Facturation" };
    case "alerte":
    case "urgent":
    case "avertissement":
      return { icone: AlertTriangle, ton: "danger", libelle: "Alerte" };
    case "succes":
      return { icone: Check, ton: "succes", libelle: "Succès" };
    default:
      return { icone: Info, ton: "neutre", libelle: "Information" };
  }
}

export function ListeNotifications({
  notifications,
}: {
  notifications: NotificationItem[];
}) {
  const router = useRouter();
  const [traitement, setTraitement] = React.useState(false);
  const [supprId, setSupprId] = React.useState<string | null>(null);
  const [suppression, setSuppression] = React.useState(false);

  const nonLues = notifications.filter((n) => !n.lu);

  async function onToutMarquer() {
    setTraitement(true);
    const res = await toutMarquerLu();
    setTraitement(false);
    if (!res.ok) {
      toast.error(res.message ?? "Action impossible.");
      return;
    }
    toast.success("Toutes les notifications sont marquées comme lues.");
    router.refresh();
  }

  async function onBasculer(n: NotificationItem) {
    const res = await basculerLue(n.id, !n.lu);
    if (!res.ok) {
      toast.error(res.message ?? "Action impossible.");
      return;
    }
    router.refresh();
  }

  async function onOuvrirLien(n: NotificationItem) {
    // Marque comme lue puis navigue vers la ressource liée.
    if (!n.lu) await marquerLue(n.id);
    if (n.lien) router.push(n.lien);
    else router.refresh();
  }

  async function confirmerSuppression() {
    if (!supprId) return;
    setSuppression(true);
    const res = await supprimerNotification(supprId);
    setSuppression(false);
    setSupprId(null);
    if (!res.ok) {
      toast.error(res.message ?? "Suppression impossible.");
      return;
    }
    toast.success("Notification supprimée.");
    router.refresh();
  }

  if (notifications.length === 0) {
    return (
      <EmptyState
        titre="Aucune notification"
        description="Vous serez alerté ici des échéances d'agenda et des relances de factures."
        icone={Bell}
      />
    );
  }

  return (
    <>
      {/* Barre d'actions */}
      <div className="mb-4 flex items-center justify-between gap-3">
        <p className="text-sm text-muted-foreground">
          {nonLues.length > 0 ? (
            <>
              <span className="font-semibold text-foreground">
                {nonLues.length}
              </span>{" "}
              non {nonLues.length > 1 ? "lues" : "lue"} sur {notifications.length}
            </>
          ) : (
            <>Tout est à jour — {notifications.length} notification(s)</>
          )}
        </p>
        <Button
          variante="contour"
          taille="sm"
          iconeGauche={<CheckCheck className="h-4 w-4" />}
          onClick={onToutMarquer}
          enChargement={traitement}
          disabled={nonLues.length === 0}
        >
          Tout marquer comme lu
        </Button>
      </div>

      <div className="space-y-2.5">
        {notifications.map((n) => {
          const { icone: Icone, ton, libelle } = apparence(n.type);
          return (
            <Card
              key={n.id}
              className={cn(
                "flex items-start gap-3 p-4 transition-colors",
                !n.lu && "border-principale/30 bg-principale/[0.03]",
              )}
            >
              <div
                className={cn(
                  "mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full",
                  !n.lu ? "bg-principale/10 text-principale" : "bg-muted text-muted-foreground",
                )}
              >
                <Icone className="h-4 w-4" />
              </div>

              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <p
                    className={cn(
                      "text-sm",
                      !n.lu ? "font-semibold text-foreground" : "font-medium text-foreground",
                    )}
                  >
                    {n.titre}
                  </p>
                  <Badge ton={ton}>{libelle}</Badge>
                  {!n.lu && (
                    <span
                      className="h-2 w-2 rounded-full bg-principale"
                      aria-label="Non lue"
                    />
                  )}
                </div>
                {n.message && (
                  <p className="mt-0.5 text-sm text-muted-foreground">
                    {n.message}
                  </p>
                )}
                <p
                  className="mt-1 text-xs text-muted-foreground"
                  title={formatDateTime(n.created_at)}
                >
                  {formatRelatif(n.created_at)}
                </p>

                {n.lien && (
                  <button
                    type="button"
                    onClick={() => onOuvrirLien(n)}
                    className="mt-2 inline-flex items-center gap-1 text-sm font-medium text-principale hover:underline"
                  >
                    Voir
                    <ArrowRight className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>

              <div className="flex shrink-0 items-center gap-1">
                <button
                  type="button"
                  onClick={() => onBasculer(n)}
                  className="rounded-DEFAULT p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground"
                  aria-label={n.lu ? "Marquer comme non lue" : "Marquer comme lue"}
                  title={n.lu ? "Marquer comme non lue" : "Marquer comme lue"}
                >
                  {n.lu ? (
                    <BellOff className="h-4 w-4" />
                  ) : (
                    <Check className="h-4 w-4" />
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => setSupprId(n.id)}
                  className="rounded-DEFAULT p-1.5 text-muted-foreground hover:bg-danger/10 hover:text-danger"
                  aria-label="Supprimer"
                  title="Supprimer"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </Card>
          );
        })}
      </div>

      <ConfirmDialog
        ouvert={supprId !== null}
        onClose={() => setSupprId(null)}
        onConfirm={confirmerSuppression}
        enChargement={suppression}
        titre="Supprimer cette notification"
        message="La notification sera définitivement supprimée."
      />
    </>
  );
}
