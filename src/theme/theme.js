// Light / dark theme. The choice is remembered per device; with no choice yet we follow the phone/computer setting.
const KEY = 'yummyTheme';

export const getTheme = () => {
  try {
    const saved = localStorage.getItem(KEY);
    if (saved === 'light' || saved === 'dark') return saved;
  } catch { /* storage can be blocked */ }
  return window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
};

export const applyTheme = (theme) => {
  document.documentElement.dataset.theme = theme;
  const meta = document.querySelector('meta[name="theme-color"]');
  if (meta) meta.setAttribute('content', theme === 'dark' ? '#0d0c24' : '#17163a');
};

export const setTheme = (theme) => {
  try { localStorage.setItem(KEY, theme); } catch { /* ignore */ }
  applyTheme(theme);
};
