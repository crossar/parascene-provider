import sharp from 'sharp';

function rand(min, max) {
	return Math.random() * (max - min) + min;
}

function randInt(min, max) {
	return Math.floor(rand(min, max + 1));
}

function pick(arr) {
	return arr[Math.floor(Math.random() * arr.length)];
}

function maybe(probability = 0.5) {
	return Math.random() < probability;
}

const paletteGroups = {
	soft: [
		['#F8FAFC', '#C4B5FD', '#93C5FD', '#A7F3D0'],
		['#FDF2F8', '#F9A8D4', '#C4B5FD', '#93C5FD'],
		['#F3F4F6', '#BFDBFE', '#DDD6FE', '#FBCFE8'],
		['#ECFEFF', '#67E8F9', '#A5B4FC', '#E9D5FF'],
		['#FAF5FF', '#D8B4FE', '#C7D2FE', '#BAE6FD'],
		['#F0FDF4', '#86EFAC', '#7DD3FC', '#C4B5FD'],
	],
	bold: [
		['#F8FAFC', '#8B5CF6', '#3B82F6', '#10B981'],
		['#FFF7ED', '#F97316', '#EC4899', '#8B5CF6'],
		['#EFF6FF', '#2563EB', '#06B6D4', '#A855F7'],
		['#F0FDF4', '#22C55E', '#14B8A6', '#6366F1'],
	],
	neon: [
		['#0B1020', '#7C3AED', '#22D3EE', '#34D399'],
		['#111827', '#EC4899', '#8B5CF6', '#06B6D4'],
		['#0F172A', '#38BDF8', '#A3E635', '#C084FC'],
	],
	dark: [
		['#0F172A', '#334155', '#60A5FA', '#A78BFA'],
		['#111827', '#1F2937', '#22D3EE', '#F472B6'],
		['#18181B', '#27272A', '#818CF8', '#34D399'],
	],
	candy: [
		['#FFF1F2', '#FB7185', '#C084FC', '#60A5FA'],
		['#FDF4FF', '#E879F9', '#818CF8', '#2DD4BF'],
		['#FFFBEB', '#F59E0B', '#F472B6', '#60A5FA'],
	],
	minimal: [
		['#F8FAFC', '#CBD5E1', '#BFDBFE', '#DDD6FE'],
		['#FAFAFA', '#D4D4D8', '#C7D2FE', '#BAE6FD'],
		['#F5F5F4', '#D6D3D1', '#BFDBFE', '#C4B5FD'],
	],
};

