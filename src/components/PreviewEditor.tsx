"use client";

import type { ReactNode } from "react";
import { useState } from "react";
import type { Doodle } from "@/lib/types";
import {
  copyText,
  downloadBlob,
  downloadText,
  svgToDataUri,
  svgToPng,
} from "@/lib/svg";
import { fileNameFrom, formatDate } from "@/lib/utils";
import type { BannerKind } from "./Banner";
import {
  ChevronDownIcon,
  CircleIcon,
  CopyIcon,
  DownloadIcon,
  GridIcon,
  MaximizeIcon,
  RefreshIcon,
  SaveIcon,
  SparkleIcon,
  SquareIcon,
  WandIcon,
  ZoomInIcon,
  ZoomOutIcon,
} from "./icons";
import { LoadingLabel, Spinner } from "./Spinner";

type BgMode = "white" | "transparent" | "grid";

const BG_OPTIONS: { id: BgMode; label: string; icon: ReactNode }[] = [
  { id: "white", label: "Blanco", icon: <SquareIcon size={15} /> },
  { id: "transparent", label: "Transparente", icon: <CircleIcon size={15} /> },
  { id: "grid", label: "Cuadrícula", icon: <GridIcon size={15} /> },
];

const BG_CLASS: Record<BgMode, string> = {
  white: "bg-white",
  transparent: "bg-checker",
  grid: "bg-grid",
};

