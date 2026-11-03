const TAU = Math.PI * 2;
const INK = '#314f55';
const GOLD = '#f6d47c';
const PAPER = '#fff3d5';
const THEMES = {
  plunderers: { cloth: '#ae525c', shade: '#773e52', light: '#efad83' },
  revolt: { cloth: '#8963a2', shade: '#574975', light: '#d7bee8' },
  pirates: { cloth: '#258b92', shade: '#23616f', light: '#9de3d3' },
  invasion: { cloth: '#397fb2', shade: '#315b88', light: '#b6e2ef' }
};

const phase = time => Number.isFinite(time) ? time % (TAU * 100) : 0;
const point = (x, y) => Number.isFinite(x) && Number.isFinite(y);

function pendingSites(quest, completed) {
  if (!quest || !Object.hasOwn(THEMES, quest.kind) || !Array.isArray(quest.encounters)) return [];
  const done = new Set(Array.isArray(completed) ? completed : []);
  // Return quests reuse coordinates, not IDs, from the original regional fights.
  const sites = quest.encounters.filter(site => site && point(site.x, site.y) && !done.has(site.id));
  return quest.kind === 'invasion' ? sites.slice(0, 1) : sites;
}

function poly(c, points, fill, stroke = INK, width = .045) {
  c.beginPath();
  points.forEach(([x, y], i) => i ? c.lineTo(x, y) : c.moveTo(x, y));
  c.closePath();
  c.fillStyle = fill;
  c.fill();
  if (stroke) { c.strokeStyle = stroke; c.lineWidth = width; c.stroke(); }
}

function oval(c, x, y, rx, ry, fill, stroke = null, width = .045) {
  c.beginPath(); c.ellipse(x, y, rx, ry, 0, 0, TAU);
  c.fillStyle = fill; c.fill();
  if (stroke) { c.strokeStyle = stroke; c.lineWidth = width; c.stroke(); }
}

function line(c, x, y, xx, yy, color, width = .045) {
  c.beginPath(); c.moveTo(x, y); c.lineTo(xx, yy);
  c.strokeStyle = color; c.lineWidth = width; c.stroke();
}

function curve(c, points, color, width) {
  c.beginPath(); c.moveTo(points[0], points[1]);
  c.bezierCurveTo(...points.slice(2));
  c.strokeStyle = color; c.lineWidth = width; c.stroke();
}

// Glyphs share a two-unit design box, both on cloth and at map-pixel scale.
function emblem(c, kind, fill = PAPER) {
  if (kind === 'pirates') {
    oval(c, 0, -.69, .2, .2, fill);
    oval(c, 0, -.69, .085, .085, THEMES.pirates.cloth);
    line(c, 0, -.45, 0, .68, fill, .18);
    line(c, -.39, -.24, .39, -.24, fill, .16);
    curve(c, [-.7, .16, -.69, .64, -.27, .67, 0, .84], fill, .17);
    curve(c, [.7, .16, .69, .64, .27, .67, 0, .84], fill, .17);
    poly(c, [[-.81, .28], [-.68, -.02], [-.47, .24]], fill, null);
    poly(c, [[.81, .28], [.68, -.02], [.47, .24]], fill, null);
  } else if (kind === 'revolt') {
    poly(c, [[-.88, .66], [-.25, -.45], [.03, -.05], [.35, -.7], [.9, .66]], fill, null);
    poly(c, [[-.41, -.16], [-.25, -.45], [-.05, -.15], [-.24, -.23]], GOLD, null);
    poly(c, [[.16, -.34], [.35, -.7], [.55, -.3], [.36, -.43]], GOLD, null);
    line(c, -.8, .82, .8, .82, fill, .12);
  } else if (kind === 'invasion') {
    // A crested Greek helmet, not a letter or a face.
    poly(c, [[-.55, -.4], [-.59, -.72], [-.23, -.95], [.29, -.9], [.65, -.58], [.43, -.35]], GOLD, null);
    c.beginPath(); c.moveTo(-.64, .08);
    c.bezierCurveTo(-.66, -.73, .61, -.73, .64, .08);
    c.lineTo(.7, .27); c.lineTo(.27, .27); c.lineTo(.31, .69);
    c.lineTo(.03, .52); c.lineTo(0, .07); c.lineTo(-.19, .07);
    c.lineTo(-.23, .69); c.lineTo(-.57, .57); c.lineTo(-.57, .23);
    c.lineTo(-.74, .23); c.closePath(); c.fillStyle = fill; c.fill();
    curve(c, [-.78, .88, -.36, .61, .3, 1.03, .8, .76], GOLD, .12);
  } else {
    poly(c, [[-.51, -.79], [-.12, -.68], [.2, -.8], [.08, -.4], [-.34, -.36]], GOLD, null);
    c.beginPath(); c.moveTo(-.36, -.35);
    c.bezierCurveTo(-1, .16, -.75, .81, -.12, .81);
    c.bezierCurveTo(.65, .81, .76, .24, .06, -.35);
    c.closePath(); c.fillStyle = fill; c.fill();
    line(c, -.4, -.29, .15, -.29, GOLD, .14);
    // A single leaf identifies woodland loot without tiny coin lettering.
    c.beginPath(); c.moveTo(.16, .49);
    c.bezierCurveTo(-.02, -.05, .55, -.5, .86, -.56);
    c.bezierCurveTo(.91, -.04, .69, .5, .16, .49);
    c.closePath(); c.fillStyle = GOLD; c.fill();
    line(c, .2, .49, .7, -.33, THEMES.plunderers.shade, .085);
  }
}

