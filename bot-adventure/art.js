import { REGIONS, WORLD_W, WORLD_H, HOME, hash, regionAt, cellsIn, unlockedRegion, REGION_W, REGION_H, REGION_TILES, regionOrigin, relayFor, atlasLayout, isRoad, requiredCells, GATES } from './data.js?v=world75';
import {PANTHEON,areaInfo,pantheonUnlocked} from './data.js?v=world75';
import {COURT} from './pantheon.js?v=world75';
import {templeGround,templeFloor,templeArchitecture,templeColumns,templeSeal,sleepingRoyal,pantheonMarker} from './pantheon-art.js?v=world75';
import * as worldData from './data.js?v=world75';

export function rounded(c,x,y,w,h,r,fill,stroke,line=2) {
  c.beginPath();c.roundRect(x,y,w,h,r);if(fill){c.fillStyle=fill;c.fill();}if(stroke){c.strokeStyle=stroke;c.lineWidth=line;c.stroke();}
}
function ellipse(c,x,y,rx,ry,fill){c.beginPath();c.ellipse(x,y,rx,ry,0,0,Math.PI*2);c.fillStyle=fill;c.fill();}
function line(c,x,y,x2,y2,color,width=2){c.beginPath();c.moveTo(x,y);c.lineTo(x2,y2);c.strokeStyle=color;c.lineWidth=width;c.stroke();}
function text(c,s,x,y,size=12,color='#fff',align='center'){c.font=`800 ${size}px system-ui`;c.textAlign=align;c.fillStyle=color;c.fillText(s,x,y);}
function bolt(c,x,y,s,color){c.beginPath();c.moveTo(x+s*.15,y-s*.55);c.lineTo(x-s*.3,y+s*.08);c.lineTo(x,y+s*.02);c.lineTo(x-s*.1,y+s*.55);c.lineTo(x+s*.35,y-s*.1);c.lineTo(x+s*.05,y-s*.05);c.closePath();c.fillStyle=color;c.fill();}
function shade(hex,amount){const n=parseInt(hex.slice(1),16);return `rgb(${[(n>>16)&255,(n>>8)&255,n&255].map(v=>Math.max(0,Math.min(255,Math.round(v+amount)))).join(',')})`;}
function polygon(c,points,fill,stroke='#20363a',width=2){c.beginPath();points.forEach(([x,y],i)=>i?c.lineTo(x,y):c.moveTo(x,y));c.closePath();if(fill){c.fillStyle=fill;c.fill();}if(stroke){c.strokeStyle=stroke;c.lineWidth=width;c.stroke();}}
function ring(c,x,y,r,color,width=2){c.beginPath();c.arc(x,y,r,0,Math.PI*2);c.strokeStyle=color;c.lineWidth=width;c.stroke();}
function novaStar(c,x,y,r,fill,stroke='#20363a',width=2){const points=[];for(let i=0;i<10;i++){const a=i*Math.PI/5-Math.PI/2,d=i%2?r*.44:r;points.push([x+Math.cos(a)*d,y+Math.sin(a)*d]);}polygon(c,points,fill,stroke,width);}
function blade(c,t=0,enemy=false){c.save();c.rotate(t);polygon(c,[[-17,-12],[2,-5],[18,-14],[10,1],[17,12],[-2,6],[-18,14],[-10,-1]],enemy?'#ffd8c9':'#e6f6ef');line(c,-12,-8,12,8,enemy?'#c25c76':'#63b9ad',3);ellipse(c,0,0,4,4,'#ffc85c');c.restore();}
function drone(c,t=0,enemy=false){rounded(c,-12,-7,24,16,4,enemy?'#ed9b85':'#f5cd68','#20363a',2);rounded(c,-8,-4,16,7,2,'#294c60');ellipse(c,-4,-1,2,2,enemy?'#ffe0b8':'#caffed');ellipse(c,4,-1,2,2,enemy?'#ffe0b8':'#caffed');for(const side of [-1,1]){line(c,side*10,-5,side*19,-10,'#385666',3);ellipse(c,side*19,-11,9,2,enemy?'#f2abc2':'#b8e9e8');line(c,side*19-7,-11,side*19+7,-11,'#fff8cc',1.5);}line(c,-5,11,5,11,'#f4fff9',2);}
function armorArt(c,id){
  const colors={light:'#80c29a',steel:'#a5b8bd',heavy:'#e4bb67',reflect:'#b5f5f5',bastion:'#547d9a',polar:'#d9f8ff',star:'#f1d479'};
  polygon(c,[[-22,-24],[0,-29],[22,-24],[21,9],[13,23],[0,30],[-13,23],[-21,9]],colors[id]||colors.light);
  polygon(c,[[-15,-18],[0,-22],[15,-18],[14,7],[0,21],[-14,7]],'#ffffff30',null);
  if(id==='bastion'){for(const x of [-17,0,17])rounded(c,x-4,-30,8,13,1,'#c9dce3','#20363a',2);line(c,-13,0,13,0,'#f4d27d',5);}
  else if(id==='polar'){for(let i=0;i<3;i++){c.save();c.rotate(i*Math.PI/3);line(c,0,-15,0,15,'#398aa8',3);for(const s of [-1,1]){line(c,0,s*9,-4,s*5,'#398aa8',2);line(c,0,s*9,4,s*5,'#398aa8',2);}c.restore();}}
  else if(id==='star'){const pts=[];for(let i=0;i<10;i++){const a=i*Math.PI/5-Math.PI/2,r=i%2?7:16;pts.push([Math.cos(a)*r,Math.sin(a)*r]);}polygon(c,pts,'#fffbed','#607ca0',2);}
  else if(id==='reflect'){line(c,-12,-15,10,14,'#fff',5);line(c,0,-18,15,0,'#fff',2);}
  else{for(const x of [-14,14])for(const y of [-15,10])ellipse(c,x,y,2,2,'#fff5c8');bolt(c,0,0,22,'#294e61');}
}
function wheelArt(c,id,t=0){
  if(id==='hover'){rounded(c,-11,-15,22,30,7,'#e1f6ef','#20363a',3);rounded(c,-7,-10,14,19,4,'#48677d');for(let i=0;i<3;i++)line(c,-9+i*2,18+i*4,9-i*2,18+i*4,'#69dcd8',2);return;}
  rounded(c,-13,-23,26,46,id==='treads'?5:11,'#263e48','#172e36',3);
  for(let j=0;j<6;j++){const y=-18+j*7+(t%1)*3;line(c,-10,y,-5,y+3,'#92a9a6',3);line(c,5,y+3,10,y,'#92a9a6',3);}
  ellipse(c,0,0,8,14,id==='speed'?'#59b9e3':id==='rover'?'#f4d079':id==='grip'?'#85c899':'#aec5c7');ellipse(c,0,0,4,7,'#365465');
  if(id==='grip')for(const y of [-17,-6,5,16]){line(c,-12,y-3,-5,y+2,'#d5bb70',3);line(c,5,y+2,12,y-3,'#d5bb70',3);}
  if(id==='rover')for(const y of [-14,14])rounded(c,-16,y-3,32,6,2,'#c4d4d1','#20363a',2);
}
function gadgetArt(c,id,t=0){
  if(id==='buddy'){drone(c,t);return;}
  if(id==='aegis'||id==='shield'){armorArt(c,id==='aegis'?'star':'reflect');ring(c,0,0,32,'#75dcd6',2);return;}
  if(id==='magnet'){c.beginPath();c.arc(0,-4,17,0,Math.PI);c.strokeStyle='#df6c60';c.lineWidth=10;c.stroke();for(const x of [-17,17])rounded(c,x-5,-20,10,17,2,x<0?'#74cbe1':'#fff4d0','#20363a',2);return;}
  rounded(c,-19,-22,38,44,6,id==='capacitor'?'#f2cd64':'#96c4b6','#20363a',3);
  if(id==='capacitor'){for(const x of [-10,10])rounded(c,x-4,-28,8,8,1,'#c9e5e2','#20363a',2);bolt(c,0,0,31,'#fffce2');}
  else if(id==='vacuum'){rounded(c,-12,-14,24,20,4,'#314f64');for(let i=0;i<3;i++)line(c,-8+i*8,-10,-8+i*8,2,'#b7e7e9',2);polygon(c,[[-10,13],[10,13],[23,24],[-23,24]],'#d9e8e4');}
  else if(id==='repair'){line(c,-11,0,11,0,'#fffbd9',8);line(c,0,-11,0,11,'#fffbd9',8);}
  else{rounded(c,-12,-9,24,20,3,'#456779');line(c,-9,-5,9,-5,'#dff5db',3);}
}
export function categoryIcon(c,type,t=0){c.save();c.translate(22,18);const scale=type==='armor'?.58:.6;c.scale(scale,scale);if(type==='weapon'){c.translate(-31,-4);weapon(c,'blaster',t);}else if(type==='armor')armorArt(c,'steel');else if(type==='wheels')wheelArt(c,'rover');else{for(const [x,y,r] of [[-12,4,18],[16,-10,13]]){c.save();c.translate(x,y);polygon(c,Array.from({length:32},(_,i)=>{const a=i*Math.PI/16,s=i%4<2?r:r*.76;return [Math.cos(a)*s,Math.sin(a)*s];}),'#efd075');ellipse(c,0,0,r*.35,r*.35,'#345465');c.restore();}}c.restore();}
export function equipmentIcon(c,type,id,t=0){c.save();c.translate(34,34);if(type==='weapon'){c.scale(.75,.75);c.translate(-29,0);weapon(c,id,t);}else{c.scale(.8,.8);if(type==='armor')armorArt(c,id);else if(type==='wheels')wheelArt(c,id,t);else gadgetArt(c,id,t);}c.restore();}
const workshops=()=>worldData.WORKSHOPS||[{id:'home',r:0,...HOME}];
function returnVisible(save,entity){if(!entity.returnId)return true;const mission=(worldData.RETURNS||[]).find(m=>m.id===entity.returnId);return !!mission&&(worldData.returnActive?worldData.returnActive(save,mission):mission.unlock<=unlockedRegion(save)&&!(save.returns||[]).includes(mission.id));}
function bossEquipment(enemy){
  const r=typeof enemy==='number'?enemy:enemy.r;
  if(worldData.bossProfile){const {weapon,...profile}=worldData.bossProfile(enemy);return {...profile,gun:weapon};}
  const theme=REGIONS[r]?.theme;
  const guns={coast:'boomerang',scrapyard:'tractor',jungle:'flame',storm:'rail',fortress:'gravity',aurora:'frost',lunar:'meteor',garden:'drone',orbital:'rail',ancient:'gravity'};
  return {gun:r<5?['bumper','hammer','lightning','rocket','rocket'][r]:guns[theme]||'rail',armor:r===2?'reflect':r<5?'heavy':['aurora','lunar'].includes(theme)?'polar':['orbital','ancient'].includes(theme)?'star':'bastion',wheels:r>=5&&['lunar','orbital','storm'].includes(theme)?'hover':r>=5?'rover':'basic'};
}
function enemyEquipment(enemy){
  const boss=enemy.type==='boss',reg=REGIONS[enemy.r]||REGIONS[0],colors=['#b4a17b','#a97d6a','#728fb4','#be884d','#947daa'];
  const look={color:colors[enemy.r]||reg.accent||'#83b8ad',...bossEquipment(enemy)};
  if(!boss){look.armor=enemy.type==='tank'||enemy.type==='shield'?'steel':'light';look.gun=enemy.type==='ranged'?'blaster':enemy.type==='sentry'?'rail':enemy.type==='medic'?'drone':'bumper';}
  if(enemy.returnId){
    if(boss&&enemy.returnId==='copper-return')Object.assign(look,{gun:'tractor',armor:'bastion',wheels:'rover',color:'#ce7258',gadget:'aegis'});
    else if(boss&&enemy.returnId==='crystal-return')Object.assign(look,{gun:'frost',armor:'polar',wheels:'hover',color:'#82cddd'});
    else if(!boss){const variant=Array.from(enemy.id||'').reduce((sum,char)=>sum+char.charCodeAt(0),0)%4;Object.assign(look,{color:['#9b73b8','#ae7962','#84649f','#bd8e73'][variant],armor:'steel',wheels:enemy.returnId==='crystal-return'?'hover':'rover'});}
  }
  if(boss&&worldData.bossProfile)Object.assign(look,bossEquipment(enemy));
  return look;
}
function encounterRole(enemy){
  return enemy.encounterId==='harbor-duo'||enemy.encounterId==='scrap-split'?enemy.encounterRole||'':'';
}
function encounterShell(c,role,color){
  const ink='#20363a';
  if(role==='bruiser'){
    for(const side of [-1,1]){
      rounded(c,side<0?-35:23,-25,12,43,4,color,ink,3);
      for(const y of [-17,9])rounded(c,side*29-4,y,8,5,1,'#ffe2a2',ink,1.5);
    }
    rounded(c,-21,19,42,8,2,'#f3cd80',ink,2);
    for(const x of [-12,0,12])line(c,x-3,20,x+2,25,ink,3);
  }else if(role==='skirmisher'){
    for(const side of [-1,1]){
      polygon(c,[[side*22,0],[side*31,11],[side*26,23],[side*20,18]],color,ink,2);
      line(c,side*24,11,side*27,15,'#d9faff',2);
    }
    rounded(c,-18,-28,36,6,2,'#c6efff',ink,2);
    line(c,-16,22,-5,22,'#d9faff',3);line(c,5,22,16,22,'#d9faff',3);
  }else if(role==='splitter'){
    // Three interlocked shell courses leave the eye and mouth bands unobstructed.
    for(const y of [-23,0,22]){
      rounded(c,-28,y-3,56,6,2,ink);
      line(c,-24,y-1,24,y-1,'#ead6ff',2);
      for(const x of [-19,19])rounded(c,x-3,y-4,6,9,1,'#bda0de',ink,1.5);
    }
    for(const side of [-1,1])polygon(c,[[side*23,-19],[side*31,-15],[side*31,-4],[side*23,-1]],color,ink,2);
  }else if(role==='fragment'){
    for(const side of [-1,1]){
      polygon(c,[[side*20,-23],[side*29,-29],[side*32,-18],[side*25,-13]],color,ink,2);
      rounded(c,side*23-3,17,6,7,1,'#ead6ff',ink,1.5);
    }
    line(c,-17,23,17,23,'#ead6ff',3);
  }
}
function workshopMarker(c,x,y){
  c.save();c.translate(x,y);ellipse(c,0,1,15,15,'#fff7d7');polygon(c,[[-12,-3],[0,-13],[12,-3]],'#1c3e64','#fff7d7',2);rounded(c,-10,-3,20,15,2,'#1c3e64','#fff7d7',2);rounded(c,-3,3,6,9,1,'#fff7d7');for(const side of [-1,1])rounded(c,side*6-2,1,4,4,1,'#fff7d7');c.restore();
}
function bossOutline(c,theme){
  const ink='#20363a',metal='#b6cfcb';
  for(const side of [-1,1]){
    c.save();c.scale(side,1);
    if(theme==='coast'){
      rounded(c,27,-17,13,39,6,metal,ink,2);line(c,33,-9,33,13,'#477f91',3);
      polygon(c,[[20,-31],[32,-48],[40,-31]],'#e8d18c',ink,2);
    }else if(theme==='scrapyard'){
      line(c,25,-12,40,-29,ink,7);rounded(c,34,-42,15,28,2,'#9cb6af',ink,2);
      rounded(c,34,-44,5,9,1,'#e9cf83',ink,1.5);rounded(c,44,-44,5,9,1,'#e9cf83',ink,1.5);
    }else if(theme==='jungle'){
      polygon(c,[[24,-22],[37,-43],[47,-29],[35,3],[25,10]],'#82b99b',ink,2);
      line(c,32,-7,38,-30,'#d6e6ae',2);
    }else if(theme==='storm'){
      line(c,23,-20,39,-39,ink,5);for(const y of [-30,-38,-46])ellipse(c,39,y,9,3,'#b9e5e9');
      line(c,39,-49,39,-56,'#e9e9bb',3);
    }else if(theme==='fortress'){
      rounded(c,25,-33,18,57,2,'#829da7',ink,2);for(const x of [25,37])rounded(c,x,-43,6,14,1,metal,ink,2);
      line(c,31,-18,37,-18,'#e5d08a',3);
    }else if(theme==='aurora'){
      polygon(c,[[24,18],[27,-30],[35,-52],[42,-22],[39,20]],'#b4e7ed',ink,2);
      line(c,35,-41,34,10,'#f2fff8',2);
    }else if(theme==='lunar'){
      rounded(c,26,-20,19,40,9,'#dbe2d1',ink,2);ellipse(c,35,-10,6,6,'#486f86');
      line(c,35,1,35,12,'#91c3ce',3);
    }else if(theme==='garden'){
      line(c,25,-15,36,-33,ink,5);for(const [x,y] of [[30,-35],[40,-35],[35,-44]])ellipse(c,x,y,7,7,'#88bb97');
      ellipse(c,35,-36,4,4,'#f9e9ad');
    }else if(theme==='orbital'){
      line(c,25,-13,40,-20,metal,5);rounded(c,33,-43,21,39,2,'#3f6d87',ink,2);
      for(const y of [-35,-24,-13])line(c,36,y,51,y,'#9bd2d5',1.5);line(c,44,-40,44,-7,'#9bd2d5',1.5);
    }else if(theme==='ancient'){
      polygon(c,[[25,23],[26,-29],[36,-48],[47,-29],[43,23]],'#b3c9a6',ink,2);
      polygon(c,[[31,-21],[36,-30],[41,-21],[36,-12]],'#eadca0',ink,1.5);line(c,36,-6,36,13,ink,2);
    }
    c.restore();
  }
}
function arenaFloor(c,arena){
  const reg=REGIONS[arena.r];if(!reg)return;
  const radius=Number.isFinite(arena.radius)?arena.radius:3.8,theme=reg.theme||['meadow','woodland','crystal','solar','sky'][arena.r];
  c.save();c.translate(arena.x,arena.y);
  ellipse(c,0,0,radius,radius,reg.path+'b8');
  ring(c,0,0,radius*.94,reg.dark+'55',.045);
  c.setLineDash([.22,.14]);ring(c,0,0,radius*.84,reg.dark+'45',.035);c.setLineDash([]);
  // Ground markings stay static and subdued so danger telegraphs remain dominant.
  const count=theme==='ancient'?5:theme==='lunar'?6:8;
  for(let i=0;i<count;i++){
    c.save();c.rotate(i*Math.PI*2/count);c.translate(0,-radius*.69);
    const ink=reg.dark+'78',accent=reg.accent+'a0';
    if(theme==='meadow'){
      for(const [x,y] of [[-.1,-.09],[.1,-.09],[0,.09]]){c.beginPath();c.ellipse(x,y,.12,.11,0,0,Math.PI*2);c.strokeStyle=ink;c.lineWidth=.025;c.stroke();}
      line(c,0,.14,.08,.3,ink,.025);
    }else if(theme==='woodland'){
      c.beginPath();c.moveTo(0,.28);c.quadraticCurveTo(-.4,-.05,0,-.32);c.quadraticCurveTo(.4,-.05,0,.28);c.strokeStyle=ink;c.lineWidth=.03;c.stroke();
      line(c,0,-.23,0,.32,ink,.025);line(c,0,.03,.13,-.08,ink,.02);
    }else if(theme==='crystal'){
      polygon(c,[[-.22,.22],[-.2,-.12],[-.09,-.3],[.02,-.1],[.04,.22]],null,ink,.03);
      polygon(c,[[.03,.22],[.05,-.02],[.17,-.2],[.27,.02],[.25,.22]],null,ink,.03);
    }else if(theme==='solar'){
      rounded(c,-.28,-.22,.56,.44,.02,null,ink,.03);
      line(c,0,-.22,0,.22,ink,.02);line(c,-.28,0,.28,0,ink,.02);
    }else if(theme==='sky'){
      const stars=[[-.25,.12],[-.09,-.18],[.14,-.06],[.26,.22]];
      for(let j=1;j<stars.length;j++)line(c,...stars[j-1],...stars[j],ink,.025);
      for(const [x,y] of stars)ring(c,x,y,.045,ink,.025);
    }else if(theme==='coast'){line(c,-.3,0,.3,0,ink,.04);line(c,-.25,.12,.25,.12,ink,.025);}
    else if(theme==='scrapyard'){for(let j=0;j<3;j++)line(c,-.25+j*.18,-.15,-.13+j*.18,.15,ink,.055);}
    else if(theme==='jungle'||theme==='garden'){
      polygon(c,[[0,-.3],[.22,0],[0,.24],[-.22,0]],null,ink,.035);
      if(theme==='garden')ellipse(c,0,0,.055,.055,accent);
      else line(c,0,-.2,0,.16,ink,.025);
    }else if(theme==='storm'){bolt(c,0,0,.45,ink);}
    else if(theme==='fortress'){rounded(c,-.3,-.15,.6,.3,.02,null,ink,.04);line(c,0,-.15,0,.15,ink,.025);}
    else if(theme==='aurora'){polygon(c,[[0,-.35],[.17,0],[0,.28],[-.17,0]],null,ink,.035);}
    else if(theme==='lunar'){ring(c,0,0,.23,ink,.04);ring(c,.05,-.05,.12,ink,.025);}
    else if(theme==='orbital'){line(c,-.28,-.15,.15,-.15,ink,.04);line(c,.15,-.15,.15,.2,ink,.04);ellipse(c,.15,.2,.055,.055,accent);}
    else if(theme==='ancient'){polygon(c,[[-.2,-.2],[.2,-.2],[.2,.2],[-.05,.2],[-.05,0]],null,ink,.04);}
    else{line(c,-.2,0,.2,0,ink,.035);}
    c.restore();
  }
  if(arena.returnId){c.setLineDash([.08,.12]);ring(c,0,0,radius*.76,'#805b9866',.045);c.setLineDash([]);}
  c.restore();
}
function attackWarning(c,a){
  const progress=Math.max(0,Math.min(1,1-a.life/a.duration)),radius=a.radius||1.1;
  const edge='#cb5275',core='#fff0ce',fill='#ed7d922b',pattern=a.pattern;
  c.save();c.lineJoin='round';c.lineCap='round';
  if((pattern==='beam'||pattern==='cone')&&Number.isFinite(a.ox)&&Number.isFinite(a.oy)){
    const segmentAngle=Math.atan2(a.y-a.oy,a.x-a.ox),angle=pattern==='beam'?segmentAngle:(a.angle??segmentAngle),length=Math.hypot(a.x-a.ox,a.y-a.oy);
    c.translate(a.ox,a.oy);c.rotate(angle);
    if(pattern==='beam'){
      c.beginPath();c.moveTo(0,-radius);c.lineTo(length,-radius);c.arc(length,0,radius,-Math.PI/2,Math.PI/2);c.lineTo(0,radius);c.arc(0,0,radius,Math.PI/2,Math.PI*1.5);c.closePath();c.fillStyle=fill;c.fill();c.strokeStyle=edge;c.lineWidth=.045;c.stroke();
      line(c,0,0,length,0,core,.035);line(c,0,-radius,length*progress,-radius,core,.065);
    }else{
      const reach=Math.min(7,length+.4),half=Math.acos(.9);
      c.beginPath();c.moveTo(0,0);c.arc(0,0,reach,-half,half);c.closePath();c.fillStyle=fill;c.fill();c.strokeStyle=edge;c.lineWidth=.045;c.stroke();
      c.beginPath();c.arc(0,0,reach,-half,-half+half*2*progress);c.strokeStyle=core;c.lineWidth=.075;c.stroke();
    }
  }else{
    if(Number.isFinite(a.ox)&&Number.isFinite(a.oy)&&['arc','return','salvo','drone'].includes(pattern)){
      c.setLineDash([.12,.14]);line(c,a.ox,a.oy,a.x,a.y,edge+'99',.035);c.setLineDash([]);
    }
    ellipse(c,a.x,a.y,radius,radius,fill);ring(c,a.x,a.y,radius,edge,.055);
    c.beginPath();c.arc(a.x,a.y,radius,-Math.PI/2,-Math.PI/2+progress*Math.PI*2);c.strokeStyle=core;c.lineWidth=.075;c.stroke();
    c.translate(a.x,a.y);
    if(pattern==='vortex'){
      for(let i=0;i<3;i++){const angle=i*Math.PI*2/3;c.beginPath();c.arc(0,0,radius*.53,angle,angle+1.25);c.strokeStyle=edge;c.lineWidth=.04;c.stroke();}
    }else if(pattern==='ice'){
      for(let i=0;i<3;i++){c.save();c.rotate(i*Math.PI/3);line(c,-radius*.42,0,radius*.42,0,edge,.035);c.restore();}
    }else if(pattern==='impact'||pattern==='salvo'){
      for(const side of [-1,1]){line(c,side*radius*.35,0,side*radius*.65,0,edge,.045);line(c,0,side*radius*.35,0,side*radius*.65,edge,.045);}
    }else if(pattern==='slam'||pattern==='stomp'){ring(c,0,0,radius*.55,edge,.035);}
    else if(pattern==='arc'){bolt(c,0,0,radius*.65,edge);}
    else if(pattern==='return'){c.save();c.scale(.016,.016);blade(c,0,true);c.restore();}
    else if(pattern==='drone'){rounded(c,-.2,-.13,.4,.26,.04,null,edge,.04);line(c,-.3,-.22,.3,-.22,edge,.04);}
  }
  c.restore();
}
function themeGround(c,x,y,reg,n,road,t,water=false){
  const theme=reg.theme,a=reg.accent,d=reg.dark;
  if(water){
    if(['lunar','orbital'].includes(theme)){for(let i=0;i<3;i++)ellipse(c,x+.15+i*.3,y+.2+hash(x+i,y)*.6,.014,.014,i%2?a:'#fff8dd');}
    else{for(let i=0;i<2;i++){const yy=y+.26+i*.43+Math.sin(t+x)*.025;line(c,x+.12,yy,x+.75,yy,a+'88',.025);}if(theme==='aurora')line(c,x+.3,y+.1,x+.6,y+.9,'#e8ffff80',.045);}
    return;
  }
  if(road){line(c,x+.1,y+.85,x+.85,y+.85,d+'30',.025);if(n>.8)ellipse(c,x+.3,y+.35,.025,.025,d+'55');return;}
  if(theme==='coast'){for(let i=0;i<3;i++)line(c,x+.12,y+.22+i*.25,x+.62+i*.07,y+.18+i*.25,'#fff8da55',.025);if(n>.7){ellipse(c,x+.6,y+.6,.09,.06,'#f6dfb6');line(c,x+.55,y+.62,x+.65,y+.57,d+'70',.015);}}
  else if(theme==='scrapyard'){polygon(c,[[x+.1,y+.3],[x+.5,y+.16],[x+.8,y+.55],[x+.4,y+.7]],'#819b9028',d+'40',.02);if(n>.6){line(c,x+.2,y+.8,x+.55,y+.73,'#edc87c',.04);ellipse(c,x+.6,y+.3,.04,.04,d);}}
  else if(theme==='jungle'){for(let i=0;i<4;i++){const px=x+hash(x+i,y)*.8,py=y+hash(x,y+i)*.9;line(c,px,py,px+.12,py-.1,d+'77',.025);ellipse(c,px+.1,py-.08,.06,.025,'#a5d07e70');}}
  else if(theme==='storm'){line(c,x+.1,y+.15,x+.65,y+.45,'#d4ecf28a',.025);if(n>.6){ellipse(c,x+.65,y+.7,.23,.08,'#97cad37a');line(c,x+.5,y+.68,x+.76,y+.68,'#e5ffff',.025);}}
  else if(theme==='fortress'){rounded(c,x+.03,y+.04,.94,.92,.03,null,d+'66',.025);line(c,x+.1,y+.5,x+.9,y+.5,d+'44',.02);line(c,x+.5,y+.05,x+.5,y+.48,d+'44',.02);if(n>.7)rounded(c,x+.15,y+.65,.15,.08,.01,a+'77');}
  else if(theme==='aurora'){polygon(c,[[x+.1,y+.8],[x+.4,y+.4],[x+.8,y+.45],[x+.94,y+.12]],'#d9ffff22',null);line(c,x+.1,y+.8,x+.4,y+.4,'#e6ffff99',.025);if(n>.65){line(c,x+.7,y+.7,x+.7,y+.85,a,.025);line(c,x+.63,y+.78,x+.77,y+.78,a,.025);}}
  else if(theme==='lunar'){ellipse(c,x+.5,y+.53,.27,.17,d+'44');ellipse(c,x+.49,y+.49,.22,.13,reg.ground);c.beginPath();c.ellipse(x+.5,y+.52,.28,.18,0,0,Math.PI);c.strokeStyle='#eff7e982';c.lineWidth=.035;c.stroke();}
  else if(theme==='garden'){for(let i=0;i<3;i++){const px=x+.17+i*.28;line(c,px,y+.78,px+.06,y+.51,'#467f6577',.025);ellipse(c,px+.06,y+.5,.04,.04,i%2?'#fff1b0':a+'aa');}if(n>.75)ellipse(c,x+.4,y+.32,.17,.06,'#ddedb82f');}
  else if(theme==='orbital'){rounded(c,x+.03,y+.03,.94,.94,.03,null,d+'88',.025);line(c,x+.15,y+.3,x+.65,y+.3,a+'99',.035);line(c,x+.65,y+.3,x+.65,y+.7,a+'99',.035);ellipse(c,x+.65,y+.72,.04,.04,'#f1ffec');}
  else if(theme==='ancient'){rounded(c,x+.04,y+.06,.9,.88,.07,null,d+'66',.03);polygon(c,[[x+.3,y+.3],[x+.7,y+.3],[x+.7,y+.7],[x+.45,y+.7],[x+.45,y+.5],[x+.55,y+.5]],'#ffffff08',a+'88',.025);}
}
function themeProp(c,p,reg,t){
  const theme=reg.theme,ink=reg.dark,a=reg.accent;
  ellipse(c,.12,.15,p.type==='landmark'?.9:.5,.19,'#173e4430');
  if(p.type==='landmark'){
    if(theme==='coast'){rounded(c,-.38,-1.9,.76,2,.06,'#f4edd5',ink,.04);for(let i=0;i<3;i++)rounded(c,-.38,-1.65+i*.5,.76,.21,.01,'#d98165');rounded(c,-.5,-2.13,1,.35,.04,'#355a71',ink,.04);rounded(c,-.3,-2.07,.6,.22,.02,'#fff1a0');polygon(c,[[-.65,-2.14],[0,-2.6],[.65,-2.14]],'#355a71',ink,.04);}
    else if(theme==='scrapyard'){for(const x of [-.6,.6])rounded(c,x-.12,-1.8,.24,1.9,.03,'#8da8a3',ink,.04);line(c,-.65,-1.85,.65,-1.85,'#e8c67a',.16);line(c,.2,-1.85,.2,-.8,ink,.04);c.beginPath();c.arc(.35,-.8,.15,0,Math.PI);c.strokeStyle=ink;c.lineWidth=.07;c.stroke();rounded(c,-.45,-.45,.7,.5,.04,'#b0c2b6',ink,.04);}
    else if(theme==='jungle'){rounded(c,-.5,-1.7,1,1.8,.08,'#80aa87',ink,.05);for(const y of [-1.4,-.9,-.4]){polygon(c,[[-.32,y],[0,y-.2],[.32,y],[0,y+.16]],a,ink,.025);}for(const s of [-1,1])ellipse(c,s*.48,-1.5,.35,.12,'#426f55');}
    else if(theme==='storm'){rounded(c,-.32,-1.5,.64,1.6,.07,'#7d9eab',ink,.04);for(const y of [-1.5,-1.2,-.9])ellipse(c,0,y,.5,.13,'#c6edf0');line(c,0,-1.5,0,-2.3,'#ecf8eb',.07);bolt(c,0,-2.4,.5,a);}
    else if(theme==='fortress'){for(const x of [-.6,.6]){rounded(c,x-.27,-1.8,.54,1.9,.04,'#9caeaf',ink,.04);for(let i=0;i<3;i++)rounded(c,x-.28+i*.2,-1.98,.16,.3,.01,'#cad6cd',ink,.025);}rounded(c,-.38,-1.4,.76,1.5,.02,'#486574',ink,.04);for(let i=0;i<4;i++)line(c,-.3+i*.2,-1.25,-.3+i*.2,.05,'#dfc77e',.04);}
    else if(theme==='aurora'){for(let i=0;i<5;i++){const x=(i-2)*.28,h=1.1+(2-Math.abs(i-2))*.45;polygon(c,[[x-.14,.1],[x-.13,-h*.7],[x,-h],[x+.15,-h*.65],[x+.13,.1]],i%2?'#a6e9df':'#d1f5fa',ink,.025);line(c,x,-h,x,0,a,.025);}}
    else if(theme==='lunar'){rounded(c,-.6,-.45,1.2,.5,.05,'#90a6a8',ink,.04);ellipse(c,0,-.85,.7,.65,'#e3ebd6');rounded(c,-.4,-1.05,.8,.4,.12,'#456d82',ink,.04);for(const x of [-.75,.75]){line(c,x,-.1,x,-.7,'#dfdabe',.06);rounded(c,x-.3,-1.1,.6,.4,.025,'#689eb0',ink,.03);}}
    else if(theme==='garden'){for(const x of [-.55,.55])rounded(c,x-.1,-1.8,.2,1.9,.03,'#d9e8c3',ink,.03);c.beginPath();c.arc(0,-1.7,.55,Math.PI,Math.PI*2);c.strokeStyle='#d9e8c3';c.lineWidth=.18;c.stroke();for(let i=0;i<7;i++){const aa=Math.PI+i*Math.PI/6;ellipse(c,Math.cos(aa)*.56,-1.7+Math.sin(aa)*.56,.13,.12,i%2?a:'#fff4b1');}}
    else if(theme==='orbital'){line(c,0,0,0,-1.7,'#e0ebe2',.15);ellipse(c,0,-1.5,.46,.46,'#b8d7d2');for(const side of [-1,1]){rounded(c,side<0?-1.2:.5,-1.95,.7,.9,.03,'#3d6b86',ink,.04);for(let j=0;j<3;j++)line(c,side<0?-1.15:.55,-1.8+j*.25,side<0?-.55:1.15,-1.8+j*.25,a,.025);}ring(c,0,-1.5,.26,a,.04);}
    else{for(const side of [-1,1])rounded(c,side*.55-.2,-1.65,.4,1.8,.035,'#b2c9a6',ink,.04);rounded(c,-.85,-1.85,1.7,.3,.04,'#cee0b4',ink,.04);ring(c,0,-1.1,.32,a,.055);line(c,0,-1.42,0,-.78,a,.04);}
    return;
  }
  if(p.type==='tree'){
    if(theme==='coast'||theme==='jungle'){line(c,0,.15,.08,-1.1,'#b5ac7f',.14);for(let i=0;i<5;i++){const aa=-Math.PI+i*Math.PI/4;polygon(c,[[.08,-1.1],[.08+Math.cos(aa)*.8,-1.1+Math.sin(aa)*.55],[.08+Math.cos(aa+.4)*.46,-1.05+Math.sin(aa+.4)*.35]],i%2?'#629c72':'#3f7f66',ink,.025);}if(theme==='jungle')line(c,.5,-1.15,.4,-.2,'#9cbf68',.035);}
    else if(theme==='garden'){line(c,0,.1,0,-.65,ink,.12);for(const [x,y] of [[-.3,-.6],[.3,-.6],[0,-.95]]){ellipse(c,x,y,.38,.35,'#78ad88');for(let i=0;i<3;i++)ellipse(c,x-.15+i*.14,y-.06,.065,.065,i%2?'#fff4bd':a);}}
    else if(theme==='aurora'){for(let i=0;i<3;i++)polygon(c,[[-.5+i*.1,-i*.3],[0,-1.5],[.5-i*.1,-i*.3]],i%2?'#d1f2ed':'#8ac5c0',ink,.025);}
    else if(theme==='lunar'||theme==='orbital'){line(c,0,.1,0,-1.1,'#b9d5d2',.08);ellipse(c,0,-.85,.43,.43,'#d4f6ed44');ring(c,0,-.85,.43,a,.035);for(const side of [-1,1])rounded(c,side*.4-.13,-.9,.26,.48,.025,'#628da2',ink,.025);}
    else if(theme==='ancient'){rounded(c,-.18,-1.25,.36,1.4,.04,'#afc6a2',ink,.035);rounded(c,-.35,-1.3,.7,.18,.02,'#d2deb9',ink,.035);for(let i=0;i<3;i++)line(c,-.1+i*.1,-1.05,-.1+i*.1,-.05,ink+'77',.02);}
    else{rounded(c,-.2,-1.2,.4,1.3,.06,'#96b5af',ink,.035);for(const side of [-1,1]){line(c,0,-.8,side*.5,-1.1,'#c9dbca',.07);ellipse(c,side*.5,-1.1,.15,.13,theme==='storm'?a:'#e7cb8b');}}
    return;
  }
  if(['rock','mountain','crystal'].includes(p.type)){
    const big=p.type==='mountain'?2:1;c.save();c.scale(big,big);
    if(p.type==='crystal'||theme==='aurora')for(let i=0;i<3;i++){const x=(i-1)*.2;polygon(c,[[x-.13,.1],[x-.12,-.4],[x,-.85+(i%2)*.2],[x+.15,-.35],[x+.1,.1]],i%2?a:'#d4ede5',ink,.025);}
    else{polygon(c,[[-.45,.1],[-.38,-.35],[-.05,-.62],[.4,-.32],[.47,.12],[.05,.23]],theme==='lunar'?'#c3c8bc':shade(reg.ground,-24),ink,.025);polygon(c,[[-.38,-.35],[-.05,-.62],[.12,-.18]],shade(reg.ground,22),null);if(theme==='ancient'||theme==='orbital')ring(c,.1,-.2,.1,a,.025);if(theme==='jungle'||theme==='garden')ellipse(c,-.2,-.26,.23,.1,'#669565');}c.restore();return;
  }
  const natural=['jungle','garden','ancient'].includes(theme);
  rounded(c,-.36,-.55,.72,.65,.05,natural?'#9bb38d':'#8da9b0',ink,.035);rounded(c,-.28,-.48,.56,.23,.025,a);
  if(p.type==='solar'){rounded(c,-.58,-.95,1.16,.6,.03,'#3f6d87',ink,.04);for(let i=0;i<4;i++)line(c,-.46+i*.3,-.88,-.46+i*.3,-.42,a,.025);}
  else if(p.type==='antenna'||p.type==='beacon'){line(c,0,-.5,0,-1.35,'#d1e2cb',.06);if(theme==='coast')polygon(c,[[0,-1.35],[.5,-1.15],[0,-.95]],a,ink,.025);else{ring(c,0,-1.3,.23,a,.04);ellipse(c,0,-1.3,.07,.07,'#fff7d1');}}
  else if(p.type==='scrap'){c.save();c.translate(.1,-.65);c.rotate(.3);rounded(c,-.3,-.13,.6,.26,.03,'#d4ce9a',ink,.025);c.restore();for(let i=0;i<3;i++)line(c,-.2+i*.2,-.16,-.2+i*.2,.04,ink,.03);}
  else if(p.type==='crate'){line(c,-.3,-.48,.3,.05,ink,.035);line(c,.3,-.48,-.3,.05,ink,.035);}
  else{for(let i=0;i<3;i++)ellipse(c,-.2+i*.2,-.65,.075,.07,i%2?'#fff5bf':a);}
}

