import { FileDrop } from "./FileDrop";

/**
 * Pantalla de bienvenida: se muestra mientras no hay ningún registro cargado.
 * Explica qué hace la app, ofrece la zona de carga y una guía para generar el CSV.
 */
export interface WelcomeProps {
  onFile: (file: File) => void;
  loading: boolean;
  error: string | null;
}

const STEPS = [
  {
    title: "Sube el registro",
    text: "DiagPC lee el CSV y reconoce los sensores de tu procesador, gráfica, memoria y discos.",
  },
  {
    title: "Revisa el diagnóstico",
    text: "Reglas fijas buscan calor excesivo, pérdida de velocidad, memoria llena o voltajes inestables.",
  },
  {
    title: "Pregunta a la IA",
    text: "Un modelo local en LM Studio te explica qué significa cada hallazgo y qué puedes hacer.",
  },
];

export function Welcome({ onFile, loading, error }: WelcomeProps) {
  return (
    <div className="welcome-page">
      <header className="topbar">
        <Brand />
        <a className="topbar__link" href="#ayuda">
          Ayuda
        </a>
      </header>

      <main className="welcome">
        <section className="welcome__hero">
          <h1>Descubre cómo se comporta tu computadora</h1>
          <p>
            Sube un registro de sensores de HWiNFO y DiagPC revisa temperaturas, uso y voltajes,
            detecta problemas y te los explica en lenguaje sencillo.
          </p>
        </section>

        <FileDrop onFile={onFile} loading={loading} error={error} />

        <p className="welcome__privacy">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <rect x="3" y="11" width="18" height="11" rx="2" />
            <path d="M7 11V7a5 5 0 0 1 10 0v4" />
          </svg>
          El archivo se analiza en tu navegador y nunca sale de tu equipo.
        </p>

        <section className="welcome__steps" aria-label="Cómo funciona">
          {STEPS.map((step, i) => (
            <article key={step.title} className="card welcome__step">
              <div className="welcome__num">{i + 1}</div>
              <strong>{step.title}</strong>
              <p>{step.text}</p>
            </article>
          ))}
        </section>

        <details className="card welcome__help" id="ayuda">
          <summary>¿Cómo genero el registro en HWiNFO?</summary>
          <ol>
            <li>
              Abre <strong>HWiNFO</strong> y elige el modo <strong>Sensors-only</strong>.
            </li>
            <li>
              En la ventana de sensores, pulsa el botón <strong>Logging start</strong> (el ícono de
              la hoja con un signo +, en la barra inferior).
            </li>
            <li>
              Elige dónde guardar el archivo <strong>.csv</strong>.
            </li>
            <li>
              Usa tu equipo con normalidad o ejecuta la prueba que quieras revisar (un juego, un
              render, etc.). Entre 10 y 30 minutos suele bastar.
            </li>
            <li>Pulsa el mismo botón para detener el registro y sube aquí el archivo.</li>
          </ol>
        </details>
      </main>
    </div>
  );
}

/** Nombre de la app con su subtítulo. */
export function Brand() {
  return (
    <div className="brand">
      <strong>DiagPC</strong>
      <span>Diagnóstico de hardware</span>
    </div>
  );
}
