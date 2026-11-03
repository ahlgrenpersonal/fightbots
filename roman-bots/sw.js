const CACHE='roman-bots-roman15',ASSETS=['./','./index.html','./styles.css?v=roman15','./app.js?v=roman15','./data.js?v=roman15','./engine.js?v=roman15','./art.js?v=roman15','./geometry.js?v=roman15','./icons.js?v=roman15','./manifest.webmanifest','./version.json','./refresh.html','./assets/icon-192.png','./assets/icon-512.png','./assets/courtyard-theme.mp3'];
self.addEventListener('install',event=>event.waitUntil(caches.open(CACHE).then(cache=>cache.addAll(ASSETS)).then(()=>self.skipWaiting())));
self.addEventListener('activate',event=>event.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(key=>key.startsWith('roman-bots-')&&key!==CACHE).map(key=>caches.delete(key)))).then(()=>self.clients.claim())));
self.addEventListener('fetch',event=>{
  const url=new URL(event.request.url),scope=new URL('./',self.location.href);if(event.request.method!=='GET'||url.origin!==scope.origin||!url.pathname.startsWith(scope.pathname))return;
  if(url.pathname===new URL('./assets/courtyard-theme.mp3',scope).pathname&&event.request.headers?.get('range')){
    event.respondWith(audioRange(event.request));return;
  }
  if(url.pathname.endsWith('/version.json')){event.respondWith(fetch(event.request,{cache:'no-store'}));return;}
  if(event.request.mode==='navigate'){
    const shell=url.pathname===scope.pathname||url.pathname===new URL('./index.html',scope).pathname;
    event.respondWith(fetch(event.request).then(async res=>{if(res.ok){const cache=await caches.open(CACHE);await cache.put(shell?'./index.html':event.request,res.clone());}return res;}).catch(()=>caches.match(shell?'./index.html':event.request)));return;
  }
  event.respondWith(caches.match(event.request).then(cached=>cached||fetch(event.request).then(async res=>{if(res.ok){const cache=await caches.open(CACHE);await cache.put(event.request,res.clone());}return res;})));
});
async function audioRange(request){
  const cached=await caches.match(request.url);if(!cached)return fetch(request);
  const bytes=await cached.arrayBuffer(),length=bytes.byteLength;
  const match=/^bytes=(\d*)-(\d*)$/.exec(request.headers.get('range'));
  if(!match||(!match[1]&&!match[2]))return fetch(request);
  const start=match[1]?Number(match[1]):Math.max(0,length-Number(match[2]));
  const end=match[1]&&match[2]?Math.min(length-1,Number(match[2])):length-1;
  if(!Number.isSafeInteger(start)||!Number.isSafeInteger(end)||start>end||start>=length)return new Response(null,{status:416,headers:{'Content-Range':`bytes */${length}`}});
  return new Response(bytes.slice(start,end+1),{status:206,headers:{'Content-Type':'audio/mpeg','Accept-Ranges':'bytes','Content-Range':`bytes ${start}-${end}/${length}`,'Content-Length':String(end-start+1)}});
}
