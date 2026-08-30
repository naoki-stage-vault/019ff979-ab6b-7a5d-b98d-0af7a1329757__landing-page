import type { GenerateResult } from "./types";

const API_BASE = "https://generativelanguage.googleapis.com/v1beta";
const MODEL = "gemini-2.5-flash";

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

export async function generateSvg(req: GenerateRequest): Promise<GenerateResult> {
  let res: Response;
  try {
    res = await fetch(
      `${API_BASE}/models/${MODEL}:generateContent?key=${encodeURIComponent(req.key.trim())}`,
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
    if (res.status === 429) {
      return {
        ok: false,
        message: "Se agotó la cuota de la API. Espera un momento y vuelve a intentarlo.",
        kind: "quota",
      };
    }
    if (res.status === 400 || res.status === 403) {
      return {
        ok: false,
        message: "La clave de API no es válida. Revísala en la configuración.",
        kind: "invalid-key",
      };
    }
    return {
      ok: false,
      message: `Algo salió mal (${res.status}). Inténtalo de nuevo.`,
      kind: "unknown",
    };
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
