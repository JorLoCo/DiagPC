import Papa from "papaparse";
import type { HwinfoLog, Sample, SensorColumn, SensorValue } from "./types";

/** Resultado de separar las filas crudas del CSV de HWiNFO. */
export interface HwinfoRows {
  /** Nombres de columna (fila 0), sin la columna vacía final. */
  headers: string[];
  /** Grupo o dispositivo de cada columna (última fila), alineado con `headers`. */
  groups: string[];
  /** Filas de datos: todo menos la fila 0 y las dos últimas. */
  dataRows: string[][];
}

/**
 * Parsea el texto del CSV de HWiNFO y separa encabezados, grupos y datos.
 * No convierte valores: todo queda como texto.
 */
export function splitHwinfoRows(text: string): HwinfoRows {
  const clean = text.replace(/^﻿/, "");
  const { data } = Papa.parse<string[]>(clean, { skipEmptyLines: true });

  if (data.length < 3) {
    throw new Error("El CSV no tiene encabezado, datos y fila de grupos.");
  }

  const first = data[0];
  const width = first[first.length - 1] === "" ? first.length - 1 : first.length;
  const trim = (row: string[]) => row.slice(0, width);

  return {
    headers: trim(first),
    groups: trim(data[data.length - 1]),
    dataRows: data.slice(1, -2).map(trim),
  };
}

/**
 * Separa el nombre y la unidad de un encabezado.
 * "GPU Power [W]" → { name: "GPU Power", unit: "W" }; sin corchetes, unit = "".
 */
export function parseHeader(header: string): { name: string; unit: string } {
  const match = /^(.*?)\s*\[([^\]]*)\]\s*$/.exec(header);
  if (!match) return { name: header.trim(), unit: "" };
  return { name: match[1], unit: match[2].trim() };
}

/**
 * Convierte fecha D.M.YYYY y hora H:M:S.mmm (sin ceros a la izquierda) a
 * milisegundos epoch en hora local. Devuelve null si alguna parte es inválida.
 */
export function parseTimestamp(date: string, time: string): number | null {
  const d = /^(\d{1,2})\.(\d{1,2})\.(\d{4})$/.exec(date.trim());
  const t = /^(\d{1,2}):(\d{1,2}):(\d{1,2})(?:\.(\d{1,3}))?$/.exec(time.trim());
  if (!d || !t) return null;

  const [day, month, year] = [Number(d[1]), Number(d[2]), Number(d[3])];
  const [hour, minute, second] = [Number(t[1]), Number(t[2]), Number(t[3])];
  const ms = Number(t[4] ?? 0);
  if (hour > 23 || minute > 59 || second > 59) return null;

  const result = new Date(year, month - 1, day, hour, minute, second, ms);
  // Descarta fechas que Date "corrige" solo, como 31.2.2026 → 3 de marzo.
  if (result.getDate() !== day || result.getMonth() !== month - 1) return null;
  return result.getTime();
}

/** Convierte una celda: número, "Sí" → true, "No" → false, vacío o ilegible → null. */
export function parseValue(text: string): SensorValue {
  const value = text.trim();
  if (value === "") return null;
  if (value === "Sí") return true;
  if (value === "No") return false;
  const number = Number(value);
  return Number.isFinite(number) ? number : null;
}

/** Construye las columnas de sensores (desde la 2, sin Date ni Time) con ids únicos. */
function buildColumns(headers: string[], groups: string[]): SensorColumn[] {
  const seen = new Map<string, number>();
  const columns: SensorColumn[] = [];

  for (let index = 2; index < headers.length; index++) {
    const header = headers[index].trim();
    const group = (groups[index] ?? "").trim();
    const baseId = `${group} › ${header}`;
    const count = (seen.get(baseId) ?? 0) + 1;
    seen.set(baseId, count);

    columns.push({
      id: count === 1 ? baseId : `${baseId} #${count}`,
      group,
      ...parseHeader(header),
      index,
    });
  }
  return columns;
}

/**
 * Lee el archivo CSV de registro de HWiNFO y lo convierte en un HwinfoLog.
 *
 * Notas sobre el CSV de HWiNFO:
 *
 *  - CODIFICACIÓN: viene en UTF-8 con BOM (EF BB BF). `file.text()` decodifica
 *    UTF-8 y descarta el BOM; `splitHwinfoRows` también lo quita por si acaso.
 *
 *  - FECHA Y HORA: las primeras columnas son "Date" y "Time", sin ceros a la
 *    izquierda: fecha D.M.YYYY (ej. "28.9.2026") y hora H:M:S.mmm
 *    (ej. "21:3:6.198"). Se combinan en un timestamp con `parseTimestamp`.
 *
 *  - UNIDADES EN EL NOMBRE: la unidad viene entre corchetes al final del
 *    encabezado, ej. "CPU (Tctl/Tdie) [°C]". Algunas vienen vacías
 *    (ej. "Errores totales []") y algunas columnas no traen unidad.
 *
 *  - NOMBRES REPETIDOS: el id combina grupo y encabezado. Si aun así se repite
 *    (pasa dentro del grupo de la GPU), se agrega " #2", " #3", etc.
 *
 *  - FILAS FINALES: las dos últimas filas no son datos. La penúltima repite los
 *    encabezados y la última trae el grupo (dispositivo) de cada columna.
 *
 *  - BOOLEANOS: HWiNFO en español escribe "Sí"/"No" aunque la unidad diga
 *    [Yes/No].
 *
 *  - Cada fila termina con una columna vacía (coma final), que
 *    `splitHwinfoRows` ya quita.
 */
export async function parseHwinfo(file: File): Promise<HwinfoLog> {
  const text = await file.text();
  return buildHwinfoLog(file.name, text);
}

/** Convierte el texto del CSV en un HwinfoLog. Separada de `parseHwinfo` para probarla sin File. */
export function buildHwinfoLog(fileName: string, text: string): HwinfoLog {
  const { headers, groups, dataRows } = splitHwinfoRows(text);
  const columns = buildColumns(headers, groups);
  const samples: Sample[] = [];
  const warnings: string[] = [];

  dataRows.forEach((row, i) => {
    const timestamp = parseTimestamp(row[0] ?? "", row[1] ?? "");
    if (timestamp === null) {
      // +2: la fila 1 del archivo es el encabezado.
      warnings.push(`Fila ${i + 2} descartada: fecha u hora inválida ("${row[0]}" "${row[1]}").`);
      return;
    }
    const values: Record<string, SensorValue> = {};
    for (const column of columns) {
      values[column.id] = parseValue(row[column.index] ?? "");
    }
    samples.push({ timestamp, values });
  });

  samples.sort((a, b) => a.timestamp - b.timestamp);
  return { fileName, columns, samples, warnings };
}
