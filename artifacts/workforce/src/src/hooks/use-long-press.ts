import { useRef } from 'react';

type LongPressHandlers = {
  onPointerDown: React.PointerEventHandler;
  onPointerUp: React.PointerEventHandler;
  onPointerLeave: React.PointerEventHandler;
  onContextMenu: React.MouseEventHandler;
};

export function useLongPress(callback: () => void, duration = 520): LongPressHandlers {
  const timerRef = useRef<number | null>(null);
  const firedRef = useRef(false);

  const clear = () => {
    if (timerRef.current !== null) window.clearTimeout(timerRef.current);
    timerRef.current = null;
  };

  const start: React.PointerEventHandler = (event) => {
    if (event.pointerType === 'mouse' && event.button !== 0) return;
    firedRef.current = false;
    clear();
    timerRef.current = window.setTimeout(() => {
      firedRef.current = true;
      callback();
      if (navigator.vibrate) navigator.vibrate(12);
    }, duration);
  };

  const end: React.PointerEventHandler = () => clear();

  const contextMenu: React.MouseEventHandler = (event) => {
    event.preventDefault();
    clear();
    if (!firedRef.current) callback();
  };

  return {
    onPointerDown: start,
    onPointerUp: end,
    onPointerLeave: end,
    onContextMenu: contextMenu,
  };
}