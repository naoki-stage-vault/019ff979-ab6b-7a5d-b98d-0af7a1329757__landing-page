# Doodle Studio

Generador de doodles e ilustraciones simples **al estilo de Notion Faces**
(como [faces.notion.com](https://faces.notion.com/)), impulsado por la
[API de Gemini](https://ai.google.dev/). La clave de API la pega el usuario y **se guarda solo
en su navegador** (localStorage); todas las llamadas a Gemini se hacen directamente desde el
cliente, nunca a un servidor propio.

## Funcionalidades

- **Clave de API**: pantalla inicial para pegar/validar/borrar la clave, con mensajes claros
  (clave inválida, cuota agotada, sin conexión).
- **Generador**: una descripción y un único estilo coherente — línea fina a mano alzada,
  caritas minimalistas y relleno pastel plano. El modelo se detecta automáticamente entre los
  disponibles para tu clave (si el que usábamos deja de existir, probamos con otro).
- **Editor**: vista previa con zoom y fondo alternable (blanco, transparente, cuadrícula),
  regenerar variaciones y refinar con una indicación (el SVG actual se envía como contexto).
- **Biblioteca**: los doodles se guardan localmente en una galería con búsqueda, filtro de
  favoritos y acciones (renombrar, duplicar, eliminar, favorito).
- **Exportación**: SVG, PNG (256/512/1024 px, con o sin fondo), copiar SVG y copiar como data
  URI para pegar en Notion.
- **Detalles**: reintento automático si el SVG no es válido, atajos `Ctrl/⌘+Enter` (generar) y
  `Ctrl/⌘+S` (guardar), diseño responsive y textos breves en español.

## Desarrollo

```bash
npm install
npm run dev
```

## Stack

Next.js 16 (App Router) + React 19 + TypeScript + Tailwind CSS v4. Sin servidor: toda la lógica
de la app corre en el navegador.
