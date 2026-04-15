import crypto from 'crypto';
import {
	OPEN_SANS_FAMILY,
	ensureFontFilesExists,
	escapeSvgText,
	renderOpenSansSvgToPng,
} from '../lib/openSansEmbedded.js';

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

function capitalize(s) {
	return s.charAt(0).toUpperCase() + s.slice(1);
}

// Normalize punctuation so fonts behave better
function normalizeText(s) {
	return String(s)
		.replaceAll('’', "'")
		.replaceAll('“', '"')
		.replaceAll('”', '"')
		.replaceAll('—', '-')
		.replaceAll('–', '-');
}

const DIRECT = [
	'You are closer than you think.',
	'A small step today will matter more than you expect.',
	'Something delayed is still working in your favor.',
	'Your patience is about to pay off.',
	'The next answer comes after one simple action.',
	'Momentum begins with one honest step.',
	'An ordinary day can still bring good news.',
	'The thing you keep postponing is smaller than it looks.',
	'What feels slow now is still progress.',
	'The right choice will feel calmer, not louder.',
	'You do not need a perfect plan to begin.',
	'A useful opportunity is already moving toward you.',
	'The next door opens after the next tiny task.',
	'Good timing often looks like patience first.',
	'Your future is asking for consistency, not drama.',
	'One clear decision will remove a lot of noise.',
	'The effort you repeat quietly is changing everything.',
	'A kind boundary will protect a better yes.',
	'Something simple will solve something heavy.',
	'Today rewards focus more than force.',
	'A quiet win is still a win.',
	'You are building something better than you realize.',
	'Small progress still counts.',
	'One honest conversation can change a lot.',
	'The simplest plan may be the strongest one.',
	'Your consistency is creating luck.',
	'You can restart without calling it failure.',
	'The answer may arrive in a smaller form than expected.',
	'You already have enough to begin.',
	'Clarity likes movement.',
];

