import { useState } from "react";
import { FileDrop } from "./components/FileDrop";
import { SensorChart } from "./components/SensorChart";
import { FindingsList } from "./components/FindingsList";
import { ChatPanel } from "./components/ChatPanel";
import { parseHwinfo } from "./lib/csv/parseHwinfo";
import type { HwinfoLog } from "./lib/csv/types";
import { summarize } from "./lib/stats/summarize";
import type { LogSummary } from "./lib/stats/summarize";
import { formatDateTime, formatDuration } from "./lib/format";

/**
 * Pantalla principal.
 *
 * Hecho: FileDrop → parseHwinfo → summarize → estado; resumen general, gráfica
 * y errores de lectura en pantalla.
 *
 * TODO:
 *  - runRules(log, summary) → guardar hallazgos.
 *  - Pasar findings a FindingsList y resumen y hallazgos a ChatPanel.
 */
export default function App() {
  const [log, setLog] = useState<HwinfoLog | null>(null);
  const [summary, setSummary] = useState<LogSummary | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleFile(file: File) {
    setLoading(true);
    setError(null);
    try {
      const parsed = await parseHwinfo(file);
      setLog(parsed);
      setSummary(summarize(parsed));
    } catch (err) {
      setLog(null);
      setSummary(null);
      const message = err instanceof Error ? err.message : String(err);
      setError(`No se pudo leer "${file.name}": ${message}`);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="app">
      <header className="app-header">
        <h1>DiagPC</h1>
        <p>Carga el registro CSV de HWiNFO para revisar los sensores de tu equipo.</p>
      </header>

      <FileDrop onFile={handleFile} fileName={log?.fileName} loading={loading} />

      {error && (
        <section className="panel error-panel" role="alert">
          {error}
        </section>
      )}

      {log && summary && <LogOverview log={log} summary={summary} />}

      <main className="app-main">
        <div className="app-left">
          <SensorChart log={log ?? undefined} summary={summary ?? undefined} />
          <FindingsList />
        </div>
        <aside className="app-right">
          <ChatPanel />
        </aside>
      </main>
    </div>
  );
}

/** Datos generales del registro cargado. */
function LogOverview({ log, summary }: { log: HwinfoLog; summary: LogSummary }) {
  const items: [string, string][] = [
    ["Archivo", log.fileName],
    ["Duración", formatDuration(summary.durationSeconds)],
    ["Muestras", String(summary.sampleCount)],
    ["Inicio", summary.startTimestamp !== null ? formatDateTime(summary.startTimestamp) : "—"],
    ["Fin", summary.endTimestamp !== null ? formatDateTime(summary.endTimestamp) : "—"],
  ];

  return (
    <section className="panel log-overview">
      <dl>
        {items.map(([label, value]) => (
          <div key={label}>
            <dt>{label}</dt>
            <dd>{value}</dd>
          </div>
        ))}
      </dl>
      {log.warnings.length > 0 && (
        <p className="error-text">
          {log.warnings.length} advertencia(s) al leer el archivo. La primera: {log.warnings[0]}
        </p>
      )}
    </section>
  );
}
