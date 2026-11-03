import {Battle,distance} from '../engine.js?v=roman16';
import {WEAPONS,SHIELDS,normalizeSlot} from '../data.js?v=roman16';
import {WIDTH,HEIGHT,HOME,CAMPS,ENCOUNTERS,passable,findPath,nearestWalkable,isSafe as worldSafe} from './world.js?v=roman16';

const clamp=(n,a,b)=>Math.max(a,Math.min(b,n));
const number=(n,a,b,f=a)=>Number.isFinite(n)?clamp(n,a,b):f;
const integer=(n,a,b,f=a)=>Math.floor(number(n,a,b,f));
const point=p=>p&&Number.isFinite(p.x)&&Number.isFinite(p.y);
const isSafe=(x,y)=>worldSafe({x,y});
const defaults=()=>[{weapon:'sword',shield:'tower'},{weapon:'hammer',shield:'none'},{weapon:'bow',shield:'none'},{weapon:'sword',shield:'round'},{weapon:'spear',shield:'none'}];
export const UPGRADE_PRICES=Object.freeze({weapon:[100,240,420],armor:[80,200,360],utility:[120,260]});
const home={...HOME,id:'home'};
const encounters=()=>ENCOUNTERS;
function cleanSave(saved){
  const s=saved&&typeof saved==='object'?saved:{};
  const ids=new Set(encounters().map(e=>e.id));
  const completed=[...new Set(Array.isArray(s.completed)?s.completed.filter(id=>ids.has(id)):[])];
  const camps=[...new Set(Array.isArray(s.camps)?s.camps.filter(id=>CAMPS.some(c=>c.id===id)):[])];
  return {version:1,squad:defaults().map((slot,i)=>normalizeSlot(Array.isArray(s.squad)?s.squad[i]||slot:slot)),squadSize:s.squadSize===5?5:3,
    weaponTier:integer(s.weaponTier,0,3),armorTier:integer(s.armorTier,0,3),utility:s.utility==='charge'?'charge':'repair',utilityTier:integer(s.utilityTier,0,2),
    coins:integer(s.coins,0,100000),camps,completed,conquered:camps.length===CAMPS.length&&completed.includes(encounters().find(e=>e.kind==='boss')?.id),
    position:point(s.position)?{x:number(s.position.x,.5,WIDTH-.5),y:number(s.position.y,.5,HEIGHT-.5)}:{x:HOME.x,y:HOME.y},
    health:Array.from({length:5},(_,i)=>number(Array.isArray(s.health)?s.health[i]:undefined,0,1,1)),utilityLeft:integer(s.utilityLeft,0,1+integer(s.utilityTier,0,2),1+integer(s.utilityTier,0,2)),utilityCd:number(s.utilityCd,0,45),chargeTime:number(s.chargeTime,0,20),recoveries:integer(s.recoveries,0,100000)};
}

