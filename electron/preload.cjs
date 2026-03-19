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

  // Toggle UI visibility (hide/show widgets & dock)
  onToggleUI: (callback) => {
    ipcRenderer.on("toggle-ui-visibility", () => callback());
  },

  // Clipboard Watcher
  onClipboardTextCopied: (callback) => {
    ipcRenderer.on("clipboard-text-copied", (_event, text) => callback(text));
  },

  // Screenshot + OCR
  onScreenshotOCR: (callback) => {
    ipcRenderer.on("screenshot-ocr-result", (_event, text) => callback(text));
  },
  onScreenshotOCRStatus: (callback) => {
    ipcRenderer.on("screenshot-ocr-status", (_event, status) => callback(status));
  },

  // macOS Native Integrations
  macGetCalendarEvents: (days) => ipcRenderer.invoke("macos:getCalendarEvents", days),
  macCreateCalendarEvent: (data) => ipcRenderer.invoke("macos:createCalendarEvent", data),
  macListCalendars: () => ipcRenderer.invoke("macos:listCalendars"),
  macGetReminders: (listName) => ipcRenderer.invoke("macos:getReminders", listName),
  macCreateReminder: (data) => ipcRenderer.invoke("macos:createReminder", data),
  macListReminderLists: () => ipcRenderer.invoke("macos:listReminderLists"),
  macComposeMail: (data) => ipcRenderer.invoke("macos:composeMail", data),
  macGetUnreadEmails: (limit) => ipcRenderer.invoke("macos:getUnreadEmails", limit),
  macCreateNote: (data) => ipcRenderer.invoke("macos:createNote", data),
});