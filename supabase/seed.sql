-- =====================================================================
-- PRÉTOIRE — Données de démonstration (SEED)
-- =====================================================================
-- PRÉREQUIS : les comptes auth + profils sont créés AVANT par
--   node scripts/seed-users.mjs
-- (les profils portent des UUID stables référencés ci-dessous).
--
-- Ce script est IDEMPOTENT : il purge les données de démo puis réinsère.
-- À exécuter avec :
--   psql "$DB_URL" -f supabase/seed.sql
-- =====================================================================

-- Profils créés par scripts/seed-users.mjs (UUID stables)
--   aaaaaaaa-0000-0000-0000-000000000001  Kengni Christophe  (admin_systeme)
--   aaaaaaaa-0000-0000-0000-000000000002  Nguemo Aline       (associe)
--   aaaaaaaa-0000-0000-0000-000000000003  Fotso Bertrand     (collaborateur)

begin;

-- ---------------------------------------------------------------------
-- Purge des données de démo (ordre des dépendances)
-- ---------------------------------------------------------------------
delete from paiements;
delete from saisies_temps;
delete from devis;
delete from factures;
delete from actes_procedure;
delete from parties;
delete from dossier_stagiaires;
delete from dossier_equipe;
delete from evenements;
delete from courriers;
delete from documents;
delete from modeles_documents;
delete from depenses;
delete from presences_stagiaires;
delete from notifications;
delete from stagiaires;
delete from dossiers;
delete from clients;
-- on ne touche pas aux profiles (gérés par le script) ni à auth.users

-- Réinitialisation des séquences de numérotation
select setval('seq_dossier_2026', 1, false);
select setval('seq_facture_2026', 1, false);
create sequence if not exists seq_dev_2026 start 1;
select setval('seq_dev_2026', 1, false);

-- ---------------------------------------------------------------------
-- CABINET_CONFIG (white-label) — données Cabinet Maître Kengni Christophe
-- ---------------------------------------------------------------------
delete from cabinet_config;
insert into cabinet_config (
  id, nom_cabinet, nom_avocat_principal, adresse, ville, pays,
  telephone_1, telephone_2, email, site_web, barreau, numero_barreau,
  couleur_principale, couleur_secondaire, pied_de_page_facture,
  tva_applicable, taux_tva, devise, format_date
) values (
  'cccccccc-0000-0000-0000-000000000001',
  'Cabinet Maître Kengni Christophe',
  'Maître Kengni Christophe',
  'Quartier Mvogbi',
  'Yaoundé',
  'Cameroun',
  '+237 677 776 672',
  '+237 694 773 207',
  'kengnichristophe@gmail.com',
  null,
  'Barreau du Cameroun',
  'CM-2008-0142',
  '#007A5E',
  '#CE1126',
  'Cabinet Maître Kengni Christophe — Quartier Mvogbi, Yaoundé, Cameroun — Barreau du Cameroun',
  false,
  0,
  'FCFA',
  'JJ/MM/AAAA'
);

-- ---------------------------------------------------------------------
-- CLIENTS (6 : 3 physiques + 3 morales)
-- ---------------------------------------------------------------------
insert into clients (id, type, nom, prenom, raison_sociale, email, telephone, adresse, ville, cni_numero, rccm_numero, notes) values
  ('c1000000-0000-0000-0000-000000000001','physique','Mbarga','Jean-Pierre',null,'jp.mbarga@gmail.com','+237 699 001 122','Rue 1.234, Bastos','Yaoundé','11223344',null,'Client de longue date.'),
  ('c1000000-0000-0000-0000-000000000002','physique','Tchatchou','Solange',null,'solange.t@yahoo.fr','+237 677 334 455','Akwa Nord','Douala','55667788',null,null),
  ('c1000000-0000-0000-0000-000000000003','physique','Ndiaye','Amadou',null,'a.ndiaye@outlook.com','+237 690 778 899','Quartier Tsinga','Yaoundé','99887766',null,'Litige successoral en cours.'),
  ('c1000000-0000-0000-0000-000000000004','morale',null,null,'SARL BâtiPlus','contact@batiplus.cm','+237 233 445 566','Zone industrielle Bonabéri','Douala',null,'RC/DLA/2015/B/1234','Société de BTP.'),
  ('c1000000-0000-0000-0000-000000000005','morale',null,null,'Établissements Foka & Fils','info@fokafils.cm','+237 233 112 233','Marché Mokolo','Yaoundé',null,'RC/YDE/2010/A/5678',null),
  ('c1000000-0000-0000-0000-000000000006','morale',null,null,'AgroCam SA','direction@agrocam.cm','+237 233 778 800','Avenue Kennedy','Yaoundé',null,'RC/YDE/2018/B/9012','Contentieux commercial OHADA.');

