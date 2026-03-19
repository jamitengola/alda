#!/usr/bin/env node
/**
 * Generate ALDA app icon as a 1024x1024 PNG, then convert to .icns for macOS.
 * Uses only Node.js built-ins + sips/iconutil (macOS native tools).
 */
const { execSync } = require("child_process");
const fs = require("fs");
const path = require("path");
const os = require("os");

const BUILD_DIR = path.join(__dirname, "..", "build");
const PNG_PATH = path.join(BUILD_DIR, "icon.png");
const ICNS_PATH = path.join(BUILD_DIR, "icon.icns");

// Create a simple SVG icon, then convert via sips
const SVG = `<svg xmlns="http://www.w3.org/2000/svg" width="1024" height="1024" viewBox="0 0 1024 1024">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#3B82F6"/>
      <stop offset="100%" stop-color="#06B6D4"/>
    </linearGradient>
  </defs>
  <rect width="1024" height="1024" rx="220" fill="url(#bg)"/>
  <text x="512" y="580" text-anchor="middle" font-family="SF Pro Display, Helvetica Neue, Arial" font-size="420" font-weight="800" fill="white" letter-spacing="-10">A</text>
  <text x="512" y="780" text-anchor="middle" font-family="SF Pro Display, Helvetica Neue, Arial" font-size="120" font-weight="600" fill="rgba(255,255,255,0.7)" letter-spacing="30">ALDA</text>
</svg>`;

if (!fs.existsSync(BUILD_DIR)) fs.mkdirSync(BUILD_DIR, { recursive: true });

// Write SVG
const svgPath = path.join(os.tmpdir(), "alda-icon.svg");
fs.writeFileSync(svgPath, SVG);

// Convert SVG to PNG using sips (macOS) — need to use qlmanage or rsvg-convert
// Try rsvg-convert first, then qlmanage as fallback
try {
  // Try with rsvg-convert (if installed via brew)
  execSync(`rsvg-convert -w 1024 -h 1024 "${svgPath}" -o "${PNG_PATH}"`, { stdio: "pipe" });
} catch {
  try {
    // Fallback: use qlmanage (Quick Look) — always available on macOS
    const tmpDir = path.join(os.tmpdir(), "alda-icon-gen");
    if (fs.existsSync(tmpDir)) fs.rmSync(tmpDir, { recursive: true });
    fs.mkdirSync(tmpDir);
    execSync(`qlmanage -t -s 1024 -o "${tmpDir}" "${svgPath}" 2>/dev/null`, { stdio: "pipe" });
    const generated = fs.readdirSync(tmpDir).find(f => f.endsWith(".png"));
    if (generated) {
      fs.copyFileSync(path.join(tmpDir, generated), PNG_PATH);
      fs.rmSync(tmpDir, { recursive: true });
    } else {
      throw new Error("qlmanage failed");
    }
  } catch {
    // Last resort: use sips with a plain colored PNG
    console.log("⚠ SVG converters not available. Creating solid color icon...");
    // Create a simple 1x1 blue pixel and scale it
    const bmpHeader = Buffer.alloc(54 + 4);
    // Using sips to create from scratch won't work — create a basic HTML approach
    console.log("Please install librsvg: brew install librsvg");
    console.log("Or copy a 1024x1024 icon.png to build/icon.png manually");
    process.exit(1);
  }
}

console.log(`✅ PNG created: ${PNG_PATH}`);

// Convert PNG to ICNS using iconutil (macOS native)
const iconsetDir = path.join(os.tmpdir(), "alda.iconset");
if (fs.existsSync(iconsetDir)) fs.rmSync(iconsetDir, { recursive: true });
fs.mkdirSync(iconsetDir);

const sizes = [16, 32, 64, 128, 256, 512, 1024];
for (const size of sizes) {
  const outFile = size === 1024
    ? path.join(iconsetDir, "icon_512x512@2x.png")
    : path.join(iconsetDir, `icon_${size}x${size}.png`);
  execSync(`sips -z ${size} ${size} "${PNG_PATH}" --out "${outFile}" 2>/dev/null`, { stdio: "pipe" });

  // Also create @2x variants
  if (size <= 512 && size > 16) {
    const halfSize = size / 2;
    const retinaFile = path.join(iconsetDir, `icon_${halfSize}x${halfSize}@2x.png`);
    if (!fs.existsSync(retinaFile)) {
      fs.copyFileSync(outFile, retinaFile);
    }
  }
}

// Ensure all required sizes are present
const needed = {
  "icon_16x16.png": 16,
  "icon_16x16@2x.png": 32,
  "icon_32x32.png": 32,
  "icon_32x32@2x.png": 64,
  "icon_128x128.png": 128,
  "icon_128x128@2x.png": 256,
  "icon_256x256.png": 256,
  "icon_256x256@2x.png": 512,
  "icon_512x512.png": 512,
  "icon_512x512@2x.png": 1024,
};

for (const [fname, size] of Object.entries(needed)) {
  const target = path.join(iconsetDir, fname);
  if (!fs.existsSync(target)) {
    execSync(`sips -z ${size} ${size} "${PNG_PATH}" --out "${target}" 2>/dev/null`, { stdio: "pipe" });
  }
}

execSync(`iconutil -c icns -o "${ICNS_PATH}" "${iconsetDir}"`, { stdio: "pipe" });
fs.rmSync(iconsetDir, { recursive: true });

console.log(`✅ ICNS created: ${ICNS_PATH}`);
