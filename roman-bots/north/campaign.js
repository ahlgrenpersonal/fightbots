import {Battle,distance,BODY_SPACING} from '../engine.js?v=roman24';
import {WEAPONS,SHIELDS,normalizeSlot} from '../data.js?v=roman24';
import * as NORTH from './world.js?v=roman24';
import * as WEST from './west-world.js?v=roman24';
import * as SOUTH from './south-world.js?v=roman24';
import * as EAST from './east-world.js?v=roman24';
import {Trial,ARENA_ENTRANCE,CITY_EXIT,PROLOGUE_ROUNDS,earnedCount,inArena,cityPoint} from './prologue.js?v=roman24';

const clamp=(n,a,b)=>Math.max(a,Math.min(b,n));
const number=(n,a,b,f=a)=>Number.isFinite(n)?clamp(n,a,b):f;
const integer=(n,a,b,f=a)=>Math.floor(number(n,a,b,f));
const point=p=>p&&Number.isFinite(p.x)&&Number.isFinite(p.y);
const worlds={north:NORTH,west:WEST,south:SOUTH,east:EAST};
const allCamps=()=>Object.values(worlds).flatMap(w=>w.CAMPS);
const allEncounters=()=>Object.values(worlds).flatMap(w=>w.ENCOUNTERS);
export const WEST_GATE=Object.freeze({x:6,y:138});
export const SOUTH_DOCK=Object.freeze({x:16,y:144});
export const EAST_DOCK=Object.freeze({x:46,y:133});
export const RETURN_POINTS=Object.freeze({west:Object.freeze({x:83.5,y:150}),south:Object.freeze({x:42,y:7.5}),east:Object.freeze({x:38.5,y:174})});
const defaults=()=>[{weapon:'sword',shield:'tower'},{weapon:'hammer',shield:'none'},{weapon:'bow',shield:'none'},{weapon:'sword',shield:'round'},{weapon:'spear',shield:'none'}];
const GREEK_SQUADS={
  phalanx:[{weapon:'sword',shield:'tower'},{weapon:'sword',shield:'round'},{weapon:'spear',shield:'none'},{weapon:'bow',shield:'none'},{weapon:'hammer',shield:'none'}],
  skirmish:[{weapon:'sword',shield:'round'},{weapon:'sword',shield:'round'},{weapon:'bow',shield:'none'},{weapon:'bow',shield:'none'},{weapon:'spear',shield:'none'}],
  breakers:[{weapon:'sword',shield:'round'},{weapon:'hammer',shield:'none'},{weapon:'sword',shield:'round'},{weapon:'hammer',shield:'none'},{weapon:'bow',shield:'none'}]
};
export const UPGRADE_PRICES=Object.freeze({weapon:[100,240,420],armor:[80,200,360],utility:[120,260]});
function cleanSave(saved){
  const s=saved&&typeof saved==='object'?saved:{};
  const world=Object.hasOwn(worlds,s.region)?worlds[s.region]:NORTH;
  const ids=new Set(allEncounters().map(e=>e.id));
  const completed=[...new Set(Array.isArray(s.completed)?s.completed.filter(id=>ids.has(id)):[])];
  const camps=[...new Set(Array.isArray(s.camps)?s.camps.filter(id=>allCamps().some(c=>c.id===id)):[])];
  const prologueRound=integer(s.prologueRound,0,15,s.version===1?15:0);
  const region=prologueRound>=PROLOGUE_ROUNDS&&['west','south','east'].includes(s.region)?s.region:'north';
  const voyage=prologueRound>=PROLOGUE_ROUNDS&&((region==='north'&&['south','east'].includes(s.voyage?.to))||(['south','east'].includes(region)&&s.voyage?.to==='north'))?{to:s.voyage.to,remaining:number(s.voyage.remaining,0,14,14)}:null;
  return {version:4,region,voyage,prologueRound,squad:defaults().map((slot,i)=>normalizeSlot(Array.isArray(s.squad)?s.squad[i]||slot:slot)),squadSize:s.squadSize===5?5:3,
    weaponTier:integer(s.weaponTier,0,3),armorTier:integer(s.armorTier,0,3),utility:s.utility==='charge'?'charge':'repair',utilityTier:integer(s.utilityTier,0,2),
    coins:integer(s.coins,0,100000),camps,refuges:[...new Set([...camps,...(Array.isArray(s.refuges)?s.refuges.filter(id=>allCamps().some(c=>c.id===id)):[])])],completed,conquered:NORTH.CAMPS.every(c=>camps.includes(c.id))&&completed.includes('north-king'),westConquered:WEST.CAMPS.every(c=>camps.includes(c.id))&&completed.includes(WEST.ENCOUNTERS.find(e=>e.kind==='boss')?.id),southConquered:SOUTH.CAMPS.every(c=>camps.includes(c.id))&&completed.includes(SOUTH.ENCOUNTERS.find(e=>e.kind==='boss')?.id),eastConquered:EAST.CAMPS.every(c=>camps.includes(c.id))&&completed.includes('east-king'),
    position:point(s.position)?{x:number(s.position.x,.5,world.WIDTH-.5),y:number(s.position.y,.5,world.HEIGHT-.5)}:{...world.HOME},
    health:Array.from({length:5},(_,i)=>number(Array.isArray(s.health)?s.health[i]:undefined,0,1,1)),utilityLeft:integer(s.utilityLeft,0,1+integer(s.utilityTier,0,2),1+integer(s.utilityTier,0,2)),utilityCd:number(s.utilityCd,0,45),chargeTime:number(s.chargeTime,0,20),recoveries:integer(s.recoveries,0,100000)};
}

