import {Campaign,UPGRADE_PRICES,WEST_GATE,SOUTH_DOCK,EAST_DOCK} from './campaign.js?v=roman24';
import * as NORTH from './world.js?v=roman24';
import * as northArt from './scenery.js?v=roman24';
import * as westArt from './west-scenery.js?v=roman24';
import * as southArt from './south-scenery.js?v=roman24';
import * as eastArt from './east-scenery.js?v=roman24';
import {drawBot,drawGear} from '../art.js?v=roman24';
import {BUILD,WEAPONS,SHIELDS} from '../data.js?v=roman24';
import {guardsAgainst,distance,MELEE_TOLERANCE} from '../engine.js?v=roman24';
import {BOT_SIZE} from '../geometry.js?v=roman24';
import {icon} from '../icons.js?v=roman24';
import {drawCity,drawHeroWelcome,ARENA_ENTRY} from './city.js?v=roman24';
import {RouteGesture,previewRoute,nextDestination,hintPoint,drawSignposts} from './navigation.js?v=roman24';

const $=id=>document.getElementById(id),KEY='roman-bots-north-v1',PREFS='roman-bots-north-preferences-v1';
const clamp=(n,a,b)=>Math.max(a,Math.min(b,n)),reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;
let saved=null,prefs={sound:true};
try{saved=JSON.parse(localStorage.getItem(KEY));const p=JSON.parse(localStorage.getItem(PREFS));if(p)prefs.sound=p.sound!==false;}catch{}
let last=performance.now(),saveAt=0,uiAt=0,toastUntil=0,slot=0,panelKind='',nearby=null,audioContext,musicUnlocked=false,saveSuppressed=false,welcomeUntil=0;
let camera={x:NORTH.HOME.x,y:NORTH.HOME.y},layout={scale:30,ox:0,oy:0,width:1,height:1},mapZoom=1;
const game=new Campaign(saved,{onEvent:handleEvent,seed:Date.now()>>>0});
let {HOME,CAMPS,KING,ENCOUNTERS,WIDTH,HEIGHT}=game.world;
const regionArt=()=>game.eastern?eastArt:game.southern?southArt:game.western?westArt:northArt;
let {drawLandscape,drawAtlas}=regionArt();
camera={x:game.leader()?.x||HOME.x,y:game.leader()?.y||HOME.y};
const gesture=new RouteGesture();let preview=[],hintUntil=0,hintTarget=null,hintNext=0,hintWaypoint=null;
function guide(target=nextDestination(game)){hintTarget=target;hintUntil=game.time+8;hintNext=0;}

function save(){if(saveSuppressed)return false;try{localStorage.setItem(KEY,JSON.stringify(game.serialize()));return true;}catch{toast('Save unavailable. Keep this window open.');return false;}}
function toast(message){
  const symbol=/won|peace|secured|general|companion/i.test(message)?'shield':/repair|refill|healthy|refuge|camp/i.test(message)?'heart':/recharg|power/i.test(message)?'bolt':/awaits|welcome|highlands/i.test(message)?'compass':'info';
  const warning=/save unavailable|could not|cancelled/i.test(message);
  $('toast').classList.toggle('warning',warning);if(warning)$('toast').textContent=message;else $('toast').innerHTML=icon(symbol);$('toast').setAttribute('aria-label',message);$('toast').hidden=false;toastUntil=performance.now()+(warning?6000:1800);
}
function handleEvent(e){
  if(e.type==='region'){
    ({HOME,CAMPS,KING,ENCOUNTERS,WIDTH,HEIGHT}=game.world);
    ({drawLandscape,drawAtlas}=regionArt());gesture.cancel();preview=[];hintTarget=null;
    camera={x:game.leader().x,y:game.leader().y};
    toast(game.eastern?'The Aegean awaits!':game.southern?'Carthage awaits!':game.western?'The Amber Highlands':'Welcome back to Rome');saveAt=0;
  }
  if(e.type==='workshop'){saveAt=0;queueMicrotask(()=>{if(!$('panel').open&&game.nearbyCamp()?.id===HOME.id)showWorkshop();});}
  if(e.type==='voyage'){gesture.cancel();preview=[];hintTarget=null;saveAt=0;}
  if(e.type==='refuge'){toast('A safe refuge. Rest and refill here.');saveAt=0;}
  if(e.type==='hero'){welcomeUntil=game.time+9;toast('Rome welcomes its new general!');tone(440,1100,.7);saveAt=0;}
  if(e.type==='promoted'){toast('A new companion joins you!');tone(440,880,.4);saveAt=0;}
  if(e.type==='trialFinished'){toast(e.won?'Round won!':'Free repairs. Ready to try again?');tone(e.won?500:350,e.won?900:500,.3);saveAt=0;}
  if(e.type==='cleared'){toast(`Clearing secured · +${e.reward||0} coins`);tone(520,850,.2);saveAt=0;const u=game.leader();if(u)for(let i=0;i<9;i++)game.effects.push({type:'coin',x:u.x+Math.sin(i*2.4)*1.4,y:u.y+Math.cos(i*2.4),life:1.6,max:1.6});}
  if(e.type==='camp'){toast('A new refuge!');tone(420,740,.3);saveAt=0;}
  if(e.type==='rest'){toast('Squad repaired. Packs refilled.');tone(400,800,.4);saveAt=0;for(const u of game.units.filter(u=>u.team===0))game.effects.push({type:'repair',x:u.x,y:u.y,life:2,max:2});}
  if(e.type==='recovered'){toast('Safe at camp. Your equipment is still yours.');saveAt=0;}
  if(e.type==='complete'){toast('Region complete');tone(500,1100,.6);saveAt=0;const u=game.leader();if(u)for(let i=0;i<16;i++)game.effects.push({type:'coin',x:u.x+Math.sin(i*2.4)*2,y:u.y+Math.cos(i*2.4)*1.5,life:2.5,max:2.5});}
  if(e.type==='hit')tone(e.weapon==='hammer'?100:250,65,.06);
  if(e.type==='block')tone(880,400,.04);
}
function tone(start,end,duration){
  if(!prefs.sound||document.hidden||!musicUnlocked)return;
  try{const a=context(),o=a.createOscillator(),g=a.createGain(),now=a.currentTime;o.type='triangle';o.frequency.setValueAtTime(start,now);o.frequency.exponentialRampToValueAtTime(end,now+duration);g.gain.setValueAtTime(.018,now);g.gain.exponentialRampToValueAtTime(.001,now+duration);o.connect(g);g.connect(a.destination);o.start();o.stop(now+duration);}catch{}
}
function context(){return audioContext||(audioContext=new(window.AudioContext||window.webkitAudioContext)());}
function syncSound(){const music=$('music');music.volume=.22;if(!prefs.sound||document.hidden||$('panel').open){music.pause();return;}if(musicUnlocked){context().resume().catch(()=>{});music.play().catch(()=>{});}}
document.addEventListener('pointerup',e=>{if(e.isTrusted){musicUnlocked=true;syncSound();}},{passive:true});
document.addEventListener('visibilitychange',()=>{save();syncSound();last=performance.now();});
window.addEventListener('pagehide',save);

