// Chapters 01–03 as ONE pinned scene, so a single whit travels through it.
//   0      title  "wie geht's dir gerade?"
//   1–3    the real check-in on the phone. The drop morphs from the moment it
//          appears (scroll = the slider); beside the phone, glass bentos
//          teach what you're looking at: seven steps, three energies, one
//          word per mix. Parts zoom gently in their own place.
//   4      title  "und drumherum?"  (the phone waits, blurred, behind it)
//   5–7    context (sleep in the morning ↔ activity in the evening, switching
//          on its own, with a big glowing sun / moon beside the phone), the
//          tags page, the note as a squircle popup
//   8      title  "nur du kannst es lesen."
//   9–11   the finished whit becomes a glass card below a huge "E2E"; a
//          glowing bar seals it; then the pointer's x moves the bar
//   12     out
import { clamp, css, withAlpha } from './color.js';
import { moodColor } from './theme.js';
import { icon, batterySvg } from './glyphs.js';
import { track, place, seg, mix, lin, Steps, Title } from './story.js';
import { phoneHTML, initPhone, moodPage, contextPage, tagsPage, savedPage, notePop, paintBlob, blobImg, glowTone, isDark } from './phone.js';
import { glass } from './squircle.js';

const B64 = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
const rnd = (n, set = B64) => Array.from({ length: n }, () => set[(Math.random() * set.length) | 0]).join('');
const noise = (src) => src.replace(/[^\s·]/g, () => B64[(Math.random() * 62) | 0]);

export const STEPS = 13;
const CAP_AT = [1, 2, 3, 5, 6, 7, 9, 10, 11];
const CAP_GROUP = [0, 0, 0, 1, 1, 1, 2, 2, 2];

// ── Tracks ────────────────────────────────────────────────────────────────
const DIM = { s: 0.94, b: 10, o: 0.32 };
const PHONE = track([
  [0.45, { o: 0, s: 0.92, b: 16 }], [1.0, { o: 1, s: 1, b: 0 }],
  [4.0, {}], [4.3, DIM], [4.65, {}], [5.0, { s: 1, b: 0, o: 1 }],
  [8.15, {}], [8.45, DIM], [9.0, {}], [9.45, { o: 0, s: 0.86, b: 18 }],
]);
const zoom = (a, b, c, d, k = 1.1) => track([[a, { s: 1, z: 0 }], [b, { s: k, z: 1 }], [c, {}], [d, { s: 1, z: 0 }]]);
const Z_BLOB = zoom(1.05, 1.4, 1.8, 2.1, 1.08);
const Z_ENERGY = zoom(2.05, 2.35, 2.8, 3.05, 1.12);
const Z_WORD = zoom(3.05, 3.35, 3.75, 4.0, 1.18);
const Z_GROUP = [0, 1, 2].map((i) => zoom(6.12 + i * 0.28, 6.27 + i * 0.28, 6.38 + i * 0.28, 6.5 + i * 0.28, 1.06));
// The note popup grows out of the note button and overhangs the phone on both sides.
const POP_IN = { x: -0.13, y: 0.36, s: 0.12, o: 0 };
const POP = track([[7.05, POP_IN], [7.32, { x: 0, y: 0.13, s: 1, o: 1, z: 1 }], [7.62, {}], [7.8, { ...POP_IN, z: 0 }]]);
// Explainer bentos beside the phone (wide screens): in from a blur, out to one.
// …standing a little over the phone's edge, so their glass has something to blur.
const side = (a, b) => track([[a - 0.1, { x: 0.32, o: 0, b: 12, s: 0.96 }], [a + 0.25, { x: 0.36, o: 1, b: 0, s: 1, z: 1 }], [b - 0.25, {}], [b + 0.05, { x: 0.4, o: 0, b: 12, s: 0.98 }]]);
const EX = [side(1.0, 2.0), side(2.0, 3.0), side(3.0, 4.0)];
const DAY = [0, 1].map((i) => track([[4.9 + i * 0.06, { x: 0.42, y: (i ? 0.11 : -0.11), o: 0, b: 12, s: 0.85 }, { x: (i ? 0.12 : -0.12), y: 0.47, s: 0.62 }],
  [5.2 + i * 0.06, { o: 1, b: 0, s: 1, z: 1 }], [5.75, {}], [6.05, { o: 0, b: 12, s: 0.9 }]]));
