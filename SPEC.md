# PRÉTOIRE — Cahier des charges complet

Logiciel de Gestion de Cabinet d'Avocats — Cabinet au Cameroun (droit OHADA + droit camerounais)

**Stack :** Next.js 14 (App Router) + Supabase (PostgreSQL + Auth + Storage) + Tailwind CSS

---

## CABINET PAR DÉFAUT (données pré-configurées au premier lancement)

| Champ | Valeur |
|---|---|
| Nom du cabinet | Cabinet Maître Kengni Christophe |
| Avocat principal | Maître Kengni Christophe |
| Adresse | Quartier Mvogbi, Yaoundé, Cameroun |
| Téléphone 1 | +237 677 776 672 |
| Téléphone 2 | +237 694 773 207 |
| Email | kengnichristophe@gmail.com |
| Barreau | Barreau du Cameroun |

Ces données doivent être stockées dans une table `cabinet_config` en base.
L'administrateur système peut les modifier à tout moment depuis `/parametres/cabinet` — sans toucher au code — afin de revendre le logiciel à n'importe quel autre cabinet.

## LOGO

- Page de login : afficher le logo du Barreau du Cameroun (SVG maison : balance de la justice + silhouette du Cameroun + couleurs vert `#007A5E` / rouge `#CE1126` / jaune `#FCD116`) ET le nom du cabinet issu de `cabinet_config`.
- Sidebar : logo Prétoire (balance stylisée) + nom du cabinet dynamique depuis `cabinet_config`.
- Factures & PDFs : en-tête avec logo + toutes les coordonnées du cabinet issues de `cabinet_config` (jamais en dur dans le code).

---

## DOMAINE 1 — Fondation

- Projet Next.js 14 App Router, TypeScript, Tailwind CSS
- Supabase : auth, storage buckets, row-level security policies
- TOUTES les migrations de base de données (schéma complet ci-dessous)
- Seed `cabinet_config` avec les données Cabinet Maître Kengni Christophe / Mvogbi
- Authentification : login, logout, contrôle d'accès par rôle
- Shell principal : sidebar (logo + nom cabinet dynamique), topbar, layout responsive
- Toggle dark/light mode
- Page Dashboard : cartes KPI (dossiers actifs, RDV du jour, heures facturées ce mois, stagiaires présents), agenda du jour, dossiers récents
- Middleware de protection des routes par rôle

### Rôles

- `admin_systeme` → accès total + paramètres cabinet
- `associe_principal` → accès total sauf paramètres système
- `associe` → accès dossiers + finance + agenda
- `collaborateur` → accès dossiers + agenda + time tracking
- `stagiaire` → accès dossiers assignés + agenda (lecture seule finance)
- `secretaire` → agenda + clients + dossiers (pas finance)
- `comptable` → finance uniquement

## DOMAINE 2 — Dossiers & Clients

- Full CRUD Clients (personnes physiques + morales)
- Full CRUD Dossiers avec :
  - Numéro auto-généré : `DOS-2026-001`
  - Types : civil, pénal, commercial, social, administratif, OHADA
  - Parties (demandeur, défendeur, tiers)
  - Tribunal/juridiction, chambre, numéro de rôle
  - Avocat(s) responsable(s) + équipe
  - Statut : ouvert / en cours / suspendu / clôturé / archivé
  - Description des faits, prétentions, moyens
  - Pièces jointes (Supabase Storage)
  - Notes internes
  - Timeline des événements du dossier
- Vérification automatique des conflits d'intérêts à la création
- Page détail dossier avec onglets (Infos, Parties, Actes, Documents, Équipe, Finances, Notes)
- Recherche et filtres avancés
- Export PDF fiche récapitulative dossier
- Module Actes & Procédures par dossier (assignation, conclusions, jugement, appel, pourvoi…)

## DOMAINE 3 — Planning & Équipe

- Agenda / Calendrier complet (vue jour, semaine, mois)
  - Rendez-vous clients (lieu, durée, avocat, dossier lié)
  - Audiences (tribunal, chambre, numéro de rôle, dossier lié)
  - Réunions internes
  - Délais de procédure avec alertes automatiques J-7, J-3, J-1
  - Couleurs par type d'événement
