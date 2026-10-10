// The glass peek (lib/widgets/glass_peek.dart): a glass panel that GROWS OUT OF
// the thing that was tapped and shows a short, read-only answer. Squircle at
// radius 56, blur 24 + saturate 1.1, panel tone at 62 %, medium glass rim, an
// outset shadow. Opens 320 ms easeOutCubic (scaleX .86→1, scaleY .18→1, opacity
// ×3), content fades in on Interval(.42, 1); closes 200 ms easeInCubic.
// Tapping anywhere — the panel included — dismisses it: there is nothing to hit.
import { css, withAlpha, clamp, stepLightness } from './color.js';
import { themeFor, Curves } from './theme.js';
import { squirclePoints } from './bento.js';

const easeOutCubic = (t) => 1 - Math.pow(1 - t, 3);
const easeInCubic = (t) => t * t * t;
const interval = (t, a, b, f = (x) => x) => f(clamp((t - a) / (b - a), 0, 1));

let open = null;

function panelTone(dark) {
  const t = themeFor(dark);
  return dark ? stepLightness(t.bg, 0.035) : t.bgSecondary;
}

/** paintGlassBorder: alpha by angle around the centre, TL/BR peak, TR/BL dim. */
function paintRim(ctx, pts, cx, cy, dark) {
  const [peak, dim] = dark ? [0.5, 0.08] : [0.24, 0.04];
  const tint = themeFor(dark).veilTint;
  ctx.lineWidth = dark ? 0.8 : 1;
  ctx.lineCap = 'butt';
  for (let i = 0; i < pts.length; i++) {
    const a = pts[i], b = pts[(i + 1) % pts.length];
    const mx = (a[0] + b[0]) / 2, my = (a[1] + b[1]) / 2;
    let t = (Math.atan2(my - cy, mx - cx) + (3 * Math.PI) / 4) / (2 * Math.PI);
    t -= Math.floor(t);
    const q = t * 4, k = q - Math.floor(q);
    const al = Math.floor(q) % 2 === 0 ? peak + (dim - peak) * k : dim + (peak - dim) * k;
    ctx.strokeStyle = css(withAlpha(tint, al));
    ctx.beginPath(); ctx.moveTo(a[0], a[1]); ctx.lineTo(b[0], b[1]); ctx.stroke();
  }
}

export function closePeek() {
  if (open) open.close();
}

/**
 * Opens a peek growing out of [source] (an element). [content] is HTML.
 * Returns the panel element.
 */
