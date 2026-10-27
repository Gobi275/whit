// Chapter 04: "sieh, was dir guttut." — the title alone first, then one glass
// card (the day peek's squircle) that shows three patterns one after another:
//   sleep    two living blobs: under 8 h vs 8 h and more
//   running  a NEW pattern: single whits (the whole range, awful → amazing)
//            fly in and become their days; the days you ran rise
//   weekday  the seven day-blobs morph, point by point, into bars
// Each context has its own glow: sleep blue, running orange, weekday green.
// The numbers are computed from the values below, so the three stay honest.
import { clamp, css, withAlpha, hex, lerp } from './color.js';
import { moodColor } from './theme.js';
import { blobPath, moodGradient, radiusAt, catmullRom } from './blob.js';
import { icon } from './glyphs.js';
import { track, place, seg, mix, Steps, Title } from './story.js';
import { isDark, glowTone } from './phone.js';
import { glass } from './squircle.js';

export const STEPS = 4;
const WEEK = [5.1, 4.7, 4.3, 5.2, 4.9, 5.7, 5.0];
const RAN = [0, 3, 5];
const SLEEP = { less: 4.5, more: 5.4 };
const avg = (a) => a.reduce((x, y) => x + y, 0) / a.length;
const RUN_DELTA = avg(RAN.map((i) => WEEK[i])) - avg(WEEK.filter((_, i) => !RAN.includes(i)));
const BEST = WEEK.indexOf(Math.max(...WEEK));
// The single whits of each day — the full range — averaging exactly to the day.
const DAY_WHITS = [[7, 4.3, 4.0], [2.0, 6.1, 6.0], [1.0, 5.4, 6.5], [6.8, 3.2, 5.6], [3.0, 6.7, 5.0], [7.0, 5.1, 5.0], [2.5, 6.0, 6.5]];
function rng(seed) { return () => ((seed = (seed * 1664525 + 1013904223) >>> 0) / 4294967296); }
const WHITS = (() => {
  const r = rng(9), out = [];
  DAY_WHITS.forEach((list, day) => list.forEach((m) => out.push({ day, m, x0: (r() - 0.5) * 0.9, y0: -0.34 + r() * 0.14, d: out.length * 0.012 })));
  return out;
})();
const GLOWS = ['#4898E0', '#E89838', '#48C868'].map((h) => glowTone(hex(h)));
const WORST = WEEK.indexOf(Math.min(...WEEK));

const xi = (i) => (i - 3) * 0.118;
const barH = (m) => 0.08 + (m - 3.8) * 0.13;
const PANEL = track([[0.45, { o: 0, s: 0.93, b: 16 }], [1.0, { o: 1, s: 1, b: 0 }]]);
const CHIPS = [0, 1, 2].map((k) => track([[k + 0.8, { o: 0, y: -0.3, b: 10, s: 0.9 }], [k + 1.1, { o: 1, y: -0.335, b: 0, s: 1 }], [k + 1.8, {}], [k + 2.05, { o: 0, y: -0.37, b: 10, s: 1.05 }]]));
const NUMS = [0, 1, 2].map((k) => track([[k + 0.85, { o: 0, y: -0.19, b: 8 }], [k + 1.15, { o: 1, y: -0.21, b: 0 }], [k + 1.8, {}], [k + 2.05, { o: 0, y: -0.24, b: 8 }]]));
const LABS = track([[0.95, { o: 0, y: 0.27 }], [1.25, { o: 1, y: 0.25 }], [1.75, {}], [1.95, { o: 0 }]]);
const DAYS = track([[2.3, { o: 0, y: 0.3 }], [2.6, { o: 1, y: 0.28 }]]);
const RANS = track([[2.55, { o: 0, y: -0.05 }], [2.8, { o: 1, y: -0.075 }], [2.85, {}], [3.05, { o: 0 }]]);
const BESTTAG = track([[3.2, { o: 0, y: -0.1, b: 6 }], [3.45, { o: 1, y: -0.125, b: 0 }]]);

export class Patterns {
  constructor(stage) { this.stage = stage; this.phase = 0; }

