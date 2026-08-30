import type { GenerateResult } from "./types";
import { KEYS, load, remove, save } from "./storage";

const API_BASE = "https://generativelanguage.googleapis.com/v1beta";
const FALLBACK_MODEL = "gemini-2.5-flash";

export interface GenerateRequest {
  key: string;
  systemInstruction: string;
  userPrompt: string;
  temperature?: number;
}

export type KeyValidation =
  | { ok: true }
  | { ok: false; message: string };

/** Comprueba que la clave sea válida listando los modelos disponibles. */
export async function validateKey(key: string): Promise<KeyValidation> {
  const trimmed = key.trim();
  if (!trimmed) {
    return { ok: false, message: "Escribe tu clave de API primero." };
  }
  let res: Response;
  try {
    res = await fetch(`${API_BASE}/models?key=${encodeURIComponent(trimmed)}`);
  } catch {
    return { ok: false, message: "Sin conexión. Revisa tu internet e inténtalo de nuevo." };
  }
  if (res.ok) return { ok: true };
  if (res.status === 429) {
    return { ok: false, message: "Cuota agotada. Inténtalo de nuevo en unos minutos." };
  }
  if (res.status === 400 || res.status === 403) {
    return {
      ok: false,
      message: "La clave no es válida. Revísala: debe estar completa y sin espacios.",
    };
  }
  return { ok: false, message: "No pudimos validar la clave. Inténtalo de nuevo." };
}

