/* 育成メイン画面だけの表示層。ゲームロジックは game.js に残す。 */
(()=>{'use strict';
const ICONS={study:'▣',sword:'⚔',magic:'✦',art:'◈',etiquette:'❧',work:'◆',adventure:'✥',rest:'☾'};
const ICON_WORDS={study:'本',sword:'剣',magic:'星',art:'絵筆',etiquette:'手紙',work:'金貨',adventure:'地図',rest:'寝台'};
const AGE_PORTRAITS=[['training_character_12_13.png',12,13],['training_character_14_15.png',14,15],['training_character_16_17.png',16,17]];
function portraitForAge(age){return AGE_PORTRAITS.find(([,from,to])=>age>=from&&age<=to)?.[0]||AGE_PORTRAITS[2][0]}
const CAREERS=[
 ['騎士','剣を鍛え、人々を守る道','武術90以上・体力65以上が判定の目安。武術と体力を伸ばそう。'],
 ['魔術師','魔法を学び、未知の力を探究する道','魔力90以上・知性55以上が判定の目安。魔法と学問を重ねよう。'],
 ['学者','知識を深め、世界の謎を解き明かす道','知性95以上が判定の目安。学問で知性を磨こう。'],
 ['芸術家','感性を磨き、作品を生み出す道','芸術95以上が判定の目安。芸術を中心に育てよう。'],
 ['商人','人々とのつながりを生かし、商いを広げる道','社交95以上・魅力90以上が判定の目安。社交と魅力を伸ばそう。'],
 ['一般市民','特定の肩書きにとらわれず、自分らしい暮らしを築く道','上の5職業の条件を満たさなかった場合の進路。好きなことを大切に育てよう。']
];
const escape=v=>String(v).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const speechText=v=>escape(String(v||'').replace(/^「/,'').replace(/」$/,''));
const percent=n=>Math.max(0,Math.min(100,Number.isFinite(+n)?+n:0));
function stat(name,value,col,row){return `<div class="training-stat" style="--col:${col};--row:${row}"><span class="stat-icon" aria-hidden="true">${({知性:'▣',武術:'⚔',魔力:'✦',芸術:'◈',魅力:'♡',社交:'♣',体力:'❧'})[name]}</span><span class="stat-label">${name}</span><div class="stat-meter" role="progressbar" aria-label="${name}" aria-valuemin="0" aria-valuemax="100" aria-valuenow="${value}"><span style="width:${percent(value)}%"></span></div><strong>${value}</strong></div>`}
function status(name,value,index){return `<div class="training-status-item" style="--i:${index}"><div class="status-caption">${name} <strong>${value}</strong></div><div class="status-meter" role="progressbar" aria-label="${name}" aria-valuemin="0" aria-valuemax="100" aria-valuenow="${value}"><span class="${name==='信頼度'?'positive':''}" style="width:${percent(value)}%"></span></div></div>`}
function conditionEffect(k,a){const fmt=(label,value)=>`${label}${value>0?'+':''}${value}`;return k==='adventure'?'疲労+15〜35・ストレス+0〜20':`${fmt('疲労',a.fatigue)}・${fmt('ストレス',a.stress)}`}
function card(k,i,api){const a=api.actions[k],effect=Object.entries(a.stats).map(([name,n])=>`${name}+${n}`).join('・')||'疲労とストレス回復';const cost=a.cost>0?`費用 ${a.cost}G`:k==='work'?`基本収入 ${-a.cost}G`:k==='adventure'?'報酬 0〜150G':'無料';return `<button type="button" class="training-plan-card" style="--col:${i%2};--row:${Math.floor(i/2)}" data-card="${i}" aria-label="予定${i+1}：${a.name}。押して変更"><span class="training-card-number">予定 ${i+1} <span aria-hidden="true">⌄</span></span><span class="training-action-icon" aria-hidden="true" data-icon="${k}">${ICONS[k]}</span><span class="training-card-title">${a.name}</span><span class="training-card-effect">${cost}<span class="training-card-separator"> ／ </span>${effect}</span><span class="training-card-burden">${conditionEffect(k,a)}</span></button>`}
function detailPicker(api,index){const dialog=document.querySelector('#training-action-dialog');if(!dialog)return;dialog.innerHTML=`<div class="picker-head"><div><small>予定 ${index+1} の行動を選択</small><h2>2か月の過ごし方</h2></div><button type="button" class="picker-close" aria-label="閉じる">×</button></div><div class="picker-actions">${Object.entries(api.actions).map(([k,a])=>{const cost=a.cost>0?`費用 ${a.cost}G`:k==='work'?`基本収入 ${-a.cost}G（体調で変動）`:k==='adventure'?'報酬 0〜150G（4段階抽選）':'無料';return `<button type="button" class="picker-action ${api.state.plan[index]===k?'selected':''}" data-pick="${k}"><span class="picker-icon" aria-hidden="true">${ICONS[k]}</span><span><strong>${a.name}</strong><small>${escape(api.places[a.place]||'自宅')} ／ ${cost}</small><span class="picker-burden">${conditionEffect(k,a)}</span><span class="picker-desc">${escape(a.baseDesc||a.desc)}</span></span></button>`}).join('')}</div>`;dialog.querySelector('.picker-close').onclick=()=>dialog.close();dialog.querySelectorAll('[data-pick]').forEach(button=>button.onclick=()=>{const key=button.dataset.pick;dialog.close();api.onPlanChange(index,key)});dialog.showModal()}
function showCareerGuide(){const dialog=document.querySelector('#career-guide-dialog');if(!dialog)return;dialog.showModal();dialog.querySelector('#career-guide-close').focus()}
window.renderTrainingUI=function(api){
 const {state:s}=api,estimate=api.planEstimate();
 const total=s.plan.reduce((n,k)=>n+Math.max(0,api.actions[k].cost),0);
 const warning=[];
 if(estimate.deficits.length)warning.push(`予定${estimate.deficits.join('・')}は資金不足で休養に変更される可能性があります。`);
 if(s.fatigue>=90||s.stress>=95)warning.push('心身の負担が限界です。休養以外の行動は一時的に休養へ切り替わります。');
 else if(s.fatigue>=60||s.stress>=75)warning.push('疲労やストレスにより育成効率が低下しています。休養をおすすめします。');
 if(s.fatigue>=82&&s.plan.some(k=>k==='sword'||k==='adventure'))warning.push('武術・冒険によるけがの危険があります。');
 if(s.fatigue>=60&&s.plan.includes('adventure'))warning.push('現在の疲労では、冒険によって体調を大きく崩すおそれがあります。休養も検討してください。');
 const potion=api.potion,potionOffer=potion?.stage==='offer',potionFeedback=potion?.stage==='feedback';
 const potionNotice=potionOffer?`<p><strong>【薬師からの提案】</strong> 少女の疲労が限界に近づいています。王都の薬師から、特製回復薬を100Gで購入できます。使用すると疲労が35回復します。購入しますか？ <button type="button" id="potion-buy" ${s.gold<100?'disabled':''}>100Gで購入</button> <button type="button" id="potion-decline">購入しない</button>${s.gold<100?' 回復薬の購入には100G必要です。休養を取って回復しましょう。':''}</p>`:potionFeedback?`<p>特製回復薬を使用しました。疲労が35回復しました。 <button type="button" id="potion-close">確認 ✓</button></p>`:'';
 document.querySelector('#app').innerHTML=`
 <div class="training-wrap">
 <section class="training-stage" aria-label="リーヴェルクの育成メイン画面">
  <img class="training-background" src="assets/elsen_training_ui_bg_v2.webp" alt="" draggable="false" aria-hidden="true">
  <div class="training-top-title"><h2>星灯りの育成物語</h2><small>— エルゼン王国 —</small></div>
  <button type="button" class="training-top-button training-save" id="training-save">記録を保存</button>
  <button type="button" class="training-top-button training-home" id="training-home">タイトルへ</button>
  <div class="training-portrait" aria-label="${api.age}歳の少女の立ち絵" data-age-group="${Math.floor((api.age-12)/2)}"><div class="training-character-slot" aria-hidden="true"><img src="assets/${portraitForAge(api.age)}" alt="" draggable="false" onerror="this.hidden=true"></div></div>
  <div class="training-girl-label"><strong>${api.notice?'お知らせ':escape(s.name)}</strong>${api.notice?'':`<span>${api.age}歳</span>`}</div>
  <div class="training-girl-speech ${api.notice?'training-growth-notice':api.turning?.stage==='speech'||potion?.stage==='speech'?'training-potion-speech':''}">${api.notice?`<div class="growth-notice-heading">${escape(api.notice.title)}</div><div class="growth-notice-body">${api.notice.lines.map(line=>`<p>${escape(line)}</p>`).join('')}</div><button type="button" class="growth-notice-close" id="growth-notice-close">閉じる</button>`:api.turning?.stage==='speech'?`<span class="training-speech-text">${speechText(api.turningSpeech)}</span><button type="button" id="turning-advance">話を聞く ▾</button>`:potion?.stage==='speech'?`<span class="training-speech-text">うぅ……ちょっと頑張りすぎちゃったみたい。少し休んだほうがいいのかな……。</span><button type="button" id="potion-advance">話を聞く ▾</button>`:`<span class="training-speech-text">${speechText(s.quote)}</span>`}</div>
  ${api.turningNotice?`<div class="training-warnings" role="status"><p><strong>${escape(api.turningNotice.title)}</strong>　${api.turningNotice.lines.map(escape).join('　')} <button type="button" id="turning-close">確認 ✓</button></p></div>`:potionNotice?`<div class="training-warnings" role="status">${potionNotice}</div>`:warning.length&&!api.turning?`<div class="training-warnings training-warning-ticker" role="status" aria-label="${escape(warning.join('。'))}"><div class="warning-ticker-track"><span>${warning.map(escape).join('　◆　')}</span><span aria-hidden="true">${warning.map(escape).join('　◆　')}</span></div></div>`:''}
  <div class="training-date"><span>${escape(api.period.replace('／','・'))}</span><span>第${s.turn+1}ターン / 36</span><span>所持金 <strong>${s.gold}G</strong></span></div>
  <div class="training-statuses">${status('疲労',s.fatigue,0)}${status('ストレス',s.stress,1)}${status('信頼度',s.trust,2)}</div>
  <div class="training-stats">${stat('知性',s.stats.知性,0,0)}${stat('魔力',s.stats.魔力,0,1)}${stat('魅力',s.stats.魅力,0,2)}${stat('体力',s.stats.体力,0,3)}${stat('武術',s.stats.武術,1,0)}${stat('芸術',s.stats.芸術,1,1)}${stat('社交',s.stats.社交,1,2)}</div>
  <button type="button" class="training-career-guide" id="training-career-guide">✦ 未来への道しるべ</button>
  <div class="training-plan-list">${s.plan.map((k,i)=>card(k,i,api)).join('')}</div>
  <div class="training-cost"><span>予定費用 <strong>${total}G</strong></span><span>見込み残高 <strong>${estimate.balance}G</strong><small>（収入は変動）</small></span></div>
  <button type="button" class="training-start" id="training-start" ${api.notice||api.turning||(potion&&potion.stage!=='closed')?'disabled aria-disabled="true"':''}>2か月を過ごす <span aria-hidden="true">→</span></button>
 </section>
 <div class="training-below"><p class="training-help">予定カードを選ぶと、施設や行動の詳細を確認して変更できます。<span>スマートフォンでは横向き表示をおすすめします。</span></p><div class="training-debug"><button type="button" id="training-debug-toggle">開発・確認用設定 ${api.debugOpen?'▲':'▼'}</button><div id="debugMount"></div></div></div>
 </div><dialog class="training-picker" id="training-action-dialog" aria-label="育成行動を選択"></dialog><dialog class="career-guide-dialog" id="career-guide-dialog" aria-labelledby="career-guide-title"><div class="career-guide-head"><div><small>FUTURE PATHS</small><h2 id="career-guide-title">未来への道しるべ</h2></div><button type="button" class="career-guide-x" aria-label="閉じる">×</button></div><p class="career-guide-intro">六つの未来には、それぞれの輝きがあります。育成の方向を考える手引きとしてご覧ください。</p><div class="career-guide-cards">${CAREERS.map(([name,description,hint])=>`<section class="career-guide-card"><h3>${escape(name)}</h3><p>${escape(description)}</p><small>育成のヒント</small><p>${escape(hint)}</p></section>`).join('')}</div><p class="career-guide-note">※これは進路の選択ではありません。条件を複数満たす場合は、既存の能力スコアによって進路が決まります。</p><button type="button" class="career-guide-return" id="career-guide-close">育成に戻る</button></dialog>`;
 document.querySelectorAll('[data-card]').forEach(b=>b.onclick=()=>detailPicker(api,+b.dataset.card));
 document.querySelector('#training-save').onclick=api.onSave;
 document.querySelector('#training-home').onclick=api.onHome;
 document.querySelector('#training-start').onclick=api.onStart;
 if(api.notice)document.querySelector('#growth-notice-close').onclick=api.onNoticeClose;
 if(api.turning?.stage==='speech')document.querySelector('#turning-advance').onclick=api.onTurningAdvance;
 if(api.turningNotice)document.querySelector('#turning-close').onclick=api.onTurningClose;
 if(potion?.stage==='speech')document.querySelector('#potion-advance').onclick=api.onPotionAdvance;
 if(potionOffer){document.querySelector('#potion-buy').onclick=api.onPotionBuy;document.querySelector('#potion-decline').onclick=api.onPotionDecline}
 if(potionFeedback)document.querySelector('#potion-close').onclick=api.onPotionClose;
 document.querySelector('#training-career-guide').onclick=showCareerGuide;
 document.querySelector('.career-guide-x').onclick=()=>document.querySelector('#career-guide-dialog').close();
 document.querySelector('#career-guide-close').onclick=()=>document.querySelector('#career-guide-dialog').close();
 document.querySelector('#training-debug-toggle').onclick=api.onDebug;
 if(api.debugOpen)api.renderDebug();
};
})();
