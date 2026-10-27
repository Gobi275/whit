// Store screenshots v2 — composes one frame of store.html: the REFERENCE
// renders of the plan (the final frames are built by hand in Figma from the
// same assets). The UI inside the device is the app's own render
// (store/ui/<lang>/*.png, 1080 px wide = 360 dp × 3, status-bar inset
// included; widgets: store/widgets/<lang>/, 4 px per dp).
//
// Layers: z0 ground (the aurora panorama slice for this position + 30 px grid;
// type and pills sit ON the grid), z1 the dark device (squircle, liquid-glass
// rim, one big warm lift shadow), z2 the app's glass — pills and small cards
// that are not screenshots: disc out on the paper, words on the device.
import { moodColor, applyTheme } from './theme.js';
import { icon, batterySvg } from './glyphs.js';
import { squirclePoints, mountBentos } from './bento.js';
import { drawBlob, drawHalo, drawRadialHalo } from './blob.js';

const q = new URLSearchParams(location.search);
const lang = q.get('lang') || 'de';
const id = q.get('frame') || 'prinzip';
document.documentElement.lang = lang;
const de = lang === 'de';

const W = 540, H = 960, GRID = 30;
const DEV = { w: 340, x: 100, pad: 12 };
const SCREEN_W = DEV.w - 2 * DEV.pad; // 316 px = 360 dp
const T = (o) => (typeof o === 'string' || Array.isArray(o) ? o : o[lang]);
const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));

const frame = document.getElementById('frame');
const el = (tag, cls, parent = frame, html) => {
  const e = document.createElement(tag);
  if (cls) e.className = cls;
  if (html != null) e.innerHTML = html;
  parent.appendChild(e);
  return e;
};
const svg = (html, parent = frame) => {
  const t = document.createElement('template');
  t.innerHTML = html.trim();
  return parent.appendChild(t.content.firstChild);
};
const at = (e, x, y) => Object.assign(e.style, { left: `${x}px`, top: `${y}px` });
const pathOf = (l, t, r, b, rad) =>
  'M' + squirclePoints(l, t, r, b, rad, 1.5).map((p) => p[0].toFixed(2) + ' ' + p[1].toFixed(2)).join('L') + 'Z';
const snap = (y) => Math.ceil(y / GRID) * GRID;
const esc = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;');
const blobImg = (score, size, { energy = 0, dark = true } = {}) => {
  const c = document.createElement('canvas');
  c.width = c.height = size * 4;
  const x = c.getContext('2d');
  x.scale(4, 4);
  drawBlob(x, 0, 0, size, score, moodColor(score, dark), { fit: true, energy });
  return `<img src="${c.toDataURL()}" width="${size}" height="${size}" alt="">`;
};

// ── z0: ground ────────────────────────────────────────────────────────────
// The aurora is ONE panorama across the row (tool/store_aurora.py), so each
// frame lays its own slice: the light carries over every seam.
const AURORA = ['1_prinzip', '2_checkin', '3_tags', '4_muster', '5_verlauf', '6_gewohnheiten_dark', '7_widgets', '8_vertrauen'];
function ground(pos, { dark = false } = {}) {
  applyTheme(dark);
  if (dark) frame.classList.add('inv');
  const a = el('img', 's-aurora');
  a.src = `store/aurora/${AURORA[pos - 1]}.png`;
  el('div', 's-grid');
}

// ── Copy: big centred headline with ONE inverted word, keyword pills ─────
// "[word]" in a headline = the inverted pill.
function keyRow(words, y) {
  const row = el('div', 's-keys');
  for (const k of T(words)) {
    const p = el('span', null, row);
    p.textContent = k;
    p.dataset.bento = 'pill';
  }
  row.style.top = `${y}px`;
  return row;
}
function copy(head, keys) {
  const c = el('div', 's-copy');
  el('h1', 's-head', c, esc(T(head)).replace(/\[([^\]]+)\]/g, '<span class="inv">$1</span>'));
  let bottom = c.offsetTop + c.offsetHeight;
  if (keys) {
    const row = keyRow(keys, snap(bottom + 14));
    bottom = row.offsetTop + row.offsetHeight;
  }
  return bottom;
}

