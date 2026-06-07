import type { CabinetConfig } from "@/lib/cabinet";
import {
  creerDocument,
  ajouterTableau,
  ajouterPiedDePage,
  getCurseurY,
  setCurseurY,
  telechargerPdf,
} from "@/lib/pdf/document-base";
import { formatFCFA, formatDate } from "@/lib/utils";
import { LIBELLE_STATUT_DEVIS } from "@/lib/finance-constants";

export interface DonneesDevisPdf {
  numero: string;
  objet: string | null;
  date_emission: string;
  date_validite: string | null;
  statut: string;
  montant_ht: number;
  tva: number;
  montant_ttc: number;
  devise: string;
  notes: string | null;
  nomClient: string;
  adresseClient: string | null;
  numeroDossier: string | null;
  intituleDossier: string | null;
}

/**
 * Génère et télécharge le PDF d'un devis (proforma).
 * En-tête + pied dynamiques depuis cabinet_config (white-label).
 */
export function genererDevis(cabinet: CabinetConfig, d: DonneesDevisPdf): void {
  const devise = d.devise || cabinet.devise || "FCFA";
  const ctx = creerDocument(cabinet, {
    titre: `Devis ${d.numero}`,
    sousTitre: `Émis le ${formatDate(d.date_emission)}${
      d.date_validite
        ? ` — valable jusqu'au ${formatDate(d.date_validite)}`
        : ""
    }`,
  });
  const { doc } = ctx;

  // --- Bloc destinataire (client) -----------------------------------
  let y = getCurseurY(doc);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.setTextColor(30, 30, 30);
  doc.text("Devis adressé à", ctx.margeX, y);
  y += 5;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.setTextColor(60, 60, 60);
  doc.text(d.nomClient, ctx.margeX, y);
  y += 5;
  if (d.adresseClient) {
    const adr = doc.splitTextToSize(d.adresseClient, 90);
    doc.text(adr, ctx.margeX, y);
    y += adr.length * 5;
  }
  if (d.numeroDossier) {
    doc.setFontSize(9);
    doc.setTextColor(110, 110, 110);
    const ref = `Dossier ${d.numeroDossier}${
      d.intituleDossier ? ` — ${d.intituleDossier}` : ""
    }`;
    const refLignes = doc.splitTextToSize(ref, ctx.largeur - ctx.margeX * 2);
    doc.text(refLignes, ctx.margeX, y + 1);
    y += refLignes.length * 5 + 1;
  }
  setCurseurY(doc, y + 4);

  // --- Désignation / objet ------------------------------------------
  ajouterTableau(ctx, {
    head: [["Désignation", "Montant"]],
    body: [
      [d.objet || "Prestation juridique", formatFCFA(d.montant_ht, devise)],
    ],
    columnStyles: { 1: { halign: "right", cellWidth: 40 } },
  });

  // --- Totaux --------------------------------------------------------
  const totaux: Array<[string, string]> = [
    ["Montant HT", formatFCFA(d.montant_ht, devise)],
  ];
  if (d.tva > 0) {
    totaux.push([`TVA (${cabinet.taux_tva}%)`, formatFCFA(d.tva, devise)]);
  }
  totaux.push(["Total TTC", formatFCFA(d.montant_ttc, devise)]);

  ajouterTableau(ctx, {
    body: totaux,
    theme: "plain",
    margin: { left: ctx.largeur - ctx.margeX - 80, right: ctx.margeX },
    styles: { fontSize: 10, cellPadding: 1.5 },
    columnStyles: {
      0: { fontStyle: "bold", cellWidth: 45 },
      1: { halign: "right", cellWidth: 35 },
    },
    didParseCell: (data) => {
      if (data.row.index === totaux.length - 1) {
        data.cell.styles.fontStyle = "bold";
        data.cell.styles.textColor = ctx.couleur;
        data.cell.styles.fontSize = 11;
      }
    },
  });

  // --- Validité + statut --------------------------------------------
  let yInfo = getCurseurY(doc);
  if (yInfo > doc.internal.pageSize.getHeight() - 30) {
    doc.addPage();
    yInfo = 20;
  }
  if (d.date_validite) {
    doc.setFont("helvetica", "bold");
    doc.setFontSize(10);
    doc.setTextColor(ctx.couleur[0], ctx.couleur[1], ctx.couleur[2]);
    doc.text(
      `Devis valable jusqu'au ${formatDate(d.date_validite)}`,
      ctx.margeX,
      yInfo,
    );
  }
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8.5);
  doc.setTextColor(110, 110, 110);
  doc.text(
    `Statut : ${LIBELLE_STATUT_DEVIS[d.statut] ?? d.statut}`,
    ctx.largeur - ctx.margeX,
    yInfo,
    { align: "right" },
  );
  setCurseurY(doc, yInfo + 8);

  // --- Notes ---------------------------------------------------------
  if (d.notes) {
    let yNotes = getCurseurY(doc);
    if (yNotes > doc.internal.pageSize.getHeight() - 40) {
      doc.addPage();
      yNotes = 20;
    }
    doc.setFont("helvetica", "bold");
    doc.setFontSize(9.5);
    doc.setTextColor(30, 30, 30);
    doc.text("Notes", ctx.margeX, yNotes);
    yNotes += 5;
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    doc.setTextColor(70, 70, 70);
    const lignesNotes = doc.splitTextToSize(
      d.notes,
      ctx.largeur - ctx.margeX * 2,
    );
    doc.text(lignesNotes, ctx.margeX, yNotes);
    setCurseurY(doc, yNotes + lignesNotes.length * 5 + 4);
  }

  ajouterPiedDePage(ctx);
  telechargerPdf(doc, `devis-${d.numero}`);
}
