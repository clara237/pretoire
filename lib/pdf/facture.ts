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
import {
  LIBELLE_STATUT_FACTURE,
  LIBELLE_MODE_PAIEMENT,
  LIBELLE_TYPE_TACHE,
  LIBELLE_CATEGORIE_LIGNE,
} from "@/lib/finance-constants";

export interface LignePdfFacture {
  date: string;
  type_tache: string;
  description: string | null;
  duree_heures: number;
  taux_horaire: number | null;
}

export interface LigneManuellePdfFacture {
  libelle: string;
  categorie: string;
  quantite: number;
  montant_unitaire: number;
  montant: number;
}

export interface PaiementPdf {
  date_paiement: string;
  montant: number;
  mode_paiement: string;
  reference: string | null;
}

export interface DonneesFacturePdf {
  numero: string;
  date_emission: string;
  date_echeance: string | null;
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
  lignes: LignePdfFacture[];
  lignesManuelles?: LigneManuellePdfFacture[];
  paiements: PaiementPdf[];
}

/**
 * Génère et télécharge le PDF d'une facture.
 * En-tête + pied dynamiques depuis cabinet_config (white-label).
 */
export function genererFacture(
  cabinet: CabinetConfig,
  f: DonneesFacturePdf,
): void {
  const devise = f.devise || cabinet.devise || "FCFA";
  const ctx = creerDocument(cabinet, {
    titre: `Facture ${f.numero}`,
    sousTitre: `Émise le ${formatDate(f.date_emission)}${
      f.date_echeance ? ` — échéance le ${formatDate(f.date_echeance)}` : ""
    }`,
  });
  const { doc } = ctx;

  // --- Bloc destinataire (client) -----------------------------------
  let y = getCurseurY(doc);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.setTextColor(30, 30, 30);
  doc.text("Facturé à", ctx.margeX, y);
  y += 5;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.setTextColor(60, 60, 60);
  doc.text(f.nomClient, ctx.margeX, y);
  y += 5;
  if (f.adresseClient) {
    const adr = doc.splitTextToSize(f.adresseClient, 90);
    doc.text(adr, ctx.margeX, y);
    y += adr.length * 5;
  }
  if (f.numeroDossier) {
    doc.setFontSize(9);
    doc.setTextColor(110, 110, 110);
    const ref = `Dossier ${f.numeroDossier}${
      f.intituleDossier ? ` — ${f.intituleDossier}` : ""
    }`;
    const refLignes = doc.splitTextToSize(ref, ctx.largeur - ctx.margeX * 2);
    doc.text(refLignes, ctx.margeX, y + 1);
    y += refLignes.length * 5 + 1;
  }
  setCurseurY(doc, y + 4);

  // --- Lignes de détail ---------------------------------------------
  if (f.lignesManuelles && f.lignesManuelles.length > 0) {
    ajouterTableau(ctx, {
      head: [["Désignation", "Catégorie", "Qté", "P.U.", "Montant"]],
      body: f.lignesManuelles.map((l) => [
        l.libelle,
        LIBELLE_CATEGORIE_LIGNE[l.categorie] ?? l.categorie,
        String(l.quantite),
        formatFCFA(l.montant_unitaire, devise),
        formatFCFA(l.montant, devise),
      ]),
      columnStyles: {
        2: { halign: "right", cellWidth: 16 },
        3: { halign: "right", cellWidth: 28 },
        4: { halign: "right", cellWidth: 30 },
      },
    });
  } else if (f.lignes.length > 0) {
    ajouterTableau(ctx, {
      head: [["Date", "Prestation", "Durée", "Taux", "Montant"]],
      body: f.lignes.map((l) => {
        const montant = (l.duree_heures ?? 0) * (l.taux_horaire ?? 0);
        const libelleTache = LIBELLE_TYPE_TACHE[l.type_tache] ?? l.type_tache;
        const prestation = l.description
          ? `${libelleTache} — ${l.description}`
          : libelleTache;
        return [
          formatDate(l.date),
          prestation,
          `${l.duree_heures} h`,
          l.taux_horaire != null ? formatFCFA(l.taux_horaire, devise) : "—",
          formatFCFA(montant, devise),
        ];
      }),
      columnStyles: {
        0: { cellWidth: 22 },
        2: { halign: "right", cellWidth: 18 },
        3: { halign: "right", cellWidth: 28 },
        4: { halign: "right", cellWidth: 30 },
      },
    });
  } else {
    // Facture à honoraires fixes / provision : une seule ligne.
    ajouterTableau(ctx, {
      head: [["Désignation", "Montant"]],
      body: [
        [
          f.notes && f.notes.length <= 80 ? f.notes : "Honoraires",
          formatFCFA(f.montant_ht, devise),
        ],
      ],
      columnStyles: { 1: { halign: "right", cellWidth: 40 } },
    });
  }

  // --- Totaux --------------------------------------------------------
  const totaux: Array<[string, string]> = [
    ["Montant HT", formatFCFA(f.montant_ht, devise)],
  ];
  if (f.tva > 0) {
    totaux.push([`TVA (${cabinet.taux_tva}%)`, formatFCFA(f.tva, devise)]);
  }
  totaux.push(["Total TTC", formatFCFA(f.montant_ttc, devise)]);

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

  // --- Paiements & solde --------------------------------------------
  const totalPaye = f.paiements.reduce((s, p) => s + (p.montant ?? 0), 0);
  if (f.paiements.length > 0) {
    ajouterTableau(ctx, {
      head: [["Paiement", "Mode", "Référence", "Montant"]],
      body: f.paiements.map((p) => [
        formatDate(p.date_paiement),
        LIBELLE_MODE_PAIEMENT[p.mode_paiement] ?? p.mode_paiement,
        p.reference || "—",
        formatFCFA(p.montant, devise),
      ]),
      columnStyles: { 3: { halign: "right", cellWidth: 30 } },
    });
  }

  const solde = Math.max(0, f.montant_ttc - totalPaye);
  let ySolde = getCurseurY(doc);
  if (ySolde > doc.internal.pageSize.getHeight() - 30) {
    doc.addPage();
    ySolde = 20;
  }
  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.setTextColor(solde > 0 ? 200 : 30, solde > 0 ? 30 : 120, 30);
  doc.text(
    `Solde restant dû : ${formatFCFA(solde, devise)}`,
    ctx.largeur - ctx.margeX,
    ySolde,
    { align: "right" },
  );
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8.5);
  doc.setTextColor(110, 110, 110);
  doc.text(
    `Statut : ${LIBELLE_STATUT_FACTURE[f.statut] ?? f.statut}`,
    ctx.margeX,
    ySolde,
  );
  setCurseurY(doc, ySolde + 8);

  // --- Notes ---------------------------------------------------------
  if (f.notes) {
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
    const lignesNotes = doc.splitTextToSize(f.notes, ctx.largeur - ctx.margeX * 2);
    doc.text(lignesNotes, ctx.margeX, yNotes);
    setCurseurY(doc, yNotes + lignesNotes.length * 5 + 4);
  }

  ajouterPiedDePage(ctx);
  telechargerPdf(doc, `facture-${f.numero}`);
}
