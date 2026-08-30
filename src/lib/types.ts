export type DoodleStyle = "line" | "pastel" | "sticker" | "icon" | "scene";
export type StrokeWidth = "fino" | "medio" | "grueso";
export type PaletteId = "mono" | "pastel" | "calido" | "frio" | "natural";

export type ErrorKind =
  | "invalid-key"
  | "quota"
  | "blocked"
  | "network"
  | "invalid-svg"
  | "unknown";

export interface Doodle {
  id: string;
  name: string;
  prompt: string;
  style: DoodleStyle;
  strokeWidth: StrokeWidth;
  palette: PaletteId;
  /** SVG generado por Gemini (ya saneado). */
  svg: string;
  /** Anulaciones de color posteriores a la generación (null = mantener el original). */
  strokeOverride: string | null;
  fillOverride: string | null;
  favorite: boolean;
  createdAt: number;
  updatedAt: number;
}

export interface GenerateResultOk {
  ok: true;
  svg: string;
}

export interface GenerateResultErr {
  ok: false;
  message: string;
  kind: ErrorKind;
}

export type GenerateResult = GenerateResultOk | GenerateResultErr;
