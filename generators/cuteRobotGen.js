import sharp from "sharp";

const SIZE = 1024;

function pick(arr) {
	return arr[Math.floor(Math.random() * arr.length)];
}

function rand(min, max) {
	return Math.floor(Math.random() * (max - min + 1)) + min;
}

function escapeXml(value = "") {
	return String(value)
		.replaceAll("&", "&amp;")
		.replaceAll("<", "&lt;")
		.replaceAll(">", "&gt;")
		.replaceAll('"', "&quot;")
		.replaceAll("'", "&apos;");
}

const palettes = [
	{ bg: "#FFF3F8", main: "#FFB6D5", accent: "#FF5FA2", dark: "#2A1B2D" },
	{ bg: "#EAF8FF", main: "#8FD8FF", accent: "#2F9BFF", dark: "#123044" },
	{ bg: "#F0FFE9", main: "#A8F0B2", accent: "#34C759", dark: "#16351D" },
	{ bg: "#FFF8D8", main: "#FFD76A", accent: "#FF9F1C", dark: "#3B2A10" },
	{ bg: "#F1EAFF", main: "#C8A8FF", accent: "#7B4DFF", dark: "#24143F" },
	{ bg: "#F4F4F4", main: "#D9DEE8", accent: "#FF4D4D", dark: "#1F2937" },
	{ bg: "#EFFFFA", main: "#7EE7D6", accent: "#00BFA6", dark: "#103B37" },
];

const bodyTypes = [
	"round",
	"square",
	"capsule",
	"tiny",
	"wide",
	"stacked",
	"floating",
	"tank",
];

const faces = [
	"happy",
	"sleepy",
	"owo",
	"pixel",
	"loading",
	"heart",
	"surprised",
	"confused",
	"wink",
	"grumpyCute",
];

const accessories = [
	"antenna",
	"headphones",
	"flower",
	"cap",
	"halo",
	"backpack",
	"ears",
	"bow",
	"none",
];

const names = [
	"MochiBot",
	"BEEP-07",
	"RoboBean",
	"TinTin",
	"ByteBuddy",
	"Patchy",
	"ServoPop",
	"MiniVolt",
	"Boopster",
	"Unit UwU",
];

function background(p) {
	const dots = Array.from({ length: 34 })
		.map(() => {
			const x = rand(40, 984);
			const y = rand(40, 984);
			const r = rand(4, 18);
			const opacity = Math.random() * 0.25 + 0.08;
			return `<circle cx="${x}" cy="${y}" r="${r}" fill="${p.accent}" opacity="${opacity}" />`;
		})
		.join("");

	return `
		<rect width="${SIZE}" height="${SIZE}" fill="${p.bg}" />
		<circle cx="190" cy="160" r="120" fill="${p.main}" opacity="0.22" />
		<circle cx="860" cy="840" r="170" fill="${p.accent}" opacity="0.14" />
		${dots}
		<ellipse cx="512" cy="792" rx="230" ry="50" fill="#000" opacity="0.10" />
	`;
}

function body(type, p) {
	const shine = `<ellipse cx="430" cy="385" rx="58" ry="34" fill="#fff" opacity="0.32" />`;

	const parts = {
		round: `
			<circle cx="512" cy="520" r="230" fill="${p.dark}" opacity="0.16" transform="translate(10 14)" />
			<circle cx="512" cy="520" r="230" fill="${p.main}" />
			${shine}
		`,
		square: `
			<rect x="282" y="300" width="460" height="430" rx="82" fill="${p.dark}" opacity="0.16" transform="translate(10 14)" />
			<rect x="282" y="300" width="460" height="430" rx="82" fill="${p.main}" />
			${shine}
		`,
		capsule: `
			<rect x="342" y="250" width="340" height="520" rx="170" fill="${p.dark}" opacity="0.16" transform="translate(10 14)" />
			<rect x="342" y="250" width="340" height="520" rx="170" fill="${p.main}" />
			${shine}
		`,
		tiny: `
			<rect x="365" y="350" width="294" height="350" rx="120" fill="${p.dark}" opacity="0.16" transform="translate(10 14)" />
			<rect x="365" y="350" width="294" height="350" rx="120" fill="${p.main}" />
			${shine}
		`,
		wide: `
			<rect x="242" y="365" width="540" height="330" rx="120" fill="${p.dark}" opacity="0.16" transform="translate(10 14)" />
			<rect x="242" y="365" width="540" height="330" rx="120" fill="${p.main}" />
			${shine}
		`,
		stacked: `
			<rect x="345" y="255" width="334" height="190" rx="70" fill="${p.accent}" />
			<rect x="295" y="420" width="434" height="330" rx="88" fill="${p.main}" />
			${shine}
		`,
		floating: `
			<circle cx="512" cy="365" r="118" fill="${p.accent}" />
			<rect x="302" y="455" width="420" height="275" rx="110" fill="${p.main}" />
			${shine}
		`,
		tank: `
			<rect x="305" y="330" width="414" height="300" rx="92" fill="${p.main}" />
			<rect x="270" y="630" width="484" height="90" rx="45" fill="${p.dark}" opacity="0.85" />
			<circle cx="370" cy="675" r="28" fill="${p.bg}" opacity="0.9" />
			<circle cx="512" cy="675" r="28" fill="${p.bg}" opacity="0.9" />
			<circle cx="654" cy="675" r="28" fill="${p.bg}" opacity="0.9" />
			${shine}
		`,
	};

	return parts[type] || parts.round;
}

