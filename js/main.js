import { applyTheme, themeFor, Bold, duotoneSibling } from './theme.js';
import { css, clamp } from './color.js';
import { STR, MOOD_WORDS } from './i18n.js';
import { Hero } from './hero.js';
import { showPeek, closePeek } from './peek.js';
import { icon } from './glyphs.js';
import { Cursor } from './cursor.js';
import { Scene } from './story.js';
import { Journey, STEPS as J_STEPS } from './journey.js';
import { Patterns, STEPS as P_STEPS } from './patterns.js';
import { HabitScene, STEPS as H_STEPS } from './habitscene.js';
import { Free, STEPS as F_STEPS } from './free.js';
import { repaintGlass } from './squircle.js';
import { mountBentos, repaintBentos } from './bento.js';

const PLAY = 'https://play.google.com/store/apps/details?id=app.whit.mobile';
const store = {
  get(k) { try { return localStorage.getItem(k); } catch (_) { return null; } },
  set(k, v) { try { localStorage.setItem(k, v); } catch (_) {} },
};

// ?lang=en / ?theme=light make a shareable link; ?shot freezes motion for captures.
const qp = new URLSearchParams(location.search);
let lang = qp.get('lang') || store.get('whit.lang') || ((navigator.language || 'de').toLowerCase().startsWith('de') ? 'de' : 'en');
let dark = (qp.get('theme') || store.get('whit.theme') || 'dark') === 'dark';
if (qp.has('shot')) document.documentElement.classList.add('shot');
let L = STR[lang];
applyTheme(dark);

// ── Static copy ───────────────────────────────────────────────────────────
function applyCopy() {
  L = STR[lang];
  document.documentElement.lang = lang;
  document.title = L.title;
  document.querySelectorAll('[data-t]').forEach((el) => { el.textContent = L[el.dataset.t]; });
  document.querySelectorAll('[data-href]').forEach((el) => { el.href = L[el.dataset.href]; });
  document.querySelectorAll('.play-link').forEach((a) => (a.href = PLAY));
  document.querySelectorAll('[data-icon]').forEach((el) => {
    if (!el.querySelector('svg')) el.insertAdjacentHTML('afterbegin', icon(el.dataset.icon, +el.dataset.size || 20));
  });
}
applyCopy();

// ── Hero ──────────────────────────────────────────────────────────────────
const heroSec = document.getElementById('sec-hero');
const nowChip = heroSec.querySelector('.hero-now');
const chips = heroSec.querySelector('.hero-chips');
const cursor = new Cursor(L);
// The live mood pill: its word swaps softly and its width follows on a soft
// overshoot, measured, so it never jumps to the new word's size.
function setNow(w, c) {
  const el = nowChip.querySelector('.now-word');
  const from = nowChip.getBoundingClientRect().width;
  el.textContent = w;
  el.classList.remove('swap'); void el.offsetWidth; el.classList.add('swap');
  nowChip.style.width = 'auto';
  const to = nowChip.getBoundingClientRect().width;
  if (from > 0 && to > 0) { nowChip.style.width = from + 'px'; void nowChip.offsetWidth; nowChip.style.width = to + 'px'; }
  nowChip.style.setProperty('--dot', css(c));
  chips.style.setProperty('--fd1', css(c));
  chips.style.setProperty('--fd2', css(duotoneSibling(c)));
  cursor.setMood(w);
}
const hero = new Hero(heroSec, { words: MOOD_WORDS[lang], onWord: setNow });
requestAnimationFrame(() => setTimeout(() => heroSec.classList.add('on'), 450));

const ctaSec = document.getElementById('sec-cta');
const cta = new Hero(ctaSec, { words: MOOD_WORDS[lang], autoplay: false, onWord: (w) => { if (cta?.hover) cursor.setMood(w); } });
ctaSec.addEventListener('pointerenter', () => { cta.hover = true; if (cta.lastWord) cursor.setMood(cta.lastWord); });
ctaSec.addEventListener('pointerleave', () => { cta.hover = false; if (hero.lastWord) cursor.setMood(hero.lastWord); });
const ctaIO = new IntersectionObserver((en) => {
  if (!en[0].isIntersecting) return;
  ctaIO.disconnect();
  cta.play();
  setTimeout(() => ctaSec.classList.add('on'), 450);
}, { threshold: 0.35 });
ctaIO.observe(ctaSec);

