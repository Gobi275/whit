// The mood blob, ported line for line from lib/painters/mood_shape_painter.dart
// (silhouette + duotone) and lib/widgets/mood_halo.dart (aurora halo).
import { toHsl, fromHsl, withAlpha, css, clamp } from './color.js';
import { duotoneSibling } from './theme.js';

const SAMPLES = 24;
const FREQS = [2, 3, 4];
const PHASES = [0.3, 1.85, 0.5];
const WEIGHTS = [1.0, 0.55, -0.3];
const DRIFT = [1.6, -2.2, 1.0];
const LOOP = [1, -2, 1];
const WEIGHT_SUM = 1.85;
const MAX_AMP = 0.3;
const ENERGY_AMP = 0.3;

export function radiusAt(theta, score, time = 0, energy = 0) {
  const t = clamp((score - 1) / 6, 0, 1);
  const live = clamp(t + ENERGY_AMP * clamp(energy, -1, 1), 0, 1);
  const amp = live * MAX_AMP;
  let m = 0;
  for (let i = 0; i < 3; i++) {
    m += WEIGHTS[i] * Math.sin(FREQS[i] * theta + PHASES[i] + t * DRIFT[i] + time * 2 * Math.PI * LOOP[i]);
  }
  return 1 + amp * (m / WEIGHT_SUM);
}

function baseRadius(size, score, time, energy, fit) {
  const half = size / 2;
  if (!fit) return half * 0.9;
  let peak = 0;
  for (let i = 0; i < 96; i++) peak = Math.max(peak, radiusAt((i / 96) * 2 * Math.PI, score, time, energy));
  return peak <= 0 ? half * 0.9 : (half * 0.9) / peak;
}

/** Closed Catmull–Rom spline through [pts] — _closedCatmullRomBezier. */
export function catmullRom(pts, p = new Path2D()) {
  const n = pts.length;
  p.moveTo(pts[0][0], pts[0][1]);
  for (let i = 0; i < n; i++) {
    const p0 = pts[(i - 1 + n) % n], p1 = pts[i], p2 = pts[(i + 1) % n], p3 = pts[(i + 2) % n];
    p.bezierCurveTo(
      p1[0] + (p2[0] - p0[0]) / 6, p1[1] + (p2[1] - p0[1]) / 6,
      p2[0] - (p3[0] - p1[0]) / 6, p2[1] - (p3[1] - p1[1]) / 6,
      p2[0], p2[1],
    );
  }
  p.closePath();
  return p;
}

/** MoodShapePainter.buildPath for a square box of [size]. */
export function blobPath(size, score, { time = 0, energy = 0, fit = false } = {}) {
  const c = size / 2;
  const r0 = baseRadius(size, score, time, energy, fit);
  const pts = [];
  for (let i = 0; i < SAMPLES; i++) {
    const th = (i / SAMPLES) * 2 * Math.PI;
    const r = radiusAt(th, score, time, energy) * r0;
    pts.push([c + r * Math.cos(th), c + r * Math.sin(th)]);
  }
  return { path: catmullRom(pts), r0 };
}

/** The diagonal duotone (TL colour → BR sibling) over the circle of r0. */
export function moodGradient(ctx, color, cx, cy, r) {
  const g = ctx.createLinearGradient(cx - r, cy - r, cx + r, cy + r);
  g.addColorStop(0, css(color));
  g.addColorStop(1, css(duotoneSibling(color)));
  return g;
}

/** Paints the blob (MoodShapePainter.paint) into a box at (x, y). */
export function drawBlob(ctx, x, y, size, score, color, { time = 0, energy = 0, fit = false } = {}) {
  const { path, r0 } = blobPath(size, score, { time, energy, fit });
  ctx.save();
  ctx.translate(x, y);
  ctx.fillStyle = moodGradient(ctx, color, size / 2, size / 2, r0);
  ctx.fill(path);
  ctx.restore();
}

// ── MoodHalo ──────────────────────────────────────────────────────────────
const HALO = [
  { scale: 2.1, hue: -24, sat: 0.88, light: 1.08, sigma: 26, aD: 0.045, aL: 0.07, phase: 0.0, spin: 0.6, dx: -0.1, dy: -0.06 },
  { scale: 1.68, hue: 25, sat: 1.0, light: 0.96, sigma: 20, aD: 0.055, aL: 0.085, phase: 0.37, spin: -0.9, dx: 0.09, dy: 0.05 },
  { scale: 1.32, hue: 0, sat: 1.0, light: 1.0, sigma: 14, aD: 0.07, aL: 0.105, phase: 0.71, spin: 0.4, dx: 0.0, dy: 0.02 },
];

/** _MoodHaloPainter.paint around centre (cx, cy). time = 0..1 over 26 s. */
export function drawHalo(ctx, cx, cy, shapeSize, score, color, isDark, time, energy = 0, dpr = 1) {
  const sigmaScale = shapeSize / 130;
  const hsl = toHsl(color);
  for (const l of HALO) {
    const s = shapeSize * l.scale;
    const { path } = blobPath(s, score, { time: time + l.phase, energy });
    const ph = 2 * Math.PI * (time * l.spin + l.phase);
    const angle = Math.sin(ph) * 0.14;
    const wander = 0.7 + 0.3 * Math.cos(ph * 0.6);
    const tint = fromHsl({
      h: (((hsl.h + l.hue) % 360) + 360) % 360,
      s: clamp(hsl.s * l.sat, 0, 1),
      l: clamp(hsl.l * l.light, 0, 1),
      a: isDark ? l.aD : l.aL,
    });
    ctx.save();
    const OFF = 20000;
    ctx.shadowColor = css(tint);
    ctx.shadowBlur = 2 * l.sigma * sigmaScale * dpr;
    ctx.shadowOffsetX = OFF * dpr;
    ctx.translate(cx + l.dx * shapeSize * wander - OFF, cy + l.dy * shapeSize * wander);
    ctx.rotate(angle);
    ctx.translate(-s / 2, -s / 2);
    ctx.fillStyle = '#000';
    ctx.fill(path);
    ctx.restore();
  }
}

/** The MoodField / history radial halo: color α0.26 → 0 at 2.3r. */
export function drawRadialHalo(ctx, cx, cy, radius, color, alpha = 0.26) {
  const g = ctx.createRadialGradient(cx, cy, 0, cx, cy, radius);
  g.addColorStop(0, css(withAlpha(color, alpha)));
  g.addColorStop(1, css(withAlpha(color, 0)));
  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.arc(cx, cy, radius, 0, Math.PI * 2);
  ctx.fill();
}