- Notifications in-app + email pour échéances proches
- Gestion des Avocats :
  - Profil (barreau, numéro inscription, spécialités)
  - Charge de travail, heures facturables, objectifs vs réalisé
- Gestion des Stagiaires :
  - Fiche complète (université, année, dates, maître de stage)
  - Dossiers assignés en supervision
  - Évaluations périodiques (formulaire de notation 1-5)
  - Suivi des présences (pointage journalier)
  - Génération PDF attestation de stage (en-tête dynamique depuis `cabinet_config`)
- Module Correspondance : courriers entrants/sortants liés aux dossiers

## DOMAINE 4 — Finance & Reporting

- Time tracking :
  - Saisie heures par avocat / dossier / tâche
  - Types : consultation, rédaction, audience, recherche, déplacement
  - Taux horaire configurable par avocat
  - Vue timesheet hebdomadaire
- Facturation :
  - Génération PDF facture (en-tête dynamique depuis `cabinet_config`)
  - Honoraires fixes / horaires / provisions
  - Suivi paiements (payé, partiel, impayé, contentieux)
  - Relances automatiques J+30, J+60, J+90
  - Devise : FCFA (Franc CFA)
  - Numérotation auto : `FACT-2026-001`
- Dashboard financier :
  - CA mois / trimestre / année
  - Créances en cours
  - Top 10 clients par revenus
  - Revenus par type de dossier
  - Graphiques recharts (bar + line)
- Comptabilité simplifiée : recettes / dépenses
- Reporting PDF exportable : activité mensuelle, performance par avocat
- Knowledge base : bibliothèque de modèles de documents (mise en demeure, conclusions, contrats…)

---

## SCHÉMA DE BASE DE DONNÉES COMPLET

```sql
-- Configuration cabinet (WHITE-LABEL)
cabinet_config (
  id, nom_cabinet, nom_avocat_principal, adresse, ville, pays,
  telephone_1, telephone_2, email, site_web, barreau, numero_barreau,
  logo_url, couleur_principale, couleur_secondaire,
  pied_de_page_facture, tva_applicable boolean, taux_tva,
  devise, format_date, updated_at, updated_by
)

-- Utilisateurs
profiles (
  id, user_id, nom, prenom, email, telephone, role,
  photo_url, barreau_numero, specialites[], taux_horaire,
  date_entree, actif
)

-- Stagiaires
stagiaires (
  id, nom, prenom, email, telephone, universite,
  annee_etude, date_debut, date_fin, maitre_stage_id,
  objectifs_stage, notes_evaluation, note_globale,
  actif, created_at
)

presences_stagiaires (
  id, stagiaire_id, date, heure_arrivee, heure_depart,
  present boolean, motif_absence, valide_par
)

-- Clients & Dossiers
clients (
  id, type[physique/morale], nom, prenom, raison_sociale,
  email, telephone, adresse, ville, cni_numero,
  rccm_numero, notes, created_at
)

dossiers (
  id, numero, titre, type_affaire, description_faits,
  pretentions, moyens, statut, tribunal, chambre,
  numero_role, client_id, avocat_responsable_id,
  date_ouverture, date_cloture_prev, date_cloture_reel,
  montant_enjeu, notes_internes, created_at
)

dossier_equipe (id, dossier_id, profile_id, role_dans_dossier)
dossier_stagiaires (id, dossier_id, stagiaire_id, date_affectation)

parties (
  id, dossier_id, nom, type[demandeur/defendeur/tiers],
  avocat_adverse, contact
)

actes_procedure (
  id, dossier_id, type_acte, description,
  date_acte, auteur_id, fichier_url
)

-- Agenda
evenements (
  id, titre, type[rdv/audience/reunion/deadline/deplacement],
  description, dossier_id, profile_id, stagiaire_id,
  lieu, date_debut, date_fin, rappel_j7 boolean,
  rappel_j3 boolean, rappel_j1 boolean,
  rappel_envoye boolean, created_by
)

-- Finance
saisies_temps (
  id, profile_id, dossier_id, date, type_tache,
  description, duree_heures, taux_horaire,
  facturable boolean, facture_id, created_at
)

factures (
  id, numero, client_id, dossier_id, date_emission,
  date_echeance, montant_ht, tva, montant_ttc,
  devise, statut[brouillon/envoyee/payee/partielle/impayee/contentieux],
  notes, created_by, created_at
)

paiements (
  id, facture_id, date_paiement, montant,
  mode_paiement[especes/virement/mobile_money/cheque],
  reference, notes
)

depenses (
  id, categorie, description, montant,
  date_depense, justificatif_url, created_by
)

-- Documents
documents (
  id, nom, type, dossier_id, uploaded_by,
  fichier_url, taille_ko, created_at
)

modeles_documents (
  id, nom, categorie, description,
  fichier_url, uploaded_by, actif
)

-- Notifications
notifications (
  id, user_id, titre, message, type,
  lien, lu boolean, created_at
)

-- Correspondance
courriers (
  id, dossier_id, type[entrant/sortant], objet,
  expediteur, destinataire, date_courrier,
  fichier_url, notes, created_by
)
```

