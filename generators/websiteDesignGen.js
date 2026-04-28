import {
	OPEN_SANS_FAMILY,
	escapeSvgText,
	renderOpenSansSvgToPng,
} from '../lib/openSansEmbedded.js';

const WIDTH = 1024;
const HEIGHT = 1024;

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
		text: '#cbd5e1',
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

function wrapText(text, maxChars = 20) {
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
	return lines.slice(0, 3);
}

function renderLines(lines, x, y, size, fill) {
	return `
	<text x="${x}" y="${y}" font-size="${size}" font-family="${OPEN_SANS_FAMILY}" font-weight="800" fill="${fill}">
		${lines
			.map(
				(line, i) =>
					`<tspan x="${x}" dy="${i === 0 ? 0 : size * 1.12}">${escapeSvgText(line)}</tspan>`
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
	const headlineLines = wrapText(headline, 20);

	const svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg width="${WIDTH}" height="${HEIGHT}" viewBox="0 0 ${WIDTH} ${HEIGHT}" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="bgGradient" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="${palette.bg}" />
      <stop offset="100%" stop-color="${palette.primary}" stop-opacity="0.28"/>
    </linearGradient>

    <filter id="shadow" x="-20%" y="-20%" width="140%" height="140%">
      <feDropShadow dx="0" dy="18" stdDeviation="18" flood-color="#000000" flood-opacity="0.16"/>
    </filter>
  </defs>

  <rect width="1024" height="1024" fill="url(#bgGradient)" />

  <!-- Background shapes -->
  <circle cx="850" cy="220" r="205" fill="${palette.primary}" opacity="0.16"/>
  <circle cx="930" cy="680" r="270" fill="${palette.primary}" opacity="0.12"/>
  <circle cx="130" cy="780" r="190" fill="${palette.primary}" opacity="0.08"/>

  <!-- Navbar -->
  <text x="88" y="90" font-size="30" font-family="${OPEN_SANS_FAMILY}" font-weight="800" fill="${palette.dark}">
    ${name}
  </text>

  <text x="560" y="88" font-size="18" font-family="${OPEN_SANS_FAMILY}" font-weight="600" fill="${palette.text}">Home</text>
  <text x="642" y="88" font-size="18" font-family="${OPEN_SANS_FAMILY}" font-weight="600" fill="${palette.text}">About</text>
  <text x="725" y="88" font-size="18" font-family="${OPEN_SANS_FAMILY}" font-weight="600" fill="${palette.text}">Projects</text>

  <rect x="840" y="55" width="130" height="48" rx="12" fill="none" stroke="${palette.dark}" stroke-width="3"/>
  <text x="872" y="86" font-size="16" font-family="${OPEN_SANS_FAMILY}" font-weight="800" fill="${palette.dark}">Contact</text>

  <!-- Hero text -->
  ${renderLines(headlineLines, 88, 260, 54, palette.dark)}

  <!-- Subtitle -->
  <text x="90" y="445" font-size="22" font-family="${OPEN_SANS_FAMILY}" fill="${palette.text}">
    Clean layouts, modern colors,
  </text>

  <text x="90" y="482" font-size="22" font-family="${OPEN_SANS_FAMILY}" fill="${palette.text}">
    and creative web experiences.
  </text>

  <text x="90" y="519" font-size="22" font-family="${OPEN_SANS_FAMILY}" fill="${palette.text}">
    Designed to feel polished and professional.
  </text>

  <!-- Buttons -->
  <rect x="88" y="585" width="165" height="60" rx="14" fill="${palette.primary}" filter="url(#shadow)" />
  <text x="123" y="623" font-size="18" font-family="${OPEN_SANS_FAMILY}" font-weight="800" fill="#ffffff">
    View Work
  </text>

  <rect x="275" y="585" width="170" height="60" rx="14" fill="none" stroke="${palette.dark}" stroke-width="3"/>
  <text x="313" y="623" font-size="18" font-family="${OPEN_SANS_FAMILY}" font-weight="800" fill="${palette.dark}">
    Learn More
  </text>

  <!-- Mockup card -->
  <rect x="705" y="340" width="240" height="305" rx="32" fill="${palette.card}" opacity="0.96" filter="url(#shadow)"/>
  <rect x="735" y="372" width="180" height="105" rx="22" fill="${palette.primary}" opacity="0.22"/>
  <circle cx="775" cy="425" r="32" fill="${palette.primary}" opacity="0.75"/>

  <rect x="735" y="515" width="165" height="16" rx="8" fill="${palette.text}" opacity="0.35"/>
  <rect x="735" y="548" width="130" height="16" rx="8" fill="${palette.text}" opacity="0.25"/>
  <rect x="735" y="592" width="85" height="36" rx="13" fill="${palette.primary}"/>

  <!-- Bottom feature cards -->
  <rect x="88" y="760" width="250" height="105" rx="22" fill="${palette.card}" opacity="0.96" filter="url(#shadow)"/>
  <rect x="387" y="760" width="250" height="105" rx="22" fill="${palette.card}" opacity="0.96" filter="url(#shadow)"/>
  <rect x="686" y="760" width="250" height="105" rx="22" fill="${palette.card}" opacity="0.96" filter="url(#shadow)"/>

  <text x="120" y="823" font-size="23" font-family="${OPEN_SANS_FAMILY}" font-weight="800" fill="${palette.dark}">Web Design</text>
  <text x="420" y="823" font-size="23" font-family="${OPEN_SANS_FAMILY}" font-weight="800" fill="${palette.dark}">Branding</text>
  <text x="720" y="823" font-size="23" font-family="${OPEN_SANS_FAMILY}" font-weight="800" fill="${palette.dark}">UI Ideas</text>

  <text x="88" y="945" font-size="15" font-family="${OPEN_SANS_FAMILY}" fill="${palette.text}" opacity="0.75">
    Palette: ${escapeSvgText(palette.name)}
  </text>
</svg>`;

	const buffer = renderOpenSansSvgToPng(svg);

	return {
		buffer,
		mimeType: 'image/png',
		width: WIDTH,
		height: HEIGHT,
		extension: 'png',
	};
}