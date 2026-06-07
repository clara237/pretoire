import type { CabinetConfig } from "@/lib/cabinet";
import {
  creerDocument,
  ajouterTableau,
  ajouterPiedDePage,
  getCurseurY,
  setCurseurY,
  telechargerPdf,
} from "@/lib/pdf/document-base";
import { formatFCFA, formatHeures, formatDate } from "@/lib/utils";

export interface LigneAvocatRapport {
  nom: string;
  heuresFacturables: number;
  heuresNonFacturables: number;
  valorisation: number;
  nbDossiers: number;
}

export interface LigneTypeRevenu {
  libelle: string;
  montant: number;
}

export interface DonneesRapportActivite {
  periodeLibelle: string;
  debut: string;
  fin: string;
  chiffreAffaires: number;
  totalEncaisse: number;
  creancesEnCours: number;
  totalDepenses: number;
  nbFactures: number;
  nbFacturesPayees: number;
  heuresTotales: number;
  devise: string;
  avocats: LigneAvocatRapport[];
  revenusParType: LigneTypeRevenu[];
}

/**
 * Rapport PDF d'activité du cabinet : synthèse financière du mois,
 * performance par avocat, revenus par type de dossier.
 * En-tête + pied dynamiques depuis cabinet_config (white-label).
 */
export function genererRapportActivite(
  cabinet: CabinetConfig,
  d: DonneesRapportActivite,
): void {
  const devise = d.devise || cabinet.devise || "FCFA";
  const ctx = creerDocument(cabinet, {
    titre: "Rapport d'activité",
    sousTitre: `${d.periodeLibelle} — du ${formatDate(d.debut)} au ${formatDate(d.fin)}`,
  });
  const { doc } = ctx;

  // --- Synthèse financière ------------------------------------------
  const resultat = d.totalEncaisse - d.totalDepenses;
  ajouterTableau(ctx, {
    head: [["Indicateur", "Valeur"]],
    body: [
      ["Chiffre d'affaires facturé", formatFCFA(d.chiffreAffaires, devise)],
      ["Total encaissé", formatFCFA(d.totalEncaisse, devise)],
      ["Créances en cours", formatFCFA(d.creancesEnCours, devise)],
      ["Total des dépenses", formatFCFA(d.totalDepenses, devise)],
      ["Résultat (encaissé − dépenses)", formatFCFA(resultat, devise)],
      ["Factures émises", String(d.nbFactures)],
      ["Factures payées", String(d.nbFacturesPayees)],
      ["Heures saisies", formatHeures(d.heuresTotales)],
    ],
    columnStyles: {
      0: { fontStyle: "bold", cellWidth: 90 },
      1: { halign: "right" },
    },
  });

  // --- Performance par avocat ---------------------------------------
  let yTitre = getCurseurY(doc);
  if (yTitre > doc.internal.pageSize.getHeight() - 40) {
    doc.addPage();
    yTitre = 20;
  }
  doc.setFont("helvetica", "bold");
  doc.setFontSize(12);
  doc.setTextColor(30, 30, 30);
  doc.text("Performance par avocat", ctx.margeX, yTitre);
  setCurseurY(doc, yTitre + 5);

  if (d.avocats.length > 0) {
    ajouterTableau(ctx, {
      head: [["Avocat", "H. facturables", "H. non fact.", "Dossiers", "Valorisation"]],
      body: d.avocats.map((a) => [
        a.nom,
        formatHeures(a.heuresFacturables),
        formatHeures(a.heuresNonFacturables),
        String(a.nbDossiers),
        formatFCFA(a.valorisation, devise),
      ]),
      columnStyles: {
        1: { halign: "right" },
        2: { halign: "right" },
        3: { halign: "right" },
        4: { halign: "right" },
      },
    });
  } else {
    const yVide = getCurseurY(doc);
    doc.setFont("helvetica", "italic");
    doc.setFontSize(9);
    doc.setTextColor(120, 120, 120);
    doc.text("Aucune saisie de temps sur la période.", ctx.margeX, yVide);
    setCurseurY(doc, yVide + 8);
  }

  // --- Revenus par type de dossier ----------------------------------
  if (d.revenusParType.length > 0) {
    let yTitre2 = getCurseurY(doc);
    if (yTitre2 > doc.internal.pageSize.getHeight() - 40) {
      doc.addPage();
      yTitre2 = 20;
    }
    doc.setFont("helvetica", "bold");
    doc.setFontSize(12);
    doc.setTextColor(30, 30, 30);
    doc.text("Revenus par type de dossier", ctx.margeX, yTitre2);
    setCurseurY(doc, yTitre2 + 5);

    ajouterTableau(ctx, {
      head: [["Type de dossier", "Revenus facturés"]],
      body: d.revenusParType.map((r) => [r.libelle, formatFCFA(r.montant, devise)]),
      columnStyles: {
        0: { fontStyle: "bold", cellWidth: 90 },
        1: { halign: "right" },
      },
    });
  }

  ajouterPiedDePage(ctx);
  telechargerPdf(
    doc,
    `rapport-activite-${d.debut}-${d.fin}`.replace(/[^a-zA-Z0-9-]/g, ""),
  );
}
