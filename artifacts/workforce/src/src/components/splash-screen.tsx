import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useSettings } from '@/contexts/settings-context';
import {
  GLOBAL_CSS,
  ThemeCosmic, ThemeAurora, ThemeNeon,
  ThemeCrystal, ThemeFire,  ThemeOcean,
  ThemeRings,  ThemeGlass,  ThemePremium,
  ThemeHolo,   ThemeParticles, ThemeSpace,
  ThemeGolden, ThemeSmoke,
} from './splash-themes';

function toRgb(hex: string) {
  const h = hex.replace('#', '');
  const n = parseInt(h.length === 3 ? h.split('').map(x => x + x).join('') : h, 16);
  return `${(n >> 16) & 255},${(n >> 8) & 255},${n & 255}`;
}

export default function SplashScreen() {
  const { s, serverSynced } = useSettings();
  const [visible, setVisible] = useState(true);

  const duration = Math.max(1800, parseInt(s.splashDuration || '2500', 10));
  const color    = s.appColor || '#6366f1';
  const rgb      = toRgb(color);
  const fillSec  = Math.max(0.5, (duration - 1200) / 1000);

  const props = {
    color, rgb,
    appName:     s.appName     || 'WorkforceOS',
    companyName: s.companyName || '',
    logoUrl:     s.logoUrl     || '',
    showLogo:    s.splashShowLogo    !== false,
    showName:    s.splashShowName    !== false,
    showProg:    s.splashShowProgress !== false,
    fillSec,
  };

  // Wait for server settings to arrive (or 1.5 s max) before starting the
  // dismiss countdown — ensures the latest logo / welcome message is shown.
  useEffect(() => {
    if (!serverSynced) return;
    const t = setTimeout(() => setVisible(false), duration);
    return () => clearTimeout(t);
  }, [serverSynced, duration]);

  const ThemeMap = {
    cosmic:    ThemeCosmic,
    aurora:    ThemeAurora,
    neon:      ThemeNeon,
    crystal:   ThemeCrystal,
    fire:      ThemeFire,
    ocean:     ThemeOcean,
    rings:     ThemeRings,
    glass:     ThemeGlass,
    premium:   ThemePremium,
    holo:      ThemeHolo,
    particles: ThemeParticles,
    space:     ThemeSpace,
    golden:    ThemeGolden,
    smoke:     ThemeSmoke,
  } as const;

  const Theme = ThemeMap[(s.splashTheme as keyof typeof ThemeMap) || 'cosmic'] ?? ThemeCosmic;

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          key="splash"
          initial={{ opacity: 1 }}
          exit={{ opacity: 0, scale: 1.04 }}
          transition={{ duration: 0.7, ease: 'easeInOut' }}
          className="fixed inset-0 z-[500] overflow-hidden select-none"
          style={{ isolation: 'isolate' }}
        >
          <style>{GLOBAL_CSS}</style>
          <Theme {...props} />

          {/* Bottom tag */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.22 }}
            transition={{ delay: 1.4, duration: 0.8 }}
            style={{
              position: 'absolute', bottom: 28, left: '50%',
              transform: 'translateX(-50%)',
              display: 'flex', alignItems: 'center', gap: 8,
              pointerEvents: 'none',
            }}
          >
            <div style={{ width: 20, height: 1, background: 'rgba(255,255,255,.5)' }} />
            <span style={{ color: 'white', fontSize: 9, letterSpacing: '.25em', fontWeight: 600, whiteSpace: 'nowrap' }}>
              WORKFORCEOS SYSTEM
            </span>
            <div style={{ width: 20, height: 1, background: 'rgba(255,255,255,.5)' }} />
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
