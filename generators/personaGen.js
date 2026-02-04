// generators/personaGen.js
import sharp from 'sharp';

/* ---------------- RNG helpers ---------------- */
function mulberry32(seed) {
	let t = seed >>> 0;
	return function () {
		t += 0x6d2b79f5;
		let x = Math.imul(t ^ (t >>> 15), 1 | t);
		x ^= x + Math.imul(x ^ (x >>> 7), 61 | x);
		return ((x ^ (x >>> 14)) >>> 0) / 4294967296;
	};
}

function hashStringToSeed(str) {
	let h = 2166136261;
	for (let i = 0; i < str.length; i++) {
		h ^= str.charCodeAt(i);
		h = Math.imul(h, 16777619);
	}
	return h >>> 0;
}

function pick(rnd, arr) {
	return arr[Math.floor(rnd() * arr.length)];
}
function chance(rnd, p) {
	return rnd() < p;
}
function clamp(n, a, b) {
	return Math.max(a, Math.min(b, n));
}

function darken(hex, amt = 0.18) {
	const c = hex.replace('#', '');
	const r = parseInt(c.slice(0, 2), 16);
	const g = parseInt(c.slice(2, 4), 16);
	const b = parseInt(c.slice(4, 6), 16);
	const f = (v) => clamp(Math.round(v * (1 - amt)), 0, 255);
	const to = (v) => v.toString(16).padStart(2, '0');
	return `#${to(f(r))}${to(f(g))}${to(f(b))}`;
}
function lighten(hex, amt = 0.18) {
	const c = hex.replace('#', '');
	const r = parseInt(c.slice(0, 2), 16);
	const g = parseInt(c.slice(2, 4), 16);
	const b = parseInt(c.slice(4, 6), 16);
	const f = (v) => clamp(Math.round(v + (255 - v) * amt), 0, 255);
	const to = (v) => v.toString(16).padStart(2, '0');
	return `#${to(f(r))}${to(f(g))}${to(f(b))}`;
}

/* ---------------- palettes ---------------- */
const SKIN = [
	'#F5D7C3',
	'#F2C7A5',
	'#E7B38D',
	'#D39B78',
	'#B97C59',
	'#8C5A3C',
	'#5B3A28',
];

const HAIR = [
	'#1B1B1B',
	'#2B1B12',
	'#4A2B18',
	'#8B5A2B',
	'#C9A24A',
	'#B58C6B',
	'#D7D7D7',
];

const EYES = [
	'#3B82F6',
	'#60A5FA',
	'#10B981',
	'#A78BFA',
	'#8B5CF6',
	'#0F172A',
	'#92400E',
];

const TOPS = [
	'#22C55E',
	'#EF4444',
	'#3B82F6',
	'#F97316',
	'#A855F7',
	'#F59E0B',
	'#64748B',
	'#EC4899',
];
const BOTTOMS = [
	'#1F2937',
	'#334155',
	'#0F172A',
	'#6B7280',
	'#7C3AED',
	'#0EA5E9',
];
const SHOES = ['#111827', '#3F3F46', '#78350F', '#0B0F1A', '#475569'];

/* ---------------- grid helpers ---------------- */
function makeEmptyGrid(px) {
	// Explicit nulls (never undefined)
	return Array.from({ length: px }, () =>
		Array.from({ length: px }, () => null)
	);
}
function setPx(grid, x, y, color) {
	if (y < 0 || y >= grid.length) return;
	if (x < 0 || x >= grid[0].length) return;
	grid[y][x] = color;
}
function fillRect(grid, x0, y0, w, h, color) {
	for (let y = y0; y < y0 + h; y++) {
		for (let x = x0; x < x0 + w; x++) setPx(grid, x, y, color);
	}
}
function toPixelSVG(grid, scale) {
	const px = grid.length;
	const w = px * scale;
	const h = px * scale;

	let rects = '';
	for (let y = 0; y < px; y++) {
		for (let x = 0; x < px; x++) {
			const color = grid[y][x];
			if (!color) continue;
			rects += `<rect x="${x * scale}" y="${y * scale}" width="${scale}" height="${scale}" fill="${color}" />`;
		}
	}

	return `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">${rects}</svg>`;
}

