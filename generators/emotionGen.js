// emotionGen.js
// Procedural Pixel Emotion Portrait Generator (returns PNG buffer)
// Requires: npm i sharp

import sharp from 'sharp';

// ---------- Seeded RNG ----------
function mulberry32(seed) {
	let a = seed >>> 0;
	return function () {
		a |= 0;
		a = (a + 0x6d2b79f5) | 0;
		let t = Math.imul(a ^ (a >>> 15), 1 | a);
		t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
		return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
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

function clamp(n, a, b) {
	return Math.max(a, Math.min(b, n));
}
function pick(arr, rnd) {
	return arr[Math.floor(rnd() * arr.length)];
}
function chance(p, rnd) {
	return rnd() < p;
}

// ---------- Color helpers ----------
function hexToRgba(hex, a = 255) {
	const h = hex.replace('#', '').trim();
	const v = parseInt(
		h.length === 3
			? h
					.split('')
					.map((c) => c + c)
					.join('')
			: h,
		16
	);
	const r = (v >> 16) & 255;
	const g = (v >> 8) & 255;
	const b = v & 255;
	return [r, g, b, a];
}

function blendOver(dstRGBA, srcRGBA) {
	const sa = srcRGBA[3] / 255;
	const da = dstRGBA[3] / 255;
	const outA = sa + da * (1 - sa);
	if (outA <= 0) return [0, 0, 0, 0];
	const r = (srcRGBA[0] * sa + dstRGBA[0] * da * (1 - sa)) / outA;
	const g = (srcRGBA[1] * sa + dstRGBA[1] * da * (1 - sa)) / outA;
	const b = (srcRGBA[2] * sa + dstRGBA[2] * da * (1 - sa)) / outA;
	return [r | 0, g | 0, b | 0, (outA * 255) | 0];
}

// ---------- Pixel canvas ----------
function makeCanvas(w, h) {
	const buf = new Uint8ClampedArray(w * h * 4);
	return { w, h, buf };
}
function idxOf(x, y, w) {
	return (y * w + x) * 4;
}
function getPixel(c, x, y) {
	if (x < 0 || y < 0 || x >= c.w || y >= c.h) return [0, 0, 0, 0];
	const i = idxOf(x, y, c.w);
	return [c.buf[i], c.buf[i + 1], c.buf[i + 2], c.buf[i + 3]];
}
function setPixel(c, x, y, rgba) {
	if (x < 0 || y < 0 || x >= c.w || y >= c.h) return;
	const i = idxOf(x, y, c.w);
	c.buf[i] = rgba[0];
	c.buf[i + 1] = rgba[1];
	c.buf[i + 2] = rgba[2];
	c.buf[i + 3] = rgba[3];
}
function paintPixel(c, x, y, rgba) {
	if (x < 0 || y < 0 || x >= c.w || y >= c.h) return;
	const i = idxOf(x, y, c.w);
	const dst = [c.buf[i], c.buf[i + 1], c.buf[i + 2], c.buf[i + 3]];
	const out = blendOver(dst, rgba);
	c.buf[i] = out[0];
	c.buf[i + 1] = out[1];
	c.buf[i + 2] = out[2];
	c.buf[i + 3] = out[3];
}
function fillRect(c, x0, y0, w, h, rgba) {
	for (let y = y0; y < y0 + h; y++) {
		for (let x = x0; x < x0 + w; x++) setPixel(c, x, y, rgba);
	}
}
function drawEllipse(c, cx, cy, rx, ry, fillRGBA, outlineRGBA = null) {
	for (let y = Math.floor(cy - ry); y <= Math.ceil(cy + ry); y++) {
		for (let x = Math.floor(cx - rx); x <= Math.ceil(cx + rx); x++) {
			const dx = (x - cx) / rx;
			const dy = (y - cy) / ry;
			if (dx * dx + dy * dy <= 1) setPixel(c, x, y, fillRGBA);
		}
	}
	if (!outlineRGBA) return;

	for (let y = Math.floor(cy - ry) - 1; y <= Math.ceil(cy + ry) + 1; y++) {
		for (let x = Math.floor(cx - rx) - 1; x <= Math.ceil(cx + rx) + 1; x++) {
			const p = getPixel(c, x, y);
			if (p[3] === 0) continue;
			const neighbors = [
				getPixel(c, x + 1, y),
				getPixel(c, x - 1, y),
				getPixel(c, x, y + 1),
				getPixel(c, x, y - 1),
			];
			if (neighbors.some((n) => n[3] === 0)) setPixel(c, x, y, outlineRGBA);
		}
	}
}
function addDitherShadow(c, x0, y0, w, h, rgba, step = 2) {
	for (let y = y0; y < y0 + h; y++) {
		for (let x = x0; x < x0 + w; x++) {
			if ((x + y) % step === 0) paintPixel(c, x, y, rgba);
		}
	}
}

// ---------- Portrait building blocks ----------
function drawBackground(c, rnd) {
	const bg = pick(['#141a24', '#151517', '#1a1722', '#0f1b1a', '#1c1411'], rnd);
	fillRect(c, 0, 0, c.w, c.h, hexToRgba(bg, 255));

	const speck = hexToRgba('#ffffff', 12);
	const count = 70 + Math.floor(rnd() * 60);
	for (let i = 0; i < count; i++) {
		const x = (rnd() * c.w) | 0;
		const y = (rnd() * c.h) | 0;
		if (chance(0.7, rnd)) paintPixel(c, x, y, speck);
	}

	const haze = hexToRgba('#ffffff', 18);
	const yBand = 10 + ((rnd() * 12) | 0);
	for (let y = yBand; y < yBand + 6; y++) {
		for (let x = 0; x < c.w; x++) {
			if (chance(0.25, rnd)) paintPixel(c, x, y, haze);
		}
	}
}

function drawNeckAndShoulders(c, skin, outline) {
	drawEllipse(c, 32, 78, 22, 12, skin, outline);
	drawEllipse(c, 32, 64, 8, 10, skin, outline);

	const collar = hexToRgba('#0b0d12', 255);
	fillRect(c, 22, 82, 20, 6, collar);
	addDitherShadow(c, 22, 82, 20, 6, hexToRgba('#000000', 40), 2);
}

function drawHair(c, rnd, hairMain, hairShade, outline) {
	drawEllipse(c, 32, 33, 22, 18, hairMain, outline);

	const bangStyle = pick(['straight', 'parted', 'messy', 'curtain'], rnd);
	if (bangStyle === 'straight') {
		for (let x = 16; x <= 48; x++) {
			const drop = 1 + ((rnd() * 4) | 0);
			for (let y = 35; y < 35 + drop; y++) setPixel(c, x, y, hairShade);
		}
	} else if (bangStyle === 'parted') {
		for (let x = 16; x <= 32; x++) {
			const drop = 2 + ((rnd() * 4) | 0);
			for (let y = 35; y < 35 + drop; y++) setPixel(c, x, y, hairShade);
		}
		for (let x = 33; x <= 48; x++) {
			const drop = 1 + ((rnd() * 3) | 0);
			for (let y = 35; y < 35 + drop; y++) setPixel(c, x, y, hairShade);
		}
	} else if (bangStyle === 'messy') {
		for (let x = 14; x <= 50; x++) {
			const drop = 1 + ((rnd() * 6) | 0);
			if (chance(0.85, rnd)) {
				for (let y = 34; y < 34 + drop; y++) setPixel(c, x, y, hairShade);
			}
		}
	} else {
		for (let x = 16; x <= 48; x++) {
			const centerDist = Math.abs(x - 32);
			const drop = clamp(7 - centerDist / 3, 1, 6) | 0;
			if (chance(0.9, rnd)) {
				for (let y = 34; y < 34 + drop; y++) setPixel(c, x, y, hairShade);
			}
		}
	}

	for (let y = 38; y <= 58; y++) {
		if (chance(0.8, rnd)) setPixel(c, 15, y, hairShade);
		if (chance(0.8, rnd)) setPixel(c, 49, y, hairShade);
	}
}

function drawHead(c, skin, skinShade, outline) {
	drawEllipse(c, 32, 44, 18, 20, skin, outline);
	addDitherShadow(c, 19, 45, 26, 18, skinShade, 3);
}

function drawEyesMouthBrows(c, rnd, emotionSpec, colors) {
	const { outline, eyeWhite, iris, blush, sweat, tear, shadow } = colors;

	const eyeY = 44 + emotionSpec.eyeYOffset;
	const eyeSpread = emotionSpec.eyeSpread;
	const eyeW = emotionSpec.eyeW;
	const eyeH = emotionSpec.eyeH;

	const leftX = 32 - eyeSpread;
	const rightX = 32 + eyeSpread;

	const eyeStyle =
		emotionSpec.eyeStyle ?? pick(['round', 'anime', 'thin', 'dot'], rnd);

	function drawEye(cx, cy, flip = 1) {
		if (eyeStyle === 'dot') {
			setPixel(c, cx, cy, outline);
			setPixel(c, cx, cy + 1, outline);
			return;
		}

		drawEllipse(c, cx, cy, eyeW, eyeH, eyeWhite, null);

		const pupilRx = Math.max(1, (eyeW / 2) | 0);
		const pupilRy = Math.max(1, (eyeH / 2) | 0);
		const dx = clamp(((rnd() * 3) | 0) - 1 + emotionSpec.pupilDX * flip, -2, 2);
		const dy = clamp(((rnd() * 3) | 0) - 1 + emotionSpec.pupilDY, -2, 2);
		drawEllipse(c, cx + dx, cy + dy, pupilRx, pupilRy, iris, null);

		if (chance(0.85, rnd))
			setPixel(c, cx - 1, cy - 1, hexToRgba('#ffffff', 180));

		for (let x = cx - eyeW - 1; x <= cx + eyeW + 1; x++) {
			if (chance(0.9, rnd)) setPixel(c, x, cy - eyeH - 1, outline);
		}
	}

	drawEye(leftX, eyeY, -1);
	drawEye(rightX, eyeY, 1);

	const browY = eyeY - 10 + emotionSpec.browYOffset;
	const browAng = emotionSpec.browAngle;
	for (let i = -6; i <= 6; i++) {
		const yL = (browY + (i * browAng) / 6) | 0;
		const yR = (browY + (-i * browAng) / 6) | 0;
		setPixel(c, leftX + i, yL, outline);
		setPixel(c, rightX + i, yR, outline);
	}

	const mouthY = 58 + emotionSpec.mouthYOffset;
	const mouth =
		emotionSpec.mouthStyle ??
		pick(['smile', 'flat', 'o', 'teeth', 'grimace'], rnd);

	if (mouth === 'smile') {
		for (let x = 26; x <= 38; x++) setPixel(c, x, mouthY, outline);
		setPixel(c, 26, mouthY - 1, outline);
		setPixel(c, 38, mouthY - 1, outline);
	} else if (mouth === 'flat') {
		for (let x = 27; x <= 37; x++) setPixel(c, x, mouthY, outline);
	} else if (mouth === 'o') {
		drawEllipse(c, 32, mouthY, 4, 3, shadow, outline);
	} else if (mouth === 'teeth') {
		fillRect(c, 27, mouthY - 1, 11, 4, hexToRgba('#ffffff', 255));
		for (let x = 26; x <= 38; x++) {
			setPixel(c, x, mouthY - 2, outline);
			setPixel(c, x, mouthY + 2, outline);
		}
		for (let y = mouthY - 1; y <= mouthY + 1; y++) {
			setPixel(c, 26, y, outline);
			setPixel(c, 38, y, outline);
		}
		for (let x = 29; x <= 36; x += 3) {
			for (let y = mouthY - 1; y <= mouthY + 1; y++)
				setPixel(c, x, y, hexToRgba('#d7d7d7', 255));
		}
	} else {
		for (let x = 27; x <= 37; x++) setPixel(c, x, mouthY, outline);
		for (let x = 28; x <= 36; x++)
			if (chance(0.6, rnd)) setPixel(c, x, mouthY + 1, outline);
	}

	if (emotionSpec.blush) {
		fillRect(c, 19, 56, 6, 3, blush);
		fillRect(c, 39, 56, 6, 3, blush);
		addDitherShadow(c, 19, 56, 6, 3, hexToRgba('#000000', 18), 2);
		addDitherShadow(c, 39, 56, 6, 3, hexToRgba('#000000', 18), 2);
	}

	if (emotionSpec.sweat) {
		paintPixel(c, 48, 49, sweat);
		paintPixel(c, 49, 50, sweat);
		paintPixel(c, 48, 51, sweat);
	}

	if (emotionSpec.tears) {
		paintPixel(c, leftX - 1, eyeY + 6, tear);
		paintPixel(c, leftX - 1, eyeY + 7, tear);
		paintPixel(c, rightX + 1, eyeY + 6, tear);
		paintPixel(c, rightX + 1, eyeY + 7, tear);
	}

	if (emotionSpec.underEyeShadow) {
		addDitherShadow(c, 18, eyeY + 6, 28, 6, shadow, 2);
	}
}

function addEmotionTint(c, emotion) {
	const tintMap = {
		rage: hexToRgba('#ff3b3b', 22),
		shy: hexToRgba('#ff7ad9', 18),
		smug: hexToRgba('#ffd27a', 16),
		crying: hexToRgba('#6bb8ff', 18),
		sleepy: hexToRgba('#b6a7ff', 16),
		shocked: hexToRgba('#ffffff', 14),
		determined: hexToRgba('#ffcf4d', 14),
		unhinged: hexToRgba('#a5ff6b', 14),
	};
	const tint = tintMap[emotion] ?? hexToRgba('#ffffff', 10);

	for (let y = 18; y < 82; y++) {
		for (let x = 10; x < 54; x++) {
			const p = getPixel(c, x, y);
			if (p[3] > 0 && (x + y) % 2 === 0) paintPixel(c, x, y, tint);
		}
	}
}

function addAccessory(c, rnd, outline) {
	const acc = pick(['none', 'bandaid', 'glasses', 'scar', 'halo'], rnd);
	if (acc === 'none') return acc;

	if (acc === 'bandaid') {
		const band = hexToRgba('#e9d7b8', 255);
		fillRect(c, 41, 53, 8, 4, band);
		for (let x = 42; x <= 47; x += 2)
			setPixel(c, x, 55, hexToRgba('#d2c1a5', 255));
		for (let x = 41; x <= 48; x++) {
			setPixel(c, x, 53, outline);
			setPixel(c, x, 56, outline);
		}
		for (let y = 54; y <= 55; y++) {
			setPixel(c, 41, y, outline);
			setPixel(c, 48, y, outline);
		}
	} else if (acc === 'glasses') {
		for (let x = 17; x <= 47; x++) setPixel(c, x, 44, outline);
		drawEllipse(c, 22, 46, 6, 5, hexToRgba('#000000', 0), outline);
		drawEllipse(c, 42, 46, 6, 5, hexToRgba('#000000', 0), outline);
		setPixel(c, 32, 46, outline);
		setPixel(c, 31, 46, outline);
		setPixel(c, 33, 46, outline);
	} else if (acc === 'scar') {
		for (let i = 0; i < 7; i++) {
			setPixel(c, 40 + i, 42 + i, outline);
			if (chance(0.6, rnd)) setPixel(c, 40 + i, 43 + i, outline);
		}
	} else if (acc === 'halo') {
		const halo = hexToRgba('#ffe07a', 210);
		for (let x = 22; x <= 42; x++) {
			paintPixel(c, x, 18, halo);
			paintPixel(c, x, 19, halo);
		}
		paintPixel(c, 21, 19, halo);
		paintPixel(c, 43, 19, halo);
	}
	return acc;
}

// ---------- Emotion specs ----------
const EMOTIONS = [
	'rage',
	'shy',
	'smug',
	'crying',
	'sleepy',
	'shocked',
	'determined',
	'unhinged',
];

function emotionSpec(emotion, rnd) {
	const base = {
		eyeYOffset: 0,
		eyeSpread: 9,
		eyeW: 5,
		eyeH: 4,
		pupilDX: 0,
		pupilDY: 0,
		browYOffset: 0,
		browAngle: 0,
		mouthYOffset: 0,
		blush: false,
		sweat: false,
		tears: false,
		underEyeShadow: false,
		eyeStyle: null,
		mouthStyle: null,
	};

	switch (emotion) {
		case 'rage':
			return {
				...base,
				eyeH: 3,
				pupilDY: -1,
				browAngle: 2,
				mouthStyle: pick(['teeth', 'grimace'], rnd),
				sweat: chance(0.35, rnd),
			};
		case 'shy':
			return {
				...base,
				eyeW: 6,
				eyeH: 5,
				browAngle: -1,
				mouthStyle: pick(['smile', 'flat'], rnd),
				blush: true,
				pupilDY: 1,
			};
		case 'smug':
			return {
				...base,
				eyeH: 3,
				pupilDX: 1,
				browAngle: -2,
				mouthStyle: 'smile',
			};
		case 'crying':
			return {
				...base,
				eyeW: 6,
				eyeH: 5,
				pupilDY: 2,
				browAngle: -1,
				mouthStyle: pick(['o', 'flat'], rnd),
				tears: true,
				blush: chance(0.25, rnd),
			};
		case 'sleepy':
			return {
				...base,
				eyeH: 2,
				eyeStyle: 'thin',
				mouthStyle: pick(['flat', 'o'], rnd),
				underEyeShadow: true,
				pupilDY: 2,
			};
		case 'shocked':
			return { ...base, eyeW: 7, eyeH: 6, browAngle: -2, mouthStyle: 'o' };
		case 'determined':
			return {
				...base,
				eyeH: 4,
				browAngle: 1,
				mouthStyle: pick(['flat', 'grimace'], rnd),
				pupilDY: -1,
			};
		case 'unhinged':
			return {
				...base,
				eyeW: 6,
				eyeH: 5,
				browAngle: 1,
				mouthStyle: pick(['smile', 'grimace'], rnd),
				underEyeShadow: true,
				pupilDX: pick([-1, 1], rnd),
				sweat: chance(0.25, rnd),
			};
		default:
			return base;
	}
}

// ---------- Exported generator ----------
export default async function generateEmotionPortrait(args = {}) {
	const baseW = 64;
	const baseH = 96;

	// defaults
	let scale = Number.isFinite(Number(args.scale)) ? Number(args.scale) : 3;
	scale = Math.floor(scale);
	if (!Number.isFinite(scale) || scale < 1) scale = 3;
	if (scale > 20) scale = 20; // optional safety cap

	// seed: allow numbers or strings
	let seed = args.seed;
	if (seed === undefined || seed === null || seed === '')
		seed = (Math.random() * 2 ** 32) >>> 0;
	else {
		const n = Number(seed);
		seed = Number.isFinite(n) ? n >>> 0 : hashStringToSeed(String(seed));
	}

	const rnd = mulberry32(seed);

	let emotion =
		typeof args.emotion === 'string' ? args.emotion.trim().toLowerCase() : '';
	if (!EMOTIONS.includes(emotion)) emotion = pick(EMOTIONS, rnd);

	const c = makeCanvas(baseW, baseH);

	const skinTones = [
		{ skin: '#f6d2b8', shade: '#e2b79d' },
		{ skin: '#efc39d', shade: '#d9a983' },
		{ skin: '#d9a57a', shade: '#c08b63' },
		{ skin: '#b97f57', shade: '#a26b47' },
		{ skin: '#8f5a3a', shade: '#784a31' },
	];

	const hairPalettes = [
		{ main: '#1c1b22', shade: '#121118' },
		{ main: '#3a2a1f', shade: '#281c14' },
		{ main: '#6a4b2c', shade: '#4d351f' },
		{ main: '#c2a27a', shade: '#9c7f5c' },
		{ main: '#6c78ff', shade: '#4b54b5' },
		{ main: '#ff6bb0', shade: '#b84c80' },
	];

	const skinPick = pick(skinTones, rnd);
	const hairPick = pick(hairPalettes, rnd);
	const outline = hexToRgba('#0b0d12', 255);

	const colors = {
		outline,
		skin: hexToRgba(skinPick.skin, 255),
		skinShade: hexToRgba(skinPick.shade, 70),
		hairMain: hexToRgba(hairPick.main, 255),
		hairShade: hexToRgba(hairPick.shade, 255),
		eyeWhite: hexToRgba('#f2f4ff', 255),
		iris: hexToRgba(
			pick(['#2d7dff', '#2bd4c7', '#8d5bff', '#ffb84d', '#ff4d6d'], rnd),
			255
		),
		blush: hexToRgba('#ff6b9a', 90),
		sweat: hexToRgba('#9fe6ff', 170),
		tear: hexToRgba('#6bb8ff', 170),
		shadow: hexToRgba('#000000', 70),
	};

	drawBackground(c, rnd);
	drawNeckAndShoulders(c, colors.skin, colors.outline);
	drawHead(c, colors.skin, colors.skinShade, colors.outline);
	drawHair(c, rnd, colors.hairMain, colors.hairShade, colors.outline);

	const spec = emotionSpec(emotion, rnd);
	drawEyesMouthBrows(c, rnd, spec, colors);

	const accessory = chance(0.45, rnd)
		? addAccessory(c, rnd, colors.outline)
		: 'none';
	addEmotionTint(c, emotion);

	const width = baseW * scale;
	const height = baseH * scale;

	const buffer = await sharp(Buffer.from(c.buf), {
		raw: { width: baseW, height: baseH, channels: 4 },
	})
		.resize(width, height, { kernel: 'nearest' })
		.png()
		.toBuffer();

	return {
		buffer,
		width,
		height,
		seed,
		emotion,
		accessory,
	};
}
