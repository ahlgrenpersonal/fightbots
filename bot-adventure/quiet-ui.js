import {REGIONS,RETURNS,returnActive,requiredCells,cellsIn} from './data.js?v=world87';

export function localProgress(save,r){
  if(r<0||r>=REGIONS.length)return null;
  const mission=RETURNS.find(m=>m.r===r&&returnActive(save,m));
  if(mission)return {total:mission.sites.length,count:mission.sites.filter((_,i)=>save.cleared.includes(`${mission.sitePrefix}-${i}`)).length};
  if(save.bosses.includes(r))return null;
  return {total:requiredCells(r),count:cellsIn(save,r)};
}

export function atlasSiteVisible(site,{detail=false,goal}={}){
  return detail||!!goal&&Math.hypot(site.x-goal.x,site.y-goal.y)<.1;
}
