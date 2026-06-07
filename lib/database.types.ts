export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  graphql_public: {
    Tables: {
      [_ in never]: never
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      graphql: {
        Args: {
          extensions?: Json
          operationName?: string
          query?: string
          variables?: Json
        }
        Returns: Json
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
  public: {
    Tables: {
      actes_procedure: {
        Row: {
          auteur_id: string | null
          created_at: string | null
          date_acte: string
          description: string | null
          dossier_id: string
          fichier_url: string | null
          id: string
          type_acte: string
        }
        Insert: {
          auteur_id?: string | null
          created_at?: string | null
          date_acte?: string
          description?: string | null
          dossier_id: string
          fichier_url?: string | null
          id?: string
          type_acte: string
        }
        Update: {
          auteur_id?: string | null
          created_at?: string | null
          date_acte?: string
          description?: string | null
          dossier_id?: string
          fichier_url?: string | null
          id?: string
          type_acte?: string
        }
        Relationships: [
          {
            foreignKeyName: "actes_procedure_auteur_id_fkey"
            columns: ["auteur_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "actes_procedure_dossier_id_fkey"
            columns: ["dossier_id"]
            isOneToOne: false
            referencedRelation: "dossiers"
            referencedColumns: ["id"]
          },
        ]
      }
      cabinet_config: {
        Row: {
          adresse: string | null
          barreau: string | null
          couleur_principale: string
          couleur_secondaire: string
          devise: string
          email: string | null
          format_date: string
          frais_ouverture_dossier: number
          id: string
          logo_url: string | null
          nom_avocat_principal: string | null
          nom_cabinet: string
          numero_barreau: string | null
          pays: string | null
          pied_de_page_facture: string | null
          site_web: string | null
          taux_tva: number
          telephone_1: string | null
          telephone_2: string | null
          tva_applicable: boolean
          updated_at: string | null
          updated_by: string | null
          ville: string | null
        }
        Insert: {
          adresse?: string | null
          barreau?: string | null
          couleur_principale?: string
          couleur_secondaire?: string
          devise?: string
          email?: string | null
          format_date?: string
          frais_ouverture_dossier?: number
          id?: string
          logo_url?: string | null
          nom_avocat_principal?: string | null
          nom_cabinet: string
          numero_barreau?: string | null
          pays?: string | null
          pied_de_page_facture?: string | null
          site_web?: string | null
          taux_tva?: number
          telephone_1?: string | null
          telephone_2?: string | null
          tva_applicable?: boolean
          updated_at?: string | null
          updated_by?: string | null
          ville?: string | null
        }
        Update: {
          adresse?: string | null
          barreau?: string | null
          couleur_principale?: string
          couleur_secondaire?: string
          devise?: string
          email?: string | null
          format_date?: string
          frais_ouverture_dossier?: number
          id?: string
          logo_url?: string | null
          nom_avocat_principal?: string | null
          nom_cabinet?: string
          numero_barreau?: string | null
          pays?: string | null
          pied_de_page_facture?: string | null
          site_web?: string | null
          taux_tva?: number
          telephone_1?: string | null
          telephone_2?: string | null
          tva_applicable?: boolean
          updated_at?: string | null
          updated_by?: string | null
          ville?: string | null
        }
        Relationships: []
      }
      clients: {
        Row: {
          adresse: string | null
          cni_numero: string | null
          created_at: string | null
          email: string | null
          id: string
          nom: string | null
          notes: string | null
          prenom: string | null
          raison_sociale: string | null
          rccm_numero: string | null
          telephone: string | null
          type: Database["public"]["Enums"]["type_client"]
          updated_at: string | null
          ville: string | null
        }
        Insert: {
          adresse?: string | null
          cni_numero?: string | null
          created_at?: string | null
          email?: string | null
          id?: string
          nom?: string | null
          notes?: string | null
          prenom?: string | null
          raison_sociale?: string | null
          rccm_numero?: string | null
          telephone?: string | null
          type?: Database["public"]["Enums"]["type_client"]
          updated_at?: string | null
          ville?: string | null
        }
        Update: {
          adresse?: string | null
          cni_numero?: string | null
          created_at?: string | null
          email?: string | null
          id?: string
          nom?: string | null
          notes?: string | null
          prenom?: string | null
          raison_sociale?: string | null
          rccm_numero?: string | null
          telephone?: string | null
          type?: Database["public"]["Enums"]["type_client"]
          updated_at?: string | null
          ville?: string | null
        }
        Relationships: []
      }
      courriers: {
        Row: {
          created_at: string | null
          created_by: string | null
          date_courrier: string
          destinataire: string | null
          dossier_id: string | null
          expediteur: string | null
          fichier_url: string | null
          id: string
          notes: string | null
          objet: string
          type: Database["public"]["Enums"]["type_courrier"]
        }
        Insert: {
          created_at?: string | null
          created_by?: string | null
          date_courrier?: string
          destinataire?: string | null
          dossier_id?: string | null
          expediteur?: string | null
          fichier_url?: string | null
          id?: string
          notes?: string | null
          objet: string
          type?: Database["public"]["Enums"]["type_courrier"]
        }
        Update: {
          created_at?: string | null
          created_by?: string | null
          date_courrier?: string
          destinataire?: string | null
          dossier_id?: string | null
          expediteur?: string | null
          fichier_url?: string | null
          id?: string
          notes?: string | null
          objet?: string
          type?: Database["public"]["Enums"]["type_courrier"]
        }
        Relationships: [
          {
            foreignKeyName: "courriers_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "courriers_dossier_id_fkey"
            columns: ["dossier_id"]
            isOneToOne: false
            referencedRelation: "dossiers"
            referencedColumns: ["id"]
          },
        ]
      }
      depenses: {
        Row: {
          categorie: string
          created_at: string | null
          created_by: string | null
          date_depense: string
          description: string | null
          id: string
          justificatif_url: string | null
          montant: number
        }
        Insert: {
          categorie: string
          created_at?: string | null
          created_by?: string | null
          date_depense?: string
          description?: string | null
          id?: string
          justificatif_url?: string | null
          montant: number
        }
        Update: {
          categorie?: string
          created_at?: string | null
          created_by?: string | null
          date_depense?: string
          description?: string | null
          id?: string
          justificatif_url?: string | null
          montant?: number
        }
        Relationships: [
          {
            foreignKeyName: "depenses_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      devis: {
        Row: {
          client_id: string | null
          created_at: string | null
          created_by: string | null
          date_emission: string
          date_validite: string | null
          devise: string
          dossier_id: string | null
          facture_id: string | null
          id: string
          montant_ht: number
          montant_ttc: number
          notes: string | null
          numero: string
          objet: string | null
          statut: Database["public"]["Enums"]["statut_devis"]
          tva: number
          updated_at: string | null
        }
        Insert: {
          client_id?: string | null
          created_at?: string | null
          created_by?: string | null
          date_emission?: string
          date_validite?: string | null
          devise?: string
          dossier_id?: string | null
          facture_id?: string | null
          id?: string
          montant_ht?: number
          montant_ttc?: number
          notes?: string | null
          numero: string
          objet?: string | null
          statut?: Database["public"]["Enums"]["statut_devis"]
          tva?: number
          updated_at?: string | null
        }
        Update: {
          client_id?: string | null
          created_at?: string | null
          created_by?: string | null
          date_emission?: string
          date_validite?: string | null
          devise?: string
          dossier_id?: string | null
          facture_id?: string | null
          id?: string
          montant_ht?: number
          montant_ttc?: number
          notes?: string | null
          numero?: string
          objet?: string | null
          statut?: Database["public"]["Enums"]["statut_devis"]
          tva?: number
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "devis_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "devis_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "devis_dossier_id_fkey"
            columns: ["dossier_id"]
            isOneToOne: false
            referencedRelation: "dossiers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "devis_facture_id_fkey"
            columns: ["facture_id"]
            isOneToOne: false
            referencedRelation: "factures"
            referencedColumns: ["id"]
          },
        ]
      }
      documents: {
        Row: {
          created_at: string | null
          dossier_id: string | null
          fichier_url: string
          id: string
          nom: string
          taille_ko: number | null
          type: string | null
          uploaded_by: string | null
        }
        Insert: {
          created_at?: string | null
          dossier_id?: string | null
          fichier_url: string
          id?: string
          nom: string
          taille_ko?: number | null
          type?: string | null
          uploaded_by?: string | null
        }
        Update: {
          created_at?: string | null
          dossier_id?: string | null
          fichier_url?: string
          id?: string
          nom?: string
          taille_ko?: number | null
          type?: string | null
          uploaded_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "documents_dossier_id_fkey"
            columns: ["dossier_id"]
            isOneToOne: false
            referencedRelation: "dossiers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "documents_uploaded_by_fkey"
            columns: ["uploaded_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      dossier_equipe: {
        Row: {
          created_at: string | null
          dossier_id: string
          id: string
          profile_id: string
          role_dans_dossier: string | null
        }
        Insert: {
          created_at?: string | null
          dossier_id: string
          id?: string
          profile_id: string
          role_dans_dossier?: string | null
        }
        Update: {
          created_at?: string | null
          dossier_id?: string
          id?: string
          profile_id?: string
          role_dans_dossier?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "dossier_equipe_dossier_id_fkey"
            columns: ["dossier_id"]
            isOneToOne: false
            referencedRelation: "dossiers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "dossier_equipe_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      dossier_stagiaires: {
        Row: {
          date_affectation: string | null
          dossier_id: string
          id: string
          stagiaire_id: string
        }
        Insert: {
          date_affectation?: string | null
          dossier_id: string
          id?: string
          stagiaire_id: string
        }
        Update: {
          date_affectation?: string | null
          dossier_id?: string
          id?: string
          stagiaire_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "dossier_stagiaires_dossier_id_fkey"
            columns: ["dossier_id"]
            isOneToOne: false
            referencedRelation: "dossiers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "dossier_stagiaires_stagiaire_id_fkey"
            columns: ["stagiaire_id"]
            isOneToOne: false
            referencedRelation: "stagiaires"
            referencedColumns: ["id"]
          },
        ]
      }
      dossiers: {
        Row: {
          avocat_responsable_id: string | null
          chambre: string | null
          client_id: string | null
          created_at: string | null
          date_cloture_prev: string | null
          date_cloture_reel: string | null
          date_ouverture: string
          description_faits: string | null
          id: string
          montant_enjeu: number | null
          moyens: string | null
          notes_internes: string | null
          numero: string
          numero_role: string | null
          pretentions: string | null
          statut: Database["public"]["Enums"]["statut_dossier"]
          titre: string
          tribunal: string | null
          type_affaire: Database["public"]["Enums"]["type_affaire"]
          updated_at: string | null
        }
        Insert: {
          avocat_responsable_id?: string | null
          chambre?: string | null
          client_id?: string | null
          created_at?: string | null
          date_cloture_prev?: string | null
          date_cloture_reel?: string | null
          date_ouverture?: string
          description_faits?: string | null
          id?: string
          montant_enjeu?: number | null
          moyens?: string | null
          notes_internes?: string | null
          numero: string
          numero_role?: string | null
          pretentions?: string | null
          statut?: Database["public"]["Enums"]["statut_dossier"]
          titre: string
          tribunal?: string | null
          type_affaire?: Database["public"]["Enums"]["type_affaire"]
          updated_at?: string | null
        }
        Update: {
          avocat_responsable_id?: string | null
          chambre?: string | null
          client_id?: string | null
          created_at?: string | null
          date_cloture_prev?: string | null
          date_cloture_reel?: string | null
          date_ouverture?: string
          description_faits?: string | null
          id?: string
          montant_enjeu?: number | null
          moyens?: string | null
          notes_internes?: string | null
          numero?: string
          numero_role?: string | null
          pretentions?: string | null
          statut?: Database["public"]["Enums"]["statut_dossier"]
          titre?: string
          tribunal?: string | null
          type_affaire?: Database["public"]["Enums"]["type_affaire"]
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "dossiers_avocat_responsable_id_fkey"
            columns: ["avocat_responsable_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "dossiers_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
        ]
      }
      evenements: {
        Row: {
          created_at: string | null
          created_by: string | null
          date_debut: string
          date_fin: string | null
          description: string | null
          dossier_id: string | null
          id: string
          lieu: string | null
          profile_id: string | null
          rappel_envoye: boolean | null
          rappel_j1: boolean | null
          rappel_j3: boolean | null
          rappel_j7: boolean | null
          stagiaire_id: string | null
          titre: string
          type: Database["public"]["Enums"]["type_evenement"]
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          created_by?: string | null
          date_debut: string
          date_fin?: string | null
          description?: string | null
          dossier_id?: string | null
          id?: string
          lieu?: string | null
          profile_id?: string | null
          rappel_envoye?: boolean | null
          rappel_j1?: boolean | null
          rappel_j3?: boolean | null
          rappel_j7?: boolean | null
          stagiaire_id?: string | null
          titre: string
          type?: Database["public"]["Enums"]["type_evenement"]
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          created_by?: string | null
          date_debut?: string
          date_fin?: string | null
          description?: string | null
          dossier_id?: string | null
          id?: string
          lieu?: string | null
          profile_id?: string | null
          rappel_envoye?: boolean | null
          rappel_j1?: boolean | null
          rappel_j3?: boolean | null
          rappel_j7?: boolean | null
          stagiaire_id?: string | null
          titre?: string
          type?: Database["public"]["Enums"]["type_evenement"]
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "evenements_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "evenements_dossier_id_fkey"
            columns: ["dossier_id"]
            isOneToOne: false
            referencedRelation: "dossiers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "evenements_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "evenements_stagiaire_id_fkey"
            columns: ["stagiaire_id"]
            isOneToOne: false
            referencedRelation: "stagiaires"
            referencedColumns: ["id"]
          },
        ]
      }
      factures: {
        Row: {
          client_id: string | null
          created_at: string | null
          created_by: string | null
          date_echeance: string | null
          date_emission: string
          devise: string
          dossier_id: string | null
          id: string
          montant_ht: number
          montant_ttc: number
          notes: string | null
          numero: string
          statut: Database["public"]["Enums"]["statut_facture"]
          tva: number
          updated_at: string | null
        }
        Insert: {
          client_id?: string | null
          created_at?: string | null
          created_by?: string | null
          date_echeance?: string | null
          date_emission?: string
          devise?: string
          dossier_id?: string | null
          id?: string
          montant_ht?: number
          montant_ttc?: number
          notes?: string | null
          numero: string
          statut?: Database["public"]["Enums"]["statut_facture"]
          tva?: number
          updated_at?: string | null
        }
        Update: {
          client_id?: string | null
          created_at?: string | null
          created_by?: string | null
          date_echeance?: string | null
          date_emission?: string
          devise?: string
          dossier_id?: string | null
          id?: string
          montant_ht?: number
          montant_ttc?: number
          notes?: string | null
          numero?: string
          statut?: Database["public"]["Enums"]["statut_facture"]
          tva?: number
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "factures_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "factures_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "factures_dossier_id_fkey"
            columns: ["dossier_id"]
            isOneToOne: false
            referencedRelation: "dossiers"
            referencedColumns: ["id"]
          },
        ]
      }
      lignes_facture: {
        Row: {
          categorie: string
          created_at: string | null
          facture_id: string
          id: string
          libelle: string
          montant: number
          montant_unitaire: number
          ordre: number
          quantite: number
        }
        Insert: {
          categorie?: string
          created_at?: string | null
          facture_id: string
          id?: string
          libelle: string
          montant?: number
          montant_unitaire?: number
          ordre?: number
          quantite?: number
        }
        Update: {
          categorie?: string
          created_at?: string | null
          facture_id?: string
          id?: string
          libelle?: string
          montant?: number
          montant_unitaire?: number
          ordre?: number
          quantite?: number
        }
        Relationships: [
          {
            foreignKeyName: "lignes_facture_facture_id_fkey"
            columns: ["facture_id"]
            isOneToOne: false
            referencedRelation: "factures"
            referencedColumns: ["id"]
          },
        ]
      }
      modeles_documents: {
        Row: {
          actif: boolean
          categorie: string | null
          created_at: string | null
          description: string | null
          fichier_url: string | null
          id: string
          nom: string
          uploaded_by: string | null
        }
        Insert: {
          actif?: boolean
          categorie?: string | null
          created_at?: string | null
          description?: string | null
          fichier_url?: string | null
          id?: string
          nom: string
          uploaded_by?: string | null
        }
        Update: {
          actif?: boolean
          categorie?: string | null
          created_at?: string | null
          description?: string | null
          fichier_url?: string | null
          id?: string
          nom?: string
          uploaded_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "modeles_documents_uploaded_by_fkey"
            columns: ["uploaded_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          created_at: string | null
          id: string
          lien: string | null
          lu: boolean
          message: string | null
          titre: string
          type: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          lien?: string | null
          lu?: boolean
          message?: string | null
          titre: string
          type?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          lien?: string | null
          lu?: boolean
          message?: string | null
          titre?: string
          type?: string | null
          user_id?: string
        }
        Relationships: []
      }
      paiements: {
        Row: {
          created_at: string | null
          date_paiement: string
          facture_id: string
          id: string
          mode_paiement: Database["public"]["Enums"]["mode_paiement"]
          montant: number
          notes: string | null
          reference: string | null
        }
        Insert: {
          created_at?: string | null
          date_paiement?: string
          facture_id: string
          id?: string
          mode_paiement?: Database["public"]["Enums"]["mode_paiement"]
          montant: number
          notes?: string | null
          reference?: string | null
        }
        Update: {
          created_at?: string | null
          date_paiement?: string
          facture_id?: string
          id?: string
          mode_paiement?: Database["public"]["Enums"]["mode_paiement"]
          montant?: number
          notes?: string | null
          reference?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "paiements_facture_id_fkey"
            columns: ["facture_id"]
            isOneToOne: false
            referencedRelation: "factures"
            referencedColumns: ["id"]
          },
        ]
      }
      parties: {
        Row: {
          avocat_adverse: string | null
          contact: string | null
          created_at: string | null
          dossier_id: string
          id: string
          nom: string
          type: Database["public"]["Enums"]["type_partie"]
        }
        Insert: {
          avocat_adverse?: string | null
          contact?: string | null
          created_at?: string | null
          dossier_id: string
          id?: string
          nom: string
          type: Database["public"]["Enums"]["type_partie"]
        }
        Update: {
          avocat_adverse?: string | null
          contact?: string | null
          created_at?: string | null
          dossier_id?: string
          id?: string
          nom?: string
          type?: Database["public"]["Enums"]["type_partie"]
        }
        Relationships: [
          {
            foreignKeyName: "parties_dossier_id_fkey"
            columns: ["dossier_id"]
            isOneToOne: false
            referencedRelation: "dossiers"
            referencedColumns: ["id"]
          },
        ]
      }
      presences_stagiaires: {
        Row: {
          created_at: string | null
          date: string
          heure_arrivee: string | null
          heure_depart: string | null
          id: string
          motif_absence: string | null
          present: boolean
          stagiaire_id: string
          valide_par: string | null
        }
        Insert: {
          created_at?: string | null
          date: string
          heure_arrivee?: string | null
          heure_depart?: string | null
          id?: string
          motif_absence?: string | null
          present?: boolean
          stagiaire_id: string
          valide_par?: string | null
        }
        Update: {
          created_at?: string | null
          date?: string
          heure_arrivee?: string | null
          heure_depart?: string | null
          id?: string
          motif_absence?: string | null
          present?: boolean
          stagiaire_id?: string
          valide_par?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "presences_stagiaires_stagiaire_id_fkey"
            columns: ["stagiaire_id"]
            isOneToOne: false
            referencedRelation: "stagiaires"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "presences_stagiaires_valide_par_fkey"
            columns: ["valide_par"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          actif: boolean
          barreau_numero: string | null
          created_at: string | null
          date_entree: string | null
          email: string
          id: string
          nom: string
          photo_url: string | null
          prenom: string
          role: Database["public"]["Enums"]["role_utilisateur"]
          specialites: string[] | null
          taux_horaire: number | null
          telephone: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          actif?: boolean
          barreau_numero?: string | null
          created_at?: string | null
          date_entree?: string | null
          email: string
          id?: string
          nom: string
          photo_url?: string | null
          prenom: string
          role?: Database["public"]["Enums"]["role_utilisateur"]
          specialites?: string[] | null
          taux_horaire?: number | null
          telephone?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          actif?: boolean
          barreau_numero?: string | null
          created_at?: string | null
          date_entree?: string | null
          email?: string
          id?: string
          nom?: string
          photo_url?: string | null
          prenom?: string
          role?: Database["public"]["Enums"]["role_utilisateur"]
          specialites?: string[] | null
          taux_horaire?: number | null
          telephone?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      saisies_temps: {
        Row: {
          created_at: string | null
          date: string
          description: string | null
          dossier_id: string | null
          duree_heures: number
          facturable: boolean
          facture_id: string | null
          id: string
          profile_id: string
          taux_horaire: number | null
          type_tache: Database["public"]["Enums"]["type_tache_temps"]
        }
        Insert: {
          created_at?: string | null
          date?: string
          description?: string | null
          dossier_id?: string | null
          duree_heures?: number
          facturable?: boolean
          facture_id?: string | null
          id?: string
          profile_id: string
          taux_horaire?: number | null
          type_tache?: Database["public"]["Enums"]["type_tache_temps"]
        }
        Update: {
          created_at?: string | null
          date?: string
          description?: string | null
          dossier_id?: string | null
          duree_heures?: number
          facturable?: boolean
          facture_id?: string | null
          id?: string
          profile_id?: string
          taux_horaire?: number | null
          type_tache?: Database["public"]["Enums"]["type_tache_temps"]
        }
        Relationships: [
          {
            foreignKeyName: "saisies_temps_dossier_id_fkey"
            columns: ["dossier_id"]
            isOneToOne: false
            referencedRelation: "dossiers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "saisies_temps_facture_id_fkey"
            columns: ["facture_id"]
            isOneToOne: false
            referencedRelation: "factures"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "saisies_temps_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      stagiaires: {
        Row: {
          actif: boolean
          annee_etude: string | null
          created_at: string | null
          date_debut: string | null
          date_fin: string | null
          email: string | null
          id: string
          maitre_stage_id: string | null
          nom: string
          note_globale: number | null
          notes_evaluation: Json | null
          objectifs_stage: string | null
          prenom: string
          telephone: string | null
          universite: string | null
          updated_at: string | null
        }
        Insert: {
          actif?: boolean
          annee_etude?: string | null
          created_at?: string | null
          date_debut?: string | null
          date_fin?: string | null
          email?: string | null
          id?: string
          maitre_stage_id?: string | null
          nom: string
          note_globale?: number | null
          notes_evaluation?: Json | null
          objectifs_stage?: string | null
          prenom: string
          telephone?: string | null
          universite?: string | null
          updated_at?: string | null
        }
        Update: {
          actif?: boolean
          annee_etude?: string | null
          created_at?: string | null
          date_debut?: string | null
          date_fin?: string | null
          email?: string | null
          id?: string
          maitre_stage_id?: string | null
          nom?: string
          note_globale?: number | null
          notes_evaluation?: Json | null
          objectifs_stage?: string | null
          prenom?: string
          telephone?: string | null
          universite?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "stagiaires_maitre_stage_id_fkey"
            columns: ["maitre_stage_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      a_acces_agenda: { Args: never; Returns: boolean }
      a_acces_dossiers: { Args: never; Returns: boolean }
      a_acces_finance: { Args: never; Returns: boolean }
      a_acces_total: { Args: never; Returns: boolean }
      peut_voir_dossier: { Args: { d_id: string }; Returns: boolean }
      peut_voir_finance: { Args: never; Returns: boolean }
      prochain_numero: {
        Args: { annee: number; prefixe: string }
        Returns: string
      }
      profile_id_courant: { Args: never; Returns: string }
      role_courant: {
        Args: never
        Returns: Database["public"]["Enums"]["role_utilisateur"]
      }
      stagiaire_voit_dossier: { Args: { d_id: string }; Returns: boolean }
    }
    Enums: {
      mode_paiement:
        | "especes"
        | "virement"
        | "mobile_money"
        | "cheque"
        | "nature"
      role_utilisateur:
        | "admin_systeme"
        | "associe_principal"
        | "associe"
        | "collaborateur"
        | "stagiaire"
        | "secretaire"
        | "comptable"
      statut_devis: "brouillon" | "envoye" | "accepte" | "refuse" | "expire"
      statut_dossier: "ouvert" | "en_cours" | "suspendu" | "cloture" | "archive"
      statut_facture:
        | "brouillon"
        | "envoyee"
        | "payee"
        | "partielle"
        | "impayee"
        | "contentieux"
      type_affaire:
        | "civil"
        | "penal"
        | "commercial"
        | "social"
        | "administratif"
        | "ohada"
      type_client: "physique" | "morale"
      type_courrier: "entrant" | "sortant"
      type_evenement:
        | "rdv"
        | "audience"
        | "reunion"
        | "deadline"
        | "deplacement"
      type_partie: "demandeur" | "defendeur" | "tiers"
      type_tache_temps:
        | "consultation"
        | "redaction"
        | "audience"
        | "recherche"
        | "deplacement"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  graphql_public: {
    Enums: {},
  },
  public: {
    Enums: {
      mode_paiement: [
        "especes",
        "virement",
        "mobile_money",
        "cheque",
        "nature",
      ],
      role_utilisateur: [
        "admin_systeme",
        "associe_principal",
        "associe",
        "collaborateur",
        "stagiaire",
        "secretaire",
        "comptable",
      ],
      statut_devis: ["brouillon", "envoye", "accepte", "refuse", "expire"],
      statut_dossier: ["ouvert", "en_cours", "suspendu", "cloture", "archive"],
      statut_facture: [
        "brouillon",
        "envoyee",
        "payee",
        "partielle",
        "impayee",
        "contentieux",
      ],
      type_affaire: [
        "civil",
        "penal",
        "commercial",
        "social",
        "administratif",
        "ohada",
      ],
      type_client: ["physique", "morale"],
      type_courrier: ["entrant", "sortant"],
      type_evenement: ["rdv", "audience", "reunion", "deadline", "deplacement"],
      type_partie: ["demandeur", "defendeur", "tiers"],
      type_tache_temps: [
        "consultation",
        "redaction",
        "audience",
        "recherche",
        "deplacement",
      ],
    },
  },
} as const