-- ---------------------------------------------------------------------
-- DOSSIERS (10 — types & statuts variés). Numéros explicites DOS-2026-00X
-- ---------------------------------------------------------------------
insert into dossiers (id, numero, titre, type_affaire, description_faits, pretentions, moyens, statut, tribunal, chambre, numero_role, client_id, avocat_responsable_id, date_ouverture, date_cloture_prev, montant_enjeu, notes_internes) values
  ('d1000000-0000-0000-0000-000000000001','DOS-2026-001','Mbarga c/ Société NOVA','civil','Litige relatif à un contrat de bail commercial non respecté.','Résiliation du bail et dommages-intérêts.','Inexécution contractuelle, article 1184 du Code civil.','en_cours','Tribunal de Première Instance de Yaoundé','Chambre civile','RG-2026-0142','c1000000-0000-0000-0000-000000000001','aaaaaaaa-0000-0000-0000-000000000001','2026-02-10','2026-09-30',12000000,'Audience de mise en état prévue.'),
  ('d1000000-0000-0000-0000-000000000002','DOS-2026-002','Ministère Public c/ Tchatchou','penal','Poursuite pour abus de confiance.','Relaxe de la cliente.','Absence d''élément intentionnel.','en_cours','Tribunal de Grande Instance du Wouri','Chambre correctionnelle','RP-2026-0531','c1000000-0000-0000-0000-000000000002','aaaaaaaa-0000-0000-0000-000000000002','2026-03-05','2026-08-15',null,'Dossier sensible — médiatisé.'),
  ('d1000000-0000-0000-0000-000000000003','DOS-2026-003','AgroCam SA c/ Distrib Plus','commercial','Recouvrement de créances commerciales impayées.','Paiement de la créance + intérêts.','Acte uniforme OHADA sur le recouvrement.','ouvert','Tribunal de Commerce de Yaoundé','—','RC-2026-0098','c1000000-0000-0000-0000-000000000006','aaaaaaaa-0000-0000-0000-000000000001','2026-04-12','2026-12-31',45000000,'Procédure d''injonction de payer OHADA.'),
  ('d1000000-0000-0000-0000-000000000004','DOS-2026-004','SARL BâtiPlus — Conflit social','social','Licenciement contesté de plusieurs employés.','Réintégration ou indemnités.','Code du travail camerounais.','en_cours','Tribunal de Première Instance de Douala','Chambre sociale','RS-2026-0211','c1000000-0000-0000-0000-000000000004','aaaaaaaa-0000-0000-0000-000000000003','2026-01-20','2026-07-20',8500000,null),
  ('d1000000-0000-0000-0000-000000000005','DOS-2026-005','Ndiaye — Succession','civil','Partage successoral conflictuel entre héritiers.','Liquidation et partage de la succession.','Droit des successions.','suspendu','Tribunal de Première Instance de Yaoundé','Chambre civile','RG-2026-0301','c1000000-0000-0000-0000-000000000003','aaaaaaaa-0000-0000-0000-000000000002','2026-02-28','2026-11-30',30000000,'En attente d''expertise immobilière.'),
  ('d1000000-0000-0000-0000-000000000006','DOS-2026-006','Établissements Foka — Redressement','ohada','Procédure collective d''apurement du passif.','Plan de redressement.','Acte uniforme OHADA — procédures collectives.','ouvert','Tribunal de Commerce de Yaoundé','—','RC-2026-0150','c1000000-0000-0000-0000-000000000005','aaaaaaaa-0000-0000-0000-000000000001','2026-05-02','2027-05-02',60000000,null),
  ('d1000000-0000-0000-0000-000000000007','DOS-2026-007','Mbarga — Permis de construire','administratif','Recours contre un refus de permis de construire.','Annulation de la décision.','Excès de pouvoir.','en_cours','Tribunal Administratif du Centre','—','TA-2026-0044','c1000000-0000-0000-0000-000000000001','aaaaaaaa-0000-0000-0000-000000000002','2026-03-18','2026-10-18',null,null),
  ('d1000000-0000-0000-0000-000000000008','DOS-2026-008','AgroCam — Contrat de distribution','commercial','Rupture abusive d''un contrat de distribution exclusive.','Dommages-intérêts.','Responsabilité contractuelle.','cloture','Tribunal de Commerce de Yaoundé','—','RC-2025-0890','c1000000-0000-0000-0000-000000000006','aaaaaaaa-0000-0000-0000-000000000003','2025-09-10','2026-03-10',15000000,'Affaire gagnée — client satisfait.'),
  ('d1000000-0000-0000-0000-000000000009','DOS-2026-009','Tchatchou — Divorce','civil','Procédure de divorce pour faute.','Prononcé du divorce + garde des enfants.','Code civil — divorce.','en_cours','Tribunal de Première Instance de Douala','Chambre civile','RG-2026-0410','c1000000-0000-0000-0000-000000000002','aaaaaaaa-0000-0000-0000-000000000002','2026-04-25','2026-12-25',null,'Médiation familiale tentée.'),
  ('d1000000-0000-0000-0000-000000000010','DOS-2026-010','SARL BâtiPlus c/ Fournisseur','commercial','Malfaçons sur livraison de matériaux.','Remboursement et indemnisation.','Garantie des vices cachés.','archive','Tribunal de Commerce de Douala','—','RC-2025-0455','c1000000-0000-0000-0000-000000000004','aaaaaaaa-0000-0000-0000-000000000001','2025-06-01','2025-12-01',5000000,'Dossier archivé après transaction.');

