const region=(name,theme,ground,path,water,accent,boss,hp,reward,pattern)=>({name,theme,subtitle:boss,ground,path,water,accent,dark:'#466675',boss,hp,reward,pattern,damage:20+Math.round((hp-2500)/650)});
export const MORE_REGIONS=[
  region('Harbor Reach','coast','#a9c9b8','#e1d7ad','#579bb6','#ffdb8f','The Anchor Crab',2500,'frost','rings'),
  region('Magnet Yard','scrapyard','#9da491','#c8c5a5','#526d78','#f4ba79','The Scrap Magnet',2800,'boomerang','cross'),
  region('Rain Gardens','jungle','#64aa93','#bcd6a4','#4d9eab','#d7f5a0','The Vine Walker',3200,'tractor','rings'),
  region('Thunder Dam','storm','#8cabc0','#bfd4d7','#426d92','#d2f6ff','The Thunder Crane',3600,'drone','cross'),
  region('Rolling Citadel','fortress','#9eacaf','#d4bd98','#526e80','#ffdc81','The Walking Fortress',4000,'rail','salvo'),
  region('Aurora Landing','aurora','#9ebcd0','#d0e5db','#537895','#baf5e3','The Aurora Sentinel',4600,'meteor','rings'),
  region('Moon Quarry','lunar','#c1c2cb','#e2dac8','#72798c','#fff0b2','The Moon Digger',5200,'gravity','cross'),
  region('Glowgrove','garden','#91b8b0','#c3d8b9','#527c9f','#bff7ed','The Bloom Engine',5800,null,'rings'),
  region('Orbit Docks','orbital','#aab4ce','#d5e0e9','#344d70','#c0f8ff','The Satellite Weaver',6500,null,'salvo'),
  region('Starfall Ruins','ancient','#acaac7','#e2d6c0','#586b93','#ffecb0','The Star Colossus',7600,null,'cross')
];
export const MORE_TILES=[[[3,2],[3,1]],[[4,2],[5,2]],[[4,1],[5,1]],[[4,0]],[[5,0]],[[6,0],[7,0]],[[8,0],[8,1]],[[7,1],[7,2]],[[6,1]],[[6,2]]];
export function bossProfile(enemyOrRegion){
  const {r,returnId}=typeof enemyOrRegion==='number'?{r:enemyOrRegion}:enemyOrRegion;
  const theme=MORE_REGIONS[r-5]?.theme;
  const guns={coast:'boomerang',scrapyard:'tractor',jungle:'flame',storm:'rail',fortress:'gravity',aurora:'frost',lunar:'meteor',garden:'drone',orbital:'rail',ancient:'gravity'};
  const profile={weapon:r<5?['bumper','hammer','lightning','rocket','rocket'][r]:guns[theme]||'rail',armor:r===2?'reflect':r<5?'heavy':['aurora','lunar'].includes(theme)?'polar':['orbital','ancient'].includes(theme)?'star':'bastion',wheels:r>=5&&['lunar','orbital','storm'].includes(theme)?'hover':r>=5?'rover':'basic'};
  if(returnId==='copper-return')Object.assign(profile,{weapon:'tractor',armor:'bastion',wheels:'rover',color:'#ce7258'});
  if(returnId==='crystal-return')Object.assign(profile,{weapon:'frost',armor:'polar',wheels:'hover',color:'#82cddd'});
  profile.pattern={bumper:'stomp',hammer:'slam',lightning:'arc',rocket:'salvo',boomerang:'return',tractor:'vortex',flame:'cone',rail:'beam',gravity:'slam',frost:'ice',meteor:'impact',drone:'drone'}[profile.weapon];
  return profile;
}
export const WORKSHOPS=[
  {id:'valley',name:'Valley Workshop',r:0,x:54.5,y:66.5},
  {id:'harbor',name:'Harbor Workshop',r:5,x:126.5,y:110.5},
  {id:'star',name:'Star Workshop',r:10,x:234.5,y:22.5}
];
export const RETURNS=[
  {id:'copper-return',r:1,unlock:8,boss:'The Copper Captain',x:28.5,y:52.5,sitePrefix:'reclaim-copper',sites:[[10.5,14.5],[27.5,32.5],[8.5,74.5]],hp:1600},
  {id:'crystal-return',r:2,unlock:13,boss:'The Frost Commander',x:99.5,y:8.5,sitePrefix:'reclaim-crystal',sites:[[45.5,13.5],[62.5,36.5],[94.5,31.5]],hp:3400}
];
export const NEW_EQUIPMENT={
  weapon:[
    {id:'flame',name:'Flamethrower',desc:'A roaring fan of fire. Sweeps through a crowd.',damage:38,range:3.2,rate:.18,cost:180,gears:7,unlock:4,power:7},
    {id:'frost',name:'Freeze Cannon',desc:'Ice bursts freeze small bots and slow big ones.',damage:70,range:5,rate:.45,cost:230,gears:8,unlock:5,power:8},
    {id:'boomerang',name:'Boomerang Blade',desc:'A flying blade that cuts out and back again.',damage:110,range:5,rate:.7,cost:280,gears:9,unlock:6,power:9},
    {id:'tractor',name:'Magnet Launcher',desc:'Pulls nearby bots together in a magnetic blast.',damage:90,range:4.5,rate:.5,cost:330,gears:10,unlock:7,power:10},
    {id:'drone',name:'Drone Bay',desc:'Launches a flying helper with its own blaster.',damage:70,range:5.5,rate:.35,cost:380,gears:11,unlock:8,power:11},
    {id:'rail',name:'Rail Cannon',desc:'A brilliant shot that pierces a line of bots.',damage:220,range:7,rate:.7,cost:440,gears:12,unlock:9,power:12},
    {id:'meteor',name:'Meteor Launcher',desc:'Calls a spectacular shower of explosive stars.',damage:360,range:6.5,rate:1.2,cost:510,gears:14,unlock:10,power:13},
    {id:'gravity',name:'Gravity Hammer',desc:'Pulls bots inward, then launches a mighty slam.',damage:270,range:3.1,rate:.65,cost:580,gears:16,unlock:11,power:14}
  ],
  armor:[
    {id:'bastion',name:'Bastion Armor',desc:'Thick harbor plates. Ready for a bigger adventure.',hp:300,defense:3,cost:210,gears:8,unlock:5},
    {id:'polar',name:'Polar Armor',desc:'A bright crystal shell with extra protection.',hp:440,defense:4,cost:340,gears:11,unlock:8},
    {id:'star',name:'Star Armor',desc:'A radiant shell that reflects incoming damage.',hp:640,defense:5,reflect:true,cost:580,gears:16,unlock:12}
  ],
  wheels:[
    {id:'rover',name:'Rover Wheels',desc:'Big trail wheels. Fast, sturdy and ready to explore.',speed:3.65,hp:50,cost:240,gears:9,unlock:6},
    {id:'hover',name:'Hover Engines',desc:'Glowing engines. Float quickly above the trails.',speed:4.15,hp:75,cost:500,gears:14,unlock:13}
  ],
  gadget:[
    {id:'aegis',name:'Aegis Shield',desc:'Blocks one hit every four seconds.',cost:210,gears:8,unlock:6},
    {id:'capacitor',name:'Power Capacitor',desc:'Longer power surges, ready again much sooner.',cost:310,gears:10,unlock:9},
    {id:'vacuum',name:'Treasure Vacuum',desc:'Collects treasure from much farther away.',cost:350,gears:11,unlock:10},
    {id:'buddy',name:'Helper Drone',desc:'A little companion adds extra blaster shots.',cost:420,gears:13,unlock:13}
  ]
};
