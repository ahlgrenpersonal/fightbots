import { HOME, WORKSHOPS, RETURNS, ENCOUNTERS, returnActive, REGIONS, EQUIPMENT, STARTERS, makeWorld, freshSave, stats, item, cellsIn, unlockedRegion, regionAt, relayFor, pathfind, canWalk, available, requiredCells, migrateSiteProgress, migrateWorldLayout, PANTHEON, areaUnlocked, pantheonUnlocked } from './data.js?v=world82';
import { bossProfile } from './content.js?v=world82';
import { ReturningPatrols } from './patrols.js?v=world82';
import {inRoyalChamber} from './pantheon.js?v=world82';
import {RoyalCourt} from './royal-court.js?v=world82';
import {nearestWalkable} from './data.js?v=world82';

export const distance = (a,b) => Math.hypot(a.x-b.x,a.y-b.y);
export const TAP_COOLDOWN=1.5;
export const AUTO_DAMAGE=.6;
export const TAP_DAMAGE=2;
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
const DIRECT_WEAPONS=new Set(['bumper','blaster','saw','hammer','flame','frost']);
function segmentDistance(p,a,b){
  const dx=b.x-a.x,dy=b.y-a.y,t=clamp(((p.x-a.x)*dx+(p.y-a.y)*dy)/(dx*dx+dy*dy||1),0,1);
  return distance(p,{x:a.x+dx*t,y:a.y+dy*t});
}
const MUZZLE_LENGTHS={rail:60,sunbeam:60,swarm:45,supernova:53,flame:49,drone:30,boomerang:40,lightning:49,rocket:50};
function weaponMuzzle(p,id,size=1.17){
  const scale=size/80,c=Math.cos(p.angle),s=Math.sin(p.angle),length=MUZZLE_LENGTHS[id]??53;
  return {x:p.x+((c<0?-24:24)+length*c)*scale,y:p.y+(10+length*s)*scale};
}
export class Adventure {
  constructor(save=freshSave(),onEvent=()=>{}) {
    this.save=migrateSiteProgress(migrateWorldLayout(save));this.onEvent=onEvent;this.world=makeWorld();
    this.player={...save.position,hp:Math.max(1,Math.min(save.hp,stats(save).hp)),angle:0,cd:0,hit:0,swing:0,invincible:2};
    this.enemies=this.world.enemies.filter(e=>!save.kills.includes(e.id)&&!save.cleared.includes(e.site)&&!(e.returnId?save.returns.includes(e.returnId):!e.encounterId&&e.type==='boss'&&save.bosses.includes(e.r)));
    for(const e of this.enemies)if(e.dormant&&(e.spawnParent?save.kills.includes(e.spawnParent):!this.enemies.some(n=>n.site===e.site&&n.wave===0&&n.hp>0)))e.dormant=false;
    this.route=[];this.loot=[];this.projectiles=[];this.effects=[];this.telegraphs=[];this.target=null;this.waypoint=null;
    this.time=0;this.boostTime=0;this.boostCd=0;this.shieldCd=0;this.buddyCd=0;this.shake=0;this.paused=false;this.reducedMotion=false;this.routeTimer=0;this.charging=null;this.headingHome=false;
    this.tapCd=0;this.powerTarget=null;this.tapSelection=null;
    this.royals=new RoyalCourt(this);
    if(regionAt(this.player.x,this.player.y)===PANTHEON.r&&!canWalk(this.world,save,Math.floor(this.player.x),Math.floor(this.player.y)))Object.assign(this.player,pantheonUnlocked(save)?this.royals.sealed?PANTHEON.viewpoint:nearestWalkable(this.world,save,this.player):HOME);
    this.patrols=new ReturningPatrols(this);
    this.discover();
  }
  emit(type,data={}){this.onEvent({type,...data});}
  snapshot(){this.patrols.snapshot();this.royals.snapshot();this.save.position={x:this.player.x,y:this.player.y};this.save.hp=this.player.hp;return this.save;}
  maxHp(){return stats(this.save).hp;}
  bossAwake(r){return !this.save.bosses.includes(r)&&cellsIn(this.save,r)>=requiredCells(r)&&r<=unlockedRegion(this.save);}
  bossFight(){
    const royal=this.royals.hud();if(royal)return royal;
    const r=regionAt(this.player.x,this.player.y),key=e=>e.encounterId||e.returnId||`guardian-${e.r}`;
    const nearby=this.enemies.filter(e=>e.type==='boss'&&e.r===r&&e.hp>0&&!e.dormant&&this.enemyAwake(e)&&distance(e,this.player)<7).sort((a,b)=>distance(a,this.player)-distance(b,this.player));
    const first=nearby[0];if(!first)return null;
    const group=key(first),members=this.enemies.filter(e=>e.type==='boss'&&key(e)===group);
    const maxHp=this.world.enemies.filter(e=>e.type==='boss'&&key(e)===group).reduce((sum,e)=>sum+e.maxHp,0);
    return {name:ENCOUNTERS.find(e=>e.id===first.encounterId)?.name||RETURNS.find(m=>m.id===first.returnId)?.boss||REGIONS[r].boss,health:members.reduce((sum,e)=>sum+Math.max(0,e.hp),0)/maxHp};
  }
  homes(){return WORKSHOPS.filter(h=>h.r<=unlockedRegion(this.save));}
  homeNear(){return this.homes().find(h=>distance(this.player,h)<2.6);}
  isHome(){return !!this.homeNear();}
  homeRoutes(){return this.homes().map(home=>({home,route:pathfind(this.world,this.save,this.player,home)})).filter(p=>p.route.length||(Math.floor(this.player.x)===Math.floor(p.home.x)&&Math.floor(this.player.y)===Math.floor(p.home.y))).sort((a,b)=>a.route.length-b.route.length);}
  nearestHome(){return this.homeRoutes()[0]?.home||this.homes()[0];}
  enemyAwake(e){if(e.royal)return this.royals.awake(e);if(e.r>unlockedRegion(this.save))return false;if(e.patrolSite)return this.patrols.awake(e);if(e.encounterId)return true;if(!e.returnId)return e.type!=='boss'||this.bossAwake(e.r);const m=RETURNS.find(m=>m.id===e.returnId);return returnActive(this.save,m)&&(e.type!=='boss'||m.sites.every((_,i)=>this.save.cleared.includes(`${m.sitePrefix}-${i}`)));}
  stationNear(radius=1.1){return this.world.stations.find(s=>s.r<=unlockedRegion(this.save)&&distance(this.player,s)<radius);}
  safeAt(pos){return regionAt(pos.x,pos.y)===PANTHEON.r?this.royals?.safeAt(pos)!==false:this.homes().some(h=>distance(pos,h)<2.6)||this.world.stations.some(s=>s.r<=unlockedRegion(this.save)&&distance(pos,s)<2.25);}
  clearShot(from,to){
    let x=Math.floor(from.x),y=Math.floor(from.y);const tx=Math.floor(to.x),ty=Math.floor(to.y);
    const dx=to.x-from.x,dy=to.y-from.y,sx=Math.sign(dx),sy=Math.sign(dy),ix=dx?Math.abs(1/dx):Infinity,iy=dy?Math.abs(1/dy):Infinity;
    let nx=dx?Math.abs((x+(sx>0?1:0)-from.x)/dx):Infinity,ny=dy?Math.abs((y+(sy>0?1:0)-from.y)/dy):Infinity;
    while(true){
      if(this.world.blocks.has(`${x},${y}`))return false;
      if(x===tx&&y===ty)return true;
      if(Math.min(nx,ny)>=1)return !this.world.blocks.has(`${tx},${ty}`);
      if(nx===ny){
        if(this.world.blocks.has(`${x+sx},${y}`)||this.world.blocks.has(`${x},${y+sy}`))return false;
        x+=sx;y+=sy;nx+=ix;ny+=iy;
      }else if(nx<ny){x+=sx;nx+=ix;}else{y+=sy;ny+=iy;}
    }
  }
  canAttack(from,to,weapon){return !DIRECT_WEAPONS.has(weapon)||this.clearShot(from,to);}
  inEngagementView(pos){
    const b=this.viewBounds;if(!b)return true;
    const x=(b.right-b.left)*.16,y=(b.bottom-b.top)*.12;
    return pos.x>=b.left+x&&pos.x<=b.right-x&&pos.y>=b.top+y&&pos.y<=b.bottom-y;
  }
  playerCanAttack(e,w=stats(this.save).weapon,scale=1){return distance(this.player,e)<=w.range*scale&&this.inEngagementView(e)&&this.canAttack(this.player,e,w.id);}
  attackLimit(w){return {x:this.player.x,y:this.player.y,radius:w.range,bounds:this.viewBounds?{...this.viewBounds}:null};}
  firingMuzzle(p,weapon,to,size=1.17,terrain=DIRECT_WEAPONS.has(weapon)){
    const muzzle=weaponMuzzle(p,weapon,size);
    if(!terrain||this.clearShot(p,muzzle)&&this.clearShot(muzzle,to))return muzzle;
    // Keep the barrel offset where possible, but never spawn a direct shot in scenery.
    let lo=0,hi=1;
    for(let i=0;i<12;i++){
      const t=(lo+hi)/2,point={x:p.x+(muzzle.x-p.x)*t,y:p.y+(muzzle.y-p.y)*t};
      if(this.clearShot(p,point)&&this.clearShot(point,to))lo=t;else hi=t;
    }
    return {x:p.x+(muzzle.x-p.x)*lo,y:p.y+(muzzle.y-p.y)*lo};
  }
  enemyStep(e,to,step){
    const d=distance(e,to);if(!d||step<=0)return false;
    const next={x:e.x+(to.x-e.x)*Math.min(1,step/d),y:e.y+(to.y-e.y)*Math.min(1,step/d)};
    const home={x:e.homeX,y:e.homeY},before=distance(e,home),after=distance(next,home);
    if(after>7&&after>=before||!canWalk(this.world,this.save,Math.floor(next.x),Math.floor(next.y))||!this.clearShot(e,next)||this.safeAt(next)||e.patrolSite&&this.patrols.protectedAt(next))return false;
    Object.assign(e,next);return true;
  }
  discover(){const r=regionAt(this.player.x,this.player.y);if(r>=0&&!this.save.visited.includes(r)){this.save.visited.push(r);this.emit('region',{r});}for(const s of this.world.stations)if(s.r<=unlockedRegion(this.save)&&distance(this.player,s)<6&&!this.save.discovered.includes(s.id)){this.save.discovered.push(s.id);this.emit('toast',{text:'Charging station discovered!'});}}
  moveTo(pos){
    if(!areaUnlocked(this.save,regionAt(pos.x,pos.y))){this.emit('toast',{text:regionAt(pos.x,pos.y)===PANTHEON.r?'Restore every relay and finish the return missions to open the ancient pantheon.':'Restore this region\'s relay to open the next trail.'});return false;}
    if(inRoyalChamber(pos.x,pos.y)&&this.royals.sealed){this.emit('toast',{text:'Approach the seal, watch the court, then choose when to begin.'});return this.moveTo(PANTHEON.stairTop);}
    let to={x:Math.floor(pos.x)+.5,y:Math.floor(pos.y)+.5};
    if(!canWalk(this.world,this.save,Math.floor(to.x),Math.floor(to.y))){
      const neighbors=[];for(let dy=-1;dy<=1;dy++)for(let dx=-1;dx<=1;dx++)if(canWalk(this.world,this.save,Math.floor(to.x)+dx,Math.floor(to.y)+dy))neighbors.push({x:to.x+dx,y:to.y+dy});
      neighbors.sort((a,b)=>distance(a,this.player)-distance(b,this.player));if(!neighbors.length)return false;to=neighbors[0];
    }
    this.route=pathfind(this.world,this.save,this.player,to);this.waypoint=to;this.target=null;this.powerTarget=null;this.tapSelection=null;this.charging=null;this.headingHome=false;return this.route.length>0;
  }
  focusEnemy(enemy){if(enemy.dormant||!this.enemyAwake(enemy))return;this.target=enemy.id;this.moveTo(enemy);this.target=enemy.id;}
  enemyAt(pos,tile){
    return this.enemies.filter(e=>e.hp>0&&!e.dormant&&this.enemyAwake(e)&&this.inEngagementView(e)&&(e.spawnUntil||0)<=this.time)
      .map(e=>({e,d:distance(pos,{x:e.x,y:e.y-(e.size||.8)*.15}),radius:Math.max(.4,(e.size||.8)*.5)+22/Math.max(1,tile)}))
      .filter(p=>p.d<=p.radius).sort((a,b)=>a.d/a.radius-b.d/b.radius)[0]?.e;
  }
  tapEnemy(e){
    if(this.paused||e.hp<=0||e.dormant||!this.enemyAwake(e)||e.spawnUntil>this.time)return false;
    const w=stats(this.save).weapon,inRange=this.playerCanAttack(e,w);
    if(!inRange)this.focusEnemy(e);
    else{if(this.target){this.route=[];this.waypoint=null;}this.target=null;}
    this.tapSelection=e.id;
    if(this.tapCd>0)return false;
    this.powerTarget=e.id;return this.tryPowerAttack();
  }
  tryPowerAttack(){
    const e=this.enemies.find(n=>n.id===this.powerTarget&&n.hp>0&&!n.dormant&&this.enemyAwake(n)),w=stats(this.save).weapon;
    if(!e){this.powerTarget=null;return false;}
    if(this.tapCd>0||this.safeAt(this.player)||!this.playerCanAttack(e,w))return false;
    this.powerTarget=null;this.tapCd=TAP_COOLDOWN;this.attack(e,true);return true;
  }
  goHome(){
    const choice=this.homeRoutes()[0];if(!choice)return false;this.moveTo(choice.home);this.headingHome=this.route.length>0;return this.headingHome;
  }
  rescueHome(){
    const home=this.nearestHome();this.player.x=home.x;this.player.y=home.y;this.player.hp=this.maxHp();this.player.invincible=3;
    this.route=[];this.target=null;this.powerTarget=null;this.tapSelection=null;this.waypoint=null;this.projectiles=[];this.telegraphs=[];this.charging=null;this.headingHome=false;
    this.emit('home');
  }
  depart(){
    this.player.hp=this.maxHp();
    const home=this.homeNear()||this.nearestHome();this.moveTo({x:home.x+2,y:home.y+3});
    this.emit('toast',{text:'All charged up. Adventure awaits!'});
  }
  equip(type,id){
    if(!this.isHome()||!this.save.owned.includes(id)||!EQUIPMENT[type]?.some(p=>p.id===id))return false;
    this.save.build[type]=id;this.player.hp=this.maxHp();this.emit('equip',{id});return true;
  }
  craft(type,id){
    const p=item(type,id);
    if(!this.isHome()||p.id!==id||this.save.owned.includes(id)||!available(this.save,p)||this.save.scrap<p.cost||this.save.gears<p.gears)return false;
    this.save.scrap-=p.cost;this.save.gears-=p.gears;this.save.owned.push(id);this.equip(type,id);this.emit('crafted',{part:p});return true;
  }
  repair(){
    if(this.isHome()){this.player.hp=this.maxHp();return true;}
    const station=this.stationNear();if(!station||this.charging||this.player.hp>=this.maxHp())return false;
    if(this.save.scrap<2){this.emit('toast',{text:'Charging costs 2 scrap. Home repairs are always free.'});return false;}
    this.save.scrap-=2;this.route=[];this.target=null;this.powerTarget=null;this.tapSelection=null;this.waypoint=null;this.charging=station.id;
    this.emit('toast',{text:'Charging… Safe inside the green ring.'});return true;
  }
  boost(){if(this.boostCd>0)return false;const capacitor=this.save.build.gadget==='capacitor';this.boostCd=capacitor?18:28;this.boostTime=capacitor?8:6;this.player.invincible=1;this.emit('boost');this.burst(this.player.x,this.player.y,1.2);return true;}
  burst(x,y,radius=1,type='burst',limit){this.effects.push({type,x,y,radius,life:.6,max:.6,limit});}
  number(x,y,text,color){this.effects.push({type:'number',x,y,text,color,life:.9,max:.9});}
  hitEnemy(e,damage,kind=''){
    if(e.hp<=0||e.dormant||e.spawnUntil>this.time||!this.enemyAwake(e))return;const amount=Math.max(1,Math.round(damage*(e.type==='shield'&&!e.frozen&&!['rail','sunbeam','gravity','tractor'].includes(kind)?.7:1)));e.hp=Math.max(0,e.hp-amount);e.aggroUntil=this.time+6;e.hit=.15;this.number(e.x,e.y-.5,`${amount}`,'#fff3b5');
    if(e.hp<=0){
      if(e.royal){this.royals.defeated(e);return;}
      this.burst(e.x,e.y,e.type==='boss'?1.4:.45,e.type==='boss'?'explosion':'burst');
      if(e.patrolSite){this.patrols.defeated(e);this.emit('defeat',{boss:false});return;}
      this.save.kills.push(e.id);this.save.totalBots++;
      const reward=e.encounterId?8:e.type==='boss'?35*(e.r+1):2+e.r;this.save.scrap+=reward;this.number(e.x,e.y,`+${reward} ◆`,'#ffe28c');this.emit('defeat',{boss:e.type==='boss'});
      if(e.encounterId){
        const children=this.enemies.filter(n=>n.spawnParent===e.id&&n.hp>0);
        for(const child of children){
          const side=child.x<child.homeX?-1:1;
          const desired={x:e.x+side*.85,y:e.y};
          const candidates=[desired,{x:e.x,y:e.y+side*.85},{x:e.x,y:e.y}];
          const spot=candidates.find(p=>canWalk(this.world,this.save,Math.floor(p.x),Math.floor(p.y))&&!this.safeAt(p)&&distance(p,{x:child.homeX,y:child.homeY})<7);
          if(spot)Object.assign(child,spot);
          child.dormant=false;child.cd=2.8;child.spawnUntil=this.time+1;child.aggroUntil=this.time+6;
        }
        if(children.length){this.effects.push({type:'split',x:e.x,y:e.y,radius:1.5,life:1,max:1});this.emit('toast',{text:'It split into two little bots!'});}
        if(!this.enemies.some(n=>n.encounterId===e.encounterId&&n.hp>0)){
          const encounter=ENCOUNTERS.find(n=>n.id===e.encounterId);
          this.save.scrap+=encounter.reward;this.save.gears+=2;this.burst(e.x,e.y,1.5);
          this.emit('toast',{text:`${encounter.name} defeated! +${encounter.reward} scrap`});
        }
        return;
      }
      if(e.type==='boss'&&!this.enemies.some(b=>b.type==='boss'&&!b.encounterId&&b.r===e.r&&b.returnId===e.returnId&&b.hp>0)){
        if(e.returnId){this.save.returns.push(e.returnId);this.save.gears+=6;this.save.scrap+=120;this.emit('return-complete',{id:e.returnId});return;}
        this.save.bosses.push(e.r);this.save.gears+=4+e.r;this.save.scrap+=30+e.r*15;this.shake=5;this.projectiles=[];this.telegraphs=[];
        if(e.r===REGIONS.length-1)this.save.completed=true;
        this.emit('guardian',{r:e.r});
      }
    }
  }
  hurt(damage){
    if(this.player.invincible>0||this.boostTime>0||this.safeAt(this.player))return;
    if(['shield','aegis'].includes(this.save.build.gadget)&&this.shieldCd<=0){this.shieldCd=this.save.build.gadget==='aegis'?4:8;this.burst(this.player.x,this.player.y,.7);this.emit('block');return;}
    const actual=Math.max(1,damage-stats(this.save).defense)*(this.save.gentle?.65:1);
    this.player.hp=Math.max(0,this.player.hp-actual);this.player.hit=.2;this.player.invincible=.4;this.shake=1.8;this.number(this.player.x,this.player.y-.7,`-${Math.ceil(actual)}`,'#ffd4c3');
    if(this.player.hp<=0){this.save.scrap=Math.max(0,this.save.scrap-1);this.rescueHome();this.emit('rescue');}
  }
  attack(e,power=false){
    const w=stats(this.save).weapon,p=this.player,damage=w.damage*(power?TAP_DAMAGE:AUTO_DAMAGE)*(this.boostTime>0?1.65:1);
    if(!this.playerCanAttack(e,w))return;
    if(!power)p.cd=w.rate*(this.boostTime>0?.7:1);p.swing=power?.65:.42;p.angle=Math.atan2(e.y-p.y,e.x-p.x);
    const muzzle=this.firingMuzzle(p,w.id,e);
    this.emit('attack',{weapon:w.id,power});
    const splashDamage=damage*(power?AUTO_DAMAGE/TAP_DAMAGE:1),shotPower={power,powerTarget:e.id,splashDamage,playerRange:w.range,weaponId:w.id};
    const hit=(n,amount=damage)=>this.hitEnemy(n,amount*(power&&n!==e?AUTO_DAMAGE/TAP_DAMAGE:1),w.id);
    if(power){this.effects.push({type:'power-launch',x:muzzle.x,y:muzzle.y,tx:e.x,ty:e.y,life:.35,max:.35});if(!['blaster','rocket','frost','boomerang','drone','meteor','swarm','supernova'].includes(w.id))this.effects.push({type:'power-hit',x:e.x,y:e.y,weapon:w.id,life:.5,max:.5});}
    const foes=this.enemies.filter(n=>n.hp>0&&!n.dormant&&this.enemyAwake(n)&&this.playerCanAttack(n,w));
    if(w.id==='flame'){
      this.effects.push({type:'flame',power,x:muzzle.x,y:muzzle.y,angle:p.angle,radius:w.range,limit:this.attackLimit(w),life:.24,max:.24});for(const n of foes){const angle=Math.atan2(n.y-p.y,n.x-p.x);if(distance(n,p)<=w.range&&Math.cos(angle-p.angle)>.65&&this.clearShot(p,n))hit(n);}return;
    }
    if(['tractor','gravity'].includes(w.id)){
      this.effects.push({type:'vortex',x:e.x,y:e.y,radius:2.6,limit:this.attackLimit(w),life:.55,max:.55});
      for(const n of foes.filter(n=>distance(n,e)<2.6)){const a=Math.atan2(e.y-n.y,e.x-n.x),step=Math.min(.8,distance(n,e)),x=n.x+Math.cos(a)*step,y=n.y+Math.sin(a)*step;if(n.type!=='boss'&&canWalk(this.world,this.save,Math.floor(x),Math.floor(y))){n.x=x;n.y=y;}hit(n);}
      if(w.id==='gravity'){this.effects.push({type:'slam',x:e.x,y:e.y,limit:this.attackLimit(w),life:.55,max:.55});this.shake=4;}return;
    }
    if(w.id==='rail'||w.id==='sunbeam'){
      const targetForward=(e.x-muzzle.x)*Math.cos(p.angle)+(e.y-muzzle.y)*Math.sin(p.angle);
      const closeDischarge=w.id==='sunbeam'&&targetForward<=.1;
      const beamAngle=w.id==='sunbeam'&&!closeDischarge?Math.atan2(e.y-muzzle.y,e.x-muzzle.x):p.angle;
      const flareRadius=closeDischarge?Math.min(1.2,distance(e,muzzle)+.1):0;
      const tx=muzzle.x+Math.cos(beamAngle)*w.range,ty=muzzle.y+Math.sin(beamAngle)*w.range;
      this.effects.push({type:w.id==='sunbeam'?'sunbeam':'rail',power,x:muzzle.x,y:muzzle.y,tx,ty,flareRadius,limit:this.attackLimit(w),life:.3,max:.3});
      for(const n of foes){
        if(w.id==='sunbeam'){
          // The beam halo plus a bot's body radius defines the same visible hit corridor.
          if(distance(n,p)<=w.range&&(segmentDistance(n,muzzle,{x:tx,y:ty})<.65||flareRadius&&distance(n,muzzle)<flareRadius+.35))hit(n);
        }else{
          const dx=n.x-p.x,dy=n.y-p.y,along=dx*Math.cos(p.angle)+dy*Math.sin(p.angle),across=Math.abs(dx*Math.sin(p.angle)-dy*Math.cos(p.angle));
          if(along>=0&&along<=w.range&&across<.65)hit(n);
        }
      }return;
    }
    if(w.id==='swarm'||w.id==='supernova'){
      const targets=power?[e]:[e,...foes.filter(n=>n!==e&&distance(n,p)<=w.range).sort((a,b)=>distance(a,e)-distance(b,e))].slice(0,3);
      for(let i=0;i<3;i++){
        const target=targets[i%targets.length],side=(i-1)*.24;
        this.projectiles.push({x:muzzle.x-Math.sin(p.angle)*side,y:muzzle.y+Math.cos(p.angle)*side,
          tx:target.x,ty:target.y,target:target.id,angle:p.angle,speed:w.id==='swarm'?8.5:6.5,
          damage,...shotPower,kind:w.id==='swarm'?'drone':'rocket',style:w.id,launch:.18,launchAngle:p.angle+(i-1)*.65,life:4});
      }
      return;
    }
    if(['frost','boomerang','drone','meteor'].includes(w.id)){
      const kind={frost:'ice',boomerang:'blade',drone:'drone',meteor:'meteor'}[w.id];
      this.projectiles.push({x:w.id==='meteor'?e.x-1:muzzle.x,y:w.id==='meteor'?e.y-5:muzzle.y,tx:e.x,ty:e.y,target:e.id,angle:p.angle,speed:w.id==='meteor'?8:10,damage,...shotPower,kind,life:4});
      this.effects.push({type:w.id==='frost'?'frost':w.id==='boomerang'?'blade':w.id,x:w.id==='meteor'?e.x:muzzle.x,y:w.id==='meteor'?e.y:muzzle.y,tx:e.x,ty:e.y,radius:2.3,limit:this.attackLimit(w),life:.6,max:.6});return;
    }
    if(w.id==='blaster'||w.id==='rocket')this.projectiles.push({x:muzzle.x,y:muzzle.y,tx:e.x,ty:e.y,target:e.id,angle:p.angle,speed:w.id==='rocket'?6.5:11,damage,...shotPower,kind:w.id==='rocket'?'rocket':'bolt',life:3});
    else if(w.id==='lightning'){
      const chain=[e,...foes.filter(n=>n!==e&&distance(n,e)<2.8).sort((a,b)=>distance(a,e)-distance(b,e)).slice(0,3)];let from=muzzle;
      for(const [i,n] of chain.entries()){this.effects.push({type:'arc',power,x:from.x,y:from.y,tx:n.x,ty:n.y,life:.24,max:.24});hit(n,damage*(i===0?1:.72));from=n;}
    }else if(w.id==='hammer'){
      this.effects.push({type:'slam',x:e.x,y:e.y,limit:this.attackLimit(w),life:.55,max:.55});this.shake=4;
      for(const n of foes.filter(n=>distance(n,e)<1.9&&this.clearShot(p,n)))hit(n);
    }else{hit(e);this.burst(e.x,e.y,.25);if(w.id==='bumper'&&e.type!=='boss'){const a=Math.atan2(e.y-p.y,e.x-p.x),nx=e.x+Math.cos(a)*.25,ny=e.y+Math.sin(a)*.25;if(canWalk(this.world,this.save,Math.floor(nx),Math.floor(ny))){e.x=nx;e.y=ny;}}}
  }
  warnBoss(e){
    const profile=bossProfile(e),p=this.player,angle=Math.atan2(p.y-e.y,p.x-e.x);
    e.cd=4;e.swing=0;e.angle=angle;
    const muzzle=this.firingMuzzle(e,profile.weapon,p,e.size??1.7);
    const warningAngle=profile.weapon==='rail'?Math.atan2(p.y-muzzle.y,p.x-muzzle.x):angle;
    this.telegraphs.push({x:p.x,y:p.y,ox:muzzle.x,oy:muzzle.y,angle:warningAngle,bodyAngle:angle,radius:profile.weapon==='rail'?.5:1.1,damage:Math.min(e.damage,24),duration:2,life:2,bossSource:e.id,weapon:profile.weapon,pattern:profile.pattern});
    this.emit('warning');
  }
  releaseBoss(a,e){
    e.swing=.5;
    const from={x:a.ox,y:a.oy},to={x:a.x,y:a.y},w=a.weapon;
    const fx=(type,extra={})=>this.effects.push({type,x:from.x,y:from.y,tx:to.x,ty:to.y,angle:a.angle,radius:a.radius,life:.6,max:.6,enemy:true,weapon:w,royal:a.royal,...extra});
    if(['blaster','rocket','frost','boomerang','meteor','drone'].includes(w)){
      const kind={blaster:'bolt',rocket:'rocket',frost:'ice',boomerang:'blade',meteor:'meteor',drone:'drone'}[w];
      this.projectiles.push({x:w==='meteor'?to.x-1:from.x,y:w==='meteor'?to.y-5:from.y,tx:to.x,ty:to.y,angle:a.angle,speed:w==='meteor'?6:4,damage:a.damage,kind,enemy:true,bossSource:e.id,weapon:w,radius:a.radius,royal:a.royal,life:5});
      if(w==='drone')fx('drone');return;
    }
    if(w==='rail'){
      fx('rail');if(segmentDistance(this.player,from,to)<a.radius)this.hurt(a.damage);
    }else if(w==='flame'){
      const reach=Math.min(7,distance(from,to)+.4);fx('flame',{radius:reach});
      const angle=Math.atan2(this.player.y-from.y,this.player.x-from.x);
      if(distance(this.player,from)<=reach&&Math.cos(angle-a.angle)>.9&&this.clearShot(from,this.player))this.hurt(a.damage);
    }else{
      if(w==='lightning')fx('arc');
      else if(w==='tractor'||w==='gravity')fx('vortex',{x:to.x,y:to.y,radius:a.radius});
      if(w!=='lightning'&&w!=='tractor')fx('slam',{x:to.x,y:to.y});
      if(distance(this.player,to)<a.radius)this.hurt(a.damage);
    }
  }
  stepProjectiles(dt){
    const p=this.player;
    for(const shot of this.projectiles){
      const sourceId=shot.bossSource||shot.sourceId;
      const source=sourceId&&this.enemies.find(e=>e.id===sourceId&&e.hp>0&&!e.dormant&&this.enemyAwake(e));
      if(sourceId&&!source){shot.life=0;continue;}
      const target=shot.target&&this.enemies.find(e=>e.id===shot.target&&e.hp>0&&!e.dormant);
      const eligible=e=>this.playerCanAttack(e,{id:shot.weaponId||stats(this.save).weapon.id,range:shot.playerRange??stats(this.save).weapon.range});
      if(!shot.enemy&&target&&!shot.returning&&!eligible(target)){shot.life=0;continue;}
      if(shot.returning&&shot.kind==='blade'){const endpoint=shot.enemy?source:p;if(!endpoint){shot.life=0;continue;}shot.tx=endpoint.x;shot.ty=endpoint.y;}
      else if(target){shot.tx=target.x;shot.ty=target.y;}
      if(shot.launch>0){
        const launchStep=Math.min(dt,shot.launch);shot.launch=Math.max(0,shot.launch-dt);
        shot.angle=shot.launchAngle;shot.x+=Math.cos(shot.angle)*shot.speed*launchStep;shot.y+=Math.sin(shot.angle)*shot.speed*launchStep;shot.life-=dt;continue;
      }
      const from={x:shot.x,y:shot.y},to={x:shot.tx,y:shot.ty},d=distance(from,to),step=shot.speed*dt;
      const arrived=d<=step+.15;
      shot.angle=Math.atan2(to.y-from.y,to.x-from.x);shot.life-=dt;if(shot.life<=0)continue;
      const next=arrived?to:{x:from.x+Math.cos(shot.angle)*step,y:from.y+Math.sin(shot.angle)*step};
      if(['bolt','ice'].includes(shot.kind)&&!this.clearShot(from,next)){shot.life=0;continue;}
      Object.assign(shot,next);
      if(shot.kind==='blade'){
        shot.hitIds ||= new Set();
        if(shot.enemy){if(!shot.hitIds.has('player')&&segmentDistance(p,from,next)<.45){shot.hitIds.add('player');this.hurt(shot.damage);}}
        else for(const e of this.enemies)if(e.hp>0&&!e.dormant&&this.enemyAwake(e)&&eligible(e)&&!shot.hitIds.has(e.id)&&segmentDistance(e,from,next)<.5){shot.hitIds.add(e.id);this.hitEnemy(e,shot.power&&e.id!==shot.powerTarget?shot.splashDamage:shot.damage,'boomerang');if(shot.power)this.effects.push({type:'power-hit',x:e.x,y:e.y,life:.4,max:.4});}
        if(arrived){if(shot.returning)shot.life=0;else{shot.returning=true;shot.target=null;shot.hitIds=new Set();shot.life=5;shot.damage*=.65;shot.splashDamage*=.65;const endpoint=shot.enemy?source:p;shot.tx=endpoint.x;shot.ty=endpoint.y;}}
        continue;
      }
      if(!arrived)continue;
      shot.life=0;
      if(shot.power)this.effects.push({type:'power-hit',x:shot.x,y:shot.y,weapon:shot.style||shot.kind,life:.5,max:.5});
      if(shot.enemy){
        const radius=shot.radius??.8;
        if(['rocket','meteor'].includes(shot.kind))this.burst(shot.x,shot.y,radius,'explosion');
        if(shot.kind==='ice')this.burst(shot.x,shot.y,radius,'frost');
        if(distance(p,shot)<radius)this.hurt(shot.damage);
      }else if(shot.kind==='rocket'||shot.kind==='meteor'){
        const nova=shot.style==='supernova',radius=nova?2.4:shot.kind==='meteor'?2.8:2;
        const limit=this.attackLimit({range:shot.playerRange??stats(this.save).weapon.range});
        if(nova)this.effects.push({type:'nova',x:shot.x,y:shot.y,radius,limit,life:.65,max:.65});
        else this.burst(shot.x,shot.y,shot.kind==='meteor'?2.3:1.4,'explosion',limit);this.shake=5;
        for(const e of this.enemies)if(e.hp>0&&distance(e,shot)<radius&&this.enemyAwake(e)&&eligible(e))this.hitEnemy(e,shot.power&&e.id!==shot.powerTarget?shot.splashDamage:shot.damage);
        this.emit('explosion');
      }else if(shot.kind==='ice'){
        for(const e of this.enemies)if(e.hp>0&&distance(e,shot)<1.2&&this.enemyAwake(e)&&eligible(e)&&this.clearShot(shot,e)){e.frozen=e.type==='boss'?.4:1.1;this.hitEnemy(e,shot.power&&e.id!==shot.powerTarget?shot.splashDamage:shot.damage,'frost');}
        this.burst(shot.x,shot.y,.7,'frost');
      }else if(target)this.hitEnemy(target,shot.damage);
    }
    this.projectiles=this.projectiles.filter(s=>s.life>0);
  }
  tick(dt){
    if(this.paused)return;dt=Math.max(0,Math.min(dt,.06));this.time+=dt;this.save.playSeconds+=dt;
    const p=this.player,st=stats(this.save);this.routeTimer-=dt;this.tapCd=Math.max(0,this.tapCd-dt);
    for(const key of ['cd','hit','swing','invincible'])p[key]=Math.max(0,p[key]-dt);
    this.boostCd=Math.max(0,this.boostCd-dt);this.boostTime=Math.max(0,this.boostTime-dt);this.shieldCd=Math.max(0,this.shieldCd-dt);this.buddyCd=Math.max(0,this.buddyCd-dt);this.shake=Math.max(0,this.shake-dt*18);
    const target=this.target&&this.enemies.find(e=>e.id===this.target&&e.hp>0);
    if(target){const ready=this.playerCanAttack(target,st.weapon,.9);if(!ready&&this.routeTimer<=0){this.route=pathfind(this.world,this.save,p,target);this.routeTimer=.65;}else if(ready)this.route=[];}
    else if(this.target)this.target=null;
    if(this.route.length){const next=this.route[0],d=distance(p,next),step=st.speed*dt*(this.boostTime>0?1.25:1);if(d<=step){p.x=next.x;p.y=next.y;this.route.shift();}else{const a=Math.atan2(next.y-p.y,next.x-p.x);p.x+=Math.cos(a)*step;p.y+=Math.sin(a)*step;if(!target)p.angle=a;}if(!this.route.length)this.waypoint=null;}
    this.discover();
    if(this.headingHome&&this.isHome()&&!this.route.length){this.headingHome=false;this.player.hp=this.maxHp();this.emit('home-arrived');}
    for(const e of this.enemies)e.active=false;
    this.royals.tick(dt);
    if(this.powerTarget)this.tryPowerAttack();
    const threats=this.enemies.filter(e=>!e.royal&&e.hp>0&&!e.dormant&&e.r<=unlockedRegion(this.save)&&(distance(p,e)<8||e.aggroUntil>this.time)&&this.enemyAwake(e));
    const focus=this.tapSelection||this.target;
    const inRange=[...threats,...this.royals.units.filter(e=>this.royals.awake(e))].filter(e=>this.playerCanAttack(e,st.weapon)).sort((a,b)=>(b.id===focus)-(a.id===focus)||distance(p,a)-distance(p,b));
    if(p.cd<=0&&inRange.length&&!this.safeAt(p))this.attack(inRange[0]);
    if(this.save.build.gadget==='buddy'&&this.buddyCd<=0&&inRange.length&&!this.safeAt(p)){const e=inRange[0];this.buddyCd=1;this.projectiles.push({x:p.x-.6,y:p.y-.6,tx:e.x,ty:e.y,target:e.id,angle:0,speed:11,damage:45*AUTO_DAMAGE,playerRange:st.weapon.range,weaponId:st.weapon.id,kind:'drone',life:3});this.effects.push({type:'drone',x:p.x,y:p.y,tx:e.x,ty:e.y,life:.7,max:.7});}
    for(const e of threats){
      if(e.hp<=0)continue;
      e.frozen=Math.max(0,(e.frozen||0)-dt);e.cd-=dt;e.hit=Math.max(0,e.hit-dt);e.swing=Math.max(0,e.swing-dt);const d=distance(p,e),boss=e.type==='boss';
      e.active=(d<(boss?6.5:3.4)||e.aggroUntil>this.time)&&!this.safeAt(p)&&distance(e,{x:e.homeX,y:e.homeY})<=7;
      if(!e.active){const home={x:e.homeX,y:e.homeY};if(distance(e,home)>.12)this.enemyStep(e,home,dt);continue;}
      const windup=boss&&this.telegraphs.find(a=>a.bossSource===e.id);
      e.angle=windup?(windup.bodyAngle??windup.angle):Math.atan2(p.y-e.y,p.x-e.x);const ranged=['ranged','sentry'].includes(e.type),profile=boss&&bossProfile(e),range=ranged?3.2:boss?(['bumper','hammer'].includes(profile.weapon)?1.6:5):.9;
      if(e.type==='burrow'){
        // The marked point stays fixed throughout the windup, so walking away avoids the hit.
        if(e.cd<=0&&!e.frozen&&distance(p,{x:e.homeX,y:e.homeY})<=7){e.cd=4.6;this.telegraphs.push({x:p.x,y:p.y,radius:.85,damage:e.damage,duration:1.6,life:1.6,burrowSource:e.id});e.swing=.4;this.emit('warning');}
        continue;
      }
      const winding=!!windup;
      const skirmisher=e.encounterRole==='skirmisher';
      // A short, cooldown-limited retreat creates contrast without endless kiting.
      if(skirmisher&&!winding&&!e.frozen&&d<2.6&&this.time>=(e.retreatReady||0)){
        e.retreatUntil=this.time+.65;e.retreatReady=this.time+5;
      }
      const retreating=skirmisher&&!winding&&!e.frozen&&this.time<(e.retreatUntil||0);
      if(retreating)this.enemyStep(e,{x:e.x+(e.x-p.x),y:e.y+(e.y-p.y)},dt*1.7);
      const blocked=boss?!this.canAttack(e,p,profile.weapon):!this.clearShot(e,p);
      if(!winding&&!retreating&&(d>range||blocked)){const speed=(e.frozen?(boss?.25:0):1)*(skirmisher?1.55:boss?.7:e.type==='tank'||e.type==='carrier'?.72:e.type==='hopper'?1.55:1.05);
        if(!this.enemyStep(e,p,speed*dt)){
          // Follow a grid route around scenery instead of getting stuck behind it.
          if(!e.path||e.pathTime<this.time){e.path=pathfind(this.world,this.save,e,p);e.pathTime=this.time+1.2;}
          const step=e.path?.[0];if(step){this.enemyStep(e,step,speed*dt);if(distance(e,step)<.15)e.path.shift();}
        }
      }
      if(e.cd<=0&&!e.frozen){
        if(boss){if(!winding&&!retreating&&d<=range+.6&&this.canAttack(e,p,profile.weapon))this.warnBoss(e);}
        else if(e.type==='medic'){e.cd=4;for(const n of threats)if(n.hp>0&&n!==e&&n.type!=='boss'&&distance(e,n)<2.5)n.hp=Math.min(n.maxHp,n.hp+18);this.effects.push({type:'frost',x:e.x,y:e.y,radius:1,life:.4,max:.4});}
        else if(d<=range&&this.clearShot(e,p)){e.cd=ranged?2.4:1.8;e.swing=.3;if(ranged){const muzzle=this.firingMuzzle(e,e.type==='sentry'?'rail':'blaster',p,.72,true);this.projectiles.push({x:muzzle.x,y:muzzle.y,tx:p.x,ty:p.y,angle:e.angle,damage:e.damage,kind:'bolt',speed:4,enemy:true,sourceId:e.id,life:3});}else{this.hurt(e.damage);if(item('armor',this.save.build.armor).reflect)this.hitEnemy(e,4);}}
      }
    }
    for(const a of this.telegraphs){
      if(a.bossSource){
        const boss=this.enemies.find(e=>e.id===a.bossSource&&e.hp>0&&this.enemyAwake(e));
        if(!boss||!boss.active||this.safeAt(p)||!boss.royal&&distance(boss,{x:boss.homeX,y:boss.homeY})>7){a.life=0;continue;}
        a.life-=dt;if(a.life<=0&&!boss.frozen)this.releaseBoss(a,boss);continue;
      }
      const burrower=a.burrowSource&&this.enemies.find(e=>e.id===a.burrowSource&&e.hp>0&&!e.dormant&&this.enemyAwake(e));
      if(a.burrowSource&&!burrower){a.life=0;continue;}
      a.life-=dt;if(a.life<=0){
        if(burrower){if(burrower.frozen||distance(a,{x:burrower.homeX,y:burrower.homeY})>7||!canWalk(this.world,this.save,Math.floor(a.x),Math.floor(a.y))||this.safeAt(a))continue;burrower.x=a.x;burrower.y=a.y;burrower.path=null;burrower.swing=.4;}
        this.burst(a.x,a.y,a.radius,'explosion');if(distance(p,a)<a.radius)this.hurt(a.damage);
      }
    }
    this.telegraphs=this.telegraphs.filter(a=>a.life>0);
    this.stepProjectiles(dt);
    for(const e of this.enemies)if(e.spawnParent&&e.dormant&&this.save.kills.includes(e.spawnParent))e.dormant=false;
    const aliveSites=new Map();for(const e of this.enemies)if(e.site&&e.hp>0){let entry=aliveSites.get(e.site);if(!entry)aliveSites.set(e.site,entry={alive:0,first:0,next:[]});entry.alive++;if(e.wave===0)entry.first++;if(e.dormant&&!e.spawnParent)entry.next.push(e);}
    for(const site of this.world.sites){
      if(site.r>unlockedRegion(this.save)||this.save.cleared.includes(site.id)||site.returnId&&!returnActive(this.save,RETURNS.find(m=>m.id===site.returnId)))continue;
      const alive=aliveSites.get(site.id);
      if(!alive?.first){
        const next=alive?.next||[];
        if(next.length){for(const e of next){e.dormant=false;this.burst(e.x,e.y,.35);}if(distance(this.player,site)<8)this.emit('toast',{text:'Another little patrol!'});}
      }
      if(!alive?.alive){
        this.save.cleared.push(site.id);this.save.gears+=2;this.save.scrap+=12+site.r*4;this.burst(site.x,site.y,.9);this.emit('cell',{r:site.r,count:cellsIn(this.save,site.r),returnId:site.returnId});
        if(!site.returnId&&cellsIn(this.save,site.r)===requiredCells(site.r))this.emit('awake',{r:site.r});
      }
    }
    for(const chest of this.world.chests){if(chest.r<=unlockedRegion(this.save)&&!this.save.chests.includes(chest.id)&&distance(p,chest)<(this.save.build.gadget==='vacuum'?4:this.save.build.gadget==='magnet'?2.5:.85)){this.save.chests.push(chest.id);const bonus=8+chest.r*4;this.save.scrap+=bonus;this.save.gears++;this.burst(chest.x,chest.y,.5);this.emit('chest',{scrap:bonus});}}
    if(this.isHome())p.hp=Math.min(st.hp,p.hp+dt*25);
    if(this.charging){const station=this.stationNear();if(!station||station.id!==this.charging||this.route.length)this.charging=null;else{p.hp=Math.min(st.hp,p.hp+dt*st.hp/8*(this.save.build.gadget==='repair'?2:1));if(p.hp>=st.hp){this.charging=null;this.emit('toast',{text:'Fully charged. Ready to roll!'});}}}
    this.effects.forEach(e=>e.life-=dt);this.effects=this.effects.filter(e=>e.life>0);
    this.patrols.tick(dt);
  }
  nearestSite(){const r=unlockedRegion(this.save);return this.world.sites.filter(s=>!s.returnId&&s.r===r&&!this.save.cleared.includes(s.id)).sort((a,b)=>distance(a,this.player)-distance(b,this.player))[0];}
  nextObjective(){if(pantheonUnlocked(this.save))return PANTHEON.viewpoint;const m=RETURNS.find(m=>returnActive(this.save,m));if(m)return this.world.sites.find(s=>s.returnId===m.id&&!this.save.cleared.includes(s.id))||m;const r=unlockedRegion(this.save);return this.nearestSite()||relayFor(r);}
  guideRoute(){
    const route=this.route.length?this.route:this.save.completed&&(!pantheonUnlocked(this.save)||this.save.visited.includes(PANTHEON.r))?[]:pathfind(this.world,this.save,this.player,this.nextObjective());
    return route.length?[this.player,...route]:[];
  }
  goNext(){return this.moveTo(this.nextObjective());}
}