function roll(c, x, y, fill) {
  poly(c, [[x - .37, y - .32], [x + .3, y - .32], [x + .4, y - .05], [x - .34, y + .04]], fill);
  oval(c, x + .31, y - .15, .13, .19, PAPER, INK, .035);
  curve(c, [x + .35, y - .24, x + .14, y - .3, x + .21, y - .03, x + .33, y - .12], '#9e926f', .025);
  line(c, x - .08, y - .31, x - .06, y, '#9f7f57', .075);
}

function supplies(c, kind) {
  if (kind === 'pirates') {
    // A miniature mooring barrel and rope, never a boat across the shoreline.
    poly(c, [[.43, -.57], [.79, -.57], [.85, -.17], [.77, -.06], [.43, -.06], [.37, -.17]], '#c39b6c');
    oval(c, .61, -.57, .18, .07, '#ead6a2', INK, .035);
    for (const y of [-.42, -.16]) line(c, .4, y, .81, y, '#507f83', .065);
    line(c, .59, -.47, .61, -.22, '#f1d49b', .025);
    for (const r of [.12, .2, .28]) {
      c.beginPath(); c.ellipse(1.1, -.07, r, r * .44, -.12, 0, TAU);
      c.strokeStyle = '#dfc58f'; c.lineWidth = .04; c.stroke();
    }
    curve(c, [.92, -.04, .86, .12, 1.32, .2, 1.39, .04], '#dfc58f', .04);
  } else if (kind === 'revolt') {
    roll(c, .75, -.08, '#bd9ec8');
    oval(c, .37, -.37, .25, .3, '#dce8dc', INK);
    oval(c, .37, -.39, .16, .21, '#8e6b9c');
    poly(c, [[.37, -.56], [.45, -.38], [.37, -.21], [.29, -.38]], GOLD, null);
  } else if (kind === 'invasion') {
    line(c, .36, -.08, 1.22, -.61, '#b19a6c', .065);
    poly(c, [[1.04, -.6], [1.35, -.87], [1.47, -.68], [1.15, -.44]], '#f3dfb0', INK, .035);
    roll(c, .69, -.02, '#a9d2d7');
  } else {
    roll(c, .98, -.01, '#9bb391');
    poly(c, [[.19, -.17], [.24, -.46], [.51, -.48], [.63, -.22], [.55, -.02], [.25, -.01]], '#e8c28a');
    poly(c, [[.29, -.48], [.25, -.66], [.51, -.61], [.47, -.47]], '#c29462');
    line(c, .26, -.45, .51, -.45, INK, .045);
    oval(c, .4, -.22, .09, .085, GOLD, '#a17a4e', .025);
  }
  // Only the pennants move; ground props remain anchored.
  line(c, -.13, -.04, .11, -.04, '#c8b88d', .04);
}

