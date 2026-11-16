/**
 * Cliente mínimo para el servidor local de LM Studio.
 *
 * LM Studio expone una API compatible con OpenAI. Se usa fetch directo, sin SDK.
 *
 * IMPORTANTE: como la app corre en el navegador, en LM Studio hay que activar
 * "Enable CORS" en la configuración del servidor local (pestaña Developer / Server).
 * Sin eso, el navegador bloquea la petición y fetch falla con un error de red.
 */

export const LLM_ENDPOINT = "http://localhost:1234/v1/chat/completions";

/** Mensaje en el formato de chat de OpenAI. */
export interface ChatMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

/**
 * Envía la conversación al LLM local y devuelve el texto de la respuesta.
 *
 * TODO: implementar.
 *  - POST a LLM_ENDPOINT con body { model, messages, temperature }.
 *    (LM Studio usa el modelo cargado; "model" puede ir con cualquier nombre o el id real.)
 *  - Devolver data.choices[0].message.content.
 *  - Si la respuesta no es ok, lanzar un error con un mensaje claro en español.
 *  - Si fetch falla (servidor apagado o CORS desactivado), explicar qué revisar.
 *  - Más adelante: soporte de streaming con `stream: true`.
 */
export async function askLlm(messages: ChatMessage[]): Promise<string> {
  throw new Error(`TODO: askLlm aún no está implementado (${messages.length} mensajes)`);
}