// Centred first; it slides down as "E2E" rises behind it.
const CARD = track([[8.95, { s: 0.4, o: 0, y: 0 }], [9.45, { s: 1, o: 1, z: 1, y: 0 }], [9.6, {}], [10.1, { y: 0.17 }], [11.9, {}], [12.5, { s: 0.9, o: 0, b: 10 }]]);
const E2E = track([[9.55, { o: 0, s: 0.9, b: 24, y: -0.13 }], [10.1, { o: 1, s: 1, b: 0 }], [12.15, {}], [12.7, { o: 0, s: 1.05, b: 18 }]]);
const HINT = track([[11.05, { o: 0, y: 0.5 }], [11.3, { o: 1, y: 0.47 }], [11.85, {}], [12.0, { o: 0 }]]);
const GLOW = track([[0.5, { o: 0, s: 0.8 }], [1.0, { o: 1, s: 1 }], [4.0, {}], [4.3, { o: 0.4 }], [4.7, {}], [5.0, { o: 1 }],
  [8.0, {}], [8.3, { o: 0.4 }], [9.0, {}], [9.5, { o: 1, s: 1.2, y: 0.05 }], [12.2, {}], [12.7, { o: 0 }]]);

export class Journey {
  constructor(stage) {
    this.stage = stage; this.phase = 0; this.cmp = 1; this.mx = null;
    addEventListener('pointermove', (e) => { this.mx = e.clientX; }, { passive: true });
  }

