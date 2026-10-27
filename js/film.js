// The promo film: a ~35 s, 9:16 story built from the website's own painters
// (blob + halo, squircle glass, bentos, icons). Every frame is a pure function
// of the film's time t, so it can be scrubbed (?t=12.5) and captured frame by
// frame (tool/film_capture.py → 1080 × 1920 MP4).
//
//   0.0  hook      the drop sharpens, "meet" / "whit." glide out from behind it,
//                  the mood steps gently through the bright half; the promise
//   4.6  check-in  the drop shrinks up, its word below; the slider is dragged,
//                  energy pills are tapped, each tap floats a glass tooltip in
//  11.3  your day  "people." "weather." "habits." — big glass circles, ticked
//                  ones turn bold and drop into a tray
//  17.6  insight   the tray orbits the drop, lines carry the days into it;
//                  then the pay-off as bentos: with/without, a week, one line
//  25.0  trust     the page turns warm paper: private. ad-free. free.
//  30.4  get it    the opening move once more, plus the Play button
import { STR, MOOD_WORDS } from './i18n.js';
import { applyTheme, moodColor, Curves } from './theme.js';
import { clamp, css, withAlpha } from './color.js';
import { blobPath, moodGradient, drawHalo } from './blob.js';
import { glowTone } from './phone.js';
import { icon, batterySvg } from './glyphs.js';
import { track, seg, mix, easeIO } from './story.js';
import { glass, repaintGlass } from './squircle.js';
import { mountBentos, repaintBentos } from './bento.js';

const W = 540, H = 960;
export const DURATION = 35;
const qp = new URLSearchParams(location.search);
const lang = qp.get('lang') === 'de' ? 'de' : 'en';
const L = STR[lang], WORDS = MOOD_WORDS[lang];

const COPY = {
  en: {
    promise: 'note how you feel\nand what you do.', ask: 'how are you right now?',
    beats: [
      ['people.', [['family', 'family'], ['people', 'friends'], ['heart', 'partner']], [0, 1]],
      ['weather.', [['sun', 'sunny'], ['rain', 'rainy'], ['cold', 'cold']], [0]],
      ['habits.', [['run', 'running'], ['water', 'water'], ['book', 'reading']], [0, 1]],
    ],
    see: 'see what does you good.', friends: 'friends', running: 'running', with: 'with', without: 'without',
    quote: 'sunny days lift you the most.', days: ['M', 'T', 'W', 'T', 'F', 'S', 'S'],
    get: 'get', play: 'Get it on Google Play', small: 'free · ad-free · private',
  },
  de: {
    promise: 'halt fest, wie’s dir geht\nund was du tust.', ask: 'wie geht’s dir gerade?',
    beats: [
      ['menschen.', [['family', 'Familie'], ['people', 'Freunde'], ['heart', 'Partner']], [0, 1]],
      ['wetter.', [['sun', 'Sonnig'], ['rain', 'Regnerisch'], ['cold', 'Kalt']], [0]],
      ['gewohnheiten.', [['run', 'Laufen'], ['water', 'Wasser'], ['book', 'Lesen']], [0, 1]],
    ],
    see: 'sieh, was dir guttut.', friends: 'Freunde', running: 'Laufen', with: 'mit', without: 'ohne',
    quote: 'an sonnigen tagen geht’s dir am besten.', days: ['M', 'D', 'M', 'D', 'F', 'S', 'S'],
    get: 'hol dir', play: 'Bei Google Play', small: 'kostenlos · werbefrei · privat',
  },
}[lang];

// ── Small timing helpers ──────────────────────────────────────────────────
/** Piecewise ease between [t, v] keys; holds outside. */
function keys(list) {
  return (t) => {
    if (t <= list[0][0]) return list[0][1];
    for (let i = 1; i < list.length; i++) {
      if (t <= list[i][0]) {
        const [a0, v0] = list[i - 1], [a1, v1] = list[i];
        return mix(v0, v1, easeIO((t - a0) / (a1 - a0 || 1)));
      }
    }
    return list[list.length - 1][1];
  };
}
const lin01 = (t, a, b) => clamp((t - a) / (b - a), 0, 1);
const back = (t, a, b) => Curves.easeOutBack(lin01(t, a, b));
/** A press: dips, then springs back past 1 and settles. */
function pop(dt) {
  if (dt < 0) return 1;
  if (dt < 0.09) return 1 - 0.12 * (dt / 0.09);
  return 0.88 + 0.12 * Curves.elasticOut(clamp((dt - 0.09) / 0.7, 0, 1));
}

