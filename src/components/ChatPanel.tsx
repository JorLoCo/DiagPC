import type { LogSummary } from "../lib/stats/summarize";
import type { Finding } from "../lib/rules/types";

/**
 * Panel de conversación con el LLM local.
 *
 * TODO: implementar.
 *  - Botón "Explicar diagnóstico": arma el prompt con buildPrompt y llama a askLlm.
 *  - Permitir preguntas de seguimiento manteniendo el historial de mensajes.
 *  - Mostrar estados: cargando, error (ej. LM Studio apagado o CORS desactivado).
 */
export interface ChatPanelProps {
  summary?: LogSummary;
  findings?: Finding[];
}

export function ChatPanel(_props: ChatPanelProps) {
  return <section className="panel">ChatPanel</section>;
}
