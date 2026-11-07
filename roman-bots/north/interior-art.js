const TAU = Math.PI * 2;
const INK = '#314b50';
const GOLD = '#d9b25f';
const LIGHT_GOLD = '#ffe3a0';
const THEMES = {
  north: { wall: '#574e46', edge: '#b49c74', floor: '#b7a680', seam: '#8a7c61', cloth: '#9c4f60', accent: '#507f6d', light: '#e7d1a0' },
  west: { wall: '#73858b', edge: '#ccd3c5', floor: '#c2ccc4', seam: '#9caeaa', cloth: '#72834e', accent: '#b97f58', light: '#eef0da' },
  south: { wall: '#4f87aa', edge: '#f2d48e', floor: '#e1e4d4', seam: '#c3cec8', cloth: '#286ca8', accent: '#d1aa53', light: '#fff3c9' },
  east: { wall: '#93b7b8', edge: '#f2f4e8', floor: '#e8ede6', seam: '#c4d5d0', cloth: '#8271a5', accent: '#479e99', light: '#fff9e2' }
};
const ALIASES = { forest: 'north', northforest: 'north', 'north-forest': 'north', highland: 'west', punic: 'south', carthage: 'south', greek: 'east' };

function regionId(region) {
  return Object.hasOwn(THEMES, region) ? region : Object.hasOwn(ALIASES, region) ? ALIASES[region] : 'north';
}
function rect(c, x, y, w, h, fill, stroke = null, width = .04) {
  c.fillStyle = fill; c.fillRect(x, y, w, h);
  if (stroke) { c.strokeStyle = stroke; c.lineWidth = width; c.strokeRect(x, y, w, h); }
}
function poly(c, points, fill, stroke = INK, width = .04) {
  c.beginPath();
  points.forEach(([x, y], i) => i ? c.lineTo(x, y) : c.moveTo(x, y));
  c.closePath();
  if (fill) { c.fillStyle = fill; c.fill(); }
  if (stroke) { c.strokeStyle = stroke; c.lineWidth = width; c.stroke(); }
}
function line(c, points, color, width = .04) {
  c.beginPath();
  points.forEach(([x, y], i) => i ? c.lineTo(x, y) : c.moveTo(x, y));
  c.strokeStyle = color; c.lineWidth = width; c.stroke();
}
function oval(c, x, y, rx, ry, fill, stroke = null, width = .04) {
  c.beginPath(); c.ellipse(x, y, rx, ry, 0, 0, TAU);
  c.fillStyle = fill; c.fill();
  if (stroke) { c.strokeStyle = stroke; c.lineWidth = width; c.stroke(); }
}
function round(c, x, y, w, h, r, fill, stroke = INK) {
  c.beginPath(); c.roundRect(x, y, w, h, r);
  c.fillStyle = fill; c.fill();
  if (stroke) { c.strokeStyle = stroke; c.lineWidth = .04; c.stroke(); }
}
function local(c, x, y, draw) {
  c.save();
  try { c.translate(x, y); draw(); } finally { c.restore(); }
}
function resetDrawing(c) {
  c.globalAlpha = 1; c.globalCompositeOperation = 'source-over';
  c.lineJoin = 'round'; c.lineCap = 'round'; c.setLineDash([]); c.lineDashOffset = 0;
  c.shadowBlur = 0; c.shadowOffsetX = 0; c.shadowOffsetY = 0; c.filter = 'none';
}
function diamond(c, x, y, r, color, ry = r) {
  poly(c, [[x - r, y], [x, y - ry], [x + r, y], [x, y + ry]], color, null);
}
function antlers(c, x, y, size, color = LIGHT_GOLD) {
  for (const s of [-1, 1]) {
    line(c, [[x + s * .1 * size, y + .18 * size], [x + s * .37 * size, y - .12 * size], [x + s * .6 * size, y - .56 * size]], color, .075 * size);
    line(c, [[x + s * .3 * size, y - .05 * size], [x + s * .26 * size, y - .43 * size]], color, .06 * size);
    line(c, [[x + s * .43 * size, y - .25 * size], [x + s * .77 * size, y - .32 * size]], color, .06 * size);
    line(c, [[x + s * .53 * size, y - .44 * size], [x + s * .79 * size, y - .63 * size]], color, .055 * size);
  }
  diamond(c, x, y + .19 * size, .13 * size, color, .2 * size);
}
function laurel(c, x, y, size, color = GOLD) {
  for (const s of [-1, 1]) {
    line(c, [[x, y + .3 * size], [x + s * .35 * size, y + .1 * size], [x + s * .44 * size, y - .24 * size]], color, .04 * size);
    for (let i = 0; i < 4; i++) {
      const yy = y + (.22 - i * .14) * size, xx = x + s * (.19 + i * .065) * size;
      poly(c, [[xx, yy], [xx + s * .17 * size, yy - .13 * size], [xx + s * .19 * size, yy + .025 * size], [xx + s * .06 * size, yy + .08 * size]], color, null);
    }
  }
}
function flame(c, x, y, time, phase = 0) {
  const flicker = Math.sin(time * 5 + phase) * .07;
  const glow = c.createRadialGradient(x, y - .3, .04, x, y - .3, .85);
  glow.addColorStop(0, '#ffcf8c55'); glow.addColorStop(1, '#ffb44c00');
  oval(c, x, y - .3, .85, .85, glow);
  line(c, [[x, y - .05], [x, y + .33]], INK, .1);
  oval(c, x, y + .27, .28, .13, '#788788', INK);
  poly(c, [[x - .29, y + .05], [x - .36, y - .4], [x - .14, y - .28], [x - .05, y - .83 - flicker], [x + .1, y - .42], [x + .31, y - .6], [x + .27, y + .05]], '#ed9a58', null);
  poly(c, [[x - .13, y + .04], [x - .05, y - .5 - flicker], [x + .1, y - .24], [x + .16, y + .04]], '#ffe6a4', null);
  poly(c, [[x - .34, y], [x + .34, y], [x + .23, y + .19], [x - .23, y + .19]], '#a98b59', INK);
  line(c, [[x - .27, y + .025], [x + .27, y + .025]], LIGHT_GOLD, .045);
}
function banner(c, x, y, theme, id, time, phase) {
  const sway = Math.sin(time * 1.4 + phase) * .035;
  line(c, [[x - .44, y], [x + .44, y]], GOLD, .07);
  poly(c, [[x - .36, y + .03], [x + .36, y + .03], [x + .34 + sway, y + 1.04], [x, y + 1.26], [x - .34 + sway, y + 1.04]], theme.cloth, theme.edge);
  poly(c, [[x + .2, y + .08], [x + .32, y + .08], [x + .3 + sway, y + 1], [x + .19, y + 1.06]], '#183f5024', null);
  line(c, [[x - .24, y + .15], [x - .24, y + .96]], theme.light, .025);
  if (id === 'north') antlers(c, x, y + .65, .35);
  else if (id === 'west') {
    poly(c, [[x - .19, y + .39], [x + .19, y + .39], [x + .16, y + .76], [x, y + .91], [x - .16, y + .76]], theme.accent, LIGHT_GOLD, .025);
    line(c, [[x, y + .43], [x, y + .79]], LIGHT_GOLD, .025);
  } else if (id === 'south') {
    oval(c, x, y + .51, .14, .14, GOLD);
    poly(c, [[x, y + .68], [x - .21, y + .93], [x + .21, y + .93]], LIGHT_GOLD, null);
    line(c, [[x - .24, y + .66], [x + .24, y + .66]], LIGHT_GOLD, .045);
  } else laurel(c, x, y + .63, .43, LIGHT_GOLD);
}

