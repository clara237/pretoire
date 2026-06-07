import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/database.types";
import { envoyerEmails, type EmailAEnvoyer } from "@/lib/email";

/**
 * Cœur des rappels automatiques — logique partagée entre :
 *  - l'action manuelle « Vérifier les échéances » (bouton de l'agenda) ;
 *  - le job système déclenché automatiquement (lib/rappels-auto.ts).
 *
 * Deux vérifications :
 *  1. Échéances de procédure (événements type "deadline") aux paliers J-7/J-3/J-1
 *     → notification in-app + email aux avocats concernés.
 *  2. Factures échues (envoyée/partielle dont la date d'échéance est dépassée)
 *     → passage au statut "impayee" + notification + email à l'émetteur.
 */

type ClientSupabase = SupabaseClient<Database>;

const MS_JOUR = 1000 * 60 * 60 * 24;

interface EcheanceLigne {
  id: string;
  titre: string;
  description: string | null;
  date_debut: string;
  dossier_id: string | null;
  profile_id: string | null;
  created_by: string | null;
  rappel_j7: boolean;
  rappel_j3: boolean;
  rappel_j1: boolean;
}

interface ProfilContact {
  user_id: string;
  email: string;
  prenom: string;
}

/** Charge id → contact pour une liste de profils. */
async function chargerContacts(
  supabase: ClientSupabase,
  profileIds: string[],
): Promise<Map<string, ProfilContact>> {
  const map = new Map<string, ProfilContact>();
  if (profileIds.length === 0) return map;
  const { data } = await supabase
    .from("profiles")
    .select("id, user_id, email, prenom")
    .in("id", profileIds);
  for (const p of (data ?? []) as Array<ProfilContact & { id: string }>) {
    map.set(p.id, p);
  }
  return map;
}

/**
 * Rappels d'échéances de procédure (paliers J-7/J-3/J-1).
 * `fallbackUserId` : destinataire de secours quand l'échéance n'a ni
 * responsable ni créateur (cas du déclenchement manuel).
 */
export async function verifierEcheancesCore(
  supabase: ClientSupabase,
  fallbackUserId?: string,
): Promise<{ ok: boolean; rappels: number; message?: string }> {
  const maintenant = new Date();
  const dans7j = new Date(maintenant);
  dans7j.setDate(dans7j.getDate() + 8);

  const { data, error } = await supabase
    .from("evenements")
    .select(
      "id, titre, description, date_debut, dossier_id, profile_id, created_by, rappel_j7, rappel_j3, rappel_j1",
    )
    .eq("type", "deadline")
    .eq("rappel_envoye", false)
    .gte("date_debut", maintenant.toISOString())
    .lte("date_debut", dans7j.toISOString());

  if (error) return { ok: false, rappels: 0, message: error.message };

  const echeances = (data ?? []) as EcheanceLigne[];
  if (echeances.length === 0) return { ok: true, rappels: 0 };

  const contacts = await chargerContacts(
    supabase,
    Array.from(
      new Set(
        echeances
          .flatMap((e) => [e.profile_id, e.created_by])
          .filter((v): v is string => Boolean(v)),
      ),
    ),
  );

  const lignesNotif: Array<{
    user_id: string;
    titre: string;
    message: string;
    type: string;
    lien: string;
  }> = [];
  const emails: EmailAEnvoyer[] = [];
  const idsAMarquer: string[] = [];

  for (const e of echeances) {
    const echeance = new Date(e.date_debut);
    const joursRestants = Math.ceil(
      (echeance.getTime() - maintenant.getTime()) / MS_JOUR,
    );

    let palier: 7 | 3 | 1 | null = null;
    if (joursRestants <= 1 && e.rappel_j1) palier = 1;
    else if (joursRestants <= 3 && e.rappel_j3) palier = 3;
    else if (joursRestants <= 7 && e.rappel_j7) palier = 7;
    if (palier === null) continue;

    const destinataires = new Map<string, ProfilContact | null>();
    for (const pid of [e.profile_id, e.created_by]) {
      const c = pid ? contacts.get(pid) : undefined;
      if (c) destinataires.set(c.user_id, c);
    }
    if (destinataires.size === 0 && fallbackUserId) {
      destinataires.set(fallbackUserId, null);
    }

    const libellePalier =
      palier === 1 ? "demain (J-1)" : `dans ${palier} jours (J-${palier})`;
    const message = e.description
      ? e.description
      : `Le délai de procédure « ${e.titre} » arrive à terme ${libellePalier}.`;

    for (const [uid, contact] of destinataires) {
      lignesNotif.push({
        user_id: uid,
        titre: `Échéance ${libellePalier} : ${e.titre}`,
        message,
        type: "echeance",
        lien: "/agenda",
      });
      if (contact?.email) {
        emails.push({
          a: contact.email,
          sujet: `⏰ Échéance ${libellePalier} : ${e.titre}`,
          texte:
            `Bonjour ${contact.prenom},\n\n` +
            `${message}\n\n` +
            `Échéance : ${echeance.toLocaleDateString("fr-FR")}\n` +
            `Consultez l'agenda du cabinet pour le détail.`,
        });
      }
    }
    idsAMarquer.push(e.id);
  }

  if (lignesNotif.length === 0) return { ok: true, rappels: 0 };

  const { error: errInsert } = await supabase
    .from("notifications")
    .insert(lignesNotif);
  if (errInsert) return { ok: false, rappels: 0, message: errInsert.message };

  await supabase
    .from("evenements")
    .update({ rappel_envoye: true })
    .in("id", idsAMarquer);

  await envoyerEmails(emails);

  return { ok: true, rappels: lignesNotif.length };
}

