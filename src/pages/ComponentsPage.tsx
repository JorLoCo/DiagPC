import { useMemo } from "react";
import type { HwinfoLog } from "../lib/csv/types";
import type { LogSummary } from "../lib/stats/summarize";
import { detectComponents, primaryTemp } from "../lib/hardware";
import { componentLevel, tempLevel } from "../lib/levels";
import { formatNumber } from "../lib/format";
import { EmptyState, LevelPill, levelClass } from "../components/ui";

export interface ComponentsPageProps {
  log: HwinfoLog;
  summary: LogSummary;
}

/** Decimales según la unidad: los voltajes necesitan más precisión. */
function decimalsFor(unit: string): number {
  if (unit === "V") return 3;
  if (unit === "°C" || unit === "W" || unit === "%" || unit === "A") return 1;
  return 0;
}

/** Una tarjeta por componente, con su estado y todos sus sensores numéricos. */
export function ComponentsPage({ log, summary }: ComponentsPageProps) {
  const components = useMemo(() => detectComponents(log, summary), [log, summary]);

  if (components.length === 0) {
    return <EmptyState title="No se reconocieron componentes">Este registro no tiene grupos de sensores conocidos.</EmptyState>;
  }

  return (
    <>
      <div className="page-head">
        <div>
          <h1>Componentes</h1>
          <p>
            {components.length} componentes detectados en {log.fileName}.
          </p>
        </div>
      </div>

      <div className="component-list">
        {components.map((component) => {
          const temp = primaryTemp(component, summary);
          const sensors = component.columns.filter((c) => summary.sensors[c.id]);
          return (
            <section key={component.key} className="panel component-card">
              <div className="component-card__head">
                <div>
                  <span className="component-card__kind">{component.label}</span>
                  <h2>{component.name}</h2>
                  {component.detail && <span className="sub">{component.detail}</span>}
                </div>
                <LevelPill level={componentLevel(component, summary)} />
              </div>

              <dl className="info">
                <div>
                  <dt>Temperatura máxima</dt>
                  <dd className={`is-${levelClass(tempLevel(component.kind, temp?.max))}`}>
                    {temp ? `${formatNumber(temp.max, 1)} °C` : "—"}
                  </dd>
                </div>
                <div>
                  <dt>Temperatura promedio</dt>
                  <dd>{temp ? `${formatNumber(temp.avg, 1)} °C` : "—"}</dd>
                </div>
                <div>
                  <dt>Sensores</dt>
                  <dd>{sensors.length}</dd>
                </div>
              </dl>

              {sensors.length > 0 && (
                <details className="component-card__sensors">
                  <summary>Ver los {sensors.length} sensores</summary>
                  <div className="table-wrap">
                    <table className="table table--compact">
                      <thead>
                        <tr>
                          <th>Sensor</th>
                          <th className="num">Mín.</th>
                          <th className="num">Prom.</th>
                          <th className="num">Máx.</th>
                        </tr>
                      </thead>
                      <tbody>
                        {sensors.map((column) => {
                          const s = summary.sensors[column.id];
                          const d = decimalsFor(s.unit);
                          const unit = s.unit ? ` ${s.unit}` : "";
                          return (
                            <tr key={column.id}>
                              <td>{column.name}</td>
                              <td className="num">{formatNumber(s.min, d) + unit}</td>
                              <td className="num">{formatNumber(s.avg, d) + unit}</td>
                              <td className="num">{formatNumber(s.max, d) + unit}</td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </details>
              )}
            </section>
          );
        })}
      </div>
    </>
  );
}
