import type { Rule } from "./types";

/**
 * Reglas de la tarjeta gráfica.
 *
 * TODO: implementar. Ideas:
 *  - Temperatura de GPU y de hotspot sobre un umbral.
 *  - Límites de rendimiento activos (Power, Thermal, Voltage) en "Yes".
 *  - Ventiladores al 100 % de forma sostenida.
 */
export const checkGpu: Rule = (_log, _summary) => {
  return [];
};