export function PreviewEditor({
  doodle,
  busy,
  busyLabel,
  onRegenerate,
  onRefine,
  onSave,
  notify,
}: {
  doodle: Doodle | null;
  busy: boolean;
  busyLabel: string | null;
  onRegenerate: () => void;
  onRefine: (text: string) => void;
  onSave: () => void;
  notify: (message: string, kind?: BannerKind) => void;
}) {
  const [bg, setBg] = useState<BgMode>("white");
  const [zoom, setZoom] = useState(1);
  const [refineOpen, setRefineOpen] = useState(false);
  const [refineText, setRefineText] = useState("");
  const [pngSize, setPngSize] = useState(512);
  const [pngTransparent, setPngTransparent] = useState(false);

  const svg = doodle?.svg ?? "";

  if (!doodle) {
    return (
      <section className="rounded-xl border border-dashed border-[#d8d8d4] bg-white/60 p-8 text-center">
        <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-[#f1f1ef] text-[#a09e9a]">
          <SparkleIcon size={22} />
        </span>
        <p className="mt-3 text-sm font-medium text-[#37352f]">
          Tu doodle aparecerá aquí
        </p>
        <p className="mx-auto mt-1 max-w-xs text-xs leading-relaxed text-[#a09e9a]">
          Describe algo arriba y pulsa «Generar». Luego podrás ajustarlo, guardarlo y
          exportarlo.
        </p>
      </section>
    );
  }

  const filename = fileNameFrom(doodle.name);

  async function handleDownloadPng() {
    try {
      const blob = await svgToPng(svg, pngSize, pngTransparent);
      downloadBlob(blob, `${filename}.png`);
      notify("PNG descargado");
    } catch {
      notify("No se pudo generar el PNG. Inténtalo de nuevo.", "error");
    }
  }

  async function handleCopy(kind: "svg" | "uri") {
    try {
      await copyText(kind === "svg" ? svg : svgToDataUri(svg));
      notify(
        kind === "svg"
          ? "SVG copiado al portapapeles"
          : "Data URI copiada para pegar en Notion"
      );
    } catch {
      notify("No se pudo copiar. Revisa los permisos del navegador.", "error");
    }
  }

  return (
    <section className="rounded-xl border border-[#e9e9e7] bg-white p-5">
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0">
          <h2 className="truncate text-sm font-semibold text-[#37352f]">{doodle.name}</h2>
          <p className="text-xs text-[#a09e9a]">{formatDate(doodle.updatedAt)}</p>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={() => setZoom((z) => Math.max(0.5, +(z - 0.25).toFixed(2)))}
            disabled={busy || zoom <= 0.5}
            title="Alejar"
            className="rounded-md p-1.5 text-[#787774] transition-colors hover:bg-[#f1f1ef] disabled:opacity-40"
          >
            <ZoomOutIcon size={16} />
          </button>
          <span className="w-12 text-center text-xs font-medium tabular-nums text-[#787774]">
            {Math.round(zoom * 100)}%
          </span>
          <button
            onClick={() => setZoom((z) => Math.min(3, +(z + 0.25).toFixed(2)))}
            disabled={busy || zoom >= 3}
            title="Acercar"
            className="rounded-md p-1.5 text-[#787774] transition-colors hover:bg-[#f1f1ef] disabled:opacity-40"
          >
            <ZoomInIcon size={16} />
          </button>
          <button
            onClick={() => setZoom(1)}
            title="Encajar"
            className="rounded-md p-1.5 text-[#787774] transition-colors hover:bg-[#f1f1ef]"
          >
            <MaximizeIcon size={16} />
          </button>
        </div>
      </div>

      {/* Lienzo */}
      <div
        className={`preview-svg relative mt-3 flex aspect-square w-full items-center justify-center overflow-hidden rounded-lg border border-[#e9e9e7] transition-colors ${BG_CLASS[bg]}`}
      >
        <div
          className="h-full w-full transition-transform duration-200"
          style={{ transform: `scale(${zoom})` }}
        >
          <div className="h-full w-full" dangerouslySetInnerHTML={{ __html: svg }} />
        </div>
        {busy && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-white/70 backdrop-blur-[1px]">
            <Spinner size={22} />
            <p className="text-sm font-medium text-[#37352f]">
              <LoadingLabel text={busyLabel ?? "Dibujando"} />
            </p>
          </div>
        )}
      </div>

      {/* Barra de fondo */}
      <div className="mt-3 flex items-center gap-1">
        {BG_OPTIONS.map((o) => {
          const active = bg === o.id;
          return (
            <button
              key={o.id}
              onClick={() => setBg(o.id)}
              className={`inline-flex items-center gap-1.5 rounded-md border px-2.5 py-1.5 text-xs font-medium transition-colors ${
                active
                  ? "border-[#2383e2] bg-[#2383e2]/5 text-[#37352f]"
                  : "border-[#e9e9e7] bg-white text-[#787774] hover:bg-[#f7f7f5]"
              }`}
            >
              {o.icon}
              {o.label}
            </button>
          );
        })}
      </div>

      {/* Acciones */}
      <div className="mt-4 flex flex-wrap items-center gap-2">
        <button
          onClick={onRegenerate}
          disabled={busy}
          className="inline-flex h-9 items-center gap-1.5 rounded-md border border-[#e9e9e7] bg-white px-3.5 text-sm font-medium text-[#37352f] transition-colors hover:bg-[#f7f7f5] disabled:cursor-not-allowed disabled:opacity-50"
        >
          <RefreshIcon size={15} />
          Regenerar
        </button>
        <button
          onClick={() => {
            setRefineOpen((o) => !o);
            setRefineText("");
          }}
          disabled={busy}
          className={`inline-flex h-9 items-center gap-1.5 rounded-md border px-3.5 text-sm font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-50 ${
            refineOpen
              ? "border-[#2383e2] bg-[#2383e2]/5 text-[#37352f]"
              : "border-[#e9e9e7] bg-white text-[#37352f] hover:bg-[#f7f7f5]"
          }`}
        >
          <WandIcon size={15} />
          Refinar
        </button>
        <button
          onClick={onSave}
          disabled={busy}
          className="inline-flex h-9 items-center gap-1.5 rounded-md bg-[#37352f] px-3.5 text-sm font-medium text-white transition-colors hover:bg-black disabled:cursor-not-allowed disabled:opacity-50"
        >
          <SaveIcon size={15} />
          Guardar
        </button>
      </div>

      {refineOpen && (
        <div className="animate-fade-in-up mt-3 flex items-center gap-2">
          <input
            value={refineText}
            onChange={(e) => setRefineText(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && refineText.trim() && !busy) {
                onRefine(refineText.trim());
                setRefineOpen(false);
                setRefineText("");
              }
              if (e.key === "Escape") setRefineOpen(false);
            }}
            placeholder='Por ejemplo: "hazlo más redondeado"'
            className="h-9 flex-1 rounded-lg border border-[#e9e9e7] bg-white px-3 text-sm text-[#37352f] outline-none placeholder:text-[#a09e9a] focus:border-[#2383e2] focus:ring-2 focus:ring-[#2383e2]/20"
          />
          <button
            onClick={() => {
              if (!refineText.trim() || busy) return;
              onRefine(refineText.trim());
              setRefineOpen(false);
              setRefineText("");
            }}
            disabled={busy || !refineText.trim()}
            className="inline-flex h-9 items-center rounded-md bg-[#2383e2] px-3.5 text-sm font-medium text-white transition-colors hover:bg-[#1a6fc4] disabled:opacity-50"
          >
            Aplicar
          </button>
        </div>
      )}

      {/* Exportar */}
      <div className="mt-5 border-t border-[#f1f1ef] pt-4">
        <p className="text-xs font-semibold uppercase tracking-wide text-[#a09e9a]">
          Exportar
        </p>
        <div className="mt-2 grid grid-cols-1 gap-2 sm:grid-cols-2">
          <button
            onClick={() => {
              downloadText(svg, `${filename}.svg`, "image/svg+xml");
              notify("SVG descargado");
            }}
            className="inline-flex h-9 items-center justify-center gap-1.5 rounded-md border border-[#e9e9e7] bg-white text-sm font-medium text-[#37352f] transition-colors hover:bg-[#f7f7f5]"
          >
            <DownloadIcon size={15} />
            SVG
          </button>
          <div className="flex items-center gap-2">
            <div className="relative">
              <select
                value={pngSize}
                onChange={(e) => setPngSize(Number(e.target.value))}
                className="h-9 appearance-none rounded-md border border-[#e9e9e7] bg-white pl-3 pr-8 text-sm text-[#37352f] outline-none hover:bg-[#f7f7f5]"
                title="Tamaño del PNG"
              >
                <option value={256}>256 px</option>
                <option value={512}>512 px</option>
                <option value={1024}>1024 px</option>
              </select>
              <ChevronDownIcon
                size={14}
                className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-[#a09e9a]"
              />
            </div>
            <button
              onClick={handleDownloadPng}
              className="inline-flex h-9 flex-1 items-center justify-center gap-1.5 rounded-md border border-[#e9e9e7] bg-white text-sm font-medium text-[#37352f] transition-colors hover:bg-[#f7f7f5]"
            >
              <DownloadIcon size={15} />
              PNG
            </button>
          </div>
          <button
            onClick={() => handleCopy("svg")}
            className="inline-flex h-9 items-center justify-center gap-1.5 rounded-md border border-[#e9e9e7] bg-white text-sm font-medium text-[#37352f] transition-colors hover:bg-[#f7f7f5]"
          >
            <CopyIcon size={15} />
            Copiar SVG
          </button>
          <button
            onClick={() => handleCopy("uri")}
            className="inline-flex h-9 items-center justify-center gap-1.5 rounded-md border border-[#e9e9e7] bg-white text-sm font-medium text-[#37352f] transition-colors hover:bg-[#f7f7f5]"
          >
            <CopyIcon size={15} />
            Copiar para Notion
          </button>
        </div>
        <label className="mt-2 flex items-center gap-1.5 text-xs text-[#787774]">
          <input
            type="checkbox"
            checked={pngTransparent}
            onChange={(e) => setPngTransparent(e.target.checked)}
            className="h-3.5 w-3.5 rounded border-[#d8d8d4] accent-[#2383e2]"
          />
          PNG con fondo transparente
        </label>
      </div>
    </section>
  );
}
