// generators/spriteGen.js
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
function pick(arr, rnd) {
	return arr[Math.floor(rnd() * arr.length)];
}
function clamp(v, lo, hi) {
	return Math.max(lo, Math.min(hi, v));
}

// ---------- Color helpers ----------
function hexToRgb(hex) {
	const h = hex.replace('#', '');
	const n = parseInt(
		h.length === 3
			? h
					.split('')
					.map((c) => c + c)
					.join('')
			: h,
		16
	);
	return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}
function shade(rgb, amount) {
	return [
		clamp(rgb[0] + amount, 0, 255),
		clamp(rgb[1] + amount, 0, 255),
		clamp(rgb[2] + amount, 0, 255),
	];
}

// ---------- Pixel canvas ----------
function makePixelCanvas(w, h, bg = [0, 0, 0, 0]) {
	const buf = Buffer.alloc(w * h * 4, 0);
	for (let y = 0; y < h; y++) {
		for (let x = 0; x < w; x++) {
			const i = (y * w + x) * 4;
			buf[i] = bg[0];
			buf[i + 1] = bg[1];
			buf[i + 2] = bg[2];
			buf[i + 3] = bg[3];
		}
	}
	return { w, h, buf };
}
function setPx(c, x, y, rgba) {
	if (x < 0 || y < 0 || x >= c.w || y >= c.h) return;
	const i = (y * c.w + x) * 4;
	c.buf[i] = rgba[0];
	c.buf[i + 1] = rgba[1];
	c.buf[i + 2] = rgba[2];
	c.buf[i + 3] = rgba[3];
}
function rect(c, x, y, w, h, rgba) {
	for (let yy = y; yy < y + h; yy++) {
		for (let xx = x; xx < x + w; xx++) setPx(c, xx, yy, rgba);
	}
}
function outlineRect(c, x, y, w, h, rgba) {
	for (let xx = x; xx < x + w; xx++) {
		setPx(c, xx, y, rgba);
		setPx(c, xx, y + h - 1, rgba);
	}
	for (let yy = y; yy < y + h; yy++) {
		setPx(c, x, yy, rgba);
		setPx(c, x + w - 1, yy, rgba);
	}
}