const POOLS = {
	timing: [
		'Soon',
		'Before long',
		'This week',
		'In a quiet moment',
		'When you least expect it',
		'After one small decision',
		'The next time you slow down',
		'Once you stop rushing',
		'Before this chapter ends',
		'Very quietly',
		'At the right moment',
		'During an ordinary day',
		'When the pressure lifts',
		'After a short delay',
		'By the time you stop checking',
		'When you return to basics',
		'Right after you simplify things',
		'As your patience settles in',
		'After one brave choice',
		'The moment you stop forcing it',
		'When your attention returns',
		'In the middle of something small',
	],
	subject: [
		'a helpful coincidence',
		'an unexpected answer',
		'a small opportunity',
		'a better option',
		'a delayed message',
		'an unlikely ally',
		'a useful idea',
		'a welcome change',
		'a hidden shortcut',
		'a gentle surprise',
		'a lucky opening',
		'a missing piece',
		'a simple solution',
		'an overdue reply',
		'a fresh perspective',
		'a better direction',
		'a quiet breakthrough',
		'a second chance',
		'a kind reminder',
		'an old idea',
		'a timely nudge',
		'a strong next step',
	],
	action: [
		'will find you',
		'will become clear',
		'will change your direction',
		'will make the next step easier',
		'will arrive at the right time',
		'will work out better than planned',
		'will open a new path',
		'will feel obvious in hindsight',
		'will show up unexpectedly',
		'will remove more stress than expected',
		'will quietly help you forward',
		'will settle something important',
		'will reveal its value',
		'will make more sense soon',
		'will reward your patience',
		'will lead to better timing',
		'will restore your momentum',
		'will unlock progress',
		'will bring relief',
		'will simplify things',
		'will point you in the right direction',
		'will give you useful clarity',
	],
	condition: [
		'if you stay open to it',
		'if you keep things simple',
		'when you stop overthinking',
		'when you ask the honest question',
		'when you choose the calmer path',
		'after you finish what is already in front of you',
		'if you let go of the extra noise',
		'when you stop trying to rush the ending',
		'if you trust the smaller step',
		'after one clear decision',
		'when you return to what matters',
		'if you stop chasing the perfect version',
		'when you make room for it',
		'after a little patience',
		'when you focus on the next task only',
		'if you leave some room to breathe',
		'when you simplify the plan',
		'if you listen more closely',
		'when you choose steadiness over speed',
		'after you let one thing go',
		'if you stop forcing an answer',
		'when you follow what already makes sense',
	],
	trait: [
		'your patience',
		'your consistency',
		'your honesty',
		'your effort',
		'your calm focus',
		'your quiet discipline',
		'your kindness',
		'your restraint',
		'your courage',
		'your timing',
		'your curiosity',
		'your persistence',
		'your steady work',
		'your practical thinking',
		'your willingness to begin',
		'your ability to adapt',
		'your clear boundaries',
		'your softer approach',
		'your attention to detail',
		'your grounded energy',
		'your thoughtful pause',
		'your next choice',
	],
	reward: [
		'is about to be rewarded',
		'will pay off',
		'is building something real',
		'will make room for progress',
		'is creating more momentum than you realize',
		'is opening the right door',
		'will lead somewhere useful',
		'is doing invisible work',
		'will soon become obvious',
		'is solving more than one problem at once',
		'will bring better results than rushing',
		'is setting up a better future',
		'will be worth the wait',
		'is stronger than it looks',
		'will outlast the chaos',
		'is quietly changing your path',
		'will create a useful opening',
		'is preparing something good',
		'will guide the next step',
		'has not gone unnoticed by life',
		'is turning into an advantage',
		'will make the next move easier',
	],
	advice: [
		'Finish one small thing first.',
		'Trust the simpler option.',
		'Do the obvious step before the clever one.',
		'Let consistency do the heavy lifting.',
		'Choose clarity over speed.',
		'Leave room for the better version of the plan.',
		'Say yes only to what you can carry well.',
		'Protect your energy before you spend it.',
		'Start before you feel fully ready.',
		'Make the next move easy to repeat.',
		'Listen to what feels quietly right.',
		'Stop polishing what only needs finishing.',
		'Return to the basics.',
		'Take the smaller win seriously.',
		'Pick progress over proving something.',
		'Pause before reacting.',
		'Keep one promise to yourself today.',
		'Simplify before expanding.',
		'Follow the next clear signal.',
		'Let one decision reduce ten others.',
		'Focus on what you can actually finish.',
		'Choose the plan that still works on a tired day.',
	],
	result: [
		'The rest will get easier after that.',
		'The next answer will show up faster.',
		'That is where your momentum begins.',
		'That will clear more than you expect.',
		'That will save you more time than force ever could.',
		'That is how the door opens.',
		'That is where the better timing starts.',
		'That will matter more than it seems.',
		'That is enough to change the day.',
		'The bigger piece follows the smaller one.',
		'That will point the way forward.',
		'That is how confusion starts to leave.',
		'That will make the next choice easier.',
		'The path will look lighter after that.',
		'What follows may surprise you.',
		'The right help may arrive after that.',
		'That is where things begin to click.',
		'Something useful is waiting on the other side of that.',
		'That will shift more than one thing.',
		'The calm answer tends to arrive there.',
		'That is where luck likes to appear.',
		'Better timing often begins exactly there.',
	],
	observation: [
		'Not every delay is a denial.',
		'The quieter path may still be the right one.',
		'The answer is often smaller than the worry.',
		'What is meant for you does not need panic.',
		'The useful path is rarely the loudest one.',
		'Some doors open because you stopped pushing.',
		'The next step does not need to be dramatic.',
		'Peace is also a kind of progress.',
		'Slow work can still build strong results.',
		'What feels ordinary may be doing important work.',
		'Simple choices often create lasting change.',
		'There is wisdom in repeating what works.',
		'A steady pace can beat a brilliant rush.',
		'The right answer may arrive without fanfare.',
		'Something small is already going your way.',
		'You do not need to carry every possibility.',
		'Timing improves when pressure leaves.',
		'Not every unfinished thing is failing.',
		'Clarity grows when the noise goes down.',
		'Quiet progress still changes your life.',
		'The next opening may come through ease, not force.',
		'Your energy matters as much as your effort.',
	],
};

