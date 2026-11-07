// Halloween runs own their replay progress; campaign records and equipment stay permanent.
export const HALLOWEEN_THEMES=[
  {id:'zombie',name:'Zombie Robots',color:'#80ab68',armor:'#566f60',highlight:'#d4ef9c',ground:'#647d69',path:'#b8b490'},
  {id:'skeleton',name:'Skeleton Robots',color:'#e5dfc2',armor:'#8b9b9d',highlight:'#fff5d4',ground:'#767b8a',path:'#c6c1b5'},
  {id:'mummy',name:'Mummy Robots',color:'#d9c998',armor:'#9b916e',highlight:'#fff0c1',ground:'#8c7e67',path:'#d1bf99'},
  {id:'vampire',name:'Vampire Robots',color:'#b58ebc',armor:'#67476e',highlight:'#ffcfb8',ground:'#73677e',path:'#beb0a8'},
  {id:'pumpkin',name:'Jack-o\u2019-lantern Robots',color:'#eea14c',armor:'#8b7055',highlight:'#fff0a0',ground:'#85745c',path:'#c8b88d'}
];
export const halloweenActive=save=>save?.replay?.mode==='halloween';
export const halloweenTheme=id=>HALLOWEEN_THEMES.find(t=>t.id===id);
export const regionHalloween=(save,r)=>halloweenActive(save)?halloweenTheme(save.replay.themes?.[r])||HALLOWEEN_THEMES[r%5]:null;
export const royalHalloween=(save,role)=>halloweenActive(save)?role==='king'?'zombie':role==='queen'?'mummy':'skeleton':'';
export const halloweenHealth=(hp,boss=false)=>Math.round(hp*(boss?1.35:1.25));
export function shuffled(values){
  const result=[...values];
  for(let i=result.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[result[i],result[j]]=[result[j],result[i]];}
  return result;
}
export function newHalloweenThemes(){return shuffled(Array.from({length:15},(_,r)=>HALLOWEEN_THEMES[r%5].id));}
export function applyHalloween(world,save){
  if(!halloweenActive(save))return world;
  for(const e of world.enemies){
    e.halloween=regionHalloween(save,e.r)?.id||'zombie';
    e.hp=halloweenHealth(e.hp,e.type==='boss');e.maxHp=halloweenHealth(e.maxHp,e.type==='boss');
  }
  for(const p of world.props)p.halloween=regionHalloween(save,p.r)?.id;
  return world;
}
