import { useEffect, useState } from 'react';
import { useRegisterSW } from 'virtual:pwa-register/react';
import { RefreshCw, X } from 'lucide-react';

export function UpdatePrompt() {
  const [show, setShow] = useState(false);

  const {
    needRefresh: [needRefresh],
    updateServiceWorker,
  } = useRegisterSW({
    onRegistered(r) {
      // Check for updates every 60 seconds while the app is open
      if (r) {
        setInterval(() => r.update(), 60_000);
      }
    },
  });

  useEffect(() => {
    if (needRefresh) setShow(true);
  }, [needRefresh]);

  if (!show) return null;

  return (
    <div
      className="fixed bottom-24 left-1/2 z-[9999] -translate-x-1/2 w-[calc(100%-2rem)] max-w-sm"
      dir="rtl"
    >
      <div className="flex items-center gap-3 rounded-2xl border border-indigo-500/30 bg-[#1a1a3e]/95 px-4 py-3 shadow-2xl backdrop-blur-xl">
        {/* icon */}
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-indigo-500/20">
          <RefreshCw className="h-4 w-4 text-indigo-400" />
        </div>

        {/* text */}
        <div className="flex-1 min-w-0">
          <p className="text-xs font-bold text-white">يتوفر تحديث جديد</p>
          <p className="text-[11px] text-white/50 mt-0.5">اضغط لتحديث التطبيق الآن</p>
        </div>

        {/* update button */}
        <button
          onClick={() => updateServiceWorker(true)}
          className="shrink-0 rounded-xl bg-indigo-500 px-3 py-1.5 text-xs font-bold text-white transition hover:bg-indigo-400 active:scale-95"
        >
          تحديث
        </button>

        {/* dismiss */}
        <button
          onClick={() => setShow(false)}
          className="shrink-0 rounded-lg p-1 text-white/40 transition hover:text-white/70"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  );
}
