// The bento material, ported from lib/theme/bento.dart: SquircleBorder geometry,
// the neumorphic shadow pair, the dark theme's hairline rim + sheen, and the
// inverted-hero drop. Painted on a canvas behind each element so the shapes are
// the app's superellipse (CSS border-radius can't draw one) and the shadows are
// the same blurred-silhouette BoxShadow Flutter paints.
import { hex, lerp, withAlpha, css, stepLightness, litDesat, WHITE, BLACK } from './color.js';
import { Bold, themeFor } from './theme.js';

export const bentoRadius = 56;
export const bentoCompactRadius = 34;

const sign = (v) => (v < 0 ? -1 : 1);

/** SquircleBorder._build → a Path2D (or calls into ctx when given). */
export function squirclePath(l, t, r, b, rad, bow = 1.5, { exponent = 3, adaptive = false } = {}) {
  const w = r - l, h = b - t;
  const minSide = Math.min(w, h);
  const rr = Math.min(rad, minSide / 2);
  const pillT = adaptive && rad > 0 ? Math.min(1, Math.max(0, (1 - minSide / (2 * rad)) / 0.3)) : 0;
  const effExp = exponent + (2 - exponent) * pillT;
  const effBow = bow * (1 - pillT);
  const hHalf = (r - rr - (l + rr)) / 2;
  const vHalf = (b - rr - (t + rr)) / 2;
  const bH = Math.max(0, Math.min(effBow, 0.013 * hHalf));
  const bV = Math.max(0, Math.min(effBow, 0.013 * vHalf));
  const p = new Path2D();
  const corner = (cx, cy, start) => {
    for (let i = 0; i <= 14; i++) {
      const a = start + (Math.PI / 2) * (i / 14);
      const ct = Math.cos(a), st = Math.sin(a);
      p.lineTo(cx + rr * sign(ct) * Math.pow(Math.abs(ct), 2 / effExp), cy + rr * sign(st) * Math.pow(Math.abs(st), 2 / effExp));
    }
  };
  const midX = (l + r) / 2, midY = (t + b) / 2;
  p.moveTo(l + rr, t);
  bH > 0 ? p.quadraticCurveTo(midX, t - bH, r - rr, t) : p.lineTo(r - rr, t);
  corner(r - rr, t + rr, -Math.PI / 2);
  bV > 0 ? p.quadraticCurveTo(r + bV, midY, r, b - rr) : p.lineTo(r, b - rr);
  corner(r - rr, b - rr, 0);
  bH > 0 ? p.quadraticCurveTo(midX, b + bH, l + rr, b) : p.lineTo(l + rr, b);
  corner(l + rr, b - rr, Math.PI / 2);
  bV > 0 ? p.quadraticCurveTo(l - bV, midY, l, t + rr) : p.lineTo(l, t + rr);
  corner(l + rr, t + rr, Math.PI);
  p.closePath();
  return p;
}

/** The same outline as [squirclePath], sampled to points (bowed edges at 12 steps). */
export function squirclePoints(l, t, r, b, rad, bow = 1.5, { exponent = 3, adaptive = false } = {}) {
  const w = r - l, h = b - t, minSide = Math.min(w, h);
  const rr = Math.min(rad, minSide / 2);
  const pillT = adaptive && rad > 0 ? Math.min(1, Math.max(0, (1 - minSide / (2 * rad)) / 0.3)) : 0;
  const effExp = exponent + (2 - exponent) * pillT, effBow = bow * (1 - pillT);
  const bH = Math.max(0, Math.min(effBow, 0.013 * ((r - rr - (l + rr)) / 2)));
  const bV = Math.max(0, Math.min(effBow, 0.013 * ((b - rr - (t + rr)) / 2)));
  const pts = [];
  const quad = (x0, y0, cx, cy, x1, y1) => {
    for (let i = 1; i <= 12; i++) {
      const s = i / 12, u = 1 - s;
      pts.push([u * u * x0 + 2 * u * s * cx + s * s * x1, u * u * y0 + 2 * u * s * cy + s * s * y1]);
    }
  };
  const corner = (cx, cy, start) => {
    for (let i = 0; i <= 14; i++) {
      const a = start + (Math.PI / 2) * (i / 14), ct = Math.cos(a), st = Math.sin(a);
      pts.push([cx + rr * sign(ct) * Math.pow(Math.abs(ct), 2 / effExp), cy + rr * sign(st) * Math.pow(Math.abs(st), 2 / effExp)]);
    }
  };
  const midX = (l + r) / 2, midY = (t + b) / 2;
  pts.push([l + rr, t]);
  quad(l + rr, t, midX, t - bH, r - rr, t);
  corner(r - rr, t + rr, -Math.PI / 2);
  quad(r, t + rr, r + bV, midY, r, b - rr);
  corner(r - rr, b - rr, 0);
  quad(r - rr, b, midX, b + bH, l + rr, b);
  corner(l + rr, b - rr, Math.PI / 2);
  quad(l, b - rr, l - bV, midY, l, t + rr);
  corner(l + rr, t + rr, Math.PI);
  return pts;
}

