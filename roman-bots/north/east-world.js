// A fictional Greek coastal campaign. Roads and objective clearings are shared
// by collision, pathfinding and art; decorative buildings never create roads.
export const WIDTH=82,HEIGHT=184;
export const HOME=Object.freeze({id:'home',x:41,y:174,name:'Aegean Landing'});
export const KING=Object.freeze({x:42,y:11});
const freeze=items=>Object.freeze(items.map(p=>Object.freeze(p)));
export const CAMPS=freeze([
  {id:'east-camp-1',x:65,y:151,name:'Harbor Refuge'},
  {id:'east-camp-2',x:17,y:117,name:'Olive Spring'},
  {id:'east-camp-3',x:65,y:83,name:'Eagle Pass Refuge'},
  {id:'east-camp-4',x:18,y:49,name:'Marble Forum'},
  {id:'east-camp-5',x:65,y:16,name:'Acropolis Watch'}
].map((p,stage)=>({...p,required:Object.freeze(Array.from({length:12},(_,i)=>`east-${stage+1}-${i+1}`))})));
const stages=[
  [[29,173],[18,171],[11,161],[20,153],[32,157],[43,152],[53,159],[69,168],[59,174],[69,158],[40,165],[27,165]],
  [[65,138],[54,137],[44,129],[33,135],[22,137],[11,132],[12,126],[28,120],[40,119],[53,120],[68,123],[71,132]],
  [[17,104],[28,99],[40,103],[53,101],[66,103],[72,95],[58,91],[50,89],[39,86],[28,89],[13,86],[11,96]],
  [[65,70],[54,67],[44,69],[34,64],[22,70],[11,64],[11,57],[28,51],[40,54],[51,50],[68,54],[71,62]],
  [[18,36],[11,27],[20,18],[31,24],[32,36],[43,30],[54,36],[67,35],[72,26],[59,24],[31,11],[15,12]]
];
export const ENCOUNTERS=freeze([
  ...stages.flatMap((points,stage)=>points.map(([x,y],i)=>({
    id:`east-${stage+1}-${i+1}`,x,y,stage,region:stage,waves:[2,7,11].includes(i)?3:2,
    count:i%3===2?6:5,kind:i===7||i===11?'elite':i%3===1?'ambush':'patrol',
    ...(i===11&&(stage===1||stage===3)?{champions:2}:{}),reward:30+stage*10+(i===11?25:0)
  }))),
  {id:'east-king',...KING,stage:4,region:4,waves:3,count:6,kind:'boss',reward:300}
]);
export const ROUTES=Object.freeze([
  [[41,174],[29,173],[18,171],[11,161],[20,153],[32,157],[43,152],[53,159],[65,151]],
  [[41,174],[59,174],[69,168],[69,158],[65,151]],
  [[18,171],[27,165],[40,165],[53,159]],
  [[65,151],[66,145],[65,138]],
  [[65,138],[54,137],[44,129],[33,135],[22,137],[11,132],[12,126],[17,117]],
  [[65,138],[71,132],[68,123],[53,120],[40,119],[28,120],[17,117]],
  [[44,129],[40,119]],
  [[17,117],[16,111],[17,104]],
  [[17,104],[28,99],[40,103],[53,101],[66,103],[72,95],[58,91],[65,83]],
  [[28,99],[28,89],[39,86],[50,89],[53,101]],
  [[17,104],[11,96],[13,86],[28,89]],
  [[50,89],[58,91]],
  [[65,83],[66,77],[65,70]],
  [[65,70],[54,67],[44,69],[34,64],[22,70],[11,64],[11,57],[18,49]],
  [[65,70],[71,62],[68,54],[51,50],[40,54],[28,51],[18,49]],
  [[34,64],[40,54]],
  [[18,49],[17,43],[18,36]],
  [[18,36],[32,36],[43,30],[54,36],[67,35],[72,26],[65,16]],
  [[18,36],[11,27],[20,18],[15,12],[31,11],[31,24],[32,36]],
  [[31,24],[43,30],[59,24],[65,16]],
  [[59,24],[53,16],[42,11]]
].map(route=>Object.freeze(route.map(p=>Object.freeze(p)))));
export const BRIDGES=freeze([{left:61,top:142,right:71,bottom:148},{left:61,top:74,right:71,bottom:80}]);
export const LANDSCAPES=freeze([
  {id:'aegean',name:'Aegean Harbor',top:148,bottom:184,ground:'#8cbcb6',accent:'#f7f2dc',motif:'harbor'},
  {id:'olives',name:'The Olive Valleys',top:114,bottom:148,ground:'#94b477',accent:'#b7a5c9',motif:'olive'},
  {id:'eagle',name:'The Eagle Passes',top:80,bottom:114,ground:'#a6b8c5',accent:'#eff1e8',motif:'mountain'},
  {id:'marble',name:'The Marble City',top:46,bottom:80,ground:'#d8dfd7',accent:'#418bad',motif:'city'},
  {id:'acropolis',name:'The Golden Acropolis',top:0,bottom:46,ground:'#adb9c4',accent:'#c59c55',motif:'acropolis'}
]);
export const LANDMARKS=freeze([
  {id:'east-temple',kind:'temple',x:42,y:6,footprint:Object.freeze({left:33,top:1,right:51,bottom:6})},
  {id:'east-harbor-temple',kind:'portico',x:41,y:181,footprint:Object.freeze({left:34,top:178,right:48,bottom:183})},
  {id:'east-forum-temple',kind:'portico',x:32,y:59,footprint:Object.freeze({left:28,top:55,right:36,bottom:59})}
]);
export const SIGNPOSTS=freeze([HOME,...CAMPS,{x:40,y:165},{x:44,y:129},{x:28,y:99},{x:34,y:64},{x:43,y:30}]);
const names=['grass','path','water','forest','stone'],tiles=new Uint8Array(WIDTH*HEIGHT).fill(3);
const inside=(x,y)=>x>=1&&x<WIDTH-1&&y>=1&&y<HEIGHT-1;
const disk=(x,y,p,r)=>(x-p.x)**2+(y-p.y)**2<=r*r;
const segments=ROUTES.flatMap(r=>r.slice(1).map((p,i)=>[r[i],p]));
function segment(x,y,a,b){const dx=b[0]-a[0],dy=b[1]-a[1],t=Math.max(0,Math.min(1,((x-a[0])*dx+(y-a[1])*dy)/(dx*dx+dy*dy||1)));return Math.hypot(x-a[0]-dx*t,y-a[1]-dy*t);}
const sites=[HOME,...CAMPS,...ENCOUNTERS],safeSites=[HOME,...CAMPS];
const pools=[[7,175,5,10],[30,180,5,3],[75,162,5,9],[33,145,11,4],[57,128,5,4],[30,126,4,3],[46,97,4,4],[8,109,5,5],[58,59,4,4],[38,19,4,3]];
for(let y=1;y<HEIGHT-1;y++)for(let x=1;x<WIDTH-1;x++){
  const px=x+.5,py=y+.5,shore=3.2+Math.sin(py*.19)*.8,sea=px<shore||px>WIDTH-shore||py>181.5;
  let terrain=sea||pools.some(([cx,cy,rx,ry])=>((px-cx)/rx)**2+((py-cy)/ry)**2<1+.12*Math.sin(px+py*.4))?2:3;
  const road=Math.min(...segments.map(([a,b])=>segment(px,py,a,b)));
  if(!sea&&road<3.5)terrain=road<1.7?1:0;
  if(sites.some(p=>disk(px,py,p,4.6)))terrain=0;
  if(!sea&&road<1.7)terrain=1;
  if(safeSites.some(p=>disk(px,py,p,4.6))||disk(px,py,KING,4.6))terrain=4;
  // Alternating mountain walls and tidal channels prevent a straight shortcut.
  for(const [cy,cx,water]of [[145,66,true],[111,16,false],[77,66,true],[43,17,false]]){
    const bend=.7*Math.sin(px*.19+cy);
    if(py>=cy-2+bend&&py<cy+2+bend)terrain=water?2:px>=cx-5&&px<cx+5?1:3;
  }
  if(BRIDGES.some(b=>px>=b.left&&px<b.right&&py>=b.top&&py<b.bottom))terrain=1;
  if(LANDMARKS.some(p=>{const b=p.footprint;return px>=b.left&&px<b.right&&py>=b.top&&py<b.bottom;}))terrain=3;
  tiles[y*WIDTH+x]=terrain;
}
export function tileAt(x,y){if(!Number.isFinite(x)||!Number.isFinite(y))return'forest';x=Math.floor(x);y=Math.floor(y);return inside(x,y)?names[tiles[y*WIDTH+x]]:'forest';}
export function passable(x,y){return ['grass','path','stone'].includes(tileAt(x,y));}
export function nearestWalkable(p){
  const px=Number.isFinite(p?.x)?p.x:HOME.x,py=Number.isFinite(p?.y)?p.y:HOME.y;
  let best=null,d=Infinity;
  for(let y=1;y<HEIGHT-1;y++)for(let x=1;x<WIDTH-1;x++){if(!passable(x,y))continue;const n=(x+.5-px)**2+(y+.5-py)**2;if(n<d){d=n;best={x:x+.5,y:y+.5};}}
  return best;
}
export function findPath(from,to){
  if(!from||!to||![from.x,from.y,to.x,to.y].every(Number.isFinite))return[];
  const a=passable(from.x,from.y)?from:nearestWalkable(from),b=passable(to.x,to.y)?to:nearestWalkable(to);
  const source=Math.floor(a.y)*WIDTH+Math.floor(a.x),target=Math.floor(b.y)*WIDTH+Math.floor(b.x);
  const previous=new Int32Array(WIDTH*HEIGHT).fill(-1),queue=new Int32Array(WIDTH*HEIGHT);let head=0,tail=1;
  queue[0]=source;previous[source]=source;
  while(head<tail&&previous[target]===-1){const cell=queue[head++],x=cell%WIDTH,y=Math.floor(cell/WIDTH);
    for(const [dx,dy]of [[0,-1],[-1,0],[1,0],[0,1]]){const nx=x+dx,ny=y+dy,next=ny*WIDTH+nx;if(!inside(nx,ny)||previous[next]!==-1||!passable(nx,ny))continue;previous[next]=cell;queue[tail++]=next;}}
  if(previous[target]===-1)return[];
  const path=[];for(let cell=target;;cell=previous[cell]){path.push({x:cell%WIDTH+.5,y:Math.floor(cell/WIDTH)+.5});if(cell===source)break;}
  return path.reverse();
}
export function isSafe(p){return !!p&&passable(p.x,p.y)&&safeSites.some(s=>disk(p.x,p.y,s,3));}
