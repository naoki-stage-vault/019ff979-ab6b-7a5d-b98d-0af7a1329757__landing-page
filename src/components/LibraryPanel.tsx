"use client";

import { useRef, useState } from "react";
import type { Doodle } from "@/lib/types";
import { formatDate } from "@/lib/utils";
import {
  CopyPlusIcon,
  PencilIcon,
  SearchIcon,
  SparkleIcon,
  StarIcon,
  TrashIcon,
} from "./icons";

export function LibraryPanel({
  library,
  currentId,
  onSelect,
  onToggleFavorite,
  onDuplicate,
  onRename,
  onDelete,
}: {
  library: Doodle[];
  currentId: string | null;
  onSelect: (id: string) => void;
  onToggleFavorite: (id: string) => void;
  onDuplicate: (id: string) => void;
  onRename: (id: string, name: string) => void;
  onDelete: (id: string) => void;
}) {
  const [query, setQuery] = useState("");
  const [onlyFav, setOnlyFav] = useState(false);

  const filtered = (() => {
    const q = query.trim().toLowerCase();
    return library.filter((d) => {
      if (onlyFav && !d.favorite) return false;
      if (!q) return true;
      return (
        d.name.toLowerCase().includes(q) ||
        d.prompt.toLowerCase().includes(q)
      );
    });
  })();

  return (
    <section className="rounded-xl border border-[#e9e9e7] bg-white p-5">
      <div className="flex items-center justify-between gap-2">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-[#787774]">
          Biblioteca
        </h2>
        <span className="text-xs text-[#a09e9a]">
          {library.length} {library.length === 1 ? "doodle" : "doodles"}
        </span>
      </div>

      <div className="mt-3 flex items-center gap-2">
        <div className="flex flex-1 items-center gap-2 rounded-lg border border-[#e9e9e7] bg-white px-2.5 py-1.5 focus-within:border-[#2383e2] focus-within:ring-2 focus-within:ring-[#2383e2]/20">
          <SearchIcon size={14} className="shrink-0 text-[#a09e9a]" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Buscar en tu biblioteca…"
            className="w-full bg-transparent text-sm text-[#37352f] outline-none placeholder:text-[#a09e9a]"
          />
        </div>
        <div className="inline-flex rounded-lg border border-[#e9e9e7] bg-white p-0.5">
          <button
            onClick={() => setOnlyFav(false)}
            className={`rounded-md px-2.5 py-1 text-xs font-medium transition-colors ${
              !onlyFav ? "bg-[#37352f] text-white" : "text-[#787774] hover:bg-[#f1f1ef]"
            }`}
          >
            Todos
          </button>
          <button
            onClick={() => setOnlyFav(true)}
            className={`inline-flex items-center gap-1 rounded-md px-2.5 py-1 text-xs font-medium transition-colors ${
              onlyFav ? "bg-[#37352f] text-white" : "text-[#787774] hover:bg-[#f1f1ef]"
            }`}
          >
            <StarIcon size={12} filled={onlyFav} />
            Favoritos
          </button>
        </div>
      </div>

      {library.length === 0 ? (
        <div className="mt-8 text-center">
          <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-[#f1f1ef] text-[#a09e9a]">
            <SparkleIcon size={22} />
          </span>
          <p className="mt-3 text-sm font-medium text-[#37352f]">
            Tu biblioteca está vacía
          </p>
          <p className="mx-auto mt-1 max-w-xs text-xs leading-relaxed text-[#a09e9a]">
            Genera tu primer doodle y se guardará aquí automáticamente.
          </p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="mt-8 text-center text-sm text-[#a09e9a]">
          Sin resultados para esa búsqueda.
        </div>
      ) : (
        <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {filtered.map((d) => (
            <DoodleCard
              key={d.id}
              doodle={d}
              active={d.id === currentId}
              onSelect={() => onSelect(d.id)}
              onToggleFavorite={() => onToggleFavorite(d.id)}
              onDuplicate={() => onDuplicate(d.id)}
              onRename={(name) => onRename(d.id, name)}
              onDelete={() => onDelete(d.id)}
            />
          ))}
        </div>
      )}
    </section>
  );
}

function DoodleCard({
  doodle,
  active,
  onSelect,
  onToggleFavorite,
  onDuplicate,
  onRename,
  onDelete,
}: {
  doodle: Doodle;
  active: boolean;
  onSelect: () => void;
  onToggleFavorite: () => void;
  onDuplicate: () => void;
  onRename: (name: string) => void;
  onDelete: () => void;
}) {
  const [renaming, setRenaming] = useState(false);
  const [name, setName] = useState(doodle.name);
  const [confirming, setConfirming] = useState(false);
  const confirmTimer = useRef<number | null>(null);

  const svg = doodle.svg;

  function commitRename() {
    const clean = name.trim();
    setRenaming(false);
    if (clean && clean !== doodle.name) onRename(clean);
    else setName(doodle.name);
  }

  function startDelete() {
    if (confirming) {
      if (confirmTimer.current) window.clearTimeout(confirmTimer.current);
      onDelete();
      return;
    }
    setConfirming(true);
    confirmTimer.current = window.setTimeout(() => setConfirming(false), 3000);
  }

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={onSelect}
      onKeyDown={(e) => {
        if (e.key === "Enter") onSelect();
      }}
      className={`group cursor-pointer overflow-hidden rounded-lg border bg-white text-left transition-colors ${
        active
          ? "border-[#2383e2] ring-2 ring-[#2383e2]/20"
          : "border-[#e9e9e7] hover:border-[#d0d0cc]"
      }`}
    >
      <div className="bg-checker flex aspect-square items-center justify-center overflow-hidden p-2">
        <div
          className="preview-svg h-full w-full"
          dangerouslySetInnerHTML={{ __html: svg }}
        />
      </div>

      <div className="p-2.5">
        <div className="flex items-start justify-between gap-1">
          {renaming ? (
            <input
              autoFocus
              value={name}
              onChange={(e) => setName(e.target.value)}
              onFocus={(e) => e.target.select()}
              onBlur={commitRename}
              onKeyDown={(e) => {
                if (e.key === "Enter") commitRename();
                if (e.key === "Escape") {
                  setName(doodle.name);
                  setRenaming(false);
                }
              }}
              onClick={(e) => e.stopPropagation()}
              className="w-full min-w-0 rounded border border-[#2383e2] px-1 py-0.5 text-xs font-semibold text-[#37352f] outline-none"
            />
          ) : (
            <p className="min-w-0 truncate text-xs font-semibold text-[#37352f]">
              {doodle.name}
            </p>
          )}
          <button
            onClick={(e) => {
              e.stopPropagation();
              onToggleFavorite();
            }}
            title={doodle.favorite ? "Quitar de favoritos" : "Marcar como favorito"}
            className={`shrink-0 rounded p-1 transition-colors ${
              doodle.favorite
                ? "text-amber-500 hover:text-amber-600"
                : "text-[#c8c6c1] hover:text-[#787774]"
            }`}
          >
            <StarIcon size={14} filled={doodle.favorite} />
          </button>
        </div>

        <p className="mt-1 line-clamp-1 text-[11px] leading-snug text-[#a09e9a]">
          {doodle.prompt}
        </p>
        <div className="mt-1.5 flex items-center justify-between">
          <span className="text-[11px] text-[#c8c6c1]">{formatDate(doodle.createdAt)}</span>
          <div className="flex items-center gap-0.5 opacity-0 transition-opacity group-hover:opacity-100">
            <button
              onClick={(e) => {
                e.stopPropagation();
                onDuplicate();
              }}
              title="Duplicar"
              className="rounded p-1 text-[#a09e9a] transition-colors hover:bg-[#f1f1ef] hover:text-[#37352f]"
            >
              <CopyPlusIcon size={13} />
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                setName(doodle.name);
                setRenaming(true);
              }}
              title="Renombrar"
              className="rounded p-1 text-[#a09e9a] transition-colors hover:bg-[#f1f1ef] hover:text-[#37352f]"
            >
              <PencilIcon size={13} />
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                startDelete();
              }}
              title={confirming ? "¿Eliminar?" : "Eliminar"}
              className={`rounded p-1 transition-colors ${
                confirming
                  ? "bg-red-50 text-red-600"
                  : "text-[#a09e9a] hover:bg-red-50 hover:text-red-600"
              }`}
            >
              {confirming ? (
                <span className="px-0.5 text-[11px] font-semibold">¿Borrar?</span>
              ) : (
                <TrashIcon size={13} />
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