export function weapon(c,id,t=0,action=0) {
  const ink='#20363a';c.save();c.lineJoin='round';c.lineCap='round';
  if(['sunbeam','swarm','supernova'].includes(id))c.translate(-Math.sin(action*Math.PI)*2.5,0);
  if(id==='bumper') {
    rounded(c,12,-9,25+action*10,18,4,'#687e82',ink,2.5);
    for(let i=0;i<4;i++)line(c,18+i*5,-8,23+i*5,8,i%2?'#36494c':'#ffcf56',4);
    rounded(c,29+action*10,-12,10,24,3,'#bacbd0',ink,2.5);
  } else if(id==='blaster') {
    rounded(c,9,-10,26,19,4,'#416f9a',ink,3);
    rounded(c,13,-9,13,5,2,'#8fd9ec');rounded(c,31,-7,19,13,3,'#485b68',ink,3);
    rounded(c,44,-8,9,15,3,'#abc3c7',ink,2);rounded(c,48,-4,5,7,1,'#baf9ff');
    line(c,20,10,16,17,ink,7);line(c,35,-6,35,6,'#99c4d2',2);
    if(action>.5){c.globalAlpha=action;bolt(c,58,0,25,'#ceffff');c.globalAlpha=1;}
  } else if(id==='saw') {
    rounded(c,10,-4,24,8,3,'#b38a57',ink,2);
    c.save();c.translate(39,0);c.rotate(t*(action?28:7));
    c.beginPath();for(let i=0;i<32;i++){let a=i*Math.PI/16,r=i%2?14:19;c.lineTo(Math.cos(a)*r,Math.sin(a)*r);}c.closePath();c.fillStyle='#d6e2dd';c.fill();c.strokeStyle=ink;c.lineWidth=2;c.stroke();
    ellipse(c,0,0,11,11,'#7e959d');for(let i=0;i<4;i++){const a=i*Math.PI/2;ellipse(c,Math.cos(a)*7,Math.sin(a)*7,2,2,'#cee9e5');}ellipse(c,0,0,4,4,'#f9ce56');c.restore();
  } else if(id==='hammer') {
    c.save();c.rotate(-.45+(action?Math.sin(action*Math.PI)*1.8:0));
    rounded(c,6,-4,35,8,3,'#a77c51',ink,2.5);for(let i=0;i<3;i++)line(c,13+i*5,-3,13+i*5,3,'#d2a775',1);
    rounded(c,33,-18,25,36,5,'#9fafb3',ink,3);rounded(c,35,-16,21,7,3,'#e0eeec');rounded(c,35,10,21,6,2,'#647c82');
    line(c,36,-6,36,8,'#f0f9f3',1);line(c,55,-6,55,8,'#66848e',1.5);
    rounded(c,41,-18,8,36,2,'#708d94');bolt(c,45,0,18,'#ffe06b');c.restore();
  } else if(id==='lightning') {
    rounded(c,9,-10,28,20,5,'#7264a5',ink,3);rounded(c,15,-6,15,12,3,'#a8e4ea');
    for(const y of [-11,11]) {line(c,33,y,49,y,'#b7ced1',6);ellipse(c,49,y,5,5,'#bdffff');}
    if(action>.1){c.beginPath();c.moveTo(49,-11);c.lineTo(55,-3);c.lineTo(47,3);c.lineTo(49,11);c.strokeStyle='#cdffff';c.lineWidth=2;c.stroke();}
  } else if(id==='flame') {
    rounded(c,8,-11,25,22,5,'#da7451',ink,3);rounded(c,12,-16,12,9,3,'#f4c66d',ink,2);
    polygon(c,[[30,-7],[49,-12],[49,12],[30,7]],'#687f86');for(const y of [-7,0,7])ellipse(c,48,y,3,2,'#ffd770');
    if(action>0)for(let i=0;i<3;i++)polygon(c,[[51,-7+i*5],[66+action*14,-12+i*8],[61+action*20,i*6-6],[51,2+i*4]],i%2?'#fff2a5':'#ffad54',null);
  } else if(id==='frost') {
    rounded(c,7,-11,29,22,5,'#9ddbe9',ink,3);rounded(c,29,-8,24,16,3,'#e8ffff',ink,2);
    for(const x of [20,29,38])polygon(c,[[x,-7],[x-4,-17],[x+5,-12],[x+5,12],[x-4,17],[x,7]],'#75c5e1',ink,1.5);
    ellipse(c,53,0,4,7,'#398eae');if(action>0){line(c,56,0,68,0,'#efffff',4);ring(c,65,0,8,'#9cecff',2);}
  } else if(id==='boomerang') {
    rounded(c,8,-6,29,12,4,'#548f88',ink,3);if(action<.03){c.save();c.translate(40,0);blade(c,Math.PI/4);c.restore();}
  } else if(id==='tractor') {
    rounded(c,7,-10,30,20,5,'#547b9c',ink,3);c.beginPath();c.arc(35,0,13,Math.PI/2,Math.PI*1.5);c.strokeStyle='#e56e63';c.lineWidth=9;c.stroke();
    for(const y of [-13,13])rounded(c,33,y-5,18,10,2,y<0?'#fff5cf':'#8ee5ed',ink,2);
    if(action>0)for(let i=0;i<2;i++){c.beginPath();c.arc(49,0,10+i*8,-.9,.9);c.strokeStyle='#91f0e4';c.lineWidth=2;c.stroke();}
  } else if(id==='drone') {
    rounded(c,6,-15,40,30,5,'#456979',ink,3);rounded(c,12,-10,27,20,3,'#243f50');for(const y of [-14,14])line(c,12,y,40,y,'#f5d478',3);
    c.save();c.translate(30,-action*16);c.scale(.72,.72);drone(c,t);c.restore();
  } else if(id==='rail') {
    rounded(c,5,-12,24,24,4,'#587c80',ink,3);for(const y of [-7,7]){rounded(c,24,y-3,36,6,2,'#d4e9dd',ink,2);line(c,29,y,55,y,'#6bf5db',2);}
    for(let i=0;i<3;i++)rounded(c,15+i*6,-9,3,18,1,'#f4d477');if(action>0)line(c,32,0,73,0,'#eaffdd',4);
  } else if(id==='meteor') {
    c.save();c.rotate(-.5-action*.25);rounded(c,5,-12,27,24,5,'#c78762',ink,3);rounded(c,26,-16,25,32,5,'#627a87',ink,3);ellipse(c,51,0,5,13,'#263f50');ellipse(c,51,0,3,8,'#ffc56a');for(const y of [-10,10])line(c,30,y,44,y,'#efdb9d',3);c.restore();
  } else if(id==='gravity') {
    c.save();c.rotate(-.3+Math.sin(action*Math.PI)*1.5);rounded(c,5,-4,34,8,3,'#90b7ad',ink,2);rounded(c,33,-23,25,46,5,'#456778',ink,3);for(const y of [-19,19])rounded(c,30,y-4,31,8,2,'#b8ead7',ink,2);ellipse(c,46,0,8,12,'#263c60');ring(c,46,0,6,'#b5f9df',2);if(action>0)ring(c,46,0,15,'#93dbc9',2);c.restore();
  } else if(id==='sunbeam') {
    rounded(c,6,-11,28,22,4,'#e3bb55',ink,3);rounded(c,10,-8,17,5,2,'#fff2b2');
    rounded(c,28,-7,30,14,3,'#54777d',ink,2.5);
    for(const x of [31,40,49]){rounded(c,x,-11,5,22,2,'#f6d779',ink,1.5);line(c,x+2,-7,x+2,7,'#fff4bf',1.5);}
    rounded(c,55,-12,5,24,2,'#e6bd50',ink,2);ellipse(c,60,0,3,8,'#fff3ae');
    ellipse(c,19,3,6,6,'#345863');ellipse(c,19,3,3,3,'#fff8ce');
    for(const y of [-5,5])line(c,13,3+y,15,3+y,'#fff8ce',1.5);
    if(action>0){line(c,60,0,67,0,'#fff5b5',3);}
  } else if(id==='swarm') {
    rounded(c,6,-17,34,34,4,'#4a8176',ink,3);rounded(c,10,-13,18,26,2,'#bce7ca',ink,2);
    for(const y of [-11,0,11]){
      rounded(c,25,y-5,20,10,2,'#7ab7a5',ink,2);rounded(c,35,y-3,10,6,1,'#244d55');
      polygon(c,[[37,y],[40,y-2],[44,y],[40,y+2]],'#e9ffb2',null);
      ellipse(c,16,y,2,2,'#f5e28c');line(c,21,y-2,23,y-2,'#3a6b64',1.5);
    }
    line(c,8,0,3,0,'#a8d7ca',4);
    if(action>0)for(const y of [-11,0,11])line(c,45,y,50,y,'#dcffbb',2);
  } else if(id==='supernova') {
    rounded(c,6,-14,28,28,4,'#687c9e',ink,3);rounded(c,10,-11,18,6,2,'#c8d8f1');
    for(const y of [-12,0,12]){
      rounded(c,29,y-5,23,10,2,'#becbdc',ink,2);rounded(c,42,y-3,10,6,1,'#31475f');
      polygon(c,[[46,y-3],[53,y],[46,y+3]],'#ffe49a',ink,1);
      line(c,32,y-2,39,y-2,'#fff0bd',1.5);
    }
    novaStar(c,19,5,8,'#fff0a6',ink,1.5);
    if(action>0)for(const y of [-12,0,12])line(c,53,y,58,y,'#fff5d4',2);
  } else if(id==='rocket') {
    rounded(c,7,-14,39,27,6,'#455b62',ink,3);rounded(c,10,-12,32,7,2,'#839b9d');
    rounded(c,30,-16,19,31,4,'#8d9992',ink,3);rounded(c,33,-13,13,25,3,'#263f47');
    c.beginPath();c.moveTo(38,-8);c.lineTo(52,0);c.lineTo(38,8);c.closePath();c.fillStyle='#ff805b';c.fill();
    rounded(c,13,-19,14,6,2,'#e4bb54',ink,2);line(c,18,14,15,21,ink,7);line(c,9,0,4,0,'#d7dbb9',4);
    for(let j=0;j<3;j++)rounded(c,14+j*5,-2,3,9,1,'#253d47');ellipse(c,22,-8,2,2,'#c5f4bd');
  }
  c.restore();
}

