import { useEffect, useState } from 'react';

export default function SplashScreen() {
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const timer = window.setTimeout(() => setVisible(false), 900);
    return () => window.clearTimeout(timer);
  }, []);

  if (!visible) return null;

  return (
    <div
      aria-label="WorkforceOS"
      role="status"
      className="fixed inset-0 z-[200] flex items-center justify-center overflow-hidden"
      style={{ background: 'var(--background)' }}
    >
      <div className="absolute inset-0 bg-animated-gradient opacity-25" />
      <div className="relative flex flex-col items-center gap-5 animate-splash-in">
        <div className="flex h-20 w-20 items-center justify-center rounded-[1.75rem] bg-gradient-to-br from-indigo-500 to-purple-600 shadow-[0_0_55px_rgba(99,102,241,.45)]">
          <span className="text-4xl font-black text-white">W</span>
        </div>
        <div className="text-center">
          <p className="font-display text-2xl font-black tracking-tight">WorkforceOS</p>
          <p className="mt-1 text-[10px] font-bold uppercase tracking-[.28em] text-muted-foreground">Work smarter</p>
        </div>
        <div className="h-1 w-24 overflow-hidden rounded-full bg-muted">
          <div className="h-full w-1/2 animate-splash-progress rounded-full bg-indigo-500" />
        </div>
      </div>
    </div>
  );
}