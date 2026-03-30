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

const palettes = [
	['#F8FAFC', '#C4B5FD', '#93C5FD', '#A7F3D0'],
	['#FDF2F8', '#F9A8D4', '#C4B5FD', '#93C5FD'],
	['#F3F4F6', '#BFDBFE', '#DDD6FE', '#FBCFE8'],
	['#ECFEFF', '#67E8F9', '#A5B4FC', '#E9D5FF'],
	['#FAF5FF', '#D8B4FE', '#C7D2FE', '#BAE6FD'],
	['#F0FDF4', '#86EFAC', '#7DD3FC', '#C4B5FD'],
];

function makeBlobPath(cx, cy, r) {
	const points = 10;
	const angleStep = (Math.PI * 2) / points;
	const coords = [];

	for (let i = 0; i < points; i++) {
		const angle = i * angleStep;
		const radius = r * rand(0.72, 1.28);
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

	const palette = pick(palettes);
	const bg = palette[0];
	const colors = palette.slice(1);

	const blobCount = randInt(8, 12);
	const circleCount = randInt(10, 16);
	const accentBlobCount = randInt(2, 3);

	const defs = `
		<filter id="blurSoft">
			<feGaussianBlur stdDeviation="18" />
		</filter>
		<filter id="blurGlow">
			<feGaussianBlur stdDeviation="28" />
		</filter>

		<radialGradient id="bgWash1" cx="20%" cy="20%" r="70%">
			<stop offset="0%" stop-color="${pick(colors)}" stop-opacity="0.18" />
			<stop offset="100%" stop-color="${bg}" stop-opacity="0" />
		</radialGradient>

		<radialGradient id="bgWash2" cx="80%" cy="75%" r="65%">
			<stop offset="0%" stop-color="${pick(colors)}" stop-opacity="0.16" />
			<stop offset="100%" stop-color="${bg}" stop-opacity="0" />
		</radialGradient>

		<linearGradient id="bgGrad" x1="0%" y1="0%" x2="100%" y2="100%">
			<stop offset="0%" stop-color="${bg}" />
			<stop offset="100%" stop-color="#f3f4f6" />
		</linearGradient>
	`;

	let shapes = '';

	// Big soft blobs
	for (let i = 0; i < blobCount; i++) {
		const color = pick(colors);
		const cx = rand(width * 0.08, width * 0.92);
		const cy = rand(height * 0.08, height * 0.92);
		const r = rand(
			Math.min(width, height) * 0.12,
			Math.min(width, height) * 0.28
		);
		const opacity = rand(0.42, 0.78);
		const rotation = rand(0, 360);
		const path = makeBlobPath(cx, cy, r);

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

	// Glowy circles
	for (let i = 0; i < circleCount; i++) {
		const color = pick(colors);
		const cx = rand(0, width);
		const cy = rand(0, height);
		const r = rand(80, 220);
		const opacity = rand(0.18, 0.42);

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

	// Sharper accent blobs so it doesn't look too washed out
	for (let i = 0; i < accentBlobCount; i++) {
		const color = pick(colors);
		const cx = rand(width * 0.15, width * 0.85);
		const cy = rand(height * 0.15, height * 0.85);
		const r = rand(
			Math.min(width, height) * 0.07,
			Math.min(width, height) * 0.14
		);
		const opacity = rand(0.55, 0.82);
		const rotation = rand(0, 360);
		const path = makeBlobPath(cx, cy, r);

		shapes += `
			<path
				d="${path}"
				fill="${color}"
				fill-opacity="${opacity}"
				transform="rotate(${rotation} ${cx} ${cy})"
			/>
		`;
	}

	// Tiny soft dots for texture
	let texture = '';
	const dotCount = randInt(30, 55);
	for (let i = 0; i < dotCount; i++) {
		texture += `
			<circle
				cx="${rand(0, width)}"
				cy="${rand(0, height)}"
				r="${rand(6, 18)}"
				fill="${pick(colors)}"
				fill-opacity="${rand(0.05, 0.12)}"
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

			${shapes}
			${texture}
		</svg>
	`;

	if (format === 'svg') {
		return {
			buffer: Buffer.from(svg),
			mimeType: 'image/svg+xml',
			extension: 'svg',
			width,
			height,
		};
	}

	const buffer = await sharp(Buffer.from(svg)).png().toBuffer();

	return {
		buffer,
		mimeType: 'image/png',
		extension: 'png',
		width,
		height,
	};
}

export default abstractGen;
