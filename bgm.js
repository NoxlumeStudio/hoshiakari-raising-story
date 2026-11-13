/* BGMは画面の再描画から独立して1つのaudio要素で管理する。 */
(()=>{'use strict';
const KEY='elsen-bgm-preferences-v1';
const TRACKS={daily:'assets/starlight_daily_splendid.ogg',ending:'assets/starlight_ending_splendid.ogg'};
let preferences={enabled:true,volume:22};
try{const saved=JSON.parse(localStorage.getItem(KEY)||'null');if(saved&&typeof saved==='object')preferences={enabled:saved.enabled!==false,volume:Math.max(0,Math.min(100,Number(saved.volume)||0))}}catch{}
const audio=new Audio();audio.preload='none';audio.loop=true;
let current=null,unlocked=false,fadeTimer=null,fadeGeneration=0;
const targetVolume=()=>preferences.volume/100;
const persist=()=>{try{localStorage.setItem(KEY,JSON.stringify(preferences))}catch{}};
function cancelFade(){fadeGeneration++;if(fadeTimer!==null){clearInterval(fadeTimer);fadeTimer=null}}
function safePlay(){if(!preferences.enabled||!unlocked||!current)return;try{const promise=audio.play();if(promise?.catch)promise.catch(()=>{})}catch{}}
function selectTrack(next){
 if(current===next)return;
 cancelFade();
 const previous=current;current=next;
 const oldVolume=audio.volume,generation=fadeGeneration;
 const change=()=>{if(generation!==fadeGeneration)return;audio.pause();audio.src=TRACKS[next];audio.loop=next==='daily';audio.load();audio.volume=targetVolume();safePlay()};
 if(!previous||audio.paused||oldVolume<.01){change();return}
 const start=performance.now();fadeTimer=setInterval(()=>{
  if(generation!==fadeGeneration)return;
  const fraction=Math.min(1,(performance.now()-start)/280);
  audio.volume=Math.max(0,oldVolume*(1-fraction));
  if(fraction>=1){clearInterval(fadeTimer);fadeTimer=null;change()}
 },25);
}
function syncTrack(){const app=document.querySelector('#app');if(!app)return;
 const next=app.querySelector('.ending-screen,.ending-summary')?'ending':'daily';selectTrack(next);
}
function syncSound(){if(!preferences.enabled){cancelFade();audio.pause();return}audio.volume=targetVolume();safePlay()}
const controls=document.createElement('div');controls.id='bgm-controls';controls.setAttribute('aria-label','BGM設定');
const toggle=document.createElement('button');toggle.type='button';toggle.id='bgm-toggle';
const slider=document.createElement('input');slider.type='range';slider.id='bgm-volume';slider.min='0';slider.max='100';slider.step='5';slider.setAttribute('aria-label','BGMの音量');
controls.append(toggle,slider);
function updateControls(){toggle.textContent=preferences.enabled?'♫ BGM':'♫ OFF';toggle.setAttribute('aria-pressed',String(preferences.enabled));slider.disabled=!preferences.enabled;slider.value=preferences.volume}
toggle.addEventListener('click',()=>{unlocked=true;preferences.enabled=!preferences.enabled;persist();updateControls();syncTrack();syncSound()});
slider.addEventListener('input',()=>{preferences.volume=Number(slider.value);persist();audio.volume=targetVolume()});
function mount(){const stage=document.querySelector('.training-stage')||document.querySelector('.title-stage');const target=stage||document.querySelector('.top-actions');if(target&&controls.parentElement!==target)target.append(controls)}
document.addEventListener('click',event=>{if(!event.isTrusted)return;unlocked=true;syncTrack();if(preferences.enabled)safePlay()},true);
document.addEventListener('keydown',()=>{unlocked=true;syncTrack();if(preferences.enabled)safePlay()},{once:true,capture:true});
document.addEventListener('DOMContentLoaded',()=>{
 updateControls();syncTrack();mount();
 const observer=new MutationObserver(()=>{mount();syncTrack()});observer.observe(document.body,{childList:true,subtree:true});
});
})();
