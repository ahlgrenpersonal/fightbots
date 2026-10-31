import { HOME, REGIONS, EQUIPMENT, STARTERS, makeWorld, freshSave, stats, item, cellsIn, unlockedRegion, regionAt, pathfind, canWalk, available, REQUIRED_CELLS } from './data.js?v=world52';

export const distance = (a,b) => Math.hypot(a.x-b.x,a.y-b.y);
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
export class Adventure {
  constructor(save=freshSave(),onEvent=()=>{}) {
    this.save=save;this.onEvent=onEvent;this.world=makeWorld();
    this.player={...save.position,hp:Math.max(1,Math.min(save.hp,stats(save).hp)),angle:0,cd:0,hit:0,swing:0,invincible:2};
    this.enemies=this.world.enemies.filter(e=>!save.kills.includes(e.id)&&!(e.type==='boss'&&save.bosses.includes(e.r)));
    for(const e of this.enemies)if(e.dormant&&!this.enemies.some(n=>n.site===e.site&&n.wave===0&&n.hp>0))e.dormant=false;
    this.route=[];this.loot=[];this.projectiles=[];this.effects=[];this.telegraphs=[];this.target=null;this.waypoint=null;
    this.time=0;this.boostTime=0;this.boostCd=0;this.shieldCd=0;this.shake=0;this.paused=false;this.reducedMotion=false;this.routeTimer=0;this.charging=null;this.headingHome=false;
    this.discover();
  }
  emit(type,data={}){this.onEvent({type,...data});}
  snapshot(){this.save.position={x:this.player.x,y:this.player.y};this.save.hp=this.player.hp;return this.save;}
  maxHp(){return stats(this.save).hp;}
  bossAwake(r){return !this.save.bosses.includes(r)&&cellsIn(this.save,r)>=REQUIRED_CELLS&&r<=unlockedRegion(this.save);}
  isHome(){return distance(this.player,HOME)<2.6;}
  stationNear(radius=1.1){return this.world.stations.find(s=>s.r<=unlockedRegion(this.save)&&distance(this.player,s)<radius);}
  safeAt(pos){return distance(pos,HOME)<2.6||this.world.stations.some(s=>s.r<=unlockedRegion(this.save)&&distance(pos,s)<2.25);}
  discover(){const r=regionAt(this.player.x,this.player.y);if(r>=0&&!this.save.visited.includes(r)){this.save.visited.push(r);this.emit('region',{r});}for(const s of this.world.stations)if(s.r<=unlockedRegion(this.save)&&distance(this.player,s)<6&&!this.save.discovered.includes(s.id)){this.save.discovered.push(s.id);this.emit('toast',{text:'Charging station discovered!'});}}
  moveTo(pos){
    if(regionAt(pos.x,pos.y)>unlockedRegion(this.save)){this.emit('toast',{text:'Restore this region\'s relay to open the next trail.'});return false;}
    let to={x:Math.floor(pos.x)+.5,y:Math.floor(pos.y)+.5};
    if(!canWalk(this.world,this.save,Math.floor(to.x),Math.floor(to.y))){
      const neighbors=[];for(let dy=-1;dy<=1;dy++)for(let dx=-1;dx<=1;dx++)if(canWalk(this.world,this.save,Math.floor(to.x)+dx,Math.floor(to.y)+dy))neighbors.push({x:to.x+dx,y:to.y+dy});
      neighbors.sort((a,b)=>distance(a,this.player)-distance(b,this.player));if(!neighbors.length)return false;to=neighbors[0];
    }
    this.route=pathfind(this.world,this.save,this.player,to);this.waypoint=to;this.target=null;this.charging=null;this.headingHome=false;return this.route.length>0;
  }
  focusEnemy(enemy){if(enemy.dormant)return;if(enemy.type==='boss'&&!this.bossAwake(enemy.r)){this.emit('toast',{text:`${Math.max(0,REQUIRED_CELLS-cellsIn(this.save,enemy.r))} more power cells will wake this guardian.`});return;}this.target=enemy.id;this.moveTo(enemy);this.target=enemy.id;}
  goHome(){
    this.moveTo(HOME);this.headingHome=this.route.length>0;return this.headingHome;
  }
  rescueHome(){
    this.player.x=HOME.x;this.player.y=HOME.y;this.player.hp=this.maxHp();this.player.invincible=3;
    this.route=[];this.target=null;this.waypoint=null;this.projectiles=[];this.telegraphs=[];this.charging=null;this.headingHome=false;
    this.emit('home');
  }
  depart(){
    this.player.hp=this.maxHp();
    this.moveTo({x:HOME.x+2,y:HOME.y+3});
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
    this.save.scrap-=2;this.route=[];this.target=null;this.waypoint=null;this.charging=station.id;
    this.emit('toast',{text:'Charging… Safe inside the green ring.'});return true;
  }
  boost(){if(this.boostCd>0)return false;this.boostCd=28;this.boostTime=6;this.player.invincible=1;this.emit('boost');this.burst(this.player.x,this.player.y,1.2);return true;}
  burst(x,y,radius=1,type='burst'){this.effects.push({type,x,y,radius,life:.6,max:.6});}
  number(x,y,text,color){this.effects.push({type:'number',x,y,text,color,life:.9,max:.9});}
  hitEnemy(e,damage){
    if(e.hp<=0||e.dormant)return;const amount=Math.max(1,Math.round(damage));e.hp=Math.max(0,e.hp-amount);e.hit=.15;this.number(e.x,e.y-.5,`${amount}`,'#fff3b5');
    if(e.hp<=0){
      this.burst(e.x,e.y,e.type==='boss'?1.4:.45,e.type==='boss'?'explosion':'burst');this.save.kills.push(e.id);this.save.totalBots++;
      const reward=e.type==='boss'?35*(e.r+1):2+e.r;this.save.scrap+=reward;this.number(e.x,e.y,`+${reward} ◆`,'#ffe28c');this.emit('defeat',{boss:e.type==='boss'});
      if(e.type==='boss'&&!this.enemies.some(b=>b.type==='boss'&&b.r===e.r&&b.hp>0)){
        this.save.bosses.push(e.r);this.save.gears+=4+e.r;this.save.scrap+=30+e.r*15;this.shake=5;this.projectiles=[];this.telegraphs=[];
        if(e.r===4)this.save.completed=true;
        this.emit('guardian',{r:e.r});
      }
    }
  }
  hurt(damage){
    if(this.player.invincible>0||this.boostTime>0||this.safeAt(this.player))return;
    if(this.save.build.gadget==='shield'&&this.shieldCd<=0){this.shieldCd=8;this.burst(this.player.x,this.player.y,.7);this.emit('block');return;}
    const actual=Math.max(1,damage-stats(this.save).defense)*(this.save.gentle?.65:1);
    this.player.hp=Math.max(0,this.player.hp-actual);this.player.hit=.2;this.player.invincible=.4;this.shake=1.8;this.number(this.player.x,this.player.y-.7,`-${Math.ceil(actual)}`,'#ffd4c3');
    if(this.player.hp<=0){this.save.scrap=Math.max(0,this.save.scrap-1);this.rescueHome();this.emit('rescue');}
  }
  attack(e){
    const w=stats(this.save).weapon,p=this.player,damage=w.damage*(this.boostTime>0?1.65:1);
    p.cd=w.rate*(this.boostTime>0?.7:1);p.swing=.42;p.angle=Math.atan2(e.y-p.y,e.x-p.x);
    this.emit('attack',{weapon:w.id});
    if(w.id==='blaster'||w.id==='rocket')this.projectiles.push({x:p.x+Math.cos(p.angle)*.78,y:p.y+Math.sin(p.angle)*.78,tx:e.x,ty:e.y,target:e.id,angle:p.angle,speed:w.id==='rocket'?6.5:11,damage,kind:w.id==='rocket'?'rocket':'bolt',life:3});
    else if(w.id==='lightning'){
      const chain=[e,...this.enemies.filter(n=>n!==e&&n.hp>0&&distance(n,e)<2.8&&(n.type!=='boss'||this.bossAwake(n.r))).sort((a,b)=>distance(a,e)-distance(b,e)).slice(0,3)];let from=p;
      for(const [i,n] of chain.entries()){this.effects.push({type:'arc',x:from.x,y:from.y,tx:n.x,ty:n.y,life:.24,max:.24});this.hitEnemy(n,damage*(i===0?1:.72));from=n;}
    }else if(w.id==='hammer'){
      this.effects.push({type:'slam',x:e.x,y:e.y,life:.55,max:.55});this.shake=4;
      for(const n of this.enemies.filter(n=>n.hp>0&&distance(n,e)<1.9&&(n.type!=='boss'||this.bossAwake(n.r))))this.hitEnemy(n,damage);
    }else{this.hitEnemy(e,damage);this.burst(e.x,e.y,.25);if(w.id==='bumper'&&e.type!=='boss'){const a=Math.atan2(e.y-p.y,e.x-p.x),nx=e.x+Math.cos(a)*.25,ny=e.y+Math.sin(a)*.25;if(canWalk(this.world,this.save,Math.floor(nx),Math.floor(ny))){e.x=nx;e.y=ny;}}}
  }
  tick(dt){
    if(this.paused)return;dt=Math.min(dt,.06);this.time+=dt;this.save.playSeconds+=dt;
    const p=this.player,st=stats(this.save);this.routeTimer-=dt;
    for(const key of ['cd','hit','swing','invincible'])p[key]=Math.max(0,p[key]-dt);
    this.boostCd=Math.max(0,this.boostCd-dt);this.boostTime=Math.max(0,this.boostTime-dt);this.shieldCd=Math.max(0,this.shieldCd-dt);this.shake=Math.max(0,this.shake-dt*18);
    const target=this.target&&this.enemies.find(e=>e.id===this.target&&e.hp>0);
    if(target){if(distance(p,target)>st.weapon.range*.9&&this.routeTimer<=0){this.route=pathfind(this.world,this.save,p,target);this.routeTimer=.65;}else if(distance(p,target)<=st.weapon.range*.9)this.route=[];}
    else if(this.target)this.target=null;
    if(this.route.length){const next=this.route[0],d=distance(p,next),step=st.speed*dt*(this.boostTime>0?1.25:1);if(d<=step){p.x=next.x;p.y=next.y;this.route.shift();}else{const a=Math.atan2(next.y-p.y,next.x-p.x);p.x+=Math.cos(a)*step;p.y+=Math.sin(a)*step;if(!target)p.angle=a;}if(!this.route.length)this.waypoint=null;}
    this.discover();
    if(this.headingHome&&this.isHome()&&!this.route.length){this.headingHome=false;this.player.hp=this.maxHp();this.emit('home-arrived');}
    for(const e of this.enemies)e.active=false;
    const threats=this.enemies.filter(e=>e.hp>0&&!e.dormant&&e.r<=unlockedRegion(this.save)&&distance(p,e)<8&&(e.type!=='boss'||this.bossAwake(e.r)));
    const inRange=threats.filter(e=>distance(p,e)<=st.weapon.range).sort((a,b)=>distance(p,a)-distance(p,b));
    if(p.cd<=0&&inRange.length&&!this.safeAt(p))this.attack(inRange[0]);
    for(const e of threats){
      e.cd-=dt;e.hit=Math.max(0,e.hit-dt);e.swing=Math.max(0,e.swing-dt);const d=distance(p,e),boss=e.type==='boss';
      e.active=d<(boss?6.5:3.4)&&!this.safeAt(p)&&distance(e,{x:e.homeX,y:e.homeY})<7;
      if(!e.active){const home={x:e.homeX,y:e.homeY},back=distance(e,home);if(back>.12){const a=Math.atan2(home.y-e.y,home.x-e.x),nx=e.x+Math.cos(a)*dt,ny=e.y+Math.sin(a)*dt;if(canWalk(this.world,this.save,Math.floor(nx),Math.floor(ny))&&!this.safeAt({x:nx,y:ny})){e.x=nx;e.y=ny;}}continue;}
      e.angle=Math.atan2(p.y-e.y,p.x-e.x);const range=e.type==='ranged'?3.2:boss?1.6:.9;
      if(d>range){const speed=boss?.7:e.type==='tank'?.72:1.05,nx=e.x+Math.cos(e.angle)*speed*dt,ny=e.y+Math.sin(e.angle)*speed*dt;
        if(canWalk(this.world,this.save,Math.floor(nx),Math.floor(ny))&&!this.safeAt({x:nx,y:ny})){e.x=nx;e.y=ny;}else{
          // Follow a grid route around scenery instead of getting stuck behind it.
          if(!e.path||e.pathTime<this.time){e.path=pathfind(this.world,this.save,e,p);e.pathTime=this.time+1.2;}
          const step=e.path?.[0];if(step){const a=Math.atan2(step.y-e.y,step.x-e.x),nx=e.x+Math.cos(a)*speed*dt,ny=e.y+Math.sin(a)*speed*dt;if(!this.safeAt({x:nx,y:ny})){e.x=nx;e.y=ny;}if(distance(e,step)<.15)e.path.shift();}
        }
      }
      if(e.cd<=0){
        if(boss){e.cd=3.2;this.telegraphs.push({x:p.x,y:p.y,radius:1.25+e.r*.12,damage:e.damage,duration:1.6,life:1.6});e.swing=.5;this.emit('warning');}
        else if(d<=range){e.cd=e.type==='ranged'?2.4:1.8;e.swing=.3;if(e.type==='ranged')this.projectiles.push({x:e.x,y:e.y,tx:p.x,ty:p.y,angle:e.angle,damage:e.damage,kind:'bolt',speed:4,enemy:true,life:3});else{this.hurt(e.damage);if(this.save.build.armor==='reflect')this.hitEnemy(e,4);}}
      }
    }
    for(const a of this.telegraphs){a.life-=dt;if(a.life<=0){this.burst(a.x,a.y,a.radius,'explosion');if(distance(p,a)<a.radius)this.hurt(a.damage);}}
    this.telegraphs=this.telegraphs.filter(a=>a.life>0);
    for(const shot of this.projectiles){
      const target=shot.target&&this.enemies.find(e=>e.id===shot.target&&e.hp>0);if(target){shot.tx=target.x;shot.ty=target.y;}
      const d=Math.hypot(shot.tx-shot.x,shot.ty-shot.y);shot.angle=Math.atan2(shot.ty-shot.y,shot.tx-shot.x);const step=shot.speed*dt;shot.life-=dt;
      if(d<step+.15){shot.life=0;if(shot.enemy){if(distance(p,{x:shot.tx,y:shot.ty})<.8)this.hurt(shot.damage);}else if(shot.kind==='rocket'){this.burst(shot.tx,shot.ty,1.4,'explosion');this.shake=5;for(const e of this.enemies.filter(e=>e.hp>0&&distance(e,{x:shot.tx,y:shot.ty})<2&&(e.type!=='boss'||this.bossAwake(e.r))))this.hitEnemy(e,shot.damage);this.emit('explosion');}else if(target)this.hitEnemy(target,shot.damage);}
      else{shot.x+=Math.cos(shot.angle)*step;shot.y+=Math.sin(shot.angle)*step;}
    }
    this.projectiles=this.projectiles.filter(s=>s.life>0);
    for(const site of this.world.sites){
      if(site.r>unlockedRegion(this.save)||this.save.cleared.includes(site.id))continue;
      if(!this.enemies.some(e=>e.site===site.id&&e.wave===0&&e.hp>0)){
        const next=this.enemies.filter(e=>e.site===site.id&&e.dormant&&e.hp>0);
        if(next.length){for(const e of next){e.dormant=false;this.burst(e.x,e.y,.35);}if(distance(this.player,site)<8)this.emit('toast',{text:'Another little patrol!'});}
      }
      if(!this.enemies.some(e=>e.site===site.id&&e.hp>0)){
        this.save.cleared.push(site.id);this.save.gears+=2;this.save.scrap+=12+site.r*4;this.burst(site.x,site.y,.9);this.emit('cell',{r:site.r,count:cellsIn(this.save,site.r)});
        if(cellsIn(this.save,site.r)===REQUIRED_CELLS)this.emit('awake',{r:site.r});
      }
    }
    for(const chest of this.world.chests){if(chest.r<=unlockedRegion(this.save)&&!this.save.chests.includes(chest.id)&&distance(p,chest)<(this.save.build.gadget==='magnet'?2.5:.85)){this.save.chests.push(chest.id);const bonus=8+chest.r*4;this.save.scrap+=bonus;this.save.gears++;this.burst(chest.x,chest.y,.5);this.emit('chest',{scrap:bonus});}}
    if(this.isHome())p.hp=Math.min(st.hp,p.hp+dt*25);
    if(this.charging){const station=this.stationNear();if(!station||station.id!==this.charging||this.route.length)this.charging=null;else{p.hp=Math.min(st.hp,p.hp+dt*st.hp/8*(this.save.build.gadget==='repair'?2:1));if(p.hp>=st.hp){this.charging=null;this.emit('toast',{text:'Fully charged. Ready to roll!'});}}}
    this.effects.forEach(e=>e.life-=dt);this.effects=this.effects.filter(e=>e.life>0);
  }
  nearestSite(){const r=unlockedRegion(this.save);return this.world.sites.filter(s=>s.r===r&&!this.save.cleared.includes(s.id)).sort((a,b)=>distance(a,this.player)-distance(b,this.player))[0];}
}
