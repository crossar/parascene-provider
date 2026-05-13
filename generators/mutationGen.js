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

const bases = {
	hero: ['Paper Hero', 'Tiny Knight', 'Slime Wizard', 'Star Mage'],
	creature: ['Tiny Dragon', 'Mushroom Beast', 'Void Slime', 'Forest Goblin'],
	robot: ['Robot Puppy', 'Pocket Droid', 'Mecha Buddy', 'Rust Bot'],
	animal: ['Space Cat', 'Battle Hamster', 'Cyber Fox', 'Moon Bunny'],
	food: ['Pizza Beast', 'Ramen Wizard', 'Donut King', 'Burger Goblin'],
	random: [
		'Paper Hero',
		'Tiny Dragon',
		'Mushroom Knight',
		'Space Cat',
		'Robot Puppy',
		'Slime Wizard',
		'Pizza Beast',
		'Pocket Droid',
	],
};

async function mutationGen(args = {}) {
	const width = 1024;
	const height = 1024;

	const baseType = args.baseType || 'random';
	const basePool = bases[baseType] || bases.random;
	const base = randomItem(basePool);
	const chosenThemes = getThemesForBaseType(baseType);
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
	const character = renderMutantCharacter(theme, x + 135, y + 82, color);
	const bg = renderMutationBackground(theme, x, y, color);

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

		${bg}
${character}

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

	function renderMutationBackground(theme, x, y, color) {
		if (theme === 'Lava') {
			return `
		<circle cx="${x + 55}" cy="${y + 45}" r="18" fill="${color}" opacity="0.25"/>
		<circle cx="${x + 210}" cy="${y + 70}" r="28" fill="${color}" opacity="0.18"/>
		<path d="M ${x + 25} ${y + 190} C ${x + 65} ${y + 140}, ${x + 95} ${y + 225}, ${x + 135} ${y + 165} C ${x + 175} ${y + 105}, ${x + 205} ${y + 215}, ${x + 245} ${y + 155}" stroke="${color}" stroke-width="5" fill="none" opacity="0.35"/>
		`;
		}

		if (theme === 'Cyberpunk' || theme === 'Neon') {
			return `
		<path d="M ${x + 25} ${y + 45} H ${x + 95} V ${y + 85} H ${x + 155} V ${y + 125} H ${x + 235}" stroke="${color}" stroke-width="4" fill="none" opacity="0.35"/>
		<circle cx="${x + 235}" cy="${y + 125}" r="6" fill="${color}" opacity="0.8"/>
		`;
		}

		if (theme === 'Forest') {
			return `
		<path d="M ${x + 35} ${y + 180} C ${x + 75} ${y + 120}, ${x + 125} ${y + 185}, ${x + 180} ${y + 115}" stroke="${color}" stroke-width="6" fill="none" opacity="0.35"/>
		<ellipse cx="${x + 70}" cy="${y + 140}" rx="13" ry="22" fill="${color}" opacity="0.35"/>
		<ellipse cx="${x + 180}" cy="${y + 120}" rx="16" ry="25" fill="${color}" opacity="0.25"/>
		`;
		}

		if (theme === 'Ghost' || theme === 'Void') {
			return `
		<circle cx="${x + 130}" cy="${y + 90}" r="78" fill="${color}" opacity="0.08"/>
		<circle cx="${x + 130}" cy="${y + 90}" r="52" fill="${color}" opacity="0.08"/>
		`;
		}

		return `
	<circle cx="${x + 50}" cy="${y + 45}" r="10" fill="${color}" opacity="0.25"/>
	<circle cx="${x + 220}" cy="${y + 55}" r="14" fill="${color}" opacity="0.2"/>
	<circle cx="${x + 205}" cy="${y + 160}" r="8" fill="${color}" opacity="0.25"/>
	`;
	}

	function renderMutantCharacter(theme, cx, cy, color) {
		const dark = '#111827';
		const light = '#f8fafc';

		let accessory = '';

		if (theme === 'Angel') {
			accessory = `
		<ellipse cx="${cx}" cy="${cy - 58}" rx="34" ry="10" fill="none" stroke="#fde68a" stroke-width="5"/>
		<path d="M ${cx - 48} ${cy + 5} C ${cx - 95} ${cy - 25}, ${cx - 95} ${cy + 55}, ${cx - 45} ${cy + 42}" fill="#e0f2fe" opacity="0.85"/>
		<path d="M ${cx + 48} ${cy + 5} C ${cx + 95} ${cy - 25}, ${cx + 95} ${cy + 55}, ${cx + 45} ${cy + 42}" fill="#e0f2fe" opacity="0.85"/>
		`;
		}

		if (theme === 'Lava' || theme === 'Final Boss') {
			accessory = `
		<path d="M ${cx - 35} ${cy - 40} L ${cx - 58} ${cy - 82} L ${cx - 18} ${cy - 54}" fill="#7f1d1d"/>
		<path d="M ${cx + 35} ${cy - 40} L ${cx + 58} ${cy - 82} L ${cx + 18} ${cy - 54}" fill="#7f1d1d"/>
		<circle cx="${cx}" cy="${cy}" r="66" fill="${color}" opacity="0.18"/>
		`;
		}

		if (theme === 'Cyberpunk' || theme === 'Mecha') {
			accessory = `
		<rect x="${cx - 38}" y="${cy - 18}" width="76" height="18" rx="8" fill="${dark}" opacity="0.85"/>
		<line x1="${cx}" y1="${cy - 55}" x2="${cx}" y2="${cy - 90}" stroke="${color}" stroke-width="5"/>
		<circle cx="${cx}" cy="${cy - 95}" r="8" fill="${color}"/>
		`;
		}

		if (theme === 'Royal') {
			accessory = `
		<path d="M ${cx - 42} ${cy - 50} L ${cx - 25} ${cy - 82} L ${cx} ${cy - 52} L ${cx + 25} ${cy - 82} L ${cx + 42} ${cy - 50} Z" fill="#facc15"/>
		`;
		}

		if (theme === 'Forest') {
			accessory = `
		<path d="M ${cx - 25} ${cy - 50} C ${cx - 55} ${cy - 80}, ${cx - 8} ${cy - 90}, ${cx - 12} ${cy - 52}" fill="#86efac"/>
		<path d="M ${cx + 25} ${cy - 50} C ${cx + 55} ${cy - 80}, ${cx + 8} ${cy - 90}, ${cx + 12} ${cy - 52}" fill="#86efac"/>
		`;
		}

		if (theme === 'Ghost') {
			return `
		<g opacity="0.85">
			<path d="M ${cx - 48} ${cy - 18} Q ${cx} ${cy - 75} ${cx + 48} ${cy - 18} V ${cy + 48} Q ${cx + 32} ${cy + 30} ${cx + 16} ${cy + 48} Q ${cx} ${cy + 30} ${cx - 16} ${cy + 48} Q ${cx - 32} ${cy + 30} ${cx - 48} ${cy + 48} Z" fill="${light}"/>
			<circle cx="${cx - 16}" cy="${cy - 12}" r="6" fill="${dark}"/>
			<circle cx="${cx + 16}" cy="${cy - 12}" r="6" fill="${dark}"/>
			<ellipse cx="${cx}" cy="${cy + 10}" rx="10" ry="14" fill="${dark}" opacity="0.8"/>
		</g>
		`;
		}

		return `
	${accessory}

	<ellipse cx="${cx}" cy="${cy + 55}" rx="45" ry="28" fill="${color}" opacity="0.75"/>
	<circle cx="${cx}" cy="${cy}" r="48" fill="${color}"/>

	<circle cx="${cx - 17}" cy="${cy - 8}" r="6" fill="${dark}"/>
	<circle cx="${cx + 17}" cy="${cy - 8}" r="6" fill="${dark}"/>

	<path
		d="M ${cx - 18} ${cy + 18} Q ${cx} ${cy + 34} ${cx + 18} ${cy + 18}"
		stroke="${dark}"
		stroke-width="5"
		fill="none"
		stroke-linecap="round"
	/>
	`;
	}
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
		Knight: '#60a5fa',
		Mage: '#c084fc',
		Shadow: '#64748b',
		Samurai: '#f97316',
		Mushroom: '#fb7185',
		Crystal: '#67e8f9',
		Swamp: '#84cc16',
		Neon: '#ec4899',
		Rust: '#b45309',
		Satellite: '#38bdf8',
		Laser: '#ef4444',
		Chrome: '#cbd5e1',
		Pizza: '#f97316',
		Ramen: '#facc15',
		Donut: '#fb7185',
		Burger: '#a16207',
		Taco: '#f59e0b',
		Candy: '#f9a8d4',
	};

	return colors[theme] || '#38bdf8';
}

