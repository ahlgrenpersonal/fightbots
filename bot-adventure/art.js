import { REGIONS, WORLD_W, WORLD_H, HOME, hash, regionAt, cellsIn, unlockedRegion, REGION_W, REGION_H, regionOrigin, relayFor, atlasLayout, isRoad, REQUIRED_CELLS } from './data.js?v=world55';

export function rounded(c,x,y,w,h,r,fill,stroke,line=2) {
  c.beginPath();c.roundRect(x,y,w,h,r);if(fill){c.fillStyle=fill;c.fill();}if(stroke){c.strokeStyle=stroke;c.lineWidth=line;c.stroke();}
}
function ellipse(c,x,y,rx,ry,fill){c.beginPath();c.ellipse(x,y,rx,ry,0,0,Math.PI*2);c.fillStyle=fill;c.fill();}
function line(c,x,y,x2,y2,color,width=2){c.beginPath();c.moveTo(x,y);c.lineTo(x2,y2);c.strokeStyle=color;c.lineWidth=width;c.stroke();}
function text(c,s,x,y,size=12,color='#fff',align='center'){c.font=`800 ${size}px system-ui`;c.textAlign=align;c.fillStyle=color;c.fillText(s,x,y);}
function bolt(c,x,y,s,color){c.beginPath();c.moveTo(x+s*.15,y-s*.55);c.lineTo(x-s*.3,y+s*.08);c.lineTo(x,y+s*.02);c.lineTo(x-s*.1,y+s*.55);c.lineTo(x+s*.35,y-s*.1);c.lineTo(x+s*.05,y-s*.05);c.closePath();c.fillStyle=color;c.fill();}
function shade(hex,amount){const n=parseInt(hex.slice(1),16);return `rgb(${[(n>>16)&255,(n>>8)&255,n&255].map(v=>Math.max(0,Math.min(255,Math.round(v+amount)))).join(',')})`;}

export function weapon(c,id,t=0,action=0) {
  const ink='#20363a';c.lineJoin='round';c.lineCap='round';
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
  } else if(id==='rocket') {
    rounded(c,7,-14,39,27,6,'#455b62',ink,3);rounded(c,10,-12,32,7,2,'#839b9d');
    rounded(c,30,-16,19,31,4,'#8d9992',ink,3);rounded(c,33,-13,13,25,3,'#263f47');
    c.beginPath();c.moveTo(38,-8);c.lineTo(52,0);c.lineTo(38,8);c.closePath();c.fillStyle='#ff805b';c.fill();
    rounded(c,13,-19,14,6,2,'#e4bb54',ink,2);line(c,18,14,15,21,ink,7);line(c,9,0,4,0,'#d7dbb9',4);
    for(let j=0;j<3;j++)rounded(c,14+j*5,-2,3,9,1,'#253d47');ellipse(c,22,-8,2,2,'#c5f4bd');
  }
}

