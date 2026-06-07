import Link from "next/link";
import { Users, Mail, Phone } from "lucide-react";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import { Button } from "@/components/ui/button";
import {
  listerClients,
  nomAffichage,
  LIBELLE_TYPE_CLIENT,
  TON_TYPE_CLIENT,
  type FiltresClients,
} from "@/lib/queries/clients";

export async function ClientsTable({ filtres }: { filtres: FiltresClients }) {
  const clients = await listerClients(filtres);

  if (clients.length === 0) {
    const filtre = Boolean(filtres.recherche || (filtres.type && filtres.type !== "tous"));
    return (
      <EmptyState
        titre={filtre ? "Aucun client trouvé" : "Aucun client"}
        description={
          filtre
            ? "Aucun client ne correspond à votre recherche."
            : "Ajoutez votre premier client pour commencer."
        }
        icone={Users}
        action={
          !filtre ? (
            <Link href="/clients/nouveau">
              <Button>Nouveau client</Button>
            </Link>
          ) : undefined
        }
      />
    );
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Client</TableHead>
          <TableHead>Type</TableHead>
          <TableHead className="hidden md:table-cell">Coordonnées</TableHead>
          <TableHead className="hidden lg:table-cell">Ville</TableHead>
          <TableHead className="hidden lg:table-cell">Identifiant</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {clients.map((c) => (
          <TableRow key={c.id} className="cursor-pointer">
            <TableCell>
              <Link href={`/clients/${c.id}`} className="block">
                <span className="font-medium text-foreground hover:text-principale">
                  {nomAffichage(c)}
                </span>
              </Link>
            </TableCell>
            <TableCell>
              <Badge ton={TON_TYPE_CLIENT[c.type] ?? "neutre"}>
                {LIBELLE_TYPE_CLIENT[c.type] ?? c.type}
              </Badge>
            </TableCell>
            <TableCell className="hidden md:table-cell">
              <div className="space-y-0.5 text-xs text-muted-foreground">
                {c.email && (
                  <p className="flex items-center gap-1.5">
                    <Mail className="h-3 w-3" />
                    {c.email}
                  </p>
                )}
                {c.telephone && (
                  <p className="flex items-center gap-1.5">
                    <Phone className="h-3 w-3" />
                    {c.telephone}
                  </p>
                )}
                {!c.email && !c.telephone && <span>—</span>}
              </div>
            </TableCell>
            <TableCell className="hidden lg:table-cell text-sm text-muted-foreground">
              {c.ville || "—"}
            </TableCell>
            <TableCell className="hidden lg:table-cell text-sm text-muted-foreground">
              {c.type === "morale" ? c.rccm_numero || "—" : c.cni_numero || "—"}
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