function standard(c, kind, t, final, elite) {
  const theme = THEMES[kind];
  const h = final ? 2.65 : elite ? 2.15 : 1.85;
  const w = final ? 1.15 : .89;
  const sway = Math.sin(t * 1.8) * .055;
  line(c, 0, .02, 0, -h, INK, .105);
  line(c, -.014, -.08, -.014, -h, '#d2b57c', .049);
  if (final) {
    line(c, -.14, -h + .07, w + .12, -h + .07, GOLD, .075);
    poly(c, [[0, -h - .4], [.15, -h - .21], [0, -h - .04], [-.15, -h - .21]], GOLD);
    oval(c, 0, -h - .21, .045, .05, PAPER);
    // The companion pennant adds rank without widening the action footprint.
    line(c, -.42, -.12, -.42, -1.96, INK, .075);
    poly(c, [[-.39, -1.93], [-.13, -1.88 + sway], [-.14, -.73], [-.26, -.91], [-.39, -.76]], theme.shade, GOLD, .035);
    oval(c, -.42, -2.02, .065, .08, GOLD);
  } else oval(c, 0, -h - .06, .075, .085, elite ? GOLD : theme.light, INK, .035);

  const top = -h + .13, bottom = final ? -.62 : -.65;
  if (kind === 'invasion') {
    poly(c, [[.045, top], [w, top + .06 + sway], [w, bottom - .4 + sway],
      [w * .5, bottom + .08 + sway], [.045, bottom - .4]], theme.cloth, INK, .055);
    poly(c, [[w * .77, top + .05 + sway], [w, top + .06 + sway], [w, bottom - .4 + sway],
      [w * .5, bottom + .08 + sway], [w * .77, bottom - .5 + sway]], theme.shade, null);
    line(c, .14, bottom - .4, w * .5, bottom - .02 + sway, GOLD, .04);
    line(c, w * .5, bottom - .02 + sway, w - .09, bottom - .4 + sway, GOLD, .04);
  } else {
    poly(c, [[.045, top], [w, top + .06 + sway], [w + .015, bottom + sway],
      [w * .55, bottom - .24 + sway], [.045, bottom]], theme.cloth, INK, .055);
    poly(c, [[w * .77, top + .05 + sway], [w, top + .06 + sway], [w + .015, bottom + sway],
      [w * .77, bottom - .12 + sway]], theme.shade, null);
    line(c, .14, bottom - .1, w * .55, bottom - .33 + sway, GOLD, .04);
    line(c, w * .55, bottom - .33 + sway, w - .08, bottom - .1 + sway, GOLD, .04);
  }
  line(c, .12, top + .13, w - .09, top + .18 + sway, final ? GOLD : theme.light, .035);
  c.save();
  c.translate(w * .49, (top + bottom) / 2 - .05 + sway * .4);
  c.scale(final ? .4 : .29, final ? .4 : .29);
  emblem(c, kind);
  c.restore();
  if (elite && !final) poly(c, [[.13, top + .25], [.21, top + .35], [.13, top + .45], [.05, top + .35]], GOLD, null);
  if (final) {
    for (const x of [.27, .61, .95]) {
      line(c, x, bottom + .04, x, bottom + .21 + sway, GOLD, .04);
      oval(c, x, bottom + .23 + sway, .04, .055, GOLD);
    }
  }
}

/** World-space art; time is seconds. Call before fighters. Completed IDs retire.
 * All marks sit at encounter + (3, -2), never on its central fighting ground.
 */
