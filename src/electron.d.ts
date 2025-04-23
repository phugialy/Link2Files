declare global {
  interface Window {
    electron: {
      ipcRenderer: {
        invoke(channel: string, ...args: any[]): Promise<any>;
        on(channel: string, func: (...args: any[]) => void): void;
        once(channel: string, func: (...args: any[]) => void): void;
        removeAllListeners(channel: string): void;
      };
      theme: {
        get(): Promise<'system' | 'light' | 'dark'>;
        set(theme: 'system' | 'light' | 'dark'): Promise<void>;
        onChange(callback: (theme: 'system' | 'light' | 'dark') => void): void;
      };
    };
  }
}

export {}; 