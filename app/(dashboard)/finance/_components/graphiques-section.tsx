import { serieMensuelle, recettesDepenses } from "../_lib/donnees";
import { GraphiqueCA, GraphiqueTresorerie } from "./graphiques";

export async function GraphiquesSection() {
  const [ca, tresorerie] = await Promise.all([
    serieMensuelle(),
    recettesDepenses(),
  ]);

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
      <GraphiqueCA data={ca} />
      <GraphiqueTresorerie data={tresorerie} />
    </div>
  );
}
