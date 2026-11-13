(()=>{'use strict';
const KEY='lumiere_raising_v1', TOTAL=36, STAT=['知性','武術','魔力','芸術','魅力','社交','体力'];
// 各行動と施設の対応。名称・文章・数値を独立して編集できる。
const PLACES={academy:'王立リーヴェルク学院',knights:'白樫騎士団',artisans:'リーヴェルク職人組合',merchants:'湖畔商人組合',explorers:'王都探索者組合「渡り鴉」',church:'灯火教会'};
const ACT={study:{name:'学問',place:'academy',cost:26,stats:{知性:2},fatigue:18,stress:7,desc:'王立リーヴェルク学院の予備講義で、算術と自然学を学んだ。'},sword:{name:'武術訓練',place:'knights',cost:28,stats:{武術:2,体力:1},fatigue:15,stress:6,desc:'白樫騎士団の教官に木剣と体術の基礎を教わった。'},magic:{name:'魔法学校',place:'academy',cost:34,stats:{魔力:2,知性:1},fatigue:10,stress:5,desc:'王立リーヴェルク学院の魔術予備課程で、照明術式と材料の性質を習った。'},art:{name:'芸術教室',place:'artisans',cost:28,stats:{芸術:2,魅力:1},fatigue:16,stress:1,desc:'職人地区の工房で絵具を混ぜ、湖畔の景色を描いた。'},etiquette:{name:'礼儀作法',place:'church',cost:22,stats:{魅力:2,社交:2},fatigue:18,stress:10,desc:'灯火教会の教育者から挨拶や手紙、相手への配慮を学んだ。'},work:{name:'アルバイト',place:'merchants',cost:-30,stats:{社交:1},fatigue:14,stress:6,desc:'湖畔商人組合の紹介で、市場の商品整理を手伝い報酬を得た。'},adventure:{name:'冒険',place:'explorers',cost:0,stats:{武術:1,体力:1},fatigue:18,stress:8,desc:'「渡り鴉」の監督つきで安全な街道沿いの薬草を採集した。'},rest:{name:'休養',place:'home',cost:0,stats:{},fatigue:-35,stress:-25,desc:'職人地区近くの二階家で読書をし、エルゼン湖のほとりを散歩した。'}};
const BALANCE={fatigue:{mild:35,moderate:60,severe:80,limit:90},stress:{moderate:50,severe:75,limit:95},work:{moderatePay:.78,severePay:.55,minPay:22},adventure:{martialPracticeChance:.4,results:[{name:'大成功',weight:10,min:100,max:150,fatigue:15,stress:0,text:'冒険は大成功！ 貴重な報酬を手に入れた！'},{name:'成功',weight:30,min:40,max:70,fatigue:20,stress:5,text:'冒険は成功！ 頑張った分だけ報酬を得られた。'},{name:'小成功',weight:40,min:10,max:30,fatigue:25,stress:10,text:'大きな成果はなかったけれど、少しだけ報酬を持ち帰れた。'},{name:'失敗',weight:20,min:0,max:0,fatigue:35,stress:20,text:'冒険は失敗……。報酬は得られず、心も体も疲れ切ってしまった。'}]},injury:{threshold:82,base:.015,perFatigue:.003,stressBonus:.008,max:.07}};
const NORMAL_EVENT_CHANCE=.26;
// 画像は未登録でも動作する。年齢別画像と個別位置はここだけで差し替える。
const NOVEL_MEDIA={
 study:{background:'bg_academy_classroom.webp',portrait:'study',place:'王立リーヴェルク学院',lines:['「この問題、昨日より少し分かるようになったよ！」','「知らないことを覚えるのって楽しいね。」']},
 sword:{background:'bg_knight_training.webp',portrait:'training',place:'白樫騎士団の訓練場',lines:['「木剣は重いけど、もう少し頑張ってみる！」','「教官の動きを、今度こそ真似できそう！」']},
 magic:{background:'bg_magic_classroom.webp',portrait:'magic',place:'学院・魔術予備課程',lines:['「小さな光がともった！ 術式って不思議だね。」','「材料の性質を覚えたら、きっと役に立つよね。」']},
 art:{background:'bg_art_workshop.webp',portrait:'art',place:'職人地区の工房',lines:['「見て！ 湖の色、うまく描けた気がする！」','「絵具を混ぜる時間が一番好きかも。」']},
 etiquette:{background:'bg_etiquette_hall.webp',portrait:'etiquette',place:'灯火教会の教室',lines:['「言葉を選ぶだけで、気持ちが伝わるんだね。」','「丁寧なお手紙、書けるようになりたいな。」']},
 work:{background:'bg_market.webp',portrait:'work',place:'リーヴェルクの市場',lines:['「商品をきれいに並べたら、お店の人が喜んでくれた！」','「お仕事って大変。でも少し誇らしいよ。」']},
 adventure:{background:'bg_forest_path.webp',portrait:'adventure',place:'黒樅の森へ続く道',lines:['「この先にはどんな景色があるんだろう？」','「知らない草花がいっぱい！ 案内人に聞いてみよう。」']},
 rest:{background:'bg_home_room.webp',portrait:'rest',place:'職人地区のわが家',lines:['「今日は本を読んで、ゆっくり過ごそうかな。」','「ひと息ついたら、また元気が出てきたよ。」']}
};
const PORTRAIT_STAGES=[{min:12,max:13,folder:'12'},{min:14,max:15,folder:'14'},{min:16,max:18,folder:'16'}];
const scenePortrait=(key,years)=>{const group=PORTRAIT_STAGES.find(x=>years>=x.min&&years<=x.max)||PORTRAIT_STAGES[0];return `assets/ch_lilia_${group.folder}_${NOVEL_MEDIA[key].portrait}.png`};
const scenePortraitFallback=(key,years)=>`assets/ch_lilia_${years>=16?'14':'12'}_${NOVEL_MEDIA[key].portrait}.png`;
const EVENTS=[
{id:'teacher',title:'学院の先生からの賞賛',text:'王立リーヴェルク学院の予備講義で、先生が算術の課題を見て「よく努力しているね」と褒めてくれた。',when:s=>s.last==='study'&&s.stats.知性>=22,choices:[['もっと学びたい',{知性:2,ストレス:3}],['感謝を伝える',{信頼度:2,社交:2}]]},
{id:'workfail',title:'市場で小さな失敗',text:'商業地区の市場で品物の届け先を間違えてしまった。湖畔商人組合の店主は一緒に直そうと言う。',when:s=>s.last==='work',choices:[['きちんと謝り手伝う',{社交:2,疲労:6,信頼度:2}],['気持ちを切り替える',{ストレス:-6,所持金:-15}]]},
{id:'friend',title:'時計塔広場の新しい友人',text:'春の芽吹き市。時計塔のある中央広場で同い年の子が声をかけてきた。',when:s=>s.stats.社交>=15&&includesMonth(s.turn,4),choices:[['一緒に市を歩く',{社交:3,ストレス:-7}],['家で話をする',{信頼度:3,魅力:1}]]},
{id:'dream_young',title:'将来の夢①',text:'【仮文章】大人になったら、どんな毎日が待っているのかな。まだ知らないことがたくさんあると思うと、胸が弾む。',when:s=>age(s.turn)>=13,choices:[['好きな道を応援する',{信頼度:5,ストレス:-5}],['まず勉強が大切だよ',{知性:2,ストレス:4}],['色々な仕事を見てみよう',{社交:2,信頼度:2}]]},
{id:'dream_middle',title:'将来の夢②',text:'【仮文章】好きなことも得意なことも少しずつ増えてきた。でも、これから何を選びたいのか、まだはっきりとは分からない。',when:s=>age(s.turn)>=15,choices:[['焦らず、自分が大切にしたいことを考えよう',{信頼度:5,ストレス:-5}],['選択肢を広げるためにも、勉強を続けよう',{知性:2,ストレス:4}],['興味のある仕事を、実際に見に行こう',{社交:2,信頼度:2}]]},
{id:'dream_mature',title:'将来の夢③',text:'【仮文章】自分で決めることが増える年頃。これからの道を考えると不安もあるけれど、自分の歩幅で進んでいきたい。',when:s=>age(s.turn)>=17,choices:[['自分で選んだ道なら、きっと大切な経験になるよ',{信頼度:5,ストレス:-5}],['今のうちに、必要な知識を身につけておこう',{知性:2,ストレス:4}],['実際に働いている人の話を聞きに行こう',{社交:2,信頼度:2}]]},
{id:'festival',title:'秋の収穫祭',text:'ヴェルデン平野から届いた穀物や果物が中央広場に並び、職人たちの音楽が響く。',when:s=>includesMonth(s.turn,10),choices:[['屋台を楽しむ',{所持金:-20,ストレス:-12,信頼度:2}],['大道芸を観察する',{芸術:2,魅力:1}],['出店を手伝う',{所持金:35,社交:1,疲労:5}]]},
{id:'library',title:'学院図書室の古い記録',text:'王立リーヴェルク学院の図書室で、黒樅の森のエルフが残した植物の記録を見せてもらった。',when:s=>s.stats.知性>=35,choices:[['じっくり読む',{知性:3,疲労:5}],['古い術式を調べる',{魔力:2,知性:1}]]},
{id:'spark',title:'小さな照明術式',text:'魔術予備課程で、小さな照明具に灯りをともす基礎術式が成功した。先生は丁寧な練習の成果だと話す。',when:s=>s.last==='magic'&&s.stats.魔力>=25,choices:[['基礎を磨く',{魔力:3,疲労:6}],['友人に仕組みを説明する',{魅力:2,社交:2}]]},
{id:'gallery',title:'職人地区の作品展',text:'秋のリーヴェルク職人組合の作品展。工房の親方が絵を褒め、展示を勧めてくれた。',when:s=>s.last==='art'&&s.stats.芸術>=24&&includesMonth(s.turn,10),choices:[['出品してみる',{芸術:3,所持金:-10}],['まず友人に見せる',{社交:2,信頼度:3}]]},
{id:'knight',title:'白樫騎士団の見習い大会',text:'秋の訓練場で、白樫騎士団の教官が木剣の模擬試合に誘ってくれた。',when:s=>s.stats.武術>=28&&includesMonth(s.turn,10),choices:[['模擬試合に挑む',{武術:3,疲労:8}],['礼を尽くして学ぶ',{魅力:2,社交:1}]]},
{id:'merchant',title:'湖畔市場の値付け',text:'エルゼン湖の船着き場で、湖畔商人組合の商人が仕入れ品の値付けを試させてくれた。',when:s=>s.last==='work'||s.stats.社交>=30,choices:[['交渉してみる',{所持金:45,社交:2}],['仕入れの仕組みを聞く',{知性:2,社交:1}]]},
{id:'rain',title:'木組みの家で雨宿り',text:'赤茶色の瓦屋根を雨が打つ午後、少女は昔のリーヴェルクの物語を聞きたがっている。',when:s=>s.stress>=28,choices:[['物語を聞かせる',{信頼度:4,ストレス:-8}],['一緒に絵を描く',{芸術:2,ストレス:-6}]]},
{id:'homesick',title:'冬の少し寂しい夜',text:'雪の降る夜、二階家の炉端で「最近ゆっくりお話できていないね」と小さな声がする。',when:s=>(s.trust<=42||s.stress>=65)&&includesMonth(s.turn,12),choices:[['話をじっくり聞く',{信頼度:6,ストレス:-10}],['明日は休もうと約束',{信頼度:3,疲労:-9}]]},
{id:'birthday',title:'灯火祭の贈り物',text:'冬至を迎え、灯火教会の窓に明かりがともる。家族や親しい人にささやかな贈り物を選ぶ日だ。',when:s=>includesMonth(s.turn,12),choices:[['画材を贈る',{所持金:-35,芸術:2,信頼度:3}],['本を贈る',{所持金:-25,知性:2,信頼度:3}],['手紙を贈る',{信頼度:5,ストレス:-4}]]},
{id:'lake',title:'エルゼン湖の湖上祭',text:'夏、エルゼン湖に小舟と灯籠が浮かぶ。湖畔では野外演奏会も開かれている。',when:s=>includesMonth(s.turn,7),choices:[['舟遊びを楽しむ',{所持金:-15,ストレス:-10,信頼度:2}],['野外演奏を聴く',{芸術:2,社交:1}]]},
{id:'spring',title:'春の新学期',text:'王立リーヴェルク学院の予備課程に新しい生徒が集まる。先生が次の勉強について相談してくれた。',when:s=>includesMonth(s.turn,3)&&(s.last==='study'||s.last==='magic'),choices:[['新しい課題に挑戦',{知性:2,疲労:3}],['仲間と一緒に学ぶ',{社交:2,信頼度:2}]]},
{id:'forest',title:'黒樅の森の採集講習',text:'夏の「渡り鴉」の講習会。黒樅の森の入口で、案内人から植物の見分け方を習う。',when:s=>s.last==='adventure'&&includesMonth(s.turn,6),choices:[['採集の技を磨く',{知性:2,体力:1}],['森の話を聞く',{社交:2,ストレス:-3}]]}
];
// 画像・初回／再発生文章の差し替え先を集約する。
const EVENT_MEDIA={teacher:'event_academy_praise.webp',workfail:'event_market_mistake.webp',friend:'event_new_friend.webp',dream_young:'event_dream_young.webp',dream_middle:'event_dream_middle.webp',dream_mature:'event_dream_mature.webp',festival:'event_harvest_festival.webp',library:'event_old_records.webp',spark:'event_light_magic.webp',gallery:'event_art_exhibition.webp',knight:'event_knight_tournament.webp',merchant:'event_market_pricing.webp',rain:'event_rainy_day.webp',homesick:'event_winter_night.webp',birthday:'event_lantern_festival.webp',lake:'event_lake_festival.webp',spring:'event_new_school_year.webp',forest:'event_forest_gathering.webp',injury:'event_training_injury.webp'};
const EVENT_REPEAT_TEXT={festival:null,birthday:null,lake:null,spring:null};
const SEASONAL_EVENTS=new Set(Object.keys(EVENT_REPEAT_TEXT));
const SEASONAL_AGE_LINES={
 festival:['わあ！ おいしそうなものがいっぱい！ どこから見ようかな？','収穫祭って、街のみんなが一緒に楽しめるところがいいよね。','こういうお祭りを支えている人たちも、たくさんいるんだろうね。'],
 lake:['わあ！ 湖に灯りがいっぱい！ きれいだね！','湖に映る灯りって、見ているだけで落ち着くね。','こうして一緒に景色を眺める時間って、きっと大切な思い出になるんだろうな。'],
 birthday:['灯りがいっぱいで、なんだかわくわくするね！','誰かのことを思って贈り物を選ぶ時間も、楽しいんだね。','大切な人に気持ちを伝えるのって、少し照れくさいけど……素敵なことだと思う。'],
 spring:['新しいことが始まるって、なんだかわくわくするね！','今年は、去年よりできることを増やしたいな。','これから学ぶことが、将来につながっていくのかもしれないね。']
};
const DAILY_LINES={
 study:[['今日習ったこと、もっと調べてみたいな！','知らないことが分かるって、なんだか楽しいね。'],['前は難しかった問題も、少しずつ解けるようになってきたよ。','勉強って、いろんなことがつながってるんだね。'],['もっと深く学んでみたいことが、たくさんあるんだ。','知識を身につけるだけじゃなくて、いつか誰かの役に立てたらいいな。']],
 sword:[['今日はいっぱい体を動かしたよ！ 少し強くなれたかな？','剣の持ち方、前より上手になった気がする！'],['力任せに動くだけじゃ、うまくいかないんだね。','前より落ち着いて相手の動きを見られるようになったよ。'],['強くなるだけじゃなくて、誰かを守れる人になりたいな。','訓練を続けてきたこと、無駄じゃなかったって思うんだ。']],
 magic:[['今日の魔法、ちょっとだけ上手にできたよ！','魔法って不思議だね。もっといろんなことを試してみたい！'],['魔力をうまく扱うには、集中することが大切なんだって。','前より魔法の仕組みが分かってきた気がするよ。'],['魔法を使えることには、責任もあるんだよね。','いつか、自分の魔法で誰かの力になれたらいいな。']],
 art:[['今日はね、前より上手に描けた気がする！','絵を描いていると、時間があっという間に過ぎちゃうね。'],['最近、色の組み合わせを考えるのが楽しいんだ。','自分の好きなものを、絵で表現できるようになってきた気がする。'],['いつか私の絵を、たくさんの人に見てもらいたいな。','上手に描くだけじゃなくて、自分らしい絵を描きたいんだ。']],
 etiquette:[['今日の挨拶、ちゃんとできてたかな？','丁寧にお話しするのって、ちょっと難しいね。'],['相手の気持ちを考えて話すことが大事なんだね。','前より落ち着いて人と話せるようになった気がするよ。'],['人とのつながりって、大切にしていきたいな。','言葉ひとつで相手の気持ちが変わることもあるんだね。']],
 work:[['今日のお仕事、ちょっと疲れたけど楽しかった！','自分でお金を稼ぐのって、大変なんだね。'],['前よりお仕事を任せてもらえるようになったんだ。','働くって、誰かの役に立つことでもあるんだね。'],['仕事には大変なこともあるけど、やりがいもあるんだね。','自分に向いている仕事って、どんなものなんだろう。']],
 adventure:[['今日は初めて見るものがいっぱいあったよ！','外の世界って、知らないことだらけだね！'],['前より落ち着いて周りを見られるようになった気がする。','冒険って、勇気だけじゃなくて準備も大切なんだね。'],['知らない世界を見てきたことが、いつか役に立つ気がするんだ。','どんな場所でも、自分で考えて行動できるようになりたいな。']],
 rest:[['今日はゆっくりできたよ！','元気になったら、またいろんなことをしたいな。'],['頑張ることも大切だけど、休むことも必要なんだね。','少し休んだら、頭の中がすっきりしたよ。'],['自分の体調を考えて行動するのも、大切なことだよね。','無理をしすぎずに、できることを続けていきたいな。']]
};
const DAILY_HIGH_LINES={知性:'最近、本を読むと新しい疑問が次々に浮かんでくるんだ。',武術:'訓練を始めた頃の自分と比べると、ずいぶん変わった気がするよ。',魔力:'前は難しかった魔法も、少しずつ自分のものになってきたよ。',芸術:'先生に、私らしい絵になってきたって言ってもらえたんだ！',社交:'いろんな人と話すうちに、人それぞれの考え方があるんだって分かってきたよ。',魅力:'自分らしく振る舞うことが、一番大切なのかもしれないね。',体力:'前ならへとへとになっていたことも、今は少し余裕を持ってできるんだ。'};
const DAILY_ACTION_STATS={study:['知性'],sword:['武術','体力'],magic:['魔力'],art:['芸術'],etiquette:['魅力','社交'],work:['社交'],adventure:['体力'],rest:[]};
const MILESTONE_TURNS={dream_young:6,dream_middle:18,dream_mature:30};
const MILESTONE_IDS=Object.keys(MILESTONE_TURNS);
const NORMAL_EVENTS=EVENTS.filter(e=>!MILESTONE_IDS.includes(e.id));
const ENDINGS=[{name:'騎士',ok:s=>s.stats.武術>=90&&s.stats.体力>=65,score:s=>s.stats.武術*1.4+s.stats.体力*.7,text:'白樫騎士団の一員として、王都の街道を守り、剣だけでなく優しさでも人々を支えた。'},{name:'魔術師',ok:s=>s.stats.魔力>=90&&s.stats.知性>=55,score:s=>s.stats.魔力*1.4+s.stats.知性*.7,text:'王立リーヴェルク学院で研究を続け、照明や材料分析の術式を暮らしに役立てた。'},{name:'学者',ok:s=>s.stats.知性>=95,score:s=>s.stats.知性*1.6+s.stats.魔力*.25,text:'王立リーヴェルク学院の研究者となり、エルゼン湖と王国の古い記録を読み解く日々を送った。'},{name:'芸術家',ok:s=>s.stats.芸術>=95,score:s=>s.stats.芸術*1.6+s.stats.魅力*.25,text:'リーヴェルク職人地区に工房を開き、湖や木組みの街並みを描く作品で人々の心を温めた。'},{name:'商人',ok:s=>s.stats.社交>=95&&s.stats.魅力>=90,score:s=>s.stats.社交*1.35+s.stats.魅力*.6,text:'湖畔商人組合で商いを学び、ヴェルデン平野と王都を結ぶ取引に人々の縁を生かした。'}];
const $=s=>document.querySelector(s), clamp=(n,a=0,b=100)=>Math.max(a,Math.min(b,Number.isFinite(+n)?+n:a));
const money=n=>Math.max(0,Math.floor(Number.isFinite(+n)?+n:0));
const monthRange=t=>{const start=(t%6)*2+1;return [start,start+1]};
const seasonOfMonth=m=>m===12||m<=2?'冬':m<=5?'春':m<=8?'夏':'秋';
const season=t=>{const [a,b]=monthRange(t),first=seasonOfMonth(a),last=seasonOfMonth(b);return first===last?first:`${first}から${last}`};
const period=t=>{const [a,b]=monthRange(t);return `${a}〜${b}月／${season(t)}`};
const includesMonth=(t,m)=>{const [a,b]=monthRange(t);return a<=m&&m<=b};
const age=t=>12+Math.floor(t/6);
function actionDescription(k){
 if(k==='adventure'&&age(s.turn)>=16)return '「渡り鴉」の先輩とグラウ山地へ続く街道を調査し、護衛の補助も経験した。';
 if(k==='adventure'&&age(s.turn)>=14)return '「渡り鴉」の案内人と黒樅の森の入口を探索し、安全な採集依頼を果たした。';
 if(k==='study'&&age(s.turn)>=16)return '王立リーヴェルク学院の公開講義で歴史資料と高度な自然学に取り組んだ。';
 if(k==='magic'&&age(s.turn)>=16)return '学院の認可魔術師から保存と測量の応用術式を学んだ。';
 if(k==='rest')return season(s.turn).includes('冬')?'二階家の炉端で物語を読み、暖かな食卓を囲んで休んだ。':season(s.turn).includes('夏')?'エルゼン湖の涼しい湖畔を散歩し、家でゆっくり休んだ。':'家の庭仕事を手伝い、木組みの家でのんびり過ごした。';
 return ACT[k].baseDesc;
}
for(const [k,a] of Object.entries(ACT)){a.baseDesc=a.desc;Object.defineProperty(a,'desc',{get:()=>actionDescription(k)})}
const initial=name=>({version:1,name:(name||'リリア').trim().slice(0,20)||'リリア',turn:0,stats:{知性:16,武術:12,魔力:11,芸術:20,魅力:17,社交:18,体力:22},growthCarry:Object.fromEntries(STAT.map(k=>[k,0])),gold:200,fatigue:10,stress:8,trust:30,trust100:null,plan:['study','art','work','rest'],history:[],seen:{},seasonYears:{},milestones:{},last:'',rng:24681357,phase:'main',run:null,ending:null,quote:'「新しい暮らし、わくわくするね！」'});
let s=null,timer=null,fast=false,skipMode=false,debugOpen=false;
function random(){s.rng=(Math.imul(1664525,s.rng)+1013904223)>>>0;return s.rng/4294967296}
function load(){try{const raw=JSON.parse(localStorage.getItem(KEY));if(!raw||raw.version!==1||!raw.stats||!Array.isArray(raw.plan))return null;const x=initial(raw.name);x.turn=Math.floor(clamp(raw.turn,0,TOTAL));for(const k of STAT){x.stats[k]=clamp(raw.stats[k]);const carry=Number(raw.growthCarry?.[k]);x.growthCarry[k]=x.stats[k]>=100||!Number.isFinite(carry)||carry<0||carry>=1?0:carry}x.gold=money(raw.gold);x.fatigue=clamp(raw.fatigue);x.stress=clamp(raw.stress);x.trust=clamp(raw.trust);x.plan=Array.from({length:4},(_,i)=>ACT[raw.plan[i]]?raw.plan[i]:'rest');x.history=Array.isArray(raw.history)?raw.history.slice(-100):[];x.seen=raw.seen&&typeof raw.seen==='object'?raw.seen:{};x.last=ACT[raw.last]?raw.last:'';x.rng=(Number(raw.rng)>>>0)||24681357;x.phase=['main','run','event','result','ending'].includes(raw.phase)?raw.phase:'main';const legacyEventDrawn=raw.run&&(raw.run.index>=4||(raw.run.pending&&raw.run.pending!=='injury')||x.history.some(h=>h.turn===x.turn+1&&EVENTS.some(e=>e.id===h.event)));x.run=raw.run&&Array.isArray(raw.run.logs)?{index:Math.floor(clamp(raw.run.index,0,4)),logs:raw.run.logs.slice(0,4),before:raw.run.before||snapshot(x),pending:raw.run.pending||null,debug:!!raw.run.debug,executed:Array.isArray(raw.run.executed)?raw.run.executed.filter(k=>!!ACT[k]).slice(0,4):raw.run.logs.slice(0,4).map((log,i)=>log.includes('休養に変更した')?'rest':Object.keys(ACT).find(k=>log.includes('｜'+ACT[k].name+'：'))||x.plan[i]),normalDrawn:typeof raw.run.normalDrawn==='boolean'?raw.run.normalDrawn:!!legacyEventDrawn}:null;x.ending=raw.ending||null;x.quote=String(raw.quote||x.quote).slice(0,200);if(['run','event','result'].includes(x.phase)&&!x.run)x.phase='main';if(x.phase==='event'&&!x.run.pending)x.phase='run';if(x.turn>=TOTAL&&!['ending','result'].includes(x.phase))x.phase='ending';return x}catch{return null}}
const legacyLoad=load;
load=function(){const x=legacyLoad();if(!x)return null;let raw={};try{raw=JSON.parse(localStorage.getItem(KEY))||{}}catch{};
 x.seasonYears=raw.seasonYears&&typeof raw.seasonYears==='object'?{...raw.seasonYears}:{};
 for(const id of SEASONAL_EVENTS)if(!Number.isInteger(x.seasonYears[id])){const past=x.history.filter(h=>h.event===id);if(past.length)x.seasonYears[id]=Math.floor((past.at(-1).turn-1)/6);else if(x.seen[id])x.seasonYears[id]=Math.floor(x.turn/6)}
 x.milestones=raw.milestones&&typeof raw.milestones==='object'?{...raw.milestones}:{};
 if(!raw.milestones){for(const [id,trigger] of Object.entries(MILESTONE_TURNS))if(x.turn>trigger&&!x.run?.pending)x.milestones[id]=true;if(x.seen.dream)x.milestones.dream_young=true}
 if(x.run){x.run.milestoneDrawn=typeof raw.run?.milestoneDrawn==='boolean'?raw.run.milestoneDrawn:false;x.run.eventPage=Math.max(0,Math.floor(Number(raw.run?.eventPage)||0));x.run.eventMode=['story','choices','outcome'].includes(raw.run?.eventMode)?raw.run.eventMode:'story';x.run.eventChoice=Number.isInteger(raw.run?.eventChoice)?raw.run.eventChoice:null;x.run.eventEffectApplied=raw.run?.eventEffectApplied===true||x.run.eventMode==='outcome';if(x.run.pending==='dream')x.run.pending='dream_young';if(x.run.pending&&MILESTONE_IDS.includes(x.run.pending))x.run.milestoneDrawn=true}
 return x};
function save(){if(!s)return;try{localStorage.setItem(KEY,JSON.stringify(s))}catch{alert('このブラウザでは保存できません。空き容量やプライベートモードをご確認ください。')}}
function snapshot(x=s){return {stats:{...x.stats},gold:x.gold,fatigue:x.fatigue,stress:x.stress,trust:x.trust}}
function delta(a,b){const out=[];for(const k of STAT)if(a.stats[k]!==b.stats[k])out.push([k,b.stats[k]-a.stats[k]]);for(const [k,key] of [['所持金','gold'],['疲労','fatigue'],['ストレス','stress'],['信頼度','trust']])if(a[key]!==b[key])out.push([k,b[key]-a[key]]);return out}
function change(e){for(const [k,v] of Object.entries(e)){if(STAT.includes(k)){s.stats[k]=clamp(s.stats[k]+v);if(s.stats[k]>=100)s.growthCarry[k]=0}else if(k==='所持金')s.gold=money(s.gold+v);else if(k==='疲労')s.fatigue=clamp(s.fatigue+v);else if(k==='ストレス')s.stress=clamp(s.stress+v);else if(k==='信頼度'){const previous=s.trust;s.trust=clamp(s.trust+v);if(previous<100&&s.trust===100&&!s.trust100&&s.turn<TOTAL-1&&s.phase!=='ending')s.trust100={status:'pending',age:age(s.turn),page:0}}}}
// 通常育成だけに使用。既存の疲労・ストレス補正後の整数成長量へ適用する。
function applyTrainingGrowth(stat,gain){if(gain<=0)return;if(s.stats[stat]>=100){s.growthCarry[stat]=0;return}
 const rate=s.stats[stat]>=80?.5:s.stats[stat]>=50?.75:1;
 const total=gain*rate+s.growthCarry[stat],whole=Math.floor(total);
 s.stats[stat]=clamp(s.stats[stat]+whole);
 s.growthCarry[stat]=s.stats[stat]>=100?0:total-whole;
}
function fatigueGrade(){return s.fatigue>=BALANCE.fatigue.limit?'限界':s.fatigue>=BALANCE.fatigue.severe?'重度':s.fatigue>=BALANCE.fatigue.moderate?'中度':s.fatigue>=BALANCE.fatigue.mild?'軽度':'良好'}
function fatigueFactor(){return s.fatigue>=BALANCE.fatigue.severe?.45:s.fatigue>=BALANCE.fatigue.moderate?.7:s.fatigue>=BALANCE.fatigue.mild?.9:1}
function stressFactor(){return s.stress>=BALANCE.stress.severe?.65:s.stress>=BALANCE.stress.moderate?.85:1}
function workIncome(){return Math.max(BALANCE.work.minPay,Math.round(-ACT.work.cost*(s.fatigue>=BALANCE.fatigue.severe?BALANCE.work.severePay:s.fatigue>=BALANCE.fatigue.moderate?BALANCE.work.moderatePay:1)*stressFactor()))}
function adventureResult(){const roll=random()*100;let cumulative=0;const tiers=BALANCE.adventure.results;const tier=tiers.find(item=>(cumulative+=item.weight)>roll)||tiers.at(-1);return {...tier,gold:tier.min===tier.max?tier.min:tier.min+Math.floor(random()*(tier.max-tier.min+1))}}
function injuryChance(k){if(!['sword','adventure'].includes(k)||s.fatigue<BALANCE.injury.threshold)return 0;const base=BALANCE.injury.base+(s.fatigue-BALANCE.injury.threshold)*BALANCE.injury.perFatigue+(s.stress>=BALANCE.stress.severe?BALANCE.injury.stressBonus:0);return Math.min(BALANCE.injury.max,base*(k==='adventure'?1:.7))}
function planEstimate(){let balance=s.gold;const deficits=[];for(const [i,k] of s.plan.entries()){const a=ACT[k];if(a.cost>0){if(balance<a.cost){deficits.push(i+1);continue}balance-=a.cost}else if(k==='work')balance+=workIncome()}return {balance,deficits}}
function effects(k){const a=ACT[k];return `${a.cost>0?'費用 '+a.cost:a.cost<0?'収入 '+(-a.cost):'無料'}G · ${Object.entries(a.stats).map(([x,v])=>x+'+'+v).join(' / ')||'回復'} · 疲労${a.fatigue>0?'+':''}${a.fatigue}`}
function escapeHtml(v){return String(v).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]))}
function topButtons(){ $('#saveBtn').hidden=!s;$('#homeBtn').hidden=!s;$('#saveBtn').onclick=()=>{save();alert('育成記録を保存しました。')};$('#homeBtn').onclick=()=>{clearTimeout(timer);s.phase=s.phase==='run'||s.phase==='event'?s.phase:s.phase;save();s=null;render()}}
function render(){topButtons();if(!s)return title();if(s.phase==='main')main();else if(s.phase==='run')running();else if(s.phase==='event')eventView();else if(s.phase==='result')result();else ending()}
// 将来オープニングを挿入するときは、名前確定後の遷移をこの関数で差し替える。
function beginNewGameWithName(name){s=initial(name);s.phase='opening';s.opening={page:0,version:3};save();render()}
function title(){
 const available=!!load();
 $('#app').innerHTML=`<section class="title-screen" aria-label="星灯りの育成物語 タイトル画面"><div class="title-stage"><img class="title-art" src="assets/title_screen.webp?v=63" alt="星灯りの育成物語。少女と綴る、六年間の物語。" draggable="false"><button type="button" class="title-hit title-hit-new" id="newBtn" aria-label="はじめから"></button><button type="button" class="title-hit title-hit-continue" id="continueBtn" aria-label="つづきから"></button><p class="title-message" id="titleMessage" role="status" aria-live="polite"></p></div><dialog id="nameDialog" class="name-dialog" aria-labelledby="nameDialogTitle"><form id="nameForm" novalidate><h2 id="nameDialogTitle">この子の名前を決めてください</h2><label for="girlName">少女の名前</label><input id="girlName" name="girlName" type="text" maxlength="20" value="リリア" autocomplete="off" required><p class="name-error" id="nameError" role="alert" aria-live="polite"></p><div class="name-dialog-buttons"><button type="button" id="nameBack">もどる</button><button type="submit" class="name-confirm">この名前で始める</button></div></form></dialog></section>`;
 const dialog=$('#nameDialog'),input=$('#girlName'),error=$('#nameError');
 $('#newBtn').onclick=()=>{error.textContent='';input.value='リリア';dialog.showModal();input.focus();input.select()};
 $('#nameBack').onclick=()=>dialog.close();
 $('#nameForm').onsubmit=event=>{event.preventDefault();const name=input.value.trim();if(!name){error.textContent='名前を入力してください。';input.focus();return}if(available&&!confirm('現在の記録が上書きされます。新しい育成を始めますか？'))return;dialog.close();beginNewGameWithName(name)};
 input.oninput=()=>{error.textContent=''};
 $('#continueBtn').onclick=()=>{const saved=load();if(!saved){$('#titleMessage').textContent='保存された育成記録がありません。';return}s=saved;render();if(s?.phase==='run')scheduleStep()};
}
function bar(k,v){return `<div class="stat-row"><span>${k}</span><div class="bar"><div class="fill" style="width:${v}%"></div></div><strong>${v}</strong></div>`}
function main(){const fee=s.plan.reduce((sum,k)=>sum+Math.max(0,ACT[k].cost),0),income=s.plan.reduce((sum,k)=>sum+Math.max(0,-ACT[k].cost),0);let balance=s.gold;let deficits=[];s.plan.forEach((k,i)=>{balance-=ACT[k].cost;if(balance<0){deficits.push(i+1);balance=0}});const high=s.fatigue>=65||s.stress>=70;$('#app').innerHTML=`<div class="dashboard"><div class="side-stack"><section class="panel identity"><div class="portrait">✧</div><h2>${escapeHtml(s.name)}</h2><p>好奇心旺盛な、城下町の少女</p><div class="date-line"><div><strong>${age(s.turn)}歳</strong><small>現在の年齢</small></div><div><strong>${season(s.turn)}</strong><small>季節</small></div><div><strong>${s.turn+1} / 36</strong><small>ターン</small></div></div><p style="margin-top:14px">残り ${TOTAL-s.turn} ターン</p></section><section class="panel"><div class="panel-head"><h2>生活のようす</h2></div><div class="panel-pad"><div class="resource-list"><div class="resource"><span>所持金</span><strong>${s.gold} G</strong></div><div class="resource"><span>信頼度</span><strong>${s.trust}<small>/ 100</small></strong></div><div class="resource"><span>疲労</span><strong>${s.fatigue}<small>/ 100</small></strong></div><div class="resource"><span>ストレス</span><strong>${s.stress}<small>/ 100</small></strong></div></div></div></section></div><div class="main-stack"><section class="panel"><div class="panel-head"><h2>能力の記録</h2><span class="tag">最大 100</span></div><div class="panel-pad stats">${STAT.map(k=>bar(k,s.stats[k])).join('')}</div></section><section class="panel"><div class="panel-head"><h2>2か月の予定</h2><span class="turn-badge">第${s.turn+1}ターン</span></div><div class="panel-pad"><p class="section-note">4つの行動を自由に組み合わせましょう。同じ行動も選べます。次のターンにも予定を引き継ぎます。</p><div class="schedule-grid">${s.plan.map((k,i)=>`<div class="slot"><label for="slot${i}">予定 ${i+1} / 4</label><select id="slot${i}" data-slot="${i}">${Object.entries(ACT).map(([id,a])=>`<option value="${id}" ${k===id?'selected':''}>${a.name}</option>`).join('')}</select><p class="effect" id="effect${i}">${effects(k)}</p></div>`).join('')}</div><div class="cost"><div><strong id="estimate">費用 ${fee} G ／ 収入 ${income} G</strong><small>行動は上から順番に実行されます。所持金 ${s.gold} G</small></div><span id="estimateBalance" class="tag">見込み残高 ${balance} G</span></div><div id="planWarning">${deficits.length?`<div class="warning">予定 ${deficits.join('・')} はその時点で資金不足になる見込みです。実行時に無料の休養へ切り替わります。</div>`:''}</div>${high?'<div class="warning">疲労またはストレスが高い状態です。成長効率が落ち、武術・冒険中の体調不良の危険が増します。休養をおすすめします。</div>':''}<div class="actions"><button id="restPlan">休養中心にする</button><button class="primary" id="startTurn">育成開始　→</button></div></div></section><div class="speech">${escapeHtml(s.quote)}</div></div></div><div style="text-align:right"><button class="debug-toggle" id="debugToggle">開発・確認用設定 ${debugOpen?'▲':'▼'}</button></div><div id="debugMount"></div>`;document.querySelectorAll('[data-slot]').forEach(el=>el.onchange=()=>{s.plan[+el.dataset.slot]=el.value;save();main()});$('#restPlan').onclick=()=>{s.plan=['rest','work','rest','rest'];save();main()};$('#startTurn').onclick=startTurn;$('#debugToggle').onclick=()=>{debugOpen=!debugOpen;main()};if(debugOpen)renderDebug()}
function renderDebug(){const options=Object.keys(ACT).map(k=>`<option value="${k}">${ACT[k].name}</option>`).join('');$('#debugMount').innerHTML=`<section class="debug-panel"><strong>デバッグ専用（ゲームバランス検証）</strong><p class="hint">変更は現在の記録に反映されます。乱数シードを固定すると同じ条件でイベントを再現できます。</p><div class="debug-grid"><label>経過ターン<input type="number" id="dturn" min="0" max="35" value="${s.turn}"></label>${STAT.map(k=>`<label>${k}<input type="number" min="0" max="100" data-stat="${k}" value="${s.stats[k]}"></label>`).join('')}${[['gold','所持金'],['fatigue','疲労'],['stress','ストレス'],['trust','信頼度'],['rng','乱数シード']].map(([k,n])=>`<label>${n}<input type="number" id="d${k}" value="${s[k]}"></label>`).join('')}</div><div class="debug-actions"><button id="applyDebug">数値を反映</button><button id="testEvent">イベントを表示</button><select id="eventChoice" style="width:auto">${EVENTS.map(e=>`<option value="${e.id}">${e.title}</option>`).join('')}</select><button id="testEnding">エンディング判定</button></div></section>`;$('#applyDebug').onclick=()=>{s.turn=Math.floor(clamp(+$('#dturn').value,0,35));document.querySelectorAll('[data-stat]').forEach(e=>s.stats[e.dataset.stat]=clamp(+e.value));s.gold=money(+$('#dgold').value);for(const k of ['fatigue','stress','trust'])s[k]=clamp(+$('#d'+k).value);s.rng=(Number($('#drng').value)>>>0)||1;save();main()};$('#testEvent').onclick=()=>{const e=EVENTS.find(x=>x.id===$('#eventChoice').value);s.run={index:4,logs:[],before:snapshot(),pending:e.id,debug:true};s.phase='event';save();render()};$('#testEnding').onclick=()=>{finish(true)}}
function startTurn(){if(s?.phase!=='main'||s.notice||s.turning||(s.potion?.turn===s.turn&&['speech','offer','feedback'].includes(s.potion.stage)))return;s.phase='run';s.run={index:0,logs:[],executed:[],normalDrawn:false,milestoneDrawn:false,eventPage:0,eventMode:'story',eventChoice:null,eventEffectApplied:false,before:snapshot(),pending:null};fast=false;skipMode=false;save();render();scheduleStep()}
function queueEvent(id){s.run.pending=id;s.run.eventPage=0;s.run.eventMode='story';s.run.eventChoice=null;s.run.eventEffectApplied=false;s.phase='event';save();render()}
function milestoneEvent(){if(s.run.milestoneDrawn)return false;s.run.milestoneDrawn=true;const id=MILESTONE_IDS.find(key=>s.turn>=MILESTONE_TURNS[key]&&!s.milestones[key]);if(id){queueEvent(id);return true}save();return false}
function normalEventLottery(){if(s.run.normalDrawn)return false;s.run.normalDrawn=true;const year=Math.floor(s.turn/6);const eligible=NORMAL_EVENTS.filter(e=>(SEASONAL_EVENTS.has(e.id)?s.seasonYears[e.id]!==year:!s.seen[e.id])&&s.run.executed.some(k=>e.when({...s,last:k})));if(eligible.length&&random()<NORMAL_EVENT_CHANCE){const e=eligible[Math.floor(random()*eligible.length)];queueEvent(e.id);return true}save();return false}
function finishActions(){if(s?.phase!=='run'||s.run.index!==4||s.run.pending)return;if(milestoneEvent())return;if(normalEventLottery())return;save();running();clearTimeout(timer);timer=setTimeout(completeTurn,skipMode?25:fast?850:1800)}
function scheduleStep(){clearTimeout(timer);if(s?.phase!=='run')return;if(s.run.index>=4){finishActions();return}timer=setTimeout(step,skipMode?35:fast?900:2200)}
function step(){
 if(s.phase!=='run')return;
 const i=s.run.index,k=s.plan[i],a=ACT[k],before=snapshot();
 let log='';
 const forced=s.fatigue>=BALANCE.fatigue.limit||s.stress>=BALANCE.stress.limit;
 const forcedReason=s.fatigue>=BALANCE.fatigue.limit?'疲労':'心身の負担';
 if(k!=='rest'&&forced){
  change({疲労:ACT.rest.fatigue,ストレス:ACT.rest.stress});
  log=`${i+1}枠目｜${a.name}：${forcedReason}が限界のため、無料の休養に変更した。`;
  s.last='rest';
 }else if(a.cost>0&&s.gold<a.cost){
  change({疲労:ACT.rest.fatigue,ストレス:ACT.rest.stress});
  log=`${i+1}枠目｜${a.name}：教育費${a.cost}Gに対して所持金が不足し、無料の休養に変更した。`;
  s.last='rest';
 }else{
  if(a.cost>0)s.gold=money(s.gold-a.cost);
  else if(k==='work')s.gold=money(s.gold+workIncome());
  const adventure=k==='adventure'?adventureResult():null;
  if(adventure)s.gold=money(s.gold+adventure.gold);
  const factor=fatigueFactor()*stressFactor();
  for(const [stat,v] of Object.entries(a.stats)){
   const adventurePractice=k==='adventure'&&stat==='武術'&&random()>=BALANCE.adventure.martialPracticeChance;
   const gain=adventurePractice?0:v===1?(factor>=.7?1:0):Math.max(0,Math.round(v*factor));
   applyTrainingGrowth(stat,gain);
  }
  const fatigue=adventure?adventure.fatigue:a.fatigue>0?Math.max(1,a.fatigue-Math.floor(s.stats.体力/25)):a.fatigue;
  change({疲労:fatigue,ストレス:adventure?adventure.stress:a.stress+(k==='sword'?2:0)});
  if(k==='art')change({ストレス:-3});
  if(k==='rest')change({信頼度:1});
  if(k==='sword'&&s.fatigue>52)change({ストレス:3});
  s.last=k;
  const changes=delta(before,snapshot()).map(([n,v])=>`${n}${v>0?'+':''}${v}`).join('、');
  log=`${i+1}枠目｜${a.name}：${adventure?adventure.text:a.desc} ${changes}`;
  const risk=injuryChance(k);
  if(risk>0&&random()<risk){
   s.run.logs.push(log);s.run.executed.push(s.last);s.run.index++;queueEvent('injury');return;
  }
 }
 s.run.logs.push(log);s.run.executed.push(s.last);s.run.index++;if(s.run.index===4){finishActions();return}save();running();scheduleStep()}
