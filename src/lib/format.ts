// Formatos de fecha y duración para mostrar en pantalla.

const pad = (n: number) => String(n).padStart(2, "0");

/** Timestamp (ms epoch) → "HH:MM:SS" en hora local. */
export function formatClock(ms: number): string {
  const d = new Date(ms);
  return `${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
}

/** Timestamp (ms epoch) → "DD/MM/YYYY HH:MM:SS" en hora local. */
export function formatDateTime(ms: number): string {
  const d = new Date(ms);
  return `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()} ${formatClock(ms)}`;
}

/** Segundos → "1 h 2 min 3 s", omitiendo las horas o minutos en cero. */
export function formatDuration(seconds: number): string {
  const total = Math.round(seconds);
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = total % 60;
  const parts: string[] = [];
  if (h) parts.push(`${h} h`);
  if (h || m) parts.push(`${m} min`);
  parts.push(`${s} s`);
  return parts.join(" ");
}
