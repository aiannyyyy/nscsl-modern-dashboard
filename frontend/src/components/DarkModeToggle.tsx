import React from 'react';
import { useDarkMode } from '../hooks/useDarkMode';
import { Sun, Moon } from 'lucide-react';

export const DarkModeToggle: React.FC = () => {
  const [darkMode, setDarkMode] = useDarkMode();

  return (
    <button
      onClick={() => setDarkMode(!darkMode)}
      className="p-3 rounded-full bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-200 shadow-lg hover:shadow-xl border border-gray-200 dark:border-gray-700 transition-all duration-200 hover:scale-110"
      aria-label="Toggle dark mode"
    >
      {darkMode ? (
        <Sun size={20} className="text-yellow-500" />
      ) : (
        <Moon size={20} className="text-gray-700" />
      )}
    </button>
  );
};