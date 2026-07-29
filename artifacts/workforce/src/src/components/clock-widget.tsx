import { useState, useEffect, useRef } from 'react';
import { useAppSettings } from '@/contexts/settings-context';

// ─── 3-D Digital Clock ────────────────────────────────────────────────────────
function Digital3DClock({ color, size }: { color: string; size: string }) {
  const [now, setNow] = useState(new Date());
  useEffect(() => { const id = setInterval(() => setNow(new Date()), 1000); return () => clearInterval(id); }, []);
  const hh = String(now.getHours()).padStart(2, '0');
  const mm = String(now.getMinutes()).padStart(2, '0');
  const ss = String(now.getSeconds()).padStart(2, '0');
  const fontSize = size === 'small' ? '1.4rem' : size === 'large' ? '2.8rem' : '2rem';
  return (
    <div className="flex items-center gap-1" style={{ fontFamily: 'monospace', fontSize, fontWeight: 900 }}>
      <style>{`
        @keyframes d3-glow { 0%,100%{text-shadow:0 0 8px ${color}88,0 2px 4px #0006;} 50%{text-shadow:0 0 20px ${color},0 2px 8px #0009;} }
        @keyframes d3-colon { 0%,100%{opacity:1} 50%{opacity:0.2} }
        .d3-digit { 
          display:inline-block;
          color: ${color};
          animation: d3-glow 2s ease-in-out infinite;
          transform: perspective(300px) rotateX(6deg);
          text-shadow: 0 0 12px ${color}99, 0 3px 6px #0008;
          letter-spacing: -0.05em;
        }
        .d3-colon {
          color: ${color};
          animation: d3-colon 1s step-end infinite;
          opacity: 0.8;
          margin: 0 2px;
          text-shadow: 0 0 8px ${color}66;
        }
      `}</style>
      <span className="d3-digit">{hh}</span>
      <span className="d3-colon">:</span>
      <span className="d3-digit">{mm}</span>
      <span className="d3-colon">:</span>
      <span className="d3-digit">{ss}</span>
    </div>
  );
}

// ─── 3-D Analog Clock ─────────────────────────────────────────────────────────
function Analog3DClock({ color, size }: { color: string; size: string }) {
  const [now, setNow] = useState(new Date());
  useEffect(() => { const id = setInterval(() => setNow(new Date()), 1000); return () => clearInterval(id); }, []);
  const r = size === 'small' ? 44 : size === 'large' ? 80 : 60;
  const cx = r + 8; const cy = r + 8;
  const totalR = r + 8;
  const s = now.getSeconds(); const m = now.getMinutes(); const h = now.getHours() % 12;
  const sDeg = s * 6;
  const mDeg = m * 6 + s * 0.1;
  const hDeg = h * 30 + m * 0.5;
  const handCoords = (deg: number, len: number) => {
    const rad = (deg - 90) * (Math.PI / 180);
    return { x: cx + len * Math.cos(rad), y: cy + len * Math.sin(rad) };
  };
  const sHand = handCoords(sDeg, r * 0.85);
  const mHand = handCoords(mDeg, r * 0.75);
  const hHand = handCoords(hDeg, r * 0.55);
  return (
    <div style={{ display: 'inline-flex', filter: `drop-shadow(0 0 12px ${color}66)` }}>
      <style>{`
        @keyframes a3-spin { from{filter:drop-shadow(0 0 8px ${color}44)} to{filter:drop-shadow(0 0 16px ${color}88)} }
      `}</style>
      <svg width={totalR * 2} height={totalR * 2} viewBox={`0 0 ${totalR * 2} ${totalR * 2}`}>
        {/* Outer ring with 3D effect */}
        <defs>
          <radialGradient id="clockFace" cx="40%" cy="35%" r="65%">
            <stop offset="0%" stopColor="#2a2a3e" />
            <stop offset="100%" stopColor="#0d0d1a" />
          </radialGradient>
          <radialGradient id="clockGlow" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor={color} stopOpacity="0.15" />
            <stop offset="100%" stopColor={color} stopOpacity="0" />
          </radialGradient>
        </defs>
        {/* Outer rim */}
        <circle cx={cx} cy={cy} r={r + 6} fill="none" stroke={color} strokeWidth="2.5" opacity="0.4" />
        <circle cx={cx} cy={cy} r={r + 5} fill="none" stroke="white" strokeWidth="0.5" opacity="0.12" />
        {/* Face */}
        <circle cx={cx} cy={cy} r={r} fill="url(#clockFace)" />
        <circle cx={cx} cy={cy} r={r} fill="url(#clockGlow)" />
        {/* Hour markers */}
        {Array.from({ length: 12 }, (_, i) => {
          const a = (i * 30 - 90) * (Math.PI / 180);
          const x1 = cx + (r - 5) * Math.cos(a); const y1 = cy + (r - 5) * Math.sin(a);
          const x2 = cx + (r - 12) * Math.cos(a); const y2 = cy + (r - 12) * Math.sin(a);
          return <line key={i} x1={x1} y1={y1} x2={x2} y2={y2} stroke={color} strokeWidth={i % 3 === 0 ? 2 : 1} opacity={i % 3 === 0 ? 0.9 : 0.4} />;
        })}
        {/* Hour hand */}
        <line x1={cx} y1={cy} x2={hHand.x} y2={hHand.y} stroke={color} strokeWidth="3.5" strokeLinecap="round"
              style={{ filter: `drop-shadow(0 0 4px ${color})` }} />
        {/* Minute hand */}
        <line x1={cx} y1={cy} x2={mHand.x} y2={mHand.y} stroke="white" strokeWidth="2.5" strokeLinecap="round"
              style={{ filter: 'drop-shadow(0 0 3px rgba(255,255,255,0.6))' }} />
        {/* Second hand */}
        <line x1={cx} y1={cy} x2={sHand.x} y2={sHand.y} stroke="#ef4444" strokeWidth="1.5" strokeLinecap="round"
              style={{ filter: 'drop-shadow(0 0 4px #ef4444)' }} />
        {/* Center dot */}
        <circle cx={cx} cy={cy} r="4" fill={color} style={{ filter: `drop-shadow(0 0 4px ${color})` }} />
        <circle cx={cx} cy={cy} r="2" fill="white" opacity="0.8" />
      </svg>
    </div>
  );
}

