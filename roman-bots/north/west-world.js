// Amber Highlands is an invented Iberian-inspired landscape, not a historical map.
// Terrain has no progression state: the caller enforces camp.required and boss gates.
export const WIDTH = 90;
export const HEIGHT = 160;
export const HOME = Object.freeze({ id: 'home', x: 81, y: 150, name: 'Eastgate Workshop' });
export const KING = Object.freeze({ x: 68, y: 10 });
const freezePoints = points => Object.freeze(points.map(point => Object.freeze(point)));
const rows = [146, 119, 90, 61, 32];
const campNames = ['Saffron Foothold', 'Olive Terrace Watch', 'Copperwater Refuge', 'Broken Arch Watch', 'Suncrag Refuge'];
export const CAMPS = Object.freeze(rows.map((y, region) => Object.freeze({
  id: `west-camp-${region + 1}`, x: region % 2 === 0 ? 12 : 68, y: y + 2, name: campNames[region],
  required: Object.freeze(Array.from({ length: 11 }, (_, i) => `west-${region + 1}-${i + 1}`))
})));

// Twelve sites per district: eleven assigned battles and one optional patrol.
// Centers sit on deliberately authored roads, never on automatically joined discs.
export const ENCOUNTERS = Object.freeze([
  ...rows.flatMap((y, region) => [
    [20,y], [30,y], [40,y], [50,y], [60,y],
    [20,y-11], [30,y-11], [40,y-11], [50,y-11], [60,y-11],
    [region % 2 === 0 ? 12 : 68,y-6], [region % 2 === 0 ? 68 : 12,y-6]
  ].map(([x, cy], index) => Object.freeze({
    id: `west-${region + 1}-${index + 1}`, x, y: cy,
    stage: region, region, waves: (region * 12 + index) % 5 === 3 ? 3 : 2,
    count: index % 3 === 2 ? 6 : 5,
    kind: index === 7 ? 'elite' : index % 3 === 1 ? 'ambush' : 'patrol',
    reward: 24 + region * 10 + (index === 7 ? 18 : 0)
  }))),
  Object.freeze({ id: 'west-king', ...KING, stage: 4, region: 4,
    waves: 3, count: 6, kind: 'boss', reward: 240 })
]);

const spine = [[HOME.x,HOME.y],[81,146],
  [60,146],[55,149],[50,146],[40,146],[35,147.5],[30,146],[20,146],[12,146],
  [12,119],[20,119],[25,121],[30,119],[40,119],[45,117],[50,119],[62,119],
  [62,90],[50,90],[45,92],[40,90],[30,90],[25,88],[20,90],[12,90],
  [12,61],[20,61],[25,63],[30,61],[40,61],[45,59],[50,61],[60,61],[68,61],
  [68,32],[60,32],[55,34],[50,32],[40,32],[35,34],[30,32],[20,32],[12,32],
  [12,10],[68,10]];
// Side loops are local to one terrace. Uncut ridge belts separate the terraces;
// alternate east/west passes are the only connections between them.
export const ROUTES = Object.freeze([
  freezePoints(spine),
  // Rounded saffron knolls, shallow olive chevrons, a gorge balcony, broken
  // aqueduct approaches, and inward-folding summit switchbacks. Site coordinates
  // stay fixed for the renderer; only the roads and their shoulders bend.
  freezePoints([[12,146],[12,140],[15,137],[20,135],[30,135],[35,133.5],
    [40,135],[50,135],[55,137],[60,135],[65,136],[68,140],[68,146]]),
  // The olive road is inset: two vineyard bays project beyond its narrower
  // circuit instead of duplicating the foothill loop's full-width end walls.
  freezePoints([[20,119],[18,114],[20,108],[25,105],[30,108],
    [40,108],[45,110],[50,108],[60,108],[58,114],[60,119]]),
  freezePoints([[20,108],[16,109],[12,113]]),
  freezePoints([[60,108],[65,109],[68,113]]),
  freezePoints([[12,90],[12,84],[16,80],[20,79],[25,77],[30,79],
    [40,79],[45,81],[50,79],[60,79],[65,81],[68,84],[62,90]]),
  freezePoints([[40,79],[37,84],[40,90]]),
  // The ruined approach is deliberately broken into a western dead-end fork
  // and an eastern circuit, rather than one continuous upper rail.
  freezePoints([[20,61],[18,56],[20,50],[25,48],[30,50]]),
  freezePoints([[20,50],[16,51],[12,55]]),
  freezePoints([[40,61],[38,56],[40,50],[50,50],[55,48],
    [60,50],[65,52],[68,55],[68,61]]),
  // Summit access folds diagonally into the upper shelf; its western lookout
  // is a spur, not another matching vertical wall.
  freezePoints([[12,32],[12,26]]),
  freezePoints([[30,32],[25,27],[20,21],[25,23],[30,21],
    [40,21],[45,23],[50,21],[60,21],[65,23],[68,26],[68,32]]),
  freezePoints([[40,32],[45,27],[50,21]]),
  // Short outcropping bays face away from each loop's inner ridge. None reaches
  // the next terrace or bypass the alternating mountain passes.
  freezePoints([[40,146],[42,151],[47,153]]),
  freezePoints([[30,119],[26,122],[22,122]]),
  freezePoints([[40,90],[44,94],[49,95]]),
  freezePoints([[40,61],[44,65],[49,65]]),
  freezePoints([[30,32],[34,37],[40,38]])
]);
export const BRIDGES = Object.freeze([
  Object.freeze({ left: 8, top: 126, right: 16, bottom: 131 }),
  Object.freeze({ left: 8, top: 68, right: 16, bottom: 73 })
]);

