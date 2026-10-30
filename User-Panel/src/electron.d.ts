/// <reference types="vite/client" />

declare module '*.png' {
  const content: string;
  export default content;
}

declare module '*.svg' {
  const content: string;
  export default content;
}

export interface ElectronDisplay {
  id: number;
  index: number;
  label: string;
  isPrimary: boolean;
  bounds: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
  workArea: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
  resolution: string;
  scaleFactor: number;
}

export interface ElectronPrinter {
  name: string;
  displayName: string;
  description: string;
  status: number;
  isDefault: boolean;
}

export interface ElectronAPI {
  getDisplays: () => Promise<ElectronDisplay[]>;
  openTvOnDisplay: (displayId: number, fullscreen?: boolean) => Promise<{ success: boolean; message?: string }>;
  closeTvDisplay: () => Promise<{ success: boolean; message?: string }>;
  isTvOpen: () => Promise<boolean>;
  onDisplaysChanged: (callback: (displays: ElectronDisplay[]) => void) => () => void;
  getPrinters: () => Promise<ElectronPrinter[]>;
  silentPrint: (options: { html: string; printerName?: string; copies?: number }) => Promise<{ success: boolean; error?: string }>;
  printTicket?: (options?: { html?: string; paperSize?: '80mm' | '58mm'; heightMm?: number; silent?: boolean; printerName?: string; copies?: number }) => Promise<{ success: boolean; error?: string }>;
  checkBackendHealth: () => Promise<{ ok: boolean; error?: string }>;
  getAppVersion?: () => Promise<string>;
  downloadUpdate?: (options: { url: string; fileName?: string }) => Promise<{ success: boolean; filePath?: string; message?: string }>;
  onUpdateDownloadProgress?: (callback: (percent: number) => void) => () => void;
  openExternalUrl?: (url: string) => Promise<boolean>;
  platform: string;
  isElectron: boolean;
}

declare global {
  interface Window {
    electronAPI?: ElectronAPI;
  }
}

