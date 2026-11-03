import {citizen} from './scenery.js?v=roman19';
const TAU=Math.PI*2,INK='#314b50';
export const ARENA_ENTRY={x:33,y:142};
function line(c,x,y,xx,yy,color,width=.07){c.beginPath();c.moveTo(x,y);c.lineTo(xx,yy);c.strokeStyle=color;c.lineWidth=width;c.stroke();}
function oval(c,x,y,rx,ry,color){c.beginPath();c.ellipse(x,y,rx,ry,0,0,TAU);c.fillStyle=color;c.fill();}
function box(c,x,y,w,h,color){c.fillStyle=color;c.fillRect(x,y,w,h);}
function heart(c,x,y,size,color='#ed819b'){
  c.save();c.translate(x,y);c.scale(size,size);c.beginPath();c.moveTo(0,.6);c.bezierCurveTo(-1.6,-.35,-.7,-1.4,0,-.65);c.bezierCurveTo(.7,-1.4,1.6,-.35,0,.6);c.fillStyle=color;c.fill();c.strokeStyle='#894961';c.lineWidth=.12;c.stroke();c.restore();
}
export function drawCity(c,time,state){
  c.save();
  const ready=state.prologueRound>=15;
  box(c,0,146,52,2,'#469fa9');box(c,48,130,4,18,'#469fa9');
  for(let i=0;i<10;i++)line(c,48.2+(i%2),132+i*1.4,50.4+(i%2),132+i*1.4,'#9edbd2',.05);
  {
    for(let x=3;x<49;x++){
      if(x>=24&&x<32)continue;
      box(c,x,129.9,1,1.75,'#93a9a5');box(c,x+.04,129.95,.92,.7,'#e0e6d5');box(c,x,129.6,.6,.5,'#dae3d4');
      line(c,x,130.7,x+1,130.7,'#6d8886',.04);
    }
    for(const x of [23.5,32]){box(c,x,129.2,.8,2.6,'#c7d5c4');box(c,x-.15,129,1.1,.3,'#f0eacd');}
    if(!ready){box(c,24.3,130.2,7.7,1.4,'#586c69');
      for(let x=24.5;x<32;x+=.45)line(c,x,130.2,x,131.5,'#b6a36b',.12);
      oval(c,28.1,130.8,.3,.3,'#f6d57c');}
    for(let y=131;y<146;y++){box(c,3,y,.8,1,'#aebfb3');line(c,3,y,3.8,y,'#6d8886',.04);}
  }
  // The elliptical stands frame the training floor without hiding the fighters.
  oval(c,39,140,8,6,'#294f4d33');oval(c,39,139.5,7.9,5.8,'#879f9d');oval(c,39,139.3,7.5,5.4,'#d8dfcf');
  for(const r of [1,.91,.82]){c.beginPath();c.ellipse(39,139.3,7.35*r,5.25*r,0,Math.PI,TAU);c.strokeStyle=r===1?'#eff1d9':'#8fa7a0';c.lineWidth=.18;c.stroke();}
  oval(c,39,140,6.5,4.7,'#d7c797');oval(c,39,140,6.1,4.3,'#e6d8ad');
  for(let i=0;i<21;i++){
    const a=Math.PI+i*Math.PI/20,x=39+Math.cos(a)*7.6,y=139.3+Math.sin(a)*5.4;
    box(c,x-.18,y-.4,.36,.8,'#f1efda');box(c,x-.27,y-.5,.54,.15,'#c3cdb9');
    if(i%3===0){oval(c,x,y-.13,.12,.13,['#e7a4a4','#74bdb3','#f0cf70'][i%3]);}
  }
  for(const x of [32.5,45.5]){line(c,x,143,x,140.5,'#8c7954',.1);box(c,x+.08,140.6,.7,1.2,'#b95564');oval(c,x+.42,141.1,.18,.22,'#f1d382');}
  // A broad entrance and gold footprints make the arena easy to find.
  box(c,31,141.5,3.3,2,'#e8d7a5');
  for(let i=0;i<3;i++){oval(c,30.5+i*.8,142.3,.13,.2,'#b39753');}
  oval(c,39,139.9,1.2,.7,'#c2b27533');
  for(const side of [-1,1])for(let i=0;i<5;i++){
    const a=side*(.35+i*.2)-Math.PI/2;oval(c,39+Math.cos(a)*1.1,140+Math.sin(a)*.6,.17,.08,'#c2a55c');
  }
  if(ready)for(let i=0;i<5;i++){const p=(time*.3+i*.2)%1;heart(c,31.5+i*.5,141-p*2,.15,'#ef94a4');}
  c.restore();
}
export function drawHeroWelcome(c,leader,time,hugRemaining=0){
  if(!leader||leader.y<131)return;
  c.save();
  for(const [x,y]of [[23,139.8],[21.9,140.1],[29.3,140.8],[30.2,141.1],[23.4,143.4]]){
    if(Math.hypot(leader.x-x,leader.y-y)>10)continue;
    const p=(time*.5+x)%1;heart(c,x,y-1.8-p*.6,.21*(1-p*.3));
  }
  if(hugRemaining>0){
    const elapsed=9-hugRemaining,x=leader.x+Math.max(.52,3-elapsed*.8),y=leader.y+.05;
    citizen(c,x,y,time,0,'idle',.85);heart(c,x,y-1.7,.28);
    for(const sy of [-.5,-.1]){line(c,x-.25,y+sy,x-.5,y+sy-.08,'#759d9f',.12);line(c,x-.5,y+sy-.08,x-(elapsed>3?.95:.65),y+sy+.04,'#dde9df',.11);}
    if(elapsed>3)heart(c,leader.x,leader.y-1.8,.35,'#f3a3ad');
  }
  c.restore();
}
