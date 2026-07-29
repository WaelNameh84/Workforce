/**
 * Splash Screen Themes — 6 fully animated 3D themes
 * Each theme receives ThemeProps and renders its own layered canvas.
 */
import { motion } from 'framer-motion';

// ─── Shared types & helpers ───────────────────────────────────────────────────
export interface ThemeProps {
  color: string;
  rgb: string;
  appName: string;
  companyName: string;
  logoUrl: string;
  showLogo: boolean;
  showName: boolean;
  showProg: boolean;
  fillSec: number;
}

/** Deterministic point cloud — no randomness on re-render */
function cloud(n: number, seed = 1) {
  const out: number[] = [];
  let r = seed;
  const next = () => { r = (r * 16807) % 2147483647; return (r - 1) / 2147483646; };
  for (let i = 0; i < n * 5; i++) out.push(next());
  return Array.from({ length: n }, (_, i) => ({
    x: out[i * 5],  y: out[i * 5 + 1], s: out[i * 5 + 2],
    d: out[i * 5 + 3], delay: out[i * 5 + 4],
  }));
}

const STARS    = cloud(80, 42);
const SPARKLES = cloud(30, 17);
const BUBBLES  = cloud(40, 88);
const EMBERS   = cloud(55, 33);
const SHARDS   = cloud(16, 61);
const AURPTS   = cloud(50, 99);

// ─── Shared micro-components ──────────────────────────────────────────────────
function LogoBox({ color, rgb, logoUrl, appName, extra }: Pick<ThemeProps, 'color'|'rgb'|'logoUrl'|'appName'> & { extra?: React.CSSProperties }) {
  return (
    <motion.div
      initial={{ rotateY: 90, scale: 0.4, opacity: 0 }}
      animate={{ rotateY: 0,  scale: 1,   opacity: 1 }}
      transition={{ duration: 1, ease: [0.16, 1, 0.3, 1], delay: 0.35 }}
      style={{
        width: 100, height: 100, borderRadius: 28, position: 'relative', overflow: 'hidden',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        background: logoUrl ? 'rgba(255,255,255,.06)' : `linear-gradient(140deg,${color} 0%,${color}88 100%)`,
        boxShadow: `0 0 0 1px rgba(${rgb},.4),0 0 0 3px rgba(${rgb},.12),0 24px 70px rgba(${rgb},.55),0 6px 25px rgba(0,0,0,.6),inset 0 1px 0 rgba(255,255,255,.15)`,
        ...extra,
      }}
    >
      <div style={{ position:'absolute',inset:0,background:'linear-gradient(110deg,transparent 35%,rgba(255,255,255,.18) 50%,transparent 65%)',animation:'gl-shimmer 2.8s ease-in-out infinite 1.5s' }} />
      <div style={{ position:'absolute',top:0,left:0,right:0,height:'45%',background:'linear-gradient(180deg,rgba(255,255,255,.12) 0%,transparent 100%)',borderRadius:'28px 28px 0 0' }} />
      {logoUrl
        ? <img src={logoUrl} alt="" style={{ width:'78%',height:'78%',objectFit:'contain',position:'relative' }} />
        : <span style={{ fontSize:44,fontWeight:900,color:'white',position:'relative',lineHeight:1,fontFamily:'system-ui,sans-serif' }}>{(appName||'W')[0].toUpperCase()}</span>
      }
    </motion.div>
  );
}

function NameBlock({ appName, companyName, rgb, textGlow }: Pick<ThemeProps,'appName'|'companyName'|'rgb'> & { textGlow?: string }) {
  return (
    <motion.div initial={{ opacity:0,y:18 }} animate={{ opacity:1,y:0 }} transition={{ duration:.75,ease:[0.16,1,0.3,1],delay:.65 }} style={{ textAlign:'center' }}>
      <h1 style={{ margin:0,lineHeight:1.1,fontSize:'clamp(24px,6vw,32px)',fontWeight:900,letterSpacing:'-.025em',color:'white',textShadow:textGlow||`0 0 40px rgba(${rgb},.7),0 2px 8px rgba(0,0,0,.6)` }}>
        {appName||'WorkforceOS'}
      </h1>
      {companyName
        ? <motion.p initial={{ opacity:0 }} animate={{ opacity:1 }} transition={{ delay:.9 }} style={{ margin:'8px 0 0',fontSize:11,fontWeight:700,textTransform:'uppercase',letterSpacing:'.28em',color:`rgba(${rgb},.9)` }}>{companyName}</motion.p>
        : <p style={{ margin:'8px 0 0',fontSize:11,fontWeight:600,textTransform:'uppercase',letterSpacing:'.32em',color:'rgba(255,255,255,.3)' }}>WORK SMARTER</p>
      }
      <motion.div initial={{ scaleX:0 }} animate={{ scaleX:1 }} transition={{ duration:.6,delay:.95 }} style={{ height:1,marginTop:12,background:`linear-gradient(90deg,transparent,rgba(${rgb},.7),transparent)` }} />
    </motion.div>
  );
}

function ProgBar({ color, rgb, fillSec }: Pick<ThemeProps,'color'|'rgb'|'fillSec'>) {
  return (
    <motion.div initial={{ opacity:0,y:8 }} animate={{ opacity:1,y:0 }} transition={{ duration:.5,delay:1 }}
      style={{ width:130,height:3,borderRadius:99,background:'rgba(255,255,255,.08)',overflow:'hidden',boxShadow:`0 0 10px rgba(${rgb},.2)` }}>
      <motion.div initial={{ width:'0%' }} animate={{ width:'100%' }} transition={{ duration:fillSec,delay:1.1,ease:'linear' }}
        style={{ height:'100%',borderRadius:99,background:`linear-gradient(90deg,${color}99,${color},${color}cc)`,boxShadow:`0 0 8px rgba(${rgb},.7)`,overflow:'hidden',position:'relative' }}>
        <div style={{ position:'absolute',inset:0,background:'linear-gradient(90deg,transparent,rgba(255,255,255,.6),transparent)',animation:'gl-shimmer 1.3s ease-in-out infinite' }} />
      </motion.div>
    </motion.div>
  );
}

// ─── Global shared keyframes (injected once by the main SplashScreen) ─────────
export const GLOBAL_CSS = `
  @keyframes gl-shimmer  { 0%{transform:translateX(-150%)} 100%{transform:translateX(250%)} }
  @keyframes gl-bob      { 0%,100%{transform:translateY(0) scale(1)} 50%{transform:translateY(-14px) scale(1.04)} }
  @keyframes gl-pulsate  { 0%,100%{transform:scale(1)} 50%{transform:scale(1.07)} }
  @keyframes gl-twinkle  { 0%,100%{opacity:.08} 50%{opacity:1} }
  @keyframes gl-spin     { to{transform:rotate(360deg)} }
  @keyframes gl-spinR    { to{transform:rotate(-360deg)} }
  @keyframes gl-rise     { 0%{transform:translateY(0);opacity:1} 100%{transform:translateY(-110vh);opacity:0} }
  @keyframes gl-ripple   { 0%{transform:translate(-50%,-50%) scale(.6);opacity:.9} 100%{transform:translate(-50%,-50%) scale(3.5);opacity:0} }
  @keyframes gl-orbit    { from{transform:rotate(0deg) translateX(var(--r,120px)) rotate(0deg)} to{transform:rotate(360deg) translateX(var(--r,120px)) rotate(-360deg)} }
  @keyframes gl-gridPan  { 0%{background-position:0 0} 100%{background-position:80px 80px} }
  @keyframes gl-aura     { 0%,100%{transform:scale(1) rotate(0deg);opacity:.35} 50%{transform:scale(1.15) rotate(8deg);opacity:.65} }
  @keyframes gl-glowLine { 0%,100%{opacity:.3} 50%{opacity:1} }

  @keyframes au-ribbon   { 0%,100%{transform:translateX(-15%) skewX(-8deg);opacity:.55} 50%{transform:translateX(10%) skewX(4deg);opacity:.85} }
  @keyframes au-ribbon2  { 0%,100%{transform:translateX(5%) skewX(6deg);opacity:.4} 50%{transform:translateX(-8%) skewX(-5deg);opacity:.7} }

  @keyframes ne-glitch   { 0%,100%{transform:translateX(0)} 20%{transform:translateX(-4px)} 40%{transform:translateX(4px)} 60%{transform:translateX(-2px)} 80%{transform:translateX(2px)} }
  @keyframes ne-scan     { 0%{transform:translateY(-100%)} 100%{transform:translateY(100vh)} }
  @keyframes ne-flicker  { 0%,100%{opacity:1} 50%{opacity:.8} 92%{opacity:.6} 94%{opacity:1} }
  @keyframes ne-pulse    { 0%,100%{box-shadow:0 0 8px 2px currentColor} 50%{box-shadow:0 0 24px 8px currentColor} }

  @keyframes cr-float    { 0%,100%{transform:translateY(0) rotate(var(--cr))} 50%{transform:translateY(-18px) rotate(calc(var(--cr) + 20deg))} }
  @keyframes cr-beam     { 0%{transform:translateX(-200%) rotate(-35deg)} 100%{transform:translateX(400%) rotate(-35deg)} }
  @keyframes cr-caustic  { 0%,100%{opacity:.15;transform:rotate(0deg)} 50%{opacity:.4;transform:rotate(180deg)} }

  @keyframes fi-rise     { 0%{transform:translateY(0) scale(1);opacity:.9} 100%{transform:translateY(-70vh) scale(.1);opacity:0} }
  @keyframes fi-ember    { 0%{transform:translate(0,0) scale(1);opacity:1} 100%{transform:translate(var(--ex),calc(-40vh + var(--ey))) scale(.2);opacity:0} }
  @keyframes fi-glow     { 0%,100%{opacity:.6;transform:scaleY(1)} 50%{opacity:1;transform:scaleY(1.08)} }
  @keyframes fi-flicker  { 0%,100%{transform:scale(1) skewX(0deg)} 25%{transform:scale(1.03) skewX(-1deg)} 75%{transform:scale(.98) skewX(1deg)} }

  @keyframes oc-bubble   { 0%{transform:translateY(0) translateX(0) scale(1);opacity:.8} 100%{transform:translateY(-105vh) translateX(var(--bx)) scale(.4);opacity:0} }
  @keyframes oc-caustic  { 0%,100%{opacity:.08;transform:rotate(0deg) scale(1)} 50%{opacity:.22;transform:rotate(60deg) scale(1.1)} }
  @keyframes oc-wave     { 0%,100%{transform:translateX(0)} 50%{transform:translateX(-40px)} }
  @keyframes oc-blink    { 0%,100%{opacity:.12} 50%{opacity:.7} }

  @keyframes rg-energy   { 0%{transform:rotate(0deg) scale(1);opacity:.6} 50%{transform:rotate(180deg) scale(1.06);opacity:1} 100%{transform:rotate(360deg) scale(1);opacity:.6} }
  @keyframes rg-sweep    { 0%{transform:translateX(-120%) skewX(-20deg)} 100%{transform:translateX(300%) skewX(-20deg)} }
  @keyframes rg-dot      { 0%{transform:translate(-50%,-50%) rotate(0deg) translateX(var(--rd)) rotate(0deg)} 100%{transform:translate(-50%,-50%) rotate(360deg) translateX(var(--rd)) rotate(-360deg)} }

  @keyframes gc-orbitBig { 0%{transform:rotate(0deg)} 100%{transform:rotate(360deg)} }
  @keyframes gc-tilt     { 0%,100%{transform:perspective(600px) rotateX(6deg) rotateY(-8deg) translateY(0)} 50%{transform:perspective(600px) rotateX(-4deg) rotateY(8deg) translateY(-10px)} }
  @keyframes gc-shine    { 0%{left:-100%} 100%{left:200%} }

  @keyframes pr-beam     { 0%,100%{opacity:0;transform:scaleX(0)} 30%,70%{opacity:1;transform:scaleX(1)} }
  @keyframes pr-jitter   { 0%,100%{transform:translateX(0)} 25%{transform:translateX(-3px)} 75%{transform:translateX(3px)} }
  @keyframes pr-ptcl     { 0%{transform:translate(var(--px),var(--py));opacity:0} 20%{opacity:1} 100%{transform:translate(0,0);opacity:0} }

  @keyframes hl-gridPan  { 0%{background-position:0 0} 100%{background-position:60px 60px} }
  @keyframes hl-scan     { 0%{transform:translateY(-120%);opacity:1} 100%{transform:translateY(120vh);opacity:1} }
  @keyframes hl-ring     { 0%,100%{transform:scale(1);opacity:.6} 50%{transform:scale(1.1);opacity:1} }
  @keyframes hl-flicker  { 0%,100%{opacity:1} 45%{opacity:.8} 92%{opacity:.2} 95%{opacity:1} }
  @keyframes hl-corner   { 0%,100%{opacity:.4} 50%{opacity:.9} }

  @keyframes pt-gather   { 0%{transform:translate(var(--px),var(--py)) scale(1.5);opacity:0} 15%{opacity:1} 100%{transform:translate(0,0) scale(.3);opacity:0} }
  @keyframes pt-flash    { 0%,100%{opacity:0} 10%,25%{opacity:1} }
  @keyframes pt-pop      { 0%{transform:scale(0) rotate(-20deg);opacity:0} 70%{transform:scale(1.1) rotate(4deg);opacity:1} 100%{transform:scale(1) rotate(0deg);opacity:1} }

  @keyframes sp-orb      { 0%,100%{transform:scale(1);opacity:.7} 50%{transform:scale(1.2);opacity:1} }
  @keyframes sp-depth    { 0%{transform:translateZ(0)} 100%{transform:translateZ(60px)} }
  @keyframes sp-spiral   { 0%{transform:rotate(0deg) translateX(var(--sr)) rotate(0deg)} 100%{transform:rotate(360deg) translateX(var(--sr)) rotate(-360deg)} }

  @keyframes gd-curtL    { 0%{transform:translateX(0)} 100%{transform:translateX(-105%)} }
  @keyframes gd-curtR    { 0%{transform:translateX(0)} 100%{transform:translateX(105%)} }
  @keyframes gd-spot     { 0%,100%{opacity:.55;width:120px} 50%{opacity:.9;width:140px} }
  @keyframes gd-platform { 0%,100%{box-shadow:0 0 40px rgba(251,191,36,.3)} 50%{box-shadow:0 0 80px rgba(251,191,36,.7)} }
  @keyframes gd-dust     { 0%{transform:translate(0,0) scale(1);opacity:.9} 100%{transform:translate(var(--dx),var(--dy)) scale(.2);opacity:0} }

  @keyframes sm-smoke    { 0%{transform:translateY(0) scaleX(1);opacity:.6} 100%{transform:translateY(-90px) scaleX(2.5);opacity:0} }
  @keyframes sm-spin3d   { 0%{transform:perspective(400px) rotateY(0deg)} 100%{transform:perspective(400px) rotateY(360deg)} }
  @keyframes sm-spark    { 0%{transform:translate(0,0);opacity:1} 100%{transform:translate(var(--sx),var(--sy));opacity:0} }
  @keyframes sm-glow     { 0%,100%{opacity:.4;transform:scale(1)} 50%{opacity:.9;transform:scale(1.15)} }
`;

