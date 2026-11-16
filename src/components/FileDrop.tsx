import { useRef, useState } from "react";
import type { ChangeEvent, DragEvent } from "react";

/**
 * Zona para arrastrar o seleccionar el CSV de HWiNFO.
 * Solo acepta archivos .csv (sin importar mayúsculas) y se los pasa a onFile.
 */
export interface FileDropProps {
  onFile?: (file: File) => void;
  /** Nombre del archivo cargado, para mostrarlo. */
  fileName?: string;
  /** true mientras se lee el archivo. */
  loading?: boolean;
}

export function FileDrop({ onFile, fileName, loading = false }: FileDropProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);
  const [rejected, setRejected] = useState<string | null>(null);

  function accept(file: File | undefined) {
    if (!file) return;
    if (!file.name.toLowerCase().endsWith(".csv")) {
      setRejected(`"${file.name}" no es un archivo .CSV.`);
      return;
    }
    setRejected(null);
    onFile?.(file);
  }

  function handleDrop(event: DragEvent<HTMLElement>) {
    event.preventDefault();
    setDragging(false);
    accept(event.dataTransfer.files[0]);
  }

  function handleChange(event: ChangeEvent<HTMLInputElement>) {
    accept(event.target.files?.[0]);
    // Permite volver a elegir el mismo archivo.
    event.target.value = "";
  }

  return (
    <section
      className={`panel file-drop${dragging ? " file-drop--active" : ""}`}
      onDragOver={(event) => {
        event.preventDefault();
        setDragging(true);
      }}
      onDragLeave={() => setDragging(false)}
      onDrop={handleDrop}
    >
      <p>Arrastra aquí el CSV de HWiNFO o</p>
      <button type="button" onClick={() => inputRef.current?.click()} disabled={loading}>
        Elegir archivo
      </button>
      <input
        ref={inputRef}
        type="file"
        accept=".csv,.CSV"
        onChange={handleChange}
        hidden
      />
      {loading && <p className="file-drop__status">Leyendo…</p>}
      {!loading && fileName && <p className="file-drop__status">Cargado: {fileName}</p>}
      {rejected && <p className="file-drop__status error-text">{rejected}</p>}
    </section>
  );
}
