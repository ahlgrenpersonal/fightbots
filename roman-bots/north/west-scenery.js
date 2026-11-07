import {drawQuestAtlas} from './quest-art.js?v=roman35';
import { WIDTH, HEIGHT, HOME, CAMPS, ENCOUNTERS, KING, BRIDGES, LANDMARKS, LANDSCAPES, ROUTES, tileAt, passable } from './west-world.js?v=roman35';
import { drawBot } from '../art.js?v=roman35';
import { normalizeSlot } from '../data.js?v=roman35';
import { citizen } from './scenery.js?v=roman35';

const TAU = Math.PI * 2;
const INK = '#354d50';
const hash = (x, y) => {
  let h = Math.imul(x + 719, 374761393) ^ Math.imul(y + 953, 668265263);
  h = Math.imul(h ^ (h >>> 13), 1274126177);
  return ((h ^ (h >>> 16)) >>> 0) / 4294967296;
};
const collection = value => value instanceof Set ? value : new Set(Array.isArray(value) ? value : []);
const palettes = [
  { ground: '#b9c887', shade: '#9db77b', light: '#d7dda0', rock: '#b8b394', face: '#8e9a83', road: '#eddda8' },
  { ground: '#a8c7ae', shade: '#88b5a2', light: '#dce4bf', rock: '#e5e2c6', face: '#a3b8b0', road: '#e4e4c1' },
  { ground: '#c59789', shade: '#b08281', light: '#e4b5a0', rock: '#cead9f', face: '#998b91', road: '#f0d6ad' },
  { ground: '#a3b8b7', shade: '#849d9e', light: '#cbd4c4', rock: '#c6cdd1', face: '#7e929d', road: '#e1dbc0' },
  { ground: '#abb6a0', shade: '#879d91', light: '#d7d3ad', rock: '#d3c9af', face: '#8b9692', road: '#e9d9b1' }
];
const motifBand = { 'rounded-hills': 2, 'olive-terraces': 0, 'river-cliffs': 1, 'ruined-aqueduct': 4, 'mountain-switchbacks': 3 };
function band(x, y) {
  const region = LANDSCAPES.find(region => y >= region.top && y < region.bottom);
  if (region) return motifBand[region.motif] ?? 0;
  const nearest = CAMPS.reduce((best, site) => !best || Math.hypot(x - site.x, y - site.y) < Math.hypot(x - best.x, y - best.y) ? site : best, null);
  return nearest ? [2, 0, 1, 4, 3][CAMPS.indexOf(nearest) % 5] : 0;
}
function oval(c, x, y, rx, ry, fill) {
  c.beginPath(); c.ellipse(x, y, rx, ry, 0, 0, TAU); c.fillStyle = fill; c.fill();
}
function poly(c, points, fill, stroke = INK, width = .035) {
  c.beginPath(); points.forEach(([x, y], i) => i ? c.lineTo(x, y) : c.moveTo(x, y)); c.closePath();
  c.fillStyle = fill; c.fill();
  if (stroke) { c.strokeStyle = stroke; c.lineWidth = width; c.stroke(); }
}
function line(c, x, y, xx, yy, color, width = .035) {
  c.beginPath(); c.moveTo(x, y); c.lineTo(xx, yy); c.strokeStyle = color; c.lineWidth = width; c.stroke();
}
function box(c, x, y, w, h, fill, stroke = null) {
  c.fillStyle = fill; c.fillRect(x, y, w, h);
  if (stroke) { c.lineWidth = .04; c.strokeStyle = stroke; c.strokeRect(x, y, w, h); }
}
function curve(c, points, color, width) {
  c.beginPath(); c.moveTo(points[0], points[1]);
  c.bezierCurveTo(...points.slice(2)); c.strokeStyle = color; c.lineWidth = width; c.stroke();
}
function visible(p, b, margin = 7) {
  return p.x + margin >= b.left && p.x - margin <= b.right && p.y + margin >= b.top && p.y - margin <= b.bottom;
}
function nextObjective(state) {
  if (state.conquered) return null;
  const camps = collection(state.camps), completed = collection(state.completed);
  const camp = CAMPS.find(site => !camps.has(site.id));
  if (camp) {
    const id = camp.required?.find(id => !completed.has(id));
    return id ? ENCOUNTERS.find(site => site.id === id) ?? camp : camp;
  }
  return completed.has(ENCOUNTERS.find(site => site.kind === 'boss')?.id) ? null : KING;
}
function objectiveBeacon(c, site, time) {
  c.save(); c.translate(site.x, site.y);
  const pulse = Math.sin(time * 2) * .06;
  const glow = c.createLinearGradient(0, -3.4, 0, 0);
  glow.addColorStop(0, '#ffe6a000'); glow.addColorStop(1, '#ffe6a058');
  poly(c, [[-.23, -3.4], [.23, -3.4], [.65, 0], [-.65, 0]], glow, null);
  c.beginPath(); c.ellipse(0, 0, .76 + pulse, .37 + pulse * .4, 0, 0, TAU);
  c.strokeStyle = '#fff0ac'; c.lineWidth = .09; c.stroke();
  line(c, .76, -.12, .76, -1.9, '#6b7359', .055);
  poly(c, [[.79, -1.9], [1.5, -1.85], [1.26, -1.5], [1.5, -1.2], [.79, -1.23]], '#ffe09a', '#8a7b50');
  poly(c, [[1.04, -1.76], [1.2, -1.57], [1.04, -1.38], [.9, -1.57]], '#b58746', null);
  c.restore();
}
function flag(c, x, y, time, active = false, tall = 2.3) {
  line(c, x, y, x, y - tall, '#887b5e', .065);
  oval(c, x, y - tall - .07, .09, .1, '#ffe3a1');
  const sway = Math.sin(time * 1.6 + x) * .08;
  poly(c, [[x + .05, y - tall], [x + .83, y - tall + .08 + sway], [x + .77, y - tall + 1.13 + sway], [x + .4, y - tall + .94], [x + .05, y - tall + 1.05]], active ? '#248e83' : '#aa4262', '#f2ce81');
  poly(c, [[x + .4, y - tall + .28], [x + .57, y - tall + .54], [x + .4, y - tall + .78], [x + .23, y - tall + .54]], '#ffe2a0', null);
}

