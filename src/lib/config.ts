/** Configuración de la app: un único estilo visual, el de Notion Faces. */

/** Tinta característica de Notion (su color de texto). */
export const INK = "#37352f";

export const EXAMPLES = [
  "un gato durmiendo sobre libros",
  "una planta en maceta",
  "una taza de café humeante",
  "un cohete despegando",
  "una nube con arcoíris",
  "una bicicleta vintage",
  "un cactus con lentes",
  "una tarta de cumpleaños",
  "un búho leyendo un libro",
  "unas flores en un jarrón",
  "un perro con corbata",
  "una lámpara de escritorio",
];

/** Instrucción de sistema: siempre el mismo estilo Notion Faces. */
export function buildSystemInstruction(): string {
  return [
    "Eres un ilustrador experto en el estilo característico de «Notion Faces»: doodles minimalistas de línea a mano alzada, como los de faces.notion.com.",
    "Siempre respondes ÚNICAMENTE con un documento SVG válido. No añadas texto fuera del SVG, no uses bloques de código y no expliques nada.",
    "",
    "Reglas del dibujo (sigue SIEMPRE este mismo estilo, sin variaciones):",
    "- Línea fina, irregular y a mano alzada, en color casi negro (#37352F). Contorno de las formas con fill=\"none\".",
    "- Relleno plano opcional en pasteles suaves (rosa, celeste, menta, lavanda, amarillo). Sin degradados, sin sombras, sin filtros, sin brillos.",
    "- El sujeto principal lleva una carita minimalista estilo Notion: dos puntos como ojos y una pequeña sonrisa curva. Si hay varios elementos, la carita va en el principal.",
    "- Formas simples y redondeadas, pocos elementos, mucho aire alrededor. Sin texto ni imágenes externas.",
    "- Usa formas básicas (<circle>, <ellipse>, <path>, <rect>…) organizadas en <g>, con atributos explícitos stroke=\"#37352F\" y fill=\"...\".",
    "- En el contenedor raíz: stroke-linecap=\"round\" y stroke-linejoin=\"round\".",
    "- Lienzo: <svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 400 400\" width=\"400\" height=\"400\">.",
    "- Escala el dibujo para que llene bien el lienzo dejando un margen de ~10%. Mantén el SVG limpio, bien indentado y fácil de editar a mano.",
  ].join("\n");
}

export function buildUserPrompt(opts: {
  description: string;
  variation?: boolean;
  refineText?: string;
  currentSvg?: string;
}): string {
  if (opts.refineText && opts.currentSvg) {
    return [
      "Tengo este dibujo SVG actual:",
      opts.currentSvg,
      "",
      `Ajusta el dibujo según esta indicación. Mantén SIEMPRE el mismo estilo de Notion Faces y la composición general; cambia solo lo necesario: "${opts.refineText}"`,
      "Devuelve el SVG completo modificado, con el mismo viewBox.",
    ].join("\n");
  }

  const parts: string[] = [`Tema: ${opts.description}`];
  if (opts.variation) {
    parts.push(
      "Quiero una VARIACIÓN distinta de este mismo tema: cambia la composición, la pose o los elementos manteniendo la esencia y el estilo. No repitas un dibujo idéntico."
    );
  }
  parts.push(
    "Estilo: el característico de Notion Faces — línea fina a mano alzada en casi negro, carita minimalista (dos puntos y una sonrisa) sobre el sujeto, y relleno pastel plano opcional."
  );
  return parts.join("\n\n");
}
