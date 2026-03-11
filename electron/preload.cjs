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

  // Stealth mode notification
  onStealthMode: (callback) => {
    ipcRenderer.on("stealth-mode", (_event, enabled) => callback(enabled));
  },
});