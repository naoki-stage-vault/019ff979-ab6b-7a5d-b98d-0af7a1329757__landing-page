"use client";

import { useEffect, useState } from "react";
import { EXAMPLES } from "@/lib/config";
import { SparkleIcon } from "./icons";
import { LoadingLabel, Spinner } from "./Spinner";

export function GeneratorPanel({
  description,
  onChange,
  onGenerate,
  busy,
}: {
  description: string;
  onChange: (value: string) => void;
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
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-[#787774]">
          Generador
        </h2>
        <span className="inline-flex items-center gap-1 rounded-full bg-[#f1f1ef] px-2 py-0.5 text-[11px] font-medium text-[#787774]">
          Estilo Notion Faces
        </span>
      </div>

      <label htmlFor="doodle-description" className="mt-4 block text-sm font-medium text-[#37352f]">
        ¿Qué quieres dibujar?
      </label>
      <textarea
        id="doodle-description"
        rows={2}
        value={description}
        onChange={(e) => onChange(e.target.value)}
        placeholder={`Por ejemplo: ${placeholder}`}
        className="mt-1.5 w-full resize-none rounded-lg border border-[#e9e9e7] bg-white px-3 py-2.5 text-sm text-[#37352f] outline-none transition-colors placeholder:text-[#a09e9a] focus:border-[#2383e2] focus:ring-2 focus:ring-[#2383e2]/20"
      />

      <p className="mt-2 text-xs leading-relaxed text-[#a09e9a]">
        Siempre el mismo estilo: línea fina a mano alzada, caritas minimalistas y
        relleno pastel, como los dibujos de Notion.
      </p>

      <div className="mt-4 flex items-center justify-between gap-3">
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