// Optional renderer hints. All art can be drawn with canvas primitives; no assets
// or renderer imports are needed to load or navigate this module.
export const LANDSCAPES = Object.freeze([
  Object.freeze({ id: 'saffron-hills', name: 'Saffron Hills', top: 132, bottom: 160, ground: '#a99a51', accent: '#d8b963', motif: 'rounded-hills' }),
  Object.freeze({ id: 'olive-terraces', name: 'Terraces of Gold', top: 103, bottom: 132, ground: '#96a26b', accent: '#e0cc8c', motif: 'olive-terraces' }),
  Object.freeze({ id: 'copperwater', name: 'Copperwater Gorge', top: 74, bottom: 103, ground: '#79a190', accent: '#ba785d', motif: 'river-cliffs' }),
  Object.freeze({ id: 'broken-arches', name: 'The Broken Arches', top: 45, bottom: 74, ground: '#a9aaa0', accent: '#e6d8bb', motif: 'ruined-aqueduct' }),
  Object.freeze({ id: 'suncrag', name: 'Suncrag Passes', top: 0, bottom: 45, ground: '#929bab', accent: '#d8ae67', motif: 'mountain-switchbacks' })
]);
export const LANDMARKS = Object.freeze([
  Object.freeze({ id: 'amber-entry', kind: 'workshop', name: 'Eastgate Workshop', x: HOME.x, y: HOME.y }),
  Object.freeze({ id: 'saffron-rise', kind: 'hills', name: 'Saffron Rise', x: 40, y: 154 }),
  Object.freeze({ id: 'olive-steps', kind: 'olive-terraces', name: 'Olive Steps', x: 40, y: 113 }),
  Object.freeze({ id: 'gorge-overlook', kind: 'river-cliffs', name: 'Copperwater Overlook', x: 40, y: 96 }),
  Object.freeze({ id: 'old-aqueduct', kind: 'ruined-aqueduct', name: 'The Broken Aqueduct', x: 40, y: 55, from: Object.freeze([22,55]), to: Object.freeze([58,55]) }),
  Object.freeze({ id: 'suncrag-crown', kind: 'mountain', name: 'Suncrag Crown', x: 68, y: 10 })
]);