/** Flutter BoxShadow: sigma = blurRadius·0.57735 + 0.5. */
const sigmaOf = (blurRadius) => blurRadius * 0.57735 + 0.5;

/** bentoNeumorphicShadowsFor(cardTheme, screenTheme, compact). */
export function shadowsFor(screenDark, inverted, compact) {
  if (inverted) {
    return screenDark
      ? [{ c: hex('#C7000000'), blur: compact ? 18 : 20, dx: compact ? 2 : 3, dy: compact ? 6 : 9 }]
      : [{ c: hex('#50291811'), blur: compact ? 14 : 16, dx: compact ? 2 : 3, dy: compact ? 5 : 7 }];
  }
  if (screenDark) {
    const base = themeFor(true).bg;
    const dd = compact ? 5 : 7, bb = compact ? 11 : 15, step = compact ? 0.035 : 0.045;
    return [
      { c: withAlpha(stepLightness(base, step), 0.8), blur: bb, dx: -dd, dy: -dd },
      { c: withAlpha(stepLightness(base, -step), 0.8), blur: bb, dx: dd, dy: dd },
    ];
  }
  const d = compact ? 4 : 6, b = compact ? 10 : 8;
  return [
    { c: hex('#CCFFFCF8'), blur: b, dx: -d, dy: -d },
    { c: hex('#6EAE826A'), blur: b, dx: d, dy: d },
  ];
}

const BLEED = 48;

/**
 * Paints a bento surface behind [el]. Options (data attributes on the element):
 *   data-bento="section|compact|pill|tile"   size tier
 *   data-invert                               bold, theme-inverted hero
 *   data-fill="scaffold"                      flat scaffold fill (glow panels)
 */
export class BentoSurface {
  constructor(el) {
    this.el = el;
    this.canvas = document.createElement('canvas');
    this.canvas.className = 'bento-canvas';
    this.canvas.setAttribute('aria-hidden', 'true');
    el.prepend(this.canvas);
    this.ro = new ResizeObserver(() => this.paint());
    this.ro.observe(el);
  }

  paint() {
    const el = this.el;
    const w = el.offsetWidth, h = el.offsetHeight;
    if (!w || !h) return;
    const dpr = Math.min(window.devicePixelRatio || 1, 2.5);
    const cw = w + BLEED * 2, ch = h + BLEED * 2;
    const cv = this.canvas;
    if (cv.width !== Math.round(cw * dpr) || cv.height !== Math.round(ch * dpr)) {
      cv.width = Math.round(cw * dpr);
      cv.height = Math.round(ch * dpr);
      cv.style.width = cw + 'px';
      cv.style.height = ch + 'px';
    }
    const ctx = cv.getContext('2d');
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, cv.width, cv.height);
    ctx.setTransform(dpr, 0, 0, dpr, BLEED * dpr, BLEED * dpr);