function frame(canvas,draw){const r=canvas.getBoundingClientRect();if(!r.width||!r.height)return;const dpr=Math.min(devicePixelRatio||1,2),w=Math.round(r.width*dpr),h=Math.round(r.height*dpr);if(canvas.width!==w)canvas.width=w;if(canvas.height!==h)canvas.height=h;const c=canvas.getContext('2d');c.setTransform(dpr,0,0,dpr,0,0);c.clearRect(0,0,r.width,r.height);draw(c,r.width,r.height);}
function portrait(c,w,h,build,index=0){
  const size=Math.min(w/1.6,h/1.5);drawBot(c,{...build,x:w*.43,y:h*.62,team:0,captain:index===0,angle:-.35,hp:1,maxHp:1,weaponTier:game.state.weaponTier,armorTier:game.state.armorTier},reduced?0:performance.now()/1000,{size,preview:true});
}
function drawWestGate(c,t){
  c.save();c.translate(WEST_GATE.x,WEST_GATE.y);
  c.fillStyle='#dfd6b4';c.strokeStyle='#617e7a';c.lineWidth=.08;
  for(const y of [-2.5,1.7]){c.fillRect(-.8,y,1.6,.8);c.strokeRect(-.8,y,1.6,.8);c.fillStyle='#f0e8c8';c.fillRect(-.95,y-.15,1.9,.2);}
  c.strokeStyle=game.prologueComplete?'#e7b857':'#6f8580';c.lineWidth=.16;c.beginPath();c.moveTo(.2,-1.45);c.lineTo(-.6,0);c.lineTo(.2,1.45);c.stroke();
  if(game.prologueComplete){c.fillStyle='#ffe291';for(let i=0;i<3;i++){const p=(t*.4+i/3)%1;c.globalAlpha=1-p;c.beginPath();c.arc(-.7-p*.6,(i-1)*.65,.07,0,Math.PI*2);c.fill();}}
  c.restore();
}
function drawArrivalMarkers(c,t){
  for(const site of game.interactionSites().filter(s=>s.action==='gate'||s.action==='ship')){
    if(Math.abs(site.x-camera.x)>10||Math.abs(site.y-camera.y)>15)continue;
    c.save();c.translate(site.x,site.y);c.lineWidth=.07;c.strokeStyle='#244c55';c.fillStyle='#ffe28b';
    c.beginPath();c.ellipse(0,.1,.57,.46,0,0,Math.PI*2);c.fill();c.stroke();
    c.lineWidth=.075;c.beginPath();
    if(site.action==='ship'){c.moveTo(-.35,.12);c.lineTo(-.2,.32);c.lineTo(.22,.32);c.lineTo(.35,.12);c.closePath();c.fillStyle='#2c6978';c.fill();c.stroke();c.beginPath();c.moveTo(-.04,.1);c.lineTo(-.04,-.35);c.stroke();c.beginPath();c.moveTo(.03,-.3);c.lineTo(.29,.04);c.lineTo(.03,.04);c.closePath();c.fillStyle='#fff8df';c.fill();}
    else{const dir=game.western?1:-1;c.moveTo(-dir*.27,.08);c.lineTo(dir*.29,.08);c.lineTo(dir*.05,-.15);c.moveTo(dir*.29,.08);c.lineTo(dir*.05,.31);}
    c.stroke();c.globalAlpha=.4+Math.sin(t*3)*.2;c.beginPath();c.ellipse(0,.1,.7,.56,0,0,Math.PI*2);c.stroke();c.restore();
  }
}
function render(t){
  frame($('world'),(c,w,h)=>{
    if(game.voyage){(game.eastern||game.voyage.to==='east'?eastArt:southArt).drawVoyage(c,w,h,{time:reduced?0:t,progress:1-game.voyage.remaining/14,units:game.units,state:game.state});return;}
    const leader=game.leader();if(leader&&gesture.id===null){const ease=reduced?1:.12;camera.x+=(leader.x-camera.x)*ease;camera.y+=(leader.y-camera.y)*ease;}
    const scale=clamp(w/12.2,26,45),halfW=w/scale/2,halfH=h/scale/2;
    camera.x=clamp(camera.x,halfW,WIDTH-halfW);camera.y=clamp(camera.y,h*.52/scale,HEIGHT-h*.48/scale);
    const ox=w/2-camera.x*scale,oy=h*.52-camera.y*scale;layout={scale,ox,oy,width:w,height:h};
    c.save();c.translate(ox,oy);c.scale(scale,scale);
    drawLandscape(c,{bounds:{left:camera.x-halfW-3,top:camera.y-halfH-4,right:camera.x+halfW+3,bottom:camera.y+halfH+4},time:reduced?0:t,state:{...game.state,conquered:game.regionComplete}});
    if(game.state.region==='north'&&camera.y+halfH>128){drawCity(c,reduced?0:t,game.state);drawWestGate(c,t);southArt.drawRomanDock(c,reduced?0:t,game.prologueComplete);eastArt.drawRomanDock(c,reduced?0:t,game.prologueComplete);}
    if(!game.trial)drawArrivalMarkers(c,t);
    if(!game.trial)drawSignposts(c,game.world,{left:camera.x-halfW,top:camera.y-halfH,right:camera.x+halfW,bottom:camera.y+halfH});
    if(preview.length){c.save();c.strokeStyle='#214c50bb';c.lineWidth=.16;c.beginPath();preview.forEach((p,i)=>i?c.lineTo(p.x,p.y):c.moveTo(p.x,p.y));c.stroke();c.setLineDash([.08,.27]);c.strokeStyle='#ffeb9a';c.lineWidth=.09;c.stroke();c.setLineDash([]);const end=preview.at(-1);c.fillStyle='#ffe59b';c.strokeStyle='#244e52';c.lineWidth=.06;c.beginPath();c.arc(end.x,end.y,.22,0,Math.PI*2);c.fill();c.stroke();c.restore();}
    if(leader&&hintTarget&&t<hintUntil){if(t>=hintNext){hintWaypoint=hintPoint(game,hintTarget);hintNext=t+.5;}const p=hintWaypoint||hintTarget,a=Math.atan2(p.y-leader.y,p.x-leader.x);c.save();c.translate(leader.x+Math.cos(a)*1.3,leader.y+Math.sin(a)*1.3);c.rotate(a);c.fillStyle='#ffdf77';c.strokeStyle='#244e52';c.lineWidth=.06;c.beginPath();c.moveTo(.38,0);c.lineTo(-.22,-.28);c.lineTo(-.09,0);c.lineTo(-.22,.28);c.closePath();c.fill();c.stroke();c.restore();}
    if(game.goal){c.strokeStyle='#ffe28c';c.lineWidth=.07;c.beginPath();c.arc(game.goal.x,game.goal.y,.25,0,Math.PI*2);c.stroke();}
    for(const u of [...game.units].sort((a,b)=>a.y-b.y)){
      if(Math.abs(u.x-camera.x)>halfW+3||Math.abs(u.y-camera.y)>halfH+3)continue;
      if(u.hp<=0&&u.team===1)continue;
      const active=u===leader,target=u.action&&game.units.find(v=>v.id===u.action.target),strikeTarget=u.action?.contact||(target&&distance(u,target)<=WEAPONS[u.weapon].range+MELEE_TOLERANCE?{...target,guarding:guardsAgainst(target,u)}:null);
      if(active){c.fillStyle='#70efba55';c.strokeStyle='#ffe17d';c.lineWidth=.075;c.beginPath();c.ellipse(u.x,u.y+.32,.63,.29,0,0,Math.PI*2);c.fill();c.stroke();}
      if(u.team===0&&u.hp>0&&game.chargeTime>0){c.strokeStyle='#ffdf8588';c.lineWidth=.08;c.beginPath();c.ellipse(u.x,u.y+.22,.68,.28,0,t*2,t*2+Math.PI*1.5);c.stroke();for(let i=0;i<3;i++){const a=t*3+i*Math.PI*2/3;c.fillStyle='#fff2b4';c.fillRect(u.x+Math.cos(a)*.5-.035,u.y-.4+Math.sin(a)*.25,.07,.13);}}
      drawBot(c,{...u,strikeTarget,faction:u.team===1&&!game.trial?(game.eastern?'greek':game.southern?'punic':game.western?'highland':'forest'):undefined,weaponTier:u.team===0?game.state.weaponTier:0,armorTier:u.team===0?game.state.armorTier:0},reduced?0:t,{size:BOT_SIZE*(u.boss?1.5:u.champion?1.2:1),promoted:active});
      if(u.hp>0){const ratio=u.hp/u.maxHp,bw=u.boss?1.2:.75,by=u.y-(u.boss?1.48:1.04);c.fillStyle='#183d3c';c.fillRect(u.x-bw/2,by,bw,.095);c.fillStyle=u.team===1?'#f3836e':ratio<.2?'#fa8b63':ratio<.5?'#ffd36a':'#8fe0a5';c.fillRect(u.x-bw/2,by,bw*ratio,.095);}
    }
    for(const shot of game.projectiles){const target=game.units.find(u=>u.id===shot.target),owner=game.units.find(u=>u.id===shot.owner);if(!target)continue;const a=Math.atan2(target.y-shot.y,target.x-shot.x),fire=owner?.team===0&&game.state.weaponTier>=3;c.save();c.translate(shot.x,shot.y);c.rotate(a);if(fire){c.strokeStyle='#ff9a4366';c.lineWidth=.18;c.beginPath();c.moveTo(-.65,0);c.lineTo(0,0);c.stroke();for(let i=0;i<3;i++){c.fillStyle=i%2?'#ffe68c':'#ffb94c';c.fillRect(-.18-i*.18,-.04+Math.sin(t*20+i)*.05,.09,.06);}}c.strokeStyle=fire?'#ffd973':shot.power?'#fff3ad':'#e6bb72';c.lineWidth=shot.power||fire?.085:.055;c.beginPath();c.moveTo(-.5,0);c.lineTo(0,0);c.stroke();c.fillStyle='#fff4d0';c.beginPath();c.moveTo(.1,0);c.lineTo(-.1,-.08);c.lineTo(-.1,.08);c.fill();c.restore();}
    for(const e of game.effects){const p=1-e.life/e.max;if(!Number.isFinite(p))continue;c.save();c.globalAlpha=1-p;if(e.type==='coin'){c.fillStyle='#ffdb68';c.strokeStyle='#87662f';c.lineWidth=.035;c.beginPath();c.ellipse(e.x,e.y-p*1.5,.12,.17,0,0,Math.PI*2);c.fill();c.stroke();c.fillStyle='#fff3bb';c.fillRect(e.x-.035,e.y-p*1.5-.1,.035,.12);c.restore();continue;}c.strokeStyle=e.type==='repair'?'#cbffd1':e.type==='block'?'#c2f7ef':e.type==='power'?'#fff0a4':'#ffd178';c.lineWidth=.07*(1-p);c.beginPath();c.ellipse(e.x,e.y,.15+p*.85,.08+p*.4,0,0,Math.PI*2);c.stroke();if(e.type==='repair'){const y=e.y-.8-p;c.lineWidth=.09;c.beginPath();c.moveTo(e.x-.16,y);c.lineTo(e.x+.16,y);c.moveTo(e.x,y-.16);c.lineTo(e.x,y+.16);c.stroke();}else for(let i=0;i<5;i++){const a=i*Math.PI*2/5;c.beginPath();c.moveTo(e.x+Math.cos(a)*p*.5,e.y+Math.sin(a)*p*.5);c.lineTo(e.x+Math.cos(a)*p*.9,e.y+Math.sin(a)*p*.9);c.stroke();}c.restore();}
    if(game.state.region==='north'&&game.prologueComplete&&leader)drawHeroWelcome(c,leader,reduced?0:t,Math.max(0,welcomeUntil-t));
    c.restore();
  });
  if(t>uiAt){updateHUD();uiAt=t+.18;}
  if($('panel').open&&panelKind!=='atlas')drawPanel();
  if(performance.now()>toastUntil)$('toast').hidden=true;
}
function updateHUD(){
  $('coins').textContent=game.state.coins;
  const leader=game.leader();
  $('region').setAttribute('aria-label',game.world.HOME.name||'Roman Bots');
  $('region').textContent=BUILD;
  const friends=game.units.filter(u=>u.team===0);
  if($('health').children.length!==friends.length)$('health').innerHTML=friends.map(u=>`<div class="health-bot" data-health="${u.id}" aria-label="Soldier ${u.index+1} health"><canvas width="96" height="96" aria-hidden="true"></canvas><span class="health-track"><i></i></span></div>`).join('');
  for(const el of $('health').children){const u=friends.find(v=>v.id===el.dataset.health);if(!u)continue;const ratio=u.hp/u.maxHp;el.className=`health-bot ${ratio<.2?'critical':ratio<.5?'hurt':''}`;el.querySelector('i').style.width=`${Math.max(0,ratio)*100}%`;el.setAttribute('aria-label',`Soldier ${u.index+1}: ${Math.round(Math.max(0,ratio)*100)}% health`);frame(el.querySelector('canvas'),(c,w,h)=>portrait(c,w,h,u,u.index));}
  nearby=null;$('context').hidden=true;
  const repair=game.state.utility==='repair',cooldown=game.utilityCd>0?`${Math.ceil(game.utilityCd)}s`:null;$('utility').innerHTML=icon(repair?'heart':'bolt')+`<b>${game.chargeTime>0?Math.ceil(game.chargeTime):cooldown|| (repair?game.state.utilityLeft:'×2')}</b>`;
  $('utility').classList.toggle('cooldown',game.utilityCd>0&&!game.chargeTime||repair&&game.state.utilityLeft<=0);
  for(const id of ['home','workshop','atlas','utility'])$(id).disabled=!!game.voyage||id!=='utility'&&!!game.trial;
  if(game.voyage)$('context').hidden=true;
  $('utility').setAttribute('aria-label',repair?'Use repair pack':'Activate power charge');
  $('utility').title=repair?'Use repair pack':'Activate power charge';
  $('sound').innerHTML=icon(prefs.sound?'volume':'muted');$('sound').setAttribute('aria-label',prefs.sound?'Sound on':'Sound off');
  $('campSeals').classList.toggle('trial-progress',game.state.prologueRound<15);
  $('campSeals').hidden=!!game.voyage;
  $('campSeals').innerHTML=game.state.prologueRound<15?Array.from({length:15},(_,i)=>`<i class="${i<game.state.prologueRound?'won':''}"></i>`).join(''):CAMPS.map(p=>`<span class="${game.state.camps.includes(p.id)?'found':''}">${icon('tent')}</span>`).join('');
}

