// Painted panels change faction colors; weapon metals and safety markings stay familiar.
export const REPLAY_PALETTES=[
  {id:'cobalt',name:'Cobalt',color:'#538cdd',armor:'#607fab',highlight:'#c6e5ff'},
  {id:'crimson',name:'Crimson',color:'#d96870',armor:'#956976',highlight:'#ffe0cc'},
  {id:'amethyst',name:'Amethyst',color:'#a179cc',armor:'#89759c',highlight:'#e4d2ff'},
  {id:'turquoise',name:'Turquoise',color:'#47b6b0',armor:'#568a91',highlight:'#cff9ec'},
  {id:'amber',name:'Amber',color:'#e59b4d',armor:'#a48769',highlight:'#ffe6ae'},
  {id:'orchid',name:'Orchid',color:'#cf7faa',armor:'#94778d',highlight:'#ffe1ef'},
  {id:'jade',name:'Jade',color:'#68b986',armor:'#64897e',highlight:'#e9f3b6'},
  {id:'gold',name:'Gold',color:'#d9bc4d',armor:'#9b9266',highlight:'#fff5c4'}
];
export const replayPalette=id=>REPLAY_PALETTES.find(p=>p.id===id);
export function chooseReplayPalette(save,mission){
  const history=save.replayColors||{},previous=history[mission.r];
  const choices=REPLAY_PALETTES.filter(p=>p.id!==previous);
  const chosen=choices[Math.floor(Math.random()*choices.length)];
  save.replay.palette=chosen.id;
  save.replayColors={...history,[mission.r]:chosen.id};
}
export function ensureReplayPalette(save,mission){
  if(!replayPalette(save.replay.palette))chooseReplayPalette(save,mission);
  else save.replayColors={...save.replayColors,[mission.r]:save.replay.palette};
}
export function applyReplayColors(world,save){
  const replay=save?.replay;
  if(typeof replay?.mission!=='string'||!replayPalette(replay.palette))return world;
  for(const e of world.enemies)if(e.returnId===replay.mission&&!e.royal)e.replayPalette=replay.palette;
  return world;
}