function olive(c, x, y, time, n) {
  oval(c, x + .58, y + .78, .38, .13, '#34554b32');
  curve(c, [x + .52, y + .78, x + .3, y + .57, x + .66, y + .42, x + .47, y + .18], '#7e7861', .1);
  line(c, x + .51, y + .52, x + .28, y + .3, '#7e7861', .065);
  const sway = Math.sin(time * .65 + n * 20) * .02;
  for (const [xx, yy, r, color] of [[.32, .33, .26, '#54785c'], [.63, .3, .27, '#66896a'], [.47, .19, .3, '#8caa79'], [.32, .16, .16, '#b8c996']]) {
    oval(c, x + xx + sway, y + yy, r, r * .61, color);
  }
  for (let i = 0; i < 3; i++) oval(c, x + .3 + i * .14, y + .27 + hash(i, x) * .14, .025, .036, '#354f46');
}
function limestone(c, x, y, n, p, mountain = false) {
  const h = mountain ? .64 + n * .25 : .33 + n * .25;
  poly(c, [[x + .08, y + .86], [x + .12, y + .43], [x + .38, y + .83 - h], [x + .73, y + .77 - h], [x + .94, y + .49], [x + .87, y + .89]], p.face);
  poly(c, [[x + .12, y + .43], [x + .38, y + .83 - h], [x + .73, y + .77 - h], [x + .94, y + .49], [x + .53, y + .56]], p.rock, null);
  line(c, x + .53, y + .56, x + .49, y + .82, '#667f833f', .035);
  line(c, x + .18, y + .66, x + .41, y + .69, '#e7e8d178', .035);
  if (mountain && n > .5) poly(c, [[x + .18, y + .37], [x + .38, y + .83 - h], [x + .73, y + .77 - h], [x + .83, y + .36], [x + .61, y + .29], [x + .46, y + .39]], '#edf4e7', null);
}
function vine(c, x, y, time, n) {
  line(c, x + .14, y + .8, x + .14, y + .23, '#84705b', .055);
  line(c, x + .85, y + .8, x + .85, y + .23, '#84705b', .055);
  curve(c, [x + .12, y + .3, x + .35, y + .5, x + .65, y + .22, x + .87, y + .34], '#695852', .045);
  for (let i = 0; i < 4; i++) {
    const xx = x + .23 + i * .17, yy = y + .35 + Math.sin(i + time * .4) * .025;
    poly(c, [[xx, yy + .11], [xx - .12, yy], [xx - .07, yy - .13], [xx + .07, yy - .15], [xx + .13, yy]], i % 2 ? '#bb556e' : '#7b6967', null);
    if ((i + Math.floor(n * 7)) % 2) for (const [dx, dy] of [[0, 0], [.06, .015], [.025, .07]]) oval(c, xx + dx, yy + .12 + dy, .042, .05, '#614d78');
  }
}
function cypress(c, x, y, n) {
  line(c, x + .5, y + .86, x + .5, y + .2, '#796e59', .07);
  poly(c, [[x + .23, y + .7], [x + .3, y + .29], [x + .48, y + .04], [x + .68, y + .32], [x + .75, y + .71], [x + .5, y + .82]], '#3d6f69');
  poly(c, [[x + .3, y + .63], [x + .48, y + .04], [x + .53, y + .7]], n > .5 ? '#75a18a' : '#609781', null);
}
function aqueductCell(c, x, y) {
  box(c, x + .04, y + .12, .92, .15, '#f0e5c4', INK);
  box(c, x + .04, y + .27, .19, .61, '#d1c2a0', INK);
  box(c, x + .77, y + .27, .19, .61, '#a6a48f', INK);
  c.beginPath(); c.moveTo(x + .23, y + .65); c.bezierCurveTo(x + .23, y + .22, x + .77, y + .22, x + .77, y + .65);
  c.strokeStyle = '#e6d7b3'; c.lineWidth = .13; c.stroke();
  line(c, x + .1, y + .16, x + .9, y + .16, '#fff1cc', .035);
  line(c, x + .06, y + .91, x + .36, y + .91, '#6f847b', .06);
}

