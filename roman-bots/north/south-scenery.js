import {drawQuestAtlas} from './quest-art.js?v=roman32';
import * as world from './south-world.js?v=roman32';
import { drawBot } from '../art.js?v=roman32';
import { normalizeSlot } from '../data.js?v=roman32';

const { WIDTH, HEIGHT, HOME, KING, CAMPS, ENCOUNTERS, LANDSCAPES, LANDMARKS, tileAt, passable } = world;
const TAU = Math.PI * 2;
const INK = '#315453', GOLD = '#f4d582';
const sets = value => value instanceof Set ? value : new Set(Array.isArray(value) ? value : []);
const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));
const hash = (x, y) => {
  let n = Math.imul(Math.floor(x * 13) + 719, 374761393) ^ Math.imul(Math.floor(y * 17) + 953, 668265263);
  n = Math.imul(n ^ (n >>> 13), 1274126177);
  return ((n ^ (n >>> 16)) >>> 0) / 4294967296;
};
const colors = [
  { ground: '#a7d4bd', dark: '#518e80', road: '#e7ecda', stone: '#f1f3e4', water: '#248f9f' },
  { ground: '#c8dcca', dark: '#a17999', road: '#f1e9df', stone: '#e9eeeb', water: '#43b7b3' },
  { ground: '#8fbb83', dark: '#456e61', road: '#e1e6bf', stone: '#edf0d8', water: '#51a8a0' },
  { ground: '#b8b3bb', dark: '#9a5368', road: '#eadfdc', stone: '#e8e4eb', water: '#4a9fbd' },
  { ground: '#a4cbbf', dark: '#809baf', road: '#e6ece8', stone: '#f7f2e5', water: '#3c9fbe' }
];
const districts = [...LANDSCAPES].sort((a, b) => a.top - b.top);
const zone = y => Math.max(0, districts.findIndex(r => y >= r.top && y < r.bottom));
function rect(c, x, y, w, h, fill) { c.fillStyle = fill; c.fillRect(x, y, w, h); }
function oval(c, x, y, rx, ry, fill) {
  c.beginPath(); c.ellipse(x, y, rx, ry, 0, 0, TAU); c.fillStyle = fill; c.fill();
}
function poly(c, points, fill, stroke = null, width = .045) {
  c.beginPath(); points.forEach(([x, y], i) => i ? c.lineTo(x, y) : c.moveTo(x, y)); c.closePath();
  c.fillStyle = fill; c.fill();
  if (stroke) { c.strokeStyle = stroke; c.lineWidth = width; c.stroke(); }
}
function line(c, x, y, xx, yy, color, width = .04) {
  c.beginPath(); c.moveTo(x, y); c.lineTo(xx, yy); c.strokeStyle = color; c.lineWidth = width; c.stroke();
}
function arc(c, x, y, rx, ry, start, end, color, width) {
  c.beginPath(); c.ellipse(x, y, rx, ry, 0, start, end); c.strokeStyle = color; c.lineWidth = width; c.stroke();
}
function curve(c, points, color, width) {
  c.beginPath(); c.moveTo(points[0], points[1]); c.bezierCurveTo(...points.slice(2));
  c.strokeStyle = color; c.lineWidth = width; c.stroke();
}
function visible(p, b, m = 7) { return p.x + m >= b.left && p.x - m <= b.right && p.y + m >= b.top && p.y - m <= b.bottom; }
function blocked(x, y) { return x >= 0 && y >= 0 && x < WIDTH && y < HEIGHT && !passable(x + .5, y + .5) && tileAt(x, y) !== 'water'; }
function footprint(x, y, w, h) {
  if (x < 0 || y < 0 || x + w >= WIDTH || y + h >= HEIGHT) return false;
  for (let yy = Math.floor(y); yy < Math.ceil(y + h); yy++) for (let xx = Math.floor(x); xx < Math.ceil(x + w); xx++) if (!blocked(xx, yy)) return false;
  return true;
}
function cellClip(c, b, predicate) {
  c.beginPath();
  for (let y = Math.max(0, Math.floor(b.top)); y < Math.min(HEIGHT, Math.ceil(b.bottom)); y++)
    for (let x = Math.max(0, Math.floor(b.left)); x < Math.min(WIDTH, Math.ceil(b.right)); x++)
      if (predicate(x, y)) c.rect(x, y, 1, 1);
  c.clip();
}

