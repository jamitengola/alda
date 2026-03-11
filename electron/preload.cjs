/* eslint-disable @typescript-eslint/no-require-imports */
const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("alda", {
  platform: process.platform,

  // Navigation from tray menu / shortcuts
  onNavigate: (callback) => {
    ipcRenderer.on("navigate", (_event, route) => callback(route));
  },

  // Quick record trigger from global shortcut
  onQuickRecord: (callback) => {
    ipcRenderer.on("quick-record", () => callback());
  },

  // Overlay communication
  sendOverlayQuestion: (question) => {
    ipcRenderer.send("overlay-question", question);
  },
  onOverlayQuestion: (callback) => {
    ipcRenderer.on("overlay-question", (_event, question) => callback(question));
  },
  sendOverlayAnswer: (answer) => {
    ipcRenderer.send("overlay-answer", answer);
  },
  onOverlayAnswer: (callback) => {
    ipcRenderer.on("overlay-answer", (_event, answer) => callback(answer));
  },
  closeOverlay: () => {
    ipcRenderer.send("close-overlay");
  },

  // Click-through control for transparent window
  setMouseIgnore: (ignore, forward) => {
    ipcRenderer.send("set-ignore-mouse-events", ignore, forward);
  },

  // Spotlight toggle from global shortcut
  onToggleSpotlight: (callback) => {
    ipcRenderer.on("toggle-spotlight", () => callback());
  },

  // Stealth mode notification
  onStealthMode: (callback) => {
    ipcRenderer.on("stealth-mode", (_event, enabled) => callback(enabled));
  },

  // Active app detection (macOS)
  onActiveAppChanged: (callback) => {
    ipcRenderer.on("active-app-changed", (_event, appInfo) => callback(appInfo));
  },
});