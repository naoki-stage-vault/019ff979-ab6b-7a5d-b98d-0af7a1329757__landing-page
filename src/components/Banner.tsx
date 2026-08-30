"use client";

import type { ReactNode } from "react";
import { AlertIcon, CheckIcon, InfoIcon, XIcon } from "./icons";

export type BannerKind = "error" | "info" | "success";

const STYLES: Record<BannerKind, { box: string; icon: ReactNode }> = {
  error: {
    box: "bg-red-50 border-red-200 text-red-800",
    icon: <AlertIcon size={15} className="shrink-0 text-red-500" />,
  },
  info: {
    box: "bg-sky-50 border-sky-200 text-sky-800",
    icon: <InfoIcon size={15} className="shrink-0 text-sky-500" />,
  },
  success: {
    box: "bg-emerald-50 border-emerald-200 text-emerald-800",
    icon: <CheckIcon size={15} className="shrink-0 text-emerald-500" />,
  },
};

export function Banner({
  kind,
  message,
  onClose,
}: {
  kind: BannerKind;
  message: string;
  onClose: () => void;
}) {
  const s = STYLES[kind];
  return (
    <div
      role="status"
      className={`animate-fade-in-down pointer-events-auto flex w-full max-w-md items-start gap-2.5 rounded-lg border px-3.5 py-2.5 text-sm shadow-sm ${s.box}`}
    >
      <span className="mt-0.5">{s.icon}</span>
      <p className="flex-1 leading-snug">{message}</p>
      <button
        onClick={onClose}
        aria-label="Cerrar aviso"
        className="mt-0.5 rounded p-0.5 text-current opacity-60 transition-opacity hover:opacity-100"
      >
        <XIcon size={14} />
      </button>
    </div>
  );
}
