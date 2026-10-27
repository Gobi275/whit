// Glass in the app's own shape: the SquircleBorder superellipse (bento.dart),
// filled with the nav bar's recipe — a thin tinted veil over a 22 px
// saturating blur (sigma 24 in Flutter; Impeller renders it at ~22) — and
// edged with paintGlassBorder's directional rim (bright at TL & BR).
//
// An element made glass gets three layers before its content:
//   .sq-shadow  canvas: an outset shadow, the shape punched out of it, so it
//               never clouds the glass from underneath
//   .sq-fill    the blur + veil, clipped to the squircle path
//   .sq-rim     canvas: the rim, segment by segment
// Content goes in a .sq-body child. Opacity lives on the layers (--o), never
// on the element, so the blur survives fades (see place() in story.js).
import { css, withAlpha } from './color.js';
import { themeFor } from './theme.js';
import { squirclePoints } from './bento.js';

const all = new Set();
const isDark = () => document.documentElement.dataset.theme !== 'light';
const toPath = (pts) => 'M' + pts.map((p) => p[0].toFixed(2) + ' ' + p[1].toFixed(2)).join('L') + 'Z';

export function glass(el, { radius = 44, shadow = 1, rim = true, inv = false, clipBody = false } = {}) {
  el.dataset.sq = '';
  el.classList.add('sq');
  el.insertAdjacentHTML('afterbegin', `${shadow ? '<canvas class="sq-shadow" aria-hidden="true"></canvas>' : ''}<i class="sq-fill"></i>${rim ? '<canvas class="sq-rim" aria-hidden="true"></canvas>' : ''}`);
  const o = { el, radius, shadow, inv, clipBody, sh: el.querySelector(':scope > .sq-shadow'), fill: el.querySelector(':scope > .sq-fill'), rim: el.querySelector(':scope > .sq-rim') };
  new ResizeObserver(() => paint(o)).observe(el);
  all.add(o);
  paint(o);
  return o;
}

/** Clip any element to the squircle (no glass) — the phone's screen. */
export function clip(el, radius) {
  const o = { el, radius, clipOnly: true };
  new ResizeObserver(() => paint(o)).observe(el);
  all.add(o);
  paint(o);
}

export function repaintGlass() { all.forEach(paint); }

function paint(o) {
  const W = o.el.offsetWidth, H = o.el.offsetHeight;
  if (!W || !H) return;
  const r = Math.min(typeof o.radius === 'function' ? o.radius(W, H) : o.radius, Math.min(W, H) / 2);
  const d = toPath(squirclePoints(0, 0, W, H, r, 1.5, { adaptive: true }));
  if (o.clipOnly) { o.el.style.clipPath = `path("${d}")`; return; }
  o.fill.style.clipPath = `path("${d}")`;
  // Content that must stay inside the shape (the compare bar) is clipped too.
  if (o.clipBody) { const b = o.el.querySelector(':scope > .sq-body'); if (b) b.style.clipPath = `path("${d}")`; }
  // Glass on an inverted ground takes the inverted theme's rim and shadow.
  const dark = o.inv ? !isDark() : isDark(), dpr = Math.min(devicePixelRatio || 1, 2);
  if (o.rim) {
    const cv = o.rim;
    cv.width = Math.round(W * dpr); cv.height = Math.round(H * dpr);
    cv.style.width = W + 'px'; cv.style.height = H + 'px';
    const ctx = cv.getContext('2d');
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    const inset = (dark ? 0.8 : 1) / 2;
    paintRim(ctx, squirclePoints(inset, inset, W - inset, H - inset, r - inset, 1.5, { adaptive: true }), W / 2, H / 2, dark);
  }
  if (o.sh) {
    const B = 70, cv = o.sh;
    cv.width = Math.round((W + 2 * B) * dpr); cv.height = Math.round((H + 2 * B) * dpr);
    Object.assign(cv.style, { width: W + 2 * B + 'px', height: H + 2 * B + 'px', left: -B + 'px', top: -B + 'px' });
    const ctx = cv.getContext('2d');
    ctx.setTransform(dpr, 0, 0, dpr, B * dpr, B * dpr);
    const p = new Path2D(d);
    ctx.save();
    ctx.shadowColor = dark ? `rgba(0,0,0,${0.42 * o.shadow})` : `rgba(74,40,26,${0.16 * o.shadow})`;
    ctx.shadowBlur = 40 * dpr; ctx.shadowOffsetY = 16 * dpr;
    ctx.shadowOffsetX = 10000 * dpr; ctx.translate(-10000, 0); ctx.fill(p);
    ctx.restore();
    ctx.globalCompositeOperation = 'destination-out'; ctx.fill(p);
  }
}

/** paintGlassBorder: alpha by angle around the centre, TL/BR peak, TR/BL dim. */
function paintRim(ctx, pts, cx, cy, dark) {
  const [peak, dim] = dark ? [0.5, 0.08] : [0.24, 0.04];
  const tint = themeFor(dark).veilTint;
  ctx.lineWidth = dark ? 0.8 : 1;
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