function timberFloor(c, p) {
  rect(c, -6.5, -5.8, 13, 12.2, p.floor);
  for (let i = 0; i < 26; i++) {
    const x = -6.5 + i * .5;
    rect(c, x + .025, -5.8, .46, 12.2, ['#b5a17c', '#c0ac85', '#b8a680', '#c6b38d'][i % 4]);
    line(c, [[x, -5.8], [x, 6.4]], p.seam, .026);
    for (let j = 0; j < 4; j++) {
      const y = -5.6 + j * 3.4 + (i % 3) * .69;
      line(c, [[x + .04, y], [x + .46, y]], p.seam, .028);
      line(c, [[x + .13, y + .2], [x + .11, y + 1.08], [x + .17, y + 1.46]], '#e6cea34d', .025);
      oval(c, x + .36, y + .12, .027, .027, '#796f59');
    }
  }
  // Woven floor edging stays flat; no rug silhouette can be mistaken for cover.
  for (const x of [-6.18, 6.18]) {
    rect(c, x - .18, -5.5, .36, 11.5, '#915d60');
    for (let y = -5.25; y < 5.9; y += .48) diamond(c, x, y, .1, '#d4bc8d', .16);
  }
  for (const y of [-5.47, 6.05]) {
    line(c, [[-5.96, y], [5.96, y]], '#915d60', .18);
    line(c, [[-5.96, y], [5.96, y]], '#e3c794', .025);
  }
}
function flagstoneFloor(c, p) {
  rect(c, -6.5, -5.8, 13, 12.2, p.seam);
  for (let row = 0; row < 10; row++) for (let col = -1; col < 8; col++) {
    const x = -6.5 + col * 1.8 + (row % 2) * .9, y = -5.8 + row * 1.28;
    const color = ['#c5cfc6', '#b7c6c1', '#ccd2c8', '#bdc9c6'][(col + row * 3 + 8) % 4];
    round(c, x + .025, y + .025, 1.75, 1.23, .07, color, null);
    line(c, [[x + .14, y + .11], [x + 1.61, y + .11]], '#eef1dc66', .035);
    if ((row + col) % 4 === 0) line(c, [[x + .28, y + .83], [x + .51, y + .72], [x + .64, y + .79]], '#91a6a344', .025);
  }
  for (const x of [-6.08, 6.08]) {
    rect(c, x - .13, -5.45, .26, 11.45, '#8c9d82');
    line(c, [[x, -5.45], [x, 6]], '#d9c19a', .045);
  }
  // A weathered copper/olive inlay is flooring, not a raised combat platform.
  poly(c, [[0, -3.4], [3.1, 0], [0, 3.4], [-3.1, 0]], '#9fb5a52c', '#a6b49e', .07);
  for (const s of [-1, 1]) {
    line(c, [[s * 2.65, 0], [0, s * 2.95]], '#ad937154', .055);
    diamond(c, s * 2.75, 0, .15, '#b59b74', .22);
  }
  diamond(c, 0, 0, .36, '#a6b399', .47);
  diamond(c, 0, 0, .15, '#c0aa80', .23);
}
function palaceFloor(c, p) {
  rect(c, -6.5, -5.8, 13, 12.2, p.floor);
  for (let y = -5.8; y < 6.4; y += .48) for (let x = -6.5; x < 6.5; x += .48) {
    line(c, [[x + .03, y], [x + .46, y]], p.seam, .018);
    line(c, [[x, y + .04], [x, y + .44]], '#bdcec138', .018);
  }
  for (const x of [-6.05, 6.05]) {
    rect(c, x - .3, -5.48, .6, 11.48, '#407fa6');
    for (let y = -5.2; y < 5.9; y += .48) {
      diamond(c, x, y, .18, '#ebcd80', .2);
      diamond(c, x, y, .07, '#f3ebc5', .09);
    }
  }
  for (const y of [-5.45, 6.02]) {
    rect(c, -6.3, y - .2, 12.6, .4, '#407fa6');
    for (let x = -5.75; x < 6; x += .5) diamond(c, x, y, .14, '#ead08d', .12);
  }
  // Individually separated tesserae make this read as a palace mosaic at zoom.
  oval(c, 0, 0, 3.35, 3.35, '#bccfd04f');
  for (let i = 0; i < 64; i++) {
    const a = i * TAU / 64;
    local(c, Math.cos(a) * 3.12, Math.sin(a) * 3.12, () => {
      c.rotate(a); rect(c, -.09, -.1, .18, .2, i % 2 ? '#c7ae70' : '#779eae');
    });
  }
  for (let i = 0; i < 12; i++) {
    const a = i * TAU / 12;
    local(c, 0, 0, () => {
      c.rotate(a);
      poly(c, [[.46, 0], [1.8, -.27], [2.6, 0], [1.8, .27]], i % 2 ? '#b8b58a' : '#7da8bb', '#dce3d0', .05);
      line(c, [[1.1, 0], [2.28, 0]], '#dfe4cb', .025);
    });
  }
  oval(c, 0, 0, .48, .48, '#c2ae76', '#e4e7cd', .05);
  diamond(c, 0, 0, .25, '#779eae');
}
function templeFloor(c, p) {
  rect(c, -6.5, -5.8, 13, 12.2, p.floor);
  for (let row = 0; row < 6; row++) for (let col = 0; col < 7; col++) {
    const x = -6.5 + col * 2, y = -5.8 + row * 2.15;
    rect(c, x + .025, y + .025, 1.95, 2.1, (row + col) % 3 ? '#e8eee8' : '#dce7e3');
    line(c, [[x + .04, y + .04], [x + 1.94, y + .04]], '#ffffff88', .035);
    const k = (col * 7 + row * 11) % 5 * .11;
    line(c, [[x + .15, y + .6 + k], [x + .58, y + .72], [x + .81, y + .99], [x + 1.21, y + 1.05], [x + 1.8, y + 1.58 - k]], '#a6c2bb35', .028);
    line(c, [[x + .81, y + .99], [x + .9, y + 1.25], [x + 1.17, y + 1.37]], '#b2c9c02b', .022);
  }
  for (const x of [-6.09, 6.09]) {
    rect(c, x - .26, -5.5, .52, 11.55, '#96bfba');
    for (let y = -5.4; y < 5.8; y += .65) line(c, [[x - .19, y], [x + .16, y], [x + .16, y + .45], [x - .07, y + .45], [x - .07, y + .22], [x - .19, y + .22]], '#e9f0dc', .06);
  }
  for (const y of [-5.45, 6.02]) {
    line(c, [[-5.85, y], [5.85, y]], '#9a8fb1', .22);
    for (let x = -5.6; x < 5.8; x += .7) diamond(c, x, y, .1, '#e9eadb', .08);
  }
  oval(c, 0, 0, 2.5, 2.5, '#d1e2db60', '#b1cbc2', .045);
  oval(c, 0, 0, 2.29, 2.29, '#e5ece44d', '#b2a8bf66', .055);
  laurel(c, 0, 0, 3.2, '#a7c4b6');
  diamond(c, 0, -.05, .5, '#a69dba66', .85);
  diamond(c, 0, -.05, .24, '#b0cec3', .42);
}

