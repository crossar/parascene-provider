/** SVG text → PNG on Vercel: follow repo root `AGENTS.md`; keep all Resvg font wiring here. */
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

/**
 * Use this `font-family` on SVG text. Resvg must load the same faces via
 * {@link renderOpenSansSvgToPng} (`fontFiles` + `defaultFontFamily`); that is what worked on Vercel
 * before embedded `@font-face` in SVG (unreliable with resvg-js in serverless).
 */
export const OPEN_SANS_FAMILY = 'Open Sans';

export function escapeSvgText(str = '') {
	return String(str)
		.replaceAll('&', '&amp;')
		.replaceAll('<', '&lt;')
		.replaceAll('>', '&gt;')
		.replaceAll('"', '&quot;')
		.replaceAll("'", '&apos;');
}

/**
 * Rasterize SVG whose text uses {@link OPEN_SANS_FAMILY}. Loads repo TTFs into Resvg (same
 * approach as fortune cookie before embedded SVG fonts).
 */
export function renderOpenSansSvgToPng(svgString, { fitWidth = 1024 } = {}) {
	const { regular, bold } = getOpenSansFonts();
	const r = new Resvg(svgString, {
		fitTo: { mode: 'width', value: fitWidth },
		font: {
			loadSystemFonts: false,
			fontFiles: [regular, bold],
			defaultFontFamily: OPEN_SANS_FAMILY,
		},
	});
	return Buffer.from(r.render().asPng());
}