// ── The mood the drop carries through the whole film ──────────────────────
// Single steps only, mostly on the bright side (low … amazing).
const SCORE = keys([[0, 5], [1.5, 5], [2.2, 6], [2.9, 6], [3.6, 7], [4.4, 7], [5.1, 6], [5.75, 6], [6.65, 4], [7.55, 6],
  [30.4, 5], [31.8, 5], [32.5, 6], [33.5, 6], [34.2, 7]]);
const ENERGY = keys([[0, 0], [8.1, 0], [8.35, -1], [9.55, -1], [9.8, 1], [30.0, 1], [30.4, 0]]);
const wordAt = (t) => WORDS[Math.round(ENERGY(t)) === 0 ? 0 : Math.sign(Math.round(ENERGY(t)))][clamp(Math.round(SCORE(t)), 1, 7) - 1];

// ── Tracks (x, y in frame px; s = scale, or the drop's size in px) ───────
const BLOB = track([
  [0, { x: 270, y: 430, s: 236, o: 0, b: 24 }], [0.4, { o: 1, b: 16 }], [1.4, { b: 0 }], [4.3, {}], [5.1, { y: 300, s: 190 }],
  [10.9, {}], [11.5, { y: 190, s: 100 }], [17.5, {}], [18.3, { y: 455, s: 190 }], [19.9, {}],
  [20.5, { x: 155, y: 421, s: 76 }], [20.65, { o: 0 }],
  [30.35, { x: 270, y: 422, s: 214, o: 0, b: 24 }], [30.8, { o: 1, b: 16 }], [31.7, { b: 0 }],
]);
const growAt = (t) => (t < 4 ? back(t, 0.15, 1.45) : t > 30 ? back(t, 30.5, 31.8) : 1);

const out = (a, b, o = {}) => [[a, {}], [b, { o: 0, b: 14, ...o }]];
const MEET = track([[0.75, { x: 270, y: 430, o: 0, s: 0.92 }], [1.0, { o: 1 }], [1.65, { y: 268, o: 1, s: 1 }], ...out(4.15, 4.55, { y: 254 })]);
const WHIT = track([[0.75, { x: 270, y: 430, o: 0, s: 0.92 }], [1.0, { o: 1 }], [1.65, { y: 596, o: 1, s: 1 }], ...out(4.15, 4.55, { y: 610 })]);
const PROMISE = track([[2.4, { x: 270, y: 780, o: 0, b: 14 }], [3.0, { y: 766, o: 1, b: 0 }], ...out(4.15, 4.55)]);

const ASK = track([[4.75, { x: 270, y: 152, o: 0, b: 14 }], [5.25, { o: 1, b: 0 }], ...out(10.6, 11.0)]);
const MWORD = track([[5.0, { x: 270, y: 442, o: 0, b: 10 }], [5.4, { o: 1, b: 0 }], ...out(10.65, 11.0)]);
const SLIDER = track([[5.2, { x: 270, y: 536, o: 0, b: 10, s: 0.96 }], [5.6, { o: 1, b: 0, s: 1 }], ...out(10.7, 11.05)]);
const PILLS = track([[5.35, { x: 270, y: 690, o: 0, b: 10, s: 0.96 }], [5.75, { o: 1, b: 0, s: 1 }], ...out(10.7, 11.05)]);
const SL_X0 = 270 - 190, SL_W = 380;
const knobX = (t) => SL_X0 + ((SCORE(t) - 1) / 6) * SL_W;
const TAPS = [{ at: 8.1, pill: 0 }, { at: 9.55, pill: 2 }];

const BEATS_AT = [11.3, 13.4, 15.5];
const CIRC_X = [120, 270, 420], CIRC_Y = 508;
const TRAY_Y = 762, trayX = (j) => 134 + 68 * j;