function sceneKey(){if(!s.run?.index)return ACT[s.plan[0]]?s.plan[0]:'rest';return ACT[s.last]?s.last:ACT[s.plan[s.run.index-1]]?s.plan[s.run.index-1]:'rest'}
function novelLine(k){const lines=NOVEL_MEDIA[k].lines,log=s.run.logs[s.run.index-1]||'';if(log.includes('変更した'))return '「少し無理をしていたみたい。今日はゆっくり休むね。」';if(s.fatigue>=80)return '「ちょっと疲れちゃった。休みながら頑張りたいな……。」';if(s.stress>=75)return '「今日はうまく集中できないかも……。」';return lines[(s.turn+s.run.index-1+lines.length)%lines.length]}
function imageOrFallback(url,cls,fallback=''){return `<img class="${cls}" src="${escapeHtml(url)}" data-fallback="${escapeHtml(fallback)}" alt="" onerror="if(this.dataset.fallback){const next=this.dataset.fallback;this.dataset.fallback='';this.src=next}else{this.hidden=true}" loading="eager">`}
function running(){const r=s.run,k=sceneKey(),scene=NOVEL_MEDIA[k],present=r.index>0;const first=monthRange(s.turn)[0];$('#app').innerHTML=`<section class="novel-screen" aria-label="育成中ノベル画面"><div class="novel-stage scene-${k}"><div class="novel-backdrop"></div>${imageOrFallback('assets/'+scene.background,'novel-background') }<div class="novel-character">${imageOrFallback(scenePortrait(k,age(s.turn)),'novel-portrait',scenePortraitFallback(k,age(s.turn)))}</div><div class="novel-location">${escapeHtml(scene.place)} ・ ${first}〜${first+1}月</div><div class="novel-controls"><button id="novelFast" class="novel-control" aria-pressed="${fast&&!skipMode}">▶▶ ${fast&&!skipMode?'通常速度':'早送り'}</button><button id="novelSkip" class="novel-control" aria-pressed="${skipMode}">⏭ ${skipMode?'スキップ中':'スキップ'}</button></div><div class="novel-dialogue"><div class="novel-name">${escapeHtml(s.name)}</div><p aria-live="polite">${escapeHtml(present?novelLine(k):'「さて、今度の2か月も頑張ろう！」')}</p><span class="novel-counter">${Math.min(r.index+1,4)} / 4</span></div></div></section>`;$('#novelFast').onclick=()=>{if(skipMode){skipMode=false;fast=true}else fast=!fast;running();scheduleStep()};$('#novelSkip').onclick=()=>{skipMode=true;fast=false;running();scheduleStep()}}
function eventView(){
 const id=s.run.pending,injury=id==='injury',e=EVENTS.find(x=>x.id===id);
 if(!injury&&!e){s.phase='run';s.run.pending=null;save();render();scheduleStep();return}
 const story=window.ELSEN_EVENT_STORY?.[id];
 const title=injury?'訓練中の体調不良':story?.title||e.title;
 const repeat=SEASONAL_EVENTS.has(id)&&Number.isInteger(s.seasonYears[id]);
 const description=injury?'疲れがたまったまま頑張りすぎて、足を痛めてしまった。治療と休養が必要だ。大きな後遺症は残らない。':repeat&&EVENT_REPEAT_TEXT[id]?EVENT_REPEAT_TEXT[id]:story?.description||e.text;
 const choices=injury?[['医師の治療を受ける',{所持金:-45,疲労:-35,ストレス:-15,信頼度:3}],['家でゆっくり休む',{疲労:-27,ストレス:-10,信頼度:2}]]:e.choices;
 const resolveName=text=>String(text).replace(/\{\{name\}\}/g,s.name);
 const ageLine=SEASONAL_AGE_LINES[id]?.[Math.min(2,Math.max(0,Math.floor((age(s.turn)-12)/2)))];
 const opening=injury?['ちょっと無理しちゃったみたい……。']:(story?.opening||['どうしたらいいと思う？']).map((line,i)=>i===0&&ageLine?ageLine:line);
 const outcome=injury?'治療と休養を選び、少女は少しずつ落ち着きを取り戻した。':story?.choices[s.run.eventChoice]?.outcome||'選んだ行動を終えた。';
 const reactions=injury?['ありがとう。少し休んだらまた頑張れるよ。']:story?.choices[s.run.eventChoice]?.reactions||['話を聞いてくれて、うれしい！'];
 const frames=s.run.eventMode==='outcome'?[...endingPages(outcome).map(text=>({text,speaker:false})),...reactions.map(text=>({text,speaker:true}))]:[...endingPages(description).map(text=>({text,speaker:false})),...opening.map(text=>({text,speaker:true}))];
 const page=Math.min(s.run.eventPage||0,frames.length),selecting=s.run.eventMode==='choices',isOutcome=s.run.eventMode==='outcome';
 const current=frames[Math.min(page,frames.length-1)];
 const speaker=!selecting&&current.speaker?s.name:'';
 const image=EVENT_MEDIA[id],art=image?imageOrFallback('assets/'+image,'event-art'):'';
 $('#app').innerHTML=`<section class="novel-screen event-screen" aria-label="イベントノベル画面"><div class="novel-stage event-stage"><div class="novel-backdrop event-backdrop"></div>${art}<div class="novel-location event-location">${escapeHtml(title)}</div>${selecting?`<div class="event-choices" aria-label="選択肢">${choices.map(([label],i)=>`<button data-choice="${i}">${i+1}. ${escapeHtml(story?.choices[i]?.label||label)}</button>`).join('')}</div>`:''}<div class="novel-dialogue event-dialogue">${speaker?`<div class="novel-name">${escapeHtml(speaker)}</div>`:''}<p>${escapeHtml(resolveName(selecting?'どんな言葉をかけますか？':current.text))}</p>${!selecting?`<button id="eventAdvance" class="event-advance" aria-label="次の文章へ">${page===frames.length-1?(isOutcome?'育成へ戻る':'選択肢へ'):'次へ ▾'}</button>`:''}</div></div></section>`;
 if(!selecting){const advance=()=>{if(s?.phase!=='event'||s.run?.pending!==id||s.run.eventPage!==page||s.run.eventMode!==(isOutcome?'outcome':'story'))return;
  if(isOutcome&&page===frames.length-1){s.run.pending=null;s.phase=s.run.debug?'main':'run';if(s.run.debug)s.run=null;save();render();if(s.phase==='run')scheduleStep();return}
  if(!isOutcome&&page===frames.length-1){s.run.eventMode='choices';s.run.eventPage=0}else s.run.eventPage=page+1;
  save();render()};$('#eventAdvance').onclick=advance;$('.event-stage').onclick=event=>{if(event.target.closest('button'))return;advance()};return}
 document.querySelectorAll('[data-choice]').forEach(b=>b.onclick=()=>{
  if(s?.phase!=='event'||s.run?.pending!==id||s.run.eventMode!=='choices'||s.run.eventEffectApplied)return;
  const index=+b.dataset.choice,choice=choices[index];if(!choice)return;
  s.run.eventEffectApplied=true;s.run.eventChoice=index;s.run.eventMode='outcome';s.run.eventPage=0;
  change(choice[1]);s.history.push({turn:s.turn+1,event:id,choice:story?.choices[index]?.label||choice[0]});
  if(SEASONAL_EVENTS.has(id))s.seasonYears[id]=Math.floor(s.turn/6);
  if(MILESTONE_IDS.includes(id))s.milestones[id]=true;
  if(id!=='injury')s.seen[id]=true;
  s.quote=`「${resolveName(reactions.at(-1))}」`;
  save();render()
 })
}
const EARLY_TRUST_LINES={
 low:['まだちょっと緊張するけど……少しずつ慣れていけたらいいな。','このお家での暮らし、まだ知らないことがいっぱいあるね。','えへへ……なんだか、まだ少し照れくさいね。'],
 warming:['少しずつ、このお家にも慣れてきた気がするよ。','一緒に過ごす時間が増えて、なんだか安心するようになってきたよ。','最初は緊張してたけど、最近は毎日が楽しみなんだ。']
};
const LOW_TRUST_LINES=['わたしの気持ちも、たまには聞いてほしいな。','最近、ちょっとだけ寂しいなって思うことがあるんだ。','もっといろんなこと、一緒にお話しできたらいいのにな。'];
// 直前の実行済み4枠から主な育成内容を決める。イベント抽選の乱数は使用しない。
function dailyQuote(){
 if(s.fatigue>=70)return '「少し疲れちゃった。次は休む時間もほしいな……」';
 if(s.stress>=65)return '「最近、ちょっと気持ちが落ち着かないの。」';
 const counts={};for(const key of s.run?.executed||[])if(DAILY_LINES[key])counts[key]=(counts[key]||0)+1;
 const before=s.run?.before?.stats||{};
 const options=Object.keys(counts).map(key=>({key,count:counts[key],gain:DAILY_ACTION_STATS[key].reduce((sum,stat)=>sum+Math.max(0,(s.stats[stat]||0)-(before[stat]||0)),0)}));
 const maxCount=Math.max(0,...options.map(x=>x.count));
 const most=options.filter(x=>x.count===maxCount);
 const maxGain=Math.max(0,...most.map(x=>x.gain));
 const tied=most.filter(x=>x.gain===maxGain);
 const key=tied.length?tied[(s.turn-1)%tied.length].key:'rest';
 const stage=Math.min(2,Math.max(0,Math.floor((age(s.turn)-12)/2)));
 const base=DAILY_LINES[key][stage];
 const proficiency=Math.max(0,...DAILY_ACTION_STATS[key].map(stat=>s.stats[stat]||0));
 const candidates=proficiency>=50?[base[1],base[0],base[1]]:[...base];
 candidates.push(...Object.entries(DAILY_HIGH_LINES).filter(([stat])=>s.stats[stat]>=80).map(([,line])=>line));
 if(s.trust>=75)candidates.push('あなたと一緒なら、どんな未来も楽しみ！');
 if(s.turn<=6){
  if(s.trust<=30)candidates.push(...EARLY_TRUST_LINES.low);
  else if(s.trust<=54)candidates.push(...EARLY_TRUST_LINES.warming);
 }else if(s.trust<=30)candidates.push(...LOW_TRUST_LINES);
 let index=(s.turn-1)%candidates.length;
 if(`「${candidates[index]}」`===s.quote)index=(index+1)%candidates.length;
 return `「${candidates[index]}」`;
}
function completeTurn(){if(s.phase!=='run'||s.run.index!==4||s.run.pending)return;if(!s.run.normalDrawn){finishActions();return}const oldTurn=s.turn;
 // 行動・イベント終了後、結果画面へ移る際に1回だけ適用する。
 const fatiguePenalty=s.fatigue>=70,stressPenalty=s.stress>=65;
 if(fatiguePenalty||stressPenalty){change({信頼度:-2*(Number(fatiguePenalty)+Number(stressPenalty))});if(fatiguePenalty)s.run.logs.push('信頼度：疲労が続き、心に少し距離ができた。');if(stressPenalty)s.run.logs.push('信頼度：ストレスが重なり、気持ちに余裕がなくなった。')}
 s.turn++;s.quote=dailyQuote();s.phase='result';s.history.push({turn:oldTurn+1,summary:s.run.logs.slice()});s.history=s.history.slice(-100);save();render()}
