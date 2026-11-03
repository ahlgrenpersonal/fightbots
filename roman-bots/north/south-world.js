// An invented Carthage-inspired region, reached by the caller's boat crossing.
// Coordinates, navigation and sanctuaries are independent of every other world.
// The caller owns seal/boss gates; visiting an unsealed camp is always safe.
export const WIDTH = 84;
export const HEIGHT = 190;
export const HOME = Object.freeze({ id: 'home', x: 42, y: 10, name: 'Carthage Harbor' });
export const KING = Object.freeze({ x: 42, y: 180 });
const freezeObjects = values => Object.freeze(values.map(value => Object.freeze(value)));
const freezeRoute = points => Object.freeze(points.map(point => Object.freeze(point)));

export const CAMPS = freezeObjects([
  { id: 'south-camp-1', x: 66, y: 34, name: 'Breakwater Refuge' },
  { id: 'south-camp-2', x: 16, y: 69, name: 'Reedbank Watch' },
  { id: 'south-camp-3', x: 66, y: 103, name: 'Olive Terrace Refuge' },
  { id: 'south-camp-4', x: 18, y: 139, name: 'Redrock Watch' },
  { id: 'south-camp-5', x: 66, y: 174, name: 'Citadel Refuge' }
].map((camp, stage) => ({ ...camp,
  required: Object.freeze(Array.from({ length: 14 }, (_, i) => `south-${stage + 1}-${i + 1}`))
})));

const stages = [
  [[31,10],[20,12],[12,20],[16,29],[26,33],[38,31],[47,23],
    [57,27],[53,10],[65,12],[72,21],[62,21],[31,21],[48,33]],
  [[66,48],[57,51],[48,58],[38,58],[29,53],[20,49],[12,54],
    [12,61],[72,55],[68,64],[59,68],[48,68],[38,68],[29,64]],
  [[16,82],[27,86],[39,84],[50,87],[61,83],[72,88],[72,96],
    [22,96],[32,102],[43,99],[50,94],[10,89],[12,100],[55,102]],
  [[66,116],[55,118],[44,124],[34,117],[23,119],[12,126],[10,136],
    [72,125],[65,134],[55,138],[44,135],[36,139],[28,130],[60,126]],
  [[18,153],[11,161],[20,170],[30,164],[31,154],[42,158],[53,153],
    [65,155],[73,164],[61,164],[52,169],[41,169],[30,178],[15,179]]
];

// Three longer battles per district: 70 ordinary fights / 155 waves, then the
// three-wave fortress. At the west's 135-wave / ~36-minute reference this is a
// ~42-minute combat baseline, with exploration aimed at a 42-50 minute journey.
export const ENCOUNTERS = freezeObjects([
  ...stages.flatMap((points, stage) => points.map(([x, y], index) => ({
    id: `south-${stage + 1}-${index + 1}`, x, y, stage, region: stage,
    waves: [3, 8, 12].includes(index) ? 3 : 2,
    count: index % 3 === 2 ? 6 : 5,
    kind: index === 8 || index === 12 || index === 13 && (stage === 2 || stage === 4)
      ? 'elite' : index % 3 === 1 ? 'ambush' : 'patrol',
    ...(index === 13 && (stage === 2 || stage === 4) ? { champions: 2 } : {}),
    reward: 24 + stage * 10 + (index === 8 || index === 12 ? 18 : 0)
  }))),
  { id: 'south-king', ...KING, stage: 4, region: 4, waves: 3, count: 6, kind: 'boss', reward: 240 }
]);

