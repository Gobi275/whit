// The showcase phone. ONE transform container: the glass body, the screen and
// an overlay layer are all its children, so anything sitting on the screen
// shares the phone's perspective exactly — it can only ever move WITH it.
//   .ph-body    glass squircle (the nav bar's recipe), the device's frame
//   .ph-screen  the app ground, clipped to a squircle; pages slide inside it
//   .ph-over    pieces that may leave the screen (the habits); same transform
//
// The screen is laid out in APP PIXELS: --p is one logical pixel of a
// 360-wide phone, so every size below is the app's own number (checkin_modal,
// mood_field, context_step) and the mockup scales as one piece.
import { clamp, css, withAlpha } from './color.js';
import { moodColor, themeFor } from './theme.js';
import { blobPath, moodGradient, drawRadialHalo } from './blob.js';
import { icon, batterySvg } from './glyphs.js';
import { glass, clip } from './squircle.js';

/** Proportions in H (phone height) units. */
export const PH = { w: 0.47, inset: 0.016 };
export const screenW = PH.w - 2 * PH.inset;          // 0.438 H = 360 app px
export const screenH = 1 - 2 * PH.inset;
export const APX = screenW / 360;                    // one app px in H units
/** Anchor-space y (H units) of an app-px y on the screen. */
export const appY = (y) => -0.5 + PH.inset + y * APX;
export const screenY = (f) => -0.5 + PH.inset + f * screenH;
export const isDark = () => document.documentElement.dataset.theme !== 'light';

export function phoneHTML(cls, pages, over = '') {
  return `<div class="fl phone ${cls}" data-sq>
    <div class="ph-body"></div>
    <div class="ph-screen"><i class="ph-island"></i><div class="ph-pages">${pages.map((p) => `<div class="ph-page">${p}</div>`).join('')}</div></div>
    <div class="ph-over">${over}</div>
  </div>`;
}

/** Turns the markup into glass + squircle clips; call once per build. */
export function initPhone(el) {
  glass(el.querySelector('.ph-body'), { radius: (w) => w * 0.17, shadow: 1.2 });
  clip(el.querySelector('.ph-screen'), (w) => w * 0.15);
}

const bars = (lv) => `<span class="bars">${[0, 1, 2].map((k) => `<i class="${k < lv ? 'f' : ''}" style="height:${[44, 72, 100][k]}%"></i>`).join('')}</span>`;
const battery = (lv) => batterySvg(lv, 26, 'currentColor');

/** The step top bar: a glass circle each side, the 132 × 8 progress between. */
const topBar = (left, frac) => `<div class="ph-top">
  <span class="ph-gc">${icon(left, 20)}</span>
  <i class="ph-prog"><i style="width:${frac * 100}%"></i></i>
  <span class="ph-gc">${icon('close', 20)}</span></div>`;

/** The continue affordance: a double chevron and "next", pulled, not pressed. */
const cont = (L) => `<div class="ph-cont">${icon('double_up', 28)}<span>${L.next}</span></div>`;

/** Page 1 — mood: greeting, MoodField (drop, word, valence, energy). */
export function moodPage(L) {
  return `<div class="pg pm">${topBar('info', 0.25)}
    <div class="pg-title">${L.greeting}</div>
    <div class="z pm-blobw"><canvas class="pm-blob"></canvas></div>
    <div class="z pm-word"><span></span></div>
    <div class="pm-slider"><i class="rail"></i><i class="fill"></i><i class="knob"></i></div>
    <div class="z pm-energy">${[1, 2, 3].map((l) => `<b>${battery(l)}</b>`).join('')}</div>
    ${cont(L)}</div>`;
}

/** Page 2 — context: sleep in the morning, activity in the evening. */
export function contextPage(L) {
  const variant = (key, title, labels, qTitle) => `
    <div class="pc-v" data-v="${key}">
      <div class="pg-title">${title}</div>
      <div class="pc-track"><i class="pc-line"></i>
        ${labels.map((l, i) => `<span class="pc-l ${i % 2 ? 'r' : ''}" data-i="${i}" style="--i:${i}">${l}</span>`).join('')}
        <i class="pc-knob">${icon('updown', 28)}</i></div>
      <div class="pc-qt">${qTitle}</div>
      <div class="pc-q">${[1, 2, 3].map((l) => `<b>${bars(l)}</b>`).join('')}</div>
    </div>`;
  return `<div class="pg pc">${topBar('back', 0.5)}
    ${variant('m', L.sleepPrompt, L.sleepL, L.qualityTitle)}
    ${variant('e', L.activityPrompt, L.actL, L.intensity)}
    ${cont(L)}</div>`;
}