function result(){const before=s.run.before,after=snapshot(),changes=delta(before,after);$('#app').innerHTML=`<section class="panel center"><div class="panel-pad"><span class="kicker">TURN COMPLETE · ${s.turn} / 36</span><h2 class="phase-heading">第${s.turn}ターンの育成結果</h2><p class="section-note">${s.turn>=TOTAL?'6年間の育成が終わりました。':'2か月が過ぎました。次の季節へ進みましょう。'}</p><div class="log-list">${s.run.logs.map(x=>`<div class="log-entry">${escapeHtml(x)}</div>`).join('')}</div><h2>今回の変化</h2><div class="result-grid">${changes.length?changes.map(([k,v])=>`<div class="delta"><span>${k}</span><strong class="${v>=0?'positive':'negative'}">${v>0?'+':''}${v}</strong></div>`).join(''):'<p>数値の変化はありませんでした。</p>'}</div><div class="speech">${escapeHtml(s.quote)}</div><div class="actions"><button class="primary" id="nextTurn">${s.turn>=TOTAL?'18歳の未来を見る':'次のターンへ →'}</button></div></div></section>`;$('#nextTurn').onclick=()=>{if(s.turn>=TOTAL)finish(false);else{s.phase='main';s.run=null;save();render()}}}
function pickEnding(){const candidates=ENDINGS.filter(e=>e.ok(s)).sort((a,b)=>b.score(s)-a.score(s));return candidates[0]||{name:'一般市民',text:'王都リーヴェルクで穏やかな暮らしを始めた。石畳の通りで友人たちと笑い合い、好きなことを大切にしながら、自分らしい毎日を紡いだ。'}}
function finish(debug){const e=pickEnding();s.ending={name:e.name,text:e.text,debug:!!debug,page:0,pageLayoutVersion:2};s.phase='ending';s.run=null;save();render()}
// 文章の末尾を失わないよう句点区切りで短いページに分ける。ページ位置のみ保存する。
function endingPages(text,limit=83){const sentences=String(text).match(/[^。！？]+[。！？]?/g)||[text];const pages=[];let chunk='';for(const sentence of sentences){if(chunk&&chunk.length+sentence.length>limit){pages.push(chunk);chunk=''}chunk+=sentence}if(chunk)pages.push(chunk);return pages}
const TRUST_EPILOGUE={high:'「ねえ、覚えてる？ はじめてこの家に来た日のこと。最初はちょっと緊張してたけど……今は、ここが大切な居場所だって思ってる。六年間、ずっとそばにいてくれてありがとう。これからも、よろしくね！」',middle:'「六年間、いろんなことがあったね。まだうまく言えないこともあるけど、ここで教えてもらったことは忘れないよ。今までありがとう。これからも、少しずつ頑張っていくね。」',low:'「六年間、ありがとう。本当は、もっと話したかったこともあるんだ。でも、なかなか言い出せなくて……。いつか、ちゃんと自分の気持ちを話せるようになれたらいいな。」'};
const TRUST_100_EPILOGUE='いつかふたりで見上げた、あの夜の星空。少女は今、自分の選んだ道へと歩き出していく。あの日の星灯りのように、ともに過ごした時間は、これからも彼女の心を優しく照らし続けるだろう。';
function endingSequence(jobName,legacy=false){const story=window.ELSEN_ENDING_STORY,job=story?.jobs?.[jobName]||story?.jobs?.['一般市民'];if(!story||!job)return[];const sequence=[];const limit=legacy?83:115;const append=(stage,title,image,text,type='narration')=>{for(const part of endingPages(text,limit))sequence.push({stage,title,image,type,text:part})};const appendLines=(stage,title,image,lines)=>{if(legacy){for(const line of lines)sequence.push({stage,title,image,type:'dialogue',speaker:'{{name}}',text:line})}else appendDialogue(stage,title,image,lines.join(''))};const appendDialogue=(stage,title,image,text)=>{for(const part of endingPages(text,limit))sequence.push({stage,title,image,type:'dialogue',speaker:'{{name}}',text:part})};append('prologue',story.prologue.title,story.prologue.image,story.prologue.body);appendLines('prologue',story.prologue.title,story.prologue.image,story.prologue.lines);append('career',job.title,job.image,job.body);appendLines('career',job.title,job.image,job.lines);append('later','数年後',job.image,job.later);sequence.push({stage:'closing',title:job.title,image:job.image,type:'closing',text:job.closing});append('epilogue',story.epilogue.title,story.epilogue.image,story.epilogue.body);
 const trustLine=s.trust>=75?TRUST_EPILOGUE.high:s.trust<=30?TRUST_EPILOGUE.low:TRUST_EPILOGUE.middle;
 if(s.trust100?.status==='seen')append('epilogue',story.epilogue.title,story.epilogue.image,TRUST_100_EPILOGUE);
 appendDialogue('epilogue',story.epilogue.title,story.epilogue.image,trustLine);
 sequence.push({stage:'epilogue',title:story.epilogue.title,image:story.epilogue.image,type:'closing',text:story.epilogue.closing});return sequence}
