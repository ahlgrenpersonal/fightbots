import { actionPose, bowGrip, bowArrowVisible, shieldOpening, botScale } from './geometry.js?v=roman34';
const TAU = Math.PI * 2;
const INK = '#314b50';
const GOLD = '#d8ae54';
const LIGHT_GOLD = '#ffdf8c';
const SILVER = '#d7e5e7';
const TEAMS = [
  { main: '#359fba', light: '#80e5d4', dark: '#246576', cloth: '#207c88', eye: '#a5ffee' },
  { main: '#d66b71', light: '#ffb394', dark: '#854b6d', cloth: '#95425c', eye: '#ffe9b3' }
];

function clamp(n, low = 0, high = 1) { return Math.max(low, Math.min(high, n)); }
function mix(a, b, n) { return a + (b - a) * n; }
function path(c, points, fill, stroke = INK, width = 2) {
  c.beginPath();
  points.forEach(([x, y], i) => i ? c.lineTo(x, y) : c.moveTo(x, y));
  c.closePath();
  if (fill) { c.fillStyle = fill; c.fill(); }
  if (stroke) { c.strokeStyle = stroke; c.lineWidth = width; c.stroke(); }
}
function box(c, x, y, w, h, r, fill, stroke = null, width = 2) {
  c.beginPath();
  c.roundRect(x, y, w, h, r);
  if (fill) { c.fillStyle = fill; c.fill(); }
  if (stroke) { c.strokeStyle = stroke; c.lineWidth = width; c.stroke(); }
}
function oval(c, x, y, rx, ry, fill, stroke = null, width = 2) {
  c.beginPath();
  c.ellipse(x, y, rx, ry, 0, 0, TAU);
  if (fill) { c.fillStyle = fill; c.fill(); }
  if (stroke) { c.strokeStyle = stroke; c.lineWidth = width; c.stroke(); }
}
function line(c, x, y, xx, yy, color, width = 2) {
  c.beginPath(); c.moveTo(x, y); c.lineTo(xx, yy);
  c.strokeStyle = color; c.lineWidth = width; c.stroke();
}
function arc(c, x, y, r, start, end, color, width) {
  c.beginPath(); c.arc(x, y, r, start, end);
  c.strokeStyle = color; c.lineWidth = width; c.stroke();
}
function metal(c, x, y, xx, yy, light = '#f5ffff', middle = SILVER, dark = '#849fa8') {
  const g = c.createLinearGradient(x, y, xx, yy);
  g.addColorStop(0, light); g.addColorStop(.46, middle); g.addColorStop(1, dark);
  return g;
}
function leaf(c, x, y, angle, length, color, width = length * .36) {
  c.save(); c.translate(x, y); c.rotate(angle);
  c.beginPath(); c.moveTo(-length / 2, 0);
  c.quadraticCurveTo(0, -width, length / 2, 0);
  c.quadraticCurveTo(0, width, -length / 2, 0);
  c.fillStyle = color; c.fill(); c.restore();
}
function laurel(c, x, y, radius, color = GOLD) {
  for (const side of [-1, 1]) {
    c.save(); c.translate(x, y); c.scale(side, 1);
    c.beginPath(); c.moveTo(0, radius * .8);
    c.quadraticCurveTo(-radius * 1.2, radius * .25, -radius * .55, -radius * .8);
    c.strokeStyle = color; c.lineWidth = radius * .08; c.stroke();
    for (let i = 0; i < 5; i++) {
      const a = 1.9 + i * .29;
      leaf(c, Math.cos(a) * radius * .8, Math.sin(a) * radius * .8,
        -.6 + i * .32, radius * .37, color);
    }
    c.restore();
  }
}

function banner(c, x, y, time, phase) {
  c.save(); c.translate(x, y);
  const sway = Math.sin(time * 1.6 + phase) * .035;
  line(c, -.32, -.05, .32, -.05, GOLD, .045);
  oval(c, -.35, -.05, .045, .045, LIGHT_GOLD);
  oval(c, .35, -.05, .045, .045, LIGHT_GOLD);
  path(c, [[-.25, 0], [.25, 0], [.25 + sway, .83], [sway, 1.02], [-.25 + sway, .83]], '#a63851', '#d5ac5f', .022);
  path(c, [[-.18, .04], [-.08, .04], [-.08 + sway, .83], [-.18 + sway, .77]], '#d85d68', null);
  line(c, .18, .06, .18 + sway, .79, '#702b45', .035);
  laurel(c, sway * .5, .45, .17, LIGHT_GOLD);
  path(c, [[0, .27], [.07, .43], [0, .56], [-.07, .43]], '#f9df91', null);
  c.restore();
}

function column(c, x, y) {
  c.save(); c.translate(x, y);
  oval(c, .09, .04, .38, .14, '#3e686626');
  box(c, -.31, -.13, .62, .18, .025, '#9eb8bb', INK, .018);
  box(c, -.27, -.22, .54, .12, .02, '#f0f6f4', '#9eb8bb', .017);
  box(c, -.18, -1.46, .36, 1.25, .035,
    metal(c, -.18, 0, .2, 0, '#f9ffff', '#dae8e9', '#8fa9ae'), '#7e999e', .018);
  for (let i = 0; i < 4; i++) {
    const xx = -.115 + i * .074;
    line(c, xx, -1.38, xx, -.31, '#a5bec2', .025);
    line(c, xx - .014, -1.38, xx - .014, -.31, '#faffff', .012);
  }
  box(c, -.25, -1.5, .5, .12, .025, '#c4d7d9', '#809c9f', .017);
  for (const side of [-1, 1]) {
    oval(c, side * .22, -1.45, .08, .075, '#e9f0ea', '#8fa6a8', .018);
    oval(c, side * .22, -1.45, .025, .025, '#acbec0');
  }
  box(c, -.31, -1.64, .62, .13, .015, '#e9f2ee', '#7d989b', .018);
  line(c, -.27, -1.61, .26, -1.61, '#ffffff', .025);
  c.restore();
}

