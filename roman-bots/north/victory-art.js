const TAU = Math.PI * 2;
const INK = '#314b50';
const GOLD = '#d8ae54';
const PALE_GOLD = '#ffdf8c';
const SILVER = '#c2d2d3';
const THEMES = {
  forest: { shell: '#945f47', light: '#d5ba91', cloth: '#875d4f', jewel: '#d5ba91' },
  highland: { shell: '#b78848', light: '#f9e1a4', cloth: '#468f8c', jewel: '#58e2d0' },
  punic: { shell: '#c9a35c', light: '#ebce8a', cloth: '#934c79', jewel: '#bda1f4' },
  greek: { shell: '#c3a15f', light: '#f0d68d', cloth: '#7463a5', jewel: '#aeece4' },
  pirate: { shell: '#258b92', light: '#f6d47c', cloth: '#e8a86d', jewel: '#f5e6bc' }
};

function polygon(c, points, fill, stroke = INK, width = .035) {
  c.beginPath();
  points.forEach(([x, y], i) => i ? c.lineTo(x, y) : c.moveTo(x, y));
  c.closePath();
  if (fill) { c.fillStyle = fill; c.fill(); }
  if (stroke) { c.strokeStyle = stroke; c.lineWidth = width; c.stroke(); }
}

function line(c, points, color, width = .035) {
  c.beginPath();
  points.forEach(([x, y], i) => i ? c.lineTo(x, y) : c.moveTo(x, y));
  c.strokeStyle = color; c.lineWidth = width; c.stroke();
}

function oval(c, x, y, rx, ry, fill, stroke = null, width = .035) {
  c.beginPath(); c.ellipse(x, y, rx, ry, 0, 0, TAU);
  c.fillStyle = fill; c.fill();
  if (stroke) { c.strokeStyle = stroke; c.lineWidth = width; c.stroke(); }
}

function box(c, x, y, w, h, r, fill, stroke = INK, width = .035) {
  c.beginPath(); c.roundRect(x, y, w, h, r);
  c.fillStyle = fill; c.fill();
  if (stroke) { c.strokeStyle = stroke; c.lineWidth = width; c.stroke(); }
}

function placed(c, x, y, angle, draw) {
  c.save();
  try { c.translate(x, y); c.rotate(angle); draw(); }
  finally { c.restore(); }
}

function gear(c, x, y, radius) {
  const teeth = [];
  for (let i = 0; i < 32; i++) {
    const a = i * TAU / 32, r = radius * (i % 4 < 2 ? 1 : .78);
    teeth.push([x + Math.cos(a) * r, y + Math.sin(a) * r * .6]);
  }
  polygon(c, teeth, '#93aaad', INK, .025);
  oval(c, x, y, radius * .3, radius * .18, '#43595e');
}

function fallenWeapon(c, weapon, theme) {
  placed(c, .76, .51, -.13, () => {
    if (weapon === 'bow') {
      // Separate snapped limbs, with a slack string lying on the ground.
      line(c, [[-.47, .02], [-.38, -.16], [-.18, -.23], [.02, -.19]], INK, .09);
      line(c, [[-.47, .02], [-.38, -.16], [-.18, -.23], [.02, -.19]], '#b28c54', .045);
      line(c, [[.16, -.15], [.37, -.12], [.54, .04]], INK, .09);
      line(c, [[.16, -.15], [.37, -.12], [.54, .04]], '#b28c54', .045);
      line(c, [[-.47, .02], [-.12, .15], [.22, .11], [.54, .04]], '#ecdfb5', .023);
    } else if (weapon === 'hammer') {
      line(c, [[-.5, .03], [.12, .03]], INK, .095);
      line(c, [[-.5, .02], [.12, .02]], '#b28c54', .047);
      polygon(c, [[.21, -.17], [.55, -.17], [.62, -.08], [.53, -.01], [.63, .09], [.55, .19], [.21, .19]], SILVER);
      box(c, .22, -.17, .075, .36, .015, GOLD);
      line(c, [[.42, -.16], [.38, -.02], [.49, .04], [.45, .17]], INK, .027);
    } else if (weapon === 'spear') {
      line(c, [[-.71, .05], [-.2, .05]], INK, .075);
      line(c, [[-.71, .04], [-.2, .04]], '#b28c54', .035);
      line(c, [[-.07, -.05], [.59, -.12]], INK, .075);
      line(c, [[-.07, -.06], [.59, -.13]], '#b28c54', .035);
      polygon(c, [[.52, -.22], [.95, -.17], [.56, -.03], [.61, -.13]], SILVER);
      line(c, [[.6, -.13], [.86, -.17]], '#f4faf4', .023);
    } else {
      line(c, [[-.47, .01], [-.2, .01]], INK, .09);
      line(c, [[-.45, 0], [-.23, 0]], theme.cloth, .05);
      line(c, [[-.2, -.15], [-.2, .15]], GOLD, .07);
      polygon(c, [[-.13, -.08], [.2, -.08], [.27, 0], [.16, .07], [-.13, .07]], SILVER);
      polygon(c, [[.32, -.04], [.57, -.04], [.76, .04], [.56, .12], [.3, .1], [.4, .03]], '#e1e9e6');
    }
  });
}

