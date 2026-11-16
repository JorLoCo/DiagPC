import { useMemo } from "react";
import type { HwinfoLog } from "../lib/csv/types";
import type { LogSummary, SensorStats } from "../lib/stats/summarize";
import type { Severity } from "../lib/rules/types";
import { buildOverview, detectComponents, primaryTemp } from "../lib/hardware";
import { TEMP_LIMITS, componentLevel, ramLevel, tempLevel, worst } from "../lib/levels";
import { formatClock, formatDateTime, formatDuration, formatNumber } from "../lib/format";
import { LevelPill, levelClass } from "../components/ui";
import type { Tab } from "../components/Sidebar";

export interface HomePageProps {
  log: HwinfoLog;
  summary: LogSummary;
  onNavigate: (tab: Tab) => void;
}

/** Inicio con registro cargado: veredicto, indicadores, componentes e información del registro. */
export function HomePage({ log, summary, onNavigate }: HomePageProps) {
  const components = useMemo(() => detectComponents(log, summary), [log, summary]);
  const overview = useMemo(() => buildOverview(log, summary, components), [log, summary, components]);
  const rows = useMemo(
    () =>
      components
        .filter((c) => c.kind !== "network")
        .map((c) => ({ component: c, level: componentLevel(c, summary), temp: primaryTemp(c, summary) })),
    [components, summary],
  );

  const cpuTempLevel = tempLevel("cpu", overview.cpuTemp?.max);
  const ramLoadLevel = ramLevel(overview.ramLoad?.max);
  const cpuTempLimit = TEMP_LIMITS.cpu!.crit;

  return (
    <>
      <div className="page-head">
        <div>
          <h1>Tu computadora, de un vistazo</h1>
          <p>{periodText(summary)}</p>
        </div>
        <button className="btn btn-primary" type="button" onClick={() => onNavigate("diagnostico")}>
          Ver diagnóstico
        </button>
      </div>

      <Verdict levels={rows.map((r) => r.level)} names={rows.filter((r) => r.level === "crítico" || r.level === "aviso").map((r) => r.component.label.toLowerCase())} />

      <section className="kpis" aria-label="Indicadores principales">
        <Kpi
          label="Uso del procesador"
          stats={overview.cpuUsage}
          pick="avg"
          unit="%"
          percent={overview.cpuUsage?.avg}
          meta={overview.cpuUsage && `Máximo ${formatNumber(overview.cpuUsage.max)} % · ${overview.cpu?.name ?? ""}`}
        />
        <Kpi
          label="Temperatura del procesador"
          stats={overview.cpuTemp}
          pick="max"
          unit="°C"
          level={cpuTempLevel}
          percent={overview.cpuTemp && (overview.cpuTemp.max / cpuTempLimit) * 100}
          meta={overview.cpuTemp && `Promedio ${formatNumber(overview.cpuTemp.avg)} °C · límite ${cpuTempLimit} °C`}
        />
        <Kpi
          label="Memoria RAM en uso"
          stats={overview.ramLoad}
          pick="max"
          unit="%"
          level={ramLoadLevel}
          percent={overview.ramLoad?.max}
          meta={overview.ramLoad && ramMeta(overview.ramUsedMaxGb, overview.ramTotalGb, overview.ramLoad.avg)}
        />
        <Kpi
          label="Uso de la gráfica"
          stats={overview.gpuUsage}
          pick="avg"
          unit="%"
          percent={overview.gpuUsage?.avg}
          meta={overview.gpuUsage && `Máximo ${formatNumber(overview.gpuUsage.max)} % · ${overview.gpu?.name ?? ""}`}
        />
      </section>

      <section className="panel">
        <div className="panel__head">
          <h2>Componentes detectados</h2>
          <button className="link-btn" type="button" onClick={() => onNavigate("componentes")}>
            Ver detalle
          </button>
        </div>
        {rows.length === 0 ? (
          <p className="muted">No se reconocieron componentes en este registro.</p>
        ) : (
          <div className="table-wrap">
            <table className="table">
              <thead>
                <tr>
                  <th>Componente</th>
                  <th>Modelo</th>
                  <th>Estado</th>
                  <th>Temp. máx.</th>
                </tr>
              </thead>
              <tbody>
                {rows.map(({ component, level, temp }) => (
                  <tr key={component.key}>
                    <td>{component.label}</td>
                    <td>
                      {component.name}
                      {component.detail && <span className="sub">{component.detail}</span>}
                    </td>
                    <td>
                      <LevelPill level={level} />
                    </td>
                    <td className={`num is-${levelClass(tempLevel(component.kind, temp?.max))}`}>
                      {temp ? `${formatNumber(temp.max)} °C` : "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <section className="panel">
        <div className="panel__head">
          <h2>Información del registro</h2>
          {log.warnings.length === 0 ? (
            <span className="pill pill--ok">Lectura sin errores</span>
          ) : (
            <span className="pill pill--warn">{log.warnings.length} advertencia(s) al leer</span>
          )}
        </div>
        <dl className="info">
          <div>
            <dt>Archivo</dt>
            <dd>{log.fileName}</dd>
          </div>
          <div>
            <dt>Duración</dt>
            <dd>{formatDuration(summary.durationSeconds)}</dd>
          </div>
          <div>
            <dt>Muestras</dt>
            <dd>{formatNumber(summary.sampleCount)}</dd>
          </div>
          <div>
            <dt>Sensores</dt>
            <dd>{formatNumber(log.columns.length)} columnas</dd>
          </div>
        </dl>
        {log.warnings.length > 0 && <p className="info__warning">La primera advertencia: {log.warnings[0]}</p>}
      </section>
    </>
  );
}

function periodText(summary: LogSummary): string {
  const { startTimestamp: start, endTimestamp: end } = summary;
  if (start === null || end === null) return "Resumen del registro de sensores de HWiNFO.";
  return `Registro del ${formatDateTime(start)} al ${formatClock(end)}.`;
}

function ramMeta(usedGb: number | null, totalGb: number | null, avgPercent: number): string {
  const parts: string[] = [];
  if (usedGb !== null && totalGb !== null) {
    parts.push(`${formatNumber(usedGb, 1)} GB de ${formatNumber(Math.round(totalGb))} GB`);
  }
  parts.push(`promedio ${formatNumber(avgPercent)} %`);
  return parts.join(" · ");
}

/** Franja con el resultado general según el estado de los componentes. */
function Verdict({ levels, names }: { levels: (Severity | null)[]; names: string[] }) {
  const level = worst(levels);
  if (!level) return null;
  const crit = levels.filter((l) => l === "crítico").length;
  const warn = levels.filter((l) => l === "aviso").length;

  let title: string;
  if (level === "ok") title = "No se detectaron valores fuera de rango";
  else {
    const parts = [];
    if (crit) parts.push(`${crit} ${crit === 1 ? "componente en estado crítico" : "componentes en estado crítico"}`);
    if (warn) parts.push(`${warn} ${warn === 1 ? "componente con aviso" : "componentes con aviso"}`);
    title = parts.join(" y ");
  }
  const text =
    level === "ok"
      ? "Las temperaturas y el uso de memoria se mantuvieron dentro de los límites."
      : `Revisa: ${names.join(", ")}.`;

  return (
    <section className={`verdict verdict--${levelClass(level)}`} aria-label="Resultado general">
      <div className="verdict__icon" aria-hidden="true">
        {level === "ok" ? "✓" : "!"}
      </div>
      <div>
        <strong>{title}</strong>
        <span>{text}</span>
      </div>
    </section>
  );
}

interface KpiProps {
  label: string;
  stats: SensorStats | null;
  /** Qué valor mostrar en grande. */
  pick: "avg" | "max";
  unit: string;
  /** Relleno de la barra, de 0 a 100. */
  percent?: number | null;
  level?: Severity | null;
  meta?: string | null;
}

function Kpi({ label, stats, pick, unit, percent, level = null, meta }: KpiProps) {
  const fill = Math.max(0, Math.min(100, percent ?? 0));
  const tone = level === "ok" ? "" : level ? levelClass(level) : "";
  return (
    <article className="panel kpi">
      <div className="kpi__label">
        {label}
        {level && level !== "ok" && <LevelPill level={level} />}
      </div>
      {stats ? (
        <>
          <div className={`kpi__value${tone ? ` is-${tone}` : ""}`}>
            {formatNumber(stats[pick])} {unit}
            <small>{pick === "avg" ? "promedio" : "máximo"}</small>
          </div>
          <div className={`bar${tone ? ` bar--${tone}` : ""}`} aria-hidden="true">
            <i style={{ width: `${fill}%` }} />
          </div>
          {meta && <div className="kpi__meta">{meta}</div>}
        </>
      ) : (
        <>
          <div className="kpi__value kpi__value--empty">—</div>
          <div className="kpi__meta">Este registro no incluye el sensor.</div>
        </>
      )}
    </article>
  );
}