const SEE = track([[18.3, { x: 270, y: 168, o: 0, b: 14 }], [18.8, { o: 1, b: 0 }], ...out(24.5, 24.9)]);
const ORBIT = { cx: 270, cy: 455, r: 182 };
const TILE1 = track([[20.2, { x: 270, y: 430, o: 0, b: 14, s: 0.96 }], [20.6, { y: 400, o: 1, b: 0, s: 1 }], ...out(22.75, 23.1, { y: 380 })]);
const TILE2 = track([[21.0, { x: 270, y: 670, o: 0, b: 14, s: 0.96 }], [21.4, { y: 640, o: 1, b: 0, s: 1 }], ...out(22.75, 23.1, { y: 620 })]);
const QUOTE = track([[23.0, { x: 270, y: 545, o: 0, b: 14, s: 0.95 }], [23.4, { y: 520, o: 1, b: 0, s: 1 }], ...out(24.6, 24.95, { s: 1.03 })]);
const WEEK = [5.1, 4.7, 4.3, 5.2, 4.9, 5.7, 5.0], RAN = [0, 3, 5];
const avg = (a) => a.reduce((x, y) => x + y, 0) / a.length;
const RUN_DELTA = avg(RAN.map((i) => WEEK[i])) - avg(WEEK.filter((_, i) => !RAN.includes(i)));
const WITH = 5.9, WITHOUT = 4.7;

const WIPE_IN = [25.0, 25.65], WIPE_OUT = [29.8, 30.4];
const TRUST_AT = [25.75, 27.15, 28.55];

const GET = track([[30.9, { x: 270, y: 422, o: 0, s: 0.92 }], [31.75, { y: 256, o: 1, s: 1 }]]);
const WHIT2 = track([[30.9, { x: 270, y: 422, o: 0, s: 0.92 }], [31.75, { y: 590, o: 1, s: 1 }]]);
const PLAY = track([[31.95, { x: 270, y: 692, o: 0, b: 10, s: 0.9 }], [32.4, { o: 1, b: 0, s: 1 }]]);
const SMALL = track([[32.25, { x: 270, y: 766, o: 0, b: 8 }], [32.7, { o: 1, b: 0 }]]);

// ── DOM ──────────────────────────────────────────────────────────────────
const frame = document.getElementById('frame');
const back_ = document.getElementById('back'), front = document.getElementById('front');
const cv = document.getElementById('cv'), wipe = document.getElementById('wipe');
const capture = qp.has('capture');
if (capture) document.body.classList.add('capture');
const dpr = window.devicePixelRatio || 1;
cv.width = W * dpr; cv.height = H * dpr;
const haloCv = document.createElement('canvas');
haloCv.width = W / 4; haloCv.height = H / 4;

const h = (html) => { const t = document.createElement('template'); t.innerHTML = html.trim(); return t.content.firstElementChild; };
const add = (parent, html) => parent.appendChild(h(html));
const words = (s) => s.split(' ').map((w) => `<span>${w}</span>`).join(' ');

const E = {};
E.meet = add(back_, `<div class="fl f-big">meet</div>`);
E.whit = add(back_, `<div class="fl f-big">whit.</div>`);
E.get = add(back_, `<div class="fl f-big">${COPY.get}</div>`);
E.whit2 = add(back_, `<div class="fl f-big">whit.</div>`);
E.promise = add(front, `<div class="fl f-line">${COPY.promise}</div>`);
E.ask = add(front, `<div class="fl f-head">${COPY.ask}</div>`);
E.mword = add(front, `<div class="fl f-mood" style="width:400px;height:52px"><span class="a"></span><span class="b"></span></div>`);
E.slider = add(front, `<div class="fl f-slider"><i class="rail"></i><i class="fill"></i><i class="knob"></i></div>`);
E.pills = add(front, `<div class="fl" style="width:400px;height:56px"></div>`);
E.pill = [1, 2, 3].map((lv) => add(E.pills, `<div class="f-pill glass" style="position:absolute;top:0">
  <i class="on"><span style="position:absolute;inset:0;display:grid;place-items:center;color:var(--on-bold)">${batterySvg(lv, 30, 'currentColor')}</span></i>
  <span class="i0">${batterySvg(lv, 30, 'currentColor')}</span></div>`));
E.tips = TAPS.map(({ pill }) => add(front, `<div class="fl f-tip glass"><span class="disc">${batterySvg(pill + 1, 26, 'currentColor')}</span><b>${L.energyL[pill]}</b></div>`));
E.taprings = TAPS.map(() => add(front, `<div class="fl f-ring" style="width:84px;height:84px"></div>`));
E.finger = add(front, `<div class="fl f-finger"></div>`);

