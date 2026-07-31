import { useRef, useState, useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { ArrowUp, RefreshCw } from 'lucide-react';

const THRESHOLD = 72;   // px to pull before releasing triggers refresh
const MAX_PULL  = 110;  // max visual pull distance

export default function PullToRefresh({ children }: { children: React.ReactNode }) {
  const queryClient = useQueryClient();

  const [pullY,         setPullY]         = useState(0);
  const [refreshing,    setRefreshing]    = useState(false);
  const [released,      setReleased]      = useState(false);
  const [showScrollTop, setShowScrollTop] = useState(false);

  const containerRef  = useRef<HTMLDivElement>(null);

  // All mutable state lives in refs so touch callbacks are never recreated
  const startYRef    = useRef<number | null>(null);
  const pulling      = useRef(false);
  const pullYRef     = useRef(0);
  const refreshingRef = useRef(false); // mirrors `refreshing` without closure capture

  // Keep refreshingRef in sync with state
  useEffect(() => { refreshingRef.current = refreshing; }, [refreshing]);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    // ── Scroll-to-top button visibility ──────────────────────────────
    const onScroll = () => setShowScrollTop(el.scrollTop > 360);
    el.addEventListener('scroll', onScroll, { passive: true });

    // ── Touch handlers (registered ONCE, stable refs) ─────────────────
    const onTouchStart = (e: TouchEvent) => {
      // Only arm pull-to-refresh when the container is at the very top
      if (el.scrollTop > 0) return;
      startYRef.current = e.touches[0].clientY;
      pulling.current   = false;
    };

    const onTouchMove = (e: TouchEvent) => {
      if (refreshingRef.current)     return;
      if (startYRef.current === null) return;

      // If the container has scrolled away from the top, disarm
      if (el.scrollTop > 0 && !pulling.current) {
        startYRef.current = null;
        return;
      }

      const dy = e.touches[0].clientY - startYRef.current;

      // Upward swipe (or neutral) — reset pull and let native scroll work
      if (dy <= 0) {
        startYRef.current = null;
        pulling.current   = false;
        // Reset pullY if user reversed direction mid-gesture
        if (pullYRef.current > 0) {
          pullYRef.current = 0;
          setPullY(0);
        }
        return;
      }

      // Downward pull gesture
      pulling.current = true;

      const resistance = Math.log10(1 + dy) * 30;
      const clamped    = Math.min(resistance, MAX_PULL);
      pullYRef.current = clamped;

      // Only preventDefault while actively pulling to block native overscroll
      if (clamped > 0) e.preventDefault();

      setPullY(clamped);
    };

    const finishPull = async () => {
      if (!pulling.current) {
        startYRef.current = null;
        // Always reset pullY — user may have reversed direction mid-gesture
        if (pullYRef.current > 0) {
          pullYRef.current = 0;
          setPullY(0);
        }
        return;
      }
      pulling.current   = false;
      startYRef.current = null;

      if (pullYRef.current >= THRESHOLD) {
        setReleased(true);
        setRefreshing(true);
        refreshingRef.current = true;
        pullYRef.current = THRESHOLD * 0.75;
        setPullY(THRESHOLD * 0.75);

        await queryClient.invalidateQueries();
        await new Promise(r => setTimeout(r, 700));

        setRefreshing(false);
        refreshingRef.current = false;
        setReleased(false);
      }

      pullYRef.current = 0;
      setPullY(0);
    };

    const onTouchEnd    = () => { void finishPull(); };
    const onTouchCancel = () => {
      pulling.current   = false;
      startYRef.current = null;
      pullYRef.current  = 0;
      setPullY(0);
    };

    el.addEventListener('touchstart',  onTouchStart,  { passive: true });
    el.addEventListener('touchmove',   onTouchMove,   { passive: false });
    el.addEventListener('touchend',    onTouchEnd,    { passive: true });
    el.addEventListener('touchcancel', onTouchCancel, { passive: true });

    return () => {
      el.removeEventListener('scroll',      onScroll);
      el.removeEventListener('touchstart',  onTouchStart);
      el.removeEventListener('touchmove',   onTouchMove);
      el.removeEventListener('touchend',    onTouchEnd);
      el.removeEventListener('touchcancel', onTouchCancel);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // empty dep array — listeners registered ONCE, never rebuilt during a gesture

  const progress   = Math.min(pullY / THRESHOLD, 1);
  const indicatorY = pullY - 48;
  const spin       = refreshing || released;
  const ready      = progress >= 1;

  return (
    <div
      ref={containerRef}
      className="native-scroll flex-1 flex flex-col min-h-0 overflow-y-auto overflow-x-hidden relative"
      style={{ touchAction: 'pan-y', overscrollBehaviorY: 'contain' }}
    >
      {/* Pull indicator */}
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
          {ready && !spin && (
            <p className="text-center text-[10px] text-indigo-300 font-bold mt-1 whitespace-nowrap">
              أرسل للتحديث
            </p>
          )}
        </div>
      )}

      {/* Content pushed down while pulling */}
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

      {/* Scroll-to-top button */}
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
