# DiagPC

App web que lee el CSV de registro de sensores de HWiNFO, muestra gráficas, detecta
problemas con reglas fijas (sin IA) y usa un LLM local para explicar el diagnóstico
en lenguaje simple.

Todo corre en el navegador: no hay backend y el CSV nunca sale de tu equipo.

> Estado: solo estructura. Las funciones tienen firma y notas `TODO`, sin implementación.

## Stack

- React + TypeScript + Vite
- [papaparse](https://www.papaparse.com/) para leer el CSV
- [recharts](https://recharts.org/) para las gráficas
- LM Studio en modo servidor local (API compatible con OpenAI), con `fetch` directo

## Flujo

```
CSV → parseHwinfo → HwinfoLog → summarize → LogSummary → runRules → Finding[]
                                                    └──────────┬──────────┘
                                                         buildPrompt → askLlm → explicación
```

## Carpetas

| Ruta | Qué contiene |
|------|--------------|
| `src/lib/csv/` | Lectura del CSV. `types.ts` define `Sample`, `SensorColumn` y `HwinfoLog`; `parseHwinfo.ts` convierte el archivo en esos tipos y resuelve las rarezas del formato de HWiNFO. |
| `src/lib/stats/` | `summarize.ts` calcula mínimo, máximo y promedio de cada sensor, y cuenta cuánto tiempo estuvieron activos los sensores Yes/No. |
| `src/lib/rules/` | Reglas de diagnóstico sin IA. `types.ts` define `Finding`; `index.ts` ejecuta todas; `cpu.ts`, `gpu.ts`, `power.ts` y `memory.ts` agrupan las reglas por componente. |
| `src/lib/llm/` | Conexión con el LLM local. `client.ts` hace la petición a LM Studio; `prompt.ts` arma el texto con el resumen y los hallazgos. |
| `src/components/` | Componentes de interfaz: carga de archivo, gráfica, lista de hallazgos y chat. |
| `src/App.tsx` | Pantalla principal que acomoda los componentes y conecta el flujo. |
| `samples/` | Aquí van tus CSV reales de prueba. Están ignorados por git. |

## Cómo ejecutar (cuando haya implementación)

```bash
npm install
npm run dev
```

## LM Studio

1. Carga un modelo en LM Studio.
2. Inicia el servidor local (por defecto en `http://localhost:1234`).
3. Activa **Enable CORS** en la configuración del servidor. Sin esto, el navegador
   bloquea las peticiones.
