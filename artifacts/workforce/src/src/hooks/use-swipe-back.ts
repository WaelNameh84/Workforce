import { useEffect, useRef } from 'react';

const EDGE_ZONE = 28;
const TRIGGER_DISTANCE = 88;

export function useSwipeBack(onBack: () => void) {
  const startRef = useRef<{ x: number; y: number } | null>(null);
  const trackingRef = useRef(false);

  useEffect(() => {
    const onTouchStart = (event: TouchEvent) => {
      const touch = event.touches[0];
      if (!touch || touch.clientX > EDGE_ZONE) return;
      startRef.current = { x: touch.clientX, y: touch.clientY };
      trackingRef.current = true;
    };

    const onTouchMove = (event: TouchEvent) => {
      if (!trackingRef.current || !startRef.current) return;
      const touch = event.touches[0];
      const dx = touch.clientX - startRef.current.x;
      const dy = Math.abs(touch.clientY - startRef.current.y);
      if (dx < 0 || dy > 56) {
        trackingRef.current = false;
        startRef.current = null;
        return;
      }
      if (dx > 12) event.preventDefault();
    };

    const onTouchEnd = (event: TouchEvent) => {
      if (!trackingRef.current || !startRef.current) return;
      const touch = event.changedTouches[0];
      const dx = touch.clientX - startRef.current.x;
      const dy = Math.abs(touch.clientY - startRef.current.y);
      trackingRef.current = false;
      startRef.current = null;
      if (dx >= TRIGGER_DISTANCE && dy < 72) onBack();
    };

    window.addEventListener('touchstart', onTouchStart, { passive: true });
    window.addEventListener('touchmove', onTouchMove, { passive: false });
    window.addEventListener('touchend', onTouchEnd, { passive: true });
    return () => {
      window.removeEventListener('touchstart', onTouchStart);
      window.removeEventListener('touchmove', onTouchMove);
      window.removeEventListener('touchend', onTouchEnd);
    };
  }, [onBack]);
}