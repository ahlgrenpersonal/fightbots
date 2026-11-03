import * as NORTH from './world.js?v=roman26';
import * as WEST from './west-world.js?v=roman26';
import * as SOUTH from './south-world.js?v=roman26';

export const HARBOR_FRONT=Object.freeze({left:38,top:120,right:47.8,bottom:129.5});
export const inHarbor=p=>!!p&&p.x>=HARBOR_FRONT.left&&p.x<=HARBOR_FRONT.right&&p.y>=HARBOR_FRONT.top&&p.y<=HARBOR_FRONT.bottom;
function quest(id,region,kind,sites,{hpScale=1.4,waves=3,stage=3}={}){
  return Object.freeze({id,region,kind,encounters:Object.freeze(sites.map((p,i)=>Object.freeze({
    id:`${id}-${i+1}`,x:p.x,y:p.y,quest:id,stage,kind:i===sites.length-1?'boss':i%4===2?'elite':'patrol',
    waves,count:5,reward:i===sites.length-1?240:55,hpScale,
    roster:i%3===0?'skirmish':i%3===1?'breakers':'phalanx',
    ...(i===sites.length-1?{pairBosses:true}:{}),
    ...(kind==='invasion'?{ordered:true}:{}),
  })))});
}
const northSites=[...NORTH.ENCOUNTERS.filter(e=>e.stage===1&&[0,1,2,4,6,7,8,9].includes(Number(e.id.split('-').at(-1))-1)),
  ...NORTH.ENCOUNTERS.filter(e=>e.stage===2&&e.id!=='north-3-9'),NORTH.ENCOUNTERS.find(e=>e.id==='north-3-9')];
export const PLUNDERERS=quest('forest-plunderers','north','plunderers',[northSites[0],northSites[2],northSites[6],northSites[7],...northSites.slice(8)]);
const westSites=[1,2,3].flatMap(stage=>WEST.ENCOUNTERS.filter(e=>e.stage===stage&&[0,4,6,10].includes(Number(e.id.split('-').at(-1))-1)));
export const REVOLT=quest('highland-revolt','west','revolt',westSites,{hpScale:1.35});
const southSites=[2,1,0].flatMap(stage=>SOUTH.ENCOUNTERS.filter(e=>e.stage===stage&&[0,2,6,10,12].includes(Number(e.id.split('-').at(-1))-1)));
export const PIRATES=quest('coastal-pirates','south','pirates',southSites,{hpScale:1.15});
export const INVASION=quest('harbor-defense','north','invasion',[
  {x:45,y:122},{x:41,y:125},{x:45,y:127},{x:40,y:122},{x:44,y:125},{x:43,y:123}
],{hpScale:1.5,waves:6,stage:4});
export const RETURN_QUESTS=Object.freeze([PLUNDERERS,REVOLT,PIRATES,INVASION]);
export const questFinished=(state,q)=>q.encounters.every(e=>state.completed.includes(e.id));
export function activeReturnQuest(state){
  if(state.prologueRound<15)return null;
  // An unfinished invasion takes precedence at the three-conquest milestone.
  // Earlier return-mission clears remain saved and resume after the defense.
  if(state.conquered&&state.westConquered&&state.southConquered&&!state.eastConquered&&!questFinished(state,INVASION))return INVASION;
  return RETURN_QUESTS.slice(0,3).find(q=>state[q===PLUNDERERS?'conquered':q===REVOLT?'westConquered':'southConquered']&&!questFinished(state,q))||null;
}
