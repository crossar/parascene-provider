import 'dotenv/config';
import generateAnimePixelSticker from '../generators/chibiPixel.js';
import generateSpriteGen from '../generators/spriteGen.js';
import generatePersonaGen from '../generators/personaGen.js';
import generateEmotionPortrait from '../generators/emotionGen.js';
import wallpaperGen from '../generators/wallpaperGen.js';
import tileSheetGen from '../generators/tileSheetGen.js';
import fortuneCookie from '../generators/fortuneCookie.js';
import abstractGen from '../generators/abstractGen.js';

function validateAuth(req) {
	const authHeader = req.headers?.authorization;
	if (!authHeader || !authHeader.startsWith('Bearer ')) return false;
	const token = authHeader.slice(7);
	return token === process.env.PARASCENE_API_KEY;
}

const generationMethods = {
	chibiPixel: {
		name: 'Chibi Pixel Art',
		description:
			'Generates a 1024x1024 image with a chibi-style pixel art character',
		intent: 'image_generate',
		credits: 0.1,
		fields: {},
	},

	spriteGen: {
		name: '2D Sprite Generator',
		description: 'Generates a simple 2D pixel character sprite',
		intent: 'image_generate',
		credits: 0.1,
		fields: {
			seed: {
				label: 'Seed',
				required: false,
				type: 'number',
				description: 'Seed for deterministic sprite generation',
			},
			scale: {
				label: 'Scale',
				required: false,
				type: 'number',
				description: 'Pixel scale factor (default 12)',
			},
		},
	},

	personaGen: {
		name: 'PersonaGen',
		description: 'Random code-only pixel character (192x288). No PNG assets.',
		intent: 'image_generate',
		credits: 0.1,
		fields: {
			seed: {
				label: 'Seed',
				required: false,
				type: 'string',
				description: 'Optional. Same seed = same character.',
			},
			bg: {
				label: 'Background Color',
				required: false,
				type: 'string',
				description: 'Optional hex color like "#191C28".',
			},
		},
	},

	emotionGen: {
		name: 'Emotion Portrait Generator',
		description: 'Procedural pixel emotion portrait.',
		intent: 'image_generate',
		credits: 0.1,
		fields: {
			seed: { label: 'Seed', required: false, type: 'string' },
			emotion: { label: 'Emotion', required: false, type: 'string' },
			scale: { label: 'Scale', required: false, type: 'number' },
		},
	},

	wallpaper: {
		name: 'Wallpaper Generator',
		description: 'Generates a procedural abstract wallpaper PNG.',
		intent: 'image_generate',
		credits: 0.1,
		fields: {},
	},

	abstract: {
		name: 'Abstract Generator',
		description:
			'Generates vibrant abstract wallpapers with layered blobs, glowing gradients, organic shapes, and varied visual styles.',
		intent: 'image_generate',
		credits: 0.1,
		fields: {
			width: {
				label: 'Width',
				required: false,
				type: 'number',
				description: 'Output width in pixels (default 1024)',
			},
			height: {
				label: 'Height',
				required: false,
				type: 'number',
				description: 'Output height in pixels (default 1024)',
			},
			format: {
				label: 'Format',
				required: false,
				type: 'select',
				default: 'png',
				options: [
					{ label: 'PNG', value: 'png' },
					{ label: 'SVG', value: 'svg' },
				],
				description: 'Choose the output file format.',
			},
			style: {
				label: 'Style',
				required: false,
				type: 'select',
				default: '',
				options: [
					{ label: 'Random', value: '' },
					{ label: 'Soft', value: 'soft' },
					{ label: 'Dreamy', value: 'dreamy' },
					{ label: 'Bold', value: 'bold' },
					{ label: 'Neon', value: 'neon' },
					{ label: 'Dark', value: 'dark' },
					{ label: 'Candy', value: 'candy' },
					{ label: 'Minimal', value: 'minimal' },
				],
				description: 'Pick a style or choose Random.',
			},
		},
	},
	tileSheet: {
		name: 'Tile Sheet Generator',
		description: 'Generates a 1024x1024 tileset PNG.',
		intent: 'image_generate',
		credits: 0.1,
		fields: {
			grid: { label: 'Grid', required: false, type: 'number' },
			seed: { label: 'Seed', required: false, type: 'string' },
			gridLines: { label: 'Grid Lines', required: false, type: 'number' },
		},
	},

	fortuneCookie: {
		name: 'Fortune Cookie',
		description: 'Generates a fortune cookie image.',
		intent: 'image_generate',
		credits: 0.1,
		fields: {},
	},
};