function cypress(c, x, y, time, phase) {
  c.save(); c.translate(x, y);
  oval(c, .04, .06, .25, .09, '#315f5b25');
  box(c, -.17, -.25, .34, .28, .025, '#adbfc1', '#789798', .018);
  box(c, -.2, -.28, .4, .07, .012, '#e0e8e5', '#8ba5a6', .018);
  line(c, 0, -.24, 0, -1.28, '#6f7860', .055);
  const sway = Math.sin(time * .8 + phase) * .025;
  c.beginPath(); c.moveTo(0, -.31);
  c.bezierCurveTo(-.4, -.49, -.22, -1.23, sway, -1.72);
  c.bezierCurveTo(.18, -1.3, .4, -.5, 0, -.31);
  c.fillStyle = '#286c58'; c.fill();
  for (let i = 0; i < 7; i++) {
    const yy = -.48 - i * .15;
    leaf(c, -.05 + sway * i / 7, yy, -1.22, .31 - i * .025, i % 2 ? '#71a783' : '#438e6c', .045);
  }
  c.restore();
}

function olive(c, x, y, time, mirror) {
  c.save(); c.translate(x, y); c.scale(mirror, 1);
  oval(c, 0, 0, .32, .1, '#315f5b26');
  box(c, -.24, -.31, .48, .32, .03, '#a8b9bd', '#7e999c', .02);
  box(c, -.28, -.35, .56, .09, .018, '#e7efeb', '#8da9aa', .02);
  line(c, -.03, -.35, .02, -.98, '#737d6b', .065);
  for (let i = 0; i < 5; i++) {
    const a = i * 2.4, xx = Math.cos(a) * .2, yy = -.95 + Math.sin(a) * .2;
    line(c, 0, -.66, xx, yy, '#76846a', .03);
    oval(c, xx, yy, .22, .18, i % 2 ? '#54836a' : '#6c9c7a');
    for (let j = 0; j < 5; j++) {
      const b = j * 2.5 + i;
      leaf(c, xx + Math.cos(b) * .15, yy + Math.sin(b) * .12,
        b + Math.sin(time + i) * .07, .14, j % 2 ? '#adbf8c' : '#8cb088', .025);
    }
  }
  c.restore();
}

function archway(c, time) {
  // All architecture stays north of the playable rectangle.
  box(c, .05, 0, 9.9, 1.36, .02, '#b4c9ce');
  for (let row = 0; row < 3; row++) {
    const yy = row * .42;
    line(c, .12, yy + .4, 9.88, yy + .4, '#9db6bd', .018);
    for (let x = .4 + (row % 2) * .55; x < 10; x += 1.1)
      line(c, x, yy, x, yy + .4, '#a3bbc0', .017);
  }
  box(c, 2.76, .07, 4.48, 1.34, .025, '#d9e5e6', '#89a3ab', .025);
  // A recessed, semicircular opening and individually cut arch stones.
  c.beginPath(); c.moveTo(4.08, 1.4); c.lineTo(4.08, .87);
  c.arc(5, .87, .92, Math.PI, TAU); c.lineTo(5.92, 1.4); c.closePath();
  c.fillStyle = '#547e7f'; c.fill();
  box(c, 4.28, .88, 1.44, .53, .01, '#739891');
  box(c, 4.46, 1.03, 1.08, .39, .01, '#90b3a7');
  for (let i = 0; i < 11; i++) {
    const a = Math.PI + i * Math.PI / 11, b = a + Math.PI / 11;
    c.beginPath(); c.arc(5, .87, 1.17, a + .009, b - .009);
    c.arc(5, .87, .94, b - .009, a + .009, true); c.closePath();
    c.fillStyle = i % 2 ? '#edf3ef' : '#d1dfe0'; c.fill();
    c.strokeStyle = '#8ca7ac'; c.lineWidth = .018; c.stroke();
  }
  for (const x of [3.83, 5.94]) {
    box(c, x, .86, .23, .57, .012, '#edf4f0', '#95aeb1', .018);
    line(c, x + .05, .94, x + .05, 1.39, '#ffffff', .02);
  }
  path(c, [[4.87, 0], [5.13, 0], [5.1, .17], [4.9, .17]], GOLD, '#9c874e', .018);
  for (const x of [3.12, 6.88]) {
    box(c, x - .18, .18, .36, 1.17, .025, '#eaf2f0', '#9bb2b7', .02);
    for (const dx of [-.09, 0, .09]) line(c, x + dx, .27, x + dx, 1.24, '#b0c5c8', .025);
    box(c, x - .26, .12, .52, .12, .01, '#f5f9f4', '#91aab0', .02);
    box(c, x - .26, 1.29, .52, .13, .01, '#c0d3d5', '#91aab0', .02);
  }
  box(c, 2.58, 0, 4.84, .12, .01, '#f4f8f2', '#96b0b5', .025);
  for (let i = 0; i < 4; i++) {
    const x = 2.63 - i * .12, y = 1.39 + i * .115, width = 4.74 + i * .24;
    box(c, x, y, width, .13, .012, i % 2 ? '#dce7e7' : '#eaf1ed', '#99b1b5', .014);
    line(c, x + .025, y + .018, x + width - .025, y + .018, '#ffffff', .022);
    line(c, x, y + .115, x + width, y + .115, '#829ea6', .018);
  }
  for (const x of [1.7, 8.3]) banner(c, x, .14, time, x);
  for (const x of [.5, 9.5]) cypress(c, x, 1.73, time, x);
}

function medallion(c) {
  c.save(); c.translate(5, 7.65);
  oval(c, 0, 0, 1.68, 1.68, '#c1d4d4', '#a3bdc0', .025);
  oval(c, 0, 0, 1.55, 1.55, '#d5e2df', '#9fae8e', .035);
  oval(c, 0, 0, 1.39, 1.39, '#cbdedb', '#b2c9c4', .025);
  // Tesserae are deliberate, low-contrast geometry rather than floor noise.
  for (let i = 0; i < 48; i++) {
    c.save(); c.rotate(i * TAU / 48); c.translate(0, -1.48);
    box(c, -.045, -.035, .09, .07, .008, i % 3 ? '#7aaba8' : '#c2aa6b'); c.restore();
  }
  for (let i = 0; i < 8; i++) {
    c.save(); c.rotate(i * TAU / 8);
    path(c, [[0, -1.22], [.22, -.34], [0, -.12], [-.22, -.34]], i % 2 ? '#b3ceca' : '#8eb9b4', '#c8dbd5', .02);
    path(c, [[0, -1.22], [0, -.12], [-.22, -.34]], '#bfd7d0', null);
    c.restore();
  }
  oval(c, 0, 0, .46, .46, '#d7e2d7', '#b9a776', .035);
  laurel(c, 0, 0, .3, '#9f9f73');
  path(c, [[0, -.2], [.09, 0], [0, .2], [-.09, 0]], '#91b6ac', null);
  c.restore();
}

