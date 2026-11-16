import type { LogSummary } from "../stats/summarize";
import type { Finding } from "../rules/types";

/**
 * Arma el texto que se le pasa al LLM para que explique el diagnóstico.
 *
 * TODO: implementar.
 *  - Incluir solo los datos relevantes: duración, sensores involucrados en hallazgos
 *    y algunos clave (temperaturas, consumo). No mandar el CSV completo.
 *  - Listar los hallazgos con su severidad, título y detalle.
 *  - Pedir al modelo: explicar en lenguaje simple, en español neutro, sin inventar
 *    datos que no estén en el resumen, y sugerir pasos concretos.
 *  - Las reglas deciden el diagnóstico; el LLM solo lo explica.
 */
export function buildPrompt(summary: LogSummary, findings: Finding[]): string {
  throw new Error(
    `TODO: buildPrompt aún no está implementado (${summary.sampleCount} muestras, ${findings.length} hallazgos)`,
  );
}
