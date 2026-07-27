import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useSettings } from '@/contexts/settings-context';

// ── Deterministic particle generator (no random on re-render) ─────────────────
function gen(n: number, seed = 1) {
  const pts: { x: number; y: number; s: number; d: number; delay: number; op: number }[] = [];
  let r = seed;
  const rand = () => { r = (r * 16807) % 2147483647; return (r - 1) / 2147483646; };
  for (let i = 0; i < n; i++)
    pts.push({ x: rand() * 100, y: rand() * 100, s: rand() * 2.5 + 0.8, d: rand() * 7 + 4, delay: rand() * 5, op: rand() * 0.5 + 0.3 });
  return pts;
}
const STARS   = gen(80, 42);
const SPARKLES = gen(25, 99);

// ── hex → "r,g,b" ─────────────────────────────────────────────────────────────
function toRgb(hex: string) {
  const h = hex.replace('#', '');
  const n = parseInt(h.length === 3 ? h.split('').map(x => x + x).join('') : h, 16);
  return `${(n >> 16) & 255},${(n >> 8) & 255},${n & 255}`;
}

// ── Keyframes injected once ───────────────────────────────────────────────────
const CSS = `
  @keyframes sp-twinkle  { 0%,100%{opacity:.08} 50%{opacity:1} }
  @keyframes sp-float    { 0%,100%{transform:translateY(0) rotate(0deg)} 50%{transform:translateY(-20px) rotate(4deg)} }
  @keyframes sp-floatR   { 0%,100%{transform:translateY(0) rotate(0deg)} 50%{transform:translateY(16px) rotate(-3deg)} }
  @keyframes sp-bob      { 0%,100%{transform:translateY(0) scale(1)} 50%{transform:translateY(-12px) scale(1.03)} }
  @keyframes sp-spin     { to{transform:rotate(360deg)} }
  @keyframes sp-spinR    { to{transform:rotate(-360deg)} }
  @keyframes sp-ripple   { 0%{transform:translate(-50%,-50%) scale(.6);opacity:.9} 100%{transform:translate(-50%,-50%) scale(3.5);opacity:0} }
  @keyframes sp-shimmer  { 0%{transform:translateX(-150%)} 100%{transform:translateX(250%)} }
  @keyframes sp-gridPan  { 0%{background-position:0 0} 100%{background-position:80px 80px} }
  @keyframes sp-aura     { 0%,100%{transform:scale(1) rotate(0deg);opacity:.35} 50%{transform:scale(1.15) rotate(8deg);opacity:.65} }
  @keyframes sp-pulsate  { 0%,100%{transform:scale(1)} 50%{transform:scale(1.06)} }
  @keyframes sp-glowLine { 0%,100%{opacity:.3} 50%{opacity:1} }
  @keyframes sp-orbit    { from{transform:rotate(0deg) translateX(var(--r)) rotate(0deg)} to{transform:rotate(360deg) translateX(var(--r)) rotate(-360deg)} }
`;

