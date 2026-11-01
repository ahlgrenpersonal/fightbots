export class HoldConfirmation {
  constructor(confirm,duration=2000){this.confirm=confirm;this.duration=duration;this.started=null;}
  begin(now){if(this.started===null)this.started=now;}
  cancel(){this.started=null;}
  advance(now){
    if(this.started===null)return 0;
    const progress=Math.max(0,Math.min(1,(now-this.started)/this.duration));
    if(progress===1){this.started=null;this.confirm();}
    return progress;
  }
}

export function bindHoldConfirmation(button,confirm,env=globalThis){
  const {window,document}=env;
  let frame=0,pointer=null,key=null,disposed=false;
  const gate=new HoldConfirmation(()=>{stop();if(!disposed)confirm();});
  function stop(){env.cancelAnimationFrame(frame);frame=0;gate.cancel();pointer=null;key=null;button.style.setProperty('--hold','0%');}
  function paint(){if(disposed)return;const progress=gate.advance(env.performance.now());if(disposed||gate.started===null)return;button.style.setProperty('--hold',`${progress*100}%`);frame=env.requestAnimationFrame(paint);}
  function begin(){gate.begin(env.performance.now());frame=env.requestAnimationFrame(paint);}
  const events=[];
  const on=(target,type,handler)=>{target.addEventListener(type,handler);events.push(()=>target.removeEventListener(type,handler));};
  on(button,'pointerdown',e=>{if(e.button!==0||e.isPrimary===false||button.disabled||pointer!==null||key!==null)return;e.preventDefault();pointer=e.pointerId;button.setPointerCapture(e.pointerId);begin();});
  on(button,'pointermove',e=>{if(e.pointerId!==pointer)return;const r=button.getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)stop();});
  for(const type of ['pointerup','pointercancel','lostpointercapture'])on(button,type,e=>{if(e.pointerId===pointer)stop();});
  on(button,'keydown',e=>{if(![' ','Enter'].includes(e.key))return;e.preventDefault();if(e.repeat||button.disabled||pointer!==null||key!==null)return;key=e.key;begin();});
  on(button,'keyup',e=>{if(e.key===key){e.preventDefault();stop();}});
  on(button,'click',e=>e.preventDefault());
  on(button,'contextmenu',e=>e.preventDefault());
  on(window,'blur',stop);on(document,'visibilitychange',()=>{if(document.hidden)stop();});
  return ()=>{disposed=true;stop();for(const remove of events)remove();};
}
