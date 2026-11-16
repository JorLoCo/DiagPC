// Identifica los componentes del equipo (procesador, gráfica, discos, etc.) a partir
// de los grupos del CSV, y localiza sus sensores principales.
//
// HWiNFO escribe los nombres de los sensores en el idioma configurado, así que cada
// búsqueda incluye los nombres en español y en inglés. Se comparan sin tildes ni
// mayúsculas (ver `normalize`).

import type { HwinfoLog, SensorColumn } from "./csv/types";
import type { FlagStats, LogSummary, SensorStats } from "./stats/summarize";

export type ComponentKind = "cpu" | "gpu" | "memory" | "disk" | "board" | "network";

export interface HardwareComponent {
  /** Identificador estable dentro del registro, ej. "cpu-0" o "disk-adata su630-c:". */
  key: string;
  kind: ComponentKind;
  /** Tipo legible: "Procesador", "Disco", etc. */
  label: string;
  /** Modelo, ej. "AMD Ryzen 5 5600GT". */
  name: string;
  /** Dato secundario, ej. "Unidad C:" o el chip de la placa base. Puede estar vacío. */
  detail: string;
  /** Columnas de todos los grupos que pertenecen a este componente. */
  columns: SensorColumn[];
}

const KIND_LABEL: Record<ComponentKind, string> = {
  cpu: "Procesador",
  gpu: "Tarjeta gráfica",
  memory: "Memoria RAM",
  disk: "Disco",
  board: "Placa base",
  network: "Red",
};

const KIND_ORDER: ComponentKind[] = ["cpu", "gpu", "memory", "disk", "board", "network"];

/** Minúsculas, sin tildes y sin espacios sobrantes, para comparar nombres de sensores. */
export function normalize(text: string): string {
  return text.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().trim();
}

// ---------- Nombres de sensores (español e inglés) ----------

export const SENSOR_NAMES = {
  cpuUsage: ["Uso total de CPU", "Total CPU Usage"],
  cpuTemp: ["CPU (Tctl/Tdie)", "CPU Package", "CPU (Tdie)", "CPU (Tctl)", "Núcleo de CPU", "CPU Core"],
  gpuUsage: ["Carga de núcleo de GPU", "GPU Core Load", "GPU D3D Uso (avg)", "GPU D3D Usage"],
  gpuTemp: ["Temperatura de la GPU", "GPU Temperature"],
  ramLoad: ["Carga de memoria física", "Physical Memory Load"],
  ramUsed: ["Memoria física utilizada", "Physical Memory Used"],
  ramAvailable: ["Memoria física disponible", "Physical Memory Available"],
  diskTemp: ["Temperatura del disco", "Drive Temperature"],
  diskLife: ["Vida restante del disco", "Drive Remaining Life"],
  boardTemp: ["Tarjeta madre", "Motherboard", "Placa base"],
  /** Sensores Sí/No: se buscan por prefijo. */
  cpuThrottling: ["Desaceleración térmica", "Thermal Throttling"],
  gpuThermalLimit: ["Límite de rendimiento: Térmico", "Performance Limit - Thermal"],
  diskFailure: ["Fallo de disco", "Drive Failure"],
  diskWarning: ["Advertencia de disco", "Drive Warning"],
} as const;

/** Sensores que indican que el grupo es la placa base (chip de monitoreo). */
const BOARD_MARKERS = ["+12V", "VBAT", ...SENSOR_NAMES.boardTemp].map(normalize);

/** Temperatura principal de cada tipo de componente, en orden de preferencia. */
const PRIMARY_TEMP: Partial<Record<ComponentKind, readonly string[]>> = {
  cpu: SENSOR_NAMES.cpuTemp,
  gpu: SENSOR_NAMES.gpuTemp,
  disk: SENSOR_NAMES.diskTemp,
  board: SENSOR_NAMES.boardTemp,
};

/**
 * Primer sensor numérico cuyo nombre coincide exactamente con alguno de `names`.
 * Respeta el orden de `names`: el primero de la lista tiene prioridad.
 */
export function findStats(
  columns: SensorColumn[],
  summary: LogSummary,
  names: readonly string[],
): SensorStats | null {
  for (const wanted of names.map(normalize)) {
    for (const column of columns) {
      const stats = summary.sensors[column.id];
      if (stats && normalize(column.name) === wanted) return stats;
    }
  }
  return null;
}

/** Sensores Sí/No cuyo nombre empieza con alguno de `prefixes`. */
export function findFlags(
  columns: SensorColumn[],
  summary: LogSummary,
  prefixes: readonly string[],
): FlagStats[] {
  const wanted = prefixes.map(normalize);
  return columns
    .filter((c) => summary.flags[c.id] && wanted.some((w) => normalize(c.name).startsWith(w)))
    .map((c) => summary.flags[c.id]);
}

/** Temperatura principal del componente, o null si el registro no la tiene. */
export function primaryTemp(component: HardwareComponent, summary: LogSummary): SensorStats | null {
  const names = PRIMARY_TEMP[component.kind];
  return names ? findStats(component.columns, summary, names) : null;
}

// ---------- Detección de componentes ----------

interface GroupMatch {
  key: string;
  kind: ComponentKind;
  name: string;
  detail: string;
}

