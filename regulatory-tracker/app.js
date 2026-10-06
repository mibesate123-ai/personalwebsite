/* a2MC Regulatory Tracker. Data lives in localStorage; see Store. */
const CATS = ['Packaging materials','Nutritive substances','Testing methods','Labelling','Emerging concerns','Safety parameter','Regulatory framework','Processing aid','WHO Code','Trade'];
const ROUTE = {
 'Packaging materials':['Jenny P','Sandra Z','Vinny / Luzette'],
 'Nutritive substances':['Helena H','Roisin','PD (Leo)','Kang Yang'],
 'Testing methods':['Site lab: Shaneel','Iren Luo','Majid'],
 'Labelling':['IBU (Yohan, Suya, Adelyn, Nathan)','Liquid Milk (Shannon)','Doris S','Susan M','Vera Z','Dandan C'],
 'Emerging concerns':['DC','Denshia','Regs team (DS, SM, VZ)'],
 'Safety parameter':['DC','Denshia','Regs team (DS, SM, VZ)'],
 'Regulatory framework':['DC','Regs team (DS, SM, VZ)'],
 'Processing aid':['PD (Leo, Kang Yang)','Site Technical (Alan Z)'],
 'WHO Code':['IBU Marketing (Suya, Xiaoting)','Legal (Kate T, Betty F)'],
 'Trade':['SC (Chopin Z, John A, Tim Z)','IBU','DC','Legal (Kate T, Betty F)']
};
const MARKETS = ['NZ','AU','CN','SK','VN','US','EU','GCC','SG','HK','Global'];
const COUNTRIES = ['NZ','AU','FSANZ','EM Others'];
const STATUSES = ['Open','In progress','Closed'];
const ASTATUS = ['Not started','Ongoing','Complete'];
const MARKET_MAP = {NZ:['New Zealand'],AU:['Australia'],CN:['China'],SK:['South Korea'],VN:['Vietnam'],US:['United States of America'],
 EU:['Austria','Belgium','Bulgaria','Croatia','Cyprus','Czechia','Denmark','Estonia','Finland','France','Germany','Greece','Hungary','Ireland','Italy','Latvia','Lithuania','Luxembourg','Netherlands','Poland','Portugal','Romania','Slovakia','Slovenia','Spain','Sweden'],
 GCC:['Saudi Arabia','United Arab Emirates','Kuwait','Qatar','Oman']};
const MARKET_LABEL = {NZ:'New Zealand',AU:'Australia',CN:'China',SK:'South Korea',VN:'Vietnam',US:'United States',EU:'European Union',GCC:'Gulf Cooperation Council',SG:'Singapore',HK:'Hong Kong',Global:'Global'};

/* ---------- storage ---------- */
const KEY = 'a2mc-data-v1';
const Store = {
  data:{items:[],actions:[],settings:{name:''},seq:1},
  load(){ try{ const r=localStorage.getItem(KEY); if(r) this.data=Object.assign(this.data,JSON.parse(r)); }catch(e){} },
  save(){ try{ localStorage.setItem(KEY,JSON.stringify(this.data)); }catch(e){ toast('Could not save: browser storage is unavailable.'); } },
  nextId(){ return this.data.seq++; }
};
Store.load();
let ITEMS = Store.data.items, ACTIONS = Store.data.actions;
const persist = ()=>Store.save();

/* ---------- helpers ---------- */
const $ = s=>document.querySelector(s);
const iso = d=>{const z=new Date(d.getTime()-d.getTimezoneOffset()*6e4);return z.toISOString().slice(0,10);};
const todayISO = ()=>iso(new Date());
const addDays = (s,n)=>{const d=new Date(s+'T00:00:00');d.setDate(d.getDate()+n);return iso(d);};
const fmt = d=>d? new Date(d+'T00:00:00').toLocaleDateString('en-NZ',{day:'2-digit',month:'short',year:'numeric'}):'';
const esc = s=>String(s??'').replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const pill = (v,c)=>`<span class="pill ${(c||v).split(' ')[0]}">${esc(v)}</span>`;
const overdue = i=> i.resp && i.status!=='Closed' && i.resp<todayISO();
const me = ()=>Store.data.settings.name.trim();
const isMine = n=>me() && String(n||'').trim().toLowerCase()===me().toLowerCase();
const countryFor = m=> m==='NZ'?'NZ': m==='AU'?'AU':'EM Others';
function toast(msg){const t=document.createElement('div');t.className='toast';t.textContent=msg;document.body.appendChild(t);setTimeout(()=>t.remove(),2600);}
function download(name,text,type){const a=document.createElement('a');a.href=URL.createObjectURL(new Blob([text],{type}));a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(a.href),1000);}

let screen='home', openId=null, step=1, draft={}, done=null, editId=null, actPre=null;
try{const s=localStorage.getItem('a2mc-screen'); if(['home','history','insights','actions'].includes(s)) screen=s;}catch(e){}

function setScreen(s){screen=s;openId=null;try{localStorage.setItem('a2mc-screen',s)}catch(e){} render(); window.scrollTo(0,0);}
document.querySelectorAll('[data-go]').forEach(b=>b.onclick=()=>{ if(b.dataset.go==='add'){step=1;draft={};done=null;editId=null;} setScreen(b.dataset.go);});

