/* eslint-disable @typescript-eslint/no-require-imports */
const {
  app,
  BrowserWindow,
  Tray,
  Menu,
  globalShortcut,
  ipcMain,
  nativeImage,
  clipboard,
} = require("electron");
const path = require("node:path");
const fs = require("node:fs");
const os = require("node:os");
const { execFile } = require("node:child_process");
const macNative = require("./macos-native.cjs");

// ─── State ───────────────────────────────────────────────
let mainWindow = null;
let overlayWindow = null;
let tray = null;
let stealthMode = false;
let activeAppInterval = null;
let clipboardWatcherInterval = null;
let lastClipboardText = "";
const START_URL = process.env.ELECTRON_START_URL || "http://localhost:3000";

// ─── Main Window ─────────────────────────────────────────
function createMainWindow() {
  const { screen } = require("electron");
  const primaryDisplay = screen.getPrimaryDisplay();
  const { width, height } = primaryDisplay.workAreaSize;
  const { x, y } = primaryDisplay.workArea;

  mainWindow = new BrowserWindow({
    width,
    height,
    x,
    y,
    transparent: true,
    frame: false,
    hasShadow: false,
    resizable: false,
    movable: false,
    fullscreenable: false,
    alwaysOnTop: true,
    skipTaskbar: true,
    type: "panel",
    backgroundColor: "#00000000",
    webPreferences: {
      preload: path.join(__dirname, "preload.cjs"),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  mainWindow.setAlwaysOnTop(true, "floating", 1);
  mainWindow.setVisibleOnAllWorkspaces(true, { visibleOnFullScreen: true });
  mainWindow.setIgnoreMouseEvents(true, { forward: true });

  mainWindow.loadURL(START_URL);

  // Apply stealth if already active
  if (stealthMode) {
    mainWindow.setContentProtection(true);
  }

  // Re-apply visibility on all workspaces when window is shown
  // (workaround for macOS Spaces losing the flag)
  mainWindow.on("show", () => {
    mainWindow.setVisibleOnAllWorkspaces(true, { visibleOnFullScreen: true });
    mainWindow.setAlwaysOnTop(true, "floating", 1);
  });

  // Hide instead of close on macOS
  mainWindow.on("close", (e) => {
    if (!app.isQuitting) {
      e.preventDefault();
      mainWindow.hide();
    }
  });

  mainWindow.on("closed", () => {
    mainWindow = null;
  });
}

// ─── Overlay Window ──────────────────────────────────────
function createOverlayWindow() {
  if (overlayWindow) {
    overlayWindow.show();
    return;
  }

  overlayWindow = new BrowserWindow({
    width: 380,
    height: 200,
    x: 50,
    y: 80,
    frame: false,
    transparent: true,
    alwaysOnTop: true,
    resizable: true,
    movable: true,
    skipTaskbar: true,
    hasShadow: true,
    webPreferences: {
      preload: path.join(__dirname, "preload.cjs"),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  overlayWindow.loadURL(`${START_URL}/overlay`);
  overlayWindow.setAlwaysOnTop(true, "floating", 1);
  overlayWindow.setVisibleOnAllWorkspaces(true, { visibleOnFullScreen: true });

  // Apply stealth if already active
  if (stealthMode) {
    overlayWindow.setContentProtection(true);
  }

  overlayWindow.on("closed", () => {
    overlayWindow = null;
  });
}

function toggleOverlay() {
  if (overlayWindow && overlayWindow.isVisible()) {
    overlayWindow.hide();
  } else {
    createOverlayWindow();
  }
}

// ─── Stealth Mode ────────────────────────────────────────
function setStealthMode(enabled) {
  stealthMode = enabled;
  if (mainWindow) {
    mainWindow.setContentProtection(enabled);
  }
  if (overlayWindow) {
    overlayWindow.setContentProtection(enabled);
  }
  // Notify renderer so it can show a badge
  if (mainWindow) {
    mainWindow.webContents.send("stealth-mode", enabled);
  }
  // Rebuild tray to update the checkbox
  if (tray) createTray();
}

function toggleStealth() {
  setStealthMode(!stealthMode);
}

// ─── System Tray ─────────────────────────────────────────
function createTray() {
  const iconPath = path.join(__dirname, "assets", "tray-icon.png");
  const icon = nativeImage.createFromPath(iconPath).resize({ width: 18, height: 18 });
  icon.setTemplateImage(true); // macOS dark/light menu bar

  tray = new Tray(icon);
  tray.setToolTip("ALDA — Assistente de Aprendizagem");

  const contextMenu = Menu.buildFromTemplate([
    {
      label: "Abrir ALDA",
      click: () => {
        if (mainWindow) {
          mainWindow.show();
          mainWindow.focus();
        }
      },
    },
    {
      label: "Overlay assistente",
      click: () => toggleOverlay(),
    },
    {
      label: stealthMode ? "✓ Stealth Mode (ativo)" : "Stealth Mode",
      click: () => toggleStealth(),
    },
    { type: "separator" },
    {
      label: "Transcrição",
      click: () => navigateTo("/transcricao"),
    },
    {
      label: "Coaching",
      click: () => navigateTo("/assistente"),
    },
    {
      label: "Preparação",
      click: () => navigateTo("/preparacao"),
    },
    {
      label: "Plano de Estudos",
      click: () => navigateTo("/estudos"),
    },
    { type: "separator" },
    {
      label: "Sair",
      click: () => {
        app.isQuitting = true;
        app.quit();
      },
    },
  ]);

  tray.setContextMenu(contextMenu);

  // Click on tray icon toggles window
  tray.on("click", () => {
    if (mainWindow) {
      if (mainWindow.isVisible()) {
        mainWindow.hide();
      } else {
        mainWindow.show();
      }
    }
  });
}

function navigateTo(route) {
  if (mainWindow) {
    mainWindow.show();
    mainWindow.focus();
    mainWindow.webContents.send("navigate", route);
  }
}

// ─── Global Shortcuts ────────────────────────────────────
function registerShortcuts() {
  // Toggle main window
  globalShortcut.register("CommandOrControl+Shift+A", () => {
    if (mainWindow) {
      if (mainWindow.isVisible() && mainWindow.isFocused()) {
        mainWindow.hide();
      } else {
        mainWindow.show();
        mainWindow.focus();
      }
    }
  });

  // Quick recording — navigate to transcription and signal recording start
  globalShortcut.register("CommandOrControl+Shift+R", () => {
    if (mainWindow) {
      mainWindow.show();
      mainWindow.focus();
      mainWindow.webContents.send("navigate", "/transcricao");
      mainWindow.webContents.send("quick-record");
    }
  });

  // Toggle stealth mode
  globalShortcut.register("CommandOrControl+Shift+S", () => {
    toggleStealth();
  });

  // Toggle overlay
  globalShortcut.register("CommandOrControl+Shift+O", () => {
    toggleOverlay();
  });

  // Toggle Spotlight search
  globalShortcut.register("CommandOrControl+K", () => {
    if (mainWindow) {
      mainWindow.show();
      mainWindow.webContents.send("toggle-spotlight");
    }
  });

  // Toggle UI visibility (hide/show widgets & dock without closing window)
  globalShortcut.register("CommandOrControl+Shift+H", () => {
    if (mainWindow) {
      mainWindow.webContents.send("toggle-ui-visibility");
    }
  });

  // Screenshot + OCR (⌘⇧P)
  globalShortcut.register("CommandOrControl+Shift+P", () => {
    captureAndOCR();
  });
}

// ─── IPC Handlers ────────────────────────────────────────
function setupIPC() {
  // Overlay sends a question
  ipcMain.on("overlay-question", (_event, question) => {
    if (mainWindow) {
      mainWindow.webContents.send("overlay-question", question);
    }
  });

  // Main sends answer back to overlay
  ipcMain.on("overlay-answer", (_event, answer) => {
    if (overlayWindow) {
      overlayWindow.webContents.send("overlay-answer", answer);
    }
  });

  // Close overlay from the overlay window itself
  ipcMain.on("close-overlay", () => {
    if (overlayWindow) {
      overlayWindow.hide();
    }
  });

  // Click-through toggle for transparent window areas
  ipcMain.on("set-ignore-mouse-events", (event, ignore, forward) => {
    const win = BrowserWindow.fromWebContents(event.sender);
    if (win) {
      if (ignore) {
        win.setIgnoreMouseEvents(true, { forward: !!forward });
      } else {
        win.setIgnoreMouseEvents(false);
      }
    }
  });

  // ─── macOS Native Integration IPC ────────────────────
  ipcMain.handle("macos:getCalendarEvents", async (_e, days) => {
    return macNative.getCalendarEvents(days);
  });
  ipcMain.handle("macos:createCalendarEvent", async (_e, data) => {
    return macNative.createCalendarEvent(data);
  });
  ipcMain.handle("macos:listCalendars", async () => {
    return macNative.listCalendars();
  });
  ipcMain.handle("macos:getReminders", async (_e, listName) => {
    return macNative.getReminders(listName);
  });
  ipcMain.handle("macos:createReminder", async (_e, data) => {
    return macNative.createReminder(data);
  });
  ipcMain.handle("macos:listReminderLists", async () => {
    return macNative.listReminderLists();
  });
  ipcMain.handle("macos:composeMail", async (_e, data) => {
    return macNative.composeMail(data);
  });
  ipcMain.handle("macos:getUnreadEmails", async (_e, limit) => {
    return macNative.getUnreadEmails(limit);
  });
  ipcMain.handle("macos:createNote", async (_e, data) => {
    return macNative.createNote(data);
  });
}

// ─── Screenshot + OCR ────────────────────────────────────
function captureAndOCR() {
  if (!mainWindow) return;
  const tmpFile = path.join(os.tmpdir(), `alda-screenshot-${Date.now()}.png`);

  // Notify renderer that capture is starting
  mainWindow.webContents.send("screenshot-ocr-status", "capturing");

  // Use macOS native screencapture (interactive selection)
  execFile("screencapture", ["-i", tmpFile], { timeout: 30000 }, (err) => {
    if (err || !fs.existsSync(tmpFile)) {
      // User cancelled or error
      mainWindow.webContents.send("screenshot-ocr-status", "idle");
      return;
    }

    mainWindow.webContents.send("screenshot-ocr-status", "processing");

    // Dynamic import for Tesseract.js (ESM module)
    import("tesseract.js").then(({ createWorker }) => {
      createWorker("por+eng").then((worker) => {
        worker.recognize(tmpFile).then(({ data: { text } }) => {
          const clean = text.trim();
          if (clean) {
            mainWindow.webContents.send("screenshot-ocr-result", clean);
          }
          mainWindow.webContents.send("screenshot-ocr-status", "idle");
          worker.terminate();
          // Clean up temp file
          fs.unlink(tmpFile, () => {});
        }).catch(() => {
          mainWindow.webContents.send("screenshot-ocr-status", "idle");
          fs.unlink(tmpFile, () => {});
        });
      }).catch(() => {
        mainWindow.webContents.send("screenshot-ocr-status", "idle");
        fs.unlink(tmpFile, () => {});
      });
    }).catch(() => {
      mainWindow.webContents.send("screenshot-ocr-status", "idle");
      fs.unlink(tmpFile, () => {});
    });
  });
}

// ─── Active App Detection ────────────────────────────────
function startActiveAppPolling() {
  if (process.platform !== "darwin") return;

  const script = `
tell application "System Events"
  set frontApp to first application process whose frontmost is true
  set appName to name of frontApp
  set appBundle to bundle identifier of frontApp
  return appName & "|" & appBundle
end tell
  `.trim();

  activeAppInterval = setInterval(() => {
    if (!mainWindow) return;
    execFile("osascript", ["-e", script], { timeout: 2000 }, (err, stdout) => {
      if (err || !stdout) return;
      const parts = stdout.trim().split("|");
      if (parts.length >= 2) {
        const name = parts[0];
        const bundleId = parts[1];
        // Ignore ourselves
        if (bundleId === "com.electron.alda" || name === "Electron") return;
        mainWindow.webContents.send("active-app-changed", { name, bundleId });
      }
    });
  }, 1500); // poll every 1.5s
}

// ─── Clipboard Watcher ───────────────────────────────────
function startClipboardWatcher() {
  lastClipboardText = clipboard.readText();
  clipboardWatcherInterval = setInterval(() => {
    if (!mainWindow) return;
    const text = clipboard.readText();
    // Se o texto mudou e tem tamanho considerável (evita spam de coisas pequenas)
    if (text !== lastClipboardText && text.trim().length > 15) {
      lastClipboardText = text;
      mainWindow.webContents.send("clipboard-text-copied", text.trim());
    }
  }, 1500); // testa clipboard a cada 1.5s
}

// ─── App Lifecycle ───────────────────────────────────────

// Auto-launch: register ALDA to start at macOS login
app.setLoginItemSettings({
  openAtLogin: true,
  openAsHidden: true,
  name: "ALDA",
});

function bootstrap() {
  createMainWindow();
  createTray();
  registerShortcuts();
  setupIPC();
  startActiveAppPolling();
  startClipboardWatcher();

  app.on("activate", () => {
    if (!mainWindow) {
      createMainWindow();
    } else {
      mainWindow.show();
    }
  });
}

// When required by app-entry.cjs, the app is already ready
if (app.isReady()) {
  bootstrap();
} else {
  app.whenReady().then(bootstrap);
}

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});

app.on("will-quit", () => {
  globalShortcut.unregisterAll();
  if (activeAppInterval) clearInterval(activeAppInterval);
  if (clipboardWatcherInterval) clearInterval(clipboardWatcherInterval);
});

app.on("before-quit", () => {
  app.isQuitting = true;
});