/** Decide a qué componente pertenece un grupo del CSV. null = grupo que no se muestra. */
function classifyGroup(group: string, columns: SensorColumn[]): GroupMatch | null {
  let m = group.match(/^CPU \[#(\d+)\]:\s*([^:]+)/);
  if (m) return { key: `cpu-${m[1]}`, kind: "cpu", name: m[2].trim(), detail: "" };

  m = group.match(/^GPU \[#(\d+)\]:\s*([^:]+)/);
  if (m) return { key: `gpu-${m[1]}`, kind: "gpu", name: m[2].trim(), detail: "" };

  // "S.M.A.R.T.: ADATA SU630 (2N402L1EEDRL) [D:]" y "Drive: …" son el mismo disco.
  m = group.match(/^(?:S\.M\.A\.R\.T\.|Drive):\s*(.+)$/);
  if (m) {
    const letter = m[1].match(/\[([A-Z]:)\]/)?.[1] ?? "";
    const model = m[1].replace(/\s*\([^)]*\)/g, "").replace(/\s*\[[^\]]*\]/g, "").trim();
    return {
      key: `disk-${normalize(model)}-${letter.toLowerCase()}`,
      kind: "disk",
      name: model,
      detail: letter ? `Unidad ${letter}` : "",
    };
  }

  m = group.match(/^(?:Red|Network):\s*(.+?)(?:\s+-\s+(.+))?$/);
  if (m) return { key: `net-${normalize(group)}`, kind: "network", name: m[1].trim(), detail: m[2] ?? "" };

  // La memoria aparece en el grupo del sistema (cargas) y en el de tiempos.
  if (/^(?:Sistema|System):/.test(group) || /^(?:Tiempos de memoria|Memory Timings)$/i.test(group)) {
    return { key: "memory", kind: "memory", name: "", detail: "" };
  }

  if (columns.some((c) => BOARD_MARKERS.includes(normalize(c.name)))) {
    const chip = group.match(/\(([^)]*)\)\s*$/)?.[1] ?? "";
    return {
      key: `board-${normalize(group)}`,
      kind: "board",
      name: group.replace(/\s*\([^)]*\)\s*$/, "").trim(),
      detail: chip,
    };
  }

  return null;
}

/** Componentes del registro, ordenados por tipo (procesador, gráfica, memoria…). */
export function detectComponents(log: HwinfoLog, summary: LogSummary): HardwareComponent[] {
  const byGroup = new Map<string, SensorColumn[]>();
  for (const column of log.columns) {
    const list = byGroup.get(column.group) ?? [];
    list.push(column);
    byGroup.set(column.group, list);
  }

  const components = new Map<string, HardwareComponent>();
  for (const [group, columns] of byGroup) {
    const match = classifyGroup(group, columns);
    if (!match) continue;
    const existing = components.get(match.key);
    if (existing) {
      existing.columns.push(...columns);
    } else {
      components.set(match.key, { ...match, label: KIND_LABEL[match.kind], columns: [...columns] });
    }
  }

  const memory = components.get("memory");
  if (memory) {
    const totalGb = ramTotalGb(log, memory.columns, summary);
    memory.name = totalGb !== null ? `${Math.round(totalGb)} GB` : "Memoria del sistema";
  }

  return [...components.values()].sort(
    (a, b) => KIND_ORDER.indexOf(a.kind) - KIND_ORDER.indexOf(b.kind),
  );
}

/** Capacidad total de RAM en GB (usada + disponible en la primera muestra con ambos valores). */
function ramTotalGb(log: HwinfoLog, columns: SensorColumn[], summary: LogSummary): number | null {
  const used = findStats(columns, summary, SENSOR_NAMES.ramUsed);
  const available = findStats(columns, summary, SENSOR_NAMES.ramAvailable);
  if (!used || !available) return null;
  for (const sample of log.samples) {
    const u = sample.values[used.sensorId];
    const a = sample.values[available.sensorId];
    if (typeof u === "number" && typeof a === "number") return (u + a) / 1024;
  }
  return null;
}

// ---------- Indicadores de la pantalla de inicio ----------

export interface Overview {
  cpu: HardwareComponent | null;
  gpu: HardwareComponent | null;
  cpuUsage: SensorStats | null;
  cpuTemp: SensorStats | null;
  gpuUsage: SensorStats | null;
  ramLoad: SensorStats | null;
  /** Máximo de RAM usada en GB. */
  ramUsedMaxGb: number | null;
  ramTotalGb: number | null;
}

export function buildOverview(
  log: HwinfoLog,
  summary: LogSummary,
  components: HardwareComponent[],
): Overview {
  const cpu = components.find((c) => c.kind === "cpu") ?? null;
  // Si hay varias gráficas, se toma la primera que reporte uso.
  const gpus = components.filter((c) => c.kind === "gpu");
  const gpu = gpus.find((g) => findStats(g.columns, summary, SENSOR_NAMES.gpuUsage)) ?? gpus[0] ?? null;
  const memory = components.find((c) => c.kind === "memory");
  const memColumns = memory?.columns ?? [];
  const ramUsed = findStats(memColumns, summary, SENSOR_NAMES.ramUsed);

  return {
    cpu,
    gpu,
    cpuUsage: cpu ? findStats(cpu.columns, summary, SENSOR_NAMES.cpuUsage) : null,
    cpuTemp: cpu ? primaryTemp(cpu, summary) : null,
    gpuUsage: gpu ? findStats(gpu.columns, summary, SENSOR_NAMES.gpuUsage) : null,
    ramLoad: findStats(memColumns, summary, SENSOR_NAMES.ramLoad),
    ramUsedMaxGb: ramUsed ? ramUsed.max / 1024 : null,
    ramTotalGb: ramTotalGb(log, memColumns, summary),
  };
}
