(() => {
  'use strict';

  const storageKey = 'theme';
  const modes = ['system', 'dark', 'light'];
  const config = {
    system: { icon: '🖥️', label: 'System' },
    dark: { icon: '🌙', label: 'Dark' },
    light: { icon: '☀️', label: 'Light' }
  };

  function savedTheme() {
    try {
      const value = localStorage.getItem(storageKey);
      return modes.includes(value) ? value : 'system';
    } catch (_) {
      return 'system';
    }
  }

  function effectiveTheme(mode) {
    if (mode !== 'system') return mode;
    return window.matchMedia?.('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  }

  function updateThemeColor(mode) {
    const meta = document.querySelector('meta[name="theme-color"]');
    if (meta) meta.content = effectiveTheme(mode) === 'dark' ? '#080d18' : '#f6f7fb';
  }

  function updateButton(mode) {
    const button = document.getElementById('themeBtn');
    if (!button) return;
    const current = config[mode];
    const icon = button.querySelector('[data-theme-icon], span');
    if (icon) icon.textContent = current.icon;
    button.dataset.mode = current.label;
    button.title = `Theme: ${current.label} (click to change)`;
    button.setAttribute('aria-label', `Theme: ${current.label}. Click to change theme.`);
  }

  function applyTheme(mode, persist = true) {
    const normalized = modes.includes(mode) ? mode : 'system';
    if (normalized === 'system') {
      document.documentElement.removeAttribute('data-theme');
      document.documentElement.style.colorScheme = '';
    } else {
      document.documentElement.dataset.theme = normalized;
      document.documentElement.style.colorScheme = normalized;
    }
    if (persist) {
      try { localStorage.setItem(storageKey, normalized); } catch (_) { /* Storage can be disabled. */ }
    }
    updateThemeColor(normalized);
    updateButton(normalized);
  }

  const initialTheme = savedTheme();
  applyTheme(initialTheme, false);

  function connectThemeButton() {
    const button = document.getElementById('themeBtn');
    if (!button || button.dataset.themeConnected === 'true') return;
    button.dataset.themeConnected = 'true';
    updateButton(savedTheme());
    button.addEventListener('click', () => {
      const current = savedTheme();
      applyTheme(modes[(modes.indexOf(current) + 1) % modes.length]);
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', connectThemeButton, { once: true });
  } else {
    connectThemeButton();
  }

  window.matchMedia?.('(prefers-color-scheme: dark)').addEventListener?.('change', () => {
    if (savedTheme() === 'system') applyTheme('system', false);
  });

  window.AnesthesiaTheme = { apply: applyTheme, current: savedTheme };
})();
