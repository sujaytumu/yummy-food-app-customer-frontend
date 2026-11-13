import React, { useState } from 'react';
import { getTheme, setTheme } from './theme';

// Sun / moon button: switches between light and dark and remembers the choice.
const ThemeToggle = () => {
  const [theme, setCurrent] = useState(getTheme);
  const next = theme === 'dark' ? 'light' : 'dark';
  return (
    <button
      type="button"
      className="themeToggle"
      aria-label={`Switch to ${next} mode`}
      title={`Switch to ${next} mode`}
      onClick={() => { setTheme(next); setCurrent(next); }}
    >
      {theme === 'dark' ? (
        <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true"><circle cx="12" cy="12" r="4.2" /><path d="M12 2.5v2.4M12 19.1v2.4M2.5 12h2.4M19.1 12h2.4M5.3 5.3l1.7 1.7M17 17l1.7 1.7M18.7 5.3L17 7M7 17l-1.7 1.7" /></svg>
      ) : (
        <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor" aria-hidden="true"><path d="M20.5 14.6A8.6 8.6 0 0 1 9.4 3.5a.7.7 0 0 0-1-.8A10 10 0 1 0 21.3 15.6a.7.7 0 0 0-.8-1z" /></svg>
      )}
    </button>
  );
};

export default ThemeToggle;