interface FactureEchue {
  id: string;
  numero: string;
  montant_ttc: number;
  devise: string;
  date_echeance: string;
  created_by: string | null;
  client: {
    type: string;
    nom: string | null;
    prenom: string | null;
    raison_sociale: string | null;
  } | null;
}

/** Nom d'affichage d'un client (physique ou moral). */
export function nomClient(c: FactureEchue["client"]): string {
  if (!c) return "le client";
  return c.type === "morale"
    ? c.raison_sociale || "Personne morale"
    : [c.prenom, c.nom].filter(Boolean).join(" ") || "le client";
}

/**
 * Factures échues : envoyée/partielle dont la date d'échéance est dépassée
 * → statut "impayee" + notification + email à l'émetteur de la facture.
 * Le changement de statut sert de garde anti-doublon (une seule transition).
 */
export async function marquerFacturesEchuesCore(
  supabase: ClientSupabase,
): Promise<{ ok: boolean; relances: number; message?: string }> {
  const aujourdHui = new Date().toISOString().slice(0, 10);

  const { data, error } = await supabase
    .from("factures")
    .select(
      "id, numero, montant_ttc, devise, date_echeance, created_by, " +
        "client:clients(type, nom, prenom, raison_sociale)",
    )
    .in("statut", ["envoyee", "partielle"])
    .lt("date_echeance", aujourdHui);

  if (error) return { ok: false, relances: 0, message: error.message };

  const factures = (data ?? []) as unknown as FactureEchue[];
  if (factures.length === 0) return { ok: true, relances: 0 };

  const contacts = await chargerContacts(
    supabase,
    Array.from(
      new Set(
        factures.map((f) => f.created_by).filter((v): v is string => Boolean(v)),
      ),
    ),
  );

  const { error: errMaj } = await supabase
    .from("factures")
    .update({ statut: "impayee" })
    .in(
      "id",
      factures.map((f) => f.id),
    );
  if (errMaj) return { ok: false, relances: 0, message: errMaj.message };

  const lignesNotif: Array<{
    user_id: string;
    titre: string;
    message: string;
    type: string;
    lien: string;
  }> = [];
  const emails: EmailAEnvoyer[] = [];

  for (const f of factures) {
    const contact = f.created_by ? contacts.get(f.created_by) : undefined;
    if (!contact) continue;
    const cli = nomClient(f.client);
    const message = `La facture ${f.numero} (${Math.round(f.montant_ttc).toLocaleString("fr-FR")} ${f.devise}) adressée à ${cli} a dépassé son échéance du ${new Date(f.date_echeance).toLocaleDateString("fr-FR")}. Elle est passée au statut « impayée ».`;
    lignesNotif.push({
      user_id: contact.user_id,
      titre: `Facture échue : ${f.numero}`,
      message,
      type: "relance",
      lien: `/facturation/${f.id}`,
    });
    if (contact.email) {
      emails.push({
        a: contact.email,
        sujet: `💸 Facture échue : ${f.numero} — ${cli}`,
        texte: `Bonjour ${contact.prenom},\n\n${message}\n\nPensez à relancer le client depuis la page Facturation.`,
      });
    }
  }

  if (lignesNotif.length > 0) {
    await supabase.from("notifications").insert(lignesNotif);
  }
  await envoyerEmails(emails);

  return { ok: true, relances: factures.length };
}