E.bword = COPY.beats.map(([w]) => add(front, `<div class="fl f-big" style="font-size:${Math.min(112, Math.floor(1000 / w.length))}px">${w}</div>`));
E.circ = []; E.lab = []; E.ring = []; E.badge = [];
COPY.beats.forEach(([, items], b) => items.forEach(([ic, name], i) => {
  const c = add(front, `<div class="fl f-circ glass"><i class="on"></i>${icon(ic, 46)}<span class="ic-on">${icon(ic, 46)}</span><span class="f-badge">${icon('check', 22)}</span></div>`);
  E.circ.push({ el: c, b, i, on: c.querySelector('.on'), icOn: c.querySelector('.ic-on'), badge: c.querySelector('.f-badge') });
  E.lab.push(add(front, `<div class="fl f-lab">${name}</div>`));
  E.ring.push(add(front, `<div class="fl f-ring"></div>`));
}));
// The ticked ones, in order: their tray slot and orbit index.
let slot = 0;
E.circ.forEach((c) => { const ticks = COPY.beats[c.b][2]; c.k = ticks.indexOf(c.i); c.ticked = c.k >= 0; if (c.ticked) c.slot = slot++; });

E.see = add(front, `<div class="fl f-head f-words" style="font-size:44px">${words(COPY.see)}</div>`);
E.tile1 = add(front, `<div class="fl f-tile" data-bento="section"><div class="in">
  <span class="f-chip"><span class="d">${icon('people', 18)}</span>${COPY.friends}</span>
  <span class="f-num">+0,0</span><canvas></canvas>
  <span class="f-tl" style="left:120px;top:186px">${COPY.with}</span><span class="f-tl" style="left:250px;top:186px">${COPY.without}</span></div></div>`);
E.tile2 = add(front, `<div class="fl f-tile" data-bento="section"><div class="in">
  <span class="f-chip"><span class="d">${icon('run', 18)}</span>${COPY.running}</span>
  <span class="f-num">+0,0</span><canvas></canvas>
  ${COPY.days.map((d, i) => `<span class="f-tl" style="left:${62 + i * 58}px;top:186px">${d}</span>`).join('')}</div></div>`);
E.quote = add(front, `<div class="fl f-quote" data-bento="section" data-invert><div class="in"><span class="d">${icon('sun', 32)}</span><p>${COPY.quote}</p></div></div>`);
[E.tile1, E.tile2].forEach((t) => {
  const c = t.querySelector('.in canvas');
  c.width = 470 * dpr; c.height = 214 * dpr; c.style.width = '470px'; c.style.height = '214px';
});

E.tword = L.fSteps.map(([w]) => add(back_, `<div class="fl f-tword">${w}</div>`));
E.tcard = L.fSteps.map(([, p, ic, head]) => add(front, `<div class="fl f-tcard" data-sq><div class="sq-body"><span class="d">${icon(ic, 22)}</span><div><h4>${head}</h4><p>${p}</p></div></div></div>`));
E.play = add(front, `<div class="fl f-play">${icon('download', 24)}<span>${COPY.play}</span></div>`);
E.small = add(front, `<div class="fl f-small">${COPY.small}</div>`);

applyTheme(true);
mountBentos(frame);
E.tcard.forEach((c) => glass(c, { radius: (w) => w * 0.165, shadow: 1 }));

// ── Rendering ────────────────────────────────────────────────────────────
function put(el, v) {
  if (!v) return;
  el.style.transform = `translate(${v.x.toFixed(2)}px, ${v.y.toFixed(2)}px) translate(-50%, -50%) scale(${v.s.toFixed(4)})`;
  const o = clamp(v.o, 0, 1);
  const sq = el.dataset.sq != null;
  if (sq) el.style.setProperty('--o', o.toFixed(3)); else el.style.opacity = o.toFixed(3);
  el.style.visibility = o < 0.004 ? 'hidden' : '';
  const blur = v.b > 0.05 ? `blur(${v.b.toFixed(1)}px)` : '';
  if (sq) el.style.setProperty('--bf', blur || 'none'); else el.style.filter = blur;
}
const hide = (el) => { el.style.visibility = 'hidden'; };

let darkNow = true;
function setTheme(dark) {
  if (dark === darkNow) return;
  darkNow = dark;
  applyTheme(dark);
  repaintGlass();
  repaintBentos();
}

