/**
 * Generates icon.png, adaptive-icon.png and splash.png for CampusHub
 * Run: node scripts/generate-icons.js
 */
const sharp = require('sharp');
const path = require('path');
const fs = require('fs');

const OUT = path.join(__dirname, '..', 'assets', 'images');

// ── Icon SVG (1024×1024) ─────────────────────────────────────────────────────
// Graduation cap + three connected-service dots on a rich green gradient
const iconSVG = `
<svg width="1024" height="1024" viewBox="0 0 1024 1024"
     xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1024" y2="1024" gradientUnits="userSpaceOnUse">
      <stop offset="0%"   stop-color="#14a86c"/>
      <stop offset="100%" stop-color="#065c39"/>
    </linearGradient>
    <!-- soft inner glow at top-left -->
    <radialGradient id="glow" cx="30%" cy="25%" r="55%">
      <stop offset="0%"   stop-color="#ffffff" stop-opacity="0.12"/>
      <stop offset="100%" stop-color="#ffffff" stop-opacity="0"/>
    </radialGradient>
  </defs>

  <!-- Background -->
  <rect width="1024" height="1024" fill="url(#bg)" rx="0"/>
  <rect width="1024" height="1024" fill="url(#glow)" rx="0"/>

  <!-- ── Mortarboard cap ── -->
  <!-- flat diamond top -->
  <polygon points="512,210  775,345  512,480  249,345" fill="white"/>
  <!-- cap shadow / depth -->
  <polygon points="512,480  249,345  249,360  512,495" fill="white" opacity="0.25"/>

  <!-- Left pillar (cap body) -->
  <rect x="249" y="345" width="58" height="185" rx="14" fill="white"/>
  <!-- Arch brim (semicircle) at bottom of pillar -->
  <ellipse cx="278" cy="530" rx="58" ry="22" fill="white"/>

  <!-- Tassel rope -->
  <line x1="775" y1="345" x2="775" y2="450"
        stroke="white" stroke-width="16" stroke-linecap="round"/>
  <!-- Tassel ball -->
  <circle cx="775" cy="484" r="34" fill="white"/>
  <!-- Tassel fringe lines -->
  <line x1="755" y1="514" x2="740" y2="565" stroke="white" stroke-width="8" stroke-linecap="round" opacity="0.8"/>
  <line x1="775" y1="518" x2="775" y2="572" stroke="white" stroke-width="8" stroke-linecap="round" opacity="0.8"/>
  <line x1="795" y1="514" x2="810" y2="565" stroke="white" stroke-width="8" stroke-linecap="round" opacity="0.8"/>

  <!-- ── Hub / service-network nodes ── -->
  <!-- Connecting lines first (so circles render on top) -->
  <line x1="338" y1="660" x2="488" y2="694" stroke="white" stroke-width="10"
        stroke-linecap="round" opacity="0.45"/>
  <line x1="536" y1="694" x2="686" y2="660" stroke="white" stroke-width="10"
        stroke-linecap="round" opacity="0.45"/>

  <!-- Left node -->
  <circle cx="312" cy="660" r="30" fill="white" opacity="0.9"/>
  <!-- Centre node (slightly lower) -->
  <circle cx="512" cy="694" r="30" fill="white" opacity="0.9"/>
  <!-- Right node -->
  <circle cx="712" cy="660" r="30" fill="white" opacity="0.9"/>

  <!-- inner dots to give a "filled ring" look -->
  <circle cx="312" cy="660" r="14" fill="#0c8a57"/>
  <circle cx="512" cy="694" r="14" fill="#0c8a57"/>
  <circle cx="712" cy="660" r="14" fill="#0c8a57"/>

  <!-- ── "CH" monogram at bottom ── -->
  <text x="512" y="840"
        font-family="Arial Black, Helvetica Neue, sans-serif"
        font-size="110" font-weight="900" letter-spacing="12"
        fill="white" text-anchor="middle" opacity="0.92">CH</text>
</svg>
`;

// ── Adaptive-icon foreground SVG (1024×1024, transparent bg, content in ~50% safe zone) ──
const adaptiveSVG = iconSVG; // same design, background colour set in app.json

// ── Splash screen SVG (1284×2778 — iPhone Pro Max size) ────────────────────
const splashSVG = `
<svg width="1284" height="2778" viewBox="0 0 1284 2778"
     xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1284" y2="2778" gradientUnits="userSpaceOnUse">
      <stop offset="0%"   stop-color="#f0faf4"/>
      <stop offset="100%" stop-color="#d4ece0"/>
    </linearGradient>
  </defs>
  <rect width="1284" height="2778" fill="url(#bg)"/>

  <!-- Icon centred -->
  <g transform="translate(392,1039) scale(0.49)">
    ${iconSVG.replace(/<svg[^>]*>/, '').replace('</svg>', '')}
  </g>

  <!-- App name -->
  <text x="642" y="1470"
        font-family="Arial Black, Helvetica Neue, sans-serif"
        font-size="96" font-weight="900" letter-spacing="4"
        fill="#0c8a57" text-anchor="middle">CampusHub</text>
  <text x="642" y="1560"
        font-family="Arial, Helvetica Neue, sans-serif"
        font-size="52" fill="#73897a" text-anchor="middle">
    Campus services, on demand.
  </text>
</svg>
`;

async function generate() {
  console.log('Generating icons…');

  // icon.png  (1024×1024)
  await sharp(Buffer.from(iconSVG))
    .resize(1024, 1024)
    .png()
    .toFile(path.join(OUT, 'icon.png'));
  console.log('✔ icon.png');

  // adaptive-icon.png  (1024×1024, transparent bg already handled by app.json backgroundColor)
  await sharp(Buffer.from(adaptiveSVG))
    .resize(1024, 1024)
    .png()
    .toFile(path.join(OUT, 'adaptive-icon.png'));
  console.log('✔ adaptive-icon.png');

  // splash.png  (1284×2778)
  await sharp(Buffer.from(splashSVG))
    .resize(1284, 2778)
    .png()
    .toFile(path.join(OUT, 'splash.png'));
  console.log('✔ splash.png');

  console.log('\nAll icons generated in assets/images/');
}

generate().catch(console.error);