/** Draw in world coordinates; the caller supplies the uniform world transform. */
export function drawCourtyard(ctx, time = 0) {
  const c = ctx;
  c.save(); c.lineCap = 'round'; c.lineJoin = 'round';
  c.beginPath(); c.rect(0, 0, 10, 15); c.clip();
  box(c, 0, 0, 10, 15, 0, '#d7e3e5');
  box(c, .77, 1.8, 8.46, 12.1, .025, '#a4bec1');
  box(c, .88, 1.85, 8.24, 11.96, .02, '#e0e9e8');
  for (let row = 0; row < 12; row++) {
    const yy = 1.87 + row;
    for (let col = 0; col < 8; col++) {
      const xx = 1 + col;
      box(c, xx + .015, yy + .015, .97, .97, .012,
        ['#e0e9e8', '#dce6e7', '#d8e3e5', '#e4eceb'][(col * 3 + row * 7) % 4]);
      line(c, xx + .03, yy + .035, xx + .96, yy + .035, '#f7faf655', .018);
    }
  }
  // Sparse marble veins, never cracks that imply impassable terrain.
  for (const [x, y] of [[2.2, 3.4], [7.3, 4.6], [3.2, 10.7], [6.7, 12.2]]) {
    c.beginPath(); c.moveTo(x, y); c.bezierCurveTo(x + .14, y + .12, x + .38, y + .02, x + .55, y + .18);
    c.strokeStyle = '#b8cbcf66'; c.lineWidth = .016; c.stroke();
  }
  medallion(c);
  for (const side of [0, 1]) {
    const x = side ? 9.22 : .08;
    box(c, x, 1.8, .7, 12.25, .02, '#bdced1');
    line(c, x + .08, 1.9, x + .08, 13.95, '#eef5ef', .03);
    line(c, x + .6, 1.9, x + .6, 13.95, '#90afb1', .03);
    for (let yy = 2.1; yy < 13.8; yy += .52) {
      path(c, [[x + .26, yy], [x + .39, yy + .13], [x + .26, yy + .26], [x + .13, yy + .13]], '#86b4af', null);
      box(c, x + .43, yy + .07, .09, .12, .008, '#c4aa6f');
    }
    const cx = side ? 9.61 : .39;
    for (const yy of [3.7, 6.55, 9.4, 12.25]) column(c, cx, yy);
    for (const yy of [4.9, 10.6]) cypress(c, cx, yy, time, yy + side);
  }
  archway(c, time);
  box(c, 0, 14.08, 10, .92, .01, '#a9c0c5');
  box(c, .06, 14.1, 9.88, .14, .012, '#f0f5ef', '#91adb1', .02);
  box(c, .05, 14.6, 9.9, .12, .012, '#d4e2df', '#91adb1', .018);
  for (let x = 1.2; x < 9.6; x += .8) {
    box(c, x, 14.31, .55, .16, .012, '#729b9b');
    line(c, x + .08, 14.35, x + .47, 14.35, '#c0d6c9', .022);
  }
  olive(c, .45, 14.04, time, 1);
  olive(c, 9.55, 14.04, time, -1);
  c.restore();
}

// Equipment is drawn along local +X, with the grip at the origin. Both the
// battle renderer and the 64px inventory renderer call these exact routines.
function weaponArt(c, id, colors, draw = 0, released = false, extension = 0, tier = 0) {
  const finish = (x,y,xx,yy) => tier >= 3 ? metal(c,x,y,xx,yy,'#fff0a8','#edbd4d','#a66c29') : tier === 2 ? metal(c,x,y,xx,yy,'#ffffff','#e3f7f8','#76a5b3') : tier === 1 ? metal(c,x,y,xx,yy,'#f6d5a4','#c89152','#8d5939') : metal(c,x,y,xx,yy);
  if (id === 'bow') {
    c.beginPath(); c.moveTo(8, -32);
    c.bezierCurveTo(36, -22, 36, 22, 8, 32);
    c.strokeStyle = INK; c.lineWidth = 7; c.stroke();
    c.strokeStyle = tier >= 3 ? '#f6c65e' : tier === 2 ? '#d4a967' : tier === 1 ? '#c8793e' : '#bb9150'; c.lineWidth = 4.5; c.stroke();
    c.beginPath(); c.moveTo(8, -32); c.lineTo(5 - draw * 23, 0); c.lineTo(8, 32);
    c.strokeStyle = '#f2ebc8'; c.lineWidth = 1.5; c.stroke();
    for (const y of [-29, 29]) oval(c, 11, y, 3, 3, GOLD, INK, 1);
    box(c, 23, -7, 7, 14, 2, '#9a592d', INK, 1.5);
    for (const y of [-6, 4]) box(c, 23, y, 7, 2, .6, GOLD);
    line(c, 25, -3, 25, 3, '#e4b36c', 1.3);
    if (!released) {
      const rear = 3 - draw * 23;
      line(c, rear - 12, 0, rear + 43, 0, INK, 3.5);
      line(c, rear - 12, -1, rear + 43, -1, '#e8d19c', 1.5);
      path(c, [[rear + 50, 0], [rear + 38, -5], [rear + 39, 5]], SILVER, INK, 1.3);
      for (const y of [-1, 1]) path(c, [[rear - 6, 0], [rear - 13, y * 6], [rear - 19, y * 6], [rear - 13, 0]], colors.light, INK, 1);
    }
    return;
  }
  if (id === 'spear') {
    line(c, -28, 0, 62 + extension, 0, INK, 6);
    line(c, -28, -1, 62 + extension, -1, '#b28c54', 3.5);
    line(c, -26, -1.7, 60 + extension, -1.7, '#ead29c', 1.1);
    if (extension > 0) {
      line(c, 47, -1, 61 + extension, -1, '#c1d6d9', 3.5);
      line(c, 48, -2, 61 + extension, -2, '#f5ffff', 1);
      box(c, 44, -4, 6, 8, 1, GOLD, INK, 1.2);
    }
    path(c, [[56 + extension, -7], [80 + extension, 0], [56 + extension, 7], [59 + extension, 0]], finish(56 + extension, -7, 62 + extension, 7), INK, 1.8);
    line(c, 61 + extension, 0, 76 + extension, 0, '#ffffff', 1.3);
    box(c, 49 + extension, -4, 10, 8, 1, GOLD, INK, 1.3);
    path(c, [[49 + extension, 3], [37 + extension, 6], [43 + extension, 11], [37 + extension, 16], [51 + extension, 11]], colors.cloth, INK, 1.2);
    for (let x = -8; x < 12; x += 4) line(c, x, -2, x - 1, 2, colors.dark, 2.2);
    oval(c, -29, 0, 3, 3, SILVER, INK, 1.3);
    return;
  }
  if (id === 'hammer') {
    line(c, -10, 0, 44, 0, INK, 8);
    line(c, -10, -1, 44, -1, '#a17d4b', 4.5);
    for (let x = -6; x < 16; x += 5) line(c, x, -3, x - 1, 3, colors.dark, 2.5);
    box(c, 30, -26, 27, 52, 4, finish(30, -25, 58, 24), INK, 2.5);
    box(c, 29, -26, 7, 52, 1, GOLD, INK, 1.5);
    box(c, 52, -26, 7, 52, 1, '#a2b6b9', INK, 1.5);
    box(c, 39, -8, 11, 16, 2, colors.dark, INK, 1.5);
    path(c, [[44, -5], [48, 0], [44, 5], [40, 0]], LIGHT_GOLD, null);
    line(c, 38, -17, 51, -17, '#ffffff', 1.8);
    oval(c, -12, 0, 4, 4, GOLD, INK, 1.5);
    return;
  }
  path(c, [[8, -8], [43, -9], [60, 0], [43, 9], [8, 8]],
    finish(10, -7, 15, 7), INK, 2);
  path(c, [[12, 0], [58, 0], [43, 6], [12, 5]], tier >= 3 ? '#d69835' : tier === 1 ? '#b37c4d' : '#9dbcc4', null);
  line(c, 12, -4, 43, -4, '#ffffff', 1.6);
  line(c, 44, -4, 56, 0, '#ffffff', 1.3);
  box(c, 3, -12, 7, 24, 2, GOLD, INK, 1.7);
  box(c, -15, -4, 18, 8, 2, colors.dark, INK, 1.5);
  for (const x of [-11, -6, -1]) line(c, x, -3, x - 1, 3, '#9eb6b1', 1.4);
  oval(c, -19, 0, 5, 5, GOLD, INK, 1.7);
  oval(c, -19, -1, 2, 2, LIGHT_GOLD);
}

