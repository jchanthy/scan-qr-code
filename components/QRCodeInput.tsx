import React, { useRef, useState, useCallback, DragEvent, ClipboardEvent } from 'react';
import { UploadIcon, XIcon, CameraIcon } from './Icons';
import CameraScanner from './CameraScanner';
import { GoogleGenAI, Type } from "@google/genai";

// TypeScript declaration for the jsQR library loaded from a CDN
declare const jsQR: (data: Uint8ClampedArray, width: number, height: number, options?: { inversionAttempts: 'dontInvert' | 'onlyInvert' | 'both' }) => { data: string } | null;

interface QRCodeInputProps {
  onScan: (data: string[]) => void;
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
  const [isCameraScannerOpen, setCameraScannerOpen] = useState(false);

  // Helper: Scan using the native BarcodeDetector API
  // Returns an array of strings
  const scanWithNative = async (imageSource: ImageBitmap | HTMLImageElement | HTMLCanvasElement | Blob): Promise<string[]> => {
    const results: string[] = [];
    if ('BarcodeDetector' in window) {
      try {
        // @ts-ignore: Experimental API
        const detector = new window.BarcodeDetector({ formats: ['qr_code'] });
        const barcodes = await detector.detect(imageSource);
        if (barcodes.length > 0) {
          barcodes.forEach((barcode: any) => {
             if (barcode.rawValue) results.push(barcode.rawValue);
          });
        }
      } catch (e) {
        console.warn("Native detection failed or not supported", e);
      }
    }
    return results;
  };

  // Helper: Scan using jsQR library
  const scanWithJsQR = (ctx: CanvasRenderingContext2D, width: number, height: number): string | null => {
    if (typeof jsQR !== 'undefined') {
      try {
        const imageData = ctx.getImageData(0, 0, width, height);
        const code = jsQR(imageData.data, imageData.width, imageData.height, {
          inversionAttempts: 'both',
        });
        if (code) {
          return code.data;
        }
      } catch (e) {
         console.warn("jsQR failed", e);
      }
    }
    return null;
  };

