// A non-combat epilogue. Keep this separate from mission regions and enemies.
export const PANTHEON = Object.freeze({r:15,name:'Crown Pantheon',subtitle:'The royal court waits beyond the sealed stairway',x:144,y:220,width:36,height:44,ground:'#91a9a6',dark:'#526d76',viewpoint:{x:162.5,y:255.5},stairTop:{x:162.5,y:247.5},entry:{x:149.5,y:220.5}});
export const TERRACE=Object.freeze({left:152,right:173,top:225,bottom:247});
export const STAIRWAY=Object.freeze({left:160,right:165,top:247,bottom:254.5});
export const inRoyalChamber=(x,y)=>x>=TERRACE.left&&x<TERRACE.right&&y>=TERRACE.top&&y<TERRACE.bottom;
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
  const courtWalls=new Set(),courtSeal=new Set();
  for(let y=220;y<264;y++)for(let x=144;x<180;x++){
    const key=`${x},${y}`;world.water.delete(key);world.blocks.delete(key);
    // The northern processional walk is the only entrance; other sides are cliffs.
    const structural=x<147||x>176||y>258||y<225&&(x<148||x>151)||y<229&&x>=153&&x<=172;
    if(structural)world.blocks.add(key);
    // No side or rear entry. Future missions may open only the central stair seal.
    if(inRoyalChamber(x,y)){
      const wall=x===TERRACE.left||x===TERRACE.right-1||y===TERRACE.top||y===TERRACE.bottom-1&&(x<STAIRWAY.left||x>=STAIRWAY.right);
      if(wall)courtWalls.add(key);else if(!structural)courtSeal.add(key);
      world.blocks.add(key);
    }
    if(y>=STAIRWAY.top&&y<Math.ceil(STAIRWAY.bottom)&&(x===STAIRWAY.left-1||x===STAIRWAY.right)){world.blocks.add(key);courtWalls.add(key);}
  }
  for(const p of [...COLUMNS,...COURT]){
    const radius=p.role?(p.role==='guard'?.55:1.05):.55;
    for(let y=Math.floor(p.y-radius);y<=Math.floor(p.y+radius);y++)for(let x=Math.floor(p.x-radius);x<=Math.floor(p.x+radius);x++){const key=`${x},${y}`;world.blocks.add(key);courtSeal.delete(key);}
  }
  return {...world,court:COURT,courtWalls,courtSeal};
}
