import {drawBot} from '../art.js?v=roman37';
import {WEST_GATE,SOUTH_DOCK,EAST_DOCK,RETURN_POINTS} from './campaign.js?v=roman37';
import {drawCity} from './city.js?v=roman37';
import {drawLandscape as drawNorthernLandscape} from './scenery.js?v=roman37';
import {drawBossInterior} from './interior-art.js?v=roman37';

const clamp=(n,a,b)=>Math.max(a,Math.min(b,n));
const distance=(a,b)=>Math.hypot(a.x-b.x,a.y-b.y);
export const inRome=game=>!game.interior&&game.state.region==='north'&&(game.leader()||game.state.position).y>=130;
export const areaComplete=game=>game.regionComplete&&(!game.localQuest||game.localQuest.encounters.every(e=>game.state.completed.includes(e.id)));
export function localMapModel(game){
  const world=game.world,city=inRome(game),north=game.state.region==='north';
  if(game.interior){const e=game.roomBoss,dead=game.state.completed.includes(e.id);return {id:game.state.region+'-room',world,bounds:world.ROOM_BOUNDS,city:false,interior:true,completed:areaComplete(game),player:game.leader(),markers:[{...e,kind:dead?'victory':'boss',destination:e},{...world.EXIT,kind:'home',exit:true,destination:world.EXIT}]};}
  const bounds=city?{left:0,top:128,right:world.WIDTH,bottom:world.HEIGHT}:{left:0,top:0,right:world.WIDTH,bottom:north?130:world.HEIGHT};
  const exits=city?[
    {id:'north-exit',x:26,y:129.5,kind:'forest',destination:{x:26,y:127}},
    {id:'west-exit',...WEST_GATE,kind:'mountain',destination:WEST_GATE},
    {id:'south-exit',...SOUTH_DOCK,kind:'ship',destination:SOUTH_DOCK},
    {id:'east-exit',...EAST_DOCK,kind:'temple',destination:EAST_DOCK}
  ]:[{id:'rome-exit',...(north?{x:26,y:129}:RETURN_POINTS[game.state.region]),kind:'home',destination:north?{x:26,y:133}:RETURN_POINTS[game.state.region]}];
  const inside=p=>p.x>=bounds.left&&p.x<=bounds.right&&p.y>=bounds.top&&p.y<=bounds.bottom;
  const camps=city?[]:world.CAMPS.map(p=>({...p,kind:'camp',secured:game.state.camps.includes(p.id),destination:p}));
  const patrols=city?[]:game.encounters.filter(e=>e.kind!=='boss'&&!game.state.completed.includes(e.id)&&game.patrolGroups.get(e.id)?.some(u=>u.hp>0)).map(e=>({...e,kind:'enemy',destination:e}));
  const bosses=city?[]:game.encounters.filter(e=>e.kind==='boss').map(e=>{
    const wreck=game.bossWrecks.find(u=>u.encounterId===e.id),dead=game.state.completed.includes(e.id)||wreck&&!game.bossGroups.some(u=>u.encounterId===e.id&&u.hp>0);
    const position=dead&&wreck?{x:wreck.x,y:wreck.y}:e;
    return {...e,...position,kind:dead?'victory':'boss',destination:position};
  });
  if(!city)for(const wreck of game.bossWrecks)if(!bosses.some(p=>p.id===wreck.encounterId))bosses.push({id:wreck.encounterId,x:wreck.x,y:wreck.y,kind:'victory',destination:{x:wreck.x,y:wreck.y}});
  const home=inside(world.HOME)&&!exits.some(p=>distance(p,world.HOME)<4)?[{...world.HOME,kind:'home',destination:world.HOME}]:[];
  return {id:city?'rome':game.state.region,world,bounds,city,completed:!city&&areaComplete(game),
    markers:[...patrols,...home,...camps,...bosses,...exits.map(p=>({...p,exit:true}))],player:game.leader()||null};
}
export function localMapLayout(model,width,height,view={zoom:1,panX:0,panY:0}){
  const b=model.bounds,mapWidth=b.right-b.left,mapHeight=b.bottom-b.top,padding=25;
  const scale=Math.min((width-padding*2)/mapWidth,(height-padding*2)/mapHeight)*clamp(view.zoom||1,1,5);
  const maxX=Math.max(0,(mapWidth*scale-width+padding*2)/2),maxY=Math.max(0,(mapHeight*scale-height+padding*2)/2);
  const panX=clamp(view.panX||0,-maxX,maxX),panY=clamp(view.panY||0,-maxY,maxY);
  return {scale,panX,panY,ox:width/2-(b.left+b.right)*scale/2+panX,oy:height/2-(b.top+b.bottom)*scale/2+panY,width,height};
}
export function localMapHit(model,layout,p){
  return model.markers.map(marker=>({marker,d:distance(localMapMarkerPoint(model,layout,marker),p)})).filter(v=>v.d<(v.marker.kind==='enemy'?10:21)).sort((a,b)=>a.d-b.d)[0]?.marker||null;
}
export function localMapMarkerPoint(model,layout,marker){
  const p={x:marker.x*layout.scale+layout.ox,y:marker.y*layout.scale+layout.oy};
  if(!marker.exit||!model.player||p.x<-20||p.x>layout.width+20||p.y<-20||p.y>layout.height+20)return p;
  const player={x:model.player.x*layout.scale+layout.ox,y:model.player.y*layout.scale+layout.oy};
  if(distance(p,player)>=42)return p;
  // Keep the way out visible beside the soldier, with a tether to its exact
  // map position. Landing beside an exit must not hide it under the portrait.
  const places=[[50,0],[-50,0],[0,-50],[0,50]].map(([dx,dy])=>({x:p.x+dx,y:p.y+dy}));
  return places.find(q=>q.x>=20&&q.x<=layout.width-20&&q.y>=20&&q.y<=layout.height-20&&distance(q,player)>=42)||p;
}
function glyph(c,kind){
  c.lineWidth=2;c.lineJoin='round';c.lineCap='round';c.beginPath();
  if(kind==='camp'){c.moveTo(-8,7);c.lineTo(0,-8);c.lineTo(8,7);c.closePath();c.moveTo(-3,7);c.lineTo(0,-1);c.lineTo(3,7);}
  else if(kind==='home'){c.moveTo(-8,-1);c.lineTo(0,-8);c.lineTo(8,-1);c.moveTo(-6,-2);c.lineTo(-6,7);c.lineTo(6,7);c.lineTo(6,-2);c.moveTo(-2,7);c.lineTo(-2,1);c.lineTo(2,1);c.lineTo(2,7);}
  else if(kind==='forest'){c.moveTo(0,-9);c.lineTo(-7,3);c.lineTo(7,3);c.closePath();c.moveTo(0,3);c.lineTo(0,9);}
  else if(kind==='mountain'){c.moveTo(-10,7);c.lineTo(-3,-7);c.lineTo(3,3);c.lineTo(6,-2);c.lineTo(11,7);c.closePath();}
  else if(kind==='ship'){c.moveTo(-9,3);c.lineTo(-5,8);c.lineTo(5,8);c.lineTo(9,3);c.closePath();c.moveTo(-1,2);c.lineTo(-1,-9);c.lineTo(6,-1);c.lineTo(-1,-1);}
  else if(kind==='temple'){c.moveTo(-10,-3);c.lineTo(0,-9);c.lineTo(10,-3);c.closePath();for(const x of [-6,0,6]){c.moveTo(x,-1);c.lineTo(x,6);}c.moveTo(-10,8);c.lineTo(10,8);}
  else if(kind==='victory'){c.moveTo(-7,9);c.lineTo(-7,-9);c.lineTo(8,-9);c.lineTo(8,2);c.lineTo(-7,2);c.moveTo(-3,-4);c.lineTo(0,-1);c.lineTo(5,-6);}
  else{c.moveTo(-9,5);c.lineTo(-9,-6);c.lineTo(-4,-2);c.lineTo(0,-9);c.lineTo(4,-2);c.lineTo(9,-6);c.lineTo(9,5);c.closePath();c.moveTo(-9,8);c.lineTo(9,8);}
  c.stroke();
}
export function drawLocalMap(c,width,height,game,view={zoom:1}){
  const model=localMapModel(game),layout=localMapLayout(model,width,height,view),b=model.bounds;
  c.save();c.fillStyle='#183f42';c.fillRect(0,0,width,height);c.beginPath();c.rect(0,0,width,height);c.clip();
  c.save();c.translate(layout.ox,layout.oy);c.scale(layout.scale,layout.scale);
  const palettes={north:['#92bc7d','#e5d78f','#70b6c4','#416f59','#c5cdb8'],west:['#b6c77b','#e8d296','#6fbac9','#8d8c75','#d8c6a2'],south:['#9bbd8a','#eddaa1','#66b8c3','#747b62','#d6c3a7'],east:['#b0c4bb','#e9dfb2','#76bdcd','#708989','#deded1']};
  const palette=palettes[game.state.region],names=['grass','path','water','forest','stone'];
  const left=Math.max(b.left,Math.floor(-layout.ox/layout.scale)),right=Math.min(b.right,Math.ceil((width-layout.ox)/layout.scale));
  const top=Math.max(b.top,Math.floor(-layout.oy/layout.scale)),bottom=Math.min(b.bottom,Math.ceil((height-layout.oy)/layout.scale));
  for(let y=top;y<bottom;y++)for(let x=left;x<right;x++){
    const type=model.world.tileAt(x+.5,y+.5),index=names.indexOf(type);
    c.fillStyle=palette[index<0?3:index];c.fillRect(x,y,1.02,1.02);
    if(!model.world.passable(x+.5,y+.5)&&type!=='water'){c.fillStyle='#36595166';c.fillRect(x+.28,y+.26,.4,.45);}
  }
  if(model.city){
    c.save();c.beginPath();c.rect(b.left,b.top,b.right-b.left,b.bottom-b.top);c.clip();
    drawNorthernLandscape(c,{bounds:b,time:0,state:{...game.state,conquered:game.regionComplete}});drawCity(c,0,game.state);c.restore();
  }
  if(model.interior)drawBossInterior(c,{region:game.state.region,king:model.world.KING,time:0,completed:model.completed});
  c.strokeStyle='#b6cfbc';c.lineWidth=1/layout.scale;c.strokeRect(b.left,b.top,b.right-b.left,b.bottom-b.top);c.restore();
  for(const marker of model.markers){
    const actual={x:marker.x*layout.scale+layout.ox,y:marker.y*layout.scale+layout.oy},{x,y}=localMapMarkerPoint(model,layout,marker);
    if(x<-22||x>width+22||y<-22||y>height+22)continue;
    if(x!==actual.x||y!==actual.y){c.strokeStyle='#234b55';c.lineWidth=4;c.beginPath();c.moveTo(actual.x,actual.y);c.lineTo(x,y);c.stroke();c.strokeStyle='#ffe295';c.lineWidth=2;c.stroke();}
    if(marker.kind==='enemy'){
      c.save();c.translate(x,y);c.fillStyle='#e68f7b';c.strokeStyle='#633f43';c.lineWidth=1.4;c.beginPath();c.arc(0,0,4.5,0,Math.PI*2);c.fill();c.stroke();c.fillStyle='#663d41';c.fillRect(-2,-1,1.3,1.7);c.fillRect(.7,-1,1.3,1.7);c.restore();continue;
    }
    c.save();c.translate(x,y);c.fillStyle=marker.exit?'#ffe295':marker.kind==='victory'?'#a9e4b0':marker.kind==='boss'?'#f7b88d':marker.secured?'#c2e8b6':'#f8eed1';
    c.strokeStyle='#234b55';c.lineWidth=2.5;c.beginPath();c.arc(0,0,marker.exit?17:13,0,Math.PI*2);c.fill();c.stroke();glyph(c,marker.kind);
    if(marker.exit){c.fillStyle='#245b62';c.beginPath();c.moveTo(10,11);c.lineTo(18,11);c.lineTo(18,3);c.closePath();c.fill();}
    c.restore();
  }
  if(model.player){
    const u=model.player,x=u.x*layout.scale+layout.ox,y=u.y*layout.scale+layout.oy;
    c.save();c.translate(x,y);c.fillStyle='#78e9b5';c.strokeStyle='#183e57';c.lineWidth=3;c.beginPath();c.ellipse(0,1,19,17,0,0,Math.PI*2);c.fill();c.stroke();
    c.strokeStyle='#ffe28b';c.lineWidth=2;c.beginPath();c.ellipse(0,1,22,20,0,0,Math.PI*2);c.stroke();
    drawBot(c,{...u,x:0,y:5,angle:-.35,action:null,weaponTier:game.state.weaponTier,armorTier:game.state.armorTier},0,{size:28,promoted:true});c.restore();
  }
  c.restore();return {model,layout};
}
