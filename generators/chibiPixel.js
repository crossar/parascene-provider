import sharp from 'sharp';

const html = String.raw;

const THEMES = ['sky', 'sakura', 'mint', 'night'];
const CHARACTERS = ['catblob', 'slime']; // base archetype

function mulberry32(seed) {
	let t = seed >>> 0;
	return function () {
		t += 0x6d2b79f5;
		let r = Math.imul(t ^ (t >>> 15), 1 | t);
		r ^= r + Math.imul(r ^ (r >>> 7), 61 | r);
		return ((r ^ (r >>> 14)) >>> 0) / 4294967296;
	};
}

function clamp(n, a, b) {
	return Math.max(a, Math.min(b, n));
}

function pickRandom(arr, rnd) {
	return arr[Math.floor(rnd() * arr.length)];
}

function chance(p, rnd) {
	return rnd() < p;
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

function mixHex(hexA, hexB, t) {
	const a = hexA.replace('#', '');
	const b = hexB.replace('#', '');
	const ar = parseInt(a.slice(0, 2), 16);
	const ag = parseInt(a.slice(2, 4), 16);
	const ab = parseInt(a.slice(4, 6), 16);
	const br = parseInt(b.slice(0, 2), 16);
	const bg = parseInt(b.slice(2, 4), 16);
	const bb = parseInt(b.slice(4, 6), 16);

	const rr = Math.round(ar + (br - ar) * t)
		.toString(16)
		.padStart(2, '0');
	const rg = Math.round(ag + (bg - ag) * t)
		.toString(16)
		.padStart(2, '0');
	const rb = Math.round(ab + (bb - ab) * t)
		.toString(16)
		.padStart(2, '0');

	return `#${rr}${rg}${rb}`;
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

	const t = themes[theme] ?? themes.sky;
	const jitter = ([h, s, l], hJ = 12, sJ = 10, lJ = 8) => [
		(h + (rnd() * 2 - 1) * hJ + 360) % 360,
		clamp(s + (rnd() * 2 - 1) * sJ, 0, 100),
		clamp(l + (rnd() * 2 - 1) * lJ, 0, 100),
	];

	const bg1 = hslToHex(...jitter(t.bgA));
	const bg2 = hslToHex(...jitter(t.bgB));
	const accent = hslToHex(...jitter(t.accent, 18, 12, 10));
	const star = hslToHex(...jitter(t.star, 6, 8, 6));
	const outline = theme === 'night' ? '#0b1020' : '#2b2b35';

	return { bg1, bg2, accent, star, outline };
}

function pixelRect(x, y, size, color, rx = 0, opacity = 1) {
	return `<rect x="${x}" y="${y}" width="${size}" height="${size}" fill="${color}" rx="${rx}" opacity="${opacity}"/>`;
}

function generateStars({ w, h, grid, rnd, starColor }) {
	const pixels = [];
	const count = Math.floor(((w * h) / (grid * grid)) * 0.02);

	for (let i = 0; i < count; i++) {
		const gx = Math.floor(rnd() * (w / grid)) * grid;
		const gy = Math.floor(rnd() * (h / grid)) * grid;

		const kind = Math.floor(rnd() * 3);
		if (kind === 0) {
			pixels.push(pixelRect(gx, gy, grid, starColor, 1));
		} else if (kind === 1) {
			pixels.push(pixelRect(gx, gy, grid, starColor, 1));
			pixels.push(pixelRect(gx + grid, gy, grid, starColor, 1));
			pixels.push(pixelRect(gx, gy + grid, grid, starColor, 1));
			pixels.push(pixelRect(gx + grid, gy + grid, grid, starColor, 1));
		} else {
			pixels.push(pixelRect(gx, gy, grid, starColor, 1));
			pixels.push(pixelRect(gx - grid, gy, grid, starColor, 1));
			pixels.push(pixelRect(gx + grid, gy, grid, starColor, 1));
			pixels.push(pixelRect(gx, gy - grid, grid, starColor, 1));
			pixels.push(pixelRect(gx, gy + grid, grid, starColor, 1));
		}
	}
	return pixels.join('');
}

/**
 * Randomized character generator:
 * - random body shape (round / squircle / slime droplet)
 * - random color (not just palette accent)
 * - random add-ons: ears / horns / arms / legs / tail-ish nub
 * - random face style (uwu, smile, :3, sleepy, surprised)
 */
function generateCharacter({ w, h, grid, rnd, outline, baseKind }) {
	const snap = (v) => Math.floor(v / grid) * grid;

	// Placement with tiny wiggle
	const cx = snap(w * (0.5 + (rnd() * 0.08 - 0.04)));
	const cy = snap(h * (0.6 + (rnd() * 0.06 - 0.03)));

	// Size
	const r = snap(w * (0.14 + rnd() * 0.04)); // radius-ish in pixels
	const rx = r;
	const ry = snap(r * (0.85 + rnd() * 0.35));

	// Character color palette (randomized)
	const hue = rnd() * 360;
	const bodyColor = hslToHex(hue, 55 + rnd() * 25, 60 + rnd() * 18);
	const bodyShade = mixHex(bodyColor, outline, 0.35); // subtle shadow
	const bodyHighlight = mixHex(bodyColor, '#ffffff', 0.55);
	const blush = hslToHex((hue + 320) % 360, 75, 72);

	// Shape style
	const shapeStyle = pickRandom(
		baseKind === 'slime'
			? ['droplet', 'round', 'squircle']
			: ['round', 'squircle', 'round'],
		rnd
	);

	// Feature toggles
	const earsStyle = pickRandom(['none', 'cat', 'bunny', 'bear', 'tiny'], rnd);
	const hornsStyle = pickRandom(['none', 'devil', 'unicorn', 'nubs'], rnd);
	const armsStyle = pickRandom(['none', 'stubby', 'wave', 'bothUp'], rnd);
	const legsStyle = pickRandom(['none', 'nubs', 'two', 'tiny'], rnd);
	const faceStyle = pickRandom(
		['uwu', 'smile', 'cat3', 'sleepy', 'surprised', 'sparkleEyes'],
		rnd
	);

	// Avoid “too many hats”: if horns exist, reduce ears chance
	const hasHorns = hornsStyle !== 'none' && chance(0.65, rnd);
	const hasEars =
		earsStyle !== 'none' && (!hasHorns ? chance(0.85, rnd) : chance(0.25, rnd));

	const hasArms = armsStyle !== 'none' && chance(0.8, rnd);
	const hasLegs = legsStyle !== 'none' && chance(0.8, rnd);

	// Build filled set for outline generation
	const filled = new Set();

	const inShape = (x, y) => {
		// x,y are pixel top-left; use center for distance
		const px = x + grid / 2;
		const py = y + grid / 2;

		const dx = (px - cx) / (rx || 1);
		const dy = (py - cy) / (ry || 1);

		if (shapeStyle === 'round') {
			return dx * dx + dy * dy <= 1.08;
		}
		if (shapeStyle === 'squircle') {
			// superellipse: |x|^n + |y|^n <= 1
			const n = 3.4; // squircle-ish
			return Math.pow(Math.abs(dx), n) + Math.pow(Math.abs(dy), n) <= 1.03;
		}
		// droplet: round top, flatter bottom
		// shift dy so bottom bulges a bit
		const ddy = dy + 0.15;
		const roundPart = dx * dx + ddy * ddy <= 1.05;
		const bottomCut = py <= cy + ry * 0.95; // keep it from becoming huge
		return roundPart && bottomCut;
	};

	const left = snap(cx - rx * 1.25);
	const right = snap(cx + rx * 1.25);
	const top = snap(cy - ry * 1.35);
	const bottom = snap(cy + ry * 1.35);

	for (let y = top; y <= bottom; y += grid) {
		for (let x = left; x <= right; x += grid) {
			if (inShape(x, y)) {
				filled.add(`${x},${y}`);
			}
		}
	}

	// Add-ons modify filled set too (ears/horns/arms/legs)
	const addPixel = (x, y) => filled.add(`${snap(x)},${snap(y)}`);

	// EARS
	if (hasEars) {
		const earY = cy - ry * 1.05;
		const earXOff = rx * 0.6;

		if (earsStyle === 'cat' || earsStyle === 'tiny') {
			// triangular-ish ears
			const eScale = earsStyle === 'tiny' ? 0.7 : 1;
			for (let i = 0; i < 3; i++) {
				addPixel(cx - earXOff - i * grid * eScale, earY + i * grid * eScale);
				addPixel(cx + earXOff + i * grid * eScale, earY + i * grid * eScale);
			}
			addPixel(cx - earXOff, earY);
			addPixel(cx + earXOff, earY);
		} else if (earsStyle === 'bunny') {
			// tall ears
			for (let k = 0; k < 5; k++) {
				addPixel(cx - earXOff, earY - k * grid);
				addPixel(cx + earXOff, earY - k * grid);
			}
			// widen near base
			addPixel(cx - earXOff - grid, earY + grid);
			addPixel(cx + earXOff + grid, earY + grid);
		} else if (earsStyle === 'bear') {
			// round bumps
			addPixel(cx - earXOff, earY + grid);
			addPixel(cx - earXOff - grid, earY + 2 * grid);
			addPixel(cx - earXOff + grid, earY + 2 * grid);

			addPixel(cx + earXOff, earY + grid);
			addPixel(cx + earXOff - grid, earY + 2 * grid);
			addPixel(cx + earXOff + grid, earY + 2 * grid);
		}
	}

	// HORNS
	if (hasHorns) {
		const hornY = cy - ry * 1.05;
		const hornXOff = rx * 0.45;
		if (hornsStyle === 'devil') {
			// two small horns
			addPixel(cx - hornXOff, hornY);
			addPixel(cx - hornXOff - grid, hornY + grid);
			addPixel(cx - hornXOff, hornY + grid);

			addPixel(cx + hornXOff, hornY);
			addPixel(cx + hornXOff + grid, hornY + grid);
			addPixel(cx + hornXOff, hornY + grid);
		} else if (hornsStyle === 'unicorn') {
			// single center horn
			for (let k = 0; k < 4; k++) addPixel(cx, hornY - k * grid);
			addPixel(cx - grid, hornY - grid);
			addPixel(cx + grid, hornY - grid);
		} else if (hornsStyle === 'nubs') {
			addPixel(cx - hornXOff, hornY + grid);
			addPixel(cx + hornXOff, hornY + grid);
		}
	}

	// ARMS
	if (hasArms) {
		const armY = cy + ry * (0.05 + rnd() * 0.08);
		const armXOff = rx * 1.05;

		const armLen = pickRandom([2, 3, 4], rnd);
		const makeArm = (side, pose) => {
			const dir = side === 'L' ? -1 : 1;
			const ax = cx + dir * armXOff;
			const ay = armY;

			if (pose === 'stubby') {
				addPixel(ax, ay);
				addPixel(ax + dir * grid, ay);
			} else if (pose === 'wave') {
				for (let i = 0; i < armLen; i++)
					addPixel(ax + dir * i * grid, ay - i * grid);
				addPixel(ax + dir * (armLen - 1) * grid, ay - armLen * grid);
			} else if (pose === 'bothUp') {
				for (let i = 0; i < armLen; i++)
					addPixel(ax + dir * i * grid, ay - i * grid);
				addPixel(ax + dir * (armLen - 1) * grid, ay - armLen * grid);
			}
		};

		if (armsStyle === 'stubby') {
			makeArm('L', 'stubby');
			makeArm('R', 'stubby');
		} else if (armsStyle === 'wave') {
			makeArm(chance(0.5, rnd) ? 'L' : 'R', 'wave');
			// other side stub
			makeArm('L', 'stubby');
			makeArm('R', 'stubby');
		} else if (armsStyle === 'bothUp') {
			makeArm('L', 'bothUp');
			makeArm('R', 'bothUp');
		}
	}

	// LEGS
	if (hasLegs) {
		const legY = cy + ry * 1.0;
		const legXOff = rx * (0.35 + rnd() * 0.12);
		if (legsStyle === 'nubs' || legsStyle === 'tiny') {
			const height = legsStyle === 'tiny' ? 1 : 2;
			for (let k = 0; k < height; k++) {
				addPixel(cx - legXOff, legY + k * grid);
				addPixel(cx + legXOff, legY + k * grid);
			}
		} else if (legsStyle === 'two') {
			for (let k = 0; k < 3; k++) {
				addPixel(cx - legXOff, legY + k * grid);
				addPixel(cx + legXOff, legY + k * grid);
			}
			// little feet
			addPixel(cx - legXOff - grid, legY + 3 * grid);
			addPixel(cx + legXOff + grid, legY + 3 * grid);
		}
	}

	// Build SVG pixels: outline first, then fill, then shade/highlight, then face
	const neighbors = [
		[-grid, 0],
		[grid, 0],
		[0, -grid],
		[0, grid],
	];

	const outlinePixels = [];
	filled.forEach((key) => {
		const [x, y] = key.split(',').map(Number);
		for (const [ox, oy] of neighbors) {
			const nk = `${x + ox},${y + oy}`;
			if (!filled.has(nk)) {
				outlinePixels.push(pixelRect(x, y, grid, outline, 1));
				break;
			}
		}
	});

	const bodyPixels = [];
	filled.forEach((key) => {
		const [x, y] = key.split(',').map(Number);
		bodyPixels.push(pixelRect(x, y, grid, bodyColor, 1));
	});

	// Shadow blob bottom-right
	const shadePixels = [];
	filled.forEach((key) => {
		const [x, y] = key.split(',').map(Number);
		const dx = (x - cx) / (rx || 1);
		const dy = (y - cy) / (ry || 1);
		// shadow region: bottom-right
		if (dx > 0.15 && dy > 0.1 && chance(0.35, rnd)) {
			shadePixels.push(pixelRect(x, y, grid, bodyShade, 1, 0.7));
		}
	});

	// Highlight cluster top-left
	const highlightPixels = [];
	const hx = snap(cx - rx * 0.45);
	const hy = snap(cy - ry * 0.45);
	highlightPixels.push(pixelRect(hx, hy, grid, bodyHighlight, 2, 0.9));
	highlightPixels.push(pixelRect(hx + grid, hy, grid, bodyHighlight, 2, 0.9));
	highlightPixels.push(pixelRect(hx, hy + grid, grid, bodyHighlight, 2, 0.9));

	// FACE
	const facePixels = [];
	const eyeColor = '#14141f';
	const white = '#ffffff';

	const eyeY = snap(cy - ry * 0.2);
	const eyeXOff = snap(rx * 0.35);

	const put = (x, y, color, rx = 1, op = 1) =>
		facePixels.push(pixelRect(snap(x), snap(y), grid, color, rx, op));

	// Common blush positions
	const blushY = snap(cy + ry * 0.05);

	if (faceStyle === 'uwu') {
		// eyes as little arcs (2 pixels each)
		put(cx - eyeXOff, eyeY, eyeColor);
		put(cx - eyeXOff + grid, eyeY + grid, eyeColor);
		put(cx + eyeXOff, eyeY, eyeColor);
		put(cx + eyeXOff - grid, eyeY + grid, eyeColor);

		// w mouth
		const my = snap(cy + ry * 0.18);
		put(cx, my, eyeColor);
		put(cx - grid, my + grid, eyeColor);
		put(cx + grid, my + grid, eyeColor);

		// blush
		put(cx - eyeXOff - grid, blushY, blush, 2, 0.75);
		put(cx + eyeXOff - grid, blushY, blush, 2, 0.75);
	} else if (faceStyle === 'smile') {
		// dot eyes + curved smile
		put(cx - eyeXOff, eyeY, eyeColor);
		put(cx + eyeXOff, eyeY, eyeColor);

		const my = snap(cy + ry * 0.2);
		put(cx - grid, my, eyeColor);
		put(cx, my + grid, eyeColor);
		put(cx + grid, my, eyeColor);

		put(cx - eyeXOff - grid, blushY, blush, 2, 0.6);
		put(cx + eyeXOff - grid, blushY, blush, 2, 0.6);
	} else if (faceStyle === 'cat3') {
		// dot eyes + :3 mouth
		put(cx - eyeXOff, eyeY, eyeColor);
		put(cx + eyeXOff, eyeY, eyeColor);

		const my = snap(cy + ry * 0.18);
		put(cx, my, eyeColor);
		put(cx - grid, my + grid, eyeColor);
		put(cx + grid, my + grid, eyeColor);

		put(cx - eyeXOff - grid, blushY, blush, 2, 0.7);
		put(cx + eyeXOff - grid, blushY, blush, 2, 0.7);
	} else if (faceStyle === 'sleepy') {
		// sleepy lines for eyes + tiny mouth
		put(cx - eyeXOff - grid, eyeY, eyeColor);
		put(cx - eyeXOff, eyeY, eyeColor);
		put(cx - eyeXOff + grid, eyeY, eyeColor);

		put(cx + eyeXOff - grid, eyeY, eyeColor);
		put(cx + eyeXOff, eyeY, eyeColor);
		put(cx + eyeXOff + grid, eyeY, eyeColor);

		const my = snap(cy + ry * 0.18);
		put(cx, my, eyeColor);

		put(cx - eyeXOff - grid, blushY, blush, 2, 0.45);
		put(cx + eyeXOff - grid, blushY, blush, 2, 0.45);
	} else if (faceStyle === 'surprised') {
		// bigger eyes + O mouth
		put(cx - eyeXOff, eyeY, eyeColor);
		put(cx - eyeXOff, eyeY + grid, eyeColor);
		put(cx + eyeXOff, eyeY, eyeColor);
		put(cx + eyeXOff, eyeY + grid, eyeColor);

		// highlights
		put(cx - eyeXOff + grid, eyeY - grid, white, 1, 1);
		put(cx + eyeXOff + grid, eyeY - grid, white, 1, 1);

		// O mouth (2x2)
		const my = snap(cy + ry * 0.2);
		put(cx, my, eyeColor);
		put(cx + grid, my, eyeColor);
		put(cx, my + grid, eyeColor);
		put(cx + grid, my + grid, eyeColor);

		put(cx - eyeXOff - grid, blushY, blush, 2, 0.55);
		put(cx + eyeXOff - grid, blushY, blush, 2, 0.55);
	} else if (faceStyle === 'sparkleEyes') {
		// sparkle eyes
		const eLx = cx - eyeXOff;
		const eRx = cx + eyeXOff;

		// left eye block
		put(eLx, eyeY, eyeColor);
		put(eLx + grid, eyeY, eyeColor);
		put(eLx, eyeY + grid, eyeColor);
		put(eLx + grid, eyeY + grid, eyeColor);
		put(eLx + grid, eyeY, white, 1, 1); // sparkle
		put(eLx, eyeY + grid, white, 1, 1);

		// right eye block
		put(eRx, eyeY, eyeColor);
		put(eRx + grid, eyeY, eyeColor);
		put(eRx, eyeY + grid, eyeColor);
		put(eRx + grid, eyeY + grid, eyeColor);
		put(eRx + grid, eyeY, white, 1, 1);
		put(eRx, eyeY + grid, white, 1, 1);

		// smile
		const my = snap(cy + ry * 0.2);
		put(cx - grid, my, eyeColor);
		put(cx, my + grid, eyeColor);
		put(cx + grid, my, eyeColor);

		put(cx - eyeXOff - grid, blushY, blush, 2, 0.65);
		put(cx + eyeXOff - grid, blushY, blush, 2, 0.65);
	}

	return `
    <g opacity="0.98">
      ${outlinePixels.join('')}
      ${bodyPixels.join('')}
      ${shadePixels.join('')}
      ${highlightPixels.join('')}
      ${facePixels.join('')}
    </g>
  `;
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

	// Deterministic if seed is provided
	const rnd = mulberry32(
		typeof seed === 'number'
			? seed
			: String(seed)
					.split('')
					.reduce((a, c) => a + c.charCodeAt(0), 0)
	);

	// Randomize if not provided
	const finalTheme = theme ?? pickRandom(THEMES, rnd);
	const baseKind = character ?? pickRandom(CHARACTERS, rnd);

	const pal = pastelPalette(rnd, finalTheme);

	// Work at smaller res, then nearest-neighbor upscale
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
				<radialGradient id="vig" cx="50%" cy="45%" r="70%">
					<stop offset="55%" stop-color="#000000" stop-opacity="0" />
					<stop offset="100%" stop-color="#000000" stop-opacity="0.22" />
				</radialGradient>
			</defs>

			<rect width="100%" height="100%" fill="url(#bg)" />
			<rect width="100%" height="100%" fill="url(#vig)" />

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
				outline: pal.outline,
				baseKind,
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
		width,
		height,
		meta: {
			seed,
			theme: finalTheme,
			baseKind,
			pixelSize,
			scale,
		},
	};
}

export default generateAnimePixelSticker;