function fur(c, x, y, color) {
  const points = [];
  for (let i = 0; i < 40; i++) {
    const a = i * TAU / 40, r = i % 2 ? 1 : .86;
    points.push([x + Math.cos(a) * r * 1.1, y + Math.sin(a) * r * .38]);
  }
  poly(c, points, color, '#766959', .025);
  for (let i = 0; i < 10; i++) {
    const xx = x - .79 + i * .175;
    line(c, [[xx, y - .12], [xx + .07, y + .04], [xx + .02, y + .16]], '#f7ebcf66', .04);
  }
}
function throne(c, p, id, completed) {
  const frame = id === 'north' ? '#a78a5e' : id === 'west' ? '#b78058' : GOLD;
  rect(c, -1.22, -6.4, 2.44, .48, p.edge, INK);
  line(c, [[-1.16, -6.03], [1.16, -6.03]], p.light, .065);
  poly(c, [[-.92, -6.45], [-.9, -7.33], [-.65, -7.57], [0, -7.78], [.65, -7.57], [.9, -7.33], [.92, -6.45]], frame, INK, .055);
  poly(c, [[-.65, -6.48], [-.65, -7.24], [0, -7.55], [.65, -7.24], [.65, -6.48]], p.cloth, p.light, .045);
  for (const s of [-1, 1]) {
    round(c, s < 0 ? -.99 : .68, -6.7, .31, .52, .07, frame);
    oval(c, s * .83, -6.73, .17, .1, p.light, INK, .025);
    diamond(c, s * .83, -6.47, .07, p.accent, .095);
  }
  round(c, -.65, -6.53, 1.3, .35, .08, p.cloth);
  line(c, [[-.55, -6.48], [.55, -6.48]], p.light, .035);
  if (id === 'north') { fur(c, 0, -6.47, '#e2cfa9'); antlers(c, 0, -7.11, .64); }
  else if (id === 'west') {
    for (const x of [-.72, .72]) for (const y of [-7.2, -6.94]) oval(c, x, y, .045, .045, LIGHT_GOLD);
    poly(c, [[-.25, -7.29], [.25, -7.29], [.2, -6.95], [0, -6.8], [-.2, -6.95]], p.accent, LIGHT_GOLD, .035);
  } else if (id === 'south') {
    for (let i = 0; i < 12; i++) {
      const a = i * TAU / 12;
      line(c, [[Math.cos(a) * .19, -7.13 + Math.sin(a) * .19], [Math.cos(a) * .29, -7.13 + Math.sin(a) * .29]], GOLD, .035);
    }
    oval(c, 0, -7.13, .13, .13, p.light);
  } else laurel(c, 0, -7.11, .62, LIGHT_GOLD);
  if (completed) {
    oval(c, 0, -7.52, .13, .13, '#58cbb3', INK, .025);
    line(c, [[-.07, -7.52], [-.015, -7.46], [.08, -7.58]], '#f4ffe2', .035);
  }
}
function column(c, x, y, p, id) {
  rect(c, x - .32, y - .09, .64, .25, p.wall, INK);
  rect(c, x - .24, y - 1.05, .48, 1, p.edge, INK);
  rect(c, x - .2, y - 1.04, .13, .92, p.light);
  for (const dx of [-.08, .06, .17]) line(c, [[x + dx, y - .9], [x + dx, y - .15]], id === 'south' ? '#d7ba79' : '#9cb6b3', .025);
  rect(c, x - .34, y - 1.2, .68, .22, p.edge, INK);
  rect(c, x - .29, y - 1.01, .58, .12, id === 'east' ? p.accent : p.cloth);
  if (id === 'east') for (const s of [-1, 1]) oval(c, x + s * .25, y - 1.08, .1, .09, p.light, '#8daca8', .025);
  if (id === 'south') {
    for (const s of [-1, 1]) poly(c, [[x, y - 1.07], [x + s * .34, y - 1.25], [x + s * .19, y - 1.32]], p.light, GOLD, .025);
  }
}
function amphora(c, x, y, p) {
  for (const s of [-1, 1]) {
    c.beginPath(); c.ellipse(x + s * .2, y - .35, .13, .21, 0, 0, TAU);
    c.strokeStyle = GOLD; c.lineWidth = .065; c.stroke();
  }
  poly(c, [[x - .13, y - .67], [x + .13, y - .67], [x + .11, y - .48], [x + .26, y - .28], [x + .17, y + .01], [x - .17, y + .01], [x - .26, y - .28], [x - .11, y - .48]], p.cloth, GOLD, .04);
  line(c, [[x - .17, y - .2], [x + .17, y - .2]], p.light, .055);
  oval(c, x, y - .67, .15, .055, GOLD);
  oval(c, x, y - .68, .09, .025, '#315267');
}
function timberPerimeter(c, p, time) {
  for (let row = 0; row < 5; row++) {
    const y = -8 + row * .42;
    round(c, -7.4, y, 14.8, .39, .14, row % 2 ? '#79684f' : '#887356');
    line(c, [[-7.1, y + .09], [7.1, y + .09]], '#c3a37377', .045);
    for (const x of [-5.9, -2.1, 2.1, 5.9]) oval(c, x, y + .19, .07, .055, '#b19366', INK, .02);
  }
  for (const s of [-1, 1]) {
    const x = s * 7;
    rect(c, x - .46, -6.1, .92, 12.6, '#72624e', INK);
    for (const dx of [-.27, .25]) line(c, [[x + dx, -5.9], [x + dx, 6.4]], '#c1a272', .065);
    for (const y of [-5.2, -1.4, 2.2, 5.3]) {
      rect(c, x - .4, y, .8, .23, '#3f4d48', INK);
      for (const dx of [-.25, .25]) oval(c, x + dx, y + .11, .045, .045, GOLD);
    }
    for (const y of [-.7, 3.7]) {
      rect(c, x - .28, y - .82, .56, 1.64, '#463e36', INK);
      rect(c, x - .26, y - .78, .52, 1.36, '#a3855d', INK);
      for (let i = 0; i < 6; i++) line(c, [[x - .22, y - .65 + i * .21], [x + .22, y - .65 + i * .21]], '#e5c28f77', .04);
    }
    banner(c, s * 4.9, -7.68, { ...p, cloth: p.accent }, 'north', time, s);
    fur(c, s * 3.15, -6.28, s < 0 ? '#d4c5ac' : '#9a927d');
    for (const y of [-3.7, 2.1]) flame(c, x, y, time, s + y);
  }
}
function stonePerimeter(c, p, time) {
  for (let row = 0; row < 4; row++) {
    const y = -8 + row * .52;
    rect(c, -7.5, y, 15, .5, row % 2 ? '#819598' : '#90a2a2', INK);
    for (let x = -7.5 + (row % 2) * .65; x < 7.5; x += 1.3) line(c, [[x, y], [x, y + .5]], '#5e777d', .035);
    line(c, [[-7.4, y + .09], [7.4, y + .09]], '#d5ddc666', .045);
  }
  for (const s of [-1, 1]) {
    const x = s * 7;
    rect(c, x - .47, -6.1, .94, 12.6, '#7f9496', INK);
    for (let y = -5.9; y < 6.4; y += .78) {
      rect(c, x - .39, y, .78, .74, '#9fb1ad', INK, .025);
      line(c, [[x - .3, y + .08], [x + .3, y + .08]], '#d7dfce', .035);
    }
    for (const y of [-4.4, -.8, 3.3]) {
      rect(c, x - .36, y - .3, .72, .8, '#5c7379', INK);
      rect(c, x - .4, y - .42, .8, .18, p.edge, INK);
      poly(c, [[x - .25, y - .15], [x + .25, y - .15], [x + .2, y + .31], [x, y + .47], [x - .2, y + .31]], p.accent, GOLD);
      line(c, [[x, y - .05], [x, y + .32]], LIGHT_GOLD, .045);
    }
    banner(c, s * 3.1, -7.7, p, 'west', time, s);
    banner(c, s * 5.35, -7.7, { ...p, cloth: p.accent }, 'west', time, s + 2);
    flame(c, s * 6.95, 5.7, time, s);
  }
  for (let x = -7.1; x < 7.3; x += .92) rect(c, x - .25, -7.95, .5, .28, p.edge, INK);
}
function palacePerimeter(c, p, time) {
  rect(c, -7.5, -8, 15, 2.2, '#ebdfbb', INK);
  rect(c, -7.5, -7.91, 15, .19, GOLD);
  rect(c, -7.5, -6.42, 15, .4, p.cloth);
  for (let x = -7.2; x < 7.3; x += .46) diamond(c, x, -6.22, .12, p.light, .14);
  for (const s of [-1, 1]) {
    const x = s * 7;
    rect(c, x - .48, -6.1, .96, 12.6, '#5894b1', INK);
    for (const dx of [-.34, .34]) line(c, [[x + dx, -5.9], [x + dx, 6.4]], GOLD, .06);
    for (let y = -5.7; y < 6.1; y += .55) diamond(c, x, y, .15, '#99ccd1', .18);
    for (const y of [-4.6, -.3, 4]) column(c, x, y, p, 'south');
    for (const y of [-2.35, 2.05, 6.05]) amphora(c, x, y, p);
    banner(c, s * 2.65, -7.7, p, 'south', time, s);
    for (const xx of [4.3, 5.4, 6.5]) {
      const cx = s * xx;
      oval(c, cx, -7.05, .37, .37, p.cloth, GOLD, .055);
      for (let i = 0; i < 6; i++) {
        const a = i * TAU / 6;
        diamond(c, cx + Math.cos(a) * .22, -7.05 + Math.sin(a) * .22, .06, '#e9d28f');
      }
      diamond(c, cx, -7.05, .13, p.light);
    }
  }
}
function templePerimeter(c, p, time) {
  rect(c, -7.5, -8, 15, 2.2, '#d6e4dd', INK);
  rect(c, -7.5, -7.97, 15, .28, p.edge, INK);
  for (let x = -7.2; x < 7.4; x += .56) rect(c, x, -7.63, .12, .22, p.accent);
  rect(c, -7.5, -6.25, 15, .25, '#94b5b2', INK);
  for (const s of [-1, 1]) {
    const x = s * 7;
    rect(c, x - .48, -6.1, .96, 12.6, '#b8d0c7', INK);
    rect(c, x - .44, -6.1, .22, 12.6, '#eaf2e4');
    for (const y of [-4.7, -1.25, 2.2, 5.65]) column(c, x, y, p, 'east');
    for (const y of [-3, .45, 3.9]) {
      rect(c, x - .29, y - .55, .58, .95, p.cloth, p.light);
      laurel(c, x, y - .04, .4, '#e5dcac');
    }
    for (const xx of [2.9, 5.25]) {
      banner(c, s * xx, -7.53, { ...p, cloth: xx === 2.9 ? p.cloth : p.accent }, 'east', time, s + xx);
      column(c, s * (xx + .62), -5.99, p, 'east');
    }
  }
  poly(c, [[-1.75, -7.56], [0, -7.97], [1.75, -7.56]], p.edge, INK);
  poly(c, [[-1.3, -7.63], [0, -7.9], [1.3, -7.63]], p.accent, null);
}
function bottomWallAndExit(c, p, id) {
  // Open central span, with NO lintel/roof across the exit or walkable floor.
  for (const s of [-1, 1]) {
    const x = s < 0 ? -7.5 : 1.65;
    rect(c, x, 6.45, 5.85, 1.55, p.wall, INK, .06);
    rect(c, x + .08, 6.47, 5.69, .25, p.edge, INK);
    line(c, [[x + .16, 6.52], [x + 5.69, 6.52]], p.light, .055);
    for (let xx = x + .5; xx < x + 5.7; xx += .83) {
      if (id === 'north') line(c, [[xx, 6.8], [xx, 7.9]], '#a9916a', .045);
      else { line(c, [[xx, 6.85], [xx, 7.91]], '#314b503f', .03); diamond(c, xx, 7.17, .09, p.edge); }
    }
    rect(c, s < 0 ? -1.87 : 1.5, 6.45, .37, 1.18, p.edge, INK);
  }
  rect(c, -1.49, 6.4, 2.98, 1.6, '#72a56d');
  rect(c, -1.49, 7.22, 2.98, .78, '#8fba77');
  for (let i = 0; i < 3; i++) {
    const y = 6.43 + i * .27, w = 2.84 - i * .17;
    rect(c, -w / 2, y, w, .27, i % 2 ? '#bcc9ab' : '#dfe1bf', INK, .025);
    line(c, [[-w / 2 + .04, y + .055], [w / 2 - .04, y + .055]], '#f6f0cd', .045);
  }
  for (const s of [-1, 1]) for (let i = 0; i < 4; i++) {
    const x = s * (1.02 + i % 2 * .26), y = 7.47 + i * .13;
    line(c, [[x - .07, y], [x, y - .14], [x + .06, y - .035]], '#4f875e', .025);
  }
}
function exitChevrons(c, time) {
  // Exact gameplay threshold is (0, 6.2), not the bottom of the wall/steps.
  for (const y of [5.65, 6.2]) {
    poly(c, [[-.46, y - .17], [0, y + .06], [.46, y - .17], [.46, y + .02], [0, y + .26], [-.46, y + .02]], GOLD, '#6a754e', .035);
    line(c, [[-.39, y - .1], [0, y + .1], [.39, y - .1]], LIGHT_GOLD, .045);
  }
  const glint = .45 + Math.sin(time * 2) * .15;
  c.save();
  try {
    c.globalAlpha = glint;
    line(c, [[-.66, 6.2], [-.81, 6.2]], LIGHT_GOLD, .06);
    line(c, [[.66, 6.2], [.81, 6.2]], LIGHT_GOLD, .06);
  } finally { c.restore(); }
}

