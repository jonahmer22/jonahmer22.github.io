// Prefetch same-origin pages on first hover/touch so navigation is instant.
const seen = new Set();
const prefetch = e => {
  const a = e.target.closest && e.target.closest('a[href]');
  if (!a || a.origin !== location.origin || a.pathname === location.pathname || seen.has(a.pathname)) return;
  seen.add(a.pathname);
  const l = document.createElement('link');
  l.rel = 'prefetch';
  l.href = a.pathname;
  document.head.append(l);
};
addEventListener('pointerover', prefetch, { passive: true });
addEventListener('touchstart', prefetch, { passive: true });

// Report what this page actually cost, measured, not claimed.
addEventListener('load', () => setTimeout(() => {
  const el = document.getElementById('weight');
  if (!el) return;
  const es = performance.getEntriesByType('navigation').concat(performance.getEntriesByType('resource'));
  const bytes = es.reduce((n, e) => n + (e.transferSize || e.encodedBodySize || 0), 0);
  el.textContent = `${(bytes / 1024).toFixed(1)} kB in ${es.length} requests`;
}));
