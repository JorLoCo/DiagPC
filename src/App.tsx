import { useEffect, useState } from "react";
import { FileButton } from "./components/FileDrop";
import { SensorChart } from "./components/SensorChart";
import { FindingsList } from "./components/FindingsList";
import { ChatPanel } from "./components/ChatPanel";
import { Welcome } from "./components/Welcome";
import { Sidebar, TABS } from "./components/Sidebar";
import type { Tab } from "./components/Sidebar";
import { EmptyState } from "./components/ui";
import { HomePage } from "./pages/HomePage";
import { ComponentsPage } from "./pages/ComponentsPage";
import { HistoryPage } from "./pages/HistoryPage";
import type { LoadedLog } from "./pages/HistoryPage";
import { parseHwinfo } from "./lib/csv/parseHwinfo";
import { summarize } from "./lib/stats/summarize";
import { formatDuration, formatNumber } from "./lib/format";

/**
 * Estructura principal: barra lateral con las secciones, barra superior con el
 * registro abierto y el contenido de la sección elegida.
 *
 * La sección activa se guarda en la URL (#/componentes) para que funcione el botón
 * Atrás del navegador. Los registros cargados se guardan en memoria (Historial).
 *
 * TODO:
 *  - runRules(log, summary) → guardar hallazgos.
 *  - Pasar findings a FindingsList y resumen y hallazgos a ChatPanel.
 */
export default function App() {
  const [entries, setEntries] = useState<LoadedLog[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [tab, setTab] = useState<Tab>(readTab);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const onHashChange = () => setTab(readTab());
    window.addEventListener("hashchange", onHashChange);
    return () => window.removeEventListener("hashchange", onHashChange);
  }, []);

  const active = entries.find((e) => e.id === activeId) ?? null;

  function navigate(next: Tab) {
    window.location.hash = `/${next}`;
  }

  async function handleFile(file: File) {
    setLoading(true);
    setError(null);
    try {
      const log = await parseHwinfo(file);
      const summary = summarize(log);
      // Si se vuelve a cargar el mismo registro, se reemplaza en lugar de duplicarlo.
      const existing = entries.find(
        (e) =>
          e.log.fileName === log.fileName &&
          e.summary.sampleCount === summary.sampleCount &&
          e.summary.startTimestamp === summary.startTimestamp,
      );
      const id = existing?.id ?? crypto.randomUUID();
      const entry: LoadedLog = { id, log, summary, loadedAt: Date.now() };
      setEntries((prev) => [...prev.filter((e) => e.id !== id), entry]);
      setActiveId(id);
      navigate("inicio");
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      setError(`No se pudo leer "${file.name}": ${message}`);
    } finally {
      setLoading(false);
    }
  }

  function removeEntry(id: string) {
    const rest = entries.filter((e) => e.id !== id);
    setEntries(rest);
    if (id === activeId) {
      const latest = [...rest].sort((a, b) => b.loadedAt - a.loadedAt)[0];
      setActiveId(latest?.id ?? null);
    }
  }

  const title = TABS.find((t) => t.id === tab)?.label ?? "";

  return (
    <div className="layout">
      <Sidebar tab={tab} historyCount={entries.length} />

      <div className="main">
        <header className="topbar">
          <span className="topbar__title">{title}</span>
          {active && (
            <div className="file-chip">
              <div className="file-chip__icon" aria-hidden="true">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                  <path d="M14 2v6h6" />
                  <path d="M8 13h8M8 17h5" />
                </svg>
              </div>
              <div>
                <strong>{active.log.fileName}</strong>
                <small>
                  {formatDuration(active.summary.durationSeconds)} · {formatNumber(active.summary.sampleCount)} muestras
                </small>
              </div>
            </div>
          )}
          <div className="topbar__spacer" />
          {active && <FileButton onFile={handleFile} loading={loading} onReject={setError} />}
        </header>

        <main className="content">
          {/* Sin registro abierto, el error se muestra dentro de la zona de carga. */}
          {active && error && (
            <section className="alert" role="alert">
              {error}
            </section>
          )}
          {renderPage()}
        </main>
      </div>
    </div>
  );

  function renderPage() {
    if (tab === "historial") {
      return (
        <HistoryPage
          entries={entries}
          activeId={activeId}
          onOpen={(id) => {
            setActiveId(id);
            navigate("inicio");
          }}
          onRemove={removeEntry}
        />
      );
    }

    if (!active) {
      if (tab === "inicio") return <Welcome onFile={handleFile} loading={loading} error={error} />;
      return (
        <EmptyState
          title="Primero carga un registro"
          action={
            <button className="btn btn-primary" type="button" onClick={() => navigate("inicio")}>
              Ir a Inicio
            </button>
          }
        >
          Esta sección muestra los datos del registro de HWiNFO que abras.
        </EmptyState>
      );
    }

    const { log, summary } = active;
    switch (tab) {
      case "inicio":
        return <HomePage log={log} summary={summary} onNavigate={navigate} />;
      case "componentes":
        return <ComponentsPage log={log} summary={summary} />;
      case "rendimiento":
        return (
          <>
            <div className="page-head">
              <div>
                <h1>Rendimiento</h1>
                <p>Elige un sensor para ver cómo cambió a lo largo del registro.</p>
              </div>
            </div>
            <SensorChart log={log} summary={summary} />
          </>
        );
      case "diagnostico":
        return (
          <>
            <div className="page-head">
              <div>
                <h1>Diagnóstico</h1>
                <p>Hallazgos de las reglas y explicación con el modelo local de LM Studio.</p>
              </div>
            </div>
            <div className="app-main">
              <FindingsList />
              <ChatPanel />
            </div>
          </>
        );
    }
  }
}

/** Sección indicada en la URL (#/componentes); Inicio si no es válida. */
function readTab(): Tab {
  const id = window.location.hash.replace(/^#\/?/, "");
  return TABS.some((t) => t.id === id) ? (id as Tab) : "inicio";
}