function ending(){const e=s.ending||pickEnding();if(e.completed){endingFinal();return}const pages=endingSequence(e.name,e.pageLayoutVersion!==2);if(!pages.length){$('#app').textContent='エンディングを読み込めませんでした。';return}const index=Math.floor(clamp(Number(e.page)||0,0,pages.length-1)),page=pages[index],finished=index===pages.length-1;const replaceName=value=>String(value||'').replace(/\{\{name\}\}/g,s.name);const speaker=page.speaker?replaceName(page.speaker):'';const stageLabel={prologue:'共通プロローグ',career:'十八歳・職業の物語',later:'数年後の後日談',closing:'新たな旅立ち',epilogue:'共通エピローグ'}[page.stage];$('#app').innerHTML=`<section class="ending-screen" aria-label="エンディング画面"><div class="ending-stage"><div class="ending-fallback"></div>${imageOrFallback('assets/'+page.image,'ending-art')}<div class="ending-location">${escapeHtml(stageLabel)} ・ ${escapeHtml(page.title)}</div><div class="ending-progress">${index+1} / ${pages.length}</div><div class="ending-dialogue ${page.type==='closing'?'ending-closing':''}">${speaker?`<div class="ending-speaker">${escapeHtml(speaker)}</div>`:''}<p>${escapeHtml(replaceName(page.text))}</p><button class="ending-advance" id="endingAdvance" aria-label="${finished?'読み終える':'次の文章へ'}">${finished?'物語を閉じる':'次へ ▾'}</button></div>${finished?`<div class="ending-finish">${escapeHtml(s.name)}の物語は、これからも続いていく。</div>`:''}</div></section>`;const advance=()=>{if(finished){s.ending.completed=true;save();endingFinal();return}s.ending.page=index+1;save();ending()};$('#endingAdvance').onclick=advance;$('.ending-stage').onclick=event=>{if(event.target.closest('button'))return;advance()};}
function endingFinal(){const e=s.ending||pickEnding();$('#app').innerHTML=`<section class="ending-summary"><div class="ending-summary-card"><span class="kicker">SIX YEARS OF STARLIGHT</span><h2>星灯りの育成物語・完</h2><p>${escapeHtml(s.name)}の未来：${escapeHtml(e.name)}</p><p class="ending-summary-sub">6年間、見守ってくれてありがとう。</p><div class="ending-summary-stats">${STAT.map(k=>`<span>${k} ${s.stats[k]}</span>`).join('')}</div><p class="ending-summary-sub">信頼度 ${s.trust} ／ 所持金 ${s.gold}G ${e.debug?'／ デバッグ判定':''}</p><div class="hero-buttons"><button id="titleBack">タイトルへ</button><button class="primary" id="replay">もう一度育てる</button></div></div></section>`;$('#titleBack').onclick=()=>{save();s=null;render()};$('#replay').onclick=()=>{if(confirm('現在の記録を上書きして新しく始めますか？')){s=initial(s.name);save();render()}}}
// 既存の操作画面を維持しながら、施設と新しい暦を表示する。
function decorateMain(){
 const date=$('.date-line');if(!date)return;
 const seasonLabel=date.children[1];seasonLabel.querySelector('strong').textContent=period(s.turn);
 seasonLabel.querySelector('small').textContent='期間・季節';
 const identity=$('.identity > p');if(identity)identity.textContent='エルゼン王国・リーヴェルクの少女';
 const note=$('.schedule-grid');if(note){for(const el of note.querySelectorAll('.slot')){const select=el.querySelector('select'),a=ACT[select.value],info=document.createElement('p');info.className='place-note';info.textContent=(PLACES[a.place]||'リーヴェルクの自宅')+' · '+a.baseDesc;el.appendChild(info)}}
 const estimate=planEstimate(),cost=$('#estimate'),balance=$('#estimateBalance'),warning=$('#planWarning');
 if(cost)cost.textContent=`費用 ${s.plan.reduce((sum,k)=>sum+Math.max(0,ACT[k].cost),0)} G ／ 仕事の収入は体調で変化・冒険報酬は変動`;
 if(balance)balance.textContent=`控えめな見込み残高 ${estimate.balance} G`;
 if(warning){const lines=[];if(estimate.deficits.length)lines.push(`予定 ${estimate.deficits.join('・')} は資金不足の可能性があります。実行時は無料の休養に変更されます。`);if(s.fatigue>=BALANCE.fatigue.limit||s.stress>=BALANCE.stress.limit)lines.push('体調が限界です。休養以外は自動的に休養へ切り替わります。');else if(s.fatigue>=BALANCE.fatigue.moderate||s.stress>=BALANCE.stress.moderate)lines.push(`現在の体調：${fatigueGrade()}。疲労で学習・仕事効率が低下し、ストレスでも集中力が落ちます。`);if(s.fatigue>=BALANCE.injury.threshold&&s.plan.some(k=>k==='sword'||k==='adventure'))lines.push('武術・冒険でけがの危険があります。休養を挟むと危険を減らせます。');warning.textContent='';for(const line of lines){const p=document.createElement('div');p.className='warning';p.textContent=line;warning.appendChild(p)}}
}
const originalMain=main;
function currentPotion(){if(s?.phase!=='main'||s.notice||s.turning)return null;if(s.potion?.turn===s.turn)return s.potion.stage==='closed'?null:s.potion;if(s.fatigue<80)return null;s.potion={turn:s.turn,stage:'speech'};save();return s.potion}
function advancePotion(){if(s?.phase!=='main'||s.potion?.turn!==s.turn||s.potion.stage!=='speech')return;s.potion.stage='offer';save();render()}
function buyPotion(){if(s?.phase!=='main'||s.potion?.turn!==s.turn||s.potion.stage!=='offer'||s.gold<100||s.fatigue<80)return false;s.gold=money(s.gold-100);s.fatigue=clamp(s.fatigue-35);s.potion.stage='feedback';s.potion.choice='bought';save();render();return true}
function declinePotion(){if(s?.phase!=='main'||s.potion?.turn!==s.turn||s.potion.stage!=='offer')return;s.potion.stage='closed';s.potion.choice='declined';save();render()}
function closePotion(){if(s?.phase!=='main'||s.potion?.turn!==s.turn||s.potion.stage!=='feedback')return;s.potion.stage='closed';save();render()}
main=function(){
 if(typeof window==='undefined'||typeof window.renderTrainingUI!=='function'){originalMain();decorateMain();return}
 window.renderTrainingUI({state:s,actions:ACT,places:PLACES,period:period(s.turn),age:age(s.turn),planEstimate,debugOpen,notice:s.notice?GROWTH_NOTICES[s.notice.age]:null,turning:s.turning||null,turningSpeech:turningItem(s.turning)?.speech||'',turningNotice:turningNotice(),onTurningAdvance:advanceTurning,onTurningClose:finishTurning,onNoticeClose:closeGrowthNotice,potion:currentPotion(),onPotionAdvance:advancePotion,onPotionBuy:buyPotion,onPotionDecline:declinePotion,onPotionClose:closePotion,
  onPlanChange:(i,k)=>{if(s.phase!=='main'||s.turning||!ACT[k])return;s.plan[i]=k;save();main()},
  onSave:()=>$('#saveBtn').click(),onHome:()=>$('#homeBtn').click(),onStart:startTurn,
  onDebug:()=>{debugOpen=!debugOpen;main()},renderDebug});
};
// 画面Cは元の計算結果を参照するだけで、数値を一切再計算・加算しない。
const REPORT_IMAGES=[{max:13,file:'result_young.webp'},{max:15,file:'result_middle.webp'},{max:18,file:'result_mature.webp'}];
// 誕生日は通常イベント抽選とは独立した、数値変化のない物語演出。
const BIRTHDAY_STORIES={
 13:{title:'はじめての誕生日会',lines:['王都リーヴェルクの小さな家に、甘い焼き菓子の香りが広がっていた。食卓には花と誕生日のケーキが用意されている。','「わあっ！ これ、私のために用意してくれたの？」','「ありがとう！ もう十三歳なんだね。なんだか、まだ信じられないや。」','「今日は絶対に忘れられない日になりそう！」','少女の笑い声が、温かな部屋いっぱいに響いた。']},
 14:{title:'花束と小さな贈り物',lines:['春の柔らかな光が差し込む部屋で、少女は花束と小さな包みを受け取った。','「えっ、私に？ ……ありがとう。」','「去年はあんなにはしゃいじゃったけど、今年はもう少し落ち着いて……。」','「えへへ。やっぱり、すごくうれしい！」','少し照れくさそうな笑顔には、一年前よりも成長した面影があった。']},
 15:{title:'今日は私がおもてなし',lines:['今年の誕生日、少女は朝から台所で何かを準備していた。食卓には、少し不格好ながらも心を込めて作った料理が並んでいる。','「今日はね、私も何かしたかったんだ。」','「いつもお祝いしてもらってばかりだから、今度は私からもありがとうって伝えたくて。」','「まだ上手じゃないけど……一緒に食べてくれる？」','料理の出来栄え以上に、その心遣いがうれしい誕生日になった。']},
 16:{title:'にぎやかな誕生日',lines:['今年の誕生日には、王都で知り合った同年代の友人たちも祝いに訪れた。食卓を囲んで笑い声が弾み、部屋はいつも以上に賑やかだった。','「こんなに集まってくれるなんて思わなかった！」','「なんだか不思議だね。昔は知らなかった人たちが、今は大切な友達なんだ。」','「みんなと一緒に過ごせて、本当にうれしい！」','少女の世界は、少しずつ家の外へも広がっていた。']},
 17:{title:'星空の下の約束',lines:['誕生日の夜。祝いの席が終わり、少女は家の庭で静かな星空を見上げていた。','「もう十七歳なんだね。あと一年で十八歳かあ。」','「来年の今頃、私はどんなふうになっているのかな。」','「でもね、どんな未来が待っていても、ここで過ごした時間は忘れないよ。」','少女は微笑み、しばらく星の光を見つめていた。']}
};
const GROWTH_NOTICES={
 14:{title:'成長の節目',lines:['十四歳になりました。これまでの育成で、得意なことが少しずつ見えてきました。','将来の進路が気になったら、「未来への道しるべ」を確認してみましょう。']},
 16:{title:'未来への準備',lines:['十六歳になりました。十八歳まで、あと二年間です。','これまで伸ばしてきた能力を振り返り、残りの時間をどう過ごすか考えてみましょう。','職業の特徴は「未来への道しるべ」でいつでも確認できます。']}
};
// 年齢の節目で抽選結果と対象を先に固定し、セリフ確認後の一度だけ能力へ反映する。
const TURNING_EVENTS={
 14:[
  {name:'才能への迷い',weight:30,kind:'highDown',amounts:[-20],speech:'ずっと頑張ってきたのに……最近、前みたいにうまくできないんだ。\n私、このまま続けていていいのかな……。',intro:'少女はこれまで得意だったことに、自信を持てなくなっています。',closing:''},
  {name:'新しい可能性',weight:30,kind:'shift',amounts:[-12,20],speech:'今まで好きだったことも大切だけど……最近、ほかのことが気になるんだ。\n新しいことに挑戦してみたい。でも、今まで頑張ってきたことも、簡単には諦めたくないな……。',intro:'少女の関心が変化し、新しい才能が芽生えました。',closing:''},
  {name:'思いがけない出費',weight:20,kind:'goldDown',amounts:[-100],speech:'ねえ、これからいろんなことを学んでいくために、必要なものがあるんだ……。\nでも、思っていたよりお金がかかるみたい。ごめんね……。\n私も、できることを頑張るね。',intro:'少女の学びや成長に必要な道具などをそろえるため、臨時の出費が発生しました。',closing:'所持金が減少しました。通常の損失額：100G'},
  {name:'心身の限界',weight:20,kind:'exhaustion',amounts:[35,30],speech:'なんだか最近、頑張ろうと思っても、体がついてこないんだ……。\n少し疲れちゃったのかもしれない。どうしたらいいのかな……。',intro:'少女は心身ともに疲れを感じています。',closing:'しばらく休養を取ることも検討してください。'}
 ],
 16:[
  {name:'新しい才能の開花',weight:40,kind:'lowUp',amounts:[20],speech:'最近ね、今まで苦手だと思ってたことが、ちょっと面白くなってきたんだ！\nまだ上手にはできないけど……新しい自分を見つけたみたいで、なんだかうれしい！',intro:'少女の新しい可能性が広がりました。',closing:''},
  {name:'興味の広がり',weight:35,kind:'shift',amounts:[-5,15],speech:'ずっと好きだったことも大切だけど、最近はほかのことにも挑戦してみたいなって思うんだ。\n今まで頑張ってきたことも、もちろん忘れてないよ！',intro:'少女の関心が新しい分野へ広がりました。',closing:''},
  {name:'これまでの努力が実る',weight:25,kind:'highUp',amounts:[10],speech:'続けてきてよかった……！ 前より少し、自分に自信が持てるようになった気がする！\nこれからも、自分の好きなことを大切にしていきたいな。',intro:'これまで積み重ねてきた努力が、確かな成長につながりました。',closing:''}
 ]
};
// 旧14歳転機の途中セーブは、旧版で確定した内容をそのまま完了できるよう保持する。
const PREVIOUS_TURNING_14=[
 {name:'得意分野への迷い',amounts:[-12],speech:'最近ね、前は得意だったことが、なんだかうまくいかないんだ……。ちょっと自信がなくなっちゃった。',intro:'少女は得意分野で、少し自信を失っているようです。',closing:'思うようにいかない経験も、成長の一部です。'},
 {name:'新しい才能の芽生え',amounts:[15],speech:'最近、今まであまりやってこなかったことが楽しくなってきたんだ！ 自分でもびっくりしてるよ。',intro:'これまで意識していなかった分野に、新しい才能が芽生えました。',closing:'少女の可能性が少しずつ広がっています。'},
 {name:'興味の広がり',amounts:[-8,12],speech:'前はひとつのことばかり考えてたけど、最近はほかにも気になることがいっぱいあるんだ！',intro:'少女の興味が変化し、新しい分野にも目を向けるようになりました。',closing:'これからの育成方針を考えてみましょう。'},
 {name:'小さな飛躍',amounts:[12],speech:'聞いて！ 最近、前より上手にできることが増えたんだ。ちょっと自信がついてきたよ！',intro:'これまでの経験が結びつき、得意分野で新たな成長が見られました。',closing:'積み重ねてきた努力が、少しずつ実を結んでいます。'}
];
// 旧16歳転機の途中セーブは抽選済みの種類・変動値・文章を保持する。
const PREVIOUS_TURNING_16=[
 {name:'大きな挫折',amounts:[-30],speech:'ねえ……最近、今まで得意だったことが、思うようにできなくなっちゃった。ちょっと怖いけど……もう一度、頑張ってみたいな。',intro:'少女は得意分野で大きな壁にぶつかりました。',closing:'十八歳まで、あと二年間。これからの育成方針を改めて考えてみましょう。'},
 {name:'隠れた才能の開花',amounts:[35],speech:'聞いて！ 最近、今まで全然気づかなかったことが、急にできるようになったんだ！ 私にも、こんな才能があったんだね！',intro:'少女に、思いがけない才能が開花しました。',closing:'新しい可能性を生かすか、これまでの目標を追い続けるか。残された二年間の過ごし方を考えてみましょう。'},
 {name:'価値観の大転換',amounts:[-15,30],speech:'最近ね、前とは違うことにも興味が出てきたんだ。今まで夢中だったことも、少し違って見えるの。自分でも不思議なんだけど……。',intro:'少女の興味や価値観に、大きな変化が訪れました。',closing:'十八歳まで、あと二年間。新しい未来を考えてみましょう。'},
 {name:'才能の飛躍',amounts:[25,15],speech:'最近、今までできなかったことが、急にできるようになってきたんだ！ なんだか、もっといろんなことに挑戦できそうな気がする！',intro:'これまで積み重ねてきた経験が、思いがけない形で実を結びました。',closing:'この成長をどう生かすか、残された二年間の育成方針を考えてみましょう。'}
];
const turningItem=t=>{if(!t)return null;const old=(t.age===14?PREVIOUS_TURNING_14:t.age===16?PREVIOUS_TURNING_16:[])[t.index];if(old&&JSON.stringify(old.amounts)===JSON.stringify(t.amounts))return old;if(t.age===16&&old&&t.index===2&&JSON.stringify(t.amounts)===JSON.stringify([-25,30]))return {...old,amounts:[-25,30]};const item=TURNING_EVENTS[t.age]?.[t.index];return item&&JSON.stringify(item.amounts)===JSON.stringify(t.amounts)?item:null};
function turningSeed(ageValue){let n=((s.rng>>>0)^Math.imul(s.turn+1,2654435761)^Math.imul(ageValue,2246822519))>>>0;n^=n>>>16;n=Math.imul(n,2246822507)>>>0;n^=n>>>13;return (n>>>0)/4294967296}
// 同値の対象のみ転機専用の決定的な乱数で抽選する。通常イベントの乱数は消費しない。
function turningTie(candidates,salt,ageValue=16){if(candidates.length===1)return candidates[0];let n=((s.rng>>>0)^Math.imul(s.turn+1,2654435761)^Math.imul(ageValue,2246822519)^Math.imul(salt,2654435761))>>>0;n^=n>>>16;n=Math.imul(n,2246822507)>>>0;n^=n>>>13;return candidates[n%candidates.length]}
function prepareTurning(ageValue){const items=TURNING_EVENTS[ageValue];if(!items||s.turn!==(ageValue-12)*6||s.growthNoticesSeen?.[ageValue]||s.turning?.age===ageValue)return;
 const roll=turningSeed(ageValue)*100;let sum=0,index=items.length-1;for(let i=0;i<items.length;i++){sum+=items[i].weight;if(roll<sum){index=i;break}}
 const item=items[index],ordered=[...STAT].sort((a,b)=>s.stats[a]-s.stats[b]||STAT.indexOf(a)-STAT.indexOf(b)),high=ordered[ordered.length-1],low=ordered[0];
 const targets=item.kind==='goldDown'?['所持金']:item.kind==='exhaustion'?['疲労','ストレス']:(()=>{const top=Math.max(...STAT.map(k=>s.stats[k])),bottom=Math.min(...STAT.map(k=>s.stats[k]));const highest=turningTie(STAT.filter(k=>s.stats[k]===top),1,ageValue);if(item.kind==='lowUp')return [turningTie(STAT.filter(k=>s.stats[k]===bottom),2,ageValue)];if(item.kind==='shift'){const others=STAT.filter(k=>k!==highest),minimum=Math.min(...others.map(k=>s.stats[k]));return [highest,turningTie(others.filter(k=>s.stats[k]===minimum),3,ageValue)]}return [highest]})();
 s.turning={age:ageValue,index,targets,amounts:[...item.amounts],stage:'speech',applied:[]};s.notice=null;save();
}
function turningNotice(){const t=s.turning;if(!t||t.stage!=='notice')return null;const item=turningItem(t);if(!item)return null;const legacy=item!==TURNING_EVENTS[t.age][t.index];return {title:legacy?GROWTH_NOTICES[t.age].title:item.name,lines:[legacy?item.name+'：'+item.intro:item.intro,...t.applied.map(([stat,n])=>`${stat} ${n>=0?'＋':'−'}${Math.abs(n)}${stat==='所持金'?'G':''}`),...(item.closing?[item.closing]:[])]}}
function advanceTurning(){const t=s?.turning;if(s?.phase!=='main'||!t||t.stage!=='speech')return;const changes=[];for(let i=0;i<t.targets.length;i++){const stat=t.targets[i],before=STAT.includes(stat)?s.stats[stat]:stat==='所持金'?s.gold:stat==='疲労'?s.fatigue:s.stress;if(STAT.includes(stat)){s.stats[stat]=clamp(before+t.amounts[i]);if(s.stats[stat]===100)s.growthCarry[stat]=0}else change({[stat]:t.amounts[i]});const after=STAT.includes(stat)?s.stats[stat]:stat==='所持金'?s.gold:stat==='疲労'?s.fatigue:s.stress;changes.push([stat,after-before])}t.applied=changes;t.stage='notice';save();render()}
function finishTurning(){if(s?.phase!=='main'||s.turning?.stage!=='notice')return;s.growthNoticesSeen??={};s.growthNoticesSeen[s.turning.age]=true;s.turning=null;s.notice=null;save();render()}
const loadBeforeBirthday=load;
load=function(){const x=loadBeforeBirthday();if(!x)return null;let raw={};try{raw=JSON.parse(localStorage.getItem(KEY))||{}}catch{}
 x.birthdaysSeen=raw.birthdaysSeen&&typeof raw.birthdaysSeen==='object'?{...raw.birthdaysSeen}:{};
 // 古い保存データからの移行時には、現在より前の年齢を既読扱いにする。
 if(!raw.birthdaysSeen)for(let a=13;a<=17;a++)if(a<age(x.turn)||(a===age(x.turn)&&x.turn>a*6-72))x.birthdaysSeen[a]=true;
 if(raw.phase==='birthday'&&BIRTHDAY_STORIES[raw.birthday?.age]&&!x.birthdaysSeen[raw.birthday.age]&&x.turn===(raw.birthday.age-12)*6){x.phase='birthday';x.birthday={age:raw.birthday.age,page:Math.min(4,Math.max(0,Math.floor(Number(raw.birthday.page)||0)))}};
 x.growthNoticesSeen=raw.growthNoticesSeen&&typeof raw.growthNoticesSeen==='object'?{...raw.growthNoticesSeen}:{};
 // 旧セーブでは過去の年齢のお知らせを再発生させない。
 if(!raw.growthNoticesSeen)for(const a of [14,16])if(x.turn>(a-12)*6||(x.turn===(a-12)*6&&raw.phase==='main'&&raw.notice?.age!==a&&raw.turning?.age!==a))x.growthNoticesSeen[a]=true;
 x.notice=raw.notice&&GROWTH_NOTICES[raw.notice.age]&&x.phase==='main'&&x.turn===(raw.notice.age-12)*6&&!x.growthNoticesSeen[raw.notice.age]?{age:raw.notice.age}:null;
 return x};