// ── The story ─────────────────────────────────────────────────────────────
const stageOf = (id) => document.querySelector(`#${id} .stage`);
const journey = new Journey(stageOf('s-journey'));
const patterns = new Patterns(stageOf('s-patterns'));
const habitScene = new HabitScene(stageOf('s-habits'));
const free = new Free(stageOf('s-free'));
function buildScenes() {
  journey.build(L, MOOD_WORDS[lang]);
  patterns.build(L);
  habitScene.build(L);
  free.build(L);
}
buildScenes();
mountBentos();
// The three discs under "für alle" jump to their statement.
free.onJump = (i) => { const sc = scenes?.[3]; if (sc) scrollTo({ top: sc.top + (sc.len * (i + 0.45)) / sc.n, behavior: 'smooth' }); };

const scenes = [
  new Scene(document.getElementById('s-journey'), { steps: J_STEPS, chapters: (s) => (s < 4 ? 0 : s < 8 ? 1 : 2), update: (s, o) => journey.update(s, o) }),
  new Scene(document.getElementById('s-patterns'), { steps: P_STEPS, chapters: 3, update: (s, o) => patterns.update(s, o) }),
  new Scene(document.getElementById('s-habits'), { steps: H_STEPS, chapters: 4, update: (s, o) => habitScene.update(s, o) }),
  new Scene(document.getElementById('s-free'), { steps: F_STEPS, chapters: 5, update: (s, o) => free.update(s, o) }),
];

let H = 600, mobile = false, MX = 1;
function layout() {
  const vw = innerWidth, vh = innerHeight;
  mobile = vw < 860;
  // Wide screens: text on one side, the object on the other — so the object
  // can be taller. Narrower: centred, with room for one caption beneath it.
  const wide = vw >= 1100;
  document.documentElement.classList.toggle('wide', wide);
  H = mobile ? Math.min(vh * 0.58, vw * 1.3) : wide ? Math.min(vh * 0.74, vw * 0.42, 720) : Math.min(vh * 0.6, vw * 0.5, 640);
  // Sideways reach of the lifted pieces: full on wide screens, tighter as the columns close in.
  MX = mobile ? 0.55 : clamp(vw / 1440, 0.72, 1);
  document.documentElement.style.setProperty('--H', H.toFixed(1) + 'px');
  scenes.forEach((s) => s.measure());
  journey.relayout();
}
layout();
addEventListener('resize', layout);
new ResizeObserver(() => scenes.forEach((s) => s.measure())).observe(document.body);
document.fonts?.ready.then(layout);

// ── Header: where you are ─────────────────────────────────────────────────
const header = document.querySelector('.site-header');
const chapterEl = header.querySelector('.chapter');
const chN = chapterEl.querySelector('.ch-n'), chT = chapterEl.querySelector('.ch-t'), chBar = chapterEl.querySelector('.ch-bar i');
let shownCh = -2;
function setChapter(ch) {
  if (ch === shownCh) return;
  shownCh = ch;
  chapterEl.classList.toggle('on', ch >= 0);
  if (ch < 0) { chapterEl.style.width = '0px'; return; }
  const inner = chapterEl.querySelector('.ch-in');
  chN.textContent = String(ch + 1).padStart(2, '0');
  chT.textContent = L.chapters[ch];
  inner.classList.remove('swap'); void inner.offsetWidth; inner.classList.add('swap');
  chapterEl.style.width = inner.scrollWidth + 'px';
}

