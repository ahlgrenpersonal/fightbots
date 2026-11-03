import {Battle} from '../engine.js?v=roman20';

export const ARENA=Object.freeze({x:39,y:140});
export const ARENA_ENTRANCE=Object.freeze({x:33,y:142});
export const TRIAL_BOUNDS=Object.freeze({minX:33,maxX:46,minY:134,maxY:145});
export const CITY_EXIT=Object.freeze({x:31,y:142});
export const PROLOGUE_ROUNDS=15;
export const earnedCount=round=>round<5?1:round<10?2:3;
export const inArena=p=>!!p&&p.x>=33&&p.x<=46&&p.y>=134&&p.y<=145;
export const cityPoint=p=>({x:Math.max(5,Math.min(47,p.x)),y:Math.max(132,Math.min(145.5,p.y))});

// Five equipment lessons, repeated as a duel, a pair and a trio.
const lessons=[{weapon:'sword',shield:'none'},{weapon:'spear',shield:'none'},
  {weapon:'hammer',shield:'none'},{weapon:'bow',shield:'none'},{weapon:'sword',shield:'round'}];
export class Trial extends Battle {
  constructor(round,squad,{seed=1,onEvent=()=>{}}={}){
    if(!Number.isInteger(round)||round<0||round>=PROLOGUE_ROUNDS)throw new RangeError('Invalid trial round');
    const count=earnedCount(round),lesson=lessons[round%5];
    const opponent=[lesson,lessons[(round+2)%5],lessons[(round+3)%5]];
    super(squad,opponent,{seed,healthBonus:100,onEvent,bounds:TRIAL_BOUNDS});
    this.round=round;
    this.units=this.units.filter(u=>u.index<count);
    // Battle's default deployment is in arena-local coordinates. Only initial
    // placement changes here; all subsequent combat and movement are Battle's.
    for(const u of this.units){
      u.x=39.5+(u.index-(count-1)/2)*2;
      u.y=u.team===0?142.5:136.5;
      u.buddy=null;
      if(u.team===1){u.maxHp*=.65;u.hp=u.maxHp;}
    }
    this.refreshPartners();this.separateBodies();
  }
  damageMultiplier(u){return u.team===0?(this.chargeTime>0?2:1):.45;}
}