function fallenShield(c, shield, theme) {
  if (shield !== 'round' && shield !== 'tower') return;
  placed(c, -1.13, .36, -.22, () => {
    if (shield === 'tower') {
      polygon(c, [[-.37, -.31], [.3, -.31], [.36, -.21], [.16, -.05], [.24, .06], [.06, .31], [-.34, .29]], GOLD);
      polygon(c, [[-.29, -.24], [.23, -.24], [.11, -.04], [.17, .05], [.01, .23], [-.27, .22]], theme.shell, INK, .022);
      line(c, [[-.1, -.19], [-.1, .18]], theme.light, .045);
      polygon(c, [[.39, -.14], [.56, -.2], [.58, .22], [.39, .28], [.29, .14], [.4, .03]], GOLD);
    } else {
      polygon(c, [[-.39, -.06], [-.3, -.22], [-.04, -.27], [.22, -.2], [.05, -.04], [.16, .06], [-.03, .26], [-.29, .19]], GOLD);
      polygon(c, [[-.3, -.05], [-.23, -.15], [-.04, -.19], [.1, -.15], [-.05, -.04], [.05, .05], [-.07, .18], [-.23, .12]], theme.shell, INK, .022);
      polygon(c, [[.32, -.18], [.44, -.06], [.42, .12], [.26, .23], [.14, .14], [.26, .05], [.19, -.04]], theme.shell, GOLD, .045);
    }
    oval(c, -.1, -.015, .085, .06, SILVER, INK, .025);
  });
}

function ruin(c, theme) {
  // The separated boots, empty joints and open cuirass are permanent wreckage.
  polygon(c, [[-.69, -.12], [-.31, -.35], [.68, -.22], [1.02, .27], [.54, .36], [.16, .23], [-.35, .38], [-.84, .17]], theme.cloth);
  for (const [x, y, angle] of [[.66, .27, .23], [.21, .38, -.21]]) {
    placed(c, x, y, angle, () => {
      line(c, [[0, -.07], [.29, -.07]], INK, .11);
      line(c, [[0, -.08], [.29, -.08]], SILVER, .048);
      box(c, .22, -.12, .29, .2, .055, '#637b80');
      line(c, [[.27, -.06], [.43, -.06]], '#dce5df', .025);
      box(c, .23, .02, .28, .06, .014, GOLD, INK, .025);
    });
  }
  line(c, [[-.99, -.04], [-1.29, .04], [-1.41, -.07]], INK, .1);
  line(c, [[-.99, -.05], [-1.29, .03]], '#a0b5b6', .045);
  gear(c, -1.34, .03, .14);
  polygon(c, [[.86, -.31], [1.13, -.2], [1.06, -.04], [.87, -.08], [.79, -.18]], theme.shell);
  gear(c, .96, -.17, .095);
  // An inert drive wheel is visible through the split, never a glowing life core.
  oval(c, .13, -.07, .36, .21, '#42595e', INK);
  gear(c, .16, -.09, .18);
  line(c, [[.15, .04], [.36, .08], [.42, .02]], '#9eada5', .032);
  polygon(c, [[-.43, -.44], [.02, -.48], [-.09, -.29], [.01, -.18], [-.16, .12], [-.53, .03], [-.61, -.21]], SILVER);
  polygon(c, [[.17, -.47], [.64, -.38], [.76, -.06], [.55, .12], [.06, .13], [.19, -.13], [.09, -.24]], '#a2b9bd');
  for (const y of [-.32, -.2, -.08]) {
    line(c, [[-.47, y], [-.19, y + .045]], '#eef2e9', .052);
    line(c, [[.28, y + .03], [.61, y + .08]], '#e4e9df', .05);
  }
  line(c, [[-.46, .02], [-.21, .08]], GOLD, .065);
  line(c, [[.3, .12], [.56, .1]], GOLD, .065);
  polygon(c, [[.47, -.38], [.59, -.35], [.57, -.24], [.45, -.29]], theme.shell, INK, .023);
  polygon(c, [[1.14, .17], [1.35, .1], [1.45, .21], [1.29, .3]], SILVER);
  gear(c, -.47, .48, .14);
  for (const [x, y] of [[-.83, .58], [1.2, .42], [-.17, .42]]) {
    oval(c, x, y, .045, .03, PALE_GOLD, INK, .018);
  }
}

