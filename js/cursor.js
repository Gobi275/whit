// The cursor: a dot, light or dark — never a blend of colours. It reads the
// opaque surface under itself (walking up from the element under the
// pointer to the first background that isn't see-through) and takes the
// opposite tone: light on the dark ground, dark on paper and on light
// buttons. Over the hero and the closing CTA, a small glass tooltip beside it
// names the current mood. Both are re-checked on scroll too, because the page
// can move under a pointer that stands still.
const INTERACTIVE = 'a, button, [role="slider"], [role="tab"], label, summary';

function surfaceLum(el) {
  for (let e = el; e && e.nodeType === 1; e = e.parentElement) {
    const m = getComputedStyle(e).backgroundColor.match(/[\d.]+/g);
    if (!m) continue;
    const [r, g, b, a = 1] = m.map(Number);
    if (a < 0.5) continue;
    return (0.2126 * r + 0.7152 * g + 0.0722 * b) / 255;
  }
  const m = getComputedStyle(document.body).backgroundColor.match(/[\d.]+/g) || [0, 0, 0];
  return (0.2126 * m[0] + 0.7152 * m[1] + 0.0722 * m[2]) / 255;
}

export class Cursor {
  constructor(L) {
    this.ok = matchMedia('(hover: hover) and (pointer: fine)').matches;
    this.root = document.querySelector('.cursor');
    if (!this.ok || !this.root) { this.root?.remove(); return; }
    document.documentElement.classList.add('has-cursor');
    this.dot = this.root.querySelector('.cur-dot');
    this.label = this.root.querySelector('.cur-label');
    this.L = L;
    this.x = this.y = this.lx = this.ly = -100;
    this.word = '';
    this.dirty = false;
    addEventListener('pointermove', (e) => {
      if (e.pointerType !== 'mouse') { this.root.classList.remove('on'); return; }
      if (this.x < -50) { this.lx = e.clientX; this.ly = e.clientY; }
      this.x = e.clientX; this.y = e.clientY;
      this.root.classList.add('on');
      this.dirty = true;
    }, { passive: true });
    addEventListener('scroll', () => { this.dirty = true; }, { passive: true });
    addEventListener('pointerdown', (e) => { if (e.pointerType === 'mouse') this.root.classList.add('down'); });
    addEventListener('pointerup', () => this.root.classList.remove('down'));
    document.documentElement.addEventListener('mouseleave', () => this.root.classList.remove('on'));
    requestAnimationFrame(() => this.tick());
  }

  setLabels(L) { this.L = L; }

  setMood(word) {
    if (!this.ok) return;
    this.word = word;
    if (this.root.classList.contains('labelled')) this.label.textContent = word;
  }

  /** What is under the pointer right now: control? mood zone? light surface? */
  probe() {
    this.dirty = false;
    const t = document.elementFromPoint(this.x, this.y);
    if (!t) return;
    const inter = !!t.closest(INTERACTIVE);
    const mood = !inter && !!t.closest('#sec-hero, #sec-cta');
    this.root.classList.toggle('link', inter);
    if (mood && this.word) this.label.textContent = this.word;
    this.root.classList.toggle('labelled', mood && !!this.word);
    this.root.classList.toggle('ink', surfaceLum(t) > 0.55);
  }

  tick() {
    requestAnimationFrame(() => this.tick());
    if (this.dirty && this.x > -50) this.probe();
    // The dot is exact; the tooltip trails a touch behind it.
    this.lx += (this.x - this.lx) * 0.22;
    this.ly += (this.y - this.ly) * 0.22;
    this.dot.style.transform = `translate3d(${this.x}px, ${this.y}px, 0)`;
    this.label.style.transform = `translate3d(${this.lx}px, ${this.ly}px, 0)`;
  }
}