/** Page 3 — tags, grouped; below: note circle · finish pill · the ⊕. */
export function tagsPage(L) {
  let k = 0;
  return `<div class="pg pt">${topBar('back', 0.75)}
    <div class="pg-title">${L.tagsPrompt}</div>
    <div class="pt-groups">${L.tagGroups.map(([h, tags]) => `
      <div class="z pt-g"><div class="pt-h">${h}</div><div class="pt-wrap">${tags.map(([ic, n]) => `<span class="pt-pill" data-k="${k++}">${icon(ic, 20)}${n}</span>`).join('')}</div></div>`).join('')}
    </div>
    <div class="pt-actions"><span class="pt-note">${icon('edit', 28)}</span><span class="pt-done">${icon('check', 20)}${L.finish}</span><span class="pt-fab">${icon('plus', 28)}</span></div>
  </div>`;
}

/** The note popup, in the phone's overlay layer so it can overhang both edges. */
export function notePop(L) {
  return `<div class="fl pt-pop" data-sq><div class="sq-body"><div class="pp-h">${L.noteTitle}</div><p class="pp-t"><span></span><i class="caret"></i></p></div></div>`;
}

export function savedPage(L) {
  return `<div class="pg ps"><span class="ps-check">${icon('check', 28)}</span><div class="ps-t">${L.saved}</div></div>`;
}

/** The drop, drawn with its halo; lift adds a mood-tinted drop shadow. */
export function paintBlob(cv, { val, en, phase, lift = 0, halo = true, fill = 0.62 }) {
  const w = cv.clientWidth, h = cv.clientHeight, dpr = Math.min(devicePixelRatio || 1, 2);
  if (!w || !h) return;
  if (cv.width !== Math.round(w * dpr) || cv.height !== Math.round(h * dpr)) { cv.width = Math.round(w * dpr); cv.height = Math.round(h * dpr); }
  const ctx = cv.getContext('2d');
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  ctx.clearRect(0, 0, w, h);
  const dark = isDark(), score = 1 + val * 6, c = moodColor(score, dark), d = w * fill;
  // The halo stays inside its canvas: clipped by the box it reads as a square.
  if (halo) drawRadialHalo(ctx, w / 2, h / 2, Math.min(d * 1.15, w * 0.49), glowTone(c), dark ? 0.24 : 0.28);
  const { path, r0 } = blobPath(d, score, { time: phase, energy: en });
  ctx.save();
  ctx.translate((w - d) / 2, (h - d) / 2);
  if (lift > 0.01) {
    ctx.save();
    ctx.shadowColor = css(withAlpha(c, (dark ? 0.55 : 0.45) * lift));
    ctx.shadowBlur = d * 0.3 * dpr; ctx.shadowOffsetY = d * 0.1 * lift * dpr;
    ctx.fillStyle = css(c); ctx.fill(path);
    ctx.restore();
  }
  ctx.fillStyle = moodGradient(ctx, c, d / 2, d / 2, r0);
  ctx.fill(path);
  ctx.restore();
}

/** A resting blob (no motion) as an image: the small, honest version. */
export function blobImg(score, energy = 0, size = 48, dark = isDark()) {
  const c = document.createElement('canvas'), dpr = 2;
  c.width = c.height = size * dpr;
  const x = c.getContext('2d');
  x.scale(dpr, dpr);
  const col = moodColor(score, dark);
  const { path, r0 } = blobPath(size, score, { energy, fit: true });
  x.fillStyle = moodGradient(x, col, size / 2, size / 2, r0);
  x.fill(path);
  return c.toDataURL();
}

/** Glow tone: blues lean violet and calm down (a saturated sky-blue glow
 *  reads as a screen, not as light). Other hues pass through. */
export function glowTone(c) {
  const r = c.r / 255, g = c.g / 255, b = c.b / 255, mx = Math.max(r, g, b), mn = Math.min(r, g, b), d = mx - mn;
  let h = 0;
  if (d) h = mx === r ? 60 * (((g - b) / d) % 6) : mx === g ? 60 * ((b - r) / d + 2) : 60 * ((r - g) / d + 4);
  if (h < 0) h += 360;
  if (h < 185 || h > 250) return c;
  const k = 1 - Math.abs(h - 217) / 33;          // strongest for pure blue
  const t = Math.max(0, k);
  const tgt = { r: 112, g: 100, b: 196 };        // a calm violet
  return { r: c.r + (tgt.r - c.r) * (0.75 * t), g: c.g + (tgt.g - c.g) * (0.75 * t), b: c.b + (tgt.b - c.b) * (0.75 * t), a: c.a ?? 1 };
}

export { bars, battery, themeFor, clamp };
