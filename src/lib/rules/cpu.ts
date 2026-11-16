import type { Rule } from "./types";

/**
 * Reglas del procesador.
 *
 * TODO: implementar. Ideas:
 *  - Temperatura máxima (ej. "CPU (Tctl/Tdie) [°C]", "CPU Package [°C]") sobre un umbral.
 *  - Thermal Throttling en "Yes" durante alguna parte del registro.
 *  - Frecuencia que cae mucho mientras el uso está alto.
 * Buscar los sensores por nombre/unidad, no por posición: cambian según el equipo.
 */
export const checkCpu: Rule = (_log, _summary) => {
  return [];
};