// ── z1: the device ────────────────────────────────────────────────────────
// Always runs off the bottom edge; the screen sits flush with the top of the
// screen shape (the render carries the status-bar inset itself).
function device(screen, { y, x = DEV.x, light = false, inset = 0, scale = 1, rot = 0 } = {}) {
  const { w, pad } = DEV;
  const h = (H + 60 - y) / scale;
  const wrap = el('div', 's-dev' + (light ? ' light' : ''));
  Object.assign(wrap.style, { left: `${x}px`, top: `${y}px`, width: `${w}px`, height: `${h}px` });
  if (scale !== 1 || rot) Object.assign(wrap.style, { transformOrigin: '0 0', transform: `rotate(${rot}deg) scale(${scale})` });
  el('div', 's-lift', wrap); // a rounded box, NOT clipped — a clip would cut the blur
  el('div', 's-rim', wrap).style.clipPath = `path("${pathOf(0, 0, w, h, 64)}")`;
  el('div', 's-bezel', wrap).style.clipPath = `path("${pathOf(9, 9, w - 9, h - 9, 56)}")`;
  const sc = el('div', 's-screen', wrap);
  sc.style.clipPath = `path("${pathOf(pad, pad, w - pad, h - pad, 53)}")`;
  if (screen) {
    const img = el('img', null, sc);
    img.src = `store/ui/${lang}/${screen}.png`;
    Object.assign(img.style, { left: `${pad + inset}px`, top: `${pad}px`, width: `${SCREEN_W - 2 * inset}px` });
  }
  el('div', 's-status', sc, '<span>9:41</span><span class="ic">' +
    '<svg viewBox="0 0 12 10" width="11" height="9"><path d="M0 10h12V0z" fill="currentColor"/></svg>' +
    '<svg viewBox="0 0 14 10" width="12" height="9"><path d="M7 10 0 3a10 10 0 0 1 14 0z" fill="currentColor"/></svg>' +
    '<svg viewBox="0 0 8 13" width="6" height="10"><rect x="0" y="1.5" width="8" height="11.5" rx="1.6" fill="currentColor"/><rect x="2.5" y="0" width="3" height="2" rx=".6" fill="currentColor"/></svg></span>');
  svg(`<svg class="s-edge" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">
    <defs><linearGradient id="eg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="#fff" stop-opacity=".95"/><stop offset=".35" stop-color="#fff" stop-opacity=".2"/>
      <stop offset=".7" stop-color="#fff" stop-opacity=".12"/><stop offset="1" stop-color="#fff" stop-opacity=".7"/></linearGradient></defs>
    <path d="${pathOf(0.8, 0.8, w - 0.8, h - 0.8, 63)}" fill="none" stroke="url(#eg)" stroke-width="1.6"/>
    <path d="${pathOf(8.6, 8.6, w - 8.6, h - 8.6, 56)}" fill="none" stroke="rgba(255,255,255,.3)" stroke-width=".8"/></svg>`, wrap);
  return { x, y, w: w * scale, h: h * scale };
}

// ── z2: the app's glass ──────────────────────────────────────────────────
// A pill-round glass tag hanging over a device edge: the disc out on the
// paper, two balanced lines of words on the device.
function pill(dev, { side, y, glyph, text }) {
  const box = el('div', 's-call glass-x' + (side === 'right' ? ' flip' : ''));
  box.innerHTML = `<span class="disc">${glyph}</span><span class="txt">${esc(T(text)).replace('\n', '<br>')}</span>`;
  const w = box.offsetWidth;
  const out = 64; // the disc + its margin, out past the device edge
  const x = side === 'right' ? dev.x + dev.w + out - w : dev.x - out;
  at(box, clamp(x, 16, W - 16 - w), y);
  return box;
}
function card(cls, x, y, html) {
  const c = el('div', `s-gcard glass-x ${cls}`, frame, html);
  at(c, x, y);
  return c;
}

// The thin connector that runs blob → blob across the 1|2 frame seam; it
// meets the seam at the same height and slope on both sides.
const wire = (d) => svg(`<svg class="s-wire" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}"><path d="${d}"/></svg>`);
const SEAM_Y = 560;