/** The word under the drop: the new word blurs in as the old one leaves. */
function renderMoodWord(t) {
  const cur = wordAt(t);
  let tc = null, prev = null;
  for (let k = 1; k <= 24; k++) {
    const w = wordAt(t - k / 60);
    if (w !== cur) { tc = t - (k - 0.5) / 60; prev = w; break; }
  }
  const p = tc == null ? 1 : easeIO(clamp((t - tc) / 0.32, 0, 1));
  const [a, b] = E.mword.children;
  a.textContent = cur; b.textContent = prev || '';
  a.style.opacity = p; a.style.filter = `blur(${((1 - p) * 8).toFixed(1)}px)`; a.style.transform = `translate(-50%, calc(-50% + ${((1 - p) * 10).toFixed(1)}px))`;
  b.style.opacity = 1 - p; b.style.filter = `blur(${(p * 8).toFixed(1)}px)`; b.style.transform = `translate(-50%, calc(-50% - ${(p * 10).toFixed(1)}px))`;
}

function drawBlobAt(ctx, x, y, size, score, energy, phase, color) {
  const { path, r0 } = blobPath(size, score, { time: phase, energy });
  ctx.save();
  ctx.translate(x - size / 2, y - size / 2);
  ctx.fillStyle = moodGradient(ctx, color, size / 2, size / 2, r0);
  ctx.fill(path);
  ctx.restore();
}

/** Where the k-th ticked circle sits in the orbit at time t. */
function orbitPos(j, t) {
  const r = ORBIT.r * (1 - easeIO(lin01(t, 19.9, 20.45)));
  const a = -Math.PI / 2 + (j * 2 * Math.PI) / slot + 0.32 * (t - 18.3);
  return [ORBIT.cx + r * Math.cos(a), ORBIT.cy + r * Math.sin(a)];
}

