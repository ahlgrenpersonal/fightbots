import {BUILD,WEAPONS,SHIELDS,freshSquad,normalizeSlot,normalizeSquad,OPPONENTS,HEALTH_ASSISTS,normalizeHealthBonus} from './data.js?v=roman28';
import {Battle,distance,guardsAgainst,MELEE_TOLERANCE} from './engine.js?v=roman28';
import {drawCourtyard,drawBot,drawGear} from './art.js?v=roman28';
import {icon} from './icons.js?v=roman28';
import {BOT_SIZE} from './geometry.js?v=roman28';
import {drawLandscape as drawAdventureLandscape} from './north/scenery.js?v=roman28';
import {drawCity} from './north/city.js?v=roman28';

const $=id=>document.getElementById(id),SAVE_KEY='roman-bots-settings-v1';
let config={squad:freshSquad(),sound:true,healthBonus:50,opponent:0};
try{const raw=JSON.parse(localStorage.getItem(SAVE_KEY));if(raw){config.squad=normalizeSquad(raw.squad);config.sound=raw.sound!==false;config.healthBonus=raw.healthBonus===undefined&&raw.gentle===false?0:normalizeHealthBonus(raw.healthBonus);if(Number.isInteger(raw.opponent)&&raw.opponent>=0&&raw.opponent<OPPONENTS.length)config.opponent=raw.opponent;}}catch{}
let slot=0,details=false,battle=null,opponent=OPPONENTS[config.opponent],mode='builder',dialogMode='',last=performance.now(),endedAt=0,audio,ambient=0;
let layout={scale:1,ox:0,oy:0,w:1,h:1};
let camera={x:5,y:7.5,zoom:1,holdUntil:0};
const clamp=(n,a,b)=>Math.max(a,Math.min(b,n));
const reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;
let musicUnlocked=false;
let adventureStamp='';
function soundContext(){
  if(!audio){
    audio=new (window.AudioContext||window.webkitAudioContext)();
    const source=audio.createMediaElementSource($('music')),gain=audio.createGain();
    gain.gain.value=.28;source.connect(gain);gain.connect(audio.destination);
  }
  return audio;
}
function syncMusic(){
  const music=$('music');
  if(!config.sound||document.hidden){music.pause();audio?.suspend().catch(()=>{});return;}
  if(!musicUnlocked)return;
  try{soundContext().resume().catch(()=>{});if(music.paused)music.play().catch(()=>{});}catch{}
}
function unlockMusic(event){if(event.isTrusted){musicUnlocked=true;syncMusic();}}
document.addEventListener('pointerup',unlockMusic,{passive:true});
document.addEventListener('click',unlockMusic,{passive:true});
document.addEventListener('keydown',unlockMusic);
function save(){try{localStorage.setItem(SAVE_KEY,JSON.stringify(config));}catch{}}
function tone(frequency,duration=.08,volume=.025,type='triangle',end=frequency){
  if(!config.sound||document.hidden)return;try{soundContext().resume().catch(()=>{});const o=audio.createOscillator(),g=audio.createGain(),now=audio.currentTime;o.type=type;o.frequency.setValueAtTime(frequency,now);o.frequency.exponentialRampToValueAtTime(Math.max(30,end),now+duration);g.gain.setValueAtTime(volume,now);g.gain.exponentialRampToValueAtTime(.001,now+duration);o.connect(g);g.connect(audio.destination);o.start();o.stop(now+duration);}catch{}
}
function event(e){
  if(e.type==='block')tone(1100,.07,.014,'triangle',400);
  if(e.type==='hit')tone(e.weapon==='hammer'?90:290,e.power?.18:.07,e.power?.035:.017,'triangle',65);
  if(e.type==='finished'){endedAt=performance.now();tone(e.winner===0?550:300,.3,.025,'triangle',e.winner===0?900:440);}
}
function previewUnit(build,index=slot){return {...build,id:`preview-${index}`,team:0,captain:index===0,x:0,y:0,angle:-.35,hp:100,maxHp:100,flash:0,guardBroken:0,blockFlash:0};}
function drawPortrait(c,build,index,w,h,t,team=0){
  const u=previewUnit(build,index),bounds={sword:[u.shield==='none'?-40:-60,94,-76,46],spear:[-40,104,-86,46],hammer:[-43,110,-76,46],bow:[-43,96,-76,46]}[u.weapon];
  const [left,right,top,bottom]=bounds,size=Math.min((w-7)*100/(right-left),(h-7)*100/(bottom-top));
  drawBot(c,{...u,team,x:w/2-(left+right)*size/200,y:h/2-(top+bottom)*size/200},t,{size,preview:true});
}
function canvasFrame(canvas,draw){const r=canvas.getBoundingClientRect(),dpr=Math.min(devicePixelRatio||1,2);if(!r.width||!r.height)return;const w=Math.round(r.width*dpr),h=Math.round(r.height*dpr);if(canvas.width!==w)canvas.width=w;if(canvas.height!==h)canvas.height=h;const c=canvas.getContext('2d');c.setTransform(dpr,0,0,dpr,0,0);c.clearRect(0,0,r.width,r.height);draw(c,r.width,r.height);}
function rememberFocus(){
  const active=document.activeElement,key=['slot','weapon','shield'].find(k=>active?.dataset?.[k]!==undefined),id=active?.id;
  return ()=>{const next=id?$(id):key?document.querySelector(`[data-${key}="${active.dataset[key]}"]`):null;if(next&&!next.disabled&&next!==document.activeElement)next.focus({preventScroll:true});};
}
function buildUI(){
  const restoreFocus=rememberFocus();
  $('squadSlots').innerHTML=config.squad.map((s,i)=>`<button class="squad-slot ${i===slot?'selected':''}" data-slot="${i}" aria-label="${i===0?'Captain':`Companion ${i}`}" aria-pressed="${i===slot}"><canvas data-roster="${i}" width="144" height="144" aria-hidden="true"></canvas>${i===0?'<span class="captain-star">★</span>':`<small>${i}</small>`}</button>`).join('');
  $('weapons').innerHTML=Object.entries(WEAPONS).map(([id,w])=>`<button class="gear-option ${config.squad[slot].weapon===id?'selected':''}" data-weapon="${id}" aria-label="${w.name}, ${w.hands} ${w.hands===1?'hand':'hands'}" aria-pressed="${config.squad[slot].weapon===id}"><canvas data-gear="weapon:${id}" width="144" height="144" aria-hidden="true"></canvas><small>${w.name}</small></button>`).join('');
  const twoHands=WEAPONS[config.squad[slot].weapon].hands===2;
  $('shields').innerHTML=Object.entries(SHIELDS).map(([id,s])=>`<button class="gear-option ${config.squad[slot].shield===id?'selected':''}" data-shield="${id}" aria-label="${s.name}${twoHands&&id!=='none'?', needs a free hand':''}" aria-pressed="${config.squad[slot].shield===id}" ${twoHands&&id!=='none'?'disabled':''}><canvas data-gear="shield:${id}" width="144" height="144" aria-hidden="true"></canvas><small>${id==='none'?'None':id==='round'?'Round':'Tower'}</small></button>`).join('');
  $('slotName').textContent=slot===0?'Captain':`Companion ${slot}`;
  const hands=WEAPONS[config.squad[slot].weapon].hands+Number(config.squad[slot].shield!=='none');
  $('handCount').innerHTML=Array.from({length:hands},()=>`<span class="hand-pip">${icon('hand')}</span>`).join('');
  $('handCount').setAttribute('aria-label',`${hands} hands used`);
  $('gearDescription').textContent=`${WEAPONS[config.squad[slot].weapon].description} ${SHIELDS[config.squad[slot].shield].description}`;$('gearDescription').hidden=!details;
  $('opponentName').textContent=opponent.name;
  $('opponentSquad').innerHTML=opponent.squad.map((s,i)=>`<canvas data-opponent="${i}" width="144" height="144" aria-hidden="true"></canvas>`).join('');
  $('info').setAttribute('aria-pressed',String(details));drawBuilder(ambient);restoreFocus();
}
function drawBuilder(t){
  const preview=$('adventurePreview'),r=preview.getBoundingClientRect(),stamp=JSON.stringify([r.width,r.height,devicePixelRatio,config.squad[0]]);
  if(stamp!==adventureStamp){canvasFrame(preview,(c,w,h)=>{
    const scale=w/40,top=120;
    c.save();c.scale(scale,scale);c.translate(-6,-top);
    const state={prologueRound:15};
    drawAdventureLandscape(c,{bounds:{left:6,top,right:46,bottom:top+h/scale},state,time:0});
    drawCity(c,0,state);
    drawBot(c,{...previewUnit(config.squad[0],0),x:26,y:top+h/scale-1.4,angle:-Math.PI/2},0,{size:3.4,preview:true});
    c.restore();
  });adventureStamp=stamp;}
  for(const canvas of document.querySelectorAll('[data-opponent]'))canvasFrame(canvas,(c,w,h)=>{const i=Number(canvas.dataset.opponent);drawPortrait(c,opponent.squad[i],i,w,h,t,1);});
  for(const canvas of document.querySelectorAll('[data-roster]'))canvasFrame(canvas,(c,w,h)=>{const i=Number(canvas.dataset.roster);drawPortrait(c,config.squad[i],i,w,h,t);});
  for(const canvas of document.querySelectorAll('[data-gear]'))canvasFrame(canvas,(c,w,h)=>{const [kind,id]=canvas.dataset.gear.split(':');c.scale(w/64,h/64);drawGear(c,kind,id,t);});
  canvasFrame($('preview'),(c,w,h)=>{
    const floor=c.createLinearGradient(0,0,0,h);floor.addColorStop(0,'#b9d0ce');floor.addColorStop(1,'#edf2e8');c.fillStyle=floor;c.fillRect(0,0,w,h);
    c.strokeStyle='#9bbab166';c.lineWidth=1;for(let y=h*.55;y<h;y+=28){c.beginPath();c.moveTo(0,y);c.lineTo(w,y);c.stroke();}for(let x=-w;x<w*2;x+=70){c.beginPath();c.moveTo(w/2,20);c.lineTo(x,h);c.stroke();}
    c.fillStyle='#799b95';c.beginPath();c.ellipse(w/2,h*.8,w*.24,13,0,0,Math.PI*2);c.fill();c.fillStyle='#f4f2d6';c.beginPath();c.ellipse(w/2,h*.77,w*.24,12,0,0,Math.PI*2);c.fill();
    drawBot(c,{...previewUnit(config.squad[slot]),x:w/2,y:h*.53},t,{size:Math.min(136,h*.76),preview:true});
    for(const side of [-1,1]){const x=w/2+side*w*.39;c.fillStyle='#90aea8';c.fillRect(x-6,h*.26,12,h*.45);c.fillStyle='#e6eee2';c.fillRect(x-9,h*.22,18,8);c.fillRect(x-9,h*.71,18,6);}
  });
}
function startBattle(){
  closeDialog();
  battle=new Battle(config.squad,opponent.squad,{seed:crypto.getRandomValues(new Uint32Array(1))[0],healthBonus:config.healthBonus,onEvent:event});
  mode='battle';endedAt=0;camera={x:5,y:7.5,zoom:1,holdUntil:0};$('builder').hidden=true;$('arena').hidden=false;$('battleControls').hidden=false;$('pause').hidden=false;$('info').hidden=true;$('locationName').textContent=opponent.name;last=performance.now();tone(420,.12,.02,'triangle',650);save();
}
function editSquad(){closeDialog();mode='builder';battle=null;$('builder').hidden=false;$('arena').hidden=true;$('battleControls').hidden=true;$('pause').hidden=true;$('info').hidden=false;$('locationName').textContent='The Marble Courtyard';buildUI();}
function showDialog(title,body,kind){dialogMode=kind;if(battle)battle.paused=true;$('dialogContent').innerHTML=`<div class="dialog-head"><h1 id="dialogTitle">${title}</h1>${kind==='result'?'':`<button class="icon-button" data-action="resume" aria-label="Close" title="Close">${icon('close')}</button>`}</div><div class="dialog-body">${body}</div>`;if(!$('dialog').open)$('dialog').showModal();}
function closeDialog(){if($('dialog').open)$('dialog').close();if(battle)battle.paused=false;dialogMode='';last=performance.now();}
function squadCommand(){return `<span class="squad-command-picture"><canvas class="squad-command-bot" width="96" height="96" aria-hidden="true"></canvas><span class="squad-command-pencil">${icon('pencil')}</span></span><small>Squad</small>`;}
function pause(){if(!battle)return;showDialog('Take a breather',`<div class="dialog-actions"><button class="battle-button" data-action="resume" aria-label="Keep playing">${icon('play')}</button><button class="secondary" data-action="replay">${icon('replay')} Again</button><button class="secondary squad-command" data-action="edit">${squadCommand()}</button><button class="secondary" data-action="advanced">${icon('edit')} Advanced settings</button></div><p class="build-id">${BUILD}</p>`,'pause');}
function advanced(){
  showDialog('Advanced settings',`<label class="assist-label" for="healthBonus">Blue team health${battle?' · next match':''}</label><select id="healthBonus" class="assist-select">${HEALTH_ASSISTS.map(({bonus,winRate})=>`<option value="${bonus}" ${config.healthBonus===bonus?'selected':''}>+${bonus}% health${bonus===0?' (equal teams)':''} · ~${winRate}% wins</option>`).join('')}</select><p class="assist-note" id="assistEstimate">Estimated wins in simulations with occasional power attacks. Results vary with squad and play.</p><label class="settings-row">Sound<input type="checkbox" id="sound" ${config.sound?'checked':''}></label><p class="build-id">${BUILD}</p>`,'advanced');
}
function result(){
  const won=battle.winner===0;showDialog(won?'Laurel champions!':'Ready for another round?',`<canvas id="resultArt" class="result-emblem" width="640" height="290" aria-hidden="true"></canvas><div class="result-actions"><button class="battle-button" data-action="replay" aria-label="Play again">${icon('replay')}<small>Again</small></button><button class="secondary squad-command" data-action="edit" aria-label="Edit squad">${squadCommand()}</button></div>`,'result');
}
function effects(c,b,t){
  for(const effect of b.effects){
    const p=1-effect.life/effect.max;c.save();c.translate(effect.x,effect.y);c.globalAlpha=1-p;
    if(effect.type==='hammer'||effect.type==='power'){c.beginPath();c.ellipse(0,.18,.3+p*.8,.14+p*.35,0,0,Math.PI*2);c.strokeStyle=effect.type==='power'?'#fff6a6':'#a88654';c.lineWidth=.06*(1-p);c.stroke();}
    for(let i=0;i<7;i++){const a=i*Math.PI*2/7+t*.3,r=.1+p*(effect.type==='power'?1:.65);c.beginPath();c.moveTo(Math.cos(a)*r,Math.sin(a)*r);c.lineTo(Math.cos(a)*(r+.13),Math.sin(a)*(r+.13));c.strokeStyle=effect.type==='block'?'#d8ffff':i%2?'#e0a63b':'#fff9d9';c.lineWidth=.06*(1-p);c.stroke();}
    c.restore();
  }
}
function renderBattle(t){
  if(!battle)return;canvasFrame($('battleCanvas'),(c,w,h)=>{
    const base=Math.min(w/10,h/15),living=battle.units.filter(u=>u.hp>0);
    if(living.length&&battle.phase==='battle'&&battle.time>3&&performance.now()>camera.holdUntil&&!battle.paused){
      const xs=living.map(u=>u.x),ys=living.map(u=>u.y),left=Math.min(...xs),right=Math.max(...xs),top=Math.min(...ys),bottom=Math.max(...ys);
      const zoom=clamp(Math.min(w/(right-left+2.6)/base,h/(bottom-top+3)/base),1,1.25),halfW=w/(base*zoom*2),halfH=h/(base*zoom*2);
      const x=halfW>=5?5:clamp((left+right)/2,halfW,10-halfW),y=halfH>=7.5?7.5:clamp((top+bottom)/2,halfH,15-halfH),ease=reduced?1:.045;
      camera.zoom+=(zoom-camera.zoom)*ease;camera.x+=(x-camera.x)*ease;camera.y+=(y-camera.y)*ease;
    }
    const scale=base*camera.zoom,ox=w/2-camera.x*scale,oy=h/2-camera.y*scale;layout={scale,ox,oy,w,h};
    c.fillStyle='#bccfc9';c.fillRect(0,0,w,h);c.translate(ox,oy);c.scale(scale,scale);drawCourtyard(c,t);
    if(battle.goal){c.beginPath();c.arc(battle.goal.x,battle.goal.y,.22+Math.sin(t*4)*.025,0,Math.PI*2);c.strokeStyle='#127b83';c.lineWidth=.07;c.stroke();c.beginPath();c.arc(battle.goal.x,battle.goal.y,.06,0,Math.PI*2);c.fillStyle='#e9c14e';c.fill();}
    const leader=battle.leader();if(leader){c.beginPath();c.ellipse(leader.x,leader.y+.34,.55,.27,0,0,Math.PI*2);c.fillStyle='#6ad8c833';c.fill();c.strokeStyle=battle.powerCd>0?'#538d85':'#e9bb39';c.lineWidth=.05;c.stroke();if(battle.powerCd>0){c.beginPath();c.ellipse(leader.x,leader.y+.34,.55,.27,0,-Math.PI/2,-Math.PI/2+Math.PI*2*(1-Math.min(1,battle.powerCd/1.2)));c.strokeStyle='#e9bb39';c.stroke();}}
    const selected=battle.units.find(u=>u.id===battle.focus&&u.hp>0);
    const ordered=[...battle.units].sort((a,b)=>a.y-b.y);
    for(const u of ordered){
      const target=u.action&&battle.units.find(v=>v.id===u.action.target),strikeTarget=u.action?.contact||(target&&distance(u,target)<=WEAPONS[u.weapon].range+MELEE_TOLERANCE?{...target,guarding:guardsAgainst(target,u)}:null);
      const active=u.hp>0&&u===battle.leader(u.team),visualCaptain=u.captain||active;
      drawBot(c,{...u,strikeTarget},reduced?0:t,{size:BOT_SIZE,promoted:active});
      if(u.hp>0){const width=visualCaptain?.8:.62,y=u.y-(u.weapon==='spear'&&!visualCaptain?1.07:1);c.fillStyle='#254b5366';c.beginPath();c.roundRect(u.x-width/2,y,width,.075,.025);c.fill();c.fillStyle=u.team===0?'#147e71':'#b84659';c.beginPath();c.roundRect(u.x-width/2,y,width*Math.max(0,u.hp/u.maxHp),.075,.025);c.fill();}
    }
    for(const arrow of battle.projectiles){const target=battle.units.find(u=>u.id===arrow.target);if(!target)continue;const a=Math.atan2(target.y-arrow.y,target.x-arrow.x);c.save();c.translate(arrow.x,arrow.y);c.rotate(a);c.strokeStyle=arrow.power?'#fff0a1':'#7c654d';c.lineWidth=arrow.power?.065:.035;c.beginPath();c.moveTo(-.52,0);c.lineTo(-.05,0);c.stroke();c.beginPath();c.moveTo(-.13,-.07);c.lineTo(0,0);c.lineTo(-.13,.07);c.fillStyle='#f9fff3';c.fill();c.restore();}
    effects(c,battle,t);
    if(selected){c.beginPath();for(const side of [-1,1])for(const [y,dy] of [[selected.y-.76,1],[selected.y+.42,-1]]){const x=selected.x+side*.49;c.moveTo(x-side*.17,y);c.lineTo(x,y);c.lineTo(x,y+dy*.17);}c.strokeStyle='#542b3c';c.lineWidth=.13;c.stroke();c.strokeStyle=battle.pendingPower?'#ffe18b':'#ff9d8a';c.lineWidth=.065;c.stroke();}
  });
  const banner=$('battleBanner');banner.hidden=battle.phase!=='ready';if(!banner.hidden)banner.textContent=Math.ceil(battle.ready);
  $('allyStatus').innerHTML=battle.units.filter(u=>u.team===0).map(u=>`<span class="army-pip ${u.hp<=0?'down':''}" style="--health:${Math.max(0,u.hp/u.maxHp)*100}%" aria-label="${u.hp>0?'Ready':'Repairing'}"></span>`).join('');
  $('enemyStatus').innerHTML=battle.units.filter(u=>u.team===1).map(u=>`<span class="army-pip ${u.hp<=0?'down':''}" style="--health:${Math.max(0,u.hp/u.maxHp)*100}%" aria-label="${u.hp>0?'Standing':'Defeated'}"></span>`).join('');
  $('powerStatus').textContent=battle.powerCd>0?`${battle.powerCd.toFixed(1)}s`:'★';
  const currentLeader=battle.leader();$('captainIcon').dataset.unit=currentLeader?.id||'';
  $('powerMeter').setAttribute('aria-label',currentLeader?`Active soldier ${currentLeader.index+1}, ${battle.powerCd>0?'power recharging':'power ready'}`:'No active soldier');
  canvasFrame($('captainIcon'),(c,w,h)=>{if(currentLeader)drawPortrait(c,{...currentLeader,captain:true},0,w,h,t);});
}
function drawResult(t){
  canvasFrame($('resultArt'),(c,w,h)=>{
    const won=battle?.winner===0;
    c.save();c.translate(w/2,h*.64);
    if(won){
      for(const side of [-1,1])for(let i=0;i<7;i++){const a=-Math.PI/2+side*(.45+i*.16),x=Math.cos(a)*63,y=Math.sin(a)*63;c.save();c.translate(x,y);c.rotate(a+side*.6);c.beginPath();c.ellipse(0,0,11,4,0,0,Math.PI*2);c.fillStyle='#c4a243';c.fill();c.restore();}
      for(let i=0;i<15;i++){const x=Math.sin(i*8.2)*120,y=-83+((i*19+(reduced?0:t*22))%108);c.save();c.translate(x,y);c.rotate(i+t);c.fillStyle=['#d5ac42','#449d92','#cf7378'][i%3];c.fillRect(-2,-3,4,6);c.restore();}
      drawBot(c,{...previewUnit(config.squad[0],0),x:16,y:reduced?0:-Math.abs(Math.sin(t*3))*5},t,{size:102,preview:true});
      c.save();c.translate(-86,-45);c.strokeStyle='#866a35';c.lineWidth=3;c.fillStyle='#f3ce67';
      for(const side of [-1,1]){c.beginPath();c.arc(side*16,5,11,-Math.PI/2,Math.PI/2,side<0);c.stroke();}
      c.beginPath();c.moveTo(-20,-10);c.lineTo(20,-10);c.lineTo(15,18);c.quadraticCurveTo(0,33,-15,18);c.closePath();c.fill();c.stroke();c.fillRect(-3,27,6,17);c.fillRect(-18,43,36,6);c.fillStyle='#fff2b1';c.fillRect(-11,-5,5,19);c.restore();
    }else{
      c.fillStyle='#dcebe2';c.beginPath();c.ellipse(0,-6,72,41,0,0,Math.PI*2);c.fill();
      drawBot(c,{...previewUnit(config.squad[0],0),hp:0,x:0,y:-4},t,{size:156,preview:true});
      c.save();c.translate(77,-46);c.fillStyle='#378e7f';c.strokeStyle='#f5fff1';c.lineWidth=3;c.beginPath();c.roundRect(-23,-23,46,46,10);c.fill();c.stroke();c.fillStyle='#f4ffed';c.fillRect(-4,-14,8,28);c.fillRect(-14,-4,28,8);c.restore();
      for(let i=0;i<4;i++){const p=(t*.45+i*.25)%1;c.globalAlpha=1-p;c.fillStyle='#69c6a9';c.beginPath();c.arc(35+p*30,-12-p*35,2.5,0,Math.PI*2);c.fill();}
    }
    c.restore();
  });
}
function frame(now){
  const dt=Math.min(.05,(now-last)/1000);last=now;ambient=reduced?0:now/1000;
  if(mode==='builder')drawBuilder(ambient);else if(battle){battle.tick(dt);renderBattle(ambient);if(battle.phase==='finished'&&endedAt&&now-endedAt>1100&&!$('dialog').open)result();}
  if($('resultArt'))drawResult(ambient);
  for(const canvas of document.querySelectorAll('.squad-command-bot'))canvasFrame(canvas,(c,w,h)=>drawBot(c,{...previewUnit(config.squad[0],0),x:w/2,y:h*.65},ambient,{size:w*.8,preview:true}));
  requestAnimationFrame(frame);
}
function project(point){const rect=$('battleCanvas').getBoundingClientRect();return {x:rect.x+layout.ox+point.x*layout.scale,y:rect.y+layout.oy+point.y*layout.scale};}
$('builder').addEventListener('click',e=>{
  const b=e.target.closest('button');if(!b||b.disabled)return;const scroll=$('builder').scrollTop;
  if(b.dataset.slot!==undefined)slot=Number(b.dataset.slot);
  if(b.dataset.weapon){config.squad[slot]=normalizeSlot({...config.squad[slot],weapon:b.dataset.weapon});tone(500,.04,.012);}
  if(b.dataset.shield)config.squad[slot]=normalizeSlot({...config.squad[slot],shield:b.dataset.shield});
  if(b.id==='nextOpponent'){config.opponent=(config.opponent+1)%OPPONENTS.length;opponent=OPPONENTS[config.opponent];tone(440,.08,.02,'triangle',600);}
  if(b.id==='start'){startBattle();return;}buildUI();$('builder').scrollTop=scroll;save();
});
$('battleCanvas').addEventListener('pointerdown',e=>{
  if(!battle||battle.paused||battle.phase==='finished')return;e.preventDefault();camera.holdUntil=performance.now()+1200;const r=$('battleCanvas').getBoundingClientRect(),point={x:(e.clientX-r.left-layout.ox)/layout.scale,y:(e.clientY-r.top-layout.oy)/layout.scale};
  const enemy=battle.enemyAt(point,layout.scale);if(enemy)battle.tapEnemy(enemy);else battle.moveTo(point);
});
$('pause').onclick=pause;$('settings').onclick=advanced;$('info').onclick=()=>{details=!details;buildUI();};
$('dialog').addEventListener('click',e=>{const action=e.target.closest('[data-action]')?.dataset.action;if(action==='resume')closeDialog();if(action==='replay')startBattle();if(action==='edit')editSquad();if(action==='advanced')advanced();});
$('dialog').addEventListener('cancel',e=>{e.preventDefault();if(dialogMode==='result')editSquad();else closeDialog();});
$('dialog').addEventListener('change',e=>{if(e.target.id==='healthBonus')config.healthBonus=normalizeHealthBonus(Number(e.target.value));if(e.target.id==='sound'){config.sound=e.target.checked;syncMusic();}save();});
document.addEventListener('visibilitychange',()=>{syncMusic();if(document.hidden&&battle&&battle.phase!=='finished'&&!$('dialog').open)pause();});
window.addEventListener('keydown',e=>{
  if(!battle||battle.phase==='finished'||$('dialog').open)return;
  if(e.key==='Escape'){pause();return;}
  if(e.target?.closest?.('button,input,select,textarea,a,[contenteditable="true"]'))return;
  if(e.code==='Space'){e.preventDefault();const leader=battle.leader();if(leader){const target=battle.alive(1).sort((a,b)=>distance(a,leader)-distance(b,leader))[0];if(target)battle.tapEnemy(target);}}
});
$('info').innerHTML=icon('info');$('pause').innerHTML=icon('pause');$('start').innerHTML=`${icon('play')}<b>Battle</b>`;
$('settings').innerHTML=icon('edit');
$('adventureIcon').innerHTML=icon('compass');
$('nextOpponent').innerHTML=icon('next');
canvasFrame($('brandMark'),(c,w,h)=>drawBot(c,{...previewUnit({weapon:'sword',shield:'round'},0),x:w/2,y:h*.65},0,{size:w*.82,preview:true}));
buildUI();requestAnimationFrame(frame);
const localPreview=['127.0.0.1','localhost'].includes(location.hostname);
if('serviceWorker' in navigator&&!localPreview)navigator.serviceWorker.register('./sw.js',{scope:'./',updateViaCache:'none'}).catch(()=>{});
let checkingUpdate=false;
async function checkUpdate(){
  if(mode!=='builder'||checkingUpdate||localPreview)return;
  checkingUpdate=true;
  try{
    const response=await fetch(`./version.json?check=${Date.now()}`,{cache:'no-store'}),live=await response.json();
    if(mode!=='builder')return;
    if(response.ok&&live.build&&live.build!==BUILD){
      const scope=new URL('./',location.href).href;
      if('serviceWorker' in navigator)for(const registration of await navigator.serviceWorker.getRegistrations())if(registration.scope===scope)await registration.unregister();
      if('caches' in window)for(const key of await caches.keys())if(key.startsWith('roman-bots-'))await caches.delete(key);
      if(mode==='builder')location.replace(`./index.html?fresh=${Date.now()}`);
    }
  }catch{}finally{checkingUpdate=false;}
}
checkUpdate();setInterval(checkUpdate,60000);
