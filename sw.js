// 화면·자막은 네트워크 우선(끊기면 저장본), 음성은 "오프라인 저장"한 것만 저장본 사용
const SHELL='shell-v16',FILES=['./','index.html','app.js','title.woff2','manifest.json','icon-192.png','icon-512.png','data/lessons.json','data/cafe.json','data/cafe_talk.json','data/restaurant.json','data/restaurant_talk.json','data/cafe2.json','data/cafe2_talk.json','data/store.json','data/store_talk.json','data/shopping.json','data/shopping_talk.json','data/directions.json','data/directions_talk.json','data/subway.json','data/subway_talk.json','data/taxi.json','data/taxi_talk.json','data/bus.json','data/bus_talk.json','data/transit2.json','data/transit2_talk.json','data/airport.json','data/airport_talk.json','data/hotel.json','data/hotel_talk.json','data/hospital.json','data/hospital_talk.json','data/pharmacy.json','data/pharmacy_talk.json','data/promise.json','data/promise_talk.json','data/phone.json','data/phone_talk.json','data/home.json','data/home_talk.json','data/work.json','data/work_talk.json','data/friends.json','data/friends_talk.json'];
self.addEventListener('install',e=>e.waitUntil(caches.open(SHELL).then(c=>c.addAll(FILES.map(f=>new Request(f,{cache:'reload'})))).then(()=>self.skipWaiting())));
self.addEventListener('activate',e=>e.waitUntil(self.clients.claim()));
async function audio(req){
  const hit=await (await caches.open('audio')).match(req.url);
  if(!hit)return fetch(req);
  const range=/bytes=(\d+)-(\d*)/.exec(req.headers.get('range')||'');
  if(!range)return hit;
  const b=await hit.blob(),from=+range[1],to=range[2]?Math.min(+range[2],b.size-1):b.size-1;
  return new Response(b.slice(from,to+1),{status:206,headers:{'Content-Type':'audio/mpeg','Content-Range':`bytes ${from}-${to}/${b.size}`,'Content-Length':String(to-from+1),'Accept-Ranges':'bytes'}});
}
self.addEventListener('fetch',e=>{
  const u=new URL(e.request.url);
  if(u.origin!==location.origin||e.request.method!=='GET')return;
  if(u.pathname.endsWith('.mp3')){if(e.request.destination)e.respondWith(audio(e.request));return}
  e.respondWith(fetch(e.request.url,{cache:'no-cache'}).then(r=>{if(r.ok){const c=r.clone();caches.open(SHELL).then(s=>s.put(e.request,c))}return r}).catch(()=>caches.match(e.request,{ignoreSearch:true})));
});
