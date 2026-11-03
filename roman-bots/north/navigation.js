const distance=(a,b)=>Math.hypot(a.x-b.x,a.y-b.y);
export function previewRoute(game,p){
  const leader=game.leader();
  if(!leader||!Number.isFinite(p?.x)||!Number.isFinite(p?.y))return [];
  const bounds=game.trial||game;
  p=game.approachPoint?.(p)||p;
  const end=game.world.nearestWalkable({x:bounds.boundX(p.x),y:bounds.boundY(p.y)});
  return end?game.world.findPath(leader,end):[];
}
export function nextDestination(game,home=false){
  if(home)return game.world.HOME;
  if(!game.prologueComplete)return {x:33,y:142,kind:'arena'};
  if(game.alive(0).some(u=>u.hp/u.maxHp<.25))return game.nearestCamp();
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
function posts(world){
  if(signs.has(world))return signs.get(world);
  const points=world.SIGNPOSTS||world.ROUTES?.flat().map(([x,y])=>({x,y}))||[];
  const chosen=[];
  for(const p of points){
    if(chosen.length>=16)break;
    if(!world.passable(p.x,p.y)||!p.ship&&chosen.some(q=>distance(p,q)<12))continue;
    const camp=[...world.CAMPS].sort((a,b)=>distance(a,p)-distance(b,p))[0];
    const target=p.destination||(distance(p,world.HOME)<18?world.HOME:camp);
    const path=world.findPath(p,target),toward=path[Math.min(5,path.length-1)]||target;
    chosen.push({...p,home:target===world.HOME,angle:Math.atan2(toward.y-p.y,toward.x-p.x)});
  }
  signs.set(world,chosen);return chosen;
}
export function drawSignposts(c,world,bounds){
  for(const p of posts(world)){
    if(p.x<bounds.left-2||p.x>bounds.right+2||p.y<bounds.top-2||p.y>bounds.bottom+2)continue;
    c.save();c.translate(p.x+1.5,p.y-.8);
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
