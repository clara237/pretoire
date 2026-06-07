import { TrendingUp, CalendarRange, Wallet, AlertCircle } from "lucide-react";
import { StatCard } from "@/components/ui/stat-card";
import { formatFCFA } from "@/lib/utils";
import { synthese } from "../_lib/donnees";

export async function FinanceKpis() {
  const s = await synthese();

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
      <StatCard
        libelle="CA ce mois"
        valeur={formatFCFA(s.caMois)}
        icone={TrendingUp}
        ton="principal"
      />
      <StatCard
        libelle="CA ce trimestre"
        valeur={formatFCFA(s.caTrimestre)}
        icone={CalendarRange}
        ton="succes"
      />
      <StatCard
        libelle="CA cette année"
        valeur={formatFCFA(s.caAnnee)}
        icone={Wallet}
        ton="neutre"
      />
      <StatCard
        libelle="Créances en cours"
        valeur={formatFCFA(s.creancesEnCours)}
        icone={AlertCircle}
        ton="danger"
        variation={{
          valeur: `${s.nbFacturesImpayees} facture${
            s.nbFacturesImpayees > 1 ? "s" : ""
          } à recouvrer`,
          positif: false,
        }}
      />
    </div>
  );
}