const FRAMES = {
  // 1 — the principle: no device; the blob, and what you keep beside it.
  prinzip() {
    ground(1);
    copy({ de: 'sieh, was deine\n[stimmung] formt.', en: 'see what shapes\nyour [mood]' });
    const cx = 270, cy = 560;
    const nodes = [
      { x: 104, y: 400, ic: 'moon', de: 'schlaf', en: 'sleep' },
      { x: 436, y: 420, ic: 'users', de: 'menschen', en: 'people' },
      { x: 66, y: 580, ic: 'run', de: 'bewegung', en: 'activity' },
      { x: 104, y: 760, ic: 'cloud', de: 'wetter', en: 'weather' },
      { x: 432, y: 740, ic: 'home', de: 'orte', en: 'places' },
    ];
    const curve = (x, y) => `M${x} ${y}Q${(x + cx) / 2} ${(y + cy) / 2 + (y < cy ? 24 : -24)} ${cx} ${cy}`;
    // The energy row: a straight row, its own dashed spoke to the chosen pill.
    const ey = cy + 112;
    wire(nodes.map((n) => curve(n.x, n.y)).join('') + `M${cx} ${cy}L${cx + 52} ${ey - 20}` +
      `M${cx} ${cy}C${cx + 150} ${cy} ${W - 120} ${SEAM_Y + 8} ${W} ${SEAM_Y + 30}`);
    const S = 200, HS = 760;
    const halo = el('canvas', 's-halo');
    halo.width = halo.height = HS * 2;
    const hc = halo.getContext('2d');
    hc.scale(2, 2);
    drawRadialHalo(hc, HS / 2, HS / 2, S * 1.25, moodColor(7, false), 0.42);
    drawHalo(hc, HS / 2, HS / 2, S, 7, moodColor(7, false), false, 0.1, 0, 2);
    at(halo, cx - HS / 2, cy - HS / 2 - 12);
    at(el('div', 's-hero', frame, blobImg(7, S, { dark: false })), cx - S / 2, cy - S / 2 - 12);
    const en = el('div', 's-energy');
    en.style.top = `${ey - 22}px`;
    for (const lv of [1, 2, 3]) el('span', lv === 3 ? 'on' : 'glass-x', en, batterySvg(lv, 22, 'currentColor'));
    const lab = el('div', 's-elabel');
    lab.style.top = `${ey + 34}px`;
    lab.textContent = de ? 'energie' : 'energy';
    for (const n of nodes) {
      const node = el('div', 's-node');
      at(node, n.x - 40, n.y - 40);
      el('div', 's-gdisc glass-x', node, icon(n.ic, 38));
      el('span', null, node).textContent = n[lang];
    }
    el('div', 's-more').textContent = T({ de: '… und alles, was du selbst taggst', en: '… and anything you tag yourself' });
    keyRow({ de: ['kostenlos', 'privat', 'werbefrei'], en: ['free', 'private', 'ad-free'] }, 900);
  },

  // 2 — the check-in: so sieht whit aus, so schnell geht's.
  checkin() {
    ground(2);
    const bottom = copy({ de: 'ein whit in\nnur [10 sekunden]', en: 'a whit in\njust [10 seconds]' },
      { de: ['stimmung', 'energie', 'nuancen'], en: ['mood', 'energy', 'nuance'] });
    const d = device('screen_checkin', { y: snap(bottom + 24) });
    wire(`M0 ${SEAM_Y + 30}C40 ${SEAM_Y + 42} ${d.x - 30} ${SEAM_Y + 60} ${d.x} ${SEAM_Y + 66}`);
    pill(d, { side: 'right', y: d.y + 236, glyph: blobImg(6, 30), text: { de: 'der blob\nreagiert live', en: 'the blob\nreacts live' } });
    pill(d, { side: 'left', y: d.y + 438, glyph: batterySvg(1, 26, 'currentColor'), text: { de: 'von ruhig\nbis geladen', en: 'from calm\nto charged' } });
  },

  // 3 — tags: the data is entered honestly, not collected.
  tags() {
    ground(3);
    const bottom = copy({ de: 'markiere,\nwas [zählt]', en: 'tag what\nreally [matters]' },
      { de: ['menschen', 'orte', 'wetter'], en: ['people', 'places', 'weather'] });
    const d = device('screen_tags', { y: snap(bottom + 24) });
    pill(d, { side: 'left', y: d.y + 212, glyph: icon('moon', 24), text: { de: 'schlaf &\nbewegung', en: 'sleep &\nactivity' } });
    pill(d, { side: 'right', y: d.y + 470, glyph: icon('plus', 24), text: { de: 'eigene tags\njederzeit', en: 'your own tags,\nany time' } });
  },

  // 3b — the same frame with two tilted devices: tags in front-left, sleep
  // behind-right and lower (its 8–9 h + quality stay clear of the overlap);
  // each glass pill hangs off its own device with the disc out on the paper.
  tags2() {
    ground(3);
    const bottom = copy({ de: 'halte fest,\nwas [zählt]', en: 'note what\nreally [matters]' },
      { de: ['schlaf', 'bewegung', 'tags'], en: ['sleep', 'activity', 'tags'] });
    const top = snap(bottom + 30);
    const sleep = device('screen_sleep', { x: 262, y: top + 64, scale: 0.72, rot: 4 });
    const tags = device('screen_tags', { x: 34, y: top, scale: 0.74, rot: -3 });
    pill(tags, { side: 'left', y: top + 300, glyph: icon('plus', 24), text: { de: 'eigene tags\n& kategorien', en: 'custom tags\n& categories' } });
    pill(tags, { side: 'left', y: top + 566, glyph: icon('edit', 24), text: { de: 'notizen\nhinzufügen', en: 'add\nnotes' } });
  },

  // 4 — patterns: what lifts you, a week as a line, honest about growth.
  muster() {
    ground(4);
    const bottom = copy({ de: 'entdecke, was\ndir [guttut]', en: 'discover what\n[lifts] you.' },
      { de: ['menschen', 'orte', 'wetter'], en: ['people', 'places', 'weather'] });
    const d = device('screen_insights_tags', { y: snap(bottom + 24) });
    card('week', 56, d.y + 196, `<img src="store/parts/trend_week_bold_light.png" alt=""><b>${de ? 'deine woche' : 'your week'}</b>`);
    pill(d, { side: 'left', y: d.y + 548, glyph: blobImg(7, 30), text: { de: 'beste tage:\nmit freunden', en: 'best days:\nwith friends' } });
    pill(d, { side: 'right', y: d.y + 606, glyph: icon('chart', 24), text: { de: 'wächst mit\njedem whit', en: 'grows with\nevery whit' } });
  },

  // 5 — history: the journal beside the whits.
  verlauf() {
    ground(5);
    const bottom = copy({ de: 'jeder\ntag [bleibt]', en: 'every day\nis [kept]' },
      { de: ['whits', 'notizen', 'suche'], en: ['whits', 'notes', 'search'] });
    const d = device('screen_history', { y: snap(bottom + 24) });
    pill(d, { side: 'right', y: d.y + 620, glyph: icon('note', 24), text: { de: 'dein tagebuch,\nganz nebenbei', en: 'your journal,\non the side' } });
    pill(d, { side: 'left', y: d.y + 470, glyph: icon('calendar', 24), text: { de: 'jahre zurück,\ndurchsuchbar', en: 'years back,\nsearchable' } });
  },

  // 6 — habits, the ONE inverted frame: dark ground, the app in light mode.
  gewohnheiten() {
    ground(6, { dark: true });
    const bottom = copy({ de: 'gewohnheiten,\nmit [einem swipe]', en: 'habits, done\nin [one swipe]' },
      { de: ['serien', 'ziele', 'auch in hell'], en: ['streaks', 'goals', 'light mode too'] });
    const d = device('screen_habits_light', { y: snap(bottom + 24), light: true, inset: 9 });
    let heat = '';
    let seed = 7;
    for (let i = 0; i < 35; i++) {
      seed = (seed * 9301 + 49297) % 233280;
      const r = seed / 233280;
      heat += `<i style="opacity:${r < 0.32 ? 0.15 : r < 0.6 ? 0.55 : 1}"></i>`;
    }
    card('habit', 318, d.y + 300, `<div class="hd"><span class="disc">${icon('run', 22)}</span><span><b>${de ? 'Laufen' : 'Running'}</b><small>${de ? '12 tage serie' : '12-day streak'}</small></span></div>
      <div class="heat">${heat}</div>
      <div class="fx"><span>${de ? 'stimmung an lauftagen' : 'mood on running days'}</span><b>${de ? '+0,8' : '+0.8'}</b></div>`);
    pill(d, { side: 'left', y: d.y + 600, glyph: icon('trend_up', 24), text: { de: 'was habits\nbewirken', en: 'see what\nhabits do' } });
  },

  // 7 — widgets: a composition on the paper, one scale, one gap.
  widgets() {
    ground(7);
    const bottom = copy({ de: 'whit auf\ndeinem [homescreen]', en: 'whit on\nyour [home screen]' },
      { de: ['alle größen', 'hell & dunkel', 'ein tipp'], en: ['every size', 'light & dark', 'one tap'] });
    const k = 1.36, G = 19;
    const rows = [
      [['today_2x2', 139, 205], ['checkin_2x2', 139, 205]],
      [['week_4x1', 301, 94]],
      [['streak_2x1', 141, 94], ['average_1x1', 61, 61], ['checkin-done_1x1', 61, 61]],
    ];
    const total = rows.reduce((s, r) => s + Math.max(...r.map((w) => w[2])), 0) + G * (rows.length - 1);
    let y = bottom + (H - bottom - total * k) / 2 + 6;
    for (const r of rows) {
      const rh = Math.max(...r.map((w) => w[2]));
      const rw = r.reduce((s, w) => s + w[1], 0) + G * (r.length - 1);
      let x = (W - rw * k) / 2;
      for (const [name, w, h] of r) {
        const i = el('img', 's-widget');
        i.src = `store/widgets/${lang}/${name}.png`;
        Object.assign(i.style, { width: `${w * k}px`, left: `${x}px`, top: `${y + ((rh - h) * k) / 2}px` });
        x += (w + G) * k;
      }
      y += (rh + G) * k;
    }
  },

  // 8 — trust: no device; four of the app's neumorphic bentos, one inverted.
  vertrauen() {
    ground(8);
    const bottom = copy({ de: 'deine daten\nbleiben [deine]', en: 'your data\nstays [yours]' },
      { de: ['kostenlos', 'privat', 'werbefrei'], en: ['free', 'private', 'ad-free'] });
    const tiles = [
      { ic: 'lock', de: 'ende-zu-ende\nverschlüsselt', en: 'end-to-end\nencrypted', inv: true },
      { ic: 'view_off', de: 'keine werbung,\nkein tracking', en: 'no ads,\nno tracking' },
      { ic: 'user', de: 'ohne konto\nnutzbar', en: 'works without\nan account' },
      { ic: 'download', de: 'export\njederzeit', en: 'export\nany time' },
    ];
    const S = 214, G = 22;
    const top = snap(bottom + (H - bottom - 2 * S - G) / 2 - 15);
    tiles.forEach((t, i) => {
      const tile = el('div', 's-tile' + (t.inv ? ' inv' : ''));
      tile.dataset.bento = 'section';
      if (t.inv) tile.setAttribute('data-invert', '');
      Object.assign(tile.style, { left: `${(W - 2 * S - G) / 2 + (i % 2) * (S + G)}px`, top: `${top + Math.floor(i / 2) * (S + G)}px`, width: `${S}px`, height: `${S}px` });
      el('div', 'tb', tile, `<span class="disc">${icon(t.ic, 30)}</span><b>${t[lang]}</b>`);
    });
  },
};

FRAMES[id]();
mountBentos(frame);

// Ready once fonts and every image have decoded (the capture waits for this).
window.store = { ready: false };
Promise.all([document.fonts.ready, ...[...frame.querySelectorAll('img')].map((i) => i.decode().catch(() => {}))]).then(() => {
  requestAnimationFrame(() => requestAnimationFrame(() => { window.store.ready = true; }));
});
