// Cookieless counting (GoatCounter; privacy policy section 11). Nothing is
// stored in the browser; the pageview counts itself when count.js loads, and
// these are the few events on top: how far the story is read, which Play
// button is pressed, whether anyone steers the hero blob to a new word.
//
// Each event counts once per page load, so "reached chapter 4" means visitors,
// not scroll passes. Blocked or not yet loaded count.js = silently nothing.

const PLAY = 'https://play.google.com/store/apps/details?id=app.whit.mobile';

/** The Play link for one placement. The referrer carries UTM tags that the
 *  Play Console reports as installs per source (Statistiken → Akquisition). */
export function playUrl(from) {
  const utm = `utm_source=website&utm_medium=web&utm_campaign=landing&utm_content=${from || 'other'}`;
  return `${PLAY}&referrer=${encodeURIComponent(utm)}`;
}

const sent = new Set();
const queue = [];
export function track(name) {
  if (sent.has(name)) return;
  sent.add(name);
  queue.push(name);
  flush();
}
function flush() {
  const gc = window.goatcounter;
  if (!gc || !gc.count) return;
  while (queue.length) gc.count({ path: queue.shift(), event: true });
}
addEventListener('load', flush);

// Chapter slugs stay English whatever the page language, so DE and EN visits
// land in the same rows.
const CHAPTERS = ['check-in', 'context', 'encrypted', 'patterns', 'habits', 'for-everyone', 'get-it'];
export const trackChapter = (ch) => track(`chapter-${ch + 1}-${CHAPTERS[ch]}`);
