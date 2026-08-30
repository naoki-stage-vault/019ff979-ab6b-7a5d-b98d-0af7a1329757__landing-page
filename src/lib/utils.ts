/** Utilidades generales. */

export function uid(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}

export function formatDate(ts: number): string {
  try {
    return new Date(ts).toLocaleDateString("es", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  } catch {
    return new Date(ts).toDateString();
  }
}

/** Nombre por defecto a partir de la descripción. */
export function defaultName(prompt: string): string {
  const clean = prompt.trim().replace(/\s+/g, " ");
  const words = clean.split(" ").slice(0, 5).join(" ");
  const base = words.charAt(0).toUpperCase() + words.slice(1);
  return base.length > 42 ? `${base.slice(0, 42)}…` : base;
}

export function fileNameFrom(name: string): string {
  return (
    name
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9áéíóúñü\- ]+/g, "")
      .replace(/\s+/g, "-")
      .replace(/-+/g, "-")
      .replace(/^-|-$/g, "") || "doodle"
  );
}
