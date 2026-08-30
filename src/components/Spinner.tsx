"use client";

/** Anillo de carga sutil. */
export function Spinner({ size = 16 }: { size?: number }) {
  return (
    <span
      className="inline-block animate-spin rounded-full border-[2px] border-current border-t-transparent"
      style={{ width: size, height: size }}
      aria-hidden="true"
    />
  );
}

/** Etiqueta de carga con puntos animados, p. ej. "Dibujando…". */
export function LoadingLabel({ text }: { text: string }) {
  return (
    <span className="inline-flex items-baseline gap-0.5">
      {text}
      <span className="dot">.</span>
      <span className="dot">.</span>
      <span className="dot">.</span>
    </span>
  );
}
