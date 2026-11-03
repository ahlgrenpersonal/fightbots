import { WIDTH, HEIGHT, HOME, CAMPS, KING, ENCOUNTERS, BRIDGES, tileAt } from './world.js?v=roman21';
import { drawBot } from '../art.js?v=roman21';
import { normalizeSlot } from '../data.js?v=roman21';

const TAU=Math.PI*2;
const INK='#314b50';
const hash=(x,y)=>{let h=Math.imul(x+719,374761393)^Math.imul(y+953,668265263);h=Math.imul(h^(h>>>13),1274126177);return ((h^(h>>>16))>>>0)/4294967296;};
function oval(c,x,y,rx,ry,color){c.beginPath();c.ellipse(x,y,rx,ry,0,0,TAU);c.fillStyle=color;c.fill();}
function polygon(c,points,fill,stroke=INK,width=.045){c.beginPath();points.forEach(([x,y],i)=>i?c.lineTo(x,y):c.moveTo(x,y));c.closePath();c.fillStyle=fill;c.fill();if(stroke){c.strokeStyle=stroke;c.lineWidth=width;c.stroke();}}
function line(c,x,y,xx,yy,color,width=.04){c.beginPath();c.moveTo(x,y);c.lineTo(xx,yy);c.strokeStyle=color;c.lineWidth=width;c.stroke();}
function box(c,x,y,w,h,color,stroke=null){c.fillStyle=color;c.fillRect(x,y,w,h);if(stroke){c.strokeStyle=stroke;c.lineWidth=.045;c.strokeRect(x,y,w,h);}}
function visible(p,b,margin=5){return p.x+margin>=b.left&&p.x-margin<=b.right&&p.y+margin>=b.top&&p.y-margin<=b.bottom;}
function collection(value){return value instanceof Set?value:new Set(Array.isArray(value)?value:[]);}
function column(c,x,y,height=2.1){
  oval(c,x+.14,y+.15,.48,.19,'#314b5024');
  box(c,x-.32,y-.12,.64,.22,'#a4b8b7',INK);
  const g=c.createLinearGradient(x-.2,0,x+.2,0);g.addColorStop(0,'#f8fff5');g.addColorStop(.5,'#d8e5de');g.addColorStop(1,'#91b0b1');
  box(c,x-.21,y-height,.42,height-.1,g,INK);
  for(let i=0;i<3;i++)line(c,x-.13+i*.12,y-height+.14,x-.13+i*.12,y-.25,'#8eada9',.025);
  box(c,x-.34,y-height-.18,.68,.22,'#edf5e8',INK);
  oval(c,x-.28,y-height-.06,.075,.065,'#c5d6cf');oval(c,x+.28,y-height-.06,.075,.065,'#c5d6cf');
}
function banner(c,x,y,time,active=false){
  line(c,x,y,x,y-2.5,'#b79960',.075);oval(c,x,y-2.6,.11,.12,'#f8df94');
  const sway=Math.sin(time*1.8+x)*.09;
  polygon(c,[[x+.05,y-2.45],[x+.95,y-2.4+sway],[x+.9,y-1.25+sway],[x+.48,y-1.48],[x+.05,y-1.3]],active?'#268b80':'#ac435d','#e6bc66');
  oval(c,x+.48,y-1.94,.21,.25,'#f8df94');oval(c,x+.48,y-1.94,.13,.17,active?'#268b80':'#ac435d');
}
function tree(c,x,y,time,seed,north){
  c.save();c.translate(x+.5,y+.7);
  oval(c,.25,.12,.66,.24,'#183d4830');
  line(c,0,0,.015,-1.25,'#596353',.14);
  const sway=Math.sin(time*.7+seed*20)*.035;
  if(north){
    for(let i=0;i<3;i++){
      const yy=-.45-i*.47,w=.76-i*.16;
      polygon(c,[[-w,yy+.24],[sway,yy-1.02],[w,yy+.24]],['#28564f','#347162','#4e8b74'][i],'#244d48',.035);
      line(c,-w*.58,yy+.12,sway,yy-.65,'#81ac822f',.07);
      if(y<38)polygon(c,[[-w*.44,yy-.23],[sway,yy-1.02],[w*.44,yy-.23],[sway+.1,yy-.35],[sway-.11,yy-.29]],'#d5e9e2',null);
    }
  }else{
    oval(c,sway,-1.22,.79,.82,'#2e6652');oval(c,-.27+sway,-1.52,.57,.58,'#4c8c61');
    oval(c,.23+sway,-1.72,.5,.49,'#74a970');oval(c,-.38+sway,-1.7,.22,.25,'#a7c884');
  }
  c.restore();
}
function rounded(c,x,y,w,h,r,fill,stroke=INK){
  c.beginPath();c.roundRect(x,y,w,h,r);c.fillStyle=fill;c.fill();
  if(stroke){c.strokeStyle=stroke;c.lineWidth=.045;c.stroke();}
}
export function citizen(c,x,y,time,seed,activity='idle',size=1){
  c.save();c.translate(x,y);c.scale(size,size);
  const cloth=['#d57889','#3fb9bc','#699bd1','#b68ac5'][seed%4];
  const bob=Math.sin(time*1.3+seed)*.025;
  oval(c,.08,.08,.43,.14,'#314b5030');
  for(const side of [-1,1]){
    line(c,side*.17,-.3,side*.2,-.04,'#789ca1',.13);
    rounded(c,side*.2-.13,-.09,.29,.18,.055,'#d1e4dd');
    oval(c,side*.17,-.23,.075,.075,'#f7e5ab');
  }
  c.translate(0,bob);
  rounded(c,-.34,-.95,.68,.65,.13,cloth);
  polygon(c,[[-.23,-.94],[-.08,-.94],[.24,-.36],[.08,-.34]],'#fff1cb',null);
  rounded(c,-.34,-.42,.68,.12,.035,'#8d795c');
  oval(c,.05,-.36,.075,.07,'#f5d77f');
  for(const side of [-1,1]){
    const elbowY=activity==='basket'?-.62:-.58;
    const handX=activity==='basket'?side*.3:side*.48;
    const handY=activity==='wave'&&side===1?-1.2:activity==='basket'?-.54:-.38;
    line(c,side*.32,-.84,side*.47,elbowY,'#8eafb1',.12);
    line(c,side*.47,elbowY,handX,handY,'#cedfd7',.11);
    oval(c,side*.47,elbowY,.085,.085,'#f3d99a');
    oval(c,handX,handY,.095,.1,'#e9f2dd');
  }
  line(c,0,-1.39,0,-1.63,'#738e89',.045);
  oval(c,0,-1.65,.07,.07,'#ffd981');
  oval(c,-.37,-1.2,.095,.12,'#9ebdb9');oval(c,.37,-1.2,.095,.12,'#9ebdb9');
  rounded(c,-.35,-1.51,.7,.56,.18,'#e4eee2');
  rounded(c,-.28,-1.36,.56,.25,.08,'#31565d',null);
  for(const side of [-1,1]){
    oval(c,side*.14,-1.24,.075,.075,'#86fff1');
    oval(c,side*.14-.018,-1.26,.025,.027,'#fffbea');
  }
  c.beginPath();c.arc(0,-1.12,.1,.15,Math.PI-.15);c.strokeStyle='#417a79';c.lineWidth=.035;c.stroke();
  if(activity==='basket'){
    c.beginPath();c.ellipse(0,-.61,.31,.22,0,Math.PI,TAU);c.strokeStyle='#a28559';c.lineWidth=.06;c.stroke();
    for(let i=0;i<3;i++)oval(c,-.19+i*.19,-.6,.12,.12,['#e48476','#edcf6c','#84bb72'][i]);
    polygon(c,[[-.38,-.54],[.38,-.54],[.29,-.18],[-.29,-.18]],'#c69e67');
    for(let i=0;i<3;i++)line(c,-.25+i*.23,-.5,-.2+i*.19,-.22,'#f0d4a1',.035);
    line(c,-.33,-.36,.33,-.36,'#9f7c52',.035);
  }
  c.restore();
}
function flowers(c,x,y,time){
  oval(c,x,y+.15,.6,.24,'#314b5024');
  rounded(c,x-.52,y-.03,1.04,.35,.07,'#b77569');
  oval(c,x,y-.05,.52,.18,'#678f65');
  for(let i=0;i<5;i++){
    const xx=x-.4+i*.2,yy=y-.32-Math.sin(i*2)*.1;
    line(c,xx,y,xx+Math.sin(time*.8+i)*.025,yy,'#407858',.035);
    for(let j=0;j<5;j++){const a=j*TAU/5;oval(c,xx+Math.cos(a)*.075,yy+Math.sin(a)*.075,.06,.06,i%2?'#f4d270':'#e79bb8');}
    oval(c,xx,yy,.04,.04,'#fff4cc');
  }
}
function departureBanner(c,x,y,time){
  line(c,x,y,x,y-3.7,'#8c825e',.09);
  oval(c,x,y-3.8,.15,.16,'#ffdf84');
  const sway=Math.sin(time*1.3+x)*.08;
  polygon(c,[[x+.08,y-3.6],[x+1.05,y-3.55+sway],[x+1.05,y-1.6+sway],[x+.55,y-1.86],[x+.08,y-1.6]],'#f3cf71',INK,.045);
  polygon(c,[[x+.29,y-2.57],[x+.57,y-3],[x+.86,y-2.57],[x+.66,y-2.66],[x+.66,y-2.22],[x+.48,y-2.22],[x+.48,y-2.66]],'#398d83',null);
}
function home(c,time){
  c.save();c.translate(HOME.x,HOME.y);
  oval(c,0,2.4,5.8,3.8,'#a6bbae');
  oval(c,0,2.35,5.5,3.55,'#d5decb');
  for(let y=0;y<6;y++)for(let x=-4;x<=4;x++){
    if((x/5)**2+((y-2.5)/3.3)**2<1)line(c,x-.38,y,x+.38,y,'#b6c7b8',.025);
  }
  oval(c,0,.9,6.5,2,'#314b501b');
  // The portico sits beside the north lane, never across the departure route.
  c.save();c.translate(-5.2,-1.5);c.scale(.62,.62);
  box(c,-6,-5,12,3.2,'#aec5ba',INK);box(c,-5.8,-5,11.6,2.9,'#edf2da',INK);
  for(let i=-5;i<=5;i+=2)column(c,i,-1.8,2.5);
  polygon(c,[[-6.4,-4.7],[0,-7],[6.4,-4.7]],'#be6161',INK,.07);
  polygon(c,[[-5,-4.85],[0,-6.55],[5,-4.85]],'#e2a17a','#f1d8a0');
  oval(c,0,-5.3,.38,.4,'#d7b663');
  c.restore();
  c.beginPath();c.moveTo(0,1);c.lineTo(.9,-3.8);c.lineTo(0,-6);c.lineTo(3,-8);
  c.lineJoin='round';c.lineCap='round';
  c.strokeStyle='#a4b59a';c.lineWidth=3.1;c.stroke();
  c.strokeStyle='#eadcaf';c.lineWidth=2.8;c.stroke();
  for(const [x,y] of [[.4,-.9],[.8,-2.8],[.3,-5.2],[1.6,-7]]){
    polygon(c,[[x-.32,y+.22],[x,y-.1],[x+.32,y+.22],[x+.32,y+.04],[x,y-.29],[x-.32,y+.04]],'#bc9d56',null);
  }
  departureBanner(c,2.7,-.7,time);departureBanner(c,-1.8,-5.3,time);
  for(let side of [-1,1]){
    box(c,side*7-1,1,2,2.3,'#f0e9cf',INK);
    polygon(c,[[side*7-1.3,1],[side*7,0],[side*7+1.3,1]],'#bd655f');
    box(c,side*7-.28,2.05,.56,1.25,'#386b70',INK);
    banner(c,side*5,2.8,time,true);
  }
  oval(c,0,4.5,1.6,.72,'#91aba4');oval(c,0,4.35,1.48,.64,'#edf2d9');
  oval(c,0,4.31,1.21,.49,'#3a9dba');oval(c,0,4.25,.98,.35,'#7bdbd0');
  for(let i=0;i<3;i++){
    c.beginPath();c.ellipse(0,4.26, .38+i*.25+Math.sin(time*1.5+i)*.04,.1+i*.07,0,0,TAU);
    c.strokeStyle='#c4f2e0';c.lineWidth=.025;c.stroke();
  }
  column(c,0,4.2,1.2);
  oval(c,0,3,.47,.19,'#dbe9d5');oval(c,0,2.94,.36,.12,'#72c8c7');
  for(const side of [-1,1]){
    c.beginPath();c.moveTo(0,2.77);c.quadraticCurveTo(side*.75,2.2,side*.93,4.2);
    c.strokeStyle='#c2f4eb';c.lineWidth=.045;c.stroke();
    flowers(c,side*5.2,.7,time);flowers(c,side*4.8,4.9,time);
    rounded(c,side*3.7-.65,4.4,1.3,.3,.065,'#aa8c65');
    for(const xx of [-.48,.48])line(c,side*3.7+xx,4.65,side*3.7+xx,4.9,INK,.07);
  }
  citizen(c,-3,1.8,time,1,'basket');citizen(c,-4.1,2.1,time,2,'wave');
  citizen(c,3.3,2.8,time,0,'wave');citizen(c,4.2,3.1,time,2,'idle',.73);
  citizen(c,-2.6,5.4,time,3,'basket');
  c.restore();
}
function camp(c,camp,time,active){
  c.save();c.translate(camp.x,camp.y);
  oval(c,0,0,3.1,1.7,'#a4bd8440');
  for(let side of [-1,1]){
    polygon(c,[[side*2-1,-1.1],[side*2,-3],[side*2+1,-1.1]],active?'#67b5a0':'#d5be8b',INK);
    polygon(c,[[side*2,-3],[side*2+.25,-1.1],[side*2+1,-1.1]],active?'#378278':'#b49c75',INK);
    polygon(c,[[side*2-.3,-1.1],[side*2,-2],[side*2+.3,-1.1]],'#31575b',null);
    line(c,side*3,-.5,side*3,1,'#6c7b62',.1);
  }
  banner(c,-.5,-.6,time,active);
  oval(c,0,1.6,.6,.35,'#8a9c88');
  for(let i=0;i<6;i++){const a=i*TAU/6;oval(c,Math.cos(a)*.5,1.6+Math.sin(a)*.23,.14,.1,'#d0d8bd');}
  polygon(c,[[-.25,1.6],[.08,.85+Math.sin(time*4)*.08],[.12,1.29],[.3,1.08],[.27,1.65]],'#eaa45e',null);
  if(active){citizen(c,1.1,.6,time,4);oval(c,0,0,.28,.15,'#e8d480');}
  c.restore();
}
function citadel(c,time,conquered){
  c.save();c.translate(KING.x,KING.y);
  oval(c,0,.05,6.1,1.1,'#284b4930');
  // Sharpened timber wings, not the city's white marble colonnade.
  for(const side of [-1,1]){
    for(let i=0;i<4;i++){
      const x=side*(4.2+i*.52),y=-.35-i*.12;
      polygon(c,[[x-.24,y],[x-.24,y-1.65],[x,y-2.02],[x+.24,y-1.65],[x+.24,y]],i%2?'#665c50':'#796851',INK);
      line(c,x-.1,y-.25,x-.1,y-1.55,'#aa9573',.035);
      polygon(c,[[x-.24,y-1.65],[x,y-2.02],[x+.24,y-1.65],[x+.07,y-1.74],[x-.07,y-1.7]],'#d9e8df',null);
    }
    line(c,side*4,-.8,side*5.9,-1.2,'#413f38',.18);
  }
  box(c,-4,-3.6,8,3,'#655649',INK);
  for(let x=-3.8;x<4;x+=.48){
    box(c,x,-3.48,.42,2.77,Math.floor((x+3.8)/.48)%2?'#7d6a54':'#88755a',INK);
    line(c,x+.13,-3.1,x+.13,-1,'#b19a6d',.025);
  }
  for(const x of [-3.9,-1.35,1.35,3.9]){
    box(c,x-.15,-3.65,.3,3.1,'#3e4640',INK);
    for(const y of [-3.1,-.9])oval(c,x,y,.075,.075,'#c3a972');
  }
  for(const side of [-1,1]){
    line(c,side*1.5,-3.2,side*3.75,-.8,'#454a40',.17);
    line(c,side*1.5,-.8,side*3.75,-3.2,'#454a40',.17);
    rounded(c,side*2.65-.38,-2.7,.76,.62,.08,'#c18d64');
    box(c,side*2.65-.28,-2.6,.56,.43,conquered?'#7bd5bc':'#e6b06d');
    line(c,side*2.65,-2.65,side*2.65,-2.13,'#514e40',.065);
  }
  rounded(c,-1.08,-2.75,2.16,2.1,.16,'#293f3f');
  for(const side of [-1,1]){
    box(c,side<0?-1.02:.06,-2.65,.96,1.95,'#4b5448',INK);
    line(c,side*.92,-2.4,side*.17,-.85,'#917a55',.09);
    oval(c,side*.18,-1.55,.075,.075,'#dfbf72');
  }
  box(c,-4.15,-.68,8.3,.25,'#a28b66',INK);
  box(c,-1.6,-.4,3.2,.28,'#7d7560',INK);
  line(c,-4,-.69,4,-.69,'#d8e9df',.09);
  polygon(c,[[-5.12,-3.2],[-4.65,-4.12],[-3.5,-5.5],[3.5,-5.5],[4.65,-4.12],[5.12,-3.2]],'#83556a',INK,.09);
  for(let row=0;row<4;row++){
    const y=-5.15+row*.49,w=3.77+row*.32;
    line(c,-w,y,w,y,'#b78879',.05);
    for(let x=-w+.25;x<w;x+=.62)line(c,x,y-.29,x+.13,y,'#a27177',.035);
  }
  line(c,-3.6,-5.5,3.6,-5.5,'#c39567',.18);
  line(c,-3.5,-5.59,3.5,-5.59,'#e0eee7',.08);
  for(const side of [-1,1]){
    polygon(c,[[side*3.4,-5.45],[side*4,-5.65],[side*4.22,-6.08],[side*4.18,-5.25],[side*3.6,-5.2]],'#c59e66',INK);
  }
  polygon(c,[[-5.12,-3.2],[-4.93,-3.56],[-3.6,-3.39],[-2.6,-3.52],[-1.4,-3.34],[0,-3.5],[1.5,-3.35],[2.8,-3.51],[4.9,-3.56],[5.12,-3.2]],'#d5e8e1',null);
  // An antlered robot face and crown identify the woodland clan's hall.
  for(const side of [-1,1]){
    line(c,side*.34,-4.5,side*.96,-4.98,'#efd087',.11);
    line(c,side*.96,-4.98,side*1.16,-5.5,'#efd087',.1);
    line(c,side*.86,-4.91,side*1.36,-5.05,'#efd087',.09);
    line(c,side*.65,-4.75,side*.66,-5.13,'#efd087',.09);
  }
  rounded(c,-.5,-4.65,1,1.02,.2,'#d1af67');
  rounded(c,-.37,-4.4,.74,.35,.08,'#394e49');
  for(const side of [-1,1])oval(c,side*.2,-4.23,.085,.085,conquered?'#8aefe0':'#f7d487');
  line(c,-.17,-3.85,.17,-3.85,'#5a654e',.05);
  polygon(c,[[-.56,-4.74],[-.68,-5.16],[-.25,-4.98],[0,-5.42],[.25,-4.98],[.68,-5.16],[.56,-4.74]],'#f4d084',INK);
  for(const side of [-1,1]){
    const x=side*5.25,y=1.1,flicker=Math.sin(time*5+side)*.12;
    oval(c,x,y,.88,.45,'#eabb7430');
    for(let i=0;i<5;i++){const a=i*TAU/5;oval(c,x+Math.cos(a)*.48,y+Math.sin(a)*.2,.18,.13,'#829c98');}
    line(c,x-.33,y+.05,x+.28,y-.13,'#6c5f49',.12);
    line(c,x-.28,y-.16,x+.33,y+.03,'#6c5f49',.12);
    polygon(c,[[x-.35,y],[x-.45,y-.47],[x-.16,y-.34],[x-.08,y-1.15-flicker],[x+.16,y-.65],[x+.38,y-.87],[x+.32,y-.2],[x+.16,y+.06]],'#e9a364',null);
    polygon(c,[[x-.18,y],[x-.06,y-.63-flicker],[x+.12,y-.35],[x+.2,y-.48],[x+.15,y+.04]],'#ffe3a0',null);
    oval(c,x+.15*Math.sin(time+side),y-1.4-(time*.4%1)*.3,.035,.055,'#f8d48a');
  }
  banner(c,-3.65,.35,time,conquered);banner(c,3.65,.35,time,conquered);
  if(conquered){citizen(c,-2.2,1.2,time,1,'wave',.8);citizen(c,2.2,1.2,time,2,'wave',.8);}
  c.restore();
}