function openPanel(title,kind,body){gesture.cancel();preview=[];panelKind=kind;game.paused=true;$('panel').dataset.kind=kind;$('panelTitle').setAttribute('aria-label',title);if(kind==='settings'||kind==='confirm')$('panelTitle').textContent=title;else $('panelTitle').innerHTML=icon(kind==='workshop'||kind==='forge'?'shield':kind==='atlas'||kind==='cityMap'?'map':kind==='victory'?'shield':'pause');$('panelBody').innerHTML=body;if(!$('panel').open)$('panel').showModal();updateHUD();syncSound();drawPanel();}
function closePanel(){if($('panel').open)$('panel').close();panelKind='';game.paused=false;last=performance.now();save();syncSound();}
function showWorkshop(){
  const camp=game.nearbyCamp();
  if(game.eastern&&camp&&camp.id!==HOME.id&&game.state.refuges.includes(camp.id)){
    game.restAt(camp.id);
    openPanel(camp.name,'forge',`<div class="upgrades">${['weapon','armor','utility'].map(kind=>{const tier=game.state[`${kind}Tier`],cost=upgradeCost(kind,tier);return `<button class="upgrade" data-upgrade="${kind}" ${tier>=(kind==='utility'?2:3)||game.state.coins<cost?'disabled':''} aria-label="Upgrade ${kind}">${icon(kind==='weapon'?'sword':kind==='armor'?'shield':'heart')}<span class="tiers">${Array.from({length:kind==='utility'?3:4},(_,i)=>`<i class="${i<=tier?'lit':''}"></i>`).join('')}</span><small>${kind==='weapon'?'Weapons':kind==='armor'?'Armor':'Supplies'}</small><b>${tier>=(kind==='utility'?2:3)?'✓':`◆ ${cost}`}</b></button>`;}).join('')}</div><button class="wide" data-action="close" aria-label="Done">${icon('play')}</button>`);
    return;
  }
  const leader=game.leader();if(!leader||distance(leader,HOME)>=3){guide(HOME);closePanel();return;}
  game.restAt(HOME.id);slot=Math.min(slot,game.earnedCount-1);
  openPanel('The home workshop','workshop',`<div class="slot-row" style="--slots:${Math.max(3,game.earnedCount)}">${game.state.squad.slice(0,game.earnedCount).map((s,i)=>`<button class="slot ${i===slot?'selected':''}" data-slot="${i}" aria-label="${i===0?'Captain':`Companion ${i}`}" aria-pressed="${i===slot}"><canvas data-portrait="${i}" width="160" height="160"></canvas>${i===0?'<span class="star">★</span>':''}</button>`).join('')}</div><canvas id="preview" class="preview" width="600" height="320" aria-label="Selected soldier"></canvas><h2 aria-label="Weapon">${icon('sword')}</h2><div class="choices">${Object.entries(WEAPONS).map(([id,w])=>`<button class="choice ${game.state.squad[slot].weapon===id?'selected':''}" data-weapon="${id}" aria-label="${w.name}"><canvas data-gear="weapon:${id}" width="128" height="128"></canvas><small>${w.name}</small></button>`).join('')}</div><h2 aria-label="Shield">${icon('shield')}</h2><div class="choices shields">${Object.entries(SHIELDS).map(([id,s])=>`<button class="choice ${game.state.squad[slot].shield===id?'selected':''}" data-shield="${id}" aria-label="${s.name}" ${WEAPONS[game.state.squad[slot].weapon].hands===2&&id!=='none'?'disabled':''}><canvas data-gear="shield:${id}" width="128" height="128"></canvas><small>${id==='none'?'None':id==='round'?'Round':'Tower'}</small></button>`).join('')}</div><h2 aria-label="Forge">${icon('edit')}</h2><div class="upgrades">${['weapon','armor','utility'].map(kind=>{const tier=game.state[`${kind}Tier`],cost=upgradeCost(kind,tier);return `<button class="upgrade" data-upgrade="${kind}" ${tier>=(kind==='utility'?2:3)||game.state.coins<cost?'disabled':''} aria-label="Upgrade ${kind}">${icon(kind==='weapon'?'sword':kind==='armor'?'shield':'heart')}<span class="tiers">${Array.from({length:kind==='utility'?3:4},(_,i)=>`<i class="${i<=tier?'lit':''}"></i>`).join('')}</span><small>${kind==='weapon'?'Weapons':kind==='armor'?'Armor':'Supplies'}</small><b>${tier>=(kind==='utility'?2:3)?'✓':`◆ ${cost}`}</b></button>`;}).join('')}</div><h2 aria-label="Pack">${icon('heart')}</h2><div class="row">${['repair','charge'].map(id=>`<button class="choice ${game.state.utility===id?'selected':''}" style="flex:1" data-utility="${id}">${icon(id==='repair'?'heart':'bolt')}<small>${id==='repair'?'Repair packs':'Power charge'}</small></button>`).join('')}</div><button class="wide" data-action="close" aria-label="Done">${icon('play')}</button>`);
}
function upgradeCost(kind,tier){return UPGRADE_PRICES[kind][tier];}
function drawPanel(){
  if(panelKind==='cityMap'&&$('mapCanvas')){const canvas=$('mapCanvas');canvas.style.height=Math.max(130,canvas.getBoundingClientRect().width*20/52)+'px';frame(canvas,(c,w,h)=>{const scale=Math.min(w/52,h/20);c.save();c.translate((w-52*scale)/2,(h-20*scale)/2);c.scale(scale,scale);c.translate(0,-128);northArt.drawLandscape(c,{bounds:{left:0,top:128,right:52,bottom:148},state:game.state,time:0});drawCity(c,0,game.state);const u=game.leader();if(u){c.fillStyle='#ffe383';c.strokeStyle='#183f50';c.lineWidth=.13;c.beginPath();c.ellipse(u.x,u.y+.3,1.4,.75,0,0,Math.PI*2);c.fill();c.stroke();drawBot(c,{...u,weaponTier:game.state.weaponTier,armorTier:game.state.armorTier},0,{size:2.7,promoted:true});}c.restore();});}
  if(panelKind==='victory'&&$('victoryArt'))frame($('victoryArt'),(c,w,h)=>{portrait(c,w,h,game.state.squad[0],0);});
  if(panelKind==='workshop'){
    for(const el of document.querySelectorAll('[data-portrait]')){const i=Number(el.dataset.portrait);frame(el,(c,w,h)=>portrait(c,w,h,game.state.squad[i],i));}
    for(const el of document.querySelectorAll('[data-gear]'))frame(el,(c,w,h)=>{const[kind,id]=el.dataset.gear.split(':');c.scale(w/64,h/64);drawGear(c,kind,id,game.time,game.state.weaponTier);});
    if($('preview'))frame($('preview'),(c,w,h)=>portrait(c,w,h,game.state.squad[slot],slot));
  }
  if(panelKind==='atlas'&&$('mapCanvas')){
    const canvas=$('mapCanvas');
    if(regionArt().atlasAspect)canvas.style.height=clamp(canvas.getBoundingClientRect().width/regionArt().atlasAspect({...game.state,conquered:game.regionComplete,atlasOverview:mapZoom===0},game.leader())+48,160,440)+'px';
    frame(canvas,(c,w,h)=>{drawAtlas(c,w,h,{...game.state,conquered:game.regionComplete,atlasOverview:mapZoom===0},game.leader());});
  }
}
function atlas(showOverview=false){
  mapZoom=showOverview===true?0:1;
  if(!game.prologueComplete){openPanel('The Eternal City','cityMap','<canvas id="mapCanvas" class="atlas" width="800" height="1100" aria-label="City map"></canvas>');return;}
  const active=CAMPS.findIndex(c=>!game.state.camps.includes(c.id));
  const district=game.eastern?game.world.LANDSCAPES.findIndex(p=>(game.leader()?.y??HOME.y)>=p.top&&(game.leader()?.y??HOME.y)<p.bottom):-1;
  const shown=game.eastern&&mapZoom&&district>=0?[CAMPS[district]]:game.western||game.southern||game.eastern?CAMPS.filter((c,i)=>active<0||i<=active||game.state.refuges.includes(c.id)):CAMPS;
  const title=game.eastern?(mapZoom&&district>=0?game.world.LANDSCAPES[district].name:'The Aegean Realms'):game.southern?'Carthage':game.western?'The Amber Highlands':'The Northern Wilds';
  const modeLabel=mapZoom?'Show explored coast':'Show nearby district';
  openPanel(title,'atlas',(game.eastern?`<div class="atlas-tools"><button class="square" data-action="atlasView" aria-label="${modeLabel}" title="${modeLabel}">`+icon(mapZoom?'map':'compass')+'</button></div>':'')+'<canvas id="mapCanvas" class="atlas" width="800" height="1100" aria-label="Map of the journey"></canvas><div class="seal-row" aria-label="Camp progress">'+shown.map(p=>{const status=game.campStatus(p.id);return `<span data-camp-progress="${p.id}">${icon('tent')}${game.western||game.southern||game.eastern?`<small>${status.cleared} / ${status.required}</small>`:''}</span>`;}).join('')+'</div>');
}
function settings(){openPanel('Adventure settings','settings',`<label class="setting">Squad size<select id="squadSize"><option value="3" ${game.state.squadSize===3?'selected':''}>Captain + 2 companions</option><option value="5" ${game.state.squadSize===5?'selected':''}>Captain + 4 companions</option></select></label><p>Changing your squad takes effect at home. The courtyard game is unchanged.</p><button class="wide quiet" data-action="courtyard">${icon('sword')} Courtyard battle</button><button class="wide quiet" data-action="restart">${icon('replay')} <span class="red">Start this adventure again</span></button>${localStorage.getItem(KEY+'-backup')?'<button class="wide quiet" data-action="restore">Restore previous adventure</button>':''}<p class="build">roman24 · Northern adventure</p>`);}
function pause(){openPanel('Take a breather','pause',`<button class="wide" data-action="close" aria-label="Keep playing">${icon('play')}</button><button class="wide quiet" data-action="atlas" aria-label="Map">${icon('map')}</button><button class="wide quiet" data-action="settings" aria-label="Advanced settings">${icon('edit')}</button>`);}