/** Nombres de modelos disponibles para la clave (los que soportan generateContent). */
async function fetchModelNames(key: string): Promise<string[]> {
  try {
    const res = await fetch(`${API_BASE}/models?key=${encodeURIComponent(key.trim())}`);
    if (!res.ok) return [];
    const data = (await res.json()) as {
      models?: { name?: string; supportedGenerationMethods?: string[] }[];
    };
    return (data.models ?? [])
      .filter(
        (m) =>
          Array.isArray(m.supportedGenerationMethods) &&
          m.supportedGenerationMethods.includes("generateContent")
      )
      .map((m) => (m.name ?? "").replace(/^models\//, ""))
      .filter(Boolean);
  } catch {
    return [];
  }
}

/** Preferimos modelos flash recientes; los de imagen no sirven para generar SVG. */
function scoreModel(name: string): number {
  let s = 0;
  if (/flash/i.test(name)) s += 10;
  if (/^gemini-(3|2\.5|2\.0)-flash/i.test(name)) s += 6;
  if (/2\.5/.test(name)) s += 3;
  if (/2\.0/.test(name)) s += 2;
  if (/flash-lite/i.test(name)) s += 1;
  if (/image|imagen/i.test(name)) s -= 10;
  if (/thinking/i.test(name)) s -= 5;
  if (/preview/i.test(name)) s -= 1;
  return s;
}

/** Elige el mejor modelo disponible para la clave. */
export async function pickModel(key: string): Promise<string> {
  const models = await fetchModelNames(key);
  if (models.length === 0) return FALLBACK_MODEL;
  const best = [...models].sort((a, b) => scoreModel(b) - scoreModel(a))[0];
  return best || FALLBACK_MODEL;
}

async function generateWithModel(
  req: GenerateRequest,
  model: string
): Promise<GenerateResult> {
  let res: Response;
  try {
    res = await fetch(
      `${API_BASE}/models/${model}:generateContent?key=${encodeURIComponent(req.key.trim())}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          systemInstruction: { parts: [{ text: req.systemInstruction }] },
          contents: [{ role: "user", parts: [{ text: req.userPrompt }] }],
          generationConfig: {
            temperature: req.temperature ?? 0.9,
            maxOutputTokens: 8192,
          },
        }),
      }
    );
  } catch {
    return { ok: false, message: "Sin conexión. Revisa tu internet.", kind: "network" };
  }

  if (!res.ok) {
    let apiMsg = "";
    try {
      const body = (await res.json()) as { error?: { message?: string } };
      apiMsg = body.error?.message ?? "";
    } catch {
      // sin cuerpo JSON: usamos el estado HTTP
    }
    const notFound = res.status === 404 || /not found|not_found/i.test(apiMsg);
    if (notFound) {
      return {
        ok: false,
        message: "El modelo de Gemini no está disponible para tu cuenta. Buscamos otro…",
        kind: "unknown",
        notFound: true,
      };
    }
    if (res.status === 429 || /quota|resource exhausted/i.test(apiMsg)) {
      return {
        ok: false,
        message: "Se agotó la cuota de la API. Espera un momento y vuelve a intentarlo.",
        kind: "quota",
      };
    }
    if (res.status === 400 || res.status === 403) {
      if (/key|api key/i.test(apiMsg)) {
        return {
          ok: false,
          message: "La clave de API no es válida. Revísala en la configuración.",
          kind: "invalid-key",
        };
      }
      return { ok: false, message: apiMsg || "La solicitud fue rechazada.", kind: "unknown" };
    }
    return { ok: false, message: apiMsg || "Algo salió mal. Inténtalo de nuevo.", kind: "unknown" };
  }

  let data: {
    promptFeedback?: { blockReason?: string };
    candidates?: { finishReason?: string; content?: { parts?: { text?: string }[] } }[];
    error?: { message?: string };
  };
  try {
    data = await res.json();
  } catch {
    return { ok: false, message: "La respuesta del modelo no se pudo leer.", kind: "unknown" };
  }

  if (data.error?.message) {
    return { ok: false, message: data.error.message, kind: "unknown" };
  }
  if (data.promptFeedback?.blockReason) {
    return {
      ok: false,
      message: "La solicitud fue bloqueada por las políticas de seguridad. Prueba con otra descripción.",
      kind: "blocked",
    };
  }
  const candidate = data.candidates?.[0];
  if (candidate?.finishReason === "SAFETY") {
    return {
      ok: false,
      message: "La solicitud fue bloqueada por las políticas de seguridad. Prueba con otra descripción.",
      kind: "blocked",
    };
  }
  const text = (candidate?.content?.parts ?? []).map((p) => p.text ?? "").join("").trim();
  if (!text) {
    return { ok: false, message: "El modelo no devolvió ningún dibujo.", kind: "unknown" };
  }

  const svg = extractSvg(text);
  if (!svg || !isValidSvg(svg)) {
    return { ok: false, message: "El modelo no devolvió un dibujo válido.", kind: "invalid-svg" };
  }
  return { ok: true, svg };
}

/**
 * Genera el SVG. Usa el modelo guardado en caché; si la cuenta no lo tiene
 * disponible (404), redescubre el modelo y reintenta una vez.
 */
export async function generateSvg(req: GenerateRequest): Promise<GenerateResult> {
  let model = load<string | null>(KEYS.model, null);
  if (!model) {
    model = await pickModel(req.key);
    save(KEYS.model, model);
  }
  let res = await generateWithModel(req, model);
  if (!res.ok && res.notFound) {
    remove(KEYS.model);
    model = await pickModel(req.key);
    save(KEYS.model, model);
    res = await generateWithModel(req, model);
    if (!res.ok && res.notFound) {
      return {
        ok: false,
        message:
          "Tu clave de Gemini no tiene ningún modelo disponible para dibujos. Revisa la configuración de tu cuenta.",
        kind: "unknown",
      };
    }
  }
  return res;
}

/** Extrae el primer bloque <svg>…</svg> del texto (ignorando cercos ```). */
export function extractSvg(text: string): string | null {
  let t = text.trim();
  const fence = t.match(/```(?:svg|xml)?\s*([\s\S]*?)```/i);
  if (fence) t = fence[1].trim();
  const start = t.indexOf("<svg");
  const end = t.lastIndexOf("</svg>");
  if (start === -1 || end === -1 || end <= start) return null;
  return t.slice(start, end + "</svg>".length);
}

export function isValidSvg(svg: string): boolean {
  if (typeof window === "undefined" || typeof DOMParser === "undefined") {
    return svg.includes("<svg") && svg.includes("</svg>");
  }
  try {
    const doc = new DOMParser().parseFromString(svg, "image/svg+xml");
    return !doc.querySelector("parsererror") && !!doc.querySelector("svg");
  } catch {
    return false;
  }
}
