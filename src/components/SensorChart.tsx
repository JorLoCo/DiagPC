import { useMemo, useState } from "react";
import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { HwinfoLog, SensorColumn } from "../lib/csv/types";
import type { LogSummary } from "../lib/stats/summarize";
import { formatClock } from "../lib/format";

/**
 * Gráfica de un sensor numérico en el tiempo, con recharts.
 *
 * TODO (siguientes pasos):
 *  - Permitir varios sensores a la vez (agrupar por unidad: no mezclar °C con W en el mismo eje).
 *  - Resaltar los sensores que aparecen en los hallazgos (`sensorIds`).
 */
export interface SensorChartProps {
  log?: HwinfoLog;
  /** Se usa para saber qué sensores son numéricos y tienen valores. */
  summary?: LogSummary;
  sensorIds?: string[];
}

/** Sensor que se muestra si el usuario todavía no eligió otro. */
const DEFAULT_HEADER = "CPU (Tctl/Tdie) [°C]";

/** Máximo de puntos a dibujar; si hay más, se toma 1 de cada N. */
const MAX_POINTS = 2000;

export function SensorChart({ log, summary }: SensorChartProps) {
  const [selectedId, setSelectedId] = useState<string | null>(null);

  // Sensores numéricos agrupados por dispositivo, en el orden del CSV.
  const groups = useMemo(() => {
    const map = new Map<string, SensorColumn[]>();
    if (!log || !summary) return map;
    for (const column of log.columns) {
      if (!summary.sensors[column.id]) continue;
      const list = map.get(column.group) ?? [];
      list.push(column);
      map.set(column.group, list);
    }
    return map;
  }, [log, summary]);

  const numericColumns = useMemo(() => [...groups.values()].flat(), [groups]);

  // Si lo elegido no existe en este log (ej. se cargó otro archivo), usar el predeterminado.
  const column =
    numericColumns.find((c) => c.id === selectedId) ??
    numericColumns.find((c) => c.id.endsWith(` › ${DEFAULT_HEADER}`)) ??
    numericColumns[0];

  const data = useMemo(() => {
    if (!log || !column) return [];
    const step = Math.ceil(log.samples.length / MAX_POINTS);
    const points: { t: number; v: number | null }[] = [];
    for (let i = 0; i < log.samples.length; i += step) {
      const sample = log.samples[i];
      const value = sample.values[column.id];
      points.push({ t: sample.timestamp, v: typeof value === "number" ? value : null });
    }
    return points;
  }, [log, column]);

  if (!log || !summary) {
    return <section className="panel">Carga un archivo para ver la gráfica de sensores.</section>;
  }
  if (!column) {
    return <section className="panel">Este registro no tiene sensores numéricos.</section>;
  }

  const unit = column.unit;
  const withUnit = (value: unknown) => (unit ? `${value} ${unit}` : String(value));

  return (
    <section className="panel sensor-chart">
      <label className="sensor-chart__picker">
        Sensor:{" "}
        <select value={column.id} onChange={(event) => setSelectedId(event.target.value)}>
          {[...groups].map(([group, columns]) => (
            <optgroup key={group} label={group || "(sin grupo)"}>
              {columns.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.unit ? `${c.name} [${c.unit}]` : c.name}
                  {/* Sufijo " #2", " #3"… de las columnas repetidas. */}
                  {c.id.match(/ #\d+$/)?.[0] ?? ""}
                </option>
              ))}
            </optgroup>
          ))}
        </select>
      </label>

      <ResponsiveContainer width="100%" height={320}>
        <LineChart data={data} margin={{ top: 8, right: 16, bottom: 8, left: 8 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#8884" />
          <XAxis
            dataKey="t"
            type="number"
            scale="time"
            domain={["dataMin", "dataMax"]}
            tickFormatter={(t: number) => formatClock(t)}
            tick={{ fill: "currentColor", fontSize: 12 }}
            minTickGap={40}
          />
          <YAxis
            domain={["auto", "auto"]}
            tick={{ fill: "currentColor", fontSize: 12 }}
            width={64}
            label={
              unit
                ? { value: unit, angle: -90, position: "insideLeft", fill: "currentColor" }
                : undefined
            }
          />
          <Tooltip
            labelFormatter={(t) => formatClock(Number(t))}
            formatter={(value) => [withUnit(value), column.name]}
            contentStyle={{ background: "Canvas", color: "CanvasText" }}
          />
          <Line
            type="monotone"
            dataKey="v"
            stroke="var(--accent)"
            strokeWidth={2}
            dot={false}
            isAnimationActive={false}
          />
        </LineChart>
      </ResponsiveContainer>
    </section>
  );
}
