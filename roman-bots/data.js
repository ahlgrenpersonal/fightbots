export const BUILD='roman21';
export const HEALTH_ASSISTS=[{bonus:0,winRate:67},{bonus:15,winRate:80},{bonus:50,winRate:94},{bonus:100,winRate:99},{bonus:200,winRate:100}];
export const normalizeHealthBonus=value=>HEALTH_ASSISTS.some(option=>option.bonus===value)?value:50;
export const WIDTH=10,HEIGHT=15;
export const WEAPONS={
  sword:{name:'Gladius',hands:1,damage:19,rate:1.05,windup:.24,recovery:.38,range:1.55,speed:2.15,hp:125,description:'One hand. Quick strikes; leaves a hand for a shield.'},
  spear:{name:'Spear',hands:2,damage:25,rate:1.5,windup:.36,recovery:.46,range:3.15,speed:2.05,hp:115,description:'Two hands. Thrusts past a friendly shield and slips damage through enemy guards. Vulnerable without cover.'},
  hammer:{name:'Warhammer',hands:2,damage:52,rate:2.35,windup:.6,recovery:.58,range:1.65,speed:1.9,hp:125,description:'Two hands. A slow, heavy blow knocks shields aside.'},
  bow:{name:'Bow',hands:2,damage:19,rate:1.65,windup:.4,recovery:.32,range:4.1,speed:2.2,hp:95,description:'Two hands. Supporting shots from behind cover; vulnerable without a protector.'}
};
export const SHIELDS={
  none:{name:'Free hands',speed:1,hp:0,block:1,arc:0,description:'No shield. Move freely, but take full melee hits.'},
  round:{name:'Round shield',speed:.96,hp:8,block:.25,arc:1.18,description:'One hand. Covers the front while keeping the bot nimble.'},
  tower:{name:'Tower shield',speed:.78,hp:90,block:.08,arc:1.45,attackRate:1.8,damageMultiplier:.65,breakRecovery:1.9,description:'One hand. Strong guard buys time for companions. Slow, light sword strikes; vulnerable after hammer blows.'}
};
export function normalizeSlot(slot={}){
  if(!slot||typeof slot!=='object')slot={};
  const weapon=Object.hasOwn(WEAPONS,slot.weapon)?slot.weapon:'sword';
  return {weapon,shield:WEAPONS[weapon].hands===2?'none':Object.hasOwn(SHIELDS,slot.shield)?slot.shield:'round'};
}
export const freshSquad=()=>[{weapon:'sword',shield:'round'},{weapon:'sword',shield:'tower'},{weapon:'sword',shield:'tower'},{weapon:'hammer',shield:'none'},{weapon:'spear',shield:'none'}];
export const normalizeSquad=squad=>Array.from({length:5},(_,i)=>normalizeSlot(Array.isArray(squad)?squad[i]:freshSquad()[i]));
export const OPPONENTS=[
  {name:'The Laurel Guard',squad:freshSquad()},
  {name:'The Bronze Spears',squad:[{weapon:'sword',shield:'tower'},{weapon:'spear'},{weapon:'spear'},{weapon:'hammer'},{weapon:'bow'}]},
  {name:'The Marble Watch',squad:[{weapon:'sword',shield:'round'},{weapon:'sword',shield:'tower'},{weapon:'hammer'},{weapon:'bow'},{weapon:'sword',shield:'round'}]},
  {name:'The Crimson Crests',squad:[{weapon:'hammer'},{weapon:'sword',shield:'round'},{weapon:'spear'},{weapon:'sword',shield:'tower'},{weapon:'bow'}]}
];