function shieldArt(c, id, colors, block = 0, broken = false) {
  if (id === 'none' || !id) return;
  const rim = block > 0 ? '#fff4bc' : GOLD;
  const face = metal(c, -16, -23, 16, 24, colors.light, colors.main, colors.dark);
  if (id === 'tower') {
    box(c, -18, -34, 36, 68, 6, rim, INK, 2.5);
    box(c, -14, -30, 28, 60, 4, face, '#957d48', 1.5);
    line(c, 0, -23, 0, 23, LIGHT_GOLD, 3);
    for (const s of [-1, 1]) {
      path(c, [[s * 3, -4], [s * 11, -14], [s * 8, -1], [s * 12, 6], [s * 3, 2]], '#f2d382', INK, 1);
      for (const y of [-21, 21]) oval(c, s * 9, y, 1.7, 1.7, '#fff0b3');
    }
  } else {
    oval(c, 0, 0, 23, 23, rim, INK, 2.5);
    oval(c, 0, 0, 19, 19, face, '#9c844d', 1.3);
    for (let i = 0; i < 8; i++) {
      const a = i * TAU / 8;
      oval(c, Math.cos(a) * 20.5, Math.sin(a) * 20.5, 1.3, 1.3, '#fff0b3');
    }
    for (const s of [-1, 1]) path(c, [[s * 5, -2], [s * 13, -10], [s * 11, 3], [s * 4, 9]], LIGHT_GOLD, null);
  }
  oval(c, 0, 0, 6, 7, metal(c, -5, -7, 6, 7, '#fff4b9', GOLD, '#9a773e'), INK, 1.5);
  oval(c, -1.5, -2, 1.7, 2, '#fff9d2');
  if (broken) {
    line(c, 2, -22, -5, -10, '#593f4c', 2);
    line(c, -5, -10, 2, -5, '#593f4c', 2);
    line(c, 2, -5, -3, 6, '#593f4c', 2);
  }
}

function repairPile(c, colors, captain, time) {
  oval(c, 0, 21, 35, 10, '#294c4c25');
  for (const side of [-1, 1]) {
    box(c, side * 23 - 7, 8, 14, 15, 5, '#586c70', INK, 2);
    oval(c, side * 23, 15, 3, 4, SILVER);
  }
  box(c, -19, 7, 38, 15, 4, '#acbec0', INK, 2);
  c.save(); c.translate(-2, 4); c.rotate(-.17);
  box(c, -23, -19, 46, 31, 7, colors.main, INK, 2.4);
  box(c, -18, -13, 36, 18, 4, '#294c50', null);
  for (const side of [-1, 1]) {
    c.beginPath(); c.arc(side * 9, -5, 4, 0, Math.PI);
    c.strokeStyle = colors.eye; c.lineWidth = 2; c.stroke();
  }
  box(c, -25, -23, 50, 6, 2, captain ? GOLD : SILVER, INK, 1.7);
  c.restore();
  const bob = Math.sin(time * 2) * 2;
  oval(c, 24, -14 + bob, 8, 8, '#edf8e8', '#7da997', 1.5);
  line(c, 20, -14 + bob, 28, -14 + bob, '#548b74', 2.2);
  line(c, 24, -18 + bob, 24, -10 + bob, '#548b74', 2.2);
}

