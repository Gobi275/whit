// The scroll story engine.
//
// A scene is a tall <section> with one sticky, full-height stage inside. While
// the stage is pinned, scrolling advances the scene's position s from 0 to N
// (one unit per step). s is DAMPED toward the scroll target every frame, so
// everything glides even when the wheel jumps. Elements are driven by
// keyframe tracks over s; nothing animates on a timer except gentle floating.
//
// Layout units: H is the stage's "object height" (the phone's height). Every
// position in a track is in H units around the stage's anchor (the centre of
// the visual), so a composition scales as one piece on every screen.
import { clamp } from './color.js';

export const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;

export const easeIO = (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
export const easeOut = (t) => 1 - Math.pow(1 - t, 3);
export const lin = (t) => t;
/** 0 → 1 across [a, b] of s, eased. */
export const seg = (s, a, b, f = easeIO) => f(clamp((s - a) / (b - a), 0, 1));
export const mix = (a, b, t) => a + (b - a) * t;

const DEF = { x: 0, y: 0, s: 1, o: 1, rx: 0, ry: 0, rz: 0, b: 0, z: 0 };

/**
 * A keyframe track: [[s, {props}, {mobile props}?], …]. Between two frames
 * the props ease in-out; before the first and after the last they hold.
 * Missing props inherit from the previous frame (or the defaults).
 */
export function track(frames) {
  // The mobile line inherits from the previous MOBILE frame, so an override
  // holds until the next override instead of falling back to desktop values.
  const full = [];
  let prev = { ...DEF }, prevM = { ...DEF };
  for (const [at, v, m] of frames) {
    const d = { ...prev, ...v };
    const dm = { ...prevM, ...v, ...(m || {}) };
    full.push([at, d, dm]);
    prev = d; prevM = dm;
  }
  return (s, mobile) => {
    // Always a copy: callers add floating offsets to what they get back.
    const pick = (f) => ({ ...(mobile ? f[2] : f[1]) });
    if (s <= full[0][0]) return pick(full[0]);
    for (let i = 1; i < full.length; i++) {
      if (s <= full[i][0]) {
        const a0 = full[i - 1][0], A = pick(full[i - 1]);
        const a1 = full[i][0], B = pick(full[i]);
        const t = easeIO((s - a0) / (a1 - a0 || 1));
        const out = {};
        for (const k in B) out[k] = typeof B[k] === 'number' ? mix(A[k] ?? 0, B[k], t) : B[k];
        return out;
      }
    }
    return pick(full[full.length - 1]);
  };
}

/**
 * Writes a track's value onto an absolutely centred element. Glass elements
 * (data-sq) take their opacity as --o on their LAYERS, never on themselves:
 * an ancestor below opacity 1 becomes a backdrop root, and the glass would
 * lose its blur for the whole fade and pop back at the end.
 */
export function place(el, v, H, mx = 1) {
  const t = `translate(-50%, -50%) translate3d(${(v.x * H * mx).toFixed(1)}px, ${(v.y * H).toFixed(1)}px, 0)` +
    (v.rx || v.ry ? ` perspective(1400px) rotateX(${v.rx.toFixed(2)}deg) rotateY(${v.ry.toFixed(2)}deg)` : '') +
    (v.rz ? ` rotate(${v.rz.toFixed(2)}deg)` : '') + ` scale(${v.s.toFixed(4)})`;
  el.style.transform = t;
  if (el.dataset.sq != null) el.style.setProperty('--o', v.o.toFixed(3));
  else el.style.opacity = v.o.toFixed(3);
  el.style.visibility = v.o < 0.005 ? 'hidden' : '';
  el.style.filter = v.b > 0.05 ? `blur(${v.b.toFixed(1)}px)` : '';
  el.style.setProperty('--lift', v.z.toFixed(3));
}

/**
 * A title card: big, centred, alone. Its words arrive out of a blur one after
 * another and leave together, softly scaling past you.
 * p: 0 → 1 across the card's own window.
 */
export class Title {
  constructor(el, text) {
    this.el = el;
    el.innerHTML = text.split(' ').map((w, i) => `<span style="--i:${i}">${w}</span>`).join(' ');
    this.words = [...el.children];
  }

  update(pin, pout) {
    const n = this.words.length;
    this.words.forEach((w, i) => {
      const a = clamp(pin * (1 + n * 0.18) - i * 0.18, 0, 1);
      const e = easeOut(a);
      w.style.opacity = (e * (1 - pout)).toFixed(3);
      w.style.filter = `blur(${((1 - e) * 16 + pout * 14).toFixed(1)}px)`;
      w.style.transform = `translateY(${((1 - e) * 0.35 - pout * 0.12).toFixed(3)}em)`;
    });
    this.el.style.transform = `translate(-50%, -50%) scale(${(1 + pout * 0.08).toFixed(4)})`;
    this.el.style.visibility = pin <= 0 || pout >= 1 ? 'hidden' : 'visible';
  }
}

/**
 * Captions, centred under the object, plus the vertical progress: one slim
 * pill per step with small gaps (the app's progress language), the current
 * pill filling as you scroll through it. Chapters are separated by a wider gap.
 */
export class Steps {
  constructor(host, items, { offsets, groups } = {}) {
    this.host = host;
    // offsets[i] = scene position where caption i starts; it runs until the next one.
    this.offsets = offsets || items.map((_, i) => i);
    // Each caption owns one unit; between them (title cards) none is shown.
    this.ends = this.offsets.map((o) => o + 1);
    const g = groups || items.map(() => 0);
    host.innerHTML = `
      <div class="st-rail" aria-hidden="true">${items.map((_, i) => `<b class="${i && g[i] !== g[i - 1] ? 'gap' : ''}"><i></i></b>`).join('')}</div>
      <div class="st-cap"><div class="st-list">${items.map(([t, p], i) => `
        <div class="st-item" data-i="${i}"><h3 class="st-t">${t}</h3><p class="st-p">${p}</p></div>`).join('')}</div></div>`;
    this.items = [...host.querySelectorAll('.st-item')];
    this.pills = [...host.querySelectorAll('.st-rail b')];
    this.fills = this.pills.map((p) => p.firstElementChild);
    this.active = -2;
  }

  /** Replace one caption's copy in place (morning ↔ evening). */
  set(i, title, text) {
    const it = this.items[i];
    const t = it.querySelector('.st-t'), p = it.querySelector('.st-p');
    if (t.textContent === title) return;
    t.textContent = title; p.textContent = text;
    it.classList.remove('swap'); void it.offsetWidth; it.classList.add('swap');
  }

  update(s) {
    let i = -1;
    this.offsets.forEach((o, k) => { if (s >= o - 0.02 && s < this.ends[k] - 0.02) i = k; });
    this.fills.forEach((f, k) => {
      f.style.transform = `scaleY(${clamp((s - this.offsets[k]) / (this.ends[k] - this.offsets[k]), 0, 1).toFixed(4)})`;
    });
    if (i === this.active) return;
    this.items.forEach((el, k) => { el.classList.toggle('on', k === i); el.classList.toggle('up', k < i); });
    this.host.classList.toggle('idle', i < 0);
    this.active = i;
  }
}

/** A pinned scene: measures itself and reports a damped position. */
export class Scene {
  constructor(el, { steps, chapters, update }) {
    this.el = el;
    this.n = steps;
    this.chapters = chapters;
    this.updateFn = update;
    this.s = 0;
    this.target = 0;
    el.style.setProperty('--steps', steps);
    this.measure();
  }

  measure() {
    this.top = this.el.offsetTop;
    this.len = Math.max(1, this.el.offsetHeight - innerHeight);
  }

  read(y) {
    this.target = clamp((y - this.top) / this.len, 0, 1) * this.n;
    this.enter = clamp((y + innerHeight - this.top) / innerHeight, 0, 1);
    this.leave = clamp((y - this.top - this.len) / innerHeight, 0, 1);
    this.visible = this.enter > 0 && this.leave < 1;
  }

  step(dt) {
    const k = reduce ? 1 : 1 - Math.exp(-dt * 7);
    this.s += (this.target - this.s) * k;
    if (Math.abs(this.target - this.s) < 0.0005) this.s = this.target;
  }

  chapter() {
    return typeof this.chapters === 'function' ? this.chapters(this.s) : this.chapters;
  }
}