function bridge(c,b){
  const {left,top,right,bottom}=b;
  box(c,left,top,right-left,bottom-top,'#577c76');
  for(let x=left;x<right;x+=.5){
    box(c,x+.025,top+.12,.45,bottom-top-.24,Math.floor(x*2)%3?'#d4bc8b':'#c4a87e',INK);
    line(c,x+.1,top+.55,x+.1,bottom-.55,'#ead5a0',.025);
  }
  for(const y of [top+.08,bottom-.08]){
    line(c,left,y-.35,right,y-.35,'#7c7060',.085);
    for(let x=left+.2;x<right;x+=1.4){
      box(c,x-.07,y-.5,.14,.64,'#8c8069',INK);
      oval(c,x,y-.5,.12,.07,'#eddaa3');
    }
  }
}

// Caller owns the world transform. bounds and every primitive are in cells;
// save/restore ensures rendering never changes the caller's transform or styles.
export function drawLandscape(c,{bounds={left:0,top:0,right:WIDTH,bottom:HEIGHT},time=0,state={}}={}){
  const b={left:Math.max(0,bounds.left),top:Math.max(0,bounds.top),right:Math.min(WIDTH,bounds.right),bottom:Math.min(HEIGHT,bounds.bottom)};
  if(b.left>=b.right||b.top>=b.bottom)return;
  const camps=collection(state.camps),completed=collection(state.completed);
  c.save();
  const ground=c.createLinearGradient(0,0,0,HEIGHT);
  ground.addColorStop(0,'#78a69a');ground.addColorStop(.48,'#8db780');ground.addColorStop(1,'#c1cf8b');
  c.fillStyle=ground;c.fillRect(b.left,b.top,b.right-b.left,b.bottom-b.top);
  for(let y=Math.floor(b.top);y<Math.ceil(b.bottom);y++)for(let x=Math.floor(b.left);x<Math.ceil(b.right);x++){
    const tile=tileAt(x,y),n=hash(x,y);
    if(tile==='forest'){box(c,x,y,1,1,y<54?'#548779':'#679760');}
    else if(tile==='path'){
      box(c,x,y,1,1,n>.5?'#d4d5a6':'#cbd0a0');
      if(n>.6){line(c,x+.16,y+.28,x+.45,y+.24,'#adb88b',.025);line(c,x+.6,y+.76,x+.79,y+.79,'#edf0c8',.035);}
    }else if(tile==='stone'){
      box(c,x,y,1,1,n>.45?'#d3dfcb':'#c5d5c1');
      line(c,x,y+.98,x+1,y+.98,'#9cb4aa',.035);line(c,x+.02,y,x+.02,y+1,'#9cb4aa',.035);
      line(c,x+.08,y+.08,x+.85,y+.08,'#f3f4da',.025);
    }else if(tile==='water'){
      box(c,x,y,1,1,'#368fa1');
      const shore=[[0,-1],[0,1],[-1,0],[1,0]].some(([dx,dy])=>tileAt(x+dx,y+dy)!=='water');
      if(shore){box(c,x,y,1,1,'#6ab7b3');oval(c,x+.5,y+.5,.36,.32,'#4c9fa8');}
      if(n>.45){const drift=Math.sin(time*.8+n*10)*.1;line(c,x+.18+drift,y+.45,x+.7+drift,y+.45,'#abe0cc',.035);}
    }else if(n>.65){
      line(c,x+.3,y+.76,x+.34,y+.59,'#5f965e',.025);line(c,x+.34,y+.72,x+.45,y+.64,'#6e9e65',.025);
      if(n>.93){oval(c,x+.61,y+.38,.045,.05,y<55?'#cbdde4':'#f4e2a1');oval(c,x+.7,y+.47,.04,.045,'#f2efca');}
    }
  }
  for(const b of BRIDGES){
    if(b.right>=bounds.left&&b.left<=bounds.right&&b.bottom>=bounds.top&&b.top-1<=bounds.bottom)bridge(c,b);
  }
  // Forest canopy is rooted only in blocking cells, keeping combat glades clear.
  for(let y=Math.max(0,Math.floor(b.top)-1);y<Math.min(HEIGHT,Math.ceil(b.bottom)+3);y++)for(let x=Math.max(0,Math.floor(b.left)-1);x<Math.min(WIDTH,Math.ceil(b.right)+1);x++){
    const n=hash(x,y);
    if(tileAt(x,y)==='forest'&&n>.39) tree(c,x,y,time,n,y<62||n>.82);
    else if(tileAt(x,y)==='water'&&n>.82&&tileAt(x-1,y)!=='water'){
      for(let i=0;i<3;i++){line(c,x+.1+i*.15,y+.8,x+.1+i*.15,y+.2-i*.08,'#467c65',.035);oval(c,x+.1+i*.15,y+.17-i*.08,.045,.12,'#d1bd82');}
    }
  }
  // Quiet wayfinding: completed sites become small gold laurels, not UI labels.
  for(const site of ENCOUNTERS){
    if(!visible(site,b,state.conquered?3:1)||site.kind==='boss')continue;
    if(state.conquered){
      c.save();c.translate(site.x+1.2,site.y+.4);c.scale(.7,.7);banner(c,0,0,time,true);c.restore();
      citizen(c,site.x-.5,site.y+.3,time,site.stage,'wave',.75);
      if(site.kind==='elite')citizen(c,site.x+.4,site.y+.9,time,site.stage+1,'wave',.65);
    }
    if(completed.has(site.id)||state.conquered){
      oval(c,site.x,site.y,.27,.16,'#759a7438');
      for(const side of [-1,1])for(let i=0;i<3;i++)oval(c,site.x+side*(.1+i*.05),site.y-.07-i*.1,.08,.04,'#d9c77d');
    }else{
      oval(c,site.x,site.y,.38,.2,'#314b5020');
      line(c,site.x-.22,site.y,site.x+.22,site.y,'#927f65',.07);
      line(c,site.x,site.y-.22,site.x,site.y+.22,'#927f65',.07);
    }
  }
  if(visible(HOME,b,11))home(c,time);
  for(const site of CAMPS)if(visible(site,b,5))camp(c,site,time,camps.has(site.id));
  if(visible(KING,b,8)){
    citadel(c,time,!!state.conquered);
    // Three visible seal sockets show exactly the simulation's gate requirement.
    if(camps.size<CAMPS.length)for(let i=0;i<CAMPS.length;i++)oval(c,KING.x+(i-1)*.7,KING.y+2.5,.24,.25,camps.has(CAMPS[i].id)?'#f3d479':'#547571');
  }
  c.restore();
}

