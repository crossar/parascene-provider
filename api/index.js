import 'dotenv/config';
import generateAnimePixelSticker from '../generators/chibiPixel.js';
import generateSpriteGen from '../generators/spriteGen.js';
import generatePersonaGen from '../generators/personaGen.js';
import generateEmotionPortrait from '../generators/emotionGen.js';
import wallpaperGen from '../generators/wallpaperGen.js';
import tileSheetGen from '../generators/tileSheetGen.js';
import fortuneCookie from '../generators/fortuneCookie.js';
import abstractGen from '../generators/abstractGen.js';
import birthdayCardGen from '../generators/birthdayCardGen.js';

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

	birthdayCard: {
		name: 'Birthday Card Generator',
		description:
			'Generates colorful birthday cards with different themes, palettes, layouts, and message styles.',
		intent: 'image_generate',
		credits: 0.1,
		fields: {
			theme: {
				label: 'Theme',
				required: false,
				type: 'select',
				default: 'cute',
				options: [
					{ label: 'Cute', value: 'cute' },
					{ label: 'Elegant', value: 'elegant' },
					{ label: 'Party', value: 'party' },
					{ label: 'Floral', value: 'floral' },
					{ label: 'Kids', value: 'kids' },
					{ label: 'Pastel', value: 'pastel' },
					{ label: 'Bold', value: 'bold' },
					{ label: 'Minimal', value: 'minimal' },
				],
				description: 'Choose the visual theme of the birthday card.',
			},
			color: {
				label: 'Color Palette',
				required: false,
				type: 'select',
				default: 'pink',
				options: [
					{ label: 'Pink', value: 'pink' },
					{ label: 'Blue', value: 'blue' },
					{ label: 'Purple', value: 'purple' },
					{ label: 'Gold', value: 'gold' },
					{ label: 'Rainbow', value: 'rainbow' },
					{ label: 'Red', value: 'red' },
					{ label: 'Green', value: 'green' },
					{ label: 'Pastel', value: 'pastel' },
				],
				description: 'Choose the card color palette.',
			},
			layout: {
				label: 'Layout',
				required: false,
				type: 'select',
				default: 'centered',
				options: [
					{ label: 'Centered', value: 'centered' },
					{ label: 'Split', value: 'split' },
					{ label: 'Framed', value: 'framed' },
					{ label: 'Confetti Top', value: 'confetti-top' },
					{ label: 'Balloon Corners', value: 'balloon-corners' },
				],
				description: 'Choose the layout style of the card.',
			},
			messageStyle: {
				label: 'Message Style',
				required: false,
				type: 'select',
				default: 'sweet',
				options: [
					{ label: 'Simple', value: 'simple' },
					{ label: 'Sweet', value: 'sweet' },
					{ label: 'Funny', value: 'funny' },
					{ label: 'Cheerful', value: 'cheerful' },
				],
				description: 'Choose the style of birthday message.',
			},
			name: {
				label: 'Name',
				required: false,
				type: 'string',
				description: 'Optional recipient name for the card.',
			},
			age: {
				label: 'Age',
				required: false,
				type: 'string',
				description: 'Optional age to include on the card.',
			},
			orientation: {
				label: 'Orientation',
				required: false,
				type: 'select',
				default: 'portrait',
				options: [
					{ label: 'Portrait', value: 'portrait' },
					{ label: 'Landscape', value: 'landscape' },
				],
				description: 'Choose portrait or landscape layout.',
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
	birthdayCard: birthdayCardGen,
	tileSheet: tileSheetGen,
	fortuneCookie,
};

function normalizeArgs(method, args) {
	const a = { ...(args || {}) };

	if ('seed' in a && a.seed !== null && a.seed !== undefined && a.seed !== '') {
		const n = Number(a.seed);
		if (Number.isFinite(n)) a.seed = n;
	}

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

	if (typeof a.format === 'string') {
		a.format = a.format.trim().toLowerCase();
		if (a.format !== 'png' && a.format !== 'svg') delete a.format;
	}

	if (method === 'emotionGen' && typeof a.emotion === 'string') {
		a.emotion = a.emotion.trim().toLowerCase();
		if (!a.emotion) delete a.emotion;
	}

	if (typeof a.style === 'string') {
		a.style = a.style.trim().toLowerCase();
		if (!a.style) delete a.style;
	}

	if (method === 'birthdayCard') {
		if (typeof a.theme === 'string') {
			a.theme = a.theme.trim().toLowerCase();
			if (!a.theme) delete a.theme;
		}

		if (typeof a.color === 'string') {
			a.color = a.color.trim().toLowerCase();
			if (!a.color) delete a.color;
		}

		if (typeof a.layout === 'string') {
			a.layout = a.layout.trim().toLowerCase();
			if (!a.layout) delete a.layout;
		}

		if (typeof a.messageStyle === 'string') {
			a.messageStyle = a.messageStyle.trim().toLowerCase();
			if (!a.messageStyle) delete a.messageStyle;
		}

		if (typeof a.orientation === 'string') {
			a.orientation = a.orientation.trim().toLowerCase();
			if (a.orientation !== 'portrait' && a.orientation !== 'landscape') {
				delete a.orientation;
			}
		}

		if (typeof a.name === 'string') {
			a.name = a.name.trim();
			if (!a.name) delete a.name;
		}

		if (typeof a.age === 'string' || typeof a.age === 'number') {
			a.age = String(a.age).trim();
			if (!a.age) delete a.age;
		}
	}

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
