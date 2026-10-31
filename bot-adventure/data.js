export const BUILD = 'world49';
export const REGION_W = 28;
export const WORLD_W = REGION_W * 5;
export const WORLD_H = 112;
export const MAIN_Y = 56.5;
export const REQUIRED_CELLS = 8;
export const HOME = { x: 6.5, y: MAIN_Y };
export const COLORS = ['#ee6954', '#459de0', '#57bd85', '#f4c54b', '#f28d42', '#ac7fe0'];
export const REGIONS = [
  { name: 'Clover Fields', subtitle: 'A little spark of adventure', ground: '#85b979', dark: '#477d58', path: '#c6c59a', water: '#61b8b8', accent: '#ffe17b', boss: 'The Rusty Rambler', hint: 'A heavy stomp. Keep moving when the ground turns red.', reward: 'saw', hp: 150, damage: 8 },
  { name: 'Copperwood', subtitle: 'Where the old machines sleep', ground: '#6caa91', dark: '#3c786d', path: '#b3c3a4', water: '#509eae', accent: '#ffbe76', boss: 'The Iron Twins', hint: 'Two guardians. The saw is great up close.', reward: 'hammer', hp: 310, damage: 11 },
  { name: 'Crystal Creek', subtitle: 'Follow the blue light', ground: '#8aafbe', dark: '#527b9c', path: '#c8d7c9', water: '#3f9db6', accent: '#b4f7ff', boss: 'Prism Warden', hint: 'Watch the bright circles. A hammer breaks its shell.', reward: 'lightning', hp: 640, damage: 14 },
  { name: 'Sunforge', subtitle: 'Something powerful is waiting', ground: '#c9aa72', dark: '#957f55', path: '#ead69f', water: '#6cb0aa', accent: '#ffdb59', boss: 'The Furnace King', hint: 'Little helpers surround it. Lightning jumps between them.', reward: 'rocket', hp: 1100, damage: 17 },
  { name: 'Sky Station', subtitle: 'Bring the valley back to life', ground: '#9babc4', dark: '#64768f', path: '#d7dcd7', water: '#79a7c1', accent: '#f3d885', boss: 'The Storm Engine', hint: 'Your rocket launcher was made for this.', reward: null, hp: 2200, damage: 19 }
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
    { id: 'repair', name: 'Repair Buddy', desc: 'Slowly restores health between battles.', cost: 50, gears: 3, unlock: 0 },
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
  return { schema: 1, scrap: 0, gears: 0, build: { ...STARTERS }, color: COLORS[0], owned: Object.values(STARTERS), cleared: [], bosses: [], kills: [], chests: [], discovered: [], visited: [], position: { ...HOME }, hp: 70, totalBots: 0, playSeconds: 0, sound: false, gentle: true, completed: false, intro: false };
}
export function hash(x, y, seed = 17) {
  let n = Math.imul(x + seed, 374761393) ^ Math.imul(y + seed, 668265263);
  n = Math.imul(n ^ (n >>> 13), 1274126177);
  return ((n ^ (n >>> 16)) >>> 0) / 4294967296;
}
export function regionAt(x) { return Math.max(0, Math.min(4, Math.floor(x / REGION_W))); }
export function makeWorld() {
  const sites = [], enemies = [], chests = [], props = [], blocks = new Set(), water = new Set();
  const offsets = [[5,8],[21,17],[7,28],[21,38],[6,48],[21,65],[6,76],[21,87],[7,98],[21,105]];
  for (let r = 0; r < 5; r++) {
    offsets.forEach(([ox,y], i) => {
      const x = r * REGION_W + ox, id = `site-${r}-${i}`;
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
    const bx = r * REGION_W + 24.5, by = MAIN_Y;
    const count = r === 1 ? 2 : 1;
    for (let j = 0; j < count; j++) {
      const hp = REGIONS[r].hp / count;
      enemies.push({ id: `boss-${r}-${j}`, r, x: bx + (count === 2 ? j * 2 - 1 : 0), y: by, homeX: bx, homeY: by, hp, maxHp: hp, type: 'boss', damage: REGIONS[r].damage, cd: 2.5 + j, hit: 0, swing: 0, angle: 0 });
    }
    for (let i = 0; i < 7; i++) chests.push({ id: `chest-${r}-${i}`, r, x: r * REGION_W + 3.5 + (i % 3) * 9, y: [4.5,23.5,44.5,61.5,82.5,94.5,108.5][i] });
  }
  const reserved = (x,y) => Math.abs(y - Math.floor(MAIN_Y)) < 3 || sites.some(s => Math.abs(x+.5-s.x) < 2.8 && Math.abs(y+.5-s.y) < 2.8) || chests.some(s => Math.abs(x+.5-s.x)<1.8 && Math.abs(y+.5-s.y)<1.8) || Math.abs(x%REGION_W - 14) < 1.8 || (Math.abs(x-HOME.x)<4 && Math.abs(y-HOME.y)<5);
  for (let y=1;y<WORLD_H-1;y++) for(let x=1;x<WORLD_W-1;x++) {
    if (reserved(x,y)) continue;
    const lx=x%REGION_W;
    const pond=[[10,62,3.3,4.1],[17,22,4.6,3.2],[11,91,3.5,5]].some(([px,py,rx,ry])=>((lx-px)/rx)**2+((y-py)/ry)**2<1);
    if(pond){water.add(`${x},${y}`);blocks.add(`${x},${y}`);continue;}
    const n = hash(x,y);
    if (n < .16) { blocks.add(`${x},${y}`); props.push({x:x+.5,y:y+.5,type:n<.065?'tree':n<.11?'rock':'scrap',r:regionAt(x),seed:n}); }
    else if(n>.92) props.push({x:x+.5,y:y+.5,type:'flower',r:regionAt(x),seed:n});
  }
  for(let r=0;r<5;r++)for(const [lx,y] of [[12,34],[16,72],[9,101]])props.push({x:r*REGION_W+lx,y,type:'landmark',r,seed:hash(lx,y,r)});
  return { sites, enemies, chests, props, blocks, water };
}
export function unlockedRegion(save) { return Math.min(4, save.bosses.length); }
export function cellsIn(save,r) { return save.cleared.filter(id => id.startsWith(`site-${r}-`)).length; }
export function available(save,part) { return part.unlock < 0 || save.bosses.includes(part.unlock); }
export function canWalk(world,save,x,y) {
  return x>=1 && y>=1 && x<WORLD_W-1 && y<WORLD_H-1 && regionAt(x)<=unlockedRegion(save) && !world.blocks.has(`${x},${y}`);
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
