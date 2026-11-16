import { formatClock, formatDateTime, formatDuration, formatNumber } from "../lib/format";
import type { HwinfoLog } from "../lib/csv/types";
import type { LogSummary } from "../lib/stats/summarize";
import { EmptyState } from "../components/ui";

/** Registro cargado durante la sesión. */
export interface LoadedLog {
  id: string;
  log: HwinfoLog;
  summary: LogSummary;
  /** Momento en que se cargó (ms epoch). */
  loadedAt: number;
}

export interface HistoryPageProps {
  entries: LoadedLog[];
  activeId: string | null;
  onOpen: (id: string) => void;
  onRemove: (id: string) => void;
}

/**
 * Registros cargados en esta sesión, del más reciente al más antiguo.
 *
 * TODO: guardar el historial entre sesiones (ej. resúmenes en IndexedDB).
 */
export function HistoryPage({ entries, activeId, onOpen, onRemove }: HistoryPageProps) {
  if (entries.length === 0) {
    return (
      <EmptyState title="Todavía no hay registros">
        Los registros que cargues aparecerán aquí para que puedas volver a ellos o compararlos.
      </EmptyState>
    );
  }

  const sorted = [...entries].sort((a, b) => b.loadedAt - a.loadedAt);

  return (
    <>
      <div className="page-head">
        <div>
          <h1>Historial</h1>
          <p>Registros cargados en esta sesión. Se borran al cerrar o recargar la página.</p>
        </div>
      </div>

      <section className="panel">
        <div className="table-wrap">
          <table className="table">
            <thead>
              <tr>
                <th>Archivo</th>
                <th>Fecha del registro</th>
                <th>Duración</th>
                <th className="num">Muestras</th>
                <th>Cargado</th>
                <th aria-label="Acciones" />
              </tr>
            </thead>
            <tbody>
              {sorted.map(({ id, log, summary, loadedAt }) => {
                const active = id === activeId;
                return (
                  <tr key={id} className={active ? "is-active" : undefined}>
                    <td>
                      {log.fileName}
                      {active && <span className="sub">Abierto ahora</span>}
                    </td>
                    <td>{summary.startTimestamp !== null ? formatDateTime(summary.startTimestamp) : "—"}</td>
                    <td>{formatDuration(summary.durationSeconds)}</td>
                    <td className="num">{formatNumber(summary.sampleCount)}</td>
                    <td>{formatClock(loadedAt)}</td>
                    <td className="actions">
                      {!active && (
                        <button className="btn btn-secondary btn--small" type="button" onClick={() => onOpen(id)}>
                          Abrir
                        </button>
                      )}
                      <button className="link-btn link-btn--danger" type="button" onClick={() => onRemove(id)}>
                        Quitar
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>
    </>
  );
}