function openBirthdayIfDue(){const a=age(s.turn);if(s.turn%6||!BIRTHDAY_STORIES[a]||s.birthdaysSeen?.[a])return false;s.birthdaysSeen??={};s.birthday={age:a,page:0};s.phase='birthday';s.run=null;save();return true}
function closeBirthday(){clearTimeout(timer);birthdayFast=false;const a=s.birthday.age;s.birthdaysSeen[a]=true;s.birthday=null;s.phase='main';if(GROWTH_NOTICES[a]&&!s.growthNoticesSeen?.[a])prepareTurning(a);save();render()}
function closeGrowthNotice(){if(s?.phase!=='main'||!s.notice)return;s.growthNoticesSeen??={};s.growthNoticesSeen[s.notice.age]=true;s.notice=null;save();render()}
let birthdayFast=false;
function birthdayView(){const b=s.birthday,story=BIRTHDAY_STORIES[b.age];if(!story){s.phase='main';save();render();return}
 const speaker=b.page>=1&&b.page<=3;const text=story.lines[b.page];
 $('#app').innerHTML=`<section class="novel-screen event-screen birthday-screen" aria-label="${b.age}歳の誕生日イベント"><div class="novel-stage event-stage birthday-stage birthday-age-${b.age}"><div class="novel-backdrop event-backdrop"></div>${imageOrFallback('assets/birthday_'+b.age+'.webp','event-art birthday-art','assets/bg_home_room.webp')}<div class="novel-location event-location">${b.age}歳・${story.title}</div><div class="novel-controls"><button id="birthdayFast" class="novel-control" aria-pressed="${birthdayFast}">▶▶ ${birthdayFast?'通常速度':'早送り'}</button><button id="birthdaySkip" class="novel-control">⏭ スキップ</button></div><div class="novel-dialogue event-dialogue birthday-dialogue">${speaker?`<div class="novel-name">${escapeHtml(s.name)}</div>`:''}<p>${escapeHtml(text)}</p><button id="birthdayNext" class="event-advance">${b.page===4?'育成へ戻る':'次へ ▾'}</button></div></div></section>`;
 const advance=()=>{if(s?.phase!=='birthday'||s.birthday!==b)return;clearTimeout(timer);if(b.page===4){closeBirthday();return}b.page++;save();birthdayView()};
 $('#birthdayNext').onclick=advance;$('.birthday-stage').onclick=e=>{if(!e.target.closest('button'))advance()};
 $('#birthdayFast').onclick=()=>{birthdayFast=!birthdayFast;clearTimeout(timer);birthdayView()};
 $('#birthdaySkip').onclick=closeBirthday;
 if(birthdayFast)timer=setTimeout(advance,1150);
}
function reportView(){
 const before=s.run.before,after=snapshot(),changes=delta(before,after),ended=s.turn>=TOTAL;
 const reportAge=age(s.turn-1),[m1,m2]=monthRange(s.turn-1);
 const background=REPORT_IMAGES.find(item=>reportAge<=item.max)?.file||REPORT_IMAGES[2].file;
 const categories=changes.filter(([k])=>STAT.includes(k)),resources=changes.filter(([k])=>!STAT.includes(k));
 const row=([k,v])=>`<div class="report-row"><span>${escapeHtml(k)}</span><strong class="${v>=0?'positive':'negative'}">${v>0?'+':''}${v}${k==='所持金'?'G':''}</strong></div>`;
 const current=`所持金 ${s.gold}G　疲労 ${s.fatigue}　ストレス ${s.stress}　信頼度 ${s.trust}`;
 const trustReasons=s.run.logs.filter(log=>log.startsWith('信頼度：'));
 $('#app').innerHTML=`<section class="report-screen" aria-label="2か月間の報告画面"><div class="report-stage"><div class="report-ambience"></div>${imageOrFallback('assets/'+background,'report-art')}<div class="report-name">${escapeHtml(s.name)}</div><div class="report-panel"><span class="report-kicker">TWO MONTHS' REPORT · ${s.turn} / 36</span><h2>${escapeHtml(season(s.turn-1))}のふりかえり</h2><p class="report-period">${reportAge}歳 ・ ${m1}〜${m2}月</p><div class="report-section"><h3>能力の変化</h3><div class="report-row-grid">${categories.length?categories.map(row).join(''):'<p class="report-empty">能力の変化はありませんでした。</p>'}</div></div><div class="report-section"><h3>暮らしの変化</h3><div class="report-row-grid">${resources.length?resources.map(row).join(''):'<p class="report-empty">生活状態の変化はありませんでした。</p>'}</div>${trustReasons.map(log=>`<p class="report-trust-note">${escapeHtml(log.slice(4))}</p>`).join('')}</div><details class="report-details"><summary>現在値と育成記録を見る</summary><p>${escapeHtml(current)}</p><p>${STAT.map(k=>`${k} ${s.stats[k]}`).join(' ／ ')}</p><ol>${s.run.logs.map(x=>`<li>${escapeHtml(x)}</li>`).join('')}</ol></details></div><div class="report-comment"><div class="report-comment-name">${escapeHtml(s.name)}</div><p>${escapeHtml(s.quote)}</p></div><button class="report-next" id="nextTurn">${ended?'18歳の未来を見る':'次の2か月へ →'}</button></div></section>`;
 $('#nextTurn').onclick=()=>{if(ended)finish(false);else{if(!openBirthdayIfDue()){s.phase='main';s.run=null;save()}render()}};
}
const originalRender=render;
// 旧14ページ版は途中セーブ互換のため保持する。
const OPENING_V2_SCENES=[
 {image:'opening_01_capital.webp',title:'王都リーヴェルク',lines:[
  ['','エルゼン湖の南岸に広がる、エルゼン王国の王都リーヴェルク。時計塔の鐘が響く街では、人々が学び、働き、それぞれの夢を追いかけて暮らしていた。そんな街の片隅で、あなたのもとに一通の手紙が届いた。']]},
 {image:'opening_02_letter.webp',title:'旧友からの手紙',lines:[
  ['','差出人は、長い付き合いのある旧友だった。\n突然のお願いを、どうか許してください。家庭の事情で、娘をしばらくあなたに預かっていただけないでしょうか。'],
  ['','娘は十二歳になりました。まだ自分の将来を決められる年齢ではありません。十八歳を迎えるまでの六年間、あの子が自分の道を見つけられるよう、そばで見守っていただけたら幸いです。'],
  ['','あなたは旧友の頼みを引き受けた。それからほどなくして、少女が王都へやって来る日を迎えた。']]},
 {image:'opening_03_first_meeting.webp',title:'はじめまして',lines:[
  ['','冬の澄んだ空気に、午後の柔らかな日差しが差し込む。一人の少女が、小さな旅行鞄を手に、あなたの家を訪れた。少女は少し緊張した様子で、背筋をぴんと伸ばしている。'],
  ['girl','あ、あの……はじめまして！ 今日からお世話になります。よろしくお願いします！'],
  ['girl','王都って、思ってたよりずっと大きいんだね！ あっ……大きいんですね。'],
  ['','慌てて言い直す少女を見て、あなたが微笑むと、少女も照れくさそうに笑った。'],
  ['girl','えへへ……なんだか、ちゃんとしなきゃって思っちゃって。あのね、私、まだ将来何になりたいか、よく分からないんだ。'],
  ['girl','でも、いろんなことをやってみたい！ 勉強も、お仕事も……この街には面白そうなことがいっぱいあるもん。'],
  ['','少女の目には、先ほどまでの緊張に代わって、好奇心の光が宿っていた。'],
  ['girl','これからの六年間、どんな毎日になるのかな。'],
  ['','こうして、あなたと少女の新しい暮らしが始まった。どんなことを学び、誰と出会い、どのような未来を選ぶのか。それは、これからの日々にかかっている。'],
  ['girl','あっ、そうだ！ これからよろしくね！']]}];