  build(L, words) {
    this.L = L; this.words = words;
    const flat = L.tagGroups.flatMap((g) => g[1]);
    const tags = L.tagOn.map((k) => flat[k]);
    const dark = isDark();
    // The sealed card keeps the plain card's layout: same rows, same sizes —
    // the drop becomes a lock, every readable thing becomes noise, and only
    // the two fields the server needs (a random id, a timestamp) stay clear.
    this.idTxt = (crypto.randomUUID ? crypto.randomUUID() : rnd(32, '0123456789abcdef')).slice(0, 18);
    this.stage.innerHTML = `
      <div class="st-viz"><div class="anchor">
        <div class="fl bigword j-e2e"><span>E2E</span></div>
        <div class="fl glow j-glow"></div>
        ${phoneHTML('j-phone', [moodPage(L), contextPage(L), tagsPage(L), savedPage(L)], notePop(L))}
        <div class="fl j-ex" data-sq><div class="sq-body">
          <div class="ex-h">${L.exMood}</div>
          <div class="ex-dots">${[1, 2, 3, 4, 5, 6, 7].map((m) => `<img alt="" data-m="${m}" src="${blobImg(m, -1, 40, dark)}">`).join('')}</div>
          <div class="ex-ends"><span>${words[0][0]}</span><span>${words[0][6]}</span></div>
        </div></div>
        <div class="fl j-ex" data-sq><div class="sq-body">
          <div class="ex-h">${L.exEnergy}</div>
          ${L.energyL.map((n, i) => `<div class="ex-row" data-i="${i}"><span class="ex-disc">${batterySvg(i + 1, 22, 'currentColor')}</span><span>${n}</span></div>`).join('')}
        </div></div>
        <div class="fl j-ex" data-sq><div class="sq-body">
          <div class="ex-h">${L.exWord}</div>
          ${[-1, 0, 1].map((e, i) => `<div class="ex-row" data-i="${i}"><span class="ex-disc">${batterySvg(i + 1, 22, 'currentColor')}</span><span class="ex-w">${words[e][5]}</span></div>`).join('')}
        </div></div>
        <div class="fl j-day" data-d="0"><span class="jd-disc">${icon('sun', 40)}</span><span class="jd-l">${L.morning}</span></div>
        <div class="fl j-day" data-d="1"><span class="jd-disc">${icon('moon', 40)}</span><span class="jd-l">${L.eveningL}</span></div>
        <div class="fl j-card" data-sq><div class="sq-body">
          <div class="cd-plain">
            <div class="cd-top">${icon('clock', 15)}<span>21:55</span></div>
            <div class="cd-main"><canvas class="cd-blob"></canvas><div><div class="cd-word">${words[-1][5]}</div>
              <div class="cd-ctx">${icon('walk', 14)}<span>${L.actL[2]}</span></div></div></div>
            <div class="cd-tags">${tags.map(([ic, n]) => `<span class="pchip">${icon(ic, 14)}${n}</span>`).join('')}</div>
            <p class="cd-note">${L.note}</p>
          </div>
          <div class="cd-plain cd-cipher" aria-hidden="true">
            <div class="cd-top">${icon('lock', 15)}<span class="clear">id ${this.idTxt}</span><span class="clear cd-ts">1786313700412</span></div>
            <div class="cd-main"><span class="cd-lockd">${icon('lock', 22)}</span><div><div class="cd-word" data-c>${words[-1][5]}</div>
              <div class="cd-ctx">${icon('lock', 14)}<span data-c>${L.actL[2]}</span></div></div></div>
            <div class="cd-tags">${tags.map(([, n]) => `<span class="pchip"><span data-c>${n}</span></span>`).join('')}</div>
            <p class="cd-note" data-c>${L.note}</p>
          </div>
          <i class="cd-bar"></i>
          <span class="cd-lock">${icon('lock', 16)}</span>
        </div></div>
        <div class="fl j-hint glass">${icon('swipe', 16)}<span>${matchMedia('(hover: hover) and (pointer: fine)').matches ? L.compareHint : L.compareHintTouch}</span></div>
      </div></div>
      <div class="st-title t-a"></div><div class="st-title t-b"></div><div class="st-title t-c"></div>
      <div class="st-steps"></div>`;
    const q = (s) => this.stage.querySelector(s), qa = (s) => [...this.stage.querySelectorAll(s)];
    this.el = {
      phone: q('.j-phone'), pages: q('.ph-pages'), blob: q('.pm-blob'), blobW: q('.pm-blobw'), word: q('.pm-word span'), wordW: q('.pm-word'),
      slider: q('.pm-slider'), energy: q('.pm-energy'), en: qa('.pm-energy b'),
      ctxV: qa('.pc-v'), groups: qa('.pt-g'), pills: qa('.pt-pill'), note: q('.pt-note'), pop: q('.pt-pop'), popT: q('.pp-t span'),
      ex: qa('.j-ex'), exDots: qa('.ex-dots img'), exRows: qa('.j-ex .ex-row'), day: qa('.j-day'),
      card: q('.j-card'), cardBlob: q('.cd-blob'), e2e: q('.j-e2e'), hint: q('.j-hint'), glow: q('.j-glow'),
    };
    initPhone(this.el.phone);
    const sq = (w) => w * 0.165;   // the day peek's proportion: radius 56 on a ~340 panel
    glass(this.el.card, { radius: sq, shadow: 1.2, clipBody: true });
    glass(this.el.pop, { radius: sq, shadow: 0.8 });
    this.el.ex.forEach((e) => glass(e, { radius: sq, shadow: 1 }));
    this.titles = [new Title(q('.t-a'), L.jA), new Title(q('.t-b'), L.jB), new Title(q('.t-c'), L.jC)];
    this.steps = new Steps(q('.st-steps'), L.steps, { offsets: CAP_AT, groups: CAP_GROUP });
    // Pointer on the card (touch): the bar follows the finger.
    this.el.card.addEventListener('pointerdown', (e) => { this.mx = e.clientX; });
    this.el.card.addEventListener('pointermove', (e) => { if (e.pointerType !== 'mouse') this.mx = e.clientX; });
    this.cipher = qa('.cd-cipher [data-c]').map((el) => ({ el, src: el.textContent, stamp: null }));
    this.lastWord = '';
    this.lastBar = 1;
  }

  mood(s) {
    // Moving from the moment the phone appears, so the drop is visibly alive.
    const val = mix(2 / 6, 5 / 6, seg(s, 0.55, 1.9, lin));
    const en = s < 2.5 ? mix(0, 1, seg(s, 2.1, 2.45)) : mix(1, -1, seg(s, 2.5, 2.9));
    return { val: clamp(val, 0, 1), en };
  }