export function showPeek(source, content, { width = 360, label = '' } = {}) {
  closePeek();
  const dark = document.documentElement.dataset.theme !== 'light';
  const layer = document.createElement('div');
  layer.className = 'peek-layer';
  layer.innerHTML = `<div class="peek-scrim"></div><div class="peek" role="dialog" aria-modal="true" aria-label="${label}">
    <canvas class="peek-shadow" aria-hidden="true"></canvas><div class="peek-glass"></div><canvas class="peek-rim" aria-hidden="true"></canvas>
    <div class="peek-body">${content}</div></div>`;
  document.body.appendChild(layer);
  const panel = layer.querySelector('.peek');
  const body = layer.querySelector('.peek-body');
  const scrim = layer.querySelector('.peek-scrim');
  // glass_peek.dart: black 12 % in dark, the warm veil pigment 5 % in light.
  // Never the violet-white veil tint: that LIFTS the whole page toward grey.
  scrim.style.background = dark ? 'rgba(0,0,0,0.12)' : css(withAlpha(themeFor(false).veilTint, 0.05));

  // Lay out: as wide as asked (never wider than the screen minus 16 each side),
  // centred on the trigger, below it when there is room, else above.
  const vw = innerWidth, vh = innerHeight, M = 16;
  const W = Math.min(width, vw - 2 * M);
  panel.style.width = W + 'px';
  const H = panel.offsetHeight;
  const r = source.getBoundingClientRect();
  const left = clamp(r.left + r.width / 2 - W / 2, M, vw - M - W);
  let top = r.bottom + 12;
  if (top + H > vh - M) top = Math.max(M + 64, r.top - 12 - H);
  if (top + H > vh - M) top = Math.max(M, (vh - H) / 2);
  panel.style.left = left + 'px';
  panel.style.top = top + 'px';
  panel.style.transformOrigin = `${clamp(r.left + r.width / 2 - left, 0, W)}px ${clamp(r.top + r.height / 2 - top, 0, H)}px`;

  // Shape: the app's squircle, as a clip for the glass and a path for the rim.
  const pts = squirclePoints(0, 0, W, H, 56, 1.5);
  const d = 'M' + pts.map((p) => p[0].toFixed(2) + ' ' + p[1].toFixed(2)).join('L') + 'Z';
  const glass = layer.querySelector('.peek-glass');
  glass.style.clipPath = `path("${d}")`;
  glass.style.background = css(withAlpha(panelTone(dark), 0.62));
  const dpr = Math.min(devicePixelRatio || 1, 2.5);
  const rim = layer.querySelector('.peek-rim');
  rim.width = W * dpr; rim.height = H * dpr; rim.style.width = W + 'px'; rim.style.height = H + 'px';
  const rc = rim.getContext('2d'); rc.scale(dpr, dpr);
  const inset = (dark ? 0.8 : 1) / 2;
  paintRim(rc, squirclePoints(inset, inset, W - inset, H - inset, 56 - inset, 1.5), W / 2, H / 2, dark);
  // Outset shadow: drawn, then the panel's own silhouette punched out of it.
  const sh = layer.querySelector('.peek-shadow'), B = 40;
  sh.width = (W + 2 * B) * dpr; sh.height = (H + 2 * B) * dpr;
  Object.assign(sh.style, { width: W + 2 * B + 'px', height: H + 2 * B + 'px', left: -B + 'px', top: -B + 'px' });
  const sc = sh.getContext('2d'); sc.scale(dpr, dpr); sc.translate(B, B);
  const p2d = new Path2D(d);
  sc.save();
  sc.shadowColor = `rgba(0,0,0,${dark ? 0.22 : 0.06})`; sc.shadowBlur = 16 * dpr; sc.shadowOffsetY = 6 * dpr;
  sc.shadowOffsetX = 10000 * dpr; sc.translate(-10000, 0); sc.fill(p2d); sc.restore();
  sc.globalCompositeOperation = 'destination-out'; sc.fill(p2d);

  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  let raf;
  const run = (from, to, ms, done) => {
    cancelAnimationFrame(raf);
    const t0 = performance.now();
    const step = (now) => {
      const k = reduce ? 1 : clamp((now - t0) / ms, 0, 1);
      const t = from + (to - from) * k;
      const opening = to > from;
      const e = opening ? easeOutCubic(t) : 1 - easeInCubic(1 - t);
      panel.style.transform = `scale(${0.86 + 0.14 * e}, ${0.18 + 0.82 * e})`;
      panel.style.opacity = Math.min(1, e * 3);
      body.style.opacity = opening ? interval(t, 0.42, 1, Curves.easeOut) : interval(t, 0.6, 1);
      scrim.style.opacity = t;
      if (k < 1) raf = requestAnimationFrame(step);
      else done?.();
    };
    raf = requestAnimationFrame(step);
  };
  run(0, 1, 320);

  const close = () => {
    if (open?.layer !== layer) return;
    open = null;
    removeEventListener('keydown', onKey);
    run(1, 0, 200, () => layer.remove());
  };
  const onKey = (e) => { if (e.key === 'Escape') close(); };
  addEventListener('keydown', onKey);
  layer.addEventListener('click', (e) => {
    // Links inside a peek (the mobile menu) still work; everything else closes.
    if (!e.target.closest('a,button')) close();
  });
  open = { layer, close };
  return panel;
}
