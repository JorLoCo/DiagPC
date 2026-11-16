// Estado rápido de cada componente según umbrales fijos de temperatura, uso de
// memoria y sensores Sí/No de HWiNFO. Sirve para colorear la interfaz mientras las
// reglas de diagnóstico (src/lib/rules) no están implementadas; cuando lo estén,
// pueden reutilizar estos mismos umbrales.

import type { Severity } from "./rules/types";
import type { LogSummary } from "./stats/summarize";
import type { ComponentKind, HardwareComponent } from "./hardware";
import { SENSOR_NAMES, findFlags, findStats, primaryTemp } from "./hardware";

/** Temperaturas (°C) a partir de las cuales se marca aviso o crítico. */
export const TEMP_LIMITS: Partial<Record<ComponentKind, { warn: number; crit: number }>> = {
  cpu: { warn: 85, crit: 95 },
  gpu: { warn: 83, crit: 90 },
  disk: { warn: 60, crit: 70 },
  board: { warn: 60, crit: 75 },
};

/** Uso de RAM (%) a partir del cual se marca aviso o crítico. */
export const RAM_LIMITS = { warn: 85, crit: 95 };

const RANK: Record<Severity, number> = { ok: 0, aviso: 1, crítico: 2 };

/** El más grave de los niveles dados, o null si no hay ninguno. */
export function worst(levels: (Severity | null)[]): Severity | null {
  let result: Severity | null = null;
  for (const level of levels) {
    if (level && (!result || RANK[level] > RANK[result])) result = level;
  }
  return result;
}

function byLimits(value: number, limits: { warn: number; crit: number }): Severity {
  if (value >= limits.crit) return "crítico";
  if (value >= limits.warn) return "aviso";
  return "ok";
}

export function tempLevel(kind: ComponentKind, celsius: number | null | undefined): Severity | null {
  const limits = TEMP_LIMITS[kind];
  return limits && celsius != null ? byLimits(celsius, limits) : null;
}

export function ramLevel(percent: number | null | undefined): Severity | null {
  return percent != null ? byLimits(percent, RAM_LIMITS) : null;
}

/** true si algún sensor Sí/No estuvo activo en algún momento del registro. */
function anyActive(component: HardwareComponent, summary: LogSummary, prefixes: readonly string[]) {
  return findFlags(component.columns, summary, prefixes).some((f) => f.trueCount > 0);
}

/**
 * Estado del componente: el peor entre su temperatura máxima y sus sensores de alerta.
 * null si el registro no tiene ningún dato con qué evaluarlo.
 */
export function componentLevel(component: HardwareComponent, summary: LogSummary): Severity | null {
  const levels: (Severity | null)[] = [tempLevel(component.kind, primaryTemp(component, summary)?.max)];

  switch (component.kind) {
    case "cpu":
      if (anyActive(component, summary, SENSOR_NAMES.cpuThrottling)) levels.push("crítico");
      break;
    case "gpu":
      if (anyActive(component, summary, SENSOR_NAMES.gpuThermalLimit)) levels.push("aviso");
      break;
    case "disk":
      if (anyActive(component, summary, SENSOR_NAMES.diskFailure)) levels.push("crítico");
      if (anyActive(component, summary, SENSOR_NAMES.diskWarning)) levels.push("aviso");
      break;
    case "memory":
      levels.push(ramLevel(findStats(component.columns, summary, SENSOR_NAMES.ramLoad)?.max));
      break;
  }

  return worst(levels);
}
