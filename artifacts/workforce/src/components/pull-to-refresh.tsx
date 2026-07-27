import { useRef, useState, useEffect, useCallback } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { ArrowUp, RefreshCw } from 'lucide-react';

const THRESHOLD   = 72;   // px to pull before releasing triggers refresh
const MAX_PULL    = 110;  // max visual pull distance

export default function PullToRefresh({ children }: { children: React.ReactNode }) {
  const queryClient = useQueryClient();

  const [pullY,       setPullY]       = useState(0);   // current pull distance (px)
  const [refreshing,  setRefreshing]  = useState(false);
  const [released,    setReleased]    = useState(false);
  const [showScrollTop, setShowScrollTop] = useState(false);

  const startYRef    = useRef<number | null>(null);
  const pulling      = useRef(false);
  const containerRef = useRef<HTMLDivElement>(null);

  /* Only start pull when at very top of scrollable content */
  const canPull = () => {
    const el = containerRef.current;
    return el ? el.scrollTop <= 0 : true;
  };

  const onTouchStart = useCallback((e: TouchEvent) => {
    if (!canPull()) return;
    startYRef.current = e.touches[0].clientY;
    pulling.current   = false;
  }, []);

  const onTouchMove = useCallback((e: TouchEvent) => {
    if (refreshing || startYRef.current === null) return;
    if (!canPull() && !pulling.current) return;

    const dy = e.touches[0].clientY - startYRef.current;
    if (dy <= 0) { startYRef.current = null; return; }

    pulling.current = true;
    // Logarithmic resistance so it feels natural
    const resistance = Math.log10(1 + dy) * 30;
    const clamped    = Math.min(resistance, MAX_PULL);
    setPullY(clamped);

    if (clamped > 0) e.preventDefault();
  }, [refreshing]);

  const onTouchEnd = useCallback(async () => {
    if (!pulling.current) { startYRef.current = null; return; }
    pulling.current   = false;
    startYRef.current = null;

    if (pullY >= THRESHOLD) {
      setReleased(true);
      setRefreshing(true);
      setPullY(THRESHOLD * 0.75); // snap to indicator position

      await queryClient.invalidateQueries();

      // Brief hold so the spinner is visible
      await new Promise(r => setTimeout(r, 700));

      setRefreshing(false);
      setReleased(false);
    }

    setPullY(0);
  }, [pullY, queryClient]);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const onScroll = () => setShowScrollTop(el.scrollTop > 360);
    el.addEventListener('scroll', onScroll, { passive: true });

    el.addEventListener('touchstart', onTouchStart, { passive: true });
    el.addEventListener('touchmove',  onTouchMove,  { passive: false });
    el.addEventListener('touchend',   onTouchEnd,   { passive: true });

    return () => {
      el.removeEventListener('scroll', onScroll);
      el.removeEventListener('touchstart', onTouchStart);
      el.removeEventListener('touchmove',  onTouchMove);
      el.removeEventListener('touchend',   onTouchEnd);
    };
  }, [onTouchStart, onTouchMove, onTouchEnd]);

  /* Derived values */
  const progress   = Math.min(pullY / THRESHOLD, 1);          // 0 → 1
  const indicatorY = pullY - 48;                               // indicator follows finger
  const spin       = refreshing || released;
  const ready      = progress >= 1;

  return (
    <div ref={containerRef} className="flex-1 flex flex-col min-h-0 overflow-y-auto overflow-x-hidden relative">

      {/* ── Pull indicator ── */}
      {(pullY > 4 || refreshing) && (
        <div
          className="absolute left-1/2 z-50 pointer-events-none"
          style={{
            top: Math.max(8, indicatorY),
            transform: 'translateX(-50%)',
            transition: spin ? 'top 0.25s ease' : undefined,
          }}
        >
          <div
            className={`w-10 h-10 rounded-full flex items-center justify-center shadow-xl border transition-all duration-200
              ${ready || spin
                ? 'bg-indigo-500 border-indigo-400 scale-100'
                : 'bg-white/10 border-white/20 scale-90'}`}
          >
            <RefreshCw
              className={`w-4 h-4 text-white transition-transform ${spin ? 'animate-spin' : ''}`}
              style={!spin ? { transform: `rotate(${progress * 270}deg)` } : undefined}
            />
          </div>
          {/* "أرسل" hint */}
          {ready && !spin && (
            <p className="text-center text-[10px] text-indigo-300 font-bold mt-1 whitespace-nowrap">
              أرسل للتحديث
            </p>
          )}
        </div>
      )}

      {/* ── Content pushed down while pulling ── */}
      <div
        className="flex-1"
        style={{
          transform:  `translateY(${pullY}px)`,
          transition: spin || pullY === 0 ? 'transform 0.3s cubic-bezier(0.25,1,0.5,1)' : undefined,
          willChange: 'transform',
        }}
      >
        {children}
      </div>

      {showScrollTop && (
        <button
          type="button"
          aria-label="Scroll to top"
          onClick={() => containerRef.current?.scrollTo({ top: 0, behavior: 'smooth' })}
          className="fixed bottom-[calc(1.25rem+env(safe-area-inset-bottom))] right-4 z-40 flex h-11 w-11 items-center justify-center rounded-full border border-indigo-400/30 bg-indigo-500 text-white shadow-xl shadow-indigo-500/30 transition hover:-translate-y-1 active:scale-95 lg:bottom-6"
        >
          <ArrowUp className="h-4 w-4" />
        </button>
      )}
    </div>
  );
}
