#!/usr/bin/env node
/**
 * ALDA Build Script
 * 
 * 1. Build Next.js in standalone mode
 * 2. Resolve symlinks in standalone output
 * 3. Package with electron-builder into a macOS .dmg
 */
const { execSync } = require("child_process");
const fs = require("fs");
const path = require("path");

const ROOT = path.join(__dirname, "..");

function run(cmd, label) {
  console.log(`\n🔧 ${label}...`);
  execSync(cmd, { cwd: ROOT, stdio: "inherit" });
  console.log(`✅ ${label} — done`);
}

// Step 1: Build Next.js (standalone output)
run("npx next build", "Building Next.js");

// Step 2: Verify standalone output exists
const standalonePath = path.join(ROOT, ".next", "standalone");
if (!fs.existsSync(standalonePath)) {
  console.error("❌ Standalone output not found. Make sure 'output: \"standalone\"' is in next.config.ts");
  process.exit(1);
}

// Step 3: Copy static assets into standalone
const staticSrc = path.join(ROOT, ".next", "static");
const staticDest = path.join(standalonePath, ".next", "static");
if (fs.existsSync(staticSrc)) {
  run(`cp -R "${staticSrc}" "${staticDest}"`, "Copying static assets");
}

const publicSrc = path.join(ROOT, "public");
const publicDest = path.join(standalonePath, "public");
if (fs.existsSync(publicSrc) && !fs.existsSync(publicDest)) {
  run(`cp -R "${publicSrc}" "${publicDest}"`, "Copying public assets");
}

// Step 4: Copy data directory (plugins, db template)
const dataSrc = path.join(ROOT, "data");
const dataDest = path.join(standalonePath, "data");
if (fs.existsSync(dataSrc) && !fs.existsSync(dataDest)) {
  run(`cp -R "${dataSrc}" "${dataDest}"`, "Copying data directory");
}

// Step 5: Resolve symlinks in standalone output
// electron-builder doesn't handle symlinks well — replace them with real files
console.log("\n🔧 Resolving symlinks in standalone output...");
function resolveSymlinks(dir) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isSymbolicLink()) {
      const realPath = fs.realpathSync(fullPath);
      fs.unlinkSync(fullPath);
      if (fs.statSync(realPath).isDirectory()) {
        execSync(`cp -R "${realPath}" "${fullPath}"`);
      } else {
        fs.copyFileSync(realPath, fullPath);
      }
      console.log(`  ↳ resolved: ${path.relative(standalonePath, fullPath)}`);
    } else if (entry.isDirectory()) {
      resolveSymlinks(fullPath);
    }
  }
}
resolveSymlinks(standalonePath);
console.log("✅ Symlinks resolved");

// Step 6: Package with electron-builder
const buildEnv = { ...process.env, CSC_IDENTITY_AUTO_DISCOVERY: "false" };
console.log("\n🔧 Packaging macOS app...");
execSync("npx electron-builder --mac --config electron-builder.yml", {
  cwd: ROOT,
  stdio: "inherit",
  env: buildEnv,
});
console.log("✅ Packaging macOS app — done");

console.log("\n🎉 Build complete! Check the dist/ folder for ALDA.dmg");