-- ÉQUIPE par dossier
insert into dossier_equipe (dossier_id, profile_id, role_dans_dossier) values
  ('d1000000-0000-0000-0000-000000000001','aaaaaaaa-0000-0000-0000-000000000001','Responsable'),
  ('d1000000-0000-0000-0000-000000000001','aaaaaaaa-0000-0000-0000-000000000003','Collaborateur'),
  ('d1000000-0000-0000-0000-000000000002','aaaaaaaa-0000-0000-0000-000000000002','Responsable'),
  ('d1000000-0000-0000-0000-000000000003','aaaaaaaa-0000-0000-0000-000000000001','Responsable'),
  ('d1000000-0000-0000-0000-000000000003','aaaaaaaa-0000-0000-0000-000000000002','Associée'),
  ('d1000000-0000-0000-0000-000000000004','aaaaaaaa-0000-0000-0000-000000000003','Responsable'),
  ('d1000000-0000-0000-0000-000000000006','aaaaaaaa-0000-0000-0000-000000000001','Responsable'),
  ('d1000000-0000-0000-0000-000000000009','aaaaaaaa-0000-0000-0000-000000000002','Responsable');

-- PARTIES
insert into parties (dossier_id, nom, type, avocat_adverse, contact) values
  ('d1000000-0000-0000-0000-000000000001','Jean-Pierre Mbarga','demandeur',null,'+237 699 001 122'),
  ('d1000000-0000-0000-0000-000000000001','Société NOVA SARL','defendeur','Me Bilo''o','contact@nova.cm'),
  ('d1000000-0000-0000-0000-000000000002','Ministère Public','demandeur',null,null),
  ('d1000000-0000-0000-0000-000000000002','Solange Tchatchou','defendeur',null,'+237 677 334 455'),
  ('d1000000-0000-0000-0000-000000000003','AgroCam SA','demandeur',null,'direction@agrocam.cm'),
  ('d1000000-0000-0000-0000-000000000003','Distrib Plus SARL','defendeur','Me Awono',null),
  ('d1000000-0000-0000-0000-000000000004','Collectif des employés','demandeur',null,null),
  ('d1000000-0000-0000-0000-000000000004','SARL BâtiPlus','defendeur',null,'contact@batiplus.cm'),
  ('d1000000-0000-0000-0000-000000000005','Amadou Ndiaye','demandeur',null,'+237 690 778 899'),
  ('d1000000-0000-0000-0000-000000000005','Cohéritiers Ndiaye','defendeur','Me Kamga',null),
  ('d1000000-0000-0000-0000-000000000009','Solange Tchatchou','demandeur',null,null),
  ('d1000000-0000-0000-0000-000000000009','M. Tchatchou','defendeur','Me Ndongo',null);

-- ACTES DE PROCÉDURE
insert into actes_procedure (dossier_id, type_acte, description, date_acte, auteur_id) values
  ('d1000000-0000-0000-0000-000000000001','Assignation','Assignation en résiliation de bail délivrée.','2026-02-12','aaaaaaaa-0000-0000-0000-000000000001'),
  ('d1000000-0000-0000-0000-000000000001','Conclusions','Conclusions en demande déposées.','2026-04-03','aaaaaaaa-0000-0000-0000-000000000003'),
  ('d1000000-0000-0000-0000-000000000002','Constitution','Constitution d''avocat pour la défense.','2026-03-06','aaaaaaaa-0000-0000-0000-000000000002'),
  ('d1000000-0000-0000-0000-000000000003','Requête','Requête en injonction de payer (OHADA).','2026-04-15','aaaaaaaa-0000-0000-0000-000000000001'),
  ('d1000000-0000-0000-0000-000000000004','Saisine','Saisine du tribunal social.','2026-01-22','aaaaaaaa-0000-0000-0000-000000000003'),
  ('d1000000-0000-0000-0000-000000000008','Jugement','Jugement favorable rendu.','2026-03-05','aaaaaaaa-0000-0000-0000-000000000003');

-- ---------------------------------------------------------------------
-- STAGIAIRES (3) + maître de stage
-- ---------------------------------------------------------------------
insert into stagiaires (id, nom, prenom, email, telephone, universite, annee_etude, date_debut, date_fin, maitre_stage_id, objectifs_stage, notes_evaluation, note_globale, actif) values
  ('51000000-0000-0000-0000-000000000001','Ekani','Marie','marie.ekani@univ-yde2.cm','+237 698 111 222','Université de Yaoundé II','Master 2','2026-03-01','2026-08-31','aaaaaaaa-0000-0000-0000-000000000001','Maîtriser la rédaction d''actes et la procédure OHADA.','[{"date":"2026-04-30","note":4,"commentaire":"Très bonne rigueur rédactionnelle."}]'::jsonb,4.0,true),
  ('51000000-0000-0000-0000-000000000002','Owona','Paul','paul.owona@univ-douala.cm','+237 677 222 333','Université de Douala','Licence 3','2026-04-01','2026-09-30','aaaaaaaa-0000-0000-0000-000000000002','Découvrir le contentieux pénal et l''assistance aux audiences.','[{"date":"2026-05-15","note":3,"commentaire":"Progresse bien, à l''aise à l''oral."}]'::jsonb,3.0,true),
  ('51000000-0000-0000-0000-000000000003','Bayemi','Christelle','christelle.bayemi@ucac.cm','+237 690 333 444','Université Catholique d''Afrique Centrale','Master 1','2026-02-15','2026-07-15','aaaaaaaa-0000-0000-0000-000000000001','Recherche juridique et veille jurisprudentielle.','[{"date":"2026-04-10","note":5,"commentaire":"Excellente autonomie."},{"date":"2026-05-20","note":5,"commentaire":"Travail de qualité constante."}]'::jsonb,5.0,true);