    const screenDark = document.documentElement.dataset.theme !== 'light';
    const kind = el.dataset.bento || 'section';
    const inverted = el.hasAttribute('data-invert');
    const compact = kind === 'compact' || kind === 'pill';
    const radius = kind === 'pill' ? 999 : kind === 'compact' ? bentoCompactRadius : kind === 'tile' ? 20 : bentoRadius;
    const adaptive = kind === 'pill' || el.hasAttribute('data-adaptive');
    const glowW = kind === 'pill' ? 13 : radius >= bentoRadius ? 26 : 15;
    const path = (l, t, r, b, rad) => squirclePath(l, t, r, b, rad, 1.5, { adaptive });

    // ── Shadows (painted first, under the face) ──
    // The canvas shadow trick: draw the silhouette far off-canvas and let its
    // shadow fall back into view. shadowBlur = 2σ and is in device pixels.
    if (!el.hasAttribute('data-noshadow')) {
      const OFF = 10000;
      for (const s of shadowsFor(screenDark, inverted, compact)) {
        ctx.save();
        ctx.shadowColor = css(s.c);
        ctx.shadowBlur = 2 * sigmaOf(s.blur) * dpr;
        ctx.shadowOffsetX = (s.dx + OFF) * dpr;
        ctx.shadowOffsetY = s.dy * dpr;
        ctx.translate(-OFF, 0);
        ctx.fillStyle = '#000';
        ctx.fill(path(0, 0, w, h, radius));
        ctx.restore();
      }
    }

    // ── Face ──
    const t = themeFor(screenDark);
    const outer = path(0, 0, w, h, radius);
    let fill;
    if (el.dataset.fill === 'scaffold') {
      fill = css(t.bg);
    } else if (inverted) {
      if (screenDark) {
        const g = ctx.createLinearGradient(0, 0, w, h);
        g.addColorStop(0, css(stepLightness(Bold.paper, 0.012)));
        g.addColorStop(1, css(Bold.paper));
        fill = g;
      } else {
        fill = css(Bold.ink);
      }
    } else if (screenDark) {
      fill = css(stepLightness(t.bg, 0.004));
    } else {
      const g = ctx.createLinearGradient(0, 0, w, h);
      g.addColorStop(0, css(lerp(t.bg, BLACK, 0.035)));
      g.addColorStop(1, css(lerp(t.bg, WHITE, 0.05)));
      fill = g;
    }
    ctx.fillStyle = fill;
    ctx.fill(outer);

    // ── Dark-only rim: sheen, then the directional hairline ──
    if (screenDark && !inverted) {
      const lit = litDesat(t.bg, 0.2, 0.34);
      // Sheen (bentoRimGlow): a blurred stroke clipped to the outline.
      const sheen = withAlpha(litDesat(t.bg, 0.13, 0.4), 0.08);
      ctx.save();
      ctx.clip(outer);
      const inset = glowW / 2;
      const OFF = 10000;
      ctx.shadowColor = css(sheen);
      ctx.shadowBlur = 2 * (glowW / 3) * dpr;
      ctx.shadowOffsetX = OFF * dpr;
      ctx.translate(-OFF, 0);
      ctx.lineWidth = glowW;
      ctx.strokeStyle = '#000';
      ctx.stroke(path(inset, inset, w - inset, h - inset, radius - inset));
      ctx.restore();

      // Hairline 0.9 px, gradient faint → trough → trough → lit (TL → BR).
      const g = ctx.createLinearGradient(0, 0, w, h);
      g.addColorStop(0, css(withAlpha(lit, 0.42)));
      g.addColorStop(0.38, css(withAlpha(lit, 0.09)));
      g.addColorStop(0.62, css(withAlpha(lit, 0.09)));
      g.addColorStop(1, css(withAlpha(lit, 0.85)));
      ctx.lineWidth = 0.9;
      ctx.strokeStyle = g;
      ctx.stroke(path(0.45, 0.45, w - 0.45, h - 0.45, radius - 0.45));
    }
  }
}

const surfaces = new Set();
export function mountBentos(root = document) {
  root.querySelectorAll('[data-bento]').forEach((el) => {
    if (el._bento) return;
    el._bento = new BentoSurface(el);
    surfaces.add(el._bento);
  });
}
export function repaintBentos() {
  surfaces.forEach((s) => s.paint());
}
