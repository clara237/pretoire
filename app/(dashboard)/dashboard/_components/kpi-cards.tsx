import { Briefcase, CalendarClock, Clock, GraduationCap } from "lucide-react";
import { StatCard } from "@/components/ui/stat-card";
import { createClient } from "@/lib/supabase/server";
import { formatHeures } from "@/lib/utils";

function bornesJour() {
  const debut = new Date();
  debut.setHours(0, 0, 0, 0);
  const fin = new Date();
  fin.setHours(23, 59, 59, 999);
  return { debut: debut.toISOString(), fin: fin.toISOString() };
}

function bornesMois() {
  const maintenant = new Date();
  const debut = new Date(maintenant.getFullYear(), maintenant.getMonth(), 1);
  const fin = new Date(maintenant.getFullYear(), maintenant.getMonth() + 1, 0);
  return {
    debut: debut.toISOString().slice(0, 10),
    fin: fin.toISOString().slice(0, 10),
  };
}

export async function KpiCards() {
  const supabase = createClient();
  const { debut: jourDebut, fin: jourFin } = bornesJour();
  const { debut: moisDebut, fin: moisFin } = bornesMois();
  const aujourdHui = new Date().toISOString().slice(0, 10);

  const [dossiers, rdv, heures, stagiaires] = await Promise.all([
    supabase
      .from("dossiers")
      .select("id", { count: "exact", head: true })
      .in("statut", ["ouvert", "en_cours"]),
    supabase
      .from("evenements")
      .select("id", { count: "exact", head: true })
      .gte("date_debut", jourDebut)
      .lte("date_debut", jourFin),
    supabase
      .from("saisies_temps")
      .select("duree_heures")
      .eq("facturable", true)
      .gte("date", moisDebut)
      .lte("date", moisFin),
    supabase
      .from("presences_stagiaires")
      .select("id", { count: "exact", head: true })
      .eq("date", aujourdHui)
      .eq("present", true),
  ]);

  const totalHeures = (heures.data ?? []).reduce(
    (acc, s: { duree_heures: number | null }) => acc + (s.duree_heures ?? 0),
    0,
  );

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
      <StatCard
        libelle="Dossiers actifs"
        valeur={dossiers.count ?? 0}
        icone={Briefcase}
        ton="principal"
      />
      <StatCard
        libelle="RDV aujourd'hui"
        valeur={rdv.count ?? 0}
        icone={CalendarClock}
        ton="succes"
      />
      <StatCard
        libelle="Heures facturées (mois)"
        valeur={formatHeures(totalHeures)}
        icone={Clock}
        ton="avertissement"
      />
      <StatCard
        libelle="Stagiaires présents"
        valeur={stagiaires.count ?? 0}
        icone={GraduationCap}
        ton="neutre"
      />
    </div>
  );
}
