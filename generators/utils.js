import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const FONT_DIR = path.join(__dirname, '..', 'fonts');

export function log(...args) {
	// Vercel sets these in serverless environments (prod/preview/dev).
	const isVercel = Boolean(process.env.VERCEL || process.env.VERCEL_ENV);
	if (isVercel) return;
	console.log(...args);
}

export function resolveFontPath(fontFile) {
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
