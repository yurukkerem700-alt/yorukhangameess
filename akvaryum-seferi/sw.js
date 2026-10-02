/* Akvaryum Seferi — basit çevrimdışı önbellek (ağ öncelikli, Three.js CDN dosyaları önbelleğe alınır) */
const CACHE='akvaryum-v1';
const CORE=['./','index.html','manifest.webmanifest','icon.svg','icon-192.png','icon-512.png'];
self.addEventListener('install',e=>{e.waitUntil(caches.open(CACHE).then(c=>c.addAll(CORE)).then(()=>self.skipWaiting()));});
self.addEventListener('activate',e=>{e.waitUntil(caches.keys().then(k=>Promise.all(k.filter(x=>x!==CACHE).map(x=>caches.delete(x)))).then(()=>self.clients.claim()));});
self.addEventListener('fetch',e=>{
  const r=e.request;if(r.method!=='GET')return;
  const u=new URL(r.url);
  if(u.hostname.includes('peerjs.com')||u.pathname.includes('/peerjs'))return;
  e.respondWith(fetch(r).then(res=>{if(res&&res.status===200&&(u.origin===location.origin||u.hostname==='cdn.jsdelivr.net')){const cp=res.clone();caches.open(CACHE).then(c=>c.put(r,cp));}return res;}).catch(()=>caches.match(r).then(m=>m||caches.match('index.html'))));
});
