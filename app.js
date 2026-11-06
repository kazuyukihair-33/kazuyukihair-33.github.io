const SUPABASE_URL = 'https://kyuwvprkdlvtgcwtxknp.supabase.co';
const SUPABASE_PUBLISHABLE_KEY = 'sb_publishable_eqk6W5j22zTfcpmLXq-1vg_hvrTAO9d';

'use strict';
const TEAM = [{"dept": "社長室", "name": "レオ", "item": "<path d=\"M48 22L43 5 58 13 70 1 82 13 97 5 92 22Z\" fill=\"#dfb95e\" stroke=\"#b89547\" stroke-width=\"2\"/><circle cx=\"70\" cy=\"15\" r=\"3\" fill=\"#fff3cc\"/>"}, {"dept": "秘書", "name": "サク", "item": "<g transform=\"rotate(-9 24 80)\"><rect x=\"8\" y=\"63\" width=\"29\" height=\"35\" rx=\"4\" fill=\"#d1aaa0\" stroke=\"#a67f75\" stroke-width=\"1.5\"/><path d=\"M15 64v33M20 72h12M20 78h12M20 84h8\" stroke=\"#fff3dc\" stroke-width=\"1.5\"/><path d=\"M10 69h7M10 77h7M10 85h7M10 93h7\" stroke=\"#8a7566\" stroke-width=\"2\"/></g><g transform=\"rotate(20 117 78)\"><path d=\"M115 61h5v29l-2.5 6-2.5-6Z\" fill=\"#87967b\" stroke=\"#65765f\" stroke-width=\"1.5\"/><path d=\"M115 66h5M115 88h5\" stroke=\"#f9e9be\" stroke-width=\"2\"/></g>"}, {"dept": "Instagram", "name": "ミラ", "item": "<g transform=\"rotate(-12 29 80)\"><rect x=\"16\" y=\"67\" width=\"17\" height=\"26\" rx=\"3\" fill=\"#d3a6a0\" stroke=\"#a97e79\"/><rect x=\"19\" y=\"70\" width=\"11\" height=\"17\" rx=\"1\" fill=\"#fff3e4\"/></g><path d=\"M112 28C101 18 98 34 112 41C127 31 122 20 112 28Z\" fill=\"#dba5a0\"/>"}, {"dept": "Hot Pepper", "name": "ベル", "item": "<g transform=\"rotate(-10 25 82)\"><rect x=\"10\" y=\"67\" width=\"26\" height=\"30\" rx=\"3\" fill=\"#b4bc9b\" stroke=\"#889371\"/><path d=\"M15 74h17M16 81h14M16 87h10\" stroke=\"#fff7de\" stroke-width=\"2\"/><path d=\"M16 64v6M28 64v6\" stroke=\"#807b61\" stroke-width=\"2\"/></g>"}, {"dept": "経理", "name": "エン", "item": "<rect x=\"105\" y=\"76\" width=\"23\" height=\"29\" rx=\"3\" fill=\"#b3b6a5\" stroke=\"#858d79\"/><path d=\"M110 82h13M110 89h3m5 0h4m-12 6h3m5 0h4\" stroke=\"#fdf8e6\" stroke-width=\"3\"/><circle cx=\"22\" cy=\"89\" r=\"10\" fill=\"#e2bf69\" stroke=\"#b89a4f\"/><text x=\"22\" y=\"93\" text-anchor=\"middle\" font-size=\"12\" fill=\"#947833\">¥</text>"}, {"dept": "マインド", "name": "ヒラ", "item": "<g stroke=\"#bfa250\" stroke-width=\"2\"><path d=\"M104 25a11 11 0 1 1 17 0l-3 6h-11Z\" fill=\"#f7df88\"/><path d=\"M107 35h11M108 39h9M112 4V0M97 12l-5-3M128 12l5-3\" fill=\"none\"/></g>"}, {"dept": "EC企画", "name": "ポチ", "item": "<path d=\"M104 74h25l3 29h-31Z\" fill=\"#d6ad88\" stroke=\"#b58e67\" stroke-width=\"1.5\"/><path d=\"M110 77v-5a7 7 0 0 1 14 0v5\" fill=\"none\" stroke=\"#a17c57\" stroke-width=\"2\"/><path d=\"M111 88l5 5 8-10\" fill=\"none\" stroke=\"#fff5dc\" stroke-width=\"2\"/>"}, {"dept": "動画編集", "name": "カット", "item": "<g transform=\"rotate(-10 25 79)\"><rect x=\"7\" y=\"72\" width=\"33\" height=\"25\" rx=\"3\" fill=\"#697367\" stroke=\"#4e5a4c\" stroke-width=\"1.5\"/><path d=\"M8 72L5 62 36 53 39 63Z\" fill=\"#fff6df\" stroke=\"#4e5a4c\" stroke-width=\"1.5\"/><path d=\"M11 60l7 7m3-10 7 7m3-10 6 6\" stroke=\"#697367\" stroke-width=\"4\"/><path d=\"M13 80h21M13 86h14\" stroke=\"#fff6df\" stroke-width=\"1.5\"/></g>"}];
const STATUS = {open:'未対応',doing:'対応中',review:'確認待ち',done:'完了'};
const STORES = {tenjin:'天神',hakata:'博多',common:'共通'};
const $ = id => document.getElementById(id);
let db, userId = null, epoch = 0, loaded = false, refreshing = false, view = 'floor';
let records = {instructions:[],ideas:[],summaries:[]};
let motionFrame = 0, outing = null, nextWalk = 0, walkerIndex = 0;
let replyTimers = [], replying = false;
const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
const dateFormat = new Intl.DateTimeFormat('ja-JP',{month:'numeric',day:'numeric',hour:'2-digit',minute:'2-digit'});
function element(tag, className, text) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text !== undefined) node.textContent = text;
  return node;
}
function notify(text, error = false) {
  $('message').textContent = text; $('message').hidden = !text;
  $('message').style.background = error ? '#f4e4d9' : '#e7eddf';
}
function departmentState(dept) {
  const rows = records.instructions.filter(row => row.department === dept);
  const status = ['open','doing','review'].find(s => rows.some(row => row.status === s));
  const row = status ? rows.find(row => row.status === status) : null;
  return {status: status || 'idle', label: status === 'open' ? '未対応の指示あり' : status ? STATUS[status] : '待機中', body: row?.body || ''};
}
// Replies use only the current, successfully loaded records. No network requests.
function replyText(dept) {
  if (dept === '社長室') return '全員動いてる？';
  const rows = records.instructions.filter(row => dept === '秘書' || row.department === dept);
  const counts = Object.fromEntries(['open','doing','review'].map(status =>
    [status, rows.filter(row => row.status === status).length]));
  const countsText = ['open','doing','review'].map(status => `${STATUS[status]}${counts[status]}件`).join('、');
  let text;
  if (dept === '秘書') {
    const departments = [...new Set(rows.filter(row => row.status === 'review').map(row => row.department))];
    text = `全体では${countsText}です。`;
    if (departments.length) text += `確認待ちの部署：${departments.join('、')}。`;
  } else {
    const active = rows.filter(row => ['open','doing','review'].includes(row.status));
    // Select the latest review first, otherwise the latest unfinished instruction.
    const latest = list => list.reduce((a,b) => !a || String(b.created_at || '') > String(a.created_at || '') ? b : a, null);
    const row = latest(active.filter(row => row.status === 'review')) || latest(active);
    if (!row) text = '待機中です。今は抱えている指示はありません。';
    else {
      text = counts.review ? `確認待ちが${counts.review}件あります。${countsText}です。`
        : `${counts.doing ? '対応中の指示があります' : '未対応の指示があります'}。${countsText}です。`;
      const body = String(row.body || '').replace(/\s+/g,' ').trim();
      if (body) text += `「${body.slice(0,32)}${body.length > 32 ? '…' : ''}」です。`;
    }
  }
  const ideas = records.ideas.filter(row => row.department === dept).length;
  if (ideas) text += `アイデアが${ideas}件たまっています。`;
  return text;
}
function clearReplies() {
  replyTimers.forEach(clearTimeout); replyTimers = []; replying = false;
  [...$('stations').children].forEach((station,index) => {
    const bubble = station.querySelector('.bubble');
    if (!bubble) return;
    const state = departmentState(TEAM[index].dept);
    bubble.textContent = state.body.slice(0,28); bubble.hidden = !state.body;
    station.classList.remove('replying');
  });
}
function askMembers(dept = null) {
  if (!loaded || refreshing || !userId || view !== 'floor') return;
  clearReplies(); stopMotion(); replying = true;
  const members = dept ? TEAM.filter(member => member.dept === dept) : TEAM;
  members.forEach((member,index) => {
    const speak = () => {
      const station = $('stations').children[TEAM.indexOf(member)];
      const bubble = station.querySelector('.bubble');
      bubble.textContent = replyText(member.dept); bubble.hidden = false;
      station.classList.add('replying');
    };
    if (index === 0) speak();
    else replyTimers.push(setTimeout(speak,index * 900));
  });
  replyTimers.push(setTimeout(() => { clearReplies(); startMotion(); }, (members.length - 1) * 900 + 12000));
}
function showView(next, focus = false) {
  if (!['floor','instructions','ideas'].includes(next)) next = 'floor';
  clearReplies();
  view = next;
  for (const name of ['floor','instructions','ideas']) $(name+'-view').hidden = name !== next;
  document.querySelectorAll('nav [data-view]').forEach(button => {
    if (button.dataset.view === next) button.setAttribute('aria-current','page');
    else button.removeAttribute('aria-current');
  });
  stopMotion();
  if (loaded && next === 'floor') startMotion();
  if (focus) { const title = $(next+'-view').querySelector('h2'); title.tabIndex = -1; title.focus(); }
}
function openDepartment(dept) {
  $('filter-department').value = dept; $('filter-status').value = '';
  $('instruction-form').elements.department.value = dept;
  renderInstructions(); showView('instructions',true);
}
function renderFloor() {
  clearReplies(); stopMotion(); $('stats').replaceChildren(); $('stations').replaceChildren();
  for (const [status,label] of Object.entries(STATUS)) {
    const item = element('div','stat');
    item.append(element('span','',label),element('strong','',String(records.instructions.filter(r=>r.status===status).length)));
    $('stats').append(item);
  }
  TEAM.forEach((member,index) => {
    const state = departmentState(member.dept);
    const button = element('button','station'); button.type = 'button'; button.dataset.index = index;
    button.setAttribute('aria-label',`${member.dept}、${member.name}、${state.label}。返事を聞く`);
    // Only fixed, trusted SVG artwork from the v6 prototype is inserted as markup.
    button.innerHTML = `<svg class="character" viewBox="0 0 140 125" aria-hidden="true"><use href="#fluffy"/>${member.item}</svg>`;
    const bubble = element('span','bubble',state.body.slice(0,28)); bubble.hidden = !state.body;
    bubble.setAttribute('role','status'); bubble.setAttribute('aria-live','polite'); bubble.setAttribute('aria-atomic','true');
    const label = element('span','state',state.label); label.dataset.status = state.status;
    button.append(bubble,element('span','plaque',member.dept),element('span','person',member.name),label);
    button.addEventListener('click',()=>askMembers(member.dept)); $('stations').append(button);
  });
  $('member-list').replaceChildren();
  TEAM.forEach(member => {
    const button = element('button','',`${member.name}（${member.dept}）`); button.type = 'button';
    button.addEventListener('click',()=>openDepartment(member.dept)); $('member-list').append(button);
  });
  positionStations(); if (view === 'floor') startMotion();
}
function positionStations() {
  const mobile = matchMedia('(max-width:650px)').matches;
  const positions = mobile ? [[25,21],[75,21],[25,43],[75,43],[25,66],[75,66],[25,88],[75,88]] : [[22,22],[78,22],[16,45],[84,45],[16,73],[84,73],[35,90],[65,90]];
  [...$('stations').children].forEach((node,i)=> {node.style.left=positions[i][0]+'%';node.style.top=positions[i][1]+'%';});
}
function empty(target,text) { target.append(element('p','empty',text)); }
function entry(row, kind) {
  const article = element('article','entry');
  const top = element('div','entry-top');
  top.append(element('span','department-tag',row.department));
  if (kind==='instructions') top.append(element('span','',STORES[row.store]));
  const time = element('time','',dateFormat.format(new Date(row.created_at))); time.dateTime = row.created_at;
  top.append(time); article.append(top,element('p','entry-body',row.body));
  if (kind==='summaries') return article;
  const actions = element('div','entry-actions');
  if (kind==='instructions') {
    const select = element('select'); select.setAttribute('aria-label','指示の状態');
    for(const [value,label] of Object.entries(STATUS)) {const option=element('option','',label);option.value=value;select.append(option);}
    select.value = row.status;
    select.addEventListener('change',()=> mutate(select,async()=> {
      const {data,error} = await db.from('instructions').update({status:select.value}).eq('id',row.id).select('id');
      if(error) throw error; if(!data.length) throw new Error('指示が見つかりません。更新してください。');
    },'状態を変更しました。'));
    actions.append(select);
  }
  const remove=element('button','delete','削除');remove.type='button';
  remove.addEventListener('click',async()=> {
    if(!await confirmDelete()) return;
    mutate(remove,async()=>{const {data,error}=await db.from(kind).delete().eq('id',row.id).select('id');if(error)throw error;if(!data.length)throw new Error('対象が見つかりません。更新してください。');},'削除しました。');
  });
  actions.append(remove);article.append(actions);return article;
}
function renderInstructions() {
  const target=$('instruction-list'); target.replaceChildren();
  const rows=records.instructions.filter(row=>(!$('filter-department').value||row.department===$('filter-department').value)&&(!$('filter-status').value||row.status===$('filter-status').value));
  rows.forEach(row=>target.append(entry(row,'instructions')));
  if(!rows.length)empty(target,'指示はまだありません。小さな一歩を書いてみよう。');
}
function renderIdeas() {
  for(const [key,id,label] of [['ideas','idea-list','アイデアはまだありません。思いつきを残しておこう。'],['summaries','summary-list','まとめはまだありません。']]) {
    $(id).replaceChildren();records[key].forEach(row=>$(id).append(entry(row,key)));if(!records[key].length)empty($(id),label);
  }
  $('summarize').disabled=!records.ideas.length;
}
function renderAll() { renderFloor();renderInstructions();renderIdeas(); }
async function fetchAll() {
  const snapshot = epoch;
  const result=await Promise.all(Object.keys(records).map(async table=> {
    // Page all rows: Supabase's default response limit must not truncate counts.
    const rows=[];let start=0;
    for(;;) {
      const {data,error}=await db.from(table).select('*').order('created_at',{ascending:false}).order('id',{ascending:false}).range(start,start+499);
      if(error)throw error;rows.push(...data);if(data.length<500)break;start+=500;
    }
    return [table,rows];
  }));
  if(snapshot!==epoch || !userId)return false;
  records=Object.fromEntries(result);loaded=true;renderAll();$('content').hidden=false;return true;
}
async function refresh() {
  if(!userId||refreshing)return;refreshing=true;clearReplies();$('refresh').disabled=true;stopMotion();
  $('loading').hidden=false;
  try { await fetchAll();notify(''); }
  catch(error) {loaded=false;$('content').hidden=true;notify('データを取得できませんでした。「更新」で再試行してください。\n'+error.message,true);}
  finally {refreshing=false;$('refresh').disabled=false;$('loading').hidden=true;}
}
async function mutate(control,operation,success) {
  const current=epoch;
  control.disabled=true;notify('');
  let saved=false;
  try {
    await operation();saved=true;
    if(current!==epoch)return;
    if(await fetchAll())notify(success);
  } catch(error) {
    if(current!==epoch)return;
    if(saved){loaded=false;stopMotion();$('content').hidden=true;}
    notify(saved?'保存は完了しましたが、再取得に失敗しました。「更新」で確認してください。':'保存できませんでした。'+error.message,true);
    // Restore the previous persisted status after a failed update.
    if(!saved)renderInstructions();
  } finally {control.disabled=false;}
}
function confirmDelete() {
  const dialog=$('delete-dialog');dialog.returnValue='cancel';dialog.showModal();
  return new Promise(resolve=>dialog.addEventListener('close',()=>resolve(dialog.returnValue==='delete'),{once:true}));
}
function resetPrivateData() {
  clearReplies();epoch++;loaded=false;records={instructions:[],ideas:[],summaries:[]};stopMotion();
  $('workspace').hidden=true;$('login').hidden=false;$('content').hidden=true;
  for(const id of ['stats','stations','member-list','instruction-list','idea-list','summary-list'])$(id).replaceChildren();
  $('instruction-form').reset();$('idea-form').reset();$('login-form').reset();notify('');
  if($('delete-dialog').open)$('delete-dialog').close('cancel');
}
function acceptSession(session) {
  const next=session?.user?.id || null;
  if(next===userId)return;
  resetPrivateData();userId=next;
  if(userId){$('login').hidden=true;$('workspace').hidden=false;showView('floor');refresh();}
  else $('login-message').textContent='ログインしてオフィスを開きましょう。';
}
// v6's shared requestAnimationFrame timeline, cloned actor, mirrored facing,
// and aisle segments are retained. Trips are decorative: no fabricated reports.
function stopMotion() {
  cancelAnimationFrame(motionFrame);motionFrame=0;
  if(outing){outing.station.classList.remove('away');outing.actor.remove();outing=null;}
}
function startMotion() {
  if(replying||!loaded||!userId||view!=='floor'||document.hidden||reducedMotion.matches||motionFrame)return;
  nextWalk=performance.now()+2200;motionFrame=requestAnimationFrame(animateOffice);
}
function makeWalk(now) {
  const stations=[...$('stations').children],station=stations[walkerIndex%8];walkerIndex++;
  const room=$('office').getBoundingClientRect(),rect=station.querySelector('.character').getBoundingClientRect();
  const home={x:rect.left-room.left+rect.width/2,y:rect.top-room.top+rect.height/2};
  const w=rect.width,h=rect.height;
  const aisleY=Math.min(room.height-h/2-10,home.y+h*.75);
  const side=home.x<room.width/2?w/2+8:room.width-w/2-8;
  const otherY=Math.max(140,Math.min(room.height-80,aisleY+(walkerIndex%2?110:-110)));
  const points=[home,{x:home.x,y:aisleY},{x:side,y:aisleY},{x:side,y:otherY},{x:side,y:aisleY},{x:home.x,y:aisleY},home];
  const actor=element('button','walker');actor.type='button';actor.style.width=w+'px';actor.style.height=h+'px';actor.setAttribute('aria-label',station.getAttribute('aria-label'));
  const body=element('span','walker-body');body.append(station.querySelector('.character').cloneNode(true));actor.append(body);
  const state=departmentState(TEAM[Number(station.dataset.index)].dept);
  if(state.body)actor.append(element('span','bubble',state.body.slice(0,28)));
  actor.addEventListener('click',()=>station.click());$('motion-layer').append(actor);station.classList.add('away');
  const segments=points.slice(1).map((b,i)=>({a:points[i],b,duration:Math.hypot(b.x-points[i].x,b.y-points[i].y)/65}));
  outing={station,actor,w,h,segments,started:now};
}
function animateOffice(now) {
  if(!loaded||view!=='floor'||document.hidden||reducedMotion.matches){stopMotion();return;}
  if(!outing&&now>=nextWalk)makeWalk(now);
  if(outing){
    let seconds=(now-outing.started)/1000,segment;
    for(const candidate of outing.segments){if(seconds<candidate.duration){segment=candidate;break;}seconds-=candidate.duration;}
    if(!segment){outing.station.classList.remove('away');outing.actor.remove();outing=null;nextWalk=now+1800;}
    else {
      const t=seconds/segment.duration,x=segment.a.x+(segment.b.x-segment.a.x)*t,y=segment.a.y+(segment.b.y-segment.a.y)*t;
      outing.actor.style.transform=`translate(${x-outing.w/2}px,${y-outing.h/2}px)`;
      const dx=segment.b.x-segment.a.x;if(Math.abs(dx)>.1)outing.actor.style.setProperty('--facing',dx<0?-1:1);
    }
  }
  motionFrame=requestAnimationFrame(animateOffice);
}
for(const select of document.querySelectorAll('.department-select')) {
  if(select.dataset.all){const all=element('option','','すべての部署');all.value='';select.append(all);}
  TEAM.forEach(m=>{const option=element('option','',m.dept);option.value=m.dept;select.append(option);});
}
$('today').textContent=new Intl.DateTimeFormat('ja-JP',{year:'numeric',month:'long',day:'numeric',weekday:'short'}).format(new Date());
document.querySelectorAll('[data-view]').forEach(button=>button.addEventListener('click',()=>showView(button.dataset.view,true)));
document.querySelector('.brand').addEventListener('click',event=>{event.preventDefault();showView('floor');});
$('filter-department').addEventListener('change',renderInstructions);$('filter-status').addEventListener('change',renderInstructions);
$('refresh').addEventListener('click',refresh);
$('ask-all').addEventListener('click',()=>askMembers());
for(const [id,table] of [['instruction-form','instructions'],['idea-form','ideas']]) {
  $(id).addEventListener('submit',event=> {
    event.preventDefault();const form=event.currentTarget,body=form.elements.body.value.trim();
    if(!body){form.elements.body.setCustomValidity('内容を入力してください。');form.elements.body.reportValidity();return;}
    const row={department:form.elements.department.value,body};if(table==='instructions')row.store=form.elements.store.value;
    mutate(form.querySelector('button'),async()=>{const {error}=await db.from(table).insert(row);if(error)throw error;form.elements.body.value='';},'保存しました。');
  });
  $(id).elements.body.addEventListener('input',event=>event.target.setCustomValidity(''));
}
$('summarize').addEventListener('click',()=> {
  const summaries=TEAM.map(m=> {
    const rows=records.ideas.filter(row=>row.department===m.dept);
    return rows.length?{department:m.dept,body:`メモ ${rows.length}件\n最新のメモ：\n${rows[0].body}`}:null;
  }).filter(Boolean);
  if(!summaries.length)return;
  mutate($('summarize'),async()=>{const {error}=await db.from('summaries').insert(summaries);if(error)throw error;},'部署別のまとめを保存しました。');
});
$('login-form').addEventListener('submit',async event=> {
  event.preventDefault();if(!db)return;
  $('login-button').disabled=true;$('login-message').textContent='ログインしています…';
  try {
    const {data,error}=await db.auth.signInWithPassword({email:event.target.elements.email.value.trim(),password:event.target.elements.password.value});
    if(error)throw error;acceptSession(data.session);
  }catch(error){$('login-message').textContent='ログインできませんでした。メール・パスワードと接続状態を確認してください。';}
  finally{$('login-button').disabled=false;}
});
$('logout').addEventListener('click',async()=> {
  $('logout').disabled=true;
  try{const {error}=await db.auth.signOut({scope:'local'});if(error)throw error;acceptSession(null);}
  catch(error){notify('ログアウトできませんでした。もう一度お試しください。',true);}
  finally{$('logout').disabled=false;}
});
window.addEventListener('resize',()=>{stopMotion();positionStations();startMotion();});
reducedMotion.addEventListener('change',()=>{stopMotion();startMotion();});
document.addEventListener('visibilitychange',()=>{clearReplies();stopMotion();if(!document.hidden&&userId)refresh();});
async function initialize() {
  if(SUPABASE_URL==='YOUR_SUPABASE_URL'||SUPABASE_PUBLISHABLE_KEY==='YOUR_SUPABASE_PUBLISHABLE_KEY') {
    $('login-message').textContent='接続設定が必要です。README.md に沿って app.js の接続情報を設定してください。';$('login-button').disabled=true;return;
  }
  if(!window.supabase){$('login-message').textContent='接続用ライブラリを読み込めませんでした。通信状態を確認して再読み込みしてください。';$('login-button').disabled=true;return;}
  try {
    db=window.supabase.createClient(SUPABASE_URL,SUPABASE_PUBLISHABLE_KEY);
    db.auth.onAuthStateChange((_event,session)=> {setTimeout(()=>acceptSession(session),0);});
    const {data,error}=await db.auth.getSession();if(error)throw error;
    acceptSession(data.session);
    if(!data.session)$('login-message').textContent='ログインしてオフィスを開きましょう。';
  }catch(error){$('login-message').textContent='接続を開始できませんでした。設定と通信状態を確認して再読み込みしてください。';$('login-button').disabled=true;}
}
initialize();