function getThemesForBaseType(baseType) {
	const themeGroups = {
		hero: [
			'Knight',
			'Mage',
			'Royal',
			'Angel',
			'Shadow',
			'Samurai',
			'Cyberpunk',
			'Final Boss',
			'Ghost',
		],
		creature: [
			'Forest',
			'Void',
			'Lava',
			'Ghost',
			'Mushroom',
			'Crystal',
			'Swamp',
			'Final Boss',
			'Pixel',
		],
		robot: [
			'Mecha',
			'Cyberpunk',
			'Neon',
			'Rust',
			'Satellite',
			'Pixel',
			'Laser',
			'Chrome',
			'Final Boss',
		],
		animal: [
			'Forest',
			'Angel',
			'Ghost',
			'Royal',
			'Cyberpunk',
			'Void',
			'Lava',
			'Pixel',
			'Final Boss',
		],
		food: [
			'Pizza',
			'Ramen',
			'Donut',
			'Burger',
			'Taco',
			'Candy',
			'Lava',
			'Royal',
			'Final Boss',
		],
		random: themes,
	};

	return shuffle(themeGroups[baseType] || themes).slice(0, 9);
}

function randomItem(arr) {
	return arr[Math.floor(Math.random() * arr.length)];
}

function shuffle(arr) {
	return [...arr].sort(() => Math.random() - 0.5);
}

export default mutationGen;
