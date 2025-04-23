import { X } from 'lucide-react';
import { ReactNode } from 'react';

interface InfoModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  content?: ReactNode;
}

const InfoModal = ({ isOpen, onClose, title, content }: InfoModalProps) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50" onClick={onClose}>
      <div className="min-h-screen px-4 text-center">
        <span className="inline-block h-screen align-middle" aria-hidden="true">&#8203;</span>
        
        <div 
          className="inline-block w-full max-w-lg p-6 my-8 text-left align-middle transition-all transform bg-[#1C2333]/95 backdrop-blur-sm border border-gray-700/50 shadow-xl rounded-xl"
          onClick={e => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-white">
              {title}
            </h2>
            <button
              onClick={onClose}
              className="rounded-lg p-2 text-gray-400 hover:text-gray-300 hover:bg-gray-800/50 transition-colors"
              aria-label="Close dialog"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Content */}
          <div className="space-y-6 max-h-[70vh] overflow-y-auto pr-2 scrollbar-thin scrollbar-track-transparent scrollbar-thumb-gray-700/50">
            {content}
          </div>

          {/* Footer */}
          <div className="mt-6 flex justify-end">
            <button
              onClick={onClose}
              className="px-4 py-2 bg-blue-600/90 hover:bg-blue-600 text-white rounded-lg transition-colors"
            >
              Got it
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default InfoModal; 