const CODE={en:'en-US',ja:'ja-JP',zh:'zh-CN'},NAME={en:'영어',ja:'일본어',zh:'중국어'},SHORT={en:'영',ja:'일',zh:'중'},$=i=>document.getElementById(i),au=$('au');
const get=(k,d)=>{try{return localStorage.getItem(k)??d}catch(e){return d}},put=(k,v)=>{try{localStorage.setItem(k,v)}catch(e){}};
let lessons=[],lesson=null,D=null,lang=get('lang','en'),now=-1,view=get('view','both'),pr=get('pr','on')==='on',resume=0,ready=false,talk=get('talk','off')==='on',TALK=null,cues=[];
const mp3=t=>`audio/${lesson.id}_${lang}${t?'_talk':''}.mp3`,src=()=>mp3(talk),key=()=>`pos-${lesson.id}-${lang}${talk?'-talk-'+gap:''}`;
const el=(tag,cls,text)=>{const e=document.createElement(tag);e.className=cls;e.textContent=text;return e};
function opts(){const sc=$('sc');sc.dataset.view=view;sc.dataset.pr=pr?'on':'off';document.querySelectorAll('[data-v]').forEach(b=>b.setAttribute('aria-pressed',b.dataset.v===view));$('prb').setAttribute('aria-pressed',pr);put('view',view);put('pr',pr?'on':'off')}
const rate=()=>{au.playbackRate=au.defaultPlaybackRate=+$('rate').value};
function load(){
  build++;held=null;stops=[];ready=false;now=-1;$('play').disabled=false;resume=talk?0:+get(key(),0);if(talk){au.removeAttribute('src');au.load()}else au.src=src();rate();$('gaps').hidden=!talk;put('lang',lang);cues=(talk?TALK:D)[lang];$('talk').setAttribute('aria-pressed',talk);
  const sc=$('sc');sc.innerHTML='';
  ab=[];cues.forEach(([t,kind,text,p,ko],k)=>{const d=el('div','ln '+kind,'');if(kind==='gap')d.textContent='(대답해 보세요)';else{const x=el('span','tx',text);x.lang=CODE[lang];d.append(x,el('span','pr',p),el('small','',ko))}if(kind==='t'){const s=el('button','star','☆');s.setAttribute('aria-label','구간 반복 별표');s.setAttribute('aria-pressed',false);s.onclick=e=>{e.stopPropagation();star(k)};d.prepend(s)}d.onclick=()=>{if(outside(k))clearAB();resume=0;au.currentTime=cues[k][0]+0.01;au.play().catch(()=>{})};sc.appendChild(d)});
  $('vtl').textContent=SHORT[lang];document.querySelector('[data-v=both]').textContent='한/'+SHORT[lang];document.querySelectorAll('[data-l]').forEach(b=>b.setAttribute('aria-pressed',b.dataset.l===lang));
  showAB();if(talk)spaced();else mark(resume,true);saved();
  if('mediaSession' in navigator)navigator.mediaSession.metadata=new MediaMetadata({title:lesson.title+(talk?' 대화':'')+' ('+NAME[lang]+')',artist:'한 장면, 세 언어',artwork:[{src:'icon-512.png',sizes:'512x512',type:'image/png'}]});
}
function mark(time,scroll){const c=cues;let k=-1;while(k+1<c.length&&c[k+1][0]<=time)k++;if(k===now)return;now=k;[...$('sc').children].forEach((d,j)=>d.classList.toggle('now',j===k));if(scroll&&k>0)$('sc').children[k].scrollIntoView({block:'center'})}
au.onloadedmetadata=()=>{if(resume>0&&resume<au.duration-(talk?0.5:3))au.currentTime=resume;ready=true;rate()};
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
$('rate').value=get('rate','1.0');$('rate').onchange=()=>{put('rate',$('rate').value);rate();if(talk)respace()};$('loop').onclick=()=>{au.loop=!au.loop;$('loop').setAttribute('aria-pressed',au.loop)};
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
const GROUPS=[['food','食','식사와 쇼핑'],['move','路','길과 교통'],['trip','旅','여행과 건강'],['life','人','일상과 사람']];
let group=null;
function card(icon,title,desc,go){const b=el('button','',''),t=el('span','','');t.append(el('b','',title),el('small','',desc));if(icon){const m=el('span','mono',icon);m.lang='zh-TW';m.setAttribute('aria-hidden',true);b.append(m)}b.append(t);b.onclick=go;$('list').appendChild(b)}
function home(g){
  group=g;$('list').innerHTML='';$('list').dataset.level=g?'in':'top';$('crumb').hidden=!g;scrollTo(0,0);
  if(g){$('gname').textContent=GROUPS.find(x=>x[0]===g)[2];lessons.filter(l=>l.group===g).forEach(l=>card('',l.title,l.desc,()=>open(l)));return}
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
$('reload').onclick=async()=>{$('reload').textContent='불러오는 중';try{await (await navigator.serviceWorker.getRegistration()).update()}catch(e){}location.reload()};
// 홈 화면에 추가: 아이폰은 방법 안내만 가능, 지원하는 브라우저(안드로이드 등)는 설치 창 표시
let prompt_=null;
const installed=navigator.standalone||matchMedia('(display-mode: standalone)').matches;
$('install').hidden=!!installed;
addEventListener('beforeinstallprompt',e=>{e.preventDefault();prompt_=e});
$('install').onclick=()=>{if(prompt_){prompt_.prompt();prompt_=null}else $('howto').hidden=!$('howto').hidden};
// 안드로이드(갤럭시)는 안내 문구를 바꾼다
const ua=navigator.userAgent;
if(/Android/.test(ua))$('howto').innerHTML=/SamsungBrowser/.test(ua)?'<li>화면 아래 <b>메뉴(≡)</b>를 누릅니다.</li><li><b>"현재 페이지 추가"</b>를 누릅니다.</li><li><b>"홈 화면"</b>을 고릅니다.</li>':'<li>Chrome으로 이 주소를 엽니다.</li><li>오른쪽 위 <b>메뉴(⋮)</b>를 누릅니다.</li><li><b>"홈 화면에 추가"</b> 또는 <b>"앱 설치"</b>를 누릅니다.</li>';
// 대화 모드: 문장 사이 간격(쉐도잉). 화면이 꺼져도 이어지도록 무음을 넣은 음성을 기기에서 새로 만들어 재생
const HZ=24000;
let gap=get('gap','1'),build=0,stops=[],held=null,blob='';
function wav(parts,total){
  const v=new DataView(new ArrayBuffer(44+total*2)),str=(o,s)=>[...s].forEach((c,i)=>v.setUint8(o+i,c.charCodeAt(0)));
  str(0,'RIFF');v.setUint32(4,36+total*2,true);str(8,'WAVEfmt ');v.setUint32(16,16,true);v.setUint16(20,1,true);v.setUint16(22,1,true);
  v.setUint32(24,HZ,true);v.setUint32(28,HZ*2,true);v.setUint16(32,2,true);v.setUint16(34,16,true);str(36,'data');v.setUint32(40,total*2,true);
  parts.forEach(([at,a])=>{for(let i=0;i<a.length;i++)v.setInt16(44+(at+i)*2,Math.max(-1,Math.min(1,a[i]))*32767,true)});
  return new Blob([v],{type:'audio/wav'});
}
async function spaced(line){
  const my=++build,url=mp3(true),base=TALK[lang],speed=+$('rate').value;
  ready=false;held=null;stops=[];au.pause();$('play').disabled=true;
  try{
    const hit='caches' in window&&await (await caches.open('audio')).match(url),res=hit||await fetch(url);
    if(!res.ok)throw new Error(res.status);
    const data=await res.arrayBuffer(),ctx=new (window.OfflineAudioContext||window.webkitOfflineAudioContext)(1,1,HZ);
    const pcm=(await new Promise((ok,no)=>ctx.decodeAudioData(data,ok,no))).getChannelData(0);
    if(my!==build)return;
    // 원본은 문장마다 뒤에 0.8초 무음: 0.1초만 남기고 고른 간격만큼 채운다(속도를 바꿔도 실제 시간은 같게)
    const quiet=Math.round(((gap==='auto'?1.5:+gap)*speed-0.1)*HZ),parts=[],ends=[];let at=0;
    cues=base.map((c,k)=>{
      const from=Math.round(c[0]*HZ),to=(k+1<base.length?Math.round(base[k+1][0]*HZ):pcm.length)-Math.round(0.7*HZ),a=pcm.subarray(from,Math.max(from,to)),start=at/HZ;
      parts.push([at,a]);ends.push((at+a.length)/HZ);at+=a.length+quiet;return [start,...c.slice(1)];
    });
    if(blob)URL.revokeObjectURL(blob);
    blob=URL.createObjectURL(wav(parts,at));stops=ends;
    resume=line==null?+get(key(),0):cues[line][0];au.src=blob;
  }catch(e){if(my!==build)return;cues=base;resume=line==null?0:base[line][0];au.src=url}
  rate();$('play').disabled=false;now=-1;mark(resume,true);
}
async function respace(){
  const line=Math.max(0,now),was=!au.paused,mine=build+1;
  await spaced(line);
  if(was&&mine===build)au.play().catch(()=>{});
}
function pickGap(v){gap=v;put('gap',v);document.querySelectorAll('[data-g]').forEach(b=>b.setAttribute('aria-pressed',b.dataset.g===v))}
document.querySelectorAll('[data-g]').forEach(b=>b.onclick=()=>{if(b.dataset.g===gap)return;pickGap(b.dataset.g);if(talk&&lesson)respace()});
pickGap(gap);
// Auto stop: 한 문장이 끝나면 멈추고, 재생을 누르면 다음 문장
function autoStop(){
  if(!talk||gap!=='auto'||held||!ready||au.paused||au.seeking||!stops.length)return;
  const t=au.currentTime;let k=-1;while(k+1<cues.length&&cues[k+1][0]<=t)k++;
  if(k>=0&&t>=stops[k]&&t<stops[k]+1){au.pause();held={k,t:au.currentTime}}
}
au.addEventListener('timeupdate',autoStop);setInterval(autoStop,60);
au.addEventListener('play',()=>{
  if(held&&Math.abs(au.currentTime-held.t)<0.4){const n=ab.length===2&&held.k>=ab[1]?ab[0]:(held.k+1)%cues.length;au.currentTime=cues[n][0]+0.01}
  held=null;
});
