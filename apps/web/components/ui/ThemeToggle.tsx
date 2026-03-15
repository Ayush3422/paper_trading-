'use client';
import { useEffect, useState } from 'react';
import { Moon, Sun, Monitor } from 'lucide-react';

type Theme = 'dark' | 'light' | 'system';

function getSystemTheme(): 'dark' | 'light' {
  if (typeof window === 'undefined') return 'dark';
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

function applyTheme(theme: Theme) {
  const root = document.documentElement;
  const effective = theme === 'system' ? getSystemTheme() : theme;

  if (effective === 'light') {
    root.classList.add('light');
    root.classList.remove('dark');
  } else {
    root.classList.add('dark');
    root.classList.remove('light');
  }
}

export function useTheme() {
  const [theme, setThemeState] = useState<Theme>('dark');

  useEffect(() => {
    const stored = (localStorage.getItem('theme') as Theme) || 'dark';
    setThemeState(stored);
    applyTheme(stored);
  }, []);

  const setTheme = (t: Theme) => {
    setThemeState(t);
    localStorage.setItem('theme', t);
    applyTheme(t);
  };

  return { theme, setTheme };
}

const THEMES: { value: Theme; icon: React.ReactNode; label: string }[] = [
  { value: 'dark',   icon: <Moon size={13} />,    label: 'Dark'   },
  { value: 'light',  icon: <Sun size={13} />,     label: 'Light'  },
  { value: 'system', icon: <Monitor size={13} />, label: 'System' },
];

export function ThemeToggle({ compact = false }: { compact?: boolean }) {
  const { theme, setTheme } = useTheme();

  if (compact) {
    const current = THEMES.find(t => t.value === theme) || THEMES[0];
    const next    = THEMES[(THEMES.findIndex(t => t.value === theme) + 1) % THEMES.length];
    return (
      <button
        onClick={() => setTheme(next.value)}
        title={`Switch to ${next.label} mode`}
        className="w-8 h-8 flex items-center justify-center rounded-lg bg-[#1a1a1a] text-gray-400 hover:text-white border border-[#262626] hover:border-[#333] transition-colors"
      >
        {current.icon}
      </button>
    );
  }

  return (
    <div className="flex bg-[#1a1a1a] border border-[#262626] rounded-xl p-0.5 gap-0.5">
      {THEMES.map(t => (
        <button
          key={t.value}
          onClick={() => setTheme(t.value)}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
            theme === t.value
              ? 'bg-[#00d4a0] text-black'
              : 'text-gray-400 hover:text-white'
          }`}
        >
          {t.icon}
          {t.label}
        </button>
      ))}
    </div>
  );
}