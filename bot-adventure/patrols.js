import { WORKSHOPS, RETURNS, returnActive, regionAt, canWalk, enemyHealth } from './data.js?v=world89';

export const PATROL_DELAY=300;
export const WORKSHOP_REFUGE=12;
const GROUPS_PER_CHECK=2;
const distance=(a,b)=>Math.hypot(a.x-b.x,a.y-b.y);

// Repeat patrols own their bounded save records; campaign kills and cells stay permanent.
export class ReturningPatrols {
  constructor(game){
    this.game=game;this.checkIn=0;this.loaded=new Set();this.restoring=new Set();
    const saved=game.save.patrols,bootstrap=(!saved||typeof saved!=='object'||Array.isArray(saved))&&game.save.completed;
    game.save.patrols={};
    this.sites=game.world.sites.filter(s=>!s.returnId&&s.r>0&&WORKSHOPS.every(h=>distance(s,h)>WORKSHOP_REFUGE+3));
    this.byId=new Map(this.sites.map(s=>[s.id,s]));
    this.templates=new Map(this.sites.map(site=>[site.id,game.world.enemies.filter(e=>e.site===site.id&&e.wave===0&&!e.spawnParent)]));
    for(const site of this.sites){
      const old=saved?.[site.id];
      if(old&&Number.isFinite(old.round)&&Number.isFinite(old.due)){
        const record={round:Math.max(0,Math.floor(old.round)%1000000),due:Math.max(0,old.due)};
        if(old.suspended===true)record.suspended=true;
        if(Array.isArray(old.mobs)){
          const ids=new Set();record.mobs=old.mobs.filter(m=>Number.isInteger(m.i)&&m.i>=0&&m.i<this.templates.get(site.id).length&&Number.isFinite(m.x)&&Number.isFinite(m.y)&&Number.isFinite(m.hp)&&m.hp>0&&!ids.has(m.i)&&ids.add(m.i)).map(m=>({i:m.i,x:m.x,y:m.y,hp:m.hp}));
          if(!record.mobs.length){delete record.mobs;record.due=game.save.playSeconds+PATROL_DELAY;}
        }
        game.save.patrols[site.id]=record;
        if(record.mobs){if(!this.eligible(site))record.suspended=true;else if(!record.suspended)this.restoring.add(site.id);}
      }else if(game.save.bosses.includes(site.r))game.save.patrols[site.id]={round:0,due:game.save.playSeconds+(bootstrap?0:PATROL_DELAY)};
    }
  }
  protectedAt(point){return regionAt(point.x,point.y)===0||WORKSHOPS.some(h=>distance(point,h)<WORKSHOP_REFUGE);}
  eligible(site){const g=this.game;return !g.save.replay&&g.save.bosses.includes(site.r)&&g.save.cleared.includes(site.id)&&!RETURNS.some(m=>m.r===site.r&&returnActive(g.save,m));}
  awake(enemy){const site=this.byId.get(enemy.patrolSite);return !!site&&this.eligible(site)&&!this.protectedAt(this.game.player);}
  enemy(site,round,index){
    const base=this.templates.get(site.id)[index];
    const pool=site.r<3?['scout','ranged','tank','scout','ranged']:['scout','ranged','shield','hopper','sentry'];
    const type=pool[(index+round)%pool.length];
    const hp=Math.round(enemyHealth(site.r,type)*(1+(round%3)*.12));
    return {id:`patrol-${site.id}-${round}-${index}`,patrolSite:site.id,patrolIndex:index,r:site.r,
      x:base.x,y:base.y,homeX:base.x,homeY:base.y,hp,maxHp:hp,type,damage:Math.min(12,3+site.r),
      cd:1+index*.2,hit:0,swing:0,angle:0,dormant:false};
  }
  restore(site,record){
    const g=this.game;
    for(const mob of record.mobs){
      const e=this.enemy(site,record.round,mob.i);
      if(canWalk(g.world,g.save,Math.floor(mob.x),Math.floor(mob.y))&&!this.protectedAt(mob)&&distance(mob,{x:e.homeX,y:e.homeY})<=7)Object.assign(e,{x:mob.x,y:mob.y});
      e.hp=Math.min(e.maxHp,mob.hp);g.enemies.push(e);
    }
    this.loaded.add(site.id);
    this.restoring.delete(site.id);
    delete record.suspended;
  }
  capture(siteId){
    const record=this.game.save.patrols[siteId];
    if(record&&this.loaded.has(siteId))record.mobs=this.game.enemies.filter(e=>e.patrolSite===siteId&&e.hp>0).map(e=>({i:e.patrolIndex,x:e.x,y:e.y,hp:e.hp}));
  }
  snapshot(){for(const id of this.loaded)this.capture(id);}
  canAppear(points){
    const g=this.game,b=g.viewBounds;
    return !!b&&points.every(p=>distance(p,g.player)>16&&!this.protectedAt(p)&&canWalk(g.world,g.save,Math.floor(p.x),Math.floor(p.y))&&(p.x<b.left-3||p.x>b.right+3||p.y<b.top-3||p.y>b.bottom+3));
  }
  defeated(enemy){
    const g=this.game,record=g.save.patrols[enemy.patrolSite];if(!record)return;
    record.mobs=record.mobs.filter(m=>m.i!==enemy.patrolIndex);
    const scrap=2+Math.floor(enemy.r/5);g.save.totalBots++;g.save.scrap+=scrap;g.number(enemy.x,enemy.y,`+${scrap} ◆`,'#ffe28c');
    if(!record.mobs.length){
      delete record.mobs;record.due=g.save.playSeconds+PATROL_DELAY;this.loaded.delete(enemy.patrolSite);g.save.gears++;
    }
  }
  tick(dt){
    this.checkIn-=dt;if(this.checkIn>0)return;this.checkIn=.5;
    const g=this.game;
    g.enemies=g.enemies.filter(e=>!e.patrolSite||e.hp>0);
    const pending=[];
    for(const site of this.sites){
      let record=g.save.patrols[site.id];
      if(!this.eligible(site)){
        this.restoring.delete(site.id);
        if(record?.mobs)record.suspended=true;
        if(this.loaded.has(site.id)){this.capture(site.id);this.loaded.delete(site.id);g.enemies=g.enemies.filter(e=>e.patrolSite!==site.id);}
        continue;
      }
      if(!record){record={round:0,due:g.save.playSeconds+PATROL_DELAY};g.save.patrols[site.id]=record;}
      if(this.loaded.has(site.id))continue;
      if(record.mobs||record.due<=g.save.playSeconds)pending.push(site);
    }
    pending.sort((a,b)=>distance(a,g.player)-distance(b,g.player));
    let budget=GROUPS_PER_CHECK;
    const fighting=g.enemies.some(e=>e.hp>0&&e.active);
    for(const site of pending){
      if(!budget)break;
      const record=g.save.patrols[site.id];
      // Restore a saved view on load; quest-suspended groups must wait for departure.
      if(record.mobs){if(this.restoring.has(site.id)||this.canAppear(record.mobs)){this.restore(site,record);budget--;}continue;}
      if(fighting)continue;
      const round=record.round%1000000+1,group=this.templates.get(site.id).map((_,i)=>this.enemy(site,round,i));
      if(!this.canAppear(group))continue;
      record.round=round;record.mobs=group.map(e=>({i:e.patrolIndex,x:e.x,y:e.y,hp:e.hp}));
      g.enemies.push(...group);this.loaded.add(site.id);budget--;
    }
  }
}