const OPENING_V2_PAGES=OPENING_V2_SCENES.flatMap(scene=>scene.lines.map(line=>({image:scene.image,title:scene.title,speaker:line[0],text:line[1]})));
// 新規開始は出会いの7ページ、約束の選択、最後のセリフの9段階。
const OPENING_SCENES=[{image:'opening_03_first_meeting.webp',title:'はじめまして',lines:[
 ['','エルゼン王国の王都リーヴェルク。冬の柔らかな日差しが差し込む午後、旧友から娘を預かることになったあなたのもとへ、一人の少女がやって来た。'],
 ['girl','あ、あの……はじめまして！ 今日からお世話になります。よろしくお願いします！'],
 ['','少女は小さな旅行鞄を手に、少し緊張した様子で背筋をぴんと伸ばしている。あなたが微笑むと、少女もほっとしたように笑った。'],
 ['girl','王都って、思ってたよりずっと大きいんだね！ あっ……大きいんですね。\nえへへ……なんだか、ちゃんとしなきゃって思っちゃって。'],
 ['girl','あのね、私、まだ将来何になりたいか、よく分からないんだ。\nでも、いろんなことをやってみたい！ 勉強も、お仕事も……この街には面白そうなことがいっぱいあるもん。'],
 ['','少女の目には、先ほどまでの緊張に代わって、好奇心の光が宿っていた。'],
 ['girl','私ね、いつか胸を張って『これが私の道だよ』って言えるようになりたい！\nだから……十八歳になるまで、見守っていてくれる？'],
 ['choice',''],
 ['girl','えへへ……ありがとう！ これからよろしくね！']]}];