-- Stagiaires affectés à des dossiers (supervision)
insert into dossier_stagiaires (dossier_id, stagiaire_id, date_affectation) values
  ('d1000000-0000-0000-0000-000000000001','51000000-0000-0000-0000-000000000001','2026-03-05'),
  ('d1000000-0000-0000-0000-000000000003','51000000-0000-0000-0000-000000000003','2026-04-15'),
  ('d1000000-0000-0000-0000-000000000002','51000000-0000-0000-0000-000000000002','2026-04-05');

-- Présences stagiaires (quelques jours autour de juin 2026, dont aujourd'hui)
insert into presences_stagiaires (stagiaire_id, date, heure_arrivee, heure_depart, present, valide_par) values
  ('51000000-0000-0000-0000-000000000001', current_date, '08:00', null, true, 'aaaaaaaa-0000-0000-0000-000000000001'),
  ('51000000-0000-0000-0000-000000000002', current_date, '08:30', null, true, 'aaaaaaaa-0000-0000-0000-000000000002'),
  ('51000000-0000-0000-0000-000000000003', current_date, '07:45', null, true, 'aaaaaaaa-0000-0000-0000-000000000001'),
  ('51000000-0000-0000-0000-000000000001', current_date - 1, '08:05', '17:00', true, 'aaaaaaaa-0000-0000-0000-000000000001'),
  ('51000000-0000-0000-0000-000000000002', current_date - 1, null, null, false, 'aaaaaaaa-0000-0000-0000-000000000002'),
  ('51000000-0000-0000-0000-000000000003', current_date - 1, '08:00', '16:30', true, 'aaaaaaaa-0000-0000-0000-000000000001'),
  ('51000000-0000-0000-0000-000000000001', current_date - 2, '08:00', '17:15', true, 'aaaaaaaa-0000-0000-0000-000000000001');
update presences_stagiaires set motif_absence = 'Examen universitaire'
  where stagiaire_id = '51000000-0000-0000-0000-000000000002' and date = current_date - 1;

-- ---------------------------------------------------------------------
-- ÉVÉNEMENTS AGENDA (15 : RDV, audiences, réunions, deadlines, déplacements)
-- Centrés autour d'aujourd'hui (juin 2026)
-- ---------------------------------------------------------------------
insert into evenements (titre, type, description, dossier_id, profile_id, lieu, date_debut, date_fin, created_by) values
  ('RDV client Mbarga','rdv','Point sur l''avancement du dossier de bail.','d1000000-0000-0000-0000-000000000001','aaaaaaaa-0000-0000-0000-000000000001','Cabinet — Mvogbi', current_date + time '09:00', current_date + time '10:00','aaaaaaaa-0000-0000-0000-000000000001'),
  ('Audience TPI Yaoundé','audience','Mise en état — affaire Mbarga c/ NOVA.','d1000000-0000-0000-0000-000000000001','aaaaaaaa-0000-0000-0000-000000000001','TPI Yaoundé', current_date + time '11:30', current_date + time '12:30','aaaaaaaa-0000-0000-0000-000000000001'),
  ('Réunion équipe','reunion','Revue hebdomadaire des dossiers.',null,'aaaaaaaa-0000-0000-0000-000000000001','Salle de réunion', current_date + time '15:00', current_date + time '16:00','aaaaaaaa-0000-0000-0000-000000000001'),
  ('RDV AgroCam','rdv','Préparation de l''injonction de payer.','d1000000-0000-0000-0000-000000000003','aaaaaaaa-0000-0000-0000-000000000001','Cabinet — Mvogbi', current_date + interval '1 day' + time '10:00', current_date + interval '1 day' + time '11:00','aaaaaaaa-0000-0000-0000-000000000001'),
  ('Audience correctionnelle','audience','Affaire MP c/ Tchatchou.','d1000000-0000-0000-0000-000000000002','aaaaaaaa-0000-0000-0000-000000000002','TGI Wouri, Douala', current_date + interval '2 days' + time '08:30', current_date + interval '2 days' + time '12:00','aaaaaaaa-0000-0000-0000-000000000002'),
  ('Déplacement Douala','deplacement','Audience sociale BâtiPlus.','d1000000-0000-0000-0000-000000000004','aaaaaaaa-0000-0000-0000-000000000003','Douala', current_date + interval '3 days' + time '06:00', current_date + interval '3 days' + time '20:00','aaaaaaaa-0000-0000-0000-000000000003'),
  ('Échéance conclusions','deadline','Dépôt des conclusions — succession Ndiaye.','d1000000-0000-0000-0000-000000000005','aaaaaaaa-0000-0000-0000-000000000002',null, current_date + interval '5 days' + time '17:00', null,'aaaaaaaa-0000-0000-0000-000000000002'),
  ('Échéance recours','deadline','Délai de recours administratif — permis de construire.','d1000000-0000-0000-0000-000000000007','aaaaaaaa-0000-0000-0000-000000000002',null, current_date + interval '7 days' + time '17:00', null,'aaaaaaaa-0000-0000-0000-000000000002'),
  ('RDV Foka & Fils','rdv','Procédure de redressement OHADA.','d1000000-0000-0000-0000-000000000006','aaaaaaaa-0000-0000-0000-000000000001','Cabinet — Mvogbi', current_date + interval '4 days' + time '14:00', current_date + interval '4 days' + time '15:30','aaaaaaaa-0000-0000-0000-000000000001'),
  ('Audience commerciale','audience','Recouvrement AgroCam c/ Distrib Plus.','d1000000-0000-0000-0000-000000000003','aaaaaaaa-0000-0000-0000-000000000001','Tribunal de Commerce Yaoundé', current_date + interval '8 days' + time '09:00', current_date + interval '8 days' + time '11:00','aaaaaaaa-0000-0000-0000-000000000001'),
  ('RDV divorce Tchatchou','rdv','Médiation familiale.','d1000000-0000-0000-0000-000000000009','aaaaaaaa-0000-0000-0000-000000000002','Cabinet — Mvogbi', current_date + interval '6 days' + time '11:00', current_date + interval '6 days' + time '12:00','aaaaaaaa-0000-0000-0000-000000000002'),
  ('Réunion stagiaires','reunion','Encadrement et évaluation des stagiaires.',null,'aaaaaaaa-0000-0000-0000-000000000001','Salle de réunion', current_date - interval '1 day' + time '16:00', current_date - interval '1 day' + time '17:00','aaaaaaaa-0000-0000-0000-000000000001'),
  ('Audience passée','audience','Plaidoirie — affaire archivée.','d1000000-0000-0000-0000-000000000008','aaaaaaaa-0000-0000-0000-000000000003','Tribunal de Commerce Yaoundé', current_date - interval '90 days' + time '09:00', current_date - interval '90 days' + time '11:00','aaaaaaaa-0000-0000-0000-000000000003'),
  ('Échéance facture','deadline','Relance facture impayée AgroCam.','d1000000-0000-0000-0000-000000000003','aaaaaaaa-0000-0000-0000-000000000001',null, current_date + interval '10 days' + time '12:00', null,'aaaaaaaa-0000-0000-0000-000000000001'),
  ('RDV nouveau prospect','rdv','Premier entretien — affaire foncière.',null,'aaaaaaaa-0000-0000-0000-000000000002','Cabinet — Mvogbi', current_date + interval '2 days' + time '16:00', current_date + interval '2 days' + time '17:00','aaaaaaaa-0000-0000-0000-000000000002');

-- ---------------------------------------------------------------------
-- FACTURES (8 — statuts variés) + numéros explicites
-- ---------------------------------------------------------------------
insert into factures (id, numero, client_id, dossier_id, date_emission, date_echeance, montant_ht, tva, montant_ttc, statut, notes, created_by) values
  ('f1000000-0000-0000-0000-000000000001','FACT-2026-001','c1000000-0000-0000-0000-000000000001','d1000000-0000-0000-0000-000000000001','2026-03-01','2026-03-31',1500000,0,1500000,'payee','Honoraires forfaitaires phase 1.','aaaaaaaa-0000-0000-0000-000000000001'),
  ('f1000000-0000-0000-0000-000000000002','FACT-2026-002','c1000000-0000-0000-0000-000000000006','d1000000-0000-0000-0000-000000000003','2026-04-20','2026-05-20',3000000,0,3000000,'partielle','Provision sur honoraires OHADA.','aaaaaaaa-0000-0000-0000-000000000001'),
  ('f1000000-0000-0000-0000-000000000003','FACT-2026-003','c1000000-0000-0000-0000-000000000004','d1000000-0000-0000-0000-000000000004','2026-02-15','2026-03-17',2000000,0,2000000,'payee','Honoraires contentieux social.','aaaaaaaa-0000-0000-0000-000000000003'),
  ('f1000000-0000-0000-0000-000000000004','FACT-2026-004','c1000000-0000-0000-0000-000000000002','d1000000-0000-0000-0000-000000000002','2026-04-01','2026-05-01',1200000,0,1200000,'envoyee','Honoraires défense pénale.','aaaaaaaa-0000-0000-0000-000000000002'),
  ('f1000000-0000-0000-0000-000000000005','FACT-2026-005','c1000000-0000-0000-0000-000000000006','d1000000-0000-0000-0000-000000000003','2026-05-10','2026-06-09',2500000,0,2500000,'impayee','Solde honoraires.','aaaaaaaa-0000-0000-0000-000000000001'),
  ('f1000000-0000-0000-0000-000000000006','FACT-2026-006','c1000000-0000-0000-0000-000000000005','d1000000-0000-0000-0000-000000000006','2026-05-05','2026-06-04',4000000,0,4000000,'contentieux','Honoraires procédure collective — relances sans réponse.','aaaaaaaa-0000-0000-0000-000000000001'),
  ('f1000000-0000-0000-0000-000000000007','FACT-2026-007','c1000000-0000-0000-0000-000000000003','d1000000-0000-0000-0000-000000000005','2026-03-20','2026-04-19',1800000,0,1800000,'payee','Honoraires phase d''instruction.','aaaaaaaa-0000-0000-0000-000000000002'),
  ('f1000000-0000-0000-0000-000000000008','FACT-2026-008','c1000000-0000-0000-0000-000000000004','d1000000-0000-0000-0000-000000000010','2026-06-01','2026-07-01',900000,0,900000,'brouillon','Brouillon — à valider.','aaaaaaaa-0000-0000-0000-000000000001');

-- Facture DÉTAILLÉE (lignes libres) : frais d'ouverture + déplacement +
-- honoraires + débours refacturés (timbres, certifications…)
insert into factures (id, numero, client_id, dossier_id, date_emission, date_echeance, montant_ht, tva, montant_ttc, statut, notes, created_by) values
  ('f1000000-0000-0000-0000-000000000009','FACT-2026-009','c1000000-0000-0000-0000-000000000001','d1000000-0000-0000-0000-000000000007','2026-05-20','2026-06-19',340000,0,340000,'partielle','Facture détaillée — frais et honoraires.','aaaaaaaa-0000-0000-0000-000000000001');

insert into lignes_facture (facture_id, libelle, categorie, quantite, montant_unitaire, montant, ordre) values
  ('f1000000-0000-0000-0000-000000000009','Frais d''ouverture de dossier','ouverture',1,50000,50000,0),
  ('f1000000-0000-0000-0000-000000000009','Déplacement audience (Yaoundé–Mfou, aller-retour)','deplacement',2,25000,50000,1),
  ('f1000000-0000-0000-0000-000000000009','Honoraires recours administratif','honoraires',1,200000,200000,2),
  ('f1000000-0000-0000-0000-000000000009','Timbres fiscaux et certification de copies conformes','debours',1,40000,40000,3);

-- PAIEMENTS (sur factures payées / partielle), dont un paiement EN NATURE
insert into paiements (facture_id, date_paiement, montant, mode_paiement, reference, notes) values
  ('f1000000-0000-0000-0000-000000000001','2026-03-15',1500000,'virement','VIR-2026-0312',null),
  ('f1000000-0000-0000-0000-000000000003','2026-03-10',2000000,'cheque','CHQ-001245',null),
  ('f1000000-0000-0000-0000-000000000007','2026-04-05',1800000,'mobile_money','MOMO-778899',null),
  ('f1000000-0000-0000-0000-000000000002','2026-04-25',1500000,'virement','VIR-2026-0418',null),
  ('f1000000-0000-0000-0000-000000000009','2026-06-01',200000,'nature','Parcelle 200 m² à Mfou','Paiement en nature — valeur estimée du bien remis par le client.');

-- ---------------------------------------------------------------------
-- DEVIS (3 — statuts variés) + numéros explicites
-- ---------------------------------------------------------------------
insert into devis (id, numero, client_id, dossier_id, objet, date_emission, date_validite, montant_ht, tva, montant_ttc, statut, notes, facture_id, created_by) values
  ('e1000000-0000-0000-0000-000000000001','DEV-2026-001','c1000000-0000-0000-0000-000000000001','d1000000-0000-0000-0000-000000000001','Honoraires de représentation — litige bail commercial.','2026-05-01','2026-05-31',2000000,0,2000000,'envoye','Devis transmis au client pour validation.',null,'aaaaaaaa-0000-0000-0000-000000000001'),
  ('e1000000-0000-0000-0000-000000000002','DEV-2026-002','c1000000-0000-0000-0000-000000000006','d1000000-0000-0000-0000-000000000003','Provision sur procédure de recouvrement OHADA.','2026-04-15','2026-05-15',3500000,0,3500000,'accepte','Accepté par le client — facturation à venir.',null,'aaaaaaaa-0000-0000-0000-000000000001'),
  ('e1000000-0000-0000-0000-000000000003','DEV-2026-003','c1000000-0000-0000-0000-000000000004','d1000000-0000-0000-0000-000000000004','Honoraires conseil — conflit social.','2026-06-01','2026-07-01',1800000,0,1800000,'brouillon','Brouillon — à compléter.',null,'aaaaaaaa-0000-0000-0000-000000000001');

-- ---------------------------------------------------------------------
-- SAISIES DE TEMPS (20)
-- ---------------------------------------------------------------------
insert into saisies_temps (profile_id, dossier_id, date, type_tache, description, duree_heures, taux_horaire, facturable, facture_id) values
  ('aaaaaaaa-0000-0000-0000-000000000001','d1000000-0000-0000-0000-000000000001','2026-02-11','consultation','Consultation initiale client.',1.5,75000,true,'f1000000-0000-0000-0000-000000000001'),
  ('aaaaaaaa-0000-0000-0000-000000000001','d1000000-0000-0000-0000-000000000001','2026-02-12','redaction','Rédaction de l''assignation.',3.0,75000,true,'f1000000-0000-0000-0000-000000000001'),
  ('aaaaaaaa-0000-0000-0000-000000000003','d1000000-0000-0000-0000-000000000001','2026-04-03','redaction','Conclusions en demande.',4.5,35000,true,null),
  ('aaaaaaaa-0000-0000-0000-000000000002','d1000000-0000-0000-0000-000000000002','2026-03-06','consultation','Entretien de défense.',2.0,50000,true,'f1000000-0000-0000-0000-000000000004'),
  ('aaaaaaaa-0000-0000-0000-000000000002','d1000000-0000-0000-0000-000000000002','2026-03-20','recherche','Recherche jurisprudentielle.',3.0,50000,true,'f1000000-0000-0000-0000-000000000004'),
  ('aaaaaaaa-0000-0000-0000-000000000001','d1000000-0000-0000-0000-000000000003','2026-04-13','redaction','Requête injonction de payer.',2.5,75000,true,'f1000000-0000-0000-0000-000000000002'),
  ('aaaaaaaa-0000-0000-0000-000000000001','d1000000-0000-0000-0000-000000000003','2026-04-18','consultation','Point client AgroCam.',1.0,75000,true,'f1000000-0000-0000-0000-000000000002'),
  ('aaaaaaaa-0000-0000-0000-000000000003','d1000000-0000-0000-0000-000000000004','2026-01-22','redaction','Saisine tribunal social.',3.5,35000,true,'f1000000-0000-0000-0000-000000000003'),
  ('aaaaaaaa-0000-0000-0000-000000000003','d1000000-0000-0000-0000-000000000004','2026-02-05','audience','Audience sociale.',4.0,35000,true,'f1000000-0000-0000-0000-000000000003'),
  ('aaaaaaaa-0000-0000-0000-000000000002','d1000000-0000-0000-0000-000000000005','2026-03-01','consultation','Analyse du dossier successoral.',2.0,50000,true,'f1000000-0000-0000-0000-000000000007'),
  ('aaaaaaaa-0000-0000-0000-000000000002','d1000000-0000-0000-0000-000000000005','2026-03-15','recherche','Recherche sur le partage.',3.0,50000,true,'f1000000-0000-0000-0000-000000000007'),
  ('aaaaaaaa-0000-0000-0000-000000000001','d1000000-0000-0000-0000-000000000006','2026-05-02','consultation','Diagnostic procédure collective.',2.5,75000,true,'f1000000-0000-0000-0000-000000000006'),
  ('aaaaaaaa-0000-0000-0000-000000000001','d1000000-0000-0000-0000-000000000006','2026-05-04','redaction','Préparation du plan de redressement.',5.0,75000,true,'f1000000-0000-0000-0000-000000000006'),
  ('aaaaaaaa-0000-0000-0000-000000000002','d1000000-0000-0000-0000-000000000007','2026-03-18','recherche','Étude de la décision attaquée.',2.0,50000,true,null),
  ('aaaaaaaa-0000-0000-0000-000000000002','d1000000-0000-0000-0000-000000000009','2026-04-25','consultation','Entretien divorce.',1.5,50000,true,null),
  ('aaaaaaaa-0000-0000-0000-000000000001','d1000000-0000-0000-0000-000000000003', current_date - 2,'redaction','Préparation de l''audience.',3.0,75000,true,null),
  ('aaaaaaaa-0000-0000-0000-000000000003','d1000000-0000-0000-0000-000000000001', current_date - 1,'recherche','Veille jurisprudentielle bail commercial.',2.0,35000,true,null),
  ('aaaaaaaa-0000-0000-0000-000000000002','d1000000-0000-0000-0000-000000000002', current_date,'consultation','Préparation audience pénale.',2.5,50000,true,null),
  ('aaaaaaaa-0000-0000-0000-000000000001','d1000000-0000-0000-0000-000000000001', current_date,'audience','Audience de mise en état.',1.5,75000,true,null),
  ('aaaaaaaa-0000-0000-0000-000000000003','d1000000-0000-0000-0000-000000000004', current_date - 3,'deplacement','Déplacement Douala pour audience.',6.0,35000,false,null);

-- ---------------------------------------------------------------------
-- DÉPENSES
-- ---------------------------------------------------------------------
insert into depenses (categorie, description, montant, date_depense, created_by) values
  ('Frais de justice','Timbres et frais de greffe.',150000,'2026-02-12','aaaaaaaa-0000-0000-0000-000000000001'),
  ('Déplacement','Mission Douala — audience sociale.',85000,'2026-02-05','aaaaaaaa-0000-0000-0000-000000000003'),
  ('Fournitures','Papeterie et consommables bureau.',45000,'2026-03-01','aaaaaaaa-0000-0000-0000-000000000001'),
  ('Loyer','Loyer du cabinet — mai 2026.',400000,'2026-05-01','aaaaaaaa-0000-0000-0000-000000000001'),
  ('Documentation','Abonnement base juridique OHADA.',120000,'2026-04-10','aaaaaaaa-0000-0000-0000-000000000001'),
  ('Frais de justice','Expertise immobilière — succession.',300000,'2026-03-20','aaaaaaaa-0000-0000-0000-000000000002');

-- ---------------------------------------------------------------------
-- MODÈLES DE DOCUMENTS
-- ---------------------------------------------------------------------
insert into modeles_documents (nom, categorie, description, uploaded_by, actif) values
  ('Mise en demeure','Recouvrement','Lettre type de mise en demeure de payer.','aaaaaaaa-0000-0000-0000-000000000001',true),
  ('Conclusions civiles','Procédure','Trame de conclusions en matière civile.','aaaaaaaa-0000-0000-0000-000000000001',true),
  ('Contrat de bail commercial','Contrats','Modèle de bail commercial OHADA.','aaaaaaaa-0000-0000-0000-000000000002',true),
  ('Requête injonction de payer','OHADA','Modèle de requête (recouvrement OHADA).','aaaaaaaa-0000-0000-0000-000000000001',true),
  ('Attestation de stage','Ressources humaines','Modèle d''attestation de stage.','aaaaaaaa-0000-0000-0000-000000000001',true);

-- ---------------------------------------------------------------------
-- DOCUMENTS (liés à des dossiers)
-- ---------------------------------------------------------------------
insert into documents (nom, type, dossier_id, uploaded_by, fichier_url, taille_ko) values
  ('Assignation_Mbarga.pdf','application/pdf','d1000000-0000-0000-0000-000000000001','aaaaaaaa-0000-0000-0000-000000000001','demo/assignation_mbarga.pdf',240),
  ('Conclusions_demande.pdf','application/pdf','d1000000-0000-0000-0000-000000000001','aaaaaaaa-0000-0000-0000-000000000003','demo/conclusions_demande.pdf',180),
  ('Contrat_litigieux.pdf','application/pdf','d1000000-0000-0000-0000-000000000003','aaaaaaaa-0000-0000-0000-000000000001','demo/contrat_agrocam.pdf',320),
  ('Jugement_BatiPlus.pdf','application/pdf','d1000000-0000-0000-0000-000000000008','aaaaaaaa-0000-0000-0000-000000000003','demo/jugement_batiplus.pdf',210);

-- ---------------------------------------------------------------------
-- COURRIERS (correspondance)
-- ---------------------------------------------------------------------
insert into courriers (dossier_id, type, objet, expediteur, destinataire, date_courrier, created_by) values
  ('d1000000-0000-0000-0000-000000000001','sortant','Mise en demeure avant assignation','Cabinet Kengni','Société NOVA SARL','2026-02-08','aaaaaaaa-0000-0000-0000-000000000001'),
  ('d1000000-0000-0000-0000-000000000003','sortant','Sommation de payer','Cabinet Kengni','Distrib Plus SARL','2026-04-10','aaaaaaaa-0000-0000-0000-000000000001'),
  ('d1000000-0000-0000-0000-000000000002','entrant','Convocation à l''audience','TGI du Wouri','Cabinet Kengni','2026-03-25','aaaaaaaa-0000-0000-0000-000000000002'),
  ('d1000000-0000-0000-0000-000000000005','entrant','Rapport d''expertise','Expert immobilier','Cabinet Kengni','2026-04-02','aaaaaaaa-0000-0000-0000-000000000002');

-- ---------------------------------------------------------------------
-- NOTIFICATIONS (pour l'admin — user_id de auth.users)
-- ---------------------------------------------------------------------
insert into notifications (user_id, titre, message, type, lien, lu) values
  ('11111111-1111-1111-1111-111111111111','Audience à venir','Audience de mise en état pour le dossier DOS-2026-001 aujourd''hui.','agenda','/dossiers/d1000000-0000-0000-0000-000000000001',false),
  ('11111111-1111-1111-1111-111111111111','Facture impayée','La facture FACT-2026-005 est arrivée à échéance.','finance','/facturation/f1000000-0000-0000-0000-000000000005',false),
  ('11111111-1111-1111-1111-111111111111','Facture en contentieux','La facture FACT-2026-006 est passée en contentieux.','finance','/facturation/f1000000-0000-0000-0000-000000000006',false),
  ('11111111-1111-1111-1111-111111111111','Échéance proche','Dépôt des conclusions pour DOS-2026-005 dans 5 jours.','agenda','/dossiers/d1000000-0000-0000-0000-000000000005',true);

-- Synchronise les séquences au-delà des numéros insérés
select setval('seq_dossier_2026', 10, true);
select setval('seq_facture_2026', 8, true);

commit;
