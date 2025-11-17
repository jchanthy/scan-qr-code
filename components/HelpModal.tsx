import React from 'react';
import { XIcon, UploadIcon, CameraIcon } from './Icons';

interface HelpModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const HelpModal: React.FC<HelpModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  const handleBackdropClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <div 
      className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 transition-opacity duration-300 animate-fadeIn" 
      aria-modal="true" 
      role="dialog" 
      onClick={handleBackdropClick}
    >
      <div 
        className="relative bg-white dark:bg-slate-800 rounded-lg shadow-xl w-full max-w-md overflow-hidden animate-scaleIn"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex justify-between items-center p-4 border-b border-slate-200 dark:border-slate-700">
          <h2 className="text-lg font-semibold text-slate-800 dark:text-slate-100">How to Use</h2>
          <button onClick={onClose} className="p-1 rounded-full text-slate-500 hover:bg-slate-200 dark:text-slate-400 dark:hover:bg-slate-700 transition-colors" aria-label="Close help">
            <XIcon className="w-5 h-5" />
          </button>
        </div>
        
        {/* Body */}
        <div className="p-6 space-y-4 text-slate-600 dark:text-slate-300">
          <div className="space-y-5">
            <div className="flex items-start space-x-4">
              <div className="flex-shrink-0 w-10 h-10 rounded-full bg-primary/10 text-primary flex items-center justify-center">
                <UploadIcon className="w-5 h-5"/>
              </div>
              <div>
                <h3 className="font-semibold text-slate-700 dark:text-slate-200">Upload, Drag & Drop, or Paste</h3>
                <p className="text-sm mt-1">Click the upload area, drag an image file into it, or simply paste an image from your clipboard (e.g., Ctrl+V) to start scanning.</p>
              </div>
            </div>
            <div className="flex items-start space-x-4">
              <div className="flex-shrink-0 w-10 h-10 rounded-full bg-primary/10 text-primary flex items-center justify-center">
                <CameraIcon className="w-5 h-5"/>
              </div>
              <div>
                <h3 className="font-semibold text-slate-700 dark:text-slate-200">Use Your Camera</h3>
                <p className="text-sm mt-1">Click the 'Scan with Camera' button to open a live view. Point your camera at a QR code to scan it instantly.</p>
              </div>
            </div>
          </div>
        </div>
        
        {/* Footer */}
        <div className="p-4 bg-slate-50 dark:bg-slate-800/50 border-t border-slate-200 dark:border-slate-700 text-right">
          <button onClick={onClose} className="px-4 py-2 text-sm font-semibold rounded-md bg-primary text-white hover:bg-primary-dark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary dark:focus:ring-offset-slate-800 transition-colors">
            Got it!
          </button>
        </div>
      </div>
      <style>{`
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
        @keyframes scaleIn { from { transform: scale(0.95); opacity: 0; } to { transform: scale(1); opacity: 1; } }
        .animate-fadeIn { animation: fadeIn 0.2s ease-out forwards; }
        .animate-scaleIn { animation: scaleIn 0.2s ease-out forwards; }
      `}</style>
    </div>
  );
};

export default HelpModal;