const stylePresets = {
	soft: {
		blobOpacityMin: 0.35,
		blobOpacityMax: 0.65,
		circleOpacityMin: 0.12,
		circleOpacityMax: 0.28,
		blurSoftMin: 18,
		blurSoftMax: 28,
		blurGlowMin: 26,
		blurGlowMax: 40,
		blobCountMin: 7,
		blobCountMax: 11,
		circleCountMin: 8,
		circleCountMax: 14,
		accentBlobCountMin: 1,
		accentBlobCountMax: 2,
		textureDotCountMin: 20,
		textureDotCountMax: 40,
	},
	dreamy: {
		blobOpacityMin: 0.4,
		blobOpacityMax: 0.7,
		circleOpacityMin: 0.14,
		circleOpacityMax: 0.35,
		blurSoftMin: 20,
		blurSoftMax: 32,
		blurGlowMin: 30,
		blurGlowMax: 48,
		blobCountMin: 8,
		blobCountMax: 12,
		circleCountMin: 10,
		circleCountMax: 16,
		accentBlobCountMin: 2,
		accentBlobCountMax: 3,
		textureDotCountMin: 30,
		textureDotCountMax: 55,
	},
	bold: {
		blobOpacityMin: 0.5,
		blobOpacityMax: 0.82,
		circleOpacityMin: 0.18,
		circleOpacityMax: 0.4,
		blurSoftMin: 12,
		blurSoftMax: 20,
		blurGlowMin: 18,
		blurGlowMax: 30,
		blobCountMin: 9,
		blobCountMax: 14,
		circleCountMin: 8,
		circleCountMax: 14,
		accentBlobCountMin: 2,
		accentBlobCountMax: 4,
		textureDotCountMin: 18,
		textureDotCountMax: 35,
	},
	neon: {
		blobOpacityMin: 0.5,
		blobOpacityMax: 0.85,
		circleOpacityMin: 0.2,
		circleOpacityMax: 0.42,
		blurSoftMin: 10,
		blurSoftMax: 18,
		blurGlowMin: 22,
		blurGlowMax: 36,
		blobCountMin: 8,
		blobCountMax: 13,
		circleCountMin: 10,
		circleCountMax: 16,
		accentBlobCountMin: 2,
		accentBlobCountMax: 4,
		textureDotCountMin: 20,
		textureDotCountMax: 45,
	},
	dark: {
		blobOpacityMin: 0.4,
		blobOpacityMax: 0.72,
		circleOpacityMin: 0.1,
		circleOpacityMax: 0.28,
		blurSoftMin: 14,
		blurSoftMax: 24,
		blurGlowMin: 20,
		blurGlowMax: 34,
		blobCountMin: 7,
		blobCountMax: 11,
		circleCountMin: 8,
		circleCountMax: 13,
		accentBlobCountMin: 1,
		accentBlobCountMax: 3,
		textureDotCountMin: 10,
		textureDotCountMax: 28,
	},
	candy: {
		blobOpacityMin: 0.45,
		blobOpacityMax: 0.8,
		circleOpacityMin: 0.15,
		circleOpacityMax: 0.35,
		blurSoftMin: 14,
		blurSoftMax: 24,
		blurGlowMin: 20,
		blurGlowMax: 34,
		blobCountMin: 8,
		blobCountMax: 13,
		circleCountMin: 9,
		circleCountMax: 15,
		accentBlobCountMin: 2,
		accentBlobCountMax: 4,
		textureDotCountMin: 24,
		textureDotCountMax: 50,
	},
	minimal: {
		blobOpacityMin: 0.28,
		blobOpacityMax: 0.5,
		circleOpacityMin: 0.08,
		circleOpacityMax: 0.18,
		blurSoftMin: 16,
		blurSoftMax: 24,
		blurGlowMin: 24,
		blurGlowMax: 36,
		blobCountMin: 5,
		blobCountMax: 8,
		circleCountMin: 5,
		circleCountMax: 10,
		accentBlobCountMin: 1,
		accentBlobCountMax: 2,
		textureDotCountMin: 8,
		textureDotCountMax: 18,
	},
};

function makeBlobPath(cx, cy, r, points = 10) {
	const angleStep = (Math.PI * 2) / points;
	const coords = [];

	for (let i = 0; i < points; i++) {
		const angle = i * angleStep;
		const radius = r * rand(0.68, 1.3);
		const x = cx + Math.cos(angle) * radius;
		const y = cy + Math.sin(angle) * radius;
		coords.push([x, y]);
	}

	let d = `M ${coords[0][0]} ${coords[0][1]} `;

	for (let i = 0; i < coords.length; i++) {
		const current = coords[i];
		const next = coords[(i + 1) % coords.length];
		const mx = (current[0] + next[0]) / 2;
		const my = (current[1] + next[1]) / 2;
		d += `Q ${current[0]} ${current[1]} ${mx} ${my} `;
	}

	d += 'Z';
	return d;
}

