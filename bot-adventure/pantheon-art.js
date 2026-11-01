import {PANTHEON,COURT,COLUMNS} from './pantheon.js?v=world72';
const INK='#304955',GOLD='#e4bf67',LIGHT='#fff1bd';
function shape(c,points,fill,stroke=INK,width=.045){c.beginPath();points.forEach(([x,y],i)=>i?c.lineTo(x,y):c.moveTo(x,y));c.closePath();c.fillStyle=fill;c.fill();if(stroke){c.strokeStyle=stroke;c.lineWidth=width;c.stroke();}}
function oval(c,x,y,rx,ry,fill,stroke=null,width=.04){c.beginPath();c.ellipse(x,y,rx,ry,0,0,Math.PI*2);c.fillStyle=fill;c.fill();if(stroke){c.strokeStyle=stroke;c.lineWidth=width;c.stroke();}}
function line(c,x,y,x2,y2,color,width=.04){c.beginPath();c.moveTo(x,y);c.lineTo(x2,y2);c.strokeStyle=color;c.lineWidth=width;c.stroke();}
function box(c,x,y,w,h,fill,stroke=INK,width=.04){c.fillStyle=fill;c.fillRect(x,y,w,h);if(stroke){c.strokeStyle=stroke;c.lineWidth=width;c.strokeRect(x,y,w,h);}}
function laurel(c,x,y,size){for(const side of [-1,1])for(let i=0;i<7;i++){const a=-1.25+i*.36;const px=x+side*Math.cos(a)*size,py=y+Math.sin(a)*size;c.save();c.translate(px,py);c.rotate(side*(a+.6));oval(c,0,0,size*.2,size*.075,GOLD);c.restore();}}
function crown(c,x,y,s,queen=false){c.save();c.translate(x,y);c.scale(s,s);shape(c,[[-.45,.1],[-.53,-.38],[-.23,-.2],[0,-.65],[.23,-.2],[.53,-.38],[.45,.1]],GOLD);box(c,-.43,.02,.86,.17,'#b88743');for(const dx of [-.28,0,.28])oval(c,dx,.07,.055,.06,queen?'#83efda':'#ff8f62');line(c,-.4,.2,.4,.2,LIGHT,.045);c.restore();}
function column(c,p){c.save();c.translate(p.x,p.y);oval(c,.35,.3,.95,.35,'#30495530');box(c,-.75,-.16,1.5,.36,'#859e9c');box(c,-.64,-.38,1.28,.23,'#e2e6d1');box(c,-.42,-3.95,.84,3.6,'#ccd5c6');box(c,.13,-3.95,.29,3.6,'#96afa9',null);for(const x of [-.26,-.04,.18])line(c,x,-3.7,x,-.55,x<0?'#f5f0d9':'#728f91',.055);box(c,-.68,-4.15,1.36,.27,'#e2e6d1');box(c,-.77,-4.35,1.54,.2,'#9eb8af');for(const side of [-1,1])oval(c,side*.47,-4.08,.2,.16,'#d6decc',INK,.035);line(c,-.35,-2.9,-.14,-2.75,'#738e8e',.025);line(c,-.14,-2.75,-.2,-2.36,'#738e8e',.025);
  if(p.y!==236.5){line(c,-.49,-4.25,-.45,-2.1,'#476c63',.06);for(let i=0;i<7;i++){c.save();c.translate(-.45+(i%2?.12:-.09),-4+i*.29);c.rotate(i%2?-.65:.65);oval(c,0,0,.16,.07,i%2?'#7da681':'#527d6b');c.restore();}}
  c.restore();}

