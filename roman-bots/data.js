export const BUILD='roman09';
export const HEALTH_ASSISTS=[{bonus:0,winRate:65},{bonus:15,winRate:78},{bonus:50,winRate:92},{bonus:100,winRate:96},{bonus:200,winRate:98}];
export const normalizeHealthBonus=value=>HEALTH_ASSISTS.some(option=>option.bonus===value)?value:50;
export const WIDTH=10,HEIGHT=15;
export const WEAPONS={
  sword:{name:'Gladius',hands:1,damage:19,rate:1.05,windup:.24,recovery:.38,range:1.55,speed:2.15,hp:125,description:'One hand. Quick strikes; leaves a hand for a shield.'},
  spear:{name:'Spear',hands:2,damage:25,rate:1.5,windup:.36,recovery:.46,range:1.95,speed:2.05,hp:115,description:'Two hands. Reaches over the front line, but has no shield.'},
  hammer:{name:'Warhammer',hands:2,damage:52,rate:2.35,windup:.6,recovery:.58,range:1.65,speed:1.9,hp:125,description:'Two hands. A slow, heavy blow knocks shields aside.'},
  bow:{name:'Bow',hands:2,damage:17,rate:1.65,windup:.4,recovery:.32,range:4.1,speed:2.2,hp:95,description:'Two hands. Supports from behind; armor and raised shields stop most arrows.'}
};
export const SHIELDS={
  none:{name:'Free hands',speed:1,hp:0,block:1,arc:0,description:'No shield. Move freely, but take full melee hits.'},
  round:{name:'Round shield',speed:.96,hp:8,block:.25,arc:1.18,description:'One hand. Covers the front while keeping the bot nimble.'},
  tower:{name:'Tower shield',speed:.78,hp:27,block:.12,arc:1.45,description:'One hand. Broad frontal protection, with slower movement and sword swings.'}
};
export const FORMATIONS=['wall','wedge','circle'];
export const FORMATION_NAMES={wall:'Shield wall',wedge:'Wedge',circle:'Circle'};
export function normalizeSlot(slot={}){
  if(!slot||typeof slot!=='object')slot={};
  const weapon=Object.hasOwn(WEAPONS,slot.weapon)?slot.weapon:'sword';
  return {weapon,shield:WEAPONS[weapon].hands===2?'none':Object.hasOwn(SHIELDS,slot.shield)?slot.shield:'round'};
}
export const freshSquad=()=>[{weapon:'sword',shield:'round'},{weapon:'sword',shield:'tower'},{weapon:'sword',shield:'tower'},{weapon:'hammer',shield:'none'},{weapon:'spear',shield:'none'}];
export const normalizeSquad=squad=>Array.from({length:5},(_,i)=>normalizeSlot(Array.isArray(squad)?squad[i]:freshSquad()[i]));
export const OPPONENTS=[
  {name:'The Laurel Guard',formation:'wall',squad:freshSquad()},
  {name:'The Bronze Spears',formation:'wedge',squad:[{weapon:'sword',shield:'tower'},{weapon:'spear'},{weapon:'spear'},{weapon:'hammer'},{weapon:'bow'}]},
  {name:'The Marble Watch',formation:'circle',squad:[{weapon:'sword',shield:'round'},{weapon:'sword',shield:'tower'},{weapon:'hammer'},{weapon:'bow'},{weapon:'sword',shield:'round'}]},
  {name:'The Crimson Crests',formation:'wedge',squad:[{weapon:'hammer'},{weapon:'sword',shield:'round'},{weapon:'spear'},{weapon:'sword',shield:'tower'},{weapon:'bow'}]}
];
