import { useState } from "react";
import { FileButton } from "./components/FileDrop";
import { SensorChart } from "./components/SensorChart";
import { FindingsList } from "./components/FindingsList";
import { ChatPanel } from "./components/ChatPanel";
import { Brand, Welcome } from "./components/Welcome";
import { parseHwinfo } from "./lib/csv/parseHwinfo";
import type { HwinfoLog } from "./lib/csv/types";
import { summarize } from "./lib/stats/summarize";
import type { LogSummary } from "./lib/stats/summarize";
import { formatDateTime, formatDuration } from "./lib/format";

/**
 * Pantalla principal.
 *
 * Sin registro cargado muestra la bienvenida (Welcome). Con registro, la barra
 * superior con el archivo y el panel con el resumen, la gráfica y los hallazgos.
 *
 * Hecho: FileDrop → parseHwinfo → summarize → estado; resumen general, gráfica
 * y errores de lectura en pantalla.
 *
 * TODO:
 *  - runRules(log, summary) → guardar hallazgos.
 *  - Pasar findings a FindingsList y resumen y hallazgos a ChatPanel.
 *  - Panel de inicio del prototipo: indicadores y tabla de componentes.
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
      // Si falla, se vuelve a la bienvenida y el error se muestra en la zona de carga.
      setLog(null);
      setSummary(null);
      const message = err instanceof Error ? err.message : String(err);
      setError(`No se pudo leer "${file.name}": ${message}`);
    } finally {
      setLoading(false);
    }
  }

  if (!log || !summary) {
    return <Welcome onFile={handleFile} loading={loading} error={error} />;
  }

  return (
    <div className="app">
      <header className="topbar">
        <Brand />
        <div className="file-chip">
          <div className="file-chip__icon" aria-hidden="true">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
              <path d="M14 2v6h6" />
              <path d="M8 13h8M8 17h5" />
            </svg>
          </div>
          <div>
            <strong>{log.fileName}</strong>
            <small>
              Registro de HWiNFO · {formatDuration(summary.durationSeconds)} ·{" "}
              {summary.sampleCount.toLocaleString("es")} muestras
            </small>
          </div>
        </div>
        <div className="topbar__spacer" />
        <FileButton onFile={handleFile} loading={loading} onReject={setError} />
      </header>

      <main className="content">
        <div className="page-head">
          <h1>Tu computadora, de un vistazo</h1>
          <p>Resumen del registro de sensores de HWiNFO.</p>
        </div>

        {error && (
          <section className="alert" role="alert">
            {error}
          </section>
        )}

        <LogOverview log={log} summary={summary} />

        <div className="app-main">
          <div className="app-left">
            <SensorChart log={log} summary={summary} />
            <FindingsList />
          </div>
          <aside className="app-right">
            <ChatPanel />
          </aside>
        </div>
      </main>
    </div>
  );
}

/** Datos generales del registro cargado. */
function LogOverview({ log, summary }: { log: HwinfoLog; summary: LogSummary }) {
  const items: [string, string][] = [
    ["Archivo", log.fileName],
    ["Duración", formatDuration(summary.durationSeconds)],
    ["Muestras", summary.sampleCount.toLocaleString("es")],
    ["Inicio", summary.startTimestamp !== null ? formatDateTime(summary.startTimestamp) : "—"],
    ["Fin", summary.endTimestamp !== null ? formatDateTime(summary.endTimestamp) : "—"],
  ];

  return (
    <section className="panel log-overview">
      <div className="panel__head">
        <h2>Información del registro</h2>
        {log.warnings.length === 0 ? (
          <span className="pill pill--ok">Lectura sin errores</span>
        ) : (
          <span className="pill pill--warn">{log.warnings.length} advertencia(s)</span>
        )}
      </div>
      <dl>
        {items.map(([label, value]) => (
          <div key={label}>
            <dt>{label}</dt>
            <dd>{value}</dd>
          </div>
        ))}
      </dl>
      {log.warnings.length > 0 && (
        <p className="log-overview__warning">La primera advertencia: {log.warnings[0]}</p>
      )}
    </section>
  );
}