// Authored roads, not automatic objective-to-objective joins. Wide shoulders
// accompany the roads; branches have deliberately different district topology.
export const ROUTES = Object.freeze([
  // Harbor: two waterfront promenades, a cross-market lane and a basin circuit.
  freezeRoute([[42,10],[31,10],[20,12],[15,15],[12,20],[16,29],
    [26,33],[38,31],[48,33],[57,27],[66,34]]),
  freezeRoute([[42,10],[53,10],[65,12],[70,15],[72,21],[62,21],[57,27]]),
  freezeRoute([[31,10],[31,21],[38,31]]),
  freezeRoute([[31,21],[40,19],[47,23],[57,27]]),
  // An eastern tidal causeway is the only departure from the harbor.
  freezeRoute([[66,34],[67,39],[66,48]]),
  // Marsh: unequal distributary banks with one interior cross-causeway.
  freezeRoute([[66,48],[57,51],[48,58],[38,58],[29,53],
    [20,49],[12,54],[12,61],[16,69]]),
  freezeRoute([[66,48],[72,55],[68,64],[59,68],[48,68],[38,68],
    [29,64],[21,60],[12,61]]),
  freezeRoute([[48,58],[48,68]]),
  freezeRoute([[16,69],[15,75],[16,82]]),
  // Olive country: diagonal terrace lanes, a western blind orchard, and a
  // triangular southern connection instead of matching upper/lower rails.
  freezeRoute([[16,82],[27,86],[39,84],[50,87],[61,83],
    [72,88],[72,96],[66,103]]),
  freezeRoute([[27,86],[22,96],[32,102],[43,99],[50,94],[50,87]]),
  freezeRoute([[16,82],[10,89],[12,100]]),
  freezeRoute([[43,99],[55,102],[66,103]]),
  freezeRoute([[66,103],[67,108],[66,116]]),
  // Redrock: a folded canyon road, a western fork and an eastern dead end.
  // Rock faces are blocking 'forest' cells; LANDSCAPES supplies their art motif.
  freezeRoute([[66,116],[60,126],[65,134],[55,138],[44,135],
    [44,124],[34,117],[23,119],[28,130],[36,139],[18,139]]),
  freezeRoute([[23,119],[12,126],[10,136],[18,139]]),
  freezeRoute([[66,116],[72,125]]),
  freezeRoute([[66,116],[55,118],[44,124]]),
  freezeRoute([[18,139],[17,145],[18,153]]),
  // Walled city: staggered streets, two market circuits and an eastern
  // fortress approach. The garden enclosure north of the boss stays solid.
  freezeRoute([[18,153],[31,154],[42,158],[53,153],[65,155],
    [73,164],[66,174]]),
  freezeRoute([[18,153],[11,161],[20,170],[15,179],[30,178],[41,169],[42,158]]),
  freezeRoute([[20,170],[30,164],[31,154]]),
  freezeRoute([[41,169],[52,169],[61,164],[65,155]]),
  freezeRoute([[52,169],[57,179],[66,174]]),
  freezeRoute([[57,179],[49,182],[42,180]])
]);

export const BRIDGES = freezeObjects([
  { left: 62, top: 39, right: 72, bottom: 46 },
  { left: 62, top: 107, right: 72, bottom: 114 }
]);

// Half-open y bands and world-unit anchors are renderer hints, not obstacles.
// In particular a landmark must not add collision inside the reserved clearings.
export const LANDSCAPES = freezeObjects([
  { id: 'harbor', name: 'Carthage Harbor', top: 0, bottom: 42,
    ground: '#9caf88', accent: '#ead6a3', motif: 'harbor', obstacle: 'coastal-pines' },
  { id: 'saltmarsh', name: 'The Salt Marshes', top: 42, bottom: 76,
    ground: '#8ab8a4', accent: '#dce6d6', motif: 'saltmarsh', obstacle: 'reeds' },
  { id: 'olive-gardens', name: 'The Olive Gardens', top: 76, bottom: 110,
    ground: '#a5b66b', accent: '#e6d890', motif: 'olive-terraces', obstacle: 'olive-groves' },
  { id: 'redrock-passes', name: 'The Redrock Passes', top: 110, bottom: 146,
    ground: '#b89989', accent: '#d45e52', motif: 'redrock-canyons', obstacle: 'cliffs' },
  { id: 'walled-city', name: 'The Walled City', top: 146, bottom: 190,
    ground: '#c0b8a1', accent: '#548c9c', motif: 'walled-city', obstacle: 'city-walls' }
]);
export const LANDMARKS = freezeObjects([
  { id: 'south-entry', kind: 'harbor', name: 'Carthage Harbor', x: 42, y: 10 },
  { id: 'south-basin', kind: 'harbor-basin', name: 'Round Harbor Basin', x: 43, y: 26, visualOnly: true, rx: 7, ry: 5 },
  { id: 'south-tidal-crossing', kind: 'causeway', name: 'Tidal Causeway', x: 67, y: 42 },
  { id: 'south-salt-pans', kind: 'salt-pans', name: 'White Salt Pans', x: 38, y: 58 },
  { id: 'south-reed-fork', kind: 'reedbeds', name: 'Reedbank Fork', x: 21, y: 60 },
  { id: 'south-olive-steps', kind: 'olive-terraces', name: 'Olive Steps', x: 27, y: 86 },
  { id: 'south-cistern', kind: 'oasis', name: 'Cistern Oasis', x: 55, y: 102 },
  { id: 'south-redrock', kind: 'canyon', name: 'Redrock Overlook', x: 60, y: 126 },
  { id: 'south-canyon-fork', kind: 'rock-arch', name: 'Split Arch Pass', x: 23, y: 119 },
  { id: 'south-city-gate', kind: 'city-gate', name: 'Outer City Gate', x: 18, y: 153 },
  { id: 'south-market', kind: 'market', name: 'Mosaic Market', x: 41, y: 169 },
  { id: 'south-harbor-gate', kind: 'harbor-gate', name: 'Walled Harbor Gate', x: 15, y: 179 },
  { id: 'south-citadel', kind: 'fortress', name: 'Carthage Citadel', ...KING },
  { id: 'south-palace', kind: 'palace', name: 'Citadel Palace', x: 42, y: 190, visualOnly: true,
    footprint: Object.freeze({ left: 34, top: 185, right: 50, bottom: 190 }) }
]);
export const SIGNPOSTS = freezeObjects([
  { x: 42, y: 10 }, { x: 66, y: 34 }, { x: 48, y: 58 }, { x: 16, y: 69 },
  { x: 27, y: 86 }, { x: 66, y: 103 }, { x: 44, y: 124 }, { x: 18, y: 139 },
  { x: 31, y: 154 }, { x: 52, y: 169 }, { x: 66, y: 174 }
]);