function robotBody(c, unit, colors, time, aim, bob, battle = false) {
  const gold = unit.captain ? GOLD : '#b99a61';
  const archer = unit.weapon === 'bow', heavy = unit.weapon === 'hammer', lancer = unit.weapon === 'spear';
  if (archer) {
    c.save(); c.translate(-24, -7); c.rotate(-.24);
    box(c, -9, -30, 18, 55, 4, '#795b43', INK, 2);
    for (const x of [-5, 1, 7]) {
      line(c, x, -21, x, -47, '#eed29c', 2.5);
      path(c, [[x, -34], [x - 5, -42], [x - 5, -49], [x, -44], [x + 5, -49], [x + 5, -42]], '#f4f0d3', INK, 1);
    }
    c.restore();
  }
  if (unit.captain) {
    path(c, [[-24, -17], [-39, 39], [-22, 34], [0, 43], [22, 34], [39, 39], [24, -17]], colors.cloth, INK, 3);
    line(c, -26, -2, -34, 34, LIGHT_GOLD, 3); line(c, 26, -2, 34, 34, LIGHT_GOLD, 3);
  }
  for (const s of [-1, 1]) {
    const step = unit.moving ? Math.sin(time * 16 + (s === 1 ? Math.PI : 0)) * 2 : 0;
    box(c, s * 19 - 9, 24 + step, 18, 18, 6, '#455e64', INK, 2.4);
    box(c, s * 19 - 6, 27 + step, 12, 10, 3, '#91a9ad', INK, 1.3);
    for (const y of [28, 33, 38]) line(c, s * 19 - 7, y + step, s * 19 + 7, y + step, '#c6d6d5', 1.2);
    box(c, s * 19 - 10, 36 + step, 20, 5, 2, gold, INK, 1.4);
  }
  c.save(); c.translate(0, bob);
  box(c, -22, 0, 44, 30, 8, metal(c, -20, 0, 23, 30), INK, 2.5);
  for (const y of [7, 15, 23]) {
    const armor = unit.armorTier >= 3 ? ['#edc75c','#bd8c36'] : unit.armorTier === 2 ? ['#e3f8f5','#8cb6bb'] : unit.armorTier === 1 ? ['#cb9a62','#a77649'] : ['#d3dfe0','#a9bec1'];
    box(c, -21, y, 42, 6, 2, armor[y === 15 ? 1 : 0], INK, 1.3);
    line(c, -17, y + 1, 15, y + 1, '#f6fffa', 1.3);
  }
  box(c, -24, 26, 48, 6, 2, gold, INK, 1.8);
  oval(c, 0, 28, 4, 4, colors.main, INK, 1.3);
  for (const s of [-1, 1]) {
    path(c, [[s * 21, 1], [s * 33, 5], [s * 33, 15], [s * 23, 17]], gold, INK, 2);
    line(c, s * 24, 4, s * 30, 7, LIGHT_GOLD, 1.8);
    if (heavy) {
      box(c, s * 28 - 12, -6, 24, 27, 6, metal(c, 0, -6, 0, 21), INK, 2.5);
      box(c, s * 28 - 12, -5, 24, 7, 2, gold, INK, 1.5);
      oval(c, s * 28, 8, 4, 4, colors.main, INK, 1.5);
    }
  }
  box(c, -26, -34, 52, 39, 9, metal(c, -24, -34, 25, 5, colors.light, colors.main, colors.dark), INK, 2.7);
  box(c, -21, -28, 42, 25, 6, '#29494f', INK, 1.2);
  line(c, -16, -25, 15, -25, '#5e8588', 1.3);
  for (const s of [-1, 1]) {
    oval(c, s * 10, -17, 5.2, 6.2, colors.eye);
    oval(c, s * 10 + Math.cos(aim) * 1.4, -17 + Math.sin(aim), 2.1, 3, '#29474c');
    oval(c, s * 10 - 1, -19, 1.2, 1.3, '#ffffff');
    box(c, s * 29 - 3, -21, 6, 15, 2, gold, INK, 1.5);
  }
  c.beginPath(); c.moveTo(-6, -8); c.quadraticCurveTo(0, -3, 6, -8);
  c.strokeStyle = '#a6d7cd'; c.lineWidth = 1.8; c.stroke();
  // Helmet brim stays above the visor, so no facing direction hides the eyes.
  if (unit.faction === 'greek') {
    path(c,[[-29,-30],[-27,-47],[-15,-59],[15,-59],[27,-47],[29,-30]],metal(c,-26,-59,26,-30,'#fff0ba','#c3a15f','#7f7653'),INK,3);
    path(c,[[-7,-58],[-9,-74],[0,-85],[9,-74],[7,-58]],unit.boss?'#7463a5':'#a7556f',INK,2);
    for(let x=-5;x<=5;x+=5)line(c,x,-72,x,-59,'#efc27f',1.6);
    for(const s of [-1,1])path(c,[[s*18,-32],[s*29,-32],[s*25,-9],[s*18,-16]],'#dfc381',INK,2);
    box(c,-30,-35,60,7,2,'#f0d68d',INK,2);
    oval(c,0,-48,4,5,unit.boss?'#aeece4':'#dd8b8e',INK,1.5);
    if(unit.boss){for(const s of [-1,1])for(let i=0;i<4;i++)oval(c,s*(15+i*4),-55+i*3,4,2.2,'#f6d779',INK,.7);}
  } else if (unit.faction === 'pirate') {
    path(c,[[-30,-30],[-27,-45],[-13,-54],[13,-54],[27,-45],[30,-30]],'#258b92',INK,3);
    path(c,[[-28,-42],[-8,-39],[14,-43],[29,-36],[27,-29],[-28,-33]],'#f6d47c',INK,2);
    path(c,[[26,-39],[43,-35],[33,-24],[28,-29],[41,-22],[29,-18],[23,-31]],'#e8a86d',INK,2);
    oval(c,0,-48,4,4,'#f5e6bc',INK,1.5);
    if(unit.boss){path(c,[[-32,-49],[-18,-67],[0,-59],[18,-67],[32,-49]],'#f5d077',INK,2.5);}
  } else if (unit.faction === 'punic') {
    path(c,[[-29,-30],[-28,-45],[-14,-58],[14,-58],[28,-45],[29,-30]],metal(c,-25,-58,25,-30,'#fff1c7','#c9a35c','#7c6b43'),INK,3);
    path(c,[[-21,-52],[-14,-65],[14,-65],[21,-52]],'#934c79',INK,2);
    for(let x=-12;x<=12;x+=6)line(c,x,-62,x,-53,'#e3a0b8',1.8);
    box(c,-30,-34,60,7,2,'#ebce8a',INK,2);
    for(const s of [-1,1])path(c,[[s*23,-32],[s*29,-30],[s*25,-11],[s*18,-17]],'#d3af6c',INK,2);
    oval(c,0,-47,5,6,'#44c9c6',INK,1.4);
    if(unit.boss){path(c,[[-32,-57],[-34,-82],[-16,-72],[0,-94],[16,-72],[34,-82],[32,-57]],GOLD,INK,3);oval(c,0,-76,6,7,'#bda1f4',INK,2);}
  } else if (unit.faction === 'highland') {
    path(c,[[-29,-30],[-25,-47],[-10,-57],[10,-57],[25,-47],[29,-30]],metal(c,-25,-57,24,-30,'#f9e1a4','#b78848','#6e694c'),INK,3);
    line(c,-22,-38,22,-38,'#fff0c0',2);
    path(c,[[-5,-56],[-7,-71],[0,-79],[7,-71],[5,-56]],'#46b5b1',INK,2);
    for(const s of [-1,1])box(c,s*25-4,-30,8,15,2,'#d6af64',INK,2);
    if(unit.boss){path(c,[[-28,-53],[-32,-75],[-14,-64],[0,-86],[14,-64],[32,-75],[28,-53]],GOLD,INK,3);oval(c,0,-65,5,6,'#58e2d0',INK,1.5);}
  } else if (unit.faction === 'forest') {
    path(c,[[-29,-29],[-25,-44],[-13,-54],[13,-54],[25,-44],[29,-29],[15,-34],[-15,-34]],'#945f47',INK,3);
    for(const s of [-1,1])path(c,[[s*20,-42],[s*35,-56],[s*33,-42],[s*25,-33]],'#e6d1a1',INK,2);
    for(let x=-24;x<=24;x+=8)path(c,[[x,-34],[x+4,-40],[x+8,-34]],'#d5ba91',INK,1);
    if(unit.boss){path(c,[[-22,-54],[-24,-70],[-10,-63],[0,-77],[10,-63],[24,-70],[22,-54]],GOLD,INK,2);}
  } else if (archer && !unit.captain) {
    path(c, [[-29, -9], [-31, -32], [-17, -51], [0, -58], [18, -50], [30, -30], [28, -8], [22, -31], [0, -41], [-22, -31]], colors.cloth, INK, 3);
    line(c, -20, -37, 0, -47, colors.light, 2);
  } else {
    path(c, [[-25, -34], [-22, -43], [-13, -48], [13, -48], [22, -43], [25, -34]],
      metal(c, -22, -48, 24, -31, '#f4dfa4', '#c5a768', '#88794d'), INK, 2);
    line(c, -18, -41, 17, -41, LIGHT_GOLD, 1.6);
    box(c, -29, -36, 58, 7, 3, unit.captain ? GOLD : '#d4dfd9', INK, 2);
    if (unit.captain) {
      path(c, [[-38, -48], [-36, -64], [-24, -73], [24, -73], [36, -64], [38, -48], [24, -51], [-24, -51]], LIGHT_GOLD, INK, 3);
      for (let x = -30; x <= 30; x += 6) line(c, x, -64 - (30 - Math.abs(x)) * .15, x, -53, GOLD, 2.5);
      box(c, -31, -51, 62, 7, 2, GOLD, INK, 2);
    } else if (heavy) {
      box(c, -23, -49, 46, 14, 4, '#a7b8bb', INK, 2.5);
      box(c, -10, -53, 20, 18, 2, GOLD, INK, 2);
    } else {
      box(c, -5, -51, 10, 17, 2, gold, INK, 1.5);
      path(c, lancer ? [[-8, -48], [-9, -70], [0, -83], [9, -70], [8, -48]] : [[-16, -48], [-15, -59], [-10, -65], [10, -65], [16, -58], [16, -48]], colors.cloth, INK, 2);
      for (let x = -5; x <= 5; x += 5) line(c, x, lancer ? -71 : -61, x, -50, colors.light, 2);
    }
  }
  if (unit.captain) {
    for (const s of [-1, 1]) for (let i = 0; i < 3; i++)
      leaf(c, s * (24 - i), -27 + i * 6, s * (.6 + i * .15), 8, LIGHT_GOLD, 2.5);
    oval(c, 0, -33, 3.5, 3.5, colors.light, INK, 1.2);
  }
  if (unit.flash > 0) {
    c.globalAlpha *= clamp(unit.flash * 4, 0, battle ? .25 : .65);
    box(c, -25, -33, 50, 36, 8, '#fff6d6');
    box(c, -19, 3, 38, 23, 5, '#fff6d6');
  }
  c.restore();
}

