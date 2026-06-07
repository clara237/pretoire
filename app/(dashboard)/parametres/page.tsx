import { redirect } from "next/navigation";

// Pas de page d'index « Paramètres » : la navigation pointe directement vers
// les sous-pages (utilisateurs, tarifs, cabinet). On redirige l'URL nue
// /parametres vers la première section accessible pour éviter un 404.
export default function ParametresIndexPage() {
  redirect("/parametres/utilisateurs");
}
