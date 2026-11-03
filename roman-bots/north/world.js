// Independent, deterministic terrain. Seal progression belongs to the simulation:
// all three CAMPS must be activated before the last encounter can begin.
export const WIDTH = 52;
export const HEIGHT = 148;
export const HOME = Object.freeze({ id: 'home', x: 26, y: 138, name: 'Laurel Haven' });
export const CAMPS = Object.freeze([
  Object.freeze({ id: 'west-watch', x: 12, y: 112, name: 'Laurel Watch' }),
  Object.freeze({ id: 'lake-watch', x: 40, y: 78, name: 'Silverwater Watch' }),
  Object.freeze({ id: 'pine-watch', x: 14, y: 44, name: 'Pinecrest Watch' })
]);
export const KING = Object.freeze({ x: 26, y: 10 });
export const SIGNPOSTS=Object.freeze([[27,132],[24,98],[13,85],[26,66],[38,50],[26,30]].map(([x,y])=>({x,y})));
export const BRIDGES = Object.freeze([
  Object.freeze({ left: 1, top: 63, right: 13, bottom: 66 }),
  Object.freeze({ left: 38, top: 98, right: 50, bottom: 101 })
]);

const stages = [
  [[8,126],[18,125],[44,125],[8,102],[16,102],[34,103],[44,113],[34,117],[26,120],[44,103]],
  [[8,90],[24,92],[34,91],[8,80],[21,81],[30,82],[45,67],[34,69],[22,69],[16,73]],
  [[19,60],[29,60],[44,57],[7,45],[25,47],[44,46],[7,35],[17,34],[35,35],[44,35]],
  [[7,24],[26,27],[42,25],[7,14],[41,14],[14,8],[38,7],[23,19],[34,18]]
];
export const ENCOUNTERS = Object.freeze([
  ...stages.flatMap((points, stage) => points.map(([x,y], index) => Object.freeze({
    id: `north-${stage + 1}-${index + 1}`, x, y, stage,
    waves: index % 4 === 3 ? 3 : 2, count: index % 3 === 2 ? 6 : 5,
    kind: index % 5 === 4 ? 'elite' : index % 3 === 1 ? 'ambush' : 'patrol',
    reward: 24 + stage * 12 + (index % 5 === 4 ? 18 : 0)
  }))),
  Object.freeze({ id: 'north-king', ...KING, stage: 3, waves: 3, count: 6, kind: 'boss', reward: 180 })
]);

// The central road deliberately alternates sides. Side loops reconnect, so a
// following squad never has to negotiate a one-cell bridge or dead-end corridor.
const spine = [[26,138],[26,132],[37,124],[37,116],[24,108],[24,98],
  [13,92],[13,85],[26,74],[26,66],[38,58],[38,50],[26,38],
  [26,30],[15,23],[15,17],[26,10]];
const routes = [spine,
  [[26,132],[8,126],[8,112],[12,112],[8,102],[24,98]],
  [[37,124],[45,124],[45,108],[34,103],[24,98]],
  [[13,92],[7,83],[16,73],[26,66]],
  [[24,98],[34,88],[40,78],[45,67],[38,58]],
  [[26,66],[19,60],[18,50],[14,44],[7,35],[26,30]],
  [[38,58],[45,50],[45,35],[35,35],[26,30]],
  [[26,30],[7,24],[7,14],[14,8],[26,10]],
  [[26,30],[42,25],[42,14],[38,7],[26,10]],
  [[16,73],[2,67],[2,64],[12,64],[19,60]],
  [[34,103],[38,99],[49,99],[49,108],[45,108]]
];
const lakes = [{x:7,y:57,rx:4.8,ry:8.5},{x:44,y:93,rx:4.7,ry:7.4}];
const tiles = new Uint8Array(WIDTH * HEIGHT).fill(3);
const names = ['grass','path','water','forest','stone'];
const inside = (x,y) => x >= 1 && x < WIDTH - 1 && y >= 1 && y < HEIGHT - 1;
const disk = (x,y,cx,cy,r) => (x-cx)**2 + (y-cy)**2 <= r*r;
function distanceToSegment(x,y,a,b) {
  const dx=b[0]-a[0], dy=b[1]-a[1];
  const t=Math.max(0,Math.min(1,((x-a[0])*dx+(y-a[1])*dy)/(dx*dx+dy*dy || 1)));
  return Math.hypot(x-a[0]-dx*t,y-a[1]-dy*t);
}
// Attach outlying battle glades to the nearest road point, not to other battles.
for (const place of [...CAMPS,...ENCOUNTERS]) {
  let best, distance=Infinity;
  for (const [x,y] of routes.slice(0,9).flat()) {
    const d=Math.hypot(x-place.x,y-place.y);
    if(d<distance){distance=d;best=[x,y];}
  }
  routes.push([[place.x,place.y],best]);
}
for(let y=1;y<HEIGHT-1;y++) for(let x=1;x<WIDTH-1;x++) {
  const px=x+.5,py=y+.5;
  let terrain=3;
  if(py>130 || disk(px,py,KING.x,KING.y,6.5)) terrain=0;
  for(const place of [...CAMPS,...ENCOUNTERS]) {
    if(disk(px,py,place.x,place.y,place.kind==='boss'?6.5:5.1)) {terrain=0;break;}
  }
  let road=Infinity;
  for(const route of routes) for(let i=1;i<route.length;i++) {
    road=Math.min(road,distanceToSegment(px,py,route[i-1],route[i]));
  }
  if(road<3.1) terrain=0;
  if(road<1.55) terrain=1;
  if(py>134 && Math.abs(px-26)<7) terrain=4;
  if(disk(px,py,KING.x,KING.y,4.7)) terrain=4;
  for(const lake of lakes) if(((px-lake.x)/lake.rx)**2+((py-lake.y)/lake.ry)**2<1) terrain=2;
  // Broad decks cross the southern shallows; water never blocks their surface.
  if(BRIDGES.some(b=>px>=b.left&&px<b.right&&py>=b.top&&py<b.bottom)) terrain=1;
  if(py>=146||py>=130&&px>=48)terrain=2;
  tiles[y*WIDTH+x]=terrain;
}

// Positions are continuous world units; integer cells occupy [x,x+1), [y,y+1).
// Out-of-world queries are blocking forest, including non-finite coordinates.
export function tileAt(x,y) {
  if(!Number.isFinite(x)||!Number.isFinite(y)) return 'forest';
  x=Math.floor(x);y=Math.floor(y);
  return inside(x,y)?names[tiles[y*WIDTH+x]]:'forest';
}
export function passable(x,y) {
  if(y>=130&&y<132&&x>=3&&x<49&&(x<24||x>=32))return false;
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
    if(d<distance){distance=d;best={x:x+.5,y:y+.5};}
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
  queue[0]=source;previous[source]=source;
  while(head<tail&&previous[target]===-1){
    const cell=queue[head++],x=cell%WIDTH,y=Math.floor(cell/WIDTH);
    for(const [dx,dy] of [[0,-1],[-1,0],[1,0],[0,1]]) {
      const nx=x+dx,ny=y+dy,next=ny*WIDTH+nx;
      if(!inside(nx,ny)||previous[next]!==-1||!passable(nx,ny)) continue;
      previous[next]=cell;queue[tail++]=next;
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
  if(!point||!passable(point.x,point.y)) return false;
  return point.y>130||CAMPS.some(camp=>disk(point.x,point.y,camp.x,camp.y,3));
}
