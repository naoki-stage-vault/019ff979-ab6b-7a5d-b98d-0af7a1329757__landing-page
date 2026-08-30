"use client";

import { useState } from "react";
import { validateKey } from "@/lib/gemini";
import { KeyIcon, SparkleIcon, TrashIcon } from "./icons";
import { Spinner } from "./Spinner";

export function ApiKeyScreen({
  hasKey,
  onValidated,
  onDelete,
  compact,
  onClose,
}: {
  /** Si ya existe una clave guardada (modo edición). */
  hasKey?: boolean;
  onValidated: (key: string) => void;
  onDelete?: () => void;
  /** Versión compacta dentro de un modal. */
  compact?: boolean;
  onClose?: () => void;
}) {
  const [value, setValue] = useState("");
  const [show, setShow] = useState(false);
  const [checking, setChecking] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState(false);

  async function handleValidate() {
    if (checking) return;
    setError(null);
    setChecking(true);
    const res = await validateKey(value);
    setChecking(false);
    if (!res.ok) {
      setError(res.message);
      return;
    }
    onValidated(value.trim());
  }

  return (
    <div
      className={`mx-auto w-full ${compact ? "" : "flex min-h-screen max-w-md flex-col justify-center px-4 py-10"}`}
    >
      <div
        className={`rounded-xl border border-[#e9e9e7] bg-white ${compact ? "" : "p-8 shadow-sm"}`}
      >
        {!compact && (
          <div className="mb-6 flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-lg border border-[#e9e9e7] bg-[#f7f7f5] text-[#37352f]">
              <SparkleIcon size={20} />
            </span>
            <div>
              <h1 className="text-lg font-semibold leading-tight text-[#37352f]">
                Doodle Studio
              </h1>
              <p className="text-sm text-[#787774]">Generador de doodles estilo Notion</p>
            </div>
          </div>
        )}

        <h2 className="text-base font-semibold text-[#37352f]">
          {hasKey ? "Cambiar clave de API" : "Conecta tu clave de Gemini"}
        </h2>
        <p className="mt-1 text-sm leading-relaxed text-[#787774]">
          Pega tu clave de API de Gemini para empezar a dibujar. Se guarda{" "}
          <strong className="font-medium text-[#37352f]">solo en tu navegador</strong> y
          se envía únicamente a la API de Google, nunca a un servidor nuestro.
        </p>

        <div className="mt-4">
          <div className="flex items-center gap-2 rounded-lg border border-[#e9e9e7] bg-white px-3 py-2 focus-within:border-[#2383e2] focus-within:ring-2 focus-within:ring-[#2383e2]/20">
            <KeyIcon size={16} className="shrink-0 text-[#a09e9a]" />
            <input
              type={show ? "text" : "password"}
              value={value}
              onChange={(e) => {
                setValue(e.target.value);
                setError(null);
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter") handleValidate();
              }}
              placeholder="AIzaSy…"
              autoComplete="off"
              spellCheck={false}
              className="w-full bg-transparent text-sm text-[#37352f] outline-none placeholder:text-[#a09e9a]"
            />
            <button
              type="button"
              onClick={() => setShow((s) => !s)}
              className="shrink-0 text-xs font-medium text-[#787774] hover:text-[#37352f]"
            >
              {show ? "Ocultar" : "Ver"}
            </button>
          </div>
          {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
        </div>

        <div className="mt-4 flex flex-wrap items-center gap-2">
          <button
            onClick={handleValidate}
            disabled={checking || !value.trim()}
            className="inline-flex h-9 items-center gap-2 rounded-md bg-[#37352f] px-4 text-sm font-medium text-white transition-colors hover:bg-black disabled:cursor-not-allowed disabled:opacity-50"
          >
            {checking ? (
              <>
                <Spinner size={14} /> Validando…
              </>
            ) : hasKey ? (
              "Validar y guardar"
            ) : (
              "Guardar y validar"
            )}
          </button>
          {hasKey && onDelete && (
            <button
              onClick={() => {
                if (!confirmDelete) {
                  setConfirmDelete(true);
                  setTimeout(() => setConfirmDelete(false), 3000);
                  return;
                }
                setConfirmDelete(false);
                onDelete();
              }}
              className="inline-flex h-9 items-center gap-1.5 rounded-md border border-red-200 px-3 text-sm font-medium text-red-600 transition-colors hover:bg-red-50"
            >
              <TrashIcon size={14} />
              {confirmDelete ? "¿Seguro?" : "Borrar clave"}
            </button>
          )}
          {compact && onClose && (
            <button
              onClick={onClose}
              className="inline-flex h-9 items-center rounded-md px-3 text-sm font-medium text-[#787774] transition-colors hover:bg-[#f1f1ef] hover:text-[#37352f]"
            >
              Cerrar
            </button>
          )}
        </div>

        {!hasKey && (
          <p className="mt-4 text-xs leading-relaxed text-[#a09e9a]">
            ¿No tienes una? Créala gratis en{" "}
            <a
              href="https://aistudio.google.com/app/apikey"
              target="_blank"
              rel="noopener noreferrer"
              className="text-[#2383e2] hover:underline"
            >
              Google AI Studio
            </a>
            .
          </p>
        )}
      </div>
    </div>
  );
}
