import {
	OPEN_SANS_FAMILY,
	escapeSvgText,
	renderOpenSansSvgToPng,
} from '../lib/openSansEmbedded.js';

const palettes = [
	{
		name: 'Purple Portfolio',
		bg: '#f4f1ff',
		primary: '#6d28d9',
		dark: '#1f1b2e',
		text: '#5f5b6b',
		card: '#ffffff',
	},
	{
		name: 'Ocean Clean',
		bg: '#ecfeff',
		primary: '#0891b2',
		dark: '#0f172a',
		text: '#475569',
		card: '#ffffff',
	},
	{
		name: 'Sunset Startup',
		bg: '#fff7ed',
		primary: '#f97316',
		dark: '#1c1917',
		text: '#78716c',
		card: '#ffffff',
	},
	{
		name: 'Dark Neon',
		bg: '#111827',
		primary: '#a855f7',
		dark: '#ffffff',
		text: '#d1d5db',
		card: '#1f2937',
	},
	{
		name: 'Cyber Blue',
		bg: '#0b1020',
		primary: '#00e5ff',
		dark: '#ffffff',
		text: '#94a3b8',
		card: '#111827',
	},
	{
		name: 'Mint Fresh',
		bg: '#ecfdf5',
		primary: '#10b981',
		dark: '#064e3b',
		text: '#065f46',
		card: '#ffffff',
	},
	{
		name: 'Rose Gold',
		bg: '#fff1f2',
		primary: '#e11d48',
		dark: '#4c0519',
		text: '#9f1239',
		card: '#ffffff',
	},
	{
		name: 'Golden Dark',
		bg: '#0f172a',
		primary: '#facc15',
		dark: '#ffffff',
		text: '#cbd5f5',
		card: '#1e293b',
	},
];

function pick(arr) {
	return arr[Math.floor(Math.random() * arr.length)];
}

function randomColor() {
	const letters = '0123456789ABCDEF';
	let color = '#';

	for (let i = 0; i < 6; i++) {
		color += letters[Math.floor(Math.random() * 16)];
	}

	return color;
}

function generateRandomPalette() {
	const isDark = Math.random() > 0.5;
	const primary = randomColor();

	if (isDark) {
		return {
			name: 'Random Dark Theme',
			bg: '#0f172a',
			primary,
			dark: '#ffffff',
			text: '#cbd5e1',
			card: '#1e293b',
		};
	}

	return {
		name: 'Random Light Theme',
		bg: '#f8fafc',
		primary,
		dark: '#0f172a',
		text: '#475569',
		card: '#ffffff',
	};
}

function wrapText(text, maxChars = 24) {
	const words = String(text).split(/\s+/).filter(Boolean);
	const lines = [];
	let line = '';

	for (const word of words) {
		const test = line ? `${line} ${word}` : word;

		if (test.length > maxChars && line) {
			lines.push(line);
			line = word;
		 } else {
			line = test;
		}
	}

	if (line) lines.push(line);
	return lines.slice(0, 2);
}

function renderLines(lines, x, y, size, fill) {
	return `
	<text x="${x}" y="${y}" font-size="${size}" font-family="${OPEN_SANS_FAMILY}" font-weight="800" fill="${fill}">
		${lines
			.map(
				(line, i) =>
					`<tspan x="${x}" dy="${i === 0 ? 0 : size * 1.15}">${escapeSvgText(line)}</tspan>`
			)
			.join('')}
	</text>`;
}

