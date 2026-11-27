const CODE={en:'en-US',ja:'ja-JP',zh:'zh-CN'},NAME={en:'영어',ja:'일본어',zh:'중국어'},SHORT={en:'영',ja:'일',zh:'중'},$=i=>document.getElementById(i),au=$('au');
const get=(k,d)=>{try{return localStorage.getItem(k)??d}catch(e){return d}},put=(k,v)=>{try{localStorage.setItem(k,v)}catch(e){}};
let lessons=[],lesson=null,D=null,lang=get('lang','en'),now=-1,view=get('view','both'),pr=get('pr','on')==='on',resume=0,ready=false,talk=get('talk','off')==='on',TALK=null,cues=[];
const mp3=t=>`audio/${lesson.id}_${lang}${t?'_talk':''}.mp3`,src=()=>mp3(talk),key=()=>`pos-${lesson.id}-${lang}${talk?'-talk':''}`;
const el=(tag,cls,text)=>{const e=document.createElement(tag);e.className=cls;e.textContent=text;return e};
function opts(){const sc=$('sc');sc.dataset.view=view;sc.dataset.pr=pr?'on':'off';document.querySelectorAll('[data-v]').forEach(b=>b.setAttribute('aria-pressed',b.dataset.v===view));$('prb').setAttribute('aria-pressed',pr);put('view',view);put('pr',pr?'on':'off')}
const rate=()=>{au.playbackRate=au.defaultPlaybackRate=+$('rate').value};
function load(){
  ready=false;now=-1;resume=+get(key(),0);au.src=src();rate();put('lang',lang);cues=(talk?TALK:D)[lang];$('talk').setAttribute('aria-pressed',talk);
  const sc=$('sc');sc.innerHTML='';
  cues.forEach(([t,kind,text,p,ko])=>{const d=el('div','ln '+kind,'');if(kind==='gap')d.textContent='(대답해 보세요)';else{const x=el('span','tx',text);x.lang=CODE[lang];d.append(x,el('span','pr',p),el('small','',ko))}d.onclick=()=>{resume=0;au.currentTime=t+0.01;au.play().catch(()=>{})};sc.appendChild(d)});
  $('vtl').textContent=SHORT[lang];document.querySelector('[data-v=both]').textContent='한/'+SHORT[lang];document.querySelectorAll('[data-l]').forEach(b=>b.setAttribute('aria-pressed',b.dataset.l===lang));
  mark(resume,true);saved();
  if('mediaSession' in navigator)navigator.mediaSession.metadata=new MediaMetadata({title:lesson.title+(talk?' 대화':'')+' ('+NAME[lang]+')',artist:'3개 국어 듣기',artwork:[{src:'icon-512.png',sizes:'512x512',type:'image/png'}]});
}
function mark(time,scroll){const c=cues;let k=-1;while(k+1<c.length&&c[k+1][0]<=time)k++;if(k===now)return;now=k;[...$('sc').children].forEach((d,j)=>d.classList.toggle('now',j===k));if(scroll&&k>0)$('sc').children[k].scrollIntoView({block:'center'})}
au.onloadedmetadata=()=>{if(resume>0&&resume<au.duration-3)au.currentTime=resume;ready=true;rate()};
au.ontimeupdate=()=>{if(!ready)return;mark(au.currentTime,!au.paused);put(key(),au.currentTime.toFixed(1))};
au.onended=()=>put(key(),0);
async function saved(){if(!('caches' in window)){$('save').hidden=true;return}const c=await caches.open('audio'),hit=await c.match(mp3(false))&&await c.match(mp3(true));$('save').textContent=hit?'저장 ✓':'저장'}
$('save').onclick=async()=>{$('save').textContent='저장 중…';try{await (await caches.open('audio')).addAll([mp3(false),mp3(true)]);saved()}catch(e){$('save').textContent='저장 실패'}};
async function open(l){lesson=l;[D,TALK]=await Promise.all(['','_talk'].map(async s=>(await fetch(`data/${l.id}${s}.json`)).json()));$('title').textContent=l.title;$('home').hidden=true;$('player').hidden=false;scrollTo(0,0);load();opts()}
$('back').onclick=()=>{au.pause();$('player').hidden=true;$('home').hidden=false};
document.querySelectorAll('[data-l]').forEach(b=>b.onclick=()=>{au.pause();lang=b.dataset.l;scrollTo(0,0);load();opts()});
document.querySelectorAll('[data-v]').forEach(b=>b.onclick=()=>{view=b.dataset.v;opts()});
$('talk').onclick=()=>{au.pause();talk=!talk;put('talk',talk?'on':'off');scrollTo(0,0);load();opts()};
$('prb').onclick=()=>{pr=!pr;opts()};
$('rate').value=get('rate','1.0');$('rate').onchange=()=>{put('rate',$('rate').value);rate()};$('loop').onclick=()=>{au.loop=!au.loop;$('loop').setAttribute('aria-pressed',au.loop)};
const clock=s=>isFinite(s)?`${Math.floor(s/60)}:${String(Math.floor(s%60)).padStart(2,'0')}`:'0:00';
let drag=false;
function bar(){const t=ready?au.currentTime:resume;$('seek').max=au.duration||0;$('dur').textContent=clock(au.duration);if(!drag){$('seek').value=t;$('cur').textContent=clock(t)}}
['timeupdate','durationchange','loadedmetadata','emptied','seeked'].forEach(n=>au.addEventListener(n,bar));
$('seek').oninput=()=>{drag=true;$('cur').textContent=clock(+$('seek').value)};
$('seek').onchange=()=>{drag=false;resume=0;au.currentTime=+$('seek').value;mark(au.currentTime,true)};
$('rew').onclick=()=>{resume=0;au.currentTime=Math.max(0,au.currentTime-5);mark(au.currentTime,true)};
$('play').onclick=()=>au.paused?au.play().catch(()=>{}):au.pause();
['play','pause','emptied','ended'].forEach(n=>au.addEventListener(n,()=>{$('play').classList.toggle('on',!au.paused);$('play').setAttribute('aria-label',au.paused?'재생':'일시정지')}));
fetch('data/lessons.json').then(r=>r.json()).then(a=>{lessons=a;a.forEach(l=>{const b=el('button','',''),t=el('span','','');t.append(el('b','',l.title),el('small','',l.desc));b.append(el('span','ico',l.icon),t);b.onclick=()=>open(l);$('list').appendChild(b)})});
if('serviceWorker' in navigator)navigator.serviceWorker.register('sw.js').catch(()=>{});