/**
 * Background-only Canvas art, in WORLD cells, translated internally by king.x/y.
 * Outer rectangle: king + x[-7.5,7.5], y[-8,8]. Flat walkable floor:
 * x[-6.5,6.5], y[-5.8,6.4]. All furniture is clipped OUT of that floor.
 * Draw before fighters, wrecks, effects and UI. No collision/state/asset ownership.
 * The only exit is below: exact threshold king + (0,6.2), steps and green beyond.
 * region: north/west/south/east (faction aliases accepted); time is seconds.
 */
export function drawBossInterior(c, { region = 'north', king, time = 0, completed = false } = {}) {
  if (!king || !Number.isFinite(king.x) || !Number.isFinite(king.y)) return;
  const id = regionId(region), p = THEMES[id], t = Number.isFinite(time) ? time % 3600 : 0;
  c.save();
  try {
    resetDrawing(c); c.translate(king.x, king.y);
    c.beginPath(); c.rect(-7.5, -8, 15, 16); c.clip();
    rect(c, -7.5, -8, 15, 16, p.wall);
    c.save();
    try {
      c.beginPath(); c.rect(-6.5, -5.8, 13, 12.2); c.clip();
      ({ north: timberFloor, west: flagstoneFloor, south: palaceFloor, east: templeFloor })[id](c, p);
      // Narrow contact shadow gives depth without becoming an opaque foreground.
      for (const x of [-6.5, 6.38]) rect(c, x, -5.8, .12, 12.2, '#243f4918');
      rect(c, -6.5, -5.8, 13, .13, '#243f4918');
    } finally { c.restore(); }
    c.save();
    try {
      c.beginPath(); c.rect(-7.5, -8, 15, 16); c.rect(-6.5, -5.8, 13, 12.2); c.clip('evenodd');
      ({ north: timberPerimeter, west: stonePerimeter, south: palacePerimeter, east: templePerimeter })[id](c, p, t);
      throne(c, p, id, completed);
      bottomWallAndExit(c, p, id);
    } finally { c.restore(); }
    exitChevrons(c, t);
  } finally { c.restore(); }
}