function palm(c, w, h, n, time) {
  const x = w * .48, y = h * .43, sway = Math.sin(time * .7 + n * 8) * w * .025;
  oval(c, w * .5, h * .9, w * .35, h * .07, '#244b5630');
  curve(c, [w * .6, h * .9, w * .4, h * .69, w * .62, h * .55, x, y], '#8e7966', w * .085);
  curve(c, [w * .59, h * .86, w * .46, h * .65, w * .6, h * .52, x, y], '#d1bc8b', w * .026);
  for (let i = 0; i < 7; i++) {
    const a = i / 7 * TAU, xx = w * .49 + Math.cos(a) * w * .43 + sway, yy = h * .36 + Math.sin(a) * h * .23;
    poly(c, [[x, y], [(x + xx) / 2, Math.min(y, yy) - h * .15], [xx, yy + h * .11], [(x + xx) / 2, (y + yy) / 2]], i % 2 ? '#287e69' : '#64ab79');
    line(c, x, y, xx, yy + h * .1, '#b0cf8f', .025);
  }
  for (const dx of [-.07, .05]) oval(c, x + dx * w, y + h * .04, w * .05, h * .045, '#b88d57');
}
function olive(c, w, h, n) {
  oval(c, w * .53, h * .91, w * .4, h * .07, '#234f4930');
  curve(c, [w * .48, h * .9, w * .74, h * .65, w * .3, h * .59, w * .5, h * .39], '#697669', w * .1);
  line(c, w * .49, h * .69, w * .26, h * .43, '#697669', w * .055);
  for (let i = 0; i < 7; i++) {
    const a = i * 2.4, x = w * (.5 + Math.cos(a) * .23), y = h * (.35 + Math.sin(a) * .16);
    oval(c, x, y, w * (.2 + hash(i, n) * .08), h * .15, ['#447766', '#679779', '#a3c68d'][i % 3]);
    for (let j = 0; j < 3; j++) line(c, x - w * .09 + j * w * .08, y, x - w * .04 + j * w * .08, y - h * .035, '#c9dab0', .025);
  }
  for (let i = 0; i < 5; i++) oval(c, w * (.22 + hash(i, n + 7) * .55), h * (.29 + hash(n, i) * .22), w * .021, h * .026, '#51486b');
}
function reeds(c, w, h, n, time) {
  oval(c, w * .5, h * .8, w * .45, h * .14, '#b39aaf55');
  for (let i = 0; i < 11; i++) {
    const x = w * (.1 + hash(i, n) * .8), y = h * (.18 + hash(n, i) * .44), sway = Math.sin(time + i + n) * w * .025;
    curve(c, [x, h * .87, x + sway, h * .6, x - w * .06, y, x + sway, y], '#729b85', .035);
    oval(c, x + sway, y, w * .035, h * .13, i % 3 ? '#f8eceb' : '#dd9fba');
  }
}
function ridge(c, w, h, n) {
  const crest = [[.05 * w, .58 * h], [.15 * w, .23 * h], [.31 * w, .32 * h], [.45 * w, .06 * h], [.68 * w, .2 * h], [.84 * w, .12 * h], [.96 * w, .53 * h]];
  poly(c, [...crest, [.92 * w, .84 * h], [.62 * w, .97 * h], [.29 * w, .9 * h], [.08 * w, .97 * h]], '#96536d', '#614f6c');
  poly(c, [...crest, [.74 * w, .45 * h], [.53 * w, .38 * h], [.35 * w, .55 * h]], '#d78889');
  poly(c, [[.45 * w, .06 * h], [.53 * w, .38 * h], [.62 * w, .97 * h], [.48 * w, .78 * h]], '#b85b70');
  for (let i = 0; i < 4; i++) {
    const y = h * (.5 + i * .105), offset = hash(i, n) * w * .12;
    line(c, w * .12 + offset, y, w * .38 + offset, y - h * .05, i % 2 ? '#f1b2aa' : '#683e65', .05);
    line(c, w * .67, y - h * .07, w * .88, y - h * .13, '#df999e', .045);
  }
  oval(c, w * .19, h * .82, w * .08, h * .07, '#588980');
}
function column(c, x, y, h, w = .45) {
  rect(c, x - w * .65, y - .13, w * 1.3, .22, '#a2b8b5');
  rect(c, x - w / 2, y - h, w, h, '#f7f1df');
  rect(c, x + w * .15, y - h, w * .35, h, '#b5cfcc');
  for (const dx of [-.22, 0]) line(c, x + w * dx, y - h + .15, x + w * dx, y - .25, '#d6ddce', .025);
  rect(c, x - w * .72, y - h - .14, w * 1.44, .22, '#fff7df');
  oval(c, x - w * .6, y - h, w * .19, w * .13, '#ccb882');
  oval(c, x + w * .6, y - h, w * .19, w * .13, '#ccb882');
}
function pavilion(c, w, h, palace = false) {
  oval(c, w * .51, h * .92, w * .48, h * .07, '#34556b30');
  rect(c, w * .06, h * .47, w * .88, h * .42, '#c1d0cc');
  rect(c, w * .1, h * .43, w * .8, h * .43, '#f6f1e2');
  rect(c, w * .14, h * .6, w * .72, h * .08, '#398caa');
  const count = palace ? 7 : 4;
  for (let i = 0; i < count; i++) {
    const x = w * (.18 + i / (count - 1) * .64);
    rect(c, x - w * .032, h * .52, w * .064, h * .28, '#43687b');
    column(c, x, h * .83, h * .41, w * .036);
  }
  rect(c, w * .08, h * .4, w * .84, h * .06, '#d3b477');
  poly(c, [[w * .04, h * .39], [w * .5, h * .13], [w * .96, h * .39]], '#f9f0d8', INK);
  poly(c, [[w * .17, h * .35], [w * .5, h * .19], [w * .83, h * .35]], '#3288ab');
  oval(c, w * .5, h * .29, w * .045, h * .04, GOLD);
  for (let i = 0; i < 9; i++) poly(c, [[w * (.15 + i * .08), h * .45], [w * (.18 + i * .08), h * .49], [w * (.21 + i * .08), h * .45]], '#3e9bb8');
  for (let i = 0; i < 3; i++) rect(c, w * (.06 - i * .015), h * (.86 + i * .035), w * (.88 + i * .03), h * .03, i % 2 ? '#bdcecc' : '#f5f0e1');
  if (palace) for (const side of [.09, .91]) {
    rect(c, w * (side - .055), h * .19, w * .11, h * .67, '#edf1e8');
    rect(c, w * (side - .06), h * .24, w * .12, h * .07, '#337eaa');
    for (let i = 0; i < 3; i++) rect(c, w * (side - .06 + i * .045), h * .12, w * .03, h * .09, '#fff5df');
    rect(c, w * (side - .018), h * .39, w * .036, h * .17, '#47768a');
  }
}
function wall(c, w, h, n) {
  rect(c, w * .04, h * .3, w * .92, h * .57, '#adbfc4');
  rect(c, w * .04, h * .25, w * .92, h * .48, '#f5f2e5');
  rect(c, w * .04, h * .47, w * .92, h * .07, '#338eae');
  for (let i = 0; i < 6; i++) {
    rect(c, w * (.04 + i * .165), h * .12, w * .09, h * .2, '#fbf6e6');
    line(c, w * (.07 + i * .15), h * .62, w * (.15 + i * .15), h * .62, '#c3d1ca', .035);
  }
  for (const x of [.19, .72]) rect(c, w * x, h * .32, w * .035, h * .13, '#487284');
  if (n > .6) poly(c, [[w * .47, h * .35], [w * .55, h * .35], [w * .55, h * .66], [w * .51, h * .59], [w * .47, h * .66]], '#935a94');
}
function palaceBounds() {
  const site = LANDMARKS.find(s => s.kind === 'palace'), f = site?.footprint;
  return {
    left: f?.left ?? f?.x ?? 34, top: f?.top ?? f?.y ?? 185,
    right: f?.right ?? ((f?.x ?? 34) + (f?.width ?? f?.w ?? 16)),
    bottom: f?.bottom ?? ((f?.y ?? 185) + (f?.height ?? f?.h ?? 5))
  };
}

// Large authored anchors are fitted before irregular planting. Every raised
// silhouette fits entirely on blocked cells, including its projected crown.
function buildFeatures() {
  const features = [];
  const add = f => {
    if (!footprint(f.x, f.y, f.w, f.h)) return false;
    const palace = palaceBounds();
    if (f.x < palace.right && f.x + f.w > palace.left && f.y < palace.bottom && f.y + f.h > palace.top) return false;
    if (features.some(a => f.x < a.x + a.w + .25 && f.x + f.w + .25 > a.x && f.y < a.y + a.h + .25 && f.y + f.h + .25 > a.y)) return false;
    features.push(f); return true;
  };
  for (const site of LANDMARKS) {
    if (site.kind === 'fortress' || site.kind === 'palace') continue;
    const k = zone(site.y), kind = k === 4 ? 'pavilion' : k === 0 ? 'pavilion' : k === 3 ? 'ridge' : k === 2 ? 'olive' : 'reeds';
    const w = kind === 'palace' ? 15 : kind === 'pavilion' ? 10 : 7, h = kind === 'palace' ? 9 : 6;
    let placed = false;
    for (const size of [1, .75, .5]) {
      for (const [dx, dy] of [[0, 0], [-9, -4], [9, -4], [-16, 0], [16, 0], [0, -10], [-20, -8], [20, -8]]) {
        if (add({ x: site.x + dx - w * size / 2, y: site.y + dy - h * size, w: w * size, h: h * size, kind, n: hash(site.x, site.y) })) { placed = true; break; }
      }
      if (placed) break;
    }
  }
  // Dedicated healing shelters use the same footprint rule as other buildings.
  for (const site of CAMPS) {
    let placed = false;
    for (const dy of [-4, 2, -7, 5]) {
      for (const dx of [-5, 3, -8, 6]) if (add({ x: site.x + dx, y: site.y + dy, w: 2.5, h: 2.7, kind: 'tent', site, n: 0 })) { placed = true; break; }
      if (placed) break;
    }
  }
  for (let i = 0; i < 1700; i++) {
    const x = 1 + hash(i, 31) * (WIDTH - 8), y = 1 + hash(17, i) * (HEIGHT - 7), k = zone(y), n = hash(i, 79);
    const kind = k === 0 ? (n > .68 ? 'column' : 'palm') : k === 1 ? 'reeds' : k === 2 ? (n > .85 ? 'pavilion' : 'olive') : k === 3 ? 'ridge' : (n > .4 ? 'wall' : 'palm');
    const w = kind === 'ridge' ? 4 + n * 6 : kind === 'wall' ? 4 + n * 4 : kind === 'pavilion' ? 5 : kind === 'column' ? 1.7 : 2 + n * 2;
    const h = kind === 'ridge' ? 3 + n * 3 : kind === 'wall' ? 3 : kind === 'column' ? 3.4 : kind === 'pavilion' ? 4 : 2.4 + hash(i, 29) * 2;
    add({ x, y, w, h, kind, n });
  }
  return features.sort((a, b) => a.y + a.h - b.y - b.h);
}
let features;
function tent(c, w, h) {
  poly(c, [[w * .08, h * .87], [w * .43, h * .12], [w * .92, h * .87]], '#f7f0e4', INK);
  poly(c, [[w * .43, h * .12], [w * .6, h * .87], [w * .92, h * .87]], '#57a596');
  poly(c, [[w * .28, h * .87], [w * .43, h * .45], [w * .57, h * .87]], '#35626a');
  line(c, w * .73, h * .48, w * .73, h * .7, '#fff6dc', .12);
  line(c, w * .64, h * .59, w * .82, h * .59, '#fff6dc', .12);
  line(c, w * .43, h * .12, w * .43, h * .02, '#bc9e60', .04);
}
function scenery(c, b, time) {
  features ??= buildFeatures();
  for (const f of features) {
    if (f.x > b.right || f.x + f.w < b.left || f.y > b.bottom || f.y + f.h < b.top) continue;
    // Recheck rather than retaining art over roads if the world carves terrain.
    if (!footprint(f.x, f.y, f.w, f.h)) continue;
    c.save(); c.translate(f.x, f.y);
    if (f.kind === 'palm') palm(c, f.w, f.h, f.n, time);
    else if (f.kind === 'olive') olive(c, f.w, f.h, f.n);
    else if (f.kind === 'reeds') reeds(c, f.w, f.h, f.n, time);
    else if (f.kind === 'ridge') ridge(c, f.w, f.h, f.n);
    else if (f.kind === 'wall') wall(c, f.w, f.h, f.n);
    else if (f.kind === 'tent') tent(c, f.w, f.h);
    else if (f.kind === 'column') column(c, f.w * .5, f.h * .92, f.h * .78, f.w * .5);
    else pavilion(c, f.w, f.h, f.kind === 'palace');
    c.restore();
  }
}

