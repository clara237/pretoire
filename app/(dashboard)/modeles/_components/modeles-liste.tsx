import { FileText, FileX } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import { tronquer } from "@/lib/utils";
import { listerModeles, type ModeleDocument } from "@/lib/queries/finance";
import { ModeleForm } from "./modele-form";
import {
  ModeleTelecharger,
  ModeleBascule,
  ModeleSupprimer,
} from "./modele-actions";

export async function ModelesListe({
  categorie,
  inclureInactifs,
  peutEditer,
}: {
  categorie?: string;
  inclureInactifs: boolean;
  peutEditer: boolean;
}) {
  const modeles = await listerModeles({ categorie, inclureInactifs });

  if (modeles.length === 0) {
    const filtre = Boolean(categorie && categorie !== "tous");
    return (
      <EmptyState
        titre={filtre ? "Aucun modèle dans cette catégorie" : "Aucun modèle"}
        description={
          filtre
            ? "Aucun modèle ne correspond à ce filtre."
            : "Constituez votre bibliothèque de modèles (mise en demeure, conclusions, contrats…)."
        }
        icone={FileText}
        action={!filtre && peutEditer ? <ModeleForm /> : undefined}
      />
    );
  }

  // Regroupement par catégorie.
  const groupes = new Map<string, ModeleDocument[]>();
  for (const m of modeles) {
    const cle = m.categorie || "Sans catégorie";
    const arr = groupes.get(cle) ?? [];
    arr.push(m);
    groupes.set(cle, arr);
  }

  return (
    <div className="space-y-8">
      {Array.from(groupes.entries()).map(([cat, liste]) => (
        <section key={cat}>
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
            {cat}
          </h2>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {liste.map((m) => (
              <Card
                key={m.id}
                className={m.actif ? "" : "opacity-60"}
              >
                <CardContent className="flex h-full flex-col gap-3 p-4">
                  <div className="flex items-start gap-3">
                    <div className="rounded-lg bg-principale/10 p-2 text-principale">
                      {m.fichier_url ? (
                        <FileText className="h-5 w-5" />
                      ) : (
                        <FileX className="h-5 w-5" />
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="font-medium text-foreground">{m.nom}</p>
                      {!m.actif && (
                        <Badge ton="neutre" className="mt-1">
                          Inactif
                        </Badge>
                      )}
                    </div>
                  </div>
                  {m.description && (
                    <p className="text-sm text-muted-foreground">
                      {tronquer(m.description, 120)}
                    </p>
                  )}
                  <div className="mt-auto flex items-center justify-between pt-2">
                    <div>
                      {m.fichier_url ? (
                        <ModeleTelecharger chemin={m.fichier_url} />
                      ) : (
                        <span className="text-xs text-muted-foreground">
                          Aucun fichier
                        </span>
                      )}
                    </div>
                    {peutEditer && (
                      <div className="flex items-center">
                        <ModeleBascule id={m.id} actif={m.actif} />
                        <ModeleForm
                          declencheur="ligne"
                          initial={{
                            id: m.id,
                            nom: m.nom,
                            categorie: m.categorie,
                            description: m.description,
                            aFichier: Boolean(m.fichier_url),
                          }}
                        />
                        <ModeleSupprimer
                          id={m.id}
                          fichier={m.fichier_url}
                          nom={m.nom}
                        />
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}