/** Shared strike geometry: animation and contact tests use the actual weapon. */
export function shieldPose(unit, { preview = false } = {}) {
  const aim = Number.isFinite(unit.angle) ? unit.angle : -Math.PI / 2;
  const side = Math.cos(aim) < -.1 ? -1 : 1;
  const open = shieldOpening(unit);
  const broken = unit.guardBroken > 0;
  const tower = unit.shield === 'tower';
  // Present the shield face to the camera, rather than hiding it behind the head.
  return { x: -side * (35 + open * 9 + (broken ? 8 : 0)) + Math.cos(aim) * 7,
    y: (preview ? 12 : 16) + Math.sin(aim) * 9 + open * 4 - (tower ? 6 : 0),
    angle: side * (open * .48 + (broken ? .7 : -.08)), scale: (preview ? 1 : .92) * (tower ? 1.25 : 1) };
}

export function weaponPose(unit, time = 0, { size = 1, preview = false } = {}) {
  const aim = Number.isFinite(unit.angle) ? unit.angle : -Math.PI / 2;
  const id = ['sword', 'spear', 'hammer', 'bow'].includes(unit.weapon) ? unit.weapon : 'sword';
  const twoHands = id === 'hammer' || id === 'bow' || id === 'spear';
  const pose = actionPose(unit);
  const bob = unit.moving && !preview ? Math.sin(time * 16) * 1.3 : Math.sin(time * 2) * .5;
  const weaponLength = preview ? 1 : id === 'bow' ? .86 : id === 'spear' ? .76 : .95;
  const shoulder = preview ? 24 : 27;
  let rotation = aim, thrust = 0, pull = 0, extension = 0, contact = null;
  const effort = pose.wind * (1 - pose.recover);
  if (id === 'sword') rotation += (-1.45 * pose.wind + 2.45 * pose.strike) * (1 - pose.recover);
  if (id === 'hammer') rotation += (-1.9 * pose.wind + 2.35 * pose.strike) * (1 - pose.recover);
  if (id === 'spear') thrust = (-13 * pose.wind + 40 * pose.strike) * (1 - pose.recover) * (preview ? 1 : .75);
  if (id === 'bow') { pull = pose.wind * (1 - pose.strike); thrust = -7 * pose.strike * (1 - pose.recover); }
  const side = Math.cos(aim) < -.1 ? -1 : 1;
  const grip = id === 'hammer' ? 47 : twoHands ? 21 : preview ? 30 : 32;
  const gripY = 6 + bob + (id === 'hammer' ? 4 : 0);
  let handX = side * grip + Math.cos(aim) * thrust;
  let handY = gripY + Math.sin(aim) * thrust;
  if (id === 'bow') { const grip = bowGrip(unit, pose); handX = grip.x; handY = grip.y; }
  const target = unit.strikeTarget;
  if (!preview && unit.action && id !== 'bow' && target && Number.isFinite(target.x) && Number.isFinite(target.y) && size > 0) {
    handX = side * grip; handY = gripY;
    const targetScale = botScale(target) / botScale(unit);
    let cx = (target.x - (unit.x || 0)) * 100 / size, cy = (target.y - (unit.y || 0)) * 100 / size - 6 * targetScale;
    let rx = 26 * targetScale, ry = 28 * targetScale, turn = 0;
    if (target.guarding && ['round', 'tower'].includes(target.shield)) {
      const shield = shieldPose(target);
      turn = shield.angle; cx += shield.x * targetScale; cy += (6 + shield.y) * targetScale;
      rx = (target.shield === 'tower' ? 18 : 23) * shield.scale * targetScale;
      ry = (target.shield === 'tower' ? 34 : 23) * shield.scale * targetScale;
    }
    const vx = cx - handX, vy = cy - handY, ex = Math.cos(turn) * vx + Math.sin(turn) * vy, ey = -Math.sin(turn) * vx + Math.cos(turn) * vy;
    const edge = 1 / Math.max(1, Math.hypot(ex / rx, ey / ry));
    contact = { x: cx - vx * edge, y: cy - vy * edge };
    const dx = contact.x - handX, dy = contact.y - handY, angle = Math.atan2(dy, dx), length = Math.hypot(dx, dy);
    const reach = weaponLength * (id === 'sword' ? 60 : id === 'hammer' ? 59 : 80), needed = length - reach;
    const advance = Math.max(-64, Math.min(id === 'spear' ? 48 : 112, needed)), strike = pose.strike * (1 - pose.recover);
    handX += Math.cos(angle) * advance * strike; handY += Math.sin(angle) * advance * strike;
    // Telescope the shaft to contact without stretching the two-handed grip.
    if (id === 'spear') extension = Math.max(0, needed - advance) / weaponLength * strike;
    const aimed = aim + Math.atan2(Math.sin(angle - aim), Math.cos(angle - aim)) * pose.wind * (1 - pose.recover);
    const wind = id === 'sword' ? 1.45 : id === 'hammer' ? 1.9 : 0;
    rotation = aimed - wind * pose.wind * (1 - pose.strike) * (1 - pose.recover) + (id === 'spear' ? 0 : .45 * Math.sin(pose.recover * Math.PI));
  }
  if (id === 'hammer') {
    const ready = side > 0 ? -.8 : -Math.PI + .8;
    const weight = 1 - pose.wind * (1 - pose.recover);
    rotation += Math.atan2(Math.sin(ready - rotation), Math.cos(ready - rotation)) * weight;
  }
  return { aim, id, twoHands, pose, bob, weaponLength, shoulder, rotation, pull, side, handX, handY, effort, extension, contact };
}