  build(L) {
    this.L = L;
    const f = (v, sign) => (sign && v > 0 ? '+' : '') + v.toFixed(1).replace('.', L.dec);
    this.fmt = (k, v) => f(v, k < 2);
    this.targets = [SLEEP.more - SLEEP.less, RUN_DELTA, WEEK[BEST]];
    this.stage.innerHTML = `
      <div class="st-viz"><div class="anchor">
        <div class="fl glow p-glow"></div>
        <div class="fl p-panel" data-sq><div class="sq-body"><canvas class="p-cv"></canvas></div></div>
        ${L.pFactors.map(([ic, n]) => `<div class="fl p-chip glass"><span class="p-chip-d">${icon(ic, 20)}</span><span>${n}</span></div>`).join('')}
        ${[0, 1, 2].map(() => '<div class="fl p-num"></div>').join('')}
        <div class="fl p-labs"><span class="pchip glass">${L.pLess}</span><span class="pchip glass">${L.pMore}</span></div>
        <div class="fl p-days">${L.days.map((d) => `<span>${d}</span>`).join('')}</div>
        <div class="fl p-rans">${WEEK.map((_, i) => `<span>${RAN.includes(i) ? icon('run', 26) : ''}</span>`).join('')}</div>
        ${[BEST, WORST].map((i, k) => `<div class="fl p-mark">${icon(k ? 'down' : 'up', 14)}<span>${WEEK[i].toFixed(1).replace('.', L.dec)}</span></div>`).join('')}
      </div></div>
      <div class="st-title t-a"></div>
      <div class="st-steps"></div>`;
    const q = (s) => this.stage.querySelector(s), qa = (s) => [...this.stage.querySelectorAll(s)];
    this.el = { panel: q('.p-panel'), cv: q('.p-cv'), chips: qa('.p-chip'), nums: qa('.p-num'), labs: q('.p-labs'), days: q('.p-days'), rans: q('.p-rans'), marks: qa('.p-mark'), glow: q('.p-glow') };
    glass(this.el.panel, { radius: (w, h) => Math.min(w, h) * 0.2, shadow: 1.2 });
    this.title = new Title(q('.t-a'), L.pH);
    this.steps = new Steps(q('.st-steps'), L.pSteps, { offsets: [1, 2, 3] });
  }

  update(s, { H: H0, mobile, dt, t, enter }) {
    const E = this.el, dark = isDark();
    // On a phone the card fills the width; its contents scale to the width, not the height.
    const H = mobile ? Math.min(H0, innerWidth * 0.95) : H0;
    if (this.lastH !== H) { this.stage.style.setProperty('--H', H.toFixed(1) + 'px'); this.lastH = H; }
    this.phase = (this.phase + dt / 9) % 1;
    this.title.update(Math.max(seg(enter, 0.35, 1), s > 0.01 ? 1 : 0), seg(s, 0.3, 0.75));
    const pv = PANEL(s);
    place(E.panel, pv, H, 1);
    E.chips.forEach((el, k) => place(el, CHIPS[k](s), H, 1));
    E.nums.forEach((el, k) => {
      // The week needs no headline number: its two extremes sit on their bars.
      const v = NUMS[k](s); if (k === 2) v.o = 0; place(el, v, H, 1);
      if (v.o > 0.01) el.textContent = this.fmt(k, this.targets[k] * seg(s, k + 0.9, k + 1.4));
    });
    place(E.labs, LABS(s), H, 1);
    place(E.days, DAYS(s), H, 1);
    place(E.rans, RANS(s), H, 1);
    [BEST, WORST].forEach((i, k) => {
      const v = BESTTAG(s); v.x = xi(i); v.y = 0.21 - barH(WEEK[i]) - 0.045 + (v.y + 0.125) * 0.5;
      place(E.marks[k], v, H, 1);
    });
    // The glow follows the context: blue → orange → green.
    const g = lerp(lerp(GLOWS[0], GLOWS[1], seg(s, 1.85, 2.2)), GLOWS[2], seg(s, 2.85, 3.2));
    E.glow.style.setProperty('--glow', css(g));
    place(E.glow, { x: 0, y: 0.02, s: 1, o: pv.o * 0.95, rx: 0, ry: 0, rz: 0, b: 0, z: 0 }, H, 1);
    if (pv.o > 0.01) this.paint(s, H, dark);
    this.steps.update(s);
  }

  paint(s, U, dark) {
    const cv = this.el.cv, w = cv.clientWidth, h = cv.clientHeight, dpr = Math.min(devicePixelRatio || 1, 2);
    if (!w || !h) return;
    if (cv.width !== Math.round(w * dpr) || cv.height !== Math.round(h * dpr)) { cv.width = Math.round(w * dpr); cv.height = Math.round(h * dpr); }
    const ctx = cv.getContext('2d');
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, w, h);
    ctx.translate(w / 2, h / 2);

    // 1 · sleep: two living blobs
    const k1 = seg(s, 0.9, 1.3) * (1 - seg(s, 1.85, 2.15));
    if (k1 > 0.01) {
      // Sizes closer together, calm waves (the energy of "ruhig").
      [[SLEEP.less, -0.2, 0.28], [SLEEP.more, 0.2, 0.32]].forEach(([m, x, d], i) => {
        const size = d * U * (0.6 + 0.4 * k1);
        this.blob(ctx, x * U, 0.04 * U + (0.3 - d) * U * 0.25, size, m, dark, k1, this.phase + i * 0.4, -1);
      });
    }

