import React, { useRef, useState, useCallback, DragEvent, ClipboardEvent } from 'react';
import { UploadIcon, XIcon } from './Icons';

// TypeScript declaration for the jsQR library loaded from a CDN
declare const jsQR: (data: Uint8ClampedArray, width: number, height: number, options?: { inversionAttempts: 'dontInvert' | 'onlyInvert' | 'both' }) => { data: string } | null;

interface QRCodeInputProps {
  onScan: (data: string) => void;
  onError: (message: string) => void;
  onProcessing: (isProcessing: boolean) => void;
  onImageSelect: (imageSrc: string) => void;
  onReset: () => void;
  imagePreview: string | null;
  isProcessing: boolean;
}

const QRCodeInput: React.FC<QRCodeInputProps> = ({ onScan, onError, onProcessing, onImageSelect, onReset, imagePreview, isProcessing }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [dragActive, setDragActive] = useState(false);

  const processImageFile = useCallback((file: File) => {
    if (!file.type.startsWith('image/')) {
      onError('Invalid file type. Please upload an image.');
      return;
    }

    onProcessing(true);
    const reader = new FileReader();

    reader.onload = (e) => {
      const imageUrl = e.target?.result as string;
      onImageSelect(imageUrl);

      const image = new Image();
      image.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = image.width;
        canvas.height = image.height;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          onError('Could not get canvas context.');
          return;
        }
        ctx.drawImage(image, 0, 0, image.width, image.height);
        const imageData = ctx.getImageData(0, 0, image.width, image.height);
        
        if (typeof jsQR === 'undefined') {
            onError('QR Code scanning library is not loaded.');
            return;
        }

        const code = jsQR(imageData.data, imageData.width, imageData.height, {
          inversionAttempts: 'both',
        });
        if (code) {
          onScan(code.data);
        } else {
          onError('No QR code found. If the image is blurry or has a large logo, it may be difficult to read.');
        }
      };
      image.onerror = () => {
        onError('Could not load the image.');
      };
      image.src = imageUrl;
    };
    reader.onerror = () => {
        onError('Failed to read the file.');
    };
    reader.readAsDataURL(file);
  }, [onScan, onError, onProcessing, onImageSelect]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      processImageFile(e.target.files[0]);
    }
  };

  const handleDrop = useCallback((e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processImageFile(e.dataTransfer.files[0]);
    }
  }, [processImageFile]);

  const handleDrag = useCallback((e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  }, []);
  
  const handlePaste = useCallback((e: ClipboardEvent<HTMLDivElement>) => {
    const items = e.clipboardData?.items;
    if (!items) return;
    for (let i = 0; i < items.length; i++) {
        if (items[i].type.indexOf("image") !== -1) {
            const file = items[i].getAsFile();
            if(file) {
               processImageFile(file);
            }
            break;
        }
    }
  }, [processImageFile]);


  return (
    <div className="bg-white dark:bg-slate-800 rounded-lg shadow-md p-6" onPaste={handlePaste}>
      {!imagePreview ? (
        <div
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className={`relative flex flex-col items-center justify-center w-full h-64 border-2 border-dashed rounded-lg cursor-pointer transition-colors duration-200 ease-in-out
            ${dragActive ? 'border-primary bg-primary/10' : 'border-slate-300 dark:border-slate-600 hover:border-slate-400 dark:hover:border-slate-500 bg-slate-50 dark:bg-slate-700/50'}`}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleFileChange}
          />
          <div className="flex flex-col items-center justify-center pt-5 pb-6 text-center">
            <UploadIcon className="w-10 h-10 mb-3 text-slate-400" />
            <p className="mb-2 text-sm text-slate-500 dark:text-slate-400">
              <span className="font-semibold text-primary">Click to upload</span>, drag & drop, or paste
            </p>
            <p className="text-xs text-slate-500 dark:text-slate-400">PNG, JPG, GIF, WEBP</p>
          </div>
        </div>
      ) : (
         <div className="relative">
            <div className="w-full h-64 flex items-center justify-center bg-slate-100 dark:bg-slate-700 rounded-lg overflow-hidden">
                <img src={imagePreview} alt="QR Code Preview" className="max-w-full max-h-full object-contain"/>
            </div>
            <button 
                onClick={onReset} 
                className="absolute top-2 right-2 p-1.5 bg-black/50 text-white rounded-full hover:bg-black/70 transition-colors"
                aria-label="Clear image"
            >
                <XIcon className="w-5 h-5" />
            </button>
         </div>
      )}
    </div>
  );
};

export default QRCodeInput;