function buildPattern1(rng) {
	return `${pick(rng, POOLS.timing)}, ${pick(rng, POOLS.subject)} ${pick(
		rng,
		POOLS.action
	)} ${pick(rng, POOLS.condition)}.`;
}

function buildPattern2(rng) {
	return `${capitalize(pick(rng, POOLS.trait))} ${pick(rng, POOLS.reward)}.`;
}

function buildPattern3(rng) {
	return `${pick(rng, POOLS.advice)} ${pick(rng, POOLS.result)}`;
}

function buildPattern4(rng) {
	return `${pick(rng, POOLS.observation)}`;
}

function buildPattern5(rng) {
	return `${pick(rng, POOLS.timing)}, ${pick(rng, POOLS.subject)} ${pick(
		rng,
		POOLS.action
	)}.`;
}

function isGoodFortune(text) {
	if (!text) return false;
	if (text.length < 24 || text.length > 135) return false;
	if (!/[.!?]$/.test(text)) return false;
	if (/\bwhen you\.$/i.test(text)) return false;
	if (/\bif you\.$/i.test(text)) return false;
	if (/\s{2,}/.test(text)) return false;
	return true;
}

function makeFortune(rng) {
	const builders = [
		() => pick(rng, DIRECT),
		() => buildPattern1(rng),
		() => buildPattern2(rng),
		() => buildPattern3(rng),
		() => buildPattern4(rng),
		() => buildPattern5(rng),
	];

	for (let i = 0; i < 20; i++) {
		const fortune = normalizeText(
			builders[Math.floor(rng() * builders.length)]()
		);
		if (isGoodFortune(fortune)) return fortune;
	}

	return normalizeText(pick(rng, DIRECT));
}

function wrapText(text, maxCharsPerLine = 30, maxLines = 4) {
	const words = text.split(/\s+/);
	const lines = [];
	let line = '';

	for (const w of words) {
		const test = line ? `${line} ${w}` : w;
		if (test.length <= maxCharsPerLine) {
			line = test;
		} else {
			if (line) lines.push(line);
			line = w;
		}
	}

	if (line) lines.push(line);

	if (lines.length <= maxLines) return lines;

	// fallback 1: allow slightly longer lines
	const retry = [];
	line = '';

	for (const w of words) {
		const test = line ? `${line} ${w}` : w;
		if (test.length <= 36) {
			line = test;
		} else {
			if (line) retry.push(line);
			line = w;
		}
	}

	if (line) retry.push(line);

	if (retry.length <= maxLines) return retry;

	// fallback 2: graceful trim
	const clipped = retry.slice(0, maxLines);
	clipped[maxLines - 1] = clipped[maxLines - 1].replace(/[,. ]+$/, '') + '...';
	return clipped;
}

export default async function fortuneCookie(args = {}) {
	console.log('Font exists:', ensureFontFilesExists());

	const seed = seedToInt(args.seed);
	const rng = mulberry32(seed);

	const fortune = makeFortune(rng);
	const lines = wrapText(fortune, 30, 4);

	const cookieA = pick(rng, ['#E7B980', '#E3B072', '#DDA968', '#E9BE86']);
	const cookieB = pick(rng, ['#D89C58', '#D49A55', '#C98B4C', '#D59B5C']);
	const shadow = 'rgba(0,0,0,0.18)';

	const W = 1024;
	const H = 1024;

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
			return `<text x="512" y="${500 + dy}" text-anchor="middle" font-family="${OPEN_SANS_FAMILY}"
				font-size="26" font-weight="700" fill="#111"
			>${escapeSvgText(ln)}</text>`;
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

  <text x="512" y="940" text-anchor="middle" font-family="${OPEN_SANS_FAMILY}" font-size="2" fill="rgba(0,0,0,0.35)">
    seed: ${seed}
  </text>
</svg>`;

	console.log(
		`Generated fortune cookie with seed ${seed} and fortune: ${fortune}`
	);

	const png = renderOpenSansSvgToPng(svg);

	return {
		buffer: png,
		fortune,
		seed,
		width: W,
		height: H,
	};
}
