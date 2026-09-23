import { useEffect, useState } from 'react';
import { Monitor, Moon, Sun } from 'lucide-react';

type ThemePreference = 'system' | 'light' | 'dark';

export function ThemeControl() {
  const [preference, setPreference] = useState<ThemePreference>(() => {
    const initial = document.documentElement.dataset.themePreference;
    return initial === 'light' || initial === 'dark' ? initial : 'system';
  });
  useEffect(() => {
    const media = window.matchMedia('(prefers-color-scheme: dark)');
    const apply = () => {
      document.documentElement.dataset.theme = preference === 'system' ? (media.matches ? 'dark' : 'light') : preference;
      document.documentElement.dataset.themePreference = preference;
    };
    apply();
    try { localStorage.setItem('nebula-theme', preference); } catch { /* Keep this session's preference. */ }
    media.addEventListener('change', apply);
    return () => media.removeEventListener('change', apply);
  }, [preference]);
  const Icon = preference === 'system' ? Monitor : preference === 'dark' ? Moon : Sun;
  return <label className="theme-control"><Icon size={16} aria-hidden="true"/><select aria-label="Color theme" value={preference} onChange={e => setPreference(e.target.value as ThemePreference)}><option value="system">System</option><option value="light">Light</option><option value="dark">Dark</option></select></label>;
}
