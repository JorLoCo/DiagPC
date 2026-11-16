import type { HwinfoLog } from "../csv/types";
import type { LogSummary } from "../stats/summarize";
import type { Finding, Rule } from "./types";
import { checkCpu } from "./cpu";
import { checkGpu } from "./gpu";
import { checkPower } from "./power";
import { checkMemory } from "./memory";

/** Lista de todas las reglas activas. Para agregar una regla nueva, súmala aquí. */
const RULES: Rule[] = [checkCpu, checkGpu, checkPower, checkMemory];

/**
 * Ejecuta todas las reglas y junta sus hallazgos.
 *
 * TODO: implementar.
 *  - Llamar a cada regla de RULES con (log, summary) y concatenar los resultados.
 *  - Ordenar por severidad: primero "crítico", luego "aviso", al final "ok".
 *  - Si una regla lanza un error, no romper todo: registrar el error y seguir.
 */
export function runRules(log: HwinfoLog, summary: LogSummary): Finding[] {
  void RULES;
  throw new Error(`TODO: runRules aún no está implementado (${log.fileName}, ${summary.sampleCount} muestras)`);
}
