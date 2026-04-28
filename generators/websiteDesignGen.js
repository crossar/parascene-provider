import sharp from 'sharp';

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
];

function pick(arr) {
	return arr[Math.floor(Math.random() * arr.length)];
}

export async function generateWebsiteDesign(options = {}) {
	const palette = pick(palettes);

	const name = options.name || 'Jane Doe';

	const headlines = [
		`Hey, I'm ${name}`,
		`${name} builds beautiful websites`,
		`Creative digital work by ${name}`,
		`Modern designs for bold ideas`,
	];

	const headline = pick(headlines);

	const svg = `
  <svg width="1024" height="768" xmlns="http://www.w3.org/2000/svg">
    <rect width="1024" height="768" fill="${palette.bg}" />

    <!-- background blobs -->
    <circle cx="850" cy="210" r="190" fill="${palette.primary}" opacity="0.18"/>
    <circle cx="900" cy="610" r="260" fill="${palette.primary}" opacity="0.10"/>
    <circle cx="120" cy="680" r="180" fill="${palette.primary}" opacity="0.08"/>

    <!-- navbar -->
    <text x="90" y="80" font-size="28" font-family="Arial" font-weight="700" fill="${palette.dark}">
      ${name}
    </text>

    <text x="560" y="80" font-size="18" font-family="Arial" font-weight="700" fill="${palette.text}">Home</text>
    <text x="640" y="80" font-size="18" font-family="Arial" font-weight="700" fill="${palette.text}">About</text>
    <text x="725" y="80" font-size="18" font-family="Arial" font-weight="700" fill="${palette.text}">Projects</text>

    <rect x="835" y="50" width="130" height="45" rx="10" fill="none" stroke="${palette.dark}" stroke-width="3"/>
    <text x="861" y="79" font-size="16" font-family="Arial" font-weight="700" fill="${palette.dark}">Contact</text>

    <!-- hero text -->
    <text x="90" y="265" font-size="64" font-family="Arial" font-weight="800" fill="${palette.dark}">
      ${headline}
    </text>

    <text x="92" y="325" font-size="24" font-family="Arial" fill="${palette.text}">
      Clean layouts, modern colors, and creative web experiences.
    </text>

    <text x="92" y="360" font-size="24" font-family="Arial" fill="${palette.text}">
      Designed to feel polished, friendly, and professional.
    </text>

    <!-- buttons -->
    <rect x="90" y="410" width="160" height="58" rx="12" fill="${palette.primary}" />
    <text x="122" y="447" font-size="18" font-family="Arial" font-weight="700" fill="#ffffff">
      View Work
    </text>

    <rect x="270" y="410" width="160" height="58" rx="12" fill="none" stroke="${palette.dark}" stroke-width="3"/>
    <text x="302" y="447" font-size="18" font-family="Arial" font-weight="700" fill="${palette.dark}">
      Learn More
    </text>

    <!-- mockup card -->
    <rect x="630" y="220" width="300" height="360" rx="28" fill="${palette.card}" opacity="0.95"/>
    <rect x="665" y="260" width="230" height="135" rx="20" fill="${palette.primary}" opacity="0.25"/>
    <circle cx="705" cy="325" r="36" fill="${palette.primary}" opacity="0.75"/>
    <rect x="665" y="430" width="220" height="18" rx="9" fill="${palette.text}" opacity="0.35"/>
    <rect x="665" y="465" width="175" height="18" rx="9" fill="${palette.text}" opacity="0.25"/>
    <rect x="665" y="515" width="90" height="38" rx="12" fill="${palette.primary}"/>

    <!-- bottom cards -->
    <rect x="90" y="590" width="230" height="95" rx="20" fill="${palette.card}"/>
    <rect x="350" y="590" width="230" height="95" rx="20" fill="${palette.card}"/>
    <rect x="610" y="590" width="230" height="95" rx="20" fill="${palette.card}"/>

    <text x="120" y="640" font-size="22" font-family="Arial" font-weight="700" fill="${palette.dark}">Web Design</text>
    <text x="380" y="640" font-size="22" font-family="Arial" font-weight="700" fill="${palette.dark}">Branding</text>
    <text x="640" y="640" font-size="22" font-family="Arial" font-weight="700" fill="${palette.dark}">UI Ideas</text>
  </svg>
  `;

	const buffer = await sharp(Buffer.from(svg)).png().toBuffer();

	return {
		buffer,
		mimeType: 'image/png',
		width: 1024,
		height: 768,
	};
}
