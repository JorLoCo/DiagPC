/** Secciones de la app. El id se usa también en la URL (#/componentes). */
export type Tab = "inicio" | "componentes" | "rendimiento" | "diagnostico" | "historial";

export const TABS: { id: Tab; label: string }[] = [
  { id: "inicio", label: "Inicio" },
  { id: "componentes", label: "Componentes" },
  { id: "rendimiento", label: "Rendimiento" },
  { id: "diagnostico", label: "Diagnóstico" },
  { id: "historial", label: "Historial" },
];

export interface SidebarProps {
  tab: Tab;
  /** Cantidad de registros cargados en la sesión (se muestra junto a Historial). */
  historyCount: number;
}

/** Barra lateral con el nombre de la app y la navegación entre secciones. */
export function Sidebar({ tab, historyCount }: SidebarProps) {
  return (
    <aside className="sidebar">
      <div className="brand">
        <strong>DiagPC</strong>
        <span>Diagnóstico de hardware</span>
      </div>
      <nav className="nav" aria-label="Secciones">
        {TABS.map((t) => (
          <a key={t.id} href={`#/${t.id}`} aria-current={t.id === tab ? "page" : undefined}>
            {t.label}
            {t.id === "historial" && historyCount > 0 && <span className="nav__count">{historyCount}</span>}
          </a>
        ))}
      </nav>
      <p className="sidebar__note">El análisis se hace en tu navegador. Tus archivos no salen del equipo.</p>
    </aside>
  );
}
