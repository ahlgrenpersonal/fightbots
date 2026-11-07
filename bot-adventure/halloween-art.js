// Friendly mechanical costumes keep wheels, weapons and the player's silhouette readable.
const ink='#263a40';
function box(c,x,y,w,h,color){c.fillStyle=color;c.fillRect(x,y,w,h);}
function line(c,x,y,tx,ty,color,width=2){c.beginPath();c.moveTo(x,y);c.lineTo(tx,ty);c.strokeStyle=color;c.lineWidth=width;c.stroke();}
function oval(c,x,y,rx,ry,color){c.beginPath();c.ellipse(x,y,rx,ry,0,0,Math.PI*2);c.fillStyle=color;c.fill();}
function shape(c,points,color){c.beginPath();points.forEach(([x,y],i)=>i?c.lineTo(x,y):c.moveTo(x,y));c.closePath();c.fillStyle=color;c.fill();c.strokeStyle=ink;c.lineWidth=1.5;c.stroke();}
export function robotCostume(c,id){
  if(!id)return;c.save();
  if(id==='zombie'){
    box(c,-22,-26,17,8,'#b5cd80');line(c,-20,-22,-6,-22,ink,1.5);
    for(const x of [-17,-12,-7])line(c,x,-25,x,-19,ink,1.5);
    box(c,9,18,13,8,'#506855');for(const x of [11,16,21])line(c,x,17,x,27,'#d5e2aa',1.8);
    for(const x of [-32,32]){box(c,x-3,-17,6,7,'#b9c8bd');line(c,x-4,-14,x+4,-14,ink,1.5);}
    line(c,-17,9,-7,15,'#d9edbb',2);line(c,-10,6,-15,17,'#d9edbb',2);
  }else if(id==='skeleton'){
    shape(c,[[-22,-23],[-15,-29],[15,-29],[22,-23],[20,4],[12,11],[-12,11],[-20,4]],'#e7e3ce');
    for(const x of [-11,11]){oval(c,x,-12,8,8,ink);oval(c,x,-12,3,3,'#a9f4d6');}
    shape(c,[[-4,0],[0,-6],[4,0]],ink);for(const x of [-10,-3,4])box(c,x,5,5,5,ink);
    for(const side of [-1,1]){line(c,side*4,18,side*21,22,'#e7e3ce',4);line(c,side*5,25,side*19,29,'#e7e3ce',3);}
  }else if(id==='mummy'){
    for(const [y,slant] of [[-24,2],[-18,-1],[5,3],[13,-2],[22,1]]){
      shape(c,[[-24,y],[23,y+slant],[23,y+slant+6],[-24,y+6]],'#e5d7ae');
      line(c,-18,y+2,17,y+slant+2,'#b8a77e',.9);
    }
    shape(c,[[18,20],[25,19],[29,34],[23,32]],'#efe2bd');
    oval(c,-28,-13,3,3,'#9baeb0');oval(c,28,-13,3,3,'#9baeb0');
  }else if(id==='vampire'){
    shape(c,[[-23,-5],[-37,-24],[-32,26],[-22,22]],'#63334e');
    shape(c,[[23,-5],[37,-24],[32,26],[22,22]],'#63334e');
    shape(c,[[-12,7],[-6,7],[-9,16]],'#fff1d5');shape(c,[[6,7],[12,7],[9,16]],'#fff1d5');
    oval(c,0,25,5,5,'#e5808a');box(c,-18,-29,36,5,'#40384e');
  }else if(id==='ghost'){
    // A translucent hood, glowing sensor eyes and scalloped shell keep it mechanical.
    c.beginPath();c.moveTo(-26,24);c.lineTo(-25,-10);c.quadraticCurveTo(-25,-33,0,-33);c.quadraticCurveTo(25,-33,25,-10);
    c.lineTo(27,25);c.lineTo(16,18);c.lineTo(7,28);c.lineTo(-2,20);c.lineTo(-13,28);c.closePath();
    c.fillStyle='#e4fcffe0';c.fill();c.strokeStyle='#5d919f';c.lineWidth=1.8;c.stroke();
    for(const x of [-10,10]){oval(c,x,-12,7,9,'#294956');oval(c,x,-12,2.5,4,'#b5ffff');}
    oval(c,0,7,4,6,'#4f7584');line(c,-18,-2,-18,12,'#91c8d2',1.5);line(c,18,-2,18,12,'#91c8d2',1.5);
    for(const x of [-29,29]){oval(c,x,-5,3,3,'#c4e5e9');line(c,x-2,-5,x+2,-5,ink,1);}
  }else if(id==='pumpkin'){
    oval(c,0,-7,26,25,'#ee9d45');
    for(const x of [-15,15]){c.beginPath();c.ellipse(x*.45,-7,10,24,0,0,Math.PI*2);c.strokeStyle='#b96b32';c.lineWidth=1.5;c.stroke();}
    box(c,-4,-36,8,9,'#7c9a66');line(c,0,-35,6,-39,'#96bb70',3);
    for(const side of [-1,1])shape(c,[[side*5,-13],[side*18,-15],[side*12,-4]],'#fff3a1');
    shape(c,[[-13,6],[-7,8],[-3,4],[2,9],[8,5],[14,4],[10,14],[-9,14]],ink);
    for(const x of [-26,26]){oval(c,x,-6,3,3,'#c9d7cb');line(c,x-2,-6,x+2,-6,ink,1);}
  }
  c.restore();
}
export function halloweenProp(c,p){
  c.save();c.translate(p.x,p.y-.25);c.scale(.018,.018);
  if(p.halloween==='pumpkin'||p.halloween==='ghost'){
    if(p.halloween==='ghost')oval(c,0,36,17,4,'#263a4033');
    robotCostume(c,p.halloween);
  }
  else{
    box(c,-16,-20,32,35,p.halloween==='mummy'?'#d6c899':p.halloween==='vampire'?'#9b779b':p.halloween==='skeleton'?'#dedbc5':'#8ab37a');
    box(c,-12,-16,24,6,'#d6e6bd');box(c,-10,-5,20,12,'#2e4b49');
    for(const x of [-5,5])oval(c,x,0,2,3,'#f9e6a6');
    line(c,0,15,0,23,ink,4);line(c,-13,23,13,23,ink,4);
    if(p.halloween==='mummy')for(const y of [8,13])line(c,-16,y,16,y-3,'#f3e5bf',3);
    if(p.halloween==='vampire')for(const side of [-1,1])shape(c,[[side*16,-9],[side*33,-23],[side*27,-1],[side*16,4]],'#5c405f');
  }
  c.restore();
}