function portalPath(c, id) {
  c.beginPath(); c.moveTo(-.96, 0); c.lineTo(-.96, -1.58);
  if (id === 'north') { c.lineTo(-.73, -1.99); c.lineTo(.73, -1.99); c.lineTo(.96, -1.58); }
  else if (id === 'east') { c.lineTo(-.96, -2); c.lineTo(.96, -2); }
  else { c.bezierCurveTo(-.96, -2.43, .96, -2.43, .96, -1.58); }
  c.lineTo(.96, 0); c.closePath();
}
function lock(c) {
  c.beginPath(); c.moveTo(-.2, -1.01); c.lineTo(-.2, -1.27);
  c.bezierCurveTo(-.2, -1.66, .2, -1.66, .2, -1.27); c.lineTo(.2, -1.01);
  c.strokeStyle = INK; c.lineWidth = .14; c.stroke();
  c.strokeStyle = LIGHT_GOLD; c.lineWidth = .075; c.stroke();
  round(c, -.33, -1.09, .66, .53, .09, GOLD);
  oval(c, 0, -.88, .07, .075, INK);
  poly(c, [[-.035, -.84], [.035, -.84], [.065, -.7], [-.065, -.7]], INK, null);
}

/**
 * Exterior overlay, drawn AFTER existing landscape but BEFORE units.
 * Reserve x +/-1.8, y[-3,.12] relative to king; doorway threshold is EXACTLY
 * king.x/y (not the older facade door at y-1). Roof and piers stay above y=0.
 * unlocked gives an empty dark portal; locked gives barred panels + padlock.
 * completed adds a small laurel, never a second entrance or gameplay change.
 */