  update(s, { H, mobile, dt, t, enter, px = 0, py = 0 }) {
    const E = this.el, L = this.L, dark = isDark();
    this.phase = (this.phase + dt / 7) % 1;
    const { val, en } = this.mood(s);
    const score = 1 + val * 6;
    const mc = moodColor(s > 8.5 ? 6 : score, dark);
    this.stage.style.setProperty('--mood', css(mc));
    this.stage.style.setProperty('--glow', css(glowTone(mc)));

    this.titles[0].update(Math.max(seg(enter, 0.35, 1), s > 0.01 ? 1 : 0), seg(s, 0.3, 0.75));
    this.titles[1].update(seg(s, 4.05, 4.4), seg(s, 4.6, 4.95));
    this.titles[2].update(seg(s, 8.2, 8.5), seg(s, 8.68, 9.0));

    // Phone: frontal, a soft lean toward the pointer, a slow float
    const pv = PHONE(s, mobile);
    pv.ry += px * 6; pv.rx += -py * 4; pv.y += Math.sin(t * 1.1) * 0.004;
    place(E.phone, pv, H, 1);
    const page = seg(s, 4.4, 4.75) + seg(s, 5.9, 6.2) + seg(s, 7.82, 8.05);
    E.pages.style.transform = `translateY(${(-page * 100).toFixed(2)}%)`;

    // Mood page
    const act = Math.round(clamp(en, -1, 1)) + 1;
    if (page < 0.99 && pv.o > 0.01) {
      const zb = Z_BLOB(s);
      zoomEl(E.blobW, zb);
      paintBlob(E.blob, { val, en, phase: this.phase, lift: zb.z, fill: 0.44 });
      E.slider.style.setProperty('--v', val.toFixed(4));
      zoomEl(E.energy, Z_ENERGY(s));
      E.en.forEach((b, i) => b.classList.toggle('on', i === act));
      zoomEl(E.wordW, Z_WORD(s));
      const w = this.words[Math.round(clamp(en, -1, 1))][clamp(Math.round(score), 1, 7) - 1];
      if (w !== this.lastWord) { this.lastWord = w; swap(E.word, w); }
    }

    // Explainers beside the phone
    E.ex.forEach((el, i) => { const v = EX[i](s, mobile); v.y += Math.sin(t * 1.2 + i) * 0.005; place(el, v, H, 1); });
    const sc = clamp(Math.round(score), 1, 7);
    E.exDots.forEach((d, i) => d.classList.toggle('on', i + 1 === sc));
    E.exRows.forEach((r) => r.classList.toggle('on', +r.dataset.i === act));

    // Context: the morning half of the step asks about sleep, the evening half about movement.
    const evening = s > 5.5;
    const k = ((s - (evening ? 5.5 : 5.0)) / 0.5);
    E.ctxV.forEach((v, i) => {
      v.classList.toggle('on', i === (evening ? 1 : 0));
      const lv = i === 0 ? (k > 0.35 ? 4 : 3) : (k > 0.35 ? 3 : 2);
      v.style.setProperty('--lv', lv);
      v.querySelectorAll('.pc-l').forEach((l, j) => (l.dataset.d = Math.min(2, Math.abs(j + 1 - lv))));
      v.querySelectorAll('.pc-q b').forEach((b, j) => b.classList.toggle('on', j === (i === 0 ? 2 : 1)));
    });
    E.day.forEach((el, i) => { place(el, DAY[i](s, mobile), H, 1); el.classList.toggle('on', i === (evening ? 1 : 0)); });
    if (s > 4.9 && s < 6.05) {
      const [et, ep] = evening ? L.evening : L.steps[3];
      this.steps.set(3, et, ep);
    }

    // Tags + note
    E.groups.forEach((g, i) => zoomEl(g, Z_GROUP[i](s)));
    E.pills.forEach((p) => {
      const at = L.tagOn.indexOf(+p.dataset.k);
      p.classList.toggle('on', at >= 0 && s > 6.3 + at * 0.28);
    });
    const pop = POP(s);
    place(E.pop, pop, H, 1);
    E.note.classList.toggle('on', pop.o > 0.5);
    E.popT.textContent = L.note.slice(0, Math.round(L.note.length * seg(s, 7.3, 7.58, lin)));

    // The card: saved → sealed → compare
    const cv = CARD(s, mobile); cv.y += Math.sin(t * 1.2 + 1) * 0.005; place(E.card, cv, H, 1);
    if (cv.o > 0.01) paintBlob(E.cardBlob, { val: 5 / 6, en: -1, phase: this.phase, halo: false, fill: 0.86 });
    const sweep = seg(s, 10.2, 10.85);
    const live = s > 10.95 && s < 11.95;
    let bar = sweep, barA = sweep > 0.003 && sweep < 0.997 ? 1 : 0;
    if (live && this.mx != null) {
      // The pointer's ABSOLUTE x drives the bar, so it never snaps back at
      // the card's edge: left of the card everything is readable, right of
      // it everything is sealed, and the bar fades out as it nears an edge.
      const r = E.card.getBoundingClientRect();
      const f = (this.mx - r.left) / r.width;
      bar = this.cmp + (clamp(f, 0, 1) - this.cmp) * 0.2;
      barA = clamp(Math.min(f, 1 - f) * 12, 0, 1);
    }
    this.cmp = bar;
    E.card.style.setProperty('--bar', bar.toFixed(4));
    E.card.style.setProperty('--bar-a', barA.toFixed(3));
    E.card.classList.toggle('sealed', sweep > 0.995);
    E.card.classList.toggle('cloud', live);
    if (cv.o > 0.01) this.scramble(bar, t);
    place(E.e2e, E2E(s, mobile), H, 1);
    const hv = HINT(s, mobile); place(E.hint, hv, H, 1);
    E.hint.classList.toggle('in', hv.o > 0.5);
    place(E.glow, GLOW(s, mobile), H, 1);
    this.steps.update(s);
  }

