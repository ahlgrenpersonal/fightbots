import {drawQuestAtlas} from './quest-art.js?v=roman35';
import * as world from './east-world.js?v=roman35';
import {drawBot} from '../art.js?v=roman35';
import {normalizeSlot} from '../data.js?v=roman35';
import {drawVoyage as seaVoyage} from './south-scenery.js?v=roman35';
const {WIDTH,HEIGHT,HOME,KING,CAMPS,ENCOUNTERS,LANDSCAPES,LANDMARKS,tileAt,passable}=world;
const TAU=Math.PI*2,INK='#315364',GOLD='#f6d474';
const hash=(x,y)=>{let n=Math.imul(x+831,374761393)^Math.imul(y+117,668265263);n=Math.imul(n^(n>>>13),1274126177);return((n^(n>>>16))>>>0)/4294967296;};
const zone=y=>Math.max(0,LANDSCAPES.findIndex(r=>y>=r.top&&y<r.bottom));
const palettes=[
  ['#9cc6b5','#e8e9dc','#f5f3e5','#5eafa9'],
  ['#9bb777','#e2dfba','#e9e8d5','#7e9e8a'],
  ['#b5c3ba','#e7e6de','#f1efe4','#8d9aa8'],
  ['#b5cabe','#e5eae7','#fbf5e7','#78a8b8'],
  ['#b8bdcf','#e4e2e6','#fff1da','#858ca8']
];
const rect=(c,x,y,w,h,fill)=>{c.fillStyle=fill;c.fillRect(x,y,w,h);};
const oval=(c,x,y,rx,ry,fill)=>{c.fillStyle=fill;c.beginPath();c.ellipse(x,y,rx,ry,0,0,TAU);c.fill();};
function poly(c,p,fill,stroke=null,width=.04){c.beginPath();p.forEach(([x,y],i)=>i?c.lineTo(x,y):c.moveTo(x,y));c.closePath();c.fillStyle=fill;c.fill();if(stroke){c.strokeStyle=stroke;c.lineWidth=width;c.stroke();}}
function line(c,x,y,xx,yy,color,width=.04){c.beginPath();c.moveTo(x,y);c.lineTo(xx,yy);c.strokeStyle=color;c.lineWidth=width;c.stroke();}
const visible=(p,b,m=8)=>p.x+m>=b.left&&p.x-m<=b.right&&p.y+m>=b.top&&p.y-m<=b.bottom;
const done=(s,id)=>(s.completed||[]).includes(id);
function clipTiles(c,b,predicate){c.beginPath();for(let y=Math.max(0,Math.floor(b.top));y<Math.min(HEIGHT,Math.ceil(b.bottom));y++)for(let x=Math.max(0,Math.floor(b.left));x<Math.min(WIDTH,Math.ceil(b.right));x++)if(predicate(x,y))c.rect(x,y,1,1);c.clip();}
function blockedFootprint(x,y,w,h){for(let yy=Math.floor(y);yy<Math.ceil(y+h);yy++)for(let xx=Math.floor(x);xx<Math.ceil(x+w);xx++)if(tileAt(xx,yy)!=='forest')return false;return true;}
function column(c,x,y,h,w=.45){
  rect(c,x-w*.8,y-.12,w*1.6,.2,'#9eafb2');rect(c,x-w*.6,y-h,w*1.2,h,'#e2e5dc');
  rect(c,x-w*.5,y-h,w*.35,h,'#fff8e4');rect(c,x+w*.23,y-h,w*.3,h,'#adc2c5');
  for(let i=0;i<3;i++)line(c,x-w*.3+i*w*.28,y-.2,x-w*.3+i*w*.28,y-h+.25,'#bdccc5',.025);
  rect(c,x-w*.8,y-h-.16,w*1.6,.24,'#f9f1dc');rect(c,x-w*.7,y-h+.12,w*1.4,.13,'#4c98b6');
}
function temple(c,p,royal=false){
  const b=p.footprint,w=b.right-b.left,h=b.bottom-b.top;
  c.save();c.translate(b.left,b.top);c.scale(w/12,h/5);
  rect(c,.2,1.5,11.6,3.4,'#6b8c9c');rect(c,.4,1.65,11.2,3.1,'#c0cecc');rect(c,.7,1.85,10.6,2.65,'#78959f');
  rect(c,4.9,2.55,2.2,2.1,'#315e79');rect(c,5.1,2.7,1.8,1.95,'#8e8f79');
  for(const x of [5.3,5.8,6.3,6.8])line(c,x,2.85,x,4.5,'#d7c38b',.09);
  for(let i=0;i<6;i++){const x=1+i*2;rect(c,x-.4,2.4,.8,2.1,'#3e6b89');column(c,x,4.65,2.8,.42);}
  rect(c,0,1.15,12,.4,'#faf4df');rect(c,.15,1.5,11.7,.23,'#478bad');
  for(let i=0;i<18;i++){const x=.3+i*.64;line(c,x,1.48,x+.16,1.65,GOLD,.05);}
  poly(c,[[-.1,1.15],[6,.05],[12.1,1.15]],'#fff5dd',INK,.05);
  poly(c,[[1.2,.98],[6,.26],[10.8,.98]],royal?'#646b9f':'#438dad');
  oval(c,6,.69,.38,.27,GOLD);poly(c,[[5.8,.66],[6,.38],[6.2,.66],[6,.92]],'#fff5c1');
  for(let i=0;i<3;i++)rect(c,-.1+i*.08,4.52+i*.15,12.2-i*.16,.14,i%2?'#b9c9c6':'#f6f1de');
  c.restore();
}
function mosaic(c,x,y,r,royal=false){
  c.save();c.beginPath();c.ellipse(x,y,r,r*.7,0,0,TAU);c.clip();
  oval(c,x,y,r,r*.7,'#f1eee0');
  for(let i=0;i<28;i++){const a=i/28*TAU,xx=x+Math.cos(a)*r*.9,yy=y+Math.sin(a)*r*.63;poly(c,[[xx,yy],[xx+.15,yy+.1],[xx,yy+.2],[xx-.15,yy+.1]],royal?'#ad8c54':'#5096ac');}
  for(const k of [.72,.4]){c.beginPath();c.ellipse(x,y,r*k,r*k*.7,0,0,TAU);c.strokeStyle=k===.72?'#4996a8':GOLD;c.lineWidth=.08;c.stroke();}
  for(let i=0;i<8;i++){const a=i/8*TAU;poly(c,[[x,y],[x+Math.cos(a-.13)*r*.5,y+Math.sin(a-.13)*r*.35],[x+Math.cos(a)*r*.62,y+Math.sin(a)*r*.43],[x+Math.cos(a+.13)*r*.5,y+Math.sin(a+.13)*r*.35]],royal?'#9781b8':'#68aaa6');}
  c.restore();
}
function olive(c,x,y,s,n){
  oval(c,x,y+.6*s,.7*s,.22*s,'#355a5930');line(c,x,y+.65*s,x-.13*s,y-.35*s,'#7e8870',.18*s);
  line(c,x,y+.18*s,x+.4*s,y-.4*s,'#7e8870',.1*s);
  for(let i=0;i<6;i++){const a=i*2.4,xx=x+Math.cos(a)*.38*s,yy=y-.4*s+Math.sin(a)*.3*s;oval(c,xx,yy,.45*s,.3*s,['#5e8f7b','#93b59a','#bad0ab'][i%3]);line(c,xx-.2*s,yy,xx+.18*s,yy-.09*s,'#d1dfb9',.035*s);}
  for(let i=0;i<4;i++)oval(c,x+(hash(n,i)-.5)*s,y-.6*s+hash(i,n)*.4*s,.04*s,.06*s,'#5d556e');
}
function cypress(c,x,y,s){
  oval(c,x,y+.6*s,.4*s,.15*s,'#31576630');line(c,x,y+.65*s,x,y-.5*s,'#858c76',.12*s);
  poly(c,[[x,y-1.65*s],[x-.37*s,y-.65*s],[x-.43*s,y+.16*s],[x,y+.42*s],[x+.4*s,y+.15*s],[x+.28*s,y-.8*s]],'#366d69',INK,.025);
  poly(c,[[x,y-1.65*s],[x-.2*s,y-.4*s],[x,y+.25*s],[x+.14*s,y-.5*s]],'#729b7b');
}
function ridge(c,x,y,w,h,n){
  oval(c,x+w*.5,y+h*.85,w*.49,h*.17,'#39496430');
  const crest=[[x,y+h*.4],[x+w*.15,y+h*.1],[x+w*.37,y+h*.23],[x+w*.62,y],[x+w*.86,y+h*.17],[x+w,y+h*.45]];
  poly(c,[...crest,[x+w*.94,y+h],[x+w*.4,y+h*.87],[x+w*.08,y+h]],'#7b91a8',INK,.035);
  poly(c,[...crest,[x+w*.65,y+h*.45],[x+w*.34,y+h*.5],[x+w*.1,y+h*.7]],n%2?'#e2e6e3':'#cdd9dd');
  poly(c,[[x+w*.62,y],[x+w*.65,y+h*.45],[x+w*.8,y+h*.88],[x+w*.72,y+h*.32]],'#a6bac7');
  for(let i=0;i<3;i++)line(c,x+w*.13,y+h*(.67+i*.09),x+w*.44,y+h*(.55+i*.09),'#a9bec7',.04);
}
function flag(c,x,y,time,peace=false){
  line(c,x,y,x,y-1.65,'#a78d5c',.07);oval(c,x,y-1.7,.09,.09,GOLD);
  const sway=Math.sin(time*2+x)*.07;
  poly(c,[[x+.04,y-1.6],[x+.74,y-1.52+sway],[x+.6,y-.95],[x+.03,y-1.05]],peace?'#3aab8d':'#9e5b86',GOLD,.035);
  poly(c,[[x+.26,y-1.4],[x+.42,y-1.2],[x+.28,y-1.04],[x+.15,y-1.21]],'#f8db8e');
}
function harborBoat(c,time){
  c.save();c.translate(30,180);c.rotate(Math.sin(time*1.4)*.015);
  oval(c,0,.3,2.2,.7,'#216e8944');
  for(const side of [-1,1])for(let i=0;i<4;i++)line(c,-1.3+i*.8,side*.25,-1.6+i*.8,side*(1+Math.sin(time*3+i)*.08),'#ddc38b',.045);
  poly(c,[[-2.5,-.3],[-1.8,.55],[1.5,.55],[2.6,-.55],[1.8,-.2],[-1.8,-.25]],'#826e5b',INK,.05);
  poly(c,[[-2.1,-.25],[-1.5,.24],[1.55,.24],[2.15,-.47]],'#ecd6a4');
  line(c,-.2,0,-.2,-2,'#ab8c5c',.06);line(c,-1.4,-1.65,1.2,-1.65,'#bca574',.05);
  poly(c,[[-1.35,-1.6],[1.15,-1.6],[1.35,-.65],[-1.2,-.7]],'#fff1d3',INK,.025);
  poly(c,[[-.4,-1.4],[.1,-1.4],[.32,-.8],[-.3,-.8]],'#4f94b2');
  c.restore();
}
function camp(c,p,state,time){
  c.save();c.translate(p.x,p.y);mosaic(c,0,0,2.3);
  if(p.id==='home'){
    // Workshop remains a ground-level floor, not an opaque building over units.
    rect(c,-2.1,-2.5,4.2,.45,'#d5dcd0');rect(c,-1.9,-2.56,3.8,.16,'#fff3da');
    for(const x of [-1.65,1.65])column(c,x,-2.1,1.9,.3);
    rect(c,-1.9,-4.2,3.8,.2,'#f6f2dc');poly(c,[[-2,-4.2],[0,-4.9],[2,-4.2]],'#4e8fb0',GOLD,.05);
  }else{
    poly(c,[[-1.55,-1.35],[0,-2.8],[1.55,-1.35],[1.1,-.55],[-1.1,-.55]],'#f6f0da',INK,.06);
    poly(c,[[0,-2.8],[.95,-.55],[.15,-.65]],'#78aaa8');poly(c,[[-.5,-.6],[0,-1.7],[.5,-.6]],'#365f67');
    line(c,-1.55,-1.35,-1.9,-.35,'#c6b585',.035);line(c,1.55,-1.35,1.9,-.35,'#c6b585',.035);
  }
  flag(c,2.5,-.7,time,p.id==='home'||(state.camps||[]).includes(p.id));
  rect(c,-2.5,.6,.8,.7,'#6eb8a5');rect(c,-2.18,.7,.14,.42,'#f2f9df');rect(c,-2.32,.84,.42,.14,'#f2f9df');
  const required=p.required||[],n=required.filter(id=>done(state,id)).length;
  for(let i=0;i<required.length;i++){const a=-Math.PI/2+i/required.length*TAU;oval(c,Math.cos(a)*2.8,Math.sin(a)*2.8,.1,.1,i<n?GOLD:'#587f8b');}
  c.restore();
}
function ground(c,b,time){
  for(let y=Math.max(0,Math.floor(b.top));y<Math.min(HEIGHT,Math.ceil(b.bottom));y++)for(let x=Math.max(0,Math.floor(b.left));x<Math.min(WIDTH,Math.ceil(b.right));x++){
    const tile=tileAt(x,y),z=zone(y),p=palettes[z],n=hash(x,y);
    rect(c,x,y,1.01,1.01,tile==='water'?'#398eac':tile==='stone'?p[2]:tile==='path'?p[1]:tile==='forest'?p[3]:p[0]);
    if(tile==='water'){
      if(n>.48)line(c,x+.12,y+.4+Math.sin(time*1.3+x)*.06,x+.65,y+.4+Math.sin(time*1.3+x)*.06,'#a7e7e165',.035);
      for(const[dx,dy]of [[-1,0],[1,0],[0,-1],[0,1]])if(passable(x+dx,y+dy)){const xx=x+(dx===1?.95:dx===-1?.05:0),yy=y+(dy===1?.95:dy===-1?.05:0);line(c,xx,yy,xx+(dx?0:1),yy+(dy?0:1),'#b8e9da',.08);}
    }else if(tile==='path'||tile==='stone'){
      line(c,x,y,x+1,y,'#537c831b',.025);line(c,x+(y%2)*.5,y,x+(y%2)*.5,y+1,'#537c831b',.025);
      if(n>.8)line(c,x+.18,y+.3,x+.55,y+.28,'#ffffff55',.025);
    }else if(tile==='grass'&&n>.5){line(c,x+.3,y+.7,x+.36,y+.57,'#456f6138',.03);line(c,x+.36,y+.57,x+.44,y+.65,'#456f6138',.03);if(z===1&&n>.85){oval(c,x+.65,y+.3,.05,.04,'#dec8ec');oval(c,x+.72,y+.34,.04,.04,'#fff0dc');}if(z===2&&n>.7){oval(c,x+.55,y+.55,.13,.07,'#7c919367');line(c,x+.46,y+.52,x+.62,y+.5,'#eef1de',.03);}}
  }
}
function blockedGround(c,b){
  for(let y=Math.max(0,Math.floor(b.top));y<Math.min(HEIGHT,Math.ceil(b.bottom));y++)for(let x=Math.max(0,Math.floor(b.left));x<Math.min(WIDTH,Math.ceil(b.right));x++){
    if(tileAt(x,y)!=='forest')continue;
    const z=zone(y),n=hash(x,y);
    if(z===0||z===1){
      // A low continuous hedge makes even narrow blocked strips unmistakable.
      rect(c,x,y+.22,1.01,.79,z===0?'#477f75':'#617f59');
      const leaf=z===0?(n>.5?'#79a88b':'#71a18a'):(n>.5?'#92ac76':'#85a174');
      oval(c,x+.3,y+.33,.3,.23+n*.045,leaf);oval(c,x+.7,y+.32,.3,.24-n*.025,leaf);
      line(c,x+.19,y+.25,x+.45,y+.21,'#d1dfaf66',.04);
    }else{
      poly(c,[[x+.03,y+.25],[x+.18,y+.08],[x+.76,y+.07],[x+.97,y+.28],[x+.94,y+.94],[x+.04,y+.9]],z===3?'#96aeb4':'#8091a5',INK,.025);
      poly(c,[[x+.03,y+.25],[x+.18,y+.08],[x+.76,y+.07],[x+.97,y+.28],[x+.77,y+.48],[x+.18,y+.43]],z===3?'#dbe4dc':n>.5?'#c9d5db':'#b1c2ca');
      line(c,x+.08,y+.7,x+.85,y+.72,z===3?'#6d8d9e':'#647f98',.03);
    }
  }
}
const features=[];
for(let y=2;y<HEIGHT-3;y+=2)for(let x=2;x<WIDTH-3;x+=2){
  if(!blockedFootprint(x,y,2,2)||LANDMARKS.some(p=>Math.abs(p.x-x)<12&&Math.abs(p.y-y)<7))continue;
  features.push({x,y,n:Math.floor(hash(x,y)*1000),z:zone(y)});
}
export function drawLandscape(c,{bounds={left:0,top:0,right:WIDTH,bottom:HEIGHT},time=0,state={}}={}){
  const b={left:Math.max(0,bounds.left),top:Math.max(0,bounds.top),right:Math.min(WIDTH,bounds.right),bottom:Math.min(HEIGHT,bounds.bottom)};
  c.save();c.beginPath();c.rect(b.left,b.top,b.right-b.left,b.bottom-b.top);c.clip();c.lineJoin='round';c.lineCap='round';ground(c,b,time);blockedGround(c,b);
  for(const bridge of world.BRIDGES){for(let y=bridge.top;y<bridge.bottom;y+=.4){rect(c,bridge.left,y,bridge.right-bridge.left,.25,'#e4e5d4');for(const x of [bridge.left+.2,bridge.right-.3])rect(c,x,y,.12,.22,'#73a3af');}}
  for(const p of [HOME,...CAMPS])if(visible(p,b))camp(c,p,state,time);
  if(visible(HOME,b,15))harborBoat(c,time);
  if(visible(KING,b,12)){
    mosaic(c,KING.x,KING.y,4.2,true);
    for(const x of [35.5,48.5]){flag(c,x,10,time,state.conquered);column(c,x,9,2.4,.55);}
    for(let i=0;i<4;i++){const y=15+i*.35;line(c,39,y,45,y,'#b5b9bd',.12);line(c,39,y+.12,45,y+.12,'#fbf2da',.1);}
  }
  // Large silhouettes fit only blocked terrain. They cannot obscure a passable
  // road even at their projected crowns, important for touch navigation.
  c.save();clipTiles(c,b,(x,y)=>tileAt(x,y)==='forest');
  for(const p of features){if(!visible(p,b,3))continue;const x=p.x+1,y=p.y+1;
    if(p.z===2||p.z===4){const w=1.35+hash(p.n,2)*.6,h=1.3+hash(p.n,3)*.65;ridge(c,p.x+(2-w)*hash(p.n,4),p.y+(2-h)*hash(p.n,5),w,h,p.n);}
    else if(p.z===3){if(p.n%3===0){rect(c,p.x+.15,p.y+.1,1.7,1.8,'#e5e8dd');rect(c,p.x+.3,p.y+.2,1.4,.5,'#5094b2');for(let i=0;i<3;i++)column(c,p.x+.4+i*.6,p.y+1.7,1,.18);}else cypress(c,x,y,.65);}
    else if(p.z===1||p.n%3)olive(c,x,y,.9,p.n);else cypress(c,x,y,.7);
  }
  for(const p of LANDMARKS)if(visible(p,b,14))temple(c,p,p.kind==='temple');
  c.restore();
  for(const e of ENCOUNTERS){if(!visible(e,b)||e.kind==='boss'||done(state,e.id))continue;
    const n=e.waves;for(let i=0;i<n;i++){const x=e.x+(i-(n-1)/2)*.65;line(c,x,e.y+.6,x,e.y-.3,'#9c855e',.06);poly(c,[[x,e.y-.3],[x+.4,e.y-.22],[x+.32,e.y+.12],[x,e.y+.05]],e.kind==='elite'?'#c69863':'#a06587',INK,.025);}
  }
  c.restore();
}
function atlasView(state,player){
  const active=CAMPS.findIndex(p=>!(state.camps||[]).includes(p.id));
  const seen=Math.max(active<0?4:active,...CAMPS.map((p,i)=>(state.refuges||[]).includes(p.id)?i:0),player?zone(player.y):0);
  const focus=player?zone(player.y):active<0?4:active;
  return {top:state.atlasOverview?LANDSCAPES[seen].top:LANDSCAPES[focus].top,bottom:state.atlasOverview?HEIGHT:LANDSCAPES[focus].bottom,active:active<0?4:active};
}
export function atlasAspect(state={},player){const v=atlasView(state,player);return WIDTH/(v.bottom-v.top);}
export function drawAtlas(c,w,h,state={},player){
  const v=atlasView(state,player),s=Math.min((w-24)/WIDTH,(h-24)/(v.bottom-v.top));
  rect(c,0,0,w,h,'#244d5b');c.save();c.translate((w-WIDTH*s)/2,(h-(v.bottom-v.top)*s)/2);c.scale(s,s);c.translate(0,-v.top);
  for(let y=v.top;y<v.bottom;y++)for(let x=0;x<WIDTH;x++){const t=tileAt(x,y),p=palettes[zone(y)];rect(c,x,y,1.02,1.02,t==='water'?'#4c9fb6':t==='forest'?p[3]:t==='path'?p[1]:t==='stone'?p[2]:p[0]);}
  if(!state.conquered){const p=LANDSCAPES[v.active];if(p.top<v.bottom&&p.bottom>v.top){rect(c,0,p.top,WIDTH,p.bottom-p.top,'#ffe39b28');for(const x of [.5,WIDTH-.5])line(c,x,p.top,x,p.bottom,GOLD,1.5/s);}}
  for(const e of ENCOUNTERS){if(e.y<v.top||e.y>=v.bottom)continue;oval(c,e.x,e.y,4/s,4/s,INK);oval(c,e.x,e.y,2.8/s,2.8/s,done(state,e.id)?'#92d9be':e.kind==='boss'?'#eab66d':'#f4d68a');}
  for(const p of [HOME,...CAMPS])if(p.y>=v.top&&p.y<v.bottom){
    c.save();c.translate(p.x,p.y);c.scale(1/s,1/s);
    const active=CAMPS[v.active]?.id===p.id&&!state.conquered,cleared=(state.camps||[]).includes(p.id);
    if(active)oval(c,0,0,12,12,GOLD);oval(c,0,0,9,9,INK);
    if(p.id==='home'){poly(c,[[-7,-1],[0,-7],[7,-1]],'#f6d474');rect(c,-5,0,10,6,'#f5f1df');rect(c,-2,1,4,5,'#3eab97');}
    else{poly(c,[[-6,4],[0,-6],[6,4]],cleared?'#85dfb1':'#fff3d6');if(cleared){line(c,-3,0,-1,2,INK,1.4);line(c,-1,2,3,-3,INK,1.4);}}
    c.restore();
  }
  drawQuestAtlas(c,{quest:state.returnQuest,completed:state.completed,target:state.returnQuestTarget,scale:s,top:v.top,bottom:v.bottom});
  if(player&&player.y>=v.top&&player.y<v.bottom){c.save();c.translate(player.x,player.y);c.scale(1/s,1/s);oval(c,0,0,18,18,INK);oval(c,0,0,16,16,GOLD);oval(c,0,0,13,13,'#e3f1df');drawBot(c,{...normalizeSlot(player),team:0,captain:true,x:0,y:4,angle:-.35,hp:1,maxHp:1,weaponTier:state.weaponTier,armorTier:state.armorTier},0,{size:24,preview:true});c.restore();}
  c.restore();
}
export function drawRomanDock(c,time=0,ready=false){
  c.save();c.translate(46,133);rect(c,-1.1,-1.1,2.2,2.2,'#d9e2d2');
  for(let i=0;i<5;i++){rect(c,-1+i*.4,-1, .32,2,'#f4edcf');}
  flag(c,-1,-1,time,ready);
  c.translate(3.5,0);c.rotate(Math.sin(time)*.02);
  oval(c,0,.8,1.5,2,'#1f779444');
  poly(c,[[0,-2],[-1,-1.3],[-1,.9],[0,2],[1,.9],[1,-1.3]],'#a27b54',INK,.07);
  poly(c,[[0,-1.7],[-.7,-1.1],[-.7,.8],[0,1.6],[.7,.8],[.7,-1.1]],'#ebd9a3');
  line(c,0,0,0,-2.4,'#a18b61',.07);poly(c,[[.03,-2.35],[.9,-1.1],[.03,-1.3]],'#fff2d8',GOLD,.03);
  for(const side of [-1,1])for(let i=0;i<3;i++)line(c,side*.75,-.7+i*.7,side*1.6,-.4+i*.7+Math.sin(time*3+i)*.08,'#cdb781',.07);
  c.restore();
}
export function drawVoyage(c,w,h,options){
  seaVoyage(c,w,h,options);
  // A low, distant marble acropolis is a destination cue, not a UI overlay.
  const p=Math.max(0,Math.min(1,options.progress||0)),s=Math.min(w/380,h/400);
  c.save();c.translate(w*(1.5-p*.95),h*.32);c.scale(s,s);
  poly(c,[[-55,20],[-35,-8],[0,-19],[34,-4],[60,20]],'#8297b0');
  rect(c,-23,-37,46,25,'#dce9e3');for(let i=0;i<5;i++)column(c,-19+i*9,-11,22,3);
  poly(c,[[-28,-38],[0,-53],[28,-38]],'#fff2d6',INK,1);line(c,-28,-36,28,-36,'#4b8ca9',2);c.restore();
}