/* ---------------- character parts ---------------- */
function drawOutfit(grid, cx, bodyY, bodyW, bodyH, skin, rnd) {
	const top = pick(rnd, TOPS);
	const bottom = pick(rnd, BOTTOMS);
	const shoes = pick(rnd, SHOES);
	const topShade = darken(top, 0.22);
	const bottomShade = darken(bottom, 0.18);

	const bodyX = cx - Math.floor(bodyW / 2);

	const outfit = pick(rnd, ['tee', 'hoodie', 'dress', 'overalls', 'jacket']);
	if (outfit === 'tee') {
		fillRect(grid, bodyX, bodyY, bodyW, bodyH, top);
		for (let x = bodyX; x < bodyX + bodyW; x++)
			setPx(grid, x, bodyY + bodyH - 1, topShade);
	} else if (outfit === 'hoodie') {
		fillRect(grid, bodyX, bodyY, bodyW, bodyH, top);
		setPx(grid, bodyX, bodyY, topShade);
		setPx(grid, bodyX + bodyW - 1, bodyY, topShade);
		fillRect(grid, bodyX + 2, bodyY + 2, Math.max(2, bodyW - 4), 2, topShade);
	} else if (outfit === 'dress') {
		fillRect(grid, bodyX, bodyY, bodyW, bodyH, top);
		fillRect(grid, bodyX - 1, bodyY + bodyH - 1, bodyW + 2, 2, topShade);
	} else if (outfit === 'overalls') {
		fillRect(grid, bodyX, bodyY, bodyW, bodyH, bottom);
		fillRect(grid, bodyX + 1, bodyY, bodyW - 2, 2, top);
		setPx(grid, bodyX + 1, bodyY + 1, bottomShade);
		setPx(grid, bodyX + bodyW - 2, bodyY + 1, bottomShade);
	} else if (outfit === 'jacket') {
		fillRect(grid, bodyX, bodyY, bodyW, bodyH, top);
		for (let y = bodyY; y < bodyY + bodyH; y++) setPx(grid, cx, y, topShade);
		setPx(grid, cx, bodyY + 1, lighten(topShade, 0.35));
	}

	// Arms
	setPx(grid, bodyX - 1, bodyY + 1, skin);
	setPx(grid, bodyX - 1, bodyY + 2, skin);
	setPx(grid, bodyX + bodyW, bodyY + 1, skin);
	setPx(grid, bodyX + bodyW, bodyY + 2, skin);

	// Legs
	const legY = bodyY + bodyH;
	const legGap = 1;
	const legW = 2;
	const leftLegX = cx - legGap - legW;
	const rightLegX = cx + legGap;

	const legH = chance(rnd, 0.3) ? 2 : 3;
	fillRect(grid, leftLegX, legY, legW, legH, bottom);
	fillRect(grid, rightLegX, legY, legW, legH, bottom);
	setPx(grid, leftLegX, legY + legH - 1, bottomShade);
	setPx(grid, rightLegX, legY + legH - 1, bottomShade);

	// Shoes
	fillRect(grid, leftLegX, legY + legH, legW, 1, shoes);
	fillRect(grid, rightLegX, legY + legH, legW, 1, shoes);

	return { top, bottom, shoes, outfit };
}

