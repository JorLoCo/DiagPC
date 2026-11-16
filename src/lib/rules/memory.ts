import type { Rule } from "./types";

/**
 * Reglas de memoria RAM.
 *
 * TODO: implementar. Ideas:
 *  - Uso de memoria física cercano al 100 % de forma sostenida.
 *  - Temperatura de los módulos (si el equipo la reporta) sobre un umbral.
 *  - Errores corregidos (WHEA / ECC) mayores que cero, si aparecen en el registro.
 */
export const checkMemory: Rule = (_log, _summary) => {
  return [];
};
