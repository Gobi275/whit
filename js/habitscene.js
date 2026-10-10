// Chapter 05: the title alone, then the habits list on the glass phone, and
// beside it, a habit's detail sheet made of glass: habits are analysable too.
// The pills are children of the phone's own transform (its overlay layer),
// so they share its perspective exactly while they sit on the screen; then
// they float a little off it. Swiping "water" LEFT ticks it off (like the
// app) and closes ITS weekly ring; the badge says so.
import { clamp, css } from './color.js';
import { moodColor, themeFor } from './theme.js';
import { icon } from './glyphs.js';
import { track, place, seg, Steps, Title } from './story.js';
import { phoneHTML, initPhone, appY, isDark, blobImg } from './phone.js';
import { glass } from './squircle.js';

export const STEPS = 4;
const IN = (i) => ({ x: 0, y: appY(240 + i * 100), s: 1, rz: 0, z: 0 });
const OUT = [[-0.04, -0.01, -1.2], [0.05, 0, 1], [-0.03, 0.015, -0.7]];
const PILLS = OUT.map(([x, y, r], i) => track([
  [1.0, IN(i)], [1.4 + i * 0.05, { x, y: IN(i).y + y, s: 1.14, rz: r, z: 1 }], [3.5, {}], [3.9, IN(i)],
]));
const PHONE = track([[0.45, { o: 0, s: 0.92, b: 16 }], [1.0, { o: 1, s: 1, b: 0 }]]);
const SHEET = track([[0.95, { x: 0.56, o: 0, b: 14, s: 0.95 }], [1.35, { x: 0.6, o: 1, b: 0, s: 1, z: 1 }], [3.55, {}], [3.95, { x: 0.64, o: 0, b: 14 }]]);
const BADGE = track([[2.6, { x: 0.3, y: appY(340), o: 0, s: 0.7 }, { x: 0, y: appY(340) - 0.08 }], [2.85, { o: 1, s: 1, z: 1 }], [3.35, {}], [3.6, { o: 0, s: 0.85 }]]);
const GLOW = track([[0.5, { o: 0, s: 0.85 }], [1.0, { o: 0.9, s: 1 }]]);
const ACT = [1, 1, 0, 1, 1, 0, 1, 1, 1, 1, 0, 1, 1, 1, 0, 1, 1, 1, 1, 1, 0, 1, 1, 0, 1, 1, 1, 1, 1, 1, 1, 0, 1, 1, 1];

export class HabitScene {
  constructor(stage) { this.stage = stage; }

