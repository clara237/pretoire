"use client";

import {
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent,
} from "@/components/ui/tabs";
import type { DossierDetail } from "@/lib/queries/dossiers-labels";
import { OngletInfos } from "./onglet-infos";
import { OngletParties, type Partie } from "./onglet-parties";
import { OngletActes, type Acte } from "./onglet-actes";
import { OngletDocuments, type DocumentDossier } from "./onglet-documents";
import {
  OngletEquipe,
  type MembreEquipe,
  type StagiaireAffecte,
  type OptionPersonne,
} from "./onglet-equipe";
import {
  OngletFinances,
  type FactureDossier,
  type SaisieDossier,
} from "./onglet-finances";
import { OngletNotes } from "./onglet-notes";
import type { EvenementTimeline } from "./timeline";

export interface DonneesOnglets {
  dossier: DossierDetail;
  parties: Partie[];
  actes: Acte[];
  documents: DocumentDossier[];
  membres: MembreEquipe[];
  stagiairesAffectes: StagiaireAffecte[];
  avocatsDispo: OptionPersonne[];
  stagiairesDispo: OptionPersonne[];
  factures: FactureDossier[];
  saisies: SaisieDossier[];
  evenements: EvenementTimeline[];
  devise: string;
}

export function DossierTabs({
  donnees,
  peutEditer,
  peutSupprimerDocs,
}: {
  donnees: DonneesOnglets;
  peutEditer: boolean;
  peutSupprimerDocs: boolean;
}) {
  const d = donnees;
  return (
    <Tabs defaultValue="infos">
      <TabsList>
        <TabsTrigger value="infos">Infos</TabsTrigger>
        <TabsTrigger value="parties">Parties ({d.parties.length})</TabsTrigger>
        <TabsTrigger value="actes">Actes ({d.actes.length})</TabsTrigger>
        <TabsTrigger value="documents">
          Documents ({d.documents.length})
        </TabsTrigger>
        <TabsTrigger value="equipe">Équipe</TabsTrigger>
        <TabsTrigger value="finances">Finances</TabsTrigger>
        <TabsTrigger value="notes">Notes</TabsTrigger>
      </TabsList>

      <TabsContent value="infos">
        <OngletInfos dossier={d.dossier} evenements={d.evenements} />
      </TabsContent>

      <TabsContent value="parties">
        <OngletParties
          dossierId={d.dossier.id}
          parties={d.parties}
          peutEditer={peutEditer}
        />
      </TabsContent>

      <TabsContent value="actes">
        <OngletActes
          dossierId={d.dossier.id}
          actes={d.actes}
          peutEditer={peutEditer}
        />
      </TabsContent>

      <TabsContent value="documents">
        <OngletDocuments
          dossierId={d.dossier.id}
          documents={d.documents}
          peutEditer={peutEditer}
          peutSupprimer={peutSupprimerDocs}
        />
      </TabsContent>

      <TabsContent value="equipe">
        <OngletEquipe
          dossierId={d.dossier.id}
          membres={d.membres}
          stagiairesAffectes={d.stagiairesAffectes}
          avocatsDispo={d.avocatsDispo}
          stagiairesDispo={d.stagiairesDispo}
          peutEditer={peutEditer}
        />
      </TabsContent>

      <TabsContent value="finances">
        <OngletFinances
          factures={d.factures}
          saisies={d.saisies}
          devise={d.devise}
        />
      </TabsContent>

      <TabsContent value="notes">
        <OngletNotes
          dossierId={d.dossier.id}
          notes={d.dossier.notes_internes}
          peutEditer={peutEditer}
        />
      </TabsContent>
    </Tabs>
  );
}