function water(c, b, time) {
  const wet = (x, y) => tileAt(x, y) === 'water';
  c.save(); c.beginPath();
  for (let y = Math.floor(b.top); y < Math.ceil(b.bottom); y++) for (let x = Math.floor(b.left); x < Math.ceil(b.right); x++) {
    if (!wet(x, y)) continue;
    const top = !wet(x, y - 1), bottom = !wet(x, y + 1), left = !wet(x - 1, y), right = !wet(x + 1, y);
    c.roundRect(x, y, 1, 1, [top && left ? .32 : 0, top && right ? .32 : 0, bottom && right ? .32 : 0, bottom && left ? .32 : 0]);
  }
  c.clip();
  const depth = c.createLinearGradient(0, 0, WIDTH, HEIGHT);
  depth.addColorStop(0, '#278caa'); depth.addColorStop(.5, '#36abb0'); depth.addColorStop(1, '#27999f');
  box(c, b.left, b.top, b.right - b.left, b.bottom - b.top, depth);
  for (let y = Math.floor(b.top); y < Math.ceil(b.bottom); y++) for (let x = Math.floor(b.left); x < Math.ceil(b.right); x++) {
    if (!wet(x, y)) continue;
    // Only real banks receive a shallow-water edge, never shared cell seams.
    for (const dy of [-1, 1]) if (!wet(x, y + dy)) {
      const left = wet(x - 1, y) && !wet(x - 1, y + dy) ? 0 : .24;
      const right = wet(x + 1, y) && !wet(x + 1, y + dy) ? 1 : .76;
      line(c, x + left, y + (dy < 0 ? .08 : .92), x + right, y + (dy < 0 ? .08 : .92), '#92d9c781', .13);
    }
    for (const dx of [-1, 1]) if (!wet(x + dx, y)) {
      const top = wet(x, y - 1) && !wet(x + dx, y - 1) ? 0 : .24;
      const bottom = wet(x, y + 1) && !wet(x + dx, y + 1) ? 1 : .76;
      line(c, x + (dx < 0 ? .08 : .92), y + top, x + (dx < 0 ? .08 : .92), y + bottom, '#92d9c781', .13);
    }
    const n = hash(x + 31, y - 7);
    if (n < .89) continue;
    const drift = Math.sin(time * .6 + n * 20) * .08;
    const rx = .25 + n * .3, ry = .09 + Math.sin(time * .8 + n * 9) * .02;
    c.beginPath(); c.ellipse(x + .5 + drift, y + .5, rx, ry, -.08, .18, Math.PI * 1.7);
    c.strokeStyle = '#c6efdb98'; c.lineWidth = .025; c.stroke();
    c.beginPath(); c.ellipse(x + .5 + drift, y + .5, rx * .56, ry * .5, -.08, 0, Math.PI);
    c.strokeStyle = '#70d0bf'; c.lineWidth = .025; c.stroke();
  }
  c.restore();
}
function meadow(c, x, y, time, n, k) {
  const xx = x + .25 + hash(y, x) * .4, yy = y + .4 + n * .3;
  const green = k === 2 ? '#7e94766b' : k === 3 ? '#608e8778' : '#5c916d75';
  const sway = Math.sin(time * .6 + n * 13) * .015;
  oval(c, xx, yy + .015, .16, .045, '#657d6220');
  for (let i = 0; i < 3; i++) {
    const offset = (i - 1) * .07;
    curve(c, [xx + offset, yy, xx + offset, yy - .06, xx + offset * 1.5 + sway, yy - .11, xx + offset * 1.8 + sway, yy - .16 - hash(i, x) * .06], green, .022);
  }
  if (n > .955) {
    const color = k === 2 ? '#f0c8ac' : k === 3 ? '#dfdce6' : '#ead994';
    for (let i = 0; i < 3; i++) {
      const dx = (i - 1) * .09, dy = (i % 2) * .09;
      oval(c, xx + dx, yy - .17 - dy, .038, .035, color);
      oval(c, xx + dx + .018, yy - .19 - dy, .015, .016, '#f7eed0');
    }
  }
}
function bridge(c, b) {
  const { left, right, top, bottom } = b;
  const horizontal = right - left >= bottom - top;
  box(c, left, top, right - left, bottom - top, '#a8ac95');
  if (horizontal) {
    for (let x = left; x < right; x += .65) {
      box(c, x + .025, top + .12, Math.min(.6, right - x - .025), bottom - top - .24, '#e2d9b7', '#9eaa99');
      line(c, x + .1, top + .25, x + .45, top + .25, '#fff1d2', .025);
    }
    for (const y of [top + .06, bottom - .06]) line(c, left, y, right, y, '#6b8985', .14);
  } else {
    for (let y = top; y < bottom; y += .65) box(c, left + .12, y + .025, right - left - .24, Math.min(.6, bottom - y - .025), '#e2d9b7', '#9eaa99');
    for (const x of [left + .06, right - .06]) line(c, x, top, x, bottom, '#6b8985', .14);
  }
  for (const x of [left + .1, right - .1]) for (const y of [top + .1, bottom - .1]) {
    box(c, x - .12, y - .23, .24, .38, '#ddd7bb', INK);
    oval(c, x, y - .25, .18, .08, '#fff0c9');
  }
}