// ─── Flip Clock ───────────────────────────────────────────────────────────────
function FlipCard({ digit, color }: { digit: string; color: string }) {
  const [prev, setPrev] = useState(digit);
  const [curr, setCurr] = useState(digit);
  const [flipping, setFlipping] = useState(false);
  const prevRef = useRef(digit);

  useEffect(() => {
    if (digit !== prevRef.current) {
      setPrev(prevRef.current);
      setCurr(digit);
      setFlipping(true);
      prevRef.current = digit;
      const t = setTimeout(() => setFlipping(false), 400);
      return () => clearTimeout(t);
    }
    return undefined;
  }, [digit]);

  return (
    <div style={{ position: 'relative', width: '2.2em', height: '2.8em', perspective: '300px' }}>
      <style>{`
        @keyframes flip-top { 
          0%{transform:rotateX(0deg)} 100%{transform:rotateX(-90deg)} 
        }
        @keyframes flip-bot { 
          0%{transform:rotateX(90deg)} 100%{transform:rotateX(0deg)} 
        }
        .flip-face {
          position:absolute;left:0;right:0;
          display:flex;align-items:center;justify-content:center;
          font-weight:900;font-family:monospace;
          background:linear-gradient(180deg,#1a1a2e,#0d0d1a);
          border:1px solid ${color}33;
          color:${color};
          text-shadow:0 0 10px ${color}88;
          border-radius:6px;
          backface-visibility:hidden;
          overflow:hidden;
        }
        .flip-face::after {
          content:'';
          position:absolute;inset:0;
          background:linear-gradient(180deg,rgba(255,255,255,0.05) 0%,transparent 50%);
          pointer-events:none;
        }
      `}</style>
      {/* Static bottom half showing current */}
      <div className="flip-face" style={{ top: '50%', bottom: 0, fontSize: '2.2em', alignItems: 'flex-start', paddingTop: '0.05em', clipPath: 'inset(0 0 0 0)' }}>
        {curr}
      </div>
      {/* Static top half showing current */}
      <div className="flip-face" style={{ top: 0, height: '50%', fontSize: '2.2em', alignItems: 'flex-end', paddingBottom: '0.05em' }}>
        {curr}
      </div>
      {/* Animated flip */}
      {flipping && (
        <>
          <div className="flip-face" style={{ top: 0, height: '50%', fontSize: '2.2em', alignItems: 'flex-end', paddingBottom: '0.05em', animation: 'flip-top 0.2s ease-in forwards', transformOrigin: 'bottom' }}>
            {prev}
          </div>
          <div className="flip-face" style={{ top: '50%', bottom: 0, fontSize: '2.2em', alignItems: 'flex-start', paddingTop: '0.05em', animation: 'flip-bot 0.2s ease-out 0.2s forwards', transformOrigin: 'top' }}>
            {curr}
          </div>
        </>
      )}
    </div>
  );
}

