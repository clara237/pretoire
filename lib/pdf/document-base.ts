import { jsPDF } from "jspdf";
import autoTable, { type UserOptions } from "jspdf-autotable";
import type { CabinetConfig } from "@/lib/cabinet";

/** Couleur principale par défaut (vert Barreau). Override par cabinet.couleur_principale. */
function hexToRgb(hex: string): [number, number, number] {
  const h = hex.replace("#", "");
  const v = h.length === 3 ? h.split("").map((c) => c + c).join("") : h;
  const n = parseInt(v, 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

export interface PdfContext {
  doc: jsPDF;
  cabinet: CabinetConfig;
  couleur: [number, number, number];
  margeX: number;
  largeur: number;
}

/**
 * Crée un document PDF A4 avec en-tête dynamique (cabinet_config) et renvoie
 * un contexte partagé. Utilisé par factures, attestations, fiches dossier, rapports.
 */
export function creerDocument(
  cabinet: CabinetConfig,
  options?: { titre?: string; sousTitre?: string },
): PdfContext {
  const doc = new jsPDF({ unit: "mm", format: "a4" });
  const margeX = 15;
  const largeur = doc.internal.pageSize.getWidth();
  const couleur = hexToRgb(cabinet.couleur_principale || "#007A5E");

  // Bandeau couleur en haut
  doc.setFillColor(couleur[0], couleur[1], couleur[2]);
  doc.rect(0, 0, largeur, 4, "F");

  // Nom du cabinet
  doc.setFont("helvetica", "bold");
  doc.setFontSize(16);
  doc.setTextColor(couleur[0], couleur[1], couleur[2]);
  doc.text(cabinet.nom_cabinet || "Cabinet", margeX, 18);

  // Coordonnées
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(90, 90, 90);
  const lignes: string[] = [];
  if (cabinet.nom_avocat_principal) lignes.push(cabinet.nom_avocat_principal);
  const adresse = [cabinet.adresse, cabinet.ville, cabinet.pays]
    .filter(Boolean)
    .join(", ");
  if (adresse) lignes.push(adresse);
  const tel = [cabinet.telephone_1, cabinet.telephone_2]
    .filter(Boolean)
    .join(" / ");
  if (tel) lignes.push(`Tél : ${tel}`);
  if (cabinet.email) lignes.push(cabinet.email);
  if (cabinet.barreau) {
    lignes.push(
      cabinet.numero_barreau
        ? `${cabinet.barreau} — N° ${cabinet.numero_barreau}`
        : cabinet.barreau,
    );
  }
  let y = 24;
  for (const l of lignes) {
    doc.text(l, margeX, y);
    y += 4.5;
  }

  // Ligne de séparation
  doc.setDrawColor(220, 220, 220);
  doc.line(margeX, y + 1, largeur - margeX, y + 1);
  let yTitre = y + 11;

  if (options?.titre) {
    doc.setFont("helvetica", "bold");
    doc.setFontSize(15);
    doc.setTextColor(30, 30, 30);
    doc.text(options.titre.toUpperCase(), margeX, yTitre);
    yTitre += 6;
  }
  if (options?.sousTitre) {
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.setTextColor(110, 110, 110);
    doc.text(options.sousTitre, margeX, yTitre);
    yTitre += 5;
  }

  // Position du curseur Y mémorisée pour le contenu
  setCurseurY(doc, yTitre + 4);

  return { doc, cabinet, couleur, margeX, largeur };
}

const CURSEUR = new WeakMap<jsPDF, number>();
export function setCurseurY(doc: jsPDF, y: number) {
  CURSEUR.set(doc, y);
}
export function getCurseurY(doc: jsPDF): number {
  return CURSEUR.get(doc) ?? 60;
}

/** Tableau stylé aux couleurs du cabinet (wrapper autoTable). */
export function ajouterTableau(
  ctx: PdfContext,
  options: UserOptions,
): void {
  autoTable(ctx.doc, {
    startY: getCurseurY(ctx.doc),
    margin: { left: ctx.margeX, right: ctx.margeX },
    styles: { fontSize: 9, cellPadding: 2.5 },
    headStyles: {
      fillColor: ctx.couleur,
      textColor: 255,
      fontStyle: "bold",
    },
    alternateRowStyles: { fillColor: [245, 247, 246] },
    ...options,
  });
  // @ts-expect-error lastAutoTable est injecté par le plugin
  const fin = ctx.doc.lastAutoTable?.finalY;
  if (typeof fin === "number") setCurseurY(ctx.doc, fin + 6);
}

/** Pied de page (numéro, mention légale, pied personnalisé cabinet). */
export function ajouterPiedDePage(ctx: PdfContext): void {
  const { doc, cabinet, largeur } = ctx;
  const total =
    typeof doc.getNumberOfPages === "function" ? doc.getNumberOfPages() : 1;
  const hauteur = doc.internal.pageSize.getHeight();
  for (let p = 1; p <= total; p++) {
    doc.setPage(p);
    doc.setDrawColor(220, 220, 220);
    doc.line(ctx.margeX, hauteur - 14, largeur - ctx.margeX, hauteur - 14);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(7.5);
    doc.setTextColor(140, 140, 140);
    const pied =
      cabinet.pied_de_page_facture ||
      `${cabinet.nom_cabinet} — ${cabinet.barreau ?? ""}`.trim();
    doc.text(pied, ctx.margeX, hauteur - 9);
    doc.text(`Page ${p} / ${total}`, largeur - ctx.margeX, hauteur - 9, {
      align: "right",
    });
  }
}

/** Déclenche le téléchargement du PDF dans le navigateur. */
export function telechargerPdf(doc: jsPDF, nomFichier: string): void {
  doc.save(nomFichier.endsWith(".pdf") ? nomFichier : `${nomFichier}.pdf`);
}
