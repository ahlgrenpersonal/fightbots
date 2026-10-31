export const BUILD = 'world63';
export const REGION_W = 36;
export const REGION_H = 44;
export const WORLD_W = REGION_W * 3;
export const WORLD_H = REGION_H * 3;
export const MAIN_Y = 66.5;
export const REQUIRED_CELLS = 5;
export const requiredCells = r => r<3?8:REQUIRED_CELLS;
export const TOTAL_CELLS = [0,1,2,3,4].reduce((sum,r)=>sum+requiredCells(r),0);
export const HOME = { x: 54.5, y: MAIN_Y };
export const REGION_LAYOUT = [[1,1],[0,1],[1,0],[2,1],[2,2]];
export const REGION_TILES = [[[1,1],[1,2]],[[0,1],[0,0]],[[1,0],[2,0]],[[2,1]],[[2,2]]];
export const regionOrigin = r => ({x:REGION_LAYOUT[r][0]*REGION_W,y:REGION_LAYOUT[r][1]*REGION_H});
export const relayFor = r => {const p=regionOrigin(r);return {x:p.x+30.5,y:p.y+6.5};};
export const atlasLayout = () => {const scale=Math.min(552/WORLD_W,712/WORLD_H);return {scale,ox:(600-WORLD_W*scale)/2,oy:(760-WORLD_H*scale)/2};};
export const COLORS = ['#ee6954', '#459de0', '#57bd85', '#f4c54b', '#f28d42', '#ac7fe0'];
export const REGIONS = [
  { name: 'Clover Fields', subtitle: 'A little spark of adventure', ground: '#85b979', dark: '#477d58', path: '#c6c59a', water: '#61b8b8', accent: '#ffe17b', boss: 'The Rusty Rambler', hint: 'A heavy stomp. Keep moving when the ground turns red.', reward: 'saw', hp: 150, damage: 8 },
  { name: 'Copperwood', subtitle: 'Copper leaves and forgotten machines', ground: '#698775', dark: '#365c58', path: '#c4b797', water: '#416f79', accent: '#ecb06b', boss: 'The Iron Twins', hint: 'Two guardians. The saw is great up close.', reward: 'hammer', hp: 310, damage: 11 },
  { name: 'Crystal Creek', subtitle: 'High peaks and glowing crystals', ground: '#b5cbd1', dark: '#57758a', path: '#d9e5df', water: '#569db6', accent: '#c7ffff', boss: 'Prism Warden', hint: 'Watch the bright circles. A hammer breaks its shell.', reward: 'lightning', hp: 640, damage: 14 },
  { name: 'Sunforge', subtitle: 'The great solar foundry', ground: '#9da49b', dark: '#5d6f70', path: '#d7bda1', water: '#7a5147', accent: '#ffcb6c', boss: 'The Furnace King', hint: 'Little helpers surround it. Lightning jumps between them.', reward: 'rocket', hp: 1100, damage: 17 },
  { name: 'Sky Station', subtitle: 'The last relay above the clouds', ground: '#9ca8c8', dark: '#64768f', path: '#c9d6e7', water: '#273e58', accent: '#a8f3f0', boss: 'The Storm Engine', hint: 'Your rocket launcher was made for this.', reward: null, hp: 2200, damage: 19 }
];
// The original FightBots' square chassis, eyes, colors and armor motifs are retained.
// Adventure equipment has its own progression and continuous-time combat rules.
export const EQUIPMENT = {
  weapon: [
    { id: 'bumper', name: 'Bumper', desc: 'A spring-loaded punch. A brave little beginning.', damage: 6, range: 1.4, rate: .65, cost: 0, gears: 0, unlock: -1, power: 1 },
    { id: 'blaster', name: 'Blaster', desc: 'Bright energy bolts. Reach bots from a distance.', damage: 10, range: 4.2, rate: .75, cost: 16, gears: 2, unlock: -1, power: 2 },
    { id: 'saw', name: 'Buzz Saw', desc: 'A spinning steel blade. Lots of very quick hits.', damage: 12, range: 1.65, rate: .3, cost: 32, gears: 3, unlock: 0, power: 3 },
    { id: 'hammer', name: 'Thunder Hammer', desc: 'A mighty slam. Smashes several bots at once.', damage: 42, range: 1.9, rate: 1.05, cost: 55, gears: 4, unlock: 1, power: 4 },
    { id: 'lightning', name: 'Arc Caster', desc: 'Crackling lightning jumps between nearby bots.', damage: 32, range: 4.4, rate: .65, cost: 85, gears: 5, unlock: 2, power: 5 },
    { id: 'rocket', name: 'Rocket Launcher', desc: 'Big rockets. Big explosions. Big smiles.', damage: 105, range: 6.2, rate: 1.35, cost: 130, gears: 6, unlock: 3, power: 6 }
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
export function item(type, id) { return EQUIPMENT[type].find(p => p.id === id) || EQUIPMENT[type][0]; }
export function stats(save) {
  const armor = item('armor', save.build.armor), wheels = item('wheels', save.build.wheels);
  return { hp: armor.hp + (wheels.hp || 0), defense: armor.defense, speed: wheels.speed, weapon: item('weapon', save.build.weapon) };
}
export function freshSave() {
  return { schema: 1, worldLayout: 2, siteLayout: 4, scrap: 0, gears: 0, build: { ...STARTERS }, color: COLORS[0], owned: Object.values(STARTERS), cleared: [], bosses: [], kills: [], chests: [], discovered: [], visited: [], position: { ...HOME }, hp: 70, totalBots: 0, playSeconds: 0, sound: false, gentle: true, completed: false, intro: false };
}
export function migrateSiteProgress(save){
  if(save.siteLayout===4)return save;
  if(save.siteLayout===3){
    const credited=new Set(save.cleared.filter(id=>/^site-[0-4]-[0-7]$/.test(id)&&Number(id.split('-')[2])<(id.startsWith('site-0-')?8:5)));
    for(const r of save.bosses)for(let i=0;i<requiredCells(r);i++)credited.add(`site-${r}-${i}`);
    save.cleared=[...credited];save.siteLayout=4;return save;
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
  save.siteLayout=4;return save;
}
export function hash(x, y, seed = 17) {
  let n = Math.imul(x + seed, 374761393) ^ Math.imul(y + seed, 668265263);
  n = Math.imul(n ^ (n >>> 13), 1274126177);
  return ((n ^ (n >>> 16)) >>> 0) / 4294967296;
}
export function regionAt(x,y) {
  const sx=Math.floor(x/REGION_W),sy=Math.floor(y/REGION_H);
  return REGION_TILES.findIndex(tiles=>tiles.some(([rx,ry])=>rx===sx&&ry===sy));
}
export function isRoad(x,y) {
  const r=regionAt(x,y);if(r<0)return false;
  if(r===0&&y>=REGION_H*2)return Math.abs(x-HOME.x)<1.2||([105.5,118.5].some(v=>Math.abs(y-v)<1.2)&&x>43&&x<68);
  const p={x:Math.floor(x/REGION_W)*REGION_W,y:Math.floor(y/REGION_H)*REGION_H};
  return Math.abs(y-(p.y+22.5))<1.2||Math.abs(x-(p.x+18.5))<1.2;
}
export function makeWorld() {
  const sites = [], enemies = [], chests = [], stations = [], props = [], blocks = new Set(), water = new Set();
  const offsets = [[10,25],[6,6],[29,17],[7,38],[29,39]];
  for (let r = 0; r < 5; r++) {
    const origin=regionOrigin(r);
    const farStation=[[29.5,74.5],[20.5,-20.5],[56.5,25.5],[32.5,25.5],[32.5,25.5]][r];
    for(const [i,[x,y]] of [[4.5,23.5],farStation].entries())stations.push({id:`station-${r}-${i}`,r,x:origin.x+x,y:origin.y+y});
    const positions=r===0?[...offsets,[10,60],[28,70],[14,85]]:r===1?[...offsets,[6,-37],[29,-23],[9,-7]]:r===2?[...offsets,[42,7],[65,23],[43,38]]:offsets;
    positions.forEach(([ox,oy], i) => {
      const x = origin.x + ox, y=origin.y+oy, id = `site-${r}-${i}`;
      const site = { id, r, x: x + .5, y: y + .5, index: i };
      sites.push(site);
      const n = r === 0 ? 4 : 5;
      for (let wave = 0; wave < 2; wave++) for (let j = 0; j < n; j++) {
        const a = j * Math.PI * 2 / n;
        const ex = x + .5 + Math.cos(a) * 1.45, ey = y + .5 + Math.sin(a) * 1.45;
        const type = j === n - 1 && r > 0 ? 'ranged' : j % 3 === 2 ? 'tank' : 'scout';
        const hp = [13, 28, 55, 95, 165][r] * (type === 'tank' ? 1.6 : 1);
        enemies.push({ id: `${id}-${wave}-${j}`, site: id, wave, dormant: wave > 0, r, x: ex, y: ey, homeX: ex, homeY: ey, hp, maxHp: hp, type, damage: [2,3,4,5,6][r], cd: hash(i,j,r) * 2, hit: 0, swing: 0, angle: 0 });
      }
    });
    const {x:bx,y:by} = relayFor(r);
    const count = r === 1 ? 2 : 1;
    for (let j = 0; j < count; j++) {
      const hp = REGIONS[r].hp / count;
      enemies.push({ id: `boss-${r}-${j}`, r, x: bx + (count === 2 ? j * 2 - 1 : 0), y: by, homeX: bx, homeY: by, hp, maxHp: hp, type: 'boss', damage: REGIONS[r].damage, cd: 2.5 + j, hit: 0, swing: 0, angle: 0 });
    }
    for (const [i,[x,y]] of [[3.5,4.5],[15.5,12.5],[32.5,21.5],[3.5,29.5],[14.5,33.5],[23.5,41.5],[32.5,42.5]].entries()){
      const extra=r===0?[[10.5,55.5],[28.5,72.5],[18.5,85.5]]:r===1?[[13.5,-32.5],[31.5,-12.5],[3.5,-4.5]]:r===2?[[44.5,13.5],[60.5,34.5],[68.5,5.5]]:null;
      const p=extra&&i>=4?extra[i-4]:[x,y];chests.push({id:`chest-${r}-${i}`,r,x:origin.x+p[0],y:origin.y+p[1]});
    }
  }
  const reserved = (x,y) => isRoad(x+.5,y+.5) || sites.some(s => Math.abs(x+.5-s.x) < 2.8 && Math.abs(y+.5-s.y) < 2.8) || chests.some(s => Math.abs(x+.5-s.x)<1.8 && Math.abs(y+.5-s.y)<1.8) || stations.some(s=>Math.hypot(x+.5-s.x,y+.5-s.y)<3.8) || REGIONS.some((_,r)=>Math.hypot(x+.5-relayFor(r).x,y+.5-relayFor(r).y)<4) || (Math.abs(x-HOME.x)<4 && Math.abs(y-HOME.y)<5);
  for (let y=1;y<WORLD_H-1;y++) for(let x=1;x<WORLD_W-1;x++) {
    const r=regionAt(x,y);
    if(r<0){blocks.add(`${x},${y}`);if(x<REGION_W)water.add(`${x},${y}`);else if(hash(x,y)<.36)props.push({x:x+.5,y:y+.5,type:'mountain',r:4,seed:hash(x,y)});continue;}
    if (reserved(x,y)) continue;
    const lx=x%REGION_W,ly=y%REGION_H;
    const pond=r===0?[[14,17,3.3,4.1],[25,33,3.6,3.2],[12,40,3.5,3]].some(([px,py,rx,ry])=>((lx-px)/rx)**2+((ly-py)/ry)**2<1)||(y>96&&Math.abs(x-54)>5&&hash(Math.floor(x/3),Math.floor(y/4))<.75):r===1?((lx-25)/2.2)**2+((ly-34)/4)**2<1:r===2?((lx-12)/2)**2+((ly-32)/5)**2<1:r===3?(lx===8||lx===9)&&ly>4&&ly<19||(lx===27||lx===28)&&ly>28&&ly<40:lx<2||lx>33||ly<2||ly>41;
    if(pond){water.add(`${x},${y}`);blocks.add(`${x},${y}`);continue;}
    const n = hash(x,y);
    if(r===2&&x%4===1&&y%4===0&&n<.9&&!isRoad(x-1,y+.5)&&!isRoad(x+2,y+.5)&&!isRoad(x+.5,y-1.5)){
      blocks.add(`${x},${y}`);props.push({x:x+.5,y:y+.5,type:'mountain',r,seed:n});
    }else if(n<(r===1?.21:.14)){
      blocks.add(`${x},${y}`);const type=r===1?(n<.17?'tree':'scrap'):r===2?(n<.08?'crystal':'rock'):r===3?(n<.07?'solar':'crate'):r===4?(n<.07?'antenna':'crate'):n<.065?'tree':n<.11?'rock':'scrap';
      props.push({x:x+.5,y:y+.5,type,r,seed:n});
    }else if(n>.92)props.push({x:x+.5,y:y+.5,type:r>=3?'beacon':r===2?'crystal':'flower',r,seed:n});
  }
  for(let r=0;r<5;r++)for(const [tx,ty] of REGION_TILES[r])for(const [lx,ly] of [[13,10],[17,31],[3,40]]){
    const x=tx*REGION_W+lx,y=ty*REGION_H+ly;
    if(!blocks.has(`${x},${y}`))props.push({x,y,type:'landmark',r,seed:hash(lx,ly,r)});
  }
  return { sites, enemies, chests, stations, props, blocks, water };
}
export function unlockedRegion(save) { return Math.min(4, save.bosses.length); }
export function cellsIn(save,r) { return new Set(save.cleared.filter(id => new RegExp(`^site-${r}-[0-${requiredCells(r)-1}]$`).test(id))).size; }
export function available(save,part) { return part.unlock < 0 || save.bosses.includes(part.unlock); }
export function canWalk(world,save,x,y) {
  const r=regionAt(x,y);
  return x>=1 && y>=1 && x<WORLD_W-1 && y<WORLD_H-1 && r>=0 && r<=unlockedRegion(save) && !world.blocks.has(`${x},${y}`);
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
