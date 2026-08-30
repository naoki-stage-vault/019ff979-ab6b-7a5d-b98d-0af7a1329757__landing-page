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
  /** SVG generado por Gemini (ya saneado). */
  svg: string;
  /** Anulaciones de color posteriores a la generación (null = mantener el original). */
  strokeOverride: string | null;
  fillOverride: string | null;
  favorite: boolean;
  createdAt: number;
  updatedAt: number;
  /** Campos históricos de versiones anteriores (ignorados). */
  style?: string;
  strokeWidth?: string;
  palette?: string;
}

export interface GenerateResultOk {
  ok: true;
  svg: string;
}

export interface GenerateResultErr {
  ok: false;
  message: string;
  kind: ErrorKind;
  /** true cuando el modelo no está disponible para la cuenta (para reintentar con otro). */
  notFound?: boolean;
}

export type GenerateResult = GenerateResultOk | GenerateResultErr;
