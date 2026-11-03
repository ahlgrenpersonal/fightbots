const CACHE='roman-bots-roman29',ASSETS=['./','./index.html','./styles.css?v=roman29','./app.js?v=roman29','./data.js?v=roman29','./engine.js?v=roman29','./art.js?v=roman29','./geometry.js?v=roman29','./icons.js?v=roman29','./manifest.webmanifest','./version.json','./refresh.html','./assets/icon-192.png','./assets/icon-512.png','./assets/courtyard-theme.mp3','./north/index.html','./north/north.css?v=roman29','./north/north.js?v=roman29','./north/campaign.js?v=roman29','./north/world.js?v=roman29','./north/scenery.js?v=roman29'];
ASSETS.push('./north/prologue.js?v=roman29','./north/city.js?v=roman29');
ASSETS.push('./north/west-world.js?v=roman29','./north/west-scenery.js?v=roman29');
ASSETS.push('./north/navigation.js?v=roman29');
ASSETS.push('./north/south-world.js?v=roman29','./north/south-scenery.js?v=roman29');
ASSETS.push('./north/east-world.js?v=roman29','./north/east-scenery.js?v=roman29');
ASSETS.push('./north/return-quests.js?v=roman29','./north/quest-art.js?v=roman29');
self.addEventListener('install',event=>event.waitUntil(caches.open(CACHE).then(cache=>cache.addAll(ASSETS)).then(()=>self.skipWaiting())));
self.addEventListener('activate',event=>event.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(key=>key.startsWith('roman-bots-')&&key!==CACHE).map(key=>caches.delete(key)))).then(()=>self.clients.claim())));
self.addEventListener('fetch',event=>{
  if(self.location.hostname==='127.0.0.1'||self.location.hostname==='localhost')return;
  const url=new URL(event.request.url),scope=new URL('./',self.location.href);if(event.request.method!=='GET'||url.origin!==scope.origin||!url.pathname.startsWith(scope.pathname))return;
  if(url.pathname===new URL('./assets/courtyard-theme.mp3',scope).pathname&&event.request.headers?.get('range')){
    event.respondWith(audioRange(event.request));return;
  }
  if(url.pathname.endsWith('/version.json')){event.respondWith(fetch(event.request,{cache:'no-store'}));return;}
  if(event.request.mode==='navigate'){
    const shell=url.pathname===scope.pathname||url.pathname===new URL('./index.html',scope).pathname;
    const north=url.pathname===new URL('./north/',scope).pathname||url.pathname===new URL('./north/index.html',scope).pathname;
    const fallback=shell?'./index.html':north?'./north/index.html':event.request;
    event.respondWith(fetch(event.request).then(async res=>{await remember(fallback,res);return res;}).catch(()=>cachedResponse(fallback)));return;
  }
  event.respondWith(cachedResponse(event.request).then(cached=>cached||fetch(event.request).then(async res=>{await remember(event.request,res);return res;})));
});
// Cache Storage is optional while online, including when a device is out of space.
async function cachedResponse(request){try{return await caches.match(request);}catch{return undefined;}}
async function remember(request,response){if(response.ok)try{const cache=await caches.open(CACHE);await cache.put(request,response.clone());}catch{}}
async function audioRange(request){
  const cached=await cachedResponse(request.url);if(!cached)return fetch(request);
  const bytes=await cached.arrayBuffer(),length=bytes.byteLength;
  const match=/^bytes=(\d*)-(\d*)$/.exec(request.headers.get('range'));
  if(!match||(!match[1]&&!match[2]))return fetch(request);
  const start=match[1]?Number(match[1]):Math.max(0,length-Number(match[2]));
  const end=match[1]&&match[2]?Math.min(length-1,Number(match[2])):length-1;
  if(!Number.isSafeInteger(start)||!Number.isSafeInteger(end)||start>end||start>=length)return new Response(null,{status:416,headers:{'Content-Range':`bytes */${length}`}});
  return new Response(bytes.slice(start,end+1),{status:206,headers:{'Content-Type':'audio/mpeg','Accept-Ranges':'bytes','Content-Range':`bytes ${start}-${end}/${length}`,'Content-Length':String(end-start+1)}});
}