function render(){
  document.querySelectorAll('[data-go]').forEach(b=>{ if(b.dataset.go===screen) b.setAttribute('aria-current','page'); else b.removeAttribute('aria-current');});
  $('#who').textContent=me();
  const m=$('#main'); m.innerHTML='';
  const el=document.createElement('div'); m.appendChild(el);
  ({home,history,insights,actions,add}[screen])(el);
}

/* ---------- Home ---------- */
function home(el){
  const open=ITEMS.filter(i=>i.status!=='Closed');
  const mine=ITEMS.filter(i=>isMine(i.lead)&&i.status!=='Closed'&&i.impact!=='No')
    .sort((a,b)=>(a.impact==='Major'?0:1)-(b.impact==='Major'?0:1) || (a.resp||'9').localeCompare(b.resp||'9'));
  const maj=open.filter(i=>i.impact==='Major').length, min=open.filter(i=>i.impact==='Minor').length, od=ITEMS.filter(overdue).length;
  const myA=ACTIONS.filter(a=>isMine(a.owner)&&a.status!=='Complete');
  const first=me().split(' ')[0];
  el.innerHTML=`<div class="hero"><img class="bg" src="hero.jpg" alt=""><img class="lg2" src="logo.png" alt="a2 Milk Company">
  <div class="gr"><h1>Hi${first?' '+esc(first):''}</h1><p>${mine.length?`${mine.length} update${mine.length>1?'s need':' needs'} you`:'Nothing waiting on you'}</p></div></div>
  ${ITEMS.length?'':`<div class="card empty"><div class="t">No updates yet</div><p class="m">Add your first update, import a CSV, or load sample data from Settings.</p><div class="btns"><button class="btn p" data-go2="add">Add update</button><button class="btn" id="oset">Open settings</button></div></div>`}
  <div class="row"><button class="tile major" data-f="Major"><div class="k">Major, open</div><div class="v">${maj}</div></button>
  <button class="tile minor" data-f="Minor"><div class="k">Minor, to review</div><div class="v">${min}</div></button>
  <button class="tile" data-f="overdue"><div class="k">Past respond-by date</div><div class="v" style="color:${od?'var(--major)':'inherit'}">${od}</div></button></div>
  <h2>Needs you</h2><div class="list">${mine.map(i=>`<div class="card item">${pill(i.impact)}<div><div class="t">${esc(i.title)}</div><div class="m">${esc(i.cat)} &middot; ${esc(i.country)}</div></div>
  <div>${i.resp?`<span class="due">${overdue(i)?'Overdue ':'Respond by '}${fmt(i.resp)}</span>`:''}</div>
  <div class="btns">${i.impact==='Major'?`<button class="btn p" data-act="${i.id}">Add action</button>`:`<button class="btn p" data-rev="${i.id}">Mark reviewed</button>`}<button class="btn" data-open="${i.id}">Open</button></div></div>`).join('')||`<div class="card m">${me()?'Nothing waiting on you.':'Set your name in Settings to see updates assigned to you.'}</div>`}</div>
  <h2>My open actions</h2><div class="tw"><table><thead><tr><th>Action</th><th>Related update</th><th>Due</th><th>Status</th></tr></thead><tbody>${myA.map(a=>`<tr class="clk" data-aopen="${a.id}"><td>${esc(a.desc)}</td><td class="m">${esc(ITEMS.find(i=>i.id===a.upd)?.title||'')}</td><td class="d">${fmt(a.close)}</td><td>${pill(a.status)}</td></tr>`).join('')||'<tr><td colspan="4" class="m">No open actions.</td></tr>'}</tbody></table></div>`;
  el.querySelectorAll('[data-f]').forEach(b=>b.onclick=()=>{hf={...EMPTY_HF};
    if(b.dataset.f==='overdue'){hf.overdue=true;} else {hf.impact=b.dataset.f;hf.status='open';} setScreen('history');});
  el.querySelectorAll('[data-open]').forEach(b=>b.onclick=()=>{screen='history';openId=+b.dataset.open;render();});
  el.querySelectorAll('[data-act]').forEach(b=>b.onclick=()=>{actPre=+b.dataset.act;setScreen('actions');});
  el.querySelectorAll('[data-aopen]').forEach(b=>b.onclick=()=>setScreen('actions'));
  el.querySelectorAll('[data-rev]').forEach(b=>b.onclick=()=>{const i=ITEMS.find(x=>x.id==b.dataset.rev);i.status='Closed';persist();toast('Marked reviewed and closed.');render();});
  el.querySelectorAll('[data-go2]').forEach(b=>b.onclick=()=>{step=1;draft={};done=null;editId=null;setScreen(b.dataset.go2);});
  const os=$('#oset'); if(os) os.onclick=()=>$('#settings').showModal();
}

