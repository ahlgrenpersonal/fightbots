import {citizen} from './scenery.js?v=roman35';
import {ATLAS_SIGN} from './world.js?v=roman35';
export {ATLAS_SIGN};
const TAU=Math.PI*2,INK='#314b50';
// Import compatibility only; no arena or entrance artwork remains.
export const ARENA_ENTRY=Object.freeze({x:33,y:142});
const NEIGHBORS=[
  // Keep families west or well south of the late harbor quest's border front.
  [34,138.7,1,'basket',1,'woman'],[43.6,142,2,'wave',1,'man'],
  [35.2,139.1,0,'wave',.64,'child'],[44.6,143,3,'idle',.66,'child'],
  [36,143.7,3,'idle',1,'woman'],[42.1,144,1,'basket',1,'man'],
  [40.8,144.4,2,'wave',.62,'child']
];
const HOME_NEIGHBORS=[[23,139.8,1],[21.9,140.1,1],[29.3,140.8,1],[30.2,141.1,.73],[23.4,143.4,1]];
function line(c,x,y,xx,yy,color,width=.07){c.beginPath();c.moveTo(x,y);c.lineTo(xx,yy);c.strokeStyle=color;c.lineWidth=width;c.stroke();}
function oval(c,x,y,rx,ry,color){c.beginPath();c.ellipse(x,y,rx,ry,0,0,TAU);c.fillStyle=color;c.fill();}
function box(c,x,y,w,h,color){c.fillStyle=color;c.fillRect(x,y,w,h);}
function poly(c,points,color,stroke=INK,width=.06){
  c.beginPath();points.forEach(([x,y],i)=>i?c.lineTo(x,y):c.moveTo(x,y));c.closePath();c.fillStyle=color;c.fill();
  if(stroke){c.strokeStyle=stroke;c.lineWidth=width;c.stroke();}
}
function heart(c,x,y,size){
  c.save();c.translate(x,y);c.scale(size,size);c.beginPath();c.moveTo(0,.6);c.bezierCurveTo(-1.6,-.35,-.7,-1.4,0,-.65);c.bezierCurveTo(.7,-1.4,1.6,-.35,0,.6);c.fillStyle='#ed819b';c.fill();c.strokeStyle='#894961';c.lineWidth=.12;c.stroke();c.restore();
}
function column(c,x,y,h=2){
  oval(c,x+.2,y+.1,.42,.17,'#314b5028');
  box(c,x-.33,y-.13,.66,.23,'#a5bcb4');box(c,x-.22,y-h,.44,h-.12,'#edf4df');
  box(c,x+.12,y-h,.1,h-.12,'#a7c1bb');
  for(const dx of [-.12,0,.1])line(c,x+dx,y-h+.18,x+dx,y-.23,'#b8ccc1',.025);
  box(c,x-.35,y-h-.16,.7,.23,'#fcf7dc');
  line(c,x-.36,y-h+.07,x+.36,y-h+.07,'#789b96',.045);
  oval(c,x-.27,y-h+.04,.09,.07,'#ceddcc');oval(c,x+.27,y-h+.04,.09,.07,'#ceddcc');
}
function planting(c,x,y,time){
  oval(c,x+.1,y+.15,.9,.35,'#314b5022');oval(c,x,y,.88,.34,'#dbe3ca');oval(c,x,y-.07,.73,.26,'#548663');
  for(let i=0;i<7;i++){
    const xx=x-.6+i*.2,yy=y-.26-(i%3)*.11;
    line(c,xx,y,xx+Math.sin(time+i)*.025,yy,'#376f57',.04);
    for(let j=0;j<5;j++){const a=j*TAU/5;oval(c,xx+Math.cos(a)*.09,yy+Math.sin(a)*.08,.065,.06,i%2?'#ef91b0':'#ffe193');}
    oval(c,xx,yy,.04,.04,'#fffae1');
  }
}
function olive(c,x,y){
  oval(c,x+.15,y+.1,.85,.32,'#314b5028');box(c,x-.64,y-.25,1.28,.4,'#c58170');oval(c,x,y-.26,.64,.22,'#ecbc95');
  line(c,x,y-.3,x,y-1.7,'#7d8060',.16);
  for(const side of [-1,1])line(c,x,y-1.2,x+side*.38,y-1.85,'#7d8060',.09);
  oval(c,x,y-1.9,.88,.72,'#508675');oval(c,x-.28,y-2.15,.63,.51,'#7daa83');oval(c,x+.35,y-2.05,.5,.48,'#a3c495');
  for(let i=0;i<9;i++)oval(c,x+Math.sin(i*2)*.65,y-1.85+Math.cos(i*3)*.4,.1,.035,'#c6d7a0');
}
function fountain(c,time){
  oval(c,39.2,141.4,2.45,1.12,'#314b5027');oval(c,39,141,2.4,1.18,'#8faaa3');oval(c,39,140.85,2.32,1.12,'#f4eed2');
  oval(c,39,140.85,2.02,.87,'#2e9caf');oval(c,39,140.8,1.84,.72,'#6fd5ce');
  for(let i=0;i<4;i++){
    c.beginPath();c.ellipse(39,140.8,.5+i*.36+Math.sin(time*2+i)*.06,.18+i*.14,0,0,TAU);c.strokeStyle='#c3f5df';c.lineWidth=.035;c.stroke();
  }
  column(c,39,140.7,1.75);oval(c,39,138.88,.7,.26,'#e5eed8');oval(c,39,138.83,.56,.18,'#51b9c3');
  for(const side of [-1,1]){
    c.beginPath();c.moveTo(39,138.75);c.quadraticCurveTo(39+side*1.3,137.9,39+side*1.48,140.65);c.strokeStyle='#e1fff1';c.lineWidth=.055;c.stroke();
    const p=(time*.7+(side+1)*.2)%1;oval(c,39+side*(.2+p*1.22),138.5+2.1*p*p,.045,.09,'#f1fff5');
  }
  oval(c,39,138.6,.1,.28,'#c3f8ed');
}
function townsfolk(c,time){
  for(const [x,y,seed,activity,size,kind] of NEIGHBORS){
    if(kind==='woman'){
      poly(c,[[x-.24,y-.91],[x+.24,y-.91],[x+.43,y-.13],[x-.43,y-.13]],seed===1?'#3fb9bc':'#b68ac5');
      line(c,x-.26,y-.18,x+.26,y-.18,'#f8e6b3',.055);
    }
    citizen(c,x,y,time,seed,activity,size);
    if(kind==='woman'){
      oval(c,x-.35,y-1.37,.12,.18,'#d6ad65');oval(c,x+.35,y-1.37,.12,.18,'#d6ad65');line(c,x-.24,y-1.49,x+.24,y-1.49,'#edca7f',.07);
    }
  }
}
function temple(c,x,y,s,roof='#c2666c'){
  c.save();c.translate(x,y);c.scale(s,s);
  box(c,-3.5,.1,7,.55,'#799d96');box(c,-3.2,-.22,6.4,.5,'#f5f0d6');box(c,-2.8,-3,5.6,2.7,'#adcbc0');
  for(const xx of [-2.4,-.8,.8,2.4])column(c,xx,-.3,2.5);
  poly(c,[[-3.6,-3.05],[0,-5],[3.6,-3.05]],roof,INK,.1);poly(c,[[-2.7,-3.25],[0,-4.65],[2.7,-3.25]],'#efd8a2',null);
  oval(c,0,-3.65,.32,.32,'#cf9f61');c.restore();
}
function pine(c,x,y,s=1){
  line(c,x,y,x,y-2.6*s,'#678569',.22*s);
  for(let i=0;i<3;i++)poly(c,[[x-(1-i*.2)*s,y-i*.75*s],[x,y-(2+i*.75)*s],[x+(1-i*.2)*s,y-i*.75*s]],['#367b66','#4d9974','#82b38a'][i],INK,.06*s);
}
function ship(c,x,y,s=1){
  c.save();c.translate(x,y);c.scale(s,s);oval(c,0,.55,2.6,.45,'#ceeee0');
  poly(c,[[-2.5,-.3],[2.5,-.3],[1.6,.6],[-1.5,.6]],'#b97668');line(c,0,-3.5,0,-.3,'#6d7964',.16);
  poly(c,[[-.2,-3.3],[-.2,-.6],[-2,-.6]],'#fff6d8');poly(c,[[.2,-3.3],[2,-1],[.2,-1]],'#f1ce83');c.restore();
}
// Shared text-free cartography. These directions are not navigation targets.
function worldPicture(c){
  box(c,0,0,100,72,'#4baebe');
  for(let y=4;y<72;y+=6)for(let x=3;x<100;x+=9){line(c,x,y,x+3,y,'#94d7d4',.25);line(c,x+1,y+.8,x+4,y+.8,'#77c9ce',.16);}
  const mainland=[[3,19],[9,13],[20,16],[27,9],[39,5],[53,3],[63,10],[62,20],[67,27],[61,36],[66,42],[59,47],[49,44],[42,48],[32,43],[21,39],[13,34],[4,35]];
  poly(c,mainland,'#e4dfb0','#e9f4ce',1.5);poly(c,mainland,'#91b681','#538e7d',.35);
  poly(c,[[32,31],[44,26],[58,29],[60,39],[49,44],[39,41]],'#c9d392',null);
  // North forest and west highlands.
  for(let row=0;row<3;row++)for(let i=0;i<7;i++)pine(c,33+i*3.7+(row%2),12+row*4,1.2);
  for(const [x,y,s] of [[10,27,1.2],[18,26,1.5],[25,31,1.15],[8,32,.9]]){
    poly(c,[[x-4*s,y+3*s],[x,y-6*s],[x+4*s,y+3*s]],'#839b9c',INK,.25);
    poly(c,[[x-1.8*s,y-2*s],[x,y-6*s],[x+1.8*s,y-2*s],[x+.5*s,y-2.7*s],[x-.5*s,y-1.8*s]],'#eff7e8',null);
  }
  // Rome: red roofs, an aqueduct and a turquoise civic fountain.
  for(let i=0;i<5;i++){
    box(c,35+i*2.2,31,1.9,3.2,'#dce8cf');c.beginPath();c.arc(35.95+i*2.2,34.2,.6,Math.PI,TAU);c.fillStyle='#91b681';c.fill();
  }
  line(c,34.8,30.8,46,30.8,'#f7f4d8',.5);temple(c,49,36,1.45);temple(c,39,38,.65);
  oval(c,49,40.8,3.1,1.25,'#f7f0c9');oval(c,49,40.8,2.3,.8,'#3cb4c0');line(c,49,40.6,49,39.2,'#edf8dd',.45);oval(c,49,39.2,.9,.28,'#e5f5da');
  for(const [x,y] of [[32,36],[59,35],[58,41]]){oval(c,x,y,1.2,1.1,'#4b936d');oval(c,x-.3,y-.4,.7,.6,'#b0cf87');}
  // Carthage sits across southern water, with a circular harbor and palms.
  poly(c,[[22,60],[29,54],[40,53],[49,57],[57,61],[61,71],[19,71]],'#eee0a6','#f7edc8',1);
  oval(c,39,63,5.5,3.9,'#bd8d72');oval(c,39,63,4.5,3,'#e9e3be');oval(c,39,63,3.5,2.3,'#3babc1');box(c,38.2,64,1.6,4,'#4baebe');temple(c,48,62,.95,'#b87588');
  for(const x of [27,31]){
    line(c,x,64,x+.3,59,'#8f9065',.3);
    for(const side of [-1,1])for(let i=0;i<3;i++)line(c,x+.3,59,x+side*(1.8-i*.35),58+i*.65,'#4c9d7f',.38);
  }
  // Greece is an eastern island chain with blue-roofed marble temples.
  for(const [x,y,rx,ry] of [[82,31,10,6],[88,44,7,4],[75,48,4,2],[92,20,3,2],[69,55,2,1.3]]){oval(c,x,y,rx,ry,'#eee5b2');oval(c,x,y-.2,rx*.85,ry*.78,'#9fbc8d');}
  temple(c,82,31,1.55,'#598fb6');temple(c,89,44,.65,'#598fb6');ship(c,67,40,.8);ship(c,49,50,.7);ship(c,77,61,.6);
  poly(c,[[88,5],[90,10],[88,15],[86,10]],'#f9edba',INK,.2);poly(c,[[83,10],[88,8],[93,10],[88,12]],'#e4f3db',INK,.2);poly(c,[[88,5],[88,10],[86,10]],'#bb7277',null);
}
export function drawWorldBoard(c,w,h){
  if(!Number.isFinite(w)||!Number.isFinite(h)||w<=0||h<=0)return;
  c.save();box(c,0,0,w,h,'#244f59');
  const scale=Math.min(w/104,h/76);c.translate((w-100*scale)/2,(h-72*scale)/2);c.scale(scale,scale);
  box(c,-1.5,-1.5,103,75,'#edcf8c');worldPicture(c);c.restore();
}
function atlasSign(c){
  const {x,y}=ATLAS_SIGN;oval(c,x+.15,y+1.8,2,.4,'#314b502c');
  for(const dx of [-1.4,1.4]){box(c,x+dx-.13,y+.8,.26,1,'#658f8d');box(c,x+dx-.27,y+1.65,.54,.18,'#e4eacf');}
  box(c,x-2.04,y-1.64,4.08,3.1,'#365e64');box(c,x-1.96,y-1.57,3.92,2.94,'#f7d786');
  c.save();c.translate(x-1.82,y-1.44);c.scale(.0364,.0364);worldPicture(c);c.restore();
  for(const dx of [-1.9,1.9])oval(c,x+dx,y-.1,.075,.075,'#fff6c4');
}
export function drawCity(c,time=0,state={}){
  c.save();box(c,0,146,52,2,'#469fa9');box(c,48,130,4,18,'#469fa9');
  for(let i=0;i<10;i++)line(c,48.2+(i%2),132+i*1.4,50.4+(i%2),132+i*1.4,'#9edbd2',.05);
  for(let x=3;x<49;x++){
    if(x>=24&&x<32)continue;
    box(c,x,129.9,1,1.75,'#93a9a5');box(c,x+.04,129.95,.92,.7,'#e0e6d5');box(c,x,129.6,.6,.5,'#dae3d4');line(c,x,130.7,x+1,130.7,'#6d8886',.04);
  }
  for(const x of [23.5,32]){box(c,x,129.2,.8,2.6,'#c7d5c4');box(c,x-.15,129,1.1,.3,'#f0eacd');}
  for(let y=131;y<146;y++){box(c,3,y,.8,1,'#aebfb3');line(c,3,y,3.8,y,'#6d8886',.04);}
  // Open rectangular civic garden, with no prologue-dependent artwork.
  box(c,31,134,16,11.7,'#97b79a');box(c,31.3,134.3,15.4,11.1,'#e2e7cd');box(c,31.65,134.65,14.7,10.4,'#ccd9bb');
  for(let row=0;row<10;row++)for(let col=0;col<14;col++)box(c,32+col,135+row,.94,.94,(row+col)%2?'#e7ead2':'#dce3c9');
  for(const y of [135.3,144.8])line(c,32,y,46,y,'#aabf9b',.14);
  for(const x of [33,36,39,42,45])column(c,x,136.6,1.9);
  box(c,32.55,134.4,12.9,.23,'#a7c0b3');box(c,32.4,134.2,13.2,.22,'#faf4d8');
  for(const [x,y] of [[33,138.5],[45,138.5],[33,144],[45,144]])olive(c,x,y);
  for(const [x,y] of [[35.4,137.4],[42.6,137.4],[34.1,142.4],[44,142.4]])planting(c,x,y,time);
  for(const x of [35,43]){
    for(const dx of [-.6,.6])line(c,x+dx,141.6,x+dx,142,INK,.09);
    box(c,x-.85,141.3,1.7,.3,'#bc8e77');line(c,x-.85,141.28,x+.85,141.28,'#f3d5a6',.07);
  }
  fountain(c,time);townsfolk(c,time);atlasSign(c);c.restore();
}
export function drawHeroWelcome(c,leader,time,hugRemaining=0){
  if(!leader||!Number.isFinite(leader.x)||!Number.isFinite(leader.y)||leader.y<131)return;
  c.save();
  const people=[...NEIGHBORS.map(([x,y,,,size])=>[x,y,size]),...HOME_NEIGHBORS];
  for(const [x,y,size] of people){
    if(Math.hypot(leader.x-x,leader.y-y)>4)continue;
    const p=(time*.45+x*.31)%1;c.globalAlpha=.65*(1-p);heart(c,x,y-1.85*size-p*.45,.16*size);
  }
  c.globalAlpha=1;
  if(hugRemaining>0){
    const elapsed=Math.max(0,9-hugRemaining),x=leader.x+Math.max(.65,2-elapsed*.5),y=leader.y+.05;
    citizen(c,x,y,time,0,'wave',.85);heart(c,x,y-1.7,.2);
  }
  c.restore();
}
