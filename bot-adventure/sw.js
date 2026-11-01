const CACHE_NAME='bot-adventure-world79';
const ASSETS=['./','./index.html','./styles.css?v=world79','./layout.css?v=world79','./app.js?v=world79','./data.js?v=world79','./topology.js?v=world79','./content.js?v=world79','./engine.js?v=world79','./patrols.js?v=world79','./art.js?v=world79','./atlas.js?v=world79','./manifest.webmanifest','./version.json','./assets/icon.svg','./assets/icon-192.png','./assets/icon-512.png','./refresh.html'];
ASSETS.push('./pantheon.js?v=world79','./pantheon-art.js?v=world79','./royal-court.js?v=world79');
ASSETS.push('./adventure-saves.js?v=world79','./hold-confirm.js?v=world79');
self.addEventListener('install',event=>event.waitUntil(caches.open(CACHE_NAME).then(cache=>cache.addAll(ASSETS)).then(()=>self.skipWaiting())));
self.addEventListener('activate',event=>event.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(key=>key.startsWith('bot-adventure-')&&key!==CACHE_NAME).map(key=>caches.delete(key)))).then(()=>self.clients.claim())));
self.addEventListener('fetch',event=>{
  const url=new URL(event.request.url);
  if(event.request.method!=='GET'||url.origin!==self.location.origin||!url.pathname.startsWith(new URL('./',self.location.href).pathname))return;
  if(url.pathname.endsWith('/version.json')){event.respondWith(fetch(event.request,{cache:'no-store'}));return;}
  if(event.request.mode==='navigate'){
    const base=new URL('./',self.location.href),isShell=url.pathname===base.pathname||url.pathname===new URL('./index.html',base).pathname;
    event.respondWith(fetch(event.request).then(async response=>{if(response.ok){const cache=await caches.open(CACHE_NAME);await cache.put(isShell?'./index.html':event.request,response.clone());}return response;}).catch(()=>caches.match(isShell?'./index.html':event.request)));return;
  }
  event.respondWith(caches.match(event.request).then(cached=>cached||fetch(event.request).then(async response=>{if(response.ok){const cache=await caches.open(CACHE_NAME);cache.put(event.request,response.clone());}return response;})));
});