function ground(c, b, time) {
  for (const [i, r] of districts.entries()) rect(c, b.left, Math.max(b.top, r.top), b.right - b.left, Math.max(0, Math.min(b.bottom, r.bottom) - Math.max(b.top, r.top)), colors[i % 5].ground);
  for (let y = Math.floor(b.top); y < Math.ceil(b.bottom); y++) for (let x = Math.floor(b.left); x < Math.ceil(b.right); x++) {
    const tile = tileAt(x, y), k = zone(y), p = colors[k % 5], n = hash(x, y);
    if (tile === 'water') continue;
    if (['path', 'road', 'bridge'].includes(tile)) {
      rect(c, x, y, 1.005, 1.005, p.road);
      if (n > .76) line(c, x + .2, y + .7, x + .61, y + .64, '#758d793d', .025);
    } else if (passable(x + .5, y + .5) && ['stone', 'ruin', 'plaza'].includes(tile)) {
      rect(c, x, y, 1.005, 1.005, p.stone);
      line(c, x, y + .98, x + 1, y + .98, '#83aaa545', .025);
      if (k === 4 && (x + y) % 4 === 0) poly(c, [[x + .4, y + .5], [x + .5, y + .4], [x + .6, y + .5], [x + .5, y + .6]], '#438eab70');
    } else if (blocked(x, y)) {
      rect(c, x, y, 1.005, 1.005, [ '#729f8d25', '#e8b6d13d', '#3b82562c', '#a65d7837', '#628dad25' ][k % 5]);
    } else if (n > .83) {
      for (let i = 0; i < 3; i++) {
        const xx = x + .18 + hash(i, x + y) * .6, yy = y + .25 + hash(y + i, x) * .5;
        line(c, xx, yy, xx + .03, yy - .12, '#477f6b78', .025);
        if (k === 2 || k === 1) oval(c, xx + .03, yy - .13, .045, .035, k === 2 ? '#b985d4' : '#fff4ed');
      }
    }
  }
  c.save(); cellClip(c, b, (x, y) => tileAt(x, y) === 'water');
  const sea = c.createLinearGradient(0, b.top, WIDTH, b.bottom);
  sea.addColorStop(0, '#237e9c'); sea.addColorStop(.5, '#36b9b5'); sea.addColorStop(1, '#78d4c5');
  rect(c, b.left, b.top, b.right - b.left, b.bottom - b.top, sea);
  for (let y = Math.floor(b.top); y < Math.ceil(b.bottom); y++) for (let x = Math.floor(b.left); x < Math.ceil(b.right); x++) {
    if (tileAt(x, y) !== 'water') continue;
    for (const [dx, dy] of [[0, 1], [0, -1], [1, 0], [-1, 0]]) if (tileAt(x + dx, y + dy) !== 'water') {
      if (dx) line(c, x + (dx > 0 ? .94 : .06), y, x + (dx > 0 ? .94 : .06), y + 1, '#dcf6dc90', .12);
      else line(c, x, y + (dy > 0 ? .94 : .06), x + 1, y + (dy > 0 ? .94 : .06), '#dcf6dc90', .12);
    }
    if (hash(x, y) > .79) arc(c, x + .5 + Math.sin(time + y) * .08, y + .5, .4, .09, .1, 2.8, '#c6f4e29a', .035);
  }
  // A naval cothon, with radial berths and a central admiralty island. The
  // water mask prevents the ornamental basin from overwriting navigable land.
  const harbor = LANDMARKS.find(s => s.kind === 'harbor-basin');
  // The current terrain reservoir is (43,26), rx=7, ry=5. Older landmark
  // hints pointed at the (62,21) battle clearing, not the reservoir itself.
  const hx = harbor && tileAt(harbor.x, harbor.y) === 'water' ? harbor.x : 43;
  const hy = harbor && tileAt(harbor.x, harbor.y) === 'water' ? harbor.y : 26;
  for (let i = 0; i < 19; i++) {
    const a = i / 19 * TAU;
    line(c, hx + Math.cos(a) * 4.8, hy + Math.sin(a) * 3.35, hx + Math.cos(a) * 6.5, hy + Math.sin(a) * 4.6, '#e5ead5', .14);
  }
  arc(c, hx, hy, 6.7, 4.7, .25, TAU - .25, '#f5f1d7', .32);
  arc(c, hx, hy, 4.8, 3.35, .25, TAU - .25, '#75d9ce', .12);
  oval(c, hx, hy, 1.35, .9, '#c5d7be');
  c.save(); c.translate(hx - 1.15, hy - 1.1); pavilion(c, 2.3, 1.6); c.restore();
  c.restore();
  // Project the surviving outer quay only onto solid banks, not the carved
  // streets. The partial circular remains intentionally expose road cutouts.
  c.save(); cellClip(c, b, blocked);
  arc(c, hx, hy, 7, 5, .25, TAU - .25, '#f8f1dd', .38);
  arc(c, hx, hy, 7.3, 5.25, .25, TAU - .25, '#739d9b', .12);
  c.restore();
  // Bridge decking comes from the world rather than guessed route geometry.
  for (const bridge of world.BRIDGES ?? []) {
    if (bridge.right < b.left || bridge.left > b.right || bridge.bottom < b.top || bridge.top > b.bottom) continue;
    rect(c, bridge.left, bridge.top, bridge.right - bridge.left, bridge.bottom - bridge.top, '#e6eadc');
    const horizontal = bridge.right - bridge.left > bridge.bottom - bridge.top;
    if (horizontal) for (let x = bridge.left; x < bridge.right; x += .6) line(c, x, bridge.top, x, bridge.bottom, '#729b9b', .035);
    else for (let y = bridge.top; y < bridge.bottom; y += .6) line(c, bridge.left, y, bridge.right, y, '#729b9b', .035);
  }
}
function perimeterTerrain(c, b, time) {
  // Cell-sized, low silhouettes survive where full trees cannot fit. Keep every
  // stroke inside blocking cells so roads and reserved fighting ground stay bare.
  for (let y = Math.max(0, Math.floor(b.top)); y < Math.min(HEIGHT, Math.ceil(b.bottom)); y++) for (let x = Math.max(0, Math.floor(b.left)); x < Math.min(WIDTH, Math.ceil(b.right)); x++) {
    const k = zone(y);
    if (k === 3 || !blocked(x, y) || ![[0, 1], [0, -1], [-1, 0], [1, 0]].some(([dx, dy]) => passable(x + dx + .5, y + dy + .5))) continue;
    const n = hash(x + 47, y - 13);
    c.save(); c.translate(x, y);
    oval(c, .5, .74, .4, .13, '#31545325');
    if (k === 2) {
      line(c, .51, .76, .48, .44, '#697669', .065);
      line(c, .49, .62, .27, .47, '#697669', .045);
      for (const [xx, yy, r] of [[.29, .45, .19], [.65, .46, .23], [.48, .32, .24]]) {
        oval(c, xx, yy, r, .14, yy < .4 ? '#a3c68d' : '#679779');
        line(c, xx - .07, yy, xx + .06, yy - .035, '#d3dfb0', .025);
      }
      if (n > .45) for (const xx of [.34, .64]) oval(c, xx, .48, .035, .045, '#51486b');
    } else if (k === 1) {
      for (let i = 0; i < 3; i++) {
        const xx = .26 + i * .23, yy = .27 + hash(i, n) * .13, sway = Math.sin(time * .8 + x + i) * .025;
        line(c, xx, .75, xx + sway, yy, '#5d8c76', .035);
        oval(c, xx + sway, yy, .045, .11, i === 1 ? '#dd9fba' : '#f8eceb');
      }
    } else if (k === 0) {
      poly(c, [[.12, .63], [.23, .46], [.43, .48], [.51, .67], [.35, .78], [.14, .75]], '#8eb5a5', INK, .025);
      poly(c, [[.23, .46], [.43, .48], [.51, .58], [.28, .59], [.12, .63]], '#d2dfc7');
      for (const [xx, yy] of [[.65, .38], [.8, .46], [.58, .55]]) line(c, .7, .73, xx, yy, '#548a70', .045);
      oval(c, .76, .75, .11, .055, '#d9d9bc');
    } else {
      rect(c, .13, .44, .33, .27, '#b6cbc4');
      rect(c, .13, .4, .33, .09, '#f0edde');
      rect(c, .5, .56, .36, .2, '#cbd8ce');
      rect(c, .5, .52, .36, .08, '#f5f0e1');
      line(c, .17, .59, .4, .59, '#5296a5', .045);
      line(c, .55, .66, .79, .66, '#79a8ab', .03);
    }
    c.restore();
  }
}
function redrockTerrain(c, b) {
  const region = districts[3];
  if (!region || b.bottom <= region.top || b.top >= region.bottom) return;
  const rockBounds = { ...b, top: Math.max(region.top, b.top), bottom: Math.min(region.bottom, b.bottom) };
  c.save(); cellClip(c, rockBounds, blocked);
  const stone = c.createLinearGradient(0, region.top, WIDTH, region.bottom);
  stone.addColorStop(0, '#bd7188'); stone.addColorStop(.5, '#a15a7b'); stone.addColorStop(1, '#ce8b91');
  rect(c, b.left, rockBounds.top, b.right - b.left, rockBounds.bottom - rockBounds.top, stone);
  // Broad connected rock masses use the collision mask itself as their outer
  // silhouette. Narrow barrier remnants still receive faces, not flat ground.
  for (let gy = Math.floor(rockBounds.top / 3) - 2; gy <= Math.ceil(rockBounds.bottom / 3); gy++) for (let gx = Math.floor(b.left / 4) - 3; gx <= Math.ceil(b.right / 4); gx++) {
    const n = hash(gx + 71, gy), x = gx * 4 + hash(gy, gx) * 2.8, y = gy * 3 + n * 2;
    c.save(); c.translate(x, y); ridge(c, 4.2 + n * 4.5, 2.2 + hash(gx, gy + 3) * 2.5, n); c.restore();
  }
  // Small irregular crowns make the near edges read at the native zoom.
  for (let y = Math.floor(rockBounds.top) - 1; y < Math.ceil(rockBounds.bottom); y++) for (let x = Math.floor(b.left) - 1; x < Math.ceil(b.right); x++) {
    if (!blocked(x, y)) continue;
    const n = hash(x + 183, y - 39);
    if (n < .55) continue;
    const xx = x + .08 + hash(y, x) * .35, yy = y + .12 + n * .18;
    poly(c, [[xx, yy + .69], [xx + .12, yy + .2], [xx + .39, yy - .07], [xx + .73, yy + .15], [xx + .9, yy + .57], [xx + .59, yy + .86]], n > .8 ? '#a45a79' : '#b66c83', '#794b6b', .025);
    poly(c, [[xx + .12, yy + .2], [xx + .39, yy - .07], [xx + .73, yy + .15], [xx + .51, yy + .37], [xx + .28, yy + .3]], '#e2a09c');
    line(c, xx + .51, yy + .37, xx + .59, yy + .74, '#7d4569', .04);
    line(c, xx + .13, yy + .54, xx + .37, yy + .48, '#efb1a5', .035);
  }
  // Highlight the actual south-facing collision lips, rather than inventing
  // decorative ridges on walkable shoulders or in encounter arenas.
  for (let y = Math.floor(rockBounds.top); y < Math.ceil(rockBounds.bottom); y++) for (let x = Math.floor(b.left); x < Math.ceil(b.right); x++) {
    if (!blocked(x, y)) continue;
    if (passable(x + .5, y + 1.5)) {
      poly(c, [[x, y + .5], [x + .25, y + .39], [x + .6, y + .52], [x + 1, y + .41], [x + 1, y + .98], [x, y + .98]], '#8e4f70');
      line(c, x, y + .5, x + .25, y + .39, '#f0b3a3', .065);
      line(c, x + .25, y + .39, x + .6, y + .52, '#e3a394', .065);
      line(c, x + .6, y + .52, x + 1, y + .41, '#f0b3a3', .065);
      line(c, x + .28, y + .65, x + .74, y + .6, '#be8194', .045);
    }
    if (passable(x - .5, y + .5)) line(c, x + .055, y, x + .055, y + 1, '#f1b8a78c', .09);
  }
  c.restore();
}
function objective(state) {
  if (state.conquered) return null;
  const camps = sets(state.camps), done = sets(state.completed), camp = CAMPS.find(s => !camps.has(s.id));
  if (camp) return ENCOUNTERS.find(s => s.id === camp.required?.find(id => !done.has(id))) ?? camp;
  return done.has(ENCOUNTERS.find(s => s.kind === 'boss')?.id) ? null : KING;
}
function beacon(c, x, y, time, size = 1) {
  c.save(); c.translate(x, y); c.scale(size, size);
  const pulse = .07 * Math.sin(time * 2);
  arc(c, 0, 0, .75 + pulse, .36 + pulse, 0, TAU, '#fff2ba', .09);
  line(c, .7, -.2, .7, -2.9, '#e0bc65', .07);
  poly(c, [[.7, -2.9], [1.65, -2.8], [1.3, -2.4], [1.65, -2], [.7, -2]], GOLD, '#826e47');
  c.restore();
}
function seal(c, x, y, r) {
  oval(c, x, y, r, r, '#8f7549'); oval(c, x, y, r * .82, r * .82, GOLD);
  line(c, x - r * .42, y, x - r * .1, y + r * .3, '#397d6b', r * .15);
  line(c, x - r * .1, y + r * .3, x + r * .47, y - r * .35, '#397d6b', r * .15);
}
function campMarks(c, site, state, time) {
  const secured = sets(state.camps).has(site.id) || state.conquered, done = sets(state.completed);
  arc(c, site.x, site.y, 2.5, 1.35, 0, TAU, '#eaf9e1a0', .1);
  poly(c, [[site.x, site.y - .65], [site.x + .65, site.y], [site.x, site.y + .65], [site.x - .65, site.y]], '#368d7b', '#eff7df');
  line(c, site.x - .33, site.y, site.x + .33, site.y, '#f4f7e6', .14);
  line(c, site.x, site.y - .33, site.x, site.y + .33, '#f4f7e6', .14);
  const ids = site.required ?? [];
  ids.forEach((id, i) => {
    const a = Math.PI * .14 + i / Math.max(1, ids.length - 1) * Math.PI * .72;
    oval(c, site.x + Math.cos(a) * 2.5, site.y + Math.sin(a) * 1.65, .13, .13, done.has(id) || state.conquered ? GOLD : '#587e86');
  });
  if (secured) seal(c, site.x + 1.5, site.y - 1.15, .46);
  else if (ids.every(id => done.has(id))) beacon(c, site.x, site.y, time, .7);
}

