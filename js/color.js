// Colour maths, ported 1:1 from Flutter (Color, HSLColor, Color.lerp) so every
// derived tone lands on the same value the app computes. Colours are plain
// {r,g,b,a} objects with r/g/b in 0..255 (floats) and a in 0..1.

export const rgba = (r, g, b, a = 1) => ({ r, g, b, a });

export function hex(h) {
  h = h.replace('#', '');
  if (h.length === 8) {
    // Flutter's 0xAARRGGBB order.
    return rgba(
      parseInt(h.slice(2, 4), 16),
      parseInt(h.slice(4, 6), 16),
      parseInt(h.slice(6, 8), 16),
      parseInt(h.slice(0, 2), 16) / 255,
    );
  }
  return rgba(parseInt(h.slice(0, 2), 16), parseInt(h.slice(2, 4), 16), parseInt(h.slice(4, 6), 16), 1);
}

export const withAlpha = (c, a) => ({ ...c, a });

export function css(c) {
  const r = Math.round(c.r), g = Math.round(c.g), b = Math.round(c.b);
  return `rgba(${r},${g},${b},${+c.a.toFixed(4)})`;
}

const clamp = (v, lo, hi) => (v < lo ? lo : v > hi ? hi : v);
export { clamp };

/** HSLColor.fromColor */
export function toHsl(c) {
  const r = c.r / 255, g = c.g / 255, b = c.b / 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  const delta = max - min;
  let h = 0;
  if (max === 0 || delta === 0) h = 0;
  else if (max === r) h = 60 * (((g - b) / delta) % 6);
  else if (max === g) h = 60 * ((b - r) / delta + 2);
  else h = 60 * ((r - g) / delta + 4);
  if (Number.isNaN(h)) h = 0;
  if (h < 0) h += 360;
  const l = (max + min) / 2;
  const s = l === 1 || l === 0 ? 0 : clamp(delta / (1 - Math.abs(2 * l - 1)), 0, 1);
  return { h, s, l, a: c.a };
}

/** HSLColor.toColor */
export function fromHsl({ h, s, l, a = 1 }) {
  const chroma = (1 - Math.abs(2 * l - 1)) * s;
  const hp = h / 60;
  const second = chroma * (1 - Math.abs((hp % 2) - 1));
  const match = l - chroma / 2;
  let r, g, b;
  if (hp < 1) [r, g, b] = [chroma, second, 0];
  else if (hp < 2) [r, g, b] = [second, chroma, 0];
  else if (hp < 3) [r, g, b] = [0, chroma, second];
  else if (hp < 4) [r, g, b] = [0, second, chroma];
  else if (hp < 5) [r, g, b] = [second, 0, chroma];
  else [r, g, b] = [chroma, 0, second];
  return rgba((r + match) * 255, (g + match) * 255, (b + match) * 255, a);
}

/** Color.lerp */
export function lerp(a, b, t) {
  return rgba(a.r + (b.r - a.r) * t, a.g + (b.g - a.g) * t, a.b + (b.b - a.b) * t, a.a + (b.a - a.a) * t);
}

export const WHITE = rgba(255, 255, 255, 1);
export const BLACK = rgba(0, 0, 0, 1);

/** bento.dart stepLightness — move along lightness only. */
export function stepLightness(c, d) {
  const h = toHsl(c);
  return fromHsl({ ...h, l: clamp(h.l + d, 0, 1) });
}

/** Lightness + saturation-multiplier step, the rim/sheen recipe. */
export function litDesat(c, dl, smul) {
  const h = toHsl(c);
  return fromHsl({ ...h, l: clamp(h.l + dl, 0, 1), s: clamp(h.s * smul, 0, 1) });
}

/** Color.computeLuminance */
export function luminance(c) {
  const lin = (v) => {
    v /= 255;
    return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
  };
  return 0.2126 * lin(c.r) + 0.7152 * lin(c.g) + 0.0722 * lin(c.b);
}