function render(t) {
  const dark = !(t >= WIPE_IN[1] && t < WIPE_OUT[1]);
  setTheme(dark);
  const ctx = cv.getContext('2d');
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.clearRect(0, 0, cv.width, cv.height);
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

  const score = SCORE(t), energy = ENERGY(t), color = moodColor(score, dark);
  const phase = (t / 14) % 1;

  // ── S4 lines: the day's things flow into the drop ──
  if (t > 18.2 && t < 20.6) {
    const fade = 1 - lin01(t, 19.85, 20.3);
    E.circ.filter((c) => c.ticked).forEach((c) => {
      const [x, y] = orbitPos(c.slot, t);
      const grow = easeIO(lin01(t, 18.45 + 0.1 * c.slot, 18.85 + 0.1 * c.slot));
      if (grow <= 0) return;
      const ex = mix(x, ORBIT.cx, grow), ey = mix(y, ORBIT.cy, grow);
      ctx.strokeStyle = css(withAlpha(color, 0.55 * fade));
      ctx.lineWidth = 2;
      ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(ex, ey); ctx.stroke();
      // Pulses travel along the line into the drop: perfect circles.
      for (let n = 0; n < 2; n++) {
        const u = ((t - 18.9 - 0.22 * c.slot - n * 0.5) / 1.0);
        if (u < 0 || u > 1 || t > 19.95) continue;
        const f = easeIO(u);
        ctx.fillStyle = css(withAlpha(color, fade * (1 - u * 0.6)));
        ctx.beginPath(); ctx.arc(mix(x, ORBIT.cx, f), mix(y, ORBIT.cy, f), 5, 0, Math.PI * 2); ctx.fill();
      }
    });
  }

  // ── The drop ──
  const bv = BLOB(t);
  const size = bv.s * growAt(t) * (t > 18.9 && t < 19.95 ? 1 + 0.03 * Math.sin((t - 18.9) * 12) : 1);
  if (bv.o > 0.004 && size > 2) {
    const hc = haloCv.getContext('2d');
    hc.setTransform(1, 0, 0, 1, 0, 0);
    hc.clearRect(0, 0, haloCv.width, haloCv.height);
    hc.setTransform(0.25, 0, 0, 0.25, 0, 0);
    drawHalo(hc, bv.x, bv.y, size, score, glowTone(color), dark, (t / 26) % 1, energy, 0.25);
    ctx.globalAlpha = bv.o;
    ctx.imageSmoothingQuality = 'high';
    ctx.drawImage(haloCv, 0, 0, W, H);
    ctx.filter = bv.b > 0.05 ? `blur(${bv.b.toFixed(1)}px)` : 'none';
    drawBlobAt(ctx, bv.x, bv.y, size, score, energy, phase, color);
    ctx.filter = 'none';
    ctx.globalAlpha = 1;
  }

  // ── S1 / S6 type ──
  put(E.meet, MEET(t)); put(E.whit, WHIT(t)); put(E.promise, PROMISE(t));
  put(E.get, GET(t)); put(E.whit2, WHIT2(t)); put(E.play, PLAY(t)); put(E.small, SMALL(t));

  // ── S2 check-in ──
  put(E.ask, ASK(t)); put(E.mword, MWORD(t)); renderMoodWord(t);
  put(E.slider, SLIDER(t));
  const kx = knobX(t) - SL_X0;
  E.slider.querySelector('.fill').style.width = kx.toFixed(1) + 'px';
  E.slider.querySelector('.knob').style.left = kx.toFixed(1) + 'px';
  put(E.pills, PILLS(t));
  const act = [1 - lin01(t, 8.05, 8.3), 0, 0];
  act[0] = easeIO(lin01(t, 8.05, 8.3)) * (1 - easeIO(lin01(t, 9.5, 9.75)));
  act[1] = 1 - easeIO(lin01(t, 8.05, 8.3));
  act[2] = easeIO(lin01(t, 9.5, 9.75));
  const pw = act.map((a) => 84 + 46 * a), gap = 12, total = pw.reduce((a, b) => a + b) + 2 * gap;
  let px = (400 - total) / 2;
  const pillCx = [];
  E.pill.forEach((p, i) => {
    const tap = TAPS.find((x) => x.pill === i);
    p.style.left = px + 'px'; p.style.width = pw[i] + 'px';
    p.style.transform = `scale(${tap ? pop(t - tap.at).toFixed(4) : 1})`;
    p.querySelector('.on').style.opacity = act[i].toFixed(3);
    p.querySelector('.i0').style.opacity = (1 - act[i]).toFixed(3);
    pillCx.push(270 - 200 + px + pw[i] / 2);
    px += pw[i] + gap;
  });
  // The finger: drags the knob, then taps two pills.
  let fv = { x: knobX(t), y: 536, s: 1, o: 0, b: 0 };
  if (t >= 5.3 && t < 7.9) {
    fv.o = lin01(t, 5.3, 5.5) * (1 - lin01(t, 7.65, 7.85));
    fv.s = mix(1.25, 1, easeIO(lin01(t, 5.3, 5.6))) * mix(1, 1.2, lin01(t, 7.6, 7.85));
  }
  TAPS.forEach(({ at, pill }) => {
    if (t >= at - 0.35 && t < at + 0.35) {
      const k = 1 - Math.abs(t - at) / 0.35;
      fv = { x: pillCx[pill], y: 690 + 6 * (1 - easeIO(lin01(t, at - 0.35, at))), s: (t < at ? mix(1.2, 1, easeIO(lin01(t, at - 0.35, at - 0.05))) : mix(0.9, 1.2, lin01(t, at, at + 0.35))), o: clamp(k * 2.2, 0, 1), b: 0 };
    }
  });
  put(E.finger, fv);
  TAPS.forEach(({ at, pill }, i) => {
    const u = lin01(t, at, at + 0.55);
    put(E.taprings[i], { x: pillCx[pill], y: 690, s: mix(0.6, 1.7, easeIO(u)), o: u > 0 && u < 1 ? 0.5 * (1 - u) : 0, b: 0 });
    // The glass tooltip floats in above the pill, springs, holds, drifts away.
    const inK = back(t, at + 0.02, at + 0.42), outK = easeIO(lin01(t, at + 1.05, at + 1.35));
    const o = clamp(lin01(t, at + 0.02, at + 0.2), 0, 1) * (1 - outK);
    put(E.tips[i], { x: pillCx[pill] + (pill === 0 ? 30 : pill === 2 ? -30 : 0), y: mix(676, 614, inK) - 18 * outK, s: mix(0.7, 1, inK), o, b: (1 - clamp(inK, 0, 1)) * 8 + outK * 8 });
  });

  // ── S3 your day ──
  BEATS_AT.forEach((tb, b) => {
    put(E.bword[b], track([[tb, { x: 270, y: 330, o: 0, b: 16, s: 0.96 }], [tb + 0.35, { o: 1, b: 0, s: 1 }], [tb + 1.65, {}], [tb + 2.0, { o: 0, b: 16, s: 1.04, y: 318 }]])(t));
  });
  E.circ.forEach((c, n) => {
    const tb = BEATS_AT[c.b], d = 0.07 * c.i;
    const base = { x: CIRC_X[c.i], y: CIRC_Y };
    let v;
    if (!c.ticked) {
      v = track([[tb + 0.12 + d, { ...base, o: 0, s: 0.7, b: 10 }], [tb + 0.5 + d, { o: 1, s: 1, b: 0 }], [tb + 1.5, {}], [tb + 1.85, { o: 0, s: 0.85, b: 10 }]])(t);
    } else {
      const tick = tb + 0.75 + 0.34 * c.k;
      v = track([[tb + 0.12 + d, { ...base, o: 0, s: 0.7, b: 10 }], [tb + 0.5 + d, { o: 1, s: 1, b: 0 }], [tb + 1.55, {}], [tb + 2.0, { x: trayX(c.slot), y: TRAY_Y, s: 0.44 }]])(t);
      if (t < tb + 1.6) v.s *= pop(t - tick);
      // In S4 the tray rises into the orbit, then into the drop.
      if (t > 17.6) {
        const k = easeIO(lin01(t, 17.65 + 0.05 * c.slot, 18.35 + 0.05 * c.slot));
        const [ox, oy] = orbitPos(c.slot, Math.max(t, 18.3));
        v.x = mix(trayX(c.slot), ox, k); v.y = mix(TRAY_Y, oy, k);
        v.s = mix(0.44, 0.52, k) * (1 - 0.6 * easeIO(lin01(t, 19.9, 20.45)));
        v.o = 1 - easeIO(lin01(t, 20.1, 20.45));
      }
      const on = easeIO(lin01(t, tick, tick + 0.18));
      c.on.style.opacity = on.toFixed(3); c.icOn.style.opacity = on.toFixed(3);
      const bk = back(t, tick + 0.05, tick + 0.4) * (1 - lin01(t, tb + 1.5, tb + 1.75));
      c.badge.style.transform = `scale(${Math.max(0, bk).toFixed(3)})`;
      const u = lin01(t, tick, tick + 0.6);
      put(E.ring[n], { x: base.x, y: base.y, s: mix(1, 1.75, easeIO(u)), o: u > 0 && u < 1 ? 0.45 * (1 - u) : 0, b: 0 });
    }
    if (!c.ticked) { c.on.style.opacity = 0; c.icOn.style.opacity = 0; c.badge.style.transform = 'scale(0)'; hide(E.ring[n]); }
    put(c.el, v);
    put(E.lab[n], track([[tb + 0.2 + d, { x: base.x, y: CIRC_Y + 92, o: 0, b: 8 }], [tb + 0.55 + d, { o: 1, b: 0 }], [tb + 1.45, {}], [tb + 1.75, { o: 0, b: 8 }]])(t));
  });

  // ── S4 insight ──
  const sv = SEE(t);
  put(E.see, { ...sv, o: 1, b: 0 });
  [...E.see.children].forEach((w, i) => {
    const a = easeIO(clamp(lin01(t, 18.3 + i * 0.08, 18.75 + i * 0.08), 0, 1));
    w.style.opacity = (a * sv.o).toFixed(3);
    w.style.filter = `blur(${((1 - a) * 14 + sv.b).toFixed(1)}px)`;
    w.style.transform = `translateY(${((1 - a) * 0.3).toFixed(3)}em)`;
  });
  E.see.style.visibility = t < 18.25 || sv.o < 0.004 ? 'hidden' : '';
  const t1 = TILE1(t), t2 = TILE2(t);
  put(E.tile1, t1); put(E.tile2, t2); put(E.quote, QUOTE(t));
  const fmt = (v) => '+' + v.toFixed(1).replace('.', L.dec);
  E.tile1.querySelector('.f-num').textContent = fmt((WITH - WITHOUT) * easeIO(lin01(t, 20.6, 21.3)));
  E.tile2.querySelector('.f-num').textContent = fmt(RUN_DELTA * easeIO(lin01(t, 21.4, 22.1)));
  if (t1.o > 0.004) {
    const c = E.tile1.querySelector('.in canvas').getContext('2d');
    c.setTransform(1, 0, 0, 1, 0, 0); c.clearRect(0, 0, 470 * dpr, 214 * dpr); c.setTransform(dpr, 0, 0, dpr, 0, 0);
    const gw = back(t, 20.45, 20.95), gwo = back(t, 20.6, 21.1);
    drawBlobAt(c, 120, 128, 76 * Math.max(gw, 0.01), WITH, 1, phase, moodColor(WITH, dark));
    drawBlobAt(c, 250, 134, 56 * Math.max(gwo, 0.01), WITHOUT, 0, (phase + 0.4) % 1, moodColor(WITHOUT, dark));
  }
  if (t2.o > 0.004) {
    const c = E.tile2.querySelector('.in canvas').getContext('2d');
    c.setTransform(1, 0, 0, 1, 0, 0); c.clearRect(0, 0, 470 * dpr, 214 * dpr); c.setTransform(dpr, 0, 0, dpr, 0, 0);
    WEEK.forEach((m, i) => {
      const k = easeIO(lin01(t, 21.35 + 0.06 * i, 21.85 + 0.06 * i));
      const y = mix(172, 168 - ((m - 4.3) / 1.4) * 82, k);
      const ran = RAN.includes(i);
      c.fillStyle = ran ? css(moodColor(m + 0.6, dark)) : css(withAlpha(moodColor(m, dark), 0.35));
      c.beginPath(); c.arc(62 + i * 58, y, ran ? 15 : 11, 0, Math.PI * 2); c.fill();
    });
  }

  // ── S5 trust: the page turns to warm paper and back ──
  if (t >= WIPE_IN[0] && t < WIPE_IN[1]) {
    wipe.style.visibility = 'visible'; wipe.style.background = '#EEDCD4';
    wipe.style.clipPath = `circle(${(1120 * easeIO(lin01(t, ...WIPE_IN))).toFixed(1)}px at 270px 480px)`;
  } else if (t >= WIPE_OUT[0] && t < WIPE_OUT[1]) {
    wipe.style.visibility = 'visible'; wipe.style.background = '#0F0C14';
    wipe.style.clipPath = `circle(${(1120 * easeIO(lin01(t, ...WIPE_OUT))).toFixed(1)}px at 270px 480px)`;
  } else wipe.style.visibility = 'hidden';
  TRUST_AT.forEach((a, i) => {
    const last = i === 2 ? 0.25 : 0;
    put(E.tword[i], track([[a - 0.05, { x: 270, y: 380, o: 0, b: 18, s: 0.97 }], [a + 0.3, { o: 1, b: 0, s: 1 }], [a + 1.05 + last, {}], [a + 1.35 + last, { o: 0, b: 16, s: 1.04, y: 368 }]])(t));
    put(E.tcard[i], track([[a + 0.12, { x: 270, y: 545, o: 0, b: 10, s: 0.96 }], [a + 0.48, { y: 515, o: 1, b: 0, s: 1 }], [a + 1.05 + last, { y: 505 }], [a + 1.35 + last, { o: 0, b: 10, y: 495 }]])(t));
  });
}

