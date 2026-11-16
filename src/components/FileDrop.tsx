import { useRef, useState } from "react";
import type { ChangeEvent, DragEvent, KeyboardEvent } from "react";

/** true si el nombre termina en .csv (sin importar mayúsculas). */
function isCsv(file: File) {
  return file.name.toLowerCase().endsWith(".csv");
}

/** Mensaje para un archivo que no es CSV. */
function notCsvMessage(file: File) {
  return `"${file.name}" no es un archivo CSV. Exporta el registro desde HWiNFO en formato .csv.`;
}

/**
 * Zona grande para arrastrar o seleccionar el CSV de HWiNFO (pantalla de bienvenida).
 * Solo acepta archivos .csv y se los pasa a onFile.
 */
export interface FileDropProps {
  onFile?: (file: File) => void;
  /** true mientras se lee el archivo. */
  loading?: boolean;
  /** Error al leer el último archivo (lo pone App si parseHwinfo falla). */
  error?: string | null;
}

export function FileDrop({ onFile, loading = false, error = null }: FileDropProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);
  const [rejected, setRejected] = useState<string | null>(null);
  const [pendingName, setPendingName] = useState<string | null>(null);

  function accept(file: File | undefined) {
    if (!file || loading) return;
    if (!isCsv(file)) {
      setRejected(notCsvMessage(file));
      return;
    }
    setRejected(null);
    setPendingName(file.name);
    onFile?.(file);
  }

  function open() {
    if (!loading) inputRef.current?.click();
  }

  function handleDrop(event: DragEvent<HTMLElement>) {
    event.preventDefault();
    setDragging(false);
    accept(event.dataTransfer.files[0]);
  }

  function handleDragLeave(event: DragEvent<HTMLElement>) {
    // Ignorar el dragleave que se dispara al pasar sobre un elemento hijo.
    if (!event.currentTarget.contains(event.relatedTarget as Node | null)) setDragging(false);
  }

  function handleChange(event: ChangeEvent<HTMLInputElement>) {
    accept(event.target.files?.[0]);
    // Permite volver a elegir el mismo archivo.
    event.target.value = "";
  }

  function handleKeyDown(event: KeyboardEvent<HTMLElement>) {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      open();
    }
  }

  const message = rejected ?? (loading ? null : error);
  const className = [
    "file-drop",
    dragging && "file-drop--over",
    message && "file-drop--error",
    loading && "file-drop--loading",
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <section
      className={className}
      role="button"
      tabIndex={0}
      aria-label="Seleccionar archivo CSV de HWiNFO"
      aria-busy={loading}
      onClick={open}
      onKeyDown={handleKeyDown}
      onDragOver={(event) => {
        event.preventDefault();
        setDragging(true);
      }}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      <div className="file-drop__icon" aria-hidden="true">
        {message ? <AlertIcon /> : <UploadIcon />}
      </div>

      {loading ? (
        <div>
          <h2>Leyendo {pendingName ?? "archivo"}…</h2>
          <p>Esto puede tardar unos segundos si el registro es largo.</p>
          <div className="progress progress--indeterminate" aria-hidden="true">
            <i />
          </div>
        </div>
      ) : message ? (
        <div role="alert">
          <h2>No se pudo leer el archivo</h2>
          <p className="error-text">{message}</p>
        </div>
      ) : (
        <div>
          <h2>Arrastra aquí tu archivo CSV</h2>
          <p>o selecciónalo desde tu equipo</p>
        </div>
      )}

      {!loading && (
        <button
          type="button"
          className="btn btn-primary"
          onClick={(event) => {
            event.stopPropagation();
            open();
          }}
        >
          {message ? "Elegir otro archivo" : "Seleccionar archivo"}
        </button>
      )}
      <small>Registro de sensores de HWiNFO en formato .csv</small>

      <input ref={inputRef} type="file" accept=".csv,.CSV" onChange={handleChange} hidden />
    </section>
  );
}

/**
 * Botón compacto para cargar otro CSV cuando ya hay un registro abierto (barra superior).
 */
export interface FileButtonProps {
  onFile?: (file: File) => void;
  loading?: boolean;
  /** Se llama si el archivo elegido no es CSV. */
  onReject?: (message: string) => void;
}

export function FileButton({ onFile, loading = false, onReject }: FileButtonProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  function handleChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    if (!isCsv(file)) {
      onReject?.(notCsvMessage(file));
      return;
    }
    onFile?.(file);
  }

  return (
    <>
      <button
        type="button"
        className="btn btn-secondary"
        onClick={() => inputRef.current?.click()}
        disabled={loading}
      >
        {loading ? "Leyendo…" : "Cargar otro registro"}
      </button>
      <input ref={inputRef} type="file" accept=".csv,.CSV" onChange={handleChange} hidden />
    </>
  );
}

function UploadIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
      <path d="M17 8l-5-5-5 5" />
      <path d="M12 3v12" />
    </svg>
  );
}

function AlertIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
      <path d="M12 8v4M12 16h.01" />
    </svg>
  );
}