async function abstractGen(options = {}) {
	const width = Number(options.width) || 1024;
	const height = Number(options.height) || 1024;
	const format =
		typeof options.format === 'string' && options.format.toLowerCase() === 'svg'
			? 'svg'
			: 'png';

	const allowedStyles = Object.keys(stylePresets);
	const requestedStyle =
		typeof options.style === 'string' ? options.style.trim().toLowerCase() : '';
	const style = allowedStyles.includes(requestedStyle)
		? requestedStyle
		: pick(allowedStyles);

	const preset = stylePresets[style];
	const palette = pick(paletteGroups[style] || paletteGroups.soft);
	const bg = palette[0];
	const colors = palette.slice(1);

	const blurSoft = randInt(preset.blurSoftMin, preset.blurSoftMax);
	const blurGlow = randInt(preset.blurGlowMin, preset.blurGlowMax);
	const blobCount = randInt(preset.blobCountMin, preset.blobCountMax);
	const circleCount = randInt(preset.circleCountMin, preset.circleCountMax);
	const accentBlobCount = randInt(
		preset.accentBlobCountMin,
		preset.accentBlobCountMax
	);
	const textureDotCount = randInt(
		preset.textureDotCountMin,
		preset.textureDotCountMax
	);

	const useRings = maybe(0.45);
	const useStripes = maybe(0.28);
	const useGlowBand = maybe(0.35);
	const useMiniBlobs = maybe(0.55);

	const gradX1 = pick(['0%', '0%', '10%', '20%']);
	const gradY1 = pick(['0%', '10%', '20%']);
	const gradX2 = pick(['80%', '90%', '100%']);
	const gradY2 = pick(['80%', '90%', '100%']);

	const washColor1 = pick(colors);
	const washColor2 = pick(colors);
	const washColor3 = pick(colors);

	const defs = `
		<filter id="blurSoft">
			<feGaussianBlur stdDeviation="${blurSoft}" />
		</filter>
		<filter id="blurGlow">
			<feGaussianBlur stdDeviation="${blurGlow}" />
		</filter>

		<linearGradient id="bgGrad" x1="${gradX1}" y1="${gradY1}" x2="${gradX2}" y2="${gradY2}">
			<stop offset="0%" stop-color="${bg}" />
			<stop offset="100%" stop-color="${pick([bg, '#f8fafc', '#f3f4f6', '#ffffff'])}" />
		</linearGradient>

		<radialGradient id="bgWash1" cx="${randInt(10, 35)}%" cy="${randInt(10, 35)}%" r="${randInt(45, 75)}%">
			<stop offset="0%" stop-color="${washColor1}" stop-opacity="${rand(0.1, 0.24)}" />
			<stop offset="100%" stop-color="${bg}" stop-opacity="0" />
		</radialGradient>

		<radialGradient id="bgWash2" cx="${randInt(60, 90)}%" cy="${randInt(55, 85)}%" r="${randInt(45, 75)}%">
			<stop offset="0%" stop-color="${washColor2}" stop-opacity="${rand(0.08, 0.2)}" />
			<stop offset="100%" stop-color="${bg}" stop-opacity="0" />
		</radialGradient>

		<radialGradient id="bgWash3" cx="${randInt(25, 75)}%" cy="${randInt(25, 75)}%" r="${randInt(30, 55)}%">
			<stop offset="0%" stop-color="${washColor3}" stop-opacity="${rand(0.06, 0.16)}" />
			<stop offset="100%" stop-color="${bg}" stop-opacity="0" />
		</radialGradient>
	`;

	let shapes = '';

	for (let i = 0; i < blobCount; i++) {
		const color = pick(colors);
		const cx = rand(width * 0.04, width * 0.96);
		const cy = rand(height * 0.04, height * 0.96);
		const r = rand(
			Math.min(width, height) * 0.1,
			Math.min(width, height) * 0.3
		);
		const opacity = rand(preset.blobOpacityMin, preset.blobOpacityMax);
		const rotation = rand(0, 360);
		const path = makeBlobPath(cx, cy, r, randInt(8, 14));

		shapes += `
			<path
				d="${path}"
				fill="${color}"
				fill-opacity="${opacity}"
				filter="url(#blurSoft)"
				transform="rotate(${rotation} ${cx} ${cy})"
			/>
		`;
	}

	for (let i = 0; i < circleCount; i++) {
		const color = pick(colors);
		const cx = rand(0, width);
		const cy = rand(0, height);
		const r = rand(
			Math.min(width, height) * 0.05,
			Math.min(width, height) * 0.18
		);
		const opacity = rand(preset.circleOpacityMin, preset.circleOpacityMax);

		shapes += `
			<circle
				cx="${cx}"
				cy="${cy}"
				r="${r}"
				fill="${color}"
				fill-opacity="${opacity}"
				filter="url(#blurGlow)"
			/>
		`;
	}

	for (let i = 0; i < accentBlobCount; i++) {
		const color = pick(colors);
		const cx = rand(width * 0.1, width * 0.9);
		const cy = rand(height * 0.1, height * 0.9);
		const r = rand(
			Math.min(width, height) * 0.06,
			Math.min(width, height) * 0.15
		);
		const opacity = rand(0.5, 0.85);
		const rotation = rand(0, 360);
		const path = makeBlobPath(cx, cy, r, randInt(7, 12));

		shapes += `
			<path
				d="${path}"
				fill="${color}"
				fill-opacity="${opacity}"
				transform="rotate(${rotation} ${cx} ${cy})"
			/>
		`;
	}

	if (useMiniBlobs) {
		const miniBlobCount = randInt(4, 10);
		for (let i = 0; i < miniBlobCount; i++) {
			const color = pick(colors);
			const cx = rand(0, width);
			const cy = rand(0, height);
			const r = rand(
				Math.min(width, height) * 0.025,
				Math.min(width, height) * 0.07
			);
			const opacity = rand(0.18, 0.45);
			const rotation = rand(0, 360);
			const path = makeBlobPath(cx, cy, r, randInt(6, 10));

			shapes += `
				<path
					d="${path}"
					fill="${color}"
					fill-opacity="${opacity}"
					filter="url(#blurSoft)"
					transform="rotate(${rotation} ${cx} ${cy})"
				/>
			`;
		}
	}

	let texture = '';
	for (let i = 0; i < textureDotCount; i++) {
		texture += `
			<circle
				cx="${rand(0, width)}"
				cy="${rand(0, height)}"
				r="${rand(4, 18)}"
				fill="${pick(colors)}"
				fill-opacity="${rand(0.04, 0.14)}"
			/>
		`;
	}

	let overlays = '';

	if (useRings) {
		const ringCount = randInt(2, 5);
		for (let i = 0; i < ringCount; i++) {
			const cx = rand(width * 0.15, width * 0.85);
			const cy = rand(height * 0.15, height * 0.85);
			const r = rand(
				Math.min(width, height) * 0.08,
				Math.min(width, height) * 0.28
			);
			const stroke = pick(colors);

			overlays += `
				<circle
					cx="${cx}"
					cy="${cy}"
					r="${r}"
					fill="none"
					stroke="${stroke}"
					stroke-opacity="${rand(0.08, 0.18)}"
					stroke-width="${rand(8, 22)}"
					filter="url(#blurSoft)"
				/>
			`;
		}
	}

	if (useStripes) {
		const stripeSpacing = randInt(70, 150);
		const stripeWidth = randInt(16, 40);
		const stripeColor = pick(colors);

		for (let x = -height; x < width + height; x += stripeSpacing) {
			overlays += `
				<line
					x1="${x}"
					y1="0"
					x2="${x + height}"
					y2="${height}"
					stroke="${stripeColor}"
					stroke-opacity="${rand(0.04, 0.1)}"
					stroke-width="${stripeWidth}"
				/>
			`;
		}
	}

	if (useGlowBand) {
		const bandColor = pick(colors);
		const x = randInt(10, 70);
		const y = randInt(10, 70);
		const w = randInt(Math.floor(width * 0.3), Math.floor(width * 0.8));
		const h = randInt(Math.floor(height * 0.08), Math.floor(height * 0.22));
		const rotation = rand(-35, 35);

		overlays += `
			<rect
				x="${x}"
				y="${y}"
				width="${w}"
				height="${h}"
				rx="${h / 2}"
				fill="${bandColor}"
				fill-opacity="${rand(0.08, 0.16)}"
				filter="url(#blurGlow)"
				transform="rotate(${rotation} ${x + w / 2} ${y + h / 2})"
			/>
		`;
	}

	const svg = `
		<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
			<defs>
				${defs}
			</defs>

			<rect width="100%" height="100%" fill="url(#bgGrad)" />
			<rect width="100%" height="100%" fill="url(#bgWash1)" />
			<rect width="100%" height="100%" fill="url(#bgWash2)" />
			<rect width="100%" height="100%" fill="url(#bgWash3)" />

			${shapes}
			${texture}
			${overlays}
		</svg>
	`;

	if (format === 'svg') {
		return {
			buffer: Buffer.from(svg),
			mimeType: 'image/svg+xml',
			extension: 'svg',
			width,
			height,
			style,
		};
	}

	const buffer = await sharp(Buffer.from(svg)).png().toBuffer();

	return {
		buffer,
		mimeType: 'image/png',
		extension: 'png',
		width,
		height,
		style,
	};
}

export default abstractGen;
