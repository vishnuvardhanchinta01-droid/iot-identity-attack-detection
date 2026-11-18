const $=s=>document.querySelector(s), $$=s=>[...document.querySelectorAll(s)];
const C={ok:'var(--ok)',warn:'var(--warn)',bad:'var(--bad)',acc:'var(--accent)',mute:'var(--mute)',other:'var(--other)'};
let META=null;
const post=(u,d)=>fetch(u,{method:'POST',body:JSON.stringify(d)}).then(r=>r.json());
const f2=x=>x==null?'–':(+x).toFixed(2), pc=(x,d=0)=>x==null?'–':(100*x).toFixed(d)+'%';
const esc=s=>String(s).replace(/[&<>]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;'}[c]));
const sleep=ms=>new Promise(r=>setTimeout(r,ms));

/* ---------- icons ---------- */
const P={check:'<polyline points="20 6 9 17 4 12"/>',x:'<line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>',
 alert:'<path d="M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12" y2="17.01"/>',
 bell:'<path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.7 21a2 2 0 0 1-3.4 0"/>',
 belloff:'<path d="M13.7 21a2 2 0 0 1-3.4 0"/><path d="M18.6 13A17.9 17.9 0 0 1 18 8"/><path d="M6.3 6.3A5.9 5.9 0 0 0 6 8c0 7-3 9-3 9h14"/><path d="M18 8a6 6 0 0 0-9.3-5"/><line x1="1" y1="1" x2="23" y2="23"/>',
 shield:'<path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>',shieldok:'<path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><polyline points="9 12 11 14 15 10"/>',
 id:'<path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="8.5" cy="7" r="4"/><polyline points="17 11 19 13 23 9"/>',
 chip:'<rect x="4" y="4" width="16" height="16" rx="2"/><rect x="9" y="9" width="6" height="6"/><line x1="9" y1="1" x2="9" y2="4"/><line x1="15" y1="1" x2="15" y2="4"/><line x1="9" y1="20" x2="9" y2="23"/><line x1="15" y1="20" x2="15" y2="23"/>',
 clock:'<circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>',help:'<circle cx="12" cy="12" r="10"/><path d="M9.1 9a3 3 0 0 1 5.8 1c0 2-3 3-3 3"/><line x1="12" y1="17" x2="12" y2="17.01"/>',
 lock:'<rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>',unlock:'<rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 9.9-1"/>',
 eq:'<line x1="5" y1="9" x2="19" y2="9"/><line x1="5" y1="15" x2="19" y2="15"/>',neq:'<line x1="5" y1="9" x2="19" y2="9"/><line x1="5" y1="15" x2="19" y2="15"/><line x1="16" y1="4" x2="8" y2="20"/>',
 wave:'<polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/>',zap:'<polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>',arrow:'<line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/>',
 scale:'<path d="M12 3v18"/><path d="M5 7h14"/><path d="M5 7l-3 7a4 4 0 0 0 6 0z"/><path d="M19 7l-3 7a4 4 0 0 0 6 0z"/>',file:'<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/>',
 key:'<circle cx="7.5" cy="15.5" r="5.5"/><path d="M21 2l-9.6 9.6"/><path d="M15.5 7.5l3 3L22 7l-3-3"/>',list:'<line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/><line x1="3" y1="6" x2="3.01" y2="6"/><line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/>',
 hash:'<line x1="4" y1="9" x2="20" y2="9"/><line x1="4" y1="15" x2="20" y2="15"/><line x1="10" y1="3" x2="8" y2="21"/><line x1="16" y1="3" x2="14" y2="21"/>',minus:'<line x1="5" y1="12" x2="19" y2="12"/>',
 box:'<path d="M21 16V8a2 2 0 0 0-1-1.7l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.7l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/>',
 user:'<path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>'};
const ic=(n,s=18,w=2.2)=>`<svg class="ic" width="${s}" height="${s}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="${w}" stroke-linecap="round" stroke-linejoin="round">${P[n]}</svg>`;
const flag=(tone,icon,txt)=>`<span class="flag ${tone}">${ic(icon,16)}${txt}</span>`;
const bar=(v,tone='',cls='mini')=>`<span class="bar ${cls} ${tone}"><i style="width:${Math.round(100*Math.max(0,Math.min(1,v||0)))}%"></i></span>`;
const tileH=(tone,icon,k,v,d,extra='')=>`<div class="tile ${tone}"><div class="k">${ic(icon,16)}${k}</div><div class="v">${v}</div>${extra}<div class="d">${d}</div></div>`;
async function pool(jobs,n,onDone){let i=0;const w=async()=>{while(i<jobs.length){const j=jobs[i++];await j();onDone&&onDone()}};await Promise.all(Array.from({length:n},w))}
function subnav(id,cb){$$(`#${id} button`).forEach(b=>b.onclick=()=>{$$(`#${id} button`).forEach(x=>x.classList.toggle('on',x===b));cb(b.dataset.v)})}
function setSub(id,v){$$(`#${id} button`).forEach(x=>x.classList.toggle('on',x.dataset.v===v))}

/* ---------- devices and attacks ---------- */
function tierOf(n){if(n==='unregistered')return{cls:'OTHER',txt:'not registered'};const d=META.devices.find(x=>x.name===n);if(!d)return{cls:'OTHER',txt:''};const t=d.tier;
 return t==='VERIFIED'?{cls:'VERIFIED',txt:'verified'}:t.startsWith('MONITOR')?{cls:'MON',txt:'monitor-only'}:t.startsWith('NOT')?{cls:'OTHER',txt:'no identity model'}:{cls:'OTHER',txt:'not claimed'}}
const dname=n=>n==='unregistered'?'unregistered identity':n;
const devCell=n=>{const t=tierOf(n);return `<span class="dev"><b>${esc(dname(n))}</b><span class="tier ${t.cls}">${t.txt}</span></span>`};
const TYPES={ArpSpoof:'ARP spoofing',PingOfDeath:'Ping of death',Smurf:'Smurf (ICMP reflection)',Snmp:'SNMP reflection',Ssdp:'SSDP reflection',TcpSynDevice:'TCP SYN flood',TcpSynReflection:'TCP SYN reflection',UdpDevice:'UDP flood'};
const TYPE_INFO={'ARP spoofing':'fake ARP replies redirect the device\'s traffic','Ping of death':'oversized ping packets','Smurf (ICMP reflection)':'ICMP requests sent with a spoofed source','SNMP reflection':'the device is used to reflect SNMP traffic','SSDP reflection':'the device is used to reflect SSDP traffic','TCP SYN flood':'a flood of half-open TCP connections','TCP SYN reflection':'the device is used to reflect SYN packets','UDP flood':'a flood of UDP packets'};
function atk(n){const m=String(n).match(/^([A-Za-z]+?)(\d+)([LW])2D(?:2([LW]))?$/);if(!m||!TYPES[m[1]])return{type:n,rate:'',dir:'',label:n};
 const dir=(m[3]==='L'?'from the local network':'from the internet')+(m[4]?`, reflected to a ${m[4]==='L'?'local':'internet'} victim`:'');
 return{type:TYPES[m[1]],rate:`${m[2]} pkt/s`,dir,label:`${TYPES[m[1]]} · ${m[2]} pkt/s · ${dir}`}}
const attsOf=n=>(META.devices.find(d=>d.name===n)||{att:[]}).att;
const typesOf=n=>[...new Set(attsOf(n).map(a=>atk(a.name).type))];
function firstOfType(n,type){const L=attsOf(n).filter(a=>atk(a.name).type===type);return (L.find(a=>atk(a.name).rate==='10 pkt/s')||L[0]||{}).j}
const outcome=(S,isAtt)=>{const v=S.verdict;if(/^Refused/.test(v))return'Refuse';if(/^Cannot verify identity;/.test(v))return S.detected?'Detected':'Missed';if(/^Cannot verify/.test(v))return'Refuse';
 if(/^Rejected, and attack detected/.test(v)||/^Rejected, attack missed/.test(v))return S.detected?'Reject + detected':'Reject, missed';if(/^Attack detected/.test(v))return'Detected';if(/^Attack missed/.test(v))return'Missed';
 if(/^Accepted, but attack/.test(v))return'Accept + alert';if(/^Accepted/.test(v))return'Accept';if(/^Rejected/.test(v))return'Reject';if(/verify/.test(v))return'Re-verify';return v};
const OUTF={Accept:['ok','shieldok','Accepted'],'Accept + alert':['bad','bell','Accepted + alert'],Reject:['bad','x','Rejected'],'Re-verify':['warn','help','Re-verify'],Refuse:['bad','lock','Refused'],Detected:['bad','bell','Attack detected'],Missed:['warn','alert','Attack missed'],'Reject + detected':['bad','bell','Rejected + attack detected'],'Reject, missed':['warn','alert','Rejected, attack missed']};
const outFlag=o=>{const f=OUTF[o]||['n','minus',o];return flag(f[0],f[1],f[2])};
const tone=o=>(OUTF[o]||['n'])[0];

/* ======================= shared result view ======================= */
let RV={timer:null,id:0};
async function runCase(el,p,{animate=true}={}){
  const id=++RV.id;clearInterval(RV.timer);
  el.innerHTML=resultSkeleton(p);
  const r=await post('/api/run',{src:p.src,claim:p.claim,mode:p.att!=null?'attack':'clean',att_j:p.att??0});if(id!==RV.id)return r;
  if(r.error){el.querySelector('.banner').outerHTML=`<div class="banner bad"><div class="bi">${ic('x',24)}</div><div class="vt">${esc(r.error)}</div></div>`;return r}
  let k=animate?0:r.n;const step=Math.max(1,Math.round(r.n/55));
  const tick=()=>{drawResult(el,p,r,k);if(k>=r.n){clearInterval(RV.timer);return}k=Math.min(r.n,k+step)};
  tick();if(animate)RV.timer=setInterval(tick,65);return r;
}
function resultSkeleton(p){return `<div class="banner n"><div class="bi">${ic('shield',24)}</div><div><div class="vt">Checking…</div><div class="why">Replaying recorded traffic through the identity check and the attack detector.</div></div></div>${whoRow(p)}<div class="pipe three" id="rv_pipe"></div><div class="tiles three" id="rv_tiles"></div>`}
function whoRow(p){const same=p.src===p.claim;const t1=tierOf(p.src),t2=tierOf(p.claim);const A=p.att!=null?atk((attsOf(p.src).find(a=>a.j==p.att)||{}).name):null;
 return `<div class="who4"><div class="idcard"><div class="icon">${ic('chip',22)}</div><div><div class="k">Actual device</div><div class="v">${esc(p.src)}</div><span class="tier ${t1.cls}">${t1.txt}</span></div></div>
 <div class="rel ${same?'same':'diff'}"><div class="c">${ic(same?'eq':'neq',22,2.6)}</div>${same?'claim<br>matches':'claims to be<br>someone else'}</div>
 <div class="idcard"><div class="icon">${ic('id',22)}</div><div><div class="k">Claimed identity</div><div class="v">${esc(dname(p.claim))}</div><span class="tier ${t2.cls}">${t2.txt}</span></div></div>
 <div class="cond ${A?'attack':'normal'}"><div class="icon">${ic(A?'zap':'wave',22)}</div><div><div class="k">Traffic</div><div class="v">${A?esc(A.type):'Normal traffic'}</div><div class="d">${A?esc(A.rate+' · '+A.dir):'recorded benign traffic'}</div></div></div></div>`}
function alertsUpTo(R,k){let g=[],cur=[];for(let i=0;i<k;i++)if(R.alarm[i]){if(cur.length&&i-cur[cur.length-1]>5){g.push(cur);cur=[]}cur.push(i)}if(cur.length)g.push(cur);return g.filter(x=>x.length>=R.summary.min_alarm).length}
function drawResult(el,p,R,k){
  const S=R.summary,n=R.n,done=k>=n,wd=R.wins.filter(w=>w.b<=k),noid=R.thr_id==null,isAtt=S.attack_minutes>0;
  const conf=wd.length?wd.filter(w=>w.show==='CONFIRMED').length/wd.length:0;const tops={};wd.forEach(w=>tops[w.top]=(tops[w.top]||0)+1);const top=(Object.entries(tops).sort((a,b)=>b[1]-a[1])[0]||[])[0];
  const alerts=done?S.alerts:alertsUpTo(R,k);const insAl=R.inatt.reduce((a,v,i)=>a+(v&&R.alarm[i]&&i<k?1:0),0),det=isAtt&&insAl>=S.min_alarm,started=R.inatt.slice(0,k).some(v=>v);
  // banner
  const b=el.querySelector('.banner');
  if(done){const o=outcome(S,isAtt),t=tone(o);const icn={ok:'shieldok',warn:/verify/.test(S.verdict)?'help':'alert',bad:/attack|Attack/.test(S.verdict)?'bell':(/Refused|verify/.test(S.verdict)?'lock':'x')}[t]||'shield';
    b.className='banner '+(S.tone==='warn'&&t==='bad'?'bad':S.tone);b.innerHTML=`<div class="bi">${ic(icn,26,2.4)}</div><div><div class="vt">${esc(S.verdict)}</div><div class="why">${esc(S.why)}</div></div>`}
  else b.querySelector('.why').textContent='Replaying recorded traffic…';
  // pipeline
  const st=(cls,icon,h,v,d)=>`<div class="stage-box ${cls}"><div class="h"><span class="si">${ic(icon,16)}</span>${h}</div><div class="v">${v}</div><div class="d">${d}</div></div>`;
  const arrow=`<div class="arrow">${ic('arrow',18)}</div>`;
  const idCls=noid?(done?'bad':'pending'):(!wd.length?'active':(conf>=.5?'ok':(wd.some(w=>w.show==='OTHER DEVICE')?'bad':'warn')));
  const s2=noid?st(done?'bad':'pending','id','Identity check','Not checked',R.tier==='NOT REGISTERED'?'identity is not registered':'no identity model'):st(idCls,'id','Identity check',wd.length?pc(conf)+' confirmed':'…',wd.length?`looks like ${esc(top)}`:'waiting for the first check');
  const detCls=R.thr===0?(done?'n pending':'pending'):((isAtt?det:alerts)?'bad':(done?'ok':'active'));
  const s3=R.thr===0?st('pending','shield','Attack detector','–','nothing to compare against'):st(detCls,(isAtt?det:alerts)?'bell':'shield','Attack detector',isAtt?(det?'Attack flagged':(done?'Missed':(started?'watching…':'quiet'))):(alerts?`${alerts} alert${alerts>1?'s':''}`:(done?'No alert':'quiet')),isAtt?esc(atk(R.attack).type):'normal traffic');
  const o=done?outcome(S,isAtt):null;const s4=st(done?tone(o):'pending','scale','Decision',done?(OUTF[o]||['','',o])[2]:'…','');
  el.querySelector('#rv_pipe').innerHTML=s2+arrow+s3+arrow+s4;
  // tiles
  const t1=noid?tileH('n','id','Identity confirmed','–','not checked'):tileH(conf>=.5?'ok':(wd.length?'bad':'n'),'id','Identity confirmed',wd.length?pc(conf):'…',`${wd.filter(w=>w.show==='CONFIRMED').length} of ${wd.length} windows`,bar(conf,conf>=.5?'ok':'bad',''));
  const t2=isAtt?tileH(det?'bad':(done?'warn':'n'),det?'bell':'shield','Attack detected',det?'Yes':(done?'No':'…'),esc(atk(R.attack).type)):tileH('ok','shieldok','Attack detected','None','no attack in this traffic');
  const t3=R.thr===0?tileH('n','belloff','Alerts raised','–','no detector for this identity'):tileH(alerts?'bad':'ok',alerts?'bell':'belloff','Alerts raised',String(alerts),alerts?'detector raised an alert':'detector stayed quiet');
  el.querySelector('#rv_tiles').innerHTML=t1+t2+t3;
}

/* ======================= DEVICE TRAFFIC ======================= */
let MMODE='clean';
function mFill(){const src=$('#m_src').value,ts=typesOf(src);$('#m_type').innerHTML=ts.map(t=>`<option>${esc(t)}</option>`).join('');
 $('#m_mode button[data-v=attack]').disabled=!ts.length;if(!ts.length&&MMODE==='attack')mMode('clean');mRec()}
function mRec(){const src=$('#m_src').value,t=$('#m_type').value;$('#m_rec').innerHTML=attsOf(src).filter(a=>atk(a.name).type===t).map(a=>`<option value="${a.j}">${esc(atk(a.name).rate+' · '+atk(a.name).dir)}</option>`).join('')}
function mMode(m){MMODE=m;$$('#m_mode button').forEach(b=>b.classList.toggle('on',b.dataset.v===m));$('#m_attbox').style.display=m==='attack'?'':'none'}
function mParams(){return{src:$('#m_src').value,claim:$('#m_claim').value,att:MMODE==='attack'?+$('#m_rec').value:null}}
function mSet(p){$('#m_src').value=p.src;$('#m_claim').value=p.claim;mFill();if(p.att!=null){mMode('attack');const a=attsOf(p.src).find(x=>x.j==p.att);$('#m_type').value=atk(a.name).type;mRec();$('#m_rec').value=p.att}else mMode('clean')}
function dvMode(v){setSub('dv_mode',v);$('#dv_manual').style.display=v==='manual'?'':'none';$('#dv_presets').style.display=v==='presets'?'':'none'}

/* presets */
let PRESETS=[];
function buildPresets(){
  const V=['WeMoSwitch','TPLinkPlug','NetatmoCamera','LIFX'];const P=[];
  V.forEach(d=>P.push({g:'Honest device',src:d,claim:d,att:null,exp:'Accept'}));
  [['TPLinkPlug','WeMoSwitch',''],['WeMoSwitch','TPLinkPlug',''],['NetatmoCamera','TPLinkPlug','the detector stays quiet here; the identity check catches it'],['iHome','NetatmoCamera','the most-confused pair'],['HueBulb','LIFX','a monitor-only device']].forEach(([s,c,n])=>P.push({g:'Wrong claim',src:s,claim:c,att:null,exp:'Reject',note:n}));
  [['Chromecast','WeMoSwitch'],['SamsungCamera','NetatmoCamera']].forEach(([s,c])=>P.push({g:'Unknown device (never seen by the identity model)',src:s,claim:c,att:null,exp:'Reject'}));
  P.push({g:'Unregistered identity',src:'WeMoSwitch',claim:'unregistered',att:null,exp:'Refuse'});
  Object.values(TYPES).forEach(t=>{const d=V.find(v=>typesOf(v).includes(t))||META.devices.find(x=>typesOf(x.name).includes(t)).name;P.push({g:'Under attack (device claims itself)',src:d,claim:d,att:firstOfType(d,t),exp:'Detected'})});
  P.push({g:'Under attack and a wrong claim',src:'TPLinkPlug',claim:'WeMoSwitch',att:firstOfType('TPLinkPlug','TCP SYN flood'),exp:'Reject + detected'});
  P.push({g:'Under attack and a wrong claim',src:'Chromecast',claim:'WeMoSwitch',att:firstOfType('Chromecast','TCP SYN flood'),exp:'Reject + detected'});
  P.push({g:'Under attack, device without identity model',src:'SamsungCamera',claim:'SamsungCamera',att:firstOfType('SamsungCamera','UDP flood'),exp:'Detected'});
  PRESETS=P.map((p,i)=>Object.assign(p,{i,res:null}));
}
function presetLine(p){const A=p.att!=null?atk((attsOf(p.src).find(a=>a.j==p.att)||{}).name):null;
 return `<div class="pcase" data-i="${p.i}"><div><div class="t">${esc(p.src)} ${p.src===p.claim?ic('eq',13,2.6):ic('neq',13,2.6)} ${esc(dname(p.claim))}</div><div class="d">${A?`${ic('zap',12)} ${esc(A.type)} · ${esc(A.rate)}`:`${ic('wave',12)} normal traffic`}${p.note?' · '+esc(p.note):''}</div></div>
 <div class="r"><div class="note">expected</div>${outFlag(p.exp)}${p.res?`<div>${outcome(p.res)===p.exp?flag('ok','check','as expected'):flag('warn','alert','got: '+(OUTF[outcome(p.res)]||['','',outcome(p.res)])[2])}</div>`:''}</div></div>`}
function drawPresets(){const groups=[...new Set(PRESETS.map(p=>p.g))];$('#p_list').innerHTML=groups.map(g=>`<div class="pgroup"><div class="gt">${esc(g)}</div>${PRESETS.filter(p=>p.g===g).map(presetLine).join('')}</div>`).join('');
 $$('#p_list .pcase').forEach(c=>c.onclick=async()=>{$$('#p_list .pcase').forEach(x=>x.classList.remove('on'));c.classList.add('on');const p=PRESETS[+c.dataset.i];const r=await runCase($('#dv_result'),p);if(r&&r.summary){p.res=r.summary;drawPresets();$(`#p_list .pcase[data-i="${p.i}"]`).classList.add('on')}})}
async function runAllPresets(){$('#p_runall').disabled=true;PRESETS.forEach(p=>p.res=null);drawPresets();let k=0;
 await pool(PRESETS.map(p=>async()=>{const r=await post('/api/run',{src:p.src,claim:p.claim,mode:p.att!=null?'attack':'clean',att_j:p.att??0});p.res=r.summary}),4,()=>{k++;$('#p_bar').style.width=(100*k/PRESETS.length)+'%';$('#p_stat').textContent=`Ran ${k} of ${PRESETS.length}`;drawPresets()});
 const okN=PRESETS.filter(p=>outcome(p.res)===p.exp).length;$('#p_stat').textContent=`Finished ${PRESETS.length} cases. Click any case to watch it step by step.`;
 $('#p_sum').innerHTML=`<div class="sum">${ic(okN===PRESETS.length?'check':'alert',18)} As expected <b>${okN}/${PRESETS.length}</b></div>`;$('#p_runall').disabled=false}

/* ======================= ATTACKS ON THE ML ======================= */
function impResult(el,r,A,B){
  const won=r.accept_att>0.5,some=r.accept_att>r.accept_ref+1e-9;
  el.innerHTML=`<div class="banner ${won?'bad':'ok'}"><div class="bi">${ic(won?'unlock':'lock',26,2.4)}</div><div><div class="vt">${won?'Attacker gets in':some?'A few windows get through':'Attacker is still rejected'}</div><div class="why">${esc(B)} pretending to be ${esc(A)}: after ${r.Q} guesses its best score is ${f2(r.best)}; it needs ${f2(r.thr)}.</div></div></div>
  <div class="who4"><div class="idcard"><div class="icon">${ic('chip',22)}</div><div><div class="k">Attacker (actual device)</div><div class="v">${esc(B)}</div><span class="tier ${tierOf(B).cls}">${tierOf(B).txt}</span></div></div><div class="rel diff"><div class="c">${ic('neq',22,2.6)}</div>pretends<br>to be</div>
  <div class="idcard"><div class="icon">${ic('id',22)}</div><div><div class="k">Claimed identity</div><div class="v">${esc(A)}</div><span class="tier ${tierOf(A).cls}">${tierOf(A).txt}</span></div></div>
  <div class="cond attack"><div class="icon">${ic('user',22)}</div><div><div class="k">Attack on the ML</div><div class="v">Impersonation</div><div class="d">adds traffic to ${r.n_nonzero} of 40 features</div></div></div></div>
  <div class="panel"><div class="row"><span class="ct">Best score the attacker reached</span><span class="sp"></span><span class="note">${f2(r.best)} of ${f2(r.thr)} needed</span></div><div class="bar tall"><i style="width:${100*r.best}%"></i><s style="left:calc(${100*r.thr}% - 3px)"></s></div><div class="mlabels"><span>started at ${f2(r.start)}</span><span>acceptance threshold ▲</span></div></div>
  <div class="tiles three">${tileH(r.accept_att>0?'bad':'ok',r.accept_att>0?'unlock':'lock','Attacker accepted',pc(r.accept_att,1),`before the attack: ${pc(r.accept_ref,1)}`)}${tileH(r.accept_layered>0?'bad':'ok','shieldok','With the detector as a second check',pc(r.accept_layered,1),'also needs no attack alarm')}${tileH('n','id','Real device accepted',pc(r.honest,1),'honest baseline')}</div>`}
async function runImp(){const A=$('#a_t').value,B=$('#a_b').value;if(A===B){$('#i_result').innerHTML='<div class="empty">Choose two different devices.</div>';return}
 $('#a_run').disabled=true;$('#i_result').innerHTML=`<div class="banner n"><div class="bi">${ic('shield',24)}</div><div><div class="vt">Attacker searching…</div><div class="why">${esc(B)} tries up to ${$('#a_q').value} changes to its traffic to look like ${esc(A)}.</div></div></div>`;
 const r=await post('/api/attacker',{target:A,attacker:B,b:+$('#a_bound').value,Q:+$('#a_q').value});$('#a_run').disabled=false;if(r.error){$('#i_result').innerHTML=`<div class="banner bad"><div class="vt">${esc(r.error)}</div></div>`;return}impResult($('#i_result'),r,A,B)}
let IPR={};
function drawImpPresets(){const L=META.static.c1_pairs||[];
 $('#ip_table').innerHTML=`<table><tr><th>Target (claimed)</th><th>Attacker (actual)</th><th>Pair</th><th>📋 Recorded best score</th><th>📋 Recorded accepted</th><th>Live best score</th><th>Live accepted <small>(vs. no attack)</small></th><th></th></tr>${L.map((p,i)=>{const r=IPR[i];
  return `<tr><td>${devCell(p.target)}</td><td>${devCell(p.attacker)}</td><td><small>${p.kind}</small></td><td>${bar(p.best_score,'')}${f2(p.best_score)}</td><td>${flag(p.accepted_naive>0||p.accepted_adaptive>0?'bad':'ok','lock',pc(Math.max(p.accepted_naive,p.accepted_adaptive),1))}</td>
  <td>${r?(r.running?'<span class="note">running…</span>':bar(r.best,'')+f2(r.best)+` <small>/ ${f2(r.thr)}</small>`):''}</td><td>${r&&!r.running?flag(r.accept_att>r.accept_ref+1e-9?'bad':'ok',r.accept_att>r.accept_ref+1e-9?'unlock':'lock',pc(r.accept_att,1))+`<br><small>no attack: ${pc(r.accept_ref,1)}</small>`:''}</td><td><button class="ghostbtn" data-i="${i}">Open live</button></td></tr>`}).join('')}</table>`;
 $$('#ip_table button[data-i]').forEach(b=>b.onclick=()=>{const p=L[+b.dataset.i];setSub('i_mode','manual');impMode('manual');$('#a_t').value=p.target;$('#a_b').value=p.attacker;runImp()})}
async function runImpAll(){$('#ip_runall').disabled=true;IPR={};const L=META.static.c1_pairs||[];let k=0;
 for(let i=0;i<L.length;i++){IPR[i]={running:true};drawImpPresets();const r=await post('/api/attacker',{target:L[i].target,attacker:L[i].attacker,b:0.5,Q:300});IPR[i]=r;k++;$('#ip_bar').style.width=(100*k/L.length)+'%';drawImpPresets()}$('#ip_runall').disabled=false}
function impMode(v){$('#i_manual').style.display=v==='manual'?'':'none';$('#i_presets').style.display=v==='presets'?'':'none'}
function mlMode(v){setSub('ml_mode',v);$('#ml_imp').style.display=v==='imp'?'':'none';$('#ml_poi').style.display=v==='poi'?'':'none'}
function poison(){const Pz=META.static.poisoning,c=META.static.phaseC;const rate=r=>r===0?'clean (0%)':pc(r);
 const idRows=[0,0.01,0.05,0.1].map(r=>{const n=Pz.identity.find(x=>x.rate===r&&x.defence==='none'),d=Pz.identity.find(x=>x.rate===r&&x.defence!=='none');return`<tr><td><b>${rate(r)}</b></td><td>${flag(n.partner_accepted>0?'bad':'ok',n.partner_accepted>0?'unlock':'lock',pc(n.partner_accepted,1))}</td><td>${bar(n.honest_accepted,'ok')}${pc(n.honest_accepted,1)}</td><td>${flag(d.partner_accepted>0?'bad':'ok',d.partner_accepted>0?'unlock':'lock',pc(d.partner_accepted,1))}</td><td>${bar(d.honest_accepted,'ok')}${pc(d.honest_accepted,1)}</td></tr>`}).join('');
 const dRows=[0,0.01,0.05,0.1].map(r=>{const n=Pz.detector.find(x=>x.rate===r&&x.defence==='none'),d=Pz.detector.find(x=>x.rate===r&&x.defence!=='none');const t=v=>v>=0.95?'ok':v>=0.9?'warn':'bad';return`<tr><td><b>${rate(r)}</b></td><td>${bar(n.detection,t(n.detection))}${pc(n.detection,1)} <small>${pc(n.lo)}–${pc(n.hi)}</small></td><td>${pc(n.alarm,1)}</td><td>${bar(d.detection,t(d.detection))}${pc(d.detection,1)} <small>${pc(d.lo)}–${pc(d.hi)}</small></td><td>${pc(d.alarm,1)}</td></tr>`}).join('');
 $('#poi_body').innerHTML=`<div class="panel"><div class="row"><div class="ct big">${ic('id',18)} Poisoning the identity model</div><span class="sp"></span>${flag('ok','shieldok','attack failed at every rate')}</div>
  <p class="note"><b>What the attacker does:</b> slips windows of another device (the one most often confused with the target) into the target's training data, labelled as the target, so that device is later accepted as the target. <b>Defence (D4):</b> drop training windows that the model itself thinks are mislabelled, then retrain.</p>
  <table><tr><th>Share of poisoned training windows</th><th>Partner accepted · no defence</th><th>Real device accepted · no defence</th><th>Partner accepted · with D4</th><th>Real device accepted · with D4</th></tr>${idRows}</table>
  <p class="note">${esc(c.c2b.text)}</p></div>
 <div class="panel"><div class="row"><div class="ct big">${ic('shield',18)} Poisoning the attack detector</div><span class="sp"></span>${flag('warn','alert','detection drops; defence weak')}</div>
  <p class="note"><b>What the attacker does:</b> hides attack-like traffic in the device's training traffic labelled as normal, so the detector learns to treat attacks as normal. <b>Defence (D3):</b> fit, drop the 5% most unusual training samples, refit.</p>
  <table><tr><th>Share of poisoned training data</th><th>Attacks detected · no defence</th><th>False alarms</th><th>Attacks detected · with D3</th><th>False alarms</th></tr>${dRows}</table>
  <p class="note">${esc(c.c2a.text.replace('Mislabelled attack minutes','Mislabelled attack traffic'))}</p></div>`}

/* ======================= TAMPERING ======================= */
const TOPS=[['none','Do nothing (untouched bundle)',false,'Load'],['flip','Flip one bit in a file',true,'Refuse'],['replace','Replace a file with another valid file',true,'Refuse'],['delete','Delete a file',true,'Refuse'],['add','Add an extra file',false,'Refuse'],['manifest','Edit the manifest, keep the signature',false,'Refuse'],['sigflip','Corrupt the signature',false,'Refuse'],['rollback','Put back the previous signed version',false,'Refuse']];
const STEPI={'Signature':'key','Version':'list','File list':'file','File hashes':'hash','Models loaded':'box'};
function tamResult(el,r,opName){const ok=r.ok;
 el.innerHTML=`<div class="banner ${ok?'ok':'bad'}"><div class="bi">${ic(ok?'unlock':'lock',26,2.4)}</div><div><div class="vt">${ok?'Models loaded':'Refused: nothing loaded'}</div><div class="why">${esc(r.desc)}</div></div></div>
 <div class="panel"><div class="ct">The checks, in order</div><div class="steps">${r.steps.map(s=>`<div class="stp ${s.status}"><span class="si">${ic(s.status==='pass'?'check':s.status==='fail'?'x':'minus',16,2.6)}</span><span class="n">${ic(STEPI[s.name]||'minus',15)} ${esc(s.name)}</span><span class="dd">${esc(s.detail)}</span>${s.status==='fail'&&s.name!=='Models loaded'?`<span class="sp"></span>${flag('bad','lock','stopped here')}`:''}</div>`).join('')}</div></div>`}
function tFill(){const op=$('#t_op').value,needs=TOPS.find(t=>t[0]===op)[2];$('#t_filebox').style.display=needs?'':'none'}
async function runTam(){const op=$('#t_op').value,needs=TOPS.find(t=>t[0]===op)[2];$('#t_run').disabled=true;const r=await post('/api/tamper',{op,file:needs?$('#t_file').value:null,seed:Math.floor(Math.random()*1e6)+1});$('#t_run').disabled=false;tamResult($('#t_result'),r)}
let TPR={};
function drawTamPresets(){$('#tp_table').innerHTML=`<table><tr><th>Tampering</th><th>Expected</th><th>Result</th><th>Stopped at</th><th>Detail</th><th></th></tr>${TOPS.map(t=>{const r=TPR[t[0]];const stop=r?(r.steps.find(s=>s.status==='fail')||{}).name:'';
 return`<tr><td><b>${esc(t[1])}</b>${r&&r.target?`<br><small>${esc(r.target)}</small>`:''}</td><td>${t[3]==='Load'?flag('ok','unlock','Load'):flag('ok','lock','Refuse')}</td><td>${r?(r.ok?flag(t[3]==='Load'?'ok':'bad','unlock','Loaded'):flag('ok','lock','Refused')):''}</td><td>${stop&&stop!=='Models loaded'?`${ic(STEPI[stop],15)} ${esc(stop)}`:(r?'<small>all checks passed</small>':'')}</td><td><small>${r?esc(r.why):''}</small></td><td><button class="ghostbtn" data-op="${t[0]}">Open</button></td></tr>`}).join('')}</table>`;
 $$('#tp_table button[data-op]').forEach(b=>b.onclick=()=>{setSub('t_mode','manual');tMode('manual');$('#t_op').value=b.dataset.op;tFill();runTam()})}
async function runTamAll(){$('#tp_runall').disabled=true;TPR={};drawTamPresets();$('#tp_sum').innerHTML='';let k=0;for(const t of TOPS){TPR[t[0]]=await post('/api/tamper',{op:t[0],seed:Math.floor(Math.random()*1e6)+1});k++;$('#tp_bar').style.width=(100*k/TOPS.length)+'%';drawTamPresets()}
 const good=TOPS.filter(t=>(TPR[t[0]].ok?'Load':'Refuse')===t[3]).length,ref=TOPS.filter(t=>t[3]==='Refuse'&&!TPR[t[0]].ok).length;
 $('#tp_sum').innerHTML=`<div class="sum">${ic('lock',18)} Tampered bundles refused <b>${ref}/${TOPS.length-1}</b></div><div class="sum">${ic(good===TOPS.length?'check':'alert',18)} Behaved as expected <b>${good}/${TOPS.length}</b></div>`;$('#tp_runall').disabled=false}
function tMode(v){$('#t_manual').style.display=v==='manual'?'':'none';$('#t_presets').style.display=v==='presets'?'':'none'}

/* ======================= shell ======================= */
function tab(t){$$('.tab').forEach(x=>x.classList.toggle('on',x.id===t));$$('#nav button').forEach(b=>b.classList.toggle('on',b.dataset.t===t))}
(async function init(){
  META=await (await fetch('/api/meta')).json();const B=META.bundle;
  $('#bundle').className='badge '+(B.ok?'ok':'bad');$('#bundle').innerHTML=(B.ok?ic('lock',13)+` Signature verified · version ${B.version}`:'✗ bundle refused');$('#bundle').title=B.why+' · key '+B.pub;
  const names=META.devices.map(d=>d.name),opt=n=>`<option value="${n}">${n} · ${tierOf(n).txt}</option>`;
  $('#m_src').innerHTML=names.map(opt).join('');$('#m_claim').innerHTML=names.map(opt).join('')+'<option value="unregistered">unregistered identity</option>';
  const ver=names.filter(n=>tierOf(n).cls==='VERIFIED'),known=META.order;
  $('#a_t').innerHTML=ver.map(opt).join('');$('#a_b').innerHTML=known.map(opt).join('');$('#a_t').value='WeMoSwitch';$('#a_b').value='TPLinkPlug';
  $('#t_op').innerHTML=TOPS.map(t=>`<option value="${t[0]}">${esc(t[1])}</option>`).join('');$('#t_file').innerHTML=B.files.filter(f=>!/^manifest/.test(f)).map(f=>`<option>${f}</option>`).join('');$('#t_op').value='flip';$('#t_file').value='identity_forest.npz';
  const lab=()=>{$('#a_bv').textContent=(+$('#a_bound').value).toFixed(2)+' × normal peak';$('#a_qv').textContent=$('#a_q').value};['a_bound','a_q'].forEach(id=>$('#'+id).oninput=lab);lab();
  $$('#nav button').forEach(b=>b.onclick=()=>tab(b.dataset.t));
  subnav('dv_mode',dvMode);subnav('ml_mode',mlMode);subnav('i_mode',impMode);subnav('t_mode',tMode);
  $$('#m_mode button').forEach(b=>b.onclick=()=>mMode(b.dataset.v));$('#m_src').onchange=mFill;$('#m_type').onchange=mRec;$('#m_run').onclick=()=>runCase($('#dv_result'),mParams());
  $('#p_runall').onclick=runAllPresets;
  $('#a_run').onclick=runImp;$('#ip_runall').onclick=runImpAll;$('#t_op').onchange=tFill;$('#t_run').onclick=runTam;$('#tp_runall').onclick=runTamAll;
  buildPresets();drawPresets();mFill();drawImpPresets();poison();tFill();drawTamPresets();
  $('#dv_result').innerHTML='<div class="empty">Choose the devices and the traffic on the left, then press Run.</div>';
  $('#i_result').innerHTML='<div class="empty">Choose a target and an attacker, then press Run attacker.</div>';
  $('#t_result').innerHTML='<div class="empty">Choose what the attacker does to the bundle, then press Run.</div>';
})();
