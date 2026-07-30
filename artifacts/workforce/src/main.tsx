import { createRoot } from 'react-dom/client';
import { setAuthTokenGetter } from '@workspace/api-client-react';

import App from './src/App';
import { SettingsProvider } from './src/contexts/settings-context';
import './src/index.css';

// Attach JWT token from localStorage to every API request
setAuthTokenGetter(() => localStorage.getItem('token'));

// Prevent browser drag ghost image on long-press+drag (native app feel)
document.addEventListener('dragstart', (e) => e.preventDefault(), { passive: false });

// ─── Service Worker Registration & Auto-Update ────────────────────────────────
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker
      .register('/sw.js', { updateViaCache: 'none' })
      .then((registration) => {
        console.log('[App] Service Worker registered, scope:', registration.scope);

        // Check for a new SW immediately on load
        registration.update();

        // When a new SW is found installing in the background
        registration.addEventListener('updatefound', () => {
          const newWorker = registration.installing;
          if (!newWorker) return;

          newWorker.addEventListener('statechange', () => {
            // New SW has installed and is waiting to activate
            if (
              newWorker.state === 'installed' &&
              navigator.serviceWorker.controller
            ) {
              console.log('[App] New version available — reloading…');
              // Tell the new SW to skip waiting and take over immediately
              newWorker.postMessage({ type: 'SKIP_WAITING' });
            }
          });
        });
      })
      .catch((err) => {
        console.warn('[App] Service Worker registration failed:', err);
      });

    // When the SW controller changes (new SW took over), reload the page
    // to make sure the user sees the latest version
    let refreshing = false;
    navigator.serviceWorker.addEventListener('controllerchange', () => {
      if (!refreshing) {
        refreshing = true;
        console.log('[App] Controller changed — refreshing for latest version');
        window.location.reload();
      }
    });
  });

  // ── Periodic update check every 5 minutes ──────────────────────────────────
  // Catches the case where the app is left open for a long time without
  // navigating (common for installed PWAs on home screens).
  setInterval(() => {
    navigator.serviceWorker.ready.then((registration) => {
      registration.update();
    });
  }, 5 * 60 * 1000);
}

createRoot(document.getElementById('root')!).render(
  <SettingsProvider>
    <App />
  </SettingsProvider>
);
