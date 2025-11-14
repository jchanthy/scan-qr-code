import React, { useRef, useEffect, useCallback } from 'react';
import { XIcon } from './Icons';

// Assuming jsQR is loaded globally from index.html
declare const jsQR: (data: Uint8ClampedArray, width: number, height: number, options?: { inversionAttempts: 'dontInvert' | 'onlyInvert' | 'both' }) => { data: string } | null;


interface CameraScannerProps {
  onScan: (data: string, imageDataUrl: string) => void;
  onError: (message: string) => void;
  onClose: () => void;
}

const CameraScanner: React.FC<CameraScannerProps> = ({ onScan, onError, onClose }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const animationFrameId = useRef<number | null>(null);

  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    if (animationFrameId.current) {
        cancelAnimationFrame(animationFrameId.current);
        animationFrameId.current = null;
    }
  }, []);

  const tick = useCallback(() => {
    if (videoRef.current && videoRef.current.readyState === videoRef.current.HAVE_ENOUGH_DATA && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');

      if (ctx) {
        canvas.height = video.videoHeight;
        canvas.width = video.videoWidth;
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        
        try {
          const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
          const code = jsQR(imageData.data, imageData.width, imageData.height, {
            inversionAttempts: 'dontInvert', // 'dontInvert' is faster for live video
          });
  
          if (code) {
            // Found a code!
            const imageDataUrl = canvas.toDataURL('image/png');
            onScan(code.data, imageDataUrl);
            stopCamera();
            return; // Stop the loop
          }
        } catch (e) {
          // jsQR might throw an error on certain inputs
          console.warn("jsQR scanning error:", e);
        }
      }
    }
    animationFrameId.current = requestAnimationFrame(tick);
  }, [onScan, stopCamera]);


  useEffect(() => {
    const startCamera = async () => {
      try {
        if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
            throw new Error('Camera not supported on this browser.');
        }

        streamRef.current = await navigator.mediaDevices.getUserMedia({
            video: { facingMode: 'environment' } // Prefer back camera
        });

        if (videoRef.current) {
            videoRef.current.srcObject = streamRef.current;
            videoRef.current.setAttribute('playsinline', 'true'); // Required for iOS
            videoRef.current.play();
            animationFrameId.current = requestAnimationFrame(tick);
        }
      } catch (err) {
        console.error("Camera Error:", err);
        let errorMessage = 'Could not access the camera. Please check permissions.';
        if (err instanceof Error) {
            if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
                errorMessage = 'Camera permission was denied. Please enable it in your browser settings.';
            } else if (err.name === 'NotFoundError' || err.name ==='DevicesNotFoundError') {
                errorMessage = 'No camera found on this device.';
            }
        }
        onError(errorMessage);
        stopCamera();
      }
    };

    startCamera();

    return () => {
      stopCamera();
    };
  }, [onError, stopCamera, tick]);

  return (
    <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4" aria-modal="true" role="dialog">
      <div className="relative bg-slate-800 rounded-lg shadow-xl w-full max-w-lg aspect-square overflow-hidden">
        <video ref={videoRef} className="w-full h-full object-cover" />
        <canvas ref={canvasRef} className="hidden" />

        <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-3/4 h-3/4 border-4 border-white/50 rounded-lg shadow-[0_0_0_9999px_rgba(0,0,0,0.5)]"></div>
        </div>

        <button 
          onClick={onClose} 
          className="absolute top-4 right-4 p-2 bg-black/50 text-white rounded-full hover:bg-black/70 transition-colors"
          aria-label="Close camera scanner"
        >
          <XIcon className="w-6 h-6" />
        </button>
      </div>
    </div>
  );
};

export default CameraScanner;
