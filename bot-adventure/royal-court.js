import {PANTHEON,COURT,ROYAL_SPECS,inRoyalChamber} from './pantheon.js?v=world86';
import {pantheonUnlocked,canWalk,pathfind,regionAt} from './data.js?v=world86';
const distance=(a,b)=>Math.hypot(a.x-b.x,a.y-b.y);
const inside=p=>regionAt(p.x,p.y)===PANTHEON.r&&p.y>=229&&p.y<259;
const finite=(v,fallback)=>Number.isFinite(v)?v:fallback;
export class RoyalCourt {
  constructor(game){
    this.game=game;this.inspect=0;this.transition=0;this.healClock=0;this.openedAt=-10;
    const old=game.save.royalCourt;
    this.phase=pantheonUnlocked(game.save)&&['guards','awakening','regents','victory'].includes(old?.phase)?old.phase:'sleeping';
    this.rallying=this.phase==='guards'&&old?.rallying!==false;
    this.units=COURT.map((p,i)=>{
      const spec=ROYAL_SPECS[p.role],record=old?.mobs?.find(e=>e.id===p.id);
      return {...p,r:PANTHEON.r,royal:true,type:'boss',name:spec.name,weapon:spec.weapon,pattern:spec.pattern,homeX:p.x,homeY:p.y,
        hp:Math.max(0,Math.min(spec.hp,record?finite(record.hp,spec.hp/(old.endurance===2?1:2))*(old.endurance===2?1:2):spec.hp)),maxHp:spec.hp,damage:spec.damage,cd:2+i*.45,hit:0,swing:0,angle:Math.PI/2,
        weapon:p.role==='guard'&&i%2?'saw':spec.weapon,enteredArena:record?.enteredArena===true||record?.y>=254,flanked:record?.flanked===true,
        x:finite(record?.x,p.x),y:finite(record?.y,p.y),active:false,frozen:0};
    });
    if(this.phase==='sleeping')for(const e of this.units){const p=COURT.find(p=>p.id===e.id);Object.assign(e,{x:p.x,y:p.y,hp:e.maxHp});}
    if(this.phase==='guards'||this.phase==='awakening')for(const e of this.units)if(e.role!=='guard')e.hp=e.maxHp;
    if(this.phase!=='sleeping')this.openTerrain();
    for(const e of this.units){
      if(!canWalk(game.world,game.save,Math.floor(e.x),Math.floor(e.y))||!inside(e)){
        const p=COURT.find(p=>p.id===e.id);e.x=p.x;e.y=p.y;
      }
    }
    if(this.phase==='awakening')this.transition=3;
    if(this.phase!=='sleeping'&&this.phase!=='victory')game.enemies.push(...this.units);
    this.normalizePhase();
    this.prepareRematch();
  }
  prepareRematch(){
    const g=this.game;
    if(this.phase!=='victory'||!g.save.returns.includes('copper-twins')||g.save.royalRematchStarted)return false;
    g.save.royalRematchStarted=true;
    this.phase='sleeping';this.inspect=0;this.transition=0;this.healClock=0;this.rallying=false;this.openedAt=-10;
    g.enemies=g.enemies.filter(e=>!e.royal);g.projectiles=g.projectiles.filter(e=>!e.royal);g.telegraphs=g.telegraphs.filter(e=>!e.royal);
    for(const [i,e] of this.units.entries()){const p=COURT.find(p=>p.id===e.id);Object.assign(e,{x:p.x,y:p.y,hp:e.maxHp,angle:Math.PI/2,active:false,enteredArena:false,flanked:false,path:null,frozen:0,hit:0,swing:0,cd:2+i*.45});}
    for(const key of g.world.courtSeal)g.world.blocks.add(key);
    for(const keys of g.world.courtPlinths.values())for(const key of keys)g.world.blocks.add(key);
    this.snapshot();return true;
  }
  get sealed(){return this.phase==='sleeping';}
  get active(){return ['guards','awakening','regents'].includes(this.phase);}
  get observing(){return this.sealed&&pantheonUnlocked(this.game.save)&&distance(this.game.player,PANTHEON.stairTop)<2.2;}
  get ready(){return this.observing&&this.inspect>=5;}
  awake(e){return e.royal&&e.hp>0&&(this.phase==='guards'?e.role==='guard':this.phase==='regents'&&e.role!=='guard');}
  safeAt(p){return !this.active||p.y<229;}
  figures(){return this.units.filter(e=>e.hp>0&&this.phase!=='victory').map(e=>({...e,awake:this.awake(e),moving:e.active&&e.path?.length>0,healing:this.awake(e)&&e.role!=='guard'&&e.hp<e.maxHp,charging:this.game.telegraphs.some(a=>a.bossSource===e.id)}));}
  openTerrain(){
    const w=this.game.world;for(const key of w.courtSeal)w.blocks.delete(key);
    for(const e of this.units)if(e.role==='guard'||this.phase!=='guards')for(const key of w.courtPlinths.get(e.id)||[])w.blocks.delete(key);
  }
  start(){
    if(!this.ready)return false;
    this.phase='guards';this.rallying=true;this.openedAt=this.game.time;this.openTerrain();this.game.enemies.push(...this.units);
    this.game.route=[];this.game.target=null;this.game.waypoint=null;this.game.player.invincible=Math.max(2,this.game.player.invincible);
    this.game.moveTo(PANTHEON.viewpoint);
    this.game.effects.push({type:'nova',x:162.5,y:246.5,radius:2.5,life:1.2,max:1.2});
    this.game.emit('royal-stage',{phase:'guards'});this.snapshot();return true;
  }
  normalizePhase(){
    if(this.phase==='guards'&&this.units.filter(e=>e.role==='guard').every(e=>e.hp<=0)){
      this.phase='awakening';this.transition=3;this.game.telegraphs=this.game.telegraphs.filter(a=>!this.units.some(e=>e.id===a.bossSource));
      this.game.emit('royal-stage',{phase:'awakening'});
    }
    if(this.phase==='regents'&&this.units.filter(e=>e.role!=='guard').every(e=>e.hp<=0)){
      this.phase='victory';this.game.save.scrap+=250;this.game.save.gears+=12;
      this.game.projectiles=this.game.projectiles.filter(p=>!p.royal);this.game.telegraphs=this.game.telegraphs.filter(a=>!a.royal);
      this.game.effects.push({type:'nova',x:162.5,y:251.5,radius:5,life:2,max:2});this.game.emit('royal-victory');
    }
  }
  defeated(e){
    this.game.save.totalBots++;this.game.save.scrap+=e.role==='guard'?20:60;
    this.game.burst(e.x,e.y,e.role==='guard'?1.2:2,'explosion');this.game.emit('defeat',{boss:true});this.normalizePhase();this.snapshot();
  }
  hud(){
    if(!this.active||regionAt(this.game.player.x,this.game.player.y)!==PANTHEON.r)return null;
    const units=this.units.filter(e=>this.phase==='guards'?e.role==='guard':e.role!=='guard');
    return {name:this.phase==='guards'?`Royal Guardians · ${units.filter(e=>e.hp>0).length} / 4`:this.phase==='awakening'?'The king and queen are awakening…':'The Robot King & Crystal Queen',health:units.reduce((s,e)=>s+e.hp,0)/units.reduce((s,e)=>s+e.maxHp,0)};
  }
  snapshot(){
    if(this.phase==='sleeping'){delete this.game.save.royalCourt;return;}
    this.game.save.royalCourt={endurance:2,phase:this.phase,rallying:this.rallying,mobs:this.units.map(e=>({id:e.id,x:e.x,y:e.y,hp:e.hp,enteredArena:e.enteredArena,flanked:e.flanked}))};
  }
  muzzle(e,side=0){
    const size=e.size/80,a=e.angle??Math.PI/2;
    if(e.role==='king'){const rotation=a-Math.PI/2;return {x:e.x+(side||1)*41*size-Math.sin(rotation)*31*size,y:e.y-2*size+Math.cos(rotation)*31*size};}
    if(e.role==='queen')return {x:e.x+45*size,y:e.y-49*size};
    return {x:e.x+Math.cos(a)*.65,y:e.y+Math.sin(a)*.65};
  }
  warn(e){
    const g=this.game,spec={...ROYAL_SPECS[e.role],weapon:e.weapon},p=g.player;
    e.cd=e.weapon==='saw'?3:spec.interval;e.angle=Math.atan2(p.y-e.y,p.x-e.x);const from=this.muzzle(e);
    const sources=e.role==='king'?[-1,1].map(side=>this.muzzle(e,side)):[from];
    for(const source of sources)g.telegraphs.push({x:p.x,y:p.y,ox:source.x,oy:source.y,angle:Math.atan2(p.y-source.y,p.x-source.x),bodyAngle:e.angle,
      radius:e.role==='queen'?.48:e.role==='guard'?1.1:1.25,damage:e.weapon==='saw'?22:spec.damage,duration:e.role==='guard'?1.25:2,life:e.role==='guard'?1.25:2,bossSource:e.id,weapon:spec.weapon,pattern:spec.pattern,royal:true});
    g.emit('warning');
  }
  move(e,to,step){
    const g=this.game,d=distance(e,to);if(d<.03)return false;
    const angle=Math.atan2(to.y-e.y,to.x-e.x);
    // Steer around allies rather than deadlocking on a shared grid waypoint.
    for(const turn of [0,.65,-.65,1.1,-1.1]){
      const next={x:e.x+Math.cos(angle+turn)*Math.min(step,d),y:e.y+Math.sin(angle+turn)*Math.min(step,d)};
      if(!inside(next)||!canWalk(g.world,g.save,Math.floor(next.x),Math.floor(next.y))||!g.clearShot(e,next))continue;
      if(this.units.some(n=>n!==e&&n.hp>0&&this.awake(n)&&distance(next,n)<(e.role==='guard'&&n.role==='guard'?.65:1.25)&&distance(next,n)<distance(e,n)))continue;
      Object.assign(e,next);return true;
    }return false;
  }
  tick(dt){
    const g=this.game;
    if(this.sealed){this.inspect=this.observing?Math.min(5,this.inspect+dt):0;return;}
    if(this.phase==='awakening'){
      this.transition=Math.max(0,this.transition-dt);
      if(this.transition===0){this.phase='regents';this.openTerrain();for(const e of this.units)if(e.role!=='guard'){e.cd=2;g.effects.push({type:'nova',x:e.x,y:e.y,radius:e.size,life:1.3,max:1.3});}g.emit('royal-stage',{phase:'regents'});this.snapshot();}
      return;
    }
    if(!this.active)return;
    this.healClock+=dt;const showHeal=this.healClock>=2;if(showHeal)this.healClock=0;
    for(const e of this.units){
      e.active=false;if(!this.awake(e))continue;const spec=ROYAL_SPECS[e.role];
      e.hit=Math.max(0,e.hit-dt);e.swing=Math.max(0,e.swing-dt);e.frozen=Math.max(0,(e.frozen||0)-dt);e.cd=Math.max(0,e.cd-dt);
      if(spec.heal&&e.hp<e.maxHp){e.hp=Math.min(e.maxHp,e.hp+spec.heal*dt);if(showHeal&&inside(g.player))g.number(e.x,e.y-e.size*.55,`+${Math.round(spec.heal*2)}`,'#a8f2b7');}
      if(!inside(g.player)||g.safeAt(g.player))continue;
      e.active=true;const winding=g.telegraphs.some(a=>a.bossSource===e.id),d=distance(e,g.player);
      if(!winding)e.angle=Math.atan2(g.player.y-e.y,g.player.x-e.x);
      if(e.y>=254)e.enteredArena=true;
      const rally=this.rallying&&e.role==='guard';
      const descending=!rally&&!e.enteredArena&&g.player.y>=247;
      const flankGoal={x:e.role==='king'?157.5:167.5,y:256.5};
      if(distance(e,flankGoal)<.5)e.flanked=true;
      const flanking=e.role!=='guard'&&e.enteredArena&&!e.flanked&&g.player.y>=247;
      const lane=e.role==='guard'?(e.id.endsWith('ne')||e.id.endsWith('se')?.7:-.7):e.role==='king'?-.85:.85;
      const rallyGoal={x:lane>0?163.5:161.5,y:e.id.endsWith('nw')||e.id.endsWith('ne')?244.5:245.5};
      const goal=rally?rallyGoal:descending?{x:162.5+lane,y:255.5}:flanking?flankGoal:g.player;
      if(!winding&&(rally?distance(e,rallyGoal)>.18:descending||flanking||d>spec.range)){
        const speed=rally?3.1:descending&&e.role==='guard'?2.5:spec.speed;
        if(!rally&&!descending&&this.move(e,goal,speed*dt*(e.frozen?.3:1)))e.path=null;
        else{
          if(!e.path||e.pathTime<g.time){e.path=pathfind(g.world,g.save,e,goal);e.pathTime=g.time+.7;}
          const next=e.path?.[0];if(next){if(this.move(e,next,speed*dt*(e.frozen?.3:1))&&distance(e,next)<.16)e.path.shift();}
          else this.move(e,goal,speed*dt);
        }
      }
      if(!rally&&(!descending||e.role!=='guard')&&!winding&&!e.frozen&&e.cd<=0&&d<=spec.range+.25)this.warn(e);
    }
    if(this.rallying&&this.units.filter(e=>e.role==='guard'&&e.hp>0).every(e=>distance(e,{x:e.id.endsWith('ne')||e.id.endsWith('se')?163.5:161.5,y:e.id.endsWith('nw')||e.id.endsWith('ne')?244.5:245.5})<.3)){this.rallying=false;for(const e of this.units)e.path=null;g.emit('toast',{text:'The four sentinels charge!'});}
  }
}
