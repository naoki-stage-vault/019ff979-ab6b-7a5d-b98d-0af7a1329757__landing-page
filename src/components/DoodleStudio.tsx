"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ApiKeyScreen } from "@/components/ApiKeyScreen";
import { Banner, type BannerKind } from "@/components/Banner";
import { GeneratorPanel, type GeneratorForm } from "@/components/GeneratorPanel";
import { KeyIcon, SparkleIcon } from "@/components/icons";
import { LibraryPanel } from "@/components/LibraryPanel";
import { PreviewEditor } from "@/components/PreviewEditor";
import { buildSystemInstruction, buildUserPrompt } from "@/lib/config";
import { generateSvg } from "@/lib/gemini";
import { KEYS, load, remove, save } from "@/lib/storage";
import { sanitizeSvg } from "@/lib/svg";
import type { Doodle, GenerateResult } from "@/lib/types";
import { defaultName, uid } from "@/lib/utils";

interface BannerState {
  id: number;
  kind: BannerKind;
  message: string;
}

type BusyState = { active: boolean; label: string } | null;

export default function DoodleStudio() {
  const [apiKey, setApiKey] = useState<string | null>(() =>
    load<string | null>(KEYS.apiKey, null)
  );
  const [library, setLibrary] = useState<Doodle[]>(() =>
    load<Doodle[]>(KEYS.library, [])
  );
  const [currentId, setCurrentId] = useState<string | null>(null);
  const [banner, setBanner] = useState<BannerState | null>(null);
  const [busy, setBusy] = useState<BusyState>(null);
  const [keyModal, setKeyModal] = useState(false);
  const [form, setForm] = useState<GeneratorForm>({
    description: "",
    style: "line",
    strokeWidth: "medio",
    palette: "pastel",
  });

  const bannerTimer = useRef<number | null>(null);
  const handlersRef = useRef<{ generate: () => void; save: () => void }>({
    generate: () => {},
    save: () => {},
  });

  // Persistir la biblioteca ante cualquier cambio.
  useEffect(() => {
    save(KEYS.library, library);
  }, [library]);

  const notify = useCallback((message: string, kind: BannerKind = "info") => {
    if (bannerTimer.current) window.clearTimeout(bannerTimer.current);
    setBanner({ id: Date.now(), kind, message });
    bannerTimer.current = window.setTimeout(() => setBanner(null), 5000);
  }, []);

  const current = useMemo(
    () => library.find((d) => d.id === currentId) ?? null,
    [library, currentId]
  );

  /** Llama a Gemini y reintenta una vez si el SVG no es válido. */
  const callWithRetry = useCallback(
    async (
      prompt: string,
      temperature: number,
      onRetry: () => void
    ): Promise<GenerateResult> => {
      if (!apiKey) {
        return { ok: false, message: "Falta la clave de API.", kind: "invalid-key" };
      }
      const base = {
        key: apiKey,
        systemInstruction: buildSystemInstruction(),
        userPrompt: prompt,
        temperature,
      };
      let res = await generateSvg(base);
      if (!res.ok && res.kind === "invalid-svg") {
        onRetry();
        res = await generateSvg(base);
      }
      return res;
    },
    [apiKey]
  );

  const handleGenerate = useCallback(async () => {
    if (busy?.active) return;
    const description = form.description.trim();
    if (!description) {
      notify("Escribe qué quieres dibujar primero.", "info");
      return;
    }
    setBusy({ active: true, label: "Dibujando" });
    const prompt = buildUserPrompt({
      description,
      style: form.style,
      strokeWidth: form.strokeWidth,
      palette: form.palette,
    });
    const res = await callWithRetry(prompt, 0.9, () =>
      notify("El primer intento no salió bien. Reintentando…", "info")
    );
    setBusy(null);
    if (!res.ok) {
      notify(res.message, "error");
      return;
    }
    const doodle: Doodle = {
      id: uid(),
      name: defaultName(description),
      prompt: description,
      style: form.style,
      strokeWidth: form.strokeWidth,
      palette: form.palette,
      svg: sanitizeSvg(res.svg),
      strokeOverride: null,
      fillOverride: null,
      favorite: false,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
    setLibrary((lib) => [doodle, ...lib]);
    setCurrentId(doodle.id);
    notify("¡Listo! Tu doodle se guardó en la biblioteca.", "success");
  }, [busy, form, callWithRetry, notify]);

  const handleRegenerate = useCallback(async () => {
    if (busy?.active || !current) return;
    setBusy({ active: true, label: "Variación" });
    const prompt = buildUserPrompt({
      description: current.prompt,
      style: current.style,
      strokeWidth: current.strokeWidth,
      palette: current.palette,
      variation: true,
    });
    const res = await callWithRetry(prompt, 0.95, () =>
      notify("El primer intento no salió bien. Reintentando…", "info")
    );
    setBusy(null);
    if (!res.ok) {
      notify(res.message, "error");
      return;
    }
    setLibrary((lib) =>
      lib.map((d) =>
        d.id === current.id
          ? {
              ...d,
              svg: sanitizeSvg(res.svg),
              strokeOverride: null,
              fillOverride: null,
              updatedAt: Date.now(),
            }
          : d
      )
    );
    notify("Variación lista.", "success");
  }, [busy, current, callWithRetry, notify]);

  const handleRefine = useCallback(
    async (text: string) => {
      if (busy?.active || !current) return;
      setBusy({ active: true, label: "Refinando" });
      const prompt = buildUserPrompt({
        description: current.prompt,
        style: current.style,
        strokeWidth: current.strokeWidth,
        palette: current.palette,
        refineText: text,
        currentSvg: current.svg,
      });
      const res = await callWithRetry(prompt, 0.6, () =>
        notify("El primer intento no salió bien. Reintentando…", "info")
      );
      setBusy(null);
      if (!res.ok) {
        notify(res.message, "error");
        return;
      }
      setLibrary((lib) =>
        lib.map((d) =>
          d.id === current.id
            ? {
                ...d,
                svg: sanitizeSvg(res.svg),
                strokeOverride: null,
                fillOverride: null,
                updatedAt: Date.now(),
              }
            : d
        )
      );
      notify("Ajuste aplicado.", "success");
    },
    [busy, current, callWithRetry, notify]
  );

  const setOverride = useCallback(
    (field: "strokeOverride" | "fillOverride", value: string | null) => {
      if (!currentId) return;
      setLibrary((lib) =>
        lib.map((d) =>
          d.id === currentId ? { ...d, [field]: value, updatedAt: Date.now() } : d
        )
      );
    },
    [currentId]
  );

  const handleSave = useCallback(() => {
    if (!currentId) {
      notify("Todavía no hay nada que guardar.", "info");
      return;
    }
    save(KEYS.library, library);
    notify("Guardado en tu biblioteca.", "success");
  }, [currentId, library, notify]);

  const handleSelect = useCallback((id: string) => setCurrentId(id), []);
  const handleToggleFavorite = useCallback((id: string) => {
    setLibrary((lib) =>
      lib.map((d) => (d.id === id ? { ...d, favorite: !d.favorite } : d))
    );
  }, []);
  const handleDuplicate = useCallback(
    (id: string) => {
      setLibrary((lib) => {
        const src = lib.find((d) => d.id === id);
        if (!src) return lib;
        const copy: Doodle = {
          ...src,
          id: uid(),
          name: `${src.name} (copia)`,
          favorite: false,
          createdAt: Date.now(),
          updatedAt: Date.now(),
        };
        const idx = lib.findIndex((d) => d.id === id);
        const next = [...lib];
        next.splice(idx + 1, 0, copy);
        return next;
      });
      notify("Doodle duplicado.", "success");
    },
    [notify]
  );
  const handleRename = useCallback((id: string, name: string) => {
    setLibrary((lib) =>
      lib.map((d) => (d.id === id ? { ...d, name, updatedAt: Date.now() } : d))
    );
  }, []);
  const handleDelete = useCallback(
    (id: string) => {
      setLibrary((lib) => lib.filter((d) => d.id !== id));
      setCurrentId((cur) => (cur === id ? null : cur));
      notify("Doodle eliminado.", "info");
    },
    [notify]
  );

  const handleKeyValidated = useCallback(
    (key: string) => {
      save(KEYS.apiKey, key);
      setApiKey(key);
      setKeyModal(false);
      notify("¡Clave conectada! Ya puedes generar doodles.", "success");
    },
    [notify]
  );

  const handleKeyDelete = useCallback(() => {
    remove(KEYS.apiKey);
    setApiKey(null);
    setKeyModal(false);
    notify("Clave borrada. Guárdala bien si quieres volver a usarla.", "info");
  }, [notify]);

  // Mantener las últimas funciones disponibles para los atajos de teclado.
  useEffect(() => {
    handlersRef.current = { generate: handleGenerate, save: handleSave };
  });

  // Atajos: Ctrl/⌘ + Enter genera, Ctrl/⌘ + S guarda.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const mod = e.metaKey || e.ctrlKey;
      if (!mod) return;
      const k = e.key.toLowerCase();
      if (k === "enter") {
        const target = e.target as HTMLElement | null;
        const tag = target?.tagName;
        const inOtherField =
          (tag === "INPUT" || tag === "TEXTAREA") &&
          target?.id !== "doodle-description";
        if (inOtherField) return;
        e.preventDefault();
        handlersRef.current.generate();
      } else if (k === "s") {
        e.preventDefault();
        handlersRef.current.save();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const bannerNode = banner && (
    <div className="pointer-events-none fixed inset-x-0 top-4 z-50 flex justify-center px-4">
      <div className="pointer-events-auto">
        <Banner
          key={banner.id}
          kind={banner.kind}
          message={banner.message}
          onClose={() => setBanner(null)}
        />
      </div>
    </div>
  );

  // Sin clave: pantalla inicial de configuración.
  if (!apiKey) {
    return (
      <main className="flex min-h-screen flex-col">
        <ApiKeyScreen onValidated={handleKeyValidated} />
        {bannerNode}
      </main>
    );
  }

  return (
    <div className="flex min-h-screen flex-col">
      <header className="sticky top-0 z-30 border-b border-[#e9e9e7] bg-white/90 backdrop-blur">
        <div className="mx-auto flex h-14 w-full max-w-6xl items-center justify-between px-4">
          <div className="flex items-center gap-2.5">
            <span className="flex h-7 w-7 items-center justify-center rounded-md border border-[#e9e9e7] bg-[#f7f7f5] text-[#37352f]">
              <SparkleIcon size={15} />
            </span>
            <span className="text-sm font-semibold text-[#37352f]">Doodle Studio</span>
          </div>
          <button
            onClick={() => setKeyModal(true)}
            className="inline-flex items-center gap-1.5 rounded-md border border-[#e9e9e7] bg-white px-2.5 py-1.5 text-xs font-medium text-[#787774] transition-colors hover:bg-[#f7f7f5]"
          >
            <KeyIcon size={13} />
            Clave
            <span
              className="ml-0.5 h-1.5 w-1.5 rounded-full bg-emerald-500"
              title="Clave conectada"
            />
          </button>
        </div>
      </header>

      <main className="mx-auto w-full max-w-6xl flex-1 px-4 pb-10 pt-6">
        <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-2">
          <div className="flex flex-col gap-6">
            <GeneratorPanel
              form={form}
              onChange={(next) => setForm((f) => ({ ...f, ...next }))}
              onGenerate={handleGenerate}
              busy={busy?.active ?? false}
            />
            <PreviewEditor
              doodle={current}
              busy={busy?.active ?? false}
              busyLabel={busy?.label ?? null}
              onRegenerate={handleRegenerate}
              onRefine={handleRefine}
              onStrokeChange={(c) => setOverride("strokeOverride", c)}
              onFillChange={(c) => setOverride("fillOverride", c)}
              onSave={handleSave}
              notify={notify}
            />
          </div>
          <LibraryPanel
            library={library}
            currentId={currentId}
            onSelect={handleSelect}
            onToggleFavorite={handleToggleFavorite}
            onDuplicate={handleDuplicate}
            onRename={handleRename}
            onDelete={handleDelete}
          />
        </div>
      </main>

      <footer className="pb-6 text-center text-xs text-[#c8c6c1]">
        Doodle Studio · tus dibujos y tu clave se quedan en tu navegador
      </footer>

      {bannerNode}

      {keyModal && (
        <div
          className="fixed inset-0 z-40 flex items-center justify-center bg-black/30 p-4"
          onClick={() => setKeyModal(false)}
        >
          <div
            className="animate-fade-in-up w-full max-w-md rounded-xl border border-[#e9e9e7] bg-white p-5 shadow-lg"
            onClick={(e) => e.stopPropagation()}
          >
            <ApiKeyScreen
              compact
              hasKey
              onValidated={handleKeyValidated}
              onDelete={handleKeyDelete}
              onClose={() => setKeyModal(false)}
            />
          </div>
        </div>
      )}
    </div>
  );
}
