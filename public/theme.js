// Apply the saved preference before the application paints.
(() => {
  let preference = 'system';
  try {
    const saved = localStorage.getItem('nebula-theme');
    if (['light', 'dark', 'system'].includes(saved)) preference = saved;
  } catch { /* Storage may be unavailable. */ }
  const dark = preference === 'dark' || (preference === 'system' && matchMedia('(prefers-color-scheme: dark)').matches);
  document.documentElement.dataset.theme = dark ? 'dark' : 'light';
  document.documentElement.dataset.themePreference = preference;
})();