/* ---------- History ---------- */
const EMPTY_HF={q:'',country:'',market:'',cat:'',impact:'',type:'',status:'',year:'',overdue:false};
let hf={...EMPTY_HF};
function history(el){
  const opts=(arr,v,l)=>`<option value="">${l}: all</option>`+arr.map(x=>`<option${x===v?' selected':''}>${esc(x)}</option>`).join('');
  const years=[...new Set(ITEMS.map(i=>i.rel.slice(0,4)))].sort().reverse();
  el.innerHTML=`<h1>History</h1><p class="sub">Every regulation and news item, with filters. <span id="cnt"></span></p>
  <div class="bar"><input id="q" type="search" placeholder="Search title or summary" value="${esc(hf.q)}" aria-label="Search">
  <select id="fc" aria-label="Country">${opts(COUNTRIES,hf.country,'Country')}</select>
  <select id="fm" aria-label="Market">${opts(MARKETS,hf.market,'Market')}</select>
  <select id="fk" aria-label="Category">${opts(CATS,hf.cat,'Category')}</select>
  <select id="fi" aria-label="Impact">${opts(['Major','Minor','No'],hf.impact,'Impact')}</select>
  <select id="ft" aria-label="Type">${opts(['Regulation','News'],hf.type,'Type')}</select>
  <select id="fs" aria-label="Status"><option value="">Status: all</option>${['open',...STATUSES].map(x=>`<option value="${x}"${x===hf.status?' selected':''}>${x==='open'?'Not closed':x}</option>`).join('')}</select>
  <select id="fy" aria-label="Year">${opts(years,hf.year,'Year')}</select>
  <button class="btn" id="clr">Clear</button></div>
  ${hf.overdue?'<p class="m">Showing items past their respond-by date.</p>':''}
  <div class="tw"><table><thead><tr><th>Impact</th><th>Title</th><th>Market</th><th>Category</th><th>Released</th><th>Status</th></tr></thead><tbody id="tb"></tbody></table></div><div id="dt"></div>`;
  const draw=()=>{
    const q=hf.q.toLowerCase();
    const rows=ITEMS.filter(i=>(!q||(i.title+' '+i.sum).toLowerCase().includes(q))&&(!hf.country||i.country===hf.country)&&(!hf.market||i.market===hf.market)&&(!hf.cat||i.cat===hf.cat)&&(!hf.impact||i.impact===hf.impact)&&(!hf.type||i.type===hf.type)&&(!hf.status||(hf.status==='open'?i.status!=='Closed':i.status===hf.status))&&(!hf.year||i.rel.startsWith(hf.year))&&(!hf.overdue||overdue(i))).sort((a,b)=>b.rel.localeCompare(a.rel));
    $('#cnt').textContent=rows.length+' of '+ITEMS.length+' items shown';
    $('#tb').innerHTML=rows.map(i=>`<tr class="clk" data-id="${i.id}"><td>${pill(i.impact)}</td><td class="t">${esc(i.title)}</td><td>${esc(i.market)}</td><td class="m">${esc(i.cat)}</td><td class="d">${fmt(i.rel)}</td><td>${pill(i.status)}</td></tr>`).join('')||`<tr><td colspan="6" class="m">${ITEMS.length?'No items match these filters.':'No updates yet. Use Add update.'}</td></tr>`;
    $('#tb').querySelectorAll('tr[data-id]').forEach(r=>r.onclick=()=>{openId=+r.dataset.id;detail();});
  };
  const bind=(id,k)=>$(id).onchange=e=>{hf[k]=e.target.value;draw();};
  $('#q').oninput=e=>{hf.q=e.target.value;draw();};
  bind('#fc','country');bind('#fm','market');bind('#fk','cat');bind('#fi','impact');bind('#ft','type');bind('#fs','status');bind('#fy','year');
  $('#clr').onclick=()=>{hf={...EMPTY_HF};render();};
  const detail=()=>{
    const i=ITEMS.find(x=>x.id===openId); if(!i){$('#dt').innerHTML='';return;}
    const acts=ACTIONS.filter(a=>a.upd===i.id);
    $('#dt').innerHTML=`<div class="card detail"><div style="display:flex;justify-content:space-between;gap:10px;align-items:start"><div><div>${pill(i.impact)} ${pill(i.status)}</div><h1 style="font-size:19px;margin-top:8px">${esc(i.title)}</h1></div><button class="btn" id="cl">Close panel</button></div>
    <dl><dt>Summary</dt><dd>${esc(i.sum)||'<span class="m">None</span>'}</dd><dt>Category</dt><dd>${esc(i.cat)}</dd><dt>Country and market</dt><dd>${esc(i.country)} &middot; ${esc(i.market)}</dd><dt>Type</dt><dd>${esc(i.type)}</dd><dt>Released</dt><dd>${fmt(i.rel)}</dd><dt>Respond by</dt><dd>${i.resp?fmt(i.resp):'Not set'}</dd><dt>Lead team</dt><dd>${esc(i.lead)}</dd><dt>Notified</dt><dd>${esc((ROUTE[i.cat]||[]).join(', '))}</dd>${i.link?`<dt>Link</dt><dd><a href="${esc(i.link)}" target="_blank" rel="noopener noreferrer">${esc(i.link)}</a></dd>`:''}</dl>
    <div class="btns" style="margin:12px 0 0;grid-column:auto"><select id="st" aria-label="Status">${STATUSES.map(s=>`<option${s===i.status?' selected':''}>${s}</option>`).join('')}</select><button class="btn" id="ed">Edit</button><button class="btn" id="aa">Add action</button><button class="btn d" id="dl">Delete</button></div>
    <h2>Actions</h2>${acts.map(a=>`<div class="item" style="grid-template-columns:minmax(0,1fr) auto auto;margin:6px 0"><span>${esc(a.desc)}</span><span class="m">${esc(a.owner)}</span>${pill(a.status)}</div>`).join('')||'<p class="m">No actions yet.</p>'}</div>`;
    $('#cl').onclick=()=>{openId=null;detail();};
    $('#st').onchange=e=>{i.status=e.target.value;persist();render();};
    $('#ed').onclick=()=>{editId=i.id;draft={...i,meet:i.meet||'No'};step=1;done=null;setScreen('add');};
    $('#aa').onclick=()=>{actPre=i.id;setScreen('actions');};
    $('#dl').onclick=()=>{if(!confirm('Delete this update and its actions?'))return;
      ITEMS.splice(ITEMS.indexOf(i),1);for(let k=ACTIONS.length-1;k>=0;k--)if(ACTIONS[k].upd===i.id)ACTIONS.splice(k,1);
      persist();openId=null;render();};
    $('#dt').scrollIntoView({behavior:'smooth',block:'nearest'});
  };
  draw(); if(openId) detail();
}