const methodHandlers = {
	chibiPixel: generateAnimePixelSticker,
	spriteGen: generateSpriteGen,
	personaGen: generatePersonaGen,
	emotionGen: generateEmotionPortrait,
	wallpaper: wallpaperGen,
	abstract: abstractGen,
	tileSheet: tileSheetGen,
	fortuneCookie,
};

function normalizeArgs(method, args) {
	const a = { ...(args || {}) };

	// Normalize seed
	if ('seed' in a && a.seed !== null && a.seed !== undefined && a.seed !== '') {
		const n = Number(a.seed);
		if (Number.isFinite(n)) a.seed = n;
	}

	// Normalize scale
	if (
		'scale' in a &&
		a.scale !== null &&
		a.scale !== undefined &&
		a.scale !== ''
	) {
		const s = Number(a.scale);
		if (Number.isFinite(s)) a.scale = Math.max(1, Math.floor(s));
		else delete a.scale;
	}

	// Normalize width / height
	if (
		'width' in a &&
		a.width !== null &&
		a.width !== undefined &&
		a.width !== ''
	) {
		const w = Number(a.width);
		if (Number.isFinite(w)) a.width = Math.max(1, Math.floor(w));
		else delete a.width;
	}

	if (
		'height' in a &&
		a.height !== null &&
		a.height !== undefined &&
		a.height !== ''
	) {
		const h = Number(a.height);
		if (Number.isFinite(h)) a.height = Math.max(1, Math.floor(h));
		else delete a.height;
	}

	// Normalize format
	if (typeof a.format === 'string') {
		a.format = a.format.trim().toLowerCase();
		if (a.format !== 'png' && a.format !== 'svg') delete a.format;
	}

	// Normalize emotion
	if (method === 'emotionGen' && typeof a.emotion === 'string') {
		a.emotion = a.emotion.trim().toLowerCase();
		if (!a.emotion) delete a.emotion;
	}

	// Normalize style
	if (typeof a.style === 'string') {
		a.style = a.style.trim().toLowerCase();
		if (!a.style) delete a.style;
	}

	// Normalize tileSheet options
	if (method === 'tileSheet') {
		if (
			'grid' in a &&
			a.grid !== '' &&
			a.grid !== null &&
			a.grid !== undefined
		) {
			const g = Number(a.grid);
			if (Number.isFinite(g)) a.grid = Math.max(1, Math.floor(g));
			else delete a.grid;
		}
		if ('gridLines' in a) {
			const v = a.gridLines;
			a.gridLines = v === true || v === 1 || v === '1';
		}
	}

	return a;
}

export default async function handler(req, res) {
	try {
		if (!validateAuth(req)) {
			return res.status(401).json({
				error: 'Unauthorized',
				message: 'Valid API key required.',
			});
		}

		if (req.method === 'GET') {
			return res.status(200).json({
				status: 'operational',
				last_check_at: new Date().toISOString(),
				methods: generationMethods,
			});
		}

		if (req.method !== 'POST') {
			return res.status(405).json({
				error: 'Method not allowed. Use GET or POST.',
			});
		}

		const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;

		if (!body?.method || !generationMethods[body.method]) {
			return res.status(400).json({
				error: 'Unknown generation method',
				available_methods: Object.keys(generationMethods),
			});
		}

		const generator = methodHandlers[body.method];
		if (!generator) {
			return res.status(500).json({
				error: `No handler registered for method: ${body.method}`,
			});
		}

		const args = normalizeArgs(body.method, body.args || {});
		const result = await generator(args);

		// Image output
		if (result?.buffer) {
			const contentType = result.mimeType || 'image/png';

			res.setHeader('Content-Type', contentType);
			res.setHeader('Content-Length', result.buffer.length);
			res.setHeader('Cache-Control', 'no-cache');

			if (result.width !== undefined)
				res.setHeader('X-Image-Width', String(result.width));
			if (result.height !== undefined)
				res.setHeader('X-Image-Height', String(result.height));
			if (result.seed !== undefined)
				res.setHeader('X-Seed', String(result.seed));
			if (result.extension !== undefined)
				res.setHeader('X-Image-Extension', String(result.extension));

			return res.send(result.buffer);
		}

		// JSON fallback
		return res.status(200).json({
			status: 'ok',
			method: body.method,
			result,
		});
	} catch (error) {
		console.error('API handler error:', error);
		return res.status(500).json({
			error: 'Server error',
			message: error?.message || String(error),
		});
	}
}
