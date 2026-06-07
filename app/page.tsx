import { redirect } from "next/navigation";

// La racine est gérée par le middleware (→ /dashboard ou /login).
// Filet de sécurité si le middleware ne s'exécute pas.
export default function RootPage() {
  redirect("/dashboard");
}
