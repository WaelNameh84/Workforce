import { useEffect } from 'react';

/**
 * Forces the PWA to reload whenever a new service worker takes control.
 * Also triggers an update check each time the app becomes visible
 * (e.g. user switches back from another app or opens from home screen).
 *
 * Without this, iOS home-screen apps keep serving the cached bundle
 * indefinitely even after Render deploys a new version.
 */
export function useSwUpdate() {
  useEffect(() => {
    if (!('serviceWorker' in navigator)) return;

    // When a new SW activates and claims this client, reload immediately.
    const onControllerChange = () => {
      window.location.reload();
    };
    navigator.serviceWorker.addEventListener('controllerchange', onControllerChange);

    // Trigger an update check every time the tab/app becomes visible.
    const onVisible = () => {
      if (document.visibilityState === 'visible') {
        navigator.serviceWorker.getRegistration().then(reg => {
          if (reg) reg.update().catch(() => {/* ignore network errors */});
        });
      }
    };
    document.addEventListener('visibilitychange', onVisible);

    // Also check once on mount (catches the first open after a deploy).
    navigator.serviceWorker.getRegistration().then(reg => {
      if (reg) reg.update().catch(() => {});
    });

    // Periodic check every 5 minutes while the app is open.
    const interval = setInterval(() => {
      navigator.serviceWorker.getRegistration().then(reg => {
        if (reg) reg.update().catch(() => {});
      });
    }, 5 * 60 * 1000);

    return () => {
      navigator.serviceWorker.removeEventListener('controllerchange', onControllerChange);
      document.removeEventListener('visibilitychange', onVisible);
      clearInterval(interval);
    };
  }, []);
}
