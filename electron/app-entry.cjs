/* eslint-disable @typescript-eslint/no-require-imports */
/**
 * ALDA — Ponto de Entrada Unificado
 *
 * Abriu o ALDA? Tudo roda automaticamente:
 *  1. Verifica/inicia o Ollama (modelos de IA)
 *  2. Inicia o servidor Next.js (dev ou standalone)
 *  3. Carrega o Electron (janela, tray, atalhos)
 *
 * Funciona tanto em desenvolvimento quanto no .app empacotado.
 */
const { app } = require("electron");
const path = require("node:path");
const { fork, spawn, execSync } = require("node:child_process");
const net = require("node:net");
const fs = require("node:fs");

const isPackaged = app.isPackaged;
const ROOT = path.join(__dirname, "..");

// Suppress Chromium chunked-upload noise (harmless network-layer warning)
app.commandLine.appendSwitch("disable-features", "ChunkedDataPipeUploadDataStream");

// ─── Detect mode ─────────────────────────────────────────
// Dev mode: if we find next.config.ts (source project present) and NOT packaged
const isDev = !isPackaged && fs.existsSync(path.join(ROOT, "next.config.ts"));

// ─── Port utilities ──────────────────────────────────────
const DEV_PORT = 3000;
const PROD_PORT = 3456;

function findFreePort(preferred) {
  return new Promise((resolve) => {
    const srv = net.createServer();
    srv.listen(preferred, () => {
      srv.close(() => resolve(preferred));
    });
    srv.on("error", () => {
      const srv2 = net.createServer();
      srv2.listen(0, () => {
        const port = srv2.address().port;
        srv2.close(() => resolve(port));
      });
    });
  });
}

function waitForPort(port, timeoutMs = 30000) {
  return new Promise((resolve, reject) => {
    const deadline = setTimeout(() => reject(new Error(`Port ${port} not ready within ${timeoutMs}ms`)), timeoutMs);
    const poll = setInterval(() => {
      const sock = net.createConnection({ port, host: "localhost" });
      sock.on("connect", () => {
        sock.destroy();
        clearInterval(poll);
        clearTimeout(deadline);
        resolve();
      });
      sock.on("error", () => sock.destroy());
    }, 400);
  });
}

// ─── Ollama — garantir que está rodando ──────────────────
async function ensureOllama() {
  // Check if Ollama is already running
  try {
    const sock = net.createConnection({ port: 11434, host: "127.0.0.1" });
    await new Promise((resolve, reject) => {
      sock.on("connect", () => { sock.destroy(); resolve(); });
      sock.on("error", () => { sock.destroy(); reject(); });
    });
    console.log("[ollama] já está rodando ✓");
    return;
  } catch {
    // Not running — try to start it
  }

  // Find Ollama binary
  const ollamaPaths = [
    "/usr/local/bin/ollama",
    "/opt/homebrew/bin/ollama",
    path.join(app.getPath("home"), ".ollama", "bin", "ollama"),
  ];

  // Also try 'which ollama' 
  try {
    const found = execSync("which ollama", { encoding: "utf8", timeout: 3000 }).trim();
    if (found && !ollamaPaths.includes(found)) ollamaPaths.unshift(found);
  } catch { /* ignore */ }

  // Also check if Ollama.app exists (can be launched via 'open')
  const ollamaApp = "/Applications/Ollama.app";

  let ollamaBin = null;
  for (const p of ollamaPaths) {
    if (fs.existsSync(p)) { ollamaBin = p; break; }
  }

  if (ollamaBin) {
    console.log(`[ollama] iniciando ${ollamaBin}...`);
    const proc = spawn(ollamaBin, ["serve"], {
      stdio: "ignore",
      detached: true,
    });
    proc.unref();
  } else if (fs.existsSync(ollamaApp)) {
    console.log("[ollama] iniciando Ollama.app...");
    spawn("open", ["-a", "Ollama"], { stdio: "ignore", detached: true }).unref();
  } else {
    console.warn("[ollama] Ollama não encontrado — instale em https://ollama.ai");
    return;
  }

  // Wait for Ollama to be ready (up to 10s)
  try {
    await waitForPort(11434, 10000);
    console.log("[ollama] pronto ✓");
  } catch {
    console.warn("[ollama] não conseguiu iniciar em 10s — continuando sem IA local");
  }
}

