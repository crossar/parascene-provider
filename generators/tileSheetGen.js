// generators/tileSheetGen.js
// Returns: { buffer: <PNG Buffer>, width: 1024, height: 1024, seed, grid, tileSize }

import sharp from 'sharp';

// -------- seeded RNG --------
function mulberry32(a) {
	return function () {
		a |= 0;
		a = (a + 0x6d2b79f5) | 0;
		let t = Math.imul(a ^ (a >>> 15), 1 | a);
		t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
		return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
	};
}
function clamp(n, lo, hi) {
	return Math.max(lo, Math.min(hi, n));
}
function rInt(rnd, min, max) {
	return Math.floor(rnd() * (max - min + 1)) + min;
}
function hexToRgb(hex) {
	const h = hex.replace('#', '');
	return {
		r: parseInt(h.slice(0, 2), 16),
		g: parseInt(h.slice(2, 4), 16),
		b: parseInt(h.slice(4, 6), 16),
	};
}
function rgbToHex({ r, g, b }) {
	const to = (v) => v.toString(16).padStart(2, '0');
	return `#${to(r)}${to(g)}${to(b)}`;
}
function jitterColor(hex, rnd, amount = 18) {
	const c = hexToRgb(hex);
	const j = (v) => clamp(v + rInt(rnd, -amount, amount), 0, 255);
	return rgbToHex({ r: j(c.r), g: j(c.g), b: j(c.b) });
}

const TILE_TYPES = [
	{ name: 'grass', base: '#3aa655', speck: ['#2f7f43', '#5cd07a', '#2a6b38'] },
	{ name: 'dirt', base: '#8b5a2b', speck: ['#6e4422', '#a06a35', '#5b3a1c'] },
	{ name: 'stone', base: '#7a7f86', speck: ['#5f646a', '#9aa0a8', '#4b4f55'] },
	{ name: 'sand', base: '#d8c27a', speck: ['#c7b06a', '#ead692', '#b59d55'] },
	{ name: 'water', base: '#2b6cff', speck: ['#1e4fb8', '#3d86ff', '#1b3f8f'] },
];

function pick(rnd, arr) {
	return arr[Math.floor(rnd() * arr.length)];
}

function generateTile(type, tileSize, rnd) {
	const { base, speck, name } = type;
	const w = tileSize;
	const h = tileSize;
	const buf = Buffer.alloc(w * h * 4);

	const baseC = hexToRgb(jitterColor(base, rnd, 12));

	for (let y = 0; y < h; y++) {
		for (let x = 0; x < w; x++) {
			const n = rInt(rnd, -10, 10);
			let r = clamp(baseC.r + n, 0, 255);
			let g = clamp(baseC.g + n, 0, 255);
			let b = clamp(baseC.b + n, 0, 255);

			if (name === 'water') {
				const band = Math.sin((y / h) * Math.PI * 6) * 10;
				r = clamp(r + band, 0, 255);
				g = clamp(g + band, 0, 255);
				b = clamp(b + band + 8, 0, 255);
			}

			const i = (y * w + x) * 4;
			buf[i] = r;
			buf[i + 1] = g;
			buf[i + 2] = b;
			buf[i + 3] = 255;
		}
	}

	const speckCount = Math.floor((w * h) / 18);
	for (let k = 0; k < speckCount; k++) {
		const x = rInt(rnd, 0, w - 1);
		const y = rInt(rnd, 0, h - 1);
		const c = hexToRgb(jitterColor(pick(rnd, speck), rnd, 10));
		const radius = name === 'stone' ? rInt(rnd, 1, 2) : rInt(rnd, 0, 1);

		for (let dy = -radius; dy <= radius; dy++) {
			for (let dx = -radius; dx <= radius; dx++) {
				const xx = x + dx;
				const yy = y + dy;
				if (xx < 0 || yy < 0 || xx >= w || yy >= h) continue;
				const i = (yy * w + xx) * 4;
				buf[i] = c.r;
				buf[i + 1] = c.g;
				buf[i + 2] = c.b;
				buf[i + 3] = 255;
			}
		}
	}

	// subtle edge darken
	const edge = 1;
	for (let y = 0; y < h; y++) {
		for (let x = 0; x < w; x++) {
			const onEdge = x < edge || y < edge || x >= w - edge || y >= h - edge;
			if (!onEdge) continue;
			const i = (y * w + x) * 4;
			buf[i] = clamp(buf[i] - 18, 0, 255);
			buf[i + 1] = clamp(buf[i + 1] - 18, 0, 255);
			buf[i + 2] = clamp(buf[i + 2] - 18, 0, 255);
		}
	}

	return buf;
}

export default async function tileSheetGen(args = {}) {
	const SIZE = 1024;

	const seed =
		args.seed !== undefined && args.seed !== null && args.seed !== ''
			? Number(args.seed)
			: Date.now() % 1000000;

	const grid = args.grid ? Math.floor(Number(args.grid)) : 16; // 16 => 64px tiles
	const gridLines =
		args.gridLines === true || args.gridLines === '1' || args.gridLines === 1;

	if (!Number.isFinite(grid) || grid <= 0) {
		throw new Error('grid must be a positive integer');
	}
	if (SIZE % grid !== 0) {
		throw new Error(
			`grid (${grid}) must divide evenly into 1024 (try 8,16,32,64)`
		);
	}

	const tileSize = SIZE / grid;
	const rnd = mulberry32(seed >>> 0);

	const canvas = sharp({
		create: {
			width: SIZE,
			height: SIZE,
			channels: 4,
			background: { r: 0, g: 0, b: 0, alpha: 0 },
		},
	});

	const composites = [];
	for (let ty = 0; ty < grid; ty++) {
		for (let tx = 0; tx < grid; tx++) {
			const type = pick(rnd, TILE_TYPES);
			const tileBuf = generateTile(type, tileSize, rnd);

			composites.push({
				input: tileBuf,
				raw: { width: tileSize, height: tileSize, channels: 4 },
				left: tx * tileSize,
				top: ty * tileSize,
			});
		}
	}

	let img = canvas.composite(composites);

	if (gridLines) {
		const line = Buffer.alloc(SIZE * SIZE * 4, 0);
		const setPx = (x, y, r, g, b, a) => {
			const i = (y * SIZE + x) * 4;
			line[i] = r;
			line[i + 1] = g;
			line[i + 2] = b;
			line[i + 3] = a;
		};

		for (let i = 0; i <= grid; i++) {
			const p = i * tileSize;
			if (p >= SIZE) continue;
			for (let y = 0; y < SIZE; y++) setPx(p, y, 0, 0, 0, 70);
			for (let x = 0; x < SIZE; x++) setPx(x, p, 0, 0, 0, 70);
		}

		img = img.composite([
			{
				input: line,
				raw: { width: SIZE, height: SIZE, channels: 4 },
				left: 0,
				top: 0,
			},
		]);
	}

	const buffer = await img.png().toBuffer();

	return {
		buffer,
		width: SIZE,
		height: SIZE,
		seed,
		grid,
		tileSize,
	};
}