export async function generateWebsiteDesign(options = {}) {
	const useRandom = Math.random() > 0.5;
	const palette = useRandom ? generateRandomPalette() : pick(palettes);

	const name = escapeSvgText(options.name || 'Jane Doe');

	const headlines = [
		`Hey, I'm ${name}`,
		`${name} builds beautiful websites`,
		`Creative digital work by ${name}`,
		`Modern designs for bold ideas`,
	];

	const headline = pick(headlines);
	const headlineLines = wrapText(headline, 22);

	const svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg width="1024" height="768" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="bgGradient" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="${palette.bg}" />
      <stop offset="100%" stop-color="${palette.primary}" stop-opacity="0.2"/>
    </linearGradient>
  </defs>

  <rect width="1024" height="768" fill="url(#bgGradient)" />

  <circle cx="850" cy="210" r="190" fill="${palette.primary}" opacity="0.18"/>
  <circle cx="900" cy="610" r="260" fill="${palette.primary}" opacity="0.10"/>
  <circle cx="120" cy="680" r="180" fill="${palette.primary}" opacity="0.08"/>

  <text x="90" y="80" font-size="28" font-family="${OPEN_SANS_FAMILY}" font-weight="700" fill="${palette.dark}">
    ${name}
  </text>

  <text x="560" y="80" font-size="18" font-family="${OPEN_SANS_FAMILY}" fill="${palette.text}">Home</text>
  <text x="640" y="80" font-size="18" font-family="${OPEN_SANS_FAMILY}" fill="${palette.text}">About</text>
  <text x="725" y="80" font-size="18" font-family="${OPEN_SANS_FAMILY}" fill="${palette.text}">Projects</text>

  <rect x="835" y="50" width="130" height="45" rx="10" fill="none" stroke="${palette.dark}" stroke-width="3"/>
  <text x="861" y="79" font-size="16" font-family="${OPEN_SANS_FAMILY}" font-weight="700" fill="${palette.dark}">Contact</text>

  ${renderLines(headlineLines, 90, 240, 52, palette.dark)}

  <text x="92" y="350" font-size="22" font-family="${OPEN_SANS_FAMILY}" fill="${palette.text}">
    Clean layouts, modern colors, and creative web experiences.
  </text>

  <text x="92" y="385" font-size="22" font-family="${OPEN_SANS_FAMILY}" fill="${palette.text}">
    Designed to feel polished, friendly, and professional.
  </text>

  <rect x="90" y="440" width="160" height="58" rx="12" fill="${palette.primary}" />
  <text x="122" y="477" font-size="18" font-family="${OPEN_SANS_FAMILY}" font-weight="700" fill="#ffffff">
    View Work
  </text>

  <rect x="270" y="440" width="160" height="58" rx="12" fill="none" stroke="${palette.dark}" stroke-width="3"/>
  <text x="302" y="477" font-size="18" font-family="${OPEN_SANS_FAMILY}" font-weight="700" fill="${palette.dark}">
    Learn More
  </text>

  <rect x="690" y="250" width="250" height="300" rx="28" fill="${palette.card}" opacity="0.95"/>
  <rect x="720" y="280" width="190" height="110" rx="20" fill="${palette.primary}" opacity="0.25"/>
  <circle cx="760" cy="335" r="32" fill="${palette.primary}" opacity="0.75"/>

  <rect x="720" y="420" width="180" height="16" rx="8" fill="${palette.text}" opacity="0.35"/>
  <rect x="720" y="450" width="140" height="16" rx="8" fill="${palette.text}" opacity="0.25"/>
  <rect x="720" y="495" width="85" height="34" rx="12" fill="${palette.primary}"/>

  <rect x="90" y="600" width="230" height="95" rx="20" fill="${palette.card}"/>
  <rect x="350" y="600" width="230" height="95" rx="20" fill="${palette.card}"/>
  <rect x="610" y="600" width="230" height="95" rx="20" fill="${palette.card}"/>

  <text x="120" y="650" font-size="22" font-family="${OPEN_SANS_FAMILY}" font-weight="700" fill="${palette.dark}">Web Design</text>
  <text x="380" y="650" font-size="22" font-family="${OPEN_SANS_FAMILY}" font-weight="700" fill="${palette.dark}">Branding</text>
  <text x="640" y="650" font-size="22" font-family="${OPEN_SANS_FAMILY}" font-weight="700" fill="${palette.dark}">UI Ideas</text>
</svg>`;

	const buffer = renderOpenSansSvgToPng(svg);

	return {
		buffer,
		mimeType: 'image/png',
		width: 1024,
		height: 768,
		extension: 'png',
	};
}