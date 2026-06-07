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
  LIBELLE_STATUT,
  LIBELLE_TYPE_AFFAIRE,
  LIBELLE_TYPE_PARTIE,
} from "@/lib/queries/dossiers-labels";

export interface DonneesFicheDossier {
  numero: string;
  titre: string;
  type_affaire: string;
  statut: string;
  tribunal: string | null;
  chambre: string | null;
  numero_role: string | null;
  date_ouverture: string;
  date_cloture_prev: string | null;
  montant_enjeu: number | null;
  description_faits: string | null;
  pretentions: string | null;
  moyens: string | null;
  nomClient: string;
  nomAvocat: string;
  parties: Array<{ nom: string; type: string; avocat_adverse: string | null }>;
  actes: Array<{ type_acte: string; date_acte: string; description: string | null }>;
  equipe: Array<{ nom: string; role: string | null }>;
}

/**
 * Génère et télécharge la fiche récapitulative PDF d'un dossier.
 * En-tête dynamique depuis cabinet_config (white-label).
 */
export function genererFicheDossier(
  cabinet: CabinetConfig,
  d: DonneesFicheDossier,
): void {
  const ctx = creerDocument(cabinet, {
    titre: `Fiche dossier — ${d.numero}`,
    sousTitre: d.titre,
  });
  const { doc } = ctx;

  // --- Informations générales ---------------------------------------
  ajouterTableau(ctx, {
    head: [["Informations générales", ""]],
    body: [
      ["Numéro", d.numero],
      ["Intitulé", d.titre],
      ["Type d'affaire", LIBELLE_TYPE_AFFAIRE[d.type_affaire] ?? d.type_affaire],
      ["Statut", LIBELLE_STATUT[d.statut] ?? d.statut],
      ["Client", d.nomClient],
      ["Avocat responsable", d.nomAvocat],
      ["Juridiction", d.tribunal || "—"],
      ["Chambre", d.chambre || "—"],
      ["Numéro de rôle", d.numero_role || "—"],
      ["Date d'ouverture", formatDate(d.date_ouverture)],
      ["Clôture prévue", d.date_cloture_prev ? formatDate(d.date_cloture_prev) : "—"],
      [
        "Montant en jeu",
        d.montant_enjeu != null ? formatFCFA(d.montant_enjeu, cabinet.devise) : "—",
      ],
    ],
    columnStyles: { 0: { fontStyle: "bold", cellWidth: 50 } },
  });

  // --- Parties -------------------------------------------------------
  if (d.parties.length > 0) {
    ajouterTableau(ctx, {
      head: [["Partie", "Qualité", "Avocat adverse"]],
      body: d.parties.map((p) => [
        p.nom,
        LIBELLE_TYPE_PARTIE[p.type] ?? p.type,
        p.avocat_adverse || "—",
      ]),
    });
  }

  // --- Équipe --------------------------------------------------------
  if (d.equipe.length > 0) {
    ajouterTableau(ctx, {
      head: [["Membre de l'équipe", "Rôle"]],
      body: d.equipe.map((m) => [m.nom, m.role || "—"]),
    });
  }

  // --- Actes de procédure -------------------------------------------
  if (d.actes.length > 0) {
    ajouterTableau(ctx, {
      head: [["Date", "Acte", "Description"]],
      body: d.actes.map((a) => [
        formatDate(a.date_acte),
        a.type_acte,
        a.description || "—",
      ]),
      columnStyles: { 0: { cellWidth: 25 }, 1: { cellWidth: 40 } },
    });
  }

  // --- Exposé : faits / prétentions / moyens ------------------------
  const sections: Array<[string, string | null]> = [
    ["Exposé des faits", d.description_faits],
    ["Prétentions", d.pretentions],
    ["Moyens", d.moyens],
  ];
  for (const [titre, contenu] of sections) {
    if (!contenu) continue;
    let y = getCurseurY(doc);
    if (y > doc.internal.pageSize.getHeight() - 40) {
      doc.addPage();
      y = 20;
    }
    doc.setFont("helvetica", "bold");
    doc.setFontSize(11);
    doc.setTextColor(30, 30, 30);
    doc.text(titre, ctx.margeX, y);
    y += 6;
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9.5);
    doc.setTextColor(60, 60, 60);
    const lignes = doc.splitTextToSize(contenu, ctx.largeur - ctx.margeX * 2);
    doc.text(lignes, ctx.margeX, y);
    setCurseurY(doc, y + lignes.length * 5 + 6);
  }

  ajouterPiedDePage(ctx);
  telechargerPdf(doc, `fiche-${d.numero}`);
}
