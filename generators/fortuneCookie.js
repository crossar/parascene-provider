import crypto from 'crypto';
import sharp from 'sharp';

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

// ✅ Normalize punctuation so mobile fonts don’t choke
function normalizeText(s) {
	return String(s)
		.replaceAll('’', "'")
		.replaceAll('“', '"')
		.replaceAll('”', '"')
		.replaceAll('—', '-')
		.replaceAll('–', '-');
}

// ✅ Bigger quote list
const DIRECT = [
	'When one door closes, another opens.',
	'Your future self is quietly rooting for you.',
	'A small decision today becomes a big shortcut tomorrow.',
	"You don't need permission to begin.",
	'The detour is part of the map.',
	'Make it 10% better, not perfect.',
	'A lucky break is just preparation in disguise.',
	'Your patience is doing invisible work.',
	"The thing you're avoiding is the thing that will free you.",
	"You're not behind. You're loading assets.",
	'An old idea returns with better timing.',
	"A quiet 'no' protects a loud 'yes'.",
	'Your next win starts with one loose end.',
	'Curiosity beats confidence - ask the better question.',
	'Rest is part of the strategy.',
	'Keep it simple. Then make it beautiful.',
	'A message arrives when you stop refreshing.',
	"You're closer than you think - stop moving the finish line.",
	'Consistency beats intensity.',
	'A kind boundary is still a boundary.',
	'Bravery can be quiet.',
	'Finish one small thing. The next door appears.',
	'Small habits are quiet spells.',
	"Today's boring work becomes tomorrow's freedom.",
	'Your calm is more powerful than your rush.',
	'Make room for the better version of the plan.',
	'Say yes to the task you can finish.',
	'Momentum likes tiny beginnings.',
	'Do the obvious thing first. Then the clever thing.',
	'Your timing is improving.',
	'The answer is smaller than the fear.',
	"You're allowed to outgrow your old plans.",
	'You can restart without making it a crisis.',
	'Clarity comes after movement.',
	'One honest conversation can save weeks.',
	'Slow progress is still progress.',
	'Pick the next step, not the whole staircase.',
	'Energy follows attention.',
	'Less noise. More signal.',
	'Your curiosity is a compass.',
	"You're building something real.",
	'A tiny risk beats a big regret.',
	'Choose consistency over perfection.',
	'Make the plan easy to do on your worst day.',
	'Your next idea deserves a second draft.',
	"You don't need more time - you need fewer tabs.",
	'Small steps count. Even the sneaky ones.',
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
		'Right after you stop forcing it,',
		'The next time you show up anyway,',
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
		'a simple change',
		'a brave question',
		'a fresh option',
		'a small kindness',
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
		'will unlock momentum',
		'will quietly work out',
	],
	twists: [
		'if you stay curious.',
		'if you stop overthinking.',
		'disguised as inconvenience.',
		'when you choose the simpler option.',
		'after you ask for help.',
		'when you act gently.',
		'but only once - notice it.',
		'without you chasing it.',
		'when you stop trying to impress imaginary people.',
		'when you commit to the boring version.',
	],
};

function makeFortune(rng) {
	// ✅ More templated variety
	if (rng() < 0.35) return pick(rng, DIRECT);
	return `${pick(rng, POOLS.openers)} ${pick(rng, POOLS.subjects)} ${pick(
		rng,
		POOLS.verbs
	)} ${pick(rng, POOLS.twists)}`;
}

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

async function svgToPng1024(svgString) {
	const svgBuffer = Buffer.from(svgString, 'utf8');

	return await sharp(svgBuffer, {
		density: 144, // helps text/curves look crisp; not required but nice
	})
		// ensure the rasterization target size is exactly 1024x1024
		.resize(1024, 1024, { fit: 'fill' })
		.png({ compressionLevel: 9, adaptiveFiltering: true })
		.toBuffer();
}

export default async function fortuneCookie(args = {}) {
	const seed = seedToInt(args.seed);
	const rng = mulberry32(seed);

	const fortune = normalizeText(makeFortune(rng));
	const lines = wrapText(fortune, 30);

	const cookieA = pick(rng, ['#E7B980', '#E3B072', '#DDA968', '#E9BE86']);
	const cookieB = pick(rng, ['#D89C58', '#D49A55', '#C98B4C', '#D59B5C']);
	const shadow = 'rgba(0,0,0,0.18)';

	const W = 1024;
	const H = 1024;

	// ✅ WebView-safe font stack (fixes □□□□ on mobile)
	const FONT_STACK =
		"system-ui,-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Arial,'Noto Sans','Liberation Sans',sans-serif";

	// ✅ Dynamic strip sizing based on number of lines
	const stripX = 220;
	const stripW = 584;

	const lineStep = 52;
	const padTopBot = 54;
	const stripH = padTopBot + lines.length * lineStep;
	const stripY = 500 - stripH / 2;

	const stripFill = '#fffdf7';

	const textSvg = lines
		.map((ln, i) => {
			const dy = (i - (lines.length - 1) / 2) * 46;
			return `<text x="512" y="${500 + dy}" text-anchor="middle" font-family="${FONT_STACK}" font-size="42" font-weight="700" fill="#111">${escXml(
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

  <rect width="${W}" height="${H}" fill="url(#bg)"/>

  <g filter="url(#softShadow)">
    <path d="M180 380
             C160 540, 250 710, 420 760
             C520 790, 590 760, 640 700
             C520 690, 450 610, 420 520
             C390 430, 320 360, 240 340
             C210 335, 190 350, 180 380 Z"
          fill="url(#cookieGradA)"/>

    <path d="M844 390
             C864 545, 775 715, 602 765
             C502 794, 435 765, 382 705
             C506 694, 580 615, 612 525
             C644 435, 712 365, 792 345
             C815 339, 835 354, 844 390 Z"
          fill="url(#cookieGradB)"/>

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

  <g filter="url(#softShadow)">
    <rect x="${stripX}" y="${stripY}" width="${stripW}" height="${stripH}" rx="18" fill="${stripFill}"/>
    <rect x="${stripX}" y="${stripY}" width="${stripW}" height="${stripH}" rx="18" fill="none" stroke="rgba(0,0,0,0.12)" stroke-width="4"/>
  </g>

  ${textSvg}

  <text x="512" y="940" text-anchor="middle" font-family="${FONT_STACK}" font-size="22" fill="rgba(0,0,0,0.35)">
    seed: ${seed}
  </text>
</svg>`;

	return {
		buffer: await svgToPng1024(svg),
		// fortune,
		seed,
		width: W,
		height: H,
	};
}
