const distance=(a,b)=>Math.hypot(a.x-b.x,a.y-b.y);
export function previewRoute(game,p){
  const leader=game.leader();
  if(!leader||!Number.isFinite(p?.x)||!Number.isFinite(p?.y))return [];
  const bounds=game.trial||game;
  // Trials use Battle's unobstructed arena movement, not world cell paths.
  if(game.trial)return [{x:leader.x,y:leader.y},{x:bounds.boundX(p.x),y:bounds.boundY(p.y)}];
  p=game.approachPoint?.(p)||p;
  const end=game.movementPoint?.(p)||game.world.nearestWalkable({x:bounds.boundX(p.x),y:bounds.boundY(p.y)});
  if(!end)return [];
  const route=game.world.findPath(leader,end);
  const doorway=game.interactionSites?.().some(s=>(s.action==='bossEnter'||s.action==='bossExit')&&distance(s,end)<.01);
  return doorway&&route.length&&distance(route.at(-1),end)>.01?[...route,end]:route;
}
export function nextDestination(game,home=false){
  if(game.interior)return game.state.completed.includes(game.roomBoss.id)?game.world.EXIT:game.roomBoss;
  if(home)return game.world.HOME;
  if(!game.prologueComplete)return {x:33,y:142,kind:'arena'};
  if(game.units.some(u=>u.team===0&&u.hp/u.maxHp<.25))return game.nearestCamp();
  if(game.regionComplete){const quest=game.questTarget?.();if(quest)return quest;}
  const {CAMPS,ENCOUNTERS}=game.world;
  const camp=CAMPS.find(c=>!game.state.camps.includes(c.id));
  if(camp){
    const remaining=ENCOUNTERS.filter(e=>camp.required?.includes(e.id)&&!game.state.completed.includes(e.id));
    return remaining.sort((a,b)=>distance(a,game.leader())-distance(b,game.leader()))[0]||camp;
  }
  return ENCOUNTERS.find(e=>e.kind==='boss'&&!game.state.completed.includes(e.id))||game.frontier;
}
export function hintPoint(game,destination){
  const route=previewRoute(game,destination);
  return route[Math.min(5,route.length-1)]||destination;
}
export class RouteGesture{
  constructor(){this.cancel();}
  begin(id,p,enemy=null){if(this.id!==null)return false;this.id=id;this.start=p;this.enemy=enemy;this.point=p;return true;}
  update(id,p){if(id!==this.id)return false;if(distance(this.start,p)>.35)this.enemy=null;this.point=p;return true;}
  release(id){if(id!==this.id)return null;const result={point:this.point,enemy:this.enemy};this.cancel();return result;}
  cancel(){this.id=null;this.enemy=null;this.start=null;this.point=null;}
}
const signs=new WeakMap();
function clearSignLine(world,a,b){
  if(!world.passable(a.x,a.y)||!world.passable(b.x,b.y))return false;
  const dx=b.x-a.x,dy=b.y-a.y;
  let tx=dx>0?(Math.floor(a.x)+1-a.x)/dx:dx<0?(Math.floor(a.x)-a.x)/dx:Infinity;
  let ty=dy>0?(Math.floor(a.y)+1-a.y)/dy:dy<0?(Math.floor(a.y)-a.y)/dy:Infinity,t=0;
  while(t<1){
    const next=Math.min(tx,ty,1),mid=(t+next)/2;
    if(next-t>1e-10&&!world.passable(a.x+dx*mid,a.y+dy*mid))return false;
    if(next===1)break;
    if(Math.abs(tx-next)<1e-10)tx+=1/Math.abs(dx);
    if(Math.abs(ty-next)<1e-10)ty+=1/Math.abs(dy);
    t=next;
  }
  return true;
}
function clearSignApproach(world,a,b){
  const length=distance(a,b),nx=(b.y-a.y)/length*.3,ny=(a.x-b.x)/length*.3;
  return length>0&&[-1,0,1].every(side=>clearSignLine(world,{x:a.x+nx*side,y:a.y+ny*side},{x:b.x+nx*side,y:b.y+ny*side}));
}
export function signposts(world){
  if(signs.has(world))return signs.get(world);
  const chosen=[];
  const add=(p,destination,ship=false)=>chosen.push(Object.freeze({...p,destination,ship,home:destination===world.HOME,angle:Math.atan2(destination.y-p.y,destination.x-p.x)}));
  // A camp arrow means a short, direct walk to that actual camp, never the
  // first bend of a distant path that may turn away behind trees or water.
  for(const target of [world.HOME,...world.CAMPS]){
    const preferred=target===world.HOME?world.CAMPS[0]:world.HOME,candidates=[];
    for(let y=Math.floor(target.y)-8;y<=target.y+8;y++)for(let x=Math.floor(target.x)-8;x<=target.x+8;x++){
      const p={x:x+.5,y:y+.5},d=distance(p,target);
      if(d<6||d>8||!clearSignApproach(world,p,target))continue;
      const alignment=preferred?((p.x-target.x)*(preferred.x-target.x)+(p.y-target.y)*(preferred.y-target.y))/(d*distance(preferred,target)):0;
      candidates.push({...p,score:(world.tileAt(p.x,p.y)==='path'?0:3)+Math.abs(d-7)-alignment});
    }
    candidates.sort((a,b)=>a.score-b.score||a.y-b.y||a.x-b.x);
    const first=candidates[0];
    if(!first)continue;
    add({x:first.x,y:first.y},target);
    if(target===world.HOME)continue;
    const second=candidates.find(p=>distance(p,first)>=9);
    if(second)add({x:second.x,y:second.y},target);
  }
  for(const p of world.SIGNPOSTS||[]){
    if(p.ship&&p.destination&&distance(p,p.destination)>=2&&distance(p,p.destination)<=10&&clearSignApproach(world,p,p.destination))add({x:p.x,y:p.y},p.destination,true);
  }
  const result=Object.freeze(chosen);signs.set(world,result);return result;
}
export function drawSignposts(c,world,bounds){
  for(const p of signposts(world)){
    if(p.x<bounds.left-2||p.x>bounds.right+2||p.y<bounds.top-2||p.y>bounds.bottom+2)continue;
    c.save();c.translate(p.x,p.y);
    c.strokeStyle='#635e48';c.lineWidth=.09;c.beginPath();c.moveTo(0,.3);c.lineTo(0,-1.45);c.stroke();
    c.fillStyle='#eadca5';c.strokeStyle='#426a63';c.lineWidth=.05;c.beginPath();c.roundRect(-.6,-1.5,1.2,.68,.08);c.fill();c.stroke();
    c.save();c.translate(.28,-1.14);c.rotate(p.angle);c.strokeStyle='#236e68';c.lineWidth=.055;c.beginPath();c.moveTo(-.18,0);c.lineTo(.18,0);c.lineTo(.06,-.13);c.moveTo(.18,0);c.lineTo(.06,.13);c.stroke();c.restore();
    c.strokeStyle='#236e68';c.lineWidth=.05;c.beginPath();
    if(p.ship){c.moveTo(-.48,-1.13);c.lineTo(-.39,-.99);c.lineTo(-.15,-.99);c.lineTo(-.06,-1.13);c.closePath();c.moveTo(-.27,-1.15);c.lineTo(-.27,-1.4);c.lineTo(-.1,-1.17);c.lineTo(-.27,-1.17);}
    else if(p.home){c.moveTo(-.43,-1.03);c.lineTo(-.43,-1.25);c.lineTo(-.27,-1.37);c.lineTo(-.11,-1.25);c.lineTo(-.11,-1.03);c.closePath();}
    else{c.moveTo(-.48,-1.02);c.lineTo(-.27,-1.39);c.lineTo(-.06,-1.02);c.closePath();c.moveTo(-.32,-1.02);c.lineTo(-.27,-1.15);c.lineTo(-.22,-1.02);}
    c.stroke();c.restore();
  }
}
