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
  ab=[];cues.forEach(([t,kind,text,p,ko],k)=>{const d=el('div','ln '+kind,'');if(kind==='gap')d.textContent='(대답해 보세요)';else{const x=el('span','tx',text);x.lang=CODE[lang];d.append(x,el('span','pr',p),el('small','',ko))}if(kind==='t'){const s=el('button','star','☆');s.setAttribute('aria-label','구간 반복 별표');s.setAttribute('aria-pressed',false);s.onclick=e=>{e.stopPropagation();star(k)};d.prepend(s)}d.onclick=()=>{if(outside(k))clearAB();resume=0;au.currentTime=t+0.01;au.play().catch(()=>{})};sc.appendChild(d)});
  $('vtl').textContent=SHORT[lang];document.querySelector('[data-v=both]').textContent='한/'+SHORT[lang];document.querySelectorAll('[data-l]').forEach(b=>b.setAttribute('aria-pressed',b.dataset.l===lang));
  showAB();mark(resume,true);saved();
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
$('seek').onchange=()=>{drag=false;const v=+$('seek').value;if(ab.length===2&&(v<cues[ab[0]][0]||v>=endOf(ab[1])))clearAB();resume=0;au.currentTime=+$('seek').value;mark(au.currentTime,true)};
$('rew').onclick=()=>{resume=0;au.currentTime=Math.max(0,au.currentTime-sec);mark(au.currentTime,true)};
$('play').onclick=()=>au.paused?au.play().catch(()=>{}):au.pause();
['play','pause','emptied','ended'].forEach(n=>au.addEventListener(n,()=>{$('play').classList.toggle('on',!au.paused);$('play').setAttribute('aria-label',au.paused?'재생':'일시정지')}));
// 첫 화면: 큰 묶음 → 그 안의 상황
const GROUPS=[['food','🍽️','먹고 · 사기'],['move','🚇','이동 · 교통'],['trip','✈️','여행 · 건강']];
let group=null;
function card(icon,title,desc,go){const b=el('button','',''),t=el('span','','');t.append(el('b','',title),el('small','',desc));b.append(el('span','ico',icon),t);b.onclick=go;$('list').appendChild(b)}
function home(g){
  group=g;$('list').innerHTML='';$('crumb').hidden=!g;scrollTo(0,0);
  if(g){$('gname').textContent=GROUPS.find(x=>x[0]===g)[2];lessons.filter(l=>l.group===g).forEach(l=>card(l.icon,l.title,l.desc,()=>open(l)));return}
  GROUPS.forEach(([id,icon,name])=>{const a=lessons.filter(l=>l.group===id);if(a.length)card(icon,name,a.map(l=>l.title).join(' · '),()=>home(id))});
}
$('up').onclick=()=>home(null);
fetch('data/lessons.json').then(r=>r.json()).then(a=>{lessons=a;home(null)});
if('serviceWorker' in navigator)navigator.serviceWorker.register('sw.js').catch(()=>{});
// 별표 두 개 사이 구간 반복
let ab=[];
const endOf=k=>k+1<cues.length?cues[k+1][0]:au.duration;
const outside=k=>ab.length===2&&(k<ab[0]||k>ab[1]);
function showAB(){
  [...$('sc').children].forEach((d,k)=>{const s=d.querySelector('.star');if(s){const on=ab.includes(k);s.textContent=on?'★':'☆';s.setAttribute('aria-pressed',on)}d.classList.toggle('inab',ab.length===2&&!outside(k))});
  $('ab').hidden=!ab.length;$('abt').textContent=ab.length===2?'★ 구간 반복 중':'★ 반복할 끝 문장의 별을 누르세요';
}
function clearAB(){ab=[];showAB()}
function star(k){
  if(ab.includes(k))ab=ab.filter(x=>x!==k);
  else if(ab.length===1){ab=[ab[0],k].sort((a,b)=>a-b);resume=0;au.currentTime=cues[ab[0]][0]+0.01;au.play().catch(()=>{})}
  else ab=[k];
  showAB();
}
function loopAB(){if(ab.length===2&&ready&&!au.paused&&!au.seeking&&au.currentTime>=endOf(ab[1])-0.08)au.currentTime=cues[ab[0]][0]+0.01}
au.addEventListener('timeupdate',loopAB);setInterval(loopAB,60);
au.addEventListener('ended',()=>{if(ab.length===2){au.currentTime=cues[ab[0]][0]+0.01;au.play().catch(()=>{})}});
$('abx').onclick=clearAB;
// 글씨 크기
const SIZES=[0.75,0.88,1,1.15,1.3];let size=Math.min(4,Math.max(0,+get('size',1)||0));
function zoom(step){size=Math.min(4,Math.max(0,size+step));put('size',size);$('sc').style.setProperty('--z',SIZES[size]);$('fsm').disabled=size===0;$('fsp').disabled=size===4}
$('fsm').onclick=()=>zoom(-1);$('fsp').onclick=()=>zoom(1);zoom(0);
// 뒤로 감기 시간
let sec=+get('sec',5)||5;
function pick(v){sec=v;put('sec',v);const name=v===60?'1분':v+'초';$('rew').textContent='↺ '+name;document.querySelectorAll('[data-s]').forEach(b=>b.setAttribute('aria-pressed',+b.dataset.s===v))}
document.querySelectorAll('[data-s]').forEach(b=>b.onclick=()=>pick(+b.dataset.s));pick(sec);
// 새로고침(홈 화면 앱에는 브라우저 버튼이 없음)
$('reload').onclick=async()=>{$('reload').textContent='불러오는 중…';try{await (await navigator.serviceWorker.getRegistration()).update()}catch(e){}location.reload()};
