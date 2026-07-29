import { useState, useRef, useEffect, useCallback } from 'react';
import { useAlarm } from '@/hooks/use-alarm';
import { useGetEmployees } from '@workspace/api-client-react';
import { useAuth } from '@/hooks/use-auth';
import { ClockWidget } from '@/components/clock-widget';
import { THEMES_CATALOG, GLOBAL_CSS, ThemeCosmic, ThemeAurora, ThemeNeon, ThemeCrystal, ThemeFire, ThemeOcean, ThemeRings, ThemeGlass, ThemePremium, ThemeHolo, ThemeParticles, ThemeSpace, ThemeGolden, ThemeSmoke } from '@/components/splash-themes';
import { useTheme } from '@/components/theme-provider';
import { useToast } from '@/components/ui/use-toast';
import { DEFAULTS, AppSettings, useSettings } from '@/contexts/settings-context';
import { useLanguage } from '@/i18n/LanguageProvider';
import {
  Image, Building2, Palette, Clock4, Key, Globe, Bell, AlarmClock,
  Sparkles, Bot, Database, Shield, Trash2, Type, Mail, Lock,
  LayoutDashboard, Sun, Moon, Upload, Eye, EyeOff, Save, Check,
  Fingerprint, Download, RefreshCw, Phone, MapPin, Plus, X,
  Timer, Zap, Monitor, Smartphone, Layers, ChevronLeft,
  AlertTriangle, CheckCircle2, Info, Map, Navigation,
  RotateCcw, Settings2, FileText, Activity, Users, Wallet,
  LogOut, Camera, Mic, Volume2, VolumeX, Play, Pause,
  ToggleLeft, ToggleRight, Sliders, Grid3X3, List, Square,
  Circle, Triangle, Star, Heart, Bookmark, Tag, Search,
  Filter, SortAsc, Layout, Columns, Rows, BarChart3,
  TrendingUp, Clock, Calendar, Package, Cpu, Wifi, Battery,
} from 'lucide-react';

// ─── Splash theme thumbnail ───────────────────────────────────────────────────
function ThemeThumbnail({ themeId, accent, bg }: { themeId: string; accent: string; bg: string }) {
  // Each thumbnail is a ~155×90 CSS-animated mini preview of the theme
  const base: React.CSSProperties = {
    position: 'relative', width: '100%', height: 100, overflow: 'hidden',
    background: bg, display: 'flex', alignItems: 'center', justifyContent: 'center',
  };
  // Small white logo box centered
  const logoBox: React.CSSProperties = {
    position: 'relative', zIndex: 10, width: 28, height: 28, borderRadius: 8,
    background: 'rgba(255,255,255,.9)', boxShadow: `0 0 12px ${accent}99`,
    flexShrink: 0,
  };

  const ring = (r: number, dur: string, rev = false, opacity = .7, col = accent): React.CSSProperties => ({
    position: 'absolute', width: r*2, height: r*2, borderRadius: '50%',
    left: '50%', top: '50%', marginLeft: -r, marginTop: -r,
    border: `1px solid ${col}${Math.round(opacity*255).toString(16).padStart(2,'0')}`,
    boxShadow: `0 0 8px ${col}44`,
    animation: `${rev ? 'th-spinR' : 'th-spin'} ${dur} linear infinite`,
  });

  const renderBg = () => {
    switch (themeId) {
      case 'cosmic': return <>
        <div style={{ position:'absolute',inset:0,backgroundImage:`linear-gradient(rgba(99,102,241,.06) 1px,transparent 1px),linear-gradient(90deg,rgba(99,102,241,.06) 1px,transparent 1px)`,backgroundSize:'20px 20px',transform:'perspective(200px) rotateX(55deg) scaleY(2)',transformOrigin:'50% 120%' }} />
        {[30,50,75].map((r,i)=><div key={i} style={ring(r,`${10+i*5}s`,i%2===1,.5)} />)}
        {[0,.6,1.2].map(d=><div key={d} style={{ position:'absolute',width:50,height:50,left:'50%',top:'50%',marginLeft:-25,marginTop:-25,borderRadius:'50%',border:`1px solid ${accent}80`,animation:`th-pulse ${2+d}s ease-out infinite ${d}s` }} />)}
      </>;
      case 'aurora': return <>
        {['#00ff88','#00ccff','#aa44ff'].map((c,i)=><div key={i} style={{ position:'absolute',left:0,right:0,top:`${20+i*20}%`,height:'15%',background:c,filter:'blur(20px)',opacity:.3,transform:'skewX(-8deg)' }} />)}
        {[0,4,8].map((l,i)=><div key={i} style={{ position:'absolute',left:`${5+l*10}%`,bottom:'0',width:'3px',height:'60%',background:'#00ff88',filter:'blur(4px)',opacity:.4,animation:`th-rise ${2+i}s ease-out infinite ${i*.8}s` }} />)}
      </>;
      case 'neon': return <>
        <div style={{ position:'absolute',inset:0,backgroundImage:`linear-gradient(rgba(0,240,255,.08) 1px,transparent 1px),linear-gradient(90deg,rgba(0,240,255,.08) 1px,transparent 1px)`,backgroundSize:'15px 15px',transform:'perspective(200px) rotateX(55deg) scaleY(2)',transformOrigin:'50% 120%' }} />
        <div style={{ position:'absolute',inset:0,overflow:'hidden' }}><div style={{ position:'absolute',left:0,right:0,height:'2px',background:'linear-gradient(90deg,transparent,rgba(0,240,255,.9),transparent)',boxShadow:'0 0 10px rgba(0,240,255,.7)',animation:'th-scan 2s linear infinite' }} /></div>
        {[[8,8],[8,'auto'],[undefined,8],['auto',8]].map(([t,b],i)=><div key={i} style={{ position:'absolute',width:10,height:10,top:t as any,bottom:b as any,left:i<2?8:undefined,right:i>=2?8:undefined,borderTop:i<2?'1.5px solid #00f0ff':'none',borderBottom:i>=2?'1.5px solid #00f0ff':'none',borderLeft:[0,2].includes(i)?'1.5px solid #00f0ff':'none',borderRight:[1,3].includes(i)?'1.5px solid #00f0ff':'none' }} />)}
      </>;
      case 'crystal': return <>
        {[25,40,60].map((r,i)=><div key={i} style={{ position:'absolute',width:r*2,height:r*2,left:'50%',top:'50%',marginLeft:-r,marginTop:-r,borderRadius:'50%',border:`1px solid ${accent}40`,animation:`th-pulse ${4+i*2}s ease-in-out infinite ${i}s` }} />)}
        {[0,1,2,3].map(i=><div key={i} style={{ position:'absolute',left:`${15+i*22}%`,top:`${20+((i%2)*40)}%`,width:8,height:14,background:`${accent}30`,border:`1px solid ${accent}50`,clipPath:'polygon(50% 0%,100% 38%,82% 100%,18% 100%,0% 38%)' }} />)}
      </>;
      case 'fire': return <>
        <div style={{ position:'absolute',bottom:0,left:0,right:0,height:'55%',background:'radial-gradient(ellipse at 50% 100%,rgba(255,80,0,.5) 0%,rgba(255,30,0,.2) 50%,transparent 80%)' }} />
        {[15,35,55,75].map((l,i)=><div key={i} style={{ position:'absolute',left:`${l}%`,bottom:'-5%',width:`${12+i*4}px`,height:`${20+i*8}px`,borderRadius:'50% 50% 20% 20%',background:'rgba(255,120,0,.4)',filter:'blur(5px)',animation:`th-rise ${1.5+i*.4}s ease-out infinite ${i*.5}s` }} />)}
      </>;
      case 'ocean': return <>
        <div style={{ position:'absolute',top:0,left:0,right:0,height:'55%',overflow:'hidden' }}>
          {[10,25,40,55,70,85].map((l,i)=><div key={i} style={{ position:'absolute',top:0,left:`${l}%`,width:'2px',height:'100%',background:`linear-gradient(180deg,rgba(0,180,255,.2) 0%,transparent 100%)`,transform:`rotate(${(i%2?1:-1)*6}deg)`,filter:'blur(2px)' }} />)}
        </div>
        {[5,12,20,30,42].map((l,i)=><div key={i} style={{ position:'absolute',left:`${l*2+5}%`,bottom:'-5%',width:`${4+i*2}px`,height:`${4+i*2}px`,borderRadius:'50%',border:`1px solid rgba(0,200,255,.4)`,animation:`th-rise ${2+i*.7}s ease-out infinite ${i*.6}s` }} />)}
      </>;
      case 'rings': return <>
        <div style={{ position:'absolute',inset:0,background:`radial-gradient(circle at 50% 50%,${accent}33 0%,transparent 65%)`,animation:'th-pulse 3s ease-in-out infinite' }} />
        {[25,38,52,67].map((r,i)=><div key={i} style={{...ring(r,`${8+i*4}s`,i%2===1,0.7-i*.12),boxShadow:`0 0 8px ${accent}66,inset 0 0 4px ${accent}44`}} />)}
        <div style={{ position:'absolute',inset:0,overflow:'hidden' }}><div style={{ position:'absolute',top:0,bottom:0,width:'30%',background:`linear-gradient(90deg,transparent,${accent}12,transparent)`,animation:'th-sweep 3s ease-in-out infinite' }} /></div>
      </>;
      case 'glass': return <>
        <div style={{ position:'absolute',inset:0,background:`radial-gradient(circle at 50% 50%,${accent}22 0%,transparent 70%)` }} />
        <div style={{ position:'absolute',width:120,height:120,left:'50%',top:'50%',marginLeft:-60,marginTop:-60,borderRadius:'50%',border:`1px dashed ${accent}44`,animation:'th-spin 8s linear infinite' }}>
          {[0,90,180,270].map(deg=><div key={deg} style={{ position:'absolute',top:'50%',left:'50%',transform:`rotate(${deg}deg) translateX(60px)`,marginLeft:-3,marginTop:-3,width:6,height:6,borderRadius:'50%',background:accent,boxShadow:`0 0 8px ${accent}` }} />)}
        </div>
        <div style={{ position:'absolute',width:80,height:55,left:'50%',top:'50%',marginLeft:-40,marginTop:-27,borderRadius:14,background:'rgba(255,255,255,.05)',border:`1px solid ${accent}40`,backdropFilter:'blur(8px)' }} />
      </>;
      case 'premium': return <>
        <div style={{ position:'absolute',inset:0,background:`radial-gradient(circle at 50% 50%,${accent}22 0%,transparent 65%)`,animation:'th-pulse 4s ease-in-out infinite' }} />
        {[40,65].map((r,i)=><div key={i} style={{...ring(r,`${12+i*8}s`,i%2===1,.4)}} />)}
        {[0,1,2,3,4].map(i=><div key={i} style={{ position:'absolute',left:`${i*20+5}%`,top:`${20+((i%2)*50)}%`,width:2,height:2,borderRadius:'50%',background:accent,boxShadow:`0 0 4px ${accent}`,animation:`th-pulse ${2+i*.5}s ease-in-out infinite ${i*.4}s` }} />)}
        <div style={{ position:'absolute',inset:0,overflow:'hidden' }}><div style={{ position:'absolute',top:0,bottom:0,left:'20%',width:'20%',background:`linear-gradient(90deg,transparent,${accent}0a,transparent)`,transform:'skewX(-40deg)',animation:'th-sweep 4s ease-in-out infinite' }} /></div>
      </>;
      case 'holo': return <>
        <div style={{ position:'absolute',inset:0,backgroundImage:`linear-gradient(rgba(0,245,212,.08) 1px,transparent 1px),linear-gradient(90deg,rgba(0,245,212,.08) 1px,transparent 1px)`,backgroundSize:'15px 15px',transform:'perspective(200px) rotateX(55deg) scaleY(2)',transformOrigin:'50% 120%' }} />
        <div style={{ position:'absolute',inset:0,overflow:'hidden' }}><div style={{ position:'absolute',left:0,right:0,height:'2px',background:'linear-gradient(90deg,transparent,rgba(0,245,212,.9),rgba(255,255,255,.7),rgba(0,245,212,.9),transparent)',boxShadow:'0 0 10px rgba(0,245,212,.7)',animation:'th-scan 2.5s linear infinite' }} /></div>
        {[30,48].map((r,i)=><div key={i} style={{...ring(r,`${6+i*4}s`,i%2===1,.7,'#00f5d4')}} />)}
      </>;
      case 'particles': return <>
        <div style={{ position:'absolute',inset:0,background:`radial-gradient(circle at 50% 50%,${accent}30 0%,transparent 60%)`,animation:'th-pulse 5s ease-in-out infinite' }} />
        {Array.from({length:20}).map((_,i)=>{
          const x=(i/20)*100; const y=(i*7%100);
          return <div key={i} style={{ position:'absolute',left:`${x}%`,top:`${y}%`,['--gx' as string]:`${(x/100-.5)*60}px`,['--gy' as string]:`${(y/100-.5)*60}px`,width:2,height:2,borderRadius:'50%',background:accent,opacity:.7,animation:`th-gather ${2+i*.15}s ease-in-out infinite ${i*.2}s` }} />;
        })}
      </>;
      case 'space': return <>
        {[20,35,52].map((r,i)=><div key={i} style={{ position:'absolute',width:r*2,height:r*1.2*2,left:'50%',top:'50%',marginLeft:-r,marginTop:-r*1.2,borderRadius:'50%',border:`1px solid ${accent}25`,transform:`rotateX(${60+i*5}deg)`,animation:`th-spin ${8+i*5}s linear infinite` }} />)}
        <div style={{ position:'absolute',width:16,height:16,left:'50%',top:'50%',marginLeft:-8,marginTop:-8,borderRadius:'50%',background:`radial-gradient(circle,white 0%,${accent} 50%,transparent 80%)`,boxShadow:`0 0 16px 4px ${accent}88`,animation:'th-pulse 3s ease-in-out infinite' }} />
        {Array.from({length:12}).map((_,i)=><div key={i} style={{ position:'absolute',left:`${(i*17%90)+5}%`,top:`${(i*13%80)+5}%`,width:2,height:2,borderRadius:'50%',background:'white',opacity:.5,animation:`th-pulse ${2+i*.3}s ease-in-out infinite ${i*.2}s` }} />)}
      </>;
      case 'golden': return <>
        {/* Curtain animation */}
        <div style={{ position:'absolute',inset:0,overflow:'hidden' }}>
          <div style={{ position:'absolute',top:0,bottom:0,left:0,width:'55%',background:'linear-gradient(90deg,#3a0000,#6b0000)',animation:'th-curtL 1.4s ease-in-out .3s both' }} />
          <div style={{ position:'absolute',top:0,bottom:0,right:0,width:'55%',background:'linear-gradient(270deg,#3a0000,#6b0000)',animation:'th-curtR 1.4s ease-in-out .3s both' }} />
        </div>
        <div style={{ position:'absolute',inset:0,background:'radial-gradient(circle at 50% 50%,rgba(251,191,36,.25) 0%,transparent 65%)' }} />
        <div style={{ position:'absolute',top:0,left:'50%',transform:'translateX(-50%)',width:0,height:0,borderLeft:'40px solid transparent',borderRight:'40px solid transparent',borderTop:'80px solid rgba(255,220,100,.04)',filter:'blur(10px)' }} />
      </>;
      case 'smoke': return <>
        {[20,50,80].map((l,i)=><div key={i} style={{ position:'absolute',left:`${l-10}%`,bottom:'-5%',width:40,height:30,borderRadius:'50%',background:`rgba(6,182,212,.12)`,filter:'blur(10px)',animation:`th-smoke ${2.5+i*.8}s ease-out infinite ${i*.7}s` }} />)}
        <div style={{ position:'absolute',inset:0,background:`radial-gradient(circle at 50% 60%,rgba(6,182,212,.25) 0%,transparent 60%)`,animation:'th-pulse 4s ease-in-out infinite' }} />
        {[30,48].map((r,i)=><div key={i} style={{...ring(r,`${9+i*5}s`,i%2===1,.4,'#06b6d4')}} />)}
        {[0,1,2].map(i=><div key={i} style={{ position:'absolute',left:`${35+i*10}%`,bottom:`${20+i*5}%`,width:2,height:2,borderRadius:'50%',background:'#06b6d4',boxShadow:'0 0 4px #06b6d4',animation:`th-pulse ${1.5+i*.5}s ease-in-out infinite ${i*.3}s` }} />)}
      </>;
      default: return <div style={{ position:'absolute',inset:0,background:`radial-gradient(circle,${accent}33 0%,transparent 70%)` }} />;
    }
  };

  return (
    <div style={base}>
      {renderBg()}
      {/* Mini logo box */}
      <div style={{ ...logoBox, position:'relative', zIndex:10 }} />
    </div>
  );
}

// ─── Primitives ────────────────────────────────────────────────────────────────
function Toggle({ on, onToggle, disabled }: { on: boolean; onToggle: () => void; disabled?: boolean }) {
  return (
    <button
      onClick={disabled ? undefined : onToggle}
      disabled={disabled}
      className={`relative w-12 h-6 rounded-full transition-all shrink-0 ${on ? 'bg-indigo-500' : 'bg-slate-600'} ${disabled ? 'opacity-40 cursor-not-allowed' : 'cursor-pointer'}`}
    >
      <span className={`absolute top-1 w-4 h-4 rounded-full bg-white shadow transition-all duration-300 ${on ? 'right-1' : 'right-6'}`} />
    </button>
  );
}

function Field({ label, sub, children, required }: { label: string; sub?: string; children: React.ReactNode; required?: boolean }) {
  return (
    <div className="space-y-1.5">
      <label className="block text-sm font-bold">
        {label} {required && <span className="text-red-400">*</span>}
      </label>
      {sub && <p className="text-[11px] text-muted-foreground -mt-1">{sub}</p>}
      {children}
    </div>
  );
}

function Inp({ ...props }: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      {...props}
      className={`w-full rounded-xl px-4 py-2.5 text-sm border border-border bg-transparent focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition ${props.className || ''}`}
    />
  );
}

function Sel({ children, ...props }: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select
      {...props}
      className="w-full rounded-xl px-4 py-2.5 text-sm border border-border focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition"
      style={{ background: 'var(--background)' }}
    >
      {children}
    </select>
  );
}

function SCard({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div
      className={`rounded-2xl border border-border p-5 transition-all hover:border-indigo-500/20 ${className || ''}`}
      style={{ background: 'var(--card)' }}
    >
      {children}
    </div>
  );
}

