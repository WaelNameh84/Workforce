import { useEffect, useRef, useCallback } from 'react';
import { useAppSettings } from '@/contexts/settings-context';

// ─── Web Audio tone generator ─────────────────────────────────────────────────
type ToneName = 'default' | 'soft' | 'strong' | 'ping' | 'chime' | 'bell' | 'digital' | 'gentle' | 'urgent' | 'silent';

function playTone(tone: ToneName, ctx: AudioContext) {
  const g = ctx.createGain();
  g.connect(ctx.destination);

  const now = ctx.currentTime;

  if (tone === 'silent') return;

  if (tone === 'soft' || tone === 'gentle') {
    // Gentle: two soft sine notes
    [880, 1100].forEach((freq, i) => {
      const osc = ctx.createOscillator();
      osc.type = 'sine';
      osc.frequency.value = freq;
      osc.connect(g);
      g.gain.setValueAtTime(0, now + i * 0.2);
      g.gain.linearRampToValueAtTime(0.2, now + i * 0.2 + 0.05);
      g.gain.exponentialRampToValueAtTime(0.001, now + i * 0.2 + 0.4);
      osc.start(now + i * 0.2);
      osc.stop(now + i * 0.2 + 0.4);
    });
    return;
  }

  if (tone === 'ping') {
    const osc = ctx.createOscillator();
    osc.type = 'sine';
    osc.frequency.value = 1400;
    osc.connect(g);
    g.gain.setValueAtTime(0.4, now);
    g.gain.exponentialRampToValueAtTime(0.001, now + 0.3);
    osc.start(now);
    osc.stop(now + 0.3);
    return;
  }

  if (tone === 'chime') {
    // Chime: 4 ascending notes
    [523, 659, 784, 1047].forEach((freq, i) => {
      const osc = ctx.createOscillator();
      osc.type = 'sine';
      osc.frequency.value = freq;
      osc.connect(g);
      g.gain.setValueAtTime(0, now + i * 0.15);
      g.gain.linearRampToValueAtTime(0.3, now + i * 0.15 + 0.04);
      g.gain.exponentialRampToValueAtTime(0.001, now + i * 0.15 + 0.5);
      osc.start(now + i * 0.15);
      osc.stop(now + i * 0.15 + 0.5);
    });
    return;
  }

  if (tone === 'bell') {
    // Bell: harmonic series
    [440, 880, 1320, 1760].forEach((freq, i) => {
      const osc = ctx.createOscillator();
      osc.type = 'sine';
      osc.frequency.value = freq;
      osc.connect(g);
      g.gain.setValueAtTime(0.3 / (i + 1), now);
      g.gain.exponentialRampToValueAtTime(0.001, now + 1.2);
      osc.start(now);
      osc.stop(now + 1.2);
    });
    return;
  }

  if (tone === 'digital') {
    // Digital: square wave beeps
    [1000, 0, 1000].forEach((freq, i) => {
      if (freq === 0) return;
      const osc = ctx.createOscillator();
      osc.type = 'square';
      osc.frequency.value = freq;
      osc.connect(g);
      g.gain.setValueAtTime(0.1, now + i * 0.18);
      g.gain.setValueAtTime(0, now + i * 0.18 + 0.12);
      osc.start(now + i * 0.18);
      osc.stop(now + i * 0.18 + 0.12);
    });
    return;
  }

  if (tone === 'strong' || tone === 'urgent') {
    // Strong: loud repeated beep
    [800, 800, 800].forEach((freq, i) => {
      const osc = ctx.createOscillator();
      osc.type = 'square';
      osc.frequency.value = freq;
      osc.connect(g);
      g.gain.setValueAtTime(0.18, now + i * 0.22);
      g.gain.setValueAtTime(0, now + i * 0.22 + 0.15);
      osc.start(now + i * 0.22);
      osc.stop(now + i * 0.22 + 0.15);
    });
    return;
  }

  // Default: classic notification (two-tone)
  [600, 900].forEach((freq, i) => {
    const osc = ctx.createOscillator();
    osc.type = 'sine';
    osc.frequency.value = freq;
    osc.connect(g);
    g.gain.setValueAtTime(0, now + i * 0.14);
    g.gain.linearRampToValueAtTime(0.3, now + i * 0.14 + 0.04);
    g.gain.exponentialRampToValueAtTime(0.001, now + i * 0.14 + 0.35);
    osc.start(now + i * 0.14);
    osc.stop(now + i * 0.14 + 0.35);
  });
}

// ─── Browser notification helper ────────────────────────────────────────────
async function sendBrowserNotif(title: string, body: string, icon?: string) {
  if (!('Notification' in window)) return;
  if (Notification.permission === 'default') {
    await Notification.requestPermission();
  }
  if (Notification.permission === 'granted') {
    new Notification(title, { body, icon: icon || '/favicon.svg' });
  }
}

// ─── Main hook ───────────────────────────────────────────────────────────────
export function useAlarm() {
  const s = useAppSettings();
  const ctxRef = useRef<AudioContext | null>(null);
  const firedRef = useRef<Set<string>>(new Set());

  const getCtx = useCallback(() => {
    if (!ctxRef.current) {
      ctxRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
    return ctxRef.current;
  }, []);

  // Public: play a sound immediately (used for test button)
  const playSound = useCallback((tone?: ToneName) => {
    const t = (tone ?? s.notifSoundTone ?? 'default') as ToneName;
    if (t === 'silent') return;
    try {
      const ctx = getCtx();
      if (ctx.state === 'suspended') ctx.resume().then(() => playTone(t, ctx));
      else playTone(t, ctx);
    } catch { /* ignore */ }
  }, [s.notifSoundTone, getCtx]);

  // Public: send notification with optional sound
  const notify = useCallback(async (title: string, body: string) => {
    if (s.notif.sound) playSound();
    if (s.notif.app) await sendBrowserNotif(title, body);
  }, [s.notif.sound, s.notif.app, playSound]);

  // Alarm ticker — check shift start/end every 30 s
  useEffect(() => {
    if (!s.notif.shiftStart && !s.notif.shiftEnd) return;

    const checkAlarms = () => {
      const now = new Date();
      const hhmm = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
      const dateKey = now.toDateString();

      if (s.notif.shiftStart && s.shiftStartAlarm) {
        const key = `start-${dateKey}-${s.shiftStartAlarm}`;
        if (hhmm === s.shiftStartAlarm && !firedRef.current.has(key)) {
          firedRef.current.add(key);
          if (s.notif.sound) playSound();
          if (s.notif.app) sendBrowserNotif('⏰ بداية الدوام', `حان وقت بدء العمل — ${s.shiftStartAlarm}`);
        }
      }

      if (s.notif.shiftEnd && s.shiftEndAlarm) {
        const key = `end-${dateKey}-${s.shiftEndAlarm}`;
        if (hhmm === s.shiftEndAlarm && !firedRef.current.has(key)) {
          firedRef.current.add(key);
          if (s.notif.sound) playSound();
          if (s.notif.app) sendBrowserNotif('🏁 نهاية الدوام', `انتهى وقت العمل — ${s.shiftEndAlarm}`);
        }
      }
    };

    checkAlarms();
    const id = setInterval(checkAlarms, 30_000);
    return () => clearInterval(id);
  }, [s.notif.shiftStart, s.notif.shiftEnd, s.shiftStartAlarm, s.shiftEndAlarm, s.notif.sound, s.notif.app, playSound]);

  // Request notification permission on mount
  useEffect(() => {
    if (s.notif.app && 'Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }
  }, [s.notif.app]);

  return { playSound, notify };
}
