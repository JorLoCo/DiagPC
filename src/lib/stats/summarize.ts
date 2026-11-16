import type { HwinfoLog, SensorColumn } from "../csv/types";

/** Estadísticas de un sensor numérico a lo largo de todo el registro. */
export interface SensorStats {
  /** Coincide con SensorColumn.id. */
  sensorId: string;
  name: string;
  unit: string;
  min: number;
  max: number;
  avg: number;
  /** Timestamp (ms epoch) de la primera muestra en que se alcanzó el máximo. */
  maxTimestamp: number;
  /** Cantidad de muestras con valor numérico válido. */
  count: number;
}

/** Estadísticas de un sensor booleano (Sí/No) a lo largo de todo el registro. */
export interface FlagStats {
  /** Coincide con SensorColumn.id. */
  sensorId: string;
  name: string;
  /** Muestras en true. */
  trueCount: number;
  /** Muestras con valor booleano (sin contar null). */
  total: number;
  /** trueCount / total, de 0 a 100. */
  truePercent: number;
}

/** Resumen del registro completo. */
export interface LogSummary {
  sampleCount: number;
  /** Primer timestamp (ms epoch), o null si no hay muestras. */
  startTimestamp: number | null;
  /** Último timestamp (ms epoch), o null si no hay muestras. */
  endTimestamp: number | null;
  /** Duración del registro en segundos (último timestamp menos el primero). */
  durationSeconds: number;
  /** Estadísticas por sensor numérico, indexadas por SensorColumn.id. */
  sensors: Record<string, SensorStats>;
  /** Estadísticas por sensor booleano (ej. Thermal Throttling), indexadas por SensorColumn.id. */
  flags: Record<string, FlagStats>;
}

/** Acumulador de un sensor mientras se recorren las muestras. */
interface Acc {
  min: number;
  max: number;
  maxTimestamp: number;
  sum: number;
  count: number;
  trueCount: number;
  boolCount: number;
}

/**
 * Calcula mínimo, máximo, promedio y momento del máximo de cada sensor numérico,
 * y cuántas veces estuvo en true cada sensor booleano. Ignora los null; un sensor
 * sin ningún valor no aparece en el resumen.
 */
export function summarize(log: HwinfoLog): LogSummary {
  const accs = new Map<SensorColumn, Acc>();
  for (const column of log.columns) {
    accs.set(column, {
      min: Infinity,
      max: -Infinity,
      maxTimestamp: 0,
      sum: 0,
      count: 0,
      trueCount: 0,
      boolCount: 0,
    });
  }

  for (const sample of log.samples) {
    for (const [column, acc] of accs) {
      const value = sample.values[column.id];
      if (typeof value === "number") {
        if (value < acc.min) acc.min = value;
        if (value > acc.max) {
          acc.max = value;
          acc.maxTimestamp = sample.timestamp;
        }
        acc.sum += value;
        acc.count++;
      } else if (typeof value === "boolean") {
        if (value) acc.trueCount++;
        acc.boolCount++;
      }
    }
  }

  const sensors: Record<string, SensorStats> = {};
  const flags: Record<string, FlagStats> = {};
  for (const [column, acc] of accs) {
    if (acc.count > 0) {
      sensors[column.id] = {
        sensorId: column.id,
        name: column.name,
        unit: column.unit,
        min: acc.min,
        max: acc.max,
        avg: acc.sum / acc.count,
        maxTimestamp: acc.maxTimestamp,
        count: acc.count,
      };
    }
    if (acc.boolCount > 0) {
      flags[column.id] = {
        sensorId: column.id,
        name: column.name,
        trueCount: acc.trueCount,
        total: acc.boolCount,
        truePercent: (acc.trueCount / acc.boolCount) * 100,
      };
    }
  }

  // log.samples viene ordenado por timestamp (ver parseHwinfo).
  const startTimestamp = log.samples[0]?.timestamp ?? null;
  const endTimestamp = log.samples[log.samples.length - 1]?.timestamp ?? null;
  const durationSeconds =
    startTimestamp !== null && endTimestamp !== null ? (endTimestamp - startTimestamp) / 1000 : 0;

  return {
    sampleCount: log.samples.length,
    startTimestamp,
    endTimestamp,
    durationSeconds,
    sensors,
    flags,
  };
}