function CardHead({ icon: Icon, color, title, sub }: { icon: React.ElementType; color: string; title: string; sub?: string }) {
  return (
    <div className="flex items-center gap-3 mb-5">
      <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${color} shadow-lg`}>
        <Icon className="w-5 h-5 text-white" />
      </div>
      <div>
        <h3 className="font-bold text-base leading-tight">{title}</h3>
        {sub && <p className="text-[11px] text-muted-foreground mt-0.5">{sub}</p>}
      </div>
    </div>
  );
}

function TRow({ label, sub, on, onToggle, disabled }: { label: string; sub?: string; on: boolean; onToggle: () => void; disabled?: boolean }) {
  return (
    <div className={`flex items-center justify-between gap-4 py-3 border-b border-border last:border-0 ${disabled ? 'opacity-50' : ''}`}>
      <div className="min-w-0">
        <p className="text-sm font-bold">{label}</p>
        {sub && <p className="text-[11px] text-muted-foreground mt-0.5">{sub}</p>}
      </div>
      <Toggle on={on} onToggle={onToggle} disabled={disabled} />
    </div>
  );
}

function ColorDot({ color, selected, onClick }: { color: string; selected: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={`w-8 h-8 rounded-full border-2 transition-all ${selected ? 'border-white scale-125 shadow-lg' : 'border-transparent hover:scale-110'}`}
      style={{ background: color }}
    />
  );
}

function readAsBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

function ImgZone({ label, sub, icon: Icon, value, onUpload, accept = 'image/*', size = 'md' }: {
  label: string; sub?: string; icon: React.ElementType; value?: string;
  onUpload: (b: string) => void; accept?: string; size?: 'sm' | 'md' | 'lg';
}) {
  const ref = useRef<HTMLInputElement>(null);
  const h = size === 'sm' ? 'h-16' : size === 'lg' ? 'h-40' : 'h-24';
  return (
    <Field label={label} sub={sub}>
      <div
        className={`flex items-center justify-center gap-3 w-full ${h} rounded-xl border-2 border-dashed border-border hover:border-indigo-500/50 cursor-pointer transition group relative overflow-hidden`}
        onClick={() => ref.current?.click()}
      >
        {value ? (
          <>
            <img src={value} alt="preview" className="absolute inset-0 w-full h-full object-contain p-2" />
            <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition flex items-center justify-center">
              <Upload className="w-5 h-5 text-white" />
            </div>
          </>
        ) : (
          <div className="text-center">
            <Icon className="w-6 h-6 text-muted-foreground group-hover:text-indigo-400 mx-auto mb-1 transition" />
            <p className="text-xs text-muted-foreground">انقر للرفع</p>
          </div>
        )}
        <input ref={ref} type="file" className="hidden" accept={accept}
          onChange={async e => {
            const file = e.target.files?.[0];
            if (!file) return;
            const b64 = await readAsBase64(file);
            onUpload(b64);
          }} />
      </div>
    </Field>
  );
}

function BtnPicker({ options, value, onChange, color = 'indigo' }: {
  options: { v: string; label: string }[];
  value: string;
  onChange: (v: string) => void;
  color?: string;
}) {
  return (
    <div className={`grid gap-2`} style={{ gridTemplateColumns: `repeat(${Math.min(options.length, 4)}, 1fr)` }}>
      {options.map(({ v, label }) => (
        <button key={v} onClick={() => onChange(v)}
          className={`py-2.5 rounded-xl border font-bold text-xs transition ${value === v ? `border-${color}-500 bg-${color}-500/10 text-${color}-300` : 'border-border hover:border-indigo-500/30 text-muted-foreground'}`}>
          {label}
        </button>
      ))}
    </div>
  );
}

function InfoBox({ text, type = 'info' }: { text: string; type?: 'info' | 'warning' | 'success' }) {
  const styles = {
    info: 'border-blue-500/20 bg-blue-500/5 text-blue-400',
    warning: 'border-amber-500/20 bg-amber-500/5 text-amber-400',
    success: 'border-green-500/20 bg-green-500/5 text-green-400',
  };
  const icons = { info: Info, warning: AlertTriangle, success: CheckCircle2 };
  const Icon = icons[type];
  return (
    <div className={`rounded-xl border px-3 py-2.5 flex items-start gap-2 ${styles[type]}`}>
      <Icon className="w-4 h-4 shrink-0 mt-0.5" />
      <p className="text-xs">{text}</p>
    </div>
  );
}

function SaveBtn({ onClick, label = 'حفظ التغييرات', color = 'indigo', icon: Icon = Save }: {
  onClick: () => void; label?: string; color?: string; icon?: React.ElementType;
}) {
  const [ok, setOk] = useState(false);
  return (
    <button onClick={() => { onClick(); setOk(true); setTimeout(() => setOk(false), 2000); }}
      className={`w-full py-2.5 rounded-xl font-bold text-sm text-white transition flex items-center justify-center gap-2 hover:-translate-y-0.5 ${ok ? 'bg-green-500 shadow-green-500/20' : `bg-${color}-500 hover:bg-${color}-600 shadow-${color}-500/20`} shadow-lg`}>
      {ok ? <Check className="w-4 h-4" /> : <Icon className="w-4 h-4" />}
      {ok ? 'تم الحفظ ✓' : label}
    </button>
  );
}

function toRgb(hex: string) {
  const normalized = hex.replace('#', '');
  const value = parseInt(normalized.length === 3 ? normalized.split('').map(x => x + x).join('') : normalized, 16);
  if (Number.isNaN(value)) return '99,102,241';
  return `${(value >> 16) & 255},${(value >> 8) & 255},${value & 255}`;
}

const SPLASH_THEME_MAP = {
  cosmic: ThemeCosmic,
  aurora: ThemeAurora,
  neon: ThemeNeon,
  crystal: ThemeCrystal,
  fire: ThemeFire,
  ocean: ThemeOcean,
  rings: ThemeRings,
  glass: ThemeGlass,
  premium: ThemePremium,
  holo: ThemeHolo,
  particles: ThemeParticles,
  space: ThemeSpace,
  golden: ThemeGolden,
  smoke: ThemeSmoke,
} as const;

function SplashLivePreview({ settings, previewKey = 0 }: { settings: AppSettings; previewKey?: number }) {
  const duration = Math.max(1800, parseInt(settings.splashDuration || '2500', 10));
  const Theme = SPLASH_THEME_MAP[settings.splashTheme] ?? ThemeCosmic;
  const color = settings.appColor || '#6366f1';

  return (
    <div
      key={previewKey}
      className="mt-5 rounded-xl overflow-hidden border border-border relative"
      style={{
        height: 250,
        backgroundColor: settings.splashBgColor || '#0f172a',
        backgroundImage: settings.splashUrl ? `url(${settings.splashUrl})` : undefined,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
      }}
    >
      <style>{GLOBAL_CSS}</style>
      <div className="absolute inset-0 bg-black/20">
        <Theme
          color={color}
          rgb={toRgb(color)}
          appName={settings.appName || 'WorkforceOS'}
          companyName={settings.companyName || ''}
          logoUrl={settings.logoUrl || ''}
          showLogo={settings.splashShowLogo !== false}
          showName={settings.splashShowName !== false}
          showProg={settings.splashShowProgress !== false}
          fillSec={Math.max(0.5, (duration - 1200) / 1000)}
        />
      </div>
      <div className="absolute inset-x-0 bottom-2 text-center text-[10px] text-white/60 pointer-events-none">
        معاينة شاشة البداية — لا تُطبّق حتى الحفظ
      </div>
    </div>
  );
}

function PreviewSample({ settings, sectionId, liveTime, previewKey = 0 }: { settings: AppSettings; sectionId: string; liveTime: Date; previewKey?: number }) {
  const cardBackground = settings.cardColors === 'solid-light' ? '#f8fafc' : settings.cardColors === 'solid-dark' ? '#111827' : 'rgba(255,255,255,.08)';
  const pageBackground = settings.background === 'gradient'
    ? `linear-gradient(135deg, ${settings.appColor}55, #0f172a)`
    : settings.background === 'grid'
      ? `linear-gradient(${settings.appColor}18 1px, transparent 1px), linear-gradient(90deg, ${settings.appColor}18 1px, transparent 1px)`
      : settings.background === 'dotted'
        ? `radial-gradient(${settings.appColor}55 1px, transparent 1px)`
        : 'var(--background)';
  const fontWeight = settings.fontWeight === 'bold' ? 700 : settings.fontWeight === 'medium' ? 500 : 400;
  const fontStyle = settings.fontShape === 'italic' ? 'italic' : 'normal';
  const lineHeight = settings.lineHeight === 'tight' ? 1.2 : settings.lineHeight === 'relaxed' ? 1.8 : 1.5;
  const letterSpacing = settings.letterSpacing === 'tight' ? '-0.05em' : settings.letterSpacing === 'wide' ? '0.1em' : 'normal';

  if (sectionId === 'logo') return (
    <div className="rounded-2xl p-6 text-center border border-border" style={{ background: pageBackground }}>
      {settings.logoUrl
        ? <img src={settings.logoUrl} alt="" className="w-16 h-16 object-contain mx-auto mb-3 rounded-2xl" />
        : <div className="w-16 h-16 rounded-2xl mx-auto mb-3 flex items-center justify-center text-2xl font-black text-white" style={{ background: settings.appColor }}>{(settings.appName || 'W')[0].toUpperCase()}</div>}
      <h3 className="font-black text-xl">{settings.appName || 'WorkforceOS'}</h3>
      <p className="text-sm text-muted-foreground mt-1">{settings.welcomeMsg || 'أهلاً وسهلاً'}</p>
      {settings.companyName && <p className="text-xs mt-3" style={{ color: settings.appColor }}>{settings.companyName}</p>}
    </div>
  );

  if (sectionId === 'background') return (
    <div className="rounded-2xl p-5 border border-border space-y-4" style={{ background: pageBackground, backgroundSize: settings.background === 'grid' || settings.background === 'dotted' ? '18px 18px' : undefined }}>
      <div className="grid grid-cols-3 gap-2">
        {['الحضور', 'الرواتب', 'الإجازات'].map(label => (
          <div key={label} className="rounded-xl p-3 border border-border text-center" style={{ background: cardBackground, color: settings.cardColors === 'solid-light' ? '#0f172a' : undefined }}>
            <div className="w-7 h-7 rounded-lg mx-auto mb-2" style={{ background: `${settings.appColor}55` }} />
            <p className="text-[11px] font-bold">{label}</p>
          </div>
        ))}
      </div>
      <button className="w-full rounded-xl py-2.5 text-white text-sm font-bold" style={{ background: settings.buttonColor === 'green' ? '#16a34a' : settings.buttonColor === 'blue' ? '#2563eb' : settings.buttonColor === 'rose' ? '#e11d48' : settings.appColor }}>حفظ الإجراء</button>
    </div>
  );

  if (sectionId === 'clock') return (
    <div className="rounded-2xl p-7 border border-border text-center" style={{ color: settings.clockColor }}>
      <p className={`font-mono font-black tabular-nums ${settings.clockSize === 'small' ? 'text-3xl' : settings.clockSize === 'large' ? 'text-6xl' : 'text-5xl'}`}>
        {liveTime.toLocaleTimeString(settings.showArabicDay ? 'ar-SA' : 'en-US', { hour: '2-digit', minute: '2-digit', second: settings.showSeconds ? '2-digit' : undefined, hour12: settings.show12h })}
      </p>
      {settings.showDate && <p className="text-sm text-muted-foreground mt-2">{liveTime.toLocaleDateString(settings.showArabicDay ? 'ar-SA' : 'en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>}
      {settings.showShiftClock && <span className="inline-flex mt-3 px-3 py-1 rounded-full border border-border text-xs text-muted-foreground">دخلت 08:55</span>}
    </div>
  );

  if (sectionId === 'splash') return <SplashLivePreview settings={settings} previewKey={previewKey} />;

  if (sectionId === 'assistant') return (
    <div className="rounded-2xl p-5 border border-rose-500/20 bg-gradient-to-br from-rose-500/10 to-pink-500/5">
      <div className="flex items-center gap-3">
        <div className="w-12 h-12 rounded-2xl overflow-hidden flex items-center justify-center bg-gradient-to-br from-rose-500 to-pink-500">
          {settings.assistantAvatarUrl ? <img src={settings.assistantAvatarUrl} alt="" className="w-full h-full object-cover" /> : <Bot className="w-6 h-6 text-white" />}
        </div>
        <div><p className="font-bold">{settings.assistantName || 'WorkBot'}</p><p className="text-[11px] text-muted-foreground">{settings.assistantOn ? 'مساعد نشط' : 'المساعد متوقف'}</p></div>
      </div>
      <p className="mt-5 rounded-xl bg-black/10 p-3 text-sm leading-7">{settings.assistantMsg || 'مرحباً! كيف يمكنني مساعدتك؟'}</p>
    </div>
  );

  if (sectionId === 'language') {
    const previewLocale = settings.language === 'ar' ? 'ar-SA' : settings.language === 'sv' ? 'sv-SE' : 'en-US';
    return <div className="rounded-2xl p-5 border border-teal-500/20 bg-teal-500/5 space-y-2 text-sm">
      <p className="font-bold text-teal-300">معاينة التنسيق</p>
      <p className="text-muted-foreground">التاريخ: {new Date().toLocaleDateString(previewLocale)}</p>
      <p className="text-muted-foreground">{settings.currencyCode === 'LOY' ? `${new Intl.NumberFormat(previewLocale, { maximumFractionDigits: 0 }).format(15000)} نق.` : new Intl.NumberFormat(previewLocale, { style: 'currency', currency: settings.currencyCode, maximumFractionDigits: 0 }).format(15000)}</p>
      <p className="text-xs text-muted-foreground">المنطقة الزمنية: {settings.timezone}</p>
    </div>;
  }

  if (sectionId === 'alarm') return (
    <div className="rounded-2xl p-5 border border-orange-500/20 bg-orange-500/5 space-y-3">
      <p className="font-bold text-orange-300">التنبيهات المفعلة</p>
      <p className="text-sm text-muted-foreground">{settings.notif.shiftStart ? `بداية الدوام: ${settings.shiftStartAlarm}` : 'منبه البداية متوقف'}</p>
      <p className="text-sm text-muted-foreground">{settings.notif.shiftEnd ? `نهاية الدوام: ${settings.shiftEndAlarm}` : 'منبه النهاية متوقف'}</p>
      <p className="text-xs text-muted-foreground">الصوت: {settings.notif.sound ? settings.notifSoundTone : 'متوقف'}</p>
    </div>
  );

  if (sectionId === 'location') return (
    <div className="rounded-2xl p-5 border border-green-500/20 bg-green-500/5">
      <div className="h-28 rounded-xl border border-green-500/20 relative overflow-hidden bg-green-500/5">
        <div className="absolute inset-0 opacity-30" style={{ backgroundImage: 'linear-gradient(45deg, transparent 48%, #22c55e 49%, transparent 51%), linear-gradient(-45deg, transparent 48%, #22c55e 49%, transparent 51%)', backgroundSize: '30px 30px' }} />
        <div className="absolute inset-0 flex items-center justify-center"><div className="w-16 h-16 rounded-full border-2 border-green-400/40 flex items-center justify-center"><MapPin className="w-6 h-6 text-green-400" /></div></div>
      </div>
      <p className="text-sm font-bold mt-3">{settings.locationAddress || 'لم يتم تحديد عنوان الشركة'}</p>
      <p className="text-xs text-muted-foreground mt-1">نطاق السماح: {settings.locationRadius}م · الوضع: {settings.locationMode}</p>
    </div>
  );

  if (sectionId === 'font') return (
    <div className="rounded-2xl p-5 border border-cyan-500/20 bg-cyan-500/5" style={{ fontWeight, fontStyle, lineHeight, letterSpacing }}>
      <p className="text-[10px] text-muted-foreground mb-2">معاينة النص</p>
      <p className="text-xl">إدارة القوى العاملة — نظام متكامل</p>
      <p className="text-sm text-muted-foreground mt-2">الحضور والرواتب والإجازات في مكان واحد</p>
    </div>
  );

  if (sectionId === 'dashboard') return (
    <div className="rounded-2xl p-4 border border-blue-500/20 bg-blue-500/5 space-y-3">
      {settings.dashboardGreeting && <p className="font-bold">مرحباً بك في لوحة البداية</p>}
      {settings.dashboardClock && <p className="font-mono text-blue-300">{liveTime.toLocaleTimeString('ar-SA', { hour: '2-digit', minute: '2-digit' })}</p>}
      <div className={`grid gap-2 ${settings.dashboardLayout === 'compact' ? 'grid-cols-3' : 'grid-cols-2'}`}>
        {settings.dashboardWidgets.slice(0, settings.dashboardLayout === 'detailed' ? 6 : 4).map(widget => <div key={widget} className="h-12 rounded-xl border border-border bg-white/5 text-[10px] flex items-center justify-center text-muted-foreground">{DASH_WIDGETS.find(item => item.id === widget)?.label || widget}</div>)}
      </div>
    </div>
  );

  if (sectionId === 'auth') return <div className="rounded-2xl p-5 border border-violet-500/20 bg-violet-500/5 space-y-3"><p className="font-bold">حالة الأمان</p>{[['PIN', settings.biometric.pin], ['Face ID', settings.biometric.faceId], ['البصمة', settings.biometric.fingerprint]].map(([label, enabled]) => <div key={String(label)} className="flex justify-between text-sm"><span>{label}</span><span className={enabled ? 'text-green-400' : 'text-muted-foreground'}>{enabled ? 'مُفعّل' : 'متوقف'}</span></div>)}</div>;
  if (sectionId === 'credentials') return <div className="rounded-2xl p-5 border border-slate-500/20 bg-slate-500/5 space-y-3"><p className="font-bold">تحديث بيانات الحساب</p><div className="h-10 rounded-xl border border-border bg-white/5" /><div className="h-10 rounded-xl border border-border bg-white/5" /><p className="text-xs text-muted-foreground">سيتم طلب التأكيد قبل التحديث</p></div>;
  if (sectionId === 'backup') return <div className="rounded-2xl p-5 border border-emerald-500/20 bg-emerald-500/5 space-y-3"><p className="font-bold text-emerald-300">نسخة WorkforceOS الاحتياطية</p><p className="text-sm text-muted-foreground">الملف يشمل جميع الإعدادات والألوان وتفضيلات المستخدم.</p><div className="h-2 rounded-full bg-emerald-500/20"><div className="h-full w-3/4 rounded-full bg-emerald-400" /></div></div>;
  if (sectionId === 'clearlogs') return <div className="rounded-2xl p-5 border border-red-500/20 bg-red-500/5 space-y-3"><AlertTriangle className="w-6 h-6 text-red-400" /><p className="font-bold text-red-300">منطقة حذف السجلات</p><p className="text-sm text-muted-foreground">هذه الإجراءات لا يمكن التراجع عنها.</p></div>;
  if (sectionId === 'apikeys') return <div className="rounded-2xl p-5 border border-amber-500/20 bg-amber-500/5 space-y-3"><p className="font-bold text-amber-300">حالة الخدمات</p>{['OpenAI', 'Gemini', 'Maps'].map(name => <div key={name} className="flex justify-between text-sm"><span>{name}</span><span className="text-muted-foreground">جاهز للربط</span></div>)}</div>;
  if (sectionId === 'loginDesign') {
    const cardFrom = settings.loginCardGradientFrom || '#6366f1';
    const cardTo   = settings.loginCardGradientTo   || '#8b5cf6';
    const radius   = settings.loginCardRadius ?? 32;
    const panelFrom = settings.loginPanelGradientFrom || '#6366f1';
    const panelTo   = settings.loginPanelGradientTo   || '#8b5cf6';
    const cardBg =
      settings.loginCardStyle === 'gradient' ? `linear-gradient(135deg, ${cardFrom}, ${cardTo})`
      : settings.loginCardStyle === 'solid'   ? '#1e293b'
      : settings.loginCardStyle === 'neon'    ? 'rgba(17,0,36,.92)'
      : settings.loginCardStyle === 'minimal' ? 'transparent'
      : 'rgba(255,255,255,.08)';
    const cardBorder =
      settings.loginCardStyle === 'neon'    ? `1px solid ${cardFrom}88`
      : settings.loginCardStyle === 'minimal' ? '1px dashed rgba(255,255,255,.2)'
      : '1px solid rgba(255,255,255,.12)';
    return (
      <div className="rounded-2xl overflow-hidden border border-border" style={{ height: 240 }}>
        <div className="flex h-full">
          {/* Left panel */}
          <div className="w-2/5 h-full relative hidden sm:flex flex-col justify-center p-4"
            style={{ background: `linear-gradient(135deg, ${panelFrom}, ${panelTo})` }}>
            <div className="absolute inset-0 bg-black/15" />
            <div className="relative z-10">
              {settings.loginShowLogo !== false && (
                <div className="w-9 h-9 rounded-xl bg-white/20 border border-white/30 flex items-center justify-center mb-2">
                  {settings.logoUrl ? <img src={settings.logoUrl} className="w-full h-full object-contain rounded-xl" /> : <div className="w-5 h-5 rounded-md bg-white/60" />}
                </div>
              )}
              <div className="text-white font-bold text-xs">{settings.appName || 'WorkforceOS'}</div>
              <div className="text-white/60 text-[9px] mt-1">تسجيل دخول آمن</div>
            </div>
            {settings.loginShowStats !== false && (
              <div className="absolute bottom-3 left-3 right-3 z-10 bg-white/10 backdrop-blur-sm rounded-lg p-2 border border-white/15">
                <div className="text-white/70 text-[8px]">Active Workforce</div>
                <div className="text-white font-bold text-xs">1,248</div>
              </div>
            )}
          </div>
          {/* Right panel */}
          <div className="flex-1 h-full flex items-center justify-center p-4 bg-background">
            <div className="w-full max-w-[160px]" style={{ background: cardBg, border: cardBorder, borderRadius: radius/2, padding: 12, backdropFilter: 'blur(12px)' }}>
              {settings.loginShowClock !== false && (
                <div className="text-center mb-2" style={{ color: settings.loginAccentColor || '#6366f1', fontSize: 11, fontWeight: 700, fontFamily: 'monospace' }}>
                  12:34:56
                </div>
              )}
              <div className="h-5 rounded-md bg-white/10 border border-white/10 mb-1.5" />
              <div className="h-5 rounded-md bg-white/10 border border-white/10 mb-2" />
              <div className="h-5 rounded-md flex items-center justify-center text-[8px] font-bold text-white"
                style={{ background: `linear-gradient(135deg, ${settings.loginAccentColor || '#6366f1'}, ${cardTo})` }}>
                تسجيل الدخول
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return <div className="rounded-2xl p-5 border border-border bg-white/5"><p className="font-bold">معاينة الإعدادات</p><p className="text-sm text-muted-foreground mt-2">هذه التغييرات مؤقتة وتُطبّق على النظام بعد الضغط على «حفظ».</p></div>;
}

function SettingsPreviewModal({ sectionId, sectionLabel, settings, liveTime, previewKey, onClose, onReplay }: {
  sectionId: string; sectionLabel: string; settings: AppSettings; liveTime: Date; previewKey: number; onClose: () => void; onReplay: () => void;
}) {
  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/70 backdrop-blur-sm p-4" dir="rtl">
      <div className="relative w-full max-w-xl max-h-[90vh] overflow-y-auto rounded-3xl border border-border p-5 shadow-2xl" style={{ background: 'var(--card)' }}>
        <button onClick={onClose} className="absolute top-4 left-4 w-8 h-8 rounded-full border border-border flex items-center justify-center text-muted-foreground hover:text-foreground transition" aria-label="إغلاق المعاينة"><X className="w-4 h-4" /></button>
        <div className="mb-4 pl-10">
          <p className="text-xs text-indigo-300 font-bold">معاينة مؤقتة</p>
          <h3 className="font-black text-xl">معاينة {sectionLabel}</h3>
          <p className="text-xs text-muted-foreground mt-1">لن يتغير التطبيق أو التخزين حتى تضغط «حفظ».</p>
        </div>
        <PreviewSample settings={settings} sectionId={sectionId} liveTime={liveTime} previewKey={previewKey} />
        {sectionId === 'splash' && <button onClick={onReplay} className="w-full mt-3 py-2.5 rounded-xl border border-pink-500/40 text-pink-300 font-bold text-sm flex items-center justify-center gap-2"><Play className="w-4 h-4" /> إعادة تشغيل المعاينة</button>}
        <button onClick={onClose} className="w-full mt-4 py-2.5 rounded-xl bg-indigo-500 hover:bg-indigo-600 text-white font-bold text-sm transition">إغلاق المعاينة</button>
      </div>
    </div>
  );
}

// ─── Section nav config ────────────────────────────────────────────────────────
const SECTIONS = [
  { id: 'logo',        label: 'اللوغو والاسم',       icon: Image,          color: 'bg-indigo-500',  desc: 'شعار وهوية التطبيق' },
  { id: 'background',  label: 'الخلفية والكروت',      icon: Palette,        color: 'bg-purple-500',  desc: 'المظهر العام والألوان' },
  { id: 'clock',       label: 'الساعة',               icon: Clock4,         color: 'bg-sky-500',     desc: 'عرض الوقت والتاريخ' },
  { id: 'apikeys',     label: 'مفاتيح البرنامج',      icon: Key,            color: 'bg-amber-500',   desc: 'API Keys والخدمات' },
  { id: 'language',    label: 'اللغة',                icon: Globe,          color: 'bg-teal-500',    desc: 'اللغة والتنسيق' },
  { id: 'alarm',       label: 'المنبه',               icon: AlarmClock,     color: 'bg-orange-500',  desc: 'التنبيهات والإشعارات' },
  { id: 'splash',      label: 'شاشة الترحيب',        icon: Sparkles,       color: 'bg-pink-500',    desc: 'شاشة البداية' },
  { id: 'location',    label: 'الموقع',               icon: MapPin,         color: 'bg-green-500',   desc: 'GPS والجيوفنس' },
  { id: 'assistant',   label: 'المساعد الذكي',        icon: Bot,            color: 'bg-rose-500',    desc: 'إعدادات الذكاء الاصطناعي' },
  { id: 'backup',      label: 'النسخ الاحتياطية',    icon: Database,       color: 'bg-emerald-500', desc: 'حفظ واستعادة البيانات' },
  { id: 'auth',        label: 'التوثيق',              icon: Shield,         color: 'bg-violet-500',  desc: 'الأمان والبيومتري' },
  { id: 'clearlogs',   label: 'مسح السجلات',          icon: Trash2,         color: 'bg-red-500',     desc: 'حذف البيانات' },
  { id: 'font',        label: 'الخط',                 icon: Type,           color: 'bg-cyan-500',    desc: 'الخط وحجمه وشكله' },
  { id: 'credentials', label: 'الإيميل وكلمة السر',  icon: Lock,           color: 'bg-slate-500',   desc: 'بيانات الدخول' },
  { id: 'loginDesign', label: 'تصميم لوحة الدخول',   icon: Monitor,        color: 'bg-fuchsia-500', desc: 'تخصيص شكل صفحة اللوغن' },
  { id: 'dashboard',   label: 'لوحة البداية',         icon: LayoutDashboard, color: 'bg-blue-500',  desc: 'تخصيص الصفحة الرئيسية' },
  { id: 'payroll-rules', label: 'قواعد الرواتب',     icon: Wallet,          color: 'bg-green-600', desc: 'معدلات الوقت الإضافي والاستقطاعات' },
];

const APP_COLORS = ['#6366f1','#8b5cf6','#ec4899','#f97316','#10b981','#06b6d4','#f59e0b','#ef4444','#64748b','#0ea5e9','#a855f7','#14b8a6'];
const DASH_WIDGETS = [
  { id: 'stats',        label: 'إحصائيات الحضور' },
  { id: 'clock',        label: 'ساعة مباشرة' },
  { id: 'attendance',   label: 'جدول الحضور اليوم' },
  { id: 'leaves',       label: 'طلبات الإجازات' },
  { id: 'payroll',      label: 'ملخص الراتب' },
  { id: 'activity',     label: 'آخر النشاطات' },
  { id: 'alerts',       label: 'التنبيهات' },
  { id: 'weather',      label: 'الطقس' },
  { id: 'tasks',        label: 'المهام السريعة' },
  { id: 'performance',  label: 'الأداء الشهري' },
];

// ─── Main ──────────────────────────────────────────────────────────────────────
// ─── AlarmTestButton ───────────────────────────────────────────────────────────
function AlarmTestButton({ disabled, tone }: { disabled: boolean; tone: string }) {
  const { playSound } = useAlarm();
  return (
    <button
      onClick={() => playSound(tone as any)}
      disabled={disabled}
      className="w-full py-2 rounded-xl border border-border hover:border-orange-500/40 text-sm font-bold transition flex items-center justify-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed">
      <Volume2 className="w-4 h-4" /> اختبار الصوت الآن 🔔
    </button>
  );
}

// ─── ClearEmployeeSelector ────────────────────────────────────────────────────
function ClearEmployeeSelector({ selectedId, onSelect }: { selectedId: string; onSelect: (id: string, name: string) => void }) {
  const { user } = useAuth();
  const { data } = useGetEmployees({ companyId: user?.companyId || 0 });
  const employees = data?.employees || [];
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-xs font-bold text-muted-foreground">تحديد الموظف (اختياري)</label>
      <select
        value={selectedId}
        onChange={e => {
          const id = e.target.value;
          const emp = employees.find(em => em.id?.toString() === id);
          onSelect(id, emp?.fullName || 'كل الموظفين');
        }}
        className="w-full rounded-xl px-3 py-2.5 text-sm border border-border bg-transparent focus:outline-none focus:ring-2 focus:ring-red-500/40 transition"
      >
        <option value="all">كل الموظفين</option>
        {employees.map(emp => (
          <option key={emp.id} value={emp.id?.toString() || ''}>{emp.fullName}</option>
        ))}
      </select>
      {selectedId !== 'all' && (
        <p className="text-xs text-amber-400 flex items-center gap-1">
          <AlertTriangle className="w-3 h-3 inline" />
          سيتم مسح سجلات هذا الموظف فقط
        </p>
      )}
    </div>
  );
}

// ─── ClockPreview ─────────────────────────────────────────────────────────────
function ClockPreview({ clockType, clockColor, clockSize }: { clockType: string; clockColor: string; clockSize: string }) {
  return (
    <div className="flex items-center justify-center p-4 min-h-[80px]">
      <ClockWidget overrideStyle={clockType} />
    </div>
  );
}

export default function Settings() {
  const { theme: savedTheme, setTheme }   = useTheme();
  const { locale: savedLocale, setLocale } = useLanguage();
  const { toast }             = useToast();
  const { s: savedSettings, save }   = useSettings();
  const { user } = useAuth();

  // Sections visible to employees (personal preferences only)
  const EMPLOYEE_SECTION_IDS = ['background', 'language', 'clock', 'font', 'credentials', 'auth'];
  const visibleSections = user?.role === 'employee'
    ? SECTIONS.filter(sec => EMPLOYEE_SECTION_IDS.includes(sec.id))
    : SECTIONS;

  const [activeSection, setActiveSection] = useState(
    user?.role === 'employee' ? 'background' : 'logo'
  );
  const [draft, setDraft] = useState<AppSettings>(() => savedSettings);
  const [draftTheme, setDraftTheme] = useState(savedTheme);
  const [draftLocale, setDraftLocale] = useState(savedLocale);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewKey, setPreviewKey] = useState(0);
  const [showKeys, setShowKeys]           = useState<Record<string, boolean>>({});
  const [showPw, setShowPw]               = useState<Record<string, boolean>>({});
  const [pinDialog, setPinDialog]         = useState(false);
  const [pinValue, setPinValue]           = useState('');
  const [clearDialog, setClearDialog]     = useState<string | null>(null);
  const [clearEmployeeId, setClearEmployeeId] = useState<string>('all');
  const [clearEmployeeName, setClearEmployeeName] = useState<string>('كل الموظفين');

  // Credential form
  const [secEmail, setSecEmail]       = useState('');
  const [curPw, setCurPw]             = useState('');
  const [newPw, setNewPw]             = useState('');
  const [confirmPw, setConfirmPw]     = useState('');

  // Settings are edited locally first. The rest of the application only sees
  // them after an explicit save.
  const s = draft;
  const theme = draftTheme;
  const locale = draftLocale;
  const update = (patch: Partial<AppSettings>) => {
    setDraft(prev => {
      const next = { ...prev, ...patch };
      if (patch.notif) next.notif = { ...prev.notif, ...patch.notif };
      if (patch.apiKeys) next.apiKeys = { ...prev.apiKeys, ...patch.apiKeys };
      return next;
    });
  };

  const dir = locale === 'ar' ? 'rtl' : 'ltr';
  const sec = visibleSections.find(s => s.id === activeSection) ?? visibleSections[0]!;

  const handleSave = () => {
    save(draft);
    setTheme(draftTheme);
    setLocale(draftLocale);
    toast({ title: 'تم حفظ الإعدادات بنجاح' });
  };

  const toggleNotif = (k: keyof typeof s.notif) =>
    update({ notif: { ...s.notif, [k]: !s.notif[k] } });

  const toggleBiometric = (k: keyof typeof s.biometric) =>
    update({ biometric: { ...s.biometric, [k]: !s.biometric[k] } });

  const [lastBackupTime, setLastBackupTime] = useState<string>(() =>
    localStorage.getItem('workforce-last-backup') || ''
  );

  const createBackup = (silent = false) => {
    const data = JSON.stringify(savedSettings, null, 2);
    const url = URL.createObjectURL(new Blob([data], { type: 'application/json' }));
    const ts = new Date().toISOString().slice(0, 16).replace('T', '_').replace(':', '-');
    Object.assign(document.createElement('a'), { href: url, download: `workforceos-backup-${ts}.json` }).click();
    URL.revokeObjectURL(url);
    const now = new Date().toLocaleString('ar-SA', { dateStyle: 'short', timeStyle: 'short' });
    localStorage.setItem('workforce-last-backup', now);
    setLastBackupTime(now);
    if (!silent) toast({ title: '✅ تم تنزيل النسخة الاحتياطية' });
  };

  // Auto-backup scheduler
  useEffect(() => {
    if (!savedSettings.autoBackup) return;
    const check = () => {
      const lastRaw = localStorage.getItem('workforce-last-backup-ts');
      const last = lastRaw ? new Date(lastRaw).getTime() : 0;
      const now = Date.now();
      const msMap: Record<string, number> = {
        hourly:  60 * 60 * 1000,
        daily:   24 * 60 * 60 * 1000,
        weekly:  7 * 24 * 60 * 60 * 1000,
        monthly: 30 * 24 * 60 * 60 * 1000,
      };
      const interval = msMap[savedSettings.autoBackupInterval] || msMap.daily;
      if (now - last >= interval) {
        localStorage.setItem('workforce-last-backup-ts', new Date().toISOString());
        createBackup(true);
        toast({ title: '⏱️ نسخة احتياطية تلقائية', description: 'تم التنزيل التلقائي حسب جدولك' });
      }
    };
    check();
    const id = setInterval(check, 60 * 60 * 1000); // recheck every hour
    return () => clearInterval(id);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [savedSettings.autoBackup, savedSettings.autoBackupInterval]);

  const restoreBackup = () => {
    const inp = Object.assign(document.createElement('input'), { type: 'file', accept: '.json' });
    inp.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;
      file.text().then(text => {
        try {
          const restored = { ...DEFAULTS, ...JSON.parse(text) } as AppSettings;
          setDraft(restored); save(restored);
          toast({ title: 'تم استعادة الإعدادات' });
        } catch {
          toast({ title: 'ملف غير صالح', variant: 'destructive' });
        }
      });
    };
    inp.click();
  };

  const handleUpdateCredentials = () => {
    if (!curPw) { toast({ title: 'أدخل كلمة المرور الحالية', variant: 'destructive' }); return; }
    if (newPw && newPw !== confirmPw) { toast({ title: 'كلمة المرور الجديدة غير متطابقة', variant: 'destructive' }); return; }
    if (newPw && newPw.length < 8) { toast({ title: 'كلمة المرور يجب أن تكون 8 أحرف أو أكثر', variant: 'destructive' }); return; }
    toast({ title: 'تم تحديث بيانات الدخول بنجاح' });
    setCurPw(''); setNewPw(''); setConfirmPw(''); setSecEmail('');
  };

  const handlePinSave = () => {
    if (!/^\d{6}$/.test(pinValue)) { toast({ title: 'يجب أن يكون الرمز 6 أرقام', variant: 'destructive' }); return; }
    const next = { ...draft, biometric: { ...draft.biometric, pin: true } };
    setDraft(next); save(next);
    toast({ title: 'تم تفعيل رمز PIN' }); setPinDialog(false); setPinValue('');
  };

  const updateCustomKey = (i: number, field: 'name' | 'value', val: string) =>
    update({ customKeys: s.customKeys.map((k, idx) => idx === i ? { ...k, [field]: val } : k) });

  const toggleWidget = (id: string) => {
    const curr = s.dashboardWidgets;
    update({ dashboardWidgets: curr.includes(id) ? curr.filter(w => w !== id) : [...curr, id] });
  };

  const clearLogs = (type: string) => {
    const key = clearEmployeeId !== 'all' 
      ? `workforce-cleared-${type}-emp-${clearEmployeeId}` 
      : `workforce-cleared-${type}`;
    localStorage.setItem(key, new Date().toISOString());
    const typeLabel = type === 'attendance' ? 'سجلات الحضور' : type === 'payroll' ? 'سجلات الرواتب' : type === 'leaves' ? 'سجلات الإجازات' : type === 'all' ? 'جميع السجلات' : 'السجلات';
    const empLabel = clearEmployeeId !== 'all' ? ` — ${clearEmployeeName}` : '';
    toast({ title: `تم مسح ${typeLabel}${empLabel} بنجاح` });
    setClearDialog(null);
  };

  // Live clock preview
  const [liveTime, setLiveTime] = useState(new Date());
  useEffect(() => { const t = setInterval(() => setLiveTime(new Date()), 1000); return () => clearInterval(t); }, []);

  return (
    <div className="h-full flex flex-col animate-fadeIn" dir={dir}>

      {/* Page header */}
      <div className="flex items-center justify-between gap-3 mb-6 shrink-0">
        <div>
          <h1 className="font-display text-2xl font-black tracking-tight">الإعدادات</h1>
          <p className="text-xs text-muted-foreground mt-0.5">تحكم شامل في كل تفاصيل النظام</p>
        </div>
        <button onClick={handleSave}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-sm text-white bg-gradient-to-r from-indigo-500 to-purple-600 shadow-lg shadow-indigo-500/25 hover:-translate-y-0.5 transition">
          <Save className="w-4 h-4" /> حفظ الكل
        </button>
      </div>

      {/* ── Mobile pill nav (above content, column layout) ── */}
      <div className="md:hidden flex gap-2 overflow-x-auto pb-2 scrollbar-none shrink-0">
        {visibleSections.map(sec => (
          <button key={sec.id} onClick={() => setActiveSection(sec.id)}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition border ${
              activeSection === sec.id ? 'text-white border-transparent' : 'border-border text-muted-foreground'
            }`}
            style={activeSection === sec.id ? { background: `linear-gradient(135deg, ${s.appColor}, ${s.appColor}99)` } : {}}>
            <sec.icon className="w-3.5 h-3.5 shrink-0" />
            {sec.label}
          </button>
        ))}
      </div>

      <div className="flex gap-5 flex-1 min-h-0">
        {/* ── Desktop Sidebar ── */}
        <div className="w-52 shrink-0 flex-col gap-1 overflow-y-auto pb-4 scrollbar-none hidden md:flex">
          {visibleSections.map(sec => (
            <button key={sec.id} onClick={() => setActiveSection(sec.id)}
              className={`flex items-center gap-2.5 w-full px-3 py-2.5 rounded-xl text-right text-sm transition-all ${
                activeSection === sec.id
                  ? 'text-white shadow-lg'
                  : 'text-muted-foreground hover:text-foreground hover:bg-white/5'
              }`}
              style={activeSection === sec.id ? { background: `linear-gradient(135deg, ${s.appColor}ee, ${s.appColor}99)` } : {}}>
              <div className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${activeSection === sec.id ? 'bg-white/20' : sec.color}`}>
                <sec.icon className="w-3.5 h-3.5 text-white" />
              </div>
              <div className="text-right min-w-0">
                <p className="font-bold text-[13px] leading-tight truncate">{sec.label}</p>
                <p className={`text-[10px] truncate ${activeSection === sec.id ? 'text-white/70' : 'text-muted-foreground'}`}>{sec.desc}</p>
              </div>
            </button>
          ))}
        </div>

        {/* ── Content ── */}
        <div className="flex-1 overflow-y-auto pb-6 scrollbar-none">

          {/* Section title badge */}
          <div className="flex items-center justify-between gap-3 mb-4">
            <div className="flex items-center gap-2">
            <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${sec.color} shadow-lg`}>
              <sec.icon className="w-4 h-4 text-white" />
            </div>
            <div>
              <h2 className="font-black text-lg leading-tight">{sec.label}</h2>
              <p className="text-[11px] text-muted-foreground">{sec.desc}</p>
            </div>
            </div>
            <button
              onClick={() => { setPreviewKey(key => key + 1); setPreviewOpen(true); }}
              className="shrink-0 flex items-center gap-2 px-3.5 py-2 rounded-xl border border-indigo-500/40 bg-indigo-500/10 text-indigo-300 hover:bg-indigo-500/20 font-bold text-xs transition"
            >
              <Eye className="w-4 h-4" /> معاينة
            </button>
          </div>

          {/* ══════════════════════════════════════════════════════════════
              1. Logo & App Name
          ══════════════════════════════════════════════════════════════ */}
          {activeSection === 'logo' && (
            <div className="grid md:grid-cols-2 gap-4">
              <SCard>
                <CardHead icon={Image} color="bg-indigo-500" title="شعار التطبيق" sub="رفع وتخصيص شعار البرنامج" />
                <div className="space-y-4">
                  <ImgZone label="الشعار الرئيسي" sub="PNG أو SVG — 512×512 موصى به" icon={Image} value={s.logoUrl} onUpload={b => update({ logoUrl: b })} size="lg" />
                  {s.logoUrl && (
                    <button onClick={() => update({ logoUrl: '' })} className="w-full py-2 rounded-xl border border-red-500/30 text-red-400 text-xs font-bold hover:bg-red-500/5 transition flex items-center justify-center gap-1.5">
                      <Trash2 className="w-3.5 h-3.5" /> إزالة الشعار
                    </button>
                  )}

                  {/* ── Logo Size Controls ── */}
                  <div className="rounded-2xl border border-border bg-muted/30 p-4 space-y-4">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm font-bold">حجم وشكل اللوغو</span>
                      <button
                        type="button"
                        onClick={() => update({ logoWidth: 112, logoHeight: 112, logoRadius: 24 })}
                        className="text-[11px] text-muted-foreground hover:text-indigo-400 font-bold transition"
                      >
                        إعادة تعيين
                      </button>
                    </div>

                    {/* Live preview */}
                    <div className="flex items-center justify-center py-3 bg-background/50 rounded-xl border border-border/50 min-h-[100px]">
                      {s.logoUrl ? (
                        <img
                          src={s.logoUrl}
                          alt="preview"
                          style={{
                            width:  `${s.logoWidth ?? 112}px`,
                            height: `${s.logoHeight ?? 112}px`,
                            borderRadius: `${s.logoRadius ?? 24}px`,
                            objectFit: 'contain',
                            maxWidth: '100%',
                          }}
                          className="border border-white/10 bg-white/5 p-1 shadow-lg"
                        />
                      ) : (
                        <div
                          style={{
                            width:  `${s.logoWidth ?? 112}px`,
                            height: `${s.logoHeight ?? 112}px`,
                            borderRadius: `${s.logoRadius ?? 24}px`,
                            maxWidth: '100%',
                          }}
                          className="bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white/60 text-xs font-bold shrink-0"
                        >
                          W
                        </div>
                      )}
                    </div>

                    {/* Width slider */}
                    <div className="space-y-1.5">
                      <div className="flex justify-between text-xs font-semibold text-muted-foreground">
                        <span>العرض</span>
                        <span className="text-foreground font-bold">{s.logoWidth ?? 112}px</span>
                      </div>
                      <input
                        type="range" min={40} max={320} step={4}
                        value={s.logoWidth ?? 112}
                        onChange={e => update({ logoWidth: Number(e.target.value) })}
                        className="w-full accent-indigo-500 cursor-pointer"
                      />
                      <div className="flex justify-between text-[10px] text-muted-foreground/60">
                        <span>40px</span><span>320px</span>
                      </div>
                    </div>

                    {/* Height slider */}
                    <div className="space-y-1.5">
                      <div className="flex justify-between text-xs font-semibold text-muted-foreground">
                        <span>الارتفاع</span>
                        <span className="text-foreground font-bold">{s.logoHeight ?? 112}px</span>
                      </div>
                      <input
                        type="range" min={40} max={320} step={4}
                        value={s.logoHeight ?? 112}
                        onChange={e => update({ logoHeight: Number(e.target.value) })}
                        className="w-full accent-indigo-500 cursor-pointer"
                      />
                      <div className="flex justify-between text-[10px] text-muted-foreground/60">
                        <span>40px</span><span>320px</span>
                      </div>
                    </div>

                    {/* Radius slider */}
                    <div className="space-y-1.5">
                      <div className="flex justify-between text-xs font-semibold text-muted-foreground">
                        <span>استدارة الزوايا</span>
                        <span className="text-foreground font-bold">{s.logoRadius ?? 24}px</span>
                      </div>
                      <input
                        type="range" min={0} max={160} step={2}
                        value={s.logoRadius ?? 24}
                        onChange={e => update({ logoRadius: Number(e.target.value) })}
                        className="w-full accent-indigo-500 cursor-pointer"
                      />
                      <div className="flex justify-between text-[10px] text-muted-foreground/60">
                        <span>مستطيل</span><span>دائرة</span>
                      </div>
                    </div>

                    {/* Lock aspect ratio shortcut */}
                    <button
                      type="button"
                      onClick={() => update({ logoHeight: s.logoWidth ?? 112 })}
                      className="w-full py-1.5 rounded-xl border border-indigo-500/30 text-indigo-400 text-xs font-bold hover:bg-indigo-500/5 transition"
                    >
                      ⊞ تسوية العرض والارتفاع
                    </button>

                    <SaveBtn onClick={handleSave} label="حفظ حجم اللوغو" />
                  </div>

                  <ImgZone label="أيقونة التطبيق" sub="PNG مربع — 192×192" icon={Upload} value={s.iconUrl} onUpload={b => update({ iconUrl: b })} size="sm" />
                </div>
              </SCard>

              <SCard>
                <CardHead icon={Settings2} color="bg-blue-500" title="اسم وهوية التطبيق" sub="المعلومات الأساسية للبرنامج" />
                <div className="space-y-4">
                  <Field label="اسم التطبيق" required>
                    <Inp value={s.appName} onChange={e => update({ appName: e.target.value })} placeholder="WorkforceOS" />
                  </Field>
                  <Field label="الرسالة الترحيبية">
                    <Inp value={s.welcomeMsg} onChange={e => update({ welcomeMsg: e.target.value })} placeholder="أهلاً بك في النظام" />
                  </Field>
                  <Field label="اسم الشركة">
                    <div className="relative">
                      <Building2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <input value={s.companyName} onChange={e => update({ companyName: e.target.value })} placeholder="اسم شركتك"
                        className="w-full rounded-xl pr-9 pl-4 py-2.5 text-sm border border-border bg-transparent focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition" />
                    </div>
                  </Field>
                  <Field label="عنوان الشركة">
                    <div className="relative">
                      <MapPin className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <input value={s.companyAddr} onChange={e => update({ companyAddr: e.target.value })} placeholder="المدينة، الدولة"
                        className="w-full rounded-xl pr-9 pl-4 py-2.5 text-sm border border-border bg-transparent focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition" />
                    </div>
                  </Field>
                  <Field label="هاتف الشركة">
                    <div className="relative">
                      <Phone className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <input value={s.companyPhone} onChange={e => update({ companyPhone: e.target.value })} placeholder="+966 5x xxx xxxx" type="tel"
                        className="w-full rounded-xl pr-9 pl-4 py-2.5 text-sm border border-border bg-transparent focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition" />
                    </div>
                  </Field>
                  <Field label="إيميل الشركة">
                    <div className="relative">
                      <Mail className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <input value={s.companyEmail} onChange={e => update({ companyEmail: e.target.value })} placeholder="info@company.com" type="email"
                        className="w-full rounded-xl pr-9 pl-4 py-2.5 text-sm border border-border bg-transparent focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition" />
                    </div>
                  </Field>
                  {s.appName && (
                    <div className="flex items-center gap-2 px-3 py-2 rounded-xl border border-indigo-500/30 bg-indigo-500/5">
                      {s.logoUrl
                        ? <img src={s.logoUrl} alt="" className="w-6 h-6 object-contain rounded" />
                        : <div className="w-6 h-6 rounded bg-indigo-500/30 flex items-center justify-center"><Settings2 className="w-3.5 h-3.5 text-indigo-400" /></div>
                      }
                      <span className="text-sm font-bold text-indigo-300">{s.appName}</span>
                      {s.companyName && <span className="text-[11px] text-muted-foreground mr-auto">— {s.companyName}</span>}
                    </div>
                  )}
                  <SaveBtn onClick={handleSave} label="حفظ هوية التطبيق" />
                </div>
              </SCard>
            </div>
          )}

          {/* ══════════════════════════════════════════════════════════════
              2. Background & Cards
          ══════════════════════════════════════════════════════════════ */}
          {activeSection === 'background' && (
            <div className="grid md:grid-cols-2 gap-4">
              <SCard>
                <CardHead icon={Palette} color="bg-purple-500" title="الوضع والألوان" sub="الثيم والألوان الرئيسية" />
                <div className="space-y-5">
                  <Field label="وضع العرض">
                    <div className="grid grid-cols-2 gap-2">
                      {[{ v: 'light', icon: Sun, label: 'فاتح' }, { v: 'dark', icon: Moon, label: 'داكن' }].map(({ v, icon: Icon, label }) => (
                        <button key={v} onClick={() => setDraftTheme(v as 'light' | 'dark')}
                          className={`flex items-center justify-center gap-2 py-3 rounded-xl border font-bold text-sm transition ${theme === v ? 'border-purple-500 bg-purple-500/10 text-purple-300' : 'border-border hover:border-purple-500/30 text-muted-foreground'}`}>
                          <Icon className="w-4 h-4" /> {label}
                          {theme === v && <Check className="w-3.5 h-3.5" />}
                        </button>
                      ))}
                    </div>
                  </Field>

                  <Field label="اللون الرئيسي" sub="يُطبق فوراً على كامل التطبيق">
                    <div className="flex flex-wrap gap-2 mt-1">
                      {APP_COLORS.map(c => (
                        <ColorDot key={c} color={c} selected={s.appColor === c} onClick={() => update({ appColor: c })} />
                      ))}
                    </div>
                    <div className="mt-3 flex items-center gap-3 p-3 rounded-xl border border-border bg-white/5">
                      <label className="text-xs text-muted-foreground font-bold">لون مخصص:</label>
                      <input type="color" value={s.appColor} onChange={e => update({ appColor: e.target.value })}
                        className="w-9 h-9 rounded-lg cursor-pointer border border-border" />
                      <span className="font-mono text-sm text-muted-foreground">{s.appColor}</span>
                      <div className="w-6 h-6 rounded-full mr-auto" style={{ background: s.appColor }} />
                    </div>
                  </Field>
                </div>
              </SCard>

              <SCard>
                <CardHead icon={Layers} color="bg-violet-500" title="الخلفية والكروت" sub="شكل وتصميم عناصر الواجهة" />
                <div className="space-y-5">
                  <Field label="نمط الخلفية">
                    <div className="grid grid-cols-2 gap-2">
                      {[
                        { v: 'default', label: 'افتراضي', icon: '⬜' },
                        { v: 'gradient', label: 'تدرج لوني', icon: '🌈' },
                        { v: 'dotted', label: 'نقطي ناعم', icon: '⋯' },
                        { v: 'grid', label: 'شبكي', icon: '⊞' },
                      ].map(({ v, label, icon }) => (
                        <button key={v} onClick={() => update({ background: v })}
                          className={`flex items-center gap-2 py-3 px-3 rounded-xl border font-bold text-xs transition ${s.background === v ? 'border-violet-500 bg-violet-500/10 text-violet-300' : 'border-border hover:border-violet-500/30 text-muted-foreground'}`}>
                          <span className="text-base">{icon}</span> {label}
                          {s.background === v && <Check className="w-3 h-3 mr-auto" />}
                        </button>
                      ))}
                    </div>
                  </Field>

                  <Field label="تصميم الكروت">
                    <div className="grid grid-cols-2 gap-2">
                      {[
                        { v: 'auto', label: 'تلقائي' },
                        { v: 'glass', label: 'زجاجي شفاف' },
                        { v: 'solid-dark', label: 'داكن صلب' },
                        { v: 'solid-light', label: 'فاتح صلب' },
                      ].map(({ v, label }) => (
                        <button key={v} onClick={() => update({ cardColors: v })}
                          className={`py-2.5 rounded-xl border font-bold text-xs transition ${s.cardColors === v ? 'border-violet-500 bg-violet-500/10 text-violet-300' : 'border-border hover:border-violet-500/30 text-muted-foreground'}`}>
                          {label}
                        </button>
                      ))}
                    </div>
                  </Field>

                  <Field label="لون الأزرار">
                    <Sel value={s.buttonColor} onChange={e => update({ buttonColor: e.target.value })}>
                      <option value="auto">تلقائي (لون التطبيق)</option>
                      <option value="gradient">متدرج بنفسجي</option>
                      <option value="green">أخضر</option>
                      <option value="blue">أزرق</option>
                      <option value="rose">وردي</option>
                    </Sel>
                  </Field>

                  <Field label="شكل الأيقونات">
                    <BtnPicker
                      options={[{ v: 'rounded', label: 'مدور' }, { v: 'square', label: 'مربع' }, { v: 'circle', label: 'دائري' }]}
                      value={s.iconStyle}
                      onChange={v => update({ iconStyle: v as any })}
                    />
                  </Field>

                  {/* Live preview */}
                  <div className="rounded-xl border border-border p-4 bg-white/5">
                    <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-wider mb-3">معاينة الكروت</p>
                    <div className="grid grid-cols-3 gap-2">
                      {['الحضور', 'الرواتب', 'الإجازات'].map((label, i) => (
                        <div key={i} className="rounded-lg border border-border p-2.5 text-center" style={{ background: 'var(--card)' }}>
                          <div className="w-6 h-6 rounded mx-auto mb-1 flex items-center justify-center" style={{ background: s.appColor + '33' }}>
                            <span className="text-[10px]">✦</span>
                          </div>
                          <p className="text-[10px] font-bold text-muted-foreground">{label}</p>
                        </div>
                      ))}
                    </div>
                  </div>

                  <SaveBtn onClick={handleSave} label="حفظ المظهر" color="violet" />
                </div>
              </SCard>
            </div>
          )}

          {/* ══════════════════════════════════════════════════════════════
              3. Clock
          ══════════════════════════════════════════════════════════════ */}
          {activeSection === 'clock' && (
            <div className="grid md:grid-cols-2 gap-4">
              <SCard>
                <CardHead icon={Clock4} color="bg-sky-500" title="شكل الساعة" sub="تخصيص الساعة المباشرة" />
                <div className="space-y-5">
                  <Field label="شكل الساعة ثلاثية الأبعاد المتحركة">
                    <div className="grid grid-cols-2 gap-2">
                      {([
                        { v: 'digital', label: '🔢 رقمي 3D' },
                        { v: 'analog',  label: '🕐 تناظري 3D' },
                        { v: 'flip',    label: '🔄 انقلاب' },
                        { v: 'neon',    label: '💫 نيون دائري' },
                      ] as {v:string;label:string}[]).map(({ v, label }) => (
                        <button key={v} onClick={() => update({ clockType: v as any })}
                          className={`py-2.5 rounded-xl border font-bold text-sm transition ${s.clockType === v ? 'border-sky-500 bg-sky-500/10 text-sky-300' : 'border-border hover:border-sky-500/30 text-muted-foreground'}`}>
                          {label}
                        </button>
                      ))}
                    </div>
                  </Field>

                  <Field label="لون الساعة">
                    <div className="flex flex-wrap gap-2 mt-1">
                      {APP_COLORS.map(c => (
                        <ColorDot key={c} color={c} selected={s.clockColor === c} onClick={() => update({ clockColor: c })} />
                      ))}
                    </div>
                    <div className="mt-2 flex items-center gap-2">
                      <input type="color" value={s.clockColor} onChange={e => update({ clockColor: e.target.value })}
                        className="w-8 h-8 rounded cursor-pointer border border-border" />
                      <span className="font-mono text-xs text-muted-foreground">{s.clockColor}</span>
                    </div>
                  </Field>

                  <Field label="حجم الساعة">
                    <BtnPicker
                      options={[{ v: 'small', label: 'صغير' }, { v: 'medium', label: 'متوسط' }, { v: 'large', label: 'كبير' }]}
                      value={s.clockSize}
                      onChange={v => update({ clockSize: v as any })}
                      color="sky"
                    />
                  </Field>

                  <Field label="مكان عرض الساعة">
                    <Sel value={s.clockPos} onChange={e => update({ clockPos: e.target.value as any })}>
                      <option value="header">الشريط العلوي</option>
                      <option value="sidebar">القائمة الجانبية</option>
                      <option value="dashboard">لوحة التحكم</option>
                      <option value="floating">عائمة (طافية)</option>
                      <option value="hidden">مخفية</option>
                    </Sel>
                  </Field>

                  <Field label="شكل ساعة التطبيق">
                    <BtnPicker
                      options={[{ v: 'digital', label: 'رقمي' }, { v: 'analog', label: 'تناظري' }, { v: 'minimal', label: 'مبسط' }]}
                      value={s.clockStyle}
                      onChange={v => update({ clockStyle: v as any })}
                    />
                  </Field>
                </div>
              </SCard>

              <SCard>
                <CardHead icon={Timer} color="bg-cyan-500" title="خيارات العرض" sub="ما يظهر مع الساعة" />
                <div>
                  <TRow label="إظهار التاريخ" sub="يوم / شهر / سنة تحت الوقت" on={s.showDate} onToggle={() => update({ showDate: !s.showDate })} />
                  <TRow label="إظهار الثواني" sub="hh:mm:ss بدل hh:mm" on={s.showSeconds} onToggle={() => update({ showSeconds: !s.showSeconds })} />
                  <TRow label="اليوم بالعربي" sub="الإثنين، الثلاثاء..." on={s.showArabicDay} onToggle={() => update({ showArabicDay: !s.showArabicDay })} />
                  <TRow label="صيغة 12 ساعة" sub="AM / PM بدل 24 ساعة" on={s.show12h} onToggle={() => update({ show12h: !s.show12h })} />
                  <TRow label="ساعة الحضور" sub="وقت تسجيل الدخول بجانب الساعة" on={s.showShiftClock} onToggle={() => update({ showShiftClock: !s.showShiftClock })} />
                </div>

                {/* Live preview */}
                <div className="mt-5 rounded-xl border border-border bg-black/40 p-5 flex flex-col items-center gap-3">
                  <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-wider">معاينة مباشرة</p>
                  <ClockPreview clockType={s.clockType} clockColor={s.clockColor} clockSize={s.clockSize} />
                  {s.showDate && (
                    <p className="text-xs text-muted-foreground">
                      {liveTime.toLocaleDateString('en-GB', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                    </p>
                  )}
                </div>

                <div className="mt-4">
                  <SaveBtn onClick={handleSave} label="حفظ إعدادات الساعة" color="sky" icon={Clock4} />
                </div>
              </SCard>
            </div>
          )}

          {/* ══════════════════════════════════════════════════════════════
              4. API Keys
          ══════════════════════════════════════════════════════════════ */}
          {activeSection === 'apikeys' && (
            <div className="grid md:grid-cols-2 gap-4">
              <SCard>
                <CardHead icon={Key} color="bg-amber-500" title="مفاتيح الذكاء الاصطناعي" sub="مزودو خدمات AI" />
                <div className="space-y-4">
                  {[
                    { id: 'openai', label: 'OpenAI (ChatGPT)', placeholder: 'sk-...', color: 'text-green-400' },
                    { id: 'gemini', label: 'Google Gemini', placeholder: 'AIza...', color: 'text-blue-400' },
                    { id: 'claude', label: 'Anthropic Claude', placeholder: 'sk-ant-...', color: 'text-orange-400' },
                  ].map(({ id, label, placeholder, color }) => (
                    <Field key={id} label={label}>
                      <div className="relative">
                        <input type={showKeys[id] ? 'text' : 'password'}
                          value={s.apiKeys[id] || ''}
                          onChange={e => update({ apiKeys: { ...s.apiKeys, [id]: e.target.value } })}
                          placeholder={placeholder}
                          className="w-full rounded-xl px-4 py-2.5 text-sm border border-border bg-transparent focus:outline-none focus:ring-2 focus:ring-amber-500/50 pr-10 font-mono transition" />
                        <button type="button" onClick={() => setShowKeys(v => ({ ...v, [id]: !v[id] }))}
                          className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition">
                          {showKeys[id] ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                      {s.apiKeys[id] && (
                        <div className={`flex items-center gap-1.5 mt-1 text-[11px] font-bold ${color}`}>
                          <CheckCircle2 className="w-3 h-3" /> مفتاح مُدخل
                        </div>
                      )}
                    </Field>
                  ))}
                  <SaveBtn onClick={handleSave} label="حفظ مفاتيح الذكاء الاصطناعي" color="amber" icon={Key} />
                </div>
              </SCard>

              <div className="space-y-4">
                <SCard>
                  <CardHead icon={Zap} color="bg-orange-500" title="مفاتيح الخدمات" sub="Firebase وMaps وSMTP" />
                  <div className="space-y-4">
                    {[
                      { id: 'firebase', label: 'Firebase', placeholder: 'AIza...' },
                      { id: 'maps', label: 'Google Maps API', placeholder: 'AIza...' },
                      { id: 'smtp', label: 'SMTP Email', placeholder: 'smtp://user:pass@host' },
                      { id: 'whatsapp', label: 'WhatsApp Business API', placeholder: 'token...' },
                    ].map(({ id, label, placeholder }) => (
                      <Field key={id} label={label}>
                        <div className="relative">
                          <input type={showKeys[id] ? 'text' : 'password'}
                            value={s.apiKeys[id] || ''}
                            onChange={e => update({ apiKeys: { ...s.apiKeys, [id]: e.target.value } })}
                            placeholder={placeholder}
                            className="w-full rounded-xl px-4 py-2.5 text-sm border border-border bg-transparent focus:outline-none focus:ring-2 focus:ring-orange-500/50 pr-10 font-mono transition" />
                          <button type="button" onClick={() => setShowKeys(v => ({ ...v, [id]: !v[id] }))}
                            className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition">
                            {showKeys[id] ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                          </button>
                        </div>
                      </Field>
                    ))}
                    <SaveBtn onClick={handleSave} label="حفظ مفاتيح الخدمات" color="orange" />
                  </div>
                </SCard>

                <SCard>
                  <CardHead icon={Settings2} color="bg-yellow-600" title="مفاتيح مخصصة" sub="أضف مفاتيح لخدمات إضافية" />
                  <div className="space-y-2.5">
                    {s.customKeys.map((ck, i) => (
                      <div key={i} className="flex gap-2">
                        <input value={ck.name} onChange={e => updateCustomKey(i, 'name', e.target.value)} placeholder="اسم الخدمة"
                          className="w-2/5 rounded-xl px-3 py-2 text-sm border border-border bg-transparent focus:outline-none focus:ring-2 focus:ring-yellow-500/50 transition" />
                        <div className="relative flex-1">
                          <input type={showKeys[`c${i}`] ? 'text' : 'password'} value={ck.value} onChange={e => updateCustomKey(i, 'value', e.target.value)} placeholder="المفتاح"
                            className="w-full rounded-xl px-3 py-2 text-sm border border-border bg-transparent focus:outline-none focus:ring-2 focus:ring-yellow-500/50 font-mono pr-8 transition" />
                          <button type="button" onClick={() => setShowKeys(v => ({ ...v, [`c${i}`]: !v[`c${i}`] }))}
                            className="absolute left-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition">
                            {showKeys[`c${i}`] ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                          </button>
                        </div>
                        <button onClick={() => update({ customKeys: s.customKeys.filter((_, idx) => idx !== i) })}
                          className="p-2 rounded-xl border border-border hover:border-red-500/40 hover:text-red-400 transition">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                    <button onClick={() => update({ customKeys: [...s.customKeys, { name: '', value: '' }] })}
                      className="w-full py-2.5 rounded-xl border border-dashed border-amber-500/40 text-amber-400 text-sm font-bold hover:bg-amber-500/5 transition flex items-center justify-center gap-2">
                      <Plus className="w-4 h-4" /> إضافة مفتاح جديد
                    </button>
                  </div>
                  <InfoBox text="المفاتيح تُخزن بأمان في المتصفح. لا تشاركها مع أحد." type="warning" />
                </SCard>
              </div>
            </div>
          )}

          {/* ══════════════════════════════════════════════════════════════
              5. Language
          ══════════════════════════════════════════════════════════════ */}
          {activeSection === 'language' && (
            <div className="grid md:grid-cols-2 gap-4">
              <SCard>
                <CardHead icon={Globe} color="bg-teal-500" title="لغة التطبيق" sub="اختر اللغة الأساسية" />
                <div className="space-y-5">
                  <Field label="اللغة الرئيسية">
                    <div className="grid grid-cols-1 gap-2">
                      {[
                        { v: 'ar', label: 'العربية', flag: '🇸🇦', dir: 'RTL' },
                        { v: 'en', label: 'English', flag: '🇺🇸', dir: 'LTR' },
                        { v: 'sv', label: 'Svenska', flag: '🇸🇪', dir: 'LTR' },
                      ].map(({ v, label, flag, dir: d }) => (
                        <button key={v}
                          onClick={() => { setDraftLocale(v as any); update({ language: v as any }); }}
                          className={`flex items-center gap-3 w-full px-4 py-3 rounded-xl border font-bold text-sm transition ${locale === v ? 'border-teal-500 bg-teal-500/10 text-teal-300' : 'border-border hover:border-teal-500/30 text-muted-foreground'}`}>
                          <span className="text-2xl">{flag}</span>
                          <div className="text-right">
                            <p className="font-bold">{label}</p>
                            <p className="text-[11px] text-muted-foreground">{d} اتجاه الكتابة</p>
                          </div>
                          {locale === v && <Check className="w-4 h-4 mr-auto" />}
                        </button>
                      ))}
                    </div>
                  </Field>
                </div>
              </SCard>

              <SCard>
                <CardHead icon={Calendar} color="bg-emerald-500" title="التنسيق والتقويم" sub="التاريخ والوقت والعملة" />
                <div className="space-y-4">
                  <Field label="نوع التقويم">
                    <Sel value={s.calendarType} onChange={e => update({ calendarType: e.target.value as any })}>
                      <option value="gregorian">ميلادي (Gregorian)</option>
                      <option value="hijri">هجري (Islamic)</option>
                      <option value="both">كلاهما (ميلادي + هجري)</option>
                    </Sel>
                  </Field>

                  <Field label="تنسيق التاريخ">
                    <Sel value={s.dateFormat} onChange={e => update({ dateFormat: e.target.value })}>
                      <option value="DD/MM/YYYY">DD/MM/YYYY (31/12/2025)</option>
                      <option value="MM/DD/YYYY">MM/DD/YYYY (12/31/2025)</option>
                      <option value="YYYY-MM-DD">YYYY-MM-DD (2025-12-31)</option>
                    </Sel>
                  </Field>

                  <Field label="العملة">
                    <Sel value={s.currencyCode} onChange={e => update({ currencyCode: e.target.value })}>
                      <option value="SEK">كرون سويدي (SEK)</option>
                      <option value="LOY">نقاط الولاء (LOY)</option>
                      <option value="EUR">يورو (EUR)</option>
                      <option value="USD">دولار أمريكي (USD)</option>
                    </Sel>
                  </Field>

                  <Field label="المنطقة الزمنية">
                    <Sel value={s.timezone} onChange={e => update({ timezone: e.target.value })}>
                      <option value="Asia/Riyadh">الرياض (UTC+3)</option>
                      <option value="Asia/Dubai">دبي (UTC+4)</option>
                      <option value="Asia/Kuwait">الكويت (UTC+3)</option>
                      <option value="Asia/Qatar">قطر (UTC+3)</option>
                      <option value="Asia/Bahrain">البحرين (UTC+3)</option>
                      <option value="Asia/Muscat">مسقط (UTC+4)</option>
                      <option value="Asia/Amman">عمّان (UTC+3)</option>
                      <option value="Africa/Cairo">القاهرة (UTC+2)</option>
                      <option value="Europe/London">لندن (UTC+0)</option>
                      <option value="America/New_York">نيويورك (UTC-5)</option>
                    </Sel>
                  </Field>

                  <Field label="تنسيق الأرقام">
                    <BtnPicker
                      options={[{ v: 'western', label: '123 (غربي)' }, { v: 'arabic', label: '١٢٣ (عربي)' }]}
                      value={s.numberFormat}
                      onChange={v => update({ numberFormat: v as any })}
                      color="teal"
                    />
                  </Field>

                  <div className="p-3 rounded-xl bg-teal-500/5 border border-teal-500/20 space-y-1 text-sm">
                    <p className="text-teal-300 font-bold text-xs">معاينة التنسيق</p>
                    <p className="text-muted-foreground">
                      التاريخ: {new Date().toLocaleDateString(locale === 'ar' ? 'ar-SA' : locale === 'sv' ? 'sv-SE' : 'en-US')}
                    </p>
                    <p className="text-muted-foreground">
                      المبلغ: {s.currencyCode === 'LOY' ? `${new Intl.NumberFormat(locale === 'ar' ? 'ar-SA' : 'en-US', { maximumFractionDigits: 0 }).format(15000)} نق.` : new Intl.NumberFormat(locale === 'ar' ? 'ar-SA' : 'en-US', { style: 'currency', currency: s.currencyCode, maximumFractionDigits: 0 }).format(15000)}
                    </p>
                  </div>

                  <SaveBtn onClick={handleSave} label="حفظ إعدادات اللغة" color="teal" icon={Globe} />
                </div>
              </SCard>
            </div>
          )}

          {/* ══════════════════════════════════════════════════════════════
              6. Alarm / Notifications
          ══════════════════════════════════════════════════════════════ */}
          {activeSection === 'alarm' && (
            <div className="grid md:grid-cols-2 gap-4">
              <SCard>
                <CardHead icon={Bell} color="bg-orange-500" title="قنوات الإشعارات" sub="كيف وأين تصلك التنبيهات" />
                <div>
                  <TRow label="إشعارات التطبيق" sub="تنبيهات داخل النظام" on={s.notif.app} onToggle={() => toggleNotif('app')} />
                  <TRow label="إشعارات البريد الإلكتروني" sub="ترسل إلى إيميلك المسجل" on={s.notif.email} onToggle={() => toggleNotif('email')} />
                  <TRow label="إشعارات واتساب" sub="رسائل WhatsApp تلقائية" on={s.notif.whatsapp} onToggle={() => toggleNotif('whatsapp')} />
                  <TRow label="أصوات التنبيه" sub="صوت عند كل إشعار" on={s.notif.sound} onToggle={() => toggleNotif('sound')} />
                </div>
                <div className="mt-4 space-y-3">
                  <Field label="نبرة صوت التنبيه">
                    <Sel value={s.notifSoundTone} onChange={e => update({ notifSoundTone: e.target.value })} disabled={!s.notif.sound}>
                      <option value="default">افتراضي</option>
                      <option value="soft">ناعم</option>
                      <option value="strong">قوي</option>
                      <option value="ping">نقرة</option>
                      <option value="silent">صامت</option>
                    </Sel>
                  </Field>
                  <AlarmTestButton disabled={!s.notif.sound} tone={s.notifSoundTone} />
                </div>
              </SCard>

              <SCard>
                <CardHead icon={AlarmClock} color="bg-red-500" title="المنبهات والتذكيرات" sub="أوقات تنبيهات الدوام" />
                <div>
                  <TRow label="منبه بداية الدوام" sub="تنبيه قبل بدء العمل" on={s.notif.shiftStart} onToggle={() => toggleNotif('shiftStart')} />
                  <TRow label="منبه نهاية الدوام" sub="تنبيه عند انتهاء الوقت" on={s.notif.shiftEnd} onToggle={() => toggleNotif('shiftEnd')} />
                  <TRow label="تذكير الرواتب" sub="إشعار يوم صرف الراتب" on={s.notif.salary} onToggle={() => toggleNotif('salary')} />
                  <TRow label="تذكير الإجازات" sub="إشعار عند اعتماد أو رفض إجازة" on={s.notif.leaves} onToggle={() => toggleNotif('leaves')} />
                </div>
                <div className="mt-4 space-y-3">
                  <Field label="وقت منبه البداية">
                    <Inp type="time" value={s.shiftStartAlarm} onChange={e => update({ shiftStartAlarm: e.target.value })} disabled={!s.notif.shiftStart} />
                  </Field>
                  <Field label="وقت منبه النهاية">
                    <Inp type="time" value={s.shiftEndAlarm} onChange={e => update({ shiftEndAlarm: e.target.value })} disabled={!s.notif.shiftEnd} />
                  </Field>
                  <div className="flex items-center gap-2 p-3 rounded-xl border border-red-500/20 bg-red-500/5">
                    <AlarmClock className="w-4 h-4 text-red-400 shrink-0" />
                    <div className="text-xs">
                      <p className="text-red-300 font-bold">المنبهات المُفعَّلة</p>
                      <p className="text-muted-foreground">
                        {s.notif.shiftStart ? `بداية: ${s.shiftStartAlarm}` : ''} {s.notif.shiftStart && s.notif.shiftEnd ? '·' : ''} {s.notif.shiftEnd ? `نهاية: ${s.shiftEndAlarm}` : ''}
                        {!s.notif.shiftStart && !s.notif.shiftEnd && 'لا توجد منبهات مفعلة'}
                      </p>
                    </div>
                  </div>
                  <SaveBtn onClick={handleSave} label="حفظ إعدادات الإشعارات" color="orange" icon={Bell} />
                </div>
              </SCard>
            </div>
          )}

          {/* ══════════════════════════════════════════════════════════════
              7. Splash Screen
          ══════════════════════════════════════════════════════════════ */}
          {activeSection === 'splash' && (
            <div className="grid md:grid-cols-2 gap-4">

              {/* ── Theme Picker ── */}
              <div className="md:col-span-2">
                <SCard>
                  <CardHead icon={Palette} color="bg-violet-500" title="تصميم شاشة البداية" sub="اختر ثيم الشاشة المتحركة الثلاثي" />
                  <style>{`
                    @keyframes th-spin  { to{transform:rotate(360deg)} }
                    @keyframes th-spinR { to{transform:rotate(-360deg)} }
                    @keyframes th-pulse { 0%,100%{opacity:.5;transform:scale(1)} 50%{opacity:1;transform:scale(1.1)} }
                    @keyframes th-twinkle { 0%,100%{opacity:.1} 50%{opacity:.9} }
                    @keyframes th-rise  { 0%{transform:translateY(0);opacity:.8} 100%{transform:translateY(-60px);opacity:0} }
                    @keyframes th-scan  { 0%{transform:translateY(-100%)} 100%{transform:translateY(200px)} }
                    @keyframes th-gather{ 0%{transform:translate(var(--gx),var(--gy));opacity:0} 30%{opacity:1} 100%{transform:translate(0,0);opacity:0} }
                    @keyframes th-smoke { 0%{transform:translateY(0) scaleX(1);opacity:.5} 100%{transform:translateY(-50px) scaleX(2);opacity:0} }
                    @keyframes th-sweep { 0%{transform:translateX(-100%)} 100%{transform:translateX(300%)} }
                    @keyframes th-orb   { 0%,100%{box-shadow:0 0 12px 4px var(--oc),0 0 24px 8px var(--oc2)} 50%{box-shadow:0 0 20px 8px var(--oc),0 0 40px 14px var(--oc2)} }
                    @keyframes th-curtL { 0%{transform:translateX(0)} 100%{transform:translateX(-110%)} }
                    @keyframes th-curtR { 0%{transform:translateX(0)} 100%{transform:translateX(110%)} }
                  `}</style>
                  <div className="grid grid-cols-2 gap-3 mt-1">
                    {THEMES_CATALOG.map(theme => {
                      const isActive = s.splashTheme === theme.id;
                      return (
                        <button
                          key={theme.id}
                          onClick={() => update({ splashTheme: theme.id as any })}
                          className={`relative rounded-2xl overflow-hidden text-right transition-all duration-200 ${
                            isActive
                              ? 'ring-2 ring-violet-400 shadow-lg shadow-violet-500/30 scale-[1.02]'
                              : 'hover:ring-1 hover:ring-white/20 hover:scale-[1.01]'
                          }`}
                          style={{ border: 'none', padding: 0, cursor: 'pointer' }}
                        >
                          {/* Animated thumbnail */}
                          <ThemeThumbnail themeId={theme.id} accent={theme.accent} bg={theme.bg} />
                          {/* Active checkmark */}
                          {isActive && (
                            <div className="absolute top-2 right-2 w-5 h-5 rounded-full bg-violet-500 flex items-center justify-center shadow">
                              <svg width="10" height="10" viewBox="0 0 10 10"><path d="M2 5l2.5 2.5L8 3" stroke="white" strokeWidth="1.5" fill="none" strokeLinecap="round" strokeLinejoin="round"/></svg>
                            </div>
                          )}
                          {/* Label */}
                          <div className="px-2.5 py-2" style={{ background: 'rgba(0,0,0,.55)', backdropFilter: 'blur(8px)' }}>
                            <p className="font-bold text-xs text-white">{theme.nameAr}</p>
                            <p className="text-[9px] mt-0.5 leading-tight" style={{ color: theme.accent }}>{theme.descAr}</p>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </SCard>
              </div>

              <SCard>
                <CardHead icon={Sparkles} color="bg-pink-500" title="شاشة البداية" sub="تخصيص شاشة الترحيب" />
                <div className="space-y-4">
                  <ImgZone label="صورة خلفية الشاشة" sub="تظهر خلف الشعار أثناء التحميل" icon={Layers} value={s.splashUrl} onUpload={b => update({ splashUrl: b })} size="lg" />
                  {s.splashUrl && (
                    <button onClick={() => update({ splashUrl: '' })} className="w-full py-2 rounded-xl border border-red-500/30 text-red-400 text-xs font-bold hover:bg-red-500/5 transition flex items-center justify-center gap-1.5">
                      <Trash2 className="w-3.5 h-3.5" /> إزالة الصورة
                    </button>
                  )}

                  <Field label="مدة عرض الشاشة">
                    <Sel value={s.splashDuration} onChange={e => update({ splashDuration: e.target.value })}>
                      <option value="1000">ثانية واحدة</option>
                      <option value="1500">1.5 ثانية</option>
                      <option value="2000">2 ثانية</option>
                      <option value="2500">2.5 ثانية</option>
                      <option value="3000">3 ثواني</option>
                      <option value="4000">4 ثواني</option>
                    </Sel>
                  </Field>

                  <Field label="تأثير الانتقال">
                    <BtnPicker
                      options={[{ v: 'fade', label: 'تلاشي' }, { v: 'slide', label: 'انزلاق' }, { v: 'zoom', label: 'تكبير' }, { v: 'none', label: 'بلا' }]}
                      value={s.splashEffect}
                      onChange={v => update({ splashEffect: v as any })}
                      color="pink"
                    />
                  </Field>

                  <Field label="لون خلفية الشاشة">
                    <div className="flex items-center gap-3">
                      <input type="color" value={s.splashBgColor} onChange={e => update({ splashBgColor: e.target.value })}
                        className="w-12 h-12 rounded-xl cursor-pointer border border-border" />
                      <span className="font-mono text-sm text-muted-foreground">{s.splashBgColor}</span>
                      <div className="w-8 h-8 rounded-lg mr-auto" style={{ background: s.splashBgColor }} />
                    </div>
                  </Field>
                </div>
              </SCard>

              <SCard>
                <CardHead icon={Monitor} color="bg-rose-500" title="محتوى الشاشة" sub="ما يظهر أثناء التحميل" />
                <div className="space-y-1">
                  <TRow label="إظهار الشعار" sub="اللوغو في وسط الشاشة" on={s.splashShowLogo} onToggle={() => update({ splashShowLogo: !s.splashShowLogo })} />
                  <TRow label="إظهار اسم التطبيق" sub="اسم البرنامج تحت الشعار" on={s.splashShowName} onToggle={() => update({ splashShowName: !s.splashShowName })} />
                  <TRow label="شريط التحميل" sub="مؤشر تقدم في أسفل الشاشة" on={s.splashShowProgress} onToggle={() => update({ splashShowProgress: !s.splashShowProgress })} />
                </div>

                {/* Live animated splash preview */}
                <SplashLivePreview settings={s} />

                <div className="mt-4">
                  <SaveBtn onClick={handleSave} label="حفظ شاشة الترحيب" color="pink" icon={Sparkles} />
                </div>
              </SCard>
            </div>
          )}

          {/* ══════════════════════════════════════════════════════════════
              8. Location
          ══════════════════════════════════════════════════════════════ */}
          {activeSection === 'location' && (
            <div className="grid md:grid-cols-2 gap-4">
              <SCard>
                <CardHead icon={MapPin} color="bg-green-500" title="إعدادات الموقع" sub="GPS والجيوفنس" />
                <div className="space-y-4">
                  <Field label="وضع تحديد الموقع">
                    <div className="grid grid-cols-1 gap-2">
                      {[
                        { v: 'gps', label: 'GPS تلقائي', sub: 'يستخدم موقع الجهاز', icon: Navigation },
                        { v: 'manual', label: 'إدخال يدوي', sub: 'إحداثيات محددة', icon: MapPin },
                        { v: 'both', label: 'GPS + يدوي', sub: 'يقبل كلا الطريقتين', icon: Map },
                      ].map(({ v, label, sub, icon: Icon }) => (
                        <button key={v} onClick={() => update({ locationMode: v as any })}
                          className={`flex items-center gap-3 px-4 py-3 rounded-xl border text-sm transition ${s.locationMode === v ? 'border-green-500 bg-green-500/10' : 'border-border hover:border-green-500/30'}`}>
                          <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${s.locationMode === v ? 'bg-green-500/20' : 'bg-white/5'}`}>
                            <Icon className={`w-4 h-4 ${s.locationMode === v ? 'text-green-400' : 'text-muted-foreground'}`} />
                          </div>
                          <div className="text-right">
                            <p className={`font-bold ${s.locationMode === v ? 'text-green-300' : ''}`}>{label}</p>
                            <p className="text-[11px] text-muted-foreground">{sub}</p>
                          </div>
                          {s.locationMode === v && <Check className="w-4 h-4 text-green-400 mr-auto" />}
                        </button>
                      ))}
                    </div>
                  </Field>

                  <Field label="نطاق الجيوفنس (أمتار)" sub="المسافة المسموح بها من موقع العمل">
                    <div className="space-y-2">
                      <Inp type="number" value={s.locationRadius} onChange={e => update({ locationRadius: e.target.value })} min="50" max="5000" />
                      <input type="range" min="50" max="1000" value={Number(s.locationRadius)} onChange={e => update({ locationRadius: e.target.value })} className="w-full accent-green-500" />
                      <div className="flex justify-between text-[10px] text-muted-foreground">
                        <span>50م</span><span className="font-bold text-green-400">{s.locationRadius}م</span><span>1000م</span>
                      </div>
                    </div>
                  </Field>

                  <Field label="مزود الخرائط">
                    <Sel value={s.locationProvider} onChange={e => update({ locationProvider: e.target.value })}>
                      <option value="google">Google Maps</option>
                      <option value="openstreetmap">OpenStreetMap (مجاني)</option>
                      <option value="mapbox">Mapbox</option>
                      <option value="here">HERE Maps</option>
                    </Sel>
                  </Field>
                </div>
              </SCard>

              <SCard>
                <CardHead icon={Map} color="bg-emerald-500" title="موقع الشركة" sub="إعداد الموقع الجغرافي" />
                <div className="space-y-4">
                  <Field label="عنوان الشركة">
                    <div className="relative">
                      <MapPin className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <input value={s.locationAddress} onChange={e => update({ locationAddress: e.target.value })} placeholder="المدينة، الحي، الشارع"
                        className="w-full rounded-xl pr-9 pl-4 py-2.5 text-sm border border-border bg-transparent focus:outline-none focus:ring-2 focus:ring-green-500/50 transition" />
                    </div>
                  </Field>

                  <div className="grid grid-cols-2 gap-3">
                    <Field label="خط العرض (Lat)">
                      <Inp type="number" step="0.000001" value={s.locationLat} onChange={e => update({ locationLat: e.target.value })} placeholder="24.7136" />
                    </Field>
                    <Field label="خط الطول (Lng)">
                      <Inp type="number" step="0.000001" value={s.locationLng} onChange={e => update({ locationLng: e.target.value })} placeholder="46.6753" />
                    </Field>
                  </div>

                  <button
                    onClick={() => {
                      if (navigator.geolocation) {
                        navigator.geolocation.getCurrentPosition(pos => {
                          update({ locationLat: pos.coords.latitude.toFixed(6), locationLng: pos.coords.longitude.toFixed(6) });
                          toast({ title: 'تم تحديد موقعك الحالي' });
                        }, () => toast({ title: 'تعذر تحديد الموقع', variant: 'destructive' }));
                      }
                    }}
                    className="w-full py-2.5 rounded-xl border border-green-500/40 text-green-400 font-bold text-sm hover:bg-green-500/5 transition flex items-center justify-center gap-2">
                    <Navigation className="w-4 h-4" /> استخدام موقعي الحالي
                  </button>

                  <div className="space-y-1">
                    <TRow label="إلزامية الموقع عند التسجيل" sub="يجب تفعيل GPS عند الحضور" on={s.requireLocationOnClock} onToggle={() => update({ requireLocationOnClock: !s.requireLocationOnClock })} />
                    <TRow label="إظهار الخريطة في الحضور" sub="عرض خريطة مصغرة" on={s.showMapOnAttendance} onToggle={() => update({ showMapOnAttendance: !s.showMapOnAttendance })} />
                  </div>

                  {s.locationLat && s.locationLng && (
                    <InfoBox text={`الموقع المحدد: ${s.locationLat}°N, ${s.locationLng}°E — نطاق ${s.locationRadius}م`} type="success" />
                  )}

                  <SaveBtn onClick={handleSave} label="حفظ إعدادات الموقع" color="green" icon={MapPin} />
                </div>
              </SCard>
            </div>
          )}

          {/* ══════════════════════════════════════════════════════════════
              9. AI Assistant
          ══════════════════════════════════════════════════════════════ */}
          {activeSection === 'assistant' && (
            <div className="grid md:grid-cols-2 gap-4">
              <SCard>
                <CardHead icon={Bot} color="bg-rose-500" title="المساعد الذكي" sub="تخصيص مساعد الذكاء الاصطناعي" />
                <div className="space-y-5">
                  <div className="flex items-center justify-between p-4 rounded-xl bg-gradient-to-r from-rose-500/10 to-pink-500/10 border border-rose-500/20">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-rose-500 to-pink-500 flex items-center justify-center overflow-hidden shadow-lg">
                        {s.assistantAvatarUrl
                          ? <img src={s.assistantAvatarUrl} alt="" className="w-full h-full object-cover" />
                          : <Bot className="w-6 h-6 text-white" />}
                      </div>
                      <div>
                        <p className="font-bold">{s.assistantName || 'WorkBot'}</p>
                        <p className="text-[11px] text-muted-foreground">{s.assistantOn ? '✅ نشط' : '⭕ معطل'}</p>
                      </div>
                    </div>
                    <Toggle on={s.assistantOn} onToggle={() => update({ assistantOn: !s.assistantOn })} />
                  </div>

                  <Field label="اسم المساعد">
                    <Inp value={s.assistantName} onChange={e => update({ assistantName: e.target.value })} placeholder="WorkBot" disabled={!s.assistantOn} />
                  </Field>

                  <Field label="الرسالة الترحيبية">
                    <textarea value={s.assistantMsg} onChange={e => update({ assistantMsg: e.target.value })} rows={3}
                      disabled={!s.assistantOn}
                      className="w-full rounded-xl px-4 py-2.5 text-sm border border-border bg-transparent focus:outline-none focus:ring-2 focus:ring-rose-500/50 resize-none transition disabled:opacity-50" />
                  </Field>

                  <ImgZone label="صورة المساعد" sub="PNG دائري — 256×256" icon={Camera} value={s.assistantAvatarUrl} onUpload={b => update({ assistantAvatarUrl: b })} size="sm" />

                  <Field label="شخصية المساعد">
                    <div className="grid grid-cols-2 gap-2">
                      {[{ v: 'professional', label: 'رسمي' }, { v: 'friendly', label: 'ودود' }, { v: 'concise', label: 'مختصر' }, { v: 'detailed', label: 'تفصيلي' }].map(({ v, label }) => (
                        <button key={v} onClick={() => update({ assistantPersonality: v })} disabled={!s.assistantOn}
                          className={`py-2.5 rounded-xl border font-bold text-sm transition disabled:opacity-40 ${s.assistantPersonality === v ? 'border-rose-500 bg-rose-500/10 text-rose-300' : 'border-border hover:border-rose-500/30 text-muted-foreground'}`}>
                          {label}
                        </button>
                      ))}
                    </div>
                  </Field>

                  <Field label="لغة المساعد">
                    <Sel value={s.assistantLang} onChange={e => update({ assistantLang: e.target.value })} disabled={!s.assistantOn}>
                      <option value="ar">العربية فقط</option>
                      <option value="en">English Only</option>
                      <option value="sv">Svenska (السويدية)</option>
                      <option value="bilingual">عربي + English</option>
                      <option value="trilingual">العربية + English + Svenska</option>
                    </Sel>
                  </Field>

                  <SaveBtn onClick={handleSave} label="حفظ إعدادات المساعد" color="rose" icon={Bot} />
                </div>
              </SCard>

              <SCard>
                <CardHead icon={Key} color="bg-pink-500" title="مفاتيح AI" sub="ربط المساعد بمزودي الذكاء الاصطناعي" />
                <div className="space-y-4">
                  {[
                    { id: 'openai', label: 'OpenAI (ChatGPT)', placeholder: 'sk-...', sub: 'GPT-4o, GPT-4 Turbo' },
                    { id: 'gemini', label: 'Google Gemini', placeholder: 'AIza...', sub: 'Gemini Pro, Flash' },
                    { id: 'claude', label: 'Anthropic Claude', placeholder: 'sk-ant-...', sub: 'Claude 3.5 Sonnet' },
                  ].map(({ id, label, placeholder, sub }) => (
                    <Field key={id} label={label} sub={sub}>
                      <div className="relative">
                        <input type={showKeys[`ai-${id}`] ? 'text' : 'password'}
                          value={s.apiKeys[id] || ''}
                          onChange={e => update({ apiKeys: { ...s.apiKeys, [id]: e.target.value } })}
                          placeholder={placeholder}
                          className="w-full rounded-xl px-4 py-2.5 text-sm border border-border bg-transparent focus:outline-none focus:ring-2 focus:ring-pink-500/50 pr-10 font-mono transition" />
                        <button type="button" onClick={() => setShowKeys(v => ({ ...v, [`ai-${id}`]: !v[`ai-${id}`] }))}
                          className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition">
                          {showKeys[`ai-${id}`] ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                        {s.apiKeys[id] && (
                          <div className="flex items-center gap-1 mt-1">
                            <CheckCircle2 className="w-3 h-3 text-green-400" />
                            <span className="text-[11px] text-green-400 font-bold">تم إدخال المفتاح</span>
                          </div>
                        )}
                      </div>
                    </Field>
                  ))}

                  <InfoBox text="المساعد يستخدم أول مفتاح متاح بالترتيب. تأكد من صلاحية المفتاح." type="info" />

                  <SaveBtn onClick={handleSave} label="حفظ مفاتيح المساعد" color="pink" icon={Key} />
                </div>
              </SCard>
            </div>
          )}

          {/* ══════════════════════════════════════════════════════════════
              10. Backup
          ══════════════════════════════════════════════════════════════ */}
          {activeSection === 'backup' && (
            <div className="grid md:grid-cols-2 gap-4">
              {/* Manual backup */}
              <SCard>
                <CardHead icon={Download} color="bg-emerald-500" title="نسخ احتياطي يدوي" sub="نزّل إعداداتك الآن" />
                <div className="space-y-4">
                  <div className="p-4 rounded-xl border border-border bg-white/5 space-y-2">
                    <p className="text-sm font-bold">الملف يشمل:</p>
                    {['جميع الإعدادات والألوان', 'ساعات العمل والجدول', 'بيانات الشركة والهوية', 'إعدادات المساعد', 'تفضيلات الإشعارات'].map(item => (
                      <div key={item} className="flex items-center gap-2 text-xs text-muted-foreground">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" /> {item}
                      </div>
                    ))}
                  </div>

                  <button onClick={() => createBackup(false)}
                    className="w-full py-3.5 rounded-xl bg-gradient-to-r from-emerald-500 to-green-500 text-white font-bold text-sm shadow-lg shadow-emerald-500/20 hover:-translate-y-0.5 transition flex items-center justify-center gap-2">
                    <Download className="w-4 h-4" /> تنزيل نسخة احتياطية الآن
                  </button>

                  {lastBackupTime && (
                    <InfoBox text={`آخر نسخة: ${lastBackupTime}`} type="success" />
                  )}
                </div>
              </SCard>

              {/* Restore */}
              <SCard>
                <CardHead icon={RefreshCw} color="bg-blue-500" title="استعادة النسخة" sub="استرجع إعداداتك من ملف سابق" />
                <div className="space-y-4">
                  <div className="p-4 rounded-xl border border-amber-500/20 bg-amber-500/5">
                    <div className="flex items-start gap-2">
                      <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                      <div className="text-xs text-amber-300">
                        <p className="font-bold mb-1">تحذير مهم</p>
                        <p>استعادة النسخة ستستبدل جميع الإعدادات الحالية. تأكد من صحة الملف قبل المتابعة.</p>
                      </div>
                    </div>
                  </div>

                  <button onClick={restoreBackup}
                    className="w-full py-3.5 rounded-xl bg-gradient-to-r from-blue-500 to-indigo-500 text-white font-bold text-sm shadow-lg shadow-blue-500/20 hover:-translate-y-0.5 transition flex items-center justify-center gap-2">
                    <Upload className="w-4 h-4" /> استعادة من ملف
                  </button>

                  <button onClick={() => { setDraft(DEFAULTS); toast({ title: 'تمت إعادة تعيين المعاينة، اضغط حفظ لتطبيقها' }); }}
                    className="w-full py-3 rounded-xl border border-red-500/30 text-red-400 font-bold text-sm hover:bg-red-500/5 transition flex items-center justify-center gap-2">
                    <RotateCcw className="w-4 h-4" /> إعادة تعيين لافتراضيات النظام
                  </button>

                  <InfoBox text="صيغة الملف المقبولة: JSON فقط (.json)" type="info" />
                </div>
              </SCard>

              {/* Auto-backup scheduler */}
              <SCard className="md:col-span-2">
                <CardHead icon={Timer} color="bg-teal-500" title="النسخ الاحتياطي التلقائي" sub="حدد متى يُنزَّل الملف تلقائياً" />
                <div className="grid sm:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <TRow
                      label="تفعيل النسخ التلقائي"
                      sub="سيتم تنزيل نسخة احتياطية تلقائياً على جهازك"
                      on={s.autoBackup}
                      onToggle={() => update({ autoBackup: !s.autoBackup })}
                    />

                    {s.autoBackup && (
                      <>
                        <Field label="تكرار النسخ الاحتياطي">
                          <div className="grid grid-cols-2 gap-2">
                            {([
                              { v: 'hourly',  label: 'كل ساعة',  icon: '⏱️' },
                              { v: 'daily',   label: 'يومياً',    icon: '📅' },
                              { v: 'weekly',  label: 'أسبوعياً', icon: '🗓️' },
                              { v: 'monthly', label: 'شهرياً',   icon: '📆' },
                            ] as const).map(({ v, label, icon }) => (
                              <button key={v} onClick={() => update({ autoBackupInterval: v })}
                                className={`flex items-center gap-2 px-3 py-2.5 rounded-xl border text-sm font-bold transition ${s.autoBackupInterval === v ? 'border-teal-500 bg-teal-500/10 text-teal-300' : 'border-border hover:border-teal-500/30 text-muted-foreground'}`}>
                                <span>{icon}</span> {label}
                                {s.autoBackupInterval === v && <Check className="w-3.5 h-3.5 mr-auto" />}
                              </button>
                            ))}
                          </div>
                        </Field>
                      </>
                    )}
                  </div>

                  <div className="space-y-4">
                    {/* Status card */}
                    <div className={`p-4 rounded-xl border space-y-3 ${s.autoBackup ? 'border-teal-500/30 bg-teal-500/5' : 'border-border bg-white/5'}`}>
                      <div className="flex items-center gap-2">
                        <div className={`w-2.5 h-2.5 rounded-full ${s.autoBackup ? 'bg-teal-400 animate-pulse' : 'bg-slate-600'}`} />
                        <p className={`text-sm font-bold ${s.autoBackup ? 'text-teal-300' : 'text-muted-foreground'}`}>
                          {s.autoBackup ? 'النسخ التلقائي مفعّل' : 'النسخ التلقائي معطّل'}
                        </p>
                      </div>
                      {s.autoBackup && (
                        <div className="text-xs text-muted-foreground space-y-1">
                          <p>التكرار: <span className="text-teal-300 font-bold">
                            {s.autoBackupInterval === 'hourly' ? 'كل ساعة'
                              : s.autoBackupInterval === 'daily' ? 'يومياً'
                              : s.autoBackupInterval === 'weekly' ? 'أسبوعياً'
                              : 'شهرياً'}
                          </span></p>
                          {lastBackupTime && <p>آخر نسخة: <span className="text-emerald-400 font-bold">{lastBackupTime}</span></p>}
                        </div>
                      )}
                      <div className="rounded-lg bg-white/5 border border-border px-3 py-2 text-xs text-muted-foreground">
                        <p className="flex items-center gap-1.5"><Smartphone className="w-3.5 h-3.5" /> الملف يُنزَّل مباشرة على جهازك</p>
                        <p className="flex items-center gap-1.5 mt-1"><Download className="w-3.5 h-3.5" /> صيغة JSON — قابل للاستعادة لاحقاً</p>
                      </div>
                    </div>

                    <SaveBtn onClick={handleSave} label="حفظ إعدادات النسخ" color="teal" icon={Database} />
                  </div>
                </div>
              </SCard>
            </div>
          )}

          {/* ══════════════════════════════════════════════════════════════
              11. Auth / Security
          ══════════════════════════════════════════════════════════════ */}
          {activeSection === 'auth' && (
            <div className="grid md:grid-cols-2 gap-4">
              <SCard>
                <CardHead icon={Fingerprint} color="bg-violet-500" title="التحقق البيومتري" sub="Face ID وبصمة الإصبع وPIN" />
                <div>
                  <TRow label="Face ID" sub="الدخول بالتعرف على الوجه"
                    on={s.biometric.faceId}
                    onToggle={() => { toggleBiometric('faceId'); toast({ title: s.biometric.faceId ? 'تم إيقاف Face ID' : 'تم تفعيل Face ID' }); }} />
                  <TRow label="بصمة الإصبع" sub="Touch ID أو مستشعر البصمة"
                    on={s.biometric.fingerprint}
                    onToggle={() => { toggleBiometric('fingerprint'); toast({ title: s.biometric.fingerprint ? 'تم إيقاف البصمة' : 'تم تفعيل البصمة' }); }} />

                  <div className="flex items-center justify-between gap-4 py-3">
                    <div className="min-w-0">
                      <p className="text-sm font-bold">رمز PIN</p>
                      <p className="text-[11px] text-muted-foreground mt-0.5">رمز سري مكون من 6 أرقام</p>
                    </div>
                    <div className="flex items-center gap-2">
                      {s.biometric.pin && (
                        <button onClick={() => { setPinValue(''); setPinDialog(true); }}
                          className="text-xs text-violet-400 hover:text-violet-300 font-bold transition">
                          تغيير
                        </button>
                      )}
                      <Toggle on={s.biometric.pin} onToggle={() => {
                        if (!s.biometric.pin) { setPinValue(''); setPinDialog(true); }
                        else { toggleBiometric('pin'); toast({ title: 'تم إلغاء رمز PIN' }); }
                      }} />
                    </div>
                  </div>
                </div>

                <div className="mt-4 space-y-2">
                  {[
                    { id: 'faceId', label: 'Face ID', on: s.biometric.faceId },
                    { id: 'fingerprint', label: 'البصمة', on: s.biometric.fingerprint },
                    { id: 'pin', label: 'PIN Code', on: s.biometric.pin },
                  ].map(({ id, label, on }) => (
                    <div key={id} className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs ${on ? 'bg-violet-500/10 border border-violet-500/20 text-violet-300' : 'bg-white/5 border border-border text-muted-foreground'}`}>
                      {on ? <CheckCircle2 className="w-3.5 h-3.5 shrink-0" /> : <X className="w-3.5 h-3.5 shrink-0" />}
                      {label} — {on ? 'مُفعَّل' : 'معطل'}
                    </div>
                  ))}
                </div>
              </SCard>

              <SCard>
                <CardHead icon={Shield} color="bg-slate-500" title="أمان الجلسة" sub="إعدادات الأمان المتقدمة" />
                <div className="space-y-4">
                  <Field label="مهلة الجلسة التلقائية">
                    <Sel defaultValue="30">
                      <option value="15">15 دقيقة</option>
                      <option value="30">30 دقيقة</option>
                      <option value="60">ساعة واحدة</option>
                      <option value="120">ساعتان</option>
                      <option value="480">8 ساعات</option>
                      <option value="0">لا تسجيل خروج تلقائي</option>
                    </Sel>
                  </Field>

                  <Field label="عدد محاولات الدخول قبل القفل">
                    <BtnPicker
                      options={[{ v: '3', label: '3' }, { v: '5', label: '5' }, { v: '10', label: '10' }]}
                      value="5"
                      onChange={() => {}}
                      color="slate"
                    />
                  </Field>

                  <div className="p-3 rounded-xl border border-slate-500/20 bg-slate-500/5 space-y-2">
                    <p className="text-sm font-bold text-slate-300">حالة الأمان</p>
                    <div className="space-y-1">
                      {[
                        { label: 'تشفير البيانات', ok: true },
                        { label: 'اتصال آمن HTTPS', ok: true },
                        { label: 'تحقق بخطوتين', ok: s.biometric.pin || s.biometric.faceId },
                      ].map(({ label, ok }) => (
                        <div key={label} className="flex items-center gap-2 text-xs">
                          {ok ? <CheckCircle2 className="w-3.5 h-3.5 text-green-400" /> : <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />}
                          <span className={ok ? 'text-muted-foreground' : 'text-amber-400'}>{label}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <button onClick={() => { toast({ title: 'تم تسجيل الخروج من جميع الأجهزة' }); }}
                    className="w-full py-2.5 rounded-xl border border-red-500/30 text-red-400 font-bold text-sm hover:bg-red-500/5 transition flex items-center justify-center gap-2">
                    <LogOut className="w-4 h-4" /> تسجيل خروج من جميع الأجهزة
                  </button>

                  <SaveBtn onClick={handleSave} label="حفظ إعدادات الأمان" color="violet" icon={Shield} />
                </div>
              </SCard>
            </div>
          )}

          {/* ══════════════════════════════════════════════════════════════
              12. Clear Logs
          ══════════════════════════════════════════════════════════════ */}
          {activeSection === 'clearlogs' && (
            <div className="grid md:grid-cols-2 gap-4">
              <SCard>
                <CardHead icon={Trash2} color="bg-red-500" title="مسح السجلات" sub="حذف بيانات النظام" />
                <InfoBox text="تحذير: عملية الحذف لا يمكن التراجع عنها. تأكد من وجود نسخة احتياطية." type="warning" />
                <div className="mt-4 space-y-3">
                  <ClearEmployeeSelector
                    selectedId={clearEmployeeId}
                    onSelect={setClearEmployeeId}
                  />
                  {[
                    { id: 'attendance', label: 'سجلات الحضور', sub: 'جميع سجلات الدخول والخروج', icon: Clock, color: 'text-orange-400', border: 'border-orange-500/30 hover:bg-orange-500/5' },
                    { id: 'payroll', label: 'سجلات الرواتب', sub: 'كشوف الرواتب والمدفوعات', icon: Wallet, color: 'text-amber-400', border: 'border-amber-500/30 hover:bg-amber-500/5' },
                    { id: 'leaves', label: 'سجلات الإجازات', sub: 'طلبات الإجازات المؤرشفة', icon: Calendar, color: 'text-blue-400', border: 'border-blue-500/30 hover:bg-blue-500/5' },
                    { id: 'notifications', label: 'سجل الإشعارات', sub: 'التنبيهات والرسائل المحفوظة', icon: Bell, color: 'text-purple-400', border: 'border-purple-500/30 hover:bg-purple-500/5' },
                    { id: 'activity', label: 'سجل النشاط', sub: 'سجل عمليات المستخدمين', icon: Activity, color: 'text-cyan-400', border: 'border-cyan-500/30 hover:bg-cyan-500/5' },
                  ].map(({ id, label, sub, icon: Icon, color, border }) => (
                    <button key={id} onClick={() => setClearDialog(id)}
                      className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-xl border ${border} transition text-right group`}>
                      <div className="w-9 h-9 rounded-lg bg-white/5 group-hover:bg-white/10 flex items-center justify-center transition">
                        <Icon className={`w-4.5 h-4.5 ${color}`} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-bold text-sm">{label}</p>
                        <p className="text-[11px] text-muted-foreground">
                          {sub}
                          {clearEmployeeId && clearEmployeeId !== 'all' && (
                            <span className="mr-1 text-red-400 font-bold">· موظف محدد</span>
                          )}
                        </p>
                      </div>
                      <Trash2 className={`w-4 h-4 ${color} opacity-50 group-hover:opacity-100 transition`} />
                    </button>
                  ))}
                </div>
              </SCard>

              <SCard>
                <CardHead icon={AlertTriangle} color="bg-rose-600" title="حذف شامل" sub="إعادة تعيين كاملة للنظام" />
                <div className="space-y-4">
                  <div className="p-4 rounded-xl border border-red-500/30 bg-red-500/5 space-y-2">
                    <p className="text-red-300 font-bold text-sm">⚠️ منطقة الخطر</p>
                    <p className="text-xs text-muted-foreground">هذه الإجراءات حاسمة وغير قابلة للتراجع. احرص على أخذ نسخة احتياطية أولاً.</p>
                  </div>

                  <button onClick={() => setClearDialog('all')}
                    className="w-full py-3 rounded-xl bg-red-500/10 border border-red-500/40 text-red-400 font-bold text-sm hover:bg-red-500/20 transition flex items-center justify-center gap-2">
                    <Trash2 className="w-4 h-4" /> مسح جميع السجلات
                  </button>

                  <button onClick={() => {
                    if (confirm('هل أنت متأكد؟ سيتم مسح جميع بيانات التطبيق والإعدادات.')) {
                      localStorage.clear();
                      toast({ title: 'تم مسح جميع بيانات التطبيق. سيتم إعادة التحميل...' });
                      setTimeout(() => window.location.reload(), 2000);
                    }
                  }}
                    className="w-full py-3 rounded-xl bg-red-600/10 border border-red-600/40 text-red-500 font-bold text-sm hover:bg-red-600/20 transition flex items-center justify-center gap-2">
                    <AlertTriangle className="w-4 h-4" /> إعادة تعيين كاملة للتطبيق
                  </button>

                  <InfoBox text="بعد الحذف الشامل لا يمكن استرجاع البيانات إلا من نسخة احتياطية مسبقة." type="warning" />
                </div>
              </SCard>
            </div>
          )}

          {/* ══════════════════════════════════════════════════════════════
              13. Font
          ══════════════════════════════════════════════════════════════ */}
          {activeSection === 'font' && (
            <div className="grid md:grid-cols-2 gap-4">
              <SCard>
                <CardHead icon={Type} color="bg-cyan-500" title="نوع الخط" sub="اختر خط التطبيق" />
                <div className="space-y-4">
                  <div className="grid grid-cols-1 gap-2">
                    {[
                      { v: 'system', label: 'Almarai (الافتراضي)', sample: 'أبجد هوز', family: 'Almarai, sans-serif' },
                      { v: 'cairo', label: 'Cairo', sample: 'أبجد هوز حطي', family: 'Cairo, sans-serif' },
                      { v: 'tajawal', label: 'Tajawal', sample: 'أبجد هوز كلمن', family: 'Tajawal, sans-serif' },
                      { v: 'inter', label: 'Inter', sample: 'ABCDE abcde 12345', family: 'Inter, sans-serif' },
                      { v: 'poppins', label: 'Poppins', sample: 'ABCDE abcde 12345', family: 'Poppins, sans-serif' },
                      { v: 'mono', label: 'Monospace', sample: 'ABC 123 xyz', family: 'monospace' },
                    ].map(({ v, label, sample, family }) => (
                      <button key={v} onClick={() => update({ fontFamily: v })}
                        className={`flex items-center justify-between px-4 py-3 rounded-xl border font-bold text-sm transition ${s.fontFamily === v ? 'border-cyan-500 bg-cyan-500/10' : 'border-border hover:border-cyan-500/30'}`}>
                        <div className="text-right">
                          <p className={s.fontFamily === v ? 'text-cyan-300' : ''}>{label}</p>
                          <p className="text-xs text-muted-foreground mt-0.5" style={{ fontFamily: family }}>{sample}</p>
                        </div>
                        {s.fontFamily === v && <Check className="w-4 h-4 text-cyan-400" />}
                      </button>
                    ))}
                  </div>
                </div>
              </SCard>

              <SCard>
                <CardHead icon={Sliders} color="bg-teal-600" title="حجم وشكل الخط" sub="ضبط قراءة النص" />
                <div className="space-y-5">
                  <Field label="حجم الخط">
                    <div className="space-y-2">
                      <BtnPicker
                        options={[{ v: 'small', label: 'صغير (14px)' }, { v: 'medium', label: 'متوسط (16px)' }, { v: 'large', label: 'كبير (18px)' }]}
                        value={s.fontSize}
                        onChange={v => update({ fontSize: v as any })}
                        color="cyan"
                      />
                      <div className="p-3 rounded-xl border border-border bg-white/5 text-center">
                        <p style={{ fontSize: s.fontSize === 'small' ? 14 : s.fontSize === 'large' ? 18 : 16 }}>
                          مثال على حجم الخط المختار
                        </p>
                      </div>
                    </div>
                  </Field>

                  <Field label="وزن الخط">
                    <BtnPicker
                      options={[{ v: 'normal', label: 'عادي' }, { v: 'medium', label: 'متوسط' }, { v: 'bold', label: 'عريض' }]}
                      value={s.fontWeight}
                      onChange={v => update({ fontWeight: v as any })}
                      color="cyan"
                    />
                  </Field>

                  <Field label="شكل الخط (Style)">
                    <BtnPicker
                      options={[{ v: 'normal', label: 'عادي' }, { v: 'bold', label: 'ثخين' }, { v: 'italic', label: 'مائل' }]}
                      value={s.fontShape}
                      onChange={v => update({ fontShape: v })}
                    />
                  </Field>

                  <Field label="تباعد الأسطر">
                    <BtnPicker
                      options={[{ v: 'tight', label: 'ضيق' }, { v: 'normal', label: 'عادي' }, { v: 'relaxed', label: 'واسع' }]}
                      value={s.lineHeight}
                      onChange={v => update({ lineHeight: v as any })}
                    />
                  </Field>

                  <Field label="تباعد الحروف">
                    <BtnPicker
                      options={[{ v: 'tight', label: 'ضيق' }, { v: 'normal', label: 'عادي' }, { v: 'wide', label: 'واسع' }]}
                      value={s.letterSpacing}
                      onChange={v => update({ letterSpacing: v as any })}
                    />
                  </Field>

                  {/* Font preview */}
                  <div className="p-4 rounded-xl border border-border bg-white/5 space-y-1"
                    style={{
                      fontWeight: s.fontWeight === 'bold' ? 700 : s.fontWeight === 'medium' ? 500 : 400,
                      fontStyle: s.fontShape === 'italic' ? 'italic' : 'normal',
                      lineHeight: s.lineHeight === 'tight' ? 1.2 : s.lineHeight === 'relaxed' ? 1.8 : 1.5,
                      letterSpacing: s.letterSpacing === 'tight' ? '-0.05em' : s.letterSpacing === 'wide' ? '0.1em' : 'normal',
                    }}>
                    <p className="text-[10px] text-muted-foreground font-normal uppercase tracking-wider" style={{ fontStyle: 'normal', letterSpacing: '0.1em' }}>معاينة النص</p>
                    <p className="text-base">إدارة القوى العاملة — نظام متكامل</p>
                    <p className="text-sm text-muted-foreground">جميع الحقوق محفوظة © {new Date().getFullYear()}</p>
                  </div>

                  <SaveBtn onClick={handleSave} label="حفظ إعدادات الخط" color="cyan" icon={Type} />
                </div>
              </SCard>
            </div>
          )}

          {/* ══════════════════════════════════════════════════════════════
              14. Credentials (Email & Password)
          ══════════════════════════════════════════════════════════════ */}
          {activeSection === 'credentials' && (
            <div className="grid md:grid-cols-2 gap-4">
              <SCard>
                <CardHead icon={Mail} color="bg-slate-500" title="تغيير البريد الإلكتروني" sub="تحديث إيميل الحساب" />
                <div className="space-y-4">
                  <Field label="البريد الإلكتروني الحالي">
                    <div className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-border bg-white/5 text-sm text-muted-foreground">
                      <Mail className="w-4 h-4 shrink-0" />
                      <span>admin@company.com</span>
                      <CheckCircle2 className="w-3.5 h-3.5 text-green-400 mr-auto" />
                    </div>
                  </Field>

                  <Field label="البريد الجديد" required>
                    <div className="relative">
                      <Mail className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <input type="email" value={secEmail} onChange={e => setSecEmail(e.target.value)} placeholder="new@email.com"
                        className="w-full rounded-xl pr-9 pl-4 py-2.5 text-sm border border-border bg-transparent focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition" />
                    </div>
                  </Field>

                  <Field label="كلمة المرور الحالية للتأكيد" required>
                    <div className="relative">
                      <input type={showPw.emailConfirm ? 'text' : 'password'} value={curPw} onChange={e => setCurPw(e.target.value)} placeholder="••••••••"
                        className="w-full rounded-xl px-4 py-2.5 text-sm border border-border bg-transparent focus:outline-none focus:ring-2 focus:ring-indigo-500/50 pr-10 transition" />
                      <button type="button" onClick={() => setShowPw(v => ({ ...v, emailConfirm: !v.emailConfirm }))}
                        className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition">
                        {showPw.emailConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </Field>

                  <button onClick={() => {
                    if (!secEmail || !curPw) { toast({ title: 'الرجاء ملء جميع الحقول', variant: 'destructive' }); return; }
                    toast({ title: 'تم إرسال رابط التأكيد إلى البريد الجديد' });
                    setSecEmail(''); setCurPw('');
                  }}
                    className="w-full py-2.5 rounded-xl bg-slate-600 hover:bg-slate-500 text-white font-bold text-sm transition flex items-center justify-center gap-2">
                    <Mail className="w-4 h-4" /> تحديث البريد الإلكتروني
                  </button>
                </div>
              </SCard>

              <SCard>
                <CardHead icon={Lock} color="bg-rose-500" title="تغيير كلمة السر" sub="تحديث كلمة مرور الحساب" />
                <div className="space-y-4">
                  {[
                    { key: 'current', label: 'كلمة المرور الحالية', value: curPw, set: setCurPw, placeholder: '••••••••' },
                    { key: 'new', label: 'كلمة المرور الجديدة', value: newPw, set: setNewPw, placeholder: '8 أحرف على الأقل' },
                    { key: 'confirm', label: 'تأكيد كلمة المرور', value: confirmPw, set: setConfirmPw, placeholder: 'أعد كتابة كلمة المرور' },
                  ].map(({ key, label, value, set, placeholder }) => (
                    <Field key={key} label={label}>
                      <div className="relative">
                        <input type={showPw[key] ? 'text' : 'password'} value={value} onChange={e => set(e.target.value)} placeholder={placeholder}
                          className="w-full rounded-xl px-4 py-2.5 text-sm border border-border bg-transparent focus:outline-none focus:ring-2 focus:ring-rose-500/50 pr-10 transition" />
                        <button type="button" onClick={() => setShowPw(v => ({ ...v, [key]: !v[key] }))}
                          className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition">
                          {showPw[key] ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                      {key === 'new' && newPw.length > 0 && (
                        <div className="flex gap-1 mt-1.5">
                          {[4, 7, 10].map((len, i) => (
                            <div key={i} className={`h-1 flex-1 rounded-full transition ${newPw.length >= len ? i === 0 ? 'bg-red-400' : i === 1 ? 'bg-amber-400' : 'bg-green-400' : 'bg-border'}`} />
                          ))}
                          <span className="text-[10px] text-muted-foreground mr-1">
                            {newPw.length < 4 ? 'ضعيفة' : newPw.length < 8 ? 'متوسطة' : 'قوية'}
                          </span>
                        </div>
                      )}
                      {key === 'confirm' && confirmPw && (
                        <div className={`flex items-center gap-1 mt-1 text-[11px] font-bold ${confirmPw === newPw ? 'text-green-400' : 'text-red-400'}`}>
                          {confirmPw === newPw ? <><CheckCircle2 className="w-3 h-3" /> متطابقتان</> : <><X className="w-3 h-3" /> غير متطابقتين</>}
                        </div>
                      )}
                    </Field>
                  ))}

                  <button onClick={handleUpdateCredentials}
                    className="w-full py-2.5 rounded-xl bg-rose-500 hover:bg-rose-600 text-white font-bold text-sm transition flex items-center justify-center gap-2">
                    <Lock className="w-4 h-4" /> تحديث كلمة المرور
                  </button>

                  <InfoBox text="بعد التغيير ستحتاج لتسجيل الدخول مجدداً من جميع الأجهزة." type="info" />
                </div>
              </SCard>
            </div>
          )}

          {/* ══════════════════════════════════════════════════════════════
              15-A. Login Page Design
          ══════════════════════════════════════════════════════════════ */}
          {activeSection === 'loginDesign' && (
            <div className="grid md:grid-cols-2 gap-4">

              {/* Card style */}
              <SCard>
                <CardHead icon={Monitor} color="bg-fuchsia-500" title="شكل كرت الدخول" sub="نمط وألوان بطاقة تسجيل الدخول" />
                <div className="space-y-5">
                  <Field label="نمط الكرت">
                    <div className="grid grid-cols-1 gap-2">
                      {[
                        { v: 'glass',    label: 'Glass (افتراضي)',   sub: 'شفاف مع ضبابية',          icon: '🪟' },
                        { v: 'gradient', label: 'Gradient',           sub: 'تدرج لوني جميل',          icon: '🌈' },
                        { v: 'solid',    label: 'Solid Dark',         sub: 'خلفية صلبة غامقة',        icon: '⬛' },
                        { v: 'minimal',  label: 'Minimal',            sub: 'حد شفاف بسيط',            icon: '✦' },
                        { v: 'neon',     label: 'Neon Glow',          sub: 'توهج نيوني',              icon: '⚡' },
                      ].map(({ v, label, sub, icon }) => (
                        <button key={v} onClick={() => update({ loginCardStyle: v as any })}
                          className={`flex items-center gap-3 px-4 py-3 rounded-xl border text-right transition ${s.loginCardStyle === v ? 'border-fuchsia-500 bg-fuchsia-500/10' : 'border-border hover:border-fuchsia-500/30'}`}>
                          <span className="text-xl">{icon}</span>
                          <div className="flex-1">
                            <p className={`font-bold text-sm ${s.loginCardStyle === v ? 'text-fuchsia-300' : ''}`}>{label}</p>
                            <p className="text-[11px] text-muted-foreground">{sub}</p>
                          </div>
                          {s.loginCardStyle === v && <Check className="w-4 h-4 text-fuchsia-400" />}
                        </button>
                      ))}
                    </div>
                  </Field>

                  <Field label="نصف قطر زوايا الكرت" sub="كلما زاد كلما صار أكثر دائرية">
                    <div className="space-y-2">
                      <div className="flex items-center gap-3">
                        <input type="range" min="8" max="48" step="2"
                          value={s.loginCardRadius ?? 32}
                          onChange={e => update({ loginCardRadius: Number(e.target.value) })}
                          className="flex-1 accent-fuchsia-500" />
                        <span className="text-sm font-mono font-bold text-fuchsia-400 w-12 text-center">{s.loginCardRadius ?? 32}px</span>
                      </div>
                      <div className="h-10 border border-border bg-white/5" style={{ borderRadius: s.loginCardRadius ?? 32 }} />
                    </div>
                  </Field>
                </div>
              </SCard>

              {/* Colors */}
              <SCard>
                <CardHead icon={Palette} color="bg-purple-500" title="ألوان الكرت والخلفية" sub="تخصيص التدرجات اللونية" />
                <div className="space-y-5">
                  <Field label="اللون الأساسي للكرت (من)">
                    <div className="flex items-center gap-3">
                      <input type="color" value={s.loginCardGradientFrom || '#6366f1'}
                        onChange={e => update({ loginCardGradientFrom: e.target.value })}
                        className="w-12 h-10 rounded-lg cursor-pointer border-0" />
                      <Inp value={s.loginCardGradientFrom || '#6366f1'}
                        onChange={e => update({ loginCardGradientFrom: e.target.value })}
                        className="font-mono uppercase flex-1" maxLength={7} />
                    </div>
                  </Field>

                  <Field label="اللون الثانوي للكرت (إلى)">
                    <div className="flex items-center gap-3">
                      <input type="color" value={s.loginCardGradientTo || '#8b5cf6'}
                        onChange={e => update({ loginCardGradientTo: e.target.value })}
                        className="w-12 h-10 rounded-lg cursor-pointer border-0" />
                      <Inp value={s.loginCardGradientTo || '#8b5cf6'}
                        onChange={e => update({ loginCardGradientTo: e.target.value })}
                        className="font-mono uppercase flex-1" maxLength={7} />
                    </div>
                  </Field>

                  <Field label="لون الزر والتأكيد">
                    <div className="flex gap-2 flex-wrap">
                      {['#6366f1','#8b5cf6','#ec4899','#f97316','#10b981','#06b6d4','#f59e0b','#ef4444','#0ea5e9','#a855f7'].map(c => (
                        <button key={c} onClick={() => update({ loginAccentColor: c })}
                          className={`w-7 h-7 rounded-full border-2 transition-all ${s.loginAccentColor === c ? 'border-white scale-125 shadow-lg' : 'border-transparent hover:scale-110'}`}
                          style={{ background: c }} />
                      ))}
                    </div>
                    <div className="flex items-center gap-3 mt-2">
                      <input type="color" value={s.loginAccentColor || '#6366f1'}
                        onChange={e => update({ loginAccentColor: e.target.value })}
                        className="w-12 h-10 rounded-lg cursor-pointer border-0" />
                      <span className="text-xs text-muted-foreground">أو اختر لوناً مخصصاً</span>
                    </div>
                  </Field>

                  {/* Preview */}
                  <div className="h-14 rounded-xl flex items-center justify-center text-white text-sm font-bold shadow-lg"
                    style={{
                      background: s.loginCardStyle === 'gradient'
                        ? `linear-gradient(135deg, ${s.loginCardGradientFrom || '#6366f1'}, ${s.loginCardGradientTo || '#8b5cf6'})`
                        : s.loginCardStyle === 'neon'
                        ? `rgba(17,0,36,.92)`
                        : s.loginCardStyle === 'solid'
                        ? '#1e293b'
                        : 'rgba(255,255,255,.08)',
                      borderRadius: (s.loginCardRadius ?? 32) / 2,
                      border: s.loginCardStyle === 'neon'
                        ? `1px solid ${s.loginCardGradientFrom || '#6366f1'}88`
                        : '1px solid rgba(255,255,255,.12)',
                      backdropFilter: 'blur(12px)',
                    }}>
                    معاينة كرت الدخول
                  </div>
                </div>
              </SCard>

              {/* Left panel (desktop) */}
              <SCard>
                <CardHead icon={Layout} color="bg-indigo-500" title="اللوحة الجانبية (ديسكتوب)" sub="الجهة اليسرى مع الشعار والإحصائيات" />
                <div className="space-y-5">
                  <Field label="تدرج لوحة العلامة التجارية (من)">
                    <div className="flex items-center gap-3">
                      <input type="color" value={s.loginPanelGradientFrom || '#6366f1'}
                        onChange={e => update({ loginPanelGradientFrom: e.target.value })}
                        className="w-12 h-10 rounded-lg cursor-pointer border-0" />
                      <Inp value={s.loginPanelGradientFrom || '#6366f1'}
                        onChange={e => update({ loginPanelGradientFrom: e.target.value })}
                        className="font-mono uppercase flex-1" maxLength={7} />
                    </div>
                  </Field>

                  <Field label="تدرج لوحة العلامة التجارية (إلى)">
                    <div className="flex items-center gap-3">
                      <input type="color" value={s.loginPanelGradientTo || '#8b5cf6'}
                        onChange={e => update({ loginPanelGradientTo: e.target.value })}
                        className="w-12 h-10 rounded-lg cursor-pointer border-0" />
                      <Inp value={s.loginPanelGradientTo || '#8b5cf6'}
                        onChange={e => update({ loginPanelGradientTo: e.target.value })}
                        className="font-mono uppercase flex-1" maxLength={7} />
                    </div>
                  </Field>

                  {/* Panel preview */}
                  <div className="h-20 rounded-xl relative overflow-hidden flex items-center px-4 gap-3"
                    style={{ background: `linear-gradient(135deg, ${s.loginPanelGradientFrom || '#6366f1'}, ${s.loginPanelGradientTo || '#8b5cf6'})` }}>
                    <div className="absolute inset-0 bg-black/15" />
                    <div className="relative z-10 w-10 h-10 rounded-xl bg-white/20 border border-white/30 flex items-center justify-center">
                      {s.logoUrl ? <img src={s.logoUrl} className="w-full h-full object-contain rounded-xl p-1" /> : <Monitor className="w-5 h-5 text-white" />}
                    </div>
                    <div className="relative z-10">
                      <p className="text-white font-bold text-sm">{s.appName || 'WorkforceOS'}</p>
                      <p className="text-white/60 text-xs">معاينة اللوحة</p>
                    </div>
                  </div>
                </div>
              </SCard>

              {/* Visibility toggles */}
              <SCard>
                <CardHead icon={Eye} color="bg-sky-500" title="عناصر صفحة الدخول" sub="تحكم بما يظهر في الصفحة" />
                <div className="space-y-1">
                  <TRow label="عرض الشعار / اللوغو" sub="الصورة أو الأيقونة في أعلى الكرت"
                    on={s.loginShowLogo !== false}
                    onToggle={() => update({ loginShowLogo: !(s.loginShowLogo !== false) })} />
                  <TRow label="عرض الساعة الرقمية" sub="ساعة حية أسفل الشعار"
                    on={s.loginShowClock !== false}
                    onToggle={() => update({ loginShowClock: !(s.loginShowClock !== false) })} />
                  <TRow label="بطاقات الإحصائيات (ديسكتوب)" sub="Active Workforce و System Health"
                    on={s.loginShowStats !== false}
                    onToggle={() => update({ loginShowStats: !(s.loginShowStats !== false) })} />
                </div>
                <div className="mt-5">
                  <SaveBtn onClick={handleSave} label="حفظ تصميم لوحة الدخول" color="fuchsia" icon={Monitor} />
                </div>
              </SCard>
            </div>
          )}

          {/* ══════════════════════════════════════════════════════════════
              15. Dashboard / Home Layout
          ══════════════════════════════════════════════════════════════ */}
          {activeSection === 'dashboard' && (
            <div className="grid md:grid-cols-2 gap-4">
              <SCard>
                <CardHead icon={LayoutDashboard} color="bg-blue-500" title="تخطيط لوحة البداية" sub="اختر شكل الصفحة الرئيسية" />
                <div className="space-y-5">
                  <Field label="نمط عرض اللوحة">
                    <div className="grid grid-cols-1 gap-2">
                      {[
                        { v: 'default', label: 'عادي', sub: 'بطاقات بحجم متوسط', icon: Grid3X3 },
                        { v: 'compact', label: 'مضغوط', sub: 'أكثر معلومات في مساحة أقل', icon: List },
                        { v: 'detailed', label: 'تفصيلي', sub: 'أكبر حجماً مع رسوم بيانية', icon: BarChart3 },
                      ].map(({ v, label, sub, icon: Icon }) => (
                        <button key={v} onClick={() => update({ dashboardLayout: v as any })}
                          className={`flex items-center gap-3 px-4 py-3 rounded-xl border text-right transition ${s.dashboardLayout === v ? 'border-blue-500 bg-blue-500/10' : 'border-border hover:border-blue-500/30'}`}>
                          <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${s.dashboardLayout === v ? 'bg-blue-500/20' : 'bg-white/5'}`}>
                            <Icon className={`w-4.5 h-4.5 ${s.dashboardLayout === v ? 'text-blue-400' : 'text-muted-foreground'}`} />
                          </div>
                          <div className="flex-1">
                            <p className={`font-bold text-sm ${s.dashboardLayout === v ? 'text-blue-300' : ''}`}>{label}</p>
                            <p className="text-[11px] text-muted-foreground">{sub}</p>
                          </div>
                          {s.dashboardLayout === v && <Check className="w-4 h-4 text-blue-400" />}
                        </button>
                      ))}
                    </div>
                  </Field>

                  <div className="space-y-1">
                    <TRow label="إظهار رسالة الترحيب" sub="اسمك وتحية اليوم في الأعلى" on={s.dashboardGreeting} onToggle={() => update({ dashboardGreeting: !s.dashboardGreeting })} />
                    <TRow label="ساعة مباشرة في اللوحة" sub="عرض الوقت الحالي" on={s.dashboardClock} onToggle={() => update({ dashboardClock: !s.dashboardClock })} />
                    <TRow label="أزرار الإجراءات السريعة" sub="حضور/انصراف وطلبات سريعة" on={s.dashboardQuickActions} onToggle={() => update({ dashboardQuickActions: !s.dashboardQuickActions })} />
                  </div>
                </div>
              </SCard>

              <SCard>
                <CardHead icon={Layers} color="bg-indigo-500" title="الودجات المعروضة" sub="اختر ما يظهر في لوحة البداية" />
                <div className="space-y-2">
                  <p className="text-xs text-muted-foreground mb-3">
                    {s.dashboardWidgets.length} من {DASH_WIDGETS.length} ودجات مفعلة
                  </p>
                  {DASH_WIDGETS.map(({ id, label }) => {
                    const active = s.dashboardWidgets.includes(id);
                    return (
                      <button key={id} onClick={() => toggleWidget(id)}
                        className={`w-full flex items-center justify-between px-4 py-2.5 rounded-xl border text-sm font-bold transition ${active ? 'border-indigo-500 bg-indigo-500/10 text-indigo-300' : 'border-border text-muted-foreground hover:border-indigo-500/30'}`}>
                        {label}
                        <Toggle on={active} onToggle={() => toggleWidget(id)} />
                      </button>
                    );
                  })}
                </div>
                <div className="mt-4">
                  <SaveBtn onClick={handleSave} label="حفظ تخطيط اللوحة" color="blue" icon={LayoutDashboard} />
                </div>
              </SCard>
            </div>
          )}

          {/* ══════════════════════════════════════════════════════════════
              Payroll Rules
          ══════════════════════════════════════════════════════════════ */}
          {activeSection === 'payroll-rules' && (
            <div className="grid md:grid-cols-2 gap-4">

              {/* Work hours */}
              <SCard>
                <CardHead icon={Clock4} color="bg-sky-600" title="توقيت الدوام" sub="بداية ونهاية يوم العمل وفترة السماح" />
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-3">
                    <Field label="بداية الدوام" sub="وقت بدء الحضور">
                      <Inp type="time" dir="ltr" value={s.workStart} onChange={e => update({ workStart: e.target.value })} className="font-mono text-sky-400 font-bold" />
                    </Field>
                    <Field label="نهاية الدوام" sub="وقت انتهاء الدوام">
                      <Inp type="time" dir="ltr" value={s.workEnd} onChange={e => update({ workEnd: e.target.value })} className="font-mono text-sky-400 font-bold" />
                    </Field>
                  </div>
                  <Field label="فترة السماح للتأخير" sub="دقائق قبل احتساب التأخير">
                    <div className="flex gap-3 items-center">
                      <Inp type="number" min="0" max="60" dir="ltr" value={s.lateGrace} onChange={e => update({ lateGrace: e.target.value })} className="w-24 text-center font-mono font-bold text-amber-400" />
                      <span className="text-sm text-muted-foreground">دقيقة</span>
                    </div>
                    <input type="range" min="0" max="60" step="1" value={parseInt(s.lateGrace || '15')} onChange={e => update({ lateGrace: e.target.value })} className="w-full accent-amber-500 mt-2" />
                    <div className="flex justify-between text-[10px] text-muted-foreground mt-0.5"><span>0 د</span><span className="font-bold text-amber-400">{s.lateGrace || 15} د</span><span>60 د</span></div>
                  </Field>
                  <Field label="أيام العمل في الشهر" sub="اتركه فارغاً للحساب التلقائي حسب أيام كل شهر">
                    <div className="flex gap-3 items-center">
                      <Inp type="number" min="1" max="31" dir="ltr" value={s.workDays} onChange={e => update({ workDays: e.target.value })} className="w-24 text-center font-mono font-bold text-sky-400" placeholder="تلقائي" />
                      <span className="text-sm text-muted-foreground">يوم عمل</span>
                      {s.workDays && (
                        <button type="button" onClick={() => update({ workDays: '' })} className="text-xs text-red-400 hover:text-red-300 underline">مسح (تلقائي)</button>
                      )}
                    </div>
                    {!s.workDays && (
                      <p className="text-xs text-sky-400 mt-1">⟳ يحسب أيام العمل الفعلية لكل شهر تلقائياً بناءً على أيام الإجازة الأسبوعية</p>
                    )}
                  </Field>
                  <div className="rounded-xl border border-sky-500/20 bg-sky-500/5 p-3 text-xs text-sky-300 space-y-0.5">
                    <p className="font-bold mb-1">ملخص الدوام الحالي</p>
                    <p>ساعات العمل اليومية: {(() => {
                      const start = s.workStart || '09:00';
                      const end   = s.workEnd   || '17:00';
                      const [sh, sm] = start.split(':').map(Number);
                      const [eh, em] = end.split(':').map(Number);
                      const diff = (eh * 60 + em) - (sh * 60 + sm);
                      return diff > 0 ? `${Math.floor(diff/60)}س ${diff%60 ? (diff%60)+'د' : ''}`.trim() : '—';
                    })()}</p>
                    <p>السماح للتأخير: {s.lateGrace || 15} دقيقة</p>
                    <p>أيام الشهر: {s.workDays ? `${s.workDays} يوم عمل (يدوي)` : 'تلقائي حسب الشهر'}</p>
                  </div>
                </div>
              </SCard>

              {/* Overtime rates */}
              <SCard>
                <CardHead icon={Wallet} color="bg-green-600" title="معدلات الوقت الإضافي" sub="ضاعف أجر ساعة الإضافي" />
                <div className="space-y-5">

                  <Field label="معدل الوقت الإضافي — أيام عادية" sub="مثال: 1.5 يعني 150% من المعدل الساعي">
                    <div className="space-y-2">
                      <div className="flex gap-3 items-center">
                        <Inp
                          type="number" step="0.05" min="1" max="5" dir="ltr"
                          value={s.otMultiplier}
                          onChange={e => update({ otMultiplier: e.target.value })}
                          className="w-28 text-center font-mono font-bold text-green-400"
                        />
                        <span className="text-sm text-muted-foreground">= {(parseFloat(s.otMultiplier || '1.5') * 100).toFixed(0)}% من المعدل الساعي</span>
                      </div>
                      <input type="range" min="1" max="3" step="0.05"
                        value={parseFloat(s.otMultiplier || '1.5')}
                        onChange={e => update({ otMultiplier: e.target.value })}
                        className="w-full accent-green-500" />
                      <div className="flex justify-between text-[10px] text-muted-foreground">
                        <span>×1.0</span><span className="font-bold text-green-400">×{parseFloat(s.otMultiplier || '1.5').toFixed(2)}</span><span>×3.0</span>
                      </div>
                    </div>
                  </Field>

                  <Field label="معدل الوقت الإضافي — نهاية الأسبوع" sub="جمعة / سبت (أو ما تحدده كعطلة)">
                    <div className="space-y-2">
                      <div className="flex gap-3 items-center">
                        <Inp
                          type="number" step="0.05" min="1" max="5" dir="ltr"
                          value={s.otWeekendMultiplier}
                          onChange={e => update({ otWeekendMultiplier: e.target.value })}
                          className="w-28 text-center font-mono font-bold text-amber-400"
                        />
                        <span className="text-sm text-muted-foreground">= {(parseFloat(s.otWeekendMultiplier || '2.0') * 100).toFixed(0)}% من المعدل الساعي</span>
                      </div>
                      <input type="range" min="1" max="4" step="0.05"
                        value={parseFloat(s.otWeekendMultiplier || '2.0')}
                        onChange={e => update({ otWeekendMultiplier: e.target.value })}
                        className="w-full accent-amber-500" />
                      <div className="flex justify-between text-[10px] text-muted-foreground">
                        <span>×1.0</span><span className="font-bold text-amber-400">×{parseFloat(s.otWeekendMultiplier || '2.0').toFixed(2)}</span><span>×4.0</span>
                      </div>
                    </div>
                  </Field>

                  <Field label="علاوة النوبة الليلية" sub="نسبة إضافية فوق المعدل الساعي للساعات الليلية">
                    <div className="space-y-2">
                      <div className="flex gap-3 items-center">
                        <Inp
                          type="number" step="0.05" min="0" max="1" dir="ltr"
                          value={s.nightDifferential}
                          onChange={e => update({ nightDifferential: e.target.value })}
                          className="w-28 text-center font-mono font-bold text-blue-400"
                        />
                        <span className="text-sm text-muted-foreground">+{(parseFloat(s.nightDifferential || '0.25') * 100).toFixed(0)}% إضافي على الساعة</span>
                      </div>
                      <input type="range" min="0" max="1" step="0.05"
                        value={parseFloat(s.nightDifferential || '0.25')}
                        onChange={e => update({ nightDifferential: e.target.value })}
                        className="w-full accent-blue-500" />
                      <div className="flex justify-between text-[10px] text-muted-foreground">
                        <span>0%</span><span className="font-bold text-blue-400">+{(parseFloat(s.nightDifferential || '0.25') * 100).toFixed(0)}%</span><span>+100%</span>
                      </div>
                    </div>
                  </Field>

                  <Field label="نطاق النوبة الليلية" sub="الساعات التي تُحسب كنوبة ليلية">
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <p className="text-[11px] text-muted-foreground mb-1">تبدأ من</p>
                        <Inp type="number" min="0" max="23" dir="ltr"
                          value={s.nightStartHour}
                          onChange={e => update({ nightStartHour: e.target.value })}
                          className="text-center font-mono" />
                        <p className="text-[10px] text-muted-foreground mt-1 text-center">{s.nightStartHour}:00</p>
                      </div>
                      <div>
                        <p className="text-[11px] text-muted-foreground mb-1">تنتهي عند</p>
                        <Inp type="number" min="0" max="23" dir="ltr"
                          value={s.nightEndHour}
                          onChange={e => update({ nightEndHour: e.target.value })}
                          className="text-center font-mono" />
                        <p className="text-[10px] text-muted-foreground mt-1 text-center">{s.nightEndHour}:00</p>
                      </div>
                    </div>
                  </Field>

                  <SaveBtn onClick={handleSave} label="حفظ معدلات الإضافي" color="green" icon={Wallet} />
                </div>
              </SCard>

              {/* Deduction rates & weekend */}
              <SCard>
                <CardHead icon={Activity} color="bg-orange-500" title="قواعد الاستقطاع وأيام العطل" sub="كيف تُحسب خصومات التأخير والغياب" />
                <div className="space-y-5">

                  <Field label="معامل خصم التأخير / الخروج المبكر" sub="مثال: 1.0 = دقيقة بدقيقة — 2.0 = ضعف">
                    <div className="space-y-2">
                      <div className="flex gap-3 items-center">
                        <Inp
                          type="number" step="0.1" min="0.5" max="5" dir="ltr"
                          value={s.lateDeductMultiplier}
                          onChange={e => update({ lateDeductMultiplier: e.target.value })}
                          className="w-28 text-center font-mono font-bold text-orange-400"
                        />
                        <span className="text-sm text-muted-foreground">
                          {parseFloat(s.lateDeductMultiplier || '1.0') === 1 ? 'دقيقة بدقيقة' : `×${parseFloat(s.lateDeductMultiplier || '1.0').toFixed(1)} من قيمة الدقيقة`}
                        </span>
                      </div>
                      <input type="range" min="0.5" max="3" step="0.1"
                        value={parseFloat(s.lateDeductMultiplier || '1.0')}
                        onChange={e => update({ lateDeductMultiplier: e.target.value })}
                        className="w-full accent-orange-500" />
                      <div className="flex justify-between text-[10px] text-muted-foreground">
                        <span>×0.5</span><span className="font-bold text-orange-400">×{parseFloat(s.lateDeductMultiplier || '1.0').toFixed(1)}</span><span>×3.0</span>
                      </div>
                    </div>
                  </Field>

                  <Field label="أيام العطلة الأسبوعية" sub="أيام تُحسب بمعامل نهاية الأسبوع (0=أحد، 5=جمعة، 6=سبت)">
                    <div className="space-y-2">
                      <div className="grid grid-cols-7 gap-1">
                        {[
                          { n: 0, label: 'أحد' },
                          { n: 1, label: 'اثن' },
                          { n: 2, label: 'ثلا' },
                          { n: 3, label: 'أرب' },
                          { n: 4, label: 'خمي' },
                          { n: 5, label: 'جمع' },
                          { n: 6, label: 'سبت' },
                        ].map(({ n, label }) => {
                          const current = (s.weekendDays || '5,6').split(',').map(Number);
                          const active = current.includes(n);
                          return (
                            <button
                              key={n}
                              onClick={() => {
                                const next = active ? current.filter(d => d !== n) : [...current, n];
                                update({ weekendDays: next.sort().join(',') });
                              }}
                              className={`py-2 rounded-lg text-[11px] font-bold transition border ${active ? 'border-amber-500 bg-amber-500/20 text-amber-300' : 'border-border text-muted-foreground hover:border-amber-500/30'}`}>
                              {label}
                            </button>
                          );
                        })}
                      </div>
                      <p className="text-[11px] text-muted-foreground">
                        العطلة الحالية: {
                          (s.weekendDays || '5,6').split(',').map(Number)
                            .map(n => ['الأحد','الاثنين','الثلاثاء','الأربعاء','الخميس','الجمعة','السبت'][n])
                            .join(' + ')
                        }
                      </p>
                    </div>
                  </Field>

                  <div className="rounded-xl border border-green-500/20 bg-green-500/5 p-4 space-y-1.5">
                    <p className="text-xs font-bold text-green-400 mb-2">معاينة — راتب 20,000</p>
                    {(() => {
                      const otMult = parseFloat(s.otMultiplier || '1.5');
                      const otWMult = parseFloat(s.otWeekendMultiplier || '2.0');
                      const nightDiff = parseFloat(s.nightDifferential || '0.25');
                      const hourly = 20000 / (parseInt(s.workDays || '22', 10) * (parseInt(s.workEnd || '17') - parseInt(s.workStart || '9') || 8));
                      return (
                        <>
                          <div className="flex justify-between text-xs">
                            <span className="text-muted-foreground">المعدل الساعي</span>
                            <span className="font-mono font-bold">{hourly.toFixed(2)}</span>
                          </div>
                          <div className="flex justify-between text-xs">
                            <span className="text-muted-foreground">ساعة إضافي (يوم عادي)</span>
                            <span className="font-mono font-bold text-green-400">{(hourly * otMult).toFixed(2)}</span>
                          </div>
                          <div className="flex justify-between text-xs">
                            <span className="text-muted-foreground">ساعة إضافي (عطلة)</span>
                            <span className="font-mono font-bold text-amber-400">{(hourly * otWMult).toFixed(2)}</span>
                          </div>
                          <div className="flex justify-between text-xs">
                            <span className="text-muted-foreground">ساعة ليلية</span>
                            <span className="font-mono font-bold text-blue-400">{(hourly * (1 + nightDiff)).toFixed(2)}</span>
                          </div>
                        </>
                      );
                    })()}
                  </div>

                  <SaveBtn onClick={handleSave} label="حفظ قواعد الاستقطاع" color="orange" icon={Activity} />
                </div>
              </SCard>
            </div>
          )}

        </div>
      </div>

      {/* ── Clear Dialog ── */}
      {clearDialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm" dir={dir}>
          <div className="relative w-full max-w-sm rounded-2xl border border-border p-6 shadow-2xl mx-4" style={{ background: 'var(--card)' }}>
            <button onClick={() => setClearDialog(null)} className="absolute top-4 left-4 text-muted-foreground hover:text-foreground transition">
              <X className="w-5 h-5" />
            </button>
            <div className="text-center mb-6">
              <div className="w-14 h-14 rounded-2xl bg-red-500/10 flex items-center justify-center mx-auto mb-3">
                <AlertTriangle className="w-7 h-7 text-red-400" />
              </div>
              <h3 className="font-bold text-lg">تأكيد الحذف</h3>
              <p className="text-sm text-muted-foreground mt-1">
                هل أنت متأكد من مسح {clearDialog === 'attendance' ? 'سجلات الحضور' : clearDialog === 'payroll' ? 'سجلات الرواتب' : clearDialog === 'leaves' ? 'سجلات الإجازات' : clearDialog === 'all' ? 'جميع السجلات' : 'السجلات'}؟
              {clearEmployeeId !== 'all' && <><br /><span className="text-amber-400 font-bold">الموظف: {clearEmployeeName}</span></>}
              </p>
              <p className="text-xs text-red-400 mt-1">لا يمكن التراجع عن هذه العملية</p>
            </div>
            <div className="flex gap-2">
              <button onClick={() => setClearDialog(null)}
                className="flex-1 py-2.5 rounded-xl border border-border font-bold text-sm hover:bg-white/5 transition">
                إلغاء
              </button>
              <button onClick={() => clearLogs(clearDialog)}
                className="flex-1 py-2.5 rounded-xl bg-red-500 hover:bg-red-600 text-white font-bold text-sm transition">
                حذف
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── PIN Dialog ── */}
      {pinDialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm" dir={dir}>
          <div className="relative w-full max-w-sm rounded-2xl border border-border p-6 shadow-2xl mx-4" style={{ background: 'var(--card)' }}>
            <button onClick={() => setPinDialog(false)} className="absolute top-4 left-4 text-muted-foreground hover:text-foreground transition">
              <X className="w-5 h-5" />
            </button>
            <div className="text-center mb-6">
              <div className="w-14 h-14 rounded-2xl bg-violet-500/10 flex items-center justify-center mx-auto mb-3">
                <Lock className="w-7 h-7 text-violet-400" />
              </div>
              <h3 className="font-bold text-lg">إعداد رمز PIN</h3>
              <p className="text-sm text-muted-foreground mt-1">أدخل رمزاً مكوناً من 6 أرقام</p>
            </div>
            <div className="flex gap-2 justify-center mb-4">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i}
                  className={`w-10 h-12 rounded-xl border-2 flex items-center justify-center font-mono text-xl font-bold transition ${pinValue.length > i ? 'border-violet-500 bg-violet-500/10 text-violet-300' : 'border-border'}`}>
                  {pinValue.length > i ? '●' : ''}
                </div>
              ))}
            </div>
            <input type="tel" inputMode="numeric" maxLength={6} value={pinValue}
              onChange={e => setPinValue(e.target.value.replace(/\D/g, '').slice(0, 6))}
              className="sr-only" autoFocus />
            <div className="grid grid-cols-3 gap-2 mb-4">
              {['1','2','3','4','5','6','7','8','9','','0','⌫'].map((btn, i) => (
                <button key={i} onClick={() => {
                  if (btn === '') return;
                  if (btn === '⌫') setPinValue(v => v.slice(0, -1));
                  else if (pinValue.length < 6) setPinValue(v => v + btn);
                }}
                  className={`h-12 rounded-xl border font-bold text-lg transition ${btn === '' ? 'invisible' : 'border-border hover:border-violet-500/40 hover:bg-violet-500/5'}`}>
                  {btn}
                </button>
              ))}
            </div>
            <div className="flex gap-2">
              <button onClick={() => setPinDialog(false)} className="flex-1 py-2.5 rounded-xl border border-border font-bold text-sm hover:bg-white/5 transition">إلغاء</button>
              <button onClick={handlePinSave} disabled={pinValue.length !== 6}
                className="flex-1 py-2.5 rounded-xl bg-violet-500 hover:bg-violet-600 text-white font-bold text-sm transition disabled:opacity-40 disabled:cursor-not-allowed">
                تأكيد
              </button>
            </div>
          </div>
        </div>
      )}

      {previewOpen && (
        <SettingsPreviewModal
          sectionId={activeSection}
          sectionLabel={sec.label}
          settings={s}
          liveTime={liveTime}
          previewKey={previewKey}
          onClose={() => setPreviewOpen(false)}
          onReplay={() => setPreviewKey(key => key + 1)}
        />
      )}
    </div>
  );
}