const names = ['grass', 'path', 'water', 'forest', 'stone'];
const tiles = new Uint8Array(WIDTH * HEIGHT).fill(3);
const inside = (x, y) => x >= 1 && x < WIDTH - 1 && y >= 1 && y < HEIGHT - 1;
const disk = (x, y, cx, cy, r) => (x - cx) ** 2 + (y - cy) ** 2 <= r * r;
function distanceToSegment(x, y, a, b) {
  const dx = b[0] - a[0], dy = b[1] - a[1];
  const t = Math.max(0, Math.min(1, ((x - a[0]) * dx + (y - a[1]) * dy) / (dx * dx + dy * dy || 1)));
  return Math.hypot(x - a[0] - dx * t, y - a[1] - dy * t);
}
function irregularOval(x, y, cx, cy, rx, ry) {
  const u = (x - cx) / rx, v = (y - cy) / ry;
  return u * u + v * v < 1 + .14 * Math.sin(x * .71 + y * .29) + .09 * Math.cos(y * .63 - x * .37);
}
const wetAreas = [
  [43,26,7,5], [56,17,4,3], [5,24,6,13],
  [32,46,13,5], [38,50,7,4], [57,59,6,5], [24,70,5,3], [74,69,5,6],
  [39,91,5,4], [60,94,4,5], [6,115,5,11], [77,142,5,8],
  [37,180,3,3]
];
// Small irregular meadows/plazas widen selected junctions, not every road.
const openAreas = [
  [24,19,7,6], [63,27,6,5], [18,56,5,5], [64,63,6,4],
  [34,87,8,5], [18,96,6,6], [54,136,6,4], [17,130,5,6],
  [25,162,7,6], [57,159,7,6], [49,181,7,5]
];
const sanctuaries = [HOME, ...CAMPS];
const objectives = [...sanctuaries, ...ENCOUNTERS];
const palace = LANDMARKS.find(landmark => landmark.kind === 'palace').footprint;
const segments = ROUTES.flatMap(route => route.slice(1).map((point, i) => [route[i], point]));
for (let y = 1; y < HEIGHT - 1; y++) for (let x = 1; x < WIDTH - 1; x++) {
  const px = x + .5, py = y + .5;
  const westShore = 2.8 + Math.sin(py * .18) + .6 * Math.cos(py * .43);
  const eastShore = 80 - Math.sin(py * .13) - .6 * Math.cos(py * .37);
  const sea = px < westShore || px > eastShore || py < 3.5 + .8 * Math.cos(px * .19);
  let terrain = sea || wetAreas.some(area => irregularOval(px, py, ...area)) ? 2 : 3;
  const road = Math.min(...segments.map(([a, b]) => distanceToSegment(px, py, a, b)));
  if (!sea && openAreas.some(area => irregularOval(px, py, ...area))) terrain = 0;
  if (!sea && road < 3.4) terrain = road < 1.7 ? 1 : 0;
  // A 4.6-unit center-sampled reservation covers the complete continuous 3.6
  // radius plus cell corners, avoiding blocked diagonal spawn/formation points.
  if (objectives.some(site => disk(px, py, site.x, site.y, 4.6))) terrain = 0;
  if (!sea && road < 1.7) terrain = 1;
  if (sanctuaries.some(site => disk(px, py, site.x, site.y, 4.6)) || disk(px, py, KING.x, KING.y, 4.6)) terrain = 4;
  // Full-width geological belts have only one broad crossing each. Undulating
  // banks/faces remain clear of objective rings; decks extend over both banks.
  const tide = .8 * Math.sin(px * .17) + .15 * Math.cos(px * .43);
  const irrigation = .75 * Math.sin(px * .21) + .2 * Math.cos(px * .37);
  const grove = .8 * Math.sin(px * .19);
  const canyon = .8 * Math.sin(px * .15 + 1);
  if (py >= 40 + tide && py < 44 + tide || py >= 108 + irrigation && py < 112 + irrigation) terrain = 2;
  if (py >= 74 + grove && py < 78 + grove) terrain = px >= 11 && px < 21 ? 1 : 3;
  if (py >= 144 + canyon && py < 148 + canyon) terrain = px >= 13 && px < 23 ? 1 : 3;
  if (BRIDGES.some(b => px >= b.left && px < b.right && py >= b.top && py < b.bottom)) terrain = 1;
  // The southern facade is a real blocker; the throne and northern approach
  // retain their reserved clearances. Its renderer anchor lies at the map edge.
  if (px >= palace.left && px < palace.right && py >= palace.top && py < palace.bottom) terrain = 3;
  tiles[y * WIDTH + x] = terrain;
}