  const processImageFile = useCallback(async (file: File) => {
    if (!file.type.startsWith('image/')) {
      onError('Invalid file type. Please upload an image.');
      return;
    }

    onProcessing(true);

    try {
      // 1. Load the image and get Base64 data
      const imageUrl = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (e) => resolve(e.target?.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });

      onImageSelect(imageUrl);

      const image = await new Promise<HTMLImageElement>((resolve, reject) => {
        const img = new Image();
        img.onload = () => resolve(img);
        img.onerror = () => reject(new Error("Failed to load image"));
        img.src = imageUrl;
      });

      const detectedCodes = new Set<string>();

      // --- STAGE 1: Native API (Best for multiple codes) ---
      const nativeResults = await scanWithNative(image);
      nativeResults.forEach(code => detectedCodes.add(code));

      // If native found something, it usually finds everything. But we can continue if empty.
      
      if (detectedCodes.size === 0) {
          // --- STAGE 2: jsQR + Tiling (Fallback for older browsers) ---
          const canvas = document.createElement('canvas');
          canvas.width = image.width;
          canvas.height = image.height;
          const ctx = canvas.getContext('2d', { willReadFrequently: true });
          
          if (ctx) {
            ctx.drawImage(image, 0, 0, image.width, image.height);
            
            // 2.1 Full Image
            const jsQrFull = scanWithJsQR(ctx, image.width, image.height);
            if (jsQrFull) detectedCodes.add(jsQrFull);

            // 2.2 Tiled Scan (to catch small codes if full scan failed)
            if (detectedCodes.size === 0) {
                const halfWidth = Math.floor(image.width / 2);
                const halfHeight = Math.floor(image.height / 2);
                const quadrants = [
                    [0, 0, halfWidth, halfHeight],
                    [halfWidth, 0, halfWidth, halfHeight],
                    [0, halfHeight, halfWidth, halfHeight],
                    [halfWidth, halfHeight, halfWidth, halfHeight]
                ];

                const tileCanvas = document.createElement('canvas');
                tileCanvas.width = halfWidth;
                tileCanvas.height = halfHeight;
                const tileCtx = tileCanvas.getContext('2d', { willReadFrequently: true });

                if (tileCtx) {
                    for (const [x, y, w, h] of quadrants) {
                        tileCtx.clearRect(0, 0, w, h);
                        tileCtx.drawImage(image, x, y, w, h, 0, 0, w, h);
                        const tileJsQr = scanWithJsQR(tileCtx, w, h);
                        if (tileJsQr) detectedCodes.add(tileJsQr);
                    }
                }
            }
          }
      }

      // Use local results if any
      if (detectedCodes.size > 0) {
          onScan(Array.from(detectedCodes));
          return;
      }

      // --- STAGE 3: Gemini AI (Advanced fallback) ---
      // If local detection fails, we use AI.
      try {
           const base64Data = imageUrl.split(',')[1];
           const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
           
           const response = await ai.models.generateContent({
             model: 'gemini-2.5-flash',
             contents: {
               parts: [
                 {
                   inlineData: {
                     mimeType: file.type,
                     data: base64Data
                   }
                 },
                 {
                   text: `Analyze this image and detect all visual QR codes.
                   
                   Strict Requirements:
                   1. Return a pure JSON array of strings containing the decoded data for each QR code found (e.g., ["https://example.com", "12345"]).
                   2. STRICTLY IGNORE any text, URLs, or phone numbers printed on the document background, footer, or header (like Facebook links or addresses). ONLY return data that is encoded inside a QR code pattern.
                   3. If no QR codes are found, return an empty array [].`
                 }
               ]
             },
             config: {
                 responseMimeType: "application/json",
                 responseSchema: {
                     type: Type.ARRAY,
                     items: {
                         type: Type.STRING
                     }
                 }
             }
           });
   
           const jsonText = response.text.trim();
           const aiResults = JSON.parse(jsonText) as string[];
           
           if (Array.isArray(aiResults) && aiResults.length > 0) {
             onScan(aiResults);
             return;
           }

      } catch (aiError) {
          console.error("AI Scan failed", aiError);
      }

      onError('No valid QR codes found in the image.');

    } catch (err) {
      console.error(err);
      onError('Failed to process the image.');
    }
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

  const handleCameraScan = (data: string, imageDataUrl: string) => {
    setCameraScannerOpen(false);
    onImageSelect(imageDataUrl);
    onScan([data]);
  };
  
  const handleCameraError = (message: string) => {
    onError(message);
    setCameraScannerOpen(false);
  };

  const handleCameraClose = () => {
    setCameraScannerOpen(false);
  };

  return (
    <div className="bg-white dark:bg-slate-800 rounded-lg shadow-md p-6" onPaste={handlePaste}>
      {!imagePreview ? (
        <>
            <div
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className={`relative flex flex-col items-center justify-center w-full h-52 border-2 border-dashed rounded-lg cursor-pointer transition-colors duration-200 ease-in-out
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
            
            <div className="flex items-center my-4">
                <div className="flex-grow border-t border-slate-300 dark:border-slate-600"></div>
                <span className="flex-shrink mx-4 text-slate-400 text-sm">OR</span>
                <div className="flex-grow border-t border-slate-300 dark:border-slate-600"></div>
            </div>

            <button
                onClick={() => setCameraScannerOpen(true)}
                className="w-full flex items-center justify-center gap-2 px-4 py-3 text-sm font-semibold rounded-md bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 transition-colors"
                aria-label="Scan QR code with camera"
                >
                <CameraIcon className="w-5 h-5" />
                <span>Scan with Camera</span>
            </button>
        </>
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

      {isCameraScannerOpen && (
        <CameraScanner
            onScan={handleCameraScan}
            onError={handleCameraError}
            onClose={handleCameraClose}
        />
      )}
    </div>
  );
};

export default QRCodeInput;