/* Akvaryum Seferi — çevrimdışı önbellek + arka planda sürüm indirme.
   Yeni sürümde VER değerini artır (index.html içindeki BUILD ve version.json ile aynı olmalı).
   Yeni service worker kurulurken dosyaları arka planda indirir; kullanıcı menüde GÜNCELLE'ye basınca devreye girer. */
const VER='2026.10.02-1';
const CACHE='akvaryum-'+VER;
const CORE=['./','index.html','manifest.webmanifest','icon.svg','icon-192.png','icon-512.png','icon-maskable-512.png','apple-touch-icon.png'];
self.addEventListener('install',e=>{
  e.waitUntil(caches.open(CACHE).then(c=>Promise.all(CORE.map(u=>c.add(new Request(u,{cache:'reload'})).catch(()=>{})))).then(()=>{if(!self.registration.active)self.skipWaiting();}));
});
self.addEventListener('activate',e=>{e.waitUntil(caches.keys().then(k=>Promise.all(k.filter(x=>x!==CACHE).map(x=>caches.delete(x)))).then(()=>self.clients.claim()));});
self.addEventListener('message',e=>{if(e.data==='skip')self.skipWaiting();});
self.addEventListener('fetch',e=>{
  const r=e.request;if(r.method!=='GET')return;
  const u=new URL(r.url);
  if(u.hostname.includes('peerjs.com')||u.pathname.includes('/peerjs'))return;
  if(u.pathname.endsWith('/version.json'))return;
  e.respondWith(fetch(r).then(res=>{if(res&&res.status===200&&(u.origin===location.origin||u.hostname==='cdn.jsdelivr.net')){const cp=res.clone();caches.open(CACHE).then(c=>c.put(r,cp));}return res;}).catch(()=>caches.match(r).then(m=>m||caches.match('index.html'))));
});