function camp(c, site, time, active, completed) {
  c.save(); c.translate(site.x, site.y);
  oval(c, 0, .2, 3.5, 1.8, '#f4ebc33c');
  // Tent entrances face the open centre; the medic stays beside the shelter.
  for (const side of [-1, 1]) {
    const x = side * 2.3;
    oval(c, x + .2, -.3, 1.3, .35, '#354d5025');
    poly(c, [[x - 1.05, -.55], [x - .15, -2.55], [x + 1.18, -.55]], active ? '#7ab8a3' : '#f2e6bf');
    poly(c, [[x - .15, -2.55], [x + .32, -.55], [x + 1.18, -.55]], active ? '#3c9387' : '#c7b993');
    poly(c, [[x - .52, -.55], [x - .15, -1.61], [x + .26, -.55]], '#496365', null);
    line(c, x - .15, -2.55, x - 1.35, -.2, '#d8c58e', .035);
    if (side === 1) {
      box(c, x + .17, -1.62, .5, .45, '#f9f4db');
      line(c, x + .42, -1.55, x + .42, -1.23, '#be5770', .08);
      line(c, x + .26, -1.39, x + .58, -1.39, '#be5770', .08);
    }
  }
  // Teal always means safe rest; gold standards and seals mean secured.
  flag(c, -.7, -.8, time, true);
  if (active) {
    oval(c, -.7, -2.65, .3, .31, '#ffe1a0');
    poly(c, [[-.85, -2.65], [-.73, -2.52], [-.52, -2.81]], '#338579', null);
  }
  oval(c, 0, 1.35, .6, .27, '#6d7f73');
  for (let i = 0; i < 7; i++) oval(c, Math.cos(i * TAU / 7) * .51, 1.35 + Math.sin(i * TAU / 7) * .22, .13, .085, '#ded9b9');
  poly(c, [[-.27, 1.36], [-.1, .73], [.06, 1.08], [.24, .9 + Math.sin(time * 4) * .07], [.26, 1.39]], '#e59b62', null);
  poly(c, [[-.1, 1.36], [0, .99], [.13, 1.37]], '#ffe6a6', null);
  citizen(c, 1.6, .75, time, 1, 'wave', .72);
  box(c, 2.1, .57, .64, .44, '#eef2d9', INK);
  line(c, 2.42, .65, 2.42, .94, '#be5770', .075); line(c, 2.27, .8, 2.57, .8, '#be5770', .075);
  if (active) citizen(c, -1.7, .8, time, 2, 'idle', .68);
  const required = Array.isArray(site.required) ? site.required : [];
  if (required.length) {
    box(c, -1.72, 2.0, 3.44, .62, '#8b8b73', INK);
    box(c, -1.66, 2.02, 3.32, .1, '#d6c9a2');
    for (let i = 0; i < required.length; i++) {
      const row = Math.floor(i / 6), col = i % 6, count = Math.min(6, required.length - row * 6);
      const xx = (col - (count - 1) / 2) * .47, yy = 2.22 + row * .24;
      oval(c, xx, yy, .12, .095, '#445a57');
      if (active || completed.has(required[i])) oval(c, xx, yy - .01, .085, .067, '#ffe2a0');
    }
  }
  c.restore();
}
function romanArch(c, time) {
  c.save(); c.translate(HOME.x, HOME.y - 2.2);
  oval(c, 0, .35, 4.1, 1.1, '#768f8430');
  for (const side of [-1, 1]) {
    const x = side * 2.7;
    box(c, x - .6, -3, 1.2, 3.4, '#c6caba', INK);
    box(c, x - .49, -2.9, .83, 3.1, '#f1ecd3');
    for (let i = 0; i < 5; i++) line(c, x - .5, -2.65 + i * .55, x + .47, -2.65 + i * .55, '#b3bdac', .025);
    box(c, x - .72, .1, 1.44, .3, '#e5dcc0', INK);
    box(c, x - .74, -3.12, 1.48, .28, '#f8edcf', INK);
    flag(c, side * 4, .45, time, true);
  }
  c.beginPath(); c.moveTo(-2.12, -1.72); c.bezierCurveTo(-2.12, -4.45, 2.12, -4.45, 2.12, -1.72);
  c.strokeStyle = INK; c.lineWidth = .59; c.stroke(); c.strokeStyle = '#eee6c9'; c.lineWidth = .49; c.stroke();
  for (let i = 0; i < 9; i++) {
    const a = Math.PI + i * Math.PI / 8;
    line(c, Math.cos(a) * 2.1, -1.72 + Math.sin(a) * 2.0, Math.cos(a) * 2.34, -1.72 + Math.sin(a) * 2.22, '#b0b5a2', .035);
  }
  box(c, -3.4, -4.65, 6.8, .87, '#d7ceb1', INK);
  box(c, -3.53, -4.78, 7.06, .17, '#fff0cb', INK);
  for (const side of [-1, 1]) for (let i = 0; i < 4; i++) oval(c, side * (.3 + .15 * i), -4.12 - i * .08, .14, .065, '#a99b5b');
  oval(c, 0, -4.28, .18, .21, '#d7b45b');
  for (const side of [-1, 1]) {
    poly(c, [[side * .25, 1.25], [side * .82, 1.6], [side * .25, 1.95], [side * .36, 1.6]], '#a6ae85', null);
    citizen(c, side * 3.8, 1.5, time, side + 2, side < 0 ? 'wave' : 'basket', .8);
  }
  // A compact repair bench identifies the eastern workshop without a text sign.
  box(c, 4.7, -.15, 2, .23, '#c2a579', INK);
  for (const x of [4.9, 6.4]) line(c, x, .05, x, .7, '#788379', .12);
  poly(c, [[5, -.18], [5.25, -.5], [5.9, -.5], [6.2, -.35], [5.82, -.21], [5.82, -.08], [5.3, -.08]], '#879b9e');
  line(c, 6.05, -.2, 6.45, -.8, '#967954', .09);
  line(c, 6.22, -.85, 6.65, -.63, '#dbe2cf', .17);
  oval(c, 5.55, -.52, .16, .08, '#d4e6d4');
  c.restore();
}
function tower(c, x, y, h, conquered) {
  oval(c, x + .3, y + .22, 1.15, .33, '#263e4930');
  box(c, x - .85, y - h, 1.7, h, '#8a92a0', INK);
  box(c, x - .78, y - h, .57, h, '#bac0bf');
  for (let row = 0; row < h / .45; row++) {
    const yy = y - row * .45;
    line(c, x - .82, yy, x + .82, yy, '#697e87', .025);
    line(c, x + (row % 2 ? -.3 : .35), yy, x + (row % 2 ? -.3 : .35), yy - .44, '#73848b', .025);
  }
  box(c, x - .96, y - h - .17, 1.92, .28, '#d6cfb4', INK);
  for (const xx of [-.73, 0, .73]) box(c, x + xx - .19, y - h - .62, .38, .52, '#dcd4b7', INK);
  for (const yy of [y - h + .6, y - 1.05]) {
    box(c, x - .12, yy, .24, .48, '#344b59');
    line(c, x - .06, yy + .05, x - .06, yy + .39, conquered ? '#7fe4cb' : '#f4c47f', .035);
  }
}
function fortress(c, time, state, camps) {
  c.save(); c.translate(KING.x, KING.y);
  oval(c, 0, -1.3, 6.5, 2, '#344e5938');
  poly(c, [[-6, -1.2], [-5.3, -3.4], [-2.8, -4], [2.9, -4.1], [5.5, -2.9], [6.2, -1.1]], '#7d8d96', '#627881');
  box(c, -4.7, -4.15, 9.4, 2.7, '#b2b2ad', INK);
  for (let y = -4; y < -1.4; y += .48) {
    line(c, -4.6, y, 4.6, y, '#899997', .035);
    for (let x = -4.3 + (Math.round(y * 2) % 2) * .4; x < 4.5; x += .85) line(c, x, y, x, y + .47, '#899997', .025);
  }
  for (let x = -4.5; x <= 4.5; x += .75) box(c, x - .23, -4.6, .46, .56, '#e0d6b8', INK);
  tower(c, 0, -3.4, 4.1, !!state.conquered);
  poly(c, [[-1.18, -7.1], [0, -8.65], [1.18, -7.1]], '#a34b69', INK, .055);
  poly(c, [[0, -8.65], [1.18, -7.1], [.32, -7.1]], '#713e60', null);
  flag(c, 0, -8.45, time, !!state.conquered, 1.5);
  for (const side of [-1, 1]) {
    tower(c, side * 4.3, -1.25, 4.7, !!state.conquered);
    flag(c, side * 4.3, -6.5, time, !!state.conquered, 1.6);
    box(c, side * 2.2 - .37, -3.5, .74, 1.1, state.conquered ? '#388c83' : '#a04867', '#e9ce8c');
    poly(c, [[side * 2.2 - .16, -3.2], [side * 2.2, -3.4], [side * 2.2 + .16, -3.2], [side * 2.2, -2.9]], '#f7d88e', null);
  }
  // Gate is raised above the encounter centre, leaving the arena readable.
  c.beginPath(); c.moveTo(-1.15, -1.4); c.lineTo(-1.15, -2.6); c.bezierCurveTo(-1.15, -4.25, 1.15, -4.25, 1.15, -2.6); c.lineTo(1.15, -1.4); c.closePath();
  c.fillStyle = '#304956'; c.fill(); c.strokeStyle = '#dfd2ae'; c.lineWidth = .13; c.stroke();
  if (!state.conquered) for (let x = -.9; x <= .9; x += .3) line(c, x, -3.15, x, -1.5, '#b99e75', .055);
  box(c, -1.6, -1.35, 3.2, .26, '#e1d6b9', INK);
  box(c, -1.85, -1.08, 3.7, .22, '#c0c2b0', INK);
  for (let i = 0; i < CAMPS.length; i++) {
    const xx = (i - (CAMPS.length - 1) / 2) * .65;
    oval(c, xx, -4.42, .23, .24, '#354d5b');
    oval(c, xx, -4.44, .16, .17, camps.has(CAMPS[i].id) ? '#ffe19a' : '#899a9e');
  }
  if (state.conquered) for (const side of [-1, 1]) citizen(c, side * 2.1, .1, time, side + 2, 'wave', .72);
  c.restore();
}