export function bot(c,x,y,size,options={},t=0) {
  const { color='#ee6954',armor='light',wheels='basic',gun='bumper',gadget='none',type='',region=0,theme='',encounterRole='',angle=0,hit=0,swing=0,moving=false,boss=false,shield=false,health=1,reducedMotion=false }=options;
  if(reducedMotion){t=0;}
  const damaged=health<=.5,critical=health<=.18;
  c.save();c.translate(x,y);c.scale(size/80,size/80);
  ellipse(c,0,27,30,9,'#122e3538');
  const bob=reducedMotion?0:moving?Math.sin(t*(critical?12:18))*(critical?2.7:1.8):Math.sin(t*2.3)*.7;c.translate(critical&&!reducedMotion?Math.sin(t*31)*.7:0,bob);
  for(const side of [-1,1]) {
    const wx=side*25;
    if(wheels==='rover'||wheels==='hover'){c.save();c.translate(wx,18);c.scale(.72,.72);wheelArt(c,wheels,moving?t:0);c.restore();continue;}
    rounded(c,wx-9,5,18,24,wheels==='treads'?4:8,wheels==='speed'?'#4f99bf':'#263c42','#193035',3);
    for(let j=0;j<4;j++)line(c,wx-7,9+j*5+((t*(moving?19:0))%5),wx+7,9+j*5+((t*(moving?19:0))%5),'#698285',2);
    ellipse(c,wx,18,4,6,wheels==='speed'?'#ffe781':'#91a7a8');
  }
  const antenna=damaged?10:0;line(c,0,-29,antenna,-40,'#243b3f',4);ellipse(c,antenna,-42,3.7,3.7,critical?'#ff9a55':'#ffe08d');ellipse(c,antenna-1,-43,1.4,1.4,'#fffbe6');
  const grad=c.createLinearGradient(-22,-26,25,29);grad.addColorStop(0,hit>0?'#fff8c7':shade(color,25));grad.addColorStop(.38,hit>0?'#fff':color);grad.addColorStop(1,hit>0?'#fff':shade(color,-18));
  rounded(c,-26,-28,52,56,11,'#21383d','#172f33',3);
  rounded(c,-22,-25,44,48,8,grad);rounded(c,-19,-22,38,7,4,'#ffffff35');rounded(c,-20,16,40,7,3,'#102d372c');
  rounded(c,-21,-19,5,31,2,'#ffffff15');rounded(c,17,-17,4,31,2,'#12343e20');
  const heavyBoss=boss&&(!encounterRole||encounterRole==='bruiser'||encounterRole==='splitter');
  if(armor==='steel'||armor==='heavy'||heavyBoss) {
    const thick=armor==='heavy'||heavyBoss?6:3;
    for(const side of [-1,1]){rounded(c,side<0?-29:23,-23,thick+2,48,3,'#587075','#243b40',2);for(const y of [-18,18])ellipse(c,side*26,y,2,2,'#e9c969');}
    if(armor==='heavy'||heavyBoss){rounded(c,-26,-30,52,9,3,'#f4d16a','#23393d',2);for(let i=0;i<5;i++)line(c,-20+i*10,-29,-23+i*10,-23,'#35494c',4);}
  }
  if(armor==='reflect') {
    c.save();rounded(c,-25,-28,50,54,10,null,'#d7fcff',3);
    c.beginPath();c.moveTo(-21,-17);c.lineTo(-4,-24);c.lineTo(19,17);c.lineTo(8,21);c.closePath();c.fillStyle='#eaffffa0';c.fill();c.restore();
  }
  if(['bastion','polar','star'].includes(armor)){
    for(const side of [-1,1]){rounded(c,side<0?-32:23,-25,9,50,3,armor==='polar'?'#d9f8ff':armor==='star'?'#e8d18c':'#668ba3','#20363a',2);}
    c.save();c.translate(0,19);c.scale(.28,.28);armorArt(c,armor);c.restore();
    if(armor==='bastion')for(const x of [-20,0,20])rounded(c,x-5,-34,10,13,2,'#bfd6df','#20363a',2);
    if(armor==='polar')for(const side of [-1,1])polygon(c,[[side*24,-26],[side*31,-39],[side*33,-20]],'#c4f5ff');
    if(armor==='star')for(const side of [-1,1])ellipse(c,side*27,-20,3,3,'#fff6c0');
  }
  if(encounterRole)encounterShell(c,encounterRole,color);
  else if(boss&&region>=5){
    bossOutline(c,theme);
  }
  for(const side of [-1,1]){ellipse(c,side*10,-8,6,7,'#20373c');ellipse(c,side*10,-9,4.8,5.5,'#fffbe6');ellipse(c,side*10+Math.cos(angle)*1.6,-9+Math.sin(angle),2.2,2.6,'#233c41');ellipse(c,side*10-1,-11,1.4,1.4,'#fff');}
  rounded(c,-13,8,26,7,3,'#28424a','#1e373b',1.5);for(let i=0;i<3;i++)rounded(c,-9+i*7,10,4,2,1,'#cce8be');
  if(damaged){
    for(const [x,y] of [[-18,-18],[-15,2],[7,18]]){line(c,x,y,x+7,y+6,'#263e46',2.7);line(c,x+1,y+2,x+7,y+7,'#e5ece1',1);}
    line(c,-25,0,-20,6,'#b9c0a6',3);
    if(critical){
      c.beginPath();c.moveTo(15,1);c.lineTo(22,5);c.lineTo(16,11);c.lineTo(21,19);c.lineTo(10,21);c.lineTo(9,10);c.closePath();c.fillStyle='#263d42';c.fill();
      line(c,13,7,20,14,'#ffc45c',2);line(c,19,5,12,18,'#e96c57',2);
      c.globalAlpha=reducedMotion?.7:.35+Math.abs(Math.sin(t*9))*.5;ellipse(c,10,-9,4.8,5.5,'#f19759');c.globalAlpha=1;
      if(!reducedMotion){const f=(t*3)%1;for(let i=0;i<3;i++)line(c,19+f*7,7-i*3,24+f*11,9-i*5,'#fff0a0',1.8*(1-f));}
    }
    for(let i=0;i<(critical?5:2);i++){const f=reducedMotion?(i+.5)/(critical?5:2):(t*(critical?.65:.4)+i/(critical?5:2))%1;c.globalAlpha=(1-f)*(critical?.52:.28);ellipse(c,-20+Math.sin(i*2+f*4)*6,-24-f*37,4+f*9,4+f*8,critical?'#607378':'#c9d5c6');}c.globalAlpha=1;
  }
  if(type==='hopper')for(const side of [-1,1]){const lift=moving?Math.sin(t*10)*3:0;line(c,side*20,24,side*31,32+lift,'#d1dfbb',5);line(c,side*31,32+lift,side*22,39,'#3f5d6e',5);rounded(c,side*22-8,36,16,6,2,'#f4d683','#20363a',2);}
  if(type==='medic'){rounded(c,-12,-35,24,13,3,'#e7ffda','#2a6554',2);line(c,-6,-29,6,-29,'#3c9b68',4);line(c,0,-34,0,-24,'#3c9b68',4);}
  if(!boss&&type==='tank')for(const side of [-1,1]){
    rounded(c,side<0?-40:26,-8,14,37,3,'#587075','#20363a',3);
    for(const y of [0,10,20])line(c,side<0?-37:29,y,side<0?-29:37,y,'#b8cfca',2);
  }
  if(!boss&&type==='ranged'){
    line(c,-17,-31,17,-31,'#20363a',6);
    for(const side of [-1,1]){rounded(c,side*17-5,-37,10,12,2,'#779ba7','#20363a',2);ellipse(c,side*17,-32,2.5,2.5,'#fff0b4');}
  }
  if(type==='carrier'){rounded(c,-35,-22,12,43,4,'#e9bd6b','#20363a',2);rounded(c,23,-22,12,43,4,'#e9bd6b','#20363a',2);rounded(c,-22,-37,44,11,3,'#819a8d','#20363a',2);for(const x of [-14,0,14])ellipse(c,x,-32,3,3,'#fff0b4');}
  if(type==='burrow'){c.save();c.translate(0,-28);polygon(c,[[-16,0],[0,-23],[16,0]],'#d8e3dc');for(let i=0;i<3;i++)line(c,-4-i*4,-17+i*6,5+i*4,-13+i*6,'#667f88',2);c.restore();}
  if(type==='sentry'){rounded(c,-32,25,64,9,3,'#738d99','#20363a',2);line(c,-22,27,-38,35,'#345264',5);line(c,22,27,38,35,'#345264',5);}
  if(gadget!=='none'){c.save();c.translate(-33,-2);c.scale(.35,.35);gadgetArt(c,gadget,t);c.restore();}
  c.save();c.translate(Math.cos(angle)<0?-24:24,10);c.rotate(angle);weapon(c,gun,t,reducedMotion?(swing>0?.45:0):swing);c.restore();
  if(type==='shield'){c.save();c.rotate(angle);rounded(c,28,-24,13,48,5,'#b4dfd5','#20363a',3);line(c,33,-16,33,16,'#fff0ae',4);c.restore();}
  if(shield){ellipse(c,0,-1,40,43,'#90eaff17');c.beginPath();c.ellipse(0,-1,40,43,0,0,Math.PI*2);c.strokeStyle='#b9f5ed90';c.lineWidth=2;c.stroke();}
  c.restore();
}