// Battle remains the sole owner of strikes, guard arcs, shield interception,
// projectiles, initiative, formations and body separation.
export class Campaign extends Battle {
  constructor(saved=null,{onEvent=()=>{},seed=1729}={}){
    const state=cleanSave(saved);
    super(state.squad,defaults(),{seed:Number.isFinite(seed)?seed:1729,healthBonus:50,onEvent,bounds:{minX:.5,maxX:WIDTH-.5,minY:.5,maxY:HEIGHT-.5}});
    this.state=state;this.phase='battle';this.units=this.units.filter(u=>u.team===0&&u.index<state.squadSize);
    this.activeEncounter=null;this.wave=0;this.waveAt=null;this.travelGoal=null;this.paths=new Map();this.utilityCd=state.utilityCd;this.chargeTime=state.chargeTime;this.serial=0;
    const start=nearestWalkable(state.position)||HOME;
    this.placeSquad(start);
    for(const u of this.units){this.configureAlly(u);u.hp=u.maxHp*(state.health[u.index]??1);}
    if(!this.alive(0).length)this.recover();
    this.activeId=this.leader()?.id;this.refreshPartners();
    // Reloading an unfinished fight retries it; no wave rewards are retained.
  }
  checkFinished(){}
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
  validPosition(p,team=0){return point(p)&&passable(p.x,p.y)&&(team===0||!isSafe(p.x,p.y));}
  clearLine(a,b){
    if(!point(a)||!point(b)||!passable(a.x,a.y)||!passable(b.x,b.y))return false;
    // Traverse exact cell crossings: fixed-distance samples can miss a thin
    // forest corner and repeatedly choose an impossible movement shortcut.
    const dx=b.x-a.x,dy=b.y-a.y;
    let tx=dx>0?(Math.floor(a.x)+1-a.x)/dx:dx<0?(Math.floor(a.x)-a.x)/dx:Infinity;
    let ty=dy>0?(Math.floor(a.y)+1-a.y)/dy:dy<0?(Math.floor(a.y)-a.y)/dy:Infinity;
    let t=0;
    while(t<1){
      const next=Math.min(tx,ty,1),mid=(t+next)/2;
      if(!passable(a.x+dx*mid,a.y+dy*mid))return false;
      if(next===1)break;
      if(tx===next)tx+=1/Math.abs(dx);
      if(ty===next)ty+=1/Math.abs(dy);
      t=next;
    }
    return true;
  }
  placeSquad(center){
    this.alive(0).forEach((u,i)=>{const p=nearestWalkable({x:center.x+(i%3-1)*1.5,y:center.y+Math.floor(i/3)*1.5})||center;Object.assign(u,p,{action:null,target:null,retreat:null});});
    const captain=this.leader();if(captain)Object.assign(captain,{x:center.x,y:center.y});
    this.separateBodies();
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
    const a=leader.angle,side=(u.index%2?1:-1)*1.5,back=1.6+Math.floor((u.index-1)/2)*1.5;
    return {x:this.boundX(leader.x-Math.cos(a)*back-Math.sin(a)*side),y:this.boundY(leader.y-Math.sin(a)*back+Math.cos(a)*side)};
  }
  walk(u,to,dt){
    if(!point(to)||dt<=0)return;
    let destination={x:this.boundX(to.x),y:this.boundY(to.y)};
    if(!this.validPosition(destination,u.team))destination=nearestWalkable(destination);
    if(!destination||!this.validPosition(destination,u.team))return;
    let cached=this.paths?.get(u.id);
    if(!this.clearLine(u,destination)){
      const key=`${Math.floor(destination.x)},${Math.floor(destination.y)}`;
      if(!cached||cached.key!==key||this.time-cached.at>1){cached={key,at:this.time,points:findPath(u,destination)||[]};this.paths?.set(u.id,cached);}
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
    if(this.travelGoal&&u.team===0)return null;
    if(u.team===0&&isSafe(u.x,u.y))return null;
    const valid=this.alive(1-u.team).filter(v=>distance(u,v)<6&&!isSafe(v.x,v.y)&&this.clearLine(u,v));
    if(!valid.length)return null;
    // Reuse shared partner/focus scoring, restricted to visible aggro candidates.
    const original=this.units;
    this.units=original.filter(v=>v.team===u.team||valid.includes(v));
    try{return super.pickTarget(u);}finally{this.units=original;}
  }
  bowTarget(u){
    const target=super.bowTarget(u);
    return target&&!isSafe(target.x,target.y)&&this.clearLine(u,target)?target:null;
  }
  startAttack(u,target,power=false){
    if(distance(u,target)>4.1||isSafe(target.x,target.y)||isSafe(u.x,u.y)||!this.clearLine(u,target)||this.travelGoal&&u.team===0)return;
    super.startAttack(u,target,power);
  }
  resolveAttack(u){
    const target=this.units.find(v=>v.id===u.action?.target&&v.hp>0);
    if(!target||distance(u,target)>4.1||!this.clearLine(u,target)||isSafe(u.x,u.y)||isSafe(target.x,target.y))return;
    super.resolveAttack(u);
  }
  hit(attacker,target,power=false,projectile=false,source=attacker){
    if(isSafe(target.x,target.y)||isSafe(attacker.x,attacker.y)||!this.clearLine(source,target))return;
    if(!projectile&&distance(attacker,target)>Math.min(4.1,WEAPONS[attacker.weapon].range+.12))return;
    const old={x:target.x,y:target.y};
    super.hit(attacker,target,power,projectile,source);
    if(!this.validPosition(target,target.team))Object.assign(target,old);
  }
  damageMultiplier(attacker){return attacker.team===0?(1+this.state.weaponTier*.25)*(this.chargeTime>0?2:1):attacker.damageScale??.55;}
  moveTo(p){
    if(!point(p)||!this.leader())return false;
    const destination=nearestWalkable({x:this.boundX(p.x),y:this.boundY(p.y)});
    if(!point(destination))return false;
    this.travelGoal={x:destination.x,y:destination.y};this.goal=this.travelGoal;this.focus=null;this.pendingPower=null;this.focusOwner=null;this.pendingOwner=null;this.paths.clear();
    for(const u of this.alive(0)){u.action=null;u.target=null;u.retreat=null;}
    return true;
  }
  tapEnemy(enemy){
    if(!enemy||!this.units.includes(enemy)||enemy.hp<=0||enemy.team!==1||isSafe(enemy.x,enemy.y))return false;
    this.travelGoal=null;return super.tapEnemy(enemy);
  }
  tryPower(){
    if(!this.state)return false;
    const leader=this.leader(),target=this.units.find(u=>u.id===this.pendingPower&&u.hp>0);
    if(!leader||!target||this.travelGoal||isSafe(leader.x,leader.y)||isSafe(target.x,target.y)||!this.clearLine(leader,target))return false;
    return super.tryPower();
  }
  beginEncounter(e){
    e=encounters().find(candidate=>candidate.id===e?.id);if(!e)return false;
    if(this.activeEncounter||this.state.completed.includes(e.id))return false;
    if(e.kind==='boss'&&this.state.camps.length<CAMPS.length)return false;
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
    const count=kingWave?3:integer(e.count,5,6,5),stage=integer(e.stage,0,3);
    const roster=Array.from({length:5},(_,i)=>({weapon:i%3===0?'bow':'sword',shield:'none'}));
    const factory=new Battle(this.state.squad,roster,{seed:this.seed,healthBonus:0,bounds:this.bounds});
    const templates=factory.units.filter(u=>u.team===1);
    for(let i=0;i<count;i++){
      const u={...templates[i%5],id:`forest-${++this.serial}`,index:i,captain:i===0,boss:kingWave&&i===0,buddy:null,action:null,target:null};
      if(kingWave)Object.assign(u,normalizeSlot(i===0?{weapon:'hammer',shield:'none'}:i===1?{weapon:'sword',shield:'none'}:{weapon:'bow',shield:'none'}));
      const a=i/count*Math.PI*2,p=nearestWalkable({x:this.boundX(e.x+Math.cos(a)*2.3),y:this.boundY(e.y+Math.sin(a)*2.3)})||e;
      if(!this.validPosition(p,1))continue;
      Object.assign(u,{x:p.x,y:p.y});
      u.maxHp=u.boss?WEAPONS[u.weapon].hp*(1+stage*.18)*10:WEAPONS[u.weapon].hp*.58*(1+stage*.22)*(e.kind==='boss'&&!kingWave?1.8:1);u.hp=u.maxHp;
      u.damageScale=u.boss?.60:.24+stage*.035;u.forestWeapon=u.weapon;this.units.push(u);
    }
    this.refreshPartners();this.separateBodies();
  }
  finishEncounter(){
    const e=this.activeEncounter;if(!e)return;
    if(!this.state.completed.includes(e.id)){
      this.state.completed.push(e.id);const reward=integer(e.reward,0,500,35+integer(e.stage,0,3)*15);this.state.coins=Math.min(100000,this.state.coins+reward);
      this.emit('cleared',{id:e.id,reward});
      if(e.kind==='boss'){this.state.conquered=true;this.emit('complete',{id:e.id});}
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
    const p=this.leader()||this.units.find(u=>u.team===0)||HOME;
    return [home,...CAMPS.filter(c=>this.state.camps.includes(c.id))].sort((a,b)=>distance(a,p)-distance(b,p))[0];
  }
  recover(){
    const camp=this.nearestCamp();this.units=this.units.filter(u=>u.team===0);this.activeEncounter=null;this.waveAt=null;this.travelGoal=null;this.goal=null;this.focus=null;this.pendingPower=null;this.focusOwner=null;this.pendingOwner=null;this.projectiles=[];this.effects=[];this.chargeTime=0;this.paths?.clear();
    for(const u of this.units){u.hp=u.maxHp;u.action=null;u.stun=0;u.guardBroken=0;}
    this.state.utilityLeft=1+this.state.utilityTier;this.utilityCd=0;
    this.placeSquad(camp);this.state.recoveries++;this.syncActive();this.emit('recovered',{id:camp.id});
  }
  nearbyCamp(){
    const leader=this.leader();if(!leader||!isSafe(leader.x,leader.y))return null;
    return [home,...CAMPS.filter(c=>this.state.camps.includes(c.id))].find(c=>distance(c,leader)<3.5)||null;
  }
  campStatus(id){
    const stage=CAMPS.findIndex(c=>c.id===id);if(stage<0)return null;
    const cleared=encounters().filter(e=>e.stage===stage&&e.kind!=='boss'&&this.state.completed.includes(e.id)).length;
    return {cleared,required:0,ready:true,activated:this.state.camps.includes(id)};
  }
  restAt(id){
    const camp=this.nearbyCamp();if(!camp||camp.id!==id)return false;
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
    if(this.nearbyCamp()?.id!=='home'||!Object.hasOwn(UPGRADE_PRICES,category))return false;
    const key=`${category}Tier`,cost=UPGRADE_PRICES[category][this.state[key]];
    if(cost===undefined||this.state.coins<cost)return false;
    this.state.coins-=cost;this.state[key]++;
    if(category==='armor')for(const u of this.units.filter(u=>u.team===0))this.configureAlly(u);
    this.emit('upgrade',{category,tier:this.state[key],cost});return true;
  }
  setSquadSize(size){
    if(![3,5].includes(size)||this.nearbyCamp()?.id!=='home')return false;
    if(size===this.state.squadSize)return true;
    // Do not allow dismiss/recruit to revive damaged companions for free.
    const health=this.state.health;for(const u of this.units.filter(u=>u.team===0))health[u.index]=u.hp/u.maxHp;
    if(size===3)this.units=this.units.filter(u=>u.team===1||u.index<3);
    else{
      const factory=new Battle(this.state.squad,defaults(),{seed:this.seed,healthBonus:50,bounds:this.bounds});
      for(const template of factory.units.filter(u=>u.team===0&&u.index>=3)){const u={...template};this.configureAlly(u);u.hp=u.maxHp*(health[u.index]??1);this.units.push(u);}
    }
    this.state.squadSize=size;this.placeSquad(this.nearbyCamp()||HOME);this.refreshPartners();return true;
  }
  useUtility(){
    if(this.utilityCd>0||this.state.utility==='repair'&&this.state.utilityLeft<=0||!this.leader()||this.paused)return false;
    if(this.state.utility==='repair'&&!this.alive(0).some(u=>u.hp<u.maxHp))return false;
    const tier=this.state.utilityTier;this.utilityCd=this.state.utility==='repair'?12:45-tier*7;
    if(this.state.utility==='repair'){
      this.state.utilityLeft--;
      for(const u of this.alive(0)){u.hp=Math.min(u.maxHp,u.hp+u.maxHp*(.18+tier*.07));this.effects.push({type:'repair',x:u.x,y:u.y,life:1,max:1});}
    }
    else{this.chargeTime=20;this.powerCd=0;for(const u of this.alive(0)){u.cd=0;u.guardBroken=0;}}
    return true;
  }
  tick(dt){
    if(this.paused||!Number.isFinite(dt)||dt<=0)return;dt=Math.min(dt,.05);
    this.utilityCd=Math.max(0,this.utilityCd-dt);
    this.chargeTime=Math.max(0,this.chargeTime-dt);
    for(const u of this.alive(1).filter(u=>u.forestWeapon==='bow')){
      const close=this.alive(0).some(v=>distance(u,v)<1.8),weapon=close?'sword':'bow';
      if(u.weapon!==weapon){u.weapon=weapon;u.action=null;}
    }
    // Terrain also intercepts shared homing arrows before the next physics step.
    this.projectiles=this.projectiles.filter(s=>{const t=this.units.find(u=>u.id===s.target&&u.hp>0);return t&&!isSafe(t.x,t.y)&&this.clearLine(s,t);});
    super.tick(dt);
    if(!this.alive(0).length){this.recover();return;}
    const leader=this.leader();
    if(this.travelGoal){
      // Different forest branches can give a slower companion a longer route.
      // Regroup during peaceful travel; never hold up an active combat retreat.
      const regroup=!this.activeEncounter&&this.alive(0).some(u=>u!==leader&&distance(u,leader)>6);
      for(const u of this.alive(0))if(u!==leader||!regroup)this.walk(u,u===leader?this.travelGoal:this.slotFor(u),dt);
      if(distance(leader,this.travelGoal)<.3){this.travelGoal=null;this.goal=null;}else this.goal=this.travelGoal;
    }else{
      const focused=this.units.find(u=>u.id===this.focus&&u.team===1&&u.hp>0);
      // Explicit enemy taps may seek around trees; automatic aggro still needs
      // sight. Never take a second movement step or move during an attack.
      if(focused&&!leader.moving&&!leader.action&&distance(leader,focused)<12&&!isSafe(focused.x,focused.y)&&(distance(leader,focused)>WEAPONS[leader.weapon].range||!this.clearLine(leader,focused)))this.walk(leader,focused,dt);
      for(const u of this.alive(0))if(u!==leader&&!this.pickTarget(u)&&distance(u,leader)>2)this.walk(u,this.slotFor(u),dt);
    }
    this.separateBodies();
    if(this.activeEncounter&&(distance(leader,this.activeEncounter)>12||isSafe(leader.x,leader.y))){this.abandonEncounter();return;}
    for(const camp of CAMPS)if(!this.state.camps.includes(camp.id)&&distance(leader,camp)<3&&isSafe(leader.x,leader.y)){this.state.camps.push(camp.id);this.emit('camp',{id:camp.id});}
    if(this.activeEncounter){
      if(!this.alive(1).length){
        if(this.wave>=integer(this.activeEncounter.waves,2,3,2))this.finishEncounter();
        else if(this.waveAt===null)this.waveAt=this.time+2.5;
        else if(this.time>=this.waveAt&&distance(leader,this.activeEncounter)<8&&!isSafe(leader.x,leader.y)){this.waveAt=null;this.spawnWave();}
      }
    }else{
      const e=encounters().find(e=>!this.state.completed.includes(e.id)&&distance(leader,e)<5.5&&(e.kind!=='boss'||this.state.camps.length===CAMPS.length));
      if(e&&!isSafe(leader.x,leader.y))this.beginEncounter(e);
    }
  }
  serialize(){
    const leader=this.leader();if(leader)this.state.position={x:leader.x,y:leader.y};
    for(const u of this.units.filter(u=>u.team===0))this.state.health[u.index]=u.hp/u.maxHp;
    return {...cleanSave({...this.state,utilityCd:this.utilityCd,chargeTime:this.chargeTime}),squad:this.state.squad.map(s=>({...s})),health:[...this.state.health]};
  }
}