function FlipClock({ color, size }: { color: string; size: string }) {
  const [now, setNow] = useState(new Date());
  useEffect(() => { const id = setInterval(() => setNow(new Date()), 1000); return () => clearInterval(id); }, []);
  const hh = String(now.getHours()).padStart(2, '0');
  const mm = String(now.getMinutes()).padStart(2, '0');
  const ss = String(now.getSeconds()).padStart(2, '0');
  const scale = size === 'small' ? 0.6 : size === 'large' ? 1.1 : 0.85;
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', transform: `scale(${scale})`, transformOrigin: 'left center' }}>
      <FlipCard digit={hh[0]} color={color} />
      <FlipCard digit={hh[1]} color={color} />
      <div style={{ color, fontWeight: 900, fontSize: '1.8em', animation: 'flip-colon 1s step-end infinite', fontFamily: 'monospace' }}>:</div>
      <style>{`@keyframes flip-colon{0%,100%{opacity:1}50%{opacity:0.2}}`}</style>
      <FlipCard digit={mm[0]} color={color} />
      <FlipCard digit={mm[1]} color={color} />
      <div style={{ color, fontWeight: 900, fontSize: '1.8em', animation: 'flip-colon 1s step-end infinite', fontFamily: 'monospace' }}>:</div>
      <FlipCard digit={ss[0]} color={color} />
      <FlipCard digit={ss[1]} color={color} />
    </div>
  );
}

// ─── Neon Ring Clock ─────────────────────────────────────────────────────────
function NeonRingClock({ color, size }: { color: string; size: string }) {
  const [now, setNow] = useState(new Date());
  useEffect(() => { const id = setInterval(() => setNow(new Date()), 1000); return () => clearInterval(id); }, []);
  const hh = String(now.getHours()).padStart(2, '0');
  const mm = String(now.getMinutes()).padStart(2, '0');
  const ss = String(now.getSeconds()).padStart(2, '0');
  const sPct = (now.getSeconds() / 60) * 100;
  const mPct = (now.getMinutes() / 60) * 100;
  const hPct = ((now.getHours() % 12) / 12) * 100;
  const r = size === 'small' ? 36 : size === 'large' ? 72 : 52;
  const circ = 2 * Math.PI * r;
  return (
    <div style={{ position: 'relative', width: r * 2 + 24, height: r * 2 + 24, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <style>{`
        @keyframes neon-pulse {
          0%,100%{filter:drop-shadow(0 0 6px ${color}88)} 
          50%{filter:drop-shadow(0 0 18px ${color}cc)}
        }
      `}</style>
      <svg width={r * 2 + 24} height={r * 2 + 24} style={{ position: 'absolute', top: 0, left: 0 }}>
        <circle cx={r + 12} cy={r + 12} r={r} fill="none" stroke={color} strokeWidth="2" opacity="0.15" />
        <circle cx={r + 12} cy={r + 12} r={r} fill="none" stroke={color} strokeWidth="3"
                strokeDasharray={circ} strokeDashoffset={circ * (1 - sPct / 100)}
                transform={`rotate(-90 ${r + 12} ${r + 12})`} strokeLinecap="round" opacity="0.9"
                style={{ animation: 'neon-pulse 2s ease-in-out infinite', filter: `drop-shadow(0 0 6px ${color})` }} />
        <circle cx={r + 12} cy={r + 12} r={r - 8} fill="none" stroke="#ffffff" strokeWidth="2"
                strokeDasharray={circ * 0.85} strokeDashoffset={(circ * 0.85) * (1 - mPct / 100)}
                transform={`rotate(-90 ${r + 12} ${r + 12})`} strokeLinecap="round" opacity="0.5" />
        <circle cx={r + 12} cy={r + 12} r={r - 18} fill="none" stroke={color} strokeWidth="2"
                strokeDasharray={circ * 0.72} strokeDashoffset={(circ * 0.72) * (1 - hPct / 100)}
                transform={`rotate(-90 ${r + 12} ${r + 12})`} strokeLinecap="round" opacity="0.6" />
      </svg>
      <div style={{ position: 'relative', zIndex: 1, textAlign: 'center', fontFamily: 'monospace', fontWeight: 900 }}>
        <div style={{ fontSize: size === 'small' ? '1rem' : size === 'large' ? '1.8rem' : '1.3rem', color, textShadow: `0 0 12px ${color}` }}>
          {hh}:{mm}
        </div>
        <div style={{ fontSize: '0.7em', color: 'rgba(255,255,255,0.5)', marginTop: '2px' }}>{ss}</div>
      </div>
    </div>
  );
}

// ─── Main export: ClockWidget ─────────────────────────────────────────────────
export function ClockWidget({ overrideStyle }: { overrideStyle?: string }) {
  const s = useAppSettings();
  const style = overrideStyle ?? s.clockType ?? 'digital';
  const color = s.clockColor || '#6366f1';
  const size = s.clockSize || 'medium';

  if (style === 'analog') return <Analog3DClock color={color} size={size} />;
  if (style === 'flip')   return <FlipClock color={color} size={size} />;
  if (style === 'neon')   return <NeonRingClock color={color} size={size} />;
  return <Digital3DClock color={color} size={size} />;
}

export { Analog3DClock, FlipClock, Digital3DClock, NeonRingClock };