$('panelBody').addEventListener('click',e=>{
  const b=e.target.closest('button');if(!b||b.disabled)return;
  const scroll=$('panel').scrollTop;
  if(b.dataset.slot!==undefined){slot=Number(b.dataset.slot);showWorkshop();}
  if(b.dataset.weapon){game.setLoadout(slot,{...game.state.squad[slot],weapon:b.dataset.weapon});showWorkshop();}
  if(b.dataset.shield){game.setLoadout(slot,{...game.state.squad[slot],shield:b.dataset.shield});showWorkshop();}
  if(b.dataset.utility){game.setUtility(b.dataset.utility);showWorkshop();}
  if(b.dataset.upgrade){if(game.upgrade(b.dataset.upgrade)){tone(500,1000,.3);save();}showWorkshop();}
  if(b.dataset.action==='close')closePanel();
  if(b.dataset.action==='atlas')atlas();
  if(b.dataset.action==='atlasView'&&game.eastern){atlas(mapZoom!==0);$('panelBody').querySelector('[data-action="atlasView"]')?.focus?.();}
  if(b.dataset.action==='settings')settings();
  if(b.dataset.action==='courtyard'){save();location.href='../index.html?v=roman24';}
  if(b.dataset.action==='restart')openPanel('Start again?','confirm','<p>This starts the northern adventure from the beginning. Your current adventure will be kept as one recovery save.</p><button class="wide quiet" data-action="close">Keep playing</button><button class="wide" data-action="confirmRestart"><span class="red">Save this journey and restart</span></button>');
  if(b.dataset.action==='confirmRestart'){try{localStorage.setItem(KEY+'-backup',JSON.stringify(game.serialize()));saveSuppressed=true;localStorage.removeItem(KEY);location.reload();}catch{saveSuppressed=false;toast('Could not save a recovery copy. Restart cancelled.');}}
  if(b.dataset.action==='restore')openPanel('Restore the previous journey?','confirm','<p>This replaces your current northern adventure with the recovery save.</p><button class="wide quiet" data-action="close">Keep playing</button><button class="wide" data-action="confirmRestore">Restore previous adventure</button>');
  if(b.dataset.action==='confirmRestore'){try{const backup=localStorage.getItem(KEY+'-backup');if(backup){const valid=new Campaign(JSON.parse(backup));saveSuppressed=true;localStorage.setItem(KEY,JSON.stringify(valid.serialize()));location.reload();}}catch{saveSuppressed=false;toast('Recovery save could not be read.');}}
  if($('panel').open)$('panel').scrollTop=scroll;
});
$('panelBody').addEventListener('change',e=>{if(e.target.id==='squadSize'){if(distance(game.leader()||HOME,HOME)>=3||!game.setSquadSize(Number(e.target.value))){toast('Change the squad at the home workshop');e.target.value=game.state.squadSize;}else{updateHUD();save();}}});
function groundPoint(e){const r=$('world').getBoundingClientRect(),x=r.width?clamp(e.clientX-r.left,0,r.width):e.clientX-r.left,y=r.height?clamp(e.clientY-r.top,0,r.height):e.clientY-r.top;return {x:(x-layout.ox)/layout.scale,y:(y-layout.oy)/layout.scale};}
$('world').addEventListener('pointerdown',e=>{if($('panel').open||e.button!==0)return;e.preventDefault();const p=groundPoint(e);if(!gesture.begin(e.pointerId,p,game.enemyAt(p,layout.scale)))return;$('world').setPointerCapture(e.pointerId);preview=gesture.enemy?[]:previewRoute(game,p);});
$('world').addEventListener('pointermove',e=>{if(!gesture.update(e.pointerId,groundPoint(e)))return;preview=gesture.enemy?[]:previewRoute(game,gesture.point);});
$('world').addEventListener('pointerup',e=>{const action=gesture.release(e.pointerId);if(!action)return;preview=[];if($('panel').open)return;if(action.enemy)game.tapEnemy(action.enemy);else{const route=previewRoute(game,action.point);if(route.length)game.moveTo(route.at(-1));}});
for(const type of ['pointercancel','lostpointercapture'])$('world').addEventListener(type,e=>{if(gesture.id===e.pointerId){gesture.cancel();preview=[];}});
$('world').addEventListener('keydown',e=>{const d={ArrowUp:[0,-3],ArrowDown:[0,3],ArrowLeft:[-3,0],ArrowRight:[3,0]}[e.key],u=game.leader();if(d&&u){e.preventDefault();game.moveTo({x:u.x+d[0],y:u.y+d[1]});}});