export function drawQuestSites(c, { quest, completed = [], bounds, time = 0 } = {}) {
  const sites = pendingSites(quest, completed);
  if (!sites.length) return;
  const b = bounds || { left: -Infinity, top: -Infinity, right: Infinity, bottom: Infinity };
  if (![b.left, b.top, b.right, b.bottom].every(v => typeof v === 'number' && !Number.isNaN(v)) ||
      b.right <= b.left || b.bottom <= b.top) return;
  const last = quest.encounters.at(-1);
  const t = phase(time);
  c.save();
  try {
    c.lineCap = 'round'; c.lineJoin = 'round'; c.setLineDash([]);
    for (const site of sites) {
      const x = site.x + 3, y = site.y - 2;
      // Include the full banner silhouette, not just the encounter center.
      if (x + 1.65 < b.left || x - .55 > b.right || y + .32 < b.top || y - 3.15 > b.bottom) continue;
      const final = site === last;
      c.save();
      try {
        c.translate(x, y);
        oval(c, .57, .07, .86, .15, '#25464b20');
        standard(c, quest.kind, t + (site.x * .37 + site.y * .21) % TAU, final, site.kind === 'elite');
        supplies(c, quest.kind);
      } finally { c.restore(); }
    }
  } finally { c.restore(); }
}

/** Pixel-space badge centered at x,y: 24 x 24 at size=1. Parent owns zoom. */
export function drawQuestBadge(c, x, y, kind, size = 1, time = 0) {
  if (!point(x, y) || !Number.isFinite(size) || size <= 0 || !Object.hasOwn(THEMES, kind)) return;
  const theme = THEMES[kind];
  c.save();
  try {
    c.translate(x, y); c.scale(size, size);
    c.lineCap = 'round'; c.lineJoin = 'round'; c.setLineDash([]);
    oval(c, 0, 0, 11, 11, PAPER, INK, 1.5);
    oval(c, 0, 0, 8.9, 8.9, theme.cloth, INK, .7);
    c.beginPath(); c.arc(0, 0, 10, -2.65, -1.05 + Math.sin(phase(time)) * .08);
    c.strokeStyle = GOLD; c.lineWidth = 1.2; c.stroke();
    c.scale(7, 7); emblem(c, kind);
  } finally { c.restore(); }
}

function atlasFlag(c) {
  oval(c, 0, 0, 8, 8, PAPER, INK, 1.4);
  line(c, -3, 5, -3, -5, INK, 1.5);
  poly(c, [[-2.5, -5], [5, -4.5], [3.5, -1.7], [5, .8], [-2.5, .3]], GOLD, INK, 1);
}

/** Caller has already applied its world transform. Sizes below are pixel radii.
 * Current target is selected before vertical culling; the caller draws player last.
 */
export function drawQuestAtlas(c, { quest, completed = [], scale, top = 0, bottom = Infinity, time = 0 } = {}) {
  if (!Number.isFinite(scale) || scale <= 0 || !Number.isFinite(1 / scale) ||
      typeof top !== 'number' || typeof bottom !== 'number' ||
      Number.isNaN(top) || Number.isNaN(bottom) || bottom <= top) return;
  const sites = pendingSites(quest, completed);
  if (!sites.length) return;
  const next = sites[0], last = quest.encounters.at(-1);
  const theme = THEMES[quest.kind];
  const pulse = .5 + Math.sin(phase(time) * 2) * .5;
  c.save();
  try {
    c.lineCap = 'round'; c.lineJoin = 'round'; c.setLineDash([]);
    // Target overlays other quest dots, but never changes the caller's player order.
    for (const site of [...sites.slice(1), next]) {
      if (site.y < top || site.y >= bottom) continue;
      c.save();
      try {
        c.translate(site.x, site.y); c.scale(1 / scale, 1 / scale);
        if (site === next) {
          // A hollow, compact halo stays underneath the caller's later player art.
          const radius = 14.4 + pulse * .6;
          oval(c, 0, 0, radius, radius, 'transparent', INK, 3.2);
          oval(c, 0, 0, radius, radius, 'transparent', GOLD, 1.8);
          drawQuestBadge(c, 0, 0, quest.kind, 1.08, time);
          if (site === last) {
            c.translate(9, -9); c.scale(.65, .65); atlasFlag(c);
          }
        } else if (site === last) {
          oval(c, 0, 0, 8.5, 8.5, PAPER, INK, 1.5);
          oval(c, 0, 0, 6.6, 6.6, theme.cloth);
          line(c, -3, 4.6, -3, -4.8, PAPER, 1.5);
          poly(c, [[-2.5, -4.8], [4.8, -4.2], [3.1, -1.6], [4.8, .8], [-2.5, .2]], PAPER, INK, .65);
        } else {
          oval(c, 0, 0, 6.2, 6.2, PAPER, INK, 1.4);
          oval(c, 0, 0, 4.4, 4.4, theme.cloth);
        }
      } finally { c.restore(); }
    }
  } finally { c.restore(); }
}

