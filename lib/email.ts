import "server-only";
import nodemailer from "nodemailer";
import { getCabinetConfig } from "@/lib/cabinet";

/**
 * Envoi d'emails transactionnels (rappels d'échéances, relances de factures).
 *
 * En local : Mailpit (stack Supabase) écoute en SMTP sur SMTP_HOST:SMTP_PORT
 * (127.0.0.1:54325 par défaut) et expose les messages sur http://127.0.0.1:54324.
 * En production : pointer SMTP_HOST/SMTP_PORT/SMTP_USER/SMTP_PASS vers un vrai
 * fournisseur (ex. SMTP OVH, Resend, Brevo…).
 *
 * Si SMTP_HOST n'est pas configuré, l'envoi est silencieusement désactivé
 * (les notifications in-app restent la source de vérité).
 */

export interface EmailAEnvoyer {
  a: string;
  sujet: string;
  texte: string;
  html?: string;
}

function transporteur() {
  const host = process.env.SMTP_HOST;
  if (!host) return null;
  const port = Number(process.env.SMTP_PORT || 587);
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;
  return nodemailer.createTransport({
    host,
    port,
    secure: port === 465,
    auth: user && pass ? { user, pass } : undefined,
  });
}

/** Enveloppe HTML sobre aux couleurs du cabinet (white-label). */
function gabaritHtml(nomCabinet: string, corps: string): string {
  return `<!doctype html><html lang="fr"><body style="margin:0;padding:24px;background:#f4f4f5;font-family:Arial,Helvetica,sans-serif;color:#18181b">
  <div style="max-width:560px;margin:0 auto;background:#ffffff;border:1px solid #e4e4e7;border-radius:8px;overflow:hidden">
    <div style="padding:16px 24px;background:#1e293b;color:#ffffff;font-size:16px;font-weight:bold">${nomCabinet}</div>
    <div style="padding:24px;font-size:14px;line-height:1.6">${corps}</div>
    <div style="padding:12px 24px;background:#fafafa;border-top:1px solid #e4e4e7;font-size:11px;color:#71717a">
      Message automatique envoyé par ${nomCabinet} via Prétoire — merci de ne pas répondre directement.
    </div>
  </div>
</body></html>`;
}

/**
 * Envoie un email. Ne lève jamais : retourne { ok:false } en cas d'échec
 * (SMTP absent, réseau, adresse invalide) pour ne pas casser le flux appelant.
 */
export async function envoyerEmail(email: EmailAEnvoyer): Promise<{ ok: boolean }> {
  const t = transporteur();
  if (!t || !email.a) return { ok: false };
  try {
    const cabinet = await getCabinetConfig();
    const de =
      process.env.EMAIL_FROM ||
      cabinet.email ||
      "notifications@pretoire.local";
    await t.sendMail({
      from: `"${cabinet.nom_cabinet}" <${de}>`,
      to: email.a,
      subject: email.sujet,
      text: email.texte,
      html: email.html ?? gabaritHtml(cabinet.nom_cabinet, email.texte.replace(/\n/g, "<br/>")),
    });
    return { ok: true };
  } catch {
    return { ok: false };
  }
}

/** Envoi en lot, sans échec global si un destinataire tombe en erreur. */
export async function envoyerEmails(emails: EmailAEnvoyer[]): Promise<number> {
  let envoyes = 0;
  for (const e of emails) {
    const r = await envoyerEmail(e);
    if (r.ok) envoyes++;
  }
  return envoyes;
}
