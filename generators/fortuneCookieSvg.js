// generators/fortuneCookieSvg.js
import crypto from 'crypto';

function mulberry32(seed) {
	let t = seed >>> 0;
	return function () {
		t += 0x6d2b79f5;
		let r = Math.imul(t ^ (t >>> 15), 1 | t);
		r ^= r + Math.imul(r ^ (r >>> 7), 61 | r);
		return ((r ^ (r >>> 14)) >>> 0) / 4294967296;
	};
}

function seedToInt(seed) {
	if (typeof seed === 'number' && Number.isFinite(seed)) return seed | 0;
	const s =
		typeof seed === 'string' && seed.trim() ? seed.trim() : crypto.randomUUID();
	const hash = crypto.createHash('sha256').update(s).digest();
	return hash.readInt32LE(0);
}

function pick(rng, arr) {
	return arr[Math.floor(rng() * arr.length)];
}

function escXml(str) {
	return String(str)
		.replaceAll('&', '&amp;')
		.replaceAll('<', '&lt;')
		.replaceAll('>', '&gt;')
		.replaceAll('"', '&quot;')
		.replaceAll("'", '&apos;');
}

// --- LOTS of fortunes (mix of direct + templated)
const DIRECT = [
	'When one door closes, another opens.',
	'Your future self is quietly rooting for you.',
	'You don’t need permission to begin.',
	'The detour is part of the map.',
	'Make it 10% better, not perfect.',
	'Consistency beats intensity.',
	'Your patience is doing invisible work.',
	'You’re not behind. You’re loading assets.',
	'Curiosity beats confidence—ask the better question.',
	'Rest is part of the strategy.',
	'A small decision today becomes a big shortcut tomorrow.',
	'An old idea returns with better timing.',
	'A kind boundary is still a boundary.',
	'The simplest plan is the one you’ll actually do.',
	'Finish one small thing. The next door appears.',
	'Your next win starts with one loose end.',
	'Your calm is more powerful than your rush.',
	'A tiny habit is a quiet spell.',
	'A message arrives when you stop refreshing.',
	'Do the obvious thing first. Then the clever thing.',
	'The moment you start, the fog thins out.',
	'Your work will speak when you stop interrupting it with doubt.',
	'Small steps count. Even the sneaky ones.',
	'Your timing is improving.',
	'You’re allowed to outgrow your old plans.',
	'The universe rewards follow-through.',
	'A soft answer unlocks a hard door.',
	'Bravery can be quiet.',
	'You’re closer than you think—stop moving the finish line.',
	'Today’s boring work becomes tomorrow’s freedom.',
];

const POOLS = {
	openers: [
		'Soon,',
		'Before the week ends,',
		'When you least expect it,',
		'In a small moment,',
		'Quietly,',
		'This season,',
		'During your next decision,',
		'After you finish one small task,',
	],
	subjects: [
		'a hidden opportunity',
		'a helpful coincidence',
		'an old idea',
		'a new routine',
		'a surprising invitation',
		'an unlikely ally',
		'a delayed message',
		'a tiny risk',
	],
	verbs: [
		'will reveal itself',
		'will change your direction',
		'will reward your patience',
		'will simplify everything',
		'will open a new path',
		'will test your courage',
		'will bring clarity',
		'will make you laugh',
	],
	twists: [
		'if you stay curious.',
		'if you stop overthinking.',
		'disguised as inconvenience.',
		'when you choose the simpler option.',
		'after you ask for help.',
		'when you act gently.',
		'but only once—notice it.',
		'without you chasing it.',
	],
};

function makeFortune(rng) {
	// 55% direct, 45% templated
	if (rng() < 0.55) return pick(rng, DIRECT);
	return `${pick(rng, POOLS.openers)} ${pick(rng, POOLS.subjects)} ${pick(
		rng,
		POOLS.verbs
	)} ${pick(rng, POOLS.twists)}`;
}

