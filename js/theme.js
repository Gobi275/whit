// The app's theme, ported from lib/theme/app_theme.dart + mood_colors.dart.
// Literals are the app's literals; everything derived is derived with the same
// formula, so a change in the app is a change of one hex here.
import { hex, toHsl, fromHsl, lerp, clamp, withAlpha, css, stepLightness, litDesat, luminance } from './color.js';

export const Bold = { paper: hex('#F3E7E1'), ink: hex('#231814') };

const DARK = {
  isDark: true,
  bg: hex('#0F0C14'),
  text: hex('#F3E7E1'),
  textSecondary: hex('#9B97A3'),
  textMuted: hex('#8B8794'),
  textDisabled: hex('#66626D'),
  bgSecondary: hex('#16121D'),
  border: hex('#1FC1BCCC'),
  success: hex('#6A9A70'),
  error: hex('#E85848'),
  veilTint: hex('#E3DEED'),
  highlight: hex('#E3DEED'),
};

const WHITE_T = {
  isDark: false,
  bg: hex('#EEDCD4'),
  text: hex('#231814'),
  textSecondary: hex('#5E504B'),
  textMuted: hex('#5E504B'),
  textDisabled: hex('#8B7D76'),
  bgSecondary: hex('#E7D3CA'),
  border: hex('#16231814'),
  success: hex('#5A8A60'),
  error: hex('#D04838'),
  veilTint: hex('#28170F'),
  highlight: hex('#FFF7F2'),
};

export const themeFor = (isDark) => (isDark ? DARK : WHITE_T);

// ── Mood palette ──────────────────────────────────────────────────────────
const darkMood = ['#7068E0', '#4898E0', '#38C0B8', '#48C868', '#D0C040', '#E89838', '#E85848'].map(hex);

// HSV saturation × 1.12, value untouched — MoodColors._lightColors.
function hsvSat(c, mul) {
  const r = c.r / 255, g = c.g / 255, b = c.b / 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b), d = max - min;
  let h = 0;
  if (d !== 0) {
    if (max === r) h = 60 * (((g - b) / d) % 6);
    else if (max === g) h = 60 * ((b - r) / d + 2);
    else h = 60 * ((r - g) / d + 4);
  }
  if (h < 0) h += 360;
  const v = max;
  let s = max === 0 ? 0 : d / max;
  s = clamp(s * mul, 0, 1);
  const C = v * s, X = C * (1 - Math.abs(((h / 60) % 2) - 1)), m = v - C;
  let rr, gg, bb;
  const hp = h / 60;
  if (hp < 1) [rr, gg, bb] = [C, X, 0];
  else if (hp < 2) [rr, gg, bb] = [X, C, 0];
  else if (hp < 3) [rr, gg, bb] = [0, C, X];
  else if (hp < 4) [rr, gg, bb] = [0, X, C];
  else if (hp < 5) [rr, gg, bb] = [X, 0, C];
  else [rr, gg, bb] = [C, 0, X];
  return { r: (rr + m) * 255, g: (gg + m) * 255, b: (bb + m) * 255, a: 1 };
}
const lightMood = darkMood.map((c) => hsvSat(c, 1.12));

/** MoodColors.getMoodColor — fractional scores interpolate. */
export function moodColor(score, isDark) {
  const s = clamp(score, 1, 7);
  const idx = s - 1;
  const cols = isDark ? darkMood : lightMood;
  const lo = Math.floor(idx), hi = Math.min(6, Math.ceil(idx));
  if (lo === hi) return cols[lo];
  return lerp(cols[lo], cols[hi], idx - lo);
}

/** MoodShapePainter.duotoneSibling — hue +25°, lightness × 0.88. */
export function duotoneSibling(c) {
  const h = toHsl(c);
  return fromHsl({ h: (h.h + 25) % 360, s: h.s, l: clamp(h.l * 0.88, 0, 1), a: c.a });
}

/** MoodColors.contrastOn */
export const contrastOn = (fill) => (luminance(fill) > 0.45 ? hex('#15151A') : hex('#FFFFFF'));

/** MoodColors.readableOnLight */
export function readableOnLight(c) {
  if (luminance(c) <= 0.32) return c;
  const h = toHsl(c);
  return fromHsl({ ...h, l: clamp(h.l * 0.6, 0, 0.42), s: clamp(h.s * 1.05, 0, 1) });
}

// ── Derived surface tones (bento.dart) ────────────────────────────────────
export function onCardColor(t) {
  if (t.isDark) return lerp(t.bg, { r: 255, g: 255, b: 255, a: 1 }, 0.12);
  const h = toHsl(t.bg);
  return fromHsl({ ...h, l: clamp(h.l - 0.088, 0, 1), s: clamp(h.s * 0.72, 0, 1) });
}