const names = ['grass', 'path', 'water', 'forest', 'stone'];
const tiles = new Uint8Array(WIDTH * HEIGHT).fill(3);
// Lakes only replace already-blocked terrain: their irregular shores cannot
// erase a spawn ring, narrow a road, or introduce another walkable connection.
const lakes = [
  { x: 77, y: 48, rx: 7, ry: 15 },
  { x: 4, y: 94, rx: 5.5, ry: 12 },
  { x: 43, y: 140, rx: 10, ry: 2.2 },
  { x: 26, y: 84.5, rx: 8, ry: 2.1 }
];
const inside = (x,y) => x >= 1 && x < WIDTH - 1 && y >= 1 && y < HEIGHT - 1;
const disk = (x,y,cx,cy,r) => (x-cx)**2 + (y-cy)**2 <= r*r;
function distanceToSegment(x,y,a,b) {
  const dx=b[0]-a[0], dy=b[1]-a[1];
  const t=Math.max(0,Math.min(1,((x-a[0])*dx+(y-a[1])*dy)/(dx*dx+dy*dy || 1)));
  return Math.hypot(x-a[0]-dx*t,y-a[1]-dy*t);
}
for(let y=1;y<HEIGHT-1;y++) for(let x=1;x<WIDTH-1;x++) {
  const px=x+.5, py=y+.5;
  let road=Infinity;
  for(const route of ROUTES) for(let i=1;i<route.length;i++) {
    road=Math.min(road,distanceToSegment(px,py,route[i-1],route[i]));
  }
  let terrain=road<3.25?0:3;
  // Small battle clearings retain a full spawn ring without eating ridge belts.
  for(const site of ENCOUNTERS) if(disk(px,py,site.x,site.y,3.6)) { terrain=0; break; }
  if(road<1.45) terrain=1;
  for(const site of [HOME,...CAMPS,KING]) if(disk(px,py,site.x,site.y,4.1)) terrain=4;
  if(terrain===3&&lakes.some(lake=>{
    const dx=(px-lake.x)/lake.rx, dy=(py-lake.y)/lake.ry;
    return dx*dx+dy*dy < 1 + .13*Math.sin(px*.83+py*.31) + .08*Math.cos(py*.69-px*.27);
  })) terrain=2;
  if(py>=126&&py<131 || py>=68&&py<73) terrain=2;
  if(BRIDGES.some(b=>px>=b.left&&px<b.right&&py>=b.top&&py<b.bottom)) terrain=1;
  tiles[y*WIDTH+x]=terrain;
}

// Continuous coordinates, with cells [x,x+1) / [y,y+1), as in north/world.js.
export function tileAt(x,y) {
  if(!Number.isFinite(x)||!Number.isFinite(y)) return 'forest';
  x=Math.floor(x); y=Math.floor(y);
  return inside(x,y)?names[tiles[y*WIDTH+x]]:'forest';
}
export function passable(x,y) {
  const tile=tileAt(x,y);
  return tile==='grass'||tile==='path'||tile==='stone';
}
export function nearestWalkable(point) {
  const px=Number.isFinite(point?.x)?point.x:HOME.x;
  const py=Number.isFinite(point?.y)?point.y:HOME.y;
  let best=null,distance=Infinity;
  for(let y=1;y<HEIGHT-1;y++) for(let x=1;x<WIDTH-1;x++) {
    if(!passable(x,y)) continue;
    const d=(x+.5-px)**2+(y+.5-py)**2;
    if(d<distance){ distance=d; best={x:x+.5,y:y+.5}; }
  }
  return best;
}
export function findPath(from,to) {
  if(!from||!to||![from.x,from.y,to.x,to.y].every(Number.isFinite)) return [];
  const start=passable(from.x,from.y)?{x:Math.floor(from.x)+.5,y:Math.floor(from.y)+.5}:nearestWalkable(from);
  const end=passable(to.x,to.y)?{x:Math.floor(to.x)+.5,y:Math.floor(to.y)+.5}:nearestWalkable(to);
  const source=Math.floor(start.y)*WIDTH+Math.floor(start.x);
  const target=Math.floor(end.y)*WIDTH+Math.floor(end.x);
  const previous=new Int32Array(WIDTH*HEIGHT).fill(-1);
  const queue=new Int32Array(WIDTH*HEIGHT); let head=0,tail=1;
  queue[0]=source; previous[source]=source;
  while(head<tail&&previous[target]===-1) {
    const cell=queue[head++],x=cell%WIDTH,y=Math.floor(cell/WIDTH);
    for(const [dx,dy] of [[0,-1],[-1,0],[1,0],[0,1]]) {
      const nx=x+dx,ny=y+dy,next=ny*WIDTH+nx;
      if(!inside(nx,ny)||previous[next]!==-1||!passable(nx,ny)) continue;
      previous[next]=cell; queue[tail++]=next;
    }
  }
  if(previous[target]===-1) return [];
  const result=[];
  for(let cell=target;;cell=previous[cell]) {
    result.push({x:cell%WIDTH+.5,y:Math.floor(cell/WIDTH)+.5});
    if(cell===source) break;
  }
  return result.reverse();
}
export function isSafe(point) {
  return !!point&&passable(point.x,point.y)&&[HOME,...CAMPS].some(site=>disk(point.x,point.y,site.x,site.y,3));
}
