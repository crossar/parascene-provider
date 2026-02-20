// generators/wallpaperGen.js
// Procedural wallpaper generator (SVG -> PNG)
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

function intFromString(s) {
	let h = 2166136261;
	for (let i = 0; i < s.length; i++) {
		h ^= s.charCodeAt(i);
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

// ---------- Color helpers ----------
function hsl(h, s, l) {
	return `hsl(${Math.round(h)} ${Math.round(s)}% ${Math.round(l)}%)`;
}

function makePalette(rnd) {
	const base = rnd() * 360;
	const mode = pick(['analogous', 'complement', 'triad'], rnd);

	let hues;
	if (mode === 'analogous') hues = [base, base + 25, base - 25, base + 55];
	else if (mode === 'complement')
		hues = [base, base + 180, base + 30, base + 210];
	else hues = [base, base + 120, base + 240, base + 60];

	const sat = 55 + rnd() * 25; // 55–80
	const lightA = 35 + rnd() * 15; // 35–50
	const lightB = 60 + rnd() * 18; // 60–78

	return hues.map((h, i) =>
		hsl((h + 360) % 360, sat + (i % 2 ? 6 : -6), i % 2 ? lightB : lightA)
	);
}

function svgWallpaper({ width, height, seed }) {
	const rnd = mulberry32(seed);
	const [c1, c2, c3, c4] = makePalette(rnd);

	// Background gradient directions
	const x1 = Math.round(rnd() * 100);
	const y1 = Math.round(rnd() * 100);
	const x2 = Math.round(rnd() * 100);
	const y2 = Math.round(rnd() * 100);

	// Blob count and size
	const blobs = 6 + Math.floor(rnd() * 6); // 6–11
	const maxR = Math.min(width, height) * (0.18 + rnd() * 0.12);

	const blobSvgs = Array.from({ length: blobs }).map((_, i) => {
		const cx = rnd() * width;
		const cy = rnd() * height;
		const r = maxR * (0.5 + rnd());
		const fill = pick([c1, c2, c3, c4], rnd);
		const opacity = 0.18 + rnd() * 0.22;
		const blur = 20 + rnd() * 40;

		return `
      <g filter="url(#blur${i})" opacity="${opacity.toFixed(3)}">
        <circle cx="${cx.toFixed(1)}" cy="${cy.toFixed(1)}" r="${r.toFixed(
					1
				)}" fill="${fill}" />
      </g>
      <filter id="blur${i}">
        <feGaussianBlur stdDeviation="${blur.toFixed(1)}" />
      </filter>
    `;
	});

	// Subtle texture using turbulence
	const textureOpacity = 0.07 + rnd() * 0.06;

	// Slight vignette
	const vignetteOpacity = 0.12 + rnd() * 0.1;

	return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
  <defs>
    <linearGradient id="bg" x1="${x1}%" y1="${y1}%" x2="${x2}%" y2="${y2}%">
      <stop offset="0%" stop-color="${c1}" />
      <stop offset="50%" stop-color="${c2}" />
      <stop offset="100%" stop-color="${c3}" />
    </linearGradient>

    <radialGradient id="vignette" cx="50%" cy="50%" r="70%">
      <stop offset="55%" stop-color="black" stop-opacity="0"/>
      <stop offset="100%" stop-color="black" stop-opacity="${vignetteOpacity.toFixed(
				3
			)}"/>
    </radialGradient>

    <filter id="texture">
      <feTurbulence type="fractalNoise" baseFrequency="${(
				0.8 +
				rnd() * 0.6
			).toFixed(2)}" numOctaves="2" seed="${seed % 1000}" />
      <feColorMatrix type="matrix"
        values="1 0 0 0 0
                0 1 0 0 0
                0 0 1 0 0
                0 0 0 0.6 0" />
    </filter>
  </defs>

  <rect width="100%" height="100%" fill="url(#bg)"/>

  ${blobSvgs.join('\n')}

  <g opacity="${(0.1 + rnd() * 0.14).toFixed(3)}">
    <rect x="${(width * (0.05 + rnd() * 0.15)).toFixed(1)}"
          y="${(height * (0.05 + rnd() * 0.15)).toFixed(1)}"
          width="${(width * (0.55 + rnd() * 0.25)).toFixed(1)}"
          height="${(height * (0.08 + rnd() * 0.08)).toFixed(1)}"
          rx="${(18 + rnd() * 28).toFixed(1)}"
          fill="${c4}" />
  </g>

  <rect width="100%" height="100%" filter="url(#texture)" opacity="${textureOpacity.toFixed(
		3
	)}" />
  <rect width="100%" height="100%" fill="url(#vignette)" />
</svg>`;
}

export default async function wallpaperGen(args = {}) {
	// ✅ Defaults: always generate something even with empty args
	const width = 1024;
	const height = 1024;

	// ✅ Seed is optional; if missing, generate a random one
	let seed;
	if (
		args.seed !== undefined &&
		args.seed !== null &&
		String(args.seed).trim() !== ''
	) {
		if (typeof args.seed === 'number' && Number.isFinite(args.seed))
			seed = args.seed >>> 0;
		else seed = intFromString(String(args.seed));
	} else {
		// Random seed: use crypto if available, else time+random
		if (globalThis.crypto?.getRandomValues) {
			const u = new Uint32Array(1);
			globalThis.crypto.getRandomValues(u);
			seed = u[0] >>> 0;
		} else {
			seed = (Date.now() ^ Math.floor(Math.random() * 2 ** 31)) >>> 0;
		}
	}

	const svg = svgWallpaper({ width, height, seed });

	const buffer = await sharp(Buffer.from(svg))
		.png({ compressionLevel: 9, adaptiveFiltering: true })
		.toBuffer();

	return {
		buffer,
		width,
		height,
		seed,
	};
}