function arms(p) {
	return `
		<path d="M300 520 C220 535 200 620 260 650" stroke="${p.dark}" stroke-width="34" stroke-linecap="round" fill="none" opacity="0.9"/>
		<path d="M724 520 C804 535 824 620 764 650" stroke="${p.dark}" stroke-width="34" stroke-linecap="round" fill="none" opacity="0.9"/>
		<circle cx="255" cy="655" r="36" fill="${p.accent}" />
		<circle cx="769" cy="655" r="36" fill="${p.accent}" />
	`;
}

function face(face, p) {
	const screen = `
		<rect x="360" y="420" width="304" height="170" rx="55" fill="${p.dark}" opacity="0.92" />
	`;

	const eye = (x, y = 490, r = 18) =>
		`<circle cx="${x}" cy="${y}" r="${r}" fill="#fff" />`;

	const mouth = `<path d="M455 540 Q512 582 569 540" stroke="#fff" stroke-width="10" fill="none" stroke-linecap="round" />`;

	const map = {
		happy: `${eye(455)}${eye(569)}${mouth}`,
		sleepy: `
			<path d="M430 492 Q455 480 480 492" stroke="#fff" stroke-width="10" fill="none" stroke-linecap="round"/>
			<path d="M544 492 Q569 480 594 492" stroke="#fff" stroke-width="10" fill="none" stroke-linecap="round"/>
			<path d="M482 546 Q512 560 542 546" stroke="#fff" stroke-width="8" fill="none" stroke-linecap="round"/>
		`,
		owo: `
			<circle cx="455" cy="490" r="26" fill="#fff"/>
			<circle cx="569" cy="490" r="26" fill="#fff"/>
			<text x="512" y="555" text-anchor="middle" font-size="44" font-family="Arial" font-weight="900" fill="#fff">w</text>
		`,
		pixel: `
			<rect x="428" y="472" width="42" height="42" fill="#fff"/>
			<rect x="554" y="472" width="42" height="42" fill="#fff"/>
			<rect x="470" y="545" width="84" height="16" fill="#fff"/>
		`,
		loading: `
			<circle cx="430" cy="505" r="14" fill="#fff"/>
			<circle cx="512" cy="505" r="14" fill="#fff" opacity="0.65"/>
			<circle cx="594" cy="505" r="14" fill="#fff" opacity="0.35"/>
		`,
		heart: `
			<text x="455" y="512" text-anchor="middle" font-size="54" font-family="Arial" fill="#fff">♥</text>
			<text x="569" y="512" text-anchor="middle" font-size="54" font-family="Arial" fill="#fff">♥</text>
			${mouth}
		`,
		surprised: `
			${eye(455)}${eye(569)}
			<circle cx="512" cy="548" r="24" fill="#fff"/>
		`,
		confused: `
			<circle cx="455" cy="490" r="18" fill="#fff"/>
			<circle cx="569" cy="500" r="12" fill="#fff"/>
			<path d="M480 548 Q512 530 544 548" stroke="#fff" stroke-width="8" fill="none" stroke-linecap="round"/>
		`,
		wink: `
			<path d="M430 492 Q455 510 480 492" stroke="#fff" stroke-width="10" fill="none" stroke-linecap="round"/>
			${eye(569)}
			${mouth}
		`,
		grumpyCute: `
			<path d="M430 480 L480 500" stroke="#fff" stroke-width="10" stroke-linecap="round"/>
			<path d="M594 480 L544 500" stroke="#fff" stroke-width="10" stroke-linecap="round"/>
			<path d="M475 550 Q512 535 549 550" stroke="#fff" stroke-width="8" fill="none" stroke-linecap="round"/>
		`,
	};

	return `${screen}${map[face] || map.happy}`;
}