function ground(c, b, time) {
  const wash = c.createLinearGradient(0, 0, 0, HEIGHT);
  for (const region of [...LANDSCAPES].sort((a, b) => a.top - b.top)) {
    const p = palettes[motifBand[region.motif] ?? 0];
    wash.addColorStop(Math.max(0, (region.top + 2) / HEIGHT), p.ground);
    wash.addColorStop(Math.min(1, (region.bottom - 2) / HEIGHT), p.ground);
  }
  box(c, b.left, b.top, b.right - b.left, b.bottom - b.top, wash);
  // Soft overlapping washes, not thresholded per-cell contour colours.
  for (let gy = Math.floor(b.top / 9) - 1; gy <= Math.ceil(b.bottom / 9); gy++) for (let gx = Math.floor(b.left / 12) - 1; gx <= Math.ceil(b.right / 12); gx++) {
    const n = hash(gx, gy), x = gx * 12 + n * 7, y = gy * 9 + hash(gy, gx) * 5;
    oval(c, x, y, 5 + n * 4, 2 + n * 2, n > .5 ? '#e9dcb90a' : '#526b7009');
  }
  for (let y = Math.floor(b.top); y < Math.ceil(b.bottom); y++) for (let x = Math.floor(b.left); x < Math.ceil(b.right); x++) {
    const tile = tileAt(x, y), n = hash(x, y), k = band(x, y), p = palettes[k];
    if (!passable(x + .5, y + .5) && tile !== 'water') box(c, x, y, 1, 1, '#344d5916');
    if (tile === 'water') continue;
    if (tile === 'path' || tile === 'road' || tile === 'bridge') {
      box(c, x, y, 1.01, 1.01, p.road);
      if (tileAt(x, y + 1) !== tile) line(c, x, y + .96, x + 1, y + .96, '#6c7e663d', .07);
      if (n > .58) { line(c, x + .18, y + .38, x + .45, y + .33, '#a7a886', .023); oval(c, x + .76, y + .77, .055, .028, '#fff1cf'); }
    } else if (tile === 'stone' || tile === 'ruin' && passable(x + .5, y + .5)) {
      box(c, x, y, 1.01, 1.01, n > .4 ? '#dddcc2' : '#ced3bb');
      line(c, x, y + .96, x + 1, y + .96, '#9cab9e', .03);
      line(c, x + .02, y, x + .02, y + 1, '#9cab9e', .03);
      line(c, x + .12, y + .12, x + .8, y + .12, '#f5efcf', .025);
    } else if (passable(x + .5, y + .5) && n > .69) meadow(c, x, y, time, n, k);
  }
  water(c, b, time);
}
const routeMarks = ROUTES.flatMap(route => route.slice(1).flatMap((to, i) => {
  const from = route[i], dx = to[0] - from[0], dy = to[1] - from[1], length = Math.hypot(dx, dy);
  if (length < 14) return [];
  return [{ x: (from[0] + to[0]) / 2, y: (from[1] + to[1]) / 2, angle: Math.atan2(dy, dx) }];
}));
function wayfinding(c, b) {
  for (const mark of routeMarks) {
    if (!visible(mark, b, 1) || !['path', 'road'].includes(tileAt(mark.x, mark.y))) continue;
    c.save(); c.translate(mark.x, mark.y); c.rotate(mark.angle);
    poly(c, [[-.35, -.27], [.12, 0], [-.35, .27], [-.16, 0]], '#aa9d6b', null);
    line(c, -.3, -.27, .13, 0, '#fff1ce', .03);
    c.restore();
  }
}
function landmarkTerrain(c, b) {
  for (const arch of aqueductFeatures) {
    const { x, y, w, h, index } = arch;
    if (x > b.right || x + w < b.left || y > b.bottom || y + h < b.top) continue;
    c.save(); c.translate(x, y); c.scale(w, h);
    if (index % 7 === 4) {
      poly(c, [[.12, .8], [.24, .61], [.51, .66], [.6, .85], [.34, .93]], '#bcb59d');
      poly(c, [[.61, .87], [.7, .7], [.88, .75], [.93, .9]], '#e1d5b4');
    } else {
      aqueductCell(c, 0, 0);
      for (const xx of [.13, .86]) for (let row = 0; row < 3; row++) line(c, xx - .075, .42 + row * .15, xx + .075, .42 + row * .15, '#899b8e', .012);
      box(c, .1, .14, .8, .035, '#a4b6a0');
      if (index % 3 === 0) curve(c, [.87, .27, .74, .43, .93, .55, .8, .73], '#5b8b73', .035);
    }
    c.restore();
  }
}
function blockingFootprint(x, y, w, h) {
  if (x < .1 || y < .1 || x + w >= WIDTH || y + h >= HEIGHT) return false;
  for (let yy = Math.floor(y); yy <= Math.floor(y + h); yy++) for (let xx = Math.floor(x); xx <= Math.floor(x + w); xx++) {
    if (passable(xx + .5, yy + .5) || tileAt(xx, yy) === 'water') return false;
  }
  return true;
}
const aqueductFeatures = LANDMARKS.filter(site => site.kind === 'ruined-aqueduct' && site.from && site.to).flatMap(site => {
  const dx = site.to[0] - site.from[0], dy = site.to[1] - site.from[1], length = Math.hypot(dx, dy);
  const arches = [];
  for (let distance = 0, index = 0; distance + 2.6 <= length; distance += 2.8, index++) {
    const x = site.from[0] + dx * distance / length, baseY = site.from[1] + dy * distance / length;
    for (const offset of [-.9, -.3, .3, -1.5, .9]) {
      const y = baseY + offset, w = 2.6, h = 2.4;
      if (blockingFootprint(x - .08, y - .08, w + .16, h + .16)) { arches.push({ x, y, w, h, index }); break; }
    }
  }
  return arches;
});
function makeTerrainFeatures() {
  const features = [];
  const add = feature => {
    if (!blockingFootprint(feature.x - .08, feature.y - .08, feature.w + .16, feature.h + .16)) return false;
    if (aqueductFeatures.some(arch => feature.x < arch.x + arch.w && feature.x + feature.w > arch.x && feature.y < arch.y + arch.h && feature.y + feature.h > arch.y)) return false;
    if (features.some(other => feature.x < other.x + other.w + .35 && feature.x + feature.w + .35 > other.x && feature.y < other.y + other.h + .25 && feature.y + feature.h + .25 > other.y)) return false;
    features.push(feature);
    return true;
  };
  // Large ledges establish the geography first; planting occupies the gaps.
  for (let y = 1; y < HEIGHT - 3; y += 4) for (let x = 1; x < WIDTH - 4; x += 8) {
    const n = hash(x, y), k = band(x, y);
    if (n < .29) continue;
    for (let offset = 0; offset < 4; offset++) {
      if (add({ x: x + n, y: y + offset + .16, w: 4 + n * 3.2, h: k === 3 ? 3.2 : 1.6 + n * .7, n, k, kind: 'ridge' })) break;
    }
  }
  for (let y = 1; y < HEIGHT - 2; y += 3) for (let x = 1; x < WIDTH - 2; x += 4) {
    const n = hash(x + 53, y + 17), k = band(x, y);
    if (n < .28) continue;
    const kind = k === 0 ? 'olive' : k === 2 ? (n > .68 ? 'olive' : 'vine') : k === 4 ? 'cypress' : 'rock';
    add({ x: x + hash(y, x), y: y + hash(x, y) * .5, w: kind === 'vine' ? 3.4 : 1.7 + n, h: kind === 'vine' ? 1.7 : 1.6 + n, n, k, kind });
  }
  return features.sort((a, b) => a.y + a.h - b.y - b.h);
}
const terrainFeatures = makeTerrainFeatures();
function ridge(c, feature) {
  const { w, h, n, k } = feature, p = palettes[k];
  oval(c, w * .52, h * .83, w * .46, h * .13, '#30465028');
  const crest = [[.12, h * .48], [w * .18, h * .16], [w * .37, h * .22], [w * .53, .08], [w * .78, h * .19], [w - .12, h * .53]];
  poly(c, [...crest, [w * .91, h * .88], [w * .64, h * .95], [w * .39, h * .84], [w * .14, h * .92]], p.face, '#607776', .045);
  poly(c, [...crest, [w * .76, h * .38], [w * .49, h * .34], [w * .29, h * .46]], p.rock, null);
  // Short broken shelves follow the rock face; no continuous terrace stripes.
  for (let i = 0; i < 3; i++) {
    const xx = w * (.16 + i * .23), yy = h * (.52 + hash(i, Math.floor(n * 100)) * .2);
    poly(c, [[xx, yy], [xx + w * .16, yy - .08], [xx + w * .2, yy + .04], [xx + w * .03, yy + .15]], i % 2 ? '#b9bca1' : p.rock, null);
    line(c, xx + w * .05, yy + .16, xx + w * .17, yy + .1, '#5c74735c', .055);
  }
  line(c, w * .38, h * .4, w * .34, h * .75, '#52697170', .045);
  if (k === 3) poly(c, [[w * .29, h * .23], [w * .53, .08], [w * .78, h * .19], [w * .65, h * .3], [w * .52, h * .23], [w * .46, h * .34]], '#e8ede2', null);
  else if (k !== 2) oval(c, w * .23, h * .31, w * .09, h * .08, '#93a67d');
}
function blockingScenery(c, b, time) {
  for (const feature of terrainFeatures) {
    const { x, y, w, h, n, k, kind } = feature;
    if (x > b.right || x + w < b.left || y > b.bottom || y + h < b.top) continue;
    c.save(); c.translate(x, y);
    if (kind === 'ridge') ridge(c, feature);
    else {
      c.scale(w, h);
      if (kind === 'olive') olive(c, 0, 0, time, n);
      else if (kind === 'vine') vine(c, 0, 0, time, n);
      else if (kind === 'cypress') cypress(c, 0, 0, n);
      else limestone(c, 0, 0, n, palettes[k]);
    }
    c.restore();
  }
  for (let y = Math.floor(b.top); y < Math.ceil(b.bottom); y++) for (let x = Math.floor(b.left); x < Math.ceil(b.right); x++) {
    const n = hash(x - 81, y + 63);
    if (n < .87 || passable(x + .5, y + .5) || tileAt(x, y) === 'water') continue;
    if (![[0, 1], [0, -1], [-1, 0], [1, 0]].some(([dx, dy]) => passable(x + dx + .5, y + dy + .5))) continue;
    const k = band(x, y);
    oval(c, x + .5, y + .7, .28, .09, '#3d66572c');
    for (let i = 0; i < 3; i++) {
      const xx = x + .32 + i * .16, yy = y + .59 - (i % 2) * .08;
      oval(c, xx, yy, .13, .09, k === 2 ? '#8a9b7a' : '#709e89');
      line(c, xx, yy, xx + .025, yy - .16, '#b6c5a1', .025);
      if (n > .96) oval(c, xx + .025, yy - .18, .04, .035, k === 3 ? '#e5dae8' : '#ebd89c');
    }
  }
}

