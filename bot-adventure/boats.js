import {HOME,REGIONS,WORKSHOPS,WORLD_W,WORLD_H,regionAt,areaUnlocked,pathfind,canWalk} from './data.js?v=world91';

const steps=[[1,0],[-1,0],[0,1],[0,-1]],key=p=>`${Math.floor(p.x)},${Math.floor(p.y)}`,point=k=>{const [x,y]=k.split(',').map(Number);return {x:x+.5,y:y+.5};};
const distance=(a,b)=>Math.hypot(a.x-b.x,a.y-b.y);
const land=(world,x,y)=>x>0&&y>0&&x<WORLD_W-1&&y<WORLD_H-1&&regionAt(x,y)>=0&&regionAt(x,y)<REGIONS.length&&!world.blocks.has(`${x},${y}`);

export function makeLakes(world){
  const seen=new Set(),reachable=new Set([key(HOME)]),queue=[point(key(HOME))],lakes=[];
  // Docks must connect to the walking world, not an isolated decorative island.
  for(let i=0;i<queue.length;i++)for(const [dx,dy] of steps){const x=Math.floor(queue[i].x)+dx,y=Math.floor(queue[i].y)+dy,k=`${x},${y}`;if(!reachable.has(k)&&land(world,x,y)){reachable.add(k);queue.push({x:x+.5,y:y+.5});}}
  for(const start of world.water){
    if(seen.has(start))continue;
    const first=point(start),r=regionAt(first.x,first.y);if(r<0||r>=REGIONS.length)continue;
    const cells=new Set([start]),q=[start],banks=[];seen.add(start);
    for(let i=0;i<q.length;i++){
      const p=point(q[i]);for(const [dx,dy] of steps){
        const x=Math.floor(p.x)+dx,y=Math.floor(p.y)+dy,k=`${x},${y}`;
        if(regionAt(x,y)!==r)continue;
        if(world.water.has(k)){if(!seen.has(k)){seen.add(k);cells.add(k);q.push(k);}}
        else if(reachable.has(k))banks.push({water:p,shore:{x:x+.5,y:y+.5}});
      }
    }
    if(cells.size<4||!banks.length)continue;
    const anchor=[...cells].sort((a,b)=>{const pa=point(a),pb=point(b);return pa.y-pb.y||pa.x-pb.x;})[0];
    lakes.push({id:`lake-${r}-${anchor.replace(',','-')}`,r,cells,banks});
  }
  return lakes;
}

function waterPath(lake,from,to){
  const start=key(from),end=key(to);if(!lake.cells.has(start)||!lake.cells.has(end))return null;
  const queue=[start],seen=new Map([[start,null]]);
  for(let i=0;i<queue.length&&!seen.has(end);i++){
    const p=point(queue[i]);for(const [dx,dy] of steps){const k=`${Math.floor(p.x)+dx},${Math.floor(p.y)+dy}`;if(lake.cells.has(k)&&!seen.has(k)){seen.set(k,queue[i]);queue.push(k);}}
  }
  if(!seen.has(end))return null;
  const route=[];for(let k=end;k!==start;k=seen.get(k))route.unshift(point(k));
  return route;
}