// ── Playback / scrubbing / capture ───────────────────────────────────────
const hud = document.getElementById('hud');
function fit() {
  if (capture) { frame.style.transform = ''; return; }
  const k = Math.min(innerWidth / W, (innerHeight - 30) / H);
  frame.style.transform = `scale(${k.toFixed(4)})`;
}
addEventListener('resize', fit); fit();

const nextFrame = () => new Promise((r) => requestAnimationFrame(() => r()));
window.film = {
  duration: DURATION,
  ready: false,
  async seek(t) { render(t); await nextFrame(); await nextFrame(); render(t); return t; },
};

await document.fonts.ready;
await nextFrame();
const fixed = qp.get('t');
if (fixed != null) {
  render(+fixed);
  hud.textContent = `t = ${(+fixed).toFixed(2)} s`;
} else if (!capture) {
  const t0 = performance.now(), speed = +(qp.get('speed') || 1), from = +(qp.get('from') || 0);
  const loop = (now) => {
    const t = (from + ((now - t0) / 1000) * speed) % DURATION;
    render(t);
    hud.textContent = `${t.toFixed(2)} / ${DURATION} s · ?t=… to freeze · ?lang=de`;
    requestAnimationFrame(loop);
  };
  requestAnimationFrame(loop);
} else render(0);
window.film.ready = true;
