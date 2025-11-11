
import React, { useState, useEffect } from 'react';
import { ClipboardIcon, CheckIcon, LinkIcon, AlertTriangleIcon } from './Icons';

interface ResultDisplayProps {
  data: string | null;
  error: string | null;
  loading: boolean;
}

const isUrl = (text: string): boolean => {
    try {
        new URL(text);
        return true;
    } catch (_) {
        return false;
    }
}

const ResultDisplay: React.FC<ResultDisplayProps> = ({ data, error, loading }) => {
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (copied) {
      const timer = setTimeout(() => setCopied(false), 2000);
      return () => clearTimeout(timer);
    }
  }, [copied]);
  
  useEffect(() => {
    if(data) {
        setCopied(false);
    }
  }, [data]);

  const handleCopy = () => {
    if (data) {
      navigator.clipboard.writeText(data).then(() => {
        setCopied(true);
      });
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8 bg-white dark:bg-slate-800 rounded-lg shadow-md min-h-[12rem]">
        <div className="flex items-center space-x-3">
          <svg className="animate-spin h-6 w-6 text-primary" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          <span className="text-lg font-medium text-slate-600 dark:text-slate-300">Scanning...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
        <div className="p-6 bg-red-50 dark:bg-red-900/20 border-l-4 border-red-500 rounded-r-lg shadow-md min-h-[12rem] flex items-center">
            <div className="flex items-center space-x-4">
                <AlertTriangleIcon className="w-8 h-8 text-red-500" />
                <div>
                    <h3 className="font-bold text-red-800 dark:text-red-300">Scan Failed</h3>
                    <p className="text-red-600 dark:text-red-400 mt-1">{error}</p>
                </div>
            </div>
      </div>
    );
  }

  if (!data) {
    return (
       <div className="flex items-center justify-center p-8 bg-white dark:bg-slate-800 rounded-lg shadow-md text-center min-h-[12rem]">
            <p className="text-slate-500 dark:text-slate-400">Scan a QR code to see the result here.</p>
       </div>
    );
  }

  const isDataUrl = isUrl(data);

  return (
    <div className="bg-white dark:bg-slate-800 rounded-lg shadow-md min-h-[12rem]">
        <div className="p-4 border-b border-slate-200 dark:border-slate-700 flex justify-between items-center">
            <h2 className="text-lg font-semibold text-slate-800 dark:text-slate-100">Scanned Result</h2>
            <button onClick={handleCopy} className="flex items-center space-x-2 px-3 py-1.5 text-sm font-medium rounded-md bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 dark:hover:bg-slate-600 dark:text-slate-200 transition-colors">
                {copied ? <CheckIcon className="w-4 h-4 text-green-500"/> : <ClipboardIcon className="w-4 h-4"/>}
                <span>{copied ? 'Copied!' : 'Copy'}</span>
            </button>
        </div>
        <div className="p-6">
            <p className="text-slate-600 dark:text-slate-300 break-all whitespace-pre-wrap font-mono text-sm">
                {data}
            </p>
            {isDataUrl && (
                <a href={data} target="_blank" rel="noopener noreferrer" className="mt-4 inline-flex items-center space-x-2 px-4 py-2 text-sm font-semibold rounded-md bg-primary text-white hover:bg-primary-dark transition-colors">
                    <LinkIcon className="w-4 h-4" />
                    <span>Open Link</span>
                </a>
            )}
        </div>
    </div>
  );
};

export default ResultDisplay;
