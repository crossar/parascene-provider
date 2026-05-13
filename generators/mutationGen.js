import {
	OPEN_SANS_FAMILY,
	escapeSvgText,
	renderOpenSansSvgToPng,
} from '../lib/openSansEmbedded.js';

const themes = [
	'Cyberpunk',
	'Void',
	'Lava',
	'Angel',
	'Mecha',
	'Pixel',
	'Royal',
	'Forest',
	'Ghost',
	'Final Boss',
];

const bases = [
	'Paper Hero',
	'Tiny Dragon',
	'Mushroom Knight',
	'Space Cat',
	'Robot Puppy',
	'Slime Wizard',
];

async function mutationGen(args = {}) {
	const width = 1024;
	const height = 1024;

	const base = randomItem(bases);
	const chosenThemes = shuffle(themes).slice(0, 9);

	const svg = `
	<svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
		<rect width="${width}" height="${height}" fill="#111827"/>

		<text
			x="512"
			y="70"
			text-anchor="middle"
			font-family="${OPEN_SANS_FAMILY}"
			font-size="46"
			font-weight="800"
			fill="white">
			MUTATION LAB
		</text>

		<text
			x="512"
			y="115"
			text-anchor="middle"
			font-family="${OPEN_SANS_FAMILY}"
			font-size="24"
			fill="#cbd5e1">
			Base Specimen: ${escapeSvgText(base)}
		</text>

		${chosenThemes.map((theme, i) => renderMutationCard(theme, i)).join('')}
	</svg>
	`;

	const buffer = await renderOpenSansSvgToPng(svg, width, height);

	return {
		buffer,
		mimeType: 'image/png',
		width,
		height,
	};
}

function renderMutationCard(theme, i) {
	const col = i % 3;
	const row = Math.floor(i / 3);

	const x = 70 + col * 310;
	const y = 170 + row * 260;

	const color = getThemeColor(theme);
	const mutation = Math.floor(30 + Math.random() * 70);

	return `
	<g>
		<rect
			x="${x}"
			y="${y}"
			width="270"
			height="220"
			rx="28"
			fill="#1f2937"
			stroke="${color}"
			stroke-width="4"
		/>

		<circle
			cx="${x + 135}"
			cy="${y + 85}"
			r="48"
			fill="${color}"
			opacity="0.9"
		/>

		<circle cx="${x + 118}" cy="${y + 78}" r="6" fill="#111827"/>
		<circle cx="${x + 152}" cy="${y + 78}" r="6" fill="#111827"/>

		<path
			d="M ${x + 118} ${y + 102} Q ${x + 135} ${y + 118} ${x + 152} ${y + 102}"
			stroke="#111827"
			stroke-width="5"
			fill="none"
			stroke-linecap="round"
		/>

		<text
			x="${x + 135}"
			y="${y + 165}"
			text-anchor="middle"
			font-family="${OPEN_SANS_FAMILY}"
			font-size="24"
			font-weight="800"
			fill="white">
			${escapeSvgText(theme)}
		</text>

		<text
			x="${x + 135}"
			y="${y + 195}"
			text-anchor="middle"
			font-family="${OPEN_SANS_FAMILY}"
			font-size="17"
			fill="#cbd5e1">
			Mutation: ${mutation}%
		</text>
	</g>
	`;
}

function getThemeColor(theme) {
	const colors = {
		Cyberpunk: '#22d3ee',
		Void: '#a855f7',
		Lava: '#f97316',
		Angel: '#facc15',
		Mecha: '#94a3b8',
		Pixel: '#4ade80',
		Royal: '#818cf8',
		Forest: '#22c55e',
		Ghost: '#e5e7eb',
		'Final Boss': '#ef4444',
	};

	return colors[theme] || '#38bdf8';
}

function randomItem(arr) {
	return arr[Math.floor(Math.random() * arr.length)];
}

function shuffle(arr) {
	return [...arr].sort(() => Math.random() - 0.5);
}

export default mutationGen;
