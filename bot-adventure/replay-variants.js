// Each full shuffled batch introduces one new encounter; earlier ones remain.
export const REPLAY_VARIANTS=[
  {id:'unequal-duo',mission:'replay-3',batch:2,name:'Bulwark & Flicker'},
  {id:'split-core',mission:'replay-6',batch:3,name:'The Splitcore'},
  {id:'verdant-vanguard',mission:'replay-12',batch:4,name:'The Emerald Marshal'}
];
export function variantForRound(mission,round,batchSize,startBatch=2){
  const batch=Math.floor((Math.max(1,round)-1)/batchSize)+1;
  return REPLAY_VARIANTS.find(v=>v.mission===mission&&v.batch+startBatch-2<=batch)?.id||'';
}
export function replayTitle(save,mission){
  return REPLAY_VARIANTS.find(v=>v.id===save.replay?.variant&&v.mission===mission?.id)?.name||mission?.boss;
}
export function applyReplayVariants(world,save){
  const variant=REPLAY_VARIANTS.find(v=>v.id===save?.replay?.variant&&v.mission===save.replay.mission);
  if(!variant)return world;
  const original=world.enemies.find(e=>e.returnId===variant.mission&&e.type==='boss');
  if(!original)return world;
  const anchor={x:original.x,y:original.y};
  const place=(dx,dy)=>{
    const choices=[{x:anchor.x+dx,y:anchor.y+dy},{x:anchor.x,y:anchor.y+dy},{...anchor}];
    return choices.find(p=>!world.blocks.has(`${Math.floor(p.x)},${Math.floor(p.y)}`)&&!world.water.has(`${Math.floor(p.x)},${Math.floor(p.y)}`))||anchor;
  };
  const boss=(suffix,hp,role,size,dx=0,dy=0,extra={})=>{
    const p=place(dx,dy);
    return {...original,...p,id:`${original.id}-${suffix}`,homeX:p.x,homeY:p.y,hp,maxHp:hp,
      encounterRole:role,size,replayVariant:variant.id,...extra};
  };
  let bosses;
  if(variant.id==='unequal-duo'){
    bosses=[boss('bulwark',10500,'bruiser',1.9,-1.3),boss('flicker',6500,'skirmisher',1.25,1.3)];
  }else if(variant.id==='split-core'){
    const parent=boss('shell',9000,'splitter',1.95);
    bosses=[parent,...[-1,1].map((side,i)=>boss(`fragment-${i}`,4200,'fragment',1.15,side*1.25,0,
      {spawnParent:parent.id,splitSide:side,dormant:true}))];
  }else{
    bosses=[boss('marshal',14000,'vanguard',1.9,0,0,
      {replayLook:{weapon:'lightning',armor:'bastion',wheels:'rover',color:'#4cbf8b'}})];
    const types=['shield','ranged','hopper','sentry','medic'];
    let index=0;
    for(const e of world.enemies.filter(e=>e.returnId===variant.mission&&e.site)){
      const type=types[index++%types.length];
      Object.assign(e,{type,encounterRole:'vanguard',replayVariant:variant.id,
        replayLook:{color:type==='medic'?'#a4d6b5':'#4cbf8b',armor:type==='shield'?'bastion':'steel',wheels:'rover'}});
    }
  }
  world.enemies=world.enemies.filter(e=>e.returnId!==variant.mission||e.type!=='boss').concat(bosses);
  return world;
}