    // 2 · whits fly in and become their days
    const dayFill = WEEK.map(() => 0);
    WHITS.forEach((wt) => {
      const a = seg(s, 1.95 + wt.d, 2.1 + wt.d), m = seg(s, 2.1 + wt.d, 2.5 + wt.d);
      dayFill[wt.day] = Math.max(dayFill[wt.day], m);
      if (a < 0.01 || m > 0.99) return;
      const x = mix(wt.x0, xi(wt.day), m) * U, y = mix(wt.y0, 0.06, m) * U;
      const r = 0.018 * U * (1 - m * 0.4);
      this.shape(ctx, x, y, r * 2, r * 2, wt.m, dark, a * (1 - m * 0.6), 0, 0.5);
    });

    // days (resting blobs) → bars
    const lift = seg(s, 2.55, 2.85) * (1 - seg(s, 2.95, 3.15));
    WEEK.forEach((m, i) => {
      const born = dayFill[i];
      if (born < 0.01) return;
      const bar = seg(s, 3.0 + i * 0.025, 3.42 + i * 0.025);
      const ran = RAN.includes(i);
      const cd = (ran ? 0.1 : 0.085) * U * mix(1, ran ? 1 : 0.94, lift);
      const bw = mix(cd, 0.07 * U, bar), bh = mix(cd, barH(m) * U, bar);
      const cy = mix(0.06 * U - (ran ? 0.035 * U * lift : 0), 0.21 * U - bh / 2, bar);
      const alpha = born * (ran ? 1 : mix(1, 0.35, lift));
      this.shape(ctx, xi(i) * U, cy, bw * (0.5 + 0.5 * born), bh * (0.5 + 0.5 * born), m, dark, alpha, 1 - bar, 1);
    });
  }

  /** A real, living blob with a soft glow of its own colour. */
  blob(ctx, x, y, d, m, dark, a, phase, en) {
    const c = moodColor(m, dark);
    const { path, r0 } = blobPath(d, m, { time: phase, energy: en });
    ctx.save();
    ctx.globalAlpha = a;
    ctx.translate(x - d / 2, y - d / 2);
    ctx.save();
    ctx.shadowColor = css(withAlpha(c, dark ? 0.55 : 0.42));
    ctx.shadowBlur = d * 0.45; ctx.shadowOffsetY = d * 0.06;
    ctx.fillStyle = css(c); ctx.fill(path);
    ctx.restore();
    ctx.fillStyle = moodGradient(ctx, c, d / 2, d / 2, r0);
    ctx.fill(path);
    ctx.restore();
  }

  /**
   * A day's shape: blobbiness 1 = its resting mood blob, 0 = a capsule of
   * w × h. In between, every outline point slides from the blob to the
   * capsule along its own angle, so the drop really becomes the bar.
   */
  shape(ctx, x, y, w, h, m, dark, a, blobbiness, glow) {
    if (a < 0.005 || w < 0.5) return;
    const c = moodColor(clamp(m, 1, 7), dark);
    const N = 96, pts = [];
    const r0 = Math.min(w, h) / 2;
    let peak = 0;
    for (let i = 0; i < N; i++) peak = Math.max(peak, radiusAt((i / N) * Math.PI * 2, m));
    const ha = w / 2, hb = h / 2;
    for (let i = 0; i < N; i++) {
      const th = (i / N) * Math.PI * 2, co = Math.cos(th), si = Math.sin(th);
      const rb = (radiusAt(th, m) / peak) * r0;
      const rc = capsule(co, si, ha, hb);
      const r = mix(rc, rb, blobbiness);
      pts.push([x + co * r, y + si * r]);
    }
    // Fully a bar: draw the true capsule, never a spline's approximation of one.
    let path;
    if (blobbiness < 0.02) { path = new Path2D(); path.roundRect(x - w / 2, y - h / 2, w, h, Math.min(w, h) / 2); }
    else path = catmullRom(pts);
    ctx.save();
    ctx.globalAlpha = a;
    const g = ctx.createLinearGradient(x - w / 2, y - h / 2, x + w / 2, y + h / 2);
    g.addColorStop(0, css(c)); g.addColorStop(1, css(moodColor(clamp(m + 0.6, 1, 7), dark)));
    ctx.shadowColor = css(withAlpha(c, (dark ? 0.5 : 0.4) * glow));
    ctx.shadowBlur = Math.max(w, 10) * 0.7; ctx.shadowOffsetY = w * 0.12;
    ctx.fillStyle = g;
    ctx.fill(path);
    ctx.restore();
  }
}

/** Distance from the centre to a capsule's outline along (co, si). */
function capsule(co, si, a, b) {
  if (b < a) { [a, b] = [b, a]; [co, si] = [si, co]; }
  const k = b - a, ac = Math.abs(co), as = Math.abs(si);
  if (ac > 1e-6) {
    const t = a / ac;
    if (t * as <= k) return t;
  }
  const kk = k, sk = as * kk;
  return sk + Math.sqrt(Math.max(0, sk * sk - kk * kk + a * a));
}
