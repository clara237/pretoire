"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  CalendarClock,
  MapPin,
  Briefcase,
  User,
  Pencil,
  Trash2,
  Gavel,
} from "lucide-react";
import { Modal, ConfirmDialog } from "@/components/ui/modal";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatDateTime, formatDateLongue, formatTime } from "@/lib/utils";
import { LIBELLE_TYPE, TON_TYPE, type EvenementLite } from "../_lib/evenements";
import { supprimerEvenement } from "@/lib/actions/agenda";
import {
  EvenementForm,
  type OptionDossier,
  type OptionProfile,
} from "./evenement-form";

export function EvenementDetail({
  evenement,
  onClose,
  peutEditer,
  dossiers,
  profiles,
}: {
  evenement: EvenementLite;
  onClose: () => void;
  peutEditer: boolean;
  dossiers: OptionDossier[];
  profiles: OptionProfile[];
}) {
  const router = useRouter();
  const [mode, setMode] = React.useState<"detail" | "edition">("detail");
  const [confirmSuppr, setConfirmSuppr] = React.useState(false);
  const [enSuppression, setEnSuppression] = React.useState(false);

  async function onSupprimer() {
    setEnSuppression(true);
    const res = await supprimerEvenement(evenement.id);
    setEnSuppression(false);
    setConfirmSuppr(false);
    if (res.ok) {
      toast.success("Événement supprimé.");
      onClose();
      router.refresh();
    } else {
      toast.error(res.message ?? "Suppression impossible.");
    }
  }

  const estAudience = evenement.type === "audience";
  const memeJour =
    evenement.date_fin &&
    new Date(evenement.date_fin).toDateString() ===
      new Date(evenement.date_debut).toDateString();

  if (mode === "edition") {
    return (
      <Modal
        ouvert
        onClose={onClose}
        titre="Modifier l'événement"
        taille="lg"
      >
        <EvenementForm
          dossiers={dossiers}
          profiles={profiles}
          valeurs={{
            id: evenement.id,
            titre: evenement.titre,
            type: evenement.type,
            description: evenement.description,
            lieu: evenement.lieu,
            dossier_id: evenement.dossier_id,
            profile_id: evenement.profile_id,
            date_debut: evenement.date_debut,
            date_fin: evenement.date_fin,
            tribunal: estAudience ? evenement.lieu : null,
            rappel_j7: evenement.rappel_j7,
            rappel_j3: evenement.rappel_j3,
            rappel_j1: evenement.rappel_j1,
          }}
          apresSucces={() => {
            onClose();
            router.refresh();
          }}
        />
      </Modal>
    );
  }

  return (
    <>
      <Modal
        ouvert
        onClose={onClose}
        taille="md"
        pied={
          peutEditer ? (
            <div className="flex w-full items-center justify-between">
              <Button
                variante="danger"
                taille="sm"
                iconeGauche={<Trash2 className="h-4 w-4" />}
                onClick={() => setConfirmSuppr(true)}
              >
                Supprimer
              </Button>
              <Button
                taille="sm"
                iconeGauche={<Pencil className="h-4 w-4" />}
                onClick={() => setMode("edition")}
              >
                Modifier
              </Button>
            </div>
          ) : undefined
        }
      >
        <div className="space-y-4">
          <div className="flex items-start justify-between gap-3">
            <h2 className="text-lg font-semibold text-foreground">
              {evenement.titre}
            </h2>
            <Badge ton={TON_TYPE[evenement.type]}>
              {LIBELLE_TYPE[evenement.type]}
            </Badge>
          </div>

          <ul className="space-y-2.5 text-sm">
            <li className="flex items-center gap-2.5 text-foreground">
              <CalendarClock className="h-4 w-4 shrink-0 text-muted-foreground" />
              <span className="capitalize">
                {formatDateLongue(evenement.date_debut)} à{" "}
                {formatTime(evenement.date_debut)}
                {evenement.date_fin && (
                  <>
                    {" — "}
                    {memeJour
                      ? formatTime(evenement.date_fin)
                      : formatDateTime(evenement.date_fin)}
                  </>
                )}
              </span>
            </li>

            {evenement.lieu && (
              <li className="flex items-center gap-2.5 text-foreground">
                {estAudience ? (
                  <Gavel className="h-4 w-4 shrink-0 text-muted-foreground" />
                ) : (
                  <MapPin className="h-4 w-4 shrink-0 text-muted-foreground" />
                )}
                <span>{evenement.lieu}</span>
              </li>
            )}

            {evenement.dossiers && (
              <li className="flex items-center gap-2.5">
                <Briefcase className="h-4 w-4 shrink-0 text-muted-foreground" />
                {evenement.dossier_id ? (
                  <Link
                    href={`/dossiers/${evenement.dossier_id}`}
                    className="text-principale hover:underline"
                  >
                    {evenement.dossiers.numero} · {evenement.dossiers.titre}
                  </Link>
                ) : (
                  <span className="text-foreground">
                    {evenement.dossiers.numero} · {evenement.dossiers.titre}
                  </span>
                )}
              </li>
            )}

            {evenement.profiles && (
              <li className="flex items-center gap-2.5 text-foreground">
                <User className="h-4 w-4 shrink-0 text-muted-foreground" />
                <span>
                  {evenement.profiles.prenom} {evenement.profiles.nom}
                </span>
              </li>
            )}
          </ul>

          {evenement.description && (
            <div className="rounded-DEFAULT border border-border bg-muted/30 p-3">
              <p className="whitespace-pre-line text-sm text-foreground">
                {evenement.description}
              </p>
            </div>
          )}

          {evenement.type === "deadline" &&
            (evenement.rappel_j7 || evenement.rappel_j3 || evenement.rappel_j1) && (
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-xs text-muted-foreground">Rappels :</span>
                {evenement.rappel_j7 && <Badge ton="avertissement">J-7</Badge>}
                {evenement.rappel_j3 && <Badge ton="avertissement">J-3</Badge>}
                {evenement.rappel_j1 && <Badge ton="avertissement">J-1</Badge>}
              </div>
            )}
        </div>
      </Modal>

      <ConfirmDialog
        ouvert={confirmSuppr}
        onClose={() => setConfirmSuppr(false)}
        onConfirm={onSupprimer}
        titre="Supprimer l'événement"
        message={`Supprimer « ${evenement.titre} » ? Cette action est irréversible.`}
        enChargement={enSuppression}
      />
    </>
  );
}
