"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  Search,
  Plus,
  Pencil,
  Trash2,
  ArrowDownLeft,
  ArrowUpRight,
  ExternalLink,
  Mail,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input, Field } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { AssistantTexte } from "@/components/ui/assistant-texte";
import { Badge } from "@/components/ui/badge";
import { Modal, ConfirmDialog } from "@/components/ui/modal";
import { EmptyState } from "@/components/ui/empty-state";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/components/ui/table";
import { formatDate } from "@/lib/utils";
import {
  creerCourrier,
  modifierCourrier,
  supprimerCourrier,
} from "@/lib/actions/courriers";

export interface CourrierLigne {
  id: string;
  type: "entrant" | "sortant";
  objet: string;
  expediteur: string | null;
  destinataire: string | null;
  date_courrier: string;
  fichier_url: string | null;
  notes: string | null;
  dossier_id: string | null;
  dossier: { id: string; numero: string; titre: string } | null;
}

export interface OptionDossier {
  id: string;
  numero: string;
  titre: string;
}

export function CourriersClient({
  courriers,
  dossiers,
  peutEditer,
}: {
  courriers: CourrierLigne[];
  dossiers: OptionDossier[];
  peutEditer: boolean;
}) {
  const router = useRouter();
  const [recherche, setRecherche] = React.useState("");
  const [filtreType, setFiltreType] = React.useState<"tous" | "entrant" | "sortant">(
    "tous",
  );
  const [formOuvert, setFormOuvert] = React.useState(false);
  const [edition, setEdition] = React.useState<CourrierLigne | null>(null);
  const [enCours, setEnCours] = React.useState(false);
  const [aSupprimer, setASupprimer] = React.useState<string | null>(null);

  const liste = courriers.filter((c) => {
    if (filtreType !== "tous" && c.type !== filtreType) return false;
    const terme = recherche.trim().toLowerCase();
    if (!terme) return true;
    return (
      c.objet.toLowerCase().includes(terme) ||
      (c.expediteur ?? "").toLowerCase().includes(terme) ||
      (c.destinataire ?? "").toLowerCase().includes(terme) ||
      (c.dossier?.numero ?? "").toLowerCase().includes(terme)
    );
  });

  function ouvrirCreation() {
    setEdition(null);
    setFormOuvert(true);
  }

  function ouvrirEdition(c: CourrierLigne) {
    setEdition(c);
    setFormOuvert(true);
  }

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setEnCours(true);
    const formData = new FormData(e.currentTarget);
    const res = edition
      ? await modifierCourrier(edition.id, formData)
      : await creerCourrier(formData);
    setEnCours(false);
    if (res.ok) {
      toast.success(edition ? "Courrier mis à jour." : "Courrier enregistré.");
      setFormOuvert(false);
      router.refresh();
    } else {
      toast.error(res.message ?? "Une erreur est survenue.");
    }
  }

  async function confirmerSuppression() {
    if (!aSupprimer) return;
    const res = await supprimerCourrier(aSupprimer);
    setASupprimer(null);
    if (res.ok) {
      toast.success("Courrier supprimé.");
      router.refresh();
    } else {
      toast.error(res.message ?? "Suppression impossible.");
    }
  }

  return (
    <div>
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={recherche}
            onChange={(e) => setRecherche(e.target.value)}
            placeholder="Rechercher (objet, expéditeur, destinataire, dossier…)"
            className="pl-9"
          />
        </div>
        <Select
          value={filtreType}
          onChange={(e) =>
            setFiltreType(e.target.value as "tous" | "entrant" | "sortant")
          }
          className="sm:w-48"
          options={[
            { value: "tous", label: "Tous les courriers" },
            { value: "entrant", label: "Entrants" },
            { value: "sortant", label: "Sortants" },
          ]}
        />
        {peutEditer && (
          <Button
            iconeGauche={<Plus className="h-4 w-4" />}
            onClick={ouvrirCreation}
          >
            Nouveau courrier
          </Button>
        )}
      </div>

      {liste.length === 0 ? (
        <EmptyState
          titre="Aucun courrier"
          description="Enregistrez les courriers entrants et sortants liés à vos dossiers."
          icone={Mail}
          action={
            peutEditer ? (
              <Button
                iconeGauche={<Plus className="h-4 w-4" />}
                onClick={ouvrirCreation}
              >
                Nouveau courrier
              </Button>
            ) : undefined
          }
        />
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Sens</TableHead>
              <TableHead>Objet</TableHead>
              <TableHead>Correspondant</TableHead>
              <TableHead>Dossier</TableHead>
              <TableHead>Date</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {liste.map((c) => (
              <TableRow key={c.id}>
                <TableCell>
                  {c.type === "entrant" ? (
                    <Badge ton="info">
                      <ArrowDownLeft className="h-3 w-3" /> Entrant
                    </Badge>
                  ) : (
                    <Badge ton="principal">
                      <ArrowUpRight className="h-3 w-3" /> Sortant
                    </Badge>
                  )}
                </TableCell>
                <TableCell className="font-medium text-foreground">
                  <span className="inline-flex items-center gap-2">
                    {c.objet}
                    {c.fichier_url && (
                      <a
                        href={c.fichier_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-muted-foreground hover:text-principale"
                        aria-label="Ouvrir la pièce jointe"
                      >
                        <ExternalLink className="h-3.5 w-3.5" />
                      </a>
                    )}
                  </span>
                </TableCell>
                <TableCell className="text-muted-foreground">
                  {c.type === "entrant"
                    ? c.expediteur || "—"
                    : c.destinataire || "—"}
                </TableCell>
                <TableCell className="text-muted-foreground">
                  {c.dossier ? (
                    <Link
                      href={`/dossiers/${c.dossier.id}`}
                      className="text-principale hover:underline"
                    >
                      {c.dossier.numero}
                    </Link>
                  ) : (
                    "—"
                  )}
                </TableCell>
                <TableCell className="text-muted-foreground">
                  {formatDate(c.date_courrier)}
                </TableCell>
                <TableCell className="text-right">
                  {peutEditer ? (
                    <div className="flex justify-end gap-1">
                      <Button
                        variante="fantome"
                        onClick={() => ouvrirEdition(c)}
                        aria-label="Modifier"
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variante="fantome"
                        className="text-danger"
                        onClick={() => setASupprimer(c.id)}
                        aria-label="Supprimer"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  ) : (
                    <span className="text-muted-foreground">—</span>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}

      <Modal
        ouvert={formOuvert}
        onClose={() => setFormOuvert(false)}
        titre={edition ? "Modifier le courrier" : "Nouveau courrier"}
        taille="lg"
      >
        <form onSubmit={onSubmit} className="space-y-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field label="Type" htmlFor="type" requis>
              <Select
                id="type"
                name="type"
                defaultValue={edition?.type ?? "entrant"}
              >
                <option value="entrant">Entrant</option>
                <option value="sortant">Sortant</option>
              </Select>
            </Field>
            <Field label="Date" htmlFor="date_courrier">
              <Input
                id="date_courrier"
                name="date_courrier"
                type="date"
                defaultValue={
                  edition?.date_courrier ??
                  new Date().toISOString().slice(0, 10)
                }
              />
            </Field>
          </div>

          <Field label="Objet" htmlFor="objet" requis>
            <Input
              id="objet"
              name="objet"
              defaultValue={edition?.objet ?? ""}
              required
              placeholder="Objet du courrier"
            />
          </Field>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field label="Expéditeur" htmlFor="expediteur">
              <Input
                id="expediteur"
                name="expediteur"
                defaultValue={edition?.expediteur ?? ""}
              />
            </Field>
            <Field label="Destinataire" htmlFor="destinataire">
              <Input
                id="destinataire"
                name="destinataire"
                defaultValue={edition?.destinataire ?? ""}
              />
            </Field>
          </div>

          <Field label="Dossier lié" htmlFor="dossier_id">
            <Select
              id="dossier_id"
              name="dossier_id"
              defaultValue={edition?.dossier_id ?? ""}
            >
              <option value="">— Aucun —</option>
              {dossiers.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.numero} — {d.titre}
                </option>
              ))}
            </Select>
          </Field>

          <Field label="Lien de la pièce (URL)" htmlFor="fichier_url">
            <Input
              id="fichier_url"
              name="fichier_url"
              type="url"
              defaultValue={edition?.fichier_url ?? ""}
              placeholder="https://…"
            />
          </Field>

          <Field label="Notes" htmlFor="notes">
            <Textarea
              id="notes"
              name="notes"
              rows={3}
              defaultValue={edition?.notes ?? ""}
            />
            <AssistantTexte cibleId="notes" />
          </Field>

          <div className="flex justify-end gap-2 pt-2">
            <Button
              type="button"
              variante="contour"
              onClick={() => setFormOuvert(false)}
              disabled={enCours}
            >
              Annuler
            </Button>
            <Button type="submit" enChargement={enCours}>
              {edition ? "Enregistrer" : "Créer le courrier"}
            </Button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog
        ouvert={aSupprimer !== null}
        onClose={() => setASupprimer(null)}
        onConfirm={confirmerSuppression}
        titre="Supprimer le courrier"
        message="Ce courrier sera définitivement supprimé."
      />
    </div>
  );
}
