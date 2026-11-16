import type { Finding } from "../lib/rules/types";

/**
 * Lista de hallazgos que produjeron las reglas.
 *
 * TODO: implementar.
 *  - Una tarjeta por hallazgo con color según la severidad (ok / aviso / crítico).
 *  - Mostrar título y detalle.
 *  - Al hacer clic, avisar con onSelect para mostrar sus sensores en la gráfica.
 */
export interface FindingsListProps {
  findings?: Finding[];
  onSelect?: (finding: Finding) => void;
}

export function FindingsList(_props: FindingsListProps) {
  return <section className="panel">FindingsList</section>;
}