function sword(c, angle) {
  c.save(); c.rotate(angle);
  poly(c, [[-2.8, 10], [-2.8, -21], [0, -27], [2.8, -21], [2.8, 10]], PAPER, INK, 1.7);
  line(c, .5, -20, .5, 7, '#adc5c0', 1.1);
  line(c, -6, 10, 6, 10, INK, 4.8);
  line(c, -5.6, 10, 5.6, 10, GOLD, 2.4);
  line(c, 0, 12, 0, 20, INK, 5);
  line(c, 0, 13, 0, 19, '#dc9666', 2.3);
  oval(c, 0, 21, 2.3, 2.3, GOLD, INK, 1.1);
  c.restore();
}

function helmet(c, x, y, scale) {
  c.save(); c.translate(x, y); c.scale(scale, scale);
  poly(c, [[-3, -4], [-3, -10], [2, -11], [5, -8], [3, -4]], '#ef7957', INK, 1.4);
  c.beginPath(); c.moveTo(-7, 0);
  c.bezierCurveTo(-7, -10, 7, -10, 7, 0);
  c.lineTo(8, 5); c.lineTo(3, 7); c.lineTo(2, 1);
  c.lineTo(-2, 1); c.lineTo(-3, 7); c.lineTo(-8, 5); c.closePath();
  c.fillStyle = '#ffd695'; c.fill(); c.strokeStyle = INK; c.lineWidth = 1.6; c.stroke();
  line(c, -4.5, -.5, 4.5, -.5, INK, 2.1);
  curve(c, [-4.6, -3, -3.8, -6, -.8, -6.3, .7, -5.5], PAPER, 1.4);
  c.restore();
}

/** Pixel-space warning centered at x,y; reserve 68 x 62 pixels. No text. */
export function drawQuestWarning(c, x, y, time = 0) {
  if (!point(x, y)) return;
  c.save();
  try {
    c.translate(x, y); c.lineCap = 'round'; c.lineJoin = 'round'; c.setLineDash([]);
    // Crossed blades behind a warm shield, three unmistakable enemy helmets above.
    c.save(); c.translate(0, 7); sword(c, -.77); sword(c, .77); c.restore();
    helmet(c, -19, -13, .78); helmet(c, 19, -13, .78);
    c.beginPath(); c.moveTo(-16, -1); c.lineTo(0, -7); c.lineTo(16, -1);
    c.lineTo(14, 13); c.bezierCurveTo(12, 21, 4, 25, 0, 28);
    c.bezierCurveTo(-4, 25, -12, 21, -14, 13); c.closePath();
    c.fillStyle = '#c85148'; c.fill(); c.strokeStyle = INK; c.lineWidth = 2.4; c.stroke();
    poly(c, [[0, -3], [12, 1], [10, 13], [6, 19], [0, 23]], '#ed8651', null);
    curve(c, [-12, 1, -13, 14, -7, 20, 0, 24], GOLD, 2);
    // Small inset chevron reads as heraldry, never punctuation.
    poly(c, [[-8, 8], [0, 2], [8, 8], [8, 12], [0, 6], [-8, 12]], PAPER, null);
    helmet(c, 0, -19, .97);
    const glow = .65 + Math.sin(phase(time) * 2) * .1;
    c.globalAlpha *= glow;
    for (const side of [-1, 1]) {
      line(c, side * 28, -3, side * 31, -5, '#ed8651', 2.5);
      line(c, side * 28, 5, side * 32, 6, GOLD, 2.1);
    }
  } finally { c.restore(); }
}
