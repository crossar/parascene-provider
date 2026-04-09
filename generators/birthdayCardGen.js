import sharp from 'sharp';
import { Resvg } from '@resvg/resvg-js';
import { getOpenSansFontsBase64 } from './utils.js';

function escapeXml(str = '') {
	return String(str)
		.replace(/&/g, '&amp;')
		.replace(/</g, '&lt;')
		.replace(/>/g, '&gt;')
		.replace(/"/g, '&quot;')
		.replace(/'/g, '&apos;');
}

function pick(arr) {
	return arr[Math.floor(Math.random() * arr.length)];
}

const palettes = {
	pink: {
		bg: '#ffe4ec',
		accent: '#ff5fa2',
		accent2: '#ffc2d9',
		accent3: '#fff0f5',
		text: '#5c2240',
	},
	blue: {
		bg: '#e6f4ff',
		accent: '#4da3ff',
		accent2: '#b9e0ff',
		accent3: '#f3fbff',
		text: '#1f3b57',
	},
	purple: {
		bg: '#f3e8ff',
		accent: '#9b5cff',
		accent2: '#d6bbff',
		accent3: '#faf5ff',
		text: '#402060',
	},
	gold: {
		bg: '#fff8e1',
		accent: '#d4a017',
		accent2: '#ffe08a',
		accent3: '#fffdf4',
		text: '#5c4700',
	},
	rainbow: {
		bg: '#fffafc',
		accent: '#ff4d6d',
		accent2: '#7b61ff',
		accent3: '#ffd166',
		text: '#3d2c4a',
	},
	red: {
		bg: '#ffe8e8',
		accent: '#e63946',
		accent2: '#ffb3ba',
		accent3: '#fff5f5',
		text: '#5a1d22',
	},
	green: {
		bg: '#e8fff0',
		accent: '#30b566',
		accent2: '#b8f5cb',
		accent3: '#f5fff8',
		text: '#1f4d32',
	},
	pastel: {
		bg: '#fffaf5',
		accent: '#ff9ec4',
		accent2: '#a0c4ff',
		accent3: '#caffbf',
		text: '#5b4b5f',
	},
};

function getThemeTextStyle(theme) {
	switch (theme) {
		case 'elegant':
			return {
				titleLetterSpacing: '-0.02em',
				subtitleLetterSpacing: '0.01em',
				footerLetterSpacing: '0.02em',
			};
		case 'bold':
			return {
				titleLetterSpacing: '-0.03em',
				subtitleLetterSpacing: '0em',
				footerLetterSpacing: '0.01em',
			};
		case 'minimal':
			return {
				titleLetterSpacing: '-0.025em',
				subtitleLetterSpacing: '0.005em',
				footerLetterSpacing: '0.015em',
			};
		case 'kids':
			return {
				titleLetterSpacing: '-0.015em',
				subtitleLetterSpacing: '0em',
				footerLetterSpacing: '0.005em',
			};
		default:
			return {
				titleLetterSpacing: '-0.02em',
				subtitleLetterSpacing: '0em',
				footerLetterSpacing: '0.01em',
			};
	}
}

function wrapText(text, maxCharsPerLine = 22) {
	if (!text) return [];

	const words = String(text).split(/\s+/).filter(Boolean);
	const lines = [];
	let currentLine = '';

	for (const word of words) {
		const testLine = currentLine ? `${currentLine} ${word}` : word;

		if (testLine.length > maxCharsPerLine && currentLine) {
			lines.push(currentLine);
			currentLine = word;
		} else {
			currentLine = testLine;
		}
	}

	if (currentLine) lines.push(currentLine);

	return lines;
}

function clampLines(lines, maxLines = 3) {
	if (lines.length <= maxLines) return lines;

	const trimmed = lines.slice(0, maxLines);
	trimmed[maxLines - 1] =
		`${trimmed[maxLines - 1].replace(/[.,!?\s]+$/g, '')}...`;
	return trimmed;
}

function buildWrappedText({
	lines,
	x,
	y,
	fontSize,
	fill,
	fontWeight = '400',
	textAnchor = 'middle',
	lineHeight = 1.2,
	opacity,
	letterSpacing = '0em',
}) {
	const opacityAttr = opacity !== undefined ? ` opacity="${opacity}"` : '';

	return `
    <text
      x="${x}"
      y="${y}"
      text-anchor="${textAnchor}"
      font-family="Open Sans Embedded"
      font-size="${fontSize}"
      font-weight="${fontWeight}"
      letter-spacing="${letterSpacing}"
      fill="${fill}"${opacityAttr}
    >
      ${lines
				.map(
					(line, i) => `
        <tspan x="${x}" dy="${i === 0 ? '0' : `${lineHeight}em`}">${escapeXml(line)}</tspan>
      `
				)
				.join('')}
    </text>
  `;
}

function getBirthdayMessage(style, name, age) {
	const person = name && name.trim() ? name.trim() : 'Friend';
	const ageLine = age && String(age).trim() ? ` ${String(age).trim()}th` : '';

	const messages = {
		simple: [
			`Happy Birthday, ${person}!`,
			`Wishing you a beautiful birthday!`,
			`Have an amazing special day!`,
		],
		sweet: [
			`Happy Birthday, ${person}!`,
			`Wishing you a day full of love and cake, ${person}!`,
			`Hope your birthday is joyful, bright, and unforgettable!`,
		],
		funny: [
			`Happy Birthday, ${person}!`,
			`Another year fabulous, ${person}!`,
			`Cake first. Responsibilities later.`,
		],
		cheerful: [
			`Happy${ageLine} Birthday, ${person}!`,
			`Let's celebrate, ${person}!`,
			`Big birthday energy for ${person}!`,
		],
	};

	return pick(messages[style] || messages.sweet);
}

function getSubtitle(style, age) {
	const ageText =
		age && String(age).trim()
			? `Celebrating ${String(age).trim()} amazing years`
			: 'Wishing you a day full of joy';

	const subtitles = {
		simple: [
			ageText,
			'Hope your day is full of happy moments',
			'Have the best birthday ever',
		],
		sweet: [
			ageText,
			'May your day be filled with smiles and sweet surprises',
			'Sending warm wishes for a lovely birthday',
		],
		funny: [
			'Officially upgraded to a newer model',
			'More candles. More power.',
			'Aging: still iconic.',
		],
		cheerful: [
			ageText,
			'Make a wish and let the party begin',
			'Today is your sparkle day',
		],
	};

	return pick(subtitles[style] || subtitles.sweet);
}

function renderConfetti(width, height, colors) {
	let out = '';

	for (let i = 0; i < 90; i++) {
		const x = Math.floor(Math.random() * width);
		const y = Math.floor(Math.random() * (height * 0.28));
		const w = 8 + Math.floor(Math.random() * 14);
		const h = 8 + Math.floor(Math.random() * 14);
		const fill = pick(colors);
		const angle = Math.floor(Math.random() * 60) - 30;

		out += `
      <rect
        x="${x}"
        y="${y}"
        width="${w}"
        height="${h}"
        rx="3"
        fill="${fill}"
        opacity="0.9"
        transform="rotate(${angle} ${x + w / 2} ${y + h / 2})"
      />
    `;
	}

	return out;
}

function renderStars(width, height, colors) {
	let out = '';

	for (let i = 0; i < 28; i++) {
		const x = Math.floor(Math.random() * width);
		const y = Math.floor(Math.random() * height);
		const r = 4 + Math.floor(Math.random() * 8);
		const fill = pick(colors);

		out += `<circle cx="${x}" cy="${y}" r="${r}" fill="${fill}" opacity="0.35" />`;
	}

	return out;
}

function renderHearts(width, height, color) {
	let out = '';

	for (let i = 0; i < 18; i++) {
		const x = Math.floor(Math.random() * width);
		const y = Math.floor(Math.random() * height);
		const size = 12 + Math.floor(Math.random() * 18);

		out += `
      <text
        x="${x}"
        y="${y}"
        font-size="${size}"
        text-anchor="middle"
        fill="${color}"
        opacity="0.28"
        font-family="Open Sans Embedded"
      >♥</text>
    `;
	}

	return out;
}

function renderBalloons(width, height, p) {
	return `
    <ellipse cx="120" cy="${height - 180}" rx="42" ry="54" fill="${p.accent}" opacity="0.85"/>
    <line x1="120" y1="${height - 126}" x2="112" y2="${height - 50}" stroke="${p.text}" stroke-width="2"/>

    <ellipse cx="${width - 120}" cy="160" rx="42" ry="54" fill="${p.accent2}" opacity="0.9"/>
    <line x1="${width - 120}" y1="214" x2="${width - 128}" y2="290" stroke="${p.text}" stroke-width="2"/>

    <ellipse cx="${width - 210}" cy="${height - 220}" rx="36" ry="48" fill="${p.accent3}" opacity="0.92"/>
    <line x1="${width - 210}" y1="${height - 172}" x2="${width - 202}" y2="${height - 100}" stroke="${p.text}" stroke-width="2"/>
  `;
}

function renderFlowers(width, height, p) {
	return `
    <g opacity="0.8">
      <circle cx="90" cy="90" r="20" fill="${p.accent}"/>
      <circle cx="60" cy="90" r="20" fill="${p.accent2}"/>
      <circle cx="120" cy="90" r="20" fill="${p.accent2}"/>
      <circle cx="90" cy="60" r="20" fill="${p.accent2}"/>
      <circle cx="90" cy="120" r="20" fill="${p.accent2}"/>

      <circle cx="${width - 90}" cy="${height - 90}" r="20" fill="${p.accent}"/>
      <circle cx="${width - 120}" cy="${height - 90}" r="20" fill="${p.accent2}"/>
      <circle cx="${width - 60}" cy="${height - 90}" r="20" fill="${p.accent2}"/>
      <circle cx="${width - 90}" cy="${height - 120}" r="20" fill="${p.accent2}"/>
      <circle cx="${width - 90}" cy="${height - 60}" r="20" fill="${p.accent2}"/>
    </g>
  `;
}

function makeDecorations(theme, layout, p, width, height) {
	let out = '';

	if (theme === 'party' || layout === 'confetti-top') {
		out += renderConfetti(width, height, [
			p.accent,
			p.accent2,
			p.accent3,
			'#ffffff',
		]);
	}

	if (theme === 'cute') {
		out += `
      <circle cx="120" cy="120" r="60" fill="${p.accent2}" opacity="0.55"/>
      <circle cx="${width - 100}" cy="140" r="50" fill="${p.accent}" opacity="0.24"/>
      <circle cx="${width - 130}" cy="${height - 120}" r="72" fill="${p.accent2}" opacity="0.35"/>
      <circle cx="150" cy="${height - 160}" r="56" fill="${p.accent3}" opacity="0.35"/>
    `;
		out += renderHearts(width, height, p.accent);
	}

	if (theme === 'elegant') {
		out += `
      <rect x="28" y="28" width="${width - 56}" height="${height - 56}" rx="28"
        fill="none" stroke="${p.accent}" stroke-width="4" opacity="0.85"/>
      <rect x="48" y="48" width="${width - 96}" height="${height - 96}" rx="22"
        fill="none" stroke="${p.accent2}" stroke-width="2" opacity="0.75"/>
    `;
	}

	if (theme === 'floral') {
		out += renderFlowers(width, height, p);
	}

	if (theme === 'kids') {
		out += `
      <circle cx="110" cy="120" r="42" fill="${p.accent}" opacity="0.65"/>
      <circle cx="180" cy="160" r="30" fill="${p.accent2}" opacity="0.65"/>
      <circle cx="${width - 130}" cy="130" r="46" fill="${p.accent3}" opacity="0.65"/>
      <circle cx="${width - 200}" cy="190" r="26" fill="${p.accent}" opacity="0.65"/>

      <circle cx="150" cy="${height - 150}" r="40" fill="${p.accent2}" opacity="0.6"/>
      <circle cx="${width - 140}" cy="${height - 130}" r="54" fill="${p.accent}" opacity="0.55"/>
    `;
		out += renderStars(width, height, [p.accent, p.accent2, p.accent3]);
	}

	if (theme === 'pastel') {
		out += `
      <circle cx="130" cy="130" r="90" fill="${p.accent}" opacity="0.12"/>
      <circle cx="${width - 160}" cy="180" r="110" fill="${p.accent2}" opacity="0.14"/>
      <circle cx="${width / 2}" cy="${height - 140}" r="100" fill="${p.accent3}" opacity="0.16"/>
    `;
	}

	if (theme === 'bold') {
		out += `
      <rect x="0" y="0" width="${width}" height="140" fill="${p.accent}" opacity="0.18"/>
      <rect x="0" y="${height - 140}" width="${width}" height="140" fill="${p.accent2}" opacity="0.26"/>
      <rect x="0" y="${height * 0.32}" width="${width}" height="18" fill="${p.accent}" opacity="0.35"/>
    `;
	}

	if (theme === 'minimal') {
		out += `
      <circle cx="${width - 100}" cy="100" r="56" fill="${p.accent2}" opacity="0.32"/>
      <rect x="70" y="${height - 120}" width="150" height="16" rx="8" fill="${p.accent}" opacity="0.62"/>
    `;
	}

	if (layout === 'framed') {
		out += `
      <rect x="70" y="70" width="${width - 140}" height="${height - 140}" rx="28"
        fill="none" stroke="${p.text}" stroke-width="1.5" opacity="0.25"/>
    `;
	}

	if (layout === 'balloon-corners') {
		out += renderBalloons(width, height, p);
	}

	if (layout === 'split') {
		out += `
      <rect x="0" y="0" width="${width * 0.38}" height="${height}" fill="${p.accent}" opacity="0.12"/>
      <rect x="${width * 0.38}" y="0" width="${width * 0.62}" height="${height}" fill="${p.accent3}" opacity="0.25"/>
    `;
	}

	return out;
}

async function birthdayCardGen(options = {}) {
	const { regular: regularFontBase64, bold: boldFontBase64 } =
		getOpenSansFontsBase64();

	const {
		theme = 'cute',
		color = 'pink',
		layout = 'centered',
		messageStyle = 'sweet',
		name = '',
		age = '',
	} = options;

	const width = 1024;
	const height = 1024;

	const p = palettes[color] || palettes.pink;
	const textStyle = getThemeTextStyle(theme);
	const title = getBirthdayMessage(messageStyle, name, age);
	const subtitle = getSubtitle(messageStyle, age);

	let titleSize = 68;
	let subtitleSize = 28;
	const smallSize = 22;

	let contentX = '50%';
	let textAnchor = 'middle';
	let titleY = height * 0.42;
	let subtitleY = height * 0.56;
	let footerY = height * 0.67;

	if (layout === 'split') {
		contentX = '58%';
	}

	const decorations = makeDecorations(theme, layout, p, width, height);

	const titleMaxChars = layout === 'split' ? 16 : 18;

	const subtitleMaxChars = layout === 'split' ? 20 : 26;

	let titleLines = wrapText(title, titleMaxChars);
	let subtitleLines = wrapText(subtitle, subtitleMaxChars);

	titleLines = clampLines(titleLines, 3);
	subtitleLines = clampLines(subtitleLines, 3);

	if (titleLines.length >= 3) {
		titleSize -= 8;
	}

	if (subtitleLines.length >= 3) {
		subtitleSize -= 2;
	}

	titleY = titleLines.length >= 3 ? height * 0.34 : height * 0.4;
	subtitleY = titleY + titleSize * (titleLines.length * 1.18);
	footerY = subtitleY + subtitleSize * (subtitleLines.length * 1.55);

	if (footerY > height * 0.82) {
		footerY = height * 0.82;
	}

	const titleSvg = buildWrappedText({
		lines: titleLines,
		x: contentX,
		y: titleY,
		fontSize: titleSize,
		fill: p.text,
		fontWeight: '700',
		textAnchor,
		lineHeight: 1.15,
		letterSpacing: textStyle.titleLetterSpacing,
	});

	const subtitleSvg = buildWrappedText({
		lines: subtitleLines,
		x: contentX,
		y: subtitleY,
		fontSize: subtitleSize,
		fill: p.text,
		textAnchor,
		lineHeight: 1.28,
		opacity: 0.88,
		letterSpacing: textStyle.subtitleLetterSpacing,
	});

	const ageBadge =
		age && String(age).trim()
			? `
        <g>
          <circle cx="${width / 2}" cy="240" r="70" fill="${p.accent}" opacity="0.95"/>
          <text
            x="${width / 2}"
            y="255"
            text-anchor="middle"
            font-family="Open Sans Embedded"
            font-size="44"
            font-weight="700"
            fill="#ffffff"
          >${escapeXml(String(age).trim())}</text>
        </g>
      `
			: '';

	const svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <style>
      @font-face {
        font-family: 'Open Sans Embedded';
        src: url("data:font/ttf;base64,${regularFontBase64}") format('truetype');
        font-weight: 400;
        font-style: normal;
      }

      @font-face {
        font-family: 'Open Sans Embedded';
        src: url("data:font/ttf;base64,${boldFontBase64}") format('truetype');
        font-weight: 700;
        font-style: normal;
      }
    </style>

    <linearGradient id="bgGlow" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="${p.bg}" />
      <stop offset="100%" stop-color="${p.accent3}" />
    </linearGradient>
  </defs>

  <rect width="100%" height="100%" fill="url(#bgGlow)" />
  ${decorations}
  ${ageBadge}
  ${titleSvg}
  ${subtitleSvg}

  <text
    x="${contentX}"
    y="${footerY}"
    text-anchor="${textAnchor}"
    font-family="Open Sans Embedded"
    font-size="${smallSize}"
    letter-spacing="${textStyle.footerLetterSpacing}"
    fill="${p.accent}"
    font-weight="700"
  >
    Make a wish and save room for cake
  </text>
</svg>`;

	const r = new Resvg(svg, {
		fitTo: { mode: 'zoom', value: 1 },
	});

	const png = r.render().asPng();

	return {
		buffer: Buffer.from(png),
		mimeType: 'image/png',
		width,
		height,
		extension: 'png',
	};
}

export default birthdayCardGen;
