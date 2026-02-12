import 'dotenv/config';
import generateAnimePixelSticker from '../generators/chibiPixel.js';
import generateSpriteGen from '../generators/spriteGen.js';
import generatePersonaGen from '../generators/personaGen.js';
import generateEmotionPortrait from '../generators/emotionGen.js'; // ✅ NEW

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
		credits: 0.25,
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
		credits: 0.12,
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

	// ✅ NEW METHOD
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
};

const methodHandlers = {
	chibiPixel: generateAnimePixelSticker,
	spriteGen: generateSpriteGen,
	personaGen: generatePersonaGen,
	emotionGen: generateEmotionPortrait, // ✅ NEW
};

function normalizeArgs(method, args) {
	// Keep your API flexible: accept seed as string/number and pass clean values
	const a = { ...(args || {}) };

	// Normalize seed: allow string seeds (e.g., "aiko") without breaking
	if ('seed' in a && a.seed !== null && a.seed !== undefined && a.seed !== '') {
		// emotionGen supports string seeds (it hashes internally if non-numeric),
		// but other gens may expect number; keep type as-is unless it looks numeric.
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
		if (Number.isFinite(s)) a.scale = s;
		else delete a.scale;
	}

	// Normalize emotion to lowercase if present
	if (method === 'emotionGen' && typeof a.emotion === 'string') {
		a.emotion = a.emotion.trim().toLowerCase();
		if (!a.emotion) delete a.emotion;
	}

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
			const rawArgs = body.args || {};
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

			res.setHeader('Content-Type', 'image/png');
			res.setHeader('Content-Length', result.buffer.length);
			res.setHeader('Cache-Control', 'no-cache');
			res.setHeader('X-Image-Width', result.width.toString());
			res.setHeader('X-Image-Height', result.height.toString());

			// Optional: include helpful meta if your generator returns it
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
