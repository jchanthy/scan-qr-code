import React, { useState, useEffect } from 'react';
import { ClipboardIcon, CheckIcon, LinkIcon, AlertTriangleIcon } from './Icons';

interface ResultDisplayProps {
  data: string[] | null;
  error: string | null;
  loading: boolean;
}

const isUrl = (text: string): boolean => {
    if (!text || text.includes(' ') || !text.includes('.')) {
        return false;
    }
    try {
        // This works for fully qualified URLs
        new URL(text);
        return true;
    } catch (_) {
        // This is for URLs without a protocol like 'google.com'
        try {
            new URL(`https://${text}`);
            return true;
        } catch (e) {
            return false;
        }
    }
}

interface SingleResultProps {
    content: string;
    index: number;
}

const SingleResult: React.FC<SingleResultProps> = ({ content, index }) => {
    const [copied, setCopied] = useState(false);
    const isContentUrl = isUrl(content);

    useEffect(() => {
        if (copied) {
            const timer = setTimeout(() => setCopied(false), 2000);
            return () => clearTimeout(timer);
        }
    }, [copied]);

    const handleCopy = () => {
        navigator.clipboard.writeText(content).then(() => {
            setCopied(true);
        });
    };

    const getFormattedUrl = (url: string) => {
        if (!/^(?:f|ht)tps?\:\/\//.test(url)) {
            return `https://${url}`;
        }
        return url;
    };

    return (
        <div className="bg-white dark:bg-slate-800 rounded-lg shadow-md overflow-hidden border border-slate-200 dark:border-slate-700 mb-4 last:mb-0">
            <div className="p-4 border-b border-slate-100 dark:border-slate-700 bg-slate-50 dark:bg-slate-700/50 flex justify-between items-center">
                <h2 className="text-sm font-semibold text-slate-600 dark:text-slate-300">Result #{index + 1}</h2>
                <button onClick={handleCopy} className="flex items-center space-x-2 px-2 py-1 text-xs font-medium rounded-md bg-white border border-slate-200 hover:bg-slate-50 dark:bg-slate-600 dark:border-slate-500 dark:hover:bg-slate-500 dark:text-slate-200 transition-colors">
                    {copied ? <CheckIcon className="w-3 h-3 text-green-500"/> : <ClipboardIcon className="w-3 h-3"/>}
                    <span>{copied ? 'Copied' : 'Copy'}</span>
                </button>
            </div>
            <div className="p-4">
                <p className="text-slate-800 dark:text-slate-200 break-all whitespace-pre-wrap font-mono text-sm">
                    {content}
                </p>
                {isContentUrl && (
                    <a href={getFormattedUrl(content)} target="_blank" rel="noopener noreferrer" className="mt-3 inline-flex items-center space-x-2 px-3 py-1.5 text-sm font-semibold rounded-md bg-primary text-white hover:bg-primary-dark transition-colors">
                        <LinkIcon className="w-4 h-4" />
                        <span>Open Link</span>
                    </a>
                )}
            </div>
        </div>
    )
}


const ResultDisplay: React.FC<ResultDisplayProps> = ({ data, error, loading }) => {
  
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

  if (!data || data.length === 0) {
    return (
       <div className="flex items-center justify-center p-8 bg-white dark:bg-slate-800 rounded-lg shadow-md text-center min-h-[12rem]">
            <p className="text-slate-500 dark:text-slate-400">Scan a QR code to see the result here.</p>
       </div>
    );
  }

  return (
    <div className="space-y-4">
        <div className="flex items-center justify-between">
             <h3 className="text-lg font-bold text-slate-800 dark:text-white">
                {data.length} {data.length === 1 ? 'QR Code Found' : 'QR Codes Found'}
             </h3>
        </div>
        {data.map((content, index) => (
            <SingleResult key={`${index}-${content.substring(0, 10)}`} content={content} index={index} />
        ))}
    </div>
  );
};

export default ResultDisplay;