const OPENING_PAGES=OPENING_SCENES.flatMap(scene=>scene.lines.map(line=>({image:scene.image,title:scene.title,speaker:line[0],text:line[1]})));
// 旧23ページ版の途中セーブは、文章の飛び越しや重複を避けるため旧位置から続ける。
const OPENING_LEGACY_SCENES=[
 {image:'opening_01_capital.webp',title:'王都リーヴェルク',lines:[
  ['','エルゼン湖の南岸に広がる、エルゼン王国の王都リーヴェルク。'],
  ['','時計塔の鐘が響く街では、人々が学び、働き、それぞれの夢を追いかけて暮らしていた。'],
  ['','そんな街の片隅で、あなたのもとに一通の手紙が届いた。']]},
 {image:'opening_02_letter.webp',title:'旧友からの手紙',lines:[
  ['','差出人は、長い付き合いのある旧友だった。'],
  ['','突然のお願いを、どうか許してください。'],
  ['','家庭の事情で、娘をしばらくあなたに預かっていただけないでしょうか。'],
  ['','あの子は今年、十二歳になります。まだ自分の将来を決められる年齢ではありません。'],
  ['','十八歳を迎えるまでの六年間、あの子が自分の道を見つけられるよう、そばで見守っていただけたら幸いです。'],
  ['','あなたは旧友の頼みを引き受けた。'],
  ['','それからほどなくして、少女が王都へやって来る日を迎えた。']]},
 {image:'opening_03_first_meeting.webp',title:'はじめまして',lines:[
  ['','冬の澄んだ空気に、午後の柔らかな日差しが差し込む。一人の少女が、小さな旅行鞄を手に、あなたの家を訪れた。'],
  ['girl','あ、あの……はじめまして！ 今日からお世話になります。よろしくお願いします！'],
  ['','少女は少し緊張した様子で、背筋をぴんと伸ばしている。'],
  ['girl','王都って、思ってたよりずっと大きいんだね！ あっ……大きいんですね。'],
  ['','慌てて言い直す少女を見て、あなたが微笑むと、少女も照れくさそうに笑った。'],
  ['girl','えへへ……なんだか、ちゃんとしなきゃって思っちゃって。'],
  ['girl','あのね、私、まだ将来何になりたいか、よく分からないんだ。'],
  ['girl','でも、いろんなことをやってみたい！ 勉強も、お仕事も……この街には面白そうなことがいっぱいあるもん。'],
  ['','少女の目には、先ほどまでの緊張に代わって、好奇心の光が宿っていた。'],
  ['girl','これからの六年間、どんな毎日になるのかな。'],
  ['','こうして、あなたと少女の新しい暮らしが始まった。'],
  ['','どんなことを学び、誰と出会い、どのような未来を選ぶのか。それは、これからの日々にかかっている。'],
  ['girl','あっ、そうだ！ これからよろしくね！']]}];