export function drawLandscape(c, { bounds = { left: 0, top: 0, right: WIDTH, bottom: HEIGHT }, time = 0, state = {} } = {}) {
  const b = { left: Math.max(0, bounds.left), top: Math.max(0, bounds.top), right: Math.min(WIDTH, bounds.right), bottom: Math.min(HEIGHT, bounds.bottom) };
  if (b.left >= b.right || b.top >= b.bottom) return;
  const camps = collection(state.camps), completed = collection(state.completed);
  c.save();
  c.beginPath(); c.rect(b.left, b.top, b.right - b.left, b.bottom - b.top); c.clip();
  c.lineJoin = 'round'; c.lineCap = 'round';
  ground(c, b, time);
  blockingScenery(c, b, time);
  landmarkTerrain(c, b, time);
  wayfinding(c, b);
  for (const site of BRIDGES) if (site.right >= b.left && site.left <= b.right && site.bottom >= b.top && site.top <= b.bottom) bridge(c, site);
  for (const site of ENCOUNTERS) {
    if (site.kind === 'boss' || !visible(site, b, 1)) continue;
    if (completed.has(site.id) || state.conquered) {
      for (const side of [-1, 1]) for (let i = 0; i < 3; i++) oval(c, site.x + side * (.12 + i * .045), site.y - .06 - i * .1, .08, .04, '#f3d68e');
    } else {
      oval(c, site.x, site.y, .36, .19, '#354d5022');
      for (const side of [-1, 1]) line(c, site.x - .15, site.y + side * .1, site.x + .15, site.y - side * .1, '#8e7a69', .045);
    }
  }
  if (visible(HOME, b, 7)) romanArch(c, time);
  for (const site of CAMPS) if (visible(site, b, 5)) camp(c, site, time, camps.has(site.id), completed);
  if (visible(KING, b, 11)) fortress(c, time, state, camps);
  const objective = nextObjective(state);
  if (objective && visible(objective, b, 4)) objectiveBeacon(c, objective, time);
  c.restore();
}

