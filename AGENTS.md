# Notes for coding assistants

## SVG text → PNG (Vercel)

- Use `lib/openSansEmbedded.js` for SVG text that becomes PNG via resvg-js. Keep all of that wiring in one place; don’t add another approach (embedded `@font-face` in SVG, Sharp for text, ad-hoc `Resvg` without `font`, etc.).

- In the SVG, set `font-family` to `OPEN_SANS_FAMILY`. Escape dynamic strings with `escapeSvgText()`.

- Finish with `renderOpenSansSvgToPng(svg)`. It loads `fonts/OpenSans-*.ttf` through Resvg (`fontFiles`, `loadSystemFonts: false`, `defaultFontFamily: 'Open Sans'`). That path works on Vercel; inline base64 fonts in the SVG do not.

- See `generators/fortuneCookie.js` and `generators/birthdayCardGen.js` for usage.
