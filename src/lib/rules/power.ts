import type { Rule } from "./types";

/**
 * Reglas de alimentación y voltajes.
 *
 * TODO: implementar. Ideas:
 *  - Rieles de +12V, +5V y +3.3V fuera de tolerancia (±5 %).
 *  - Consumo de CPU/GPU que choca con su límite de potencia.
 *  - Caídas bruscas de voltaje bajo carga.
 */
export const checkPower: Rule = (_log, _summary) => {
  return [];
};