function atlasWindow(state, player) {
  const camps = collection(state.camps), completed = collection(state.completed);
  let active = CAMPS.findIndex(site => !camps.has(site.id));
  if (active < 0) active = CAMPS.length - 1;
  const shown = new Set(LANDSCAPES.map((_, i) => i).filter(i => state.conquered || i <= active));
  for (const site of ENCOUNTERS) if (completed.has(site.id)) shown.add(site.region ?? site.stage);
  for (let i = 0; i < CAMPS.length; i++) if (camps.has(CAMPS[i].id)) shown.add(i);
  const hasPlayer = player && Number.isFinite(player.x) && Number.isFinite(player.y);
  if (hasPlayer) {
    const region = LANDSCAPES.findIndex(region => player.y >= region.top && player.y < region.bottom);
    if (region >= 0) shown.add(region);
  }
  const regions = LANDSCAPES.filter((_, i) => shown.has(i));
  return { active, shown, top: Math.min(...regions.map(r => r.top), hasPlayer ? Math.max(0, player.y - 4) : HEIGHT),
    bottom: Math.max(...regions.map(r => r.bottom), hasPlayer ? Math.min(HEIGHT, player.y + 4) : 0) };
}

export function atlasAspect(state = {}, player) {
  const view = atlasWindow(state, player);
  return WIDTH / Math.max(1, view.bottom - view.top);
}

