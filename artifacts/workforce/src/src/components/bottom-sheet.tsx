import { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';

interface BottomSheetProps {
  open: boolean;
  onClose: () => void;
  title?: React.ReactNode;
  children: React.ReactNode;
  footer?: React.ReactNode;
}

export function BottomSheet({ open, onClose, title, children, footer }: BottomSheetProps) {
  const sheetRef = useRef<HTMLDivElement>(null);

  /* lock body scroll while open; also reset scroll position to top */
  useEffect(() => {
    if (open) {
      // iOS-safe body scroll lock
      const scrollY = window.scrollY;
      document.body.style.position = 'fixed';
      document.body.style.top = `-${scrollY}px`;
      document.body.style.width = '100%';
      document.body.style.overflow = 'hidden';
      requestAnimationFrame(() => {
        if (sheetRef.current) sheetRef.current.scrollTop = 0;
      });
    } else {
      const scrollY = document.body.style.top;
      document.body.style.position = '';
      document.body.style.top = '';
      document.body.style.width = '';
      document.body.style.overflow = '';
      if (scrollY) window.scrollTo(0, -parseInt(scrollY || '0', 10));
    }
    return () => {
      document.body.style.position = '';
      document.body.style.top = '';
      document.body.style.width = '';
      document.body.style.overflow = '';
    };
  }, [open]);

  /* swipe-down to close */
  const startY    = useRef<number | null>(null);
  const currentY  = useRef(0);

  const onTouchStart = (e: React.TouchEvent) => {
    startY.current = e.touches[0].clientY;
  };
  const onTouchMove = (e: React.TouchEvent) => {
    if (startY.current === null) return;
    const dy = e.touches[0].clientY - startY.current;
    if (dy > 0) {
      currentY.current = dy;
      if (sheetRef.current) sheetRef.current.style.transform = `translateY(${dy}px)`;
    }
  };
  const onTouchEnd = () => {
    if (currentY.current > 100) {
      onClose();
    } else if (sheetRef.current) {
      sheetRef.current.style.transform = '';
    }
    startY.current = null;
    currentY.current = 0;
  };

  if (!open) return null;

  const content = (
    /* backdrop */
    <div
      className="fixed inset-0 z-[9999] flex items-end"
      style={{ background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)' }}
      onClick={onClose}
    >
      {/* sheet */}
      <div
        ref={sheetRef}
        onClick={e => e.stopPropagation()}
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
        className="w-full rounded-t-3xl border-t border-white/10 shadow-2xl animate-slide-up"
        style={{
          background: 'var(--card)',
          maxHeight: '90dvh',
          overflowY: 'auto',
          paddingBottom: 'calc(env(safe-area-inset-bottom) + 1.25rem)',
          transition: 'transform 0.25s cubic-bezier(0.25,1,0.5,1)',
        }}
      >
        {/* drag handle */}
        <div className="flex justify-center pt-3 pb-1">
          <div className="w-10 h-1 rounded-full bg-white/20" />
        </div>

        {/* header */}
        {title && (
          <div className="flex items-center justify-between px-5 py-3 border-b border-white/10">
            <span className="font-bold text-base">{title}</span>
            <button onClick={onClose} className="p-1.5 rounded-xl hover:bg-white/10 transition">
              <X className="w-4 h-4 text-muted-foreground" />
            </button>
          </div>
        )}

        {/* body */}
        <div className="px-5 py-4">{children}</div>

        {/* footer */}
        {footer && (
          <div className="px-5 pb-2 flex flex-col gap-2 border-t border-white/10 pt-3">
            {footer}
          </div>
        )}
      </div>
    </div>
  );

  return createPortal(content, document.body);
}
