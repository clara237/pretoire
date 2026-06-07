import { Suspense } from "react";
import { PageHeader } from "@/components/ui/page-header";
import { Skeleton } from "@/components/ui/skeleton";
import { createClient } from "@/lib/supabase/server";
import { getProfilCourant } from "@/lib/auth";
import { ListeNotifications, type NotificationItem } from "./_components/liste-notifications";

export const dynamic = "force-dynamic";

async function Contenu() {
  const profil = await getProfilCourant();
  if (!profil) return null;

  const supabase = createClient();
  const { data } = await supabase
    .from("notifications")
    .select("id, titre, message, type, lien, lu, created_at")
    .eq("user_id", profil.user_id)
    .order("created_at", { ascending: false })
    .limit(200);

  const notifications = (data ?? []) as NotificationItem[];

  return <ListeNotifications notifications={notifications} />;
}

function FallbackListe() {
  return (
    <div className="space-y-3">
      {Array.from({ length: 5 }).map((_, i) => (
        <Skeleton key={i} className="h-20 w-full rounded-lg" />
      ))}
    </div>
  );
}

export default function NotificationsPage() {
  return (
    <div>
      <PageHeader
        titre="Notifications"
        description="Échéances, relances et alertes du cabinet."
      />
      <Suspense fallback={<FallbackListe />}>
        <Contenu />
      </Suspense>
    </div>
  );
}
