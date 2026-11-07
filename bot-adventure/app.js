import {halloweenActive,regionHalloween} from './halloween.js?v=world92';
import {currentMission} from './data.js?v=world92';
import { BUILD, HOME, COLORS, EQUIPMENT, REGIONS, WORKSHOPS, RETURNS, returnActive, freshSave, item, stats, available, visibleEquipment, cellsIn, unlockedRegion, regionAt, nearestWalkable, WORLD_W, WORLD_H, relayFor, regionOrigin, atlasLayout, requiredCells, migrateWorldLayout } from './data.js?v=world92';
import { Adventure, distance } from './engine.js?v=world92';
import { Painter, bot, weapon, rounded, categoryIcon, equipmentIcon,atlasBot } from './art.js?v=world92';
import { mountAtlas } from './atlas.js?v=world92';
import {PANTHEON,areaInfo,areaUnlocked,pantheonUnlocked} from './data.js?v=world92';
import {AdventureSaves} from './adventure-saves.js?v=world92';
import {bindHoldConfirmation} from './hold-confirm.js?v=world92';
import {bindPowerControl,updatePowerControl} from './power-control.js?v=world92';
import {atlasProgress} from './atlas-progress.js?v=world92';
import {localProgress} from './quiet-ui.js?v=world92';
import {replayTitle} from './replay-variants.js?v=world92';