function drawHair(grid, headX, headY, headW, rnd) {
	const hair = pick(rnd, HAIR);
	const hairShade = darken(hair, 0.25);

	const style = pick(rnd, [
		'short',
		'sidepart',
		'curlyTop',
		'bob',
		'spiky',
		'bangs',
		'ponytail',
		'mohawk',
	]);

	if (style === 'short') {
		fillRect(grid, headX, headY, headW, 2, hair);
		fillRect(grid, headX, headY + 2, 1, 1, hairShade);
		fillRect(grid, headX + headW - 1, headY + 2, 1, 1, hairShade);
	} else if (style === 'sidepart') {
		fillRect(grid, headX, headY, headW, 2, hair);
		for (let x = headX + 1; x < headX + Math.floor(headW / 2); x++)
			setPx(grid, x, headY + 1, hairShade);
		fillRect(grid, headX, headY + 2, 2, 1, hair);
	} else if (style === 'curlyTop') {
		fillRect(grid, headX, headY, headW, 1, hair);
		for (let x = headX; x < headX + headW; x += 2)
			setPx(grid, x, headY + 1, hair);
		for (let x = headX + 1; x < headX + headW; x += 2)
			setPx(grid, x, headY + 2, hairShade);
	} else if (style === 'bob') {
		fillRect(grid, headX, headY, headW, 2, hair);
		fillRect(grid, headX - 1, headY + 2, headW + 2, 2, hairShade);
	} else if (style === 'spiky') {
		fillRect(grid, headX, headY + 1, headW, 1, hair);
		for (let x = headX; x < headX + headW; x++)
			setPx(grid, x, headY, chance(rnd, 0.6) ? hair : null);
	} else if (style === 'bangs') {
		fillRect(grid, headX, headY, headW, 2, hair);
		for (let x = headX; x < headX + headW; x++)
			setPx(grid, x, headY + 2, chance(rnd, 0.55) ? hairShade : null);
	} else if (style === 'ponytail') {
		fillRect(grid, headX, headY, headW, 2, hair);
		const side = chance(rnd, 0.5) ? -1 : 1;
		setPx(grid, headX + (side === -1 ? 0 : headW - 1), headY + 3, hairShade);
		setPx(grid, headX + (side === -1 ? -1 : headW), headY + 4, hairShade);
	} else if (style === 'mohawk') {
		for (let y = headY - 1; y < headY + 4; y++)
			setPx(grid, headX + Math.floor(headW / 2), y, hair);
		fillRect(grid, headX, headY + 1, headW, 1, hairShade);
	}

	return { hair, style };
}

function drawFace(grid, cx, headX, headY, headW, headH, rnd) {
	const eyes = pick(rnd, EYES);

	const eyeY = headY + 2 + Math.floor(rnd() * 2);
	const eyeOffset = Math.floor(headW / 3);
	const leftEyeX = cx - eyeOffset;
	const rightEyeX = cx + eyeOffset - 1;

	const eyeStyle = pick(rnd, ['normal', 'sleepy', 'sparkle', 'wide']);
	const mouth = pick(rnd, [
		'smile',
		'neutral',
		'grumpy',
		'o',
		'smirk',
		'bigSmile',
	]);
	const brow = pick(rnd, ['none', 'angry', 'sad', 'raised']);

	// eyes
	setPx(grid, leftEyeX, eyeY, eyes);
	setPx(grid, rightEyeX, eyeY, eyes);

	if (eyeStyle === 'sleepy') {
		setPx(grid, leftEyeX, eyeY - 1, '#111827');
		setPx(grid, rightEyeX, eyeY - 1, '#111827');
	} else if (eyeStyle === 'sparkle') {
		setPx(grid, leftEyeX, eyeY - 1, '#FFFFFF');
		setPx(grid, rightEyeX, eyeY - 1, '#FFFFFF');
		setPx(grid, leftEyeX + 1, eyeY, '#FFFFFF');
		setPx(grid, rightEyeX - 1, eyeY, '#FFFFFF');
	} else if (eyeStyle === 'wide') {
		setPx(grid, leftEyeX, eyeY + 1, darken(eyes, 0.35));
		setPx(grid, rightEyeX, eyeY + 1, darken(eyes, 0.35));
		setPx(grid, leftEyeX, eyeY - 1, '#FFFFFF');
		setPx(grid, rightEyeX, eyeY - 1, '#FFFFFF');
	} else {
		if (chance(rnd, 0.7)) {
			setPx(grid, leftEyeX, eyeY - 1, '#FFFFFF');
			setPx(grid, rightEyeX, eyeY - 1, '#FFFFFF');
		}
	}

	// eyebrows
	if (brow === 'angry') {
		setPx(grid, leftEyeX - 1, eyeY - 2, '#111827');
		setPx(grid, rightEyeX + 1, eyeY - 2, '#111827');
	} else if (brow === 'sad') {
		setPx(grid, leftEyeX - 1, eyeY - 1, '#111827');
		setPx(grid, rightEyeX + 1, eyeY - 1, '#111827');
	} else if (brow === 'raised') {
		setPx(grid, leftEyeX - 1, eyeY - 3, '#111827');
		setPx(grid, rightEyeX + 1, eyeY - 3, '#111827');
	}

	// mouth
	const mouthY = headY + headH - 2;
	if (mouth === 'smile') {
		setPx(grid, cx - 1, mouthY, '#111827');
		setPx(grid, cx, mouthY + 1, '#111827');
		setPx(grid, cx + 1, mouthY, '#111827');
	} else if (mouth === 'neutral') {
		setPx(grid, cx - 1, mouthY, '#111827');
		setPx(grid, cx, mouthY, '#111827');
		setPx(grid, cx + 1, mouthY, '#111827');
	} else if (mouth === 'grumpy') {
		setPx(grid, cx - 1, mouthY + 1, '#111827');
		setPx(grid, cx, mouthY, '#111827');
		setPx(grid, cx + 1, mouthY + 1, '#111827');
	} else if (mouth === 'o') {
		setPx(grid, cx, mouthY, '#111827');
		setPx(grid, cx, mouthY + 1, '#111827');
	} else if (mouth === 'smirk') {
		setPx(grid, cx, mouthY, '#111827');
		setPx(grid, cx + 1, mouthY, '#111827');
		setPx(grid, cx + 1, mouthY - 1, '#111827');
	} else if (mouth === 'bigSmile') {
		setPx(grid, cx - 2, mouthY, '#111827');
		setPx(grid, cx - 1, mouthY + 1, '#111827');
		setPx(grid, cx, mouthY + 1, '#111827');
		setPx(grid, cx + 1, mouthY + 1, '#111827');
		setPx(grid, cx + 2, mouthY, '#111827');
	}

	// extras
	if (chance(rnd, 0.25)) {
		setPx(grid, headX + 1, mouthY, '#FCA5A5');
		setPx(grid, headX + headW - 2, mouthY, '#FCA5A5');
	}
	if (chance(rnd, 0.12)) {
		setPx(grid, cx - 1, mouthY - 1, '#A16207');
		setPx(grid, cx + 1, mouthY - 1, '#A16207');
	}

	return { eyes, eyeStyle, mouth, brow };
}

