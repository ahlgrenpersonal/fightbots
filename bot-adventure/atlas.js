export const ATLAS_WIDTH=600,ATLAS_HEIGHT=760;
const clamp=(v,min,max)=>Math.max(min,Math.min(max,v));

export class AtlasView {
  constructor({initialFocus,initialZoom=1,maxZoom=3,contentBounds}={}){
    this.maxZoom=Number.isFinite(maxZoom)?Math.max(1,maxZoom):3;
    this.contentBounds=contentBounds;
    this.reset();
    this.zoomAt(Number.isFinite(initialZoom)?initialZoom:1);
    if(initialFocus&&Number.isFinite(initialFocus.x)&&Number.isFinite(initialFocus.y)){
      this.x=ATLAS_WIDTH/2-initialFocus.x*this.zoom;
      this.y=ATLAS_HEIGHT/2-initialFocus.y*this.zoom;this.bound();
    }
  }
  reset(){this.zoom=1;this.x=0;this.y=0;this.bound();}
  bound(){
    const b=this.contentBounds||{x:0,y:0,width:ATLAS_WIDTH,height:ATLAS_HEIGHT};
    const axis=(offset,start,size,viewport)=>size*this.zoom<=viewport?(viewport-size*this.zoom)/2-start*this.zoom:clamp(offset,viewport-(start+size)*this.zoom,-start*this.zoom);
    this.x=axis(this.x,b.x,b.width,ATLAS_WIDTH)||0;this.y=axis(this.y,b.y,b.height,ATLAS_HEIGHT)||0;
  }
  fromScreen(p){return {x:(p.x-this.x)/this.zoom,y:(p.y-this.y)/this.zoom};}
  zoomAt(factor,p={x:ATLAS_WIDTH/2,y:ATLAS_HEIGHT/2}){
    const anchor=this.fromScreen(p);this.zoom=clamp(this.zoom*factor,1,this.maxZoom);
    this.x=p.x-anchor.x*this.zoom;this.y=p.y-anchor.y*this.zoom;this.bound();
  }
  pan(dx,dy){this.x+=dx;this.y+=dy;this.bound();}
}

// Keep gesture decisions separate from DOM events so pinch/tap transitions can be tested.
export class AtlasGesture {
  constructor(view,threshold=12){this.view=view;this.threshold=threshold;this.points=new Map();this.moved=false;}
  down(id,p){if(!this.points.size)this.moved=false;this.points.set(id,{...p,start:{...p}});if(this.points.size>1)this.moved=true;}
  move(id,p){
    const old=this.points.get(id);if(!old)return;
    const before=[...this.points.values()];this.points.set(id,{...p,start:old.start});
    const after=[...this.points.values()];
    if(after.length>1){
      const mid=a=>({x:(a[0].x+a[1].x)/2,y:(a[0].y+a[1].y)/2});
      const span=a=>Math.hypot(a[0].x-a[1].x,a[0].y-a[1].y);
      const a=mid(before),b=mid(after),d=span(before);
      if(d>1)this.view.zoomAt(span(after)/d,a);
      this.view.pan(b.x-a.x,b.y-a.y);this.moved=true;
    }else if(this.moved||Math.hypot(p.x-old.start.x,p.y-old.start.y)>this.threshold){
      this.moved=true;this.view.pan(p.x-old.x,p.y-old.y);
    }
  }
  up(id,p,cancelled=false){
    const old=this.points.get(id);if(!old)return null;
    const tap=!cancelled&&!this.moved&&this.points.size===1&&Math.hypot(p.x-old.start.x,p.y-old.start.y)<=this.threshold;
    this.points.delete(id);if(cancelled)this.moved=true;
    return tap?this.view.fromScreen(p):null;
  }
}

export function mountAtlas(canvas,{source,onSelect,onChange,onOverlay,initialFocus,initialZoom=1,maxZoom=3,contentBounds}){
  const view=new AtlasView({initialFocus,initialZoom,maxZoom,contentBounds}),gesture=new AtlasGesture(view),events=new AbortController();
  const options={signal:events.signal};
  const point=e=>{const r=canvas.getBoundingClientRect();return {x:(e.clientX-r.left)*ATLAS_WIDTH/r.width,y:(e.clientY-r.top)*ATLAS_HEIGHT/r.height};};
  function render(){
    const r=canvas.getBoundingClientRect();if(!r.width||!r.height)return;
    const dpr=Math.min(devicePixelRatio||1,2),w=Math.round(r.width*dpr),h=Math.round(r.height*dpr);
    if(canvas.width!==w)canvas.width=w;if(canvas.height!==h)canvas.height=h;
    const c=canvas.getContext('2d');c.setTransform(w/ATLAS_WIDTH,0,0,h/ATLAS_HEIGHT,0,0);
    c.fillStyle='#19393c';c.fillRect(0,0,ATLAS_WIDTH,ATLAS_HEIGHT);
    c.translate(view.x,view.y);c.scale(view.zoom,view.zoom);c.drawImage(source,0,0,ATLAS_WIDTH,ATLAS_HEIGHT);
    onOverlay?.(c,view.zoom);
    onChange(view.zoom);
  }
  canvas.addEventListener('pointerdown',e=>{
    if(e.pointerType==='mouse'&&e.button!==0)return;
    e.preventDefault();gesture.threshold=8*ATLAS_WIDTH/canvas.getBoundingClientRect().width;
    gesture.down(e.pointerId,point(e));canvas.setPointerCapture(e.pointerId);
  },options);
  canvas.addEventListener('pointermove',e=>{if(!gesture.points.has(e.pointerId))return;e.preventDefault();gesture.move(e.pointerId,point(e));render();},options);
  for(const type of ['pointerup','pointercancel','lostpointercapture'])canvas.addEventListener(type,e=>{
    const tap=gesture.up(e.pointerId,point(e),type!=='pointerup');if(tap)onSelect(tap);
  },options);
  canvas.addEventListener('wheel',e=>{e.preventDefault();view.zoomAt(Math.exp(-e.deltaY*.002),point(e));render();},{...options,passive:false});
  const observer=new ResizeObserver(render);observer.observe(canvas);render();
  return {zoomBy(factor){view.zoomAt(factor);render();},reset(){view.reset();render();},destroy(){events.abort();observer.disconnect();}};
}
