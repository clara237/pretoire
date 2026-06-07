import { redirect } from "next/navigation";
import { getCabinetConfig } from "@/lib/cabinet";
import { getProfilCourant } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { CabinetProvider } from "@/components/providers/cabinet-provider";
import { AppShell } from "@/components/shell/app-shell";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [cabinet, profil] = await Promise.all([
    getCabinetConfig(),
    getProfilCourant(),
  ]);

  if (!profil) {
    redirect("/login");
  }

  // Compteur de notifications non lues
  const supabase = createClient();
  const { count } = await supabase
    .from("notifications")
    .select("id", { count: "exact", head: true })
    .eq("user_id", profil.user_id)
    .eq("lu", false);

  return (
    <CabinetProvider cabinet={cabinet}>
      <AppShell
        utilisateur={{
          prenom: profil.prenom,
          nom: profil.nom,
          email: profil.email,
          role: profil.role,
          photoUrl: profil.photo_url,
        }}
        notificationsNonLues={count ?? 0}
      >
        {children}
      </AppShell>
    </CabinetProvider>
  );
}
