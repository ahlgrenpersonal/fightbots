import {applyHalloween,halloweenActive} from './halloween.js?v=world92';
import { MORE_REGIONS, NEW_EQUIPMENT, WORKSHOPS, RETURNS as STORY_RETURNS, ENCOUNTERS, LEGACY_WORKSHOPS, LEGACY_RETURNS, LEGACY_ENCOUNTERS } from './content.js?v=world92';
import {LEGACY_TILES,WORLD_TILES,relocatePoint,relocateEntity,legacyPoint,worldGates} from './topology.js?v=world92';
import {PANTHEON,inPantheon,buildPantheon} from './pantheon.js?v=world92';
import {applyReplayVariants} from './replay-variants.js?v=world92';
import {applyReplayColors} from './replay-colors.js?v=world92';
export {PANTHEON};
export { WORKSHOPS, ENCOUNTERS };
export { bossProfile } from './content.js?v=world92';
export const BUILD = 'world92';
export const REGION_W = 36;
export const REGION_H = 44;
export const WORLD_W = REGION_W * 5;
export const WORLD_H = REGION_H * 7;
export const MAIN_Y = WORKSHOPS[0].y;
export const REQUIRED_CELLS = 5;
export const requiredCells = r => r%5<3?12:8;
export const HOME = {x:WORKSHOPS[0].x,y:WORKSHOPS[0].y};
export const REGION_LAYOUT = WORLD_TILES.map(t=>t[0]);
export const REGION_TILES = WORLD_TILES;
export const GATES=worldGates();
const TILE_OWNERS=new Map(REGION_TILES.flatMap((tiles,r)=>tiles.map(([x,y])=>[`${x},${y}`,r])));
const OLD_OWNERS=new Map(LEGACY_TILES.flatMap((tiles,r)=>tiles.map(([x,y])=>[`${x},${y}`,r])));
const legacyRegionAt=(x,y)=>OLD_OWNERS.get(`${Math.floor(x/REGION_W)},${Math.floor(y/REGION_H)}`)??-1;
export const regionOrigin = r => ({x:REGION_LAYOUT[r][0]*REGION_W,y:REGION_LAYOUT[r][1]*REGION_H});
const GUARDIAN_CLEARINGS=[[1,25.5,10.5],[1,25.5,33.5],[1,26.5,12.5],[0,10.5,14.5],[0,25.5,10.5],[1,25.5,10.5],[1,23.5,29.5],[1,25.5,32.5],[0,10.5,10.5],[0,12.5,13.5]];
const legacyRelay = r => {
  if(r<5){const [tx,ty]=LEGACY_TILES[r][0];return {x:tx*REGION_W+30.5,y:ty*REGION_H+6.5};}
  const [tile,x,y]=GUARDIAN_CLEARINGS[r-5],[tx,ty]=LEGACY_TILES[r][tile];return {x:tx*REGION_W+x,y:ty*REGION_H+y};
};
export const relayFor=r=>relocatePoint(legacyRelay(r));
export const atlasLayout = () => {const scale=Math.min(552/WORLD_W,712/WORLD_H);return {scale,ox:(600-WORLD_W*scale)/2,oy:(760-WORLD_H*scale)/2};};
export const COLORS = ['#ee6954', '#459de0', '#57bd85', '#f4c54b', '#f28d42', '#ac7fe0'];
export const REGIONS = [
  { name: 'Clover Fields', subtitle: 'A little spark of adventure', ground: '#85b979', dark: '#477d58', path: '#c6c59a', water: '#61b8b8', accent: '#ffe17b', boss: 'The Rusty Rambler', hint: 'A heavy stomp. Keep moving when the ground turns red.', reward: 'saw', hp: 150, damage: 8 },
  { name: 'Copperwood', subtitle: 'Copper leaves and forgotten machines', ground: '#698775', dark: '#365c58', path: '#c4b797', water: '#416f79', accent: '#ecb06b', boss: 'The Iron Twins', hint: 'Two guardians. The saw is great up close.', reward: 'hammer', hp: 310, damage: 11 },
  { name: 'Crystal Creek', subtitle: 'High peaks and glowing crystals', ground: '#b5cbd1', dark: '#57758a', path: '#d9e5df', water: '#569db6', accent: '#c7ffff', boss: 'Prism Warden', hint: 'Watch the bright circles. A hammer breaks its shell.', reward: 'lightning', hp: 640, damage: 14 },
  { name: 'Sunforge', subtitle: 'The great solar foundry', ground: '#9da49b', dark: '#5d6f70', path: '#d7bda1', water: '#7a5147', accent: '#ffcb6c', boss: 'The Furnace King', hint: 'Little helpers surround it. Lightning jumps between them.', reward: 'rocket', hp: 1100, damage: 17 },
  { name: 'Sky Station', subtitle: 'The last relay above the clouds', ground: '#9ca8c8', dark: '#64768f', path: '#c9d6e7', water: '#273e58', accent: '#a8f3f0', boss: 'The Storm Engine', hint: 'Your rocket launcher was made for this.', reward: 'flame', hp: 2200, damage: 19 },
  ...MORE_REGIONS
];
export const TOTAL_CELLS=REGIONS.reduce((sum,_,r)=>sum+requiredCells(r),0);
// Replays reuse five widely spaced, already-connected campaign clearings.
// Clover Fields stays a peaceful home region.
export const RETURNS=[...STORY_RETURNS,...REGIONS.flatMap((region,r)=>{
  if(r<2)return [];
  const tiles=LEGACY_TILES[r],a=tiles[0],b=tiles[1];
  const points=[[6.5,6.5],[29.5,17.5],[7.5,38.5],...(r===2?[[42.5,7.5],[43.5,38.5]]:b?[[6.5+(b[0]-a[0])*36,7.5+(b[1]-a[1])*44],[9.5+(b[0]-a[0])*36,37.5+(b[1]-a[1])*44]]:[[27.5,29.5],[16.5,40.5]])];
  const sites=points.map(([x,y])=>relocatePoint({x:a[0]*36+x,y:a[1]*44+y})).map(p=>[p.x,p.y]);
  return [{id:`replay-${r}`,r,postRoyal:true,replay:true,boss:region.boss,...relayFor(r),sitePrefix:`replay-site-${r}`,sites,sourceSites:(b?[1,2,3,5,7]:[1,2,3,6,7]).map(i=>`site-${r}-${i}`)}];
})];
// Each takeover repopulates five established camp clearings in every region.
export const HALLOWEEN_MISSIONS=REGIONS.map((reg,r)=>{
  const source=RETURNS.find(m=>m.replay&&m.r===r);
  const [tx,ty]=LEGACY_TILES[r][0];
  const points=r===0?[[6.5,6.5],[29.5,17.5],[7.5,38.5],[10.5,60.5],[28.5,70.5]]:[[6.5,6.5],[29.5,17.5],[7.5,38.5],[6.5,-36.5],[9.5,-6.5]];
  const sites=source?.sites||points.map(([x,y])=>relocatePoint({x:tx*36+x,y:ty*44+y})).map(p=>[p.x,p.y]);
  return {id:`haunt-${r}`,r,postRoyal:true,halloween:true,boss:reg.boss,...relayFor(r),sitePrefix:`haunt-site-${r}`,sites,
    sourceSites:source?.sourceSites||[1,2,3,5,7].map(i=>`site-${r}-${r===0&&i===7?6:i}`)};
});
RETURNS.push(...HALLOWEEN_MISSIONS);
export const TOTAL_TREASURES=REGIONS.length*7;
export const returnActive=(save,m)=>!!m&&(m.halloween?halloweenActive(save)&&save.replay.phase==='region'&&!(save.replay.conquered||[]).includes(m.id):m.postRoyal?(save.replay?!halloweenActive(save)&&save.replay.phase==='region'&&save.replay.mission===m.id:m.id==='copper-twins'&&save.royalCourt?.phase==='victory'):save.bosses.includes(m.unlock-1))&&!(save.returns||[]).includes(m.id);
export const currentMission=save=>RETURNS.find(m=>m.id===save.replay?.mission&&returnActive(save,m))||RETURNS.find(m=>returnActive(save,m));
// The original FightBots' square chassis, eyes, colors and armor motifs are retained.
// Adventure equipment has its own progression and continuous-time combat rules.
export const EQUIPMENT = {
  weapon: [
    { id: 'bumper', name: 'Bumper', desc: 'A spring-loaded punch. A brave little beginning.', damage: 6, range: 1.4, rate: .65, cost: 0, gears: 0, unlock: -1, power: 1 },
    { id: 'blaster', name: 'Blaster', desc: 'Bright energy bolts. Reach bots from a distance.', damage: 10, range: 3, rate: .75, cost: 16, gears: 2, unlock: -1, power: 2 },
    { id: 'saw', name: 'Buzz Saw', desc: 'A spinning steel blade. Lots of very quick hits.', damage: 12, range: 1.65, rate: .3, cost: 32, gears: 3, unlock: 0, power: 3 },
    { id: 'hammer', name: 'Thunder Hammer', desc: 'A mighty slam. Smashes several bots at once.', damage: 42, range: 1.9, rate: 1.05, cost: 55, gears: 4, unlock: 1, power: 4 },
    { id: 'lightning', name: 'Arc Caster', desc: 'Crackling lightning jumps between nearby bots.', damage: 32, range: 2.8, rate: .65, cost: 85, gears: 5, unlock: 2, power: 5 },
    { id: 'rocket', name: 'Rocket Launcher', desc: 'Big rockets. Big explosions. Big smiles.', damage: 105, range: 3.2, rate: 1.35, cost: 130, gears: 6, unlock: 3, power: 6 }
  ],
  armor: [
    { id: 'light', name: 'Explorer Shell', desc: 'Light and colorful, with room to grow.', hp: 70, defense: 0, cost: 0, gears: 0, unlock: -1 },
    { id: 'steel', name: 'Steel Armor', desc: 'Riveted plates. More health for longer adventures.', hp: 115, defense: 1, cost: 24, gears: 2, unlock: -1 },
    { id: 'heavy', name: 'Heavy Armor', desc: 'Big shoulder plates and a very tough shell.', hp: 185, defense: 2, cost: 65, gears: 4, unlock: 1 },
    { id: 'reflect', name: 'Prism Armor', desc: 'A brilliant shield. Reflects some enemy damage.', hp: 155, defense: 2, reflect: true, cost: 95, gears: 5, unlock: 2 }
  ],
  wheels: [
    { id: 'basic', name: 'Explorer Wheels', desc: 'A trusty pair of all-terrain wheels.', speed: 2.15, cost: 0, gears: 0, unlock: -1 },
    { id: 'grip', name: 'Trail Tires', desc: 'Chunky tires. A little quicker everywhere.', speed: 2.6, cost: 28, gears: 2, unlock: -1 },
    { id: 'speed', name: 'Turbo Wheels', desc: 'Bright blue wheels. Zoom across the valley.', speed: 3.25, cost: 60, gears: 4, unlock: 1 },
    { id: 'treads', name: 'Tank Tracks', desc: 'Sturdy tracks. Extra health and steady movement.', speed: 2.45, hp: 40, cost: 70, gears: 4, unlock: 2 }
  ],
  gadget: [
    { id: 'none', name: 'Tool Pocket', desc: 'Ready for something wonderful.', cost: 0, gears: 0, unlock: -1 },
    { id: 'magnet', name: 'Loot Magnet', desc: 'Pulls in scrap and parts from far away.', cost: 22, gears: 2, unlock: -1 },
    { id: 'repair', name: 'Charge Coupler', desc: 'Recharges twice as fast when parked at a charging station.', cost: 50, gears: 3, unlock: 0 },
    { id: 'shield', name: 'Bubble Shield', desc: 'Blocks one hit every eight seconds.', cost: 80, gears: 5, unlock: 2 }
  ]
};
export const STARTERS = { weapon: 'bumper', armor: 'light', wheels: 'basic', gadget: 'none' };
for(const type of Object.keys(NEW_EQUIPMENT))EQUIPMENT[type].push(...NEW_EQUIPMENT[type]);
export function item(type, id) { return EQUIPMENT[type].find(p => p.id === id) || EQUIPMENT[type][0]; }
export function stats(save) {
  const armor = item('armor', save.build.armor), wheels = item('wheels', save.build.wheels);
  return { hp: armor.hp + (wheels.hp || 0), defense: armor.defense, speed: wheels.speed, weapon: item('weapon', save.build.weapon) };
}
export function freshSave() {
  return { schema: 1, worldLayout: 3, siteLayout: 5, returns:[], scrap: 0, gears: 0, build: { ...STARTERS }, color: COLORS[0], owned: Object.values(STARTERS), cleared: [], bosses: [], kills: [], chests: [], discovered: [], visited: [], position: { ...HOME }, hp: 70, totalBots: 0, playSeconds: 0, sound: false, gentle: true, completed: false, intro: false };
}
export function migrateWorldLayout(save){
  if(save.worldLayout===3)return save;
  save.position=save.worldLayout===2?relocatePoint(save.position)||{...HOME}:{...HOME};
  if(save.worldLayout===2&&save.patrols&&typeof save.patrols==='object')for(const record of Object.values(save.patrols)){
    if(Array.isArray(record?.mobs))record.mobs=record.mobs.map(m=>{const point=relocatePoint(m);return point?{...m,...point}:null;}).filter(Boolean);
  }
  save.worldLayout=3;return save;
}
export function migrateSiteProgress(save){
  save.returns ||= [];
  save.completed=save.bosses.includes(REGIONS.length-1);
  if(save.siteLayout===5)return save;
  if(save.siteLayout===4){
    const credited=new Set(save.cleared);
    for(const r of save.bosses)for(let i=0;i<requiredCells(r);i++)credited.add(`site-${r}-${i}`);
    save.cleared=[...credited];save.siteLayout=5;return save;
  }
  if(save.siteLayout===3){
    const credited=new Set(save.cleared.filter(id=>/^site-[0-4]-[0-7]$/.test(id)&&Number(id.split('-')[2])<(id.startsWith('site-0-')?8:5)));
    for(const r of save.bosses)for(let i=0;i<requiredCells(r);i++)credited.add(`site-${r}-${i}`);
    save.cleared=[...credited];save.siteLayout=5;return save;
  }
  const cleared=[];
  for(let r=0;r<5;r++){
    const old=[...new Set(save.cleared.filter(id=>new RegExp(`^site-${r}-[0-9]$`).test(id)))];
    const count=save.bosses.includes(r)?requiredCells(r):Math.min(old.length,requiredCells(r));
    const mapping=r===0?[1,4,0,2,0,4,3,5,6,7]:[1,1,0,2,0,4,3,3,4,4];
    const credited=new Set(old.map(id=>mapping[Number(id.split('-')[2])]));
    for(let i=0;credited.size<count;i++)credited.add(i);
    for(const i of credited)cleared.push(`site-${r}-${i}`);
  }
  save.cleared=cleared;
  // Rebuild unfinished patrols at their new locations, without paying completed sites twice.
  save.kills=save.kills.filter(id=>typeof id==='string'&&!id.startsWith('site-'));
  save.siteLayout=5;return save;
}
export function hash(x, y, seed = 17) {
  let n = Math.imul(x + seed, 374761393) ^ Math.imul(y + seed, 668265263);
  n = Math.imul(n ^ (n >>> 13), 1274126177);
  return ((n ^ (n >>> 16)) >>> 0) / 4294967296;
}
export function regionAt(x,y) {
  if(inPantheon(x,y))return PANTHEON.r;
  const sx=Math.floor(x/REGION_W),sy=Math.floor(y/REGION_H);
  return TILE_OWNERS.get(`${sx},${sy}`)??-1;
}
function legacyRoad(x,y) {
  const r=legacyRegionAt(x,y);if(r<0)return false;
  if(r===0&&y>=REGION_H*2)return Math.abs(x-54.5)<1.2||([105.5,118.5].some(v=>Math.abs(y-v)<1.2)&&x>43&&x<68);
  const p={x:Math.floor(x/REGION_W)*REGION_W,y:Math.floor(y/REGION_H)*REGION_H};
  return Math.abs(y-(p.y+22.5))<1.2||Math.abs(x-(p.x+18.5))<1.2;
}
export function isRoad(x,y){const p=legacyPoint({x,y});return !!p&&legacyRoad(p.x,p.y);}
export function enemyHealth(r,type){
  const base=r<5?[13,28,55,95,165][r]:180+(r-5)*28;
  const original=base*(['tank','carrier'].includes(type)?1.6:1);
  const heavy=[420,420,600,650,700,850,1100,1150,1400,1650][r-5]||0;
  return Math.max(original,['tank','carrier'].includes(type)?heavy:type==='shield'?heavy*.8:0);
}
export function makeWorld(save) {
  // Build established sectors in their original coordinates, then relocate them intact.
  const WORLD_W=324,WORLD_H=132,REGION_TILES=LEGACY_TILES,REGION_LAYOUT=LEGACY_TILES.map(t=>t[0]);
  const HOME={x:54.5,y:66.5},WORKSHOPS=LEGACY_WORKSHOPS,RETURNS=LEGACY_RETURNS,ENCOUNTERS=LEGACY_ENCOUNTERS;
  const regionAt=legacyRegionAt,isRoad=legacyRoad,relayFor=legacyRelay;
  const regionOrigin=r=>({x:REGION_LAYOUT[r][0]*REGION_W,y:REGION_LAYOUT[r][1]*REGION_H});
  const sites = [], enemies = [], chests = [], stations = [], props = [], blocks = new Set(), water = new Set();
  const arenas=REGIONS.map((_,r)=>({r,...relayFor(r),radius:3.8}));
  const offsets = [[10,25],[6,6],[29,17],[7,38],[29,39]];
  for (let r = 0; r < REGIONS.length; r++) {
    const origin=regionOrigin(r);
    const extension=REGION_TILES[r][1],delta=extension?[(extension[0]-REGION_LAYOUT[r][0])*REGION_W,(extension[1]-REGION_LAYOUT[r][1])*REGION_H]:null;
    const farStation=r<5?[[29.5,74.5],[20.5,-20.5],[56.5,25.5],[32.5,25.5],[32.5,25.5]][r]:delta?[delta[0]+20.5,delta[1]+25.5]:[32.5,25.5];
    for(const [i,[x,y]] of [[4.5,23.5],farStation].entries())stations.push({id:`station-${r}-${i}`,r,x:origin.x+x,y:origin.y+y});
    const positions=r===0?[...offsets,[10,60],[28,70],[14,85],[20,7],[25,51],[8,74],[28,84]]:r===1?[...offsets,[6,-37],[29,-23],[9,-7],[20,7],[20,-39],[5,-22],[28,-6]]:r===2?[...offsets,[42,7],[65,23],[43,38],[20,7],[56,5],[41,22],[64,38]]:delta?[...offsets,...[[6,7],[29,21],[9,37]].map(([x,y])=>[x+delta[0],y+delta[1]]),[20,7],...[[20,5],[5,22],[28,38]].map(([x,y])=>[x+delta[0],y+delta[1]])]:[...offsets,[20,7],[27,29],[16,40]];
    positions.forEach(([ox,oy], i) => {
      const x = origin.x + ox, y=origin.y+oy, id = `site-${r}-${i}`;
      const formation=(i+r)%4;
      const site = { id, r, x: x + .5, y: y + .5, index: i, formation };
      sites.push(site);
      const n = r === 0 ? 4 : 5;
      for (let wave = 0; wave < 2; wave++) for (let j = 0; j < n; j++) {
        const a = j * Math.PI * 2 / n+wave*.45;
        const offset=formation===0?[Math.cos(a)*1.45,Math.sin(a)*1.45]:formation===1?[(j-(n-1)/2)*.7,(j%2?1:-1)*.9]:formation===2?[Math.cos(a)*1.8,Math.sin(a)*.85]:[(j%2?1:-1)*1.35,(Math.floor(j/2)-1)*1.1];
        const ex = x + .5 + offset[0], ey = y + .5 + offset[1];
        const type = r<5?(j === n - 1 && r > 0 ? 'ranged' : j % 3 === 2 ? 'tank' : 'scout'):['scout','shield','hopper','medic','carrier','burrow','sentry'][(r+j+wave)%7];
        const hp = enemyHealth(r,type);
        const enemy={ id: `${id}-${wave}-${j}`, site: id, wave, dormant: wave > 0, r, x: ex, y: ey, homeX: ex, homeY: ey, hp, maxHp: hp, type, damage:r<5?[2,3,4,5,6][r]:7+Math.floor((r-5)*.7), cd: hash(i,j,r) * 2, hit: 0, swing: 0, angle: 0 };
        enemies.push(enemy);
        if(type==='carrier')for(let k=0;k<2;k++)enemies.push({...enemy,id:`${enemy.id}-mini-${k}`,type:'hopper',spawnParent:enemy.id,dormant:true,hp:hp*.2,maxHp:hp*.2,x:ex+(k-.5)*.4,homeX:ex+(k-.5)*.4});
      }
    });
    const {x:bx,y:by} = relayFor(r);
    const count = r === 1 ? 2 : 1;
    for (let j = 0; j < count; j++) {
      const hp = REGIONS[r].hp / count;
      enemies.push({ id: `boss-${r}-${j}`, r, x: bx + (count === 2 ? j * 2 - 1 : 0), y: by, homeX: bx, homeY: by, hp, maxHp: hp, type: 'boss', damage: REGIONS[r].damage, cd: 2.5 + j, hit: 0, swing: 0, angle: 0 });
    }
    for (const [i,[x,y]] of [[3.5,4.5],[15.5,12.5],[32.5,21.5],[3.5,29.5],[14.5,33.5],[23.5,41.5],[32.5,42.5]].entries()){
      const extra=r===0?[[10.5,55.5],[28.5,72.5],[18.5,85.5]]:r===1?[[13.5,-32.5],[31.5,-12.5],[3.5,-4.5]]:r===2?[[44.5,13.5],[60.5,34.5],[68.5,5.5]]:delta?[[delta[0]+12.5,delta[1]+12.5],[delta[0]+30.5,delta[1]+33.5],[delta[0]+5.5,delta[1]+39.5]]:null;
      const p=extra&&i>=4?extra[i-4]:[x,y];chests.push({id:`chest-${r}-${i}`,r,x:origin.x+p[0],y:origin.y+p[1]});
    }
  }
  for(const mission of RETURNS){
    arenas.push({r:mission.r,x:mission.x,y:mission.y,radius:3.8,returnId:mission.id});
    for(const [i,[x,y]] of mission.sites.entries()){
      const site={id:`${mission.sitePrefix}-${i}`,r:mission.r,x,y,index:i,returnId:mission.id,unlock:mission.unlock};sites.push(site);
      const count=mission.postRoyal?5:4;
      for(let j=0;j<count;j++){
        const a=j*Math.PI*2/count,type=mission.postRoyal?['tank','ranged','shield','scout','sentry'][j]:j%2?'shield':'sentry';
        const hp=mission.postRoyal?type==='tank'?2400:type==='shield'?1900:1600:mission.unlock===8?170:340;
        enemies.push({id:`${site.id}-bot-${j}`,site:site.id,wave:0,dormant:false,r:mission.r,x:x+Math.cos(a)*1.3,y:y+Math.sin(a)*1.3,homeX:x+Math.cos(a)*1.3,homeY:y+Math.sin(a)*1.3,hp,maxHp:hp,type,damage:mission.postRoyal?12:8,cd:j*.3,hit:0,swing:0,angle:0,returnId:mission.id,unlock:mission.unlock});
      }
    }
    for(let twin=0;twin<(mission.postRoyal?2:1);twin++)enemies.push({id:`${mission.id}-boss${mission.postRoyal?`-${twin}`:''}`,r:mission.r,x:mission.x+(mission.postRoyal?twin*2.6-1.3:0),y:mission.y,homeX:mission.x,homeY:mission.y,hp:mission.hp,maxHp:mission.hp,type:'boss',damage:mission.postRoyal?18:16,cd:2+twin,hit:0,swing:0,angle:0,returnId:mission.id,unlock:mission.unlock,...(mission.postRoyal?{twin,size:1.85}:{})});
  }
  for(const encounter of ENCOUNTERS){
    arenas.push({...encounter,radius:3.8,encounterId:encounter.id});
    const add=(role,dx,dy,hp,size,extra={})=>enemies.push({
      id:`${encounter.id}-${role}`,encounterId:encounter.id,encounterRole:role,r:encounter.r,
      x:encounter.x+dx,y:encounter.y+dy,homeX:encounter.x,homeY:encounter.y,
      hp,maxHp:hp,type:'boss',damage:role==='skirmisher'?9:role==='fragment'?7:13,
      size,cd:2.5,hit:0,swing:0,angle:0,...extra
    });
    if(encounter.id==='harbor-duo'){
      add('bruiser',-.8,.8,560,1.65);
      add('skirmisher',1.3,-1.1,270,1.12);
    }else{
      add('splitter',0,0,720,1.85);
      for(let i=0;i<2;i++)add('fragment',(i-.5)*2.2,0,210,1.05,{id:`${encounter.id}-fragment-${i}`,spawnParent:`${encounter.id}-splitter`,dormant:true});
    }
  }
  for(const enemy of enemies)if(enemy.type==='boss'){enemy.hp*=2;enemy.maxHp*=2;}
  const spurs=[...sites,...chests,...stations].map(p=>{
    const tx=Math.floor(p.x/REGION_W)*REGION_W+18.5,ty=Math.floor(p.y/REGION_H)*REGION_H+22.5;
    const targets=p.r===0&&p.y>=88?[{x:HOME.x,y:p.y},{x:p.x,y:105.5},{x:p.x,y:118.5}]:[{x:tx,y:p.y},{x:p.x,y:ty}];
    targets.sort((a,b)=>Math.hypot(a.x-p.x,a.y-p.y)-Math.hypot(b.x-p.x,b.y-p.y));return {x1:Math.min(p.x,targets[0].x),x2:Math.max(p.x,targets[0].x),y1:Math.min(p.y,targets[0].y),y2:Math.max(p.y,targets[0].y)};
  });
  const reserved = (x,y) => isRoad(x+.5,y+.5) || spurs.some(p=>x+.5>=p.x1-.55&&x+.5<=p.x2+.55&&y+.5>=p.y1-.55&&y+.5<=p.y2+.55) || sites.some(s => Math.abs(x+.5-s.x) < 2.8 && Math.abs(y+.5-s.y) < 2.8) || chests.some(s => Math.abs(x+.5-s.x)<1.8 && Math.abs(y+.5-s.y)<1.8) || stations.some(s=>Math.hypot(x+.5-s.x,y+.5-s.y)<3.8) || arenas.some(a=>Math.hypot(x+.5-a.x,y+.5-a.y)<4) || WORKSHOPS.some(h=>Math.abs(x-h.x)<4&&Math.abs(y-h.y)<5);
  for (let y=1;y<WORLD_H-1;y++) for(let x=1;x<WORLD_W-1;x++) {
    const r=regionAt(x,y);
    if(r<0){blocks.add(`${x},${y}`);if(x<REGION_W)water.add(`${x},${y}`);else if(hash(x,y)<.36)props.push({x:x+.5,y:y+.5,type:'mountain',r:4,seed:hash(x,y)});continue;}
    if (reserved(x,y)) continue;
    const lx=x%REGION_W,ly=y%REGION_H,biome=r<5?r:[0,3,1,4,3,2,2,1,4,3][r-5];
    const pond=biome===0?[[14,17,3.3,4.1],[25,33,3.6,3.2],[12,40,3.5,3]].some(([px,py,rx,ry])=>((lx-px)/rx)**2+((ly-py)/ry)**2<1)||(y>96&&r===0&&Math.abs(x-54)>5&&hash(Math.floor(x/3),Math.floor(y/4))<.75):biome===1?((lx-25)/2.2)**2+((ly-34)/4)**2<1:biome===2?((lx-12)/2)**2+((ly-32)/5)**2<1:biome===3?(lx===8||lx===9)&&ly>4&&ly<19||(lx===27||lx===28)&&ly>28&&ly<40:lx<2||lx>33||ly<2||ly>41;
    if(pond){water.add(`${x},${y}`);blocks.add(`${x},${y}`);continue;}
    const n = hash(x,y);
    if(biome===2&&x%4===1&&y%4===0&&n<.9&&!isRoad(x-1,y+.5)&&!isRoad(x+2,y+.5)&&!isRoad(x+.5,y-1.5)){
      blocks.add(`${x},${y}`);props.push({x:x+.5,y:y+.5,type:'mountain',r,seed:n});
    }else if(n<(biome===1?.21:.14)){
      blocks.add(`${x},${y}`);const type=biome===1?(n<.17?'tree':'scrap'):biome===2?(n<.08?'crystal':'rock'):biome===3?(n<.07?'solar':'crate'):biome===4?(n<.07?'antenna':'crate'):n<.065?'tree':n<.11?'rock':'scrap';
      props.push({x:x+.5,y:y+.5,type,r,seed:n});
    }else if(n>.92&&(r<5||hash(x,y,73)<.25))props.push({x:x+.5,y:y+.5,type:r>=3?'beacon':r===2?'crystal':'flower',r,seed:n});
  }
  for(let r=0;r<5;r++)for(const [tx,ty] of REGION_TILES[r])for(const [lx,ly] of [[13,10],[17,31],[3,40]]){
    const x=tx*REGION_W+lx,y=ty*REGION_H+ly;
    if(!blocks.has(`${x},${y}`))props.push({x,y,type:'landmark',r,seed:hash(lx,ly,r)});
  }
  for(let r=5;r<REGIONS.length;r++)for(const [tx,ty] of REGION_TILES[r])for(const [lx,ly] of [[7,13],[27,31]]){
    const candidates=props.filter(p=>p.r===r&&Math.floor(p.x/REGION_W)===tx&&Math.floor(p.y/REGION_H)===ty&&p.type!=='landmark'&&blocks.has(`${Math.floor(p.x)},${Math.floor(p.y)}`)&&!isRoad(p.x,p.y-1)&&!isRoad(p.x,p.y-2));
    candidates.sort((a,b)=>Math.hypot(a.x-tx*REGION_W-lx,a.y-ty*REGION_H-ly)-Math.hypot(b.x-tx*REGION_W-lx,b.y-ty*REGION_H-ly));
    if(candidates[0]){
      const landmark=candidates[0];landmark.type='landmark';
    }
  }
  for(const landmark of props.filter(p=>p.type==='landmark'))for(let i=props.length-1;i>=0;i--){
    const p=props[i];if(p.r===landmark.r&&p.type!=='landmark'&&Math.abs(p.x-landmark.x)<1.7&&p.y<landmark.y+1.2&&p.y>landmark.y-2.8){blocks.delete(`${Math.floor(p.x)},${Math.floor(p.y)}`);props.splice(i,1);}
  }
  return applyHalloween(applyReplayColors(applyReplayVariants(addReplayWorld(buildPantheon(relocateWorld({ sites, enemies, chests, stations, props, blocks, water, arenas }))),save),save),save);
}
function addReplayWorld(world){
  for(const mission of RETURNS.filter(m=>m.replay||m.halloween)){
    mission.sourceSites.forEach((source,i)=>{
      const original=world.sites.find(s=>s.id===source),id=`${mission.sitePrefix}-${i}`;
      world.sites.push({...original,id,index:i,returnId:mission.id});
      for(const e of world.enemies.filter(e=>e.site===source&&e.wave===0&&!e.spawnParent)){
        const hp=Math.max(e.maxHp,e.type==='tank'||e.type==='carrier'?2400:e.type==='shield'?1900:1600);
        world.enemies.push({...e,id:`${id}-${e.id}`,site:id,returnId:mission.id,dormant:false,hp,maxHp:hp,damage:Math.min(12,Math.max(8,e.damage))});
      }
    });
    for(const e of world.enemies.filter(e=>e.r===mission.r&&e.type==='boss'&&!e.returnId&&!e.encounterId)){
      const hp=Math.max(9000,e.maxHp);
      world.enemies.push({...e,id:`${mission.id}-${e.id}`,returnId:mission.id,hp,maxHp:hp});
    }
  }
  return world;
}
function relocateWorld(world){
  const points=list=>list.map(relocateEntity).filter(Boolean);
  const cells=set=>new Set([...set].map(key=>{const [x,y]=key.split(',').map(Number),p=relocatePoint({x:x+.5,y:y+.5});return p?`${Math.floor(p.x)},${Math.floor(p.y)}`:null;}).filter(Boolean));
  const enemies=world.enemies.map(old=>{const e=relocateEntity(old),home=relocatePoint({x:old.homeX,y:old.homeY});return e&&home?{...e,homeX:home.x,homeY:home.y}:null;}).filter(Boolean);
  const blocks=cells(world.blocks),water=cells(world.water),props=points(world.props);
  for(let y=0;y<WORLD_H;y++)for(let x=0;x<WORLD_W;x++)if(regionAt(x,y)<0){blocks.add(`${x},${y}`);if(y<REGION_H*2){if(hash(x,y)<.012)props.push({x:x+.5,y:y+.5,type:'mountain',r:2,seed:hash(x,y)});}else water.add(`${x},${y}`);}
  return {...world,sites:points(world.sites),enemies,chests:points(world.chests),stations:points(world.stations),arenas:points(world.arenas),props,blocks,water};
}
export function unlockedRegion(save) { let r=0;while(r<REGIONS.length-1&&save.bosses.includes(r))r++;for(const m of RETURNS)if(!m.postRoyal&&r>=m.unlock&&!(save.returns||[]).includes(m.id))r=Math.min(r,m.unlock-1);return r; }
export const pantheonUnlocked=save=>REGIONS.every((_,r)=>save.bosses.includes(r))&&RETURNS.filter(m=>!m.postRoyal).every(m=>(save.returns||[]).includes(m.id));
export const areaUnlocked=(save,r)=>r===PANTHEON.r?pantheonUnlocked(save):r>=0&&r<=unlockedRegion(save);
export const areaInfo=r=>r===PANTHEON.r?PANTHEON:REGIONS[r];
export function cellsIn(save,r) { return new Set(save.cleared.filter(id=>{const m=/^site-(\d+)-(\d+)$/.exec(id);return m&&Number(m[1])===r&&Number(m[2])<requiredCells(r);})).size; }
export function available(save,part) { return part.royalReward ? (save.owned||[]).includes(part.id) : part.unlock < 0 || save.bosses.includes(part.unlock); }
export function visibleEquipment(save,type) { return EQUIPMENT[type].filter(part=>save.owned.includes(part.id)||available(save,part)); }
export function canWalk(world,save,x,y) {
  const r=regionAt(x,y);
  return x>=1 && y>=1 && x<WORLD_W-1 && y<WORLD_H-1 && areaUnlocked(save,r) && !world.blocks.has(`${x},${y}`);
}
export function nearestWalkable(world,save,point){
  const cx=Math.floor(point.x),cy=Math.floor(point.y);
  if(canWalk(world,save,cx,cy))return {x:point.x,y:point.y};
  for(let radius=1;radius<=8;radius++){
    const candidates=[];
    for(let dy=-radius;dy<=radius;dy++)for(let dx=-radius;dx<=radius;dx++)if(Math.max(Math.abs(dx),Math.abs(dy))===radius&&canWalk(world,save,cx+dx,cy+dy))candidates.push({x:cx+dx+.5,y:cy+dy+.5});
    candidates.sort((a,b)=>Math.hypot(a.x-point.x,a.y-point.y)-Math.hypot(b.x-point.x,b.y-point.y));
    if(candidates[0])return candidates[0];
  }
  return {...HOME};
}
// A breadth-first grid search keeps every destination predictable on touch screens.
export function pathfind(world,save,from,to) {
  const sx=Math.floor(from.x),sy=Math.floor(from.y),tx=Math.floor(to.x),ty=Math.floor(to.y);
  if(!canWalk(world,save,tx,ty)) return [];
  const q=[[sx,sy]], seen=new Map([[`${sx},${sy}`,null]]);
  for(let i=0;i<q.length;i++) {
    const [x,y]=q[i]; if(x===tx&&y===ty) break;
    for(const [dx,dy] of [[1,0],[-1,0],[0,1],[0,-1]]) {
      const nx=x+dx,ny=y+dy,k=`${nx},${ny}`;
      if(seen.has(k)||!canWalk(world,save,nx,ny))continue;
      seen.set(k,`${x},${y}`);q.push([nx,ny]);
    }
  }
  let k=`${tx},${ty}`; if(!seen.has(k))return [];
  const route=[];while(seen.get(k)!==null){const [x,y]=k.split(',').map(Number);route.unshift({x:x+.5,y:y+.5});k=seen.get(k);}
  return route;
}
