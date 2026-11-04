import {RETURNS,makeWorld} from './data.js?v=world88';
import {variantForRound} from './replay-variants.js?v=world88';

const missions=RETURNS.filter(m=>m.postRoyal);
const ids=missions.map(m=>m.id);
function shuffled(values){
  const result=[...values];
  for(let i=result.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[result[i],result[j]]=[result[j],result[i]];}
  return result;
}
function select(save,first=false,reset=true){
  const previous=save.replay;
  let remaining=[...new Set(previous?.remaining||[])].filter(id=>ids.includes(id)&&id!==previous?.mission);
  if(!remaining.length){
    remaining=shuffled(ids);
    if(remaining[0]===previous?.mission)[remaining[0],remaining[1]]=[remaining[1],remaining[0]];
  }
  const mission=first?'copper-twins':remaining.shift();
  save.replay={mission,phase:'region',round:(previous?.round||0)+1,remaining:remaining.filter(id=>id!==mission)};
  save.replay.variantStartBatch=previous?.variantStartBatch||2;
  save.replay.variant=variantForRound(mission,save.replay.round,ids.length,save.replay.variantStartBatch);
  if(!reset)return;
  // These bounded IDs belong only to replay content, never campaign progress.
  const prefixes=missions.map(m=>`${m.sitePrefix}-`);
  save.cleared=save.cleared.filter(id=>!prefixes.some(prefix=>id.startsWith(prefix)));
  save.kills=save.kills.filter(id=>!prefixes.some(prefix=>id.startsWith(prefix))&&!ids.some(prefix=>id.startsWith(`${prefix}-`)));
  save.returns=save.returns.filter(id=>!ids.includes(id));
}
export function initializeReplay(save){
  if(save.replay&&ids.includes(save.replay.mission)&&['region','court'].includes(save.replay.phase)){
    // Older champions keep their current encounter and reveal only one new kind next batch.
    if(!save.replay.variantStartBatch)save.replay.variantStartBatch=Math.max(2,Math.floor((Math.max(1,save.replay.round||1)-1)/ids.length)+2);
    return;
  }
  delete save.replay;
  const won=save.royalCourt?.phase==='victory',twins=save.returns.includes('copper-twins');
  if(!won&&!save.royalRematchStarted)return;
  if(!twins&&!save.royalRematchStarted){select(save,true,false);return;}
  save.replay={mission:'copper-twins',phase:'court',round:1,remaining:shuffled(ids.filter(id=>id!=='copper-twins'))};
  // An existing rematch keeps its exact stage and casualties.
  if(won&&save.royalRematchStarted)select(save);
}
export function beginReplay(game){
  if(game.save.replay?.phase==='region')return;
  select(game.save,!game.save.replay);
  const mission=game.save.replay.mission;
  game.world.enemies=makeWorld(game.save).enemies;
  game.enemies=game.enemies.filter(e=>!e.returnId||!ids.includes(e.returnId));
  game.enemies.push(...structuredClone(game.world.enemies.filter(e=>e.returnId===mission)));
}
export function completeReplay(save,id){
  if(save.replay?.phase==='region'&&save.replay.mission===id)save.replay.phase='court';
}
