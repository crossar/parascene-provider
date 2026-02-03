import sharp from 'sharp';

const html = String.raw;

const THEMES = ['sky', 'sakura', 'mint', 'night'];
const CHARACTERS = ['catblob', 'slime'];

function mulberry32(seed) {
	let t = seed >>> 0;
	return function () {
		t += 0x6d2b79f5;
		let r = Math.imul(t ^ (t >>> 15), 1 | t);
		r ^= r + Math.imul(r ^ (r >>> 7), 61 | r);
		return ((r ^ (r >>> 14)) >>> 0) / 4294967296;
	};
}

function pickRandom(arr, rnd) {
	return arr[Math.floor(rnd() * arr.length)];
}

function clamp(n, a, b) {
	return Math.max(a, Math.min(b, n));
}

function hslToHex(h, s, l) {
	s /= 100;
	l /= 100;
	const c = (1 - Math.abs(2 * l - 1)) * s;
	const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
	const m = l - c / 2;

	let r = 0,
		g = 0,
		b = 0;
	if (h < 60) [r, g, b] = [c, x, 0];
	else if (h < 120) [r, g, b] = [x, c, 0];
	else if (h < 180) [r, g, b] = [0, c, x];
	else if (h < 240) [r, g, b] = [0, x, c];
	else if (h < 300) [r, g, b] = [x, 0, c];
	else [r, g, b] = [c, 0, x];

	const toHex = (v) =>
		Math.round((v + m) * 255)
			.toString(16)
			.padStart(2, '0');

	return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}

function pastelPalette(rnd, theme) {
	const themes = {
		sky: {
			bgA: [200, 70, 78],
			bgB: [260, 65, 82],
			accent: [320, 75, 75],
			star: [55, 90, 85],
		},
		sakura: {
			bgA: [330, 75, 85],
			bgB: [210, 65, 85],
			accent: [350, 80, 78],
			star: [50, 95, 88],
		},
		mint: {
			bgA: [160, 55, 82],
			bgB: [210, 60, 84],
			accent: [290, 60, 80],
			star: [55, 90, 88],
		},
		night: {
			bgA: [230, 55, 25],
			bgB: [270, 55, 22],
			accent: [320, 60, 45],
			star: [55, 90, 80],
		},
	};

	const t = themes[theme];
	const jitter = ([h, s, l]) => [
		(h + (rnd() * 24 - 12) + 360) % 360,
		clamp(s + (rnd() * 20 - 10), 0, 100),
		clamp(l + (rnd() * 16 - 8), 0, 100),
	];

	return {
		bg1: hslToHex(...jitter(t.bgA)),
		bg2: hslToHex(...jitter(t.bgB)),
		accent: hslToHex(...jitter(t.accent)),
		star: hslToHex(...jitter(t.star)),
		outline: theme === 'night' ? '#0b1020' : '#2b2b35',
	};
}

function pixelRect(x, y, size, color, rx = 0) {
	return `<rect x="${x}" y="${y}" width="${size}" height="${size}" fill="${color}" rx="${rx}" />`;
}

function generateStars({ w, h, grid, rnd, starColor }) {
	const pixels = [];
	const count = Math.floor(((w * h) / (grid * grid)) * 0.02);

	for (let i = 0; i < count; i++) {
		const x = Math.floor(rnd() * (w / grid)) * grid;
		const y = Math.floor(rnd() * (h / grid)) * grid;
		pixels.push(pixelRect(x, y, grid, starColor, 1));
	}
	return pixels.join('');
}

function generateCharacter({ w, h, grid, rnd, accent, outline, kind }) {
	const cx = Math.floor(w / 2);
	const cy = Math.floor(h * 0.6);
	const r = Math.floor(w * 0.16);
	const snap = (v) => Math.floor(v / grid) * grid;

	const body = [];
	for (let y = cy - r; y <= cy + r; y += grid) {
		for (let x = cx - r; x <= cx + r; x += grid) {
			const dx = x - cx;
			const dy = y - cy;
			if (Math.sqrt(dx * dx + dy * dy) <= r * 1.1) {
				body.push(pixelRect(snap(x), snap(y), grid, accent, 1));
			}
		}
	}

	const face = [];
	face.push(pixelRect(snap(cx - r * 0.3), snap(cy - r * 0.2), grid, '#111', 1));
	face.push(pixelRect(snap(cx + r * 0.3), snap(cy - r * 0.2), grid, '#111', 1));
	face.push(pixelRect(snap(cx), snap(cy + r * 0.15), grid, '#111', 1));

	return body.join('') + face.join('');
}

export async function generateAnimePixelSticker(args = {}) {
	const {
		width = 1024,
		height = 1024,
		seed = Date.now(),
		pixelSize = 8,
		scale = 2,
		theme,
		character,
	} = args;

	const rnd = mulberry32(seed);
	const finalTheme = theme ?? pickRandom(THEMES, rnd);
	const finalCharacter = character ?? pickRandom(CHARACTERS, rnd);
	const pal = pastelPalette(rnd, finalTheme);

	const baseW = Math.floor(width / scale);
	const baseH = Math.floor(height / scale);

	const svg = html`
		<svg
			width="${baseW}"
			height="${baseH}"
			xmlns="http://www.w3.org/2000/svg"
			shape-rendering="crispEdges"
		>
			<defs>
				<linearGradient id="bg" x1="0%" y1="0%" x2="0%" y2="100%">
					<stop offset="0%" stop-color="${pal.bg1}" />
					<stop offset="100%" stop-color="${pal.bg2}" />
				</linearGradient>
			</defs>
			<rect width="100%" height="100%" fill="url(#bg)" />
			${generateStars({
				w: baseW,
				h: baseH,
				grid: pixelSize,
				rnd,
				starColor: pal.star,
			})}
			${generateCharacter({
				w: baseW,
				h: baseH,
				grid: pixelSize,
				rnd,
				accent: pal.accent,
				outline: pal.outline,
				kind: finalCharacter,
			})}
		</svg>
	`;

	const base = await sharp(Buffer.from(svg)).png().toBuffer();

	const finalBuf = await sharp(base)
		.resize(width, height, { kernel: sharp.kernel.nearest })
		.png()
		.toBuffer();

	return {
		buffer: finalBuf,
		color: '#000000',
		width,
		height,
		meta: {
			seed,
			theme: finalTheme,
			character: finalCharacter,
			pixelSize,
			scale,
		},
	};
}

export default generateAnimePixelSticker;
