import { BUILD, HOME, COLORS, EQUIPMENT, REGIONS, freshSave, item, stats, available, cellsIn, unlockedRegion, regionAt, canWalk, WORLD_W, WORLD_H, relayFor, regionOrigin, atlasLayout, requiredCells, TOTAL_CELLS } from './data.js?v=world62';
import { Adventure, distance } from './engine.js?v=world62';
import { Painter, bot, weapon, rounded } from './art.js?v=world62';
import { mountAtlas } from './atlas.js?v=world62';

const buildVersion = 'world62';
const SAVE_KEY='bot-adventure-save-v1';
const $=id=>document.getElementById(id);
$('buildLabel').textContent=buildVersion;
let storageOK=true;
function load(){
  const base=freshSave();
  try{
    const raw=JSON.parse(localStorage.getItem(SAVE_KEY));if(!raw||raw.schema!==1)return base;
    const s={...base,...raw,siteLayout:raw.siteLayout||0};
    for(const key of ['scrap','gears','totalBots','playSeconds'])s[key]=Math.max(0,Number.isFinite(s[key])?s[key]:0);
    for(const key of ['owned','cleared','kills','chests','discovered','visited'])s[key]=Array.isArray(s[key])?s[key]:base[key];
    s.bosses=Array.isArray(s.bosses)?[...new Set(s.bosses.filter(v=>Number.isInteger(v)&&v>=0&&v<5))].sort():[];
    s.owned=[...new Set([...base.owned,...s.owned.filter(id=>Object.values(EQUIPMENT).flat().some(p=>p.id===id))])];
    s.build={...base.build,...s.build};for(const type of Object.keys(EQUIPMENT))if(!s.owned.includes(s.build[type])||!EQUIPMENT[type].some(p=>p.id===s.build[type]))s.build[type]=base.build[type];
    if(!COLORS.includes(s.color))s.color=base.color;
    if(raw.worldLayout!==2){s.position={...HOME};s.worldLayout=2;s.visited=[];s.discovered=[];s.hp=stats(s).hp;}
    if(!Number.isFinite(s.position?.x)||!Number.isFinite(s.position?.y)||s.position.x<1||s.position.x>WORLD_W-2||s.position.y<1||s.position.y>WORLD_H-2||regionAt(s.position.x,s.position.y)<0||regionAt(s.position.x,s.position.y)>unlockedRegion(s))s.position={...HOME};
    if(!Number.isFinite(s.hp)||s.hp<=0)s.hp=stats(s).hp;
    return s;
  }catch{return base;}
}
const game=new Adventure(load());
if(!canWalk(game.world,game.save,Math.floor(game.player.x),Math.floor(game.player.y))){game.player.x=HOME.x;game.player.y=HOME.y;}
const painter=new Painter($('world'));painter.resize();painter.camera={x:game.player.x,y:game.player.y};
const worldSizeObserver=new ResizeObserver(()=>painter.resize());
worldSizeObserver.observe($('playfield'));
window.visualViewport?.addEventListener('resize',()=>painter.resize());
window.addEventListener('pageshow',()=>painter.resize());
document.fonts?.ready.then(()=>painter.resize());
game.reducedMotion=matchMedia('(prefers-reduced-motion: reduce)').matches;
const panel=$('panel');let panelMode=null,atlasController=null,workTab='weapon',toastTimer,bannerTimer,frame=0,last=performance.now(),lastSave=0,wasPaused=false;
let audio;
function tone(freq=400,duration=.09,type='sine',volume=.035,slide=0){
  if(!game.save.sound)return;
  try{audio||=new(window.AudioContext||window.webkitAudioContext)();if(audio.state==='suspended')audio.resume();const o=audio.createOscillator(),v=audio.createGain();o.type=type;o.frequency.setValueAtTime(freq,audio.currentTime);if(slide)o.frequency.exponentialRampToValueAtTime(Math.max(30,slide),audio.currentTime+duration);v.gain.setValueAtTime(volume,audio.currentTime);v.gain.exponentialRampToValueAtTime(.001,audio.currentTime+duration);o.connect(v).connect(audio.destination);o.start();o.stop(audio.currentTime+duration);}catch{}
}
function toast(message){$('toast').textContent=message;$('toast').classList.add('show');clearTimeout(toastTimer);toastTimer=setTimeout(()=>$('toast').classList.remove('show'),3200);}
function banner(title,detail=''){const n=$('announcement');n.replaceChildren();const main=document.createElement('div');main.textContent=title;n.append(main);if(detail){const sub=document.createElement('small');sub.textContent=detail;n.append(sub);}n.hidden=false;clearTimeout(bannerTimer);bannerTimer=setTimeout(()=>n.hidden=true,3500);}
function persist(){try{localStorage.setItem(SAVE_KEY,JSON.stringify(game.snapshot()));}catch{if(storageOK){storageOK=false;const note=document.createElement('div');note.className='storage-warning';note.textContent='Saving is unavailable in this browser. Keep this page open to keep your adventure.';$('game').append(note);}}}
game.onEvent=e=>{
  if(e.type==='attack'){const f={bumper:110,blaster:700,saw:170,hammer:80,lightning:900,rocket:150}[e.weapon];tone(f,.07,e.weapon==='saw'?'sawtooth':'triangle',.018,f*.5);}
  if(e.type==='toast')toast(e.text);
  if(e.type==='defeat'){tone(e.boss?130:320,.12,'triangle',.03,75);}
  if(e.type==='explosion')tone(90,.35,'sawtooth',.035,30);
  if(e.type==='cell'){toast(`Power cell found! ${Math.min(requiredCells(e.r),e.count)} / ${requiredCells(e.r)}`);tone(630,.2,'sine',.05,1000);persist();}
  if(e.type==='chest'){toast(`Treasure! +${e.scrap} scrap · +1 gear`);tone(750,.18,'sine',.04,1200);persist();}
  if(e.type==='awake'){banner('The guardian is awake!',REGIONS[e.r].boss);}
  if(e.type==='region'){banner(REGIONS[e.r].name,REGIONS[e.r].subtitle);persist();}
  if(e.type==='guardian'){persist();setTimeout(()=>showGuardian(e.r),600);}
  if(e.type==='home'){persist();}
  if(e.type==='home-arrived'){workshop();}
  if(e.type==='rescue'){persist();showRescue();}
  if(e.type==='crafted'){tone(500,.3,'triangle',.05,1400);toast(`${e.part.name} assembled!`);persist();}
  if(e.type==='equip'){tone(350,.08,'triangle',.025,500);persist();}
  if(e.type==='boost'){tone(250,.4,'triangle',.04,900);toast('Power surge!');}
};
function closePanel(){atlasController?.destroy();atlasController=null;if(panel.open)panel.close();panelMode=null;game.paused=false;last=performance.now();persist();}
function openPanel(mode,html){atlasController?.destroy();atlasController=null;game.paused=true;panelMode=mode;panel.dataset.mode=mode;$('panelContent').innerHTML=html;if(!panel.open)panel.showModal();panel.scrollTop=0;drawPanels();}
function head(title,sub,eyebrow='BOT ADVENTURE'){return `<div class="panel-head"><div><div class="eyebrow">${eyebrow}</div><h1 id="panelTitle">${title}</h1>${sub?`<p>${sub}</p>`:''}</div><button class="close" data-action="close" aria-label="Close" title="Close">×</button></div>`;}
function workbenchHTML(){const s=stats(game.save);return `<div class="workbench"><canvas id="botPreview" width="440" height="350" aria-label="Your bot"></canvas><div class="bot-stats"><div>Health <strong>${s.hp}</strong></div><div>Power <strong>${s.weapon.damage}</strong></div><div>Reach <strong>${s.weapon.range>2?'Long':'Close'}</strong></div><div class="swatches">${COLORS.map((color,i)=>`<button class="swatch ${game.save.color===color?'selected':''}" style="--swatch:${color}" data-color="${color}" aria-label="${['Coral','Blue','Green','Yellow','Orange','Purple'][i]}" title="${['Coral','Blue','Green','Yellow','Orange','Purple'][i]}"></button>`).join('')}</div></div></div>`;}
function workshop(){
  if(!game.isHome()){closePanel();game.goHome();toast('Heading to the workshop. Free repairs at home.');return;}
  game.repair();
  const tabs=Object.keys(EQUIPMENT);const s=game.save;
  openPanel('workshop',`${head('Home workshop','Fully repaired. Ready for something new.','SAFE & SOUND')}${workbenchHTML()}<div class="inventory-line"><span>Scrap <b>◆ ${s.scrap}</b></span><span>Parts <b>⚙ ${s.gears}</b></span><span>${s.bosses.length} / 5 relays</span></div><div class="tabs" role="tablist">${tabs.map(type=>`<button role="tab" aria-selected="${type===workTab}" class="${type===workTab?'active':''}" data-tab="${type}">${{weapon:'Weapons',armor:'Armor',wheels:'Wheels',gadget:'Gadgets'}[type]}</button>`).join('')}</div><div class="items">${EQUIPMENT[workTab].map(p=>{
    const owned=s.owned.includes(p.id),equipped=s.build[workTab]===p.id,can=available(s,p),afford=s.scrap>=p.cost&&s.gears>=p.gears;
    const lock=p.unlock>=0?`Blueprint: ${REGIONS[p.unlock].boss}`:'Find gears at salvage sites';
    return `<article class="item ${equipped?'equipped':''} ${can?'':'locked'}"><canvas width="136" height="136" data-item="${p.id}" aria-label="${p.name}"></canvas><div><h3>${p.name}</h3><p>${p.desc}</p><small>${!can?lock:owned?equipped?'Equipped · yours forever':'Built · yours forever':`◆ ${p.cost} scrap + ⚙ ${p.gears} gears`}</small></div><button data-part="${p.id}" ${!can||equipped||(!owned&&!afford)?'disabled':''}>${equipped?'✓':!can?'Locked':owned?'Equip':'Build'}</button></article>`;
  }).join('')}</div><div class="panel-foot"><button class="primary" data-action="depart">Adventure awaits ↗</button></div>`);
}
function adventureMap(){
  const s=game.save,region=unlockedRegion(s);
  openPanel('map',`${head('The little big world',`${s.bosses.length} relays restored · ${s.cleared.length} power cells found`,'VALLEY ATLAS')}<div class="panel-body"><canvas id="atlas" class="map-canvas" aria-label="Map of five regions. Select a destination." width="1200" height="960"></canvas><div class="map-key"><span>● Power cell</span><span>▣ Guardian</span><span>⌂ Home</span></div><div class="region-list">${REGIONS.map((reg,r)=>`<button class="region-row" data-region="${r}" ${r>region?'disabled':''}><span>${s.bosses.includes(r)?'✓':r>region?'◇':'ϟ'}</span><div><b>${reg.name}</b><small>${s.bosses.includes(r)?'Relay restored · more treasures to find':r>region?'Bridge asleep':`${cellsIn(s,r)} / ${requiredCells(r)} power cells · ${reg.boss}`}</small></div><em>${r<=region?'Go ↗':'Locked'}</em></button>`).join('')}</div></div>`);
  const key=panel.querySelector('.map-key');key.insertAdjacentHTML('beforeend','<span>＋ Charging station</span>');
  const stations=game.world.stations.filter(st=>s.discovered.includes(st.id));
  panel.querySelector('.region-list').insertAdjacentHTML('afterbegin',stations.map(st=>`<button class="region-row station-row" data-station="${st.id}"><span>＋</span><div><b>Charging station</b><small>${REGIONS[st.r].name} · 2 scrap · safe zone</small></div><em>Go ↗</em></button>`).join(''));
  const map=$('atlas'),stage=document.createElement('div');stage.className='atlas-stage';map.before(stage);stage.append(map);
  stage.insertAdjacentHTML('afterbegin','<div class="atlas-tools" role="group" aria-label="Map zoom"><output id="mapZoom" class="atlas-zoom" aria-label="Map zoom level">100%</output><button id="mapZoomOut" aria-label="Zoom out" title="Zoom out">−</button><button id="mapZoomIn" aria-label="Zoom in" title="Zoom in">+</button><button id="mapFit" aria-label="Show whole map" title="Show whole map">⛶</button></div>');
  const status=document.createElement('p');status.className='atlas-status';status.setAttribute('role','status');stage.after(status);
  const source=document.createElement('canvas');source.width=map.width;source.height=map.height;source.getContext('2d').drawImage(map,0,0);
  atlasController=mountAtlas(map,{source,onChange:zoom=>{$('mapZoom').value=`${Math.round(zoom*100)}%`;$('mapZoomOut').disabled=zoom<=1;$('mapZoomIn').disabled=zoom>=3;},onSelect:p=>{
    const {scale,ox,oy}=atlasLayout(),x=(p.x-ox)/scale,y=(p.y-oy)/scale,r=regionAt(x,y);
    if(x<0||x>=WORLD_W||y<0||y>=WORLD_H||r<0)return;
    if(r>unlockedRegion(s)){status.textContent=`Restore the ${REGIONS[r-1].name} relay to open this trail.`;return;}
    closePanel();game.moveTo({x,y});
  }});
  $('mapZoomIn').onclick=()=>atlasController.zoomBy(1.35);$('mapZoomOut').onclick=()=>atlasController.zoomBy(1/1.35);$('mapFit').onclick=()=>atlasController.reset();
}
function goRegion(r){
  const sites=game.world.sites.filter(s=>s.r===r&&!game.save.cleared.includes(s.id)).sort((a,b)=>distance(a,game.player)-distance(b,game.player));
  const o=regionOrigin(r),goal=cellsIn(game.save,r)>=requiredCells(r)&&!game.save.bosses.includes(r)?relayFor(r):sites[0]||{x:o.x+18.5,y:o.y+22.5};
  closePanel();game.moveTo(goal);
}
function pauseMenu(){
  openPanel('pause',`${head('Take a breather','Your adventure is saved.')}<div class="panel-body"><div class="pause-actions"><button class="primary" data-action="close">Keep exploring ↗</button><button class="secondary" data-action="home">Home workshop</button><button class="secondary" data-action="map">Adventure map</button></div><label class="settings-row"><span>Gentle battles</span><input type="checkbox" id="gentle" ${game.save.gentle?'checked':''}></label><label class="settings-row"><span>Sound</span><input type="checkbox" id="audio" ${game.save.sound?'checked':''}></label><p class="install-note">On iPhone: Safari → Share → Add to Home Screen. Your adventure saves on this device and works offline after its first visit.</p><p class="install-note">${BUILD} · ${Math.floor(game.save.playSeconds/60)} minutes exploring</p></div>`);
  panel.querySelector('.pause-actions').insertAdjacentHTML('beforeend','<button class="secondary" data-action="display">Display details</button>');
}
function displayDetails(){
  const rect=element=>{const r=element.getBoundingClientRect();return [r.x,r.y,r.width,r.height].map(n=>Math.round(n*100)/100);};
  const canvas=$('world'),r=canvas.getBoundingClientRect(),v=window.visualViewport;
  const report={build:buildVersion,standalone:matchMedia('(display-mode: standalone)').matches||navigator.standalone===true,screen:[screen.width,screen.height],window:[innerWidth,innerHeight],visualViewport:v?[v.width,v.height,v.offsetTop,v.scale]:null,game:rect($('game')),header:rect(document.querySelector('.topbar')),footer:rect(document.querySelector('.console')),canvasCss:[r.width,r.height],canvasPixels:[canvas.width,canvas.height],canvasScale:[canvas.width/r.width,canvas.height/r.height],headerPadding:getComputedStyle(document.querySelector('.topbar')).paddingTop,footerPadding:getComputedStyle(document.querySelector('.console')).paddingBottom};
  openPanel('display',`${head('Display details','Screen measurements only. No saved-game or personal data.')}<div class="panel-body"><pre id="displayReport" class="display-report"></pre><button class="secondary" data-action="pause">Back</button></div>`);
  $('displayReport').textContent=Object.entries(report).map(([key,value])=>`${key}: ${JSON.stringify(value)}`).join('\n');
}
function showRescue(){openPanel('rescue',`${head('A little rescue','Every good explorer gets a helping hand.','BACK HOME')}<div class="panel-body"><canvas class="celebration" id="rewardBot" width="700" height="280"></canvas><p class="dialog-copy">Your bot is fully repaired. All your equipment, parts and discoveries are safe. The rescue cost at most 1 scrap.</p><button class="primary" data-action="home">Back to the workshop ⌂</button></div>`);}
function showGuardian(r){
  if(r===4){openPanel('victory',`${head('You lit up the valley!','Five relays. One extraordinary little bot.','ADVENTURE COMPLETE')}<div class="panel-body"><canvas class="celebration" id="rewardBot" width="700" height="280"></canvas><div class="completed-stats"><div><b>${game.save.totalBots}</b><span>bots defeated</span></div><div><b>${game.save.cleared.length}</b><span>cells discovered</span></div><div><b>${game.save.owned.length}</b><span>parts built</span></div></div><p class="dialog-copy">The bridges are bright, the workshop is warm, and the valley is yours to explore. There are still treasures out there.</p><button class="primary" data-action="close">Keep adventuring ↗</button></div>`);return;}
  const p=item('weapon',REGIONS[r].reward);
  openPanel('guardian',`${head('A relay comes to life!',`${REGIONS[r+1].name} is now open`,'BIG DISCOVERY')}<div class="panel-body"><canvas id="rewardWeapon" class="celebration" width="700" height="280" data-reward="${p.id}"></canvas><h2 style="font-size:21px;margin:8px 0">${p.name} blueprint</h2><p class="dialog-copy">${p.desc} Your new blueprint is waiting at the workshop.</p><div class="pause-actions"><button class="primary" data-action="home">Build something powerful ⚙</button><button class="secondary" data-action="close">Keep exploring ↗</button></div></div>`);
  tone(500,.5,'triangle',.04,1500);
}
panel.addEventListener('cancel',e=>{e.preventDefault();closePanel();});
panel.addEventListener('click',e=>{
  const button=e.target.closest('button');if(!button||button.disabled)return;
  if(button.dataset.tab){workTab=button.dataset.tab;const top=panel.scrollTop;workshop();panel.scrollTop=top;}
  if(button.dataset.color){game.save.color=button.dataset.color;persist();workshop();}
  if(button.dataset.part){const id=button.dataset.part,scroll=panel.scrollTop;if(game.save.owned.includes(id))game.equip(workTab,id);else game.craft(workTab,id);workshop();panel.scrollTop=scroll;}
  if(button.dataset.region!==undefined)goRegion(Number(button.dataset.region));
  if(button.dataset.station){const station=game.world.stations.find(s=>s.id===button.dataset.station);closePanel();if(station)game.moveTo(station);}
  const action=button.dataset.action;
  if(action==='close')closePanel();
  if(action==='home')workshop();
  if(action==='map')adventureMap();
  if(action==='display')displayDetails();
  if(action==='pause')pauseMenu();
  if(action==='depart'){closePanel();game.depart();painter.camera={x:game.player.x,y:game.player.y};}
  if(action==='repair'){game.repair();closePanel();}
});
panel.addEventListener('change',e=>{if(e.target.id==='gentle')game.save.gentle=e.target.checked;if(e.target.id==='audio'){game.save.sound=e.target.checked;tone(700);}persist();});
function drawPanels(){
  const t=game.time;
  const preview=$('botPreview');if(preview){const r=preview.getBoundingClientRect(),dpr=Math.min(devicePixelRatio,2);if(preview.width!==Math.round(r.width*dpr)||preview.height!==Math.round(r.height*dpr)){preview.width=Math.round(r.width*dpr);preview.height=Math.round(r.height*dpr);}const c=preview.getContext('2d');c.setTransform(dpr,0,0,dpr,0,0);c.clearRect(0,0,r.width,r.height);const width=r.width,size=Math.min(102,(width*.6-8)/.98);rounded(c,12,137,width-24,13,5,'#43615b');rounded(c,17,131,width-34,9,3,'#829f8a');for(let i=0;i<4;i++){c.fillStyle='#d5b95f';c.fillRect(22+i*(width-40)/4,140,10,2);}bot(c,width*.38,132-size*.39,size,{color:game.save.color,armor:game.save.build.armor,wheels:game.save.build.wheels,gun:game.save.build.weapon,angle:-.25},t);}
  document.querySelectorAll('canvas[data-item]').forEach(canvas=>{const c=canvas.getContext('2d'),id=canvas.dataset.item;c.clearRect(0,0,136,136);c.save();c.scale(2,2);if(workTab==='weapon'){c.translate(17,36);c.scale(.8,.8);weapon(c,id,t);}else{const o={color:'#9fceba',gun:'none',armor:workTab==='armor'?id:'light',wheels:workTab==='wheels'?id:'basic'};bot(c,32,32,49,o,t);if(workTab==='gadget'&&id!=='none'){c.font='bold 23px system-ui';c.textAlign='center';c.fillStyle=id==='repair'?'#a7efc8':id==='shield'?'#a3e8ff':'#ffda6b';c.fillText(id==='repair'?'+':id==='shield'?'◈':'∩',50,55);}}c.restore();});
  const atlas=$('atlas');if(atlas&&!atlasController)painter.map(atlas,game);
  const reward=$('rewardWeapon');if(reward){const c=reward.getContext('2d');c.clearRect(0,0,700,280);c.save();c.translate(230,145);c.scale(4,4);weapon(c,reward.dataset.reward,t,.1);c.restore();}
  const rb=$('rewardBot');if(rb){const c=rb.getContext('2d');c.clearRect(0,0,700,280);bot(c,350,140,170,{color:game.save.color,armor:game.save.build.armor,wheels:game.save.build.wheels,gun:game.save.build.weapon},t);}
}
$('pause').onclick=pauseMenu;$('map').onclick=adventureMap;$('questRoute').onclick=adventureMap;
$('home').onclick=workshop;$('workshop').onclick=workshop;$('boost').onclick=()=>game.boost();
$('sound').onclick=()=>{game.save.sound=!game.save.sound;tone(700);persist();};
let interaction='';
$('interact').onclick=()=>{if(interaction==='home')workshop();else if(interaction==='repair')game.repair();else if(interaction==='guardian'){const r=regionAt(game.player.x,game.player.y);toast(REGIONS[r].hint);game.moveTo(relayFor(r));}};
let pressed=false,pressPoint;
$('world').addEventListener('pointerdown',e=>{if(game.paused)return;pressed=true;pressPoint={x:e.clientX,y:e.clientY};const rect=$('world').getBoundingClientRect(),pos=painter.screenToWorld(e.clientX-rect.left,e.clientY-rect.top);const enemy=game.enemies.filter(n=>n.hp>0&&!n.dormant&&distance(n,pos)<.7).sort((a,b)=>distance(a,pos)-distance(b,pos))[0],station=game.world.stations.find(s=>s.r<=unlockedRegion(game.save)&&distance(s,pos)<1.8);if(station)game.moveTo(station);else if(enemy)game.focusEnemy(enemy);else game.moveTo(pos);$('world').setPointerCapture(e.pointerId);});
$('world').addEventListener('pointermove',e=>{if(!pressed||game.paused||Math.hypot(e.clientX-pressPoint.x,e.clientY-pressPoint.y)<20)return;const rect=$('world').getBoundingClientRect();game.moveTo(painter.screenToWorld(e.clientX-rect.left,e.clientY-rect.top));pressPoint={x:e.clientX,y:e.clientY};});
for(const event of ['pointerup','pointercancel'])$('world').addEventListener(event,()=>pressed=false);
window.addEventListener('keydown',e=>{if(panel.open)return;const directions={ArrowUp:[0,-1],ArrowDown:[0,1],ArrowLeft:[-1,0],ArrowRight:[1,0],w:[0,-1],s:[0,1],a:[-1,0],d:[1,0]};if(directions[e.key]){e.preventDefault();const [dx,dy]=directions[e.key];game.moveTo({x:Math.floor(game.player.x)+dx+.5,y:Math.floor(game.player.y)+dy+.5});}if(e.code==='Space'){e.preventDefault();game.boost();}if(e.key==='Escape')pauseMenu();});
window.addEventListener('resize',()=>painter.resize());
document.addEventListener('visibilitychange',()=>{if(document.hidden){wasPaused=game.paused;game.paused=true;persist();}else{game.paused=panel.open||wasPaused;last=performance.now();painter.resize();}});
window.addEventListener('pagehide',persist);
function hud(){
  const s=game.save,r=regionAt(game.player.x,game.player.y),max=game.maxHp(),current=Math.ceil(game.player.hp);
  $('regionName').textContent=REGIONS[r].name;$('scrapCount').textContent=s.scrap;$('healthText').textContent=`${current} / ${max}`;$('healthFill').style.width=`${Math.max(0,game.player.hp/max*100)}%`;$('healthFill').style.background=game.player.hp/max<.3?'#f49b7d':'#94e5b1';$('weaponLabel').textContent=item('weapon',s.build.weapon).name;
  $('healthText').parentElement.classList.toggle('critical',game.player.hp/max<=.18);
  if(game.charging)$('weaponLabel').textContent='Charging…';else if(game.player.hp/max<=.18)$('weaponLabel').textContent='Needs repairs!';else if(game.player.hp/max<=.5)$('weaponLabel').textContent='Damaged';
  const goal=unlockedRegion(s),cells=cellsIn(s,goal),required=requiredCells(goal);
  $('questTitle').textContent=s.completed?'The valley is shining':cells>=required?REGIONS[goal].boss:`Wake the ${['first','second','third','fourth','last'][goal]} relay`;
  $('questDetail').textContent=s.completed?`${s.cleared.length} / ${TOTAL_CELLS} cells · ${s.chests.length} / 35 treasures`:cells>=required?`Guardian ready · ${REGIONS[goal].name}`:`${Math.min(required,cells)} / ${required} power cells · ${REGIONS[goal].name}`;
  $('boostLabel').textContent=game.boostTime>0?'SUPER!':game.boostCd>0?`${Math.ceil(game.boostCd)}s`:'Power';$('boost').classList.toggle('cooldown',game.boostCd>0&&game.boostTime<=0);$('boost').disabled=game.boostCd>0;
  $('soundLabel').textContent=s.sound?'Sound on':'Sound off';$('sound').setAttribute('aria-label',s.sound?'Turn sound off':'Turn sound on');
  const bosses=game.enemies.filter(e=>e.type==='boss'&&e.r===r&&e.hp>0&&game.bossAwake(r)&&distance(e,game.player)<7);
  $('toast').classList.toggle('boss-active',bosses.length>0);
  $('bossHud').hidden=!bosses.length;if(bosses.length){$('bossName').textContent=REGIONS[r].boss;$('bossHealth').style.width=`${bosses.reduce((v,e)=>v+e.hp,0)/REGIONS[r].hp*100}%`;}
  interaction='';
  if(game.isHome())interaction='home';
  else if(game.stationNear()&&game.player.hp<max-1&&!game.charging)interaction='repair';
  else if(distance(game.player,relayFor(r))>4&&distance(game.player,relayFor(r))<6&&game.bossAwake(r))interaction='guardian';
  $('interact').hidden=!interaction;$('interact').textContent={home:'⌂ Home workshop · free repairs',repair:'＋ Recharge · ◆ 2',guardian:'ϟ Guardian ahead'}[interaction]||'';
}
function loop(now){const dt=Math.min(.06,(now-last)/1000);last=now;game.tick(dt);painter.draw(game,game.time,dt);if(frame++%5===0)hud();if(panel.open&&frame%3===0)drawPanels();if(now-lastSave>2200){persist();lastSave=now;}requestAnimationFrame(loop);}
hud();requestAnimationFrame(loop);
if(!game.save.intro){game.save.intro=true;setTimeout(()=>{if(!game.enemies.some(e=>e.type==='boss'&&e.hp>0&&game.bossAwake(e.r)&&distance(e,game.player)<7))banner('A little bot. A big adventure.',REGIONS[regionAt(game.player.x,game.player.y)].name);},500);persist();}
if('serviceWorker' in navigator){navigator.serviceWorker.register('./sw.js',{scope:'./',updateViaCache:'none'}).catch(()=>{});}
async function checkVersion(){try{const res=await fetch(`./version.json?check=${Date.now()}`,{cache:'no-store'});if(!res.ok)return;const live=await res.json();if(live.build!==buildVersion&&!game.enemies.some(e=>e.active&&e.hp>0)&&!panel.open){persist();const regs=await navigator.serviceWorker?.getRegistrations();for(const reg of regs||[])if(reg.scope===new URL('./',location.href).href)await reg.unregister();for(const key of await caches.keys())if(key.startsWith('bot-adventure-'))await caches.delete(key);location.replace(`./index.html?fresh=${Date.now()}`);}}catch{}}
window.addEventListener('online',checkVersion);window.addEventListener('focus',checkVersion);setTimeout(checkVersion,2500);