function fallenHead(c, faction, theme) {
  placed(c, -.66, -.29, -.24, () => {
    // This head has no neck/body connection, active eyes, smile or repair badge.
    polygon(c, [[-.46, -.33], [.35, -.33], [.48, -.2], [.46, .2], [.29, .27], [-.39, .23], [-.49, .09]], '#9baeb0');
    box(c, -.37, -.22, .72, .32, .065, '#354c52', INK, .028);
    for (const x of [-.19, .18]) {
      line(c, [[x - .095, -.09], [x - .02, -.055], [x + .065, -.09]], '#a8bab8', .038);
    }
    line(c, [[-.15, .17], [.17, .17]], '#657c80', .027);
    box(c, -.53, -.17, .075, .23, .02, GOLD, INK, .025);
    polygon(c, [[-.45, -.33], [-.39, -.54], [-.2, -.65], [.19, -.65], [.4, -.48], [.45, -.31], [.15, -.35], [.08, -.42], [-.02, -.33]], theme.shell);
    line(c, [[-.34, -.44], [-.15, -.51], [.19, -.51]], theme.light, .034);
    if (faction === 'forest') {
      for (const s of [-1, 1]) {
        polygon(c, [[s * .3, -.48], [s * .57, -.68], [s * .51, -.45], [s * .4, -.35]], '#e6d1a1', INK, .028);
      }
    } else if (faction === 'highland' || faction === 'greek') {
      polygon(c, [[-.08, -.63], [-.1, -.8], [.02, -.86], [.13, -.73], [.09, -.64]], theme.cloth, INK, .028);
      line(c, [[0, -.77], [.02, -.65]], theme.light, .025);
    } else if (faction === 'punic') {
      polygon(c, [[-.3, -.6], [-.2, -.76], [.18, -.76], [.3, -.61]], theme.cloth, INK, .03);
      for (const x of [-.16, -.04, .08]) line(c, [[x, -.71], [x + .03, -.62]], '#e3a0b8', .022);
    } else if (faction === 'pirate') {
      polygon(c, [[-.43, -.5], [-.1, -.46], [.2, -.51], [.43, -.43], [.4, -.33], [-.43, -.37]], theme.light, INK, .03);
      polygon(c, [[.41, -.45], [.66, -.38], [.53, -.27], [.68, -.18], [.47, -.2], [.38, -.33]], theme.cloth, INK, .028);
    }
    // The boss crown is crushed into two recognizable, mismatched gold pieces.
    polygon(c, [[-.32, -.65], [-.39, -.9], [-.21, -.81], [-.07, -1], [.04, -.83], [-.03, -.72], [.04, -.64]], GOLD);
    oval(c, -.12, -.81, .045, .05, theme.jewel, INK, .018);
    line(c, [[-.29, -.69], [-.08, -.69]], PALE_GOLD, .028);
  });
  polygon(c, [[-.2, .3], [-.08, .04], [.03, .19], [.21, .1], [.12, .35]], GOLD);
  line(c, [[-.12, .3], [.07, .31]], PALE_GOLD, .026);
}