  build(L) {
    this.L = L;
    const dark = isDark(), hd = L.hd;
    const page = `<div class="pg ph-hab"><div class="ph-hab-h"><span class="ph-hab-t">${L.habitsTitle}</span><i>${icon('target', 20)}</i><i>${icon('plus', 20)}</i></div></div>`;
    const pills = L.habits.map(([ic, n, done, goal, streak], i) => `
      <div class="fl h-pill" data-i="${i}">
        <div class="hp-act">${icon('check', 24)}</div>
        <div class="hp-face glass">
          <span class="hp-slot">${goal ? `<svg class="hp-ring" viewBox="0 0 46 46"><circle class="bg" cx="23" cy="23" r="20.5"/><circle class="fg" cx="23" cy="23" r="20.5" pathLength="1" style="stroke-dasharray:${(done / goal).toFixed(3)} 1"/></svg>` : ''}<span class="hp-disc">${icon(ic, 20)}</span></span>
          <span class="hp-txt"><span class="hp-name">${n}${goal ? ` <em>${done}/${goal}</em>` : ''}</span><span class="hp-st"><span class="hp-sn">${streak}</span>${L.streak}<i></i></span></span>
          <span class="hp-tick">${icon('check', 18)}</span>
        </div>
      </div>`).join('');
    const [wic, wname] = L.habits[1];
    const sheet = `
      <div class="fl h-sheet" data-sq><div class="sq-body">
        <div class="hs-head"><span class="hs-disc">${icon(wic, 22)}</span><div><div class="hs-name">${wname}</div><div class="hs-sub">${hd.perWeek}</div></div></div>
        <div class="hs-stats">
          <div><b class="hs-streak">25${hd.days}</b><span>${hd.streak}</span></div><div><b>112</b><span>${hd.total}</span></div><div><b>31${hd.days}</b><span>${hd.record}</span></div>
        </div>
        <div class="hs-h">${hd.activity}</div>
        <div class="hs-grid">${ACT.map((a) => `<i class="${a ? 'on' : ''}"></i>`).join('')}</div>
        <div class="hs-h">${hd.mood}</div>
        <div class="hs-mood">
          <div><img alt="" data-m="5.3" src="${blobImg(5.3, 0, 40, dark)}"><b>5,3</b><span>${hd.with}</span></div>
          <div><img alt="" data-m="4.8" src="${blobImg(4.8, 0, 40, dark)}"><b>4,8</b><span>${hd.without}</span></div>
        </div>
        <div class="hs-h">${hd.goal}</div>
        <div class="hs-goal"><i class="on"></i><i class="on"></i><i class="g3"></i></div>
      </div></div>`;
    this.stage.innerHTML = `
      <div class="st-viz"><div class="anchor">
        <div class="fl glow h-glow"></div>
        ${phoneHTML('h-phone', [page], pills + `<div class="fl h-badge glass">${icon('champion', 18)}<span>${L.goalDone}</span></div>`)}
        ${sheet}
      </div></div>
      <div class="st-title t-a"></div>
      <div class="st-steps"></div>`;
    const q = (s) => this.stage.querySelector(s), qa = (s) => [...this.stage.querySelectorAll(s)];
    this.el = { phone: q('.h-phone'), pills: qa('.h-pill'), badge: q('.h-badge'), glow: q('.h-glow'), sheet: q('.h-sheet'), g3: q('.hs-goal .g3'), streak: q('.hs-streak'), moods: qa('.hs-mood img') };
    this.water = this.el.pills[1];
    this.waterRing = this.water.querySelector('.hp-ring .fg');
    this.waterGoal = this.water.querySelector('.hp-name em');
    this.waterStreak = this.water.querySelector('.hp-sn');
    initPhone(this.el.phone);
    glass(this.el.sheet, { radius: (w) => w * 0.165, shadow: 1.1 });
    this.title = new Title(q('.t-a'), L.hH);
    this.steps = new Steps(q('.st-steps'), L.hSteps, { offsets: [1, 2, 3] });
  }

  update(s, { H, mobile, t, enter, px = 0, py = 0 }) {
    const E = this.el;
    this.title.update(Math.max(seg(enter, 0.35, 1), s > 0.01 ? 1 : 0), seg(s, 0.3, 0.75));
    const pv = PHONE(s, mobile);
    pv.ry += px * 6; pv.rx += -py * 4; pv.y += Math.sin(t * 1.1) * 0.004;
    place(E.phone, pv, H, 1);
    const swipe = seg(s, 2.1, 2.5) * (1 - seg(s, 2.6, 2.85));
    const done = s > 2.45;
    const ring = (2 + seg(s, 2.5, 2.8)) / 3;
    E.pills.forEach((el, i) => {
      const v = PILLS[i](s, mobile); v.y += Math.sin(t * 1.15 + i * 1.7) * 0.004 * v.z;
      place(el, v, H, 1);
      if (i === 0) el.classList.add('done');
    });
    this.water.style.setProperty('--sw', swipe.toFixed(4));
    this.water.classList.toggle('done', done);
    this.water.classList.toggle('armed', swipe > 0.72);
    this.waterRing.style.strokeDasharray = `${ring.toFixed(3)} 1`;
    const full = ring > 0.995;
    this.waterGoal.textContent = full ? '3/3' : '2/3';
    this.waterStreak.textContent = done ? 26 : 25;
    E.g3.classList.toggle('on', full);
    E.streak.textContent = (done ? 26 : 25) + this.L.hd.days;
    place(E.badge, BADGE(s, mobile), H, 1);
    const sv = SHEET(s, mobile); sv.y += Math.sin(t * 1.05 + 2) * 0.005; place(E.sheet, sv, H, 1);
    E.glow.style.setProperty('--mood', css(themeFor(isDark()).success));
    place(E.glow, GLOW(s, mobile), H, 1);
    this.steps.update(clamp(s, 0, 3.97));
  }

  /** Theme flipped: the resting blobs are images, redraw them. */
  retheme() {
    const dark = isDark();
    this.el?.moods.forEach((im) => (im.src = blobImg(+im.dataset.m, 0, 40, dark)));
  }
}
