import {WEAPONS,SHIELDS,FORMATIONS,normalizeSquad} from './data.js?v=roman08';
import {bowReleasePoint} from './geometry.js?v=roman08';

export const distance=(a,b)=>Math.hypot(a.x-b.x,a.y-b.y);
export const BODY_SPACING=1.4;
export const MELEE_TOLERANCE=.12;
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
const angleDiff=(a,b)=>Math.atan2(Math.sin(a-b),Math.cos(a-b));
export const isGuarding=u=>u.hp>0&&u.shield!=='none'&&u.guardBroken<=0&&(!u.action||u.action.elapsed<u.action.hitTime*.5);
export function guardsAgainst(unit,source){return isGuarding(unit)&&Math.abs(angleDiff(Math.atan2(source.y-unit.y,source.x-unit.x),unit.angle))<SHIELDS[unit.shield].arc;}

export class Battle {
  constructor(squad,opponent,{seed=1,formation='wall',enemyFormation='wall',gentle=true,healthBonus,onEvent=()=>{}}={}){
    this.seed=((seed>>>0)*1664525+1013904223)>>>0;this.onEvent=onEvent;this.time=0;this.phase='ready';this.ready=1.25;this.paused=false;this.winner=null;
    this.formations=[formation,enemyFormation].map(f=>FORMATIONS.includes(f)?f:'wall');this.headings=[-Math.PI/2,Math.PI/2];
    this.goal=null;this.focus=null;this.pendingPower=null;this.powerCd=0;this.effects=[];this.projectiles=[];this.units=[];this.lastHit=0;
    this.metrics={blocks:0,flanks:0,power:0,damage:[0,0],shieldBreaks:0};
    [normalizeSquad(squad),normalizeSquad(opponent)].forEach((slots,team)=>slots.forEach((slot,index)=>{
      const weapon=WEAPONS[slot.weapon],shield=SHIELDS[slot.shield],captain=index===0;
      const assist=[0,15,50,100,200].includes(healthBonus)?1+healthBonus/100:gentle?1.15:1;
      const hp=(weapon.hp+shield.hp)*1.8*(captain?1.35:1)*(team===0?assist:1);
      this.units.push({...slot,id:`${team}-${index}`,team,index,captain,x:5,y:team===0?11.3:3.7,angle:this.headings[team],hp,maxHp:hp,cd:.3+this.random()*.5,action:null,flash:0,blockFlash:0,guardBroken:0,stun:0,retreatCd:0,retreats:0,retreat:null,moving:false,target:null});
    }));
    for(const u of this.units)if(!u.captain)Object.assign(u,this.slotFor(u));
    this.separateBodies();
  }
  random(){let x=this.seed;x^=x<<13;x^=x>>>17;x^=x<<5;this.seed=x>>>0;return this.seed/4294967296;}
  emit(type,data={}){this.onEvent({type,...data});}
  alive(team){return this.units.filter(u=>u.team===team&&u.hp>0);}
  leader(team=0){return this.alive(team).find(u=>u.captain)||this.alive(team)[0];}
  setFormation(id){if(!FORMATIONS.includes(id)||this.phase==='finished')return false;if(this.formations[0]===id)return true;this.formations[0]=id;for(const u of this.alive(0))u.reformUntil=this.time+2.5;this.effects.push({type:'reform',team:0,life:2.5,max:2.5});this.emit('formation',{id});return true;}
  slotFor(unit){
    const leader=this.leader(unit.team);if(!leader||unit===leader)return {x:unit.x,y:unit.y};
    const others=this.alive(unit.team).filter(u=>u!==leader).sort((a,b)=>Number(b.shield==='tower')*3+Number(b.shield==='round')*2-Number(b.weapon==='bow')-(Number(a.shield==='tower')*3+Number(a.shield==='round')*2-Number(a.weapon==='bow'))||a.index-b.index);
    const slots={wall:[[-1.65,0],[1.65,0],[-.85,1.7],[.85,1.7]],wedge:[[-1.15,1.45],[1.15,1.45],[-2.3,2.9],[2.3,2.9]],circle:[[0,-1.8],[1.8,0],[0,1.8],[-1.8,0]]};
    const [side,back]=slots[this.formations[unit.team]][Math.max(0,others.indexOf(unit))],a=this.headings[unit.team];
    return {x:clamp(leader.x-Math.sin(a)*side-Math.cos(a)*back,1,9),y:clamp(leader.y+Math.cos(a)*side-Math.sin(a)*back,2.25,13.25)};
  }
  moveTo(point){if(this.phase==='finished')return false;this.goal={x:clamp(point.x,1,9),y:clamp(point.y,2.25,13.25)};this.focus=null;this.pendingPower=null;return true;}
  enemyAt(point,tile=40){
    const foes=this.alive(1),body=foes.filter(u=>Math.abs(u.x-point.x)<=(u.captain?.47:.38)&&point.y>=u.y-(u.captain?.88:u.weapon==='spear'?.97:.73)&&point.y<=u.y+.43);
    // Upright sprites overlap: the front robot's helmet covers the rear one's feet.
    if(body.length)return body.sort((a,b)=>b.y-a.y)[0];
    return foes.map(u=>({u,d:distance({x:u.x,y:u.y-.18},point)})).filter(p=>p.d<.48+18/Math.max(1,tile)).sort((a,b)=>a.d-b.d)[0]?.u;
  }
  tapEnemy(enemy){
    if(this.paused||this.phase==='finished'||!enemy||enemy.hp<=0||enemy.team!==1)return false;
    this.focus=enemy.id;this.goal=null;this.pendingPower=enemy.id;
    return this.tryPower();
  }
  tryPower(){
    const leader=this.leader(),enemy=this.units.find(u=>u.id===this.pendingPower&&u.hp>0);if(!leader||!enemy||this.powerCd>0||this.phase!=='battle')return false;
    if(distance(leader,enemy)>WEAPONS[leader.weapon].range)return false;
    if(leader.action?.hit)return false;
    this.pendingPower=null;this.powerCd=1.2;this.metrics.power++;
    if(leader.action){leader.action.power=true;leader.action.target=enemy.id;leader.angle=Math.atan2(enemy.y-leader.y,enemy.x-leader.x);this.emit('windup',{weapon:leader.weapon,power:true});}
    else this.startAttack(leader,enemy,true);
    return true;
  }
  startAttack(unit,target,power=false){
    const w=WEAPONS[unit.weapon];unit.angle=Math.atan2(target.y-unit.y,target.x-unit.x);
    unit.action={elapsed:0,duration:w.windup+w.recovery,hitTime:w.windup,target:target.id,power,hit:false};unit.cd=w.rate*(power?.85:1)*(unit.shield==='tower'?1.2:1)*(.92+this.random()*.16);unit.moving=false;
    this.emit('windup',{weapon:unit.weapon,power});
  }
  hit(attacker,target,power=false,projectile=false,source=attacker){
    if(target.hp<=0)return;
    const blocked=guardsAgainst(target,source),w=WEAPONS[attacker.weapon];
    let damage=w.damage*(power?1.8:1)*(.96+this.random()*.08);
    if(projectile)damage*=.62;
    if(blocked){damage*=projectile?.065:attacker.weapon==='hammer'?.75:SHIELDS[target.shield].block;target.blockFlash=.26;this.metrics.blocks++;}
    else if(Math.abs(angleDiff(Math.atan2(source.y-target.y,source.x-target.x),target.angle))>2){damage*=1.12;this.metrics.flanks++;}
    if(attacker.weapon==='hammer'||power&&attacker.weapon!=='bow'){
      if(target.shield!=='none'){target.guardBroken=Math.max(target.guardBroken,attacker.weapon==='hammer'?1.65:.7);this.metrics.shieldBreaks++;}
      const a=Math.atan2(target.y-attacker.y,target.x-attacker.x),push=power?.2:.12;
      target.x=clamp(target.x+Math.cos(a)*push,1,9);target.y=clamp(target.y+Math.sin(a)*push,2.25,13.25);
    }
    const dealt=Math.min(target.hp,damage);target.hp=Math.max(0,target.hp-damage);target.flash=blocked?.08:.18;this.metrics.damage[attacker.team]+=dealt;this.lastHit=this.time;
    this.effects.push({type:blocked?'block':attacker.weapon==='hammer'?'hammer':power?'power':'hit',x:target.x,y:target.y,angle:attacker.angle,life:power?.6:.35,max:power?.6:.35,team:attacker.team});
    this.emit(blocked?'block':'hit',{weapon:attacker.weapon,power,team:attacker.team});
    if(target.hp<=0){target.action=null;this.effects.push({type:'repair',x:target.x,y:target.y,life:1,max:1});this.emit('down',{team:target.team});}
  }
  resolveAttack(unit){
    const action=unit.action,target=this.units.find(u=>u.id===action.target&&u.hp>0),w=WEAPONS[unit.weapon];if(!target)return;
    if(distance(unit,target)>w.range+(unit.weapon==='bow'?.38:MELEE_TOLERANCE))return;
    if(unit.weapon==='bow')this.projectiles.push({...bowReleasePoint(unit),target:target.id,owner:unit.id,power:action.power,life:1.2});
    else{action.contact={x:target.x,y:target.y,angle:target.angle,shield:target.shield,guarding:guardsAgainst(target,unit),action:target.action?{elapsed:target.action.elapsed,hitTime:target.action.hitTime,duration:target.action.duration}:null};this.hit(unit,target,action.power);}
  }
  pickTarget(unit){
    const foes=this.alive(1-unit.team),focus=unit.team===0&&unit===this.leader()?this.units.find(u=>u.id===this.focus&&u.hp>0):null;if(focus)return focus;
    const slot=this.slotFor(unit),score=target=>distance(unit,target)+distance(slot,target)*.4+this.alive(unit.team).filter(u=>u!==unit&&u.target===target.id).length*.3-(unit.weapon==='bow'&&target.shield==='none'?.4:0)-(unit.team===0&&target.id===this.focus&&distance(slot,target)<WEAPONS[unit.weapon].range+1.15?.8:0);
    return foes.sort((a,b)=>score(a)-score(b))[0];
  }
  walk(unit,to,dt){
    if(!to)return;const d=distance(unit,to);if(d<.07)return;
    const speed=WEAPONS[unit.weapon].speed*SHIELDS[unit.shield].speed,step=Math.min(d,speed*dt);
    unit.x=clamp(unit.x+(to.x-unit.x)/d*step,1,9);unit.y=clamp(unit.y+(to.y-unit.y)/d*step,2.25,13.25);unit.moving=true;
    if(!unit.action)unit.angle=Math.atan2(to.y-unit.y,to.x-unit.x);
  }
  pursuitPoint(unit,target){
    const d=distance(unit,target);if(d<.001)return target;
    const dx=(target.x-unit.x)/d,dy=(target.y-unit.y)/d;
    const allies=this.alive(unit.team).filter(u=>u!==unit);
    const blocker=allies.filter(u=>{const x=u.x-unit.x,y=u.y-unit.y;return x*dx+y*dy>0&&Math.abs(x*dy-y*dx)<BODY_SPACING&&distance(unit,u)<BODY_SPACING+.35;}).sort((a,b)=>distance(unit,a)-distance(unit,b))[0];
    if(!blocker)return target;
    // Give automatic pursuit a way around a companion at a wall. Ground
    // orders keep their exact destination; all travel still uses walk().
    return [-1,1].map(side=>({x:clamp(blocker.x-dy*side*(BODY_SPACING+.3),1,9),y:clamp(blocker.y+dx*side*(BODY_SPACING+.3),2.25,13.25)})).filter(p=>distance(p,blocker)>=BODY_SPACING+.05).sort((a,b)=>{
      const score=p=>distance(unit,p)+distance(p,target)+allies.reduce((s,u)=>s+Math.max(0,BODY_SPACING+.1-distance(p,u))*4,0);
      return score(a)-score(b);
    })[0]||target;
  }
  tacticalStep(unit,slot,dt){
    if(!['bow','spear'].includes(unit.weapon)||unit===this.leader()&&this.goal||unit.reformUntil>this.time)return false;
    const foes=this.alive(1-unit.team),threat=foes.sort((a,b)=>distance(unit,a)-distance(unit,b))[0];
    if(!threat)return false;
    const comfort=unit.weapon==='bow'?2:1.75;
    if(!unit.retreat&&distance(unit,threat)>comfort+1)unit.retreats=0;
    if(!unit.retreat&&unit.retreatCd<=0&&unit.retreats<2&&distance(unit,threat)<comfort){
      const angle=Math.atan2(unit.y-threat.y,unit.x-threat.x),step=unit.weapon==='bow'?.7:.4;
      const leash=this.formations[unit.team]==='circle'?1.6:2.5,allies=this.alive(unit.team).filter(u=>u!==unit);
      const candidates=[0,-Math.PI/3,Math.PI/3].map(turn=>({x:clamp(unit.x+Math.cos(angle+turn)*step,1,9),y:clamp(unit.y+Math.sin(angle+turn)*step,2.25,13.25)}))
        .filter(p=>distance(p,threat)>distance(unit,threat)+.08&&(unit===this.leader(unit.team)||distance(p,slot)<=leash)&&allies.every(a=>distance(p,a)>=BODY_SPACING));
      candidates.sort((a,b)=>Math.min(...foes.map(f=>distance(b,f)))-Math.min(...foes.map(f=>distance(a,f))));
      if(candidates.length){unit.retreat={...candidates[0],until:this.time+.55};unit.retreatCd=3;unit.retreats++;}
    }
    if(!unit.retreat)return false;
    if(this.time>=unit.retreat.until||distance(unit,unit.retreat)<.07){unit.retreat=null;return false;}
    // Slow, short backsteps create breathing room without endless kiting.
    this.walk(unit,unit.retreat,dt*.7);unit.angle=Math.atan2(threat.y-unit.y,threat.x-unit.x);return true;
  }
  separateBodies(){
    // Repeated projection prevents the next pair from squeezing an earlier pair
    // back together, including when several fighters meet beside a wall.
    for(let pass=0;pass<12;pass++)for(let i=0;i<this.units.length;i++)for(let j=i+1;j<this.units.length;j++){
      const a=this.units[i],b=this.units[j];if(a.hp<=0||b.hp<=0)continue;const d=distance(a,b),min=BODY_SPACING;if(d>=min)continue;
      const angle=d>.001?Math.atan2(b.y-a.y,b.x-a.x):(i+j)*1.7,push=(min-d)*.5;
      a.x=clamp(a.x-Math.cos(angle)*push,1,9);a.y=clamp(a.y-Math.sin(angle)*push,2.25,13.25);b.x=clamp(b.x+Math.cos(angle)*push,1,9);b.y=clamp(b.y+Math.sin(angle)*push,2.25,13.25);
    }
  }
  tick(dt){
    if(this.paused||this.phase==='finished')return;dt=clamp(dt,0,.05);this.time+=dt;
    for(const effect of this.effects)effect.life-=dt;this.effects=this.effects.filter(e=>e.life>0);
    if(this.phase==='ready'){this.ready-=dt;if(this.ready<=0){this.phase='battle';this.emit('begin');}return;}
    this.powerCd=Math.max(0,this.powerCd-dt);this.tryPower();
    // Alternate initiative so one team never owns every simultaneous strike.
    const acting=this.random()<.5?this.units:[...this.units].reverse();
    for(const u of acting){
      u.moving=false;for(const key of ['cd','flash','blockFlash','guardBroken','stun','retreatCd'])u[key]=Math.max(0,u[key]-dt);if(u.hp<=0)continue;
      if(u.action){u.action.elapsed+=dt;if(!u.action.hit&&u.action.elapsed>=u.action.hitTime){u.action.hit=true;this.resolveAttack(u);}if(u.action.elapsed>=u.action.duration)u.action=null;continue;}
      const target=this.pickTarget(u);if(!target)continue;u.target=target.id;const w=WEAPONS[u.weapon],leader=this.leader(u.team),d=distance(u,target),slot=this.slotFor(u);
      let destination=null,canEngage=true;
      if(u===leader){
        if(u.team===0&&this.goal){if(distance(u,this.goal)<.15)this.goal=null;else{destination=this.goal;canEngage=false;}}
        if(!destination&&d>w.range*.9)destination=this.pursuitPoint(u,target);
      }else{
        const leash=this.formations[u.team]==='circle'?1.6:2.5;
        if(u.reformUntil>this.time&&distance(u,slot)>.45){destination=slot;canEngage=d<=w.range;}
        else if(distance(target,slot)>w.range+leash||distance(u,leader)>3.8){destination=slot;canEngage=false;}
        else if(d>w.range*.9){
          // Close to weapon range within the formation leash, not a fixed
          // offset that can leave melee companions blocking their captain.
          const reach=distance(slot,target),advance=Math.min(leash,Math.max(1.15,reach-Math.max(BODY_SPACING,w.range-.1))),fraction=Math.min(1,advance/Math.max(.001,reach));
          destination={x:slot.x+(target.x-slot.x)*fraction,y:slot.y+(target.y-slot.y)*fraction};
        }
      }
      if(canEngage&&this.tacticalStep(u,slot,dt))continue;
      if(canEngage&&d<=w.range){u.angle=Math.atan2(target.y-u.y,target.x-u.x);if(u.cd<=0)this.startAttack(u,target);}
      else{this.walk(u,destination,dt);if(d<3)u.angle=Math.atan2(target.y-u.y,target.x-u.x);else if(!u.moving&&u!==leader&&this.formations[u.team]==='circle')u.angle=Math.atan2(u.y-leader.y,u.x-leader.x);}
    }
    for(const shot of this.projectiles){
      shot.life-=dt;const target=this.units.find(u=>u.id===shot.target&&u.hp>0),owner=this.units.find(u=>u.id===shot.owner);if(!target||!owner){shot.life=0;continue;}
      const d=distance(shot,target),step=Math.min(d,dt*8);
      if(d<=step+.22){this.hit(owner,target,shot.power,true,{x:shot.x,y:shot.y});shot.life=0;}
      else{shot.x+=(target.x-shot.x)/d*step;shot.y+=(target.y-shot.y)/d*step;}
    }
    this.projectiles=this.projectiles.filter(s=>s.life>0);
    this.separateBodies();
    for(let team=0;team<2;team++){
      const leader=this.leader(team);if(!leader)continue;const foe=this.leader(1-team);if(!foe)continue;
      const desired=team===0&&this.goal?Math.atan2(this.goal.y-leader.y,this.goal.x-leader.x):Math.atan2(foe.y-leader.y,foe.x-leader.x);this.headings[team]+=clamp(angleDiff(desired,this.headings[team]),-dt*2.5,dt*2.5);
    }
    if(!this.alive(0).length||!this.alive(1).length){this.phase='finished';this.winner=this.alive(0).length?0:1;this.emit('finished',{winner:this.winner});}
    else if(this.time>180){this.phase='finished';this.winner=this.alive(0).reduce((s,u)=>s+u.hp,0)>=this.alive(1).reduce((s,u)=>s+u.hp,0)?0:1;this.emit('finished',{winner:this.winner});}
  }
}
