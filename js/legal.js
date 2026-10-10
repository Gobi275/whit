// The privacy and deletion pages, dressed in the website's material. The
// legal markup is left exactly as written; this adds the shell around it
// (glass header, grid, light, cursor, back-to-top, theme toggle) and turns
// every <h2> section into a glass card that arrives softly as it scrolls in.
import { Cursor } from './cursor.js';
import { icon } from './glyphs.js';

const root = document.documentElement;
const de = (root.lang || 'de').startsWith('de');
const page = location.pathname.split('/').pop() || 'index.html';
const privacy = de ? 'privacy-de.html' : 'privacy.html';
const MARK = '<svg viewBox="0 0 700 606" aria-hidden="true"><path fill="currentColor" d="M687.475 182.465C641.318 -17.989 47.3687 -78.4101 11.1143 161.8C-16.6239 345.585 63.7731 490.283 134.908 485.749C206.044 481.216 212.316 428.312 283.595 428.034C354.874 427.757 344.667 556.671 442.797 596.352C540.927 636.033 733.631 382.92 687.475 182.465Z"/></svg>';

document.body.insertAdjacentHTML('afterbegin', `
  <div class="grid-bg" aria-hidden="true"></div><div class="lg-glow" aria-hidden="true"></div>
  <header class="lg-head glass">
    <a class="lg-brand" href="./" aria-label="whit">${MARK}<span aria-hidden="true"></span></a>
    <nav class="lg-nav">
      <a href="${privacy}"${page === privacy ? ' aria-current="page"' : ''}>${de ? 'Datenschutz' : 'Privacy'}</a>
      <a href="delete.html"${page === 'delete.html' ? ' aria-current="page"' : ''}>${de ? 'Daten löschen' : 'Delete data'}</a>
    </nav>
    <button class="lg-theme glass" type="button"></button>
  </header>`);
document.body.insertAdjacentHTML('beforeend', `
  <button class="to-top glass" type="button" aria-label="${de ? 'Nach oben' : 'Back to top'}">${icon('arrow_up', 20)}</button>
  <div class="cursor" aria-hidden="true"><div class="cur-dot"></div><div class="cur-label glass"></div></div>`);

// Theme: shared with the website (same origin, same key), dark by default.
const toggle = document.querySelector('.lg-theme');
const sync = () => {
  const dark = root.dataset.theme !== 'light';
  toggle.innerHTML = icon(dark ? 'sun' : 'moon', 18);
  toggle.setAttribute('aria-label', dark ? 'Light' : 'Dark');
};
toggle.addEventListener('click', () => {
  root.dataset.theme = root.dataset.theme === 'light' ? 'dark' : 'light';
  try { localStorage.setItem('whit.theme', root.dataset.theme); } catch (_) {}
  sync();
});
sync();

// Every <h2> opens a glass section that runs until the next <h2> (or the footer).
const main = document.querySelector('main');
let sec = null;
[...main.children].forEach((el) => {
  if (el.tagName === 'FOOTER') { sec = null; return; }
  if (el.tagName === 'H2') { sec = document.createElement('section'); sec.className = 'lg-sec'; el.before(sec); }
  if (sec) sec.appendChild(el);
});
const io = new IntersectionObserver((es) => es.forEach((e) => { if (e.isIntersecting) { e.target.classList.add('on'); io.unobserve(e.target); } }), { threshold: 0.08 });
document.querySelectorAll('.lg-sec').forEach((s) => io.observe(s));
if (location.hash) document.querySelectorAll('.lg-sec').forEach((s) => s.classList.add('on'));

// The grid drifts slower than the page; the light slower still.
const grid = document.querySelector('.grid-bg'), glow = document.querySelector('.lg-glow'), top = document.querySelector('.to-top');
top.addEventListener('click', () => scrollTo({ top: 0, behavior: 'smooth' }));
const onScroll = () => {
  const y = scrollY;
  grid.style.backgroundPosition = `center calc(50% + ${(-y * 0.12).toFixed(1)}px)`;
  glow.style.transform = `translateY(${(-y * 0.05).toFixed(1)}px)`;
  top.classList.toggle('on', y > innerHeight * 0.8);
};
addEventListener('scroll', onScroll, { passive: true });
onScroll();

new Cursor({});