/* ---------- Insights ---------- */
let win=12;
function monthKey(d){return d.slice(0,7);}
function insights(el){
  const now=new Date(), months=[];
  for(let k=win-1;k>=0;k--){const d=new Date(now.getFullYear(),now.getMonth()-k,1);months.push({key:iso(d).slice(0,7),label:d.toLocaleString('en-NZ',{month:'short'})});}
  const from=months[0].key;
  const inWin=ITEMS.filter(i=>monthKey(i.rel)>=from);
  const mj=months.map(m=>inWin.filter(i=>i.impact==='Major'&&monthKey(i.rel)===m.key).length);
  const mn=months.map(m=>inWin.filter(i=>i.impact==='Minor'&&monthKey(i.rel)===m.key).length);
  const catCounts=CATS.map(c=>[c,inWin.filter(i=>i.cat===c).length]).filter(c=>c[1]).sort((a,b)=>b[1]-a[1]);
  const catMax=Math.max(1,...catCounts.map(c=>c[1]));
  el.innerHTML=`<h1>Insights</h1><p class="sub">Charts and map for the period selected.</p>
  <div class="bar"><select id="w" aria-label="Period"><option value="3">Last 3 months</option><option value="6">Last 6 months</option><option value="12">Last 12 months</option></select></div>
  <div class="row"><div class="tile major"><div class="k">Major updates</div><div class="v">${inWin.filter(i=>i.impact==='Major').length}</div></div><div class="tile minor"><div class="k">Minor updates</div><div class="v">${inWin.filter(i=>i.impact==='Minor').length}</div></div><div class="tile"><div class="k">Open now</div><div class="v">${ITEMS.filter(i=>i.status!=='Closed').length}</div></div><div class="tile"><div class="k">Past respond-by</div><div class="v">${ITEMS.filter(overdue).length}</div></div></div>
  <h2>Global map</h2><div class="card chart"><div id="map"></div><div class="lg" id="lg"></div><div class="ro" id="ro"><div class="m">Tap a market</div><div>Select a shaded country to see its count.</div></div></div>
  <div class="grid2"><div><h2>Updates per month</h2><div class="card chart" id="ln"></div></div><div><h2>By category</h2><div class="card">${catCounts.map(c=>`<div class="hb"><span>${esc(c[0])}</span><div class="tr"><div class="fi" style="width:${c[1]/catMax*100}%"></div></div><b>${c[1]}</b></div>`).join('')||'<p class="m">No updates in this period.</p>'}</div></div></div>`;
  $('#w').value=String(win); $('#w').onchange=e=>{win=+e.target.value;render();};
  line(months.map(m=>m.label),mj,mn); drawMap(inWin);
}
function line(lb,mj,mn){
  const W=520,H=230,L=30,R=12,T=14,B=26,max=Math.max(4,Math.ceil(Math.max(...mj,...mn)/4)*4),n=lb.length;
  const x=i=>L+(n===1?0:i*(W-L-R)/(n-1)), y=v=>T+(1-v/max)*(H-T-B);
  const pts=a=>a.map((v,i)=>`${x(i).toFixed(1)},${y(v).toFixed(1)}`).join(' ');
  let g='';for(let t=0;t<=max;t+=max/4){g+=`<line x1="${L}" x2="${W-R}" y1="${y(t)}" y2="${y(t)}" stroke="var(--line)"/><text x="${L-6}" y="${y(t)+4}" text-anchor="end">${t}</text>`;}
  const xl=lb.map((m,i)=>`<text x="${x(i)}" y="${H-8}" text-anchor="middle">${m}</text>`).join('');
  $('#ln').innerHTML=`<div class="lg"><span><i style="background:var(--major)"></i>Major</span><span><i style="background:var(--minor)"></i>Minor (dashed)</span></div><svg viewBox="0 0 ${W} ${H}" role="img" aria-label="Line chart of Major and Minor updates per month">${g}${xl}
  <polyline points="${pts(mn)}" fill="none" stroke="var(--minor)" stroke-width="2" stroke-dasharray="5 4" stroke-linejoin="round"/><polyline points="${pts(mj)}" fill="none" stroke="var(--major)" stroke-width="2" stroke-linejoin="round"/>
  <circle cx="${x(n-1)}" cy="${y(mj[n-1])}" r="4.5" fill="var(--major)" stroke="var(--surface)" stroke-width="2"/><circle cx="${x(n-1)}" cy="${y(mn[n-1])}" r="4.5" fill="var(--minor)" stroke="var(--surface)" stroke-width="2"/></svg>`;
}
let TOPO=null;
async function drawMap(items){
  const box=$('#map'); if(!box) return;
  if(!window.d3||!window.topojson){box.innerHTML='<p class="m">Map libraries could not load.</p>';return;}
  if(!TOPO){try{TOPO=await (await fetch('world.json')).json();}catch(e){box.innerHTML='<p class="m">Map data could not load.</p>';return;}}
  if($('#map')!==box) return;
  const W=900,H=460, bins=[[1,1,.25],[2,4,.4],[5,9,.6],[10,24,.8],[25,1e9,1]], labs=['1','2 to 4','5 to 9','10 to 24','25 or more'];
  const byMarket={}; items.forEach(i=>{byMarket[i.market]=(byMarket[i.market]||0)+1;});
  const cnt={}, owner={};
  Object.entries(MARKET_MAP).forEach(([k,names])=>{ if(byMarket[k]) names.forEach(n=>{cnt[n]=byMarket[k];owner[n]=k;}); });
  const op=v=>{for(const b of bins) if(v>=b[0]&&v<=b[1]) return b[2];return 0;};
  const feats=topojson.feature(TOPO,TOPO.objects.countries).features.filter(f=>f.properties.name!=='Antarctica');
  const proj=d3.geoNaturalEarth1().scale(165).translate([W/2,H/2+8]), path=d3.geoPath(proj);
  const svg=d3.select('#map').append('svg').attr('viewBox',`0 0 ${W} ${H}`).attr('role','img').attr('aria-label','World map shaded by number of regulation updates per market').style('width','100%').style('height','auto').style('display','block');
  const show=(name,v,note)=>{$('#ro').innerHTML=`<div class="m">${note}</div><div class="t">${name}</div><div class="m">${v.toLocaleString()} update${v===1?'':'s'} in this period</div>`;};
  const isBloc=k=>MARKET_MAP[k].length>1;
  svg.append('g').selectAll('path').data(feats).join('path').attr('d',path)
    .attr('class',d=>cnt[d.properties.name]?'hit':'nd')
    .attr('fill',d=>cnt[d.properties.name]?'var(--accent)':null)
    .attr('fill-opacity',d=>cnt[d.properties.name]?op(cnt[d.properties.name]):null)
    .on('click',(e,d)=>{const n=d.properties.name,c=cnt[n]; if(c){const k=owner[n]; show(isBloc(k)?MARKET_LABEL[k]+' (bloc total)':MARKET_LABEL[k],c,isBloc(k)?'Bloc, same total for each member':'Market');}});
  [['SG',103.82,1.35],['HK',114.17,22.32]].forEach(p=>{ if(!byMarket[p[0]]) return; const [x,y]=proj([p[1],p[2]]);
    svg.append('circle').attr('cx',x).attr('cy',y).attr('r',7).attr('class','hit').attr('fill','var(--accent)').attr('fill-opacity',op(byMarket[p[0]])).attr('stroke','var(--accent)').attr('stroke-width',1.5).on('click',()=>show(MARKET_LABEL[p[0]],byMarket[p[0]],'Market'));});
  $('#lg').innerHTML=bins.map((b,i)=>`<span><i style="background:var(--accent);opacity:${b[2]}"></i>${labs[i]}</span>`).join('')+'<span><i style="background:var(--line)"></i>No items</span>'+(byMarket.Global?`<span>Global (not on map): ${byMarket.Global}</span>`:'');
}

