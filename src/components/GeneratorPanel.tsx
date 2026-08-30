"use client";

import { useEffect, useState } from "react";
import type { DoodleStyle, PaletteId, StrokeWidth } from "@/lib/types";
import { EXAMPLES, PALETTES, STROKES, STYLES } from "@/lib/config";
import { SparkleIcon } from "./icons";
import { LoadingLabel, Spinner } from "./Spinner";

export interface GeneratorForm {
  description: string;
  style: DoodleStyle;
  strokeWidth: StrokeWidth;
  palette: PaletteId;
}

export function GeneratorPanel({
  form,
  onChange,
  onGenerate,
  busy,
}: {
  form: GeneratorForm;
  onChange: (next: Partial<GeneratorForm>) => void;
  onGenerate: () => void;
  busy: boolean;
}) {
  const [placeholder, setPlaceholder] = useState(EXAMPLES[0]);

  // Ejemplos rotativos en el placeholder.
  useEffect(() => {
    let i = 0;
    const t = setInterval(() => {
      i = (i + 1) % EXAMPLES.length;
      setPlaceholder(EXAMPLES[i]);
    }, 4000);
    return () => clearInterval(t);
  }, []);

  return (
    <section className="rounded-xl border border-[#e9e9e7] bg-white p-5">
      <h2 className="text-sm font-semibold uppercase tracking-wide text-[#787774]">
        Generador
      </h2>

      <label htmlFor="doodle-description" className="mt-4 block text-sm font-medium text-[#37352f]">
        ¿Qué quieres dibujar?
      </label>
      <textarea
        id="doodle-description"
        rows={2}
        value={form.description}
        onChange={(e) => onChange({ description: e.target.value })}
        placeholder={`Por ejemplo: ${placeholder}`}
        className="mt-1.5 w-full resize-none rounded-lg border border-[#e9e9e7] bg-white px-3 py-2.5 text-sm text-[#37352f] outline-none transition-colors placeholder:text-[#a09e9a] focus:border-[#2383e2] focus:ring-2 focus:ring-[#2383e2]/20"
      />

      <div className="mt-4">
        <p className="text-sm font-medium text-[#37352f]">Estilo</p>
        <div className="mt-1.5 grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-5">
          {STYLES.map((s) => {
            const active = form.style === s.id;
            return (
              <button
                key={s.id}
                onClick={() => onChange({ style: s.id })}
                className={`rounded-lg border px-2.5 py-2 text-left transition-colors ${
                  active
                    ? "border-[#2383e2] bg-[#2383e2]/5 text-[#37352f]"
                    : "border-[#e9e9e7] bg-white text-[#787774] hover:bg-[#f7f7f5]"
                }`}
              >
                <span className="block text-xs font-semibold leading-tight text-[#37352f]">
                  {s.label}
                </span>
                <span className="mt-0.5 block text-[11px] leading-tight text-[#a09e9a]">
                  {s.hint}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      <div className="mt-4 flex flex-col gap-4 sm:flex-row">
        <div className="flex-1">
          <p className="text-sm font-medium text-[#37352f]">Grosor de trazo</p>
          <div className="mt-1.5 inline-flex rounded-lg border border-[#e9e9e7] bg-white p-0.5">
            {STROKES.map((s) => {
              const active = form.strokeWidth === s.id;
              return (
                <button
                  key={s.id}
                  onClick={() => onChange({ strokeWidth: s.id })}
                  className={`rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
                    active
                      ? "bg-[#37352f] text-white"
                      : "text-[#787774] hover:bg-[#f1f1ef]"
                  }`}
                >
                  {s.label}
                </button>
              );
            })}
          </div>
        </div>

        <div className="flex-1">
          <p className="text-sm font-medium text-[#37352f]">Paleta</p>
          <div className="mt-1.5 flex flex-wrap gap-1.5">
            {PALETTES.map((p) => {
              const active = form.palette === p.id;
              return (
                <button
                  key={p.id}
                  onClick={() => onChange({ palette: p.id })}
                  title={p.instruction}
                  className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1.5 text-xs font-medium transition-colors ${
                    active
                      ? "border-[#2383e2] bg-[#2383e2]/5 text-[#37352f]"
                      : "border-[#e9e9e7] bg-white text-[#787774] hover:bg-[#f7f7f5]"
                  }`}
                >
                  <span className="flex -space-x-1">
                    {p.swatch.slice(0, 3).map((c) => (
                      <span
                        key={c}
                        className="h-3 w-3 rounded-full border border-black/10"
                        style={{ backgroundColor: c }}
                      />
                    ))}
                  </span>
                  {p.label}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      <div className="mt-5 flex items-center justify-between gap-3">
        <p className="hidden text-xs text-[#a09e9a] sm:block">
          Pulsa <kbd className="rounded border border-[#e9e9e7] bg-[#f7f7f5] px-1 py-0.5 font-sans text-[11px]">Ctrl/⌘ + Enter</kbd> para generar
        </p>
        <button
          onClick={onGenerate}
          disabled={busy}
          className="inline-flex h-10 w-full items-center justify-center gap-2 rounded-lg bg-[#37352f] px-5 text-sm font-medium text-white transition-colors hover:bg-black disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
        >
          {busy ? (
            <>
              <Spinner size={15} />
              <LoadingLabel text="Dibujando" />
            </>
          ) : (
            <>
              <SparkleIcon size={15} />
              Generar
            </>
          )}
        </button>
      </div>
    </section>
  );
}