export function drawAtlas(c,width,height,state={},player){
  if(!(width>0&&height>0))return;
  c.save();box(c,0,0,width,height,'#203e43');
  const scale=Math.min((width-12)/WIDTH,(height-12)/HEIGHT);
  if(scale<=0){c.restore();return;}
  c.translate((width-WIDTH*scale)/2,(height-HEIGHT*scale)/2);c.scale(scale,scale);
  const colors={forest:'#3c6a5b',grass:'#a3bd80',path:'#dbd8a6',stone:'#dce5d3',water:'#4bafbe'};
  for(let y=0;y<HEIGHT;y++)for(let x=0;x<WIDTH;x++)box(c,x,y,1.03,1.03,colors[tileAt(x,y)]);
  const completed=collection(state.completed),camps=collection(state.camps);
  for(const site of ENCOUNTERS){
    if(state.conquered)oval(c,site.x,site.y,.65,.65,site.kind==='boss'?'#f1db8e':'#51b2a1');
    else if(!completed.has(site.id))oval(c,site.x,site.y,.85,.85,site.kind==='boss'?'#963e66':'#b45f68');
  }
  for(const site of [HOME,...CAMPS]){
    oval(c,site.x,site.y,1.75,1.75,INK);
    oval(c,site.x,site.y,1.25,1.25,site===HOME||camps.has(site.id)?'#f1db8e':'#e4e9dc');
  }
  if(player&&Number.isFinite(player.x)&&Number.isFinite(player.y)){
    // Keep the equipped miniature legible independently of atlas zoom or aspect.
    c.save();c.translate(player.x,player.y);c.scale(1/scale,1/scale);
    oval(c,0,0,17,17,INK);oval(c,0,0,15,15,'#ffe29a');oval(c,0,0,12,12,'#e6eee0');
    const build=normalizeSlot(player.weapon?player:state.squad?.[0]);
    drawBot(c,{...build,x:0,y:2,team:0,captain:!!player.captain,angle:-.35,hp:1,maxHp:1,
      weaponTier:state.weaponTier??player.weaponTier??0,armorTier:state.armorTier??player.armorTier??0},0,{size:22,preview:true});
    c.restore();
  }
  c.restore();
}
