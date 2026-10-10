// Chapter 06: the page turns over. A pill grows until it IS the screen: the
// theme inverts for as long as this chapter is pinned (warm paper in dark
// mode, the cool violet ground in light mode), and shrinks back to a pill as
// it leaves. Three statements arrive one by one as big, centred type, each
// half-covered by a glass squircle card (bold disc, small heading, one line)
// that drifts up softly and continuously. Three discs below keep count; the
// active one is bold-inverted and glows.
import { clamp } from './color.js';
import { icon } from './glyphs.js';
import { track, place, seg, easeIO } from './story.js';
import { glass } from './squircle.js';

export const STEPS = 3;
const WORDS = [0, 1, 2].map((k) => track([
  [k - 0.25, { y: 0.06, o: 0, b: 16, s: 0.97 }], [k + 0.12, { y: 0, o: 1, b: 0, s: 1 }], [k + 0.75, {}], [k + 1.02, { y: -0.05, o: 0, b: 16, s: 1.04 }],
]));

export class Free {
  constructor(stage) { this.stage = stage; this.k = 0; }

  build(L) {
    this.L = L;
    this.stage.innerHTML = `
      <div class="f-panel inv-ground">
        <div class="f-grid"></div>
        <div class="f-anchor">
          ${L.fSteps.map(([w]) => `<div class="fl f-word">${w}</div>`).join('')}
          ${L.fSteps.map(([, p, ic, h]) => `<div class="fl f-card" data-sq><div class="sq-body">
            <span class="f-disc">${icon(ic, 22)}</span><div><div class="f-h">${h}</div><p>${p}</p></div></div></div>`).join('')}
        </div>
        <div class="f-dots">${L.fSteps.map(([, , ic]) => `<span class="f-dot glass">${icon(ic, 18)}</span>`).join('')}</div>
      </div>`;
    const qa = (s) => [...this.stage.querySelectorAll(s)];
    this.el = { panel: this.stage.querySelector('.f-panel'), words: qa('.f-word'), cards: qa('.f-card'), dots: qa('.f-dot') };
    this.el.cards.forEach((c) => glass(c, { radius: (w, h) => Math.min(w * 0.165, h / 2), inv: true }));
  }

  /** How much of the screen the inverted panel covers (0..1). */
  get cover() { return this.k; }

  update(s, { H, mobile, t, enter, leave }) {
    const E = this.el;
    // A pill (h/2 radius) that grows into the full screen, and back.
    const k = clamp(seg(enter, 0.35, 1) * (1 - seg(leave, 0, 0.6)), 0, 1);
    this.k = k;
    const vw = innerWidth, vh = innerHeight;
    const pw = Math.min(vw * 0.6, 460), ph = 120;
    const iw = ((1 - k) * (vw - pw)) / 2, ih = ((1 - k) * (vh - ph)) / 2;
    E.panel.style.clipPath = `inset(${ih.toFixed(1)}px ${iw.toFixed(1)}px round ${((1 - easeIO(k)) * ph / 2).toFixed(1)}px)`;
    E.words.forEach((el, i) => place(el, WORDS[i](s, mobile), H, 1));
    E.cards.forEach((el, i) => {
      // A steady, unbroken drift through the card's window — no hold, no steps.
      const p = clamp((s - (i - 0.15)) / 1.2, 0, 1);
      const o = Math.min(seg(p, 0, 0.3), 1 - seg(p, 0.78, 1));
      place(el, { x: 0, y: (mobile ? 0.4 : 0.25) - p * (mobile ? 0.1 : 0.14) + Math.sin(t * 1.1 + i) * 0.006, s: 0.97 + 0.03 * o, o, rx: 0, ry: 0, rz: 0, b: (1 - o) * 10, z: 1 }, H, 1);
    });
    const act = clamp(Math.floor(s + 0.1), 0, 2);
    E.dots.forEach((el, i) => { el.classList.toggle('on', i === act); el.classList.toggle('past', i < act); });
  }
}
