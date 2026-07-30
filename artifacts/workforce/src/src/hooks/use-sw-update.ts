import { useEffect } from 'react';

/**
 * Forces the PWA to reload whenever a new service worker takes control.
 * Also triggers an update check each time the app is opened or returns to the
 * foreground. iOS does not consistently emit the same lifecycle event for
 * every home-screen launch, so we intentionally listen to several of them.
 *
 * Without this, iOS home-screen apps keep serving the cached bundle
 * indefinitely even after Render deploys a new version.
 */
export function useSwUpdate() {
  useEffect(() => {
    if (!('serviceWorker' in navigator)) return;

    const checkForUpdate = () => {
      navigator.serviceWorker
        .getRegistration()
        .then((registration) => registration?.update())
        .catch(() => {
          // An offline app should remain usable and check again later.
        });
    };

    // When a new SW activates and claims this client, reload immediately.
    const onControllerChange = () => {
      window.location.reload();
    };
    navigator.serviceWorker.addEventListener('controllerchange', onControllerChange);

    // Trigger an update check every time the tab/app becomes visible.
    const onVisible = () => {
      if (document.visibilityState === 'visible') {
        checkForUpdate();
      }
    };
    document.addEventListener('visibilitychange', onVisible);
    window.addEventListener('focus', checkForUpdate);
    window.addEventListener('pageshow', checkForUpdate);

    // Also check once on mount (catches the first open after a deploy).
    checkForUpdate();

    // Periodic check every 5 minutes while the app is open.
    const interval = setInterval(checkForUpdate, 5 * 60 * 1000);

    return () => {
      navigator.serviceWorker.removeEventListener('controllerchange', onControllerChange);
      document.removeEventListener('visibilitychange', onVisible);
      window.removeEventListener('focus', checkForUpdate);
      window.removeEventListener('pageshow', checkForUpdate);
      clearInterval(interval);
    };
  }, []);
}
