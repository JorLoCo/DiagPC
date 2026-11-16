// Piezas de interfaz pequeñas que se repiten en varias páginas.

import type { ReactNode } from "react";
import type { Severity } from "../lib/rules/types";

const LEVEL_TEXT: Record<Severity, string> = { ok: "Correcto", aviso: "Aviso", crítico: "Crítico" };
const LEVEL_CLASS: Record<Severity, string> = { ok: "ok", aviso: "warn", crítico: "crit" };

/** Sufijo de clase CSS para un nivel: "ok", "warn", "crit" o "none". */
export function levelClass(level: Severity | null): string {
  return level ? LEVEL_CLASS[level] : "none";
}

/** Etiqueta de estado: Correcto, Aviso, Crítico o Sin datos. */
export function LevelPill({ level }: { level: Severity | null }) {
  return (
    <span className={`pill pill--${levelClass(level)}`}>{level ? LEVEL_TEXT[level] : "Sin datos"}</span>
  );
}

/** Mensaje centrado para páginas sin contenido. */
export function EmptyState({
  title,
  children,
  action,
}: {
  title: string;
  children?: ReactNode;
  action?: ReactNode;
}) {
  return (
    <section className="panel empty-state">
      <h2>{title}</h2>
      {children && <p>{children}</p>}
      {action}
    </section>
  );
}