const buildVersion = 'world92';
const SAVE_KEY='bot-adventure-save-v1';
const adventureSaves=new AdventureSaves({storage:()=>localStorage,key:SAVE_KEY});
const $=id=>document.getElementById(id);
$('buildLabel').textContent=buildVersion;
let storageOK=true;
function load(){
  const base=freshSave();
  try{
    const raw=JSON.parse(localStorage.getItem(SAVE_KEY));if(!raw||raw.schema!==1)return base;
    const s={...base,...raw,worldLayout:raw.worldLayout||0,siteLayout:raw.siteLayout||0};
    for(const key of ['scrap','gears','totalBots','playSeconds'])s[key]=Math.max(0,Number.isFinite(s[key])?s[key]:0);
    for(const key of ['owned','cleared','kills','chests','discovered','visited'])s[key]=Array.isArray(s[key])?s[key]:base[key];
    s.bosses=Array.isArray(s.bosses)?[...new Set(s.bosses.filter(v=>Number.isInteger(v)&&v>=0&&v<REGIONS.length))].sort((a,b)=>a-b):[];
    s.returns=Array.isArray(s.returns)?[...new Set(s.returns.filter(id=>RETURNS.some(m=>m.id===id)))]:[];
    s.owned=[...new Set([...base.owned,...s.owned.filter(id=>Object.values(EQUIPMENT).flat().some(p=>p.id===id))])];
    s.build={...base.build,...s.build};for(const type of Object.keys(EQUIPMENT))if(!s.owned.includes(s.build[type])||!EQUIPMENT[type].some(p=>p.id===s.build[type]))s.build[type]=base.build[type];
    if(!COLORS.includes(s.color))s.color=base.color;
    migrateWorldLayout(s);
    if(!Number.isFinite(s.position?.x)||!Number.isFinite(s.position?.y)||s.position.x<1||s.position.x>WORLD_W-2||s.position.y<1||s.position.y>WORLD_H-2||!areaUnlocked(s,regionAt(s.position.x,s.position.y)))s.position={...HOME};
    if(!Number.isFinite(s.hp)||s.hp<=0)s.hp=stats(s).hp;
    return s;
  }catch{return base;}
}
const game=new Adventure(load());
if(!game.boats.riding)Object.assign(game.player,nearestWalkable(game.world,game.save,game.player));
const painter=new Painter($('world'));painter.resize();painter.camera={x:game.player.x,y:game.player.y};if(regionAt(game.player.x,game.player.y)===PANTHEON.r)painter.follow(game,10);
const worldSizeObserver=new ResizeObserver(()=>painter.resize());
worldSizeObserver.observe($('playfield'));
window.visualViewport?.addEventListener('resize',()=>painter.resize());
window.addEventListener('pageshow',()=>painter.resize());
document.fonts?.ready.then(()=>painter.resize());
game.reducedMotion=matchMedia('(prefers-reduced-motion: reduce)').matches;
const panel=$('panel');let panelMode=null,atlasController=null,workTab='weapon',workshopDetails=false,toastTimer,bannerTimer,frame=0,last=performance.now(),lastSave=0,wasPaused=false,holdCleanup=null,switchingSave=false;
let audio;
let musicUnlocked=false;
function soundContext(){
  if(!audio){
    audio=new(window.AudioContext||window.webkitAudioContext)();
    const source=audio.createMediaElementSource($('music')),gain=audio.createGain();
    gain.gain.value=.28;source.connect(gain);gain.connect(audio.destination);
  }
  return audio;
}
function syncMusic(){
  const music=$('music');
  if(!game.save.sound||document.hidden){music.pause();audio?.suspend().catch(()=>{});return;}
  if(!musicUnlocked)return;
  try{soundContext().resume().catch(()=>{});if(music.paused)music.play().catch(()=>{});}catch{}
}
function unlockMusic(event){if(event.isTrusted){musicUnlocked=true;syncMusic();}}
document.addEventListener('pointerup',unlockMusic,{passive:true});
document.addEventListener('click',unlockMusic,{passive:true});
document.addEventListener('keydown',unlockMusic);
function tone(freq=400,duration=.09,type='sine',volume=.035,slide=0){
  if(!game.save.sound||document.hidden)return;
  try{soundContext().resume().catch(()=>{});const o=audio.createOscillator(),v=audio.createGain();o.type=type;o.frequency.setValueAtTime(freq,audio.currentTime);if(slide)o.frequency.exponentialRampToValueAtTime(Math.max(30,slide),audio.currentTime+duration);v.gain.setValueAtTime(volume,audio.currentTime);v.gain.exponentialRampToValueAtTime(.001,audio.currentTime+duration);o.connect(v).connect(audio.destination);o.start();o.stop(audio.currentTime+duration);}catch{}
}
function toast(message){$('toast').textContent=message;$('toast').classList.add('show');clearTimeout(toastTimer);toastTimer=setTimeout(()=>$('toast').classList.remove('show'),3200);}
function banner(title,detail=''){const n=$('announcement');n.replaceChildren();const main=document.createElement('div');main.textContent=title;n.append(main);if(detail){const sub=document.createElement('small');sub.textContent=detail;n.append(sub);}n.hidden=false;clearTimeout(bannerTimer);bannerTimer=setTimeout(()=>n.hidden=true,3500);}
function persist(){if(switchingSave)return;try{localStorage.setItem(SAVE_KEY,JSON.stringify(game.snapshot()));}catch{if(storageOK){storageOK=false;const note=document.createElement('div');note.className='storage-warning';note.textContent='Saving is unavailable in this browser. Keep this page open to keep your adventure.';$('game').append(note);}}}
game.onEvent=e=>{
  if(e.type==='attack'){const f={bumper:110,blaster:700,saw:170,hammer:80,lightning:900,rocket:150,flame:140,frost:850,boomerang:400,tractor:240,drone:650,rail:1000,meteor:120,gravity:60,sunbeam:1200,swarm:760,supernova:95,crystalbeam:1400,twinrockets:90}[e.weapon]||400;tone(f,e.power?.18:.07,e.weapon==='saw'||e.weapon==='flame'?'sawtooth':'triangle',e.power?.04:.018,f*.5);if(e.power)tone(f*2,.12,'triangle',.025,f);}
  if(e.type==='toast')toast(e.text);
  if(e.type==='defeat'){tone(e.boss?130:320,.12,'triangle',.03,75);}
  if(e.type==='explosion')tone(90,.35,'sawtooth',.035,30);
  if(e.type==='cell'){const m=RETURNS.find(m=>m.id===e.returnId);toast(m?`Camp cleared! ${m.sites.filter((_,i)=>game.save.cleared.includes(`${m.sitePrefix}-${i}`)).length} / ${m.sites.length}`:`Power cell found! ${Math.min(requiredCells(e.r),e.count)} / ${requiredCells(e.r)}`);tone(630,.2,'sine',.05,1000);persist();}
  if(e.type==='chest'){toast(`Treasure! +${e.scrap} scrap · +1 gear`);tone(750,.18,'sine',.04,1200);persist();}
  if(e.type==='awake'){banner('The guardian is awake!',REGIONS[e.r].boss);}
  if(e.type==='region'){banner(areaInfo(e.r).name,areaInfo(e.r).subtitle);persist();}
  if(e.type==='guardian'){persist();setTimeout(()=>showGuardian(e.r),600);}
  if(e.type==='return-complete'){persist();tone(700,.4,'triangle',.04,1400);setTimeout(()=>showReturnComplete(e.id),600);}
  if(e.type==='home'){persist();}
  if(e.type==='home-arrived'){workshop();}
  if(e.type==='rescue'){persist();showRescue();}
  if(e.type==='crafted'){tone(500,.3,'triangle',.05,1400);toast(`${e.part.name} assembled!`);persist();}
  if(e.type==='equip'){tone(350,.08,'triangle',.025,500);persist();}
  if(e.type==='boost'){tone(250,.4,'triangle',.04,900);toast('Power surge!');}
  if(e.type==='royal-stage'){persist();banner(e.phase==='guards'?'The four sentinels awaken!':e.phase==='awakening'?'The royal pair is awakening…':'The king and queen are coming!');tone(100,.6,'triangle',.035,350);}
  if(e.type==='royal-victory'){persist();const rewards=e.rewards||[],nextWorld=e.nextHalloween?'Halloween takeover! All fifteen regions have new robot armies. Clear their camps and bosses, then face the Zombie King and Mummy Queen.':e.completedHalloween?'The Halloween world is restored! A shuffled normal region is next.':'A fresh shuffled region awaits!';openPanel('royal-victory',`${head('Royal Champion!','The king, queen and all four sentinels are defeated.','THE ROYAL FINALE')}<div class="panel-body">${rewards.length?`<canvas id="royalWeapons" class="celebration" width="700" height="210" aria-label="Royal weapon rewards"></canvas><h2>${rewards.map(id=>item('weapon',id).name).join(' + ')}</h2><p class="dialog-copy">Yours forever! Equip your new royal weapons at any workshop.</p>`:'<canvas id="rewardBot" class="celebration" width="700" height="280"></canvas>'}<p class="dialog-copy">${nextWorld}</p><p class="dialog-copy">All your progress and equipment are saved. +250 scrap · +12 parts</p><div class="pause-actions"><button class="primary pictorial-action" data-action="map" aria-label="Open adventure map"><span>⚑</span><small>Explore</small></button><button class="secondary pictorial-action" data-action="home"><span>⚙</span><small>Build</small></button></div></div>`);}
};
function closePanel(){holdCleanup?.();holdCleanup=null;atlasController?.destroy();atlasController=null;if(panelMode==='workshop')workshopDetails=false;if(panel.open)panel.close();panelMode=null;game.paused=false;last=performance.now();persist();}
function openPanel(mode,html){holdCleanup?.();holdCleanup=null;atlasController?.destroy();atlasController=null;game.paused=true;panelMode=mode;panel.dataset.mode=mode;$('panelContent').innerHTML=html;if(!panel.open)panel.showModal();panel.scrollTop=0;drawPanels();}
function head(title,sub,eyebrow='BOT ADVENTURE'){return `<div class="panel-head"><div><div class="eyebrow">${eyebrow}</div><h1 id="panelTitle">${title}</h1>${sub?`<p>${sub}</p>`:''}</div><button class="close" data-action="close" aria-label="Close" title="Close">×</button></div>`;}
function workbenchHTML(){const s=stats(game.save);return `<div class="workbench"><canvas id="botPreview" width="440" height="350" aria-label="Your bot"></canvas><div class="bot-stats"><div>Health <strong>${s.hp}</strong></div><div>Power <strong>${s.weapon.damage}</strong></div><div>Reach <strong>${s.weapon.range>2?'Long':'Close'}</strong></div><div class="swatches">${COLORS.map((color,i)=>`<button class="swatch ${game.save.color===color?'selected':''}" style="--swatch:${color}" data-color="${color}" aria-label="${['Coral','Blue','Green','Yellow','Orange','Purple'][i]}" title="${['Coral','Blue','Green','Yellow','Orange','Purple'][i]}"></button>`).join('')}</div></div></div>`;}
function workshop(){
  if(!game.isHome()){closePanel();game.goHome();toast('Heading to the workshop. Free repairs at home.');return;}
  game.repair();
  const tabs=Object.keys(EQUIPMENT);const s=game.save;
  openPanel('workshop',`${head(game.homeNear().name,'Fully repaired. Ready for something new.','SAFE & SOUND')}${workbenchHTML()}<div class="inventory-line"><span>Scrap <b>◆ ${s.scrap}</b></span><span>Parts <b>⚙ ${s.gears}</b></span><span>${s.bosses.length} / ${REGIONS.length} relays</span></div><div class="tabs" role="tablist" aria-label="Equipment categories">${tabs.map(type=>`<button role="tab" aria-label="${type}" aria-selected="${type===workTab}" class="${type===workTab?'active':''}" data-tab="${type}"><canvas width="88" height="72" data-category="${type}" aria-hidden="true"></canvas><small>${{weapon:'Weapons',armor:'Armor',wheels:'Wheels',gadget:'Gear'}[type]}</small></button>`).join('')}</div><div class="items">${visibleEquipment(s,workTab).map(p=>{
    const owned=s.owned.includes(p.id),equipped=s.build[workTab]===p.id,can=owned||available(s,p),afford=s.scrap>=p.cost&&s.gears>=p.gears;
    const lock=p.royalReward?'Defeat the king and queen together':p.unlock>=0?`Blueprint: ${REGIONS[p.unlock].boss}`:'Find gears at salvage sites';
    return `<article class="item ${equipped?'equipped':''} ${can?'':'locked'} ${!owned&&!afford?'unaffordable':''}"><canvas width="136" height="136" data-item="${p.id}" aria-label="${p.name}"></canvas><div><h3>${p.name}</h3><p>${p.desc}</p><small>${!can?lock:owned?equipped?'Equipped · yours forever':'Built · yours forever':`◆ ${p.cost} scrap + ⚙ ${p.gears} gears`}</small></div><button data-part="${p.id}" aria-label="${equipped?'Equipped':!can?'Locked':owned?'Equip':'Build'} ${p.name}" title="${equipped?'Equipped':!can?'Locked':owned?'Equip':'Build'}" ${!can||equipped||(!owned&&!afford)?'disabled':''}>${equipped?'✓':!can?'<span class="lock-icon" aria-hidden="true"></span>':owned?'↥':'+'}</button></article>`;
  }).join('')}</div><div class="panel-foot"><button class="primary pictorial-action" data-action="depart" aria-label="Go adventuring"><span>▶</span><small>Adventure</small></button></div>`);
  panel.dataset.details=String(workshopDetails);
  panel.querySelectorAll('.item p,.bot-stats>div:not(.swatches),.inventory-line>span:last-child,.panel-head p').forEach(el=>el.classList.add('extra-details'));
  panel.querySelector('.panel-head .close').insertAdjacentHTML('beforebegin',`<button class="icon-button workshop-info" data-action="equipment-details" aria-label="Equipment details" title="Equipment details" aria-pressed="${workshopDetails}">ⓘ</button>`);
  for(const card of panel.querySelectorAll('.item'))if(s.owned.includes(card.querySelector('[data-item]').dataset.item))card.querySelector('small').classList.add('extra-details');
}
function adventureMap(){
  const s=game.save,progress=atlasProgress(s);
  openPanel('map',`${head(halloweenActive(s)?'Halloween robot world':'The little big world',`${s.bosses.length} relays restored · ${s.cleared.filter(id=>id.startsWith('site-')).length} power cells found`,halloweenActive(s)?`${s.replay.conquered.length} / 15 REGIONS RESTORED`:'ADVENTURE ATLAS')}<div class="panel-body"><canvas id="atlas" class="map-canvas" aria-label="Your unlocked world. Select a destination." width="1200" height="960"></canvas><div class="map-key"><span>● Power cell</span><span>▣ Guardian</span><span>⌂ Workshop</span></div><div class="region-list">${REGIONS.map((reg,r)=>({reg,r})).filter(({r})=>progress.visible.has(r)&&(!halloweenActive(s)||s.replay.conquered.includes(`haunt-${r}`))).sort((a,b)=>Number(b.r===progress.active)-Number(a.r===progress.active)||a.r-b.r).map(({reg,r})=>`<button class="region-row ${r===progress.active?'active-region':''}" data-region="${r}"><span>${r===progress.active?progress.newArea?'★':'⚑':'✓'}</span><div><b>${reg.name}${halloweenActive(s)?` · ${regionHalloween(s,r).name}`:''}</b><small>${r===progress.active&&progress.newArea?'New trail · ':''}${halloweenActive(s)?s.replay.conquered.includes(`haunt-${r}`)?'Halloween guardian defeated':'Halloween camps and guardian await':s.bosses.includes(r)?'Relay restored · more treasures to find':`${cellsIn(s,r)} / ${requiredCells(r)} power cells · ${reg.boss}`}</small></div><em>Go ↗</em></button>`).join('')}</div></div>`);
  panel.querySelector('.panel-head p')?.remove();
  const key=panel.querySelector('.map-key');key.insertAdjacentHTML('afterbegin','<span class="bot-player-key"><canvas id="mapPlayerKey" width="80" height="80" aria-hidden="true"></canvas>You</span><span>★ Current adventure</span>');key.insertAdjacentHTML('beforeend','<span>＋ Charging station</span><span style="color:#ed917b">● Patrol</span>');
  bot($('mapPlayerKey').getContext('2d'),40,43,64,{color:s.color,armor:s.build.armor,wheels:s.build.wheels,gun:s.build.weapon,gadget:s.build.gadget,reducedMotion:true});
  const stations=game.world.stations.filter(st=>progress.visible.has(st.r)&&s.discovered.includes(st.id));
  panel.querySelector('.region-list').insertAdjacentHTML('afterbegin',stations.map(st=>`<button class="region-row station-row" data-station="${st.id}"><span>＋</span><div><b>Charging station</b><small>${REGIONS[st.r].name} · 2 scrap · safe zone</small></div><em>Go ↗</em></button>`).join(''));
  panel.querySelector('.region-list').insertAdjacentHTML('afterbegin',game.homes().map(h=>`<button class="region-row workshop-row" data-home="${h.id}"><span>⌂</span><div><b>${h.name}</b><small>Free repairs · walk home</small></div><em>Go ↗</em></button>`).join('')+RETURNS.filter(m=>returnActive(s,m)).map(m=>`<button class="region-row return-row" data-return="${m.id}"><span>⚑</span><div><b>${replayTitle(s,m)}</b><small>${REGIONS[m.r].name} · ${m.sites.filter((_,i)=>s.cleared.includes(`${m.sitePrefix}-${i}`)).length} / ${m.sites.length} camps</small></div><em>Go ↗</em></button>`).join(''));
  const map=$('atlas'),stage=document.createElement('div');stage.className='atlas-stage';map.before(stage);stage.append(map);
  stage.insertAdjacentHTML('afterbegin',`<div class="atlas-tools" role="group" aria-label="Map zoom"><output id="mapZoom" class="atlas-zoom" aria-label="Map zoom level">100%</output><button id="mapZoomOut" aria-label="Zoom out" title="Zoom out">−</button><button id="mapZoomIn" aria-label="Zoom in" title="Zoom in">+</button><button id="mapFit" aria-label="Show whole map" title="Show whole map">⛶</button>${s.completed?'':'<button id="mapGo" class="atlas-go" aria-label="Follow highlighted trail" title="Follow highlighted trail">➜</button>'}</div>`);
  const status=document.createElement('p');status.className='atlas-status';status.setAttribute('role','status');stage.after(status);
  const source=document.createElement('canvas');painter.map(source,game,{showPlayer:false});
  let mapDetail=false;
  atlasController=mountAtlas(map,{source,initialZoom:1,maxZoom:10,contentBounds:progress.bounds,onBeforeDraw:zoom=>{const detail=zoom>=1.8;if(detail!==mapDetail){painter.map(source,game,{showPlayer:false,detail});mapDetail=detail;}},onOverlay:(c,zoom)=>{c.save();c.translate(progress.ox+game.player.x*progress.scale,progress.oy+game.player.y*progress.scale);c.scale(1/zoom,1/zoom);atlasBot(c,0,0,s);c.restore();},onChange:zoom=>{$('mapZoom').value=`${Math.round(zoom*100)}%`;$('mapZoomOut').disabled=zoom<=1;$('mapZoomIn').disabled=zoom>=10;},onSelect:p=>{
    const {scale,ox,oy}=progress,x=(p.x-ox)/scale,y=(p.y-oy)/scale,r=regionAt(x,y);
    if(x<0||x>=WORLD_W||y<0||y>=WORLD_H||r<0)return;
    if(!progress.visible.has(r)||!areaUnlocked(s,r))return;
    if(r===PANTHEON.r){closePanel();game.moveTo(PANTHEON.viewpoint);return;}
    const home=game.homes().find(h=>distance(h,{x,y})<3),mission=RETURNS.find(m=>returnActive(s,m)&&distance(m,{x,y})<3);
    closePanel();if(mission)goReturn(mission);else game.moveTo(home||{x,y});
  }});
  if(pantheonUnlocked(s))panel.querySelector('.region-list').insertAdjacentHTML('afterbegin',`<button class="region-row ${progress.active===PANTHEON.r?'active-region':''}" data-action="pantheon"><span>♛</span><div><b>Crown Pantheon</b><small>${halloweenActive(s)?s.replay.phase==='region'?`Restore ${15-s.replay.conquered.length} more regions to awaken the Halloween court`:'Halloween finale · Zombie King and Mummy Queen':game.royals.phase==='victory'?'Royal Champion · the court is restored':'Royal finale · four sentinels, then king and queen'}</small></div><em>Go ↗</em></button>`);
  const list=panel.querySelector('.region-list'),mission=currentMission(s);
  const current=mission?list.querySelector(`[data-return="${mission.id}"]`):progress.active===PANTHEON.r?list.querySelector('[data-action="pantheon"]'):list.querySelector(`[data-region="${progress.active}"]`);
  if(current){current.classList.add('current-destination','active-region');current.querySelector('small')?.remove();current.querySelector('em').textContent='➜';stage.before(current);$('mapGo')?.remove();}
  const other=document.createElement('details');other.className='other-destinations';other.innerHTML='<summary>◇ Other places</summary>';list.before(other);other.append(list);
  for(const el of key.querySelectorAll('span'))if(!el.classList.contains('bot-player-key')&&!el.textContent.includes('★')&&!el.textContent.includes('Workshop')&&!el.textContent.includes('Charging'))el.remove();
  $('mapZoomIn').onclick=()=>atlasController.zoomBy(1.35);$('mapZoomOut').onclick=()=>atlasController.zoomBy(1/1.35);$('mapFit').onclick=()=>atlasController.reset();
  if($('mapGo'))$('mapGo').onclick=()=>{const walking=game.route.length>0;closePanel();if(!walking)game.goNext();};
}
function goRegion(r){
  const mission=RETURNS.find(m=>m.r===r&&returnActive(game.save,m));if(mission){goReturn(mission);return;}
  const sites=game.world.sites.filter(s=>!s.returnId&&s.r===r&&!game.save.cleared.includes(s.id)).sort((a,b)=>distance(a,game.player)-distance(b,game.player));
  const patrol=game.enemies.filter(e=>e.patrolSite&&e.r===r&&e.hp>0).sort((a,b)=>distance(a,game.player)-distance(b,game.player))[0];
  const o=regionOrigin(r),goal=cellsIn(game.save,r)>=requiredCells(r)&&!game.save.bosses.includes(r)?relayFor(r):sites[0]||patrol||{x:o.x+18.5,y:o.y+22.5};
  closePanel();game.moveTo(goal);
}
function goReturn(mission){const goal=game.world.sites.find(s=>s.returnId===mission.id&&!game.save.cleared.includes(s.id))||mission;closePanel();game.moveTo(goal);}
function pauseMenu(){
  openPanel('pause',`${head('Take a breather','Your adventure is saved.')}<div class="panel-body"><div class="pause-actions"><button class="primary" data-action="close">Keep exploring ↗</button><button class="secondary" data-action="home">Home workshop</button><button class="secondary" data-action="map">Adventure map</button></div><label class="settings-row"><span>Gentle battles</span><input type="checkbox" id="gentle" ${game.save.gentle?'checked':''}></label><label class="settings-row"><span>Sound</span><input type="checkbox" id="audio" ${game.save.sound?'checked':''}></label><p class="install-note">On iPhone: Safari → Share → Add to Home Screen. Your adventure saves on this device and works offline after its first visit.</p><p class="install-note">${BUILD} · ${Math.floor(game.save.playSeconds/60)} minutes exploring</p></div>`);
  panel.querySelector('.pause-actions').insertAdjacentHTML('beforeend','<button class="secondary" data-action="display">Display details</button>');
  panel.querySelector('.panel-body').insertAdjacentHTML('beforeend','<button class="management-link" data-action="manage">⚙ Game Management</button>');
}
function backupDetails(record){
  if(record.status!=='ready')return `<p class="backup-empty">${{missing:'No backup yet. Restarting creates one automatically.',corrupt:'The existing backup cannot be read. Restarting will replace it.',unavailable:'Storage is unavailable. Restart and restore are disabled.'}[record.status]}</p>`;
  const s=record.summary,date=new Intl.DateTimeFormat(undefined,{dateStyle:'medium',timeStyle:'short'}).format(new Date(record.backup.savedAt));
  return `<section class="backup-details" aria-label="Adventure backup"><h2>${s.king?'♛':'⚑'} ${s.title}</h2><p>${s.region}</p><dl><div><dt>Relays restored</dt><dd>${s.relays} / ${s.totalRelays}</dd></div><div><dt>Equipment owned</dt><dd>${s.equipment}</dd></div><div><dt>Robot king</dt><dd>${s.king?'Defeated':'Not defeated'}</dd></div></dl><p class="backup-date">Saved before restart · ${date}</p></section>`;
}
function gameManagement(){
  const record=adventureSaves.readBackup();
  openPanel('management',`${head('Game Management','Restart and recovery','ADVENTURE SAVES')}<div class="panel-body"><h2 class="management-heading">Previous adventure</h2>${backupDetails(record)}<div class="pause-actions"><button class="secondary" data-action="restore-review" ${record.status==='ready'?'':'disabled'}>↶ Restore Previous Adventure</button><button class="danger" data-action="restart-review" ${record.status==='unavailable'?'disabled':''}>⚠ Start A New Adventure</button><button class="secondary" data-action="pause">Back</button></div><p class="install-note">The backup stays on this device. Only another restart replaces it.</p></div>`);
}
function restartReview(error=''){
  const record=adventureSaves.readBackup();
  openPanel('restart-confirm',`${head('Start from scratch?','All levels, all the way to the royal court.','NEW ADVENTURE')}<div class="panel-body"><div class="restart-warning" id="restartWarning"><b>⚠ Your bot starts over</b><p>Weapons, armor, upgrades, coins and world progress reset. Your current adventure is backed up first.</p><p>${record.status==='missing'?'You can restore it later from Game Management.':'This replaces the previous backup. Only the adventure you are leaving will be kept.'}</p></div><p id="managementStatus" role="status" class="management-status"></p><div class="pause-actions"><button class="secondary" data-action="manage">Cancel</button><button id="confirmRestart" class="danger hold-restart" aria-label="Hold to restart for two seconds" aria-describedby="restartWarning"><span>⚠ Hold to restart</span><small>2 seconds</small></button></div></div>`);
  $('managementStatus').textContent=error;
  holdCleanup=bindHoldConfirmation($('confirmRestart'),()=>switchAdventure('restart'));
}
function restoreReview(error=''){
  const record=adventureSaves.readBackup();
  openPanel('restore-confirm',`${head('Restore previous adventure?','This replaces the adventure currently in progress.','RESTORE BACKUP')}<div class="panel-body">${backupDetails(record)}<p class="dialog-copy">The current adventure will not be backed up. This saved backup remains available until your next restart.</p><p id="managementStatus" role="status" class="management-status"></p><div class="pause-actions"><button class="secondary" data-action="manage">Cancel</button><button class="primary" data-action="restore-confirm" ${record.status==='ready'?'':'disabled'}>↶ Restore This Adventure</button></div></div>`);
  $('managementStatus').textContent=error;
}
function switchAdventure(operation){
  if(switchingSave)return;
  try{
    if(operation==='restart')adventureSaves.restart(game.snapshot());else adventureSaves.restore();
    // Do not let autosave or pagehide write the old in-memory game over the new save.
    switchingSave=true;holdCleanup?.();holdCleanup=null;location.reload();
  }catch{
    const message=operation==='restart'?'Could not save and verify the backup. Nothing was restarted. Your current adventure is still open.':'Could not restore the backup. Your current adventure is still open.';
    if(operation==='restart')restartReview(message);else restoreReview(message);
  }
}
function displayDetails(){
  const rect=element=>{const r=element.getBoundingClientRect();return [r.x,r.y,r.width,r.height].map(n=>Math.round(n*100)/100);};
  const canvas=$('world'),r=canvas.getBoundingClientRect(),v=window.visualViewport;
  const report={build:buildVersion,standalone:matchMedia('(display-mode: standalone)').matches||navigator.standalone===true,screen:[screen.width,screen.height],window:[innerWidth,innerHeight],visualViewport:v?[v.width,v.height,v.offsetTop,v.scale]:null,game:rect($('game')),header:rect(document.querySelector('.topbar')),footer:rect(document.querySelector('.console')),canvasCss:[r.width,r.height],canvasPixels:[canvas.width,canvas.height],canvasScale:[canvas.width/r.width,canvas.height/r.height],headerPadding:getComputedStyle(document.querySelector('.topbar')).paddingTop,footerPadding:getComputedStyle(document.querySelector('.console')).paddingBottom};
  openPanel('display',`${head('Display details','Screen measurements only. No saved-game or personal data.')}<div class="panel-body"><pre id="displayReport" class="display-report"></pre><button class="secondary" data-action="pause">Back</button></div>`);
  $('displayReport').textContent=Object.entries(report).map(([key,value])=>`${key}: ${JSON.stringify(value)}`).join('\n');
}
function showRescue(){openPanel('rescue',`${head('A little rescue','Every good explorer gets a helping hand.','BACK HOME')}<div class="panel-body"><canvas class="celebration" id="rewardBot" width="700" height="280"></canvas><p class="dialog-copy">Your bot is fully repaired. All your equipment, parts and discoveries are safe. The rescue cost at most 1 scrap.</p><button class="primary" data-action="home">Back to the workshop ⌂</button></div>`);}
function showReturnComplete(id){
  const royal=RETURNS.find(m=>m.id===id)?.postRoyal,mission=currentMission(game.save),more=halloweenActive(game.save)&&game.save.replay.phase==='region',next=more?REGIONS[mission.r]:royal?PANTHEON:REGIONS[unlockedRegion(game.save)];
  openPanel('trail',`${head(next.name,more?`${game.save.replay.conquered.length} / 15 Halloween regions restored. Follow the next trail or explore another region.`:royal?halloweenActive(game.save)?'All fifteen regions restored! The Zombie King and Mummy Queen await.':'The king, queen and four sentinels await your return.':'A new trail is open.',more?'HALLOWEEN TRAIL RESTORED':royal?'THE ROYAL REMATCH':'TRAIL RESTORED')}<div class="panel-body"><canvas class="celebration" id="rewardBot" width="700" height="280"></canvas><div class="pause-actions"><button class="primary pictorial-action" data-action="next" aria-label="Explore ${next.name}"><span>➜</span><small>Explore</small></button><button class="secondary pictorial-action" data-action="home" aria-label="Build at the nearest workshop"><span>⚙</span><small>Build</small></button></div></div>`);
}
function showGuardian(r){
  const pair=Object.entries(EQUIPMENT).flatMap(([type,parts])=>parts.filter(p=>p.unlock===r).map(p=>({type,p}))).find(({p})=>p.id===REGIONS[r].reward)||Object.entries(EQUIPMENT).flatMap(([type,parts])=>parts.filter(p=>p.unlock===r).map(p=>({type,p})))[0];
  const discovery=pair?`<canvas id="rewardWeapon" class="celebration" width="700" height="280" data-reward="${pair.p.id}" data-type="${pair.type}"></canvas><h2 style="font-size:21px;margin:8px 0">${pair.p.name} blueprint</h2><p class="dialog-copy">${pair.p.desc} Your new blueprint is waiting at the workshop.</p>`:'<canvas class="celebration" id="rewardBot" width="700" height="280"></canvas>';
  if(r===REGIONS.length-1){openPanel('victory',`${head('All fifteen relays restored!','One final royal challenge awaits.','THE ANCIENT PATH OPENS')}<div class="panel-body">${discovery}<div class="completed-stats"><div><b>${game.save.totalBots}</b><span>bots defeated</span></div><div><b>${game.save.cleared.length}</b><span>cells discovered</span></div><div><b>${game.save.owned.length}</b><span>parts built</span></div></div><p class="dialog-copy">Beyond Starfall, the Crown Pantheon waits. Watch the sleeping court at the seal, then choose when to open it. Four sentinels defend the royal pair. Bring your strongest equipment; the king and queen slowly repair themselves.</p><div class="pause-actions"><button class="primary pictorial-action" data-action="pantheon" aria-label="Visit the royal court"><span>♛</span><small>Discover</small></button><button class="secondary pictorial-action" data-action="home" aria-label="Build at the nearest workshop"><span>⚙</span><small>Build</small></button></div></div>`);return;}
  const mission=currentMission(game.save),next=mission?`${replayTitle(game.save,mission)} has appeared in ${REGIONS[mission.r].name}`:`${REGIONS[r+1].name} is now open`;
  openPanel('guardian',`${head('A relay comes to life!',next,'BIG DISCOVERY')}<div class="panel-body">${discovery}<div class="pause-actions"><button class="primary pictorial-action" data-action="home" aria-label="Build at the nearest workshop"><span>⚙</span><small>Build</small></button><button class="secondary pictorial-action" data-action="next" aria-label="Explore the next trail"><span>${mission?'⚑':'▶'}</span><small>Explore</small></button></div></div>`);
  tone(500,.5,'triangle',.04,1500);
}
panel.addEventListener('cancel',e=>{e.preventDefault();closePanel();});
panel.addEventListener('click',e=>{
  const button=e.target.closest('button');if(!button||button.disabled)return;
  if(button.dataset.tab){workTab=button.dataset.tab;const top=panel.scrollTop;workshop();panel.scrollTop=top;}
  if(button.dataset.color){const top=panel.scrollTop;game.save.color=button.dataset.color;persist();workshop();panel.scrollTop=top;}
  if(button.dataset.part){const id=button.dataset.part,scroll=panel.scrollTop;if(game.save.owned.includes(id))game.equip(workTab,id);else game.craft(workTab,id);workshop();panel.scrollTop=scroll;}
  if(button.dataset.region!==undefined)goRegion(Number(button.dataset.region));
  if(button.dataset.station){const station=game.world.stations.find(s=>s.id===button.dataset.station);closePanel();if(station)game.moveTo(station);}
  if(button.dataset.home){const home=WORKSHOPS.find(h=>h.id===button.dataset.home);closePanel();if(home)game.moveTo(home);}
  if(button.dataset.return){const mission=RETURNS.find(m=>m.id===button.dataset.return);if(mission)goReturn(mission);}
  const action=button.dataset.action;
  if(action==='close')closePanel();
  if(action==='home')workshop();
  if(action==='equipment-details'){workshopDetails=!workshopDetails;panel.dataset.details=String(workshopDetails);button.setAttribute('aria-pressed',String(workshopDetails));}
  if(action==='map')adventureMap();
  if(action==='display')displayDetails();
  if(action==='pause')pauseMenu();
  if(action==='manage')gameManagement();
  if(action==='restart-review')restartReview();
  if(action==='restore-review')restoreReview();
  if(action==='restore-confirm')switchAdventure('restore');
  if(action==='depart'){closePanel();game.depart();painter.camera={x:game.player.x,y:game.player.y};}
  if(action==='repair'){game.repair();closePanel();}
  if(action==='next'){closePanel();game.goNext();}
  if(action==='pantheon'&&pantheonUnlocked(game.save)){closePanel();game.moveTo(PANTHEON.viewpoint);}
});
panel.addEventListener('change',e=>{if(e.target.id==='gentle')game.save.gentle=e.target.checked;if(e.target.id==='audio'){game.save.sound=e.target.checked;syncMusic();tone(700);}persist();});
function drawPanels(){
  const t=game.time;
  const preview=$('botPreview');if(preview){const r=preview.getBoundingClientRect(),dpr=Math.min(devicePixelRatio,2);if(preview.width!==Math.round(r.width*dpr)||preview.height!==Math.round(r.height*dpr)){preview.width=Math.round(r.width*dpr);preview.height=Math.round(r.height*dpr);}const c=preview.getContext('2d');c.setTransform(dpr,0,0,dpr,0,0);c.clearRect(0,0,r.width,r.height);const width=r.width,size=Math.min(102,(width*.6-8)/.98);rounded(c,12,137,width-24,13,5,'#43615b');rounded(c,17,131,width-34,9,3,'#829f8a');for(let i=0;i<4;i++){c.fillStyle='#d5b95f';c.fillRect(22+i*(width-40)/4,140,10,2);}bot(c,width*.38,132-size*.39,size,{color:game.save.color,armor:game.save.build.armor,wheels:game.save.build.wheels,gun:game.save.build.weapon,angle:-.25},t);}
  document.querySelectorAll('canvas[data-item]').forEach(canvas=>{const c=canvas.getContext('2d');c.clearRect(0,0,136,136);c.save();c.scale(2,2);equipmentIcon(c,workTab,canvas.dataset.item,t);c.restore();});
  document.querySelectorAll('canvas[data-category]').forEach(canvas=>{const c=canvas.getContext('2d');c.clearRect(0,0,88,72);c.save();c.scale(2,2);categoryIcon(c,canvas.dataset.category,t);c.restore();});
  const atlas=$('atlas');if(atlas&&!atlasController)painter.map(atlas,game);
  const reward=$('rewardWeapon');if(reward){const c=reward.getContext('2d');c.clearRect(0,0,700,280);c.save();if(reward.dataset.type==='weapon'){const scale=['sunbeam','swarm','supernova'].includes(reward.dataset.reward)?7:5;c.translate(350-30*scale,140);c.scale(scale,scale);weapon(c,reward.dataset.reward,t);}else{c.translate(214,4);c.scale(4,4);equipmentIcon(c,reward.dataset.type,reward.dataset.reward,t);}c.restore();}
  const royal=$('royalWeapons');if(royal){const c=royal.getContext('2d');c.clearRect(0,0,700,210);for(const [i,id] of ['crystalbeam','twinrockets'].entries()){c.save();c.translate(55+i*350,115);c.scale(4.5,4.5);weapon(c,id,t);c.restore();}}
  const rb=$('rewardBot');if(rb){const c=rb.getContext('2d');c.clearRect(0,0,700,280);bot(c,350,140,170,{color:game.save.color,armor:game.save.build.armor,wheels:game.save.build.wheels,gun:game.save.build.weapon},t);}
}
$('pause').onclick=pauseMenu;$('map').onclick=adventureMap;
$('home').onclick=workshop;$('workshop').onclick=workshop;
function activatePower(){if(!game.paused)game.boost();updatePowerControl($('boost'),$('boostLabel'),game);}
bindPowerControl($('boost'),activatePower);
$('sound').onclick=()=>{game.save.sound=!game.save.sound;syncMusic();tone(700);persist();};
let interaction='';
$('interact').onclick=()=>{if(interaction==='royal'){if(game.royals.start())persist();}else if(interaction==='home')workshop();else if(interaction==='repair')game.repair();else if(interaction==='guardian'){const r=regionAt(game.player.x,game.player.y);toast(REGIONS[r].hint);game.moveTo(relayFor(r));}};
let pressed=false,pressPoint;
$('world').addEventListener('pointerdown',e=>{if(game.paused)return;pressPoint={x:e.clientX,y:e.clientY};const rect=$('world').getBoundingClientRect(),pos=painter.screenToWorld(e.clientX-rect.left,e.clientY-rect.top),boat=game.boats.at(pos),enemy=game.enemyAt(pos,painter.tile),station=game.world.stations.find(s=>s.r<=unlockedRegion(game.save)&&distance(s,pos)<1.8);pressed=!enemy&&!boat;if(boat){if(game.boats.riding)game.moveTo(boat);else game.boats.board(boat);}else if(enemy)game.tapEnemy(enemy);else if(station)game.moveTo(station);else game.moveTo(pos);$('world').setPointerCapture(e.pointerId);});
$('world').addEventListener('pointermove',e=>{if(!pressed||game.paused||Math.hypot(e.clientX-pressPoint.x,e.clientY-pressPoint.y)<20)return;const rect=$('world').getBoundingClientRect();game.moveTo(painter.screenToWorld(e.clientX-rect.left,e.clientY-rect.top));pressPoint={x:e.clientX,y:e.clientY};});
for(const event of ['pointerup','pointercancel'])$('world').addEventListener(event,()=>pressed=false);
$('world').addEventListener('pointerdown',e=>{if(game.paused||!game.royals.ready)return;const r=$('world').getBoundingClientRect(),p=painter.screenToWorld(e.clientX-r.left,e.clientY-r.top);if(distance(p,{x:162.5,y:245.5})<1.5){e.preventDefault();e.stopImmediatePropagation();game.royals.start();persist();}},true);
window.addEventListener('keydown',e=>{if(panel.open)return;const directions={ArrowUp:[0,-1],ArrowDown:[0,1],ArrowLeft:[-1,0],ArrowRight:[1,0],w:[0,-1],s:[0,1],a:[-1,0],d:[1,0]};if(directions[e.key]){e.preventDefault();const [dx,dy]=directions[e.key];game.moveTo({x:Math.floor(game.player.x)+dx+.5,y:Math.floor(game.player.y)+dy+.5});}if(e.code==='Space'){e.preventDefault();game.boost();}if(e.key==='Escape')pauseMenu();});
window.addEventListener('resize',()=>painter.resize());
document.addEventListener('visibilitychange',()=>{syncMusic();if(document.hidden){wasPaused=game.paused;game.paused=true;persist();}else{game.paused=panel.open||wasPaused;last=performance.now();painter.resize();}});
window.addEventListener('pagehide',persist);
function hud(){
  const s=game.save,r=regionAt(game.player.x,game.player.y),max=game.maxHp(),current=Math.ceil(game.player.hp);
  $('regionName').textContent=(areaInfo(r)?.name||'Ancient trail')+(halloweenActive(s)?' · Halloween':'');$('scrapCount').textContent=s.scrap;$('healthText').textContent=`${current} / ${max}`;$('healthFill').style.width=`${Math.max(0,game.player.hp/max*100)}%`;$('healthFill').style.background=game.player.hp/max<.3?'#f49b7d':'#94e5b1';$('weaponLabel').textContent=item('weapon',s.build.weapon).name;
  $('healthText').parentElement.classList.toggle('critical',game.player.hp/max<=.18);
  if(game.charging)$('weaponLabel').textContent='Charging…';else if(game.player.hp/max<=.18)$('weaponLabel').textContent='Needs repairs!';else if(game.player.hp/max<=.5)$('weaponLabel').textContent='Damaged';
  $('weaponLabel').hidden=!game.charging&&game.player.hp/max>.5;
  const progress=localProgress(s,r),progressBar=$('regionProgress');progressBar.hidden=!progress;
  if(progress){const icons=Array.from({length:progress.total},(_,i)=>`<i class="${i<progress.count?'filled':''}" aria-hidden="true"></i>`).join('');if(progressBar.innerHTML!==icons)progressBar.innerHTML=icons;progressBar.setAttribute('aria-label',`${progress.count} of ${progress.total} stations cleared in ${areaInfo(r).name}`);}
  updatePowerControl($('boost'),$('boostLabel'),game);
  $('soundLabel').textContent=s.sound?'Sound on':'Sound off';$('sound').setAttribute('aria-label',s.sound?'Turn sound off':'Turn sound on');
  const fight=game.bossFight();
  $('toast').classList.toggle('boss-active',!!fight);
  $('bossHud').hidden=!fight;if(fight){$('bossName').textContent=fight.name;$('bossHealth').style.width=`${fight.health*100}%`;}
  interaction='';
  if(game.isHome()&&game.player.hp<max-1)interaction='home';
  else if(game.royals.observing)interaction='royal';
  else if(game.stationNear()&&game.player.hp<max-1&&!game.charging)interaction='repair';
  else if(r>=0&&r<REGIONS.length&&distance(game.player,relayFor(r))>4&&distance(game.player,relayFor(r))<6&&game.bossAwake(r))interaction='guardian';
  $('interact').hidden=!interaction;$('interact').disabled=interaction==='royal'&&!game.royals.ready;$('interact').textContent=interaction==='royal'?game.royals.ready?'⚔ Open the gate':'◉ '+Math.ceil(5-game.royals.inspect):{home:'⌂ Home workshop · free repairs',repair:'＋ Recharge · ◆ 2',guardian:'ϟ Guardian ahead'}[interaction]||'';
}
function loop(now){const dt=Math.min(.06,(now-last)/1000);last=now;game.viewBounds={left:painter.camera.x-painter.w/painter.tile/2,right:painter.camera.x+painter.w/painter.tile/2,top:painter.camera.y-painter.h/painter.tile*.51,bottom:painter.camera.y+painter.h/painter.tile*.49};game.tick(dt);painter.draw(game,game.time,dt);if(frame++%5===0)hud();if(panel.open&&frame%3===0)drawPanels();if(now-lastSave>2200){persist();lastSave=now;}requestAnimationFrame(loop);}
hud();requestAnimationFrame(loop);
if(!game.save.intro){game.save.intro=true;setTimeout(()=>{if(!game.enemies.some(e=>e.type==='boss'&&e.hp>0&&game.bossAwake(e.r)&&distance(e,game.player)<7))banner('A little bot. A big adventure.',REGIONS[regionAt(game.player.x,game.player.y)].name);},500);persist();}
if('serviceWorker' in navigator){navigator.serviceWorker.register('./sw.js',{scope:'./',updateViaCache:'none'}).catch(()=>{});}
async function checkVersion(){try{const res=await fetch(`./version.json?check=${Date.now()}`,{cache:'no-store'});if(!res.ok)return;const live=await res.json();if(live.build!==buildVersion&&!game.enemies.some(e=>e.active&&e.hp>0)&&!panel.open){persist();const regs=await navigator.serviceWorker?.getRegistrations();for(const reg of regs||[])if(reg.scope===new URL('./',location.href).href)await reg.unregister();for(const key of await caches.keys())if(key.startsWith('bot-adventure-'))await caches.delete(key);location.replace(`./index.html?fresh=${Date.now()}`);}}catch{}}
window.addEventListener('online',checkVersion);window.addEventListener('focus',checkVersion);setTimeout(checkVersion,2500);
