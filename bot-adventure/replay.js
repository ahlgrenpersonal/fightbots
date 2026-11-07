import {halloweenActive,shuffled,newHalloweenThemes,halloweenTheme} from './halloween.js?v=world94';
import {RETURNS,HALLOWEEN_MISSIONS,makeWorld} from './data.js?v=world94';
import {chooseReplayBoss} from './replay-variants.js?v=world94';
import {chooseReplayPalette,ensureReplayPalette} from './replay-colors.js?v=world94';

const missions=RETURNS.filter(m=>m.postRoyal&&!m.halloween);
const ids=missions.map(m=>m.id);
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
  save.replay.variant=chooseReplayBoss(save,save.replay.round);
  chooseReplayPalette(save,missions.find(m=>m.id===mission));
  if(!reset)return;
  // These bounded IDs belong only to replay content, never campaign progress.
  const prefixes=missions.map(m=>`${m.sitePrefix}-`);
  save.cleared=save.cleared.filter(id=>!prefixes.some(prefix=>id.startsWith(prefix)));
  save.kills=save.kills.filter(id=>!prefixes.some(prefix=>id.startsWith(prefix))&&!ids.some(prefix=>id.startsWith(`${prefix}-`)));
  save.returns=save.returns.filter(id=>!ids.includes(id));
}
export function initializeReplay(save){
  if(halloweenActive(save)&&HALLOWEEN_MISSIONS.some(m=>m.id===save.replay.mission)&&['region','court'].includes(save.replay.phase)){
    const hids=HALLOWEEN_MISSIONS.map(m=>m.id);
    save.replay.conquered=[...new Set(save.replay.conquered||[])].filter(id=>hids.includes(id));
    save.replay.remaining=[...new Set(save.replay.remaining||[])].filter(id=>hids.includes(id)&&id!==save.replay.mission&&!save.replay.conquered.includes(id));
    if(!Array.isArray(save.replay.themes)||save.replay.themes.length!==15||save.replay.themes.some(id=>!halloweenTheme(id)))save.replay.themes=newHalloweenThemes();
    return;
  }
  if(save.replay&&ids.includes(save.replay.mission)&&['region','court'].includes(save.replay.phase)){
    // Older champions keep their current encounter and its saved appearance.
    if(!save.replay.variantStartBatch)save.replay.variantStartBatch=Math.max(2,Math.floor((Math.max(1,save.replay.round||1)-1)/ids.length)+2);
    ensureReplayPalette(save,missions.find(m=>m.id===save.replay.mission));
    return;
  }
  delete save.replay;
  const won=save.royalCourt?.phase==='victory',twins=save.returns.includes('copper-twins');
  if(!won&&!save.royalRematchStarted)return;
  if(!twins&&!save.royalRematchStarted){select(save,true,false);return;}
  save.replay={mission:'copper-twins',phase:'court',round:1,remaining:shuffled(ids.filter(id=>id!=='copper-twins'))};
  chooseReplayPalette(save,missions.find(m=>m.id==='copper-twins'));
  // An existing rematch keeps its exact stage and casualties.
  if(won&&save.royalRematchStarted)select(save);
}
function startHalloween(save,normal){
  const deck=shuffled(HALLOWEEN_MISSIONS.map(m=>m.id));
  save.replay={mode:'halloween',mission:deck.shift(),remaining:deck,conquered:[],phase:'region',themes:newHalloweenThemes(),normal};
}
export function beginReplay(game){
  const save=game.save;
  if(save.replay?.phase==='region')return;
  game.patrols?.snapshot();
  for(const record of Object.values(save.patrols||{}))if(record.mobs)record.suspended=true;
  game.patrols?.loaded.clear();game.patrols?.restoring.clear();
  const previous=save.replay;
  const cycle=save.replayCycle||{introduced:false,cooldown:0};
  if(halloweenActive(save)){
    save.replay=previous.normal;
    cycle.cooldown=2+Math.floor(Math.random()*2);
    select(save,!save.replay);
  }else if(!cycle.introduced||cycle.cooldown<=1){
    cycle.introduced=true;cycle.cooldown=0;startHalloween(save,previous);
  }else{
    cycle.cooldown--;select(save,!save.replay);
  }
  save.replayCycle=cycle;
  // Only repeatable quest records reset; inventory, campaign, treasure and patrol records remain.
  const repeatable=RETURNS.filter(m=>m.postRoyal),prefixes=repeatable.map(m=>`${m.sitePrefix}-`);
  save.cleared=save.cleared.filter(id=>!prefixes.some(prefix=>id.startsWith(prefix)));
  save.kills=save.kills.filter(id=>!prefixes.some(prefix=>id.startsWith(prefix))&&!repeatable.some(m=>id.startsWith(`${m.id}-`)));
  save.returns=save.returns.filter(id=>!repeatable.some(m=>m.id===id));
  const refreshed=makeWorld(save);game.world.enemies=refreshed.enemies;game.world.props=refreshed.props;
  game.enemies=game.enemies.filter(e=>e.royal);
  game.enemies.push(...structuredClone(game.world.enemies.filter(e=>!save.kills.includes(e.id)&&!save.cleared.includes(e.site)&&!(e.returnId?save.returns.includes(e.returnId):!e.encounterId&&e.type==='boss'&&save.bosses.includes(e.r)))));
}
export function completeReplay(save,id){
  if(halloweenActive(save)){
    if(save.replay.phase!=='region'||!HALLOWEEN_MISSIONS.some(m=>m.id===id)||save.replay.conquered.includes(id))return;
    save.replay.conquered.push(id);
    save.replay.remaining=save.replay.remaining.filter(m=>m!==id);
    if(save.replay.conquered.length===HALLOWEEN_MISSIONS.length)save.replay.phase='court';
    else if(save.replay.mission===id)save.replay.mission=save.replay.remaining.shift();
  }else if(save.replay?.phase==='region'&&save.replay.mission===id)save.replay.phase='court';
}
