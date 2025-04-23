import { X } from 'lucide-react';
import { useEffect } from 'react';
import type { FC } from 'react';

interface InfoModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  content: React.ReactNode;
}

const InfoModal: FC<InfoModalProps> = ({ isOpen, onClose, title, content }) => {
  // Add effect to handle body scroll lock
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      // Add padding right to prevent layout shift (width of scrollbar)
      document.body.style.paddingRight = '15px';
    } else {
      document.body.style.overflow = '';
      document.body.style.paddingRight = '';
    }
    return () => {
      document.body.style.overflow = '';
      document.body.style.paddingRight = '';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50"
      onClick={onClose}
      aria-modal="true"
      role="dialog"
    >
      <div className="fixed inset-0 flex items-center justify-center p-4">
        <div 
          className="w-full max-w-lg bg-[#1C2333]/95 backdrop-blur-sm border border-gray-700/50 shadow-xl rounded-xl"
          onClick={e => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-700/50">
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
          <div className="p-6 max-h-[calc(100vh-12rem)] overflow-y-auto custom-scrollbar">
            {content}
          </div>

          {/* Footer */}
          <div className="p-6 border-t border-gray-700/50 flex justify-end">
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