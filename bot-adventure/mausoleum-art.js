// A stone rotunda shelters the Halloween royal court.
const STONE='#a5aaa0',EDGE='#46565b';
function oval(c,x,y,rx,ry,fill,stroke=EDGE,width=.08){c.beginPath();c.ellipse(x,y,rx,ry,0,0,Math.PI*2);c.fillStyle=fill;c.fill();if(stroke){c.strokeStyle=stroke;c.lineWidth=width;c.stroke();}}
function box(c,x,y,w,h,fill){c.fillStyle=fill;c.fillRect(x,y,w,h);}
function line(c,x,y,xx,yy,color,width=.06){c.beginPath();c.moveTo(x,y);c.lineTo(xx,yy);c.strokeStyle=color;c.lineWidth=width;c.stroke();}
export function mausoleum(c,t,state={}){
  c.save();c.translate(162.5,244.1);
  const open=state.phase==='sleeping'?0:Math.min(1,Math.max(0,state.opening??3)/2.5);
  oval(c,.5,.5,10.8,2.1,'#26383d44',null);
  // Broad concentric stone courses and a circular podium.
  for(let i=3;i>=0;i--){const rx=9.7+i*.35,y=.05+i*.32;box(c,-rx,y-1,rx*2,.95,['#c4c6b7','#8c9994','#b1b6a9','#717f80'][i]);oval(c,0,y-1,rx,2.1,['#c4c6b7','#8c9994','#b1b6a9','#717f80'][i]);}
  // The drum rises above the doorway, with shaded brickwork following the curve.
  const wall=c.createLinearGradient(-8,0,8,0);wall.addColorStop(0,'#717f7d');wall.addColorStop(.4,'#bfc1ad');wall.addColorStop(.7,STONE);wall.addColorStop(1,'#657575');
  box(c,-8,-13.6,16,12.5,wall);oval(c,0,-1.1,8,1.8,wall);
  for(let y=-12.6;y<-1.5;y+=.9){line(c,-7.8,y,7.8,y,'#687674',.055);for(let x=-7.3+(Math.round(y*10)%2?1.3:0);x<7.5;x+=2.6)line(c,x,y,x,y+.85,'#6f7c77',.045);}
  // Dark opening, two heavy sliding leaves and a clear central threshold.
  box(c,-2.6,-6.4,5.2,7,'#172c34');oval(c,0,-6.35,2.6,.8,'#172c34');
  c.save();c.beginPath();c.rect(-2.65,-7.3,5.3,7.9);c.clip();
  for(const side of [-1,1]){const x=side<0?-2.6-open*2.65:open*2.65;box(c,x,-6.5,2.6,7,'#798b80');for(let j=0;j<3;j++){box(c,x+.2,-5.9+j*1.9,2.2,1.5,'#536d68');line(c,x+.25,-5.85+j*1.9,x+2.35,-5.85+j*1.9,'#afba9f');}oval(c,x+(side<0?2.1:.5),-2.3,.13,.2,'#d8c183',null);}
  c.restore();
  if(open>0){box(c,-2.5,-.15,5,.35,'#bce2bc');c.globalAlpha=open*.22;oval(c,0,.7,3.6,.7,'#baffce',null);c.globalAlpha=1;}
  // Tall fluted columns, with stepped bases and ornate capitals.
  for(const x of [-7.3,-4.6,4.6,7.3]){
    const side=Math.abs(x)>6?.5:0;
    box(c,x-.73,-.4-side,1.46,.5,'#758781');oval(c,x,-.5-side,.75,.25,'#c3c6b1');
    box(c,x-.46,-12.2-side,.92,11.5,'#b7bdac');box(c,x+.22,-12.2-side,.24,11.5,'#8b9c91');
    for(const dx of [-.28,-.08,.13])line(c,x+dx,-11.8-side,x+dx,-1,'#e0debf',.055);
    box(c,x-.7,-12.5-side,1.4,.35,'#d0ceaf');
    for(const dx of [-.48,0,.48])oval(c,x+dx,-12.75-side,.25,.23,'#b3b9a3');
    box(c,x-.8,-13.1-side,1.6,.25,'#74877c');
  }
  // Curved cornice, dentils and a low circular crown echo the rotunda silhouette.
  for(const [y,rx,ry,color] of [[-13.4,9.1,2,'#747f76'],[-14,9.4,2.1,'#c4c2a8'],[-14.5,9.1,2,'#89988a'],[-15.1,8.7,2,'#c2c4ae']])oval(c,0,y,rx,ry,color);
  for(let i=0;i<15;i++){const a=Math.PI*i/14;box(c,Math.cos(a)*8.8-.18,-13.9+Math.sin(a)*1.65,.36,.45,'#586d66');}
  oval(c,0,-16.2,7.3,2,'#a5ae9c');oval(c,0,-16.6,6.4,1.4,'#bac0a9');
  // A neutral mechanical crest, vines and gentle green lanterns.
  for(const side of [-1,1]){line(c,side*.15,-16.2,side*1.7,-17.3,'#677e70',.3);line(c,side*1.7,-17.3,side*2.5,-16.5,'#677e70',.2);}
  oval(c,0,-16.8,.5,.7,'#536d65');oval(c,0,-16.9,.18,.2,'#c6edb4',null);
  for(const side of [-1,1]){const x=side*6.1;line(c,x,-7,x+.4,-3,'#4d7864',.12);for(let j=0;j<6;j++)oval(c,x+(j%2?.4:-.05),-6.8+j*.6,.2,.1,'#66896b',null);box(c,side*3.3-.3,-4.3,.6,.9,'#354e4e');oval(c,side*3.3,-3.9,.15,.3,'#c0efaf',null);}
  // A calm wisp at the entrance makes the opening visible without flashing.
  if(open>0&&state.phase!=='victory'){c.globalAlpha=.15;oval(c,Math.sin(t)*1.4,.4,2.4,.25,'#c7edcf',null);c.globalAlpha=1;}
  c.restore();
}