---

## PARAMÈTRES / WHITE-LABEL — PAGE /parametres/cabinet

Accessible uniquement au rôle `admin_systeme`.
Formulaire complet permettant de modifier TOUS les champs de `cabinet_config` sans toucher au code :

- Nom du cabinet, nom de l'avocat principal
- Adresse complète, téléphone 1, téléphone 2, email, site web
- Numéro d'inscription au Barreau
- Upload du logo (remplace le logo par défaut partout dans l'app)
- Couleur principale (color picker → régénère le thème via CSS vars)
- Pied de page personnalisé pour les factures
- TVA applicable oui/non + taux
- Devise (défaut : FCFA)

Tout changement ici se répercute immédiatement sur : login page, sidebar, toutes les factures PDF, attestations stagiaires, rapports, en-têtes de courriers.

---

## UI/UX

- Langue : français intégral, terminologie juridique camerounaise
- Couleurs par défaut : vert `#007A5E`, rouge `#CE1126`, jaune `#FCD116` sur base blanche/gris clair — overridables depuis `cabinet_config`
- Devise : FCFA, format français (`1 500 000 FCFA`)
- Dates : JJ/MM/AAAA
- Design professionnel, épuré, responsive (tablettes en audience)
- Empty states avec CTA sur toutes les listes
- Skeletons de chargement sur tous les composants data
- Toasts succès/erreur sur tous les CRUD
- Confirmations avant toute suppression

---

## PAGES À CONSTRUIRE

```
/login
/dashboard
/dossiers
/dossiers/nouveau
/dossiers/[id]                  ← onglets : Infos / Parties / Actes / Documents / Équipe / Finances / Notes
/clients
/clients/nouveau
/clients/[id]
/agenda
/agenda/nouveau
/equipe
/equipe/[id]
/stagiaires
/stagiaires/nouveau
/stagiaires/[id]                ← onglets : Profil / Présences / Dossiers / Évaluations / Attestation
/time-tracking
/facturation
/facturation/nouvelle
/facturation/[id]
/finance
/documents
/modeles
/courriers
/notifications
/parametres/cabinet             ← WHITE-LABEL (admin uniquement)
/parametres/utilisateurs
/parametres/tarifs
```

---

## SEED DATA

Insérer automatiquement au premier lancement :

- `cabinet_config` : données Cabinet Maître Kengni Christophe (voir tableau en tête)
- 1 compte `admin_systeme` : `admin@pretoire.cm` / `Admin2024!`
- 2 avocats (associe + collaborateur)
- 3 stagiaires avec présences et évaluations
- 6 clients (mix physiques + morales)
- 10 dossiers variés (types et statuts différents)
- 15 événements agenda (RDV + audiences + deadlines)
- 8 factures (statuts variés) avec paiements
- 20 saisies de temps
- Quelques documents et modèles

---

## DELIVERABLES

1. Next.js tournant sur localhost:3000 sans erreur
2. Toutes les migrations Supabase appliquées
3. Toutes les pages construites et fonctionnelles
4. Seed data inséré et visible dès le premier login
5. PDF fonctionnel : facture + attestation stagiaire (en-tête dynamique depuis `cabinet_config`)
6. Paramètres white-label fonctionnels : changer le nom du cabinet met à jour toute l'interface immédiatement
7. Auth complète avec rôles vérifiés sur chaque route
8. `.env.example` documenté
9. `README.md` : setup, architecture, rôles, captures d'écran
10. Zero TypeScript errors (`npx tsc --noEmit` avant de rendre)
11. Zero page cassée ou vide