export default function SplashScreen() {
  const { s } = useSettings();
  const [visible, setVisible] = useState(true);

  const duration  = Math.max(1800, parseInt(s.splashDuration || '2500', 10));
  const color     = s.appColor || '#6366f1';
  const rgb       = toRgb(color);
  const showLogo  = s.splashShowLogo  !== false;
  const showName  = s.splashShowName  !== false;
  const showProg  = s.splashShowProgress !== false;
  const fillSec   = Math.max(0.5, (duration - 1200) / 1000);

  useEffect(() => {
    const t = setTimeout(() => setVisible(false), duration);
    return () => clearTimeout(t);
  }, [duration]);

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          key="splash"
          initial={{ opacity: 1 }}
          exit={{ opacity: 0, scale: 1.04 }}
          transition={{ duration: 0.7, ease: 'easeInOut' }}
          className="fixed inset-0 z-[500] flex items-center justify-center overflow-hidden select-none"
          style={{ background: 'radial-gradient(ellipse at 45% 55%, #0c0e1e 0%, #070810 55%, #020308 100%)' }}
        >
          <style>{CSS}</style>

          {/* ── 1. Aurora blobs (deepest layer) ─────────────────────────────── */}
          <div className="absolute inset-0 overflow-hidden" style={{ filter: 'blur(90px)', pointerEvents: 'none' }}>
            {[
              { w: '75%', h: '75%', t: '5%',  l: '-25%', d: '9s',  del: '0s', op: 0.4 },
              { w: '60%', h: '60%', t: '40%', l: '45%',  d: '12s', del: '2s', op: 0.3 },
              { w: '50%', h: '50%', t: '20%', l: '30%',  d: '16s', del: '5s', op: 0.2, alt: true },
            ].map((b, i) => (
              <div key={i} style={{
                position: 'absolute', width: b.w, height: b.h, top: b.t, left: b.l,
                borderRadius: '50%',
                background: b.alt
                  ? `radial-gradient(circle, rgba(160,80,255,${b.op}) 0%, transparent 70%)`
                  : `radial-gradient(circle, rgba(${rgb},${b.op}) 0%, transparent 70%)`,
                animation: `sp-aura ${b.d} ease-in-out infinite ${b.del}`,
              }} />
            ))}
          </div>

          {/* ── 2. Perspective grid floor ────────────────────────────────────── */}
          <div style={{
            position: 'absolute', inset: 0, pointerEvents: 'none',
            backgroundImage: `linear-gradient(rgba(${rgb},.06) 1px, transparent 1px), linear-gradient(90deg, rgba(${rgb},.06) 1px, transparent 1px)`,
            backgroundSize: '80px 80px',
            transform: 'perspective(500px) rotateX(58deg) scaleY(2.2)',
            transformOrigin: '50% 125%',
            animation: 'sp-gridPan 10s linear infinite',
            opacity: 0.6,
          }} />

          {/* ── 3. Starfield ─────────────────────────────────────────────────── */}
          <div className="absolute inset-0" style={{ pointerEvents: 'none' }}>
            {STARS.map((p, i) => (
              <div key={i} style={{
                position: 'absolute', left: `${p.x}%`, top: `${p.y}%`,
                width: `${p.s}px`, height: `${p.s}px`, borderRadius: '50%',
                background: `rgba(${rgb},${p.op})`,
                boxShadow: `0 0 ${p.s * 3}px rgba(${rgb},0.5)`,
                animation: `sp-twinkle ${p.d}s ease-in-out infinite ${p.delay}s`,
              }} />
            ))}
          </div>

          {/* ── 4. Concentric spinning rings ─────────────────────────────────── */}
          <div className="absolute" style={{ left: '50%', top: '50%', pointerEvents: 'none' }}>
            {[110, 160, 220, 290, 370].map((r, i) => (
              <div key={i} style={{
                position: 'absolute',
                width: `${r * 2}px`, height: `${r * 2}px`,
                marginLeft: `-${r}px`, marginTop: `-${r}px`,
                borderRadius: '50%',
                border: `1px solid rgba(${rgb},${0.12 - i * 0.02})`,
                animation: `${i % 2 === 0 ? 'sp-spin' : 'sp-spinR'} ${18 + i * 9}s linear infinite`,
              }}>
                {/* Ring gem */}
                <div style={{
                  position: 'absolute', top: '-4px', left: '50%', marginLeft: '-4px',
                  width: '8px', height: '8px', borderRadius: '50%',
                  background: `rgba(${rgb},${0.8 - i * 0.15})`,
                  boxShadow: `0 0 10px 3px rgba(${rgb},0.5)`,
                }} />
              </div>
            ))}
          </div>

          {/* ── 5. Orbiting particles ─────────────────────────────────────────── */}
          <div className="absolute" style={{ left: '50%', top: '50%', pointerEvents: 'none' }}>
            {[
              { r: '130px', dur: '9s',  del: '0s',   size: 7, op: 0.9 },
              { r: '185px', dur: '14s', del: '-5s',  size: 5, op: 0.7 },
              { r: '240px', dur: '20s', del: '-9s',  size: 4, op: 0.5 },
              { r: '155px', dur: '11s', del: '-3s',  size: 6, op: 0.8, rev: true },
            ].map((o, i) => (
              <div key={i} style={{
                position: 'absolute',
                width: `${o.size}px`, height: `${o.size}px`,
                marginLeft: `-${o.size / 2}px`, marginTop: `-${o.size / 2}px`,
                ['--r' as string]: o.r,
                animation: `sp-orbit ${o.dur} linear infinite ${o.del}`,
                ...(o.rev ? { animationDirection: 'reverse' } : {}),
              }}>
                <div style={{
                  width: `${o.size}px`, height: `${o.size}px`, borderRadius: '50%',
                  background: `rgba(${rgb},${o.op})`,
                  boxShadow: `0 0 ${o.size * 2}px ${o.size}px rgba(${rgb},0.35)`,
                }} />
              </div>
            ))}
          </div>

          {/* ── 6. Ripple waves ──────────────────────────────────────────────── */}
          <div className="absolute" style={{ left: '50%', top: '50%', pointerEvents: 'none' }}>
            {[0, 1.1, 2.2].map(del => (
              <div key={del} style={{
                position: 'absolute',
                width: '200px', height: '200px',
                border: `1.5px solid rgba(${rgb},0.5)`,
                borderRadius: '50%',
                animation: `sp-ripple 3.6s ease-out infinite ${del}s`,
              }} />
            ))}
          </div>

          {/* ── 7. Sparkle dust (near layer) ─────────────────────────────────── */}
          <div className="absolute inset-0" style={{ pointerEvents: 'none' }}>
            {SPARKLES.map((p, i) => (
              <div key={i} style={{
                position: 'absolute', left: `${p.x}%`, top: `${p.y}%`,
                width: '2px', height: '8px', borderRadius: '1px',
                background: `rgba(255,255,255,${p.op * 0.6})`,
                transform: `rotate(${p.delay * 45}deg)`,
                animation: `sp-twinkle ${p.d}s ease-in-out infinite ${p.delay * 0.5}s`,
              }} />
            ))}
          </div>

          {/* ── 8. Central hero ──────────────────────────────────────────────── */}
          <motion.div
            initial={{ opacity: 0, scale: 0.6, y: 40 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ duration: 0.95, ease: [0.16, 1, 0.3, 1], delay: 0.15 }}
            style={{ position: 'relative', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '24px' }}
          >
            {/* Glow plate */}
            <div style={{
              position: 'absolute', top: '50%', left: '50%',
              transform: 'translate(-50%, -55%)',
              width: '260px', height: '260px', borderRadius: '50%',
              background: `radial-gradient(circle, rgba(${rgb},0.45) 0%, transparent 70%)`,
              filter: 'blur(40px)',
              animation: 'sp-pulsate 3.5s ease-in-out infinite',
              pointerEvents: 'none',
            }} />

            {/* Logo box */}
            {showLogo && (
              <motion.div
                initial={{ rotateY: 90, scale: 0.4, opacity: 0 }}
                animate={{ rotateY: 0,  scale: 1,   opacity: 1 }}
                transition={{ duration: 1, ease: [0.16, 1, 0.3, 1], delay: 0.35 }}
                style={{
                  width: '100px', height: '100px', borderRadius: '28px',
                  position: 'relative', overflow: 'hidden',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  background: s.logoUrl
                    ? 'rgba(255,255,255,0.04)'
                    : `linear-gradient(140deg, ${color} 0%, ${color}99 60%, ${color}55 100%)`,
                  boxShadow: `
                    0 0 0 1px rgba(${rgb},0.4),
                    0 0 0 3px rgba(${rgb},0.1),
                    0 24px 70px rgba(${rgb},0.55),
                    0 6px 25px rgba(0,0,0,0.6),
                    inset 0 1px 0 rgba(255,255,255,0.15)
                  `,
                  animation: 'sp-bob 5s ease-in-out infinite 1s',
                }}
              >
                {/* Glass inner shimmer */}
                <div style={{
                  position: 'absolute', inset: 0,
                  background: 'linear-gradient(110deg, transparent 35%, rgba(255,255,255,0.18) 50%, transparent 65%)',
                  animation: 'sp-shimmer 2.8s ease-in-out infinite 1.5s',
                }} />
                {/* Inner top-left gloss */}
                <div style={{
                  position: 'absolute', top: 0, left: 0, right: 0, height: '45%',
                  background: 'linear-gradient(180deg, rgba(255,255,255,0.12) 0%, transparent 100%)',
                  borderRadius: '28px 28px 0 0',
                }} />

                {s.logoUrl
                  ? <img src={s.logoUrl} alt="logo" style={{ width: '78%', height: '78%', objectFit: 'contain', position: 'relative' }} />
                  : <span style={{ fontSize: '44px', fontWeight: 900, color: 'white', position: 'relative', lineHeight: 1, fontFamily: 'system-ui, sans-serif' }}>
                      {(s.appName || 'W')[0].toUpperCase()}
                    </span>
                }
              </motion.div>
            )}

            {/* App name + company */}
            {showName && (
              <motion.div
                initial={{ opacity: 0, y: 18 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.75, ease: [0.16, 1, 0.3, 1], delay: 0.65 }}
                style={{ textAlign: 'center' }}
              >
                <h1 style={{
                  margin: 0, lineHeight: 1.1,
                  fontSize: 'clamp(24px, 6vw, 32px)',
                  fontWeight: 900, letterSpacing: '-0.025em',
                  color: 'white',
                  textShadow: `0 0 40px rgba(${rgb},0.7), 0 0 12px rgba(${rgb},0.4), 0 2px 8px rgba(0,0,0,0.6)`,
                }}>
                  {s.appName || 'WorkforceOS'}
                </h1>

                {s.companyName ? (
                  <motion.p
                    initial={{ opacity: 0, letterSpacing: '0.1em' }}
                    animate={{ opacity: 1, letterSpacing: '0.28em' }}
                    transition={{ duration: 0.9, delay: 0.9 }}
                    style={{
                      margin: '8px 0 0', fontSize: '11px', fontWeight: 700,
                      textTransform: 'uppercase',
                      color: `rgba(${rgb},0.9)`,
                      textShadow: `0 0 20px rgba(${rgb},0.5)`,
                    }}
                  >
                    {s.companyName}
                  </motion.p>
                ) : (
                  <p style={{
                    margin: '8px 0 0', fontSize: '11px', fontWeight: 600,
                    textTransform: 'uppercase', letterSpacing: '0.32em',
                    color: 'rgba(255,255,255,0.3)',
                  }}>
                    WORK SMARTER
                  </p>
                )}

                {/* Decorative glow line under name */}
                <motion.div
                  initial={{ scaleX: 0, opacity: 0 }}
                  animate={{ scaleX: 1, opacity: 1 }}
                  transition={{ duration: 0.6, delay: 0.95 }}
                  style={{
                    height: '1px', marginTop: '12px',
                    background: `linear-gradient(90deg, transparent, rgba(${rgb},0.7), transparent)`,
                    animation: 'sp-glowLine 2.5s ease-in-out infinite',
                  }}
                />
              </motion.div>
            )}

            {/* Progress bar */}
            {showProg && (
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 1 }}
                style={{
                  width: '130px', position: 'relative',
                  height: '3px', borderRadius: '99px',
                  background: 'rgba(255,255,255,0.08)',
                  overflow: 'hidden',
                  boxShadow: `0 0 10px rgba(${rgb},0.2)`,
                }}
              >
                <motion.div
                  initial={{ width: '0%' }}
                  animate={{ width: '100%' }}
                  transition={{ duration: fillSec, delay: 1.1, ease: 'linear' }}
                  style={{
                    height: '100%', borderRadius: '99px',
                    background: `linear-gradient(90deg, ${color}99, ${color}, ${color}cc)`,
                    boxShadow: `0 0 8px rgba(${rgb},0.7)`,
                    position: 'relative', overflow: 'hidden',
                  }}
                >
                  {/* Shimmer on fill */}
                  <div style={{
                    position: 'absolute', inset: 0,
                    background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.6), transparent)',
                    animation: 'sp-shimmer 1.3s ease-in-out infinite',
                  }} />
                </motion.div>
              </motion.div>
            )}
          </motion.div>

          {/* ── 9. Bottom tag ────────────────────────────────────────────────── */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.25 }}
            transition={{ delay: 1.4, duration: 0.8 }}
            style={{
              position: 'absolute', bottom: '28px', left: '50%', transform: 'translateX(-50%)',
              display: 'flex', alignItems: 'center', gap: '8px',
            }}
          >
            <div style={{ width: '20px', height: '1px', background: 'rgba(255,255,255,0.4)' }} />
            <span style={{ color: 'white', fontSize: '9px', letterSpacing: '0.25em', fontWeight: 600, whiteSpace: 'nowrap' }}>
              WORKFORCEOS SYSTEM
            </span>
            <div style={{ width: '20px', height: '1px', background: 'rgba(255,255,255,0.4)' }} />
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
