function line(c,x,y,ex,ey,color,width){c.beginPath();c.moveTo(x,y);c.lineTo(ex,ey);c.strokeStyle=color;c.lineWidth=width;c.stroke();}
function ellipse(c,x,y,rx,ry,color){c.beginPath();c.ellipse(x,y,rx,ry,0,0,Math.PI*2);c.fillStyle=color;c.fill();}

export function dockArt(c,dock){
  c.save();c.translate(dock.shore.x,dock.shore.y);c.rotate(Math.atan2(dock.water.y-dock.shore.y,dock.water.x-dock.shore.x));
  for(let i=0;i<5;i++){c.beginPath();c.roundRect(-.25+i*.16,-.35,.14,.7,.025);c.fillStyle=i%2?'#ba966a':'#d0af80';c.fill();c.strokeStyle='#45665c';c.lineWidth=.025;c.stroke();}
  for(const y of [-.39,.39]){line(c,-.21,y,.43,y,'#6a6755',.06);ellipse(c,.43,y,.07,.07,'#f4d17c');ellipse(c,-.21,y,.07,.07,'#e1bf82');}
  c.restore();
}

export function boatArt(c,boat,t,{moving=false,occupied=false,passenger,reducedMotion=false}={}){
  if(reducedMotion)t=0;
  const bob=Math.sin(t*2.6+boat.x)*.025;
  c.save();c.translate(boat.x,boat.y+bob);
  ellipse(c,0,.16,.86,.46,'#173f5338');
  c.save();c.rotate(boat.angle||0);
  if(moving){
    for(let i=0;i<3;i++){const d=.85+i*.32+(t*1.8%1)*.16;c.beginPath();c.moveTo(-d,-.18-i*.11);c.quadraticCurveTo(-d-.3,0,-d,.18+i*.11);c.strokeStyle=['#e4fffa9c','#bff4f17c','#e5ffff44'][i];c.lineWidth=.045;c.stroke();}
    for(const side of [-1,1])line(c,-.68,side*.28,-1.8,side*.65,'#f0fff35c',.035);
  }else{
    c.beginPath();c.ellipse(0,.05,.94,.53,0,0,Math.PI*2);c.strokeStyle='#c5f3ec65';c.lineWidth=.025;c.stroke();
  }
  c.beginPath();c.moveTo(.98,0);c.quadraticCurveTo(.55,-.65,-.62,-.51);c.quadraticCurveTo(-.88,-.43,-.88,0);c.quadraticCurveTo(-.88,.43,-.62,.51);c.quadraticCurveTo(.55,.65,.98,0);c.closePath();
  const hull=c.createLinearGradient(0,-.55,0,.55);hull.addColorStop(0,'#79d8d3');hull.addColorStop(.5,'#2d8e9c');hull.addColorStop(1,'#20566c');c.fillStyle=hull;c.fill();c.strokeStyle='#173d50';c.lineWidth=.09;c.stroke();
  c.beginPath();c.moveTo(.77,0);c.quadraticCurveTo(.35,-.42,-.61,-.34);c.lineTo(-.66,.34);c.quadraticCurveTo(.35,.42,.77,0);c.closePath();c.fillStyle='#d4e7df';c.fill();c.strokeStyle='#ffdc7b';c.lineWidth=.055;c.stroke();
  for(const side of [-1,1]){line(c,-.6,side*.42,.25,side*.39,'#f4f9d1',.04);line(c,-.7,side*.22,-.92,side*.22,'#1c4a5a',.09);}
  c.beginPath();c.roundRect(-.53,-.25,.43,.5,.08);c.fillStyle='#264b5b';c.fill();c.strokeStyle='#94c0bf';c.lineWidth=.035;c.stroke();
  c.beginPath();c.moveTo(.35,-.29);c.quadraticCurveTo(.57,0,.35,.29);c.strokeStyle='#1e5266';c.lineWidth=.11;c.stroke();c.strokeStyle='#a8f4f2';c.lineWidth=.065;c.stroke();
  ellipse(c,.79,0,.055,.055,'#fff7b9');
  c.restore();
  if(occupied)passenger?.(c,0,-.14);
  else{
    const y=-.9+Math.sin(t*3)*.06;ellipse(c,0,y,.19,.19,'#173d58');
    line(c,0,y-.1,0,y+.075,'#ffe17b',.055);line(c,-.08,y,0,y+.085,'#ffe17b',.055);line(c,0,y+.085,.08,y,'#ffe17b',.055);
  }
  c.restore();
}
