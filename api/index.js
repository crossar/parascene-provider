import 'dotenv/config';
import generateAnimePixelSticker from '../generators/chibiPixel.js';
import generateSpriteGen from '../generators/spriteGen.js';
import generatePersonaGen from '../generators/personaGen.js';
import generateEmotionPortrait from '../generators/emotionGen.js';
import wallpaperGen from '../generators/wallpaperGen.js';
import tileSheetGen from '../generators/tileSheetGen.js';

function validateAuth(req) {
	const authHeader = req.headers.authorization;
	if (!authHeader || !authHeader.startsWith('Bearer ')) {
		return false;
	}
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
				required: false,
				type: 'number',
				description: 'Seed for deterministic sprite generation',
			},
			scale: {
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
				description:
					'Optional. Same seed = same character. Leave blank for random.',
			},
			bg: {
				label: 'Background Color',
				required: false,
				type: 'string',
				description:
					'Optional hex color like "#191C28". Leave blank for default.',
			},
		},
	},

	emotionGen: {
		name: 'Emotion Portrait Generator',
		description:
			'Procedural pixel emotion portrait (base 64x96, scaled to 192x288 by default). No PNG assets.',
		intent: 'image_generate',
		credits: 0.1,
		fields: {
			seed: {
				label: 'Seed',
				required: false,
				type: 'string',
				description:
					'Optional. Same seed = same portrait. Leave blank for random.',
			},
			emotion: {
				label: 'Emotion',
				required: false,
				type: 'string',
				description:
					'Optional. One of: rage, shy, smug, crying, sleepy, shocked, determined, unhinged. Leave blank for random.',
			},
			scale: {
				label: 'Scale',
				required: false,
				type: 'number',
				description:
					'Optional. Pixel scale factor. Default 3 (64x96 → 192x288).',
			},
		},
	},

	wallpaper: {
		name: 'Wallpaper Generator',
		description:
			'Generates a procedural abstract wallpaper PNG (random each time).',
		intent: 'image_generate',
		credits: 0.1,
		fields: {},
	},

	tileSheet: {
		name: 'Tile Sheet Generator',
		description:
			'Generates a 1024x1024 tileset PNG split into an even grid (tiles for 2D games).',
		intent: 'image_generate',
		credits: 0.1,
		fields: {
			grid: {
				label: 'Grid',
				required: false,
				type: 'number',
				description:
					'Tiles per row/column (must divide 1024). Example: 16 => 64px tiles.',
			},
			seed: {
				label: 'Seed',
				required: false,
				type: 'string',
				description: 'Optional. Same seed = same tileset.',
			},
			gridLines: {
				label: 'Grid Lines',
				required: false,
				type: 'number',
				description: 'Optional. 1 = show grid lines, 0 = off.',
			},
		},
	},
};

const methodHandlers = {
	chibiPixel: generateAnimePixelSticker,
	spriteGen: generateSpriteGen,
	personaGen: generatePersonaGen,
	emotionGen: generateEmotionPortrait,
	wallpaper: wallpaperGen,
	tileSheet: tileSheetGen,
};

function normalizeArgs(method, args) {
	const a = { ...(args || {}) };

	// Normalize seed: if numeric-like, convert to number (safe for your other gens)
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
		if (Number.isFinite(s)) {
			const clamped = Math.max(1, Math.floor(s));
			a.scale = clamped;
		} else {
			delete a.scale;
		}
	}

	// Normalize emotion to lowercase if present
	if (method === 'emotionGen' && typeof a.emotion === 'string') {
		a.emotion = a.emotion.trim().toLowerCase();
		if (!a.emotion) delete a.emotion;
	}

	// Normalize grid and gridLines for tileSheetGen
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
	// ✅ For wallpaper: do nothing. It should work with empty args.
	return a;
}

export default async function handler(req, res) {
	if (req.method === 'GET') {
		if (!validateAuth(req)) {
			return res.status(401).json({
				error: 'Unauthorized',
				message: 'Valid API key required. Use Authorization: Bearer <key>',
			});
		}

		const capabilities = {
			status: 'operational',
			last_check_at: new Date().toISOString(),
			methods: generationMethods,
		};
		return res.status(200).json(capabilities);
	}

	if (req.method === 'POST') {
		if (!validateAuth(req)) {
			return res.status(401).json({
				error: 'Unauthorized',
				message: 'Valid API key required. Use Authorization: Bearer <key>',
			});
		}

		try {
			let body;
			try {
				body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
			} catch (parseError) {
				return res.status(400).json({
					error: 'Invalid JSON in request body',
					message: parseError.message,
				});
			}

			if (!body.method) {
				return res.status(400).json({
					error: 'Missing required field: method',
					available_methods: Object.keys(generationMethods),
				});
			}

			if (!generationMethods[body.method]) {
				return res.status(400).json({
					error: `Unknown generation method: ${body.method}`,
					available_methods: Object.keys(generationMethods),
				});
			}

			const methodDef = generationMethods[body.method];
			const rawArgs = body.args || {}; // ✅ keep using args
			const args = normalizeArgs(body.method, rawArgs);

			const fields = methodDef.fields || {};
			const missingFields = [];
			for (const [fieldName, fieldDef] of Object.entries(fields)) {
				if (fieldDef.required && !(fieldName in args)) {
					missingFields.push(fieldName);
				}
			}

			if (missingFields.length > 0) {
				return res.status(400).json({
					error: `Missing required arguments: ${missingFields.join(', ')}`,
					method: body.method,
					missing_fields: missingFields,
				});
			}

			const generator = methodHandlers[body.method];
			if (!generator) {
				return res.status(500).json({
					error: `No handler registered for method: ${body.method}`,
				});
			}

			const result = await generator(args);

			if (!result?.buffer) {
				return res.status(500).json({
					error: 'Generator did not return an image buffer',
					method: body.method,
					hint: 'Ensure the generator returns { buffer: <Buffer>, width, height, ... }',
				});
			}

			res.setHeader('Content-Type', 'image/png');
			res.setHeader('Content-Length', result.buffer.length);
			res.setHeader('Cache-Control', 'no-cache');
			if (result.width !== undefined)
				res.setHeader('X-Image-Width', String(result.width));
			if (result.height !== undefined)
				res.setHeader('X-Image-Height', String(result.height));
			if (result.seed !== undefined)
				res.setHeader('X-Seed', String(result.seed));
			if (result.emotion) res.setHeader('X-Emotion', String(result.emotion));
			if (result.accessory)
				res.setHeader('X-Accessory', String(result.accessory));

			return res.send(result.buffer);
		} catch (error) {
			console.error('Error generating image:', error);
			return res.status(500).json({
				error: 'Failed to generate image',
				message: error.message,
			});
		}
	}

	return res.status(405).json({
		error:
			'Method not allowed. Use GET for capabilities or POST for generation.',
	});
}