export function bot(c,x,y,size,options={},t=0) {
  const { color='#ee6954',armor='light',wheels='basic',gun='bumper',angle=0,hit=0,swing=0,moving=false,boss=false,shield=false,health=1,reducedMotion=false }=options;
  const damaged=health<=.5,critical=health<=.18;
  c.save();c.translate(x,y);c.scale(size/80,size/80);
  ellipse(c,0,27,30,9,'#122e3538');
  const bob=reducedMotion?0:moving?Math.sin(t*(critical?12:18))*(critical?2.7:1.8):Math.sin(t*2.3)*.7;c.translate(critical&&!reducedMotion?Math.sin(t*31)*.7:0,bob);
  for(const side of [-1,1]) {
    const wx=side*25;
    rounded(c,wx-9,5,18,24,wheels==='treads'?4:8,wheels==='speed'?'#4f99bf':'#263c42','#193035',3);
    for(let j=0;j<4;j++)line(c,wx-7,9+j*5+((t*(moving?19:0))%5),wx+7,9+j*5+((t*(moving?19:0))%5),'#698285',2);
    ellipse(c,wx,18,4,6,wheels==='speed'?'#ffe781':'#91a7a8');
  }
  const antenna=damaged?10:0;line(c,0,-29,antenna,-40,'#243b3f',4);ellipse(c,antenna,-42,3.7,3.7,critical?'#ff9a55':'#ffe08d');ellipse(c,antenna-1,-43,1.4,1.4,'#fffbe6');
  const grad=c.createLinearGradient(-22,-26,25,29);grad.addColorStop(0,hit>0?'#fff8c7':shade(color,25));grad.addColorStop(.38,hit>0?'#fff':color);grad.addColorStop(1,hit>0?'#fff':shade(color,-18));
  rounded(c,-26,-28,52,56,11,'#21383d','#172f33',3);
  rounded(c,-22,-25,44,48,8,grad);rounded(c,-19,-22,38,7,4,'#ffffff35');rounded(c,-20,16,40,7,3,'#102d372c');
  rounded(c,-21,-19,5,31,2,'#ffffff15');rounded(c,17,-17,4,31,2,'#12343e20');
  if(armor==='steel'||armor==='heavy'||boss) {
    const thick=armor==='heavy'||boss?6:3;
    for(const side of [-1,1]){rounded(c,side<0?-29:23,-23,thick+2,48,3,'#587075','#243b40',2);for(const y of [-18,18])ellipse(c,side*26,y,2,2,'#e9c969');}
    if(armor==='heavy'||boss){rounded(c,-26,-30,52,9,3,'#f4d16a','#23393d',2);for(let i=0;i<5;i++)line(c,-20+i*10,-29,-23+i*10,-23,'#35494c',4);}
  }
  if(armor==='reflect') {
    c.save();rounded(c,-25,-28,50,54,10,null,'#d7fcff',3);
    c.beginPath();c.moveTo(-21,-17);c.lineTo(-4,-24);c.lineTo(19,17);c.lineTo(8,21);c.closePath();c.fillStyle='#eaffffa0';c.fill();c.restore();
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
  c.save();c.translate(Math.cos(angle)<0?-24:24,10);c.rotate(angle);weapon(c,gun,t,swing);c.restore();
  if(shield){ellipse(c,0,-1,40,43,'#90eaff17');c.beginPath();c.ellipse(0,-1,40,43,0,0,Math.PI*2);c.strokeStyle='#b9f5ed90';c.lineWidth=2;c.stroke();}
  c.restore();
}

export class Painter {
  constructor(canvas){this.canvas=canvas;this.c=canvas.getContext('2d');this.w=0;this.h=0;this.camera={x:HOME.x,y:HOME.y};this.tile=72;this.dpr=1;}
  resize(){const r=this.canvas.getBoundingClientRect();this.w=r.width;this.h=r.height;this.dpr=Math.min(window.devicePixelRatio||1,2);this.canvas.width=Math.round(this.w*this.dpr);this.canvas.height=Math.round(this.h*this.dpr);this.tile=(this.w<600?Math.max(55,Math.min(76,this.w/6.3)):85)*.9;}
  screenToWorld(x,y){return {x:(x-this.w/2)/this.tile+this.camera.x,y:(y-this.h*.51)/this.tile+this.camera.y};}
  worldToScreen(x,y){return {x:(x-this.camera.x)*this.tile+this.w/2,y:(y-this.camera.y)*this.tile+this.h*.51};}
  draw(g,t,dt){
    const {c,tile:s,w,h}=this;
    const smooth=1-Math.exp(-dt*6);this.camera.x+=(g.player.x-this.camera.x)*smooth;this.camera.y+=(g.player.y-this.camera.y)*smooth;
    this.camera.x=Math.max(w/s/2,Math.min(WORLD_W-w/s/2,this.camera.x));this.camera.y=Math.max(h/s*.51,Math.min(WORLD_H-h/s*.49,this.camera.y));
    c.setTransform(this.dpr,0,0,this.dpr,0,0);c.clearRect(0,0,w,h);c.fillStyle='#284d4a';c.fillRect(0,0,w,h);
    const shake=g.reducedMotion?0:g.shake;const sx=shake?Math.sin(t*100)*shake:0,sy=shake?Math.cos(t*93)*shake:0;
    c.save();c.translate(w/2-this.camera.x*s+sx,h*.51-this.camera.y*s+sy);c.scale(s,s);
    const x0=Math.max(0,Math.floor(this.camera.x-w/s/2)-2),x1=Math.min(WORLD_W,Math.ceil(this.camera.x+w/s/2)+2),y0=Math.max(0,Math.floor(this.camera.y-h/s*.51)-2),y1=Math.min(WORLD_H,Math.ceil(this.camera.y+h/s*.49)+2);
    for(let y=y0;y<y1;y++)for(let x=x0;x<x1;x++)this.ground(x,y,t,g);
    for(const gate of [{r:1,x:36,y:66.5},{r:2,x:54.5,y:44,horizontal:true},{r:3,x:72,y:66.5},{r:4,x:90.5,y:88,horizontal:true}])if(gate.r>unlockedRegion(g.save)){c.save();c.translate(gate.x,gate.y);if(gate.horizontal)c.rotate(Math.PI/2);this.gate(0,0,t);c.restore();}
    for(const site of g.world.sites)if(site.x>x0-2&&site.x<x1+2&&site.y>y0-2&&site.y<y1+2)this.site(site,g.save.cleared.includes(site.id),t);
    for(let r=0;r<5;r++){const p=relayFor(r);if(p.x>x0-3&&p.x<x1+3&&p.y>y0-3&&p.y<y1+3)this.relay(p.x,p.y,r,g,t);}
    for(const station of g.world.stations)if(station.r<=unlockedRegion(g.save)&&station.x>x0-4&&station.x<x1+4&&station.y>y0-4&&station.y<y1+4)this.station(station,g,t);
    for(const chest of g.world.chests)if(!g.save.chests.includes(chest.id)&&chest.x>x0-1&&chest.x<x1+1&&chest.y>y0-1&&chest.y<y1+1)this.chest(chest.x,chest.y,t);
    if(g.route.length){c.beginPath();c.moveTo(g.player.x,g.player.y);for(const p of g.route)c.lineTo(p.x,p.y);c.strokeStyle='#fff8c775';c.lineWidth=.045;c.setLineDash([.09,.14]);c.stroke();c.setLineDash([]);const end=g.route.at(-1);ellipse(c,end.x,end.y,.18,.09,'#fff7ad');}
    for(const a of g.telegraphs){const f=Math.max(0,a.life/a.duration);ellipse(c,a.x,a.y,a.radius,a.radius,'#ef62573a');c.beginPath();c.arc(a.x,a.y,a.radius,0,Math.PI*2);c.strokeStyle='#fc9c78';c.lineWidth=.06;c.stroke();c.beginPath();c.arc(a.x,a.y,a.radius*(1-f),0,Math.PI*2);c.strokeStyle='#fff1bb';c.lineWidth=.05;c.stroke();}
    const objects=g.world.props.filter(p=>p.x>x0-2&&p.x<x1+2&&p.y>y0-2&&p.y<y1+2).map(p=>({...p,kind:'prop'}));
    objects.push({x:HOME.x,y:HOME.y-.6,kind:'home'});
    for(const e of g.enemies)if(e.hp>0&&!e.dormant&&e.x>x0-2&&e.x<x1+2&&e.y>y0-2&&e.y<y1+2)objects.push({...e,kind:'enemy'});
    objects.push({...g.player,kind:'player'});objects.sort((a,b)=>a.y-b.y);
    for(const obj of objects){
      if(obj.kind==='prop')this.prop(obj,t);
      else if(obj.kind==='home')this.home(obj.x,obj.y,t);
      else if(obj.kind==='player'){
        if(g.boostTime>0){ellipse(c,obj.x,obj.y+.2,.64,.36,'#ffdc6340');for(let i=0;i<3;i++)ellipse(c,obj.x+Math.cos(t*3+i*2)*.7,obj.y+Math.sin(t*3+i*2)*.7,.06,.06,'#ffe18c');}
        bot(c,obj.x,obj.y,1.17,{color:g.save.color,armor:g.save.build.armor,wheels:g.save.build.wheels,gun:g.save.build.weapon,angle:g.player.angle,hit:g.player.hit,swing:g.player.swing,moving:g.route.length>0,shield:g.player.invincible>0||g.boostTime>0,health:g.player.hp/g.maxHp(),reducedMotion:g.reducedMotion},t);
      }else{
        const boss=obj.type==='boss';const colors=['#b4a17b','#a97d6a','#728fb4','#be884d','#947daa'];
        if(boss&&!g.bossAwake(obj.r)){ellipse(c,obj.x,obj.y+.2,.8,.4,'#263d4828');bot(c,obj.x,obj.y,1.2,{color:'#748482',armor:'heavy',gun:'bumper',boss:true},t*.1);text(c,'Z z z',obj.x,obj.y-1,.2,'#e8f1d5');}
        else {bot(c,obj.x,obj.y,boss?1.7:obj.type==='tank'?.85:.72,{color:colors[obj.r],armor:boss&&obj.r===2?'reflect':boss?'heavy':obj.type==='tank'?'steel':'light',gun:obj.type==='ranged'?'blaster':boss?['bumper','hammer','lightning','rocket','rocket'][obj.r]:'bumper',angle:obj.angle,hit:obj.hit,swing:obj.swing,boss,moving:obj.active},t);
          if(obj.hp<obj.maxHp||boss&&g.bossAwake(obj.r)){const width=boss?1.1:.55;rounded(c,obj.x-width/2,obj.y-(boss?1.1:.6),width,.09,.03,'#24393a');rounded(c,obj.x-width/2,obj.y-(boss?1.1:.6),width*Math.max(0,obj.hp/obj.maxHp),.09,.03,boss?'#f39a71':'#f6d787');}
        }
      }
    }
    for(const l of g.loot){const bob=Math.sin(t*4+l.x)*.05;ellipse(c,l.x,l.y+.12,.14,.06,'#284b4930');if(l.kind==='gear')this.gear(l.x,l.y+bob,.2);else{c.save();c.translate(l.x,l.y+bob);c.rotate(Math.PI/4);rounded(c,-.09,-.09,.18,.18,.03,'#ffe18c','#b59b46',.025);c.restore();}}
    for(const p of g.projectiles){if(p.kind==='rocket'){c.save();c.translate(p.x,p.y);c.rotate(p.angle);ellipse(c,-.24,0,.27,.1,'#ffce6c');ellipse(c,-.2,0,.17,.06,'#fff4ae');rounded(c,-.15,-.08,.36,.16,.05,'#d9e3d9','#31484d',.025);ellipse(c,.21,0,.1,.08,'#f58059');c.restore();}else{ellipse(c,p.x,p.y,.16,.09,p.enemy?'#ffbf79':'#bffcff');ellipse(c,p.x,p.y,.075,.045,'#fffbe0');}}
    for(const fx of g.effects)this.effect(fx,t);
    c.restore();
    // A very subtle paper grain ties the hand-built scenery together.
    if(g.waypoint){const p=this.worldToScreen(g.waypoint.x,g.waypoint.y);if(p.x<30||p.x>w-30||p.y<30||p.y>h-65){const a=Math.atan2(p.y-h/2,p.x-w/2),rx=w/2-40,ry=h/2-65;const ax=w/2+Math.cos(a)*Math.max(30,rx),ay=h/2+Math.sin(a)*Math.max(30,ry);c.save();c.translate(ax,ay);c.rotate(a);c.beginPath();c.moveTo(12,0);c.lineTo(-8,-9);c.lineTo(-5,0);c.lineTo(-8,9);c.closePath();c.fillStyle='#fff1b1';c.strokeStyle='#42655c';c.lineWidth=3;c.stroke();c.fill();c.restore();}}
  }
  ground(x,y,t,g){const c=this.c,r=regionAt(x,y),reg=REGIONS[r]||REGIONS[4],n=hash(x,y);const road=isRoad(x+.5,y+.5);
    if(g.world.water.has(`${x},${y}`)){
      c.fillStyle=reg.water;c.fillRect(x,y,1.02,1.02);
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
    if(!road){for(let j=0;j<6;j++){const px=x+hash(x+j*13,y,4)*.9,py=y+hash(x,y+j*7,5)*.9;const wind=Math.sin(t*1.3+x+y)*.014;line(c,px,py,px+.025+wind,py-.065,reg.dark+'66',.015);line(c,px,py,px+.06+wind,py-.035,reg.dark+'66',.015);}
      if(n>.8){ellipse(c,x+.35,y+.57,.07,.02,'#ffffff25');ellipse(c,x+.65,y+.3,.025,.025,'#fff0be70');}
    }else{for(let j=0;j<3;j++)ellipse(c,x+hash(x+j,y,7),y+hash(x,y+j,8),.025,.018,'#61795930');}
    if(x===0||y===0||x===WORLD_W-1||y===WORLD_H-1){c.fillStyle=reg.water;c.fillRect(x,y,1.01,1.01);line(c,x+.1,y+.4+Math.sin(t+x)*.02,x+.6,y+.4+Math.sin(t+x)*.02,'#c1e9dc60',.025);}
    if(!g.save.visited.includes(r)&&r>unlockedRegion(g.save)){c.fillStyle='#192f3b55';c.fillRect(x,y,1.02,1.02);}
  }
  prop(p,t){const c=this.c,reg=REGIONS[p.r];c.save();c.translate(p.x,p.y);
    if(p.type==='landmark'){
      ellipse(c,.2,.2,.9,.3,'#294b4833');rounded(c,-.4,-.4,.8,.65,.07,'#78958a','#456c65',.04);
      if(p.r===2){for(let i=0;i<3;i++){c.beginPath();c.moveTo(-.5+i*.35,0);c.lineTo(-.4+i*.35,-1.5+i*.3);c.lineTo(-.22+i*.35,-.45);c.lineTo(-.2+i*.35,0);c.closePath();c.fillStyle=i%2?'#bdeded':'#72c7d5';c.fill();c.strokeStyle='#477f97';c.lineWidth=.035;c.stroke();}}
      else {line(c,0,-.3,0,-2.2,'#416963',.15);line(c,-.035,-.4,-.035,-2.2,'#9fbeb2',.045);c.save();c.translate(0,-2.2);c.rotate(t*.55+p.seed*4);for(let i=0;i<3;i++){c.rotate(Math.PI*2/3);c.beginPath();c.moveTo(-.07,.06);c.lineTo(-.1,-1.1);c.lineTo(.09,-.87);c.lineTo(.08,-.1);c.closePath();c.fillStyle='#d5debb';c.fill();c.strokeStyle='#4e7c6b';c.lineWidth=.025;c.stroke();}ellipse(c,0,0,.13,.13,'#f8d986');c.restore();}
    }else if(p.type==='tree'){
      ellipse(c,.2,.24,.65,.25,'#20464228');rounded(c,-.1,-.45,.2,.68,.06,'#687d60','#3e6251',.035);
      const colors=p.r===4?['#778b9e','#96b3b4','#b9ccd0']:p.r===3?['#658565','#8cab75','#b5c987']:[reg.dark,'#70a77b','#98c28b'];
      ellipse(c,0,-.55,.57,.54,colors[0]);ellipse(c,-.2,-.69,.38,.35,colors[1]);ellipse(c,.18,-.7,.3,.32,colors[1]);ellipse(c,-.17,-.86,.24,.17,colors[2]);
      c.beginPath();c.ellipse(.1,-.51,.43,.29,0,0,Math.PI);c.strokeStyle='#284d4926';c.lineWidth=.09;c.stroke();
      for(let i=0;i<4;i++)ellipse(c,-.35+i*.2,-.55+(i%2)*.09,.04,.025,'#d6e5ac60');
    }else if(p.type==='mountain'){
      ellipse(c,.2,.3,1.2,.55,'#213d4c30');c.beginPath();c.moveTo(-1.25,.35);c.lineTo(-.2,-2.1);c.lineTo(.3,-1.5);c.lineTo(1.25,.35);c.closePath();c.fillStyle='#738b91';c.fill();c.beginPath();c.moveTo(-.2,-2.1);c.lineTo(.3,-1.5);c.lineTo(1.25,.35);c.lineTo(.05,.1);c.closePath();c.fillStyle='#506e7c';c.fill();c.beginPath();c.moveTo(-.65,-1.2);c.lineTo(-.2,-2.1);c.lineTo(.3,-1.5);c.lineTo(.55,-.9);c.lineTo(.05,-1.17);c.lineTo(-.27,-.99);c.closePath();c.fillStyle='#d0ded9';c.fill();
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
  relay(x,y,r,g,t){const c=this.c;const done=g.save.bosses.includes(r),awake=cellsIn(g.save,r)>=REQUIRED_CELLS;c.save();c.translate(x,y);ellipse(c,0,.1,2.1,1.7,'#263e3f22');
    c.beginPath();c.ellipse(0,0,2.2,1.8,0,0,Math.PI*2);c.strokeStyle=done?'#e8f8b69a':'#edf0d549';c.lineWidth=.07;c.setLineDash([.15,.16]);c.stroke();c.setLineDash([]);
    rounded(c,-.35,-1.2,.7,.9,.12,done?'#91c6a4':'#658383','#355b59',.04);rounded(c,-.48,-1.35,.96,.25,.07,'#a1bdb0','#365b59',.03);
    for(let i=0;i<REQUIRED_CELLS;i++)ellipse(c,-(REQUIRED_CELLS-1)*.05+i*.1,-1.22,.03,.03,done||i<cellsIn(g.save,r)?'#ffdf87':'#3c6461');
    if(done||awake){const a=t*.5;ellipse(c,0,-1.6,.2,.22,done?'#d2f7b2':'#ffe58a');bolt(c,0,-1.61,.3,'#fffce2');}
    c.restore();
  }
  chest(x,y,t){const c=this.c;c.save();c.translate(x,y);ellipse(c,0,.15,.33,.12,'#355e572a');rounded(c,-.27,-.28,.54,.4,.06,'#e8c365','#506c54',.035);rounded(c,-.3,-.32,.6,.16,.04,'#ffdf85','#617453',.025);rounded(c,-.05,-.25,.1,.2,.02,'#698a6c');text(c,'✦',0,-.5+Math.sin(t*2)*.05,.23,'#ffedb4');c.restore();}
  gate(x,y,t){const c=this.c;c.save();c.translate(x,y);for(const v of [-2,2]){rounded(c,-.28,v-.3,.56,.7,.08,'#789c91','#385c57',.04);ellipse(c,0,v,.1,.1,'#ffcf74');}line(c,0,-1.7,0,1.7,'#c9f5ec99',.13);line(c,-.07,-1.7,-.07,1.7,'#edfff4',.025);c.restore();}
  effect(f,t){const c=this.c,p=1-f.life/f.max;c.save();c.globalAlpha=Math.min(1,f.life*5);
    if(f.type==='number'){text(c,f.text,f.x,f.y-p*.65,.22,f.color||'#ffefb2');}
    else if(f.type==='burst'||f.type==='explosion'){
      const big=f.type==='explosion',rad=(f.radius||.5)*(.4+p);
      c.beginPath();c.arc(f.x,f.y,rad,0,Math.PI*2);c.strokeStyle=big?'#fff1b1':'#fff0ae';c.lineWidth=.07*(1-p);c.stroke();
      for(let i=0;i<(big?14:8);i++){const a=i*2.399;const d=rad*(.5+p);ellipse(c,f.x+Math.cos(a)*d,f.y+Math.sin(a)*d,(big?.14:.075)*(1-p),(big?.14:.075)*(1-p),i%2?'#ffb864':'#fff3b5');}
      if(big)ellipse(c,f.x,f.y,rad*.6*(1-p),rad*.6*(1-p),'#ffd76d80');
    }else if(f.type==='arc'){
      for(let layer=0;layer<2;layer++){c.beginPath();c.moveTo(f.x,f.y);for(let i=1;i<8;i++){const v=i/8;const zig=Math.sin(i*17+t*32)*.18;c.lineTo(f.x+(f.tx-f.x)*v+zig,f.y+(f.ty-f.y)*v+zig);}c.lineTo(f.tx,f.ty);c.strokeStyle=layer?'#eeffff':'#72e0ff';c.lineWidth=layer?.035:.12;c.stroke();}
    }else if(f.type==='slam'){
      c.beginPath();c.ellipse(f.x,f.y,p*1.8,p*.9,0,0,Math.PI*2);c.strokeStyle='#ffe794';c.lineWidth=.1*(1-p);c.stroke();for(let i=0;i<5;i++){const a=i*1.25;line(c,f.x+Math.cos(a)*p*.3,f.y+Math.sin(a)*p*.3,f.x+Math.cos(a)*p*1.5,f.y+Math.sin(a)*p*.8,'#f4e5b2',.035);}
    }c.restore();
  }
  map(canvas,g){const c=canvas.getContext('2d'),w=600,h=760;canvas.width=w*2;canvas.height=h*2;c.scale(2,2);c.fillStyle='#19393c';c.fillRect(0,0,w,h);const {scale:s,ox,oy}=atlasLayout();
    rounded(c,ox,oy,WORLD_W*s,WORLD_H*s,8,'#7eb6bd');
    for(let y=0;y<WORLD_H;y++)for(let x=0;x<WORLD_W;x++){const r=regionAt(x,y);c.fillStyle=g.world.water.has(`${x},${y}`)?'#64a8b5':r<0?'#607b87':REGIONS[r].ground;c.fillRect(ox+x*s,oy+y*s,s+.1,s+.1);if(r>=0&&isRoad(x+.5,y+.5)){c.fillStyle='#e1d9a5';c.fillRect(ox+x*s,oy+y*s,s+.1,s+.1);}}
    for(const p of g.world.props)if(p.type==='mountain'&&hash(Math.floor(p.x),Math.floor(p.y))<.04){text(c,'▲',ox+p.x*s,oy+p.y*s,9,'#a5b9bb');}
    for(let r=0;r<5;r++){const o=regionOrigin(r);if(r>unlockedRegion(g.save)){c.fillStyle='#20323dba';c.fillRect(ox+o.x*s,oy+o.y*s,REGION_W*s,REGION_H*s);}text(c,REGIONS[r].name,ox+(o.x+18)*s,oy+(o.y+2)*s,14,r>unlockedRegion(g.save)?'#b4bfbe':'#244f49');}
    for(const site of g.world.sites){const done=g.save.cleared.includes(site.id);ellipse(c,ox+site.x*s,oy+site.y*s,3.3,3.3,done?'#d8f0b5':site.r<=unlockedRegion(g.save)?'#ffdc7d':'#758590');}
    for(let r=0;r<5;r++){const p=relayFor(r),x=ox+p.x*s,y=oy+p.y*s;rounded(c,x-5,y-7,10,14,2,g.save.bosses.includes(r)?'#a7f4cd':'#ee9578','#34534b',1);text(c,g.save.bosses.includes(r)?'✓':'!',x,y+3,10,'#1b3c38');}
    for(const st of g.world.stations)if(g.save.discovered.includes(st.id)){rounded(c,ox+st.x*s-5,oy+st.y*s-5,10,10,2,'#edffe3','#326f59',1);text(c,'+',ox+st.x*s,oy+st.y*s+4,12,'#327859');}
    text(c,'⌂',ox+HOME.x*s,oy+HOME.y*s+5,21,'#fff6c5');ellipse(c,ox+g.player.x*s,oy+g.player.y*s,5.5,5.5,'#fff');ellipse(c,ox+g.player.x*s,oy+g.player.y*s,3.5,3.5,g.save.color);rounded(c,ox,oy,WORLD_W*s,WORLD_H*s,8,null,'#f6f7cb55',2);
  }
}