export class Boats {
  constructor(game){
    this.game=game;this.lakes=makeLakes(game.world);this.byCell=new Map();this.list=[];this.riding=null;this.pending=null;this.boarding=false;
    for(const lake of this.lakes){
      for(const cell of lake.cells)this.byCell.set(cell,lake);
      const home=WORKSHOPS.reduce((a,b)=>distance(a,point([...lake.cells][0]))<distance(b,point([...lake.cells][0]))?a:b);
      const banks=[...lake.banks].sort((a,b)=>distance(a.shore,home)-distance(b.shore,home));
      const docks=[banks[0]];
      if(lake.cells.size>=80){const far=[...banks].sort((a,b)=>distance(b.water,docks[0].water)-distance(a.water,docks[0].water))[0];if(distance(far.water,docks[0].water)>6)docks.push(far);}
      for(const [i,dock] of docks.entries())this.list.push({id:`${lake.id}-${i}`,lake,r:lake.r,...dock.water,shore:{...dock.shore},dock:{water:{...dock.water},shore:{...dock.shore}},angle:Math.atan2(dock.water.y-dock.shore.y,dock.water.x-dock.shore.x)});
    }
    const saved=game.save.boating;
    if(Array.isArray(saved?.boats))for(const record of saved.boats){
      if(!record||typeof record!=='object')continue;
      const b=this.list.find(b=>b.id===record.id);if(!b||!this.validPosition(b,record)||!this.validShore(b,record.shore,record))continue;
      b.x=record.x;b.y=record.y;b.shore={...record.shore};
    }
    const active=this.list.find(b=>b.id===saved?.riding);
    if(active&&areaUnlocked(game.save,active.r)&&this.validPosition(active,game.player)){
      this.riding=active;active.x=game.player.x;active.y=game.player.y;
    }
  }
  validPosition(boat,p){return Number.isFinite(p?.x)&&Number.isFinite(p?.y)&&boat.lake.cells.has(key(p));}
  validShore(boat,shore,water){return Number.isFinite(shore?.x)&&Number.isFinite(shore?.y)&&Math.abs(shore.x%1-.5)<1e-8&&Math.abs(shore.y%1-.5)<1e-8&&land(this.game.world,Math.floor(shore.x),Math.floor(shore.y))&&regionAt(shore.x,shore.y)===boat.r&&Math.abs(Math.floor(shore.x)-Math.floor(water.x))+Math.abs(Math.floor(shore.y)-Math.floor(water.y))===1;}
  visible(){return this.list.filter(b=>areaUnlocked(this.game.save,b.r));}
  at(pos){return this.visible().filter(b=>b!==this.riding&&distance(b,pos)<.85).sort((a,b)=>distance(a,pos)-distance(b,pos))[0];}
  lakeAt(pos){return this.byCell.get(key(pos));}
  clearCombat(){const g=this.game;g.target=null;g.powerTarget=null;g.tapSelection=null;g.charging=null;g.headingHome=false;}
  board(boat,destination=boat){
    const g=this.game;if(this.riding||!this.visible().includes(boat))return false;
    const route=pathfind(g.world,g.save,g.player,boat.shore);
    if(!route.length&&distance(g.player,boat.shore)>.1)return false;
    this.clearCombat();this.pending={boat,destination};g.route=route;g.waypoint={...boat.shore};this.beforeMove();return true;
  }
  beforeMove(){
    const g=this.game;if(this.pending&&!g.route.length&&distance(g.player,this.pending.boat.shore)<.1){
      const {boat,destination}=this.pending;this.pending=null;this.riding=boat;this.boarding=true;
      g.route=[{x:boat.x,y:boat.y},...(waterPath(boat.lake,boat,destination)||[])];g.waypoint={x:destination.x,y:destination.y};g.emit('boat-boarded');
    }
  }
  routeToLand(to){
    const g=this.game,b=this.riding;if(!b)return null;
    const target={x:Math.floor(to.x)+.5,y:Math.floor(to.y)+.5};
    if(!canWalk(g.world,g.save,Math.floor(target.x),Math.floor(target.y)))return null;
    const banks=[...b.lake.banks].sort((a,c)=>distance(a.shore,target)+distance(a.water,g.player)*.5-distance(c.shore,target)-distance(c.water,g.player)*.5);
    for(const bank of banks){
      if(!areaUnlocked(g.save,regionAt(bank.shore.x,bank.shore.y)))continue;
      const walk=pathfind(g.world,g.save,bank.shore,target);if(!walk.length&&distance(bank.shore,target)>.1)continue;
      const from=this.validPosition(b,g.player)?g.player:b,water=waterPath(b.lake,from,bank.water);if(!water)continue;
      return [...(from===b?[{x:b.x,y:b.y}]:[]),...water,{...bank.shore,land:true},...walk];
    }
    return null;
  }
  moveTo(pos){
    const g=this.game,lake=this.lakeAt(pos),boat=this.riding;
    if(boat){
      let route;
      if(lake===boat.lake){const from=this.validPosition(boat,g.player)?g.player:boat,water=waterPath(lake,from,pos);route=water&&[...(from===boat?[{x:boat.x,y:boat.y}]:[]),...water];}
      else if(lake)return false;
      else route=this.routeToLand(pos);
      if(!route)return false;this.clearCombat();g.route=route;g.waypoint={x:pos.x,y:pos.y};return true;
    }
    if(!lake||!areaUnlocked(g.save,lake.r))return false;
    const choices=this.visible().filter(b=>b.lake===lake).map(b=>({b,route:pathfind(g.world,g.save,g.player,b.shore)})).filter(c=>c.route.length||distance(g.player,c.b.shore)<.1).sort((a,b)=>a.route.length-b.route.length);
    return choices[0]?this.board(choices[0].b,pos):false;
  }
  afterMove(arrived){
    const b=this.riding,g=this.game;if(!b)return;
    if(arrived&&this.validPosition(b,arrived))this.boarding=false;
    if(arrived?.land){b.shore={x:arrived.x,y:arrived.y};this.riding=null;this.boarding=false;g.emit('boat-landed');}
    else if(!this.boarding&&!g.route[0]?.land&&this.validPosition(b,g.player)){b.angle=g.player.angle;b.x=g.player.x;b.y=g.player.y;}
  }
  cancel(){
    this.pending=null;this.boarding=false;if(this.riding){const b=this.riding;b.x=b.dock.water.x;b.y=b.dock.water.y;b.shore={...b.dock.shore};this.riding=null;}
  }
  snapshot(){
    const riding=this.riding&&this.validPosition(this.riding,this.game.player)?this.riding.id:null;
    this.game.save.boating={riding,boats:this.list.map(b=>({id:b.id,x:b.x,y:b.y,shore:{...b.shore}}))};
  }
}
