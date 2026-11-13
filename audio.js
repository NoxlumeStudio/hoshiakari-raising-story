/* 小さなSE。ゲームの育成状態・乱数・セーブデータには干渉しない。 */
(()=>{'use strict';
const KEY='elsen-se-preferences-v1';
let settings={enabled:true,volume:35};
try{const saved=JSON.parse(localStorage.getItem(KEY)||'null');if(saved&&typeof saved==='object')settings={enabled:saved.enabled!==false,volume:Math.max(0,Math.min(100,Number(saved.volume)||0))}}catch{}
let context=null,lastScene='',lastPlayed=0;
const persist=()=>{try{localStorage.setItem(KEY,JSON.stringify(settings))}catch{}};
function tone(frequency,at,duration,gain=.15,type='sine'){
 const o=context.createOscillator(),v=context.createGain(),start=context.currentTime+at;
 o.type=type;o.frequency.setValueAtTime(frequency,start);
 v.gain.setValueAtTime(.0001,start);v.gain.exponentialRampToValueAtTime(Math.max(.0001,gain*settings.volume/100),start+.012);
 v.gain.exponentialRampToValueAtTime(.0001,start+duration);
 o.connect(v);v.connect(context.destination);o.start(start);o.stop(start+duration+.015);
}
function play(name){
 if(!settings.enabled||settings.volume<=0)return;
 const now=performance.now();if(now-lastPlayed<65)return;lastPlayed=now;
 try{const Audio=window.AudioContext||window.webkitAudioContext;if(!Audio)return;context=context||new Audio();if(context.state==='suspended')context.resume().catch(()=>{});
  switch(name){
   case 'tap':tone(520,0,.07,.075,'triangle');break;
   case 'page':tone(650,0,.045,.045,'triangle');tone(850,.035,.045,.025,'sine');break;
   case 'coin':tone(930,0,.11,.12);tone(1250,.075,.18,.09);break;
   case 'warning':tone(310,0,.24,.12,'triangle');tone(255,.2,.35,.075,'sine');break;
   case 'hope':tone(660,0,.32,.11);tone(880,.12,.34,.10);tone(1320,.25,.48,.075);break;
   case 'birthday':tone(523,0,.22,.09);tone(659,.17,.22,.09);tone(784,.35,.4,.12);break;
   case 'result':tone(660,0,.13,.09);tone(990,.12,.26,.075);break;
   default:tone(740,0,.11,.08);tone(988,.09,.22,.07);
  }
 }catch{/* Audio API 非対応時もゲーム操作を止めない */}
}
window.ELSEN_SE={play};
const ui=document.createElement('div');ui.id='se-controls';ui.setAttribute('aria-label','効果音設定');
const toggle=document.createElement('button');toggle.type='button';toggle.id='se-toggle';
const slider=document.createElement('input');slider.type='range';slider.id='se-volume';slider.min='0';slider.max='100';slider.step='5';slider.value=settings.volume;slider.setAttribute('aria-label','効果音の音量');
ui.append(toggle,slider);
function sync(){toggle.textContent=settings.enabled?'♪ SE':'♪ 消音';toggle.setAttribute('aria-pressed',String(settings.enabled));slider.disabled=!settings.enabled;slider.value=settings.volume}
toggle.addEventListener('click',()=>{settings.enabled=!settings.enabled;persist();sync();if(settings.enabled)play('tap')});
slider.addEventListener('input',()=>{settings.volume=Number(slider.value);persist()});
slider.addEventListener('change',()=>play('tap'));
function mount(){const parent=document.body.classList.contains('title-mode')?document.querySelector('.title-stage'):document.querySelector('.top-actions');if(parent&&ui.parentElement!==parent)parent.append(ui)}
const obs=new MutationObserver(()=>{mount();const app=document.querySelector('#app');if(!app)return;
 let scene='';
 if(app.querySelector('.phase-heading')?.textContent?.includes('育成結果'))scene='result:'+app.querySelector('.phase-heading').textContent;
 else if(app.querySelector('.birthday-stage'))scene='birthday';
 else if(app.querySelector('#turning-close'))scene='turning:'+app.querySelector('.training-warnings')?.textContent.slice(0,80);
 if(scene!==lastScene){lastScene=scene;if(scene.startsWith('result:'))play('result');else if(scene.startsWith('birthday:'))play('birthday');else if(scene.startsWith('turning:'))play(/成長の節目/.test(scene)?'warning':'hope')}
});
document.addEventListener('click',event=>{const button=event.target.closest('button');if(!button||button.disabled||ui.contains(button))return;
 const id=button.id;
 if(id==='potion-buy')play('coin');
 else if(id==='turning-advance')play('page');
 else if(id==='openingNext'||id==='endingAdvance'||id==='eventAdvance'||id==='birthdayNext'||id==='trust100Next')play('page');
 else if(id==='newBtn'||id==='continueBtn'||id==='training-start'||id==='startTurn')play('hope');
 else play('tap');
},true);
document.addEventListener('DOMContentLoaded',()=>{sync();mount();obs.observe(document.body,{subtree:true,childList:true})});
})();
