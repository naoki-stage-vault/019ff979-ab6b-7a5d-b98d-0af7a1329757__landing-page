/** Utilidades de SVG: saneado, anulación de colores, rasterizado y exportación. */

/** Elimina scripts, event handlers y enlaces javascript: del SVG. */
export function sanitizeSvg(svg: string): string {
  if (typeof document === "undefined" || !svg) return svg;
  try {
    const doc = new DOMParser().parseFromString(svg, "image/svg+xml");
    doc
      .querySelectorAll("script, foreignObject, iframe, object, embed, link, meta, style")
      .forEach((n) => n.remove());
    doc.querySelectorAll("*").forEach((el) => {
      for (const attr of Array.from(el.attributes)) {
        const name = attr.name.toLowerCase();
        if (name.startsWith("on")) {
          el.removeAttribute(attr.name);
          continue;
        }
        const value = attr.value.trim().toLowerCase();
        if (
          (name === "href" || name === "xlink:href") &&
          value.startsWith("javascript:")
        ) {
          el.removeAttribute(attr.name);
        }
      }
    });
    return new XMLSerializer().serializeToString(doc);
  } catch {
    return svg;
  }
}

/**
 * Aplica anulaciones de color sobre el SVG sin volver a llamar a la API.
 * - stroke != null: reemplaza el trazo de todos los elementos con trazo y lo
 *   fija como color heredado en la raíz.
 * - fill != null: reemplaza el relleno de los elementos que tengan relleno
 *   (ignora none/transparent). Pasa "none" para quitar rellenos.
 */
export function applyOverrides(
  svg: string,
  opts: { stroke?: string | null; fill?: string | null }
): string {
  if (typeof document === "undefined" || !svg) return svg;
  try {
    const doc = new DOMParser().parseFromString(svg, "image/svg+xml");
    const root = doc.querySelector("svg");
    if (!root) return svg;

    if (opts.stroke != null) {
      root.setAttribute("stroke", opts.stroke);
      root.querySelectorAll("*").forEach((el) => {
        const s = el.getAttribute("stroke");
        if (s && s !== "none") el.setAttribute("stroke", opts.stroke as string);
      });
    }
    if (opts.fill != null) {
      root.querySelectorAll("*").forEach((el) => {
        const f = el.getAttribute("fill");
        if (f && f !== "none" && f !== "transparent") {
          el.setAttribute("fill", opts.fill as string);
        }
      });
    }
    return new XMLSerializer().serializeToString(doc);
  } catch {
    return svg;
  }
}

/** Garantiza width/height explícitos (para rasterizar en canvas). */
export function ensureSize(svg: string, size = 400): string {
  if (typeof document === "undefined" || !svg) return svg;
  try {
    const doc = new DOMParser().parseFromString(svg, "image/svg+xml");
    const root = doc.querySelector("svg");
    if (!root) return svg;
    if (!root.getAttribute("width")) root.setAttribute("width", String(size));
    if (!root.getAttribute("height")) root.setAttribute("height", String(size));
    return new XMLSerializer().serializeToString(doc);
  } catch {
    return svg;
  }
}

/** Rasteriza el SVG a un PNG del tamaño indicado (fondo blanco o transparente). */
export function svgToPng(svg: string, size: number, transparent = false): Promise<Blob> {
  const blob = new Blob([ensureSize(svg, 400)], { type: "image/svg+xml;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      try {
        const canvas = document.createElement("canvas");
        canvas.width = size;
        canvas.height = size;
        const ctx = canvas.getContext("2d");
        if (!ctx) {
          reject(new Error("canvas no disponible"));
          return;
        }
        if (!transparent) {
          ctx.fillStyle = "#ffffff";
          ctx.fillRect(0, 0, size, size);
        }
        const scale = size / (img.naturalWidth || 400);
        ctx.scale(scale, scale);
        ctx.drawImage(img, 0, 0);
        URL.revokeObjectURL(url);
        canvas.toBlob((b) => {
          if (b) resolve(b);
          else reject(new Error("no se pudo generar el PNG"));
        }, "image/png");
      } catch (e) {
        URL.revokeObjectURL(url);
        reject(e);
      }
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("no se pudo cargar el dibujo"));
    };
    img.src = url;
  });
}

/** Data URI para pegar el SVG directamente en Notion u otras herramientas. */
export function svgToDataUri(svg: string): string {
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
}

export function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export function downloadText(text: string, filename: string, mime: string): void {
  downloadBlob(new Blob([text], { type: mime }), filename);
}

export function copyText(text: string): Promise<void> {
  return navigator.clipboard.writeText(text);
}