/** Friendly, upright robots with independently aimed equipment. */
export function drawBot(ctx, unit, time = 0, { size = 1, preview = false, promoted = false } = {}) {
  const c = ctx, colors = TEAMS[unit.team === 1 ? 1 : 0];
  const { aim, id, twoHands, pose, bob, weaponLength, shoulder, rotation, pull, side, handX, handY, effort, extension } = weaponPose(unit, time, { size, preview });
  const hasShield = !twoHands && (unit.shield === 'round' || unit.shield === 'tower'), broken = unit.guardBroken > 0;
  c.save(); c.translate(unit.x || 0, unit.y || 0); c.scale(size / 100, size / 100);
  c.lineJoin = 'round'; c.lineCap = 'round';
  if (unit.hp <= 0) { repairPile(c, colors, unit.captain, time); c.restore(); return; }
  oval(c, 2, 37, 35, 10, '#254d4b2b');
  oval(c, 0, 36, 24, 6, '#254d4b17');
  if (broken) { c.translate(-Math.cos(aim) * 5, 0); c.rotate(Math.sin(time * 24) * .055); }
  const hand = () => {
    c.save();
    const reach = Math.hypot(handX - side * shoulder, handY - 6 - bob);
    const elbowX = id === 'hammer' ? side * (shoulder + 3) : mix(side * shoulder, handX, .52) + (reach > 38 ? side * 8 : 0);
    const elbowY = id === 'hammer' ? 24 + bob : mix(6 + bob, handY, .52) + (reach > 38 ? 5 : 0);
    for (const [color, width] of [[INK, id === 'hammer' ? 12 : 10], [id === 'hammer' ? colors.dark : SILVER, id === 'hammer' ? 8 : 6]]) {
      line(c, side * shoulder, 6 + bob, elbowX, elbowY, color, width);
      line(c, elbowX, elbowY, handX, handY, color, width);
    }
    if (id === 'hammer') {
      oval(c, elbowX, elbowY, 6, 6, SILVER, INK, 2);
      oval(c, elbowX, elbowY, 2.5, 2.5, GOLD, INK, 1);
    } else if (reach > 38) oval(c, elbowX, elbowY, 4, 4, GOLD, INK, 1.5);
    if (twoHands) {
      const supportX = handX + Math.cos(rotation) * (id === 'bow' ? 24 : 16) * weaponLength;
      const supportY = handY + Math.sin(rotation) * (id === 'bow' ? 24 : 16) * weaponLength;
      if (id === 'spear' || id === 'hammer') {
        const elbowX = -side * (shoulder + 3), elbowY = 24 + bob;
        for (const [color, width] of [[INK, 12], [colors.dark, 8]]) {
          line(c, -side * shoulder, 7 + bob, elbowX, elbowY, color, width);
          line(c, elbowX, elbowY, supportX, supportY, color, width);
        }
        oval(c, elbowX, elbowY, 6, 6, SILVER, INK, 2);
        oval(c, elbowX, elbowY, 2.5, 2.5, GOLD, INK, 1);
        oval(c, mix(elbowX, supportX, .65), mix(elbowY, supportY, .65), 6, 5, colors.main, INK, 1.8);
      } else {
        line(c, -side * (shoulder - 1), 9 + bob, supportX, supportY, INK, preview ? 9 : 7);
        line(c, -side * (shoulder - 1), 8 + bob, supportX, supportY - 1, colors.main, preview ? 5 : 4);
        oval(c, supportX, supportY, 5, 5, GOLD, INK, 1.6);
      }
    }
    c.translate(handX, handY); c.rotate(rotation);
    c.scale(weaponLength, 1);
    if (pose.swing > 0 && id !== 'bow' && id !== 'spear') {
      arc(c, 0, 0, id === 'hammer' ? 58 : 64, -.9, .15, '#fff9dc88', 6);
      arc(c, 0, 0, id === 'hammer' ? 58 : 64, -.9, .15, colors.light + '88', 2);
    }
    weaponArt(c, id, colors, pull, id === 'bow' && !bowArrowVisible(pose), extension, unit.weaponTier || 0);
    if(unit.weaponTier >= 3){
      const tip=id==='spear'?68+extension:id==='hammer'?45:id==='bow'?25:44;
      for(let i=0;i<3;i++){
        const flicker=Math.sin(time*8+i*2)*2;
        path(c,[[tip-9+i*7,-4],[tip-6+i*7,-15-flicker],[tip-2+i*7,-8],[tip+2+i*7,-20+flicker],[tip+5+i*7,-3]],'#ffb840bb',null);
        line(c,tip-5+i*7,-3,tip-3+i*7,-10-flicker,'#fff1a9',1.8);
      }
    }
    if (id === 'spear' || id === 'hammer') {
      for (const x of [0, 16]) {
        box(c, x - 6, -7, 12, 14, 3, metal(c, x, -7, x, 7, colors.light, colors.main, colors.dark), INK, 2);
        for (const finger of [-2, 2]) line(c, x + finger, -3.5, x + finger, 3.5, '#d8f1e5', 1.4);
        box(c, x - 7, 2, 5, 6, 2, GOLD, INK, 1.2);
      }
    } else oval(c, id === 'bow' ? 5 - pull * 23 : 0, 0, 5, 5, '#b9cccb', INK, 1.7);
    c.restore();
  };
  const shield = () => {
    if (!hasShield) return;
    const { x: sx, y: sy, angle: shieldAim, scale } = shieldPose(unit, { preview });
    line(c, -side * (shoulder - 1), 8 + bob, sx, sy, INK, 9);
    line(c, -side * (shoulder - 1), 7 + bob, sx, sy - 1, SILVER, 5);
    c.save(); c.translate(sx, sy); c.rotate(shieldAim);
    c.scale(scale, scale);
    if (broken) c.rotate(Math.sin(time * 20) * .15);
    shieldArt(c, unit.shield, colors, unit.blockFlash, broken);
    if (unit.blockFlash > 0) {
      c.globalAlpha *= clamp(unit.blockFlash * 7);
      for (let i = -1; i <= 1; i++) line(c, 25, i * 14, 34 + (i === 0 ? 5 : 0), i * 20, '#fff5c0', 3);
    }
    c.restore();
  };
  c.save();
  if (!preview) c.scale(1.12, 1.03);
  robotBody(c, promoted ? { ...unit, captain: true } : unit, colors, time, aim, bob, !preview);
  c.restore();
  shield();
  hand();
  if(unit.hp>0&&unit.hp/unit.maxHp<.5){
    const severe=unit.hp/unit.maxHp<.15;
    line(c,-13,-28,-6,-22,'#2b4147',2.6);line(c,-6,-22,-10,-15,'#2b4147',2.6);
    line(c,7,8,13,13,'#654d48',2.5);line(c,13,13,7,19,'#654d48',2.5);
    for(let i=0;i<(severe?5:2);i++){
      const p=(time*.5+i*.27)%1;
      oval(c,24+Math.sin(time+i)*8,-36-p*(severe?65:28),4+p*(severe?12:7),4+p*(severe?10:6),severe?'#53616bb0':'#8b9d9b88');
    }
    if(severe){oval(c,23,-34,5,4,'#ffd17e');line(c,21,-38,28,-47,'#fff3aa',2.5);line(c,25,-29,32,-35,'#ffb568',2);}
  }
  if (broken) {
    for (let i = 0; i < 3; i++) {
      const a = time * 3 + i * TAU / 3, x = Math.cos(a) * 24, y = -72 + Math.sin(a) * 4;
      path(c, [[x, y - 4], [x + 2, y - 1], [x + 5, y], [x + 2, y + 2], [x, y + 5], [x - 2, y + 2], [x - 5, y], [x - 2, y - 1]], LIGHT_GOLD, '#947b47', 1);
    }
  }
  c.restore();
}

