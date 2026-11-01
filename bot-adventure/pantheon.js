// A non-combat epilogue. Keep this separate from mission regions and enemies.
export const PANTHEON = Object.freeze({r:15,name:'Crown Pantheon',subtitle:'The ancient royal court sleeps',x:144,y:220,width:36,height:44,ground:'#91a9a6',dark:'#526d76',viewpoint:{x:162.5,y:242.5},entry:{x:149.5,y:220.5}});
export const inPantheon=(x,y)=>x>=144&&x<180&&y>=220&&y<264;
export const COURT=Object.freeze([
  {id:'crown-king',role:'king',x:159.2,y:237,size:4.2},
  {id:'crown-queen',role:'queen',x:165.8,y:237,size:3.8},
  {id:'crown-guard-nw',role:'guard',x:156.5,y:232.5,size:1.7},
  {id:'crown-guard-ne',role:'guard',x:168.5,y:232.5,size:1.7},
  {id:'crown-guard-sw',role:'guard',x:156.5,y:241,size:1.7},
  {id:'crown-guard-se',role:'guard',x:168.5,y:241,size:1.7}
].map(Object.freeze));
export const COLUMNS=[153.9,171.1].flatMap(x=>[230.5,236.5,242.5].map(y=>({x,y})));
export function buildPantheon(world){
  for(let y=220;y<264;y++)for(let x=144;x<180;x++){
    const key=`${x},${y}`;world.water.delete(key);world.blocks.delete(key);
    // The northern processional walk is the only entrance; other sides are cliffs.
    if(x<147||x>176||y>258||y<225&&(x<148||x>151)||y<229&&x>=153&&x<=172)world.blocks.add(key);
  }
  for(const p of [...COLUMNS,...COURT]){
    const radius=p.role?(p.role==='guard'?.55:1.05):.55;
    for(let y=Math.floor(p.y-radius);y<=Math.floor(p.y+radius);y++)for(let x=Math.floor(p.x-radius);x<=Math.floor(p.x+radius);x++)world.blocks.add(`${x},${y}`);
  }
  return {...world,court:COURT};
}
