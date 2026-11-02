import {PANTHEON,COURT,COLUMNS,STAIRWAY,TERRACE} from './pantheon.js?v=world85';
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
  box(c,-10.5,-5.9,21,13.5,'#536f77');
  for(let y=-5;y<7;y+=2)for(let x=-10;x<10;x+=2){box(c,x,y,1.96,1.96,(x+y)%4?'#8ca39e':'#91a7a0',null);line(c,x+.08,y+.08,x+1.88,y+.08,'#c1cbbb',.035);}
  c.beginPath();c.ellipse(0,.4,9.6,5.9,0,0,Math.PI*2);c.strokeStyle='#c4b885';c.lineWidth=.09;c.stroke();
  // One subdued worn seal leaves the colorful court as the focal point.
  c.globalAlpha=.4;laurel(c,0,3.2,1.3);crown(c,0,3.2,1.1);c.globalAlpha=1;
  // Weathering is architectural, never a barrier across the walk.
  for(const [x,y] of [[-9,6],[8,-4],[-7,-4],[9,5]]){line(c,x,y,x+.7,y+.2,'#3d6372',.045);line(c,x+.7,y+.2,x+.5,y+.7,'#3d6372',.035);}
  c.scale(1/.78,1);
  for(const royal of COURT){const x=royal.x-162.5,y=royal.y-237,s=royal.role==='guard'?1:2.05;oval(c,x+.16,y+.34,s*1.1,.5,'#203e5355');oval(c,x,y+.26,s,.47,'#6e8b91','#b7c5b4',.08);oval(c,x,y+.1,s,.4,'#b3c4b4','#e4e4c9',.055);}
  for(let i=0;i<7;i++){const f=(t*.04+i*.173)%1;c.globalAlpha=Math.sin(f*Math.PI)*.3;oval(c,Math.sin(i*19)*9,-4+f*10,.035,.07,'#d8fff1');}c.globalAlpha=1;
  // The only ascent is the long central flight; the terrace has sheer retaining walls.
  c.save();c.translate(-162.5,-237);
  for(const [x,width] of [[TERRACE.left,STAIRWAY.left-TERRACE.left],[STAIRWAY.right,TERRACE.right-STAIRWAY.right]]){
    box(c,x,244.8,width,2.2,'#566f7a',INK,.07);box(c,x,244.75,width,.32,'#d4dac5');
    for(let y=245.3;y<247;y+=.55){line(c,x,y,x+width,y,'#8da69f',.04);for(let bx=x+1+(Math.round(y*2)%2);bx<x+width;bx+=1.8)line(c,bx,y,bx,y+.5,'#304b5d',.035);}
  }
  for(const side of [-1,1]){
    const x=side<0?TERRACE.left:TERRACE.right;
    box(c,x-.22,229,.44,15.8,'#d3d9c2',INK,.07);box(c,x-.13,229,.1,15.8,'#f0eed4',null);
  }
  const top=STAIRWAY.top-.6,bottom=STAIRWAY.bottom;
  shape(c,[[159.7,top],[165.3,top],[166.1,bottom+.25],[158.9,bottom+.25]],'#456372',INK,.08);
  for(let i=0;i<12;i++){
    const y=top+(bottom-top)*i/12,next=top+(bottom-top)*(i+1)/12,half=2.5+i*.055;
    box(c,162.5-half,y,half*2,next-y,'#c4cebb','#849b98',.025);
    box(c,162.5-half,next-.18,half*2,.18,'#617e87',null);
    line(c,162.5-half,y+.025,162.5+half,y+.025,'#f7f0d7',.07);
  }
  for(const side of [-1,1])shape(c,[[162.5+side*2.55,top],[162.5+side*2.95,top],[162.5+side*3.7,bottom+.3],[162.5+side*3.25,bottom+.3]],'#adbfb0',INK,.07);
  box(c,160.15,bottom+.35,4.7,258-bottom,'#bdc8b5','#657e81',.04);
  for(let y=bottom+1;y<258.5;y++)line(c,160.2,y,164.8,y,'#8eaa9f',.025);
  c.restore();
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
  // Solid aged masonry, not a transparent latitude/longitude grid.
  const dome=c.createLinearGradient(-9,-8,9,-1);dome.addColorStop(0,'#d1d6c3');dome.addColorStop(.42,'#a5b8ad');dome.addColorStop(.8,'#728e90');dome.addColorStop(1,'#4b6b78');
  c.beginPath();c.ellipse(0,-1.4,10.7,7.5,0,Math.PI,Math.PI*2);c.lineTo(10.7,-.8);c.lineTo(-10.7,-.8);c.closePath();c.fillStyle=dome;c.fill();c.strokeStyle=INK;c.lineWidth=.2;c.stroke();
  for(const dx of [-8,-4,4,8]){c.beginPath();c.moveTo(dx*.075,-8.78);c.quadraticCurveTo(dx*.85,-6.7,dx,-1.4);c.strokeStyle='#607c7e';c.lineWidth=.2;c.stroke();c.strokeStyle='#c5cfb9';c.lineWidth=.065;c.stroke();}
  for(let row=0;row<5;row++){const y=-7.1+row*1.1,half=Math.sqrt(1-((y+1.4)/7.5)**2)*10.4;line(c,-half,y,half,y,'#5e79792e',.055);for(let x=-half+1+(row%2);x<half-1;x+=2.3)line(c,x,y,x-.2,y+.55,'#58757a40',.04);}
  for(const [x,y] of [[-6,-4],[4,-6],[7,-2]]){line(c,x,y,x+.4,y+.3,'#4e6d74',.06);line(c,x+.4,y+.3,x+.27,y+.7,'#4e6d74',.045);}
  oval(c,0,-8.6,1.5,.45,'#526a73','#d9d7b9',.2);oval(c,0,-8.62,1.03,.24,'#243d51','#9eb4ac',.08);oval(c,0,-8.5,.77,.1,'#526c7b');
  box(c,-12,-1.55,24,1.25,'#b5c7b9');box(c,-12.3,-1.65,24.6,.25,'#eee8cf');box(c,-12.25,-.35,24.5,.36,'#536e77');
  for(let x=-10.8;x<11;x+=1.8){box(c,x,-1.25,1.2,.6,'#768f91');box(c,x+.18,-1.1,.84,.3,'#d0d6bf',null);}
  shape(c,[[-10,-.07],[0,-3],[10,-.07]],'#d5dac3',INK,.1);shape(c,[[-7.8,-.38],[0,-2.56],[7.8,-.38]],'#5f8588',GOLD,.07);laurel(c,0,-1.28,.83);crown(c,0,-1.25,.7);
  box(c,-7.1,.12,14.2,3.2,'#405967',null);box(c,-6.6,.18,13.2,.45,'#263f50',null);
  for(const side of [-1,1]){
    const x=side*4.6;
    c.beginPath();c.moveTo(x-1,3.3);c.lineTo(x-1,1.6);c.arc(x,1.6,1,Math.PI,0);c.lineTo(x+1,3.3);c.closePath();c.fillStyle='#263e50';c.fill();c.strokeStyle='#94aaa1';c.lineWidth=.13;c.stroke();
    box(c,x-.56,1.7,1.12,1.3,'#778e91',null);box(c,x-.7,2.88,1.4,.24,'#b4c4b3',null);oval(c,x,1.43,.3,.3,'#a8b9ab');
  }
  line(c,-11.5,.14,11.5,.14,'#203a4b70',.2);
  // Back wall with niches and hanging imperial banners.
  for(const side of [-1,1]){
    box(c,side<0?-11:7,-.05,4,4.3,'#bacbbd');
    box(c,side*9-1,-.02,2,3.1,side<0?'#913e4f':'#65517f',GOLD,.07);
    shape(c,[[side*9-1,3],[side*9,3.6],[side*9+1,3]],side<0?'#913e4f':'#65517f',GOLD,.07);
    crown(c,side*9,1.5,.85,side>0);
  }
  c.restore();
}
export function sleepingRoyal(c,p,t,options={}){
  c.save();c.translate(p.x,p.y);c.scale(p.size/80,p.size/80);
  const awake=!!p.awake,charging=!!p.charging;
  if(awake&&p.moving&&!charging)c.translate(0,Math.sin(t*10)*1.2);
  const queen=p.role==='queen',king=p.role==='king',guard=!king&&!queen;
  const body=king?'#c65547':queen?'#9283c5':'#5c99a2',trim=queen?'#f0e5b4':GOLD;
  const R=(x,y,w,h,fill,stroke=INK,lw=2)=>{c.beginPath();c.roundRect(x,y,w,h,Math.min(6,w/4));c.fillStyle=fill;c.fill();if(stroke){c.strokeStyle=stroke;c.lineWidth=lw;c.stroke();}};
  const L=(...args)=>line(c,...args);
  oval(c,0,29,42,12,'#223b4a45');
  // Cloaks, articulated feet and broad shoulder armor give the monarchs a silhouette of their own.
  if(!guard){shape(c,[[-29,-23],[-44,35],[0,27],[44,35],[29,-23]],queen?'#514b7f':'#7f3346',trim,2);for(const side of [-1,1])L(side*27,-12,side*34,29,queen?'#9183bd':'#ae5260',2);}
  for(const side of [-1,1]){R(side*25-10,7,20,28,'#355665');for(let y=13;y<34;y+=6)L(side*25-7,y,side*25+7,y,'#adc5be',2);R(side*25-13,27,26,9,trim);}
  const gradient=c.createLinearGradient(-26,-25,29,25);gradient.addColorStop(0,p.hit>0?'#fff4cf':queen?'#d4c8ed':king?'#f28a64':'#a0ccc7');gradient.addColorStop(.55,p.hit>0?'#fff0cb':body);gradient.addColorStop(1,queen?'#6c6497':king?'#913c48':'#3d6c7e');
  R(-30,-29,60,58,'#304b58');R(-25,-25,50,50,gradient);R(-21,-22,42,6,'#ffffff35',null);
  for(const side of [-1,1]){
    shape(c,[[side*25,-24],[side*40,-17],[side*39,1],[side*26,6]],trim,INK,2);
    L(side*30,-19,side*35,-14,LIGHT,2);oval(c,side*32,-6,2.5,2.5,queen?'#99f9de':'#d47c54');
  }
  // Closed curved eyelids, dim cool cores: unmistakably asleep, not hostile.
  for(const side of [-1,1]){R(side*11-8,-15,16,14,'#273d50',null);if(awake){oval(c,side*11,-8,6,6.5,'#fff6d8');oval(c,side*11+Math.cos(p.angle)*1.7,-8+Math.sin(p.angle)*1.7,2.7,3,'#284353');oval(c,side*11-1,-10,1.5,1.5,'#fff');}else{c.beginPath();c.arc(side*11,-11,5.5,0,Math.PI);c.strokeStyle='#c9efdf';c.lineWidth=2.7;c.stroke();}}
  R(-12,7,24,7,'#263f50',null);for(let i=0;i<3;i++)L(-7+i*7,9,-7+i*7,12,'#8fc1c5',1.5);
  if(guard){
    R(-28,-34,56,11,trim);shape(c,[[-17,-34],[-15,-45],[13,-45],[18,-34]],'#a75155',INK,2);for(let x=-10;x<=10;x+=5)L(x,-44,x,-35,'#ea9c71',2);
    // A Roman tower shield and resting spear, not the player's weapon silhouettes.
    shape(c,[[-51,-7],[-25,-7],[-25,25],[-38,36],[-51,25]],'#3d686f','#e8d18c',3.5);
    L(-38,-2,-38,26,GOLD,4);shape(c,[[-45,9],[-38,3],[-31,9],[-38,21]],'#d7dfc1',null);
    if(awake&&options.drawWeapon){c.save();c.translate(Math.cos(p.angle)<0?-27:27,10);c.rotate(p.angle);c.scale(.75,.75);options.drawWeapon(c,p.weapon,t,p.swing>0?p.swing:charging?.12:0);c.restore();}
    else{L(45,28,45,-49,'#354e60',6);L(44,26,44,-49,'#d3dccb',2.5);shape(c,[[37,-45],[45,-65],[53,-45]],'#e5e6ce',INK,2.5);}
  }else{
    R(-22,18,44,8,trim);oval(c,0,21,5,5,queen?'#9ef6d7':'#ffbd65',INK,1.5);
    if(king){
      // A broad imperial helmet and laurel differ from the queen's tall diadem.
      R(-30,-39,60,13,'#d8af59',INK,2.4);R(-25,-37,50,5,'#f6dc8d',null);
      shape(c,[[-24,-39],[-24,-50],[-12,-47],[0,-57],[12,-47],[24,-50],[24,-39]],GOLD,INK,2.3);
      for(const side of [-1,1])for(let j=0;j<3;j++){c.save();c.translate(side*(27-j*2),-25+j*7);c.rotate(side*.65);oval(c,0,0,5,2.5,GOLD);c.restore();}
      oval(c,0,-41,5,5,'#e77b4c','#fff0ae',1.6);
      // Deep round muzzles project from long barrel housings, not flat armrests.
      for(const side of [-1,1]){
        const x=side*41;
        c.save();c.translate(x,-2);if(awake)c.rotate(p.angle-Math.PI/2);
        R(-12,-13,24,42,'#566b77',INK,3);R(-9,-10,7,32,'#8ea6aa',null);
        for(const y of [-3,10,21])R(-13,y,26,5,'#cba55e',INK,1.5);
        oval(c,0,31,14,11,'#dcb66b',INK,2.6);oval(c,0,31,10,7.3,'#152e43','#f4d993',1.4);oval(c,0,32,5.8,3.5,awake&&charging?'#f4a56b':'#293f50');
        L(-6,-8,6,-8,'#dd8d5f',3);
        if(awake&&p.swing>0){shape(c,[[-9,38],[-4,49],[0,62],[5,48],[9,38]],'#ffb354',null);shape(c,[[-4,38],[0,52],[4,38]],'#fff3bb',null);}
        c.restore();
      }
      shape(c,[[-7,16],[-11,10],[-7,3],[-3,7],[1,-1],[8,8],[7,16]],'#f4c16d','#8e4547',1.5);
    }else{
      shape(c,[[-27,-29],[-25,-43],[-12,-38],[0,-65],[12,-38],[25,-43],[27,-29]],'#eee0ad',INK,2);
      L(-23,-30,23,-30,GOLD,4);shape(c,[[0,-57],[6,-45],[0,-34],[-6,-45]],'#8ee2cf','#f5f7d4',1.5);
      for(const side of [-1,1]){shape(c,[[side*27,-20],[side*42,-31],[side*38,-3],[side*28,7]],'#d5e4ce',GOLD,2);L(side*30,-17,side*36,-22,'#8db7b0',2);}
      L(45,31,45,-44,INK,5);L(44,30,44,-44,GOLD,2.5);
      shape(c,[[45,-65],[56,-49],[45,-33],[34,-49]],'#a8f1d8',trim,2);shape(c,[[45,-65],[45,-33],[34,-49]],'#68b9b4',null);L(45,-62,52,-49,'#f2ffeb',2);
      if(awake&&(charging||p.swing>0)){
        oval(c,45,-49,charging?17+Math.sin(t*9)*2:24,charging?17+Math.sin(t*9)*2:24,'#b7adff30','#dcfff0',1.5);
        for(let j=0;j<3;j++){const a=t*3+j*Math.PI*2/3;oval(c,45+Math.cos(a)*21,-49+Math.sin(a)*21,3,3,'#e7ccff');}
      }
    }
  }
  c.restore();
  if(awake){
    const width=p.size*.8,y=p.y-p.size*.94;box(c,p.x-width/2,y,width,.15,'#213e51',null);box(c,p.x-width/2+.025,y+.025,Math.max(0,width-.05)*p.hp/p.maxHp,.1,p.healing?'#a0e9a8':'#f3b46c',null);
    if(p.healing)for(const side of [-1,1]){const x=p.x+side*p.size*.37,y=p.y-p.size*.25-Math.sin(t*2)*.1;line(c,x-.13,y,x+.13,y,'#b8ffc2',.07);line(c,x,y-.13,x,y+.13,'#b8ffc2',.07);}
    return;
  }
  // Quiet sleep bubbles, with a crescent that reads without knowing letters.
  const sx=p.x+p.size*.43,sy=p.y-p.size*.77,ss=guard?.12:.23;
  oval(c,sx-.2,sy+.3,ss*.25,ss*.25,'#e3f4dd88');oval(c,sx-.1,sy+.15,ss*.45,ss*.45,'#e3f4ddaa');
  oval(c,sx,sy,ss,ss,'#d5eacb');oval(c,sx+ss*.42,sy-ss*.22,ss*.8,ss*.8,'#6b878c');
}
export function templeColumns(c){for(const p of COLUMNS)column(c,p);}
export function templeSeal(c,t,state={}){
  if(state.phase&&state.phase!=='sleeping'&&state.opening>1.4){if(state.phase==='victory')crown(c,162.5,240,2.4);return;}
  c.save();c.translate(162.5,246.65);
  if(state.phase&&state.phase!=='sleeping')c.globalAlpha=Math.max(0,1-state.opening/1.4);
  const field=c.createLinearGradient(0,-2.4,0,0);field.addColorStop(0,'#b8f4e71c');field.addColorStop(.6,'#b8f4e755');field.addColorStop(1,'#c8fff180');
  box(c,-2.55,-2.4,5.1,2.4,field,null);
  for(let i=0;i<7;i++){const x=-2.3+i*.76;line(c,x,-2.3,x,0,'#c7fff046',.035);}
  for(const side of [-1,1]){
    box(c,side*2.8-.24,-.55,.48,.8,'#66848b');box(c,side*2.8-.31,-.68,.62,.18,GOLD);
    shape(c,[[side*2.8,-1.6],[side*2.8+.24,-1.1],[side*2.8,-.66],[side*2.8-.24,-1.1]],'#b7f7e4',INK,.045);
  }
  line(c,-2.55,.02,2.55,.02,'#d2fff0',.11);
  // A single closed padlock communicates "not yet" without text or a health bar.
  oval(c,0,-1.2,.71,.71,'#25495c',GOLD,.07);
  c.beginPath();c.arc(0,-1.42,.22,Math.PI,0);c.strokeStyle='#fff0ba';c.lineWidth=.1;c.stroke();
  box(c,-.32,-1.44,.64,.5,GOLD,INK,.055);oval(c,0,-1.23,.055,.07,'#304955');
  if(state.inspect>0){
    oval(c,0,-1.2,.68,.68,'#25495c');
    if(state.ready){line(c,-.3,-1.5,.3,-.9,'#fff2bc',.09);line(c,.3,-1.5,-.3,-.9,'#fff2bc',.09);}
    else{c.font='700 .62px sans-serif';c.textAlign='center';c.fillStyle='#fff2bc';c.fillText(String(Math.ceil(5-state.inspect)),0,-.98);}
    for(let i=0;i<5;i++)oval(c,(i-2)*.27,-.18,.075,.075,state.inspect>=i+1?'#f4df9b':'#5c8c96');
  }
  const shimmer=(t*.12)%1;c.globalAlpha=Math.sin(shimmer*Math.PI)*.32;line(c,-2.4,-2.3+shimmer*2.2,2.4,-2.3+shimmer*2.2,'#f4fff2',.07);
  c.restore();
}
export function pantheonMarker(c,x,y,scale,open){c.save();c.translate(x,y);c.scale(scale,scale);oval(c,0,1,19,19,open?'#355e71':'#41525f',GOLD,2);for(const x of [-11,-4,4,11])box(c,x-1.5,-4,3,15,'#d7dfcb',null);shape(c,[[-17,-5],[0,-17],[17,-5]],'#b6ccbe',GOLD,1.3);line(c,-16,13,16,13,GOLD,3);crown(c,0,-2,10);c.restore();}