/** Transparent 64x64 equipment icon; no external state or backing decoration. */
export function drawGear(ctx, kind, id, time = 0, tier = 0) {
  const c = ctx;
  c.save(); c.translate(32, 32); c.lineJoin = 'round'; c.lineCap = 'round';
  if (kind === 'shield') {
    if (id === 'none') {
      oval(c, 0, 0, 18, 18, null, '#8baba9', 2);
      line(c, -12, 12, 12, -12, '#8baba9', 2);
    } else { c.scale(.87, .87); shieldArt(c, id, TEAMS[0]); }
  } else if (kind === 'weapon') {
    const s = id === 'spear' ? .66 : id === 'bow' ? .72 : id === 'hammer' ? .67 : .82;
    c.rotate(-Math.PI / 4); c.scale(s, s);
    c.translate(id === 'spear' ? -24 : id === 'bow' ? -12 : id === 'hammer' ? -21 : -18, 0);
    weaponArt(c, id, TEAMS[0], id === 'bow' ? .12 + Math.sin(time * 1.5) * .035 : 0, false, 0, tier);
  }
  c.restore();
}

/** Five unit markers with forward-facing guard cues; captain always has gold. */
export function drawFormation(ctx, id, color = '#6de4cb') {
  const c = ctx;
  const positions = id === 'wedge'
    ? [[32, 12], [21, 29], [43, 29], [11, 47], [53, 47]]
    : id === 'circle'
      ? [[32, 32], [32, 11], [53, 32], [32, 53], [11, 32]]
      : [[32, 19], [13, 19], [51, 19], [22, 44], [42, 44]];
  c.save(); c.lineJoin = 'round'; c.lineCap = 'round';
  for (let i = 0; i < positions.length; i++) {
    const [x, y] = positions[i];
    const angle = id === 'circle' && i > 0 ? Math.atan2(y - 32, x - 32) : -Math.PI / 2;
    c.save(); c.translate(x, y); c.rotate(angle);
    arc(c, 0, 0, 9, -.65, .65, i === 0 ? LIGHT_GOLD : color, 2.3);
    line(c, 10, 0, 12, 0, i === 0 ? LIGHT_GOLD : color, 1.5);
    c.restore();
    oval(c, x, y, 6.2, 6.2, color, INK, 1.6);
    oval(c, x - 1.5, y - 1.5, 1.6, 1.6, '#f0fff8');
    if (i === 0) oval(c, x, y, 8, 8, null, GOLD, 2);
  }
  c.restore();
}
