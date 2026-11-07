const SUPABASE_URL = 'https://kyuwvprkdlvtgcwtxknp.supabase.co';
const SUPABASE_PUBLISHABLE_KEY = 'sb_publishable_eqk6W5j22zTfcpmLXq-1vg_hvrTAO9d';

'use strict';
const TEAM = [{"dept": "社長室", "name": "レオ", "item": "<path d=\"M48 22L43 5 58 13 70 1 82 13 97 5 92 22Z\" fill=\"#dfb95e\" stroke=\"#b89547\" stroke-width=\"2\"/><circle cx=\"70\" cy=\"15\" r=\"3\" fill=\"#fff3cc\"/>"}, {"dept": "秘書", "name": "サク", "item": "<g transform=\"rotate(-9 24 80)\"><rect x=\"8\" y=\"63\" width=\"29\" height=\"35\" rx=\"4\" fill=\"#d1aaa0\" stroke=\"#a67f75\" stroke-width=\"1.5\"/><path d=\"M15 64v33M20 72h12M20 78h12M20 84h8\" stroke=\"#fff3dc\" stroke-width=\"1.5\"/><path d=\"M10 69h7M10 77h7M10 85h7M10 93h7\" stroke=\"#8a7566\" stroke-width=\"2\"/></g><g transform=\"rotate(20 117 78)\"><path d=\"M115 61h5v29l-2.5 6-2.5-6Z\" fill=\"#87967b\" stroke=\"#65765f\" stroke-width=\"1.5\"/><path d=\"M115 66h5M115 88h5\" stroke=\"#f9e9be\" stroke-width=\"2\"/></g>"}, {"dept": "Instagram", "name": "ミラ", "item": "<g transform=\"rotate(-12 29 80)\"><rect x=\"16\" y=\"67\" width=\"17\" height=\"26\" rx=\"3\" fill=\"#d3a6a0\" stroke=\"#a97e79\"/><rect x=\"19\" y=\"70\" width=\"11\" height=\"17\" rx=\"1\" fill=\"#fff3e4\"/></g><path d=\"M112 28C101 18 98 34 112 41C127 31 122 20 112 28Z\" fill=\"#dba5a0\"/>"}, {"dept": "Hot Pepper", "name": "ベル", "item": "<g transform=\"rotate(-10 25 82)\"><rect x=\"10\" y=\"67\" width=\"26\" height=\"30\" rx=\"3\" fill=\"#b4bc9b\" stroke=\"#889371\"/><path d=\"M15 74h17M16 81h14M16 87h10\" stroke=\"#fff7de\" stroke-width=\"2\"/><path d=\"M16 64v6M28 64v6\" stroke=\"#807b61\" stroke-width=\"2\"/></g>"}, {"dept": "経理", "name": "エン", "item": "<rect x=\"105\" y=\"76\" width=\"23\" height=\"29\" rx=\"3\" fill=\"#b3b6a5\" stroke=\"#858d79\"/><path d=\"M110 82h13M110 89h3m5 0h4m-12 6h3m5 0h4\" stroke=\"#fdf8e6\" stroke-width=\"3\"/><circle cx=\"22\" cy=\"89\" r=\"10\" fill=\"#e2bf69\" stroke=\"#b89a4f\"/><text x=\"22\" y=\"93\" text-anchor=\"middle\" font-size=\"12\" fill=\"#947833\">¥</text>"}, {"dept": "マインド", "name": "ヒラ", "item": "<g stroke=\"#bfa250\" stroke-width=\"2\"><path d=\"M104 25a11 11 0 1 1 17 0l-3 6h-11Z\" fill=\"#f7df88\"/><path d=\"M107 35h11M108 39h9M112 4V0M97 12l-5-3M128 12l5-3\" fill=\"none\"/></g>"}, {"dept": "EC企画", "name": "ポチ", "item": "<path d=\"M104 74h25l3 29h-31Z\" fill=\"#d6ad88\" stroke=\"#b58e67\" stroke-width=\"1.5\"/><path d=\"M110 77v-5a7 7 0 0 1 14 0v5\" fill=\"none\" stroke=\"#a17c57\" stroke-width=\"2\"/><path d=\"M111 88l5 5 8-10\" fill=\"none\" stroke=\"#fff5dc\" stroke-width=\"2\"/>"}, {"dept": "動画編集", "name": "カット", "item": "<g transform=\"rotate(-10 25 79)\"><rect x=\"7\" y=\"72\" width=\"33\" height=\"25\" rx=\"3\" fill=\"#697367\" stroke=\"#4e5a4c\" stroke-width=\"1.5\"/><path d=\"M8 72L5 62 36 53 39 63Z\" fill=\"#fff6df\" stroke=\"#4e5a4c\" stroke-width=\"1.5\"/><path d=\"M11 60l7 7m3-10 7 7m3-10 6 6\" stroke=\"#697367\" stroke-width=\"4\"/><path d=\"M13 80h21M13 86h14\" stroke=\"#fff6df\" stroke-width=\"1.5\"/></g>"}];
const STATUS = {open:'未対応',doing:'対応中',review:'確認待ち',done:'完了'};
const DRAFT_KINDS = {blog:'ブログ',profile:'プロフィール',review:'口コミ返信',style:'スタイル',caption:'キャプション',other:'その他'};
const DRAFT_STATUS = {draft:'下書き',ready:'確定',used:'使用済み'};
const STORES = {tenjin:'天神',hakata:'博多',common:'共通'};
const $ = id => document.getElementById(id);
let db, userId = null, epoch = 0, loaded = false, refreshing = false, view = 'instructions';
let records = {instructions:[],ideas:[],summaries:[],drafts:[],records:[],trend_words:[]};
let recordTag = '';
let blogVariant = 0, blogPreview = null;
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
  if (!['floor','instructions','ideas','drafts','records','trends'].includes(next)) next = 'floor';
  clearReplies();
  view = next;
  for (const name of ['floor','instructions','ideas','drafts','records','trends']) $(name+'-view').hidden = name !== next;
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
// Draft text is always rendered as text, including server-provided content.
function renderDrafts() {
  const target=$('draft-list');target.replaceChildren();
  const rows=records.drafts.filter(row=>!$('draft-filter-department').value||row.department===$('draft-filter-department').value);
  for(const row of rows) {
    const article=element('article','entry');
    const details=element('details','draft-detail');
    const summary=element('summary');
    const top=element('span','entry-top');
    const time=element('time','',dateFormat.format(new Date(row.created_at)));time.dateTime=row.created_at;
    top.append(element('span','department-tag',row.department),element('span','',DRAFT_KINDS[row.kind]),element('span','',DRAFT_STATUS[row.status]),time);
    summary.append(top,element('span','draft-heading',row.title||row.body.slice(0,80)));
    details.append(summary);
    const feedback=element('p','copy-feedback');feedback.setAttribute('role','status');
    for(const [label,text] of [['タイトル',row.title],['本文',row.body]]) {
      if(label==='タイトル'&&!text)continue;
      const block=element('div','draft-text');
      const copy=element('button','',label+'をコピー');copy.type='button';
      copy.addEventListener('click',async()=> {
        const snapshot=epoch;copy.disabled=true;
        try {await navigator.clipboard.writeText(text);if(snapshot===epoch)feedback.textContent=label+'をコピーしました。';}
        catch(error){if(snapshot===epoch)feedback.textContent='コピーできませんでした。文章を選択してコピーしてください。';}
        finally{copy.disabled=false;}
      });
      block.append(element('h3','',label),element('p','entry-body',text),copy);details.append(block);
    }
    const checks=element('section','draft-checks');checks.append(element('h3','','チェック結果'));
    const warnings=checkDraft(row);
    if(warnings.length){const list=element('ul');warnings.forEach(text=>list.append(element('li','',text)));checks.append(list);}
    else checks.append(element('p','','チェックOK'));
    details.append(checks);
    const actions=element('div','draft-actions');
    for(const [status,label] of [['ready','確定にする'],['used','使用済みにする'],['draft','下書きに戻す']]) {
      if(row.status===status)continue;
      const button=element('button','',label);button.type='button';
      button.addEventListener('click',()=>mutate(button,async()=> {
        const {data,error}=await db.from('drafts').update({status}).eq('id',row.id).select('id');
        if(error)throw error;if(!data.length)throw new Error('下書きが見つかりません。更新してください。');
      },'下書きの状態を変更しました。'));actions.append(button);
    }
    const remove=element('button','delete','削除');remove.type='button';
    remove.addEventListener('click',async()=> {
      const snapshot=epoch;
      if(!await confirmDelete()||snapshot!==epoch)return;
      mutate(remove,async()=> {
        const {data,error}=await db.from('drafts').delete().eq('id',row.id).select('id');
        if(error)throw error;if(!data.length)throw new Error('下書きが見つかりません。更新してください。');
      },'下書きを削除しました。');
    });
    actions.append(remove);details.append(feedback,actions);article.append(details);target.append(article);
  }
  if(!rows.length)empty(target,'下書きはまだありません。完成した文章を置いておこう。');
}