// ─── Themes catalog (used by settings picker) ────────────────────────────────
export const THEMES_CATALOG = [
  { id: 'cosmic',    nameAr: 'كوني',            descAr: 'نجوم + حلقات مدارية + جسيمات',                bg: '#0c0e1e', accent: '#6366f1' },
  { id: 'aurora',    nameAr: 'أورورا',           descAr: 'شفق قطبي + ضوء شمالي ساحر',                  bg: '#020c10', accent: '#00ff88' },
  { id: 'neon',      nameAr: 'نيون',             descAr: 'شبكة سايبر + وميض نيون',                      bg: '#000000', accent: '#00f0ff' },
  { id: 'crystal',   nameAr: 'كريستال',          descAr: 'شظايا جليدية + انكسار الضوء',                 bg: '#060d1a', accent: '#60a5fa' },
  { id: 'fire',      nameAr: 'ناري',             descAr: 'ألسنة اللهب + شرارات ذهبية',                  bg: '#080200', accent: '#ff5000' },
  { id: 'ocean',     nameAr: 'المحيط',           descAr: 'أعماق البحر + فقاعات وضوء',                   bg: '#010810', accent: '#0066ff' },
  { id: 'rings',     nameAr: 'بريميوم حلقات',    descAr: 'حلقات طاقة + ضوء عابر',                       bg: '#080010', accent: '#a78bfa' },
  { id: 'glass',     nameAr: 'كرت زجاجي',        descAr: 'كرت ثري دي + دائرة طاقة دوّارة',              bg: '#06080f', accent: '#38bdf8' },
  { id: 'premium',   nameAr: 'ثري دي بريميوم',   descAr: 'ضوء + حلقتان + شعاع سينمائي + 200 جزيء',     bg: '#06040e', accent: '#f472b6' },
  { id: 'holo',      nameAr: 'هولوغرام',         descAr: 'شبكة متحركة + حلقة هولوغرامية + مسح ضوئي',   bg: '#020a08', accent: '#00f5d4' },
  { id: 'particles', nameAr: 'جسيمات 3D',        descAr: '1200 جسيم يتجمع + فلاش + لوغو ينبثق',        bg: '#04030c', accent: '#818cf8' },
  { id: 'space',     nameAr: 'فضاء ثري دي',      descAr: 'نجوم + كرة ضوئية + مدارات + كاميرا Z',       bg: '#020308', accent: '#38bdf8' },
  { id: 'golden',    nameAr: 'فاخر ذهبي',        descAr: 'ستارة حمراء + كاشف + منصة ذهبية + غبار',     bg: '#0e0500', accent: '#fbbf24' },
  { id: 'smoke',     nameAr: 'دخان سيان',         descAr: 'دخان + ضوء سيان + لوغو دوراني 3D + شرارات',  bg: '#02080c', accent: '#06b6d4' },
] as const;

export type SplashThemeId = typeof THEMES_CATALOG[number]['id'];

