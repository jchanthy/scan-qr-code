import React from 'react';
import { Theme } from '../types';
import { SunIcon, MoonIcon, QuestionMarkCircleIcon } from './Icons';

interface HeaderProps {
  theme: Theme;
  toggleTheme: () => void;
  onHelpClick: () => void;
}

const ThemeToggleButton: React.FC<Pick<HeaderProps, 'theme' | 'toggleTheme'>> = ({ theme, toggleTheme }) => (
    <button
      onClick={toggleTheme}
      className="p-2 rounded-full text-slate-500 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary dark:focus:ring-offset-slate-900 transition-all"
      aria-label="Toggle theme"
    >
      {theme === Theme.LIGHT ? <MoonIcon className="w-6 h-6" /> : <SunIcon className="w-6 h-6" />}
    </button>
);


const Header: React.FC<HeaderProps> = ({ theme, toggleTheme, onHelpClick }) => {
  return (
    <header className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm sticky top-0 z-10 border-b border-slate-200 dark:border-slate-700">
      <div className="container mx-auto px-4">
        <div className="flex justify-between items-center py-4">
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
            QR Code Reader
          </h1>
          <div className="flex items-center space-x-2">
            <button
              onClick={onHelpClick}
              className="p-2 rounded-full text-slate-500 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary dark:focus:ring-offset-slate-900 transition-all"
              aria-label="Show help"
            >
              <QuestionMarkCircleIcon className="w-6 h-6" />
            </button>
            <ThemeToggleButton theme={theme} toggleTheme={toggleTheme} />
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