/* ---------- Actions ---------- */
function actions(el){
  const openItems=ITEMS.filter(i=>i.status!=='Closed');
  const pre=actPre; actPre=null;
  el.innerHTML=`<h1>Actions</h1><p class="sub">Follow-up on each regulation update.</p>
  <div class="bar"><select id="ao" aria-label="Owner"><option value="">Owner: all</option>${[...new Set(ACTIONS.map(a=>a.owner))].map(o=>`<option>${esc(o)}</option>`).join('')}</select><select id="as" aria-label="Status"><option value="">Status: all</option>${ASTATUS.map(s=>`<option>${s}</option>`).join('')}</select></div>
  <div class="tw"><table><thead><tr><th>Action</th><th>Related update</th><th>Owner</th><th>Close date</th><th>Status</th><th></th></tr></thead><tbody id="ab"></tbody></table></div>
  <h2>Add an action</h2><div class="card f">${openItems.length?`<label>Related update<select id="nu">${openItems.map(i=>`<option value="${i.id}"${i.id===pre?' selected':''}>${esc(i.title)}</option>`).join('')}</select></label><label>What needs doing<textarea id="nd"></textarea></label><label>Owner<input id="no" value="${esc(me())}"></label><label>Close date<input id="nc" type="date"></label><div class="err" id="ne"></div><div class="btns" style="margin:0"><button class="btn p" id="na">Add action</button></div>`:'<p class="m" style="margin:0">Add an open update first, then attach actions to it.</p>'}</div>`;
  const draw=()=>{const o=$('#ao').value,s=$('#as').value;
    $('#ab').innerHTML=ACTIONS.filter(a=>(!o||a.owner===o)&&(!s||a.status===s)).sort((a,b)=>(a.close||'9').localeCompare(b.close||'9')).map(a=>`<tr><td>${esc(a.desc)}</td><td class="m">${esc(ITEMS.find(i=>i.id===a.upd)?.title||'')}</td><td>${esc(a.owner)}</td><td class="d">${fmt(a.close)}</td><td><select data-s="${a.id}" aria-label="Status">${ASTATUS.map(x=>`<option${x===a.status?' selected':''}>${x}</option>`).join('')}</select></td><td><button class="btn d" data-del="${a.id}" aria-label="Delete action">Delete</button></td></tr>`).join('')||'<tr><td colspan="6" class="m">No actions yet.</td></tr>';
    $('#ab').querySelectorAll('[data-s]').forEach(s=>s.onchange=e=>{ACTIONS.find(a=>a.id==s.dataset.s).status=e.target.value;persist();});
    $('#ab').querySelectorAll('[data-del]').forEach(b=>b.onclick=()=>{ACTIONS.splice(ACTIONS.findIndex(a=>a.id==b.dataset.del),1);persist();render();});};
  $('#ao').onchange=draw;$('#as').onchange=draw;draw();
  if($('#na')){
    if(pre) $('#nd').focus();
    $('#nd').oninput=()=>$('#ne').textContent='';
    $('#na').onclick=()=>{const d=$('#nd').value.trim(); if(!d){$('#ne').textContent='Describe the action first.';$('#nd').focus();return;}
      ACTIONS.push({id:Store.nextId(),upd:+$('#nu').value,desc:d,owner:$('#no').value.trim()||me(),status:'Not started',close:$('#nc').value});persist();render();};
  }
}