function victoryFlag(c, time, index) {
  const sway = Math.sin(time * 1.35 + index * .7) * .045;
  // A long planted standard clears the fallen helmet, with a stable central mark.
  line(c, [[.31, .06], [.31, -2.55]], INK, .11);
  line(c, [[.295, .04], [.295, -2.55]], GOLD, .055);
  line(c, [[.19, -2.4], [1.79, -2.4]], INK, .09);
  line(c, [[.19, -2.415], [1.79, -2.415]], PALE_GOLD, .042);
  polygon(c, [[.37, -2.34], [1.73, -2.34 + sway], [1.81, -1.85 + sway], [1.55, -1.62 + sway], [1.73, -1.3 + sway], [.37, -1.36]], '#227fb2', INK, .055);
  polygon(c, [[.38, -2.32], [.66, -2.32], [.69, -1.36], [.38, -1.38]], '#5ddbc9', null);
  polygon(c, [[1.51, -2.31 + sway], [1.7, -2.31 + sway], [1.77, -1.85 + sway], [1.5, -1.62 + sway], [1.69, -1.34 + sway], [1.48, -1.35 + sway], [1.34, -1.65 + sway], [1.57, -1.87 + sway]], '#17668c', null);
  line(c, [[.43, -2.25], [1.65, -2.25 + sway]], '#8aeee0', .028);
  line(c, [[.43, -1.44], [1.58, -1.41 + sway]], PALE_GOLD, .028);
  // Dark under-stroke keeps the large ivory check legible at phone-scale zoom.
  const check = [[.79, -1.85], [.99, -1.65], [1.35, -2.08]];
  line(c, check, '#15536a', .18);
  line(c, check, '#fff2bb', .115);
  polygon(c, [[.17, -2.57], [.12, -2.79], [.25, -2.71], [.31, -2.91], [.4, -2.71], [.53, -2.8], [.47, -2.57]], GOLD, INK, .032);
  line(c, [[.2, -2.59], [.44, -2.59]], PALE_GOLD, .033);
  for (const y of [-2.28, -1.48]) line(c, [[.27, y], [.41, y]], PALE_GOLD, .045);
  oval(c, .31, .075, .15, .065, '#667b73', INK, .025);
}

/**
 * Draw one persistent boss wreck at its world-space x/y; caller owns camera,
 * culling and persistence. Reserve x +/- 1.9 and y [-3, +.85] world units.
 * time is seconds (0 freezes cloth); index is an optional stable numeric phase.
 * faction uses art.js IDs, plus north/northforest/north-forest and carthage aliases.
 * Missing/unknown faction defaults to forest. No unit fields are mutated; hp,
 * boss/captain, angle and combat animation fields do not change the wreck pose.
 */
export function drawBossWreck(c, wreck, time = 0) {
  if (!wreck || !Number.isFinite(wreck.x) || !Number.isFinite(wreck.y)) return;
  const alias = { north: 'forest', northforest: 'forest', 'north-forest': 'forest', carthage: 'punic' };
  const requested = Object.hasOwn(alias, wreck.faction) ? alias[wreck.faction] : wreck.faction;
  const faction = Object.hasOwn(THEMES, requested) ? requested : 'forest';
  const theme = THEMES[faction];
  const t = Number.isFinite(time) ? time % (TAU / 1.35) : 0;
  const index = Number.isFinite(wreck.index) ? wreck.index % 64 : 0;
  c.save();
  try {
    c.translate(wreck.x, wreck.y);
    c.lineCap = 'round'; c.lineJoin = 'round'; c.setLineDash([]); c.lineDashOffset = 0;
    c.shadowBlur = 0; c.shadowOffsetX = 0; c.shadowOffsetY = 0;
    oval(c, .02, .23, 1.65, .4, '#25464b24');
    oval(c, -.04, .24, 1.22, .26, '#25464b15');
    fallenWeapon(c, wreck.weapon, theme);
    ruin(c, theme);
    fallenShield(c, wreck.shield, theme);
    fallenHead(c, faction, theme);
    victoryFlag(c, t, index);
  } finally { c.restore(); }
}