function courtyardMosaic(c, b, x, y, radius, royal = false) {
  c.save();
  cellClip(c, b, (xx, yy) => passable(xx + .5, yy + .5) && Math.hypot(xx + .5 - x, yy + .5 - y) < radius + .5);
  c.translate(x, y);
  const frame = Array.from({ length: 8 }, (_, i) => [Math.cos(i * TAU / 8 + Math.PI / 8) * radius, Math.sin(i * TAU / 8 + Math.PI / 8) * radius]);
  poly(c, frame, '#f4f0da48', '#639f9b66', .09);
  arc(c, 0, 0, radius * .8, radius * .8, 0, TAU, '#b6bf9670', .08);
  for (let i = 0; i < 16; i++) {
    c.save(); c.rotate(i * TAU / 16);
    poly(c, [[radius * .81, -.06], [radius * .88, -.13], [radius * .95, -.06], [radius * .88, .01]], i % 2 ? '#639eae85' : '#d0b47c85');
    c.restore();
  }
  for (let i = 0; i < 8; i++) {
    c.save(); c.rotate(i * TAU / 8);
    poly(c, [[0, 0], [-.18, -radius * .32], [0, -radius * .65], [.18, -radius * .32]], i % 2 ? '#86aead65' : royal ? '#a786b07a' : '#d5bc817a');
    c.restore();
  }
  c.restore();
}
function quayStatue(c, x, y, side) {
  if (!footprint(x - .32, y - .32, .64, .32)) return;
  rect(c, x - .32, y - .25, .64, .25, '#b7c8bc');
  rect(c, x - .26, y - .43, .52, .2, '#f8efd5');
  poly(c, [[x - .2, y - .44], [x - .13, y - 1.12], [x + .14, y - 1.12], [x + .23, y - .44]], '#73958b', '#4b746e');
  oval(c, x, y - 1.3, .16, .19, '#c3bf88');
  poly(c, [[x - .2, y - 1.39], [x, y - 1.65], [x + .21, y - 1.39]], '#96ad91');
  line(c, x + side * .16, y - .97, x + side * .34, y - .75, '#a8b487', .1);
  line(c, x + side * .34, y - .75, x + side * .34, y - 1.6, '#bca367', .045);
  oval(c, x - side * .16, y - .88, .17, .25, '#527d79');
  arc(c, x - side * .16, y - .88, .12, .19, 0, TAU, '#d6c38b', .025);
}
function mooredShip(c, time) {
  // Hull occupies the real northern sea; rigging rises above it like the quay
  // columns. The open portico frames this ship instead of hiding the water.
  c.save(); c.translate(42, 1.85 + Math.sin(time * 1.8) * .035);
  oval(c, 0, .68, 3.05, .27, '#1e718c40');
  for (const side of [-1, 1]) for (let i = 0; i < 5; i++) {
    const x = -1.8 + i * .85;
    line(c, x, .23, x - .25, .74 + side * .12, '#d8c58d', .035);
  }
  poly(c, [[-3, -.2], [-2.4, .55], [-1.6, .74], [1.8, .65], [2.7, .26], [3.12, -.38], [2.25, -.05], [-2.4, -.13]], '#855975', '#dbc68b', .055);
  poly(c, [[-2.65, -.19], [-1.9, .21], [2.05, .21], [2.8, -.34], [1.8, -.43], [-1.8, -.43]], '#d7c797');
  line(c, -.3, .04, -.3, -1.95, '#947e5c', .055);
  line(c, -1.7, -1.44, 1.5, -1.44, '#c1a678', .06);
  curve(c, [-1.65, -1.4, -.8, -1.04, .6, -1.25, 1.45, -1.38], '#f7eed5', .22);
  line(c, -.3, -1.9, -2.45, -.2, '#dbcda7', .025);
  line(c, -.3, -1.9, 2.5, -.28, '#dbcda7', .025);
  poly(c, [[-.28, -1.94], [.72, -1.88], [.48, -1.61], [-.28, -1.65]], '#af597a', GOLD, .025);
  arc(c, .1, .76, 2.8, .2, .1, 3, '#d5f1de', .035);
  c.restore();
}
function harborEntrance(c, b, time) {
  if (!visible(HOME, b, 14)) return;
  courtyardMosaic(c, b, HOME.x, HOME.y, 3.85);
  // Authored overhead architecture is intentionally exempt from the solid
  // silhouette rule: only its plinths touch terrain, all on blocked quay cells.
  // No wall or collision is added across the passage underneath the lintel.
  mooredShip(c, time);
  const roots = [38.5, 39.4, 44.6, 45.5], y = 5.8;
  const rooted = roots.every(x => footprint(x - .28, y - .6, .56, .6));
  if (rooted) {
    for (const x of roots) {
      rect(c, x - .27, y - .48, .54, .48, '#9cbab5');
      rect(c, x - .29, y - .51, .58, .12, '#f6efd9');
      column(c, x, y - .48, 3.14, .38);
      rect(c, x - .22, 3.4, .44, .21, '#55a5b3');
      oval(c, x, y - .38, .12, .04, '#c7ac6c');
    }
    c.save(); c.translate(0, .7);
    rect(c, 37.9, 1.19, 8.2, .34, '#dae3ce');
    rect(c, 37.7, .91, 8.6, .3, '#f8f0d6');
    rect(c, 38, 1.26, 8, .14, '#398eaa');
    for (let i = 0; i < 15; i++) {
      const x = 38.2 + i * .54;
      poly(c, [[x, 1.27], [x + .12, 1.39], [x + .24, 1.27]], '#dcc586');
    }
    poly(c, [[37.55, .91], [42, -.65], [46.45, .91]], '#fbf1d7', '#87ada8', .065);
    poly(c, [[38.6, .72], [42, -.39], [45.4, .72]], '#3b92a7');
    oval(c, 42, .2, .3, .32, GOLD);
    for (const side of [-1, 1]) {
      arc(c, 42, .18, .55, .48, side < 0 ? 2 : -.5, side < 0 ? 4.2 : 1.2, '#d9ce90', .07);
      poly(c, [[42 + side * .65, .3], [42 + side * 1.3, -.02], [42 + side * 1.85, .4]], '#b8d4c1');
    }
    line(c, 37.6, .89, 46.4, .89, '#fff9e3', .08);
    c.restore();
  }
  quayStatue(c, 36.9, 5.75, -1); quayStatue(c, 47.1, 5.75, 1);
  // Low quay furniture is restricted even in projection, not merely at roots.
  for (const [x, yy, kind] of [[36.4, 4.2, 'crate'], [46.2, 4.2, 'crate'], [37.5, 14.1, 'pot'], [46.3, 14.3, 'pot'], [47.2, 15.3, 'crate']]) {
    if (!footprint(x, yy, .65, .65)) continue;
    if (kind === 'crate') {
      rect(c, x, yy, .62, .55, '#c6b593'); rect(c, x + .05, yy + .05, .52, .12, '#e2d3ac');
      line(c, x + .08, yy + .08, x + .54, yy + .48, '#907f6e', .04);
      line(c, x + .54, yy + .08, x + .08, yy + .48, '#907f6e', .04);
    } else {
      oval(c, x + .31, yy + .48, .27, .16, '#378e9c');
      oval(c, x + .31, yy + .3, .24, .1, '#c9e6d4');
      for (let i = 0; i < 5; i++) oval(c, x + .12 + i * .095, yy + .14 + Math.sin(i) * .04, .095, .09, i % 2 ? '#b37db6' : '#539d75');
    }
  }
}
function citadelEntrance(c, b, state, time) {
  if (!visible({ x: KING.x + 3, y: KING.y - 7 }, b, 12)) return;
  courtyardMosaic(c, b, KING.x, KING.y, 4.1, true);
  const roots = [42.5, 48.5], y = 174.85;
  if (!roots.every(x => footprint(x - .35, y - .7, .7, .7))) return;
  // The north garden supports this ceremonial facade. Its central span is
  // open, with no opaque wall dropped across the carved combat approaches.
  for (const x of roots) {
    rect(c, x - .35, y - .65, .7, .65, '#afc5c4');
    column(c, x, y - .65, 5.25, .52);
    column(c, x + (x < 45 ? .85 : -.85), y - .65, 5.25, .34);
    rect(c, x - .32, 170.4, .64, .3, '#338cae');
    rect(c, x - .28, 172.7, .56, .2, '#d5bb79');
    // Elevated tower crowns are borne by the same garden-rooted piers.
    rect(c, x - .62, 167.8, 1.24, 1.05, '#eef2e6');
    rect(c, x - .63, 168.06, 1.26, .17, '#3d8eaf');
    for (let i = 0; i < 3; i++) rect(c, x - .65 + i * .49, 167.42, .31, .5, '#fff3db');
    line(c, x, 167.42, x, 166.25, '#c3a569', .055);
    const sway = Math.sin(time * 1.7 + x) * .05;
    poly(c, [[x, 166.25], [x + .8, 166.35 + sway], [x + .6, 166.7], [x + .8, 167], [x, 166.94]], state.conquered ? '#389a89' : '#9c609a', GOLD);
  }
  rect(c, 41.6, 168.95, 7.8, .35, '#c7d6c9');
  rect(c, 41.35, 168.62, 8.3, .35, '#fff4dd');
  rect(c, 41.6, 169.02, 7.8, .16, '#368da9');
  poly(c, [[41.15, 168.6], [45.5, 165.85], [49.85, 168.6]], '#f9f2dd', '#729c9f', .075);
  poly(c, [[42.1, 168.29], [45.5, 166.24], [48.9, 168.29]], '#467fbb');
  poly(c, [[43.1, 168.08], [45.5, 166.65], [47.9, 168.08]], '#81649d');
  oval(c, 45.5, 167.54, .44, .44, '#d8bf7a');
  poly(c, [[45.25, 167.54], [45.5, 167.25], [45.75, 167.54], [45.5, 167.9]], '#f9e8af');
  for (let i = 0; i < CAMPS.length; i++) oval(c, 44.3 + i * .6, 169.05, .13, .13, sets(state.camps).has(CAMPS[i].id) ? GOLD : '#7ab1c1');
  // Hanging violet silks outline the empty opening without an impassable gate.
  for (const x of [43.55, 47.45]) {
    const sway = Math.sin(time + x) * .04;
    poly(c, [[x - .22, 169.4], [x + .22, 169.4], [x + .28 + sway, 171.8], [x, 171.58], [x - .23 + sway, 171.9]], state.conquered ? '#459a8d' : '#98639d', '#d7c582', .035);
    poly(c, [[x, 169.9], [x + .13, 170.15], [x, 170.4], [x - .13, 170.15]], GOLD);
  }
}
function southernPalace(c, b, state, time) {
  const p = palaceBounds(), w = p.right - p.left, h = p.bottom - p.top;
  if (!(w > 0 && h > 0) || p.left > b.right || p.right < b.left || p.top > b.bottom || p.bottom < b.top) return;
  c.save(); cellClip(c, b, blocked);
  c.beginPath(); c.rect(p.left, p.top, w, h); c.clip();
  c.translate(p.left, p.top); c.scale(w / 16, h / 5);
  // This is the full-width southern backdrop, not the raised north portico.
  // A dedicated world footprint keeps the entire boss arena open in front.
  rect(c, .15, 1.45, 15.7, 3.55, '#bbcfd0');
  rect(c, .3, 1.35, 15.4, 3.25, '#f7f2e4');
  rect(c, .3, 2.25, 15.4, .24, '#438ba9');
  rect(c, .3, 3.83, 15.4, .18, '#538eb1');
  for (let i = 0; i < 17; i++) {
    const x = .5 + i * .88;
    poly(c, [[x, 2.29], [x + .12, 2.45], [x + .24, 2.29]], '#e7d199');
  }
  for (const x of [1.7, 3.1, 4.5, 5.9, 10.1, 11.5, 12.9, 14.3]) {
    rect(c, x - .31, 2.68, .62, 1.48, '#416e89');
    arc(c, x, 2.7, .31, .35, Math.PI, TAU, '#d5b97b', .07);
    column(c, x - .45, 4.28, 2.48, .18);
  }
  // Deep blue central portal, bronze doors, and a violet-and-gold royal seal.
  c.beginPath(); c.moveTo(6.95, 4.5); c.lineTo(6.95, 2.83);
  c.bezierCurveTo(6.95, 1.75, 9.05, 1.75, 9.05, 2.83); c.lineTo(9.05, 4.5); c.closePath();
  c.fillStyle = '#365d7c'; c.fill(); c.strokeStyle = '#c9ad73'; c.lineWidth = .12; c.stroke();
  for (const x of [7.15, 7.69, 8.23, 8.77]) {
    rect(c, x, 2.73, .15, 1.55, '#ac9973');
    oval(c, x + .07, 3.38, .05, .05, '#ebd798');
  }
  rect(c, 1, 1.48, 14, .25, '#fdf4de');
  rect(c, .9, 1.23, 14.2, .25, '#b5c5be');
  poly(c, [[4.7, 1.25], [8, .08], [11.3, 1.25]], '#fbf2d9', '#6f9da5', .06);
  poly(c, [[5.6, 1.08], [8, .35], [10.4, 1.08]], '#467da9');
  oval(c, 8, .83, .25, .25, '#a27cac');
  poly(c, [[7.84, .83], [8, .63], [8.16, .83], [8, 1.03]], GOLD);
  for (const x of [.9, 15.1]) {
    rect(c, x - .7, .78, 1.4, 3.8, '#eef0e4');
    rect(c, x - .73, 1.1, 1.46, .21, '#448cad');
    rect(c, x - .71, 3.5, 1.42, .18, '#c8b480');
    rect(c, x - .2, 1.73, .4, .82, '#4f7891');
    for (let i = 0; i < 3; i++) rect(c, x - .73 + i * .55, .43, .36, .48, '#fff4dc');
  }
  for (const x of [6.25, 9.75]) {
    const sway = Math.sin(time * 1.4 + x) * .025;
    poly(c, [[x - .2, 1.85], [x + .2, 1.85], [x + .23 + sway, 3.4], [x, 3.2], [x - .2 + sway, 3.4]], state.conquered ? '#42978b' : '#97679b', '#ddc387', .035);
  }
  for (let i = 0; i < 3; i++) rect(c, .1 + i * .07, 4.55 + i * .15, 15.8 - i * .14, .13, i % 2 ? '#b9cac7' : '#f9f0dc');
  c.restore();
}

