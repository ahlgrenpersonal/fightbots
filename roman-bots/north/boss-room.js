const clamp=(n,a,b)=>Math.max(a,Math.min(b,n));
const rooms=new WeakMap();
export function bossRoomWorld(field){
  if(rooms.has(field))return rooms.get(field);
  const k=field.KING,bounds={left:k.x-7.5,right:k.x+7.5,top:k.y-8,bottom:k.y+8};
  const floor={minX:k.x-6.5,maxX:k.x+6.5,minY:k.y-5.8,maxY:k.y+6.4};
  const exit={id:'boss-exit',x:k.x,y:k.y+6.2};
  const passable=(x,y)=>Number.isFinite(x)&&Number.isFinite(y)&&x>=floor.minX&&x<=floor.maxX&&y>=floor.minY&&y<=floor.maxY;
  const nearestWalkable=p=>p&&Number.isFinite(p.x)&&Number.isFinite(p.y)?{x:clamp(p.x,floor.minX+.05,floor.maxX-.05),y:clamp(p.y,floor.minY+.05,floor.maxY-.05)}:null;
  const room={...field,room:true,ROOM_BOUNDS:bounds,FLOOR:floor,EXIT:exit,HOME:exit,CAMPS:[],SIGNPOSTS:[],ENCOUNTERS:field.ENCOUNTERS.filter(e=>e.kind==='boss'),
    passable,nearestWalkable,isSafe:()=>false,tileAt:(x,y)=>passable(x,y)?'stone':'wall',
    findPath:(a,b)=>passable(a?.x,a?.y)&&passable(b?.x,b?.y)?[{x:a.x,y:a.y},{x:b.x,y:b.y}]:[]};
  rooms.set(field,room);return room;
}
