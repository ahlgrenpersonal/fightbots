export const TILE_W=36,TILE_H=44;
export const LEGACY_TILES=[[[1,1],[1,2]],[[0,1],[0,0]],[[1,0],[2,0]],[[2,1]],[[2,2]],[[3,2],[3,1]],[[4,2],[5,2]],[[4,1],[5,1]],[[4,0]],[[5,0]],[[6,0],[7,0]],[[8,0],[8,1]],[[7,1],[7,2]],[[6,1]],[[6,2]]];
export const WORLD_TILES=[[[2,3],[2,4]],[[1,3],[1,2]],[[2,2],[3,2]],[[3,3]],[[3,4]],[[2,5],[2,6]],[[1,4],[1,5]],[[0,3],[0,4]],[[0,2]],[[1,1]],[[2,1],[2,0]],[[3,0],[3,1]],[[4,1],[4,2]],[[4,3]],[[4,4]]];
const index=tiles=>new Map(tiles.flatMap((sectors,r)=>sectors.map(([x,y],i)=>[`${x},${y}`,{r,i}])));
const oldIndex=index(LEGACY_TILES),newIndex=index(WORLD_TILES);
function transfer(point,from,to){
  if(!Number.isFinite(point?.x)||!Number.isFinite(point?.y))return null;
  const x=Math.floor(point.x/TILE_W),y=Math.floor(point.y/TILE_H),sector=from.get(`${x},${y}`);
  if(!sector)return null;const [nx,ny]=to[sector.r][sector.i];
  return {x:nx*TILE_W+point.x-x*TILE_W,y:ny*TILE_H+point.y-y*TILE_H};
}
export const relocatePoint=point=>transfer(point,oldIndex,WORLD_TILES);
export const legacyPoint=point=>transfer(point,newIndex,LEGACY_TILES);
export function relocateEntity(entity){
  const point=relocatePoint(entity);return point?{...entity,...point}:null;
}
export const relocateMission=mission=>({...relocateEntity(mission),sites:mission.sites.map(([x,y])=>{const p=relocatePoint({x,y});return [p.x,p.y];})});
export function worldGates(){
  const gates=[];
  for(const [key,{r}] of newIndex){const [x,y]=key.split(',').map(Number);
    for(const [dx,dy] of [[1,0],[0,1]]){const other=newIndex.get(`${x+dx},${y+dy}`);if(!other||other.r===r)continue;
      gates.push({r:Math.max(r,other.r),x:(x+(dx?1:0))*TILE_W+(dx?0:18.5),y:(y+(dy?1:0))*TILE_H+(dy?0:22.5),horizontal:!!dy});
    }
  }
  return gates;
}
