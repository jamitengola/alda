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
}

interface Window {
  alda?: AldaBridge;
}
