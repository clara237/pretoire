import type { LucideIcon } from "lucide-react";
import {
  LayoutDashboard,
  Briefcase,
  Users,
  Calendar,
  UsersRound,
  GraduationCap,
  Clock,
  Receipt,
  TrendingUp,
  FileText,
  FileSpreadsheet,
  Files,
  Mail,
  Bell,
  Settings,
  Building2,
  UserCog,
  BadgeDollarSign,
} from "lucide-react";
import type { Section } from "@/lib/roles";

export interface NavItem {
  href: string;
  label: string;
  icone: LucideIcon;
  section: Section;
}

export interface NavGroupe {
  titre: string;
  items: NavItem[];
}

/** Navigation COMPLÈTE de l'app, regroupée. Filtrée par rôle dans la Sidebar. */
export const NAVIGATION: NavGroupe[] = [
  {
    titre: "Principal",
    items: [
      { href: "/dashboard", label: "Tableau de bord", icone: LayoutDashboard, section: "dashboard" },
      { href: "/dossiers", label: "Dossiers", icone: Briefcase, section: "dossiers" },
      { href: "/clients", label: "Clients", icone: Users, section: "clients" },
      { href: "/agenda", label: "Agenda", icone: Calendar, section: "agenda" },
    ],
  },
  {
    titre: "Équipe",
    items: [
      { href: "/equipe", label: "Avocats", icone: UsersRound, section: "equipe" },
      { href: "/stagiaires", label: "Stagiaires", icone: GraduationCap, section: "stagiaires" },
      { href: "/courriers", label: "Correspondance", icone: Mail, section: "courriers" },
    ],
  },
  {
    titre: "Finance",
    items: [
      { href: "/time-tracking", label: "Temps", icone: Clock, section: "time_tracking" },
      { href: "/devis", label: "Devis", icone: FileSpreadsheet, section: "facturation" },
      { href: "/facturation", label: "Facturation", icone: Receipt, section: "facturation" },
      { href: "/finance", label: "Finances", icone: TrendingUp, section: "finance" },
    ],
  },
  {
    titre: "Documents",
    items: [
      { href: "/documents", label: "Documents", icone: FileText, section: "documents" },
      { href: "/modeles", label: "Modèles", icone: Files, section: "modeles" },
    ],
  },
  {
    titre: "Système",
    items: [
      { href: "/notifications", label: "Notifications", icone: Bell, section: "notifications" },
      { href: "/parametres/utilisateurs", label: "Utilisateurs", icone: UserCog, section: "parametres" },
      { href: "/parametres/tarifs", label: "Tarifs", icone: BadgeDollarSign, section: "parametres" },
      { href: "/parametres/cabinet", label: "Cabinet", icone: Building2, section: "parametres_cabinet" },
    ],
  },
];

export { Settings };