export function drawAtlas(c, width, height, state = {}, player) {
  if (!(width > 0 && height > 0)) return;
  c.save();
  box(c, 0, 0, width, height, '#263f46');
  const view = atlasWindow(state, player), mapHeight = view.bottom - view.top;
  const margin = Math.min(24, width / 8, height / 8);
  const scale = Math.min((width - margin * 2) / WIDTH, (height - margin * 2) / mapHeight);
  if (scale <= 0) { c.restore(); return; }
  c.translate(Math.round((width - WIDTH * scale) / 2), Math.round((height - mapHeight * scale) / 2));
  c.scale(scale, scale); c.translate(0, -view.top);
  const snappedBox = (x, y, w, h, color) => {
    const left = Math.round(x * scale) / scale, top = view.top + Math.round((y - view.top) * scale) / scale;
    const right = Math.round((x + w) * scale) / scale, bottom = view.top + Math.round((y + h - view.top) * scale) / scale;
    box(c, left, top, right - left, bottom - top, color);
  };
  const shownAt = y => view.shown.has(LANDSCAPES.findIndex(r => y >= r.top && y < r.bottom));
  const colorAt = (x, y) => {
    if (!shownAt(y)) return '#3b5558';
    const tile = tileAt(x, y), p = palettes[band(x, y)];
    return tile === 'water' ? '#46b8bf' : ['path', 'road', 'bridge'].includes(tile) ? p.road : tile === 'stone' ? '#ece5c6' : passable(x + .5, y + .5) ? p.ground : p.face;
  };
  // Merge flat-colour scanline runs and snap shared edges to physical pixels.
  // Fractional-scale cell rectangles otherwise leave a distracting hairline grid.
  for (let y = Math.floor(view.top); y < Math.ceil(view.bottom); y++) {
    let start = 0, color = colorAt(0, y);
    for (let x = 1; x <= WIDTH; x++) {
      const next = x < WIDTH ? colorAt(x, y) : null;
      if (next !== color) { snappedBox(start, y, x - start, 1, color); start = x; color = next; }
    }
  }
  const activeRegion = LANDSCAPES[view.active];
  if (activeRegion && !state.conquered) {
    snappedBox(0, activeRegion.top, WIDTH, activeRegion.bottom - activeRegion.top, '#ffe49620');
    line(c, .4, activeRegion.top + .4, WIDTH - .4, activeRegion.top + .4, '#ffe5a0', 1 / scale);
    line(c, .4, activeRegion.bottom - .4, WIDTH - .4, activeRegion.bottom - .4, '#ffe5a0', 1 / scale);
  }
  for (const b of BRIDGES) if (shownAt(b.top)) snappedBox(b.left, b.top, b.right - b.left, b.bottom - b.top, '#f8e6b7');
  const completed = collection(state.completed), camps = collection(state.camps);
  for (const site of ENCOUNTERS) if (!state.returnQuest && site.kind !== 'boss' && view.shown.has(site.region ?? site.stage)) {
    if (completed.has(site.id) || state.conquered) {
      oval(c, site.x, site.y, 2.4 / scale, 2.4 / scale, '#f8e3a2');
    } else if ((site.region ?? site.stage) === view.active) {
      oval(c, site.x, site.y, 3.4 / scale, 3.4 / scale, '#713e56');
      oval(c, site.x, site.y, 1.8 / scale, 1.8 / scale, '#f4bb99');
    }
  }
  for (const site of [HOME, ...CAMPS]) {
    if (!shownAt(site.y)) continue;
    c.save(); c.translate(site.x, site.y); c.scale(1 / scale, 1 / scale);
    oval(c, 0, 0, 8.5, 8.5, INK); oval(c, 0, 0, 7, 7, camps.has(site.id) ? '#f5dda0' : '#e5eed9');
    poly(c, [[-4.5, 3], [0, -4.8], [4.5, 3]], '#3b877a', null);
    poly(c, [[-1.4, 3], [0, -.4], [1.4, 3]], '#e7efd8', null);
    if (site === HOME) { box(c, -4, -3, 2, 7, '#627b70'); box(c, 2, -3, 2, 7, '#627b70'); box(c, -4, -4, 8, 2, '#627b70'); }
    c.restore();
  }
  // Fortress silhouette remains distinct from round encounter and camp markers.
  if (shownAt(KING.y)) {
    box(c, KING.x - 1.5, KING.y - .7, 3, 2, state.conquered ? '#f1d48a' : '#8d4263', '#f5deb2');
    for (const dx of [-1.4, 0, 1.4]) box(c, KING.x + dx - .35, KING.y - 1.4, .7, .9, '#f1d9aa');
  }
  const objective = nextObjective(state);
  if (objective) {
    c.save(); c.translate(objective.x, objective.y); c.scale(1 / scale, 1 / scale);
    oval(c, 0, 0, 6.5, 6.5, '#263f46');
    oval(c, 0, 0, 4.8, 4.8, '#ffe69a');
    line(c, 0, -2, 0, -15, '#fff5c7', 1.6);
    poly(c, [[.7, -15], [11, -14], [7.8, -10.5], [11, -7], [.7, -7]], '#ffe091', '#6f6549', 1);
    c.restore();
  }
  drawQuestAtlas(c,{quest:state.returnQuest,completed:state.completed,target:state.returnQuestTarget,scale,top:view.top,bottom:view.bottom});
  if (player && Number.isFinite(player.x) && Number.isFinite(player.y)) {
    c.save(); c.translate(player.x, player.y); c.scale(1 / scale, 1 / scale);
    oval(c, 0, 0, 18, 18, '#263f46'); oval(c, 0, 0, 16, 16, '#ffdf83'); oval(c, 0, 0, 13, 13, '#eff5dd');
    const build = normalizeSlot(player.weapon ? player : state.squad?.[0]);
    drawBot(c, { ...build, x: 0, y: 2, team: 0, captain: !!player.captain, angle: -.35, hp: 1, maxHp: 1,
      weaponTier: state.weaponTier ?? player.weaponTier ?? 0, armorTier: state.armorTier ?? player.armorTier ?? 0 }, 0, { size: 23, preview: true });
    c.restore();
  }
  c.restore();
}
