import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { Resvg } from '@resvg/resvg-js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const FONT_DIR = path.join(__dirname, '..', 'fonts');

function resolveFontPath(fontFile) {
	return path.join(FONT_DIR, fontFile);
}

export function getOpenSansFonts() {
	return {
		regular: resolveFontPath('OpenSans-Regular.ttf'),
		bold: resolveFontPath('OpenSans-Bold.ttf'),
	};
}

export function getOpenSansFontsBase64() {
	const { regular, bold } = getOpenSansFonts();
	return {
		regular: fs.readFileSync(regular).toString('base64'),
		bold: fs.readFileSync(bold).toString('base64'),
	};
}

export function ensureFontFilesExists() {
	const { regular, bold } = getOpenSansFonts();
	return {
		regular: fs.existsSync(regular),
		bold: fs.existsSync(bold),
	};
}

/** Use this font-family on SVG text elements so it matches the @font-face rules. */
export const OPEN_SANS_EMBEDDED_FAMILY = 'Open Sans Embedded';

/**
 * Inline Open Sans as data URLs (same pattern that renders correctly on Vercel).
 * Place inside defs before gradients and filters.
 */
export function openSansEmbeddedStyleBlock(fonts = getOpenSansFontsBase64()) {
	const { regular, bold } = fonts;
	return `
    <style>
      @font-face {
        font-family: '${OPEN_SANS_EMBEDDED_FAMILY}';
        src: url("data:font/ttf;base64,${regular}") format('truetype');
        font-weight: 400;
        font-style: normal;
      }
      @font-face {
        font-family: '${OPEN_SANS_EMBEDDED_FAMILY}';
        src: url("data:font/ttf;base64,${bold}") format('truetype');
        font-weight: 700;
        font-style: normal;
      }
    </style>
`;
}

export function escapeSvgText(str = '') {
	return String(str)
		.replaceAll('&', '&amp;')
		.replaceAll('<', '&lt;')
		.replaceAll('>', '&gt;')
		.replaceAll('"', '&quot;')
		.replaceAll("'", '&apos;');
}

/**
 * Rasterize SVG that uses {@link openSansEmbeddedStyleBlock} + {@link OPEN_SANS_EMBEDDED_FAMILY}.
 * Uses the same Resvg settings that work on Vercel (match fortuneCookie).
 */
export function renderOpenSansSvgToPng(svgString, { fitWidth = 1024 } = {}) {
	const r = new Resvg(svgString, {
		fitTo: { mode: 'width', value: fitWidth },
	});
	return Buffer.from(r.render().asPng());
}
