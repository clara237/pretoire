import { creerDocument, getCurseurY, setCurseurY, ajouterPiedDePage, telechargerPdf } from "@/lib/pdf/document-base";
import type { CabinetConfig } from "@/lib/cabinet";
import { formatDate, formatDateLongue } from "@/lib/utils";

export interface DonneesAttestation {
  stagiaire: {
    nom: string;
    prenom: string;
    universite: string | null;
    annee_etude: string | null;
    date_debut: string | null;
    date_fin: string | null;
    objectifs_stage: string | null;
    note_globale: number | null;
  };
  maitreStage: string | null;
}

/**
 * Génère et télécharge l'attestation de stage en PDF.
 * En-tête 100 % dynamique depuis cabinet_config (via creerDocument).
 * La signature est celle de l'avocat principal (cabinet_config.nom_avocat_principal).
 */
export function genererAttestationStage(
  cabinet: CabinetConfig,
  donnees: DonneesAttestation,
): void {
  const ctx = creerDocument(cabinet, {
    titre: "Attestation de stage",
  });
  const { doc, margeX, largeur } = ctx;

  const nomComplet = `${donnees.stagiaire.prenom} ${donnees.stagiaire.nom}`.trim();
  const ville = cabinet.ville || "Yaoundé";

  let y = getCurseurY(doc) + 2;

  doc.setFont("helvetica", "normal");
  doc.setFontSize(10.5);
  doc.setTextColor(40, 40, 40);

  const largeurTexte = largeur - margeX * 2;

  // Corps de l'attestation
  const avocat =
    cabinet.nom_avocat_principal || "Le représentant du cabinet";
  const intro =
    `Je soussigné(e), ${avocat}, agissant au nom du cabinet ${cabinet.nom_cabinet}` +
    (cabinet.barreau ? `, ${cabinet.barreau}` : "") +
    `, atteste par la présente que :`;

  const lignesIntro = doc.splitTextToSize(intro, largeurTexte);
  doc.text(lignesIntro, margeX, y);
  y += lignesIntro.length * 5.5 + 4;

  // Nom du stagiaire en évidence
  doc.setFont("helvetica", "bold");
  doc.setFontSize(13);
  doc.setTextColor(ctx.couleur[0], ctx.couleur[1], ctx.couleur[2]);
  doc.text(nomComplet, margeX, y);
  y += 8;

  doc.setFont("helvetica", "normal");
  doc.setFontSize(10.5);
  doc.setTextColor(40, 40, 40);

  // Détails (université / période)
  const details: string[] = [];
  if (donnees.stagiaire.universite) {
    details.push(
      `inscrit(e) à ${donnees.stagiaire.universite}` +
        (donnees.stagiaire.annee_etude
          ? ` (${donnees.stagiaire.annee_etude})`
          : ""),
    );
  }

  const periode =
    donnees.stagiaire.date_debut && donnees.stagiaire.date_fin
      ? `a effectué un stage au sein du cabinet du ${formatDate(
          donnees.stagiaire.date_debut,
        )} au ${formatDate(donnees.stagiaire.date_fin)}`
      : "a effectué un stage au sein du cabinet";
  details.push(periode + ".");

  const phraseDetails = details.join(", ");
  const lignesDetails = doc.splitTextToSize(
    phraseDetails.charAt(0).toUpperCase() + phraseDetails.slice(1),
    largeurTexte,
  );
  doc.text(lignesDetails, margeX, y);
  y += lignesDetails.length * 5.5 + 4;

  // Maître de stage
  if (donnees.maitreStage) {
    const phraseMaitre = `Durant cette période, le stage a été encadré et supervisé par ${donnees.maitreStage}.`;
    const lignesMaitre = doc.splitTextToSize(phraseMaitre, largeurTexte);
    doc.text(lignesMaitre, margeX, y);
    y += lignesMaitre.length * 5.5 + 4;
  }

  // Objectifs / missions
  if (donnees.stagiaire.objectifs_stage) {
    const phraseObj = `Au cours de ce stage, les missions confiées ont porté sur : ${donnees.stagiaire.objectifs_stage}`;
    const lignesObj = doc.splitTextToSize(phraseObj, largeurTexte);
    doc.text(lignesObj, margeX, y);
    y += lignesObj.length * 5.5 + 4;
  }

  // Appréciation globale
  if (donnees.stagiaire.note_globale != null) {
    const appreciation = libelleAppreciation(donnees.stagiaire.note_globale);
    const phraseNote = `L'appréciation globale du stagiaire est : ${appreciation} (${donnees.stagiaire.note_globale.toFixed(
      1,
    )}/5).`;
    const lignesNote = doc.splitTextToSize(phraseNote, largeurTexte);
    doc.text(lignesNote, margeX, y);
    y += lignesNote.length * 5.5 + 4;
  }

  // Formule de clôture
  const cloture =
    "En foi de quoi, la présente attestation est délivrée à l'intéressé(e) pour servir et valoir ce que de droit.";
  const lignesCloture = doc.splitTextToSize(cloture, largeurTexte);
  doc.text(lignesCloture, margeX, y);
  y += lignesCloture.length * 5.5 + 12;

  // Lieu et date
  doc.text(`Fait à ${ville}, le ${formatDateLongue(new Date())}.`, margeX, y);
  y += 18;

  // Bloc signature (avocat principal) — aligné à droite
  doc.setFont("helvetica", "bold");
  doc.setFontSize(10.5);
  doc.setTextColor(40, 40, 40);
  const xSignature = largeur - margeX - 70;
  doc.text("Le maître de stage,", xSignature, y);
  y += 6;
  doc.setFont("helvetica", "normal");
  if (cabinet.nom_avocat_principal) {
    doc.text(cabinet.nom_avocat_principal, xSignature, y);
    y += 5;
  }
  if (cabinet.barreau) {
    doc.setFontSize(9);
    doc.setTextColor(110, 110, 110);
    doc.text(cabinet.barreau, xSignature, y);
  }

  setCurseurY(doc, y);
  ajouterPiedDePage(ctx);

  const nomFichier = `attestation-stage-${donnees.stagiaire.nom}-${donnees.stagiaire.prenom}`
    .toLowerCase()
    .replace(/\s+/g, "-");
  telechargerPdf(doc, nomFichier);
}

function libelleAppreciation(note: number): string {
  if (note >= 4.5) return "Excellent";
  if (note >= 3.5) return "Très bien";
  if (note >= 2.5) return "Bien";
  if (note >= 1.5) return "Passable";
  return "Insuffisant";
}
