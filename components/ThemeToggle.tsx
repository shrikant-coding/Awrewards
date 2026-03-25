'use client';

import { Moon, Sun } from 'lucide-react';
import { useTheme } from './ThemeProvider';

export default function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();

  return (
    <button
      onClick={toggleTheme}
      className="p-2 rounded-md glass hover:gradient-border transition-all duration-150 ripple"
      aria-label="Toggle theme"
    >
      {theme === 'dark' ? (
        <Sun className="w-5 h-5 text-textPrimary" />
      ) : (
        <Moon className="w-5 h-5 text-textPrimary" />
      )}
    </button>
  );
}