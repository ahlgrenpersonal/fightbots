import {WEAPONS,SHIELDS,normalizeSquad} from './data.js?v=roman25';
import {bowReleasePoint,shieldOpening} from './geometry.js?v=roman25';

export const distance=(a,b)=>Math.hypot(a.x-b.x,a.y-b.y);
export const BODY_SPACING=1.4;
export const MELEE_TOLERANCE=.12;
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
const angleDiff=(a,b)=>Math.atan2(Math.sin(a-b),Math.cos(a-b));
export const isGuarding=u=>u.hp>0&&u.shield!=='none'&&u.guardBroken<=0&&(u.shield==='tower'?shieldOpening(u)===0:!u.action||u.action.elapsed<u.action.hitTime*.5);
export function guardsAgainst(unit,source){return isGuarding(unit)&&Math.abs(angleDiff(Math.atan2(source.y-unit.y,source.x-unit.x),unit.angle))<SHIELDS[unit.shield].arc;}

export class Battle {
  constructor(squad,opponent,{seed=1,gentle=true,healthBonus,onEvent=()=>{},bounds=null}={}){
    if(bounds&&!['minX','maxX','minY','maxY'].every(k=>Number.isFinite(bounds[k])))throw new TypeError('Invalid battle bounds');
    if(bounds&&(bounds.minX>=bounds.maxX||bounds.minY>=bounds.maxY))throw new RangeError('Empty battle bounds');
    this.bounds=bounds?{...bounds}:{minX:1,maxX:9,minY:2.25,maxY:13.25};
    this.seed=((seed>>>0)*1664525+1013904223)>>>0;this.onEvent=onEvent;this.time=0;this.phase='ready';this.ready=1.25;this.paused=false;this.winner=null;
    this.headings=[-Math.PI/2,Math.PI/2];
    this.goal=null;this.focus=null;this.pendingPower=null;this.powerCd=0;this.effects=[];this.projectiles=[];this.units=[];this.lastHit=0;
    this.metrics={blocks:0,flanks:0,power:0,damage:[0,0],shieldBreaks:0,interceptions:0,meleeInterceptions:0,supportThrusts:0,openingStrikes:0};
    [normalizeSquad(squad),normalizeSquad(opponent)].forEach((slots,team)=>slots.forEach((slot,index)=>{
      const weapon=WEAPONS[slot.weapon],shield=SHIELDS[slot.shield],captain=index===0;
      const assist=[0,15,50,100,200].includes(healthBonus)?1+healthBonus/100:gentle?1.15:1;
      const hp=(weapon.hp+shield.hp)*1.8*(captain?1.35:1)*(team===0?assist:1);
      this.units.push({...slot,id:`${team}-${index}`,team,index,captain,x:5,y:team===0?10.3:4.7,angle:this.headings[team],hp,maxHp:hp,cd:.3+this.random()*.5,action:null,flash:0,blockFlash:0,guardBroken:0,stun:0,retreatCd:0,retreats:0,retreat:null,moving:false,target:null,buddy:null});
    }));
    this.activeId=this.leader()?.id;this.focusOwner=null;this.pendingOwner=null;
    this.refreshPartners();
    for(const team of [0,1]){
      const units=this.alive(team),front=units.filter(u=>!['bow','spear'].includes(u.weapon));
      const line=front.length?front:units;
      line.forEach((u,i)=>u.x=5+(i-(line.length-1)/2)*1.65);
      for(const u of units.filter(u=>!line.includes(u)))Object.assign(u,this.slotFor(u));
    }
    this.separateBodies();
  }
  boundX(v){return clamp(v,this.bounds.minX,this.bounds.maxX);}
  boundY(v){return clamp(v,this.bounds.minY,this.bounds.maxY);}
  random(){let x=this.seed;x^=x<<13;x^=x>>>17;x^=x<<5;this.seed=x>>>0;return this.seed/4294967296;}
  emit(type,data={}){this.onEvent({type,...data});}
  alive(team){return this.units.filter(u=>u.team===team&&u.hp>0);}
  leader(team=0){return this.alive(team).sort((a,b)=>a.index-b.index)[0];}
  syncActive(){
    const id=this.leader()?.id;
    if(id!==this.activeId){this.activeId=id;this.goal=null;this.focus=null;this.pendingPower=null;this.focusOwner=null;this.pendingOwner=null;this.emit('promotion',{id});}
    if(this.focus&&!this.units.some(u=>u.id===this.focus&&u.hp>0)){this.focus=null;this.pendingPower=null;}
  }
  refreshPartners(){
    for(const team of [0,1]){
      const units=this.alive(team),valid=u=>units.find(v=>v.id===u.buddy&&v!==u);
      for(const u of units)if(!valid(u))u.buddy=null;
      const pair=(a,b)=>{a.buddy=b.id;b.buddy=a.id;};
      const towers=units.filter(u=>u.shield==='tower');
      for(const u of towers)if(!u.buddy){const mate=towers.find(v=>v!==u&&!v.buddy);if(mate)pair(u,mate);}
      const hammers=units.filter(u=>u.weapon==='hammer');
      for(const u of hammers)if(!u.buddy){const mate=units.find(v=>v.shield==='round'&&!v.buddy);if(mate)pair(u,mate);}
      for(const role of ['bow','spear']){
        const followers=units.filter(u=>u.weapon===role);
        for(const u of followers){
          const candidates=units.filter(v=>v!==u&&v.weapon!=='bow'&&(role==='bow'||v.shield!=='none'));
          if(valid(u)&&candidates.includes(valid(u)))continue;
          const priority=v=>v.shield==='tower'?100:v.shield==='round'?80:v.captain?60:v.weapon==='spear'?40:v.weapon==='hammer'?30:20;
          const score=v=>units.filter(f=>f!==u&&['bow','spear'].includes(f.weapon)&&f.buddy===v.id).length*1000-priority(v);
          candidates.sort((a,b)=>score(a)-score(b)||a.index-b.index);u.buddy=candidates[0]?.id||null;
        }
      }
    }
  }
  slotFor(unit){
    const buddy=this.units.find(u=>u.id===unit.buddy&&u.hp>0);if(!buddy)return {x:unit.x,y:unit.y};
    const foe=this.units.find(u=>u.id===buddy.target&&u.hp>0&&u.team!==unit.team);
    const a=['bow','spear'].includes(unit.weapon)&&foe?Math.atan2(foe.y-buddy.y,foe.x-buddy.x):this.headings[unit.team];let x,y;
    if(['bow','spear'].includes(unit.weapon)){
      const followers=this.alive(unit.team).filter(u=>u.buddy===buddy.id);
      const siblings=followers.filter(u=>u.weapon===unit.weapon);let side=(siblings.indexOf(unit)-(siblings.length-1)/2)*1.45;
      const hasSpear=followers.some(u=>u.weapon==='spear');
      let back=unit.weapon==='bow'?(hasSpear?2.9:1.8):1.45;
      // Stagger a shared rear pair so both can reach past the protector.
      if(followers.filter(u=>u.weapon==='bow').length===1&&followers.filter(u=>u.weapon==='spear').length===1){
        side=unit.weapon==='bow'?.85:-.65;back=unit.weapon==='bow'?2.15:1.45;
      }
      x=buddy.x-Math.cos(a)*back-Math.sin(a)*side;y=buddy.y-Math.sin(a)*back+Math.cos(a)*side;
    }else{
      const side=(unit.index<buddy.index?-1:1)*.82;
      x=(unit.x+buddy.x)/2-Math.sin(a)*side;y=(unit.y+buddy.y)/2+Math.cos(a)*side;
    }
    return {x:this.boundX(x),y:this.boundY(y)};
  }
  moveTo(point){if(this.phase==='finished')return false;this.goal={x:this.boundX(point.x),y:this.boundY(point.y)};this.focus=null;this.pendingPower=null;return true;}
  enemyAt(point,tile=40){
    const foes=this.alive(1),body=foes.filter(u=>Math.abs(u.x-point.x)<=(u.captain?.47:.38)&&point.y>=u.y-(u.captain?.88:u.weapon==='spear'?.97:.73)&&point.y<=u.y+.43);
    // Upright sprites overlap: the front robot's helmet covers the rear one's feet.
    if(body.length)return body.sort((a,b)=>b.y-a.y)[0];
    return foes.map(u=>({u,d:distance({x:u.x,y:u.y-.18},point)})).filter(p=>p.d<.48+18/Math.max(1,tile)).sort((a,b)=>a.d-b.d)[0]?.u;
  }
  tapEnemy(enemy){
    if(this.paused||this.phase==='finished'||!enemy||enemy.hp<=0||enemy.team!==1)return false;
    this.syncActive();this.focus=enemy.id;this.focusOwner=this.activeId;this.goal=null;this.pendingPower=enemy.id;this.pendingOwner=this.activeId;
    return this.tryPower();
  }
  tryPower(){
    this.syncActive();
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
    unit.action={elapsed:0,duration:w.windup+w.recovery,hitTime:w.windup,target:target.id,power,hit:false};unit.cd=w.rate*(power?.85:1)*(SHIELDS[unit.shield].attackRate||1)*(.92+this.random()*.16);unit.moving=false;
    this.emit('windup',{weapon:unit.weapon,power});
  }
  damageMultiplier(){return 1;}
  hit(attacker,target,power=false,projectile=false,source=attacker){
    if(target.hp<=0)return;
    const blocked=guardsAgainst(target,source),w=WEAPONS[attacker.weapon];
    const buddy=this.units.find(u=>u.id===attacker.buddy&&u.hp>0);
    if(attacker.weapon==='sword'&&target.guardBroken>0&&buddy?.weapon==='hammer')this.metrics.openingStrikes++;
    if(attacker.weapon==='spear'&&buddy?.shield!=='none'&&buddy&&distance(attacker,target)>2.1)this.metrics.supportThrusts++;
    let damage=w.damage*(SHIELDS[attacker.shield].damageMultiplier||1)*(power?1.8:1)*(.96+this.random()*.08)*this.damageMultiplier(attacker);
    if(blocked){damage*=projectile?(target.shield==='tower'?.2:.35):attacker.weapon==='hammer'?.75:attacker.weapon==='spear'?.55:SHIELDS[target.shield].block;target.blockFlash=.26;this.metrics.blocks++;}
    else if(Math.abs(angleDiff(Math.atan2(source.y-target.y,source.x-target.x),target.angle))>2){damage*=1.12;this.metrics.flanks++;}
    if(attacker.weapon==='hammer'||power&&attacker.weapon!=='bow'){
      if(target.shield!=='none'){target.guardBroken=Math.max(target.guardBroken,attacker.weapon==='hammer'?(SHIELDS[target.shield].breakRecovery||1.65):.7);this.metrics.shieldBreaks++;}
      const a=Math.atan2(target.y-attacker.y,target.x-attacker.x),push=power?.2:.12;
      target.x=this.boundX(target.x+Math.cos(a)*push);target.y=this.boundY(target.y+Math.sin(a)*push);
    }
    const dealt=Math.min(target.hp,damage);target.hp=Math.max(0,target.hp-damage);target.flash=blocked?.08:.18;this.metrics.damage[attacker.team]+=dealt;this.lastHit=this.time;
    this.effects.push({type:blocked?'block':attacker.weapon==='hammer'?'hammer':power?'power':'hit',x:target.x,y:target.y,angle:attacker.angle,life:power?.6:.35,max:power?.6:.35,team:attacker.team});
    this.emit(blocked?'block':'hit',{weapon:attacker.weapon,power,team:attacker.team});
    if(target.hp<=0){target.action=null;this.syncActive();this.effects.push({type:'repair',x:target.x,y:target.y,life:1,max:1});this.emit('down',{team:target.team});}
  }
  resolveAttack(unit){
    const action=unit.action;let target=this.units.find(u=>u.id===action.target&&u.hp>0);const w=WEAPONS[unit.weapon];
    if(unit.weapon==='bow'&&!action.power&&!(unit.id===this.focusOwner&&this.focus)){
      target=this.bowTarget(unit)||target;if(target){action.target=target.id;unit.angle=Math.atan2(target.y-unit.y,target.x-unit.x);}
    }
    if(!target)return;
    if(distance(unit,target)>w.range+(unit.weapon==='bow'?.38:MELEE_TOLERANCE))return;
    if(unit.weapon==='bow')this.projectiles.push({...bowReleasePoint(unit),target:target.id,owner:unit.id,power:action.power,life:1.2});
    else{
      const defender=this.projectileBlocker(unit,target,target.team)||target;
      if(defender!==target)this.metrics.meleeInterceptions++;
      action.contact={x:defender.x,y:defender.y,angle:defender.angle,shield:defender.shield,guarding:guardsAgainst(defender,unit),action:defender.action?{elapsed:defender.action.elapsed,hitTime:defender.action.hitTime,duration:defender.action.duration}:null};
      this.hit(unit,defender,action.power);
    }
  }
  bowTarget(unit){
    // Aim at a nearby opening instead of wasting every supporting shot on a raised guard.
    const score=foe=>{
      const flight=distance(unit,foe)/8,w=WEAPONS[foe.weapon];
      let action=foe.action?{...foe.action,elapsed:foe.action.elapsed+flight}:foe.cd<flight?{elapsed:flight-foe.cd,hitTime:w.windup,duration:w.windup+w.recovery}:null;
      if(action&&action.elapsed>=action.duration)action=null;
      const projected={...foe,action,guardBroken:Math.max(0,foe.guardBroken-flight)};
      const blocker=this.projectileBlocker(unit,foe,foe.team);
      return (guardsAgainst(projected,unit)?2:0)+(blocker&&blocker!==foe?2:0)+distance(unit,foe)*.1+foe.hp/foe.maxHp*.2;
    };
    return this.alive(1-unit.team).filter(foe=>distance(unit,foe)<=WEAPONS.bow.range).map(foe=>({foe,score:score(foe)})).sort((a,b)=>a.score-b.score)[0]?.foe;
  }
  pickTarget(unit){
    const foes=this.alive(1-unit.team),focus=unit.id===this.focusOwner&&unit===this.leader()?this.units.find(u=>u.id===this.focus&&u.hp>0):null;if(focus)return focus;
    const slot=this.slotFor(unit),buddy=this.units.find(u=>u.id===unit.buddy&&u.hp>0),protectedUnits=this.alive(unit.team).filter(u=>u.buddy===unit.id&&['bow','spear'].includes(u.weapon));
    const paired=foes.find(u=>u.id===buddy?.target),reach=WEAPONS[unit.weapon].range;
    if(paired){
      const d=distance(unit,paired);
      if(unit.weapon==='sword'&&buddy.weapon==='hammer'&&paired.guardBroken>0&&d<=reach+.35)return paired;
      if(unit.weapon==='hammer'&&buddy.shield==='round'&&paired.shield!=='none'&&d<=reach+.35)return paired;
      if(unit.weapon==='spear'&&buddy.shield!=='none'&&d<=reach)return paired;
      if(unit.weapon==='bow'&&buddy.shield!=='none'&&paired.guardBroken>0&&d<=reach&&!this.projectileBlocker(bowReleasePoint(unit),paired,paired.team))return paired;
    }
    const score=target=>distance(unit,target)+distance(slot,target)*.2+this.alive(unit.team).filter(u=>u!==unit&&u.target===target.id).length*.45-(unit.weapon==='bow'&&target.shield==='none'?.4:0)
      -(unit.weapon==='spear'&&buddy?.shield!=='none'&&buddy&&target.id===buddy.target&&distance(unit,target)<=WEAPONS.spear.range?1.4:0)
      -(buddy?.weapon==='hammer'&&target.id===buddy.target&&target.guardBroken>0&&distance(unit,target)<3?1:0)
      -(unit.weapon==='hammer'&&buddy?.shield==='round'&&target.id===buddy.target&&target.shield!=='none'&&distance(unit,target)<3?.65:0)
      -(unit.shield!=='none'&&protectedUnits.some(u=>distance(u,target)<2.7)&&distance(unit,target)<3?1.3:0);
    return foes.sort((a,b)=>score(a)-score(b))[0];
  }
  walk(unit,to,dt){
    if(!to)return;const d=distance(unit,to);if(d<.07)return;
    const speed=WEAPONS[unit.weapon].speed*SHIELDS[unit.shield].speed,step=Math.min(d,speed*dt);
    unit.x=this.boundX(unit.x+(to.x-unit.x)/d*step);unit.y=this.boundY(unit.y+(to.y-unit.y)/d*step);unit.moving=true;
    if(!unit.action)unit.angle=Math.atan2(to.y-unit.y,to.x-unit.x);
  }
  pursuitPoint(unit,target){
    const d=distance(unit,target);if(d<.001)return target;
    const dx=(target.x-unit.x)/d,dy=(target.y-unit.y)/d;
    const allies=this.units.filter(u=>u.hp>0&&u!==unit&&u!==target);
    const blocker=allies.filter(u=>{const x=u.x-unit.x,y=u.y-unit.y;return x*dx+y*dy>0&&Math.abs(x*dy-y*dx)<BODY_SPACING&&distance(unit,u)<BODY_SPACING+.35;}).sort((a,b)=>distance(unit,a)-distance(unit,b))[0];
    if(!blocker)return target;
    // Give automatic pursuit a way around a companion at a wall. Ground
    // orders keep their exact destination; all travel still uses walk().
    return [-1,1].map(side=>({x:this.boundX(blocker.x-dy*side*(BODY_SPACING+.3)),y:this.boundY(blocker.y+dx*side*(BODY_SPACING+.3))})).filter(p=>distance(p,blocker)>=BODY_SPACING+.05).sort((a,b)=>{
      const score=p=>distance(unit,p)+distance(p,target)+allies.reduce((s,u)=>s+Math.max(0,BODY_SPACING+.1-distance(p,u))*4,0);
      return score(a)-score(b);
    })[0]||target;
  }
  tacticalStep(unit,slot,dt){
    if(!['bow','spear'].includes(unit.weapon)||unit===this.leader()&&this.goal)return false;
    const foes=this.alive(1-unit.team),threat=foes.sort((a,b)=>distance(unit,a)-distance(unit,b))[0];
    if(!threat)return false;
    const comfort=unit.weapon==='bow'?2:1.75;
    if(!unit.retreat&&distance(unit,threat)>comfort+1)unit.retreats=0;
    if(!unit.retreat&&unit.retreatCd<=0&&unit.retreats<2&&distance(unit,threat)<comfort){
      const angle=Math.atan2(unit.y-threat.y,unit.x-threat.x),step=unit.weapon==='bow'?.7:.4;
      const leash=3,allies=this.alive(unit.team).filter(u=>u!==unit);
      const candidates=[0,-Math.PI/3,Math.PI/3].map(turn=>({x:this.boundX(unit.x+Math.cos(angle+turn)*step),y:this.boundY(unit.y+Math.sin(angle+turn)*step)}))
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
      a.x=this.boundX(a.x-Math.cos(angle)*push);a.y=this.boundY(a.y-Math.sin(angle)*push);b.x=this.boundX(b.x+Math.cos(angle)*push);b.y=this.boundY(b.y+Math.sin(angle)*push);
    }
  }
  projectileBlocker(from,to,team){
    const dx=to.x-from.x,dy=to.y-from.y,length=dx*dx+dy*dy;if(length<1e-9)return null;
    const magnitude=Math.sqrt(length);
    return this.alive(team).filter(u=>u.shield!=='none'&&guardsAgainst(u,{x:u.x-dx/magnitude,y:u.y-dy/magnitude})).map(u=>{
      const t=clamp(((u.x-from.x)*dx+(u.y-from.y)*dy)/length,0,1),point={x:from.x+dx*t,y:from.y+dy*t};
      return {u,t,d:distance(u,point)};
    }).filter(hit=>hit.d<=(hit.u.shield==='tower'?.68:.44)).sort((a,b)=>a.t-b.t)[0]?.u||null;
  }
  tick(dt){
    if(this.paused||this.phase==='finished')return;dt=clamp(dt,0,.05);this.time+=dt;
    for(const effect of this.effects)effect.life-=dt;this.effects=this.effects.filter(e=>e.life>0);
    if(this.phase==='ready'){this.ready-=dt;if(this.ready<=0){this.phase='battle';this.emit('begin');}return;}
    this.syncActive();this.refreshPartners();this.powerCd=Math.max(0,this.powerCd-dt);this.tryPower();
    // Alternate initiative so one team never owns every simultaneous strike.
    const acting=this.random()<.5?this.units:[...this.units].reverse();
    for(const u of acting){
      u.moving=false;for(const key of ['cd','flash','blockFlash','guardBroken','stun','retreatCd'])u[key]=Math.max(0,u[key]-dt);if(u.hp<=0)continue;
      if(u.action){u.action.elapsed+=dt;if(!u.action.hit&&u.action.elapsed>=u.action.hitTime){u.action.hit=true;this.resolveAttack(u);}if(u.action.elapsed>=u.action.duration)u.action=null;continue;}
      const target=this.pickTarget(u);if(!target)continue;u.target=target.id;const w=WEAPONS[u.weapon],leader=this.leader(u.team),d=distance(u,target),slot=this.slotFor(u);
      let destination=null,canEngage=true;
      const buddy=this.units.find(v=>v.id===u.buddy&&v.hp>0),support=buddy&&['bow','spear'].includes(u.weapon);
      const commanded=u.team===0&&u===leader&&this.focusOwner===u.id&&this.focus;
      if(u.team===0&&u===leader&&this.goal){
        if(distance(u,this.goal)<.15)this.goal=null;else{destination=this.goal;canEngage=false;}
      }
      if(!destination){
        if(support&&!commanded){
          // Rear positioning never prevents an attack already within reach.
          if(distance(u,slot)>(u.weapon==='spear'?.06:.3))destination=this.pursuitPoint(u,slot);
          canEngage=d<=w.range;
        }else if(d>w.range*.92){
          destination=this.pursuitPoint(u,target);
          if(buddy&&!['bow','spear'].includes(u.weapon)&&distance(u,buddy)>1.95&&!this.alive(1-u.team).some(foe=>distance(u,foe)<2.7)){
            const pull=distance(u,buddy)>3?.55:.25;
            destination={x:destination.x*(1-pull)+slot.x*pull,y:destination.y*(1-pull)+slot.y*pull};
          }
        }
      }
      if(canEngage&&this.tacticalStep(u,slot,dt))continue;
      if(canEngage&&d<=w.range){
        u.angle=Math.atan2(target.y-u.y,target.x-u.x);
        if(u.cd<=0)this.startAttack(u,target);
      }
      else{this.walk(u,destination,dt);if(d<4)u.angle=Math.atan2(target.y-u.y,target.x-u.x);}
    }
    for(const shot of this.projectiles){
      shot.life-=dt;const target=this.units.find(u=>u.id===shot.target&&u.hp>0),owner=this.units.find(u=>u.id===shot.owner);if(!target||!owner){shot.life=0;continue;}
      const d=distance(shot,target),step=Math.min(d,dt*8);
      const next={x:shot.x+(target.x-shot.x)/Math.max(d,.001)*step,y:shot.y+(target.y-shot.y)/Math.max(d,.001)*step};
      const blocker=this.projectileBlocker(shot,next,target.team);
      if(blocker){this.hit(owner,blocker,shot.power,true,{x:blocker.x-(next.x-shot.x),y:blocker.y-(next.y-shot.y)});if(blocker!==target)this.metrics.interceptions++;shot.life=0;}
      else if(d<=step+.22){this.hit(owner,target,shot.power,true,{x:shot.x,y:shot.y});shot.life=0;}
      else{shot.x=next.x;shot.y=next.y;}
    }
    this.projectiles=this.projectiles.filter(s=>s.life>0);
    this.separateBodies();
    for(let team=0;team<2;team++){
      const units=this.alive(team),foes=this.alive(1-team);if(!units.length||!foes.length)continue;
      const center=list=>({x:list.reduce((sum,u)=>sum+u.x,0)/list.length,y:list.reduce((sum,u)=>sum+u.y,0)/list.length});
      const own=center(units),enemy=center(foes),desired=Math.atan2(enemy.y-own.y,enemy.x-own.x);
      this.headings[team]+=clamp(angleDiff(desired,this.headings[team]),-dt*.75,dt*.75);
    }
    this.checkFinished();
  }
  checkFinished(){
    if(!this.alive(0).length||!this.alive(1).length){this.phase='finished';this.winner=this.alive(0).length?0:1;this.emit('finished',{winner:this.winner});}
    else if(this.time>180){this.phase='finished';this.winner=this.alive(0).reduce((s,u)=>s+u.hp,0)>=this.alive(1).reduce((s,u)=>s+u.hp,0)?0:1;this.emit('finished',{winner:this.winner});}
  }
}
