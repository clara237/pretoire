import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { PageHeader } from "@/components/ui/page-header";
import { Badge } from "@/components/ui/badge";
import { getProfilCourant } from "@/lib/auth";
import { getCabinetConfig } from "@/lib/cabinet";
import { canEdit } from "@/lib/roles";
import { createClient } from "@/lib/supabase/server";
import {
  recupererDossier,
  listerAvocats,
  nomClient,
  nomProfil,
  LIBELLE_STATUT,
  TON_STATUT,
  LIBELLE_TYPE_AFFAIRE,
} from "@/lib/queries/dossiers";
import { listerClientsSelecteur, nomAffichage } from "@/lib/queries/clients";
import type { DonneesDossier } from "@/lib/actions/dossiers";
import type { DonneesFicheDossier } from "@/lib/pdf/fiche-dossier";
import { DossierActions } from "./_components/dossier-actions";
import { DossierTabs, type DonneesOnglets } from "./_components/dossier-tabs";
import type { EvenementTimeline } from "./_components/timeline";

export const dynamic = "force-dynamic";

export default async function DossierDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const id = params.id;
  const [profil, cabinet, dossier] = await Promise.all([
    getProfilCourant(),
    getCabinetConfig(),
    recupererDossier(id),
  ]);
  if (!dossier) notFound();

  const peutEditer = canEdit(profil?.role, "dossiers");
  const peutSupprimerDocs = ["admin_systeme", "associe_principal", "associe"].includes(
    profil?.role ?? "",
  );
  const peutSupprimerDossier = peutEditer;

  const supabase = createClient();
  const [
    partiesRes,
    actesRes,
    documentsRes,
    equipeRes,
    stagiairesRes,
    facturesRes,
    saisiesRes,
    evenementsRes,
    clients,
    avocats,
    stagiairesTous,
  ] = await Promise.all([
    supabase
      .from("parties")
      .select("id, nom, type, avocat_adverse, contact")
      .eq("dossier_id", id)
      .order("type", { ascending: true }),
    supabase
      .from("actes_procedure")
      .select(
        "id, type_acte, description, date_acte, fichier_url, auteur:profiles(nom, prenom)",
      )
      .eq("dossier_id", id)
      .order("date_acte", { ascending: false }),
    supabase
      .from("documents")
      .select(
        "id, nom, type, fichier_url, taille_ko, created_at, uploader:profiles(nom, prenom)",
      )
      .eq("dossier_id", id)
      .order("created_at", { ascending: false }),
    supabase
      .from("dossier_equipe")
      .select(
        "id, role_dans_dossier, profile:profiles(id, nom, prenom, photo_url)",
      )
      .eq("dossier_id", id),
    supabase
      .from("dossier_stagiaires")
      .select(
        "id, date_affectation, stagiaire:stagiaires(id, nom, prenom, universite)",
      )
      .eq("dossier_id", id),
    supabase
      .from("factures")
      .select("id, numero, date_emission, montant_ttc, statut")
      .eq("dossier_id", id)
      .order("date_emission", { ascending: false }),
    supabase
      .from("saisies_temps")
      .select(
        "id, date, type_tache, description, duree_heures, facturable, profile:profiles(nom, prenom)",
      )
      .eq("dossier_id", id)
      .order("date", { ascending: false }),
    supabase
      .from("evenements")
      .select("id, titre, type, date_debut")
      .eq("dossier_id", id)
      .order("date_debut", { ascending: false }),
    listerClientsSelecteur(),
    listerAvocats(),
    supabase
      .from("stagiaires")
      .select("id, nom, prenom")
      .eq("actif", true)
      .order("nom", { ascending: true }),
  ]);

  /* eslint-disable @typescript-eslint/no-explicit-any */
  const parties = (partiesRes.data ?? []) as any[];
  const actes = (actesRes.data ?? []) as any[];
  const documents = (documentsRes.data ?? []) as any[];
  const membres = (equipeRes.data ?? []) as any[];
  const stagiairesAffectes = (stagiairesRes.data ?? []) as any[];
  const factures = (facturesRes.data ?? []) as any[];
  const saisies = (saisiesRes.data ?? []) as any[];
  const evenements = (evenementsRes.data ?? []) as any[];
  const stagiairesTousData = (stagiairesTous.data ?? []) as any[];
  /* eslint-enable @typescript-eslint/no-explicit-any */

  // Stagiaires/avocats non encore affectés (pour les sélecteurs)
  const idsAvocatsAffectes = new Set(
    membres.map((m) => m.profile?.id).filter(Boolean),
  );
  const avocatsDispo = avocats
    .filter((a) => !idsAvocatsAffectes.has(a.id))
    .map((a) => ({ value: a.id, label: nomProfil(a) }));

  const idsStagiairesAffectes = new Set(
    stagiairesAffectes.map((s) => s.stagiaire?.id).filter(Boolean),
  );
  const stagiairesDispo = stagiairesTousData
    .filter((s) => !idsStagiairesAffectes.has(s.id))
    .map((s) => ({ value: s.id, label: `${s.prenom} ${s.nom}` }));

  // Timeline fusionnée (actes + documents + factures + agenda) triée par date desc
  const timeline: EvenementTimeline[] = [
    ...actes.map((a) => ({
      categorie: "acte" as const,
      date: a.date_acte,
      titre: a.type_acte,
      detail: a.description,
    })),
    ...documents.map((d) => ({
      categorie: "document" as const,
      date: d.created_at,
      titre: d.nom,
      detail: null,
    })),
    ...factures.map((f) => ({
      categorie: "facture" as const,
      date: f.date_emission,
      titre: `Facture ${f.numero}`,
      detail: LIBELLE_STATUT[f.statut] ?? null,
    })),
    ...evenements.map((e) => ({
      categorie: "agenda" as const,
      date: e.date_debut,
      titre: e.titre,
      detail: null,
    })),
  ].sort((x, y) => (x.date < y.date ? 1 : -1));

  // Données pour le PDF fiche
  const fiche: DonneesFicheDossier = {
    numero: dossier.numero,
    titre: dossier.titre,
    type_affaire: dossier.type_affaire,
    statut: dossier.statut,
    tribunal: dossier.tribunal,
    chambre: dossier.chambre,
    numero_role: dossier.numero_role,
    date_ouverture: dossier.date_ouverture,
    date_cloture_prev: dossier.date_cloture_prev,
    montant_enjeu: dossier.montant_enjeu,
    description_faits: dossier.description_faits,
    pretentions: dossier.pretentions,
    moyens: dossier.moyens,
    nomClient: nomClient(dossier.client),
    nomAvocat: nomProfil(dossier.avocat),
    parties: parties.map((p) => ({
      nom: p.nom,
      type: p.type,
      avocat_adverse: p.avocat_adverse,
    })),
    actes: actes.map((a) => ({
      type_acte: a.type_acte,
      date_acte: a.date_acte,
      description: a.description,
    })),
    equipe: membres.map((m) => ({
      nom: m.profile ? `${m.profile.prenom} ${m.profile.nom}` : "Avocat",
      role: m.role_dans_dossier,
    })),
  };

  // Données pour le formulaire d'édition
  const formInitial: DonneesDossier = {
    titre: dossier.titre,
    type_affaire: dossier.type_affaire,
    statut: dossier.statut,
    client_id: dossier.client_id ?? "",
    avocat_responsable_id: dossier.avocat_responsable_id ?? "",
    tribunal: dossier.tribunal ?? "",
    chambre: dossier.chambre ?? "",
    numero_role: dossier.numero_role ?? "",
    description_faits: dossier.description_faits ?? "",
    pretentions: dossier.pretentions ?? "",
    moyens: dossier.moyens ?? "",
    montant_enjeu: dossier.montant_enjeu ?? "",
    date_ouverture: dossier.date_ouverture,
    date_cloture_prev: dossier.date_cloture_prev ?? "",
    date_cloture_reel: dossier.date_cloture_reel ?? "",
  };

  const donneesOnglets: DonneesOnglets = {
    dossier,
    parties,
    actes,
    documents,
    membres,
    stagiairesAffectes,
    avocatsDispo,
    stagiairesDispo,
    factures,
    saisies,
    evenements: timeline,
    devise: cabinet.devise,
  };

  const optsClients = clients.map((c) => ({ value: c.id, label: nomAffichage(c) }));
  const optsAvocats = avocats.map((a) => ({ value: a.id, label: nomProfil(a) }));

  return (
    <div>
      <Link
        href="/dossiers"
        className="mb-4 inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" />
        Retour aux dossiers
      </Link>

      <PageHeader
        titre={dossier.titre}
        description={`${dossier.numero} · ${LIBELLE_TYPE_AFFAIRE[dossier.type_affaire] ?? dossier.type_affaire}`}
        actions={
          <DossierActions
            dossierId={dossier.id}
            numero={dossier.numero}
            statut={dossier.statut}
            fiche={fiche}
            formInitial={formInitial}
            clients={optsClients}
            avocats={optsAvocats}
            peutEditer={peutEditer}
            peutSupprimer={peutSupprimerDossier}
          />
        }
      />

      <div className="mb-4 flex items-center gap-2">
        <Badge ton={TON_STATUT[dossier.statut] ?? "neutre"}>
          {LIBELLE_STATUT[dossier.statut] ?? dossier.statut}
        </Badge>
        <span className="text-sm text-muted-foreground">
          Client : {nomClient(dossier.client)}
        </span>
      </div>

      <DossierTabs
        donnees={donneesOnglets}
        peutEditer={peutEditer}
        peutSupprimerDocs={peutSupprimerDocs}
      />
    </div>
  );
}