export function templeGround(c,x,y){
  const n=((x*31+y*17)%13)/13;
  box(c,x,y,1.01,1.01,n>.5?'#91a9a6':'#95ada8',null);
  line(c,x,y+1,x+1,y+1,'#789691',.015);
  line(c,x+1,y,x+1,y+1,'#789691',.015);
  if(x<147||x>176||y>258||y<225&&(x<148||x>151)){box(c,x,y,1.01,1.01,'#526c76',null);if((x+y)%5===0)line(c,x+.2,y+.3,x+.7,y+.5,'#779198',.05);}
}
export function templeFloor(c,t){
  c.save();c.translate(162.5,237);c.scale(.78,1);
  // Broad worn marble steps and a mosaic rotunda, open at the front.
  for(let i=3;i>=0;i--)box(c,-12-i*.34,-7-i*.15,24+i*.68,16+i*.65,['#758e92','#9cb2ab','#c2cebd','#e1e1c9'][i],INK,.06);
  box(c,-10.5,-5.9,21,13.5,'#486c79');
  for(let y=-5;y<7;y++)for(let x=-10;x<10;x++)box(c,x,y,.95,.95,(x+y)%2?'#6c8d8b':'#7d9c94',null);
  for(const ry of [5.9,5.3]){c.beginPath();c.ellipse(0,.4,9.6,ry,0,0,Math.PI*2);c.strokeStyle=GOLD;c.lineWidth=.09;c.stroke();}
  for(let i=0;i<32;i++){const a=i*Math.PI/16;c.save();c.translate(Math.cos(a)*8.7,Math.sin(a)*5.5+.4);c.rotate(a);box(c,-.16,-.12,.32,.24,i%2?GOLD:'#c9e0cc',null);c.restore();}
  laurel(c,0,3.2,1.55);crown(c,0,3.2,1.5);
  // Weathering is architectural, never a barrier across the walk.
  for(const [x,y] of [[-9,6],[8,-4],[-7,-4],[9,5]]){line(c,x,y,x+.7,y+.2,'#3d6372',.045);line(c,x+.7,y+.2,x+.5,y+.7,'#3d6372',.035);}
  c.scale(1/.78,1);
  for(const royal of COURT){const x=royal.x-162.5,y=royal.y-237,s=royal.role==='guard'?1:2.05;oval(c,x,y+.26,s,.46,'#283f5340');oval(c,x,y+.15,s,.47,'#819f9e',GOLD,.08);oval(c,x,y+.1,s*.82,.36,'#496e81','#abecdf',.045);}
  // Blue stasis motes drift slowly; no firing or combat effects.
  for(let i=0;i<16;i++){const f=(t*.07+i*.173)%1;c.globalAlpha=Math.sin(f*Math.PI)*.45;oval(c,Math.sin(i*19)*9,-4+f*10,.035,.07,'#d8fff1');}c.globalAlpha=1;
  for(const side of [-1,1]){
    const x=side*7.2,y=10.1;
    oval(c,x,y,.8,.25,'#293d4d35');box(c,x-.36,y-.9,.72,.9,'#9ab1aa');box(c,x-.52,y-1.1,1.04,.25,GOLD);
    const flicker=Math.sin(t*2+side)*.08;
    shape(c,[[x-.38,y-1.12],[x-.42,y-1.55],[x-.12,y-1.4],[x+.02,y-2.05-flicker],[x+.38,y-1.55],[x+.31,y-1.12]],'#e89c67',null);
    shape(c,[[x-.17,y-1.12],[x,y-1.73],[x+.19,y-1.12]],'#fff0b1',null);
  }
  c.restore();
}
export function templeArchitecture(c){
  c.save();c.translate(162.5,228.5);c.scale(.78,1);
  oval(c,.5,.3,13,2,'#233c5438');
  // Patinated bronze dome, ribs and oculus above a deep coffered arch.
  c.beginPath();c.ellipse(0,-1.4,10.7,7.5,0,Math.PI,Math.PI*2);c.lineTo(10.7,-.8);c.lineTo(-10.7,-.8);c.closePath();c.fillStyle='#527f83';c.fill();c.strokeStyle=INK;c.lineWidth=.15;c.stroke();
  for(const dx of [-8,-5,0,5,8]){c.beginPath();c.moveTo(0,-8.85);c.quadraticCurveTo(dx*.8,-7.5,dx,-1.4);c.strokeStyle=dx===0?'#ead7a2':'#98b2a3';c.lineWidth=.12;c.stroke();}
  for(const y of [-6,-3.8])line(c,-Math.sqrt(Math.max(0,1-((y+1.4)/7.5)**2))*10.5,y,Math.sqrt(Math.max(0,1-((y+1.4)/7.5)**2))*10.5,y,'#abc1a7',.08);
  oval(c,0,-8.72,1.35,.36,'#263f57',GOLD,.12);oval(c,0,-8.76,.87,.17,'#b2e2dc');
  box(c,-12,-1.55,24,1.25,'#b5c7b9');box(c,-12.3,-1.65,24.6,.25,'#eee8cf');box(c,-12.25,-.35,24.5,.28,'#809f9e');
  for(let x=-10.8;x<11;x+=1.8){box(c,x,-1.25,1.2,.6,'#768f91');box(c,x+.18,-1.1,.84,.3,'#d0d6bf',null);}
  shape(c,[[-10,-.07],[0,-3],[10,-.07]],'#d5dac3',INK,.1);shape(c,[[-7.8,-.38],[0,-2.56],[7.8,-.38]],'#5f8588',GOLD,.07);laurel(c,0,-1.28,.83);crown(c,0,-1.25,.7);
  // Back wall with niches and hanging imperial banners.
  for(const side of [-1,1]){
    box(c,side<0?-11:7,-.05,4,4.3,'#bacbbd');
    box(c,side*9-1,-.02,2,3.1,side<0?'#913e4f':'#65517f',GOLD,.07);
    shape(c,[[side*9-1,3],[side*9,3.6],[side*9+1,3]],side<0?'#913e4f':'#65517f',GOLD,.07);
    crown(c,side*9,1.5,.85,side>0);
  }
  c.restore();
}
export function sleepingRoyal(c,p,t){
  c.save();c.translate(p.x,p.y);c.scale(p.size/80,p.size/80);
  const queen=p.role==='queen',king=p.role==='king',guard=!king&&!queen;
  const body=king?'#c65547':queen?'#9283c5':'#5c99a2',trim=queen?'#f0e5b4':GOLD;
  const R=(x,y,w,h,fill,stroke=INK,lw=2)=>{c.beginPath();c.roundRect(x,y,w,h,Math.min(6,w/4));c.fillStyle=fill;c.fill();if(stroke){c.strokeStyle=stroke;c.lineWidth=lw;c.stroke();}};
  const L=(...args)=>line(c,...args);
  oval(c,0,29,42,12,'#223b4a45');
  // Cloaks, articulated feet and broad shoulder armor give the monarchs a silhouette of their own.
  if(!guard)shape(c,[[-29,-23],[-42,32],[0,23],[42,32],[29,-23]],queen?'#514b7f':'#7f3346',trim,2);
  for(const side of [-1,1]){R(side*25-10,7,20,28,'#355665');for(let y=13;y<34;y+=6)L(side*25-7,y,side*25+7,y,'#adc5be',2);R(side*25-13,27,26,9,trim);}
  const gradient=c.createLinearGradient(-26,-25,29,25);gradient.addColorStop(0,queen?'#d4c8ed':king?'#f28a64':'#a0ccc7');gradient.addColorStop(.55,body);gradient.addColorStop(1,queen?'#6c6497':king?'#913c48':'#3d6c7e');
  R(-30,-29,60,58,'#304b58');R(-25,-25,50,50,gradient);R(-21,-22,42,6,'#ffffff35',null);
  for(const side of [-1,1]){
    shape(c,[[side*25,-24],[side*40,-17],[side*39,1],[side*26,6]],trim,INK,2);
    L(side*30,-19,side*35,-14,LIGHT,2);oval(c,side*32,-6,2.5,2.5,queen?'#99f9de':'#d47c54');
  }
  // Closed curved eyelids, dim cool cores: unmistakably asleep, not hostile.
  for(const side of [-1,1]){R(side*10-7,-14,14,12,'#273d50',null);c.beginPath();c.arc(side*10,-10,5,0,Math.PI);c.strokeStyle='#bce4df';c.lineWidth=2;c.stroke();}
  R(-12,7,24,7,'#263f50',null);for(let i=0;i<3;i++)L(-7+i*7,9,-7+i*7,12,'#8fc1c5',1.5);
  if(guard){
    R(-28,-34,56,11,trim);shape(c,[[-17,-34],[-15,-45],[13,-45],[18,-34]],'#a75155',INK,2);for(let x=-10;x<=10;x+=5)L(x,-44,x,-35,'#ea9c71',2);
    // A Roman tower shield and resting spear, not the player's weapon silhouettes.
    R(-46,-5,22,37,'#b7d1c7',INK,2);L(-35,-1,-35,27,GOLD,4);L(-43,12,-27,12,GOLD,3);
    L(43,27,43,-47,'#9baea9',4);shape(c,[[38,-43],[43,-58],[48,-43]],'#e5e6ce',INK,1.7);
  }else{
    crown(c,0,-29,53,queen);
    R(-22,18,44,8,trim);oval(c,0,21,5,5,queen?'#9ef6d7':'#ffbd65',INK,1.5);
    if(king){
      // Two enormous cold furnace cannons. Flame-shaped copper vents foreshadow his power.
      for(const side of [-1,1]){R(side*39-12,-13,24,39,'#596875',INK,2.5);R(side*39-15,14,30,13,trim,INK,2);R(side*39-10,18,20,6,'#273d50',null);for(let i=0;i<3;i++)L(side*39-6+i*6,-7,side*39-6+i*6,8,'#efad66',2.4);shape(c,[[side*39-5,-15],[side*39-10,-25],[side*39-2,-23],[side*39+2,-36],[side*39+8,-22],[side*39+5,-15]],'#d99759',INK,1.5);}
      laurel(c,0,0,22);
    }else{
      for(const side of [-1,1])for(let j=0;j<3;j++)shape(c,[[side*28,-20+j*9],[side*(45-j*3),-36+j*10],[side*(41-j*3),-10+j*9]],'#d2e5ce',GOLD,1.5);
      L(44,30,44,-43,GOLD,3);oval(c,44,-44,10,12,'#517c91',trim,2);shape(c,[[44,-54],[50,-44],[44,-34],[38,-44]],'#acf6e1',null);L(42,-50,42,-42,'#f2fff1',2);
    }
  }
  c.restore();
  // Only the stasis halo moves, never the sleeping figures themselves.
  oval(c,p.x,p.y+p.size*.3,p.size*.57,p.size*.22,'#9dece80b','#bce7e988',.035);
  c.save();c.font=`700 ${guard?.3:.38}px sans-serif`;c.textAlign='center';c.fillStyle='#e0fff4';c.fillText('z',p.x+p.size*.48,p.y-p.size*.7-(Math.sin(t*.8)*.04));c.restore();
}
export function templeColumns(c){for(const p of COLUMNS)column(c,p);}
export function pantheonMarker(c,x,y,scale,open){c.save();c.translate(x,y);c.scale(scale,scale);oval(c,0,1,19,19,open?'#355e71':'#41525f',GOLD,2);for(const x of [-11,-4,4,11])box(c,x-1.5,-4,3,15,'#d7dfcb',null);shape(c,[[-17,-5],[0,-17],[17,-5]],'#b6ccbe',GOLD,1.3);line(c,-16,13,16,13,GOLD,3);crown(c,0,-2,10);c.restore();}