const OPENING_LEGACY_PAGES=OPENING_LEGACY_SCENES.flatMap(scene=>scene.lines.map(line=>({image:scene.image,title:scene.title,speaker:line[0],text:line[1]})));
const openingPages=()=>s.opening?.version===3?OPENING_PAGES:s.opening?.version===2?OPENING_V2_PAGES:OPENING_LEGACY_PAGES;
const loadBeforeOpening=load;
load=function(){const x=loadBeforeOpening();if(!x)return null;let raw={};try{raw=JSON.parse(localStorage.getItem(KEY))||{}}catch{}
 if(raw.phase==='opening'&&raw.opening&&x.turn===0){const version=raw.opening.version===3?3:raw.opening.version===2?2:1,pages=version===3?OPENING_PAGES:version===2?OPENING_V2_PAGES:OPENING_LEGACY_PAGES;x.phase='opening';x.opening={version,page:Math.max(0,Math.min(pages.length-1,Math.floor(Number(raw.opening.page)||0)))}}return x};
function openingView(){const pages=openingPages(),pageIndex=s.opening.page,page=pages[pageIndex];if(!page){s.phase='main';s.opening=null;save();render();return}
 const isLast=pageIndex===pages.length-1,isChoice=page.speaker==='choice';
 $('#app').innerHTML=`<section class="novel-screen event-screen opening-screen" aria-label="オープニング"><div class="novel-stage event-stage opening-stage"><div class="novel-backdrop event-backdrop"></div>${imageOrFallback('assets/'+page.image,'event-art opening-art','assets/bg_home_room.webp')}<div class="novel-controls"><button type="button" id="openingSkip" class="novel-control" aria-label="オープニングをスキップ">⏭ スキップ</button></div><div class="novel-dialogue event-dialogue opening-dialogue">${page.speaker==='girl'?`<div class="novel-name">${escapeHtml(s.name)}</div>`:''}${isChoice?'':`<p>${escapeHtml(page.text)}</p>`}${isChoice?'':`<button type="button" id="openingNext" class="event-advance">${isLast?'育成を始める':'次へ ▾'}</button>`}</div>${isChoice?'<div class="event-choices" aria-label="選択肢"><button type="button" id="openingPromise">もちろん</button></div>':''}</div></section>`;
 const advance=()=>{if(s?.phase!=='opening'||s.opening.page!==pageIndex)return;if(isLast){s.phase='main';s.opening=null}else s.opening.page++;save();render()};
 if(isChoice){$('#openingPromise').onclick=advance}else{$('#openingNext').onclick=advance;$('.opening-stage').onclick=event=>{if(!event.target.closest('button'))advance()}};
 $('#openingSkip').onclick=()=>{if(s?.phase!=='opening')return;s.phase='main';s.opening=null;save();render()};
}
// 信頼度100に初めて到達した時点の年齢を予約して固定し、報告・誕生日の後に表示する。
const TRUST_100_LINES=[
 ['', 'ある夜、少女があなたの部屋の扉をそっと叩いた。'],
 ['girl','ねえ、ちょっとだけ、一緒に来てくれる？'],
 ['', '少女に案内されて窓辺へ向かうと、夜空には無数の星が輝いていた。'],
 ['girl','ここから見る星、すごくきれいなんだよ。前から、一緒に見たかったんだ。'],
 ['girl','あのね……ここに来たばかりのころは、ちょっと不安だったんだ。'],
 ['girl','知らない街で、知らないおうちで……これからどうなるのかなって。'],
 ['', '少女は窓の外を見つめながら、ぽつりとつぶやいた。'],
 ['girl','でもね、夜に星が見えると、なんだか安心するんだ。'],
 ['girl','暗くても、ちゃんとそこに光があるんだなって。'],
 ['', '少女はこちらを振り返り、少し照れくさそうに微笑んだ。'],
 ['girl','……あなたも、私にとってはそんな感じなんだ。'],
 ['girl','何をしたらいいか分からないときも、うまくいかないときも、そばにいてくれるから。'],
 ['girl','だから、安心して自分の道を探せるんだと思う。'],
 ['', '窓の向こうで、星がひとつ、静かに瞬いた。'],
 ['girl','いつもありがとう。これからも、私のこと、見守っていてね。'],
 ['', '少女が見上げる空には、数えきれないほどの星灯りが輝いていた。']
];
const loadBeforeTrust100=load;
load=function(){const x=loadBeforeTrust100();if(!x)return null;let raw={};try{raw=JSON.parse(localStorage.getItem(KEY))||{}}catch{}
 const saved=raw.trust100;
 if(saved&&['pending','active','seen'].includes(saved.status)){
  x.trust100={status:saved.status,age:Math.max(12,Math.min(17,Math.floor(Number(saved.age)||12))),page:Math.max(0,Math.min(TRUST_100_LINES.length-1,Math.floor(Number(saved.page)||0)))};
  if(raw.phase==='trust100'&&x.trust100.status==='active'&&x.turn<TOTAL)x.phase='trust100';
  else if(x.trust100.status==='active')x.trust100.status='pending';
 }else if(x.trust===100&&x.turn<TOTAL&&x.phase!=='ending'&&raw.phase!=='trust100'){
  x.trust100={status:'pending',age:age(x.phase==='result'?Math.max(0,x.turn-1):x.turn),page:0};
 }
 return x};
function trust100View(){const t=s.trust100,page=TRUST_100_LINES[t.page],last=t.page===TRUST_100_LINES.length-1;
 const group=t.age<=13?'12_13':t.age<=15?'14_15':'16_17';
 $('#app').innerHTML=`<section class="novel-screen event-screen trust-100-screen" aria-label="信頼度100の特別イベント"><div class="novel-stage event-stage trust-100-stage"><div class="novel-backdrop event-backdrop"></div>${imageOrFallback('assets/event_trust_100_'+group+'.webp','event-art','assets/bg_home_room.webp')}<div class="novel-location event-location">あなたに伝えたいこと</div><div class="novel-dialogue event-dialogue">${page[0]==='girl'?`<div class="novel-name">${escapeHtml(s.name)}</div>`:''}<p>${escapeHtml(page[0]==='girl'?'「'+page[1]+'」':page[1])}</p><button type="button" id="trust100Next" class="event-advance">${last?'育成へ戻る':'次へ ▾'}</button></div></div></section>`;
 const advance=()=>{if(s?.phase!=='trust100'||s.trust100!==t||s.trust100.page!==TRUST_100_LINES.indexOf(page))return;if(last){t.status='seen';s.phase='main'}else t.page++;save();render()};
 $('#trust100Next').onclick=advance;$('.trust-100-stage').onclick=event=>{if(!event.target.closest('button'))advance()};
}
const loadBeforeTurning=load;
load=function(){const x=loadBeforeTurning();if(!x)return null;let raw={};try{raw=JSON.parse(localStorage.getItem(KEY))||{}}catch{}
 const t=raw.turning;
 if(t&&turningItem(t)&&x.turn===(t.age-12)*6&&!x.growthNoticesSeen?.[t.age]&&x.phase==='main'){
  const item=turningItem(t),targets=Array.isArray(t.targets)?t.targets:[];
  if(targets.length===item.amounts.length&&targets.every((k,i)=>(STAT.includes(k)||(t.age===14&&['所持金','疲労','ストレス'].includes(k)))&&(i===0||k!==targets[0]))&&['speech','notice'].includes(t.stage)){
   x.turning={age:t.age,index:t.index,targets:[...targets],amounts:[...item.amounts],stage:t.stage,applied:t.stage==='notice'&&Array.isArray(t.applied)?t.applied.filter(([k,n])=>(STAT.includes(k)||(t.age===14&&['所持金','疲労','ストレス'].includes(k)))&&Number.isFinite(n)):[]};x.notice=null;
  }
 }
 return x};
const loadBeforePotion=load;
load=function(){const x=loadBeforePotion();if(!x)return null;let raw={};try{raw=JSON.parse(localStorage.getItem(KEY))||{}}catch{}
 const p=raw.potion;if(p&&Number.isInteger(p.turn)&&p.turn>=0&&p.turn<TOTAL&&['speech','offer','feedback','closed'].includes(p.stage))x.potion={turn:p.turn,stage:p.stage,choice:['bought','declined'].includes(p.choice)?p.choice:null};return x};
render=function(){
 if(s?.phase==='main'&&!s.notice&&!s.turning&&s.trust100?.status==='pending'&&s.turn<TOTAL){s.trust100.status='active';s.phase='trust100';save()}
 if(typeof document!=='undefined'&&document.body?.classList){document.body.classList.toggle('title-mode',!s);document.body.classList.toggle('training-mode',s?.phase==='main');document.body.classList.toggle('cinematic-mode',s?.phase==='run'||s?.phase==='result'||s?.phase==='event'||s?.phase==='birthday'||s?.phase==='opening'||s?.phase==='trust100')}
 if(s?.phase==='trust100'){topButtons();trust100View();return}
 if(s?.phase==='opening'){topButtons();openingView();return}if(s?.phase==='result'){topButtons();reportView();return}if(s?.phase==='birthday'){topButtons();birthdayView();return}originalRender()}
if(window.ELSEN_ENDING_STORY?.prologue)window.ELSEN_ENDING_STORY.prologue.image='birthday_18.webp';
s=null;render();
})();
