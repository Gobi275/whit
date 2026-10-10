// Hand-drawn level glyphs and the icon helper — battery_glyph.dart / bars_glyph.dart.
import { ICONS } from './icons.js';

/** BatteryPainter as an SVG path (body ∪ nub as ONE outline, like Path.combine). */
export function batterySvg(level, size, color) {
  const s = size;
  const bodyW = s * 0.58, bodyH = s * 0.8;
  const left = (s - bodyW) / 2;
  const top = (s - bodyH) / 2 + s * 0.06;
  const right = left + bodyW, bottom = top + bodyH;
  const rb = s * 0.16;
  const nubW = bodyW * 0.42, nubH = s * 0.1, nr = nubH / 2;
  const nubL = (s - nubW) / 2, nubTop = top - nubH * 0.6;
  const cxL = nubL + nr, cxR = nubL + nubW - nr;
  const cy = nubTop + nr;
  const dy = top - cy;
  const dx = Math.sqrt(Math.max(0, nr * nr - dy * dy));
  const f = (v) => v.toFixed(3);
  const d = [
    `M${f(left + rb)} ${f(top)}`,
    `L${f(cxL - dx)} ${f(top)}`,
    `A${f(nr)} ${f(nr)} 0 0 1 ${f(cxL)} ${f(nubTop)}`,
    `L${f(cxR)} ${f(nubTop)}`,
    `A${f(nr)} ${f(nr)} 0 0 1 ${f(cxR + dx)} ${f(top)}`,
    `L${f(right - rb)} ${f(top)}`,
    `A${f(rb)} ${f(rb)} 0 0 1 ${f(right)} ${f(top + rb)}`,
    `L${f(right)} ${f(bottom - rb)}`,
    `A${f(rb)} ${f(rb)} 0 0 1 ${f(right - rb)} ${f(bottom)}`,
    `L${f(left + rb)} ${f(bottom)}`,
    `A${f(rb)} ${f(rb)} 0 0 1 ${f(left)} ${f(bottom - rb)}`,
    `L${f(left)} ${f(top + rb)}`,
    `A${f(rb)} ${f(rb)} 0 0 1 ${f(left + rb)} ${f(top)}Z`,
  ].join('');
  const inset = s * 0.15;
  const iL = left + inset, iR = right - inset, iT = top + inset, iB = bottom - inset;
  const fh = (iB - iT) * (Math.max(0, Math.min(3, level)) / 3);
  const fill = fh > 0
    ? `<rect x="${f(iL)}" y="${f(iB - fh)}" width="${f(iR - iL)}" height="${f(fh)}" rx="${f(s * 0.05)}" fill="${color}"/>`
    : '';
  return `<svg width="${f(s)}" height="${f(s)}" viewBox="0 0 ${f(s)} ${f(s)}" aria-hidden="true"><path d="${d}" fill="none" stroke="${color}" stroke-width="${f(s * 0.095)}" stroke-linejoin="round"/>${fill}</svg>`;
}

/** BarsPainter as SVG. */
export function barsSvg(level, size, color) {
  const s = size, heights = [0.44, 0.72, 1.0];
  const barW = s * 0.15, gap = s * 0.15, totalW = 3 * barW + 2 * gap;
  const startX = (s - totalW) / 2, maxH = s * 0.64, baseY = s / 2 + maxH / 2;
  let out = '';
  for (let i = 0; i < 3; i++) {
    const bh = maxH * heights[i];
    out += `<rect x="${startX + i * (barW + gap)}" y="${baseY - bh}" width="${barW}" height="${bh}" rx="${barW / 2}" fill="${color}" fill-opacity="${i < level ? 1 : 0.22}"/>`;
  }
  return `<svg width="${s}" height="${s}" viewBox="0 0 ${s} ${s}" aria-hidden="true">${out}</svg>`;
}

/** WhitIcon: the app's fitted Hugeicons glyph at [size] in currentColor. */
export function icon(name, size = 20, cls = '') {
  const i = ICONS[name];
  if (!i) return '';
  // pathLength=1 on every stroke lets CSS redraw any glyph (hover / reveal).
  const d = i.d.replace(/<(path|circle)\b/g, '<$1 pathLength="1"');
  return `<svg class="ic ic-${name} ${cls}" width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="${i.sw}" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${d}</svg>`;
}
