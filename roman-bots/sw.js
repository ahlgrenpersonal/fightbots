const CACHE='roman-bots-roman08',ASSETS=['./','./index.html','./styles.css?v=roman08','./app.js?v=roman08','./data.js?v=roman08','./engine.js?v=roman08','./art.js?v=roman08','./geometry.js?v=roman08','./icons.js?v=roman08','./manifest.webmanifest','./version.json','./refresh.html','./assets/icon-192.png','./assets/icon-512.png'];
self.addEventListener('install',event=>event.waitUntil(caches.open(CACHE).then(cache=>cache.addAll(ASSETS)).then(()=>self.skipWaiting())));
self.addEventListener('activate',event=>event.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(key=>key.startsWith('roman-bots-')&&key!==CACHE).map(key=>caches.delete(key)))).then(()=>self.clients.claim())));
self.addEventListener('fetch',event=>{
  const url=new URL(event.request.url),scope=new URL('./',self.location.href);if(event.request.method!=='GET'||url.origin!==scope.origin||!url.pathname.startsWith(scope.pathname))return;
  if(url.pathname.endsWith('/version.json')){event.respondWith(fetch(event.request,{cache:'no-store'}));return;}
  if(event.request.mode==='navigate'){
    const shell=url.pathname===scope.pathname||url.pathname===new URL('./index.html',scope).pathname;
    event.respondWith(fetch(event.request).then(async res=>{if(res.ok){const cache=await caches.open(CACHE);await cache.put(shell?'./index.html':event.request,res.clone());}return res;}).catch(()=>caches.match(shell?'./index.html':event.request)));return;
  }
  event.respondWith(caches.match(event.request).then(cached=>cached||fetch(event.request).then(async res=>{if(res.ok){const cache=await caches.open(CACHE);await cache.put(event.request,res.clone());}return res;})));
});
