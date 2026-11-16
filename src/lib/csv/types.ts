// Tipos que describen un registro de sensores de HWiNFO ya leído y limpio.

/**
 * Describe una columna de sensor del CSV.
 * Ejemplo: el encabezado "CPU (Tctl/Tdie) [°C]" del grupo "CPU [#0]: AMD Ryzen 5 5600GT"
 * se convierte en { id: "CPU [#0]: AMD Ryzen 5 5600GT › CPU (Tctl/Tdie) [°C]",
 * group: "CPU [#0]: AMD Ryzen 5 5600GT", name: "CPU (Tctl/Tdie)", unit: "°C" }.
 */
export interface SensorColumn {
  /**
   * Identificador único: "grupo › encabezado completo con unidad".
   * Si ese id ya existe, se agrega " #2", " #3", etc.
   */
  id: string;
  /** Grupo o dispositivo de la columna, tomado de la última fila del CSV. */
  group: string;
  /** Nombre legible del sensor, sin la unidad. */
  name: string;
  /** Unidad extraída de los corchetes del encabezado (ej. "°C", "W", "MHz", "%"). Vacía si no tiene. */
  unit: string;
  /** Posición original de la columna en el CSV (útil para depurar). */
  index: number;
}

/** Valor de un sensor en una fila. Los "Sí"/"No" se convierten a boolean; lo vacío o ilegible queda en null. */
export type SensorValue = number | boolean | null;

/**
 * Una fila del registro: un instante en el tiempo con el valor de cada sensor.
 */
export interface Sample {
  /** Marca de tiempo construida a partir de las columnas Date y Time (milisegundos epoch). */
  timestamp: number;
  /** Valores indexados por SensorColumn.id. */
  values: Record<string, SensorValue>;
}

/**
 * Registro completo de HWiNFO listo para analizar.
 */
export interface HwinfoLog {
  /** Nombre del archivo de origen. */
  fileName: string;
  /** Columnas de sensores (sin incluir Date ni Time). */
  columns: SensorColumn[];
  /** Filas válidas, ordenadas por timestamp. */
  samples: Sample[];
  /** Advertencias encontradas al leer el archivo (filas descartadas, columnas dudosas, etc.). */
  warnings: string[];
}