/* ---------- Add / edit update ---------- */
function alertText(i){
  return `${i.impact==='Major'?'MAJOR':'Minor'} regulatory update: ${i.title}\nCategory: ${i.cat}\nMarket: ${i.market}\nReleased: ${fmt(i.rel)}${i.resp?`\nRespond by: ${fmt(i.resp)}`:''}\n${i.sum?`\n${i.sum}\n`:''}${i.link?`\nLink: ${i.link}`:''}`;
}
function add(el){
  if(done){ const i=done, who=ROUTE[i.cat]||[];
    el.innerHTML=`<h1>${editId?'Update saved':'Update added'}</h1><p class="sub">${pill(i.impact)} ${esc(i.title)}</p><div class="card"><div class="t">Who to notify</div><p class="m" style="margin:4px 0 10px">${i.impact==='No'?'No alert is needed for Impact: No.':'This app does not send messages itself. Copy the alert or open an email draft, then send it to:'}</p>${i.impact==='No'?'':`<div class="list">${who.map(p=>`<div class="item" style="grid-template-columns:minmax(0,1fr)"><span>${esc(p)}</span></div>`).join('')}</div><div class="btns" style="grid-column:auto"><button class="btn" id="cp">Copy alert text</button><a class="btn" id="ml" href="mailto:?subject=${encodeURIComponent((i.impact==='Major'?'[Major] ':'')+i.title)}&body=${encodeURIComponent(alertText(i))}">Open email draft</a></div>`}</div>
    <div class="btns" style="grid-column:auto"><button class="btn p" id="again">Add another</button><button class="btn" id="hist">View in History</button></div>`;
    const cp=$('#cp'); if(cp) cp.onclick=async()=>{try{await navigator.clipboard.writeText(alertText(i));toast('Alert text copied.');}catch(e){toast('Copy failed.');}};
    $('#again').onclick=()=>{done=null;editId=null;step=1;draft={};render();};
    $('#hist').onclick=()=>{hf={...EMPTY_HF,q:i.title};openId=i.id;done=null;editId=null;setScreen('history');}; return; }
  const d=draft;
  el.innerHTML=`<h1>${editId?'Edit update':'Add an update'}</h1><p class="sub">Step ${step} of 3</p><div class="steps">${[1,2,3].map(n=>`<span class="${n<=step?'on':''}"></span>`).join('')}</div><div class="f" id="fm">`+
  (step===1?`<label>Title<input id="a-t" value="${esc(d.title)}" placeholder="What changed, in one line"></label>
   <label>Update category<select id="a-c"><option value="">Choose a category</option>${CATS.map(c=>`<option${d.cat===c?' selected':''}>${c}</option>`).join('')}</select></label>
   <div class="notify" id="nt">${d.cat?`<b>Alert goes to:</b> ${esc(ROUTE[d.cat].join(', '))}`:'Pick a category to see who gets notified.'}</div>
   <label>Market<select id="a-m">${MARKETS.map(m=>`<option${(d.market||'NZ')===m?' selected':''}>${m}</option>`).join('')}</select></label>
   <label>Country source<select id="a-k">${COUNTRIES.map(c=>`<option${(d.country||'')===c?' selected':''}>${c}</option>`).join('')}</select></label>
   <label>Regulation or news<select id="a-y"><option${d.type!=='News'?' selected':''}>Regulation</option><option${d.type==='News'?' selected':''}>News</option></select></label>`
  :step===2?`<div class="opts">${[['Major','Urgent alert and meeting scheduled'],['Minor','Alert sent for review and close out'],['No','Logged only, no alert']].map(o=>`<button type="button" class="opt" aria-pressed="${d.impact===o[0]}" data-i="${o[0]}"><b>${o[0]==='No'?'No impact':o[0]}</b><span>${o[1]}</span></button>`).join('')}</div>
   <label>Requires meeting<select id="a-r"><option${d.meet!=='Yes'?' selected':''}>No</option><option${d.meet==='Yes'?' selected':''}>Yes</option></select></label>`
  :`<label>Release date<input id="a-d" type="date" value="${esc(d.rel||todayISO())}"></label>
   ${d.impact==='Major'?`<label>Respond by<input id="a-b" type="date" value="${esc(d.resp||addDays(todayISO(),7))}"></label><div class="m">Set to 7 days from today for Major updates. You can change it.</div>`:''}
   <label>Lead<input id="a-e" value="${esc(d.lead||me())}"></label>
   <label>Link<input id="a-l" type="url" placeholder="https://" value="${esc(d.link)}"></label><label>Summary<textarea id="a-s">${esc(d.sum)}</textarea></label>`)+
  `<div class="err" id="er"></div><div class="btns" style="margin:0">${step>1?'<button class="btn" id="bk">Back</button>':''}<button class="btn p" id="nx">${step===3?(editId?'Save changes':'Submit update'):'Next'}</button></div></div>`;
  const get=i=>($(i)||{}).value;
  const save=()=>{ if(step===1){d.title=get('#a-t');d.cat=get('#a-c');d.market=get('#a-m');d.country=get('#a-k');d.type=get('#a-y');} if(step===2){d.meet=get('#a-r');} if(step===3){d.rel=get('#a-d');d.resp=get('#a-b')||d.resp;d.lead=get('#a-e');d.link=get('#a-l');d.sum=get('#a-s');} };
  if(step===1){
    if(!d.country) $('#a-k').value=countryFor($('#a-m').value);
    $('#a-m').onchange=e=>{ $('#a-k').value=countryFor(e.target.value); };
    $('#a-c').onchange=e=>{d.cat=e.target.value;$('#nt').innerHTML=d.cat?`<b>Alert goes to:</b> ${esc(ROUTE[d.cat].join(', '))}`:'Pick a category to see who gets notified.';};
  }
  if(step===2) el.querySelectorAll('[data-i]').forEach(b=>b.onclick=()=>{d.impact=b.dataset.i;d.meet=get('#a-r');$('#er').textContent='';el.querySelectorAll('[data-i]').forEach(x=>x.setAttribute('aria-pressed',x===b));});
  if($('#bk')) $('#bk').onclick=()=>{save();step--;render();};
  $('#nx').onclick=()=>{ save(); const er=$('#er');
    if(step===1){ if(!d.title.trim()){er.textContent='Enter a title.';return;} if(!d.cat){er.textContent='Choose a category.';return;} }
    if(step===2 && !d.impact){er.textContent='Choose an impact level.';return;}
    if(step===3){ if(!d.rel){er.textContent='Enter a release date.';return;} if(d.link&&!/^https?:\/\//i.test(d.link)){er.textContent='Link must start with http:// or https://';return;} }
    if(step<3){step++;render();return;}
    const fields={title:d.title.trim(),cat:d.cat,country:d.country||countryFor(d.market),market:d.market||'NZ',type:d.type||'Regulation',impact:d.impact,meet:d.meet||'No',rel:d.rel,resp:d.impact==='Major'?(d.resp||addDays(todayISO(),7)):'',lead:(d.lead||'').trim()||me(),link:d.link||'',sum:d.sum||''};
    let it;
    if(editId){ it=ITEMS.find(x=>x.id===editId); Object.assign(it,fields); }
    else { it={id:Store.nextId(),status:'Open',...fields}; ITEMS.unshift(it); }
    persist(); done=it;draft={};step=1;render(); };
}

/* ---------- Settings, import / export ---------- */
const CSV_COLS=['title','cat','country','market','type','impact','status','rel','resp','lead','link','sum'];
const csvCell=v=>{v=String(v??'');return /[",\n\r]/.test(v)?'"'+v.replace(/"/g,'""')+'"':v;};
function parseCSV(t){
  const rows=[];let r=[],c='',q=false;
  for(let k=0;k<t.length;k++){const ch=t[k];
    if(q){ if(ch==='"'){ if(t[k+1]==='"'){c+='"';k++;} else q=false; } else c+=ch; }
    else if(ch==='"') q=true;
    else if(ch===','){r.push(c);c='';}
    else if(ch==='\n'||ch==='\r'){ if(ch==='\r'&&t[k+1]==='\n')k++; r.push(c);c=''; if(r.some(x=>x!==''))rows.push(r); r=[]; }
    else c+=ch; }
  r.push(c); if(r.some(x=>x!==''))rows.push(r); return rows;
}
const normDate=s=>{s=String(s||'').trim(); if(/^\d{4}-\d{2}-\d{2}/.test(s)) return s.slice(0,10); const d=new Date(s); return isNaN(d)?'':iso(d);};
const pick=(v,list,def)=>list.find(x=>x.toLowerCase()===String(v||'').trim().toLowerCase())||def;
function importCSV(text){
  const rows=parseCSV(text); if(rows.length<2) return toast('CSV has no data rows.');
  const head=rows[0].map(h=>h.trim().toLowerCase());
  const alias={category:'cat','update category':'cat','release date':'rel','released':'rel','respond by':'resp','lead team':'lead','summary':'sum','regulation/news':'type'};
  const idx={}; head.forEach((h,k)=>{idx[alias[h]||h]=k;});
  if(idx.title===undefined) return toast('CSV needs a "title" column.');
  let n=0,skipped=0;
  rows.slice(1).forEach(r=>{
    const g=k=>idx[k]===undefined?'':(r[idx[k]]||'').trim();
    const rel=normDate(g('rel')); if(!g('title')||!rel){skipped++;return;}
    const market=pick(g('market'),MARKETS,'Global');
    ITEMS.push({id:Store.nextId(),title:g('title'),cat:pick(g('cat'),CATS,'Regulatory framework'),country:pick(g('country'),COUNTRIES,countryFor(market)),market,type:pick(g('type'),['Regulation','News'],'Regulation'),impact:pick(g('impact'),['Major','Minor','No'],'Minor'),status:pick(g('status'),STATUSES,'Open'),rel,resp:normDate(g('resp')),lead:g('lead')||me(),link:g('link'),sum:g('sum')});
    n++; });
  persist(); render(); toast(`Imported ${n} update${n===1?'':'s'}${skipped?`, skipped ${skipped}`:''}.`);
}
function importJSON(text){
  try{ const j=JSON.parse(text); if(!Array.isArray(j.items)||!Array.isArray(j.actions)) throw 0;
    if(!confirm('Replace all current data with this backup?')) return;
    ITEMS.length=0;ACTIONS.length=0;ITEMS.push(...j.items);ACTIONS.push(...j.actions);
    Store.data.seq=Math.max(j.seq||1,...ITEMS.map(i=>i.id+1),...ACTIONS.map(a=>a.id+1),1);
    if(j.settings&&j.settings.name&&!me()) Store.data.settings.name=j.settings.name;
    persist(); render(); toast('Backup restored.');
  }catch(e){ toast('That file is not a valid backup.'); }
}
function pickFile(accept,cb){ const f=$('#file'); f.accept=accept; f.value=''; f.onchange=()=>{const file=f.files[0]; if(!file)return; const rd=new FileReader(); rd.onload=()=>cb(String(rd.result)); rd.readAsText(file);}; f.click(); }
const SAMPLE=()=>{const t=todayISO(), d=n=>addDays(t,n), n=me()||'Me';
  return {items:[
 {title:'Infant formula labelling amendment',cat:'Labelling',country:'NZ',market:'NZ',type:'Regulation',impact:'Major',status:'Open',rel:d(-4),resp:d(8),lead:n,sum:'Amendment to nutrition and ingredient labelling requirements for infant formula.'},
 {title:'Packaging migration limits update',cat:'Packaging materials',country:'AU',market:'AU',type:'Regulation',impact:'Minor',status:'In progress',rel:d(-18),resp:'',lead:n,sum:'Revised specific migration limits for food contact plastics.'},
 {title:'SFDA workshop on updated food regulations',cat:'Safety parameter',country:'EM Others',market:'GCC',type:'News',impact:'Major',status:'Open',rel:d(-22),resp:d(-3),lead:n,sum:'Workshop introducing updates to regulations enforced by the authority.'},
 {title:'Korea revises imported milk powder standards',cat:'Regulatory framework',country:'EM Others',market:'SK',type:'Regulation',impact:'Major',status:'In progress',rel:d(-60),resp:d(14),lead:'Doris Shen',sum:'Revision to import standards for milk powder.'},
 {title:'EU contaminants limits amendment',cat:'Safety parameter',country:'EM Others',market:'EU',type:'Regulation',impact:'Minor',status:'Closed',rel:d(-90),resp:'',lead:'Doris Shen',sum:'Maximum levels for selected contaminants.'},
 {title:'Singapore processing aid list update',cat:'Processing aid',country:'EM Others',market:'SG',type:'Regulation',impact:'No',status:'Closed',rel:d(-140),resp:'',lead:'Kang Yang',sum:'Additions to permitted processing aids.'}],
  actions:[{upd:0,desc:'Confirm label wording with Legal',owner:n,status:'Ongoing',close:d(6)},{upd:0,desc:'Update supplier specification sheet',owner:n,status:'Not started',close:d(12)},{upd:3,desc:'Review Korea import standard against current COA',owner:'Doris Shen',status:'Ongoing',close:d(14)}]};};
function loadSample(){
  const s=SAMPLE(), ids=s.items.map(i=>{const it={id:Store.nextId(),...i};ITEMS.push(it);return it.id;});
  s.actions.forEach(a=>ACTIONS.push({id:Store.nextId(),...a,upd:ids[a.upd]}));
  persist();render();toast('Sample data added.');
}
const dlg=$('#settings');
$('#settingsBtn').onclick=()=>{$('#s-name').value=me();dlg.showModal();};
dlg.addEventListener('close',()=>{Store.data.settings.name=$('#s-name').value.trim();persist();render();});
$('#exJson').onclick=()=>download('a2mc-tracker-backup-'+todayISO()+'.json',JSON.stringify(Store.data,null,2),'application/json');
$('#exCsv').onclick=()=>download('a2mc-updates-'+todayISO()+'.csv',[CSV_COLS.join(',')].concat(ITEMS.map(i=>CSV_COLS.map(c=>csvCell(i[c])).join(','))).join('\r\n'),'text/csv');
$('#imJson').onclick=()=>pickFile('.json,application/json',importJSON);
$('#imCsv').onclick=()=>pickFile('.csv,text/csv',importCSV);
$('#sample').onclick=loadSample;
$('#wipe').onclick=()=>{ if(!confirm('Delete all updates and actions from this browser? Export a backup first if unsure.')) return; ITEMS.length=0;ACTIONS.length=0;persist();render();toast('All data deleted.'); };

if(!me()){ setTimeout(()=>{ $('#s-name').value=''; dlg.showModal(); $('#s-name').focus(); },50); }
render();