export function drawLandscape(c, { bounds = { left: 0, top: 0, right: WIDTH, bottom: HEIGHT }, time = 0, state = {} } = {}) {
  const b = { left: Math.max(0, bounds.left), top: Math.max(0, bounds.top), right: Math.min(WIDTH, bounds.right), bottom: Math.min(HEIGHT, bounds.bottom) };
  if (b.right <= b.left || b.bottom <= b.top) return;
  c.save(); c.beginPath(); c.rect(b.left, b.top, b.right - b.left, b.bottom - b.top); c.clip();
  c.lineJoin = 'round'; c.lineCap = 'round';
  ground(c, b, time); perimeterTerrain(c, b, time); redrockTerrain(c, b);
  harborEntrance(c, b, time); citadelEntrance(c, b, state, time);
  scenery(c, b, time);
  southernPalace(c, b, state, time);
  const completed = sets(state.completed);
  for (const site of ENCOUNTERS) if (visible(site, b, 1) && (completed.has(site.id) || state.conquered)) {
    arc(c, site.x, site.y, .46, .24, .1, Math.PI, '#d1b56c', .06);
    for (const side of [-1, 1]) for (let i = 0; i < 3; i++) oval(c, site.x + side * (.13 + i * .11), site.y - i * .06, .07, .035, GOLD);
  }
  if (visible(HOME, b)) {
    arc(c, HOME.x, HOME.y, 2.2, 1.2, 0, TAU, '#f9f4d7', .16);
    poly(c, [[HOME.x, HOME.y - .6], [HOME.x + .5, HOME.y], [HOME.x, HOME.y + .6], [HOME.x - .5, HOME.y]], '#c7a45e', '#fff6d8');
  }
  for (const site of CAMPS) if (visible(site, b, 4)) campMarks(c, site, state, time);
  if (visible(KING, b, 4)) {
    for (let i = 0; i < CAMPS.length; i++) oval(c, KING.x + (i - 2) * .6, KING.y - 3.2, .18, .18, sets(state.camps).has(CAMPS[i].id) ? GOLD : '#6d8d9c');
    if (state.conquered) seal(c, KING.x, KING.y, .65);
  }
  const next = objective(state);
  if (next && visible(next, b, 4)) beacon(c, next.x, next.y, time);
  c.restore();
}

