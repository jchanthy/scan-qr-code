import React, { useState, useEffect, useCallback } from 'react';
import { Theme } from './types';
import Header from './components/Header';
import QRCodeInput from './components/QRCodeInput';
import ResultDisplay from './components/ResultDisplay';

const App: React.FC = () => {
  const [theme, setTheme] = useState<Theme>(() => {
    if (typeof window !== 'undefined' && window.localStorage) {
      const storedTheme = window.localStorage.getItem('theme');
      // Fix: Use Theme enum members for comparison to help TypeScript infer the correct type.
      if (storedTheme === Theme.DARK || storedTheme === Theme.LIGHT) {
        return storedTheme;
      }
      if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
        return Theme.DARK;
      }
    }
    return Theme.LIGHT;
  });

  const [qrData, setQrData] = useState<string[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [imageSrc, setImageSrc] = useState<string | null>(null);

  useEffect(() => {
    if (theme === Theme.DARK) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  }, [theme]);

  const toggleTheme = useCallback(() => {
    setTheme((prevTheme) => (prevTheme === Theme.LIGHT ? Theme.DARK : Theme.LIGHT));
  }, []);

  const handleScan = (data: string[]) => {
    setQrData(data);
    setError(null);
    setIsLoading(false);
  };

  const handleError = (message: string) => {
    setError(message);
    setQrData(null);
    setIsLoading(false);
    setImageSrc(null);
  };

  const handleProcessing = (processing: boolean) => {
    setIsLoading(processing);
    if(processing) {
      setQrData(null);
      setError(null);
    }
  };

  const handleImageSelect = (src: string) => {
    setImageSrc(src);
  };
  
  const handleReset = useCallback(() => {
    setQrData(null);
    setError(null);
    setIsLoading(false);
    setImageSrc(null);
  }, []);

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-slate-200 font-sans transition-colors duration-300">
      <Header theme={theme} toggleTheme={toggleTheme} />
      <main className="container mx-auto px-4 py-8 max-w-2xl">
        <div className="space-y-8">
          <QRCodeInput
            onScan={handleScan}
            onError={handleError}
            onProcessing={handleProcessing}
            onImageSelect={handleImageSelect}
            onReset={handleReset}
            imagePreview={imageSrc}
            isProcessing={isLoading}
          />
          <ResultDisplay data={qrData} error={error} loading={isLoading} />
        </div>
      </main>
      <footer className="text-center py-4 mt-8">
        <p className="text-sm text-slate-500 dark:text-slate-400">
          QR Code Reader built by John Chanthy, React Engineer.
        </p>
      </footer>
    </div>
  );
};

export default App;