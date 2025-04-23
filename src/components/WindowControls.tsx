import { X as XIcon } from 'lucide-react';
import type { FC } from 'react';

declare global {
  interface Window {
    electron: {
      minimize: () => Promise<void>;
      maximize: () => Promise<void>;
      close: () => Promise<void>;
    };
  }
}

export const WindowControls: FC = () => {
  const handleMinimize = () => {
    window.electron.ipcRenderer.invoke('minimize-window');
  };

  const handleMaximize = () => {
    window.electron.ipcRenderer.invoke('maximize-window');
  };

  const handleClose = () => {
    window.electron.ipcRenderer.invoke('close-window');
  };

  return (
    <div className="flex items-center -mr-2">
      <button
        onClick={handleMinimize}
        className="group p-2 hover:bg-gray-800/50 rounded-lg transition-colors duration-200"
        aria-label="Minimize window"
      >
        <div className="w-4 h-0.5 bg-gray-400 group-hover:bg-gray-300 transition-colors duration-200" />
      </button>

      <button
        onClick={handleMaximize}
        className="group p-2 hover:bg-gray-800/50 rounded-lg transition-colors duration-200"
        aria-label="Maximize window"
      >
        <div className="w-3.5 h-3.5 border-2 border-gray-400 group-hover:border-gray-300 transition-colors duration-200" />
      </button>

      <button
        onClick={handleClose}
        className="group p-2 hover:bg-red-500/10 rounded-lg transition-all duration-200"
        aria-label="Close window"
      >
        <XIcon 
          className="w-4 h-4 text-gray-400 group-hover:text-red-400 transform rotate-0 group-hover:rotate-90 transition-all duration-200" 
        />
      </button>
    </div>
  );
}; 