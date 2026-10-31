const CACHE_NAME='bot-adventure-world53';
const ASSETS=['./','./index.html','./styles.css?v=world53','./layout.css?v=world53','./app.js?v=world53','./data.js?v=world53','./engine.js?v=world53','./art.js?v=world53','./manifest.webmanifest','./version.json','./assets/icon.svg','./assets/icon-192.png','./assets/icon-512.png','./refresh.html'];
self.addEventListener('install',event=>event.waitUntil(caches.open(CACHE_NAME).then(cache=>cache.addAll(ASSETS)).then(()=>self.skipWaiting())));
self.addEventListener('activate',event=>event.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(key=>key.startsWith('bot-adventure-')&&key!==CACHE_NAME).map(key=>caches.delete(key)))).then(()=>self.clients.claim())));
self.addEventListener('fetch',event=>{
  const url=new URL(event.request.url);
  if(event.request.method!=='GET'||url.origin!==self.location.origin||!url.pathname.startsWith(new URL('./',self.location.href).pathname))return;
  if(url.pathname.endsWith('/version.json')){event.respondWith(fetch(event.request,{cache:'no-store'}));return;}
  if(event.request.mode==='navigate'){
    event.respondWith(fetch(event.request).then(async response=>{if(response.ok){const cache=await caches.open(CACHE_NAME);await cache.put('./index.html',response.clone());}return response;}).catch(()=>caches.match('./index.html')));return;
  }
  event.respondWith(caches.match(event.request).then(cached=>cached||fetch(event.request).then(async response=>{if(response.ok){const cache=await caches.open(CACHE_NAME);cache.put(event.request,response.clone());}return response;})));
});