function atlasWindow(state, player) {
  const camps = sets(state.camps), completed = sets(state.completed);
  let active = CAMPS.findIndex(s => !camps.has(s.id));
  if (active < 0) active = districts.length - 1;
  const shown = new Set(districts.map((_, i) => i).filter(i => state.conquered || i <= active));
  for (const site of ENCOUNTERS) if (completed.has(site.id)) shown.add(zone(site.y));
  for (const site of CAMPS) if (camps.has(site.id)) shown.add(zone(site.y));
  if (Number.isFinite(player?.y)) shown.add(zone(player.y));
  const regions = districts.filter((_, i) => shown.has(i));
  return { active, shown, top: Math.min(...regions.map(r => r.top)), bottom: Math.max(...regions.map(r => r.bottom)) };
}
export function atlasAspect(state = {}, player) {
  const view = atlasWindow(state, player);
  return WIDTH / Math.max(1, view.bottom - view.top);
}
function mini(c, build, x, y, size, time, state, captain = false) {
  drawBot(c, { ...normalizeSlot(build), x, y, team: 0, captain, angle: -.35, hp: 1, maxHp: 1,
    weaponTier: state.weaponTier ?? build?.weaponTier ?? 0, armorTier: state.armorTier ?? build?.armorTier ?? 0 }, time, { size, preview: true });
}
export function drawAtlas(c, w, h, state = {}, player) {
  if (!(w > 0 && h > 0)) return;
  const view = atlasWindow(state, player), mh = view.bottom - view.top;
  const margin = Math.min(23, w * .08, h * .08), scale = Math.min((w - margin * 2) / WIDTH, (h - margin * 2) / mh);
  if (!(scale > 0)) return;
  c.save(); rect(c, 0, 0, w, h, '#244c50');
  c.translate((w - WIDTH * scale) / 2, (h - mh * scale) / 2); c.scale(scale, scale); c.translate(0, -view.top);
  c.beginPath(); c.rect(0, view.top, WIDTH, mh); c.clip();
  const shownAt = y => view.shown.has(zone(y));
  const colorAt = (x, y) => {
    if (!shownAt(y)) return '#355b60';
    const p = colors[zone(y) % 5], tile = tileAt(x, y);
    return tile === 'water' ? p.water : ['path', 'road', 'bridge'].includes(tile) ? p.road : passable(x + .5, y + .5) ? p.ground : p.dark;
  };
  const snap = (x, y, width, fill) => {
    const left = Math.round(x * scale) / scale, right = Math.round((x + width) * scale) / scale;
    const top = view.top + Math.round((y - view.top) * scale) / scale, bottom = view.top + Math.round((y + 1 - view.top) * scale) / scale;
    rect(c, left, top, right - left, bottom - top, fill);
  };
  for (let y = Math.floor(view.top); y < Math.ceil(view.bottom); y++) {
    let start = 0, color = colorAt(0, y);
    for (let x = 1; x <= WIDTH; x++) {
      const next = x < WIDTH ? colorAt(x, y) : null;
      if (next !== color) { snap(start, y, x - start, color); start = x; color = next; }
    }
  }
  // Route geometry is intentionally not stroked over battle clearings: the
  // terrain cells above are the authoritative continuous carved road network.
  const active = districts[view.active];
  if (active && !state.conquered) {
    rect(c, 0, active.top, WIDTH, active.bottom - active.top, '#fff2ba18');
    for (const x of [.4, WIDTH - .4]) line(c, x, active.top + .4, x, active.bottom - .4, GOLD, 1.5 / scale);
  }
  const done = sets(state.completed), camps = sets(state.camps), required = new Set(CAMPS.flatMap(s => s.required ?? []));
  for (const site of ENCOUNTERS) {
    if (state.returnQuest || !shownAt(site.y) || site.kind === 'boss') continue;
    const cleared = done.has(site.id) || state.conquered;
    oval(c, site.x, site.y, (required.has(site.id) ? 3 : 2) / scale, (required.has(site.id) ? 3 : 2) / scale, cleared ? GOLD : '#734e76');
    if (!cleared && required.has(site.id)) oval(c, site.x, site.y, 1.2 / scale, 1.2 / scale, '#f5dbde');
  }
  for (const site of [HOME, ...CAMPS]) if (shownAt(site.y)) {
    c.save(); c.translate(site.x, site.y); c.scale(1 / scale, 1 / scale);
    oval(c, 0, 0, 8, 8, '#234d54');
    if (camps.has(site.id) || state.conquered) seal(c, 0, 0, 6.7);
    else { poly(c, [[-6, 4], [0, -6], [6, 4]], '#f0f3e1'); poly(c, [[-2, 4], [0, -1], [2, 4]], '#348577'); }
    c.restore();
  }
  if (shownAt(KING.y)) {
    c.save(); c.translate(KING.x, KING.y); c.scale(1 / scale, 1 / scale);
    rect(c, -7, -4, 14, 9, '#f3ecda'); rect(c, -5, -1, 10, 2, '#338daf');
    for (const x of [-6, 0, 6]) rect(c, x - 1.4, -8, 2.8, 5, GOLD);
    c.restore();
  }
  const next = objective(state);
  if (next && shownAt(next.y)) beacon(c, next.x, next.y, 0, 5 / scale);
  drawQuestAtlas(c,{quest:state.returnQuest,target:state.returnQuestTarget,completed:state.completed,scale,top:view.top,bottom:view.bottom});
  if (Number.isFinite(player?.x) && Number.isFinite(player?.y) && shownAt(player.y)) {
    c.save(); c.translate(player.x, player.y); c.scale(1 / scale, 1 / scale);
    oval(c, 0, 0, 17, 17, '#234d54'); oval(c, 0, 0, 15, 15, GOLD); oval(c, 0, 0, 12, 12, '#edf5e1');
    mini(c, player.weapon ? player : state.squad?.[0], 0, 1, 22, 0, state, !!player.captain);
    c.restore();
  }
  c.restore();
}