// Continuous coordinates and four-neighbor navigation match west-world.js.
export function tileAt(x, y) {
  if (!Number.isFinite(x) || !Number.isFinite(y)) return 'forest';
  x = Math.floor(x); y = Math.floor(y);
  return inside(x, y) ? names[tiles[y * WIDTH + x]] : 'forest';
}
export function passable(x, y) {
  const tile = tileAt(x, y);
  return tile === 'grass' || tile === 'path' || tile === 'stone';
}
export function nearestWalkable(point) {
  const px = Number.isFinite(point?.x) ? point.x : HOME.x;
  const py = Number.isFinite(point?.y) ? point.y : HOME.y;
  let best = null, distance = Infinity;
  for (let y = 1; y < HEIGHT - 1; y++) for (let x = 1; x < WIDTH - 1; x++) {
    if (!passable(x, y)) continue;
    const d = (x + .5 - px) ** 2 + (y + .5 - py) ** 2;
    if (d < distance) { distance = d; best = { x: x + .5, y: y + .5 }; }
  }
  return best;
}
export function findPath(from, to) {
  if (!from || !to || ![from.x, from.y, to.x, to.y].every(Number.isFinite)) return [];
  const start = passable(from.x, from.y) ? { x: Math.floor(from.x) + .5, y: Math.floor(from.y) + .5 } : nearestWalkable(from);
  const end = passable(to.x, to.y) ? { x: Math.floor(to.x) + .5, y: Math.floor(to.y) + .5 } : nearestWalkable(to);
  const source = Math.floor(start.y) * WIDTH + Math.floor(start.x);
  const target = Math.floor(end.y) * WIDTH + Math.floor(end.x);
  const previous = new Int32Array(WIDTH * HEIGHT).fill(-1);
  const queue = new Int32Array(WIDTH * HEIGHT); let head = 0, tail = 1;
  queue[0] = source; previous[source] = source;
  while (head < tail && previous[target] === -1) {
    const cell = queue[head++], x = cell % WIDTH, y = Math.floor(cell / WIDTH);
    for (const [dx, dy] of [[0, -1], [-1, 0], [1, 0], [0, 1]]) {
      const nx = x + dx, ny = y + dy, next = ny * WIDTH + nx;
      if (!inside(nx, ny) || previous[next] !== -1 || !passable(nx, ny)) continue;
      previous[next] = cell; queue[tail++] = next;
    }
  }
  if (previous[target] === -1) return [];
  const result = [];
  for (let cell = target;; cell = previous[cell]) {
    result.push({ x: cell % WIDTH + .5, y: Math.floor(cell / WIDTH) + .5 });
    if (cell === source) break;
  }
  return result.reverse();
}
export function isSafe(point) {
  return !!point && passable(point.x, point.y) && sanctuaries.some(site => disk(point.x, point.y, site.x, site.y, 3));
}