function drawAccessories(grid, cx, headX, headY, headW, rnd) {
	const acc = pick(rnd, [
		'none',
		'glasses',
		'mask',
		'earring',
		'scar',
		'stubble',
	]);
	const eyeY = headY + 3;

	if (acc === 'glasses') {
		for (let x = cx - 3; x <= cx + 3; x++) setPx(grid, x, eyeY, '#111827');
		setPx(grid, cx, eyeY, '#111827');
	} else if (acc === 'mask') {
		fillRect(grid, headX + 1, eyeY + 1, headW - 2, 2, '#E5E7EB');
	} else if (acc === 'earring') {
		setPx(grid, headX - 1, headY + 4, '#FBBF24');
	} else if (acc === 'scar') {
		setPx(grid, cx - 1, headY + 3, '#B91C1C');
		setPx(grid, cx, headY + 4, '#B91C1C');
	} else if (acc === 'stubble') {
		for (let x = headX + 1; x < headX + headW - 1; x += 2)
			setPx(grid, x, headY + 5, '#111827');
	}

	// hats
	const hat = pick(rnd, ['none', 'cap', 'beanie', 'cowboy', 'crown']);
	if (hat === 'cap') {
		fillRect(grid, headX, headY - 1, headW, 1, '#111827');
		fillRect(
			grid,
			headX + Math.floor(headW / 2),
			headY,
			Math.ceil(headW / 2),
			1,
			'#111827'
		);
	} else if (hat === 'beanie') {
		fillRect(grid, headX, headY - 1, headW, 2, '#334155');
		setPx(grid, cx, headY - 2, '#334155');
	} else if (hat === 'cowboy') {
		fillRect(grid, headX - 1, headY, headW + 2, 1, '#854D0E');
		fillRect(grid, headX + 1, headY - 1, headW - 2, 1, '#854D0E');
		fillRect(grid, headX + 2, headY - 2, headW - 4, 1, '#854D0E');
	} else if (hat === 'crown') {
		setPx(grid, cx - 2, headY - 1, '#FBBF24');
		setPx(grid, cx, headY - 2, '#FBBF24');
		setPx(grid, cx + 2, headY - 1, '#FBBF24');
	}

	return { acc, hat };
}