function distantCoast(c, x, y, s, time, harbor) {
  c.save(); c.translate(x, y); c.scale(s, s);
  poly(c, [[-90, 45], [-70, 6], [-39, -3], [-15, 12], [20, 4], [54, 20], [90, 45]], '#7bb5a5');
  poly(c, [[-85, 45], [-53, 22], [-20, 29], [0, 21], [31, 33], [75, 45]], '#c9e1c3');
  line(c, -85, 45, 83, 45, '#dff3dc', 2);
  if (harbor) {
    for (let i = 0; i < 5; i++) { c.save(); c.translate(-52 + i * 23, 3 + Math.sin(i * 2) * 4); pavilion(c, 19, 29, i === 2); c.restore(); }
    arc(c, 0, 45, 62, 10, 0, Math.PI, '#f2eedb', 4);
  }
  for (const xx of [-65, -28, 53]) { c.save(); c.translate(xx, 10); palm(c, 17, 29, xx, time); c.restore(); }
  c.restore();
}
// Rome uses its own world, so this dock deliberately has no south terrain clip.
// Its entire footprint stays west of x=20, clear of the Roman arena at (39,140).
export function drawRomanDock(c, time = 0, ready = false) {
  c.save(); c.translate(16, 144); c.lineJoin = 'round'; c.lineCap = 'round';
  oval(c, 0, 4.6, 2.3, .7, '#1e637b30');
  rect(c, -1.25, -.25, 2.5, 2.65, '#c4b48e');
  for (let i = 0; i < 7; i++) {
    rect(c, -1.2, -.2 + i * .37, 2.4, .3, i % 2 ? '#e8dfbd' : '#d6d8bc');
    for (const x of [-.95, .95]) oval(c, x, -.06 + i * .37, .035, .035, '#657e78');
  }
  for (const x of [-1.35, 1.35]) for (const y of [0, 1.9]) {
    rect(c, x - .13, y - .4, .26, .65, '#b9c4b3');
    oval(c, x, y - .41, .19, .09, '#f1efdb');
  }
  line(c, -1.35, -.3, -1.35, -2.1, '#a18a5d', .07);
  poly(c, [[-1.31, -2.1], [-.48, -2.03], [-.7, -1.65], [-.48, -1.31], [-1.31, -1.36]], ready ? '#3a9c83' : '#9b6388', GOLD);
  const bob = Math.sin(time * 2.2) * .055;
  c.translate(0, 4.1 + bob); c.rotate(Math.sin(time * 1.3) * .012);
  for (const side of [-1, 1]) for (let i = 0; i < 4; i++) {
    const y = -1.1 + i * .66, sweep = Math.sin(time * 3.6 + i * .12) * .17;
    line(c, side * .88, y, side * 1.9, y + .32 + sweep, '#d5c595', .065);
    line(c, side * 1.75, y + .27 + sweep, side * 2.05, y + .4 + sweep, '#a69579', .14);
    arc(c, side * 2, y + .46 + sweep, .23, .07, 0, Math.PI, '#d0f2df80', .025);
  }
  poly(c, [[0, -2.1], [-.9, -1.5], [-1.12, .2], [-.84, 1.5], [0, 2.2], [.84, 1.5], [1.12, .2], [.9, -1.5]], '#765165', '#e5cf95', .07);
  poly(c, [[0, -1.85], [-.7, -1.3], [-.88, .2], [-.65, 1.3], [0, 1.85], [.65, 1.3], [.88, .2], [.7, -1.3]], '#d8c697');
  for (let i = 0; i < 5; i++) {
    const y = -.95 + i * .47;
    rect(c, -.66, y, 1.32, .14, '#8a786c');
    line(c, -.64, y, .64, y, '#f1dfad', .025);
  }
  line(c, 0, -.2, 0, -2.6, '#a99367', .075);
  poly(c, [[.05, -2.53], [.83, -1.18], [.05, -1.3]], '#fbf2da', '#bca978', .035);
  line(c, -.8, -1.3, -1.3, -2.13 - bob, '#d9c99c', .035);
  line(c, .8, -1.3, 1.3, -2.13 - bob, '#d9c99c', .035);
  c.restore();
  if (ready) beacon(c, 16, 144, time, .7);
}
export function drawVoyage(c, w, h, { time = 0, progress = 0, units = [], state = {} } = {}) {
  if (!(w > 0 && h > 0)) return;
  const p = clamp(Number.isFinite(progress) ? progress : 0, 0, 1);
  c.save(); c.beginPath(); c.rect(0, 0, w, h); c.clip();
  const sky = c.createLinearGradient(0, 0, 0, h);
  sky.addColorStop(0, '#99dce0'); sky.addColorStop(.42, '#e8f3e2'); sky.addColorStop(.43, '#4bbdbd'); sky.addColorStop(1, '#176f91');
  rect(c, 0, 0, w, h, sky);
  oval(c, w * .8, h * .18, Math.min(w, h) * .055, Math.min(w, h) * .055, '#fff6ce');
  for (let i = 0; i < 5; i++) {
    const x = ((i * .27 + .07 - p * .08 + 1) % 1) * w;
    oval(c, x, h * (.12 + i % 2 * .12), w * .09, h * .012, '#f8fcf05c');
  }
  const coastScale = Math.min(w / 270, h / 170);
  distantCoast(c, w * (.16 - p * .65), h * .31, coastScale, time, true);
  distantCoast(c, w * (1.5 - p * .95), h * .34, coastScale * 1.25, time, true);
  for (let i = 0; i < 55; i++) {
    const yy = h * (.46 + hash(i, 5) * .54), xx = ((hash(i, 8) - time * (.008 + (yy / h) * .015)) % 1 + 1) % 1 * w;
    arc(c, xx, yy, (6 + hash(i, 2) * 24) * w / 700, 1 + yy / h * 2, .1, 2.9, i % 3 ? '#9be4d875' : '#e9fae2b0', 1);
  }
  // A fixed-format boat keeps the mast, squad and oars in frame on portrait
  // phones as well as wide screens. Progress moves the coasts, not the UI.
  const s = Math.min(w / 350, h / 285), bob = Math.sin(time * 2.2) * 2;
  c.translate(w * (.46 + .08 * p), h * .64 + bob * s); c.scale(s, s);
  c.rotate(Math.sin(time * 1.3) * .012);
  oval(c, 0, 37, 123, 20, '#174c6d42');
  for (let i = 0; i < 8; i++) {
    const phase = ((time * .4 + i / 8) % 1 + 1) % 1;
    arc(c, -103 - phase * 55, 28 + phase * 6, 17 + phase * 20, 4 + phase * 6, -.8, .8, `rgba(218,249,234,${(1 - phase) * .6})`, 1.6);
  }
  for (const side of [-1, 1]) for (let i = 0; i < 6; i++) {
    const x = -66 + i * 23, swing = Math.sin(time * 3.6 + i * .12);
    const xx = x - 17 + swing * 13, yy = side < 0 ? 11 - swing * 7 : 58 + swing * 6;
    line(c, x, side < 0 ? 3 : 19, xx, yy, '#e6cf9c', 3);
    line(c, xx, yy, xx - 8, yy + (side < 0 ? -4 : 5), '#bfa273', 6);
    if (side > 0 && swing > .2) arc(c, xx - 5, yy + 3, 9, 2.5, 0, Math.PI, '#d6f3df', 1.3);
  }
  poly(c, [[-115, 3], [-91, 39], [-52, 48], [69, 42], [106, 23], [122, -10], [94, 2], [-88, -2]], '#714d62', '#314d60', 2);
  poly(c, [[-104, 1], [-77, 24], [72, 24], [110, -6], [83, -15], [-78, -13]], '#d6b681', '#ecddae', 2);
  for (let i = 0; i < 8; i++) line(c, -76 + i * 21, -10, -76 + i * 21, 23, '#9f8b73', .7);
  curve(c, [-106, 10, -45, 47, 77, 43, 115, -2], '#e0bd71', 4);
  for (const x of [-85, 82]) poly(c, [[x - 9, 3], [x + 9, 3], [x + 9, 21], [x, 28], [x - 9, 21]], '#985071', '#e2c27c', 1.2);
  line(c, -19, 7, -19, -119, '#886f59', 4);
  line(c, -64, -105, 53, -105, '#ad9270', 3);
  const swell = Math.sin(time * 1.6) * 4;
  poly(c, [[-62, -103], [50, -103], [60 + swell, -49], [-53, -43]], '#faf4df', '#d4cfb8', 1);
  poly(c, [[-62, -103], [-28, -103], [-18 + swell, -45], [-53, -43]], '#e5e8d6');
  poly(c, [[-6, -91], [8, -77], [-6, -63], [-20, -77]], '#b55b79');
  line(c, -19, -118, -96, 0, '#e8d8af', .9); line(c, -19, -118, 93, -9, '#e8d8af', .9);
  poly(c, [[-18, -122], [24, -119 + Math.sin(time * 3) * 2], [13, -110], [-18, -112]], '#a84d72', '#f3cf80', 1);
  const source = units.length ? units : state.squad ?? [];
  const count = (units.length ? units.length : state.squadSize) === 5 ? 5 : 3;
  const seats = count === 5 ? [[-57, -2], [-3, -4], [47, -6], [-31, 17], [25, 15]] : [[-48, 5], [0, 9], [48, 2]];
  seats.forEach(([x, y], i) => mini(c, source[i] ?? state.squad?.[i], x, y - 6 + Math.sin(time * 2.2 + i) * .5, 28, time, state, i === 0));
  curve(c, [-104, 3, -51, 24, 65, 25, 106, -5], '#eee2bb', 2.5);
  arc(c, 16, 42, 103, 9, .1, 2.9, '#d4f4e4', 1.6);
  c.restore();
}