function accessory(type, p) {
	const map = {
		antenna: `
			<line x1="512" y1="250" x2="512" y2="165" stroke="${p.dark}" stroke-width="12" stroke-linecap="round"/>
			<circle cx="512" cy="145" r="28" fill="${p.accent}" />
		`,
		headphones: `
			<path d="M345 420 Q512 250 679 420" stroke="${p.dark}" stroke-width="26" fill="none" stroke-linecap="round"/>
			<rect x="305" y="415" width="70" height="130" rx="35" fill="${p.accent}" />
			<rect x="649" y="415" width="70" height="130" rx="35" fill="${p.accent}" />
		`,
		flower: `
			<circle cx="650" cy="285" r="18" fill="${p.accent}"/>
			<circle cx="680" cy="300" r="18" fill="${p.accent}"/>
			<circle cx="650" cy="315" r="18" fill="${p.accent}"/>
			<circle cx="620" cy="300" r="18" fill="${p.accent}"/>
			<circle cx="650" cy="300" r="14" fill="#fff"/>
		`,
		cap: `
			<path d="M370 310 Q512 230 654 310 L620 360 Q512 315 404 360 Z" fill="${p.accent}" />
			<rect x="610" y="320" width="120" height="34" rx="17" fill="${p.dark}" opacity="0.85"/>
		`,
		halo: `
			<ellipse cx="512" cy="265" rx="120" ry="35" fill="none" stroke="${p.accent}" stroke-width="18" opacity="0.9"/>
		`,
		backpack: `
			<rect x="690" y="445" width="90" height="210" rx="36" fill="${p.accent}" opacity="0.95"/>
			<line x1="715" y1="500" x2="760" y2="500" stroke="#fff" stroke-width="8" opacity="0.7"/>
		`,
		ears: `
			<path d="M365 335 L295 235 L430 285 Z" fill="${p.accent}" />
			<path d="M659 335 L729 235 L594 285 Z" fill="${p.accent}" />
		`,
		bow: `
			<path d="M475 285 C410 235 375 300 450 330 Z" fill="${p.accent}" />
			<path d="M549 285 C614 235 649 300 574 330 Z" fill="${p.accent}" />
			<circle cx="512" cy="305" r="25" fill="${p.dark}" />
		`,
		none: "",
	};

	return map[type] || "";
}

function details(p) {
	return `
		<circle cx="430" cy="640" r="16" fill="${p.accent}" />
		<circle cx="512" cy="640" r="16" fill="${p.accent}" opacity="0.8" />
		<circle cx="594" cy="640" r="16" fill="${p.accent}" opacity="0.6" />
		<rect x="430" y="700" width="164" height="18" rx="9" fill="${p.dark}" opacity="0.18" />
	`;
}

function label(name, p) {
	return `
		<rect x="332" y="820" width="360" height="70" rx="35" fill="#fff" opacity="0.72" />
		<text x="512" y="866" text-anchor="middle" font-size="34" font-family="Arial, sans-serif" font-weight="900" fill="${p.dark}">
			${escapeXml(name)}
		</text>
	`;
}

export async function cuteRobotGen(options = {}) {
	const palette = pick(palettes);
	const robotBody = options.bodyType || pick(bodyTypes);
	const robotFace = options.face || pick(faces);
	const robotAccessory = options.accessory || pick(accessories);
	const robotName = options.name || pick(names);

	const svg = `
	<svg width="${SIZE}" height="${SIZE}" viewBox="0 0 ${SIZE} ${SIZE}" xmlns="http://www.w3.org/2000/svg">
		${background(palette)}
		${accessory(robotAccessory, palette)}
		${arms(palette)}
		${body(robotBody, palette)}
		${face(robotFace, palette)}
		${details(palette)}
		${label(robotName, palette)}
	</svg>
	`;

	const buffer = await sharp(Buffer.from(svg)).png().toBuffer();

	return {
		buffer,
		mimeType: "image/png",
		width: SIZE,
		height: SIZE,
	};
}

export default cuteRobotGen;