// ══════════════════════════════════════════════════════════════════════════════
//  1. COSMIC — space, stars, orbiting rings
// ══════════════════════════════════════════════════════════════════════════════
export function ThemeCosmic({ color, rgb, appName, companyName, logoUrl, showLogo, showName, showProg, fillSec }: ThemeProps) {
  return (
    <div style={{ position:'absolute',inset:0,display:'flex',alignItems:'center',justifyContent:'center',background:`radial-gradient(ellipse at 45% 55%,#0c0e1e 0%,#070810 55%,#020308 100%)` }}>
      {/* Aurora blobs */}
      <div style={{ position:'absolute',inset:0,overflow:'hidden',filter:'blur(90px)',pointerEvents:'none' }}>
        {[{w:'75%',h:'75%',t:'5%',l:'-25%',d:'9s'},{w:'60%',h:'60%',t:'40%',l:'45%',d:'12s'},{w:'50%',h:'50%',t:'20%',l:'30%',d:'16s',alt:true}].map((b,i)=>(
          <div key={i} style={{ position:'absolute',width:b.w,height:b.h,top:b.t,left:b.l,borderRadius:'50%',
            background:b.alt?`radial-gradient(circle,rgba(160,80,255,.2) 0%,transparent 70%)`:`radial-gradient(circle,rgba(${rgb},.35) 0%,transparent 70%)`,
            animation:`gl-aura ${b.d} ease-in-out infinite ${i*3}s` }} />
        ))}
      </div>
      {/* Perspective grid */}
      <div style={{ position:'absolute',inset:0,pointerEvents:'none',backgroundImage:`linear-gradient(rgba(${rgb},.06) 1px,transparent 1px),linear-gradient(90deg,rgba(${rgb},.06) 1px,transparent 1px)`,backgroundSize:'80px 80px',transform:'perspective(500px) rotateX(58deg) scaleY(2.2)',transformOrigin:'50% 125%',animation:'gl-gridPan 10s linear infinite',opacity:.6 }} />
      {/* Stars */}
      <div style={{ position:'absolute',inset:0,pointerEvents:'none' }}>
        {STARS.map((p,i)=><div key={i} style={{ position:'absolute',left:`${p.x*100}%`,top:`${p.y*100}%`,width:`${p.s*3}px`,height:`${p.s*3}px`,borderRadius:'50%',background:`rgba(${rgb},${p.d*.5+.2})`,boxShadow:`0 0 ${p.s*8}px rgba(${rgb},.5)`,animation:`gl-twinkle ${p.d*7+4}s ease-in-out infinite ${p.delay*5}s` }} />)}
      </div>
      {/* Rings */}
      <div style={{ position:'absolute',left:'50%',top:'50%',pointerEvents:'none' }}>
        {[110,160,220,290,370].map((r,i)=>(
          <div key={i} style={{ position:'absolute',width:`${r*2}px`,height:`${r*2}px`,marginLeft:`-${r}px`,marginTop:`-${r}px`,borderRadius:'50%',border:`1px solid rgba(${rgb},${.12-i*.02})`,animation:`${i%2===0?'gl-spin':'gl-spinR'} ${18+i*9}s linear infinite` }}>
            <div style={{ position:'absolute',top:'-4px',left:'50%',marginLeft:'-4px',width:'8px',height:'8px',borderRadius:'50%',background:`rgba(${rgb},${.8-i*.15})`,boxShadow:`0 0 10px 3px rgba(${rgb},.5)` }} />
          </div>
        ))}
      </div>
      {/* Orbiting particles */}
      <div style={{ position:'absolute',left:'50%',top:'50%',pointerEvents:'none' }}>
        {[{r:'130px',dur:'9s',del:'0s',sz:7},{r:'185px',dur:'14s',del:'-5s',sz:5},{r:'240px',dur:'20s',del:'-9s',sz:4}].map((o,i)=>(
          <div key={i} style={{ position:'absolute',width:`${o.sz}px`,height:`${o.sz}px`,marginLeft:`-${o.sz/2}px`,marginTop:`-${o.sz/2}px`,['--r' as string]:o.r,animation:`gl-orbit ${o.dur} linear infinite ${o.del}` }}>
            <div style={{ width:`${o.sz}px`,height:`${o.sz}px`,borderRadius:'50%',background:`rgba(${rgb},.9)`,boxShadow:`0 0 ${o.sz*2}px ${o.sz}px rgba(${rgb},.35)` }} />
          </div>
        ))}
      </div>
      {/* Ripples */}
      <div style={{ position:'absolute',left:'50%',top:'50%',pointerEvents:'none' }}>
        {[0,1.1,2.2].map(d=><div key={d} style={{ position:'absolute',width:'200px',height:'200px',border:`1.5px solid rgba(${rgb},.5)`,borderRadius:'50%',animation:`gl-ripple 3.6s ease-out infinite ${d}s` }} />)}
      </div>
      {/* Sparkles */}
      <div style={{ position:'absolute',inset:0,pointerEvents:'none' }}>
        {SPARKLES.map((p,i)=><div key={i} style={{ position:'absolute',left:`${p.x*100}%`,top:`${p.y*100}%`,width:'2px',height:'8px',borderRadius:'1px',background:`rgba(255,255,255,${p.s*.4+.1})`,transform:`rotate(${p.delay*180}deg)`,animation:`gl-twinkle ${p.d*7+4}s ease-in-out infinite ${p.delay*3}s` }} />)}
      </div>
      {/* Center */}
      <CenterPiece {...{color,rgb,appName,companyName,logoUrl,showLogo,showName,showProg,fillSec}} bobAnim="gl-bob 5s ease-in-out infinite 1s" />
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
//  2. AURORA — Northern lights, ribbons of color, rising particles
// ══════════════════════════════════════════════════════════════════════════════
export function ThemeAurora({ color, rgb, appName, companyName, logoUrl, showLogo, showName, showProg, fillSec }: ThemeProps) {
  const bands = [
    { color:'#00ff88', top:'15%', h:'18%', blur:60, anim:'au-ribbon',  dur:'7s', del:'0s' },
    { color:'#00ccff', top:'28%', h:'22%', blur:80, anim:'au-ribbon2', dur:'9s', del:'1s' },
    { color:'#aa44ff', top:'42%', h:'16%', blur:70, anim:'au-ribbon',  dur:'11s',del:'2s' },
    { color:'#44ffcc', top:'55%', h:'12%', blur:50, anim:'au-ribbon2', dur:'8s', del:'3s' },
  ];
  return (
    <div style={{ position:'absolute',inset:0,display:'flex',alignItems:'center',justifyContent:'center',background:'radial-gradient(ellipse at 50% 30%,#020c10 0%,#010508 100%)' }}>
      {/* Aurora ribbons */}
      {bands.map((b,i)=>(
        <div key={i} style={{ position:'absolute',left:0,right:0,top:b.top,height:b.h,background:b.color,filter:`blur(${b.blur}px)`,opacity:.35,animation:`${b.anim} ${b.dur} ease-in-out infinite ${b.del}` }} />
      ))}
      {/* Stars */}
      <div style={{ position:'absolute',inset:0,pointerEvents:'none' }}>
        {AURPTS.map((p,i)=><div key={i} style={{ position:'absolute',left:`${p.x*100}%`,top:`${p.y*40}%`,width:`${p.s*2+1}px`,height:`${p.s*2+1}px`,borderRadius:'50%',background:'white',opacity:p.d*.5+.1,animation:`gl-twinkle ${p.d*6+3}s ease-in-out infinite ${p.delay*4}s` }} />)}
      </div>
      {/* Rising particles */}
      <div style={{ position:'absolute',inset:0,pointerEvents:'none',overflow:'hidden' }}>
        {AURPTS.slice(0,30).map((p,i)=>(
          <div key={i} style={{ position:'absolute',left:`${p.x*100}%`,bottom:`-10%`,
            width:`${p.s*4+2}px`,height:`${p.s*4+2}px`,borderRadius:'50%',
            background:bands[i%4].color,filter:'blur(2px)',opacity:.6,
            animation:`gl-rise ${p.d*4+6}s ease-out infinite ${p.delay*8}s` }} />
        ))}
      </div>
      {/* Bottom ground glow */}
      <div style={{ position:'absolute',bottom:0,left:0,right:0,height:'30%',background:'linear-gradient(0deg,rgba(0,255,136,.08) 0%,transparent 100%)',pointerEvents:'none' }} />
      {/* Center */}
      <CenterPiece {...{color,rgb,appName,companyName,logoUrl,showLogo,showName,showProg,fillSec}}
        logoExtra={{ boxShadow:`0 0 0 1px rgba(0,255,136,.4),0 24px 70px rgba(0,255,136,.3),0 6px 25px rgba(0,0,0,.6)` }}
        textGlow="0 0 40px rgba(0,255,200,.6),0 2px 8px rgba(0,0,0,.6)" bobAnim="gl-bob 5s ease-in-out infinite 1s" />
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
//  3. NEON — Cyberpunk, neon grid, glitch effect
// ══════════════════════════════════════════════════════════════════════════════
export function ThemeNeon({ color, rgb, appName, companyName, logoUrl, showLogo, showName, showProg, fillSec }: ThemeProps) {
  const c1 = '#00f0ff', c2 = '#ff00aa';
  return (
    <div style={{ position:'absolute',inset:0,display:'flex',alignItems:'center',justifyContent:'center',background:'#000' }}>
      {/* Grid */}
      <div style={{ position:'absolute',inset:0,backgroundImage:`linear-gradient(rgba(0,240,255,.08) 1px,transparent 1px),linear-gradient(90deg,rgba(0,240,255,.08) 1px,transparent 1px)`,backgroundSize:'50px 50px',transform:'perspective(600px) rotateX(60deg) scaleY(2.5)',transformOrigin:'50% 130%',animation:'gl-gridPan 6s linear infinite',opacity:.7 }} />
      {/* Top radial glow */}
      <div style={{ position:'absolute',top:'-20%',left:'50%',transform:'translateX(-50%)',width:'80%',height:'60%',background:`radial-gradient(circle,rgba(0,240,255,.15) 0%,transparent 70%)`,filter:'blur(20px)',pointerEvents:'none' }} />
      {/* Bottom radial glow */}
      <div style={{ position:'absolute',bottom:'-10%',left:'50%',transform:'translateX(-50%)',width:'80%',height:'50%',background:`radial-gradient(circle,rgba(255,0,170,.12) 0%,transparent 70%)`,filter:'blur(30px)',pointerEvents:'none' }} />
      {/* Scanlines */}
      <div style={{ position:'absolute',inset:0,pointerEvents:'none',overflow:'hidden',opacity:.04 }}>
        <div style={{ position:'absolute',left:0,right:0,height:'2px',background:'rgba(255,255,255,.8)',animation:'ne-scan 3s linear infinite' }} />
      </div>
      {/* Neon corner decorations */}
      {[{t:16,l:16,tr:'none'},{t:16,r:16,tr:'none'},{b:16,l:16,tr:'none'},{b:16,r:16,tr:'none'}].map((pos,i)=>{
        const corners = [['top','left'],['top','right'],['bottom','left'],['bottom','right']];
        const [v,h] = corners[i];
        return (
          <div key={i} style={{ position:'absolute',[v]:20,[h]:20,width:30,height:30,pointerEvents:'none',
            borderTop:   (v==='top'    ?`2px solid ${c1}`:'none'),
            borderBottom:(v==='bottom' ?`2px solid ${c1}`:'none'),
            borderLeft:  (h==='left'   ?`2px solid ${c1}`:'none'),
            borderRight: (h==='right'  ?`2px solid ${c1}`:'none'),
            boxShadow:`0 0 8px ${c1}`,
          }} />
        );
      })}
      {/* Floating neon dots */}
      <div style={{ position:'absolute',inset:0,pointerEvents:'none' }}>
        {SPARKLES.map((p,i)=><div key={i} style={{ position:'absolute',left:`${p.x*100}%`,top:`${p.y*100}%`,width:'3px',height:'3px',borderRadius:'50%',background:i%2===0?c1:c2,boxShadow:`0 0 6px ${i%2===0?c1:c2}`,animation:`gl-twinkle ${p.d*5+3}s ease-in-out infinite ${p.delay*4}s` }} />)}
      </div>
      {/* Center (with neon overrides) */}
      <motion.div initial={{ opacity:0,scale:.6,y:30 }} animate={{ opacity:1,scale:1,y:0 }} transition={{ duration:.9,ease:[0.16,1,0.3,1],delay:.15 }} style={{ position:'relative',display:'flex',flexDirection:'column',alignItems:'center',gap:24,animation:'ne-flicker 4s ease-in-out infinite 2s' }}>
        {showLogo && (
          <motion.div initial={{ rotateY:90,scale:.4,opacity:0 }} animate={{ rotateY:0,scale:1,opacity:1 }} transition={{ duration:1,ease:[0.16,1,0.3,1],delay:.35 }}
            style={{ width:100,height:100,borderRadius:16,position:'relative',overflow:'hidden',display:'flex',alignItems:'center',justifyContent:'center',
              background:logoUrl?'rgba(0,240,255,.05)':`linear-gradient(140deg,${color} 0%,#000 100%)`,
              border:`1.5px solid ${c1}`,boxShadow:`0 0 0 1px ${c1}44,0 0 30px ${c1}66,inset 0 0 20px rgba(0,240,255,.05)`,
              animation:'ne-glitch 6s ease-in-out infinite 3s',
            }}>
            <div style={{ position:'absolute',inset:0,background:'repeating-linear-gradient(0deg,transparent,transparent 2px,rgba(0,240,255,.03) 2px,rgba(0,240,255,.03) 4px)' }} />
            {logoUrl
              ? <img src={logoUrl} alt="" style={{ width:'78%',height:'78%',objectFit:'contain',position:'relative',filter:'brightness(1.1) contrast(1.1)' }} />
              : <span style={{ fontSize:44,fontWeight:900,color:c1,position:'relative',lineHeight:1,fontFamily:'monospace',textShadow:`0 0 20px ${c1}` }}>{(appName||'W')[0].toUpperCase()}</span>
            }
          </motion.div>
        )}
        {showName && (
          <motion.div initial={{ opacity:0,y:18 }} animate={{ opacity:1,y:0 }} transition={{ duration:.75,delay:.65 }} style={{ textAlign:'center' }}>
            <h1 style={{ margin:0,lineHeight:1.1,fontSize:'clamp(24px,6vw,32px)',fontWeight:900,color:c1,letterSpacing:'.05em',textShadow:`0 0 20px ${c1},0 0 40px ${c1}88`,fontFamily:'monospace' }}>
              {(appName||'WorkforceOS').toUpperCase()}
            </h1>
            {companyName
              ? <p style={{ margin:'8px 0 0',fontSize:11,fontWeight:700,textTransform:'uppercase',letterSpacing:'.3em',color:c2,textShadow:`0 0 15px ${c2}` }}>{companyName}</p>
              : <p style={{ margin:'8px 0 0',fontSize:11,fontWeight:600,textTransform:'uppercase',letterSpacing:'.35em',color:'rgba(0,240,255,.4)' }}>SYSTEM ONLINE</p>
            }
            <div style={{ height:1,marginTop:12,background:`linear-gradient(90deg,transparent,${c1},${c2},transparent)`,boxShadow:`0 0 8px ${c1}`,animation:'gl-glowLine 2s ease-in-out infinite' }} />
          </motion.div>
        )}
        {showProg && <ProgBar color={c1} rgb="0,240,255" fillSec={fillSec} />}
      </motion.div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
//  4. CRYSTAL — Ice shards, light caustics, refraction
// ══════════════════════════════════════════════════════════════════════════════
export function ThemeCrystal({ color, rgb, appName, companyName, logoUrl, showLogo, showName, showProg, fillSec }: ThemeProps) {
  return (
    <div style={{ position:'absolute',inset:0,display:'flex',alignItems:'center',justifyContent:'center',background:'radial-gradient(ellipse at 40% 40%,#060d1a 0%,#020509 100%)' }}>
      {/* Ambient glow */}
      <div style={{ position:'absolute',inset:0,overflow:'hidden',filter:'blur(60px)',pointerEvents:'none' }}>
        <div style={{ position:'absolute',width:'70%',height:'70%',top:'10%',left:'10%',borderRadius:'50%',background:`radial-gradient(circle,rgba(${rgb},.2) 0%,transparent 70%)`,animation:'gl-aura 10s ease-in-out infinite' }} />
        <div style={{ position:'absolute',width:'50%',height:'50%',top:'30%',right:'5%',borderRadius:'50%',background:'radial-gradient(circle,rgba(180,220,255,.15) 0%,transparent 70%)',animation:'gl-aura 13s ease-in-out infinite 2s' }} />
      </div>
      {/* Floating crystal shards */}
      <div style={{ position:'absolute',inset:0,pointerEvents:'none' }}>
        {SHARDS.map((p,i)=>{
          const sz = p.s*40+20;
          const rot = p.delay*360;
          return (
            <div key={i} style={{
              position:'absolute',left:`${p.x*100}%`,top:`${p.y*100}%`,
              width:`${sz}px`,height:`${sz}px`,
              background:`linear-gradient(${rot}deg,rgba(${rgb},.12) 0%,rgba(180,220,255,.06) 50%,transparent 100%)`,
              border:`1px solid rgba(${rgb},.15)`,
              clipPath:'polygon(50% 0%,100% 38%,82% 100%,18% 100%,0% 38%)',
              ['--cr' as string]:`${rot}deg`,
              animation:`cr-float ${p.d*8+6}s ease-in-out infinite ${p.delay*4}s`,
              filter:'blur(.5px)',
            }} />
          );
        })}
      </div>
      {/* Light beam sweep */}
      <div style={{ position:'absolute',inset:0,overflow:'hidden',pointerEvents:'none' }}>
        <div style={{ position:'absolute',top:0,bottom:0,width:'80px',background:'linear-gradient(90deg,transparent,rgba(255,255,255,.06),transparent)',transform:'rotate(-35deg)',animation:'cr-beam 5s ease-in-out infinite 2s' }} />
        <div style={{ position:'absolute',top:0,bottom:0,width:'40px',background:'linear-gradient(90deg,transparent,rgba(255,255,255,.04),transparent)',transform:'rotate(-35deg)',animation:'cr-beam 7s ease-in-out infinite 0.5s' }} />
      </div>
      {/* Caustic light rings */}
      <div style={{ position:'absolute',left:'50%',top:'50%',pointerEvents:'none' }}>
        {[120,200,300].map((r,i)=>(
          <div key={i} style={{ position:'absolute',width:`${r*2}px`,height:`${r*2}px`,marginLeft:`-${r}px`,marginTop:`-${r}px`,borderRadius:'50%',border:`1px solid rgba(${rgb},.08)`,animation:`cr-caustic ${8+i*5}s ease-in-out infinite ${i*2}s` }} />
        ))}
      </div>
      {/* Ice particles */}
      <div style={{ position:'absolute',inset:0,pointerEvents:'none' }}>
        {SPARKLES.map((p,i)=><div key={i} style={{ position:'absolute',left:`${p.x*100}%`,top:`${p.y*100}%`,width:`${p.s*4+2}px`,height:`${p.s*4+2}px`,background:`rgba(${rgb},.5)`,clipPath:'polygon(50% 0%,61% 35%,98% 35%,68% 57%,79% 91%,50% 70%,21% 91%,32% 57%,2% 35%,39% 35%)',animation:`gl-twinkle ${p.d*6+4}s ease-in-out infinite ${p.delay*4}s` }} />)}
      </div>
      {/* Center */}
      <CenterPiece {...{color,rgb,appName,companyName,logoUrl,showLogo,showName,showProg,fillSec}}
        logoExtra={{ boxShadow:`0 0 0 1px rgba(180,220,255,.4),0 0 0 3px rgba(${rgb},.1),0 24px 70px rgba(${rgb},.4),inset 0 0 20px rgba(180,220,255,.08)` }}
        bobAnim="gl-bob 6s ease-in-out infinite 1s" />
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
//  5. FIRE — Flames, embers, heat glow
// ══════════════════════════════════════════════════════════════════════════════
export function ThemeFire({ color, rgb, appName, companyName, logoUrl, showLogo, showName, showProg, fillSec }: ThemeProps) {
  const fireRgb = '255,80,0';
  return (
    <div style={{ position:'absolute',inset:0,display:'flex',alignItems:'center',justifyContent:'center',background:'radial-gradient(ellipse at 50% 100%,#1a0500 0%,#080200 60%,#000 100%)' }}>
      {/* Fire floor glow */}
      <div style={{ position:'absolute',bottom:0,left:0,right:0,height:'45%',background:'radial-gradient(ellipse at 50% 100%,rgba(255,80,0,.35) 0%,rgba(255,30,0,.1) 50%,transparent 80%)',animation:'fi-glow 2.5s ease-in-out infinite',pointerEvents:'none' }} />
      {/* Flame columns */}
      <div style={{ position:'absolute',inset:0,overflow:'hidden',pointerEvents:'none' }}>
        {EMBERS.map((p,i)=>{
          const isLarge = i < 15;
          const sz = isLarge ? p.s*60+20 : p.s*12+4;
          return (
            <div key={i} style={{
              position:'absolute',
              left:`${p.x*100}%`,bottom:`-5%`,
              width:`${sz}px`,height:`${sz*1.8}px`,
              borderRadius:'50% 50% 20% 20%',
              background:isLarge
                ? `radial-gradient(ellipse at 50% 80%,rgba(255,200,0,${p.d*.4+.3}) 0%,rgba(255,80,0,${p.d*.3+.2}) 50%,transparent 100%)`
                : `rgba(${fireRgb},${p.d*.6+.3})`,
              filter:isLarge?`blur(${p.s*10+5}px)`:`blur(${p.s*2+1}px)`,
              animation:`fi-rise ${p.d*3+3}s ease-out infinite ${p.delay*5}s`,
            }} />
          );
        })}
      </div>
      {/* Ember sparks */}
      <div style={{ position:'absolute',inset:0,overflow:'hidden',pointerEvents:'none' }}>
        {EMBERS.slice(0,35).map((p,i)=>(
          <div key={i} style={{
            position:'absolute',left:`${p.x*100}%`,bottom:'5%',
            width:`${p.s*3+1}px`,height:`${p.s*3+1}px`,borderRadius:'50%',
            background:i%3===0?'#fff9c4':i%3===1?'#ffcc44':'#ff6622',
            boxShadow:`0 0 ${p.s*4}px ${i%3===0?'#ffee88':'#ff6600'}`,
            ['--ex' as string]:`${(p.x-.5)*200}px`,
            ['--ey' as string]:`${p.y*30}px`,
            animation:`fi-ember ${p.d*2+2}s ease-out infinite ${p.delay*6}s`,
          }} />
        ))}
      </div>
      {/* Top dark vignette */}
      <div style={{ position:'absolute',top:0,left:0,right:0,height:'40%',background:'linear-gradient(180deg,#000 0%,transparent 100%)',pointerEvents:'none' }} />
      {/* Center */}
      <CenterPiece {...{color,rgb,appName,companyName,logoUrl,showLogo,showName,showProg,fillSec}}
        logoExtra={{ boxShadow:`0 0 0 1px rgba(255,120,0,.5),0 0 0 3px rgba(255,60,0,.15),0 24px 80px rgba(255,80,0,.6),0 6px 25px rgba(0,0,0,.7)` }}
        textGlow="0 0 40px rgba(255,120,0,.8),0 0 12px rgba(255,80,0,.5),0 2px 8px rgba(0,0,0,.7)"
        bobAnim="fi-flicker 3s ease-in-out infinite" />
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
//  6. OCEAN — Deep sea, bubbles, bioluminescence, caustic light
// ══════════════════════════════════════════════════════════════════════════════
export function ThemeOcean({ color, rgb, appName, companyName, logoUrl, showLogo, showName, showProg, fillSec }: ThemeProps) {
  return (
    <div style={{ position:'absolute',inset:0,display:'flex',alignItems:'center',justifyContent:'center',background:'radial-gradient(ellipse at 50% 0%,#020f1a 0%,#010810 50%,#000508 100%)' }}>
      {/* Caustic light from above */}
      <div style={{ position:'absolute',top:0,left:0,right:0,height:'60%',pointerEvents:'none' }}>
        {[...Array(8)].map((_,i)=>(
          <div key={i} style={{ position:'absolute',top:0,left:`${10+i*12}%`,width:'3px',height:'100%',
            background:'linear-gradient(180deg,rgba(0,180,255,.15) 0%,transparent 100%)',
            transform:`rotate(${(i%2===0?1:-1)*8}deg)`,filter:'blur(3px)',
            animation:`oc-caustic ${6+i*2}s ease-in-out infinite ${i*0.7}s`,
          }} />
        ))}
      </div>
      {/* Ambient deep glow */}
      <div style={{ position:'absolute',inset:0,overflow:'hidden',filter:'blur(80px)',pointerEvents:'none' }}>
        <div style={{ position:'absolute',width:'80%',height:'80%',top:'10%',left:'10%',borderRadius:'50%',background:`radial-gradient(circle,rgba(${rgb},.2) 0%,transparent 70%)`,animation:'gl-aura 12s ease-in-out infinite' }} />
        <div style={{ position:'absolute',width:'50%',height:'50%',bottom:'20%',right:'10%',borderRadius:'50%',background:'radial-gradient(circle,rgba(0,100,200,.15) 0%,transparent 70%)',animation:'gl-aura 9s ease-in-out infinite 3s' }} />
      </div>
      {/* Bubbles rising */}
      <div style={{ position:'absolute',inset:0,overflow:'hidden',pointerEvents:'none' }}>
        {BUBBLES.map((p,i)=>{
          const sz = p.s*16+3;
          return (
            <div key={i} style={{
              position:'absolute',left:`${p.x*100}%`,bottom:`-5%`,
              width:`${sz}px`,height:`${sz}px`,borderRadius:'50%',
              background:'transparent',
              border:`1px solid rgba(0,200,255,${p.d*.3+.1})`,
              boxShadow:`inset 0 0 ${sz*.3}px rgba(0,200,255,.1),0 0 ${sz*.5}px rgba(0,200,255,.05)`,
              ['--bx' as string]:`${(p.delay-.5)*30}px`,
              animation:`oc-bubble ${p.d*8+6}s ease-in-out infinite ${p.delay*8}s`,
            }} />
          );
        })}
      </div>
      {/* Bioluminescent particles */}
      <div style={{ position:'absolute',inset:0,pointerEvents:'none' }}>
        {SPARKLES.map((p,i)=><div key={i} style={{ position:'absolute',left:`${p.x*100}%`,top:`${p.y*100}%`,width:`${p.s*5+2}px`,height:`${p.s*5+2}px`,borderRadius:'50%',background:i%3===0?'rgba(0,255,200,.7)':i%3===1?`rgba(${rgb},.7)`:'rgba(0,150,255,.7)',filter:`blur(${p.s*2}px)`,animation:`oc-blink ${p.d*5+3}s ease-in-out infinite ${p.delay*4}s` }} />)}
      </div>
      {/* Wave bands */}
      <div style={{ position:'absolute',left:0,right:0,pointerEvents:'none' }}>
        {[30,50,70].map((top,i)=>(
          <div key={i} style={{ position:'absolute',top:`${top}%`,left:0,right:0,height:'80px',
            background:`linear-gradient(90deg,transparent,rgba(0,200,255,.04),rgba(${rgb},.03),transparent)`,
            animation:`oc-wave ${8+i*3}s ease-in-out infinite ${i}s`,
          }} />
        ))}
      </div>
      {/* Center */}
      <CenterPiece {...{color,rgb,appName,companyName,logoUrl,showLogo,showName,showProg,fillSec}}
        logoExtra={{ boxShadow:`0 0 0 1px rgba(0,200,255,.4),0 0 0 3px rgba(0,150,255,.12),0 24px 70px rgba(0,150,255,.4),0 6px 25px rgba(0,0,0,.6)` }}
        textGlow="0 0 40px rgba(0,200,255,.7),0 2px 8px rgba(0,0,0,.6)"
        bobAnim="gl-bob 7s ease-in-out infinite 1s" />
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
//  7. PREMIUM RINGS — Energy rings + light sweeps
// ══════════════════════════════════════════════════════════════════════════════
const RING_PTS = cloud(20, 55);
export function ThemeRings({ color, rgb, appName, companyName, logoUrl, showLogo, showName, showProg, fillSec }: ThemeProps) {
  const rings = [
    { r: 90,  dur: '7s',  dir: 'gl-spin',  op: .7,  w: 2,    col: `rgba(${rgb},1)`   },
    { r: 130, dur: '11s', dir: 'gl-spinR', op: .5,  w: 1.5,  col: `rgba(${rgb},.75)` },
    { r: 175, dur: '16s', dir: 'gl-spin',  op: .35, w: 1,    col: `rgba(${rgb},.5)`  },
    { r: 225, dur: '22s', dir: 'gl-spinR', op: .2,  w: 1,    col: `rgba(${rgb},.35)` },
    { r: 280, dur: '30s', dir: 'gl-spin',  op: .12, w: 1,    col: `rgba(${rgb},.2)`  },
  ];
  return (
    <div style={{ position:'absolute',inset:0,display:'flex',alignItems:'center',justifyContent:'center',background:`radial-gradient(ellipse at 50% 50%,#100018 0%,#060008 55%,#020005 100%)` }}>
      {/* Deep glow blobs */}
      <div style={{ position:'absolute',inset:0,overflow:'hidden',filter:'blur(100px)',pointerEvents:'none' }}>
        <div style={{ position:'absolute',width:'70%',height:'70%',top:'15%',left:'15%',borderRadius:'50%',background:`radial-gradient(circle,rgba(${rgb},.45) 0%,transparent 65%)`,animation:'gl-pulsate 4s ease-in-out infinite' }} />
        <div style={{ position:'absolute',width:'40%',height:'40%',top:'30%',left:'30%',borderRadius:'50%',background:'radial-gradient(circle,rgba(160,80,255,.3) 0%,transparent 70%)',animation:'gl-pulsate 6s ease-in-out infinite 2s' }} />
      </div>
      {/* Energy rings */}
      <div style={{ position:'absolute',left:'50%',top:'50%',pointerEvents:'none' }}>
        {rings.map((rg,i)=>(
          <div key={i} style={{
            position:'absolute',
            width:`${rg.r*2}px`,height:`${rg.r*2}px`,
            marginLeft:`-${rg.r}px`,marginTop:`-${rg.r}px`,
            borderRadius:'50%',
            border:`${rg.w}px solid ${rg.col}`,
            boxShadow:`0 0 ${8+i*4}px ${rg.col},inset 0 0 ${6+i*3}px ${rg.col.replace(')',',0.3)')}`,
            animation:`${rg.dir} ${rg.dur} linear infinite`,
            opacity: rg.op,
          }}>
            {/* Ring node (glowing dot on ring) */}
            {i < 3 && (
              <div style={{ position:'absolute',top:'-5px',left:'50%',marginLeft:'-5px',width:'10px',height:'10px',borderRadius:'50%',
                background:`rgba(${rgb},1)`,boxShadow:`0 0 12px 4px rgba(${rgb},.7)` }} />
            )}
          </div>
        ))}
      </div>
      {/* Orbiting energy dots */}
      <div style={{ position:'absolute',left:'50%',top:'50%',pointerEvents:'none' }}>
        {RING_PTS.map((p,i)=>(
          <div key={i} style={{
            position:'absolute',top:'50%',left:'50%',
            width:`${p.s*6+2}px`,height:`${p.s*6+2}px`,
            marginLeft:`-${p.s*3+1}px`,marginTop:`-${p.s*3+1}px`,
            ['--rd' as string]:`${70+p.d*180}px`,
            animation:`rg-dot ${p.d*8+5}s linear infinite ${p.delay*6}s`,
          }}>
            <div style={{ width:'100%',height:'100%',borderRadius:'50%',background:`rgba(${rgb},${p.s*.5+.3})`,boxShadow:`0 0 ${p.s*8}px rgba(${rgb},.5)` }} />
          </div>
        ))}
      </div>
      {/* Light sweeps */}
      <div style={{ position:'absolute',inset:0,overflow:'hidden',pointerEvents:'none' }}>
        {[{dur:'4s',del:'0s',w:120,op:.09},{dur:'6s',del:'2.5s',w:60,op:.06}].map((sw,i)=>(
          <div key={i} style={{ position:'absolute',top:0,bottom:0,left:0,width:`${sw.w}px`,
            background:`linear-gradient(90deg,transparent,rgba(${rgb},${sw.op}),rgba(255,255,255,${sw.op*.5}),transparent)`,
            animation:`rg-sweep ${sw.dur} ease-in-out infinite ${sw.del}`,
          }} />
        ))}
      </div>
      {/* Ripples */}
      <div style={{ position:'absolute',left:'50%',top:'50%',pointerEvents:'none' }}>
        {[0,.9,1.8].map(d=>(
          <div key={d} style={{ position:'absolute',width:'180px',height:'180px',border:`1.5px solid rgba(${rgb},.6)`,borderRadius:'50%',
            animation:`gl-ripple 3s ease-out infinite ${d}s` }} />
        ))}
      </div>
      <CenterPiece {...{color,rgb,appName,companyName,logoUrl,showLogo,showName,showProg,fillSec}}
        logoExtra={{ boxShadow:`0 0 0 1px rgba(${rgb},.6),0 0 0 4px rgba(${rgb},.15),0 0 80px rgba(${rgb},.7),0 6px 30px rgba(0,0,0,.8)` }}
        bobAnim="gl-pulsate 3.5s ease-in-out infinite 0.5s" />
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
//  8. GLASS CARD — Glassmorphism 3D card + rotating energy circle
// ══════════════════════════════════════════════════════════════════════════════
export function ThemeGlass({ color, rgb, appName, companyName, logoUrl, showLogo, showName, showProg, fillSec }: ThemeProps) {
  const segments = 12;
  return (
    <div style={{ position:'absolute',inset:0,display:'flex',alignItems:'center',justifyContent:'center',background:`linear-gradient(160deg,#060c18 0%,#04080f 50%,#020509 100%)` }}>
      {/* Background glow blobs */}
      <div style={{ position:'absolute',inset:0,overflow:'hidden',filter:'blur(90px)',pointerEvents:'none' }}>
        <div style={{ position:'absolute',width:'60%',height:'60%',top:'20%',left:'20%',borderRadius:'50%',background:`radial-gradient(circle,rgba(${rgb},.3) 0%,transparent 70%)`,animation:'gl-aura 8s ease-in-out infinite' }} />
        <div style={{ position:'absolute',width:'40%',height:'40%',top:'35%',left:'10%',borderRadius:'50%',background:'radial-gradient(circle,rgba(56,189,248,.2) 0%,transparent 70%)',animation:'gl-aura 11s ease-in-out infinite 3s' }} />
        <div style={{ position:'absolute',width:'35%',height:'35%',top:'25%',right:'10%',borderRadius:'50%',background:'radial-gradient(circle,rgba(192,132,252,.2) 0%,transparent 70%)',animation:'gl-aura 9s ease-in-out infinite 5s' }} />
      </div>
      {/* Big orbit ring */}
      <div style={{ position:'absolute',left:'50%',top:'50%',pointerEvents:'none' }}>
        {/* Outer orbit container */}
        <div style={{ position:'absolute',width:'360px',height:'360px',marginLeft:'-180px',marginTop:'-180px',animation:'gc-orbitBig 8s linear infinite' }}>
          {/* Dashed orbit ring */}
          <div style={{ position:'absolute',inset:0,borderRadius:'50%',border:`1.5px dashed rgba(${rgb},.3)` }} />
          {/* Segments on ring */}
          {Array.from({length:segments}).map((_,i)=>{
            const angle = (i/segments)*360;
            const isMain = i%3===0;
            const sz = isMain ? 10 : 5;
            return (
              <div key={i} style={{ position:'absolute',top:'50%',left:'50%',
                transform:`rotate(${angle}deg) translateX(180px) rotate(-${angle}deg)`,
                marginLeft:`-${sz/2}px`,marginTop:`-${sz/2}px`,
                width:`${sz}px`,height:`${sz}px`,borderRadius:'50%',
                background:`rgba(${rgb},${isMain?1:.5})`,
                boxShadow:`0 0 ${isMain?12:6}px rgba(${rgb},${isMain?.7:.3})`,
              }} />
            );
          })}
        </div>
        {/* Inner orbit (reverse) */}
        <div style={{ position:'absolute',width:'260px',height:'260px',marginLeft:'-130px',marginTop:'-130px',animation:'gc-orbitBig 13s linear infinite reverse' }}>
          <div style={{ position:'absolute',inset:0,borderRadius:'50%',border:`1px solid rgba(${rgb},.18)` }} />
          {Array.from({length:6}).map((_,i)=>(
            <div key={i} style={{ position:'absolute',top:'50%',left:'50%',
              transform:`rotate(${i*60}deg) translateX(130px) rotate(-${i*60}deg)`,
              marginLeft:'-3px',marginTop:'-3px',
              width:'6px',height:'6px',borderRadius:'50%',
              background:`rgba(${rgb},.6)`,
              boxShadow:`0 0 8px rgba(${rgb},.4)`,
            }} />
          ))}
        </div>
      </div>
      {/* Glassmorphism card */}
      <motion.div
        initial={{ opacity:0,scale:.7,rotateX:30,y:30 }} animate={{ opacity:1,scale:1,rotateX:0,y:0 }}
        transition={{ duration:1.1,ease:[0.16,1,0.3,1],delay:.2 }}
        style={{ position:'relative',padding:'36px 48px',borderRadius:28,
          background:'rgba(255,255,255,.04)',
          backdropFilter:'blur(24px)',WebkitBackdropFilter:'blur(24px)',
          border:`1px solid rgba(${rgb},.25)`,
          boxShadow:`0 8px 60px rgba(0,0,0,.6),0 0 0 1px rgba(${rgb},.15),inset 0 1px 0 rgba(255,255,255,.08)`,
          animation:'gc-tilt 6s ease-in-out infinite 1s',
          display:'flex',flexDirection:'column',alignItems:'center',gap:22,
        }}>
        {/* Card shine */}
        <div style={{ position:'absolute',inset:0,overflow:'hidden',borderRadius:28,pointerEvents:'none' }}>
          <div style={{ position:'absolute',top:0,bottom:0,width:'60px',
            background:'linear-gradient(90deg,transparent,rgba(255,255,255,.06),transparent)',
            animation:'gc-shine 3.5s ease-in-out infinite 1.5s' }} />
        </div>
        {showLogo && <LogoBox color={color} rgb={rgb} logoUrl={logoUrl} appName={appName} />}
        {showName && <NameBlock appName={appName} companyName={companyName} rgb={rgb} />}
        {showProg && <ProgBar color={color} rgb={rgb} fillSec={fillSec} />}
      </motion.div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
//  9. 3D PREMIUM — Cinematic beams + 200 particles + dual rings
// ══════════════════════════════════════════════════════════════════════════════
const PREMIUM_PTS = cloud(200, 77);
export function ThemePremium({ color, rgb, appName, companyName, logoUrl, showLogo, showName, showProg, fillSec }: ThemeProps) {
  return (
    <div style={{ position:'absolute',inset:0,display:'flex',alignItems:'center',justifyContent:'center',background:`radial-gradient(ellipse at 50% 60%,#0a0412 0%,#04020a 55%,#010005 100%)` }}>
      {/* Ambient glow */}
      <div style={{ position:'absolute',inset:0,overflow:'hidden',filter:'blur(80px)',pointerEvents:'none' }}>
        <div style={{ position:'absolute',width:'80%',height:'80%',top:'10%',left:'10%',borderRadius:'50%',background:`radial-gradient(circle,rgba(${rgb},.35) 0%,transparent 60%)`,animation:'gl-pulsate 4s ease-in-out infinite' }} />
        <div style={{ position:'absolute',width:'50%',height:'50%',top:'25%',left:'25%',borderRadius:'50%',background:'radial-gradient(circle,rgba(244,114,182,.25) 0%,transparent 70%)',animation:'gl-pulsate 6s ease-in-out infinite 2s' }} />
      </div>
      {/* 200 micro particles drifting */}
      <div style={{ position:'absolute',inset:0,pointerEvents:'none',overflow:'hidden' }}>
        {PREMIUM_PTS.map((p,i)=>(
          <div key={i} style={{
            position:'absolute',
            left:`${p.x*100}%`,top:`${p.y*100}%`,
            ['--px' as string]:`${(p.x-.5)*80}vw`,
            ['--py' as string]:`${(p.y-.5)*80}vh`,
            width:`${p.s*3+1}px`,height:`${p.s*3+1}px`,
            borderRadius:'50%',
            background:i%3===0?`rgba(${rgb},${p.d*.6+.2})`:i%3===1?`rgba(244,114,182,${p.d*.5+.15})`:`rgba(255,255,255,${p.d*.3+.05})`,
            boxShadow:i%4===0?`0 0 ${p.s*6}px rgba(${rgb},.4)`:'none',
            animation:`pr-ptcl ${p.d*8+5}s ease-in-out infinite ${p.delay*9}s`,
          }} />
        ))}
      </div>
      {/* Dual rings */}
      <div style={{ position:'absolute',left:'50%',top:'50%',pointerEvents:'none' }}>
        {[{r:160,dur:'14s',dir:'gl-spin',col:rgb},{r:240,dur:'22s',dir:'gl-spinR',col:'244,114,182'}].map((rg,i)=>(
          <div key={i} style={{
            position:'absolute',width:`${rg.r*2}px`,height:`${rg.r*2}px`,
            marginLeft:`-${rg.r}px`,marginTop:`-${rg.r}px`,
            borderRadius:'50%',
            border:`1.5px solid rgba(${rg.col},.25)`,
            boxShadow:`0 0 20px rgba(${rg.col},.1),inset 0 0 15px rgba(${rg.col},.05)`,
            animation:`${rg.dir} ${rg.dur} linear infinite`,
          }}>
            <div style={{ position:'absolute',top:'-5px',left:'50%',marginLeft:'-5px',width:'10px',height:'10px',borderRadius:'50%',background:`rgba(${rg.col},1)`,boxShadow:`0 0 14px 5px rgba(${rg.col},.6)` }} />
            <div style={{ position:'absolute',bottom:'-5px',left:'50%',marginLeft:'-5px',width:'6px',height:'6px',borderRadius:'50%',background:`rgba(${rg.col},.7)`,boxShadow:`0 0 10px rgba(${rg.col},.5)` }} />
          </div>
        ))}
      </div>
      {/* Cinematic light beams */}
      <div style={{ position:'absolute',inset:0,overflow:'hidden',pointerEvents:'none' }}>
        {[
          { left:'30%', w:'200px', angle:'-60deg', dur:'3.5s', del:'0s',   op:.06 },
          { left:'55%', w:'120px', angle:'-55deg', dur:'4s',   del:'1.2s', op:.04 },
          { left:'70%', w:'80px',  angle:'-50deg', dur:'5s',   del:'2.5s', op:.03 },
        ].map((bm,i)=>(
          <div key={i} style={{ position:'absolute',top:0,bottom:0,left:bm.left,width:bm.w,
            background:`linear-gradient(90deg,transparent,rgba(${rgb},${bm.op}),rgba(255,255,255,${bm.op*.6}),transparent)`,
            transform:`skewX(${bm.angle})`,
            animation:`pr-beam ${bm.dur} ease-in-out infinite ${bm.del}`,
          }} />
        ))}
      </div>
      {/* Stars */}
      <div style={{ position:'absolute',inset:0,pointerEvents:'none' }}>
        {STARS.slice(0,40).map((p,i)=><div key={i} style={{ position:'absolute',left:`${p.x*100}%`,top:`${p.y*100}%`,width:`${p.s*2+1}px`,height:`${p.s*2+1}px`,borderRadius:'50%',background:`rgba(255,255,255,${p.d*.4+.1})`,animation:`gl-twinkle ${p.d*6+4}s ease-in-out infinite ${p.delay*5}s` }} />)}
      </div>
      <CenterPiece {...{color,rgb,appName,companyName,logoUrl,showLogo,showName,showProg,fillSec}}
        logoExtra={{ boxShadow:`0 0 0 1px rgba(${rgb},.5),0 0 0 4px rgba(${rgb},.12),0 0 90px rgba(${rgb},.65),0 6px 30px rgba(0,0,0,.8)` }}
        textGlow={`0 0 40px rgba(${rgb},.8),0 0 15px rgba(244,114,182,.4),0 2px 8px rgba(0,0,0,.7)`}
        bobAnim="gl-bob 5s ease-in-out infinite 1s" />
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// 10. HOLOGRAM — Moving grid + holographic ring + scan line
// ══════════════════════════════════════════════════════════════════════════════
export function ThemeHolo({ color, rgb, appName, companyName, logoUrl, showLogo, showName, showProg, fillSec }: ThemeProps) {
  const holoC = '0,245,212';
  return (
    <div style={{ position:'absolute',inset:0,display:'flex',alignItems:'center',justifyContent:'center',background:'radial-gradient(ellipse at 50% 40%,#010e0a 0%,#020a08 50%,#010504 100%)' }}>
      {/* Perspective grid */}
      <div style={{ position:'absolute',inset:0,pointerEvents:'none',
        backgroundImage:`linear-gradient(rgba(${holoC},.08) 1px,transparent 1px),linear-gradient(90deg,rgba(${holoC},.08) 1px,transparent 1px)`,
        backgroundSize:'60px 60px',
        transform:'perspective(600px) rotateX(55deg) scaleY(2.4)',
        transformOrigin:'50% 120%',
        animation:'hl-gridPan 5s linear infinite',
      }} />
      {/* Scan line */}
      <div style={{ position:'absolute',left:0,right:0,height:'3px',overflow:'hidden',pointerEvents:'none',
        background:`linear-gradient(90deg,transparent 0%,rgba(${holoC},.9) 30%,rgba(255,255,255,.7) 50%,rgba(${holoC},.9) 70%,transparent 100%)`,
        boxShadow:`0 0 20px rgba(${holoC},.8),0 0 40px rgba(${holoC},.4)`,
        animation:'hl-scan 2.5s linear infinite',
      }} />
      {/* Holographic rings */}
      <div style={{ position:'absolute',left:'50%',top:'50%',pointerEvents:'none' }}>
        {[120,180,250].map((r,i)=>(
          <div key={i} style={{
            position:'absolute',width:`${r*2}px`,height:`${r*2}px`,
            marginLeft:`-${r}px`,marginTop:`-${r}px`,
            borderRadius:'50%',
            border:`${i===0?2:1}px solid rgba(${holoC},${i===0?.8:.3})`,
            boxShadow:`0 0 ${10+i*8}px rgba(${holoC},${i===0?.5:.15}),inset 0 0 ${8+i*5}px rgba(${holoC},${i===0?.2:.08})`,
            animation:`hl-ring ${5+i*3}s ease-in-out infinite ${i}s`,
          }}>
            {/* Ring nodes */}
            {i===0 && [0,90,180,270].map(deg=>(
              <div key={deg} style={{ position:'absolute',top:'50%',left:'50%',
                transform:`rotate(${deg}deg) translateX(${r}px)`,
                marginLeft:'-5px',marginTop:'-5px',
                width:'10px',height:'10px',borderRadius:'50%',
                background:`rgba(${holoC},1)`,boxShadow:`0 0 12px rgba(${holoC},.8)`,
              }} />
            ))}
          </div>
        ))}
      </div>
      {/* Ambient glow */}
      <div style={{ position:'absolute',inset:0,overflow:'hidden',filter:'blur(70px)',pointerEvents:'none' }}>
        <div style={{ position:'absolute',width:'60%',height:'60%',top:'20%',left:'20%',borderRadius:'50%',background:`radial-gradient(circle,rgba(${holoC},.3) 0%,transparent 70%)`,animation:'gl-pulsate 5s ease-in-out infinite' }} />
      </div>
      {/* Corner brackets */}
      {[{t:16,l:16},{t:16,r:16},{b:16,l:16},{b:16,r:16}].map((pos,i)=>{
        const dirs:[string,string][] = [['top','left'],['top','right'],['bottom','left'],['bottom','right']];
        const [v,h] = dirs[i];
        return (
          <div key={i} style={{ position:'absolute',[v]:20,[h]:20,width:24,height:24,pointerEvents:'none',
            borderTop:   v==='top'    ?`2px solid rgba(${holoC},.6)`:'none',
            borderBottom:v==='bottom' ?`2px solid rgba(${holoC},.6)`:'none',
            borderLeft:  h==='left'   ?`2px solid rgba(${holoC},.6)`:'none',
            borderRight: h==='right'  ?`2px solid rgba(${holoC},.6)`:'none',
            animation:`hl-corner ${2+i*.5}s ease-in-out infinite ${i*.3}s`,
          }} />
        );
      })}
      {/* HUD elements */}
      <div style={{ position:'absolute',top:24,left:'50%',transform:'translateX(-50%)',pointerEvents:'none',animation:'hl-flicker 5s ease-in-out infinite 2s' }}>
        <div style={{ padding:'3px 14px',border:`1px solid rgba(${holoC},.3)`,borderRadius:4,
          fontSize:9,fontFamily:'monospace',fontWeight:700,letterSpacing:'.2em',color:`rgba(${holoC},.8)`,
          background:`rgba(${holoC},.04)` }}>
          SYS.INIT ▸ WORKFORCE
        </div>
      </div>
      <CenterPiece {...{color,rgb,appName,companyName,logoUrl,showLogo,showName,showProg,fillSec}}
        logoExtra={{ background:`rgba(${holoC},.06)`,border:`1.5px solid rgba(${holoC},.4)`,borderRadius:20,
          boxShadow:`0 0 0 1px rgba(${holoC},.3),0 0 50px rgba(${holoC},.4),inset 0 0 20px rgba(${holoC},.05)` }}
        textGlow={`0 0 30px rgba(${holoC},.9),0 2px 8px rgba(0,0,0,.7)`}
        bobAnim="gl-pulsate 4s ease-in-out infinite 0.5s" />
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// 11. PARTICLES 3D — 1200 gathering particles + flash + logo pop
// ══════════════════════════════════════════════════════════════════════════════
const PART_PTS = cloud(1200, 13);
export function ThemeParticles({ color, rgb, appName, companyName, logoUrl, showLogo, showName, showProg, fillSec }: ThemeProps) {
  return (
    <div style={{ position:'absolute',inset:0,display:'flex',alignItems:'center',justifyContent:'center',background:`radial-gradient(ellipse at 50% 50%,#060412 0%,#03020a 55%,#010005 100%)` }}>
      {/* Ambient deep glow */}
      <div style={{ position:'absolute',inset:0,overflow:'hidden',filter:'blur(80px)',pointerEvents:'none' }}>
        <div style={{ position:'absolute',width:'60%',height:'60%',top:'20%',left:'20%',borderRadius:'50%',background:`radial-gradient(circle,rgba(${rgb},.4) 0%,transparent 70%)`,animation:'gl-pulsate 5s ease-in-out infinite' }} />
      </div>
      {/* 1200 gathering particles */}
      <div style={{ position:'absolute',inset:0,pointerEvents:'none',overflow:'hidden' }}>
        {PART_PTS.map((p,i)=>(
          <div key={i} style={{
            position:'absolute',
            left:`${p.x*100}%`,top:`${p.y*100}%`,
            ['--px' as string]:`${(p.x-.5)*120}vw`,
            ['--py' as string]:`${(p.y-.5)*120}vh`,
            width:`${p.s*3+.5}px`,height:`${p.s*3+.5}px`,
            borderRadius:'50%',
            background:
              i%4===0?`rgba(${rgb},${p.d*.7+.2})`:
              i%4===1?`rgba(255,255,255,${p.d*.4+.1})`:
              i%4===2?`rgba(200,150,255,${p.d*.5+.15})`:`rgba(${rgb},${p.d*.3+.1})`,
            boxShadow:i%6===0?`0 0 ${p.s*5}px rgba(${rgb},.5)`:'none',
            animation:`pt-gather ${p.d*4+3}s ease-in-out infinite ${p.delay*8}s`,
          }} />
        ))}
      </div>
      {/* Flash burst */}
      <motion.div
        initial={{ opacity:0,scale:.5 }} animate={{ opacity:[0,1,0],scale:[.5,1.8,1] }}
        transition={{ duration:1.2,delay:.4,ease:[0.16,1,0.3,1] }}
        style={{ position:'absolute',width:'100%',height:'100%',
          background:`radial-gradient(circle at 50% 50%,rgba(${rgb},.8) 0%,transparent 50%)`,
          pointerEvents:'none' }} />
      {/* Logo pop */}
      <motion.div
        initial={{ opacity:0,scale:0,rotate:-25 }} animate={{ opacity:1,scale:1,rotate:0 }}
        transition={{ duration:.9,delay:.6,ease:[0.34,1.56,0.64,1] }}
        style={{ position:'relative',display:'flex',flexDirection:'column',alignItems:'center',gap:24 }}>
        <div style={{ position:'absolute',top:'50%',left:'50%',transform:'translate(-50%,-55%)',width:280,height:280,borderRadius:'50%',background:`radial-gradient(circle,rgba(${rgb},.5) 0%,transparent 70%)`,filter:'blur(40px)',animation:'gl-pulsate 3s ease-in-out infinite',pointerEvents:'none' }} />
        {showLogo && <LogoBox color={color} rgb={rgb} logoUrl={logoUrl} appName={appName}
          extra={{ boxShadow:`0 0 0 1px rgba(${rgb},.5),0 0 0 4px rgba(${rgb},.15),0 0 100px rgba(${rgb},.8),0 6px 30px rgba(0,0,0,.8)` }} />}
        {showName && <NameBlock appName={appName} companyName={companyName} rgb={rgb} />}
        {showProg && <ProgBar color={color} rgb={rgb} fillSec={fillSec} />}
      </motion.div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// 12. SPACE 3D — Stars + light orb + Z-depth orbits + parallax
// ══════════════════════════════════════════════════════════════════════════════
const SPACE_PTS = cloud(120, 91);
export function ThemeSpace({ color, rgb, appName, companyName, logoUrl, showLogo, showName, showProg, fillSec }: ThemeProps) {
  return (
    <div style={{ position:'absolute',inset:0,display:'flex',alignItems:'center',justifyContent:'center',background:'radial-gradient(ellipse at 50% 50%,#020408 0%,#010206 55%,#000103 100%)' }}>
      {/* Nebula blobs */}
      <div style={{ position:'absolute',inset:0,overflow:'hidden',filter:'blur(90px)',pointerEvents:'none' }}>
        {[{c:`rgba(${rgb},.25)`,t:'20%',l:'20%',s:'60%'},{c:'rgba(80,40,180,.2)',t:'40%',l:'40%',s:'40%'},{c:`rgba(${rgb},.15)`,t:'55%',l:'55%',s:'35%'}].map((b,i)=>(
          <div key={i} style={{ position:'absolute',width:b.s,height:b.s,top:b.t,left:b.l,borderRadius:'50%',background:b.c,animation:`gl-aura ${8+i*4}s ease-in-out infinite ${i*3}s` }} />
        ))}
      </div>
      {/* Deep stars (3 layers for parallax) */}
      {[{pts:SPACE_PTS.slice(0,40),speed:3},{pts:SPACE_PTS.slice(40,80),speed:2},{pts:SPACE_PTS.slice(80,120),speed:1.5}].map((layer,li)=>(
        <div key={li} style={{ position:'absolute',inset:0,pointerEvents:'none' }}>
          {layer.pts.map((p,i)=>(
            <div key={i} style={{
              position:'absolute',left:`${p.x*100}%`,top:`${p.y*100}%`,
              width:`${p.s*(li+1)*1.5+.5}px`,height:`${p.s*(li+1)*1.5+.5}px`,
              borderRadius:'50%',
              background:`rgba(255,255,255,${p.d*.6+.1})`,
              boxShadow:li===0?`0 0 ${p.s*4}px rgba(${rgb},.3)`:'none',
              animation:`gl-twinkle ${p.d*6+4}s ease-in-out infinite ${p.delay*5+li}s`,
            }} />
          ))}
        </div>
      ))}
      {/* Z-axis orbital rings (3D perspective) */}
      <div style={{ position:'absolute',left:'50%',top:'50%',pointerEvents:'none',perspective:'800px' }}>
        {[
          {rx:280,ry:80,r:`${rgb}`,dur:'12s'},
          {rx:200,ry:55,r:'150,100,255',dur:'18s'},
          {rx:150,ry:40,r:`${rgb}`,dur:'8s'},
        ].map((rg,i)=>(
          <div key={i} style={{
            position:'absolute',
            width:`${rg.rx*2}px`,height:`${rg.ry*2}px`,
            marginLeft:`-${rg.rx}px`,marginTop:`-${rg.ry}px`,
            borderRadius:'50%',
            border:`1px solid rgba(${rg.r},.2)`,
            boxShadow:`0 0 15px rgba(${rg.r},.1)`,
            animation:`${i%2===0?'gl-spin':'gl-spinR'} ${rg.dur} linear infinite`,
            transform:`rotateX(${65+i*5}deg)`,
          }}>
            {/* Orbital body */}
            <div style={{ position:'absolute',top:'-5px',left:'50%',marginLeft:'-5px',width:'10px',height:'10px',borderRadius:'50%',
              background:`rgba(${rg.r},1)`,boxShadow:`0 0 12px 4px rgba(${rg.r},.6)` }} />
          </div>
        ))}
      </div>
      {/* Central light orb */}
      <div style={{ position:'absolute',left:'50%',top:'50%',transform:'translate(-50%,-50%)',pointerEvents:'none' }}>
        <div style={{ width:'80px',height:'80px',borderRadius:'50%',
          background:`radial-gradient(circle,rgba(255,255,255,.9) 0%,rgba(${rgb},1) 40%,transparent 70%)`,
          boxShadow:`0 0 0 20px rgba(${rgb},.15),0 0 0 50px rgba(${rgb},.08),0 0 80px 30px rgba(${rgb},.4)`,
          animation:'sp-orb 4s ease-in-out infinite',
        }} />
      </div>
      {/* Spiral orbiting particles */}
      <div style={{ position:'absolute',left:'50%',top:'50%',pointerEvents:'none' }}>
        {SPARKLES.map((p,i)=>(
          <div key={i} style={{
            position:'absolute',top:'50%',left:'50%',
            ['--sr' as string]:`${p.d*150+50}px`,
            animation:`sp-spiral ${p.d*10+6}s linear infinite ${p.delay*8}s`,
            marginLeft:'-3px',marginTop:'-3px',
          }}>
            <div style={{ width:`${p.s*4+2}px`,height:`${p.s*4+2}px`,borderRadius:'50%',
              background:`rgba(${rgb},${p.s*.5+.3})`,boxShadow:`0 0 ${p.s*6}px rgba(${rgb},.4)` }} />
          </div>
        ))}
      </div>
      <CenterPiece {...{color,rgb,appName,companyName,logoUrl,showLogo,showName,showProg,fillSec}}
        logoExtra={{ boxShadow:`0 0 0 1px rgba(${rgb},.5),0 0 0 4px rgba(${rgb},.12),0 0 100px rgba(${rgb},.6),0 6px 30px rgba(0,0,0,.8)` }}
        bobAnim="sp-orb 5s ease-in-out infinite 0.5s" />
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// 13. GOLDEN LUXURY — Red curtain + spotlight + golden platform + dust
// ══════════════════════════════════════════════════════════════════════════════
const DUST_PTS = cloud(60, 37);
export function ThemeGolden({ color, rgb, appName, companyName, logoUrl, showLogo, showName, showProg, fillSec }: ThemeProps) {
  const goldRgb = '251,191,36';
  return (
    <div style={{ position:'absolute',inset:0,display:'flex',alignItems:'center',justifyContent:'center',background:'radial-gradient(ellipse at 50% 60%,#160800 0%,#0c0400 50%,#050200 100%)' }}>
      {/* Red curtain panels (animate open) */}
      <div style={{ position:'absolute',inset:0,overflow:'hidden',pointerEvents:'none',zIndex:1 }}>
        {/* Left curtain */}
        <motion.div
          initial={{ x:0 }} animate={{ x:'-105%' }} transition={{ duration:1.4,delay:.3,ease:[0.16,1,0.3,1] }}
          style={{ position:'absolute',top:0,bottom:0,left:0,width:'55%',
            background:'linear-gradient(90deg,#4a0000 0%,#6b0000 40%,#3a0000 70%,#200000 100%)',
            boxShadow:'8px 0 40px rgba(0,0,0,.8)',
          }}>
          {/* Curtain folds */}
          {[10,22,34,46].map((l,i)=>(
            <div key={i} style={{ position:'absolute',top:0,bottom:0,left:`${l}%`,width:'8%',
              background:'linear-gradient(90deg,rgba(0,0,0,.3),transparent,rgba(0,0,0,.2))',
            }} />
          ))}
          {/* Gold trim */}
          <div style={{ position:'absolute',top:0,bottom:0,right:0,width:'4px',background:'linear-gradient(180deg,#fbbf24,#d97706,#fbbf24)',boxShadow:'0 0 20px rgba(251,191,36,.6)' }} />
        </motion.div>
        {/* Right curtain */}
        <motion.div
          initial={{ x:0 }} animate={{ x:'105%' }} transition={{ duration:1.4,delay:.3,ease:[0.16,1,0.3,1] }}
          style={{ position:'absolute',top:0,bottom:0,right:0,width:'55%',
            background:'linear-gradient(270deg,#4a0000 0%,#6b0000 40%,#3a0000 70%,#200000 100%)',
            boxShadow:'-8px 0 40px rgba(0,0,0,.8)',
          }}>
          {[10,22,34,46].map((l,i)=>(
            <div key={i} style={{ position:'absolute',top:0,bottom:0,right:`${l}%`,width:'8%',
              background:'linear-gradient(270deg,rgba(0,0,0,.3),transparent,rgba(0,0,0,.2))',
            }} />
          ))}
          <div style={{ position:'absolute',top:0,bottom:0,left:0,width:'4px',background:'linear-gradient(180deg,#fbbf24,#d97706,#fbbf24)',boxShadow:'0 0 20px rgba(251,191,36,.6)' }} />
        </motion.div>
      </div>
      {/* Spotlight cone */}
      <div style={{ position:'absolute',top:0,left:'50%',transform:'translateX(-50%)',pointerEvents:'none' }}>
        <div style={{ width:'2px',height:'0',borderLeft:'100px solid transparent',borderRight:'100px solid transparent',borderTop:'70vh solid rgba(255,220,100,.05)',filter:'blur(20px)',animation:'gd-spot 3s ease-in-out infinite' }} />
      </div>
      <div style={{ position:'absolute',top:0,left:'50%',transform:'translateX(-50%)',pointerEvents:'none' }}>
        <div style={{ width:'2px',height:'0',borderLeft:'50px solid transparent',borderRight:'50px solid transparent',borderTop:'70vh solid rgba(255,240,150,.04)',filter:'blur(10px)' }} />
      </div>
      {/* Spotlight source */}
      <div style={{ position:'absolute',top:8,left:'50%',transform:'translateX(-50%)',width:'60px',height:'8px',borderRadius:4,
        background:'rgba(255,240,200,.9)',boxShadow:'0 0 30px 10px rgba(255,220,100,.6)',pointerEvents:'none',animation:'gd-spot 3s ease-in-out infinite' }} />
      {/* Golden platform */}
      <div style={{ position:'absolute',bottom:'12%',left:'50%',transform:'translateX(-50%)',pointerEvents:'none' }}>
        <div style={{ width:'220px',height:'12px',borderRadius:'50%',
          background:'linear-gradient(90deg,transparent,rgba(251,191,36,.3),rgba(251,191,36,.6),rgba(251,191,36,.3),transparent)',
          filter:'blur(4px)',animation:'gd-platform 3s ease-in-out infinite' }} />
      </div>
      {/* Dust particles */}
      <div style={{ position:'absolute',inset:0,overflow:'hidden',pointerEvents:'none' }}>
        {DUST_PTS.map((p,i)=>(
          <div key={i} style={{
            position:'absolute',
            left:`${p.x*100}%`,bottom:`${p.y*40+5}%`,
            width:`${p.s*3+1}px`,height:`${p.s*3+1}px`,
            borderRadius:'50%',
            background:`rgba(${goldRgb},${p.d*.4+.1})`,
            boxShadow:`0 0 ${p.s*4}px rgba(${goldRgb},.3)`,
            ['--dx' as string]:`${(p.x-.5)*50}px`,
            ['--dy' as string]:`${p.d*-80-20}px`,
            animation:`gd-dust ${p.d*4+3}s ease-out infinite ${p.delay*6}s`,
          }} />
        ))}
      </div>
      {/* Ambient gold glow */}
      <div style={{ position:'absolute',inset:0,overflow:'hidden',filter:'blur(80px)',pointerEvents:'none' }}>
        <div style={{ position:'absolute',width:'60%',height:'60%',top:'20%',left:'20%',borderRadius:'50%',background:`radial-gradient(circle,rgba(${goldRgb},.25) 0%,transparent 70%)`,animation:'gl-pulsate 3s ease-in-out infinite' }} />
      </div>
      {/* Rising center (delayed for curtain reveal) */}
      <motion.div
        initial={{ opacity:0,y:50 }} animate={{ opacity:1,y:0 }}
        transition={{ duration:1.1,delay:.9,ease:[0.16,1,0.3,1] }}
        style={{ position:'relative',display:'flex',flexDirection:'column',alignItems:'center',gap:24 }}>
        <div style={{ position:'absolute',top:'50%',left:'50%',transform:'translate(-50%,-55%)',width:280,height:280,borderRadius:'50%',background:`radial-gradient(circle,rgba(${goldRgb},.5) 0%,transparent 70%)`,filter:'blur(40px)',animation:'gl-pulsate 3s ease-in-out infinite',pointerEvents:'none' }} />
        {showLogo && <LogoBox color="#fbbf24" rgb={goldRgb} logoUrl={logoUrl} appName={appName}
          extra={{ boxShadow:`0 0 0 1px rgba(${goldRgb},.5),0 0 0 4px rgba(${goldRgb},.15),0 0 90px rgba(${goldRgb},.7),0 6px 30px rgba(0,0,0,.8)`,background:`linear-gradient(140deg,#fbbf24 0%,#d97706 100%)` }} />}
        {showName && <NameBlock appName={appName} companyName={companyName} rgb={goldRgb} textGlow={`0 0 40px rgba(${goldRgb},.9),0 0 15px rgba(251,191,36,.5),0 2px 8px rgba(0,0,0,.8)`} />}
        {showProg && <ProgBar color="#fbbf24" rgb={goldRgb} fillSec={fillSec} />}
      </motion.div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// 14. CYAN SMOKE — Smoke + cyan light + 3D spinning logo + sparks
// ══════════════════════════════════════════════════════════════════════════════
const SMOKE_PTS = cloud(40, 23);
const SPARK_PTS = cloud(60, 71);
export function ThemeSmoke({ color, rgb, appName, companyName, logoUrl, showLogo, showName, showProg, fillSec }: ThemeProps) {
  const cyanRgb = '6,182,212';
  return (
    <div style={{ position:'absolute',inset:0,display:'flex',alignItems:'center',justifyContent:'center',background:'radial-gradient(ellipse at 50% 70%,#020a0e 0%,#010709 50%,#000405 100%)' }}>
      {/* Smoke columns rising */}
      <div style={{ position:'absolute',inset:0,overflow:'hidden',pointerEvents:'none' }}>
        {SMOKE_PTS.map((p,i)=>{
          const sz = p.s*80+30;
          return (
            <div key={i} style={{
              position:'absolute',left:`${p.x*100}%`,bottom:`-5%`,
              width:`${sz}px`,height:`${sz*.7}px`,
              borderRadius:'50%',
              background:i%3===0
                ?`radial-gradient(ellipse,rgba(${cyanRgb},.12) 0%,transparent 70%)`
                :i%3===1
                ?`radial-gradient(ellipse,rgba(0,150,200,.08) 0%,transparent 70%)`
                :`radial-gradient(ellipse,rgba(6,120,160,.06) 0%,transparent 70%)`,
              filter:`blur(${p.s*12+6}px)`,
              animation:`sm-smoke ${p.d*5+5}s ease-out infinite ${p.delay*7}s`,
            }} />
          );
        })}
      </div>
      {/* Spark particles shooting outward */}
      <div style={{ position:'absolute',left:'50%',top:'50%',overflow:'hidden',pointerEvents:'none' }}>
        {SPARK_PTS.map((p,i)=>(
          <div key={i} style={{
            position:'absolute',
            top:'50%',left:'50%',
            marginLeft:'-2px',marginTop:'-2px',
            width:`${p.s*3+1}px`,height:`${p.s*3+1}px`,
            borderRadius:'50%',
            background:i%3===0?`rgba(${cyanRgb},1)`:i%3===1?'rgba(255,255,255,.9)':'rgba(100,220,255,.8)',
            boxShadow:`0 0 ${p.s*6}px rgba(${cyanRgb},.7)`,
            ['--sx' as string]:`${(p.x-.5)*300}px`,
            ['--sy' as string]:`${(p.y-.5)*300}px`,
            animation:`sm-spark ${p.d*2+1}s ease-out infinite ${p.delay*5}s`,
          }} />
        ))}
      </div>
      {/* Ambient glow */}
      <div style={{ position:'absolute',inset:0,overflow:'hidden',filter:'blur(70px)',pointerEvents:'none' }}>
        <div style={{ position:'absolute',width:'70%',height:'70%',top:'15%',left:'15%',borderRadius:'50%',background:`radial-gradient(circle,rgba(${cyanRgb},.3) 0%,transparent 70%)`,animation:'sm-glow 4s ease-in-out infinite' }} />
        <div style={{ position:'absolute',width:'40%',height:'40%',bottom:'20%',left:'30%',borderRadius:'50%',background:'radial-gradient(circle,rgba(0,100,200,.2) 0%,transparent 70%)',animation:'sm-glow 6s ease-in-out infinite 2s' }} />
      </div>
      {/* Rings */}
      <div style={{ position:'absolute',left:'50%',top:'50%',pointerEvents:'none' }}>
        {[{r:120,dur:'10s'},{r:180,dur:'16s'},{r:240,dur:'24s'}].map((rg,i)=>(
          <div key={i} style={{
            position:'absolute',width:`${rg.r*2}px`,height:`${rg.r*2}px`,
            marginLeft:`-${rg.r}px`,marginTop:`-${rg.r}px`,
            borderRadius:'50%',
            border:`1px solid rgba(${cyanRgb},${.25-i*.07})`,
            boxShadow:`0 0 10px rgba(${cyanRgb},${.15-i*.04})`,
            animation:`${i%2===0?'gl-spin':'gl-spinR'} ${rg.dur} linear infinite`,
          }} />
        ))}
      </div>
      {/* Ripples */}
      <div style={{ position:'absolute',left:'50%',top:'50%',pointerEvents:'none' }}>
        {[0,.8,1.6].map(d=>(
          <div key={d} style={{ position:'absolute',width:'160px',height:'160px',
            border:`1.5px solid rgba(${cyanRgb},.5)`,borderRadius:'50%',
            animation:`gl-ripple 3.2s ease-out infinite ${d}s` }} />
        ))}
      </div>
      {/* 3D spinning logo */}
      <motion.div
        initial={{ opacity:0,scale:.5 }} animate={{ opacity:1,scale:1 }}
        transition={{ duration:1,ease:[0.16,1,0.3,1],delay:.2 }}
        style={{ position:'relative',display:'flex',flexDirection:'column',alignItems:'center',gap:24 }}>
        <div style={{ position:'absolute',top:'50%',left:'50%',transform:'translate(-50%,-55%)',width:270,height:270,borderRadius:'50%',background:`radial-gradient(circle,rgba(${cyanRgb},.45) 0%,transparent 70%)`,filter:'blur(35px)',animation:'sm-glow 4s ease-in-out infinite',pointerEvents:'none' }} />
        {showLogo && (
          <motion.div
            initial={{ rotateY:90,scale:.4,opacity:0 }} animate={{ rotateY:0,scale:1,opacity:1 }}
            transition={{ duration:1.2,ease:[0.16,1,0.3,1],delay:.35 }}
            style={{ width:100,height:100,borderRadius:28,position:'relative',overflow:'hidden',
              display:'flex',alignItems:'center',justifyContent:'center',
              background:logoUrl?'rgba(6,182,212,.08)':`linear-gradient(140deg,#06b6d4 0%,#0891b2 100%)`,
              boxShadow:`0 0 0 1px rgba(${cyanRgb},.4),0 0 0 3px rgba(${cyanRgb},.12),0 24px 70px rgba(${cyanRgb},.6),0 6px 25px rgba(0,0,0,.7)`,
              animation:'sm-spin3d 6s linear infinite 1.5s',
            }}>
            <div style={{ position:'absolute',inset:0,background:'linear-gradient(110deg,transparent 35%,rgba(255,255,255,.18) 50%,transparent 65%)',animation:'gl-shimmer 2.8s ease-in-out infinite 1.5s' }} />
            {logoUrl
              ? <img src={logoUrl} alt="" style={{ width:'78%',height:'78%',objectFit:'contain',position:'relative' }} />
              : <span style={{ fontSize:44,fontWeight:900,color:'white',position:'relative',lineHeight:1 }}>{(appName||'W')[0].toUpperCase()}</span>
            }
          </motion.div>
        )}
        {showName && <NameBlock appName={appName} companyName={companyName} rgb={cyanRgb} textGlow={`0 0 30px rgba(${cyanRgb},.9),0 2px 8px rgba(0,0,0,.7)`} />}
        {showProg && <ProgBar color="#06b6d4" rgb={cyanRgb} fillSec={fillSec} />}
      </motion.div>
    </div>
  );
}

// ─── Shared center piece ──────────────────────────────────────────────────────
function CenterPiece({ color,rgb,appName,companyName,logoUrl,showLogo,showName,showProg,fillSec,bobAnim,logoExtra,textGlow }:
  ThemeProps & { bobAnim?: string; logoExtra?: React.CSSProperties; textGlow?: string }) {
  return (
    <motion.div initial={{ opacity:0,scale:.6,y:40 }} animate={{ opacity:1,scale:1,y:0 }} transition={{ duration:.95,ease:[0.16,1,0.3,1],delay:.15 }}
      style={{ position:'relative',display:'flex',flexDirection:'column',alignItems:'center',gap:24,animation:bobAnim }}>
      {/* Back glow */}
      <div style={{ position:'absolute',top:'50%',left:'50%',transform:'translate(-50%,-55%)',width:260,height:260,borderRadius:'50%',background:`radial-gradient(circle,rgba(${rgb},.4) 0%,transparent 70%)`,filter:'blur(40px)',animation:'gl-pulsate 3.5s ease-in-out infinite',pointerEvents:'none' }} />
      {showLogo && <LogoBox color={color} rgb={rgb} logoUrl={logoUrl} appName={appName} extra={logoExtra} />}
      {showName && <NameBlock appName={appName} companyName={companyName} rgb={rgb} textGlow={textGlow} />}
      {showProg && <ProgBar color={color} rgb={rgb} fillSec={fillSec} />}
    </motion.div>
  );
}