// Pure helpers: priority follows the keyword groups in PROMPT-v10-complete.md.
function routeInstruction(body) {
  const text=String(body);
  if(/ブログ|ホットペッパー|HPB|口コミ|プロフィール|スタイル/i.test(text))return 'Hot Pepper';
  if(/リール|キャプション|インスタ|Instagram|投稿/i.test(text))return 'Instagram';
  if(/動画|編集|(?:映像|撮影|クリップ|シーン|尺).*カット|カット.*(?:映像|撮影|クリップ|シーン|尺)/i.test(text))return '動画編集';
  if(/EC|店販|商品|在庫/i.test(text))return 'EC企画';
  if(/売上|お金|経理|支払い/.test(text))return '経理';
  if(/セミナー|資料|スライド|アイデア|企画/.test(text))return 'マインド';
  return '社長室';
}
function checkDraft({title='',body='',kind}) {
  const warnings=[],text=title+'\n'+body;
  for(const word of ['最強','俺','個性派','派手髪','ぶち抜く'])if(text.includes(word))warnings.push('使わない言葉：'+word);
  if((text.match(/[#＃][^\s#＃]+/gu)||[]).length>=6)warnings.push('ハッシュタグは5個までです。');
  if(kind==='blog'&&blogTitleLength(title)>25)warnings.push('ブログのタイトルは25字までです。');
  if(kind==='blog'||kind==='profile'){
    if(/[\u{1F000}-\u{1FAFF}\u2600-\u27BF\u2300-\u23FF\uFE0F\u20E3]/u.test(body))warnings.push('本文に絵文字が含まれています。');
    if(body.includes('・'))warnings.push('本文に中点「・」が含まれています。');
  }
  return warnings;
}
// Full-width characters count as 1; ASCII and half-width forms count as 0.5.
function blogTitleLength(text) {
  return [...text].reduce((total,char)=>total+(/[\u0000-\u007f\uff61-\uff9f]/u.test(char)?0.5:1),0);
}
function generateBlog(input, variant = 0) {
  const color=String(input.color||'').trim(),bleach=input.bleach||'2回',feature=input.feature||'透明感';
  if(!color)throw new Error('色名を入力してください。');
  const concern=String(input.concern||'').trim(),point=String(input.point||'').trim();
  const noBleach=bleach==='なし',tenjin=input.store!=='hakata';
  const turn=((Math.trunc(Number(variant))||0)%3+3)%3;
  const candidates=noBleach
    ?[`ブリーチなしで作る${color}`,`色落ちまで考える${color}`,`${feature}の${color}はブリーチなしで`]
    :[`ブリーチ${bleach}で作る${color}`,`色落ちまで考える${color}`,`${color}、ブリーチ${bleach}の記録`];
  const ordered=candidates.slice(turn).concat(candidates.slice(0,turn));
  const title=ordered.find(text=>blogTitleLength(text)<=25)||candidates.reduce((a,b)=>blogTitleLength(a)<=blogTitleLength(b)?a:b);
  const method=noBleach?'ブリーチなし':`ブリーチ${bleach}`;
  const intros=[`${color}は、${method}で作る${feature}カラーです。`,`${method}で作る${color}。${feature}を大切にしたカラーです。`,`${feature}を楽しむ${color}は、${method}で作るカラーです。`];
  const features={透明感:'明るくしすぎず、肌なじみの良さと柔らかさを残せるのが特徴です。',艶:'表面の艶を残し、落ち着いた印象に仕上がります。',柔らかさ:'硬く見えやすい髪も、柔らかい質感に見せてくれます。',深み:'明度を落として深みを出すことで、落ち着いた色味が出ます。'};
  const paragraphs=[intros[turn]+features[feature],noBleach
    ?'色落ちは少しずつ穏やかに抜けていきます。落ちてきた時の色まで考えて染めるので、次の来店まで楽しめます。'
    :'色落ちは、黄色みを抑えながら少しずつ抜けていきます。落ちてきた時の色まで考えて染めるので、2週間後、1か月後の髪も楽しめます。'];
  if(point)paragraphs.push(`今回大切にしたのは、${point}です。`);
  paragraphs.push((concern?`${concern}というお悩みには、施術の組み立てとホームケアで向き合います。`:'')+'続けるためのポイントは、日々のホームケアです。色を入れた直後は洗浄力の優しいシャンプーを使い、熱を当てすぎないこと。ご来店時に、今の髪に合うケアもお伝えします。');
  paragraphs.push(tenjin
    ?(noBleach?'ブリーチに不安がある方も、':'初めてのブリーチで不安な方も、')+'髪の履歴と状態を見てから、できることと難しいことを先にお伝えします。気になる方はお気軽にご相談ください！'
    :'落ち着いた色味が好きな方や、仕事で明るさに制限がある方にも合わせやすいカラーです。気になる方はお気軽にご相談ください！');
  if(tenjin)paragraphs.push('福岡天神 JILL by GiseL 店長 鶴岡和幸');
  return {title,body:paragraphs.join('\n\n')};
}
function createBlogPreview() {
  const form=$('blog-form');
  if(!form.elements.color.value.trim()){
    $('blog-message').textContent='色名を入力してください。';form.elements.color.focus();return;
  }
  const input=Object.fromEntries(new FormData(form));
  blogPreview=generateBlog(input,blogVariant++);
  $('blog-title').textContent=blogPreview.title;$('blog-body').textContent=blogPreview.body;
  $('blog-signature-note').hidden=input.store!=='hakata';
  const checks=$('blog-checks');checks.replaceChildren();
  const warnings=checkDraft({...blogPreview,kind:'blog'});
  checks.append(element('p','',`タイトル：${blogTitleLength(blogPreview.title)} / 25字`));
  if(warnings.length){const list=element('ul');warnings.forEach(text=>list.append(element('li','',text)));checks.append(list);}
  else checks.append(element('p','','チェックOK'));
  $('blog-preview').hidden=false;$('blog-message').textContent='ブログを作成しました。';
}
async function saveGeneratedBlog(blog) {
  const {error}=await db.from('drafts').insert({department:'Hot Pepper',kind:'blog',status:'draft',title:blog.title,body:blog.body});
  if(error)throw error;
}

function recordImagePath(url) {
  try {
    const parsed=new URL(url),base=new URL(SUPABASE_URL),prefix='/storage/v1/object/public/records/';
    return parsed.origin===base.origin&&parsed.pathname.startsWith(prefix)?decodeURIComponent(parsed.pathname.slice(prefix.length)):null;
  }catch{return null;}
}
async function removeRecordFile(path) {
  if(!path)return;
  try {await db.storage.from('records').remove([path]);}catch{/* Best effort after record deletion or failed insert. */}
}
async function saveRecord({body,tags,file},snapshot=epoch) {
  let path=null,image_url='';
  try {
    if(file){
      if(!file.type.startsWith('image/'))throw new Error('画像ファイルを選んでください。');
      const extension=({ 'image/jpeg':'jpg','image/png':'png','image/webp':'webp','image/gif':'gif','image/heic':'heic','image/avif':'avif' })[file.type]||'image';
      path=`${userId}/${crypto.randomUUID()}.${extension}`;
      const {error}=await db.storage.from('records').upload(path,file,{contentType:file.type,upsert:false});
      if(error){path=null;throw error;}
      image_url=db.storage.from('records').getPublicUrl(path).data.publicUrl;
      if(!image_url)throw new Error('画像の公開URLを取得できませんでした。');
    }
    if(snapshot!==epoch)throw new Error('ログイン状態が変わりました。');
    const {error}=await db.from('records').insert({body,tags,image_url});if(error)throw error;
  }catch(error){await removeRecordFile(path);throw error;}
}
async function deleteRecord(row) {
  const {data,error}=await db.from('records').delete().eq('id',row.id).select('id');
  if(error)throw error;if(!data.length)throw new Error('記録が見つかりません。更新してください。');
  await removeRecordFile(recordImagePath(row.image_url));
}
function renderRecords() {
  const target=$('record-list');target.replaceChildren();
  $('record-filter-label').textContent=recordTag?'タグ：'+recordTag:'すべての記録';
  $('record-filter-clear').hidden=!recordTag;
  const tagsOf=row=>row.tags.split(/[,，]/).map(tag=>tag.trim()).filter(Boolean);
  const rows=records.records.filter(row=>!recordTag||tagsOf(row).includes(recordTag));
  for(const row of rows){
    const article=element('article','entry');
    if(row.image_url){
      // Only display public record images served by the configured Supabase project.
      if(recordImagePath(row.image_url)){
        const img=element('img','record-thumbnail');img.src=row.image_url;img.alt='記録の写真';img.loading='lazy';article.append(img);
      }
    }
    article.append(element('p','entry-body',row.body));
    const tags=element('div','record-tags');
    for(const tag of [...new Set(tagsOf(row))]){const button=element('button','',tag);button.type='button';button.addEventListener('click',()=>{recordTag=tag;renderRecords();});tags.append(button);}
    const time=element('time','',dateFormat.format(new Date(row.created_at)));time.dateTime=row.created_at;
    const remove=element('button','delete','削除');remove.type='button';
    remove.addEventListener('click',async()=>{const snapshot=epoch;if(!await confirmDelete()||snapshot!==epoch)return;mutate(remove,()=>deleteRecord(row),'記録を削除しました。');});
    const actions=element('div','entry-actions');actions.append(time,remove);article.append(tags,actions);target.append(article);
  }
  if(!rows.length)empty(target,'記録はまだありません。写真やメモを残しておこう。');
}
function renderTrends() {
  const target=$('trend-list');target.replaceChildren();
  for(const row of records.trend_words){
    const article=element('article','entry');article.append(element('h3','',row.word),element('p','entry-body',row.memo));
    const time=element('time','',dateFormat.format(new Date(row.created_at)));time.dateTime=row.created_at;
    const remove=element('button','delete','削除');remove.type='button';
    remove.addEventListener('click',async()=>{const snapshot=epoch;if(!await confirmDelete()||snapshot!==epoch)return;mutate(remove,async()=>{
      const {data,error}=await db.from('trend_words').delete().eq('id',row.id).select('id');if(error)throw error;if(!data.length)throw new Error('ワードが見つかりません。更新してください。');
    },'ワードを削除しました。');});
    const actions=element('div','entry-actions');actions.append(time,remove);article.append(actions);target.append(article);
  }
  if(!records.trend_words.length)empty(target,'気になるワードを残しておこう。');
}

function renderAll() { renderFloor();renderInstructions();renderIdeas();renderDrafts();renderRecords();renderTrends(); }
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
  clearReplies();epoch++;loaded=false;records={instructions:[],ideas:[],summaries:[],drafts:[],records:[],trend_words:[]};stopMotion();
  $('workspace').hidden=true;$('login').hidden=false;$('content').hidden=true;
  for(const id of ['stats','stations','member-list','instruction-list','idea-list','summary-list','draft-list','record-list','trend-list'])$(id).replaceChildren();
  blogVariant=0;blogPreview=null;$('blog-form').reset();$('blog-preview').hidden=true;
  $('blog-title').textContent='';$('blog-body').textContent='';$('blog-checks').replaceChildren();$('blog-message').textContent='';
  recordTag='';$('record-form').reset();$('trend-form').reset();$('instruction-result').textContent='';
  $('instruction-form').reset();$('idea-form').reset();$('draft-form').reset();$('draft-filter-department').value='';$('login-form').reset();notify('');
  if($('delete-dialog').open)$('delete-dialog').close('cancel');
}
function acceptSession(session) {
  const next=session?.user?.id || null;
  if(next===userId)return;
  resetPrivateData();userId=next;
  if(userId){$('login').hidden=true;$('workspace').hidden=false;showView('instructions');refresh();}
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
  if(select.closest('#instruction-form')){const auto=element('option','','自動（おまかせ）');auto.value='auto';select.append(auto);}
  if(select.dataset.all){const all=element('option','','すべての部署');all.value='';select.append(all);}
  TEAM.forEach(m=>{const option=element('option','',m.dept);option.value=m.dept;select.append(option);});
}

$('blog-form').addEventListener('submit',event=>{event.preventDefault();createBlogPreview();});
$('blog-regenerate').addEventListener('click',createBlogPreview);
$('blog-save').addEventListener('click',()=>{
  if(!blogPreview||$('blog-save').disabled)return;
  const blog={...blogPreview},snapshot=epoch;
  mutate($('blog-save'),async()=>{
    await saveGeneratedBlog(blog);
    if(snapshot===epoch)$('draft-filter-department').value='';
  },'ブログを下書きに保存しました。');
});

$('record-filter-clear').addEventListener('click',()=>{recordTag='';renderRecords();});
$('record-form').addEventListener('submit',event=>{
  event.preventDefault();const form=event.currentTarget,button=form.querySelector('button');if(button.disabled)return;
  const snapshot=epoch,payload={body:form.elements.body.value.trim(),tags:form.elements.tags.value.trim(),file:form.elements.photo.files[0]};
  mutate(button,async()=>{await saveRecord(payload,snapshot);if(snapshot===epoch)form.reset();},'記録を保存しました。');
});
$('trend-form').addEventListener('submit',event=>{
  event.preventDefault();const form=event.currentTarget,button=form.querySelector('button');if(button.disabled)return;
  const word=form.elements.word.value.trim();if(!word){form.elements.word.setCustomValidity('ワードを入力してください。');form.elements.word.reportValidity();return;}
  const snapshot=epoch,row={word,memo:form.elements.memo.value.trim()};
  mutate(button,async()=>{const {error}=await db.from('trend_words').insert(row);if(error)throw error;if(snapshot===epoch)form.reset();},'ワードを保存しました。');
});
$('trend-form').elements.word.addEventListener('input',event=>event.target.setCustomValidity(''));

$('today').textContent=new Intl.DateTimeFormat('ja-JP',{year:'numeric',month:'long',day:'numeric',weekday:'short'}).format(new Date());
document.querySelectorAll('[data-view]').forEach(button=>button.addEventListener('click',()=>showView(button.dataset.view,true)));
document.querySelector('.brand').addEventListener('click',event=>{event.preventDefault();showView('floor');});
$('filter-department').addEventListener('change',renderInstructions);$('filter-status').addEventListener('change',renderInstructions);
$('draft-filter-department').addEventListener('change',renderDrafts);
$('draft-form').addEventListener('submit',event=> {
  event.preventDefault();const form=event.currentTarget,body=form.elements.body.value.trim();
  if(!body){form.elements.body.setCustomValidity('本文を入力してください。');form.elements.body.reportValidity();return;}
  const row={department:form.elements.department.value,kind:form.elements.kind.value,title:form.elements.title.value,body,status:'draft'};
  const snapshot=epoch;
  mutate(form.querySelector('button'),async()=> {
    const {error}=await db.from('drafts').insert(row);if(error)throw error;
    if(snapshot===epoch){form.elements.title.value='';form.elements.body.value='';}
  },'下書きを保存しました。');
});
$('draft-form').elements.body.addEventListener('input',event=>event.target.setCustomValidity(''));
$('refresh').addEventListener('click',refresh);
$('ask-all').addEventListener('click',()=>askMembers());
for(const [id,table] of [['instruction-form','instructions'],['idea-form','ideas']]) {
  $(id).addEventListener('submit',event=> {
    event.preventDefault();const form=event.currentTarget,body=form.elements.body.value.trim();
    if(!body){form.elements.body.setCustomValidity('内容を入力してください。');form.elements.body.reportValidity();return;}
    const department=table==='instructions'&&form.elements.department.value==='auto'?routeInstruction(body):form.elements.department.value;
    const row={department,body};if(table==='instructions')row.store=form.elements.store.value;
    const snapshot=epoch;
    mutate(form.querySelector('button'),async()=>{const {error}=await db.from(table).insert(row);if(error)throw error;if(snapshot===epoch){form.elements.body.value='';if(table==='instructions')$('instruction-result').textContent=department+'へ保存しました。';}},'保存しました。');
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