  /** Characters the bar has just passed keep re-rolling for a while, fading
   *  out over 1.4 s, so the sealing stays visible behind the moving bar. */
  scramble(bar, t) {
    const card = this.el.card, W = card.offsetWidth;
    if (!W) return;
    const cl = card.getBoundingClientRect().left;
    const scale = card.getBoundingClientRect().width / W || 1;
    const bx = bar * W;
    const prev = this.lastBar * W;
    for (const c of this.cipher) {
      if (!c.x) {
        const r = c.el.getBoundingClientRect();
        c.x = (r.left - cl) / scale; c.w = r.width / scale;
        c.stamp = new Float64Array(c.src.length).fill(-9);
      }
      const n = c.src.length, cw = c.w / Math.max(1, n);
      let out = '', changed = false;
      for (let i = 0; i < n; i++) {
        const x = c.x + i * cw;
        if ((x < bx && x >= prev - cw) || (x >= bx && x < prev + cw)) c.stamp[i] = t;
        const age = t - c.stamp[i];
        const ch = c.src[i];
        if (ch !== ' ' && age < 1.4 && Math.random() < 1 - age / 1.4) { out += B64[(Math.random() * 62) | 0]; changed = true; }
        else out += c.base ? c.base[i] : ch;
      }
      if (!c.base) c.base = noise(c.src);
      c.el.textContent = changed ? out : c.base;
    }
    this.lastBar = bar;
  }

  relayout() { this.cipher?.forEach((c) => (c.x = 0)); }

  /** Theme flipped: the resting blobs are images, redraw them. */
  retheme() {
    const dark = isDark();
    this.el?.exDots.forEach((im) => (im.src = blobImg(+im.dataset.m, -1, 40, dark)));
  }
}

function zoomEl(el, v) {
  el.style.transform = `scale(${v.s.toFixed(4)})`;
  el.style.setProperty('--lift', v.z.toFixed(3));
}

function swap(el, txt) {
  el.textContent = txt;
  el.classList.remove('swap'); void el.offsetWidth; el.classList.add('swap');
}

export { withAlpha };