export class Painter {
  constructor(canvas){this.canvas=canvas;this.c=canvas.getContext('2d');this.w=0;this.h=0;this.camera={x:HOME.x,y:HOME.y};this.tile=72;this.baseTile=72;this.dpr=1;}
  resize(){
    const r=this.canvas.getBoundingClientRect();if(r.width<=0||r.height<=0)return;
    const previousBase=this.baseTile,firstSize=this.w===0;
    this.w=r.width;this.h=r.height;this.dpr=Math.min(window.devicePixelRatio||1,2);
    const width=Math.round(this.w*this.dpr),height=Math.round(this.h*this.dpr);
    if(this.canvas.width!==width)this.canvas.width=width;
    if(this.canvas.height!==height)this.canvas.height=height;
    this.baseTile=(this.w<600?Math.max(55,Math.min(76,this.w/6.3)):85)*.9;this.tile=firstSize?this.baseTile:this.tile*this.baseTile/previousBase;
  }
  follow(g,dt){
    const bosses=g.enemies.filter(e=>e.type==='boss'&&e.hp>0&&!e.dormant&&g.enemyAwake(e)&&Math.hypot(e.x-g.player.x,e.y-g.player.y)<8&&(e.active||Math.hypot(e.x-g.player.x,e.y-g.player.y)<5.5));
    let target={x:g.player.x,y:g.player.y},zoom=this.baseTile;
    if(regionAt(g.player.x,g.player.y)===PANTHEON.r&&g.player.y>225&&g.player.y<260){
      const top=219,bottom=Math.max(251,g.player.y+1.8);
      zoom=Math.min(this.baseTile,(this.w-16)/23,(this.h-36)/(bottom-top));target={x:162.5,y:(top+bottom)/2};
    }else if(bosses.length){
      const left=Math.min(g.player.x-1.2,...bosses.map(e=>e.x-1.9)),right=Math.max(g.player.x+1.2,...bosses.map(e=>e.x+1.9));
      const top=Math.min(g.player.y-1.1,...bosses.map(e=>e.y-1.8)),bottom=Math.max(g.player.y+.8,...bosses.map(e=>e.y+1.1));
      zoom=Math.min(this.baseTile,(this.w-32)/(right-left),(this.h-110)/(bottom-top));
      zoom=Math.max(this.baseTile*.55,zoom);target={x:(left+right)/2,y:(top+bottom)/2-30/zoom};
    }
    const smooth=1-Math.exp(-Math.max(0,dt)*5);
    this.tile+=(zoom-this.tile)*smooth;this.camera.x+=(target.x-this.camera.x)*smooth;this.camera.y+=(target.y-this.camera.y)*smooth;
    this.camera.x=Math.max(this.w/this.tile/2,Math.min(WORLD_W-this.w/this.tile/2,this.camera.x));this.camera.y=Math.max(this.h/this.tile*.51,Math.min(WORLD_H-this.h/this.tile*.49,this.camera.y));
  }
  screenToWorld(x,y){return {x:(x-this.w/2)/this.tile+this.camera.x,y:(y-this.h*.51)/this.tile+this.camera.y};}
  worldToScreen(x,y){return {x:(x-this.camera.x)*this.tile+this.w/2,y:(y-this.camera.y)*this.tile+this.h*.51};}
  draw(g,t,dt){
    if(!this.canvas.clientWidth||!this.canvas.clientHeight)return;
    // WebKit can resize the playfield without dispatching a window resize event.
    if(this.canvas.clientWidth!==Math.round(this.w)||this.canvas.clientHeight!==Math.round(this.h)||Math.min(window.devicePixelRatio||1,2)!==this.dpr)this.resize();
    this.follow(g,dt);
    const {c,tile:s,w,h}=this;this.reducedMotion=!!g.reducedMotion;if(this.reducedMotion)t=0;
    c.setTransform(this.canvas.width/w,0,0,this.canvas.height/h,0,0);c.clearRect(0,0,w,h);c.fillStyle='#284d4a';c.fillRect(0,0,w,h);
    const shake=g.reducedMotion?0:g.shake;const sx=shake?Math.sin(t*100)*shake:0,sy=shake?Math.cos(t*93)*shake:0;
    c.save();c.translate(w/2-this.camera.x*s+sx,h*.51-this.camera.y*s+sy);c.scale(s,s);
    const x0=Math.max(0,Math.floor(this.camera.x-w/s/2)-2),x1=Math.min(WORLD_W,Math.ceil(this.camera.x+w/s/2)+2),y0=Math.max(0,Math.floor(this.camera.y-h/s*.51)-2),y1=Math.min(WORLD_H,Math.ceil(this.camera.y+h/s*.49)+2);
    for(let y=y0;y<y1;y++)for(let x=x0;x<x1;x++)this.ground(x,y,t,g);
    const courtVisible=x1>147&&x0<178&&y1>218&&y0<258;
    if(courtVisible){templeFloor(c,t);templeArchitecture(c);if(!pantheonUnlocked(g.save)){c.save();c.translate(PANTHEON.entry.x,PANTHEON.entry.y);c.rotate(Math.PI/2);this.gate(0,0,t);c.restore();}}
    for(const arena of g.world.arenas||[]){
      const radius=arena.radius||3.8;
      if(arena.r<=unlockedRegion(g.save)&&returnVisible(g.save,arena)&&arena.x+radius>x0&&arena.x-radius<x1&&arena.y+radius>y0&&arena.y-radius<y1)arenaFloor(c,arena);
    }
    for(const gate of GATES)if(gate.r>unlockedRegion(g.save)){c.save();c.translate(gate.x,gate.y);if(gate.horizontal)c.rotate(Math.PI/2);this.gate(0,0,t);c.restore();}
    for(const site of g.world.sites)if(returnVisible(g.save,site)&&site.x>x0-2&&site.x<x1+2&&site.y>y0-2&&site.y<y1+2)this.site(site,g.save.cleared.includes(site.id),t);
    for(let r=0;r<REGIONS.length;r++){const p=relayFor(r);if(p.x>x0-3&&p.x<x1+3&&p.y>y0-3&&p.y<y1+3)this.relay(p.x,p.y,r,g,t);}
    for(const station of g.world.stations)if(station.r<=unlockedRegion(g.save)&&station.x>x0-4&&station.x<x1+4&&station.y>y0-4&&station.y<y1+4)this.station(station,g,t);
    for(const chest of g.world.chests)if(!g.save.chests.includes(chest.id)&&chest.x>x0-1&&chest.x<x1+1&&chest.y>y0-1&&chest.y<y1+1)this.chest(chest.x,chest.y,t);
    if(g.route.length){c.beginPath();c.moveTo(g.player.x,g.player.y);for(const p of g.route)c.lineTo(p.x,p.y);c.strokeStyle='#fff8c775';c.lineWidth=.045;c.setLineDash([.09,.14]);c.stroke();c.setLineDash([]);const end=g.route.at(-1);ellipse(c,end.x,end.y,.18,.09,'#fff7ad');}
    for(const a of g.telegraphs)attackWarning(c,a);
    for(const fx of g.effects){
      if(fx.type==='meteor')this.effect({...fx,type:'meteor-ground'},t,g.reducedMotion);
      else if(fx.type==='slam'||fx.type==='vortex'||fx.type==='nova')this.effect(fx,t,g.reducedMotion);
    }
    const objects=g.world.props.filter(p=>p.x>x0-2&&p.x<x1+2&&p.y>y0-2&&p.y<y1+2).map(p=>({...p,kind:'prop'}));
    if(courtVisible)for(const p of COURT)objects.push({...p,kind:'royal'});
    for(const shop of workshops())if(shop.r<=unlockedRegion(g.save)&&shop.x>x0-4&&shop.x<x1+4&&shop.y>y0-4&&shop.y<y1+4)objects.push({...shop,y:shop.y-.6,kind:'home'});
    for(const e of g.enemies)if(returnVisible(g.save,e)&&e.hp>0&&!e.dormant&&e.x>x0-2&&e.x<x1+2&&e.y>y0-2&&e.y<y1+2)objects.push({...e,kind:'enemy'});
    objects.push({...g.player,kind:'player'});objects.sort((a,b)=>a.y-b.y);
    const units=objects.filter(obj=>obj.kind==='player'||obj.kind==='enemy');
    for(const obj of objects){
      if(obj.kind==='prop'){
        const tall=['tree','landmark','mountain'].includes(obj.type),height=obj.type==='landmark'?2.7:obj.type==='mountain'?3:1.6,width=obj.type==='landmark'?1.2:obj.type==='mountain'?1.1:.85;
        // Keep faces readable behind tall foreground scenery without changing collision geometry.
        const covering=tall?units.filter(unit=>obj.y>=unit.y-.1&&obj.y-unit.y<height&&Math.abs(obj.x-unit.x)<width):[];
        c.save();
        for(const unit of covering){
          const boss=unit.type==='boss',scale=boss?(unit.size??1.7)/1.7:1,rx=boss?1.15*scale:unit.kind==='player'?.8:.55,ry=boss?1.5*scale:unit.kind==='player'?.9:.65;
          const cy=unit.y-(boss?.35*scale:.1);c.beginPath();c.rect(x0-4,y0-4,x1-x0+8,y1-y0+8);c.moveTo(unit.x+rx,cy);c.ellipse(unit.x,cy,rx,ry,0,0,Math.PI*2);c.clip('evenodd');
        }
        this.prop(obj,t);c.restore();
      }
      else if(obj.kind==='royal')sleepingRoyal(c,obj,t);
      else if(obj.kind==='home')this.home(obj.x,obj.y,t);
      else if(obj.kind==='player'){
        if(regionAt(obj.x,obj.y)===PANTHEON.r){ellipse(c,obj.x,obj.y+.25,.73,.38,'#edf9df');ellipse(c,obj.x,obj.y+.25,.65,.32,'#183e61');ellipse(c,obj.x,obj.y+.25,.51,.23,'#77dfa2');}
        if(g.boostTime>0){ellipse(c,obj.x,obj.y+.2,.64,.36,'#ffdc6340');for(let i=0;i<3;i++)ellipse(c,obj.x+Math.cos(t*3+i*2)*.7,obj.y+Math.sin(t*3+i*2)*.7,.06,.06,'#ffe18c');}
        bot(c,obj.x,obj.y,1.17,{color:g.save.color,armor:g.save.build.armor,wheels:g.save.build.wheels,gun:g.save.build.weapon,gadget:g.save.build.gadget,angle:g.player.angle,hit:g.player.hit,swing:g.player.swing,moving:g.route.length>0,shield:g.player.invincible>0||g.boostTime>0,health:g.player.hp/g.maxHp(),reducedMotion:g.reducedMotion},t);
      }else{
        const boss=obj.type==='boss',reg=REGIONS[obj.r]||REGIONS[0];
        const role=encounterRole(obj),size=boss?(obj.size??1.7):obj.type==='carrier'?1:obj.type==='tank'?.85:.72;
        const awake=g.enemyAwake?g.enemyAwake(obj):g.bossAwake(obj.r),look={...enemyEquipment(obj),boss,region:obj.r,theme:reg.theme,encounterRole:role,type:obj.type,reducedMotion:g.reducedMotion};
        if(boss&&!awake){ellipse(c,obj.x,obj.y+.2,.8,.4,'#263d4828');bot(c,obj.x,obj.y,role?size:1.2,{...look,...(!obj.returnId&&!role?{...(obj.r<5?{armor:'heavy',gun:'bumper'}:{}),color:'#748482'}:{})},t*.1);text(c,'Z z z',obj.x,obj.y-(role?size*1.1/1.7:1),.2,'#e8f1d5');}
        else {bot(c,obj.x,obj.y,size,{...look,angle:obj.angle,hit:obj.hit,swing:obj.swing,moving:obj.active},t);
          if(obj.hp<obj.maxHp||boss&&awake){const scale=boss?size/1.7:1,width=boss?1.1*scale:.55,y=obj.y-(boss?1.1*scale:.6);rounded(c,obj.x-width/2,y,width,.09,.03,'#24393a');rounded(c,obj.x-width/2,y,width*Math.max(0,Math.min(1,obj.hp/obj.maxHp)),.09,.03,boss?'#f39a71':'#f6d787');}
        }
      }
    }
    if(courtVisible){templeColumns(c);templeSeal(c,t);}
    for(const l of g.loot){const bob=Math.sin(t*4+l.x)*.05;ellipse(c,l.x,l.y+.12,.14,.06,'#284b4930');if(l.kind==='gear')this.gear(l.x,l.y+bob,.2);else{c.save();c.translate(l.x,l.y+bob);c.rotate(Math.PI/4);rounded(c,-.09,-.09,.18,.18,.03,'#ffe18c','#b59b46',.025);c.restore();}}
    for(const fx of g.effects)if(fx.type!=='slam'&&fx.type!=='vortex'&&fx.type!=='nova')this.effect(fx,t,g.reducedMotion);
    for(const p of g.projectiles)this.projectile(p,t,g.reducedMotion);
    c.restore();
    // A very subtle paper grain ties the hand-built scenery together.
    if(g.waypoint){const p=this.worldToScreen(g.waypoint.x,g.waypoint.y);if(p.x<30||p.x>w-30||p.y<30||p.y>h-65){const a=Math.atan2(p.y-h/2,p.x-w/2),rx=w/2-40,ry=h/2-65;const ax=w/2+Math.cos(a)*Math.max(30,rx),ay=h/2+Math.sin(a)*Math.max(30,ry);c.save();c.translate(ax,ay);c.rotate(a);c.beginPath();c.moveTo(12,0);c.lineTo(-8,-9);c.lineTo(-5,0);c.lineTo(-8,9);c.closePath();c.fillStyle='#fff1b1';c.strokeStyle='#42655c';c.lineWidth=3;c.stroke();c.fill();c.restore();}}
  }
  projectile(p,t=0,reducedMotion=this.reducedMotion){
    const c=this.c,angle=p.angle??Math.atan2((p.ty??p.y)-p.y,(p.tx??p.x+1)-p.x);
    if(reducedMotion)t=0;
    c.save();c.translate(p.x,p.y);
    if(p.kind==='drone'){
      if(p.style==='swarm'&&!p.enemy){
        ellipse(c,0,.15,.27,.08,'#213e4925');c.rotate(angle);
        line(c,-.45,0,-.16,0,'#c8ffb0',.045);
        for(const side of [-1,1]){
          polygon(c,[[-.2,side*.07],[-.29,side*.23],[.08,side*.19],[.18,side*.07]],'#8edbc4','#294f55',.025);
          line(c,-.18,side*.16,.02,side*.13,'#efffca',.025);
        }
        rounded(c,-.18,-.09,.37,.18,.04,'#d3efbd','#294f55',.03);
        rounded(c,.04,-.065,.12,.13,.025,'#315863');ellipse(c,.12,0,.025,.035,'#fff4ac');
        c.restore();return;
      }
      line(c,-Math.cos(angle)*.42,-Math.sin(angle)*.42,0,0,'#ffe4a1',.055);
      ellipse(c,0,.15,.32,.1,'#213e4925');c.scale(.016,.016);drone(c,t,p.enemy);
    }else{
      c.rotate(angle);
      if(p.kind==='rocket'){
        if(p.style==='supernova'&&!p.enemy){
          polygon(c,[[-.65,0],[-.27,-.1],[-.12,0],[-.27,.1]],'#b9dfff80',null);
          line(c,-.52,0,-.18,0,'#fff0ad',.055);
          for(const side of [-1,1])polygon(c,[[-.19,side*.06],[-.28,side*.2],[.01,side*.09]],'#839ac4','#31475f',.025);
          rounded(c,-.2,-.095,.43,.19,.04,'#e1e8f2','#31475f',.03);
          polygon(c,[[.2,-.09],[.36,0],[.2,.09]],'#ffe09b','#31475f',.025);
          novaStar(c,.02,0,.085,'#fff2b5','#8b744b',.015);
        }else{
          ellipse(c,-.24,0,.27,.1,'#ffce6c');ellipse(c,-.2,0,.17,.06,'#fff4ae');rounded(c,-.15,-.08,.36,.16,.05,'#d9e3d9','#31484d',.025);ellipse(c,.21,0,.1,.08,'#f58059');
        }
      }else if(p.kind==='ice'){
        polygon(c,[[-.45,0],[-.15,-.15],[.34,0],[-.15,.15]],p.enemy?'#ffe0e5':'#d9fbff',p.enemy?'#b55679':'#458aa8',.03);
        line(c,-.26,0,.22,0,'#fff',.035);line(c,-.12,-.11,-.04,0,'#8bcbe3',.025);line(c,-.12,.11,-.04,0,'#8bcbe3',.025);
        for(const side of [-1,1])polygon(c,[[-.48,side*.1],[-.6,side*.16],[-.62,side*.05]],'#b5f1ff',null);
      }else if(p.kind==='blade'){
        const trail=p.enemy?'#f5a3b8':p.returning?'#8ce9ce':'#ffe09b';
        line(c,-.5,-.12,-.2,-.12,trail,.04);line(c,-.56,.12,-.26,.12,trail,.04);
        if(p.returning)ring(c,0,0,.37,p.enemy?'#f5a3b899':'#8ce9ce99',.035);
        c.scale(.019,.019);blade(c,reducedMotion?0:t*(p.returning?-22:22),p.enemy);
      }else if(p.kind==='meteor'){
        polygon(c,[[-.95,-.05],[-.32,-.18],[-.15,-.06],[-.35,.2]],'#ffac6266',null);
        polygon(c,[[-.75,0],[-.2,-.1],[.04,0],[-.2,.1]],'#ffe59d',null);
        polygon(c,[[-.22,-.16],[.03,-.23],[.24,-.1],[.27,.1],[.08,.23],[-.15,.16]],'#dd8c64','#78595d',.035);
        polygon(c,[[-.12,-.12],[.03,-.18],[.17,-.06],[.04,.02]],'#fff0b5',null);ellipse(c,.08,.1,.055,.04,'#a56358');
      }else{
        ellipse(c,0,0,.16,.09,p.enemy?'#ffbf79':'#bffcff');ellipse(c,0,0,.075,.045,'#fffbe0');
      }
    }
    c.restore();
  }
  ground(x,y,t,g){const c=this.c,r=regionAt(x,y),reg=REGIONS[r]||REGIONS[4],n=hash(x,y);if(r===PANTHEON.r){templeGround(c,x,y);return;}const road=isRoad(x+.5,y+.5);
    if(g.world.water.has(`${x},${y}`)){
      c.fillStyle=reg.water;c.fillRect(x,y,1.02,1.02);
      if(r>=5){themeGround(c,x,y,reg,n,false,t,true);return;}
      if(r>=3){
        if(r===3){line(c,x+.15,y+.25,x+.85,y+.25,'#ffba6570',.08);line(c,x+.15,y+.7,x+.85,y+.7,'#ffe2a160',.035);}
        else if(n>.45){ellipse(c,x+.25,y+.3,.018,.018,'#ceeaff');ellipse(c,x+.74,y+.7,.012,.012,'#9daedd');}
        return;
      }
      for(const [dx,dy] of [[1,0],[-1,0],[0,1],[0,-1]])if(!g.world.water.has(`${x+dx},${y+dy}`)){
        const ex=x+.5+dx*.48,ey=y+.5+dy*.48;
        line(c,ex+(dy?.5:0),ey+(dx?.5:0),ex-(dy?.5:0),ey-(dx?.5:0),'#d7dfae',.13);
        line(c,ex+(dy?.48:0)-dx*.13,ey+(dx?.48:0)-dy*.13,ex-(dy?.48:0)-dx*.13,ey-(dx?.48:0)-dy*.13,'#e3f3d693',.045);
      }
      line(c,x+.1,y+.35+Math.sin(t*1.8+x)*.025,x+.48,y+.35+Math.sin(t*1.8+x)*.025,'#d9f7df65',.025);
      line(c,x+.6,y+.7,x+.8,y+.7,'#d9f7df40',.02);
      if(n>.75){ellipse(c,x+.5,y+.55,.14,.065,'#71a87d');ellipse(c,x+.49,y+.54,.08,.04,'#b5d792');}return;
    }
    c.fillStyle=road?reg.path:reg.ground;c.fillRect(x,y,1.015,1.015);
    c.fillStyle=n>.5?'#ffffff08':'#203e3706';c.fillRect(x+.02,y+.02,.96,.96);
    if(r>=5){themeGround(c,x,y,reg,n,road,t);if(!g.save.visited.includes(r)&&r>unlockedRegion(g.save)){c.fillStyle='#192f3b55';c.fillRect(x,y,1.02,1.02);}return;}
    if(r>=3){
      rounded(c,x+.05,y+.05,.9,.9,.035,null,road?'#8297a044':'#48616d50',.018);
      if(r===3){
        line(c,x+.15,y+.87,x+.47,y+.87,'#f9cf8455',.03);if(n>.7){for(let i=0;i<3;i++)line(c,x+.22+i*.18,y+.24,x+.31+i*.18,y+.37,'#586d7770',.035);}
      }else{
        c.save();c.translate(x+.5,y+.5);c.rotate(Math.floor(n*4)*Math.PI/2);line(c,-.4,-.22,-.1,-.22,'#d5fbff66',.025);line(c,-.1,-.22,-.1,.1,'#d5fbff66',.025);ellipse(c,-.1,.12,.035,.035,'#e4ffff');c.restore();
        if(n>.7)line(c,x+.74,y+.12,x+.74,y+.8,'#7086b26b',.045);
      }
      if(!g.save.visited.includes(r)&&r>unlockedRegion(g.save)){c.fillStyle='#192f3b55';c.fillRect(x,y,1.02,1.02);}
      return;
    }
    if(!road&&r===1){
      for(let j=0;j<4;j++){const px=x+hash(x+j*11,y)*.9,py=y+hash(x,y+j*7)*.9;ellipse(c,px,py,.035,.015,j%2?'#e1b16e80':'#31594955');}
      line(c,x+.15,y+.75,x+.36,y+.69,'#3c655970',.025);
    }else if(!road&&r===2){
      line(c,x+.13,y+.7,x+.43,y+.63,'#6d8a9d44',.025);line(c,x+.5,y+.3,x+.77,y+.3,'#f0faf9aa',.04);
      if(n>.6){ellipse(c,x+.3,y+.4,.03,.02,'#f5ffffb0');ellipse(c,x+.8,y+.8,.025,.02,'#5b7e8b60');}
    }else if(!road){for(let j=0;j<6;j++){const px=x+hash(x+j*13,y,4)*.9,py=y+hash(x,y+j*7,5)*.9;const wind=Math.sin(t*1.3+x+y)*.014;line(c,px,py,px+.025+wind,py-.065,reg.dark+'66',.015);line(c,px,py,px+.06+wind,py-.035,reg.dark+'66',.015);}
      if(n>.8){ellipse(c,x+.35,y+.57,.07,.02,'#ffffff25');ellipse(c,x+.65,y+.3,.025,.025,'#fff0be70');}
    }else{for(let j=0;j<3;j++)ellipse(c,x+hash(x+j,y,7),y+hash(x,y+j,8),.025,.018,'#61795930');}
    if(x===0||y===0||x===WORLD_W-1||y===WORLD_H-1){c.fillStyle=reg.water;c.fillRect(x,y,1.01,1.01);line(c,x+.1,y+.4+Math.sin(t+x)*.02,x+.6,y+.4+Math.sin(t+x)*.02,'#c1e9dc60',.025);}
    if(!g.save.visited.includes(r)&&r>unlockedRegion(g.save)){c.fillStyle='#192f3b55';c.fillRect(x,y,1.02,1.02);}
  }
  prop(p,t){const c=this.c,reg=REGIONS[p.r];c.save();c.translate(p.x,p.y);
    if(p.r>=5&&reg?.theme){themeProp(c,p,reg,t);c.restore();return;}
    if(p.type==='landmark'){
      ellipse(c,.2,.2,.9,.3,'#294b4833');rounded(c,-.4,-.4,.8,.65,.07,'#78958a','#456c65',.04);
      if(p.r===2){for(let i=0;i<3;i++){c.beginPath();c.moveTo(-.5+i*.35,0);c.lineTo(-.4+i*.35,-1.5+i*.3);c.lineTo(-.22+i*.35,-.45);c.lineTo(-.2+i*.35,0);c.closePath();c.fillStyle=i%2?'#bdeded':'#72c7d5';c.fill();c.strokeStyle='#477f97';c.lineWidth=.035;c.stroke();}}
      else if(p.r===1){
        rounded(c,-.65,-1.1,1.3,.82,.08,'#657b70','#37564f',.05);rounded(c,-.73,-1.24,1.46,.2,.04,'#c8a776','#4c6656',.035);this.gear(0,-.7,.34);line(c,-.47,-.1,-.47,-.46,'#c4b18a',.09);line(c,.47,-.1,.47,-.46,'#c4b18a',.09);
      }else if(p.r===3){
        rounded(c,-.56,-1.2,1.12,1.1,.1,'#728b8e','#3c5762',.05);rounded(c,-.39,-1.02,.78,.7,.05,'#4d5d68');bolt(c,0,-.65,.5,'#ffd480');
        for(const side of [-1,1]){rounded(c,side*.56-.1,-1.45,.2,1.22,.04,'#d7bc89','#5c6e73',.03);ellipse(c,side*.56,-1.5,.09,.06,'#ffde8d');}
      }else if(p.r===4){
        line(c,0,-.1,0,-1.2,'#657c9b',.15);c.save();c.translate(0,-1.4);c.rotate(-.45);ellipse(c,0,0,.72,.35,'#d1e2e4');line(c,-.55,0,.55,0,'#6c8dad',.045);line(c,0,-.05,0,-.5,'#7f9fba',.05);ellipse(c,0,-.53,.08,.08,'#b7faff');c.restore();
      }
      else {line(c,0,-.3,0,-2.2,'#416963',.15);line(c,-.035,-.4,-.035,-2.2,'#9fbeb2',.045);c.save();c.translate(0,-2.2);c.rotate(t*.55+p.seed*4);for(let i=0;i<3;i++){c.rotate(Math.PI*2/3);c.beginPath();c.moveTo(-.07,.06);c.lineTo(-.1,-1.1);c.lineTo(.09,-.87);c.lineTo(.08,-.1);c.closePath();c.fillStyle='#d5debb';c.fill();c.strokeStyle='#4e7c6b';c.lineWidth=.025;c.stroke();}ellipse(c,0,0,.13,.13,'#f8d986');c.restore();}
    }else if(p.type==='tree'){
      if(p.r===1){
        ellipse(c,.1,.18,.55,.22,'#26483f40');rounded(c,-.09,-.2,.18,.5,.035,'#836b4f','#425c4e',.025);
        const palette=p.seed<.085?['#a97652','#c99760','#ddb87c']:['#476e61','#628b70','#90aa7a'];
        for(let j=0;j<3;j++){const y=-.18-j*.38,w=.62-j*.13;c.beginPath();c.moveTo(-w,y);c.quadraticCurveTo(-.2,y-.18,0,y-.8);c.quadraticCurveTo(.2,y-.18,w,y);c.closePath();c.fillStyle=palette[j];c.fill();c.strokeStyle='#35574c';c.lineWidth=.025;c.stroke();}c.restore();return;
      }
      ellipse(c,.2,.24,.65,.25,'#20464228');rounded(c,-.1,-.45,.2,.68,.06,'#687d60','#3e6251',.035);
      const colors=p.r===4?['#778b9e','#96b3b4','#b9ccd0']:p.r===3?['#658565','#8cab75','#b5c987']:[reg.dark,'#70a77b','#98c28b'];
      ellipse(c,0,-.55,.57,.54,colors[0]);ellipse(c,-.2,-.69,.38,.35,colors[1]);ellipse(c,.18,-.7,.3,.32,colors[1]);ellipse(c,-.17,-.86,.24,.17,colors[2]);
      c.beginPath();c.ellipse(.1,-.51,.43,.29,0,0,Math.PI);c.strokeStyle='#284d4926';c.lineWidth=.09;c.stroke();
      for(let i=0;i<4;i++)ellipse(c,-.35+i*.2,-.55+(i%2)*.09,.04,.025,'#d6e5ac60');
    }else if(p.type==='mountain'){
      ellipse(c,.2,.3,1.2,.55,'#213d4c30');c.beginPath();c.moveTo(-1.25,.35);c.lineTo(-.2,-2.1);c.lineTo(.3,-1.5);c.lineTo(1.25,.35);c.closePath();c.fillStyle='#738b91';c.fill();c.beginPath();c.moveTo(-.2,-2.1);c.lineTo(.3,-1.5);c.lineTo(1.25,.35);c.lineTo(.05,.1);c.closePath();c.fillStyle='#506e7c';c.fill();c.beginPath();c.moveTo(-.65,-1.2);c.lineTo(-.2,-2.1);c.lineTo(.3,-1.5);c.lineTo(.55,-.9);c.lineTo(.05,-1.17);c.lineTo(-.27,-.99);c.closePath();c.fillStyle='#d0ded9';c.fill();
    }else if(p.type==='crystal'){
      ellipse(c,.05,.12,.4,.16,'#4b78952b');
      for(let i=0;i<3;i++){const x=(i-1)*.22,h=i===1?.9:.55;c.beginPath();c.moveTo(x-.12,.05);c.lineTo(x-.13,-h*.65);c.lineTo(x,-h);c.lineTo(x+.13,-h*.65);c.lineTo(x+.1,.05);c.closePath();c.fillStyle=i===1?'#b9edf0':'#7abdd6';c.fill();c.strokeStyle='#517f9b';c.lineWidth=.022;c.stroke();line(c,x,-h,x,.03,'#edffff',.025);}
    }else if(p.type==='solar'){
      ellipse(c,.1,.15,.55,.2,'#35525b35');line(c,-.3,0,-.3,-.45,'#718393',.1);line(c,.3,0,.3,-.45,'#718393',.1);
      rounded(c,-.57,-.9,1.14,.66,.04,'#597b9d','#3f586a',.045);
      for(let i=0;i<3;i++)for(let j=0;j<2;j++)rounded(c,-.49+i*.34,-.82+j*.25,.28,.19,.015,'#94c3d1');line(c,-.55,-.9,.55,-.9,'#f5cf83',.045);
    }else if(p.type==='antenna'){
      ellipse(c,.08,.16,.46,.18,'#314e7530');rounded(c,-.28,-.15,.56,.3,.05,'#7287a9','#455f84',.035);line(c,0,-.18,0,-1.25,'#d8e8eb',.09);
      for(const side of [-1,1]){line(c,0,-.97,side*.45,-1.18,'#7e9bb8',.045);ellipse(c,side*.45,-1.18,.07,.07,'#c8faff');}ellipse(c,0,-1.34,.12,.12,'#e3fbfa');
    }else if(p.type==='crate'){
      ellipse(c,.1,.16,.43,.15,'#35516830');rounded(c,-.34,-.52,.68,.65,.05,p.r===3?'#949b95':'#8fa1be','#4c6581',.035);rounded(c,-.25,-.43,.5,.15,.02,p.r===3?'#e3c387':'#b8e6eb');line(c,-.2,-.14,.2,-.14,'#556e8b',.035);line(c,-.2,-.02,.2,-.02,'#556e8b',.035);
    }else if(p.type==='beacon'){
      rounded(c,-.14,-.45,.28,.5,.04,'#6e829a','#48647c',.025);rounded(c,-.1,-.43,.2,.15,.025,p.r===3?'#ffdc8b':'#c5ffff');
    }else if(p.type==='rock'){
      ellipse(c,.1,.15,.47,.19,'#264b4730');c.beginPath();c.moveTo(-.4,.05);c.lineTo(-.31,-.34);c.lineTo(.02,-.53);c.lineTo(.35,-.29);c.lineTo(.41,.08);c.lineTo(.13,.19);c.closePath();c.fillStyle=p.r===2?'#88baca':'#8b9b89';c.fill();c.strokeStyle='#506e6d';c.lineWidth=.025;c.stroke();
      c.beginPath();c.moveTo(-.31,-.34);c.lineTo(.02,-.53);c.lineTo(.14,-.15);c.lineTo(-.15,-.09);c.closePath();c.fillStyle=p.r===2?'#c0edf1':'#b7c6ab';c.fill();
      if(p.r===2){line(c,.1,-.5,.25,.02,'#d9ffff',.03);ellipse(c,.15,-.48,.035,.035,'#fff');}
    }else if(p.type==='scrap'){
      ellipse(c,.08,.15,.4,.16,'#264b4728');rounded(c,-.3,-.21,.55,.36,.07,'#82978a','#4b6b65',.04);line(c,-.22,-.13,.17,-.13,'#afc3a2',.05);for(let i=0;i<3;i++)line(c,-.18+i*.12,-.05,-.18+i*.12,.1,'#42645e',.035);rounded(c,.05,-.36,.3,.16,.03,'#d4bf74','#5a7766',.03);
    }else{
      for(let j=0;j<3;j++){const a=j*2.1+t*.1;const x=Math.cos(a)*.18,y=Math.sin(a)*.12;line(c,x,y+.1,x,y-.04,'#4f8d66',.025);ellipse(c,x,y-.04,.055,.04,j%2?reg.accent:'#f7f6c7');}
    }c.restore();
  }
  home(x,y,t){const c=this.c;c.save();c.translate(x,y);
    ellipse(c,.1,.4,1.7,.55,'#264b4930');rounded(c,-1.65,-.45,3.3,1.35,.18,'#a4b69a','#4a6a60',.04);
    for(let i=0;i<5;i++)line(c,-1.5+i*.65,-.25,-1.5+i*.65,.75,'#728f7a',.035);
    rounded(c,-1.34,-2.13,2.68,2.3,.18,'#dbe6bd','#345750',.06);rounded(c,-1.2,-1.88,2.4,1.95,.1,'#adc4a2');
    rounded(c,-1.22,-1.86,.16,1.86,.03,'#eff3c7');rounded(c,1.05,-1.86,.15,1.86,.03,'#769c82');
    rounded(c,-.6,-1.3,1.22,1.49,.08,'#2c5253','#274846',.06);rounded(c,-.48,-1.18,.98,.2,.03,'#88bbb0');
    for(let i=0;i<4;i++)line(c,-.48,-.83+i*.21,.48,-.83+i*.21,'#466f69',.05);
    rounded(c,-1.62,-2.25,3.24,.57,.1,'#477c73','#2d5652',.06);rounded(c,-1.55,-2.2,3.1,.13,.04,'#80b09a');
    for(let i=0;i<7;i++)line(c,-1.4+i*.45,-2.12,-1.4+i*.45,-1.75,'#36665f',.025);
    rounded(c,-.81,-2.55,1.64,.48,.06,'#e9d48b','#405f53',.04);text(c,'WORKSHOP',0,-2.24,.21,'#33584e');
    rounded(c,-1.18,-1.43,.42,.6,.04,'#d8efc0','#4d7864',.035);bolt(c,-.97,-1.13,.3,'#6c9f70');
    rounded(c,.78,-1.43,.42,.6,.04,'#68b1b1','#426d66',.035);line(c,.98,-1.4,.98,-.88,'#b9ded0',.03);
    rounded(c,1.3,-1.36,.39,1.13,.1,'#7fa893','#3b675a',.035);ellipse(c,1.5,-1.08,.09,.09,'#d5f7a3');bolt(c,1.5,-.69,.26,'#e9df94');
    const bob=Math.sin(t*2)*.04;ellipse(c,-1.8,-.1+bob,.22,.1,'#395e5728');rounded(c,-1.94,-.46+bob,.4,.35,.07,'#e3c76e','#547459',.035);ellipse(c,-1.74,-.35+bob,.04,.05,'#32534c');
    for(let i=0;i<3;i++){rounded(c,-2.28,-.05-i*.22,.46,.2,.06,'#334f50','#234440',.025);line(c,-2.2,.0-i*.22,-1.9,.0-i*.22,'#718d80',.025);}
    rounded(c,1.9,-.24,.53,.56,.06,'#cfbc78','#56785c',.03);rounded(c,1.94,-.21,.44,.13,.02,'#f5df9b');bolt(c,2.17,.06,.22,'#71946b');
    for(let side of [-1,1])for(let i=0;i<4;i++){const fx=side*(1.7+hash(i,side,3)*.7),fy=.6+i*.15;line(c,fx,fy,fx,fy-.16,'#518a62',.02);ellipse(c,fx,fy-.18,.055,.045,i%2?'#fff0bc':'#f2bf8f');}
    text(c,'HOME',0,.65,.17,'#547b63');c.restore();
  }
  gear(x,y,size){const c=this.c;c.save();c.translate(x,y);c.beginPath();for(let i=0;i<24;i++){const a=i*Math.PI/12,r=i%3===0?size:size*.8;c.lineTo(Math.cos(a)*r,Math.sin(a)*r);}c.closePath();c.fillStyle='#d4edf0';c.fill();c.strokeStyle='#557d85';c.lineWidth=size*.13;c.stroke();ellipse(c,0,0,size*.32,size*.32,'#618c8f');c.restore();}
  site(site,done,t){const c=this.c;const{x,y}=site;c.save();c.translate(x,y);ellipse(c,0,.2,1.15,.65,done?'#bfda9c44':'#8b9e6c33');
    if(site.returnId){ring(c,0,0,1.05,'#c59cf5',.08);line(c,.7,.1,.7,-1.25,'#f4e5ff',.045);polygon(c,[[.7,-1.25],[1.3,-1.12],[.7,-.82]],'#9063c4','#e5caff',.03);}
    for(let j=0;j<3;j++){const xx=(j-1)*.64;rounded(c,xx-.25,-.3,.5,.48,.06,done?'#7eab83':'#a9b6a0','#557968',.035);line(c,xx-.15,-.23,xx+.15,-.23,'#d9ddba',.05);}
    if(site.index%3===1){rounded(c,-.8,-.8,1.6,.45,.07,'#516e7a','#385d60',.04);for(let i=0;i<6;i++)line(c,-.69+i*.25,-.76,-.69+i*.25,-.4,'#a6c9bd',.025);}
    if(site.index%3===2){for(const side of [-1,1]){rounded(c,side*.8-.12,-.85,.24,.7,.05,'#6d8b85','#3c655e',.03);ellipse(c,side*.8,-.81,.18,.09,'#b8d5b0');line(c,side*.8,-.7,side*.8,-.35,'#e8d696',.04);}}
    if(done){rounded(c,-.18,-.6,.36,.65,.09,'#c3e9b0','#4e8c65',.035);bolt(c,0,-.32,.3,'#fbf7ac');}
    else{const b=Math.sin(t*3+site.index)*.06;this.gear(0,-.7+b,.2);ellipse(c,0,-.7+b,.3,.3,'#fff3c00b');}
    c.restore();
  }
  station(st,g,t){const c=this.c,charging=g.charging===st.id;c.save();c.translate(st.x,st.y);
    ellipse(c,0,0,2.25,2.25,'#a4f2c91a');c.beginPath();c.arc(0,0,2.25,0,Math.PI*2);c.strokeStyle='#b5f5cd8c';c.lineWidth=.045;c.setLineDash([.12,.16]);c.stroke();c.setLineDash([]);
    ellipse(c,0,.08,1.05,.7,'#315c5940');rounded(c,-.88,-.4,1.76,1,.17,'#6e9c8a','#315e56',.05);rounded(c,-.72,-.3,1.44,.7,.1,charging?'#b8f6c3':'#9ac9ac');
    for(const x of [-.55,.55])line(c,x,-.2,x,.27,'#e2f7c8',.07);
    rounded(c,-.4,-1.68,.8,1.12,.12,'#edf4d4','#3b7568',.05);rounded(c,-.32,-1.6,.64,.85,.08,'#71b7a0');line(c,-.21,-1.18,.21,-1.18,'#edffe0',.12);line(c,0,-1.39,0,-.97,'#edffe0',.12);
    ellipse(c,0,-1.85,.13,.13,'#dcffc0');text(c,charging?'CHARGING':'RECHARGE',0,.77,.18,'#e8ffcf');
    if(charging){const hp=g.player.hp/g.maxHp();c.beginPath();c.arc(0,0,1.35,-Math.PI/2,-Math.PI/2+hp*Math.PI*2);c.strokeStyle='#e6ffae';c.lineWidth=.11;c.stroke();for(let i=0;i<4;i++){const f=(t*.65+i*.25)%1;ellipse(c,Math.cos(i*1.57)*.8,-f*1.5,.035,.07,'#eeffd0');}}
    c.restore();
  }
  relay(x,y,r,g,t){const c=this.c;const required=requiredCells(r),done=g.save.bosses.includes(r),awake=cellsIn(g.save,r)>=required;c.save();c.translate(x,y);ellipse(c,0,.1,2.1,1.7,'#263e3f22');
    c.beginPath();c.ellipse(0,0,2.2,1.8,0,0,Math.PI*2);c.strokeStyle=done?'#e8f8b69a':'#edf0d549';c.lineWidth=.07;c.setLineDash([.15,.16]);c.stroke();c.setLineDash([]);
    rounded(c,-.35,-1.2,.7,.9,.12,done?'#91c6a4':'#658383','#355b59',.04);rounded(c,-.48,-1.35,.96,.25,.07,'#a1bdb0','#365b59',.03);
    for(let i=0;i<required;i++)ellipse(c,-(required-1)*.035+i*.07,-1.22,.025,.03,done||i<cellsIn(g.save,r)?'#ffdf87':'#3c6461');
    if(done||awake){const a=t*.5;ellipse(c,0,-1.6,.2,.22,done?'#d2f7b2':'#ffe58a');bolt(c,0,-1.61,.3,'#fffce2');}
    c.restore();
  }
  chest(x,y,t){const c=this.c;c.save();c.translate(x,y);ellipse(c,0,.15,.33,.12,'#355e572a');rounded(c,-.27,-.28,.54,.4,.06,'#e8c365','#506c54',.035);rounded(c,-.3,-.32,.6,.16,.04,'#ffdf85','#617453',.025);rounded(c,-.05,-.25,.1,.2,.02,'#698a6c');text(c,'✦',0,-.5+Math.sin(t*2)*.05,.23,'#ffedb4');c.restore();}
  gate(x,y,t){const c=this.c;c.save();c.translate(x,y);for(const v of [-2,2]){rounded(c,-.28,v-.3,.56,.7,.08,'#789c91','#385c57',.04);ellipse(c,0,v,.1,.1,'#ffcf74');}line(c,0,-1.7,0,1.7,'#c9f5ec99',.13);line(c,-.07,-1.7,-.07,1.7,'#edfff4',.025);c.restore();}
  effect(f,t,reducedMotion=this.reducedMotion){const c=this.c,p=reducedMotion?.45:Math.max(0,Math.min(1,1-f.life/(f.max||1)));if(reducedMotion)t=0;c.save();c.globalAlpha=Math.max(0,Math.min(1,f.life*5));
    if(f.type==='number'){text(c,f.text,f.x,f.y-p*.65,.22,f.color||'#ffefb2');}
    else if(f.type==='flame'||f.type==='frost'){
      const ice=f.type==='frost',a=f.angle??Math.atan2((f.ty??f.y)-f.y,(f.tx??f.x+1)-f.x),radius=f.radius||2.3;
      c.translate(f.x,f.y);c.rotate(a);
      polygon(c,[[.12,-.12],[radius*.8,-radius*.36],[radius,0],[radius*.8,radius*.36],[.12,.12]],f.enemy?'#ef819b40':ice?'#9ce8f467':'#ffaf5266',null);
      for(let i=0;i<7;i++){
        const v=reducedMotion?(i+1)/8:(p+i/7)%1,x=.2+v*radius*.85,y=Math.sin(i*2.4)*v*radius*.26;
        if(ice){c.save();c.translate(x,y);c.rotate(i);polygon(c,[[-.14,0],[0,-.1],[.2,0],[0,.1]],f.enemy?'#ffe5ea':'#e8ffff',f.enemy?'#c16484':'#7bbfdc',.025);line(c,-.18,0,.18,0,'#fff',.025);c.restore();}
        else{polygon(c,[[x-.22,y],[x+.2,y-.12-v*.12],[x+.08,y],[x+.27,y+.12],[x-.18,y+.12]],i%2?'#fff1a4':'#ff9450',null);}
      }
    }else if(f.type==='blade'){
      const tx=f.tx??f.x,ty=f.ty??f.y,dx=tx-f.x,dy=ty-f.y;
      c.beginPath();c.moveTo(f.x,f.y);c.quadraticCurveTo((f.x+tx)/2-dy*.18,(f.y+ty)/2+dx*.18,tx,ty);c.strokeStyle='#477f8866';c.lineWidth=.035;c.stroke();
    }else if(f.type==='vortex'){
      const radius=f.radius||1.8;ellipse(c,f.x,f.y,radius,radius*.65,f.enemy?'#ee8ba32b':'#80dac52b');
      for(let j=0;j<3;j++){c.beginPath();for(let i=0;i<=40;i++){const v=i/40,r=radius*(1-v*.83),a=t*3+j*Math.PI*2/3+v*5;const x=f.x+Math.cos(a)*r,y=f.y+Math.sin(a)*r*.65;i?c.lineTo(x,y):c.moveTo(x,y);}c.strokeStyle=f.enemy?(j%2?'#ffe4ba':'#d66b90'):j%2?'#e3ffdb':'#8cd8d7';c.lineWidth=.045;c.stroke();}ellipse(c,f.x,f.y,.16,.13,'#f3ffe0');
    }else if(f.type==='sunbeam'){
      const tx=f.tx??f.x,ty=f.ty??f.y,a=Math.atan2(ty-f.y,tx-f.x),length=Math.hypot(tx-f.x,ty-f.y);
      c.globalAlpha=reducedMotion?.85:1-p;c.translate(f.x,f.y);c.rotate(a);
      const pulse=reducedMotion?1:1+Math.sin(p*Math.PI*5)*.12;
      line(c,0,0,length,0,'#ffc94f40',.48*pulse);line(c,0,0,length,0,'#efbb49',.2*pulse);line(c,0,0,length,0,'#fff9d3',.08);
      const flare=f.flareRadius||.28;
      ellipse(c,0,0,flare,flare,'#fff5bd80');ellipse(c,0,0,flare*.6,flare*.6,'#fff8d4');ring(c,0,0,Math.max(.38,flare)+p*.18,'#ffe6a6',.035);
      for(let i=1;i<=4;i++){
        const x=length*((i/5+(reducedMotion?0:p*.35))%1);polygon(c,[[x-.09,0],[x,-.23],[x+.09,0],[x,.23]],null,'#fff1a9',.035);
        for(const side of [-1,1])line(c,x-.15,side*.21,x-.33,side*.24,'#fff2ad',.025);
      }
      ellipse(c,length,0,.09,.09,'#fff6c5');
    }else if(f.type==='nova'){
      const radius=f.radius??2.4,r=radius*(.35+p*.65);
      c.globalAlpha=reducedMotion?.8:1-p;c.translate(f.x,f.y);
      ellipse(c,0,0,r,r,'#f9dc7a22');ring(c,0,0,r,'#e6b95f',.055);ring(c,0,0,r*.78,'#d1e8ff',.03);
      novaStar(c,0,0,r*.48,'#fff0bc38','#ffe5a2',.045);
      for(let i=0;i<8;i++){
        const a=i*Math.PI/4,d=r*.9,x=Math.cos(a)*d,y=Math.sin(a)*d;
        novaStar(c,x,y,.09,'#fff4be','#a28a68',.015);
        line(c,Math.cos(a)*r*.55,Math.sin(a)*r*.55,Math.cos(a)*r*.7,Math.sin(a)*r*.7,'#f7eac3',.03);
      }
    }else if(f.type==='rail'){
      line(c,f.x,f.y,f.tx??f.x,f.ty??f.y,f.enemy?'#e46a9570':'#42d9ba70',.28);line(c,f.x,f.y,f.tx??f.x,f.ty??f.y,f.enemy?'#ffe1bd':'#f4ffdc',.065);
      const a=Math.atan2((f.ty??f.y)-f.y,(f.tx??f.x)-f.x);for(let i=1;i<5;i++){const v=i/5,x=f.x+((f.tx??f.x)-f.x)*v,y=f.y+((f.ty??f.y)-f.y)*v;c.save();c.translate(x,y);c.rotate(a);c.beginPath();c.ellipse(0,0,.075,.17,0,0,Math.PI*2);c.strokeStyle='#b3ffe2';c.lineWidth=.025;c.stroke();c.restore();}
    }else if(f.type==='meteor-ground'){
      const r=f.radius||1.4;ellipse(c,f.x,f.y,r,r*.65,'#ffc86f30');ring(c,f.x,f.y,r,'#ffd28e',.055);
      if(p>.5)ring(c,f.x,f.y,r*(p-.4),'#fff0ba',.08);
    }else if(f.type==='meteor'){
      const r=f.radius||1.4;
      for(let i=0;i<3;i++){const phase=reducedMotion?.7:Math.min(1,p*1.4+i*.12),x=f.x+(i-1)*r*.5,y=f.y-(1-phase)*2.5;
        line(c,x-.45,y-.8,x,y,'#ffac6655',.2);line(c,x-.3,y-.6,x,y,'#ffe4a6',.07);ellipse(c,x,y,.13,.16,'#fff0b7');ellipse(c,x+.03,y+.04,.1,.1,'#e99463');}
    }else if(f.type==='drone'){
      const tx=f.tx??f.x,ty=f.ty??f.y;
      // The projectile owns the flying drone; this is only its target lock.
      for(const side of [-1,1]){line(c,tx+side*.25,ty-.24,tx+side*.25,ty-.1,'#527c86',.035);line(c,tx+side*.25,ty-.24,tx+side*.1,ty-.24,'#527c86',.035);}
    }else if(f.type==='split'){
      const radius=f.radius??1.5,travel=radius*(.18+p*.7),fade=1-p;
      c.translate(f.x,f.y);c.globalAlpha*=fade;
      ring(c,0,0,radius*(.25+p*.75),'#ead6ff',.045);
      ellipse(c,0,0,.32*fade,.26*fade,'#fff5d9');
      for(let i=0;i<6;i++){
        const a=i*Math.PI/3,x=Math.cos(a)*travel,y=Math.sin(a)*travel*.7;
        c.save();c.translate(x,y);c.rotate(a+(reducedMotion?0:p*.8));
        polygon(c,[[-.17,-.09],[.13,-.13],[.2,.04],[-.1,.12]],i%2?'#aa7cc8':'#d5b4ee','#5b4774',.025);
        line(c,-.1,-.07,.1,-.09,'#f8eaff',.025);c.restore();
        const d=radius*(.3+p*.65),sx=Math.cos(a+.3)*d,sy=Math.sin(a+.3)*d;
        line(c,sx-.045,sy,sx+.045,sy,'#fff0b7',.025);
        line(c,sx,sy-.045,sx,sy+.045,'#fff0b7',.025);
      }
    }else if(f.type==='burst'||f.type==='explosion'||f.type==='blast'){
      const big=f.type!=='burst',rad=(f.radius||.5)*(.4+p);
      c.beginPath();c.arc(f.x,f.y,rad,0,Math.PI*2);c.strokeStyle=big?'#fff1b1':'#fff0ae';c.lineWidth=.07*(1-p);c.stroke();
      for(let i=0;i<(big?14:8);i++){const a=i*2.399;const d=rad*(.5+p);ellipse(c,f.x+Math.cos(a)*d,f.y+Math.sin(a)*d,(big?.14:.075)*(1-p),(big?.14:.075)*(1-p),i%2?'#ffb864':'#fff3b5');}
      if(big)ellipse(c,f.x,f.y,rad*.6*(1-p),rad*.6*(1-p),'#ffd76d80');
    }else if(f.type==='arc'){
      for(let layer=0;layer<2;layer++){c.beginPath();c.moveTo(f.x,f.y);for(let i=1;i<8;i++){const v=i/8;const zig=Math.sin(i*17+t*32)*.18;c.lineTo(f.x+(f.tx-f.x)*v+zig,f.y+(f.ty-f.y)*v+zig);}c.lineTo(f.tx,f.ty);c.strokeStyle=f.enemy?(layer?'#ffe6c9':'#e477a0'):layer?'#eeffff':'#72e0ff';c.lineWidth=layer?.035:.12;c.stroke();}
    }else if(f.type==='slam'){
      c.beginPath();c.ellipse(f.x,f.y,p*1.8,p*.9,0,0,Math.PI*2);c.strokeStyle='#ffe794';c.lineWidth=.1*(1-p);c.stroke();for(let i=0;i<5;i++){const a=i*1.25;line(c,f.x+Math.cos(a)*p*.3,f.y+Math.sin(a)*p*.3,f.x+Math.cos(a)*p*1.5,f.y+Math.sin(a)*p*.8,'#f4e5b2',.035);}
    }c.restore();
  }
  map(canvas,g){const c=canvas.getContext('2d'),w=600,h=760;canvas.width=w*2;canvas.height=h*2;c.scale(2,2);c.fillStyle='#19393c';c.fillRect(0,0,w,h);const {scale:s,ox,oy}=atlasLayout(),markerScale=Math.min(1,108/WORLD_W);
    rounded(c,ox,oy,WORLD_W*s,WORLD_H*s,8,'#7eb6bd');
    for(let y=0;y<WORLD_H;y++)for(let x=0;x<WORLD_W;x++){const r=regionAt(x,y);c.fillStyle=g.world.water.has(`${x},${y}`)?(REGIONS[r]?.water||'#64a8b5'):r<0?'#607b87':areaInfo(r).ground;c.fillRect(ox+x*s,oy+y*s,s+.1,s+.1);if(r>=0&&isRoad(x+.5,y+.5)){c.fillStyle=REGIONS[r].path;c.fillRect(ox+x*s,oy+y*s,s+.1,s+.1);}}
    for(const p of g.world.props)if(p.type==='mountain'&&(p.r===2||hash(Math.floor(p.x),Math.floor(p.y))<.04)){
      const x=ox+p.x*s,y=oy+p.y*s;c.beginPath();c.moveTo(x-4,y+2);c.lineTo(x,y-5);c.lineTo(x+4,y+2);c.closePath();c.fillStyle='#607e91';c.fill();c.beginPath();c.moveTo(x-1.7,y-2);c.lineTo(x,y-5);c.lineTo(x+1.7,y-2);c.closePath();c.fillStyle='#f0ffff';c.fill();
    }
    for(const p of g.world.props)if(p.r===1&&p.type==='tree'&&hash(Math.floor(p.x),Math.floor(p.y),9)<.09){text(c,'▲',ox+p.x*s,oy+p.y*s,8,p.seed<.085?'#dbac76':'#345e52');}
    for(let r=0;r<REGIONS.length;r++){
      const tiles=REGION_TILES[r];if(r>unlockedRegion(g.save)){c.fillStyle='#20323dba';for(const [x,y] of tiles)c.fillRect(ox+x*REGION_W*s,oy+y*REGION_H*s,REGION_W*s,REGION_H*s);}
    }
    const route=g.guideRoute();
    if(route.length){
      c.save();c.lineJoin='round';c.lineCap='round';c.beginPath();
      route.forEach((p,i)=>i?c.lineTo(ox+p.x*s,oy+p.y*s):c.moveTo(ox+p.x*s,oy+p.y*s));
      c.strokeStyle='#173d68';c.lineWidth=5*markerScale;c.stroke();
      c.setLineDash([5*markerScale,5*markerScale]);c.strokeStyle='#d9ffe3';c.lineWidth=2.5*markerScale;c.stroke();c.setLineDash([]);
      for(let i=12;i<route.length;i+=24){const p=route[i],before=route[i-1];c.save();c.translate(ox+p.x*s,oy+p.y*s);c.rotate(Math.atan2(p.y-before.y,p.x-before.x));polygon(c,[[-3,-3],[2,0],[-3,3]],'#ffe28c','#173d68',1.2);c.restore();}
      const goal=route.at(-1);ring(c,ox+goal.x*s,oy+goal.y*s,10*markerScale,'#173d68',4*markerScale);ring(c,ox+goal.x*s,oy+goal.y*s,10*markerScale,'#ffe28c',2*markerScale);c.restore();
    }
    for(let r=0;r<REGIONS.length;r++){
      const tiles=REGION_TILES[r],x=tiles.reduce((sum,p)=>sum+p[0]+.5,0)/tiles.length*REGION_W,y=Math.min(...tiles.map(p=>p[1]))*REGION_H;
      c.save();c.font='800 10.5px system-ui';c.textAlign='center';c.lineJoin='round';c.lineWidth=1.8;
      c.strokeStyle=r>unlockedRegion(g.save)?'#20323ddd':'#dceccadd';c.fillStyle=r>unlockedRegion(g.save)?'#eff6ee':'#244f49';
      REGIONS[r].name.split(' ').forEach((word,i)=>{c.strokeText(word,ox+x*s,oy+y*s+12+i*11);c.fillText(word,ox+x*s,oy+y*s+12+i*11);});c.restore();
    }
    const returning=new Set(g.enemies.filter(e=>e.patrolSite&&e.hp>0).map(e=>e.patrolSite));
    for(const site of g.world.sites){if(site.r>unlockedRegion(g.save)||!returnVisible(g.save,site))continue;const done=g.save.cleared.includes(site.id),patrol=returning.has(site.id),x=ox+site.x*s,y=oy+site.y*s;ellipse(c,x,y,(patrol?5.2:3.8)*markerScale,(patrol?5.2:3.8)*markerScale,patrol?'#ed917b':done?'#d8f0b5':site.returnId?'#e8d3ff':'#ffdc7d');c.strokeStyle=site.returnId?'#8550c2':'#203b38';c.lineWidth=(site.returnId?2.5:1.5)*markerScale;c.stroke();if(patrol)for(const dx of [-1.7,1.7])ellipse(c,x+dx*markerScale,y-.7*markerScale,.8*markerScale,.8*markerScale,'#203b38');}
    for(let r=0;r<REGIONS.length;r++){
      if(r>unlockedRegion(g.save)){
        const o=regionOrigin(r),x=ox+(o.x+18)*s,y=oy+(o.y+23)*s;
        c.save();c.translate(x,y);c.scale(markerScale,markerScale);ellipse(c,0,2,30,27,'#102c385c');ellipse(c,0,0,27,27,'#476773');
        if(r===2){
          for(const [dx,dy,height] of [[-13,1,24],[0,-4,38],[13,3,24]]){
            c.beginPath();c.moveTo(dx-8,10);c.lineTo(dx-6,dy-height/2);c.lineTo(dx,dy-height);c.lineTo(dx+7,dy-height/2);c.lineTo(dx+6,10);c.closePath();c.fillStyle=dx===0?'#b5f3ef':'#69b8d4';c.fill();line(c,dx,dy-height,dx,8,'#ecffff',1.5);
          }
        }else if(r===3){
          rounded(c,-18,-15,36,34,4,'#aa8062','#e0b786',2);rounded(c,-13,-8,26,23,4,'#493b3c');rounded(c,8,-29,8,14,2,'#c3a58a');
          c.beginPath();c.moveTo(-9,11);c.quadraticCurveTo(-13,1,-3,-5);c.quadraticCurveTo(-3,2,3,1);c.lineTo(7,-10);c.quadraticCurveTo(19,12,7,13);c.closePath();c.fillStyle='#ffbd61';c.fill();line(c,-21,20,21,20,'#e8c998',3);
        }else if(r===4){
          rounded(c,-11,-18,22,37,4,'#8aa7bc','#c7dce1',2);rounded(c,-17,-22,34,9,3,'#b1c9ce');line(c,0,-23,0,-35,'#b4e7eb',2);ellipse(c,0,-36,4,4,'#f5dc85');bolt(c,0,0,24,'#ffe5a4');
          for(const side of [-1,1]){line(c,side*18,-14,side*24,-23,'#a3e7ea',2);line(c,side*20,-3,side*28,-6,'#a3e7ea',2);}
        }else if(r>=5){
          c.save();c.translate(0,13);c.scale(17,17);themeProp(c,{r,type:'landmark',seed:0},REGIONS[r],0);c.restore();
        }else{
          for(const side of [-1,1]){rounded(c,side*10-10,-17,20,27,4,'#c39372','#efd1a2',2);ellipse(c,side*10,-6,5,5,'#f6d17f');line(c,side*10-6,15,side*10+6,15,'#d5c7aa',4);}
        }
        text(c,'?',20,32,20,'#ffe5a4');c.restore();continue;
      }
      const p=relayFor(r),x=ox+p.x*s,y=oy+p.y*s;c.save();c.translate(x,y);c.scale(markerScale,markerScale);rounded(c,-5,-7,10,14,2,g.save.bosses.includes(r)?'#a7f4cd':'#ee9578','#34534b',1);text(c,g.save.bosses.includes(r)?'✓':'!',0,3,10,'#1b3c38');c.restore();
    }
    for(const st of g.world.stations)if(g.save.discovered.includes(st.id)){c.save();c.translate(ox+st.x*s,oy+st.y*s);c.scale(markerScale,markerScale);rounded(c,-5,-5,10,10,2,'#edffe3','#326f59',1);text(c,'+',0,4,12,'#327859');c.restore();}
    for(const mission of worldData.RETURNS||[]){if(!returnVisible(g.save,{returnId:mission.id}))continue;c.save();c.translate(ox+mission.x*s,oy+mission.y*s);c.scale(markerScale,markerScale);ring(c,0,0,13,'#e4c7ff',3);line(c,0,8,0,-14,'#fff0dd',2);polygon(c,[[0,-14],[14,-10],[0,-5]],'#9e6ace','#f3dfff',1.5);c.restore();}
    for(const shop of workshops())if(shop.r<=unlockedRegion(g.save)){c.save();c.translate(ox+shop.x*s,oy+shop.y*s);c.scale(markerScale,markerScale);workshopMarker(c,0,0);c.restore();}
    rounded(c,ox,oy,WORLD_W*s,WORLD_H*s,8,null,'#f6f7cb55',2);
    pantheonMarker(c,ox+PANTHEON.viewpoint.x*s,oy+PANTHEON.viewpoint.y*s,markerScale,pantheonUnlocked(g.save));
    const playerX=ox+g.player.x*s,playerY=oy+g.player.y*s;
    ellipse(c,playerX,playerY,18*markerScale,18*markerScale,'#f4fff8');ellipse(c,playerX,playerY,16*markerScale,16*markerScale,'#173d68');ellipse(c,playerX,playerY,12*markerScale,12*markerScale,'#65ef86');
  }
}
