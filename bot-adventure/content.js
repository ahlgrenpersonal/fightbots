import {relocateEntity,relocateMission} from './topology.js?v=world91';
const REGION_GUIDES={
  coast:['Salt air and bright harbor trails','Watch the blade fly out and come back. Keep rolling.'],
  scrapyard:['Giant magnets and mountains of spare parts','Move out of the glowing magnetic circle before the blast.'],
  jungle:['Rainy paths beneath giant leaves','Roll sideways out of the flame warning.'],
  storm:['A mighty dam full of bottled lightning','The bright line shows the next shot. Step aside.'],
  fortress:['A great fortress on rolling wheels','Back away from the glowing circle before the mighty slam.'],
  aurora:['Quiet snow beneath dancing lights','Ice lands on the marked spot. Keep moving.'],
  lunar:['Moon dust and sparkling meteor craters','Watch the falling star. Roll out of its marked circle.'],
  garden:['A glowing forest of curious machines','Move away from the drone landing marks, then fire back.'],
  orbital:['Launch pads among the stars','Step off the bright beam line. Fire while the cannon recharges.'],
  ancient:['Forgotten towers filled with starlight','Roll clear of the glowing circle, then fire at the giant.']
};
const region=(name,theme,ground,path,water,accent,boss,hp,reward,pattern)=>({name,theme,subtitle:REGION_GUIDES[theme][0],hint:REGION_GUIDES[theme][1],ground,path,water,accent,dark:'#466675',boss,hp,reward,pattern,damage:20+Math.round((hp-2500)/650)});
export const MORE_REGIONS=[
  region('Harbor Reach','coast','#a9c9b8','#e1d7ad','#579bb6','#ffdb8f','The Anchor Crab',2500,'frost','rings'),
  region('Magnet Yard','scrapyard','#9da491','#c8c5a5','#526d78','#f4ba79','The Scrap Magnet',2800,'boomerang','cross'),
  region('Rain Gardens','jungle','#64aa93','#bcd6a4','#4d9eab','#d7f5a0','The Vine Walker',3200,'tractor','rings'),
  region('Thunder Dam','storm','#8cabc0','#bfd4d7','#426d92','#d2f6ff','The Thunder Crane',3600,'drone','cross'),
  region('Rolling Citadel','fortress','#9eacaf','#d4bd98','#526e80','#ffdc81','The Walking Fortress',4000,'rail','salvo'),
  region('Aurora Landing','aurora','#9ebcd0','#d0e5db','#537895','#baf5e3','The Aurora Sentinel',4600,'meteor','rings'),
  region('Moon Quarry','lunar','#c1c2cb','#e2dac8','#72798c','#fff0b2','The Moon Digger',5200,'gravity','cross'),
  region('Glowgrove','garden','#91b8b0','#c3d8b9','#527c9f','#bff7ed','The Bloom Engine',5800,'sunbeam','rings'),
  region('Orbit Docks','orbital','#aab4ce','#d5e0e9','#344d70','#c0f8ff','The Satellite Weaver',6500,'swarm','salvo'),
  region('Starfall Ruins','ancient','#acaac7','#e2d6c0','#586b93','#ffecb0','The Star Colossus',7600,'supernova','cross')
];
export function bossProfile(enemyOrRegion){
  const {r,returnId,encounterRole}=typeof enemyOrRegion==='number'?{r:enemyOrRegion}:enemyOrRegion;
  const theme=MORE_REGIONS[r-5]?.theme;
  const guns={coast:'boomerang',scrapyard:'tractor',jungle:'flame',storm:'rail',fortress:'gravity',aurora:'frost',lunar:'meteor',garden:'drone',orbital:'rail',ancient:'gravity'};
  const profile={weapon:r<5?['bumper','hammer','lightning','rocket','rocket'][r]:guns[theme]||'rail',armor:r===2?'reflect':r<5?'heavy':['aurora','lunar'].includes(theme)?'polar':['orbital','ancient'].includes(theme)?'star':'bastion',wheels:r>=5&&['lunar','orbital','storm'].includes(theme)?'hover':r>=5?'rover':'basic'};
  if(returnId==='copper-return')Object.assign(profile,{weapon:'tractor',armor:'bastion',wheels:'rover',color:'#ce7258'});
  if(returnId==='crystal-return')Object.assign(profile,{weapon:'frost',armor:'polar',wheels:'hover',color:'#82cddd'});
  if(returnId==='copper-twins')Object.assign(profile,{weapon:enemyOrRegion.twin===1?'saw':'hammer',armor:'bastion',wheels:'treads',color:enemyOrRegion.twin===1?'#e9b45d':'#d77a48'});
  const surprise={
    bruiser:{weapon:'hammer',armor:'heavy',wheels:'treads',color:'#e5a14c'},
    skirmisher:{weapon:'blaster',armor:'light',wheels:'speed',color:'#70b6de'},
    splitter:{weapon:'hammer',armor:'bastion',wheels:'rover',color:'#bd8edb'},
    fragment:{weapon:'bumper',armor:'steel',wheels:'speed',color:'#c6a1e5'}
  }[encounterRole];
  if(surprise)Object.assign(profile,surprise);
  if(typeof enemyOrRegion==='object'&&enemyOrRegion.replayLook)Object.assign(profile,enemyOrRegion.replayLook);
  profile.pattern={bumper:'stomp',hammer:'slam',saw:'slam',blaster:'salvo',lightning:'arc',rocket:'salvo',boomerang:'return',tractor:'vortex',flame:'cone',rail:'beam',gravity:'slam',frost:'ice',meteor:'impact',drone:'drone'}[profile.weapon];
  return profile;
}
// Optional road encounters have their own identities; they never replace a relay guardian.
export const LEGACY_ENCOUNTERS=[
  {id:'harbor-duo',r:5,x:120.5,y:105.5,name:'Clank & Zip',reward:70},
  {id:'scrap-split',r:6,x:162.5,y:110.5,name:'The Splitstack',reward:90}
];
export const LEGACY_WORKSHOPS=[
  {id:'valley',name:'Valley Workshop',r:0,x:54.5,y:66.5},
  {id:'harbor',name:'Harbor Workshop',r:5,x:126.5,y:110.5},
  {id:'star',name:'Star Workshop',r:10,x:234.5,y:22.5}
];
export const LEGACY_RETURNS=[
  {id:'copper-return',r:1,unlock:8,boss:'The Copper Captain',x:28.5,y:52.5,sitePrefix:'reclaim-copper',sites:[[10.5,14.5],[27.5,32.5],[8.5,74.5]],hp:1600},
  {id:'crystal-return',r:2,unlock:13,boss:'The Frost Commander',x:99.5,y:8.5,sitePrefix:'reclaim-crystal',sites:[[45.5,13.5],[62.5,36.5],[94.5,31.5]],hp:3400},
  {id:'copper-twins',r:1,postRoyal:true,boss:'The Iron Twins Reforged',x:30.5,y:50.5,sitePrefix:'reforged-copper',sites:[[6.5,7.5],[29.5,21.5],[9.5,37.5],[29.5,61.5],[7.5,82.5]],hp:4500}
];
export const ENCOUNTERS=LEGACY_ENCOUNTERS.map(relocateEntity);
export const WORKSHOPS=LEGACY_WORKSHOPS.map(relocateEntity);
export const RETURNS=LEGACY_RETURNS.map(relocateMission);
export const NEW_EQUIPMENT={
  weapon:[
    {id:'flame',name:'Flamethrower',desc:'A roaring fan of fire. Sweeps through a crowd.',damage:38,range:2.6,rate:.18,cost:180,gears:7,unlock:4,power:7},
    {id:'frost',name:'Freeze Cannon',desc:'Ice bursts freeze small bots and slow big ones.',damage:70,range:3,rate:.45,cost:230,gears:8,unlock:5,power:8},
    {id:'boomerang',name:'Boomerang Blade',desc:'A flying blade that cuts out and back again.',damage:110,range:3.2,rate:.7,cost:280,gears:9,unlock:6,power:9},
    {id:'tractor',name:'Magnet Launcher',desc:'Pulls nearby bots together in a magnetic blast.',damage:90,range:2.8,rate:1,cost:330,gears:10,unlock:7,power:10},
    {id:'drone',name:'Drone Bay',desc:'Launches a flying helper with its own blaster.',damage:70,range:3,rate:.35,cost:380,gears:11,unlock:8,power:11},
    {id:'rail',name:'Rail Cannon',desc:'A brilliant shot that pierces a line of bots.',damage:220,range:3.25,rate:.7,cost:440,gears:12,unlock:9,power:12},
    {id:'meteor',name:'Meteor Launcher',desc:'Calls a spectacular shower of explosive stars.',damage:360,range:3.2,rate:1.2,cost:510,gears:14,unlock:10,power:13},
    {id:'gravity',name:'Gravity Hammer',desc:'Pulls bots inward, then launches a mighty slam.',damage:270,range:2.6,rate:.65,cost:580,gears:16,unlock:11,power:14},
    {id:'sunbeam',name:'Sunbeam Cannon',desc:'A brilliant golden beam pierces a whole line of bots.',damage:340,range:3.25,rate:.7,cost:650,gears:18,unlock:12,power:15},
    {id:'swarm',name:'Swarm Launcher',desc:'Three tiny flying bots chase enemies together.',damage:150,range:3.2,rate:.75,cost:720,gears:20,unlock:13,power:16},
    {id:'supernova',name:'Supernova Launcher',desc:'Three star rockets burst into mighty golden shockwaves.',damage:280,range:3.2,rate:1.2,cost:850,gears:22,unlock:14,power:17},
    {id:'crystalbeam',name:'Crystal Beam',desc:'The queen\u2019s brilliant beam. Pierces a whole line of bots and their shields.',damage:1100,range:3.6,rate:.8,cost:0,gears:0,unlock:15,power:18,royalReward:true},
    {id:'twinrockets',name:'Royal Twin Rockets',desc:'The king\u2019s twin launchers. Two homing rockets deliver the mightiest explosive burst.',damage:1900,range:3.4,rate:1.25,cost:0,gears:0,unlock:15,power:19,royalReward:true}
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