// Battle remains the sole owner of strikes, guard arcs, shield interception,
// projectiles, initiative, formations and body separation.
export class Campaign extends Battle {
  constructor(saved=null,{onEvent=()=>{},seed=1729}={}){
    const state=cleanSave(saved),world=worlds[state.region];
    super(state.squad,defaults(),{seed:Number.isFinite(seed)?seed:1729,healthBonus:50,onEvent,bounds:{minX:.5,maxX:world.WIDTH-.5,minY:.5,maxY:world.HEIGHT-.5}});
    this.state=state;this.trial=null;this.celebrationTime=0;this.phase='battle';this.units=this.units.filter(u=>u.team===0&&u.index<this.earnedCount);
    this.activeEncounter=null;this.wave=0;this.waveAt=null;this.travelGoal=null;this.paths=new Map();this.utilityCd=state.utilityCd;this.chargeTime=state.chargeTime;this.serial=0;
    for(const u of this.units){this.configureAlly(u);u.hp=u.maxHp*(state.health[u.index]??1);}
    const requested=this.prologueComplete?state.position:cityPoint(state.position);
    let start=this.validPosition(requested)?{x:requested.x,y:requested.y}:this.world.nearestWalkable(requested)||this.world.HOME;
    if(!this.prologueComplete)start=cityPoint(start);
    this.state.position={x:start.x,y:start.y};this.placeSquad(start);
    if(!this.alive(0).length)this.recover();
    this.activeId=this.leader()?.id;this.refreshPartners();
    // Reloading an unfinished fight retries it; no wave rewards are retained.
  }
  checkFinished(){}
  get world(){return worlds[this.state?.region]||NORTH;}
  get western(){return this.state?.region==='west';}
  get southern(){return this.state?.region==='south';}
  get eastern(){return this.state?.region==='east';}
  get voyage(){return this.state?.voyage;}
  get regionComplete(){return this.eastern?this.state.eastConquered:this.southern?this.state.southConquered:this.western?this.state.westConquered:this.state.conquered;}
  get frontier(){return this.state.region==='north'&&this.state.conquered?(!this.state.westConquered?WEST_GATE:!this.state.southConquered?SOUTH_DOCK:!this.state.eastConquered?EAST_DOCK:this.world.HOME):this.world.HOME;}
  get sealsReady(){return this.world.CAMPS.every(c=>this.state.camps.includes(c.id));}
  interactionSites(){
    const sites=[{...this.world.HOME,action:'workshop'},...this.world.CAMPS.map(c=>({...c,action:'rest'}))];
    if(!this.prologueComplete)return sites;
    if(this.state.region==='north')return [...sites,{...WEST_GATE,id:'west-gate',action:'gate'},{...SOUTH_DOCK,id:'south-dock',action:'ship',boat:{x:16,y:148.1}},{...EAST_DOCK,id:'east-dock',action:'ship',boat:{x:49.5,y:133}}];
    return [...sites,{...RETURN_POINTS[this.state.region],id:'return',action:this.western?'gate':'ship',boat:this.southern?{x:42,y:1.85}:this.eastern?{x:30,y:180}:null}];
  }
  approachPoint(p){
    if(this.trial||!point(p))return p;
    // Tapping a pictured boat means walking to its quay, not into the water.
    const ports=this.interactionSites().filter(s=>s.action==='gate'||s.action==='ship');
    return ports.find(s=>s.boat&&distance(s.boat,p)<2.9)||ports.find(s=>distance(s,p)<1.8)||p;
  }
  arriveAtPlace(){
    if(!this.arrivalIntent||this.paused||this.trial||this.voyage||this.activeEncounter)return false;
    const leader=this.leader();if(!leader)return false;
    const site=this.interactionSites().find(s=>distance(s,this.arrivalIntent)<1.25&&distance(s,leader)<1.65);
    if(!site)return false;
    if(site.action==='gate')return this.crossGate();
    if(site.action==='ship')return this.boardShip();
    if(!this.restAt(site.id))return false;
    if(site.action==='workshop')this.emit('workshop',{id:site.id});
    return true;
  }
  safe(x,y){return this.world.isSafe({x,y});}
  crossGate(){
    if(this.southern||this.eastern||this.voyage)return false;
    const gate=this.western?this.world.HOME:WEST_GATE;
    if(this.paused||this.trial||!this.prologueComplete||this.activeEncounter||!this.leader()||distance(this.leader(),gate)>3)return false;
    const region=this.western?'north':'west';
    this.enterRegion(region,region==='west'?WEST.HOME:WEST_GATE);return true;
  }
  enterRegion(region,arrival){
    this.arrivalIntent=null;
    this.state.region=region;
    this.bounds={minX:.5,maxX:this.world.WIDTH-.5,minY:.5,maxY:this.world.HEIGHT-.5};
    this.travelGoal=null;this.goal=null;this.focus=null;this.pendingPower=null;this.focusOwner=null;this.pendingOwner=null;
    this.units=this.units.filter(u=>u.team===0);this.projectiles=[];this.effects=[];this.paths.clear();
    this.placeSquad(arrival);
    this.state.position={x:this.leader().x,y:this.leader().y};
    this.emit('region',{region:this.state.region});
  }
  boardShip(){
    const away=this.southern||this.eastern,greekDock=distance(this.leader()||this.world.HOME,EAST_DOCK)<=3;
    const dock=away?this.world.HOME:greekDock?EAST_DOCK:SOUTH_DOCK;
    if(this.paused||this.trial||this.western||this.voyage||!this.prologueComplete||this.activeEncounter||!this.leader()||distance(this.leader(),dock)>3)return false;
    this.arrivalIntent=null;
    this.state.voyage={to:away?'north':greekDock?'east':'south',remaining:14};this.travelGoal=null;this.goal=null;this.focus=null;this.pendingPower=null;this.focusOwner=null;this.pendingOwner=null;this.paths.clear();
    for(const u of this.units){u.action=null;u.target=null;u.retreat=null;}
    this.emit('voyage',{to:this.state.voyage.to});return true;
  }
  boundX(v){const x=super.boundX(v);return this.state&&!this.prologueComplete?clamp(x,5,47):x;}
  boundY(v){const y=super.boundY(v);return this.state&&!this.prologueComplete?clamp(y,132,145.5):y;}
  get prologueComplete(){return this.state.prologueRound>=PROLOGUE_ROUNDS;}
  get earnedCount(){return this.prologueComplete?this.state.squadSize:earnedCount(this.state.prologueRound);}
  enterArena(){
    const leader=this.leader();
    if(this.paused||this.trial||this.prologueComplete||this.activeEncounter||!leader||!(distance(leader,ARENA_ENTRANCE)<=3||inArena(leader)))return false;
    this.trialFinishElapsed=0;
    this.arrivalIntent=null;
    this.cityUnits=this.units.filter(u=>u.team===0);
    this.travelGoal=null;this.paths.clear();this.chargeTime=0;this.utilityCd=0;
    this.state.utilityLeft=1+this.state.utilityTier;
    this.trial=new Trial(this.state.prologueRound,this.state.squad,{seed:this.seed,onEvent:event=>{
      if(event.type==='finished'){
        this.syncTrial();
        this.emit('trialFinished',{won:event.winner===0,round:this.trial.round});
      }else this.onEvent(event);
    }});
    this.syncTrial();return true;
  }
  syncTrial(){
    if(!this.trial)return;
    // The city/renderer clock continues across rounds; Battle owns fight time.
    for(const key of ['units','projectiles','effects','powerCd','phase','winner','ready','activeId','focus','pendingPower','focusOwner','pendingOwner','goal','headings','metrics'])this[key]=this.trial[key];
  }
  finishTrialRound(){
    if(this.paused||this.trial?.phase!=='finished')return false;
    const {round,winner}=this.trial,won=winner===0,previous=this.earnedCount;
    if(won)this.state.prologueRound=round+1;
    this.trial=null;this.units=this.cityUnits;this.cityUnits=null;
    const factory=new Battle(this.state.squad,defaults(),{seed:this.seed,healthBonus:50,bounds:this.bounds});
    for(const template of factory.units.filter(u=>u.team===0&&u.index<this.earnedCount)){
      if(!this.units.some(u=>u.index===template.index)){this.configureAlly(template);this.units.push(template);}
    }
    this.phase='battle';this.winner=null;this.projectiles=[];this.effects=[];this.powerCd=0;
    this.goal=null;this.travelGoal=null;this.focus=null;this.pendingPower=null;this.focusOwner=null;this.pendingOwner=null;this.chargeTime=0;this.utilityCd=0;
    this.state.utilityLeft=1+this.state.utilityTier;this.state.health.fill(1);
    for(const u of this.units){u.hp=u.maxHp;u.cd=0;u.action=null;u.stun=0;u.guardBroken=0;u.retreat=null;u.buddy=null;}
    this.placeSquad(CITY_EXIT);this.syncActive();this.refreshPartners();
    this.state.position={...CITY_EXIT};
    if(won&&this.prologueComplete){this.celebrationTime=8;this.emit('hero',{round});}
    else if(won&&this.earnedCount>previous)this.emit('promoted',{round,companion:this.earnedCount-1});
    return won;
  }
  get packs(){return this.state.utilityLeft;}
  get cooldown(){return this.utilityCd;}
  setUtility(id){
    if(!['repair','charge'].includes(id))return false;
    this.state.utility=id;return true;
  }
  configureAlly(u){
    const ratio=u.maxHp?u.hp/u.maxHp:1;
    u.maxHp=(WEAPONS[u.weapon].hp+SHIELDS[u.shield].hp)*1.8*(u.captain?1.35:1)*1.5*(1+this.state.armorTier*.22);
    u.hp=u.maxHp*ratio;
  }
  validPosition(p,team=0){return point(p)&&this.world.passable(p.x,p.y)&&(team!==0||this.prologueComplete||p.x>=5&&p.x<=47&&p.y>=132&&p.y<=145.5)&&(team===0||!this.safe(p.x,p.y));}
  clearLine(a,b){
    if(!point(a)||!point(b)||!this.world.passable(a.x,a.y)||!this.world.passable(b.x,b.y))return false;
    // Traverse exact cell crossings: fixed-distance samples can miss a thin
    // forest corner and repeatedly choose an impossible movement shortcut.
    const dx=b.x-a.x,dy=b.y-a.y;
    let tx=dx>0?(Math.floor(a.x)+1-a.x)/dx:dx<0?(Math.floor(a.x)-a.x)/dx:Infinity;
    let ty=dy>0?(Math.floor(a.y)+1-a.y)/dy:dy<0?(Math.floor(a.y)-a.y)/dy:Infinity;
    let t=0;
    while(t<1){
      const next=Math.min(tx,ty,1),mid=(t+next)/2;
      if(next-t>1e-10&&!this.world.passable(a.x+dx*mid,a.y+dy*mid))return false;
      if(next===1)break;
      if(Math.abs(tx-next)<1e-10)tx+=1/Math.abs(dx);
      if(Math.abs(ty-next)<1e-10)ty+=1/Math.abs(dy);
      t=next;
    }
    return true;
  }
  placeSquad(center){
    if(!this.prologueComplete)center=cityPoint(center);
    const captain=this.leader();if(!captain)return;
    Object.assign(captain,{x:center.x,y:center.y,action:null,target:null,retreat:null});
    const placed=[captain],safe=this.safe(center.x,center.y);
    for(const [i,u]of this.alive(0).filter(u=>u!==captain).entries()){
      const preferred={x:center.x+(i%2?1:-1)*1.5,y:center.y+(i<2?1:-1)*1.1};
      const candidates=[preferred];
      for(let y=-9;y<=9;y++)for(let x=-9;x<=9;x++)candidates.push({x:center.x+x*.75,y:center.y+y*.75});
      const rank=p=>distance(p,preferred)+(safe&&!this.safe(p.x,p.y)?20:0);
      candidates.sort((a,b)=>rank(a)-rank(b));
      const p=candidates.find(p=>{if(!this.validPosition(p)||placed.some(v=>distance(p,v)<BODY_SPACING+.04))return false;const path=this.world.findPath(center,p);return path.length>0&&path.length<=10;});
      // Objective clearings fit the entire squad; never overlap the saved
      // captain and then rely on body separation to push that anchor elsewhere.
      if(!p){this.placeSquad(this.world.HOME);return;}
      Object.assign(u,p,{action:null,target:null,retreat:null});placed.push(u);
    }
  }
  separateBodies(){
    // Super's constructor calls this before campaign state exists.
    if(!this.state)return super.separateBodies();
    const before=this.units.map(u=>({x:u.x,y:u.y}));
    super.separateBodies();
    this.units.forEach((u,i)=>{if(!this.validPosition(u,u.team))Object.assign(u,before[i]);});
  }
  slotFor(u){
    if(!this.state)return super.slotFor(u);
    const buddy=this.units.find(v=>v.id===u.buddy&&v.hp>0);
    if(buddy&&!this.travelGoal&&this.alive(1-u.team).some(v=>distance(u,v)<6&&this.clearLine(u,v)))return super.slotFor(u);
    const leader=this.leader(u.team);if(!leader||leader===u)return {x:u.x,y:u.y};
    if(this.travelGoal&&distance(u,leader)>4)return {x:leader.x,y:leader.y};
    const a=leader.angle,side=(u.index%2?1:-1)*1.5,back=1.6+Math.floor((u.index-1)/2)*1.5;
    const slot={x:this.boundX(leader.x-Math.cos(a)*back-Math.sin(a)*side),y:this.boundY(leader.y-Math.sin(a)*back+Math.cos(a)*side)};
    if(this.travelGoal&&!this.world.passable(slot.x,slot.y)){
      const nearby=this.world.nearestWalkable(slot);
      // At a switchback, an off-road slot can lie farther away than the
      // regroup leash. Follow the captain through the bend instead.
      return nearby&&distance(nearby,leader)<3.6?nearby:{x:leader.x,y:leader.y};
    }
    return slot;
  }
  walk(u,to,dt){
    if(!point(to)||dt<=0)return;
    if(u.team===0&&!this.prologueComplete)to=cityPoint(to);
    let destination={x:this.boundX(to.x),y:this.boundY(to.y)};
    if(this.eastern&&u.team===1&&this.activeEncounter){
      const anchor=this.activeEncounter,d=distance(destination,anchor);
      if(d>7.5)destination={x:anchor.x+(destination.x-anchor.x)*7.5/d,y:anchor.y+(destination.y-anchor.y)*7.5/d};
    }
    if(!this.validPosition(destination,u.team))destination=this.world.nearestWalkable(destination);
    if(!destination||!this.validPosition(destination,u.team))return;
    let cached=this.paths?.get(u.id);
    if(!this.clearLine(u,destination)){
      const key=`${Math.floor(destination.x)},${Math.floor(destination.y)}`;
      if(!cached||cached.key!==key||this.time-cached.at>1){cached={key,at:this.time,points:this.world.findPath(u,destination)||[]};this.paths?.set(u.id,cached);}
      while(cached.points.length&&distance(u,cached.points[0])<.25)cached.points.shift();
      if(!cached.points.length)return;
      // A cell-center waypoint must not pin a fighter behind a companion.
      // Prune visible path corners before shared body-avoidance chooses a step.
      while(cached.points.length>1&&distance(u,cached.points[1])<3&&this.clearLine(u,cached.points[1]))cached.points.shift();
      destination=cached.points[0];
    }
    if(this.travelGoal&&u.team===0){
      const around=super.pursuitPoint(u,destination);
      if(this.validPosition(around,u.team)&&this.clearLine(u,around))destination=around;
    }
    const before={x:u.x,y:u.y};
    super.walk(u,destination,dt);
    if(!this.validPosition(u,u.team)||!this.clearLine(before,u)){Object.assign(u,before);u.moving=false;this.paths?.delete(u.id);}
  }
  pickTarget(u){
    if(this.travelGoal&&u.team===0&&(u===this.leader()||distance(u,this.leader())>5))return null;
    if(u.team===0&&this.safe(u.x,u.y))return null;
    // Once a Greek patrol has engaged, short bow/spear backsteps must not leave
    // both sides idle just beyond the initial six-unit aggro boundary.
    const aggro=this.eastern&&this.activeEncounter?10:6;
    const near=this.alive(1-u.team).filter(v=>distance(u,v)<aggro&&!this.safe(v.x,v.y));
    let valid=near.filter(v=>this.clearLine(u,v));
    if(!valid.length&&this.eastern&&this.activeEncounter&&distance(u,this.activeEncounter)<12){
      // Continue a local fight around a short corner, never across the world.
      // Only movement may use this path; every attack still checks sight.
      valid=near.filter(v=>{if(distance(v,this.activeEncounter)>10)return false;const path=this.world.findPath(u,v);return path.length>0&&path.length<=14;});
    }
    if(!valid.length)return null;
    // Reuse shared partner/focus scoring, restricted to visible aggro candidates.
    const original=this.units;
    this.units=original.filter(v=>v.team===u.team||valid.includes(v));
    try{return super.pickTarget(u);}finally{this.units=original;}
  }
  bowTarget(u){
    const target=super.bowTarget(u);
    return target&&!this.safe(target.x,target.y)&&this.clearLine(u,target)?target:null;
  }
  startAttack(u,target,power=false){
    if(distance(u,target)>4.1||this.safe(target.x,target.y)||this.safe(u.x,u.y)||!this.clearLine(u,target)||this.travelGoal&&u.team===0&&(u===this.leader()||distance(u,this.leader())>5))return;
    super.startAttack(u,target,power);
  }
  resolveAttack(u){
    const target=this.units.find(v=>v.id===u.action?.target&&v.hp>0);
    if(!target||distance(u,target)>4.1||!this.clearLine(u,target)||this.safe(u.x,u.y)||this.safe(target.x,target.y))return;
    super.resolveAttack(u);
  }
  hit(attacker,target,power=false,projectile=false,source=attacker){
    if(this.safe(target.x,target.y)||this.safe(attacker.x,attacker.y)||!this.clearLine(source,target))return;
    if(!projectile&&distance(attacker,target)>Math.min(4.1,WEAPONS[attacker.weapon].range+.12))return;
    const old={x:target.x,y:target.y};
    super.hit(attacker,target,power,projectile,source);
    if(!this.validPosition(target,target.team))Object.assign(target,old);
  }
  damageMultiplier(attacker){return attacker.team===0?(1+this.state.weaponTier*.25)*(this.chargeTime>0?2:1):attacker.damageScale??.55;}
  moveTo(p){
    if(this.voyage||this.paused)return false;
    if(this.trial){if(!point(p)||this.paused)return false;const result=this.trial.moveTo(p);this.syncTrial();return result;}
    if(!point(p)||!this.leader())return false;
    p=this.approachPoint(p);
    if(!this.prologueComplete)p=cityPoint(p);
    let destination=this.world.nearestWalkable({x:this.boundX(p.x),y:this.boundY(p.y)});
    if(destination&&!this.prologueComplete)destination=cityPoint(destination);
    if(!point(destination))return false;
    this.arrivalIntent={...destination};
    this.travelGoal={x:destination.x,y:destination.y};this.goal=this.travelGoal;this.focus=null;this.pendingPower=null;this.focusOwner=null;this.pendingOwner=null;this.paths.clear();
    for(const u of this.alive(0)){u.action=null;u.target=null;u.retreat=null;}
    return true;
  }
  tapEnemy(enemy){
    if(this.voyage)return false;
    this.arrivalIntent=null;
    if(this.trial){if(this.paused||!this.trial.units.includes(enemy))return false;const result=this.trial.tapEnemy(enemy);this.syncTrial();return result;}
    if(!enemy||!this.units.includes(enemy)||enemy.hp<=0||enemy.team!==1||this.safe(enemy.x,enemy.y))return false;
    this.travelGoal=null;return super.tapEnemy(enemy);
  }
  tryPower(){
    if(this.trial){if(this.paused)return false;const result=this.trial.tryPower();this.syncTrial();return result;}
    if(!this.state)return false;
    const leader=this.leader(),target=this.units.find(u=>u.id===this.pendingPower&&u.hp>0);
    if(!leader||!target||this.travelGoal||this.safe(leader.x,leader.y)||this.safe(target.x,target.y)||!this.clearLine(leader,target))return false;
    return super.tryPower();
  }
  beginEncounter(e){
    if(this.voyage||this.trial||!this.prologueComplete)return false;
    e=this.world.ENCOUNTERS.find(candidate=>candidate.id===e?.id);if(!e)return false;
    if(this.activeEncounter||this.state.completed.includes(e.id))return false;
    if(e.kind==='boss'&&!this.sealsReady)return false;
    // An ambush interrupts a long journey once. Subsequent ground orders are
    // deliberate squad retreats and remain in force throughout this encounter.
    this.travelGoal=null;this.goal=null;this.focus=null;this.pendingPower=null;this.focusOwner=null;this.pendingOwner=null;this.paths.clear();
    for(const u of this.alive(0)){u.retreat=null;u.target=null;}
    this.activeEncounter=e;this.wave=0;this.waveAt=null;this.spawnWave();return true;
  }
  spawnWave(){
    const e=this.activeEncounter;if(!e)return;
    this.units=this.units.filter(u=>u.team===0);this.projectiles=[];this.wave++;this.paths.clear();
    const kingWave=e.kind==='boss'&&this.wave===integer(e.waves,2,3,3);
    const count=kingWave?3:integer(e.count,5,6,5),stage=integer(e.stage,0,4);
    const roster=this.eastern?(GREEK_SQUADS[e.roster]||GREEK_SQUADS.phalanx):Array.from({length:5},(_,i)=>this.southern?{weapon:i===0?'bow':i===2?'spear':i===4?'hammer':'sword',shield:i===1?'round':i===3&&e.kind==='elite'?'tower':'none'}:this.western?{weapon:i===0?'bow':i===2?'spear':i===4?'hammer':'sword',shield:i===1?'round':'none'}:{weapon:i%3===0?'bow':'sword',shield:'none'});
    const factory=new Battle(this.state.squad,roster,{seed:this.seed,healthBonus:0,bounds:this.bounds});
    const templates=factory.units.filter(u=>u.team===1);
    for(let i=0;i<count;i++){
      const u={...templates[i%5],id:`forest-${++this.serial}`,index:i,captain:i===0,boss:kingWave&&i===0,buddy:null,action:null,target:null};
      u.champion=(this.southern||this.eastern)&&!kingWave&&this.wave===e.waves&&i<(e.champions||0);
      if(u.champion)Object.assign(u,normalizeSlot(i===0?{weapon:'hammer',shield:'none'}:{weapon:'bow',shield:'none'}));
      if(kingWave)Object.assign(u,normalizeSlot(i===0?{weapon:this.eastern?'spear':'hammer',shield:'none'}:i===1?{weapon:'sword',shield:this.western||this.southern||this.eastern?'tower':'none'}:{weapon:'bow',shield:'none'}));
      const a=i/count*Math.PI*2,p=this.world.nearestWalkable({x:this.boundX(e.x+Math.cos(a)*2.3),y:this.boundY(e.y+Math.sin(a)*2.3)})||e;
      if(!this.validPosition(p,1))continue;
      Object.assign(u,{x:p.x,y:p.y});
      u.maxHp=u.boss?WEAPONS[u.weapon].hp*(1+stage*.18)*10:WEAPONS[u.weapon].hp*.58*(1+stage*.22)*(e.kind==='boss'&&!kingWave?1.8:1);if(this.western||this.southern)u.maxHp*=1.15;if(this.eastern)u.maxHp*=1.25;u.hp=u.maxHp;
      if(u.champion){u.maxHp*=3.2;u.hp=u.maxHp;}
      u.damageScale=u.boss?.60:.24+stage*.035;u.forestWeapon=u.weapon;this.units.push(u);
    }
    this.refreshPartners();this.separateBodies();
  }
  finishEncounter(){
    const e=this.activeEncounter;if(!e)return;
    if(!this.state.completed.includes(e.id)){
      this.state.completed.push(e.id);const reward=integer(e.reward,0,500,35+integer(e.stage,0,3)*15);this.state.coins=Math.min(100000,this.state.coins+reward);
      this.emit('cleared',{id:e.id,reward});
      if(e.kind==='boss'){this.state[this.eastern?'eastConquered':this.southern?'southConquered':this.western?'westConquered':'conquered']=true;this.emit('complete',{id:e.id,region:this.state.region});}
    }
    this.activeEncounter=null;this.waveAt=null;this.units=this.units.filter(u=>u.team===0);this.projectiles=[];
  }
  abandonEncounter(){
    if(!this.activeEncounter)return;
    // Preserve the player's retreat and persistent health, never partial rewards.
    this.activeEncounter=null;this.wave=0;this.waveAt=null;this.units=this.units.filter(u=>u.team===0);this.projectiles=[];this.paths.clear();
    this.focus=null;this.pendingPower=null;this.focusOwner=null;this.pendingOwner=null;
    for(const u of this.units){u.action=null;u.target=null;u.retreat=null;u.buddy=null;}
    this.refreshPartners();
  }
  nearestCamp(){
    const p=this.leader()||this.state.position||this.world.HOME;
    return [this.world.HOME,...this.world.CAMPS.filter(c=>this.state.refuges.includes(c.id))].sort((a,b)=>distance(a,p)-distance(b,p))[0];
  }
  recover(){
    this.arrivalIntent=null;
    const camp=this.nearestCamp();this.units=this.units.filter(u=>u.team===0);this.activeEncounter=null;this.waveAt=null;this.travelGoal=null;this.goal=null;this.focus=null;this.pendingPower=null;this.focusOwner=null;this.pendingOwner=null;this.projectiles=[];this.effects=[];this.chargeTime=0;this.paths?.clear();
    for(const u of this.units){u.hp=u.maxHp;u.action=null;u.stun=0;u.guardBroken=0;}
    this.state.utilityLeft=1+this.state.utilityTier;this.utilityCd=0;
    this.placeSquad(camp);this.state.recoveries++;this.syncActive();this.emit('recovered',{id:camp.id});
  }
  nearbyCamp(){
    if(this.trial||this.voyage)return null;
    const leader=this.leader();if(!leader||!this.safe(leader.x,leader.y))return null;
    return [this.world.HOME,...this.world.CAMPS].find(c=>distance(c,leader)<3.5)||null;
  }
  campStatus(id){
    const stage=this.world.CAMPS.findIndex(c=>c.id===id);if(stage<0)return null;
    const required=this.world.CAMPS[stage].required||[];
    const cleared=required.length?required.filter(id=>this.state.completed.includes(id)).length:this.world.ENCOUNTERS.filter(e=>e.stage===stage&&e.kind!=='boss'&&this.state.completed.includes(e.id)).length;
    return {cleared,required:required.length,ready:required.every(id=>this.state.completed.includes(id)),activated:this.state.camps.includes(id)};
  }
  restAt(id){
    const camp=this.nearbyCamp();if(!camp||camp.id!==id)return false;
    this.arrivalIntent=null;
    this.travelGoal=null;this.goal=null;this.focus=null;this.pendingPower=null;this.focusOwner=null;this.pendingOwner=null;this.paths.clear();
    for(const u of this.units.filter(u=>u.team===0)){u.hp=u.maxHp;u.action=null;u.guardBroken=0;u.stun=0;}
    this.state.utilityLeft=1+this.state.utilityTier;this.utilityCd=0;this.chargeTime=0;
    this.placeSquad(camp);this.syncActive();this.emit('rest',{id});return true;
  }
  setLoadout(index,slot){
    if(this.nearbyCamp()?.id!=='home'||!Number.isInteger(index)||index<0||index>=5||!slot||!Object.hasOwn(WEAPONS,slot.weapon)||!Object.hasOwn(SHIELDS,slot.shield))return false;
    this.state.squad[index]=normalizeSlot(slot);
    const u=this.units.find(u=>u.team===0&&u.index===index);if(u){Object.assign(u,this.state.squad[index],{action:null});this.configureAlly(u);}
    this.refreshPartners();return true;
  }
  upgrade(category){
    const camp=this.nearbyCamp(),fieldForge=this.eastern&&camp&&this.state.refuges.includes(camp.id);
    if(camp?.id!=='home'&&!fieldForge||!Object.hasOwn(UPGRADE_PRICES,category))return false;
    const key=`${category}Tier`,cost=UPGRADE_PRICES[category][this.state[key]];
    if(cost===undefined||this.state.coins<cost)return false;
    this.state.coins-=cost;this.state[key]++;
    if(category==='armor')for(const u of this.units.filter(u=>u.team===0))this.configureAlly(u);
    this.emit('upgrade',{category,tier:this.state[key],cost});return true;
  }
  setSquadSize(size){
    if(![3,5].includes(size)||this.nearbyCamp()?.id!=='home')return false;
    if(!this.prologueComplete){this.state.squadSize=size;return true;}
    if(size===this.state.squadSize)return true;
    // Do not allow dismiss/recruit to revive damaged companions for free.
    const health=this.state.health;for(const u of this.units.filter(u=>u.team===0))health[u.index]=u.hp/u.maxHp;
    if(size===3)this.units=this.units.filter(u=>u.team===1||u.index<3);
    else{
      const factory=new Battle(this.state.squad,defaults(),{seed:this.seed,healthBonus:50,bounds:this.bounds});
      for(const template of factory.units.filter(u=>u.team===0&&u.index>=3)){const u={...template};this.configureAlly(u);u.hp=u.maxHp*(health[u.index]??1);this.units.push(u);}
    }
    this.state.squadSize=size;this.placeSquad(this.nearbyCamp()||this.world.HOME);this.refreshPartners();return true;
  }
  useUtility(){
    if(this.voyage)return false;
    if(this.trial&&this.trial.phase!=='battle')return false;
    if(this.utilityCd>0||this.state.utility==='repair'&&this.state.utilityLeft<=0||!this.leader()||this.paused)return false;
    if(this.state.utility==='repair'&&!this.alive(0).some(u=>u.hp<u.maxHp))return false;
    const tier=this.state.utilityTier;this.utilityCd=this.state.utility==='repair'?12:45-tier*7;
    if(this.state.utility==='repair'){
      this.state.utilityLeft--;
      for(const u of this.alive(0)){u.hp=Math.min(u.maxHp,u.hp+u.maxHp*(.18+tier*.07));this.effects.push({type:'repair',x:u.x,y:u.y,life:1,max:1});}
    }
    else{this.chargeTime=20;this.powerCd=0;if(this.trial)this.trial.powerCd=0;for(const u of this.alive(0)){u.cd=0;u.guardBroken=0;}}
    return true;
  }
  tick(dt){
    if(this.paused||!Number.isFinite(dt)||dt<=0)return;dt=Math.min(dt,.05);
    if(this.voyage){this.time+=dt;this.voyage.remaining=Math.max(0,this.voyage.remaining-dt);if(this.voyage.remaining===0){const region=this.voyage.to,arrival=region==='south'?SOUTH.HOME:region==='east'?EAST.HOME:this.eastern?EAST_DOCK:SOUTH_DOCK;this.state.voyage=null;this.enterRegion(region,arrival);}return;}
    if(this.trial){this.time+=dt;this.utilityCd=Math.max(0,this.utilityCd-dt);this.chargeTime=Math.max(0,this.chargeTime-dt);this.trial.chargeTime=this.chargeTime;this.trial.paused=this.paused;this.trial.tick(dt);this.syncTrial();if(this.trial.phase==='finished'){this.trialFinishElapsed=(this.trialFinishElapsed||0)+dt;if(this.trialFinishElapsed>=1.8)this.finishTrialRound();}return;}
    const visitor=this.leader();
    if(!this.prologueComplete&&visitor&&(distance(visitor,ARENA_ENTRANCE)<1.5||inArena(visitor)&&visitor.x>=34)){this.enterArena();return;}
    this.celebrationTime=Math.max(0,this.celebrationTime-dt);
    this.utilityCd=Math.max(0,this.utilityCd-dt);
    this.chargeTime=Math.max(0,this.chargeTime-dt);
    for(const u of this.alive(1).filter(u=>u.forestWeapon==='bow')){
      const close=this.alive(0).some(v=>distance(u,v)<1.8),weapon=close?'sword':'bow';
      if(u.weapon!==weapon){u.weapon=weapon;u.action=null;}
    }
    // Terrain also intercepts shared homing arrows before the next physics step.
    this.projectiles=this.projectiles.filter(s=>{const t=this.units.find(u=>u.id===s.target&&u.hp>0);return t&&!this.safe(t.x,t.y)&&this.clearLine(s,t);});
    super.tick(dt);
    if(!this.alive(0).length){this.recover();return;}
    const leader=this.leader();
    if(this.travelGoal){
      // Different forest branches can give a slower companion a longer route.
      // Regroup during peaceful travel; never hold up an active combat retreat.
      const regroup=!this.activeEncounter&&this.alive(0).some(u=>u!==leader&&distance(u,leader)>(this.state.squadSize===5?6.5:4.5));
      for(const u of this.alive(0)){
        if(u===leader&&regroup)continue;
        if(u!==leader&&this.activeEncounter&&distance(u,leader)<=5&&(u.action||this.pickTarget(u)))continue;
        if(u!==leader&&distance(u,leader)>5){u.action=null;u.target=null;}
        this.walk(u,u===leader?this.travelGoal:this.slotFor(u),dt);
      }
      if(distance(leader,this.travelGoal)<.3){this.travelGoal=null;this.goal=null;}else this.goal=this.travelGoal;
    }else{
      if(this.eastern&&this.activeEncounter)for(const u of [...this.alive(0),...this.alive(1)]){
        const target=this.units.find(v=>v.id===u.target&&v.hp>0&&v.team!==u.team);
        if(target&&!this.safe(u.x,u.y)&&!this.safe(target.x,target.y)&&!u.moving&&!u.action&&!this.clearLine(u,target)&&distance(u,target)<10){
          const path=this.world.findPath(u,target);
          if(path.length>0&&path.length<=14)this.walk(u,target,dt);
        }
      }
      const focused=this.units.find(u=>u.id===this.focus&&u.team===1&&u.hp>0);
      // Explicit enemy taps may seek around trees; automatic aggro still needs
      // sight. Never take a second movement step or move during an attack.
      if(focused&&!leader.moving&&!leader.action&&distance(leader,focused)<12&&!this.safe(focused.x,focused.y)&&(distance(leader,focused)>WEAPONS[leader.weapon].range||!this.clearLine(leader,focused)))this.walk(leader,focused,dt);
      for(const u of this.alive(0))if(u!==leader&&!this.pickTarget(u)&&distance(u,leader)>2)this.walk(u,this.slotFor(u),dt);
    }
    this.separateBodies();
    if(this.activeEncounter&&(distance(leader,this.activeEncounter)>12||this.safe(leader.x,leader.y))){this.abandonEncounter();return;}
    if(this.arriveAtPlace())return;
    for(const camp of this.world.CAMPS)if(distance(leader,camp)<3&&this.safe(leader.x,leader.y)){
      if(!this.state.refuges.includes(camp.id)){this.state.refuges.push(camp.id);this.emit('refuge',{id:camp.id});}
      if(!this.state.camps.includes(camp.id)&&this.campStatus(camp.id).ready){this.state.camps.push(camp.id);this.emit('camp',{id:camp.id});}
    }
    if(this.activeEncounter){
      if(!this.alive(1).length){
        if(this.wave>=integer(this.activeEncounter.waves,2,3,2))this.finishEncounter();
        else if(this.waveAt===null)this.waveAt=this.time+2.5;
        else if(this.time>=this.waveAt&&distance(leader,this.activeEncounter)<8&&!this.safe(leader.x,leader.y)){this.waveAt=null;this.spawnWave();}
      }
    }else{
      const e=this.world.ENCOUNTERS.find(e=>!this.state.completed.includes(e.id)&&distance(leader,e)<5.5&&(e.kind!=='boss'||this.sealsReady));
      if(e&&!this.safe(leader.x,leader.y))this.beginEncounter(e);
    }
  }
  serialize(){
    if(this.trial)return {...cleanSave({...this.state,position:ARENA_ENTRANCE,health:[1,1,1,1,1],utilityLeft:1+this.state.utilityTier,utilityCd:0,chargeTime:0}),squad:this.state.squad.map(s=>({...s})),health:[1,1,1,1,1]};
    const leader=this.leader();if(leader)this.state.position={x:leader.x,y:leader.y};
    for(const u of this.units.filter(u=>u.team===0))this.state.health[u.index]=u.hp/u.maxHp;
    return {...cleanSave({...this.state,utilityCd:this.utilityCd,chargeTime:this.chargeTime}),squad:this.state.squad.map(s=>({...s})),health:[...this.state.health]};
  }
}