export function rimTone(t) {
  return t.isDark ? litDesat(t.bg, 0.46, 0.18) : t.textMuted;
}

/** Pushes the theme into CSS custom properties. */
export function applyTheme(isDark) {
  const t = themeFor(isDark);
  const root = document.documentElement;
  const set = (k, v) => root.style.setProperty(k, v);
  set('--bg', css(t.bg));
  set('--ink', css(t.text));
  set('--ink-2', css(t.textSecondary));
  set('--muted', css(t.textMuted));
  set('--disabled', css(t.textDisabled));
  set('--bg-2', css(t.bgSecondary));
  set('--border', css(t.border));
  set('--success', css(t.success));
  set('--bold', css(isDark ? Bold.paper : Bold.ink));
  set('--on-bold', css(isDark ? Bold.ink : Bold.paper));
  set('--on-card', css(onCardColor(t)));
  // Glass: veil 0.05 / 0.035, chip 0.10 / 0.055 (glassVeilFor / glassChipFillFor).
  set('--veil', css(withAlpha(t.veilTint, isDark ? 0.05 : 0.035)));
  set('--chip', css(withAlpha(t.veilTint, isDark ? 0.1 : 0.055)));
  set('--glass-rgb', `${Math.round(t.veilTint.r)},${Math.round(t.veilTint.g)},${Math.round(t.veilTint.b)}`);
  set('--hl', css(withAlpha(t.highlight, isDark ? 0.12 : 0.32)));
  // Glass rim tiers (peak, dim) — glass_painters.dart _tierAlphas.
  set('--rim-w', isDark ? '0.8px' : '1px');
  set('--rim-sub-p', isDark ? 0.4 : 0.18);
  set('--rim-sub-d', isDark ? 0.06 : 0.03);
  set('--rim-med-p', isDark ? 0.5 : 0.24);
  set('--rim-med-d', isDark ? 0.08 : 0.04);
  set('--ink-08', css(withAlpha(t.text, 0.08)));
  set('--ink-12', css(withAlpha(t.text, 0.12)));
  set('--ink-60', css(withAlpha(t.text, 0.6)));
  set('--ink-85', css(withAlpha(t.text, 0.85)));
  set('--body-w', isDark ? '400' : '500');
  set('--m5', css(moodColor(5, isDark)));
  set('--m6', css(moodColor(6, isDark)));
  set('--header-shadow', css(withAlpha({ r: 0, g: 0, b: 0, a: 1 }, isDark ? 0.22 : 0.06)));
  root.dataset.theme = isDark ? 'dark' : 'light';
  root.style.colorScheme = isDark ? 'dark' : 'light';
  const meta = document.querySelector('meta[name=theme-color]');
  if (meta) meta.content = css(t.bg).replace(/,1\)$/, ',1)');
  return t;
}

// ── Curves (Flutter's exact cubics) ───────────────────────────────────────
function cubic(a, b, c, d) {
  // Flutter's Cubic.transform: bisection on x.
  const ev = (p1, p2, m) => 3 * p1 * (1 - m) * (1 - m) * m + 3 * p2 * (1 - m) * m * m + m * m * m;
  return (t) => {
    if (t <= 0) return 0;
    if (t >= 1) return 1;
    let start = 0, end = 1;
    for (;;) {
      const mid = (start + end) / 2;
      const est = ev(a, c, mid);
      if (Math.abs(t - est) < 0.001) return ev(b, d, mid);
      if (est < t) start = mid;
      else end = mid;
    }
  };
}
export const Curves = {
  easeInOut: cubic(0.42, 0, 0.58, 1),
  easeOut: cubic(0, 0, 0.58, 1),
  easeOutCubic: cubic(0.215, 0.61, 0.355, 1),
  easeOutBack: cubic(0.175, 0.885, 0.32, 1.275),
  collapseOpen: cubic(0.22, 1, 0.36, 1),
  elasticOut: (t) => {
    const period = 0.4, s = period / 4;
    if (t <= 0) return 0;
    if (t >= 1) return 1;
    return Math.pow(2, -10 * t) * Math.sin(((t - s) * (Math.PI * 2)) / period) + 1;
  },
};

/** Skia's synthetic-bold stroke width for Syne at [size] px (see docs/BRAND.md). */
export function fauxBold(size) {
  const t = (Math.min(Math.max(size, 9), 36) - 9) / 27;
  return size * (1 / 24 + t * (1 / 32 - 1 / 24));
}

export { stepLightness, litDesat };