// Split into 1–3 lines for SVG text
function wrapText(text, maxCharsPerLine = 28) {
	const words = text.split(/\s+/);
	const lines = [];
	let line = '';
	for (const w of words) {
		const test = line ? `${line} ${w}` : w;
		if (test.length <= maxCharsPerLine) line = test;
		else {
			if (line) lines.push(line);
			line = w;
		}
	}
	if (line) lines.push(line);
	return lines.slice(0, 3);
}

export default async function fortuneCookieSvg(args = {}) {
	const seed = seedToInt(args.seed);
	const rng = mulberry32(seed);

	const fortune = makeFortune(rng);
	const lines = wrapText(fortune, 30);

	// Random warm cookie colors
	const cookieA = pick(rng, ['#E7B980', '#E3B072', '#DDA968', '#E9BE86']);
	const cookieB = pick(rng, ['#D89C58', '#D49A55', '#C98B4C', '#D59B5C']);
	const shadow = 'rgba(0,0,0,0.18)';

	// SVG canvas size
	const W = 1024;
	const H = 1024;

	// Paper strip position (center)
	const stripY = 500;

	const textSvg = lines
		.map((ln, i) => {
			const dy = (i - (lines.length - 1) / 2) * 46;
			return `<text x="512" y="${stripY + dy}" text-anchor="middle" font-family="Georgia, serif" font-size="42" font-weight="700" fill="#111">${escXml(
				ln
			)}</text>`;
		})
		.join('\n');

	const svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
  <defs>
    <filter id="softShadow" x="-20%" y="-20%" width="140%" height="140%">
      <feDropShadow dx="0" dy="18" stdDeviation="18" flood-color="${shadow}"/>
    </filter>

    <linearGradient id="bg" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#ffffff"/>
      <stop offset="100%" stop-color="#f7f7f7"/>
    </linearGradient>

    <radialGradient id="cookieGradA" cx="40%" cy="35%" r="70%">
      <stop offset="0%" stop-color="${cookieA}"/>
      <stop offset="100%" stop-color="${cookieB}"/>
    </radialGradient>

    <radialGradient id="cookieGradB" cx="60%" cy="40%" r="75%">
      <stop offset="0%" stop-color="${cookieA}"/>
      <stop offset="100%" stop-color="${cookieB}"/>
    </radialGradient>
  </defs>

  <!-- Background -->
  <rect width="${W}" height="${H}" fill="url(#bg)"/>

  <!-- Cookie halves -->
  <g filter="url(#softShadow)">
    <!-- Left cookie -->
    <path d="M180 380
             C160 540, 250 710, 420 760
             C520 790, 590 760, 640 700
             C520 690, 450 610, 420 520
             C390 430, 320 360, 240 340
             C210 335, 190 350, 180 380 Z"
          fill="url(#cookieGradA)"/>

    <!-- Right cookie -->
    <path d="M844 390
             C864 545, 775 715, 602 765
             C502 794, 435 765, 382 705
             C506 694, 580 615, 612 525
             C644 435, 712 365, 792 345
             C815 339, 835 354, 844 390 Z"
          fill="url(#cookieGradB)"/>

    <!-- Cookie texture dots -->
    <g opacity="0.22" fill="#8a5b2b">
      ${Array.from({ length: 70 })
				.map(() => {
					const x = Math.floor(rng() * 680) + 170;
					const y = Math.floor(rng() * 430) + 330;
					const r = Math.floor(rng() * 5) + 2;
					return `<circle cx="${x}" cy="${y}" r="${r}"/>`;
				})
				.join('\n')}
    </g>
  </g>

  <!-- Fortune paper strip -->
  <g filter="url(#softShadow)">
    <rect x="220" y="450" width="584" height="140" rx="14" fill="#ffffff"/>
    <rect x="220" y="450" width="584" height="140" rx="14" fill="none" stroke="rgba(0,0,0,0.12)" stroke-width="4"/>
  </g>

  <!-- Fortune text -->
  ${textSvg}

  <!-- Small footer -->
  <text x="512" y="940" text-anchor="middle" font-family="ui-sans-serif, system-ui" font-size="22" fill="rgba(0,0,0,0.35)">
    seed: ${seed}
  </text>
</svg>`;

	return {
		svg,
		fortune,
		seed,
		width: W,
		height: H,
	};
}
