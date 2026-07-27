import { useEffect, useRef, useState } from 'react';
import { useLocation } from 'wouter';

export default function PageTransition({ children }: { children: React.ReactNode }) {
  const [location] = useLocation();
  const [displayChildren, setDisplayChildren] = useState(children);
  const [phase, setPhase]   = useState<'in' | 'out'>('in');
  const prevLocation = useRef(location);

  useEffect(() => {
    if (location === prevLocation.current) return;
    prevLocation.current = location;

    // 1. start exit
    setPhase('out');

    const t = setTimeout(() => {
      // 2. swap content
      setDisplayChildren(children);
      setPhase('in');
    }, 150);

    return () => clearTimeout(t);
  }, [location, children]);

  /* when children change without route change, update directly */
  useEffect(() => {
    if (phase === 'in') setDisplayChildren(children);
  }, [children]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div
      style={{
        opacity:    phase === 'in' ? 1 : 0,
        transform:  phase === 'in' ? 'translateY(0)' : 'translateY(8px)',
        transition: 'opacity 0.2s ease, transform 0.2s ease',
        willChange: 'opacity, transform',
      }}
    >
      {displayChildren}
    </div>
  );
}
