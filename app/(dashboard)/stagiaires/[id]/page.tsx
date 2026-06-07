import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Star } from "lucide-react";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { createClient } from "@/lib/supabase/server";
import { getProfilCourant } from "@/lib/auth";
import { canEdit } from "@/lib/roles";
import type { Evaluation } from "@/lib/actions/stagiaires";
import type { DonneesAttestation } from "@/lib/pdf/attestation-stage";
import { chargerMaitresOptions, chargerDossiersOptions } from "../_lib/donnees";
import { StagiaireActions } from "./_components/stagiaire-actions";
import { StagiaireTabs } from "./_components/stagiaire-tabs";
import type { Presence } from "./_components/onglet-presences";
import type { DossierAssigne } from "./_components/onglet-dossiers";

export const dynamic = "force-dynamic";

interface StagiaireRow {
  id: string;
  nom: string;
  prenom: string;
  email: string | null;
  telephone: string | null;
  universite: string | null;
  annee_etude: string | null;
  date_debut: string | null;
  date_fin: string | null;
  maitre_stage_id: string | null;
  objectifs_stage: string | null;
  note_globale: number | null;
  notes_evaluation: unknown;
  actif: boolean;
  maitre: { nom: string; prenom: string } | null;
}

export default async function StagiairePage({
  params,
}: {
  params: { id: string };
}) {
  const supabase = createClient();

  const { data: stagiaireData } = await supabase
    .from("stagiaires")
    .select(
      "id, nom, prenom, email, telephone, universite, annee_etude, date_debut, date_fin, maitre_stage_id, objectifs_stage, note_globale, notes_evaluation, actif, maitre:profiles!stagiaires_maitre_stage_id_fkey(nom, prenom)",
    )
    .eq("id", params.id)
    .maybeSingle();

  if (!stagiaireData) notFound();
  const s = stagiaireData as unknown as StagiaireRow;

  const [profil, maitres, dossiersDispo, presRes, dossRes] = await Promise.all([
    getProfilCourant(),
    chargerMaitresOptions(),
    chargerDossiersOptions(),
    supabase
      .from("presences_stagiaires")
      .select("id, date, heure_arrivee, heure_depart, present, motif_absence")
      .eq("stagiaire_id", params.id)
      .order("date", { ascending: false }),
    supabase
      .from("dossier_stagiaires")
      .select("dossier:dossiers(id, numero, titre)")
      .eq("stagiaire_id", params.id),
  ]);

  const peutEditer = canEdit(profil?.role, "stagiaires");

  const presences = (presRes.data ?? []) as unknown as Presence[];

  const dossiers: DossierAssigne[] = (
    (dossRes.data ?? []) as unknown as Array<{
      dossier: { id: string; numero: string; titre: string } | null;
    }>
  )
    .map((r) => r.dossier)
    .filter((d): d is { id: string; numero: string; titre: string } => d != null)
    .map((d) => ({ id: d.id, numero: d.numero, titre: d.titre }));

  const evaluations: Evaluation[] = Array.isArray(s.notes_evaluation)
    ? (s.notes_evaluation as Evaluation[])
    : [];

  const maitreNom = s.maitre ? `${s.maitre.prenom} ${s.maitre.nom}`.trim() : null;

  const attestation: DonneesAttestation = {
    stagiaire: {
      nom: s.nom,
      prenom: s.prenom,
      universite: s.universite,
      annee_etude: s.annee_etude,
      date_debut: s.date_debut,
      date_fin: s.date_fin,
      objectifs_stage: s.objectifs_stage,
      note_globale: s.note_globale,
    },
    maitreStage: maitreNom,
  };

  return (
    <div>
      <Link
        href="/stagiaires"
        className="mb-4 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" /> Retour aux stagiaires
      </Link>

      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <Avatar prenom={s.prenom} nom={s.nom} taille="lg" />
          <div className="space-y-1">
            <h1 className="flex items-center gap-2 text-2xl font-bold tracking-tight text-foreground">
              {s.prenom} {s.nom}
              {!s.actif && <Badge ton="neutre">Terminé</Badge>}
            </h1>
            <p className="text-sm text-muted-foreground">
              {s.note_globale != null ? (
                <span className="inline-flex items-center gap-1">
                  <Star className="h-3.5 w-3.5 fill-warning text-warning" />
                  Note globale : {s.note_globale.toFixed(1)}/5
                </span>
              ) : (
                "Pas encore d'évaluation"
              )}
            </p>
          </div>
        </div>
        <StagiaireActions
          valeurs={{
            id: s.id,
            nom: s.nom,
            prenom: s.prenom,
            email: s.email,
            telephone: s.telephone,
            universite: s.universite,
            annee_etude: s.annee_etude,
            date_debut: s.date_debut,
            date_fin: s.date_fin,
            maitre_stage_id: s.maitre_stage_id,
            objectifs_stage: s.objectifs_stage,
          }}
          maitres={maitres}
          actif={s.actif}
          attestation={attestation}
          peutEditer={peutEditer}
        />
      </div>

      <StagiaireTabs
        stagiaireId={s.id}
        profil={{
          universite: s.universite,
          annee_etude: s.annee_etude,
          date_debut: s.date_debut,
          date_fin: s.date_fin,
          maitre: maitreNom,
          objectifs_stage: s.objectifs_stage,
          email: s.email,
          telephone: s.telephone,
        }}
        presences={presences}
        evaluations={evaluations}
        dossiers={dossiers}
        dossiersDispo={dossiersDispo}
        attestation={attestation}
        peutEditer={peutEditer}
      />
    </div>
  );
}
