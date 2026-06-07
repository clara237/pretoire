"use client";

import {
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent,
} from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { GraduationCap, FileDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useCabinet } from "@/components/providers/cabinet-provider";
import { toast } from "sonner";
import { formatDate } from "@/lib/utils";
import { OngletPresences, type Presence } from "./onglet-presences";
import { OngletEvaluations } from "./onglet-evaluations";
import { OngletDossiers, type DossierAssigne, type OptionDossier } from "./onglet-dossiers";
import type { Evaluation } from "@/lib/actions/stagiaires";
import type { DonneesAttestation } from "@/lib/pdf/attestation-stage";

export interface ProfilStagiaire {
  universite: string | null;
  annee_etude: string | null;
  date_debut: string | null;
  date_fin: string | null;
  maitre: string | null;
  objectifs_stage: string | null;
  email: string | null;
  telephone: string | null;
}

function Ligne({ label, valeur }: { label: string; valeur: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-0.5 border-b border-border py-2.5 last:border-0 sm:flex-row sm:items-center sm:justify-between">
      <span className="text-sm text-muted-foreground">{label}</span>
      <span className="text-sm font-medium text-foreground">{valeur || "—"}</span>
    </div>
  );
}

export function StagiaireTabs({
  stagiaireId,
  profil,
  presences,
  evaluations,
  dossiers,
  dossiersDispo,
  attestation,
  peutEditer,
}: {
  stagiaireId: string;
  profil: ProfilStagiaire;
  presences: Presence[];
  evaluations: Evaluation[];
  dossiers: DossierAssigne[];
  dossiersDispo: OptionDossier[];
  attestation: DonneesAttestation;
  peutEditer: boolean;
}) {
  const cabinet = useCabinet();

  async function telechargerAttestation() {
    try {
      const { genererAttestationStage } = await import("@/lib/pdf/attestation-stage");
      genererAttestationStage(cabinet, attestation);
    } catch {
      toast.error("Impossible de générer l'attestation.");
    }
  }

  return (
    <Tabs defaultValue="profil">
      <TabsList>
        <TabsTrigger value="profil">Profil</TabsTrigger>
        <TabsTrigger value="presences">
          Présences ({presences.length})
        </TabsTrigger>
        <TabsTrigger value="dossiers">Dossiers ({dossiers.length})</TabsTrigger>
        <TabsTrigger value="evaluations">
          Évaluations ({evaluations.length})
        </TabsTrigger>
        <TabsTrigger value="attestation">Attestation</TabsTrigger>
      </TabsList>

      <TabsContent value="profil">
        <Card>
          <CardContent className="pt-6">
            <Ligne label="Université" valeur={profil.universite} />
            <Ligne label="Année d'étude" valeur={profil.annee_etude} />
            <Ligne
              label="Période de stage"
              valeur={
                profil.date_debut && profil.date_fin
                  ? `${formatDate(profil.date_debut)} → ${formatDate(profil.date_fin)}`
                  : "—"
              }
            />
            <Ligne label="Maître de stage" valeur={profil.maitre} />
            <Ligne label="Email" valeur={profil.email} />
            <Ligne label="Téléphone" valeur={profil.telephone} />
            <Ligne
              label="Objectifs du stage"
              valeur={profil.objectifs_stage}
            />
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value="presences">
        <Card>
          <CardContent className="pt-6">
            <OngletPresences
              stagiaireId={stagiaireId}
              presences={presences}
              peutEditer={peutEditer}
            />
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value="dossiers">
        <Card>
          <CardContent className="pt-6">
            <OngletDossiers
              stagiaireId={stagiaireId}
              dossiers={dossiers}
              dossiersDispo={dossiersDispo}
              peutEditer={peutEditer}
            />
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value="evaluations">
        <Card>
          <CardContent className="pt-6">
            <OngletEvaluations
              stagiaireId={stagiaireId}
              evaluations={evaluations}
              peutEditer={peutEditer}
            />
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value="attestation">
        <Card>
          <CardContent className="flex flex-col items-center gap-4 py-10 text-center">
            <div className="rounded-full bg-principale/10 p-4">
              <GraduationCap className="h-8 w-8 text-principale" />
            </div>
            <div>
              <p className="font-medium text-foreground">
                Attestation de stage
              </p>
              <p className="mt-1 max-w-md text-sm text-muted-foreground">
                Génère un PDF officiel avec l&apos;en-tête du cabinet, la période
                de stage, le maître de stage et l&apos;appréciation globale.
              </p>
            </div>
            <Button
              iconeGauche={<FileDown className="h-4 w-4" />}
              onClick={telechargerAttestation}
            >
              Télécharger l&apos;attestation
            </Button>
            {attestation.stagiaire.note_globale == null && (
              <Badge ton="avertissement">
                Aucune évaluation : l&apos;appréciation sera omise.
              </Badge>
            )}
          </CardContent>
        </Card>
      </TabsContent>
    </Tabs>
  );
}
