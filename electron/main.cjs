/* eslint-disable @typescript-eslint/no-require-imports */
const {
  app,
  BrowserWindow,
  Tray,
  Menu,
  globalShortcut,
  ipcMain,
  nativeImage,
} = require("electron");
const path = require("node:path");

// ─── State ───────────────────────────────────────────────
let mainWindow = null;
let overlayWindow = null;
let tray = null;
const START_URL = process.env.ELECTRON_START_URL || "http://localhost:3000";

// ─── Main Window ─────────────────────────────────────────
function createMainWindow() {
  mainWindow = new BrowserWindow({
    width: 1300,
    height: 900,
    minWidth: 800,
    minHeight: 600,
    title: "ALDA",
    titleBarStyle: "hiddenInset",
    trafficLightPosition: { x: 15, y: 15 },
    webPreferences: {
      preload: path.join(__dirname, "preload.cjs"),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  mainWindow.loadURL(START_URL);

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
  overlayWindow.setVisibleOnAllWorkspaces(true, { visibleOnFullScreen: true });

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
    { type: "separator" },
    {
      label: "Transcrição",
      click: () => navigateTo("/transcricao"),
    },
    {
      label: "Assistente",
      click: () => navigateTo("/assistente"),
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

  // Toggle overlay
  globalShortcut.register("CommandOrControl+Shift+O", () => {
    toggleOverlay();
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
}

// ─── App Lifecycle ───────────────────────────────────────
app.whenReady().then(() => {
  createMainWindow();
  createTray();
  registerShortcuts();
  setupIPC();

  app.on("activate", () => {
    if (!mainWindow) {
      createMainWindow();
    } else {
      mainWindow.show();
    }
  });
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});

app.on("will-quit", () => {
  globalShortcut.unregisterAll();
});

app.on("before-quit", () => {
  app.isQuitting = true;
});