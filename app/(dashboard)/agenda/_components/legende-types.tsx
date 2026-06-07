import { cn } from "@/lib/utils";
import {
  COULEUR_PASTILLE,
  LIBELLE_TYPE,
  TYPES_EVENEMENT,
} from "../_lib/evenements";

/** Légende des couleurs par type d'événement. */
export function LegendeTypes() {
  return (
    <div className="mb-4 flex flex-wrap items-center gap-x-4 gap-y-2">
      {TYPES_EVENEMENT.map(({ value }) => (
        <span
          key={value}
          className="inline-flex items-center gap-1.5 text-xs text-muted-foreground"
        >
          <span
            className={cn(
              "h-2.5 w-2.5 rounded-full",
              COULEUR_PASTILLE[value].point,
            )}
          />
          {LIBELLE_TYPE[value]}
        </span>
      ))}
    </div>
  );
}