// ─── Dev Server (next dev) ───────────────────────────────
async function startDevServer() {
  const port = await findFreePort(DEV_PORT);

  // Clean stale lock file from previous crashed sessions
  const lockFile = path.join(ROOT, ".next", "dev", "lock");
  if (fs.existsSync(lockFile)) {
    try { fs.unlinkSync(lockFile); } catch { /* ignore */ }
  }

  // Find npx/next binary
  const npxPath = (() => {
    try { return execSync("which npx", { encoding: "utf8", timeout: 3000 }).trim(); }
    catch { return "npx"; }
  })();

  console.log(`[next:dev] iniciando na porta ${port}...`);

  const serverProcess = spawn(npxPath, ["next", "dev", "--port", String(port)], {
    cwd: ROOT,
    env: { ...process.env, PORT: String(port) },
    stdio: "pipe",
    detached: true,
  });

  serverProcess.stdout.on("data", (d) => {
    const msg = d.toString();
    process.stdout.write(`[next:dev] ${msg}`);
  });
  serverProcess.stderr.on("data", (d) => {
    const msg = d.toString();
    // Turbopack emits normal output to stderr — just log it
    process.stderr.write(`[next:dev] ${msg}`);
  });

  // Wait until port is accepting connections
  await waitForPort(port, 30000);
  console.log(`[next:dev] pronto na porta ${port} ✓`);

  return { port, serverProcess };
}

// ─── Production Server (standalone) ──────────────────────
async function startProdServer() {
  const port = await findFreePort(PROD_PORT);
  const standaloneDir = isPackaged
    ? path.join(process.resourcesPath, "standalone")
    : path.join(ROOT, ".next", "standalone");

  const serverPath = path.join(standaloneDir, "server.js");

  const env = {
    ...process.env,
    PORT: String(port),
    HOSTNAME: "127.0.0.1",
    NODE_ENV: "production",
  };

  // Data directory — use user data location for persistence
  const userDataPath = app.getPath("userData");
  env.ALDA_DATA_DIR = path.join(userDataPath, "data");

  console.log(`[next:prod] iniciando na porta ${port}...`);

  const serverProcess = fork(serverPath, [], {
    env,
    cwd: standaloneDir,
    stdio: "pipe",
  });

  serverProcess.stdout.on("data", (d) => {
    process.stdout.write(`[next:prod] ${d.toString()}`);
  });
  serverProcess.stderr.on("data", (d) => {
    process.stderr.write(`[next:prod:err] ${d.toString()}`);
  });

  // Wait via port polling
  await waitForPort(port, 15000);
  console.log(`[next:prod] pronto na porta ${port} ✓`);

  return { port, serverProcess };
}

// ─── Bootstrap: tudo automático ──────────────────────────
let serverProcess = null;

app.on("ready", async () => {
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log("  ALDA — Iniciando tudo automaticamente...");
  console.log(`  Modo: ${isDev ? "Desenvolvimento" : "Produção"}`);
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");

  try {
    // 1. Ollama
    await ensureOllama();

    // 2. Servidor Next.js
    let result;
    if (isDev) {
      result = await startDevServer();
    } else {
      result = await startProdServer();
    }
    serverProcess = result.serverProcess;

    // 3. Configurar URL e carregar Electron
    process.env.ELECTRON_START_URL = `http://localhost:${result.port}`;
    require("./main.cjs");

    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    console.log("  ALDA pronto! ✓");
    console.log("  ⌘⇧A  — Abrir/esconder");
    console.log("  ⌘⇧O  — Overlay");
    console.log("  ⌘⇧S  — Stealth mode");
    console.log("  ⌘K   — Spotlight");
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  } catch (err) {
    console.error("❌ Falha ao iniciar ALDA:", err.message);
    app.quit();
  }
});

function killServer() {
  if (serverProcess) {
    // Kill the entire process tree (dev server spawns child processes)
    try {
      process.kill(-serverProcess.pid, "SIGTERM");
    } catch {
      try { serverProcess.kill("SIGTERM"); } catch { /* ignore */ }
    }
    serverProcess = null;
  }
}

app.on("before-quit", killServer);
process.on("exit", killServer);
process.on("SIGINT", () => { killServer(); process.exit(0); });
process.on("SIGTERM", () => { killServer(); process.exit(0); });
