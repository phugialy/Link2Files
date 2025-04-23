export interface IpcRenderer {
  invoke(channel: string, ...args: any[]): Promise<any>;
  on(channel: string, func: (...args: any[]) => void): void;
  once(channel: string, func: (...args: any[]) => void): void;
  removeAllListeners(channel: string): void;
}

export interface ElectronAPI {
  ipcRenderer: IpcRenderer;
}

declare global {
  interface Window {
    electron: ElectronAPI;
  }
}

export {}; 