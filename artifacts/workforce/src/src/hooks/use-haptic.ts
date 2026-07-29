/**
 * Haptic feedback via navigator.vibrate
 * Falls back silently on unsupported devices.
 */
export type HapticStyle = 'light' | 'medium' | 'heavy' | 'success' | 'error';

const patterns: Record<HapticStyle, number | number[]> = {
  light:   10,
  medium:  25,
  heavy:   50,
  success: [10, 50, 10],
  error:   [50, 30, 80],
};

export function useHaptic() {
  const trigger = (style: HapticStyle = 'light') => {
    try {
      if (navigator.vibrate) navigator.vibrate(patterns[style]);
    } catch {}
  };
  return { trigger };
}