const dock = document.querySelector('.dock');
const gridBg = document.querySelector('.grid-bg');
const toTop = document.querySelector('.to-top');
toTop.addEventListener('click', () => scrollTo({ top: 0, behavior: 'smooth' }));
// The pointer, −0.5 … 0.5 across the window, eased: the phones lean toward it.
let px = 0, py = 0, tpx = 0, tpy = 0;
addEventListener('pointermove', (e) => { if (e.pointerType === 'mouse') { tpx = e.clientX / innerWidth - 0.5; tpy = e.clientY / innerHeight - 0.5; } }, { passive: true });
let last = 0;
function frame(now) {
  requestAnimationFrame(frame);
  const dt = last ? Math.min(0.05, (now - last) / 1000) : 0.016;
  last = now;
  const y = scrollY, vh = innerHeight, t = now / 1000;
  px += (tpx - px) * 0.06; py += (tpy - py) * 0.06;
  // The grid drifts a few cells against the scroll: slower than everything on it.
  gridBg.style.backgroundPosition = `center calc(50% + ${(-y * 0.12).toFixed(1)}px)`;
  gridBg.style.opacity = clamp((y - vh * 0.35) / (vh * 0.5), 0, 1).toFixed(3);
  toTop.classList.toggle('on', y > vh * 0.9);

  hero.visible = y < vh * 1.2;
  hero.scrollK = clamp(y / (vh * 0.9), 0, 1);
  heroSec.style.setProperty('--sk', hero.scrollK.toFixed(4));
  const r = ctaSec.getBoundingClientRect();
  cta.visible = r.top < vh && r.bottom > 0;

  let ch = -1, inv = false, pinned = false;
  for (const sc of scenes) {
    sc.read(y);
    sc.step(dt);
    sc.el.style.setProperty('--in', sc.enter.toFixed(3));
    sc.el.style.setProperty('--out', sc.leave.toFixed(3));
    if (sc.enter > 0.6 && sc.leave < 0.4) pinned = true;
    if (sc.visible) sc.updateFn(sc.s, { H, mobile, mx: MX, dt, t, enter: sc.enter, leave: sc.leave, px, py });
    if (y >= sc.top - vh * 0.5 && y < sc.top + sc.len + vh * 0.5) ch = sc.chapter();
  }
  inv = free.cover > 0.55;
  setChapter(ch);
  const first = scenes[0], lastSc = scenes[scenes.length - 1];
  chBar.style.transform = `scaleX(${clamp((y - first.top) / (lastSc.top + lastSc.len - first.top), 0, 1).toFixed(4)})`;
  header.classList.toggle('over-inv', inv);
  header.classList.toggle('scrolled', y > 40);
  // The dock carries the action between chapters, never over a caption.
  dock.classList.toggle('on', !pinned && y > vh * 0.75 && y + vh < document.body.scrollHeight - 520);
}
requestAnimationFrame(frame);

// ── Menu (phones) ─────────────────────────────────────────────────────────
document.querySelector('.menu-btn').addEventListener('click', (e) => {
  const panel = showPeek(e.currentTarget, `
    <div class="menu-links">
      <a href="${L.privacyHref}">${icon('lock', 20)}<span>${L.privacy}</span></a>
      <a href="delete.html">${icon('delete', 20)}<span>${L.del}</span></a>
      <a href="mailto:gobi275@proton.me">${icon('mail', 20)}<span>${L.contact}</span></a>
    </div>
    <div class="menu-row">
      <button type="button" class="chip glass" data-act="lang">${L.langOther}</button>
      <button type="button" class="circle glass" data-act="theme" aria-label="theme">${icon(dark ? 'sun' : 'moon', 18)}</button>
    </div>`, { width: 300, label: L.menu });
  panel.querySelector('[data-act="lang"]').addEventListener('click', () => { closePeek(); toggleLang(); });
  panel.querySelector('[data-act="theme"]').addEventListener('click', () => { closePeek(); setTheme(!dark); });
});

// ── Theme: instant, no transition ─────────────────────────────────────────
function setTheme(d) {
  if (d === dark) return;
  dark = d;
  store.set('whit.theme', d ? 'dark' : 'light');
  applyTheme(dark);
  repaintGlass();
  repaintBentos();
  journey.retheme();
  habitScene.retheme();
  syncThemeToggle();
}
function syncThemeToggle() {
  document.querySelectorAll('.theme-toggle').forEach((b) => {
    b.innerHTML = icon(dark ? 'sun' : 'moon', 18);
    b.setAttribute('aria-label', dark ? 'Light' : 'Dark');
  });
}
document.querySelectorAll('.theme-toggle').forEach((b) => b.addEventListener('click', () => setTheme(!dark)));
syncThemeToggle();

// ── Language ──────────────────────────────────────────────────────────────
function toggleLang() {
  lang = lang === 'de' ? 'en' : 'de';
  store.set('whit.lang', lang);
  applyCopy();
  hero.setWords(MOOD_WORDS[lang]);
  cta.setWords(MOOD_WORDS[lang]);
  buildScenes();
  cursor.setLabels(L);
  shownCh = -2;
  layout();
}
document.querySelectorAll('.lang-toggle').forEach((b) => b.addEventListener('click', toggleLang));

export { Bold, themeFor };