export function drawBossEntrance(c, { region = 'north', king, time = 0, unlocked = true, completed = false } = {}) {
  if (!king || !Number.isFinite(king.x) || !Number.isFinite(king.y)) return;
  const id = regionId(region), p = THEMES[id], t = Number.isFinite(time) ? time % 3600 : 0;
  c.save();
  try {
    resetDrawing(c); c.translate(king.x, king.y);
    c.beginPath(); c.rect(-1.8, -3, 3.6, 3.12); c.clip();
    rect(c, -1.62, -2.58, 3.24, 2.58, p.wall, INK, .055);
    if (id === 'north') {
      for (const s of [-1, 1]) {
        rect(c, s < 0 ? -1.58 : 1.12, -2.48, .46, 2.48, '#897356', INK);
        line(c, [[s * 1.34, -2.26], [s * 1.34, -.15]], '#c4a573', .055);
        for (const y of [-1.93, -.32]) {
          rect(c, s < 0 ? -1.63 : 1.07, y, .56, .2, '#414e48', INK);
          oval(c, s * 1.34, y + .1, .045, .045, GOLD);
        }
      }
      poly(c, [[-1.78, -2.28], [-1.5, -2.7], [0, -2.99], [1.5, -2.7], [1.78, -2.28]], '#83556a', INK, .06);
      line(c, [[-1.65, -2.37], [0, -2.77], [1.65, -2.37]], '#c39e7b', .065);
      antlers(c, 0, -2.5, .48);
    } else if (id === 'west') {
      for (const s of [-1, 1]) for (let i = 0; i < 5; i++) {
        rect(c, s < 0 ? -1.64 : 1.1, -2.4 + i * .48, .54, .45, i % 2 ? '#a6b5ad' : '#c1c8b7', INK, .035);
      }
      rect(c, -1.77, -2.61, 3.54, .33, p.edge, INK);
      for (const x of [-1.46, -.73, 0, .73, 1.46]) rect(c, x - .22, -2.98, .44, .43, '#d7d9c4', INK);
      rect(c, -1.43, -2.42, 2.86, .15, p.accent, INK);
    } else {
      for (const s of [-1, 1]) column(c, s * 1.35, -.2, p, id);
      for (const s of [-1, 1]) {
        rect(c, s < 0 ? -1.57 : 1.13, -2.34, .44, 1.15, p.edge, INK);
        rect(c, s < 0 ? -1.48 : 1.2, -2.33, .12, 1.13, p.light);
      }
      rect(c, -1.76, -2.44, 3.52, .23, p.edge, INK);
      poly(c, [[-1.79, -2.45], [0, -2.99], [1.79, -2.45]], p.edge, INK, .055);
      poly(c, [[-1.27, -2.52], [0, -2.89], [1.27, -2.52]], id === 'south' ? p.cloth : p.accent, null);
      if (id === 'south') { oval(c, 0, -2.65, .12, .12, GOLD); diamond(c, 0, -2.65, .06, p.light); }
      else laurel(c, 0, -2.7, .35, LIGHT_GOLD);
      line(c, [[-1.7, -2.26], [1.7, -2.26]], id === 'east' ? p.cloth : GOLD, .07);
    }
    portalPath(c, id); c.fillStyle = '#192e36'; c.fill();
    c.strokeStyle = id === 'north' ? '#c5ab77' : p.edge; c.lineWidth = .13; c.stroke();
    c.save();
    try {
      portalPath(c, id); c.clip();
      const depth = c.createLinearGradient(0, -1.7, 0, 0);
      depth.addColorStop(0, '#10252e'); depth.addColorStop(1, '#304a50');
      rect(c, -.97, -2.3, 1.94, 2.3, depth);
      if (!unlocked) {
        rect(c, -.94, -2.2, 1.88, 2.2, id === 'north' ? '#65705a' : p.cloth);
        for (let x = -.8; x < .9; x += .32) line(c, [[x, -2.15], [x, -.06]], id === 'north' ? '#a18a5e' : p.edge, .05);
        for (const y of [-1.57, -.38]) line(c, [[-.95, y], [.95, y]], p.accent, .12);
        lock(c);
      } else {
        // Door leaves sit against the jambs; the central portal has no bars.
        for (const s of [-1, 1]) poly(c, [[s * .96, -.07], [s * .77, -.25], [s * .77, -1.78], [s * .96, -1.97]], p.wall, p.edge, .025);
      }
    } finally { c.restore(); }
    rect(c, -1.13, -.075, 2.26, .15, p.edge, INK, .035);
    line(c, [[-.94, 0], [.94, 0]], unlocked ? LIGHT_GOLD : '#9ca68b', .055);
    if (completed) {
      laurel(c, 0, -2.06, .44, LIGHT_GOLD);
      diamond(c, 0, -2.05, .065, '#6cdbc0');
    }
    for (const s of [-1, 1]) oval(c, s * 1.37, -1.58, .075, .1, unlocked ? '#f7d28a' : '#8d9b89');
    if (unlocked && id === 'north') for (const s of [-1, 1]) {
      poly(c, [[s * 1.37 - .065, -1.65], [s * 1.37, -1.95 - Math.sin(t * 5 + s) * .035], [s * 1.37 + .065, -1.65]], LIGHT_GOLD, null);
    }
  } finally { c.restore(); }
}