$('home').onclick=()=>guide();
$('workshop').onclick=showWorkshop;$('atlas').onclick=atlas;$('pause').onclick=pause;$('close').onclick=closePanel;
$('utility').onclick=()=>{if(!game.useUtility())toast(game.utilityCd>0?`Recharging · ${Math.ceil(game.utilityCd)}s`:game.state.utility==='repair'?(game.state.utilityLeft>0?'The squad is already healthy':'Rest at a camp to refill your packs'):'Power charge is recharging');updateHUD();save();};
$('sound').onclick=()=>{prefs.sound=!prefs.sound;try{localStorage.setItem(PREFS,JSON.stringify(prefs));}catch{}syncSound();updateHUD();};
$('panel').addEventListener('cancel',e=>{e.preventDefault();closePanel();});
$('pause').innerHTML=icon('pause');$('close').innerHTML=icon('close');$('home').innerHTML=icon('compass');$('home').setAttribute('aria-label','Find the way');$('home').title='Find the way';$('atlas').innerHTML=icon('map');$('workshop').innerHTML=icon('shield');
if(!game.prologueComplete)guide(ARENA_ENTRY);
frame($('crest'),(c,w,h)=>portrait(c,w,h,game.state.squad[0],0));
new ResizeObserver(()=>{render(game.time);if($('panel').open&&panelKind==='atlas')drawPanel();}).observe($('field'));
function loop(now){const dt=Math.min(.05,(now-last)/1000);last=now;if(!document.hidden&&!$('panel').open)game.tick(dt);render(game.time);if(now>saveAt){save();saveAt=now+3000;}requestAnimationFrame(loop);}
requestAnimationFrame(loop);
const localPreview=['127.0.0.1','localhost'].includes(location.hostname);
if('serviceWorker'in navigator&&!localPreview)navigator.serviceWorker.register('../sw.js',{updateViaCache:'none'}).catch(()=>{});
let checkingUpdate=false;
const canUpdate=()=>!game.voyage&&!game.activeEncounter&&!game.travelGoal&&game.leader()&&distance(game.leader(),HOME)<3&&!document.hidden;
async function checkUpdate(){
  if(localPreview||checkingUpdate||!canUpdate())return;
  checkingUpdate=true;
  try{
    const response=await fetch(`../version.json?check=${Date.now()}`,{cache:'no-store'}),live=await response.json();
    if(!canUpdate()||!response.ok||!/^roman\d+$/.test(live.build)||live.build===BUILD)return;
    if(!save())return;const scope=new URL('../',location.href).href;
    if('serviceWorker'in navigator)for(const registration of await navigator.serviceWorker.getRegistrations())if(registration.scope===scope)await registration.unregister();
    if('caches'in window)for(const key of await caches.keys())if(key.startsWith('roman-bots-'))await caches.delete(key);
    if(canUpdate()&&save())location.replace(`./index.html?fresh=${Date.now()}`);
  }catch{}finally{checkingUpdate=false;}
}
checkUpdate();setInterval(checkUpdate,60000);