function generateCharacter(px, rnd) {
	const grid = makeEmptyGrid(px);

	const cx = Math.floor(px / 2);
	const skin = pick(rnd, SKIN);

	const headW = clamp(6 + Math.floor(rnd() * 3), 6, 8);
	const headH = clamp(5 + Math.floor(rnd() * 2), 5, 6);
	const headX = cx - Math.floor(headW / 2);
	const headY = 2;

	// head
	fillRect(grid, headX, headY, headW, headH, skin);
	for (let x = headX + 1; x < headX + headW - 1; x++) {
		setPx(grid, x, headY + headH - 1, darken(skin, 0.12));
	}

	const hairInfo = drawHair(grid, headX, headY, headW, rnd);
	const faceInfo = drawFace(grid, cx, headX, headY, headW, headH, rnd);
	const accInfo = drawAccessories(grid, cx, headX, headY, headW, rnd);

	const bodyW = clamp(headW + (chance(rnd, 0.25) ? 1 : 0), 6, 9);
	const bodyH = clamp(5 + (chance(rnd, 0.2) ? 1 : 0), 5, 6);
	const bodyY = headY + headH;

	const outfitInfo = drawOutfit(grid, cx, bodyY, bodyW, bodyH, skin, rnd);

	return {
		grid,
		meta: {
			skin,
			hair: hairInfo,
			face: faceInfo,
			accessories: accInfo,
			outfit: outfitInfo,
		},
	};
}

export default async function generatePersonaGen(args = {}) {
	// Truly random per request when seed is omitted
	const seed =
		typeof args.seed !== 'undefined'
			? typeof args.seed === 'number'
				? args.seed >>> 0
				: hashStringToSeed(String(args.seed))
			: Math.floor(Math.random() * 2 ** 32);

	const mode = String(args.mode ?? 'single'); // "single" | "sheet"
	const bg =
		typeof args.bg === 'string' && /^#[0-9A-Fa-f]{6}$/.test(args.bg)
			? args.bg
			: '#191C28';

	// SINGLE MODE: exact output size
	if (mode === 'single') {
		const targetWidth = clamp(Number(args.width ?? 192), 32, 2048);
		const targetHeight = clamp(Number(args.height ?? 288), 32, 2048);

		// px controls "detail level" of the character; we auto-fit scale
		const px = clamp(Number(args.px ?? 24), 12, 64);

		const scaleX = Math.floor(targetWidth / px);
		const scaleY = Math.floor(targetHeight / px);
		const scale = clamp(Math.min(scaleX, scaleY), 1, 64);

		const rnd = mulberry32(seed);
		const { grid } = generateCharacter(px, rnd);
		const svg = toPixelSVG(grid, scale);

		const charW = px * scale;
		const charH = px * scale;

		const offsetX = Math.floor((targetWidth - charW) / 2);
		const offsetY = Math.floor((targetHeight - charH) / 2);

		const buffer = await sharp({
			create: {
				width: targetWidth,
				height: targetHeight,
				channels: 4,
				background: bg,
			},
		})
			.composite([{ input: Buffer.from(svg), left: offsetX, top: offsetY }])
			.png()
			.toBuffer();

		return { buffer, width: targetWidth, height: targetHeight };
	}

	const px = clamp(Number(args.px ?? 16), 8, 64);
	const scale = clamp(Number(args.scale ?? 6), 1, 32);

	const cols = clamp(Number(args.cols ?? 10), 1, 50);
	const rows = clamp(Number(args.rows ?? 4), 1, 50);
	const count = clamp(Number(args.count ?? cols * rows), 1, cols * rows);

	const charW = px * scale;
	const charH = px * scale;
	const width = cols * charW;
	const height = rows * charH;

	const base = sharp({
		create: { width, height, channels: 4, background: bg },
	});

	const composites = [];
	for (let i = 0; i < count; i++) {
		const rnd = mulberry32((seed + i * 1013904223) >>> 0);
		const { grid } = generateCharacter(px, rnd);
		const svg = toPixelSVG(grid, scale);

		composites.push({
			input: Buffer.from(svg),
			left: (i % cols) * charW,
			top: Math.floor(i / cols) * charH,
		});
	}

	const buffer = await base.composite(composites).png().toBuffer();
	return { buffer, width, height };
}
