// The hero: one big living blob — the brand mark, alive — with "meet" and
// "whit." gliding out from behind it. The blob follows the cursor through the
// circumplex (x = valence, y = energy) and drifts on its own when nobody's there.
// Silhouette, duotone and aurora halo are the app's (MoodShapePainter, MoodHalo).
import { clamp } from './color.js';
import { moodColor, Curves } from './theme.js';
import { glowTone } from './phone.js';
import { blobPath, moodGradient, drawHalo } from './blob.js';

export class Hero {
  constructor(section, { words, onWord, autoplay = true }) {
    this.sec = section;
    this.canvas = section.querySelector('.hero-canvas');
    this.halo = document.createElement('canvas');
    this.words = words;
    this.onWord = onWord;
    this.val = 0.78; this.en = 0.4;           // eased state (0..1 valence, −1..1 energy)
    this.tVal = 0.78; this.tEn = 0.4;          // target
    this.pointer = false;
    // Not yet played: the intro clock waits (the CTA starts when it scrolls in).
    this.t0 = autoplay ? performance.now() : Infinity;
    this.last = 0;
    this.lastWord = '';
    this.scrollK = 0;
    const move = (x, y) => {
      const r = this.sec.getBoundingClientRect();
      this.tVal = clamp((x - r.left) / r.width, 0, 1);
      this.tEn = clamp(1 - 2 * ((y - r.top) / Math.min(r.height, innerHeight)), -1, 1);
      this.pointer = true;
      clearTimeout(this.idleT);
      this.idleT = setTimeout(() => (this.pointer = false), 2600);
    };
    section.addEventListener('pointermove', (e) => { if (e.pointerType === 'mouse') move(e.clientX, e.clientY); });
    section.addEventListener('pointerdown', (e) => { if (e.pointerType !== 'mouse') move(e.clientX, e.clientY); });
    new ResizeObserver(() => this.layout()).observe(section);
    this.layout();
    requestAnimationFrame((t) => this.tick(t));
  }

  layout() {
    const s = this.sec;
    const W = s.clientWidth, H = s.clientHeight;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    this.W = W; this.H = H; this.dpr = dpr;
    this.canvas.width = Math.round(W * dpr); this.canvas.height = Math.round(H * dpr);
    this.canvas.style.width = W + 'px'; this.canvas.style.height = H + 'px';
    // The halo is all blur — render it at a quarter resolution and scale up.
    this.halo.width = Math.ceil(W / 4); this.halo.height = Math.ceil(H / 4);
    const mobile = W < 720;
    this.size = mobile ? Math.min(W * 0.56, H * 0.28) : Math.min(H * 0.44, W * 0.3, 500);
    this.cx = W / 2;
    // Phones: the drop sits higher, so "whit." has room to drift before the text below.
    this.cy = mobile ? H * 0.33 : H * 0.43;
    s.style.setProperty('--blob', this.size + 'px');
    s.style.setProperty('--cy', this.cy + 'px');
  }

  tick(now) {
    requestAnimationFrame((t) => this.tick(t));
    const dt = this.last ? clamp((now - this.last) / 1000, 0, 0.05) : 0.016;
    this.last = now;
    if (this.visible === false) return;

    if (this.t0 === Infinity) return;
    if (!this.pointer) {
      // Idle drift: a slow Lissajous through the field, mostly on the bright side.
      const t = (now - this.t0) / 1000;
      this.tVal = 0.62 + 0.34 * Math.sin(t * 0.21);
      this.tEn = 0.75 * Math.sin(t * 0.33 + 1.2);
    }
    const k = 1 - Math.exp(-dt * (this.pointer ? 3.2 : 1.6));
    this.val += (this.tVal - this.val) * k;
    this.en += (this.tEn - this.en) * k;

    const score = 1 + this.val * 6;
    const intro = clamp((now - this.t0 - 150) / 1300, 0, 1);
    const grow = Curves.easeOutBack(intro);

    // Scroll: the blob settles back and sinks a little as the page moves on.
    const sk = this.scrollK;
    const size = this.size * grow * (1 - 0.22 * sk);
    const cy = this.cy + sk * this.H * 0.12;

    const dark = document.documentElement.dataset.theme !== 'light';
    const color = moodColor(score, dark);
    const ctx = this.canvas.getContext('2d');
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

    if (size > 2) {
      const hc = this.halo.getContext('2d');
      hc.setTransform(1, 0, 0, 1, 0, 0);
      hc.clearRect(0, 0, this.halo.width, this.halo.height);
      hc.setTransform(0.25, 0, 0, 0.25, 0, 0);
      drawHalo(hc, this.cx, cy, size, score, glowTone(color), dark, ((now - this.t0) / 26000) % 1, this.en, 0.25);
      ctx.globalAlpha = intro;
      ctx.imageSmoothingQuality = 'high';
      ctx.drawImage(this.halo, 0, 0, this.halo.width * 4 * this.dpr, this.halo.height * 4 * this.dpr);
      ctx.globalAlpha = 1;

      ctx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
      const { path, r0 } = blobPath(size, score, { time: ((now - this.t0) / 14000) % 1, energy: this.en });
      ctx.translate(this.cx - size / 2, cy - size / 2);
      ctx.fillStyle = moodGradient(ctx, color, size / 2, size / 2, r0);
      ctx.fill(path);
    }

    const word = this.words[Math.round(this.en) === 0 ? 0 : Math.sign(Math.round(this.en))][clamp(Math.round(score), 1, 7) - 1];
    if (word !== this.lastWord) { this.lastWord = word; this.onWord?.(word, color); }
    this.color = color;
  }

  play() { if (this.t0 === Infinity) this.t0 = performance.now(); }

  setWords(w) { this.words = w; this.lastWord = ''; }
}
