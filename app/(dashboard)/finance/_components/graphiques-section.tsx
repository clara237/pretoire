import { serieMensuelle, recettesDepenses } from "../_lib/donnees";
import { GraphiquesClient } from "./graphiques-client";

export async function GraphiquesSection() {
  const [ca, tresorerie] = await Promise.all([
    serieMensuelle(),
    recettesDepenses(),
  ]);

  return <GraphiquesClient ca={ca} tresorerie={tresorerie} />;
}
