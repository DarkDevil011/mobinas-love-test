const questions = [
  {q:"از پسرای مو فرفری خوشت میاد؟ 🥹", emoji:"🥹", yes:"آره، خیلییی 😍", no:"نه اصلاً 😂"},
  {q:"سبیل روی پسر جذابه؟ 😎", emoji:"😎", yes:"آره، خیلی جذابه ❤️", no:"نه بابا، اصلاً! 🤣"},
  {q:"پسر قدبلند دوست داری؟ 🧸", emoji:"🧸", yes:"آره، حتماً 😍", no:"قد مهم نیست! 💗"},
  {q:"اگه یکی هر روز بهت صبح‌بخیر بگه؟ 🌞", emoji:"🌞", yes:"روزمو می‌سازه 🥹", no:"لازم نیست هر روز 😂"},
  {q:"اگه یه نفر بخواد باهات وارد رابطه بشه؟ 💘", emoji:"💘", yes:"چرا که نه؟ ❤️", no:"فعلاً باید بیشتر بشناسمش 🙈"}
];
const $ = id => document.getElementById(id);
const views = ["welcome","game","result","proposal"];
let index = 0, score = 50, answers = [], finalChoice = null, sending = false;
const persian = n => String(n).replace(/\d/g, d => "۰۱۲۳۴۵۶۷۸۹"[d]);
function show(id){views.forEach(v => $(v).classList.toggle("hidden",v!==id));window.scrollTo({top:0,behavior:"smooth"});}
function updateMeter(){ $("meterFill").style.width = `${score}%`; $("meterHeart").style.left = `${score}%`; $("percent").textContent = `${persian(score)}٪`; }
function renderQuestion(){
  const item=questions[index];
  $("stepLabel").textContent=`سؤال ${persian(index+1)} از ۵`;
  $("questionNumber").textContent=persian(String(index+1).padStart(2,"0"));
  $("questionEmoji").textContent=item.emoji; $("questionText").textContent=item.q;
  $("answers").innerHTML="";
  [item.yes,item.no].forEach((label,choice)=>{
    const b=document.createElement("button"); b.className="answer-btn"; b.type="button"; b.textContent=label;
    b.addEventListener("click",()=>choose(choice,b)); $("answers").appendChild(b);
  });
  updateMeter();
}
function burst(){
  const host=$("heartBurst"), symbols=["💗","💕","💘","✨","❤️"];
  for(let i=0;i<13;i++){const p=document.createElement("span");p.className="heart-particle";p.textContent=symbols[i%symbols.length];p.style.left=`${35+Math.random()*30}%`;p.style.top=`${38+Math.random()*22}%`;p.style.setProperty("--x",`${(Math.random()-.5)*300}px`);p.style.setProperty("--y",`${-70-Math.random()*230}px`);host.appendChild(p);setTimeout(()=>p.remove(),1200);}
}
function choose(choice,button){
  if(button.disabled)return;
  [...$("answers").children].forEach(b=>b.disabled=true);button.classList.add("selected");
  answers[index]=choice; score=Math.max(0,Math.min(100,score+(choice===0?10:-10)));
  updateMeter();burst();
  setTimeout(()=>{
    index++;
    if(index<questions.length){renderQuestion();}
    else showResult();
  },850);
}
function showResult(){
  const positives=answers.filter(x=>x===0).length, negatives=5-positives;
  $("finalScore").textContent=`${persian(score)}٪`;
  $("positiveCount").textContent=persian(positives); $("negativeCount").textContent=persian(negatives);
  let msg;
  if(positives>=4) msg="چه جواب‌های پر از انرژی مثبتی! 💗 به نظر میاد کلی نقطه‌ی مشترک پیدا کردیم؛ البته مهم‌تر از همه، حس واقعی خودته. 🥹";
  else if(positives>=2) msg="یه ترکیب بامزه از سلیقه‌ها و نظرهای متفاوت! 💕 شناختن همدیگه خودش قشنگ‌ترین بخش ماجراست.";
  else msg="جواب‌هات کاملاً محترمن و نشون می‌دن سلیقه‌ی خودت رو داری. 🌷 هیچ امتیازی قرار نیست جای حس و انتخاب واقعی تو رو بگیره.";
  $("resultMessage").textContent=msg; show("result");burst();
}
function makePayload(){
  return {name:"مبینا",answers:answers.map((a,i)=>({question:questions[i].q,answer:a===0?questions[i].yes:questions[i].no,positive:a===0})),score,positiveCount:answers.filter(a=>a===0).length,negativeCount:answers.filter(a=>a===1).length,proposalResponse:finalChoice,completedAt:new Date().toISOString(),submissionId:crypto.randomUUID?crypto.randomUUID():`${Date.now()}-${Math.random().toString(16).slice(2)}`};
}
async function sendResult(){
  if(sending)return;
  sending=true;$("yesBtn").disabled=true;$("thinkBtn").disabled=true;
  $("sendStatus").textContent="دارم نتیجه رو ارسال می‌کنم… 💌";
  try{
    const response=await fetch("/.netlify/functions/submit-result",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(makePayload())});
    const data=await response.json().catch(()=>({}));
    if(!response.ok)throw new Error(data.error||"ارسال انجام نشد");
    $("sendStatus").textContent="نتیجه با موفقیت برای سازنده ارسال شد. 💗";
  }catch(err){
    $("sendStatus").textContent="نتونستم نتیجه رو ارسال کنم. لطفاً اتصال اینترنت رو بررسی کن و به سازنده خبر بده. 🌷";
    $("sendStatus").title=err.message;
    $("yesBtn").disabled=false;$("thinkBtn").disabled=false;sending=false;
  }
}
function answerProposal(choice){
  if(finalChoice!==null)return;
  finalChoice=choice;
  $("responseBox").textContent=choice==="yes"?"وای، چه خبر قشنگی! امیدوارم شروع یه اتفاق خیلی قشنگ باشه! 💗🥹":"هیچ عجله‌ای نیست مبینا! هر وقت مطمئن بودی، می‌تونیم بیشتر درباره‌ش حرف بزنیم. 🌷";
  $("responseBox").classList.remove("hidden");burst();sendResult();
}
$("startBtn").addEventListener("click",()=>{index=0;score=50;answers=[];show("game");renderQuestion();});
$("toProposalBtn").addEventListener("click",()=>show("proposal"));
$("yesBtn").addEventListener("click",()=>answerProposal("yes"));
$("thinkBtn").addEventListener("click",()=>answerProposal("think"));