// ---------- Sprite generation ----------
function generateSprite({ seed = 1 } = {}) {
	const rnd = mulberry32(seed);

	const W = 16;
	const H = 24;

	const canvas = makePixelCanvas(W, H, [0, 0, 0, 0]);

	const SKIN = ['#F6D1B5', '#E7B98E', '#D9A27D', '#B97A56', '#8D5524'];
	const HAIR = [
		'#2D1B12',
		'#4A2F1A',
		'#7A4A2A',
		'#D4A373',
		'#C0C0C0',
		'#B87333',
	];
	const SHIRT = [
		'#3B82F6',
		'#22C55E',
		'#F97316',
		'#A855F7',
		'#EF4444',
		'#111827',
	];
	const PANTS = ['#1F2937', '#334155', '#0F172A', '#3F3F46', '#7C3AED'];

	const skin = hexToRgb(pick(SKIN, rnd));
	const hair = hexToRgb(pick(HAIR, rnd));
	const shirt = hexToRgb(pick(SHIRT, rnd));
	const pants = hexToRgb(pick(PANTS, rnd));

	const shadow = [0, 0, 0, 80];

	const headX = 5,
		headY = 2,
		headW = 6,
		headH = 6;
	const bodyX = 5,
		bodyY = 8,
		bodyW = 6,
		bodyH = 7;
	const legY = 15;

	rect(canvas, headX, headY, headW, headH, [...skin, 255]);
	rect(canvas, headX, headY + headH - 1, headW, 1, [...shade(skin, -18), 255]);

	const hairStyle = pick(['cap', 'bangs', 'part', 'curlyTop'], rnd);
	if (hairStyle === 'cap') {
		rect(canvas, headX, headY, headW, 2, [...hair, 255]);
		rect(canvas, headX + 1, headY + 2, headW - 2, 1, [...hair, 255]);
	} else if (hairStyle === 'bangs') {
		rect(canvas, headX, headY, headW, 2, [...hair, 255]);
		rect(canvas, headX, headY + 2, 2, 1, [...hair, 255]);
		rect(canvas, headX + headW - 2, headY + 2, 2, 1, [...hair, 255]);
	} else if (hairStyle === 'part') {
		rect(canvas, headX, headY, headW, 2, [...hair, 255]);
		rect(canvas, headX + 1, headY + 2, 2, 1, [...hair, 255]);
		rect(canvas, headX + 3, headY + 2, 2, 1, [...shade(hair, 18), 255]);
	} else {
		rect(canvas, headX, headY, headW, 2, [...hair, 255]);
		setPx(canvas, headX + 1, headY + 2, [...hair, 255]);
		setPx(canvas, headX + 3, headY + 2, [...hair, 255]);
		setPx(canvas, headX + 4, headY + 2, [...shade(hair, 18), 255]);
	}

	const eye = pick(['brown', 'blue', 'green', 'dark'], rnd);
	const eyeRGB =
		eye === 'blue'
			? [90, 160, 255]
			: eye === 'green'
				? [80, 200, 120]
				: eye === 'brown'
					? [160, 110, 70]
					: [30, 30, 30];

	setPx(canvas, headX + 1, headY + 3, [...eyeRGB, 255]);
	setPx(canvas, headX + 4, headY + 3, [...eyeRGB, 255]);

	if (rnd() < 0.5) setPx(canvas, headX + 1, headY + 2, [255, 255, 255, 180]);
	if (rnd() < 0.5) setPx(canvas, headX + 4, headY + 2, [255, 255, 255, 180]);

	const mouthY = headY + 5;
	const mouth = pick(['smile', 'flat', 'o'], rnd);
	const mouthCol = [...shade(skin, -55), 255];
	if (mouth === 'smile') {
		setPx(canvas, headX + 2, mouthY, mouthCol);
		setPx(canvas, headX + 3, mouthY, mouthCol);
		setPx(canvas, headX + 2, mouthY - 1, [...shade(skin, -65), 200]);
		setPx(canvas, headX + 3, mouthY - 1, [...shade(skin, -65), 200]);
	} else if (mouth === 'flat') {
		setPx(canvas, headX + 2, mouthY, mouthCol);
		setPx(canvas, headX + 3, mouthY, mouthCol);
	} else {
		setPx(canvas, headX + 2, mouthY, mouthCol);
		setPx(canvas, headX + 3, mouthY, mouthCol);
		setPx(canvas, headX + 2, mouthY - 1, mouthCol);
		setPx(canvas, headX + 3, mouthY - 1, mouthCol);
	}

	rect(canvas, bodyX, bodyY, bodyW, bodyH, [...shirt, 255]);
	rect(canvas, bodyX, bodyY + bodyH - 1, bodyW, 1, [...shade(shirt, -20), 255]);

	const armColor = shade(shirt, -10);
	rect(canvas, bodyX - 1, bodyY + 1, 1, 4, [...armColor, 255]);
	rect(canvas, bodyX + bodyW, bodyY + 1, 1, 4, [...armColor, 255]);
	rect(canvas, bodyX - 1, bodyY + 5, 1, 1, [...skin, 255]);
	rect(canvas, bodyX + bodyW, bodyY + 5, 1, 1, [...skin, 255]);

	rect(canvas, bodyX, legY, bodyW, 4, [...pants, 255]);
	setPx(canvas, bodyX + 2, legY + 2, [...shade(pants, -15), 255]);
	setPx(canvas, bodyX + 3, legY + 2, [...shade(pants, -15), 255]);

	const shoe = shade(pants, -40);
	rect(canvas, bodyX, legY + 4, 2, 1, [...shoe, 255]);
	rect(canvas, bodyX + bodyW - 2, legY + 4, 2, 1, [...shoe, 255]);

	const acc = pick(['none', 'glasses', 'hat'], rnd);
	if (acc === 'glasses') {
		const g = [20, 20, 20, 200];
		outlineRect(canvas, headX + 0, headY + 3, 3, 2, g);
		outlineRect(canvas, headX + 3, headY + 3, 3, 2, g);
		setPx(canvas, headX + 2, headY + 4, g);
		setPx(canvas, headX + 3, headY + 4, g);
	} else if (acc === 'hat') {
		const brim = shade(hair, -20);
		rect(canvas, headX - 1, headY - 1, headW + 2, 1, [...brim, 255]);
		rect(canvas, headX, headY - 2, headW, 1, [...hair, 255]);
	}

	// faux outline
	const outlinePoints = [];
	const isSolid = (x, y) => {
		if (x < 0 || y < 0 || x >= W || y >= H) return false;
		return canvas.buf[(y * W + x) * 4 + 3] > 0;
	};
	for (let y = 0; y < H; y++) {
		for (let x = 0; x < W; x++) {
			if (!isSolid(x, y)) continue;
			for (const [dx, dy] of [
				[1, 0],
				[-1, 0],
				[0, 1],
				[0, -1],
			]) {
				const nx = x + dx,
					ny = y + dy;
				if (!isSolid(nx, ny)) outlinePoints.push([nx, ny]);
			}
		}
	}
	for (const [x, y] of outlinePoints) setPx(canvas, x, y, shadow);

	return canvas;
}

// ---------- EXPORT: Parascene-compatible generator ----------
export default async function generateSpriteGen(args = {}) {
	const seed = Number.isFinite(args.seed) ? args.seed : Date.now() % 1000000;
	const scale = Number.isFinite(args.scale)
		? Math.max(1, Math.floor(args.scale))
		: 12;

	const sprite = generateSprite({ seed });

	const buffer = await sharp(sprite.buf, {
		raw: { width: sprite.w, height: sprite.h, channels: 4 },
	})
		.resize(sprite.w * scale, sprite.h * scale, { kernel: 'nearest' })
		.png()
		.toBuffer();

	return {
		buffer,
		width: sprite.w * scale,
		height: sprite.h * scale,
	};
}
