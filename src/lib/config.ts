import type { DoodleStyle, PaletteId, StrokeWidth } from "./types";

export const STYLES: {
  id: DoodleStyle;
  label: string;
  hint: string;
  instruction: string;
}[] = [
  {
    id: "line",
    label: "Línea simple",
    hint: "Solo contorno",
    instruction:
      "Solo contornos: trazo continuo a mano alzada, sin relleno en las formas (fill=\"none\").",
  },
  {
    id: "pastel",
    label: "Relleno pastel",
    hint: "Contorno + color",
    instruction:
      "Contorno definido más relleno plano en tonos pastel suaves, sin degradados ni sombras.",
  },
  {
    id: "sticker",
    label: "Sticker",
    hint: "Como pegatina",
    instruction:
      "Estilo pegatina: contorno grueso y uniforme, relleno interior liso, bordes cerrados y forma compacta centrada.",
  },
  {
    id: "icon",
    label: "Icono",
    hint: "Minimalista",
    instruction:
      "Icono minimalista: pocos elementos, trazos simples y limpios, centrado y con aire alrededor, ideal para una interfaz.",
  },
  {
    id: "scene",
    label: "Escena",
    hint: "Varias cosas",
    instruction:
      "Escena completa: varios elementos relacionados que componen una viñeta, con un fondo muy simple (suelo, marco o paisaje minimalista).",
  },
];

export const STROKES: {
  id: StrokeWidth;
  label: string;
  instruction: string;
}[] = [
  { id: "fino", label: "Fino", instruction: "trazo fino (≈1.5 px), delicado" },
  { id: "medio", label: "Medio", instruction: "trazo medio (≈3 px), equilibrado" },
  { id: "grueso", label: "Grueso", instruction: "trazo grueso (≈5 px), contundente" },
];

export const PALETTES: {
  id: PaletteId;
  label: string;
  instruction: string;
  swatch: string[];
}[] = [
  {
    id: "mono",
    label: "Monocromo",
    instruction: "paleta monocroma: negro y grises",
    swatch: ["#1f1e1d", "#57534e", "#a8a29e", "#e7e5e4"],
  },
  {
    id: "pastel",
    label: "Pastel",
    instruction: "paleta pastel: rosa, celeste, menta, lavanda y amarillo muy suaves",
    swatch: ["#f9a8d4", "#93c5fd", "#86efac", "#c4b5fd", "#fde68a"],
  },
  {
    id: "calido",
    label: "Cálido",
    instruction: "paleta cálida: terracota, naranja, ámbar y crema",
    swatch: ["#c2410c", "#ea580c", "#f59e0b", "#fef3c7"],
  },
  {
    id: "frio",
    label: "Frío",
    instruction: "paleta fría: azules, turquesa y gris azulado",
    swatch: ["#1d4ed8", "#3b82f6", "#0d9488", "#94a3b8"],
  },
  {
    id: "natural",
    label: "Natural",
    instruction: "paleta natural: verde oliva, marrón, beige y salvia",
    swatch: ["#4d7c0f", "#92400e", "#d6c7a8", "#a3b18a"],
  },
];

export const EXAMPLES = [
  "un gato durmiendo sobre libros",
  "una planta en maceta",
  "una taza de café humeante",
  "un cohete despegando",
  "una nube con arcoíris",
  "una bicicleta vintage",
  "un cactus con lentes",
  "una tarta de cumpleaños",
  "un búho leyendo un libro",
  "unas flores en un jarrón",
  "un perro con corbata",
  "una lámpara de escritorio",
];

export const STROKE_PRESETS = [
  "#1f1e1d",
  "#3f3f46",
  "#787774",
  "#2383e2",
  "#c2410c",
  "#15803d",
  "#7c3aed",
  "#e11d48",
];

export const FILL_PRESETS = [
  "#f9a8d4",
  "#93c5fd",
  "#86efac",
  "#c4b5fd",
  "#fde68a",
  "#fdba74",
  "#e7e5e4",
  "#fef3c7",
];

export const DEFAULT_STROKE = "#1f1e1d";

/** Instrucción de sistema: cómo debe comportarse el modelo. */
export function buildSystemInstruction(): string {
  return [
    "Eres un ilustrador experto de doodles minimalistas en el espíritu de Notion.",
    "Siempre respondes ÚNICAMENTE con un documento SVG válido. No añadas texto fuera del SVG, no uses bloques de código con ``` y no expliques nada.",
    "",
    "Reglas del dibujo:",
    "- Trazos simples tipo boceto a mano alzada, líneas ligeramente irregulares pero limpias.",
    "- Contorno oscuro (casi negro), fino y suave; usa stroke-linecap=\"round\" y stroke-linejoin=\"round\".",
    "- Relleno plano opcional en tonos pastel. Sin degradados, sin sombras, sin filtros.",
    "- Sin imágenes externas, sin texto dentro del dibujo salvo que sea parte esencial del tema.",
    "- Usa formas básicas (<circle>, <ellipse>, <rect>, <path>…) organizadas en <g>, con atributos explícitos stroke=\"...\" y fill=\"...\" (pon fill=\"none\" en los contornos).",
    "- Lienzo: <svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 400 400\" width=\"400\" height=\"400\">",
    "- Escala el dibujo para que llene bien el lienzo dejando un margen razonable (10-15%).",
    "- Mantén el SVG limpio, bien indentado y fácil de editar a mano.",
  ].join("\n");
}

export function buildUserPrompt(opts: {
  description: string;
  style: DoodleStyle;
  strokeWidth: StrokeWidth;
  palette: PaletteId;
  variation?: boolean;
  refineText?: string;
  currentSvg?: string;
}): string {
  const style = STYLES.find((s) => s.id === opts.style) ?? STYLES[0];
  const stroke = STROKES.find((s) => s.id === opts.strokeWidth) ?? STROKES[1];
  const palette = PALETTES.find((p) => p.id === opts.palette) ?? PALETTES[1];

  if (opts.refineText && opts.currentSvg) {
    return [
      "Tengo este dibujo SVG actual:",
      opts.currentSvg,
      "",
      `Ajusta el dibujo según esta indicación (mantén el mismo tema y la composición general; cambia solo lo necesario): "${opts.refineText}"`,
      "Devuelve el SVG completo modificado, con el mismo viewBox.",
    ].join("\n");
  }

  const parts: string[] = [`Tema: ${opts.description}`];
  if (opts.variation) {
    parts.push(
      "Quiero una VARIACIÓN distinta de este mismo tema: cambia la composición, la pose o los elementos manteniendo la esencia. No repitas un dibujo idéntico."
    );
  }
  parts.push(`Estilo: ${style.instruction}`);
  parts.push(`Grosor de trazo: ${stroke.instruction}`);
  parts.push(
    `Paleta de colores: ${palette.instruction}. El contorno principal debe seguir siendo oscuro (casi negro).`
  );
  return parts.join("\n\n");
}
