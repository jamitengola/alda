/* Type declarations for the Electron preload bridge (window.alda) */

interface AldaBridge {
  platform: string;
  onNavigate: (callback: (route: string) => void) => void;
  onQuickRecord: (callback: () => void) => void;
  sendOverlayQuestion: (question: string) => void;
  onOverlayQuestion: (callback: (question: string) => void) => void;
  sendOverlayAnswer: (answer: string) => void;
  onOverlayAnswer: (callback: (answer: string) => void) => void;
  closeOverlay: () => void;
  setMouseIgnore: (ignore: boolean, forward?: boolean) => void;
  onToggleSpotlight: (callback: () => void) => void;
  onStealthMode: (callback: (enabled: boolean) => void) => void;
  onActiveAppChanged: (callback: (appInfo: { name: string; bundleId: string }) => void) => void;
  onToggleUI: (callback: () => void) => void;
  onClipboardTextCopied: (callback: (text: string) => void) => void;
  onScreenshotOCR: (callback: (text: string) => void) => void;
  onScreenshotOCRStatus: (callback: (status: "idle" | "capturing" | "processing") => void) => void;

  // macOS Native Integrations
  macGetCalendarEvents: (days?: number) => Promise<Array<{ title: string; start: string; end: string; calendar: string; location: string }>>;
  macCreateCalendarEvent: (data: { title: string; startDate: string; endDate: string; calendar?: string; location?: string; notes?: string }) => Promise<boolean>;
  macListCalendars: () => Promise<string[]>;
  macGetReminders: (listName?: string) => Promise<Array<{ name: string; dueDate: string; priority: string }>>;
  macCreateReminder: (data: { name: string; listName?: string; dueDate?: string; notes?: string }) => Promise<boolean>;
  macListReminderLists: () => Promise<string[]>;
  macComposeMail: (data: { to: string; subject: string; body: string }) => Promise<boolean>;
  macGetUnreadEmails: (limit?: number) => Promise<Array<{ subject: string; sender: string; date: string; preview: string }>>;
  macCreateNote: (data: { title: string; body: string; folder?: string }) => Promise<boolean>;
}

interface Window {
  alda?: AldaBridge;
}
