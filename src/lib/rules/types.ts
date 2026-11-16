import type { HwinfoLog } from "../csv/types";
import type { LogSummary } from "../stats/summarize";

/** Gravedad de un hallazgo. */
export type Severity = "ok" | "aviso" | "crítico";

/** Resultado de aplicar una regla de diagnóstico. */
export interface Finding {
  severity: Severity;
  /** Frase corta, ej. "CPU muy caliente bajo carga". */
  title: string;
  /** Explicación con los datos concretos, ej. "Máximo de 98 °C durante 4 min". */
  detail: string;
  /** Ids de los sensores involucrados (SensorColumn.id), para resaltarlos en las gráficas. */
  sensors: string[];
}

/**
 * Firma común de todas las reglas: reciben el registro y su resumen,
 * y devuelven cero o más hallazgos.
 */
export type Rule = (log: HwinfoLog, summary: LogSummary) => Finding[];
