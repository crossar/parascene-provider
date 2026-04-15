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

/* ---------------- color helpers ---------------- */
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
	'#6B21A8',
	'#1D4ED8',
];

const EYES = [
	'#0F172A',
	'#3B82F6',
	'#60A5FA',
	'#10B981',
	'#A78BFA',
	'#8B5CF6',
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
	'#14B8A6',
	'#E11D48',
];

const BOTTOMS = [
	'#1F2937',
	'#334155',
	'#0F172A',
	'#6B7280',
	'#7C3AED',
	'#0EA5E9',
	'#1E293B',
];

const SHOES = ['#111827', '#3F3F46', '#78350F', '#0B0F1A', '#475569'];

/* ---------------- grid helpers ---------------- */
function makeEmptyGrid(px) {
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

function hLine(grid, x, y, w, color) {
	for (let i = 0; i < w; i++) setPx(grid, x + i, y, color);
}

function vLine(grid, x, y, h, color) {
	for (let i = 0; i < h; i++) setPx(grid, x, y + i, color);
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

/* ---------------- silhouette templates ---------------- */
const BODY_TYPES = [
	{ name: 'chibi', headW: 8, headH: 7, bodyW: 8, bodyH: 6, legH: 3, armH: 3 },
	{ name: 'slim', headW: 7, headH: 7, bodyW: 7, bodyH: 6, legH: 4, armH: 3 },
	{ name: 'stocky', headW: 8, headH: 6, bodyW: 9, bodyH: 6, legH: 3, armH: 3 },
	{ name: 'tiny', headW: 7, headH: 6, bodyW: 7, bodyH: 5, legH: 3, armH: 2 },
];

/* ---------------- hair / hat rules ---------------- */
function drawHair(grid, headX, headY, headW, headH, hair, rnd, options = {}) {
	const hairShade = darken(hair, 0.25);
	const compact = !!options.compact;

	const style = compact
		? pick(rnd, ['short', 'bangs', 'sidepart'])
		: pick(rnd, ['short', 'sidepart', 'bob', 'bangs', 'spiky', 'ponytail']);

	fillRect(grid, headX, headY, headW, 2, hair);

	if (style === 'short') {
		setPx(grid, headX, headY + 2, hairShade);
		setPx(grid, headX + headW - 1, headY + 2, hairShade);
	} else if (style === 'sidepart') {
		for (let x = headX + 1; x < headX + Math.floor(headW / 2); x++) {
			setPx(grid, x, headY + 2, hairShade);
		}
		setPx(grid, headX, headY + 2, hair);
	} else if (style === 'bob') {
		fillRect(grid, headX - 1, headY + 2, 1, Math.max(2, headH - 2), hairShade);
		fillRect(
			grid,
			headX + headW,
			headY + 2,
			1,
			Math.max(2, headH - 2),
			hairShade
		);
		hLine(grid, headX, headY + 2, headW, hair);
	} else if (style === 'bangs') {
		for (let x = headX; x < headX + headW; x++) {
			if ((x - headX) % 2 === 0 || chance(rnd, 0.35)) {
				setPx(grid, x, headY + 2, hairShade);
			}
		}
	} else if (style === 'spiky') {
		for (let x = headX; x < headX + headW; x++) {
			if (chance(rnd, 0.65)) setPx(grid, x, headY - 1, hair);
		}
		hLine(grid, headX, headY + 1, headW, hair);
	} else if (style === 'ponytail') {
		const side = chance(rnd, 0.5) ? -1 : 1;
		setPx(grid, headX + (side === -1 ? 0 : headW - 1), headY + 3, hairShade);
		setPx(grid, headX + (side === -1 ? -1 : headW), headY + 4, hairShade);
		setPx(grid, headX + (side === -1 ? -1 : headW), headY + 5, hairShade);
	}

	return { hair, style };
}

function drawHat(grid, cx, headX, headY, headW, rnd) {
	const hat = pick(rnd, ['cap', 'beanie', 'cowboy', 'crown']);
	const colors = ['#111827', '#334155', '#854D0E', '#7C3AED', '#BE123C'];
	const hatColor = pick(rnd, colors);
	const hatShade = darken(hatColor, 0.22);

	if (hat === 'cap') {
		fillRect(grid, headX, headY - 1, headW, 1, hatColor);
		fillRect(
			grid,
			headX + Math.floor(headW / 2),
			headY,
			Math.ceil(headW / 2),
			1,
			hatShade
		);
	} else if (hat === 'beanie') {
		fillRect(grid, headX, headY - 1, headW, 2, hatColor);
		setPx(grid, cx, headY - 2, hatColor);
	} else if (hat === 'cowboy') {
		fillRect(grid, headX - 1, headY, headW + 2, 1, hatColor);
		fillRect(grid, headX + 1, headY - 1, headW - 2, 1, hatColor);
		fillRect(grid, headX + 2, headY - 2, headW - 4, 1, hatShade);
	} else if (hat === 'crown') {
		hLine(grid, headX + 1, headY - 1, Math.max(3, headW - 2), '#FBBF24');
		setPx(grid, cx - 2, headY - 2, '#FBBF24');
		setPx(grid, cx, headY - 3, '#FBBF24');
		setPx(grid, cx + 2, headY - 2, '#FBBF24');
	}

	return { hat, hatColor };
}

/* ---------------- face ---------------- */
function drawFace(grid, cx, headX, headY, headW, headH, skin, rnd) {
	const eyes = pick(rnd, EYES);
	const eyeStyle = pick(rnd, ['dot', 'normal', 'sleepy', 'bright']);
	const mouth = pick(rnd, ['smile', 'neutral', 'smirk', 'o']);
	const brow = pick(rnd, ['none', 'none', 'raised', 'angry']);

	const eyeY = headY + 3;
	const mouthY = eyeY + 2;
	const eyeOffset = 2;

	const leftEyeX = cx - eyeOffset;
	const rightEyeX = cx + eyeOffset;

	setPx(grid, leftEyeX, eyeY, eyes);
	setPx(grid, rightEyeX, eyeY, eyes);

	if (eyeStyle === 'normal') {
		setPx(grid, leftEyeX, eyeY - 1, '#FFFFFF');
		setPx(grid, rightEyeX, eyeY - 1, '#FFFFFF');
	} else if (eyeStyle === 'sleepy') {
		setPx(grid, leftEyeX, eyeY - 1, '#111827');
		setPx(grid, rightEyeX, eyeY - 1, '#111827');
	} else if (eyeStyle === 'bright') {
		setPx(grid, leftEyeX, eyeY - 1, '#FFFFFF');
		setPx(grid, rightEyeX, eyeY - 1, '#FFFFFF');
		setPx(grid, leftEyeX + 1, eyeY, '#FFFFFF');
		setPx(grid, rightEyeX - 1, eyeY, '#FFFFFF');
	}

	if (brow === 'raised') {
		setPx(grid, leftEyeX, eyeY - 2, '#111827');
		setPx(grid, rightEyeX, eyeY - 2, '#111827');
	} else if (brow === 'angry') {
		setPx(grid, leftEyeX - 1, eyeY - 2, '#111827');
		setPx(grid, rightEyeX + 1, eyeY - 2, '#111827');
	}

	if (chance(rnd, 0.45)) {
		setPx(grid, cx, eyeY + 1, darken(skin, 0.16));
	}

	if (mouth === 'smile') {
		setPx(grid, cx - 1, mouthY, '#111827');
		setPx(grid, cx, mouthY + 1, '#111827');
		setPx(grid, cx + 1, mouthY, '#111827');
	} else if (mouth === 'neutral') {
		setPx(grid, cx - 1, mouthY, '#111827');
		setPx(grid, cx, mouthY, '#111827');
		setPx(grid, cx + 1, mouthY, '#111827');
	} else if (mouth === 'smirk') {
		setPx(grid, cx, mouthY, '#111827');
		setPx(grid, cx + 1, mouthY, '#111827');
	} else if (mouth === 'o') {
		setPx(grid, cx, mouthY, '#111827');
		setPx(grid, cx, mouthY + 1, '#111827');
	}

	if (chance(rnd, 0.15)) {
		setPx(grid, headX + 1, mouthY - 1, '#FCA5A5');
		setPx(grid, headX + headW - 2, mouthY - 1, '#FCA5A5');
	}

	return { eyes, eyeStyle, mouth, brow };
}

/* ---------------- accessories ---------------- */
function drawAccessories(grid, cx, headX, headY, headW, rnd) {
	const acc = pick(rnd, [
		'none',
		'none',
		'none',
		'none',
		'glasses',
		'scar',
		'earring',
		'mask',
	]);

	const eyeY = headY + 3;

	if (acc === 'glasses') {
		setPx(grid, cx - 2, eyeY, '#111827');
		setPx(grid, cx - 1, eyeY, '#111827');
		setPx(grid, cx, eyeY, '#111827');
		setPx(grid, cx + 1, eyeY, '#111827');
		setPx(grid, cx + 2, eyeY, '#111827');
	} else if (acc === 'scar') {
		setPx(grid, cx - 1, headY + 4, '#B91C1C');
		setPx(grid, cx, headY + 5, '#B91C1C');
	} else if (acc === 'earring') {
		setPx(grid, headX - 1, headY + 5, '#FBBF24');
	} else if (acc === 'mask') {
		fillRect(grid, headX + 1, headY + 4, headW - 2, 2, '#E5E7EB');
	}

	return { acc };
}

/* ---------------- outfit ---------------- */
function drawOutfit(grid, cx, bodyY, bodyW, bodyH, legH, armH, skin, rnd) {
	const top = pick(rnd, TOPS);
	const bottom = pick(rnd, BOTTOMS);
	const shoes = pick(rnd, SHOES);

	const topShade = darken(top, 0.22);
	const bottomShade = darken(bottom, 0.18);
	const bodyX = cx - Math.floor(bodyW / 2);

	const outfit = pick(rnd, ['tee', 'hoodie', 'dress', 'overalls', 'jacket']);
	const armPose = pick(rnd, ['down', 'down', 'bent', 'tucked']);

	fillRect(grid, bodyX - 1, bodyY, bodyW + 2, 1, top);

	if (outfit === 'tee') {
		fillRect(grid, bodyX, bodyY + 1, bodyW, bodyH - 1, top);
		hLine(grid, bodyX, bodyY + bodyH - 1, bodyW, topShade);
	} else if (outfit === 'hoodie') {
		fillRect(grid, bodyX, bodyY + 1, bodyW, bodyH - 1, top);
		hLine(grid, bodyX + 1, bodyY + 2, Math.max(2, bodyW - 2), topShade);
		setPx(grid, cx, bodyY + 3, lighten(top, 0.25));
		setPx(grid, cx - 1, bodyY + 4, topShade);
		setPx(grid, cx + 1, bodyY + 4, topShade);
	} else if (outfit === 'dress') {
		fillRect(grid, bodyX, bodyY + 1, bodyW, bodyH - 2, top);
		fillRect(grid, bodyX - 1, bodyY + bodyH - 1, bodyW + 2, 2, topShade);
	} else if (outfit === 'overalls') {
		fillRect(grid, bodyX, bodyY + 1, bodyW, bodyH - 1, bottom);
		fillRect(grid, bodyX + 1, bodyY + 1, bodyW - 2, 2, top);
		vLine(grid, bodyX + 1, bodyY + 1, 3, bottomShade);
		vLine(grid, bodyX + bodyW - 2, bodyY + 1, 3, bottomShade);
	} else if (outfit === 'jacket') {
		fillRect(grid, bodyX, bodyY + 1, bodyW, bodyH - 1, top);
		vLine(grid, cx, bodyY + 1, bodyH - 1, topShade);
		setPx(grid, cx - 1, bodyY + 2, lighten(top, 0.2));
		setPx(grid, cx + 1, bodyY + 2, lighten(top, 0.2));
		setPx(grid, cx, bodyY + 3, '#D1D5DB');
	}

	setPx(grid, cx, bodyY - 1, darken(skin, 0.08));
	if (chance(rnd, 0.5)) setPx(grid, cx - 1, bodyY - 1, darken(skin, 0.05));

	if (armPose === 'down') {
		fillRect(grid, bodyX - 1, bodyY + 1, 1, armH, skin);
		fillRect(grid, bodyX + bodyW, bodyY + 1, 1, armH, skin);
	} else if (armPose === 'bent') {
		fillRect(grid, bodyX - 1, bodyY + 1, 1, Math.max(2, armH - 1), skin);
		setPx(grid, bodyX, bodyY + armH, skin);
		fillRect(grid, bodyX + bodyW, bodyY + 1, 1, Math.max(2, armH - 1), skin);
		setPx(grid, bodyX + bodyW - 1, bodyY + armH, skin);
	} else if (armPose === 'tucked') {
		setPx(grid, bodyX, bodyY + 2, darken(skin, 0.08));
		setPx(grid, bodyX + bodyW - 1, bodyY + 2, darken(skin, 0.08));
	}

	const legY = bodyY + bodyH;
	const legW = 2;
	const gap = chance(rnd, 0.35) ? 2 : 1;
	const leftLegX = cx - gap - legW;
	const rightLegX = cx + gap - 1;

	fillRect(grid, leftLegX, legY, legW, legH, bottom);
	fillRect(grid, rightLegX, legY, legW, legH, bottom);

	if (chance(rnd, 0.35)) {
		setPx(grid, leftLegX, legY + legH - 1, bottomShade);
		setPx(grid, rightLegX + 1, legY + legH - 2, bottomShade);
	}

	fillRect(grid, leftLegX, legY + legH, legW, 1, shoes);
	fillRect(grid, rightLegX, legY + legH, legW, 1, shoes);

	return { top, bottom, shoes, outfit, armPose };
}

/* ---------------- main character ---------------- */
function generateCharacter(px, rnd) {
	const grid = makeEmptyGrid(px);

	const cx = Math.floor(px / 2);
	const skin = pick(rnd, SKIN);
	const template = pick(rnd, BODY_TYPES);

	const headW = template.headW;
	const headH = template.headH;
	const bodyW = template.bodyW;
	const bodyH = template.bodyH;
	const legH = template.legH;
	const armH = template.armH;

	const headX = cx - Math.floor(headW / 2);
	const headY = 3;

	fillRect(grid, headX, headY, headW, headH, skin);

	for (let x = headX + 1; x < headX + headW - 1; x++) {
		setPx(grid, x, headY + headH - 1, darken(skin, 0.1));
	}

	const useHat = chance(rnd, 0.22);
	const hairColor = pick(rnd, HAIR);

	const hairInfo = drawHair(grid, headX, headY, headW, headH, hairColor, rnd, {
		compact: useHat,
	});
	const faceInfo = drawFace(grid, cx, headX, headY, headW, headH, skin, rnd);
	const accInfo = drawAccessories(grid, cx, headX, headY, headW, rnd);
	const hatInfo = useHat ? drawHat(grid, cx, headX, headY, headW, rnd) : null;

	const bodyY = headY + headH + 1;
	const outfitInfo = drawOutfit(
		grid,
		cx,
		bodyY,
		bodyW,
		bodyH,
		legH,
		armH,
		skin,
		rnd
	);

	return {
		grid,
		meta: {
			template: template.name,
			skin,
			hair: hairInfo,
			face: faceInfo,
			accessories: accInfo,
			hat: hatInfo,
			outfit: outfitInfo,
		},
	};
}

/* ---------------- fixed-output generator ---------------- */
export default async function generatePersonaGen(args = {}) {
	const hasSeed =
		args.seed !== undefined &&
		args.seed !== null &&
		String(args.seed).trim() !== '';

	const seed = hasSeed
		? typeof args.seed === 'number'
			? args.seed >>> 0
			: hashStringToSeed(String(args.seed))
		: Math.floor(Math.random() * 2 ** 32);

	const bg = '#191C28';
	const targetWidth = 192;
	const targetHeight = 288;
	const px = 28;

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

	return {
		buffer,
		width: targetWidth,
		height: targetHeight,
		seed,
	};
}
