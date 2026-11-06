const questions = [
  {
    q: "تا حالا شده منتظر پیام من باشی؟ 🥹",
    emoji: "📱",
    yes: "آره، بعضی وقتا 😊",
    no: "نه، خیلی نه 😂"
  },
  {
    q: "وقتی با من صحبت می‌کنی، حالت بهتر می‌شه؟",
    emoji: "💗",
    yes: "آره، خیلی ❤️",
    no: "فرقی نداره"
  },
  {
    q: "اگه چند روز باهات صحبت نکنم، دلت برام تنگ می‌شه؟",
    emoji: "🥺",
    yes: "قطعاً 🥹",
    no: "نه خیلی"
  },
  {
    q: "اگه یه روز از من پیام صبح‌بخیر بگیری، خوشحال می‌شی؟",
    emoji: "🌞",
    yes: "آره، روزمو می‌سازه 💗",
    no: "زیاد برام فرقی نداره 😂"
  },
  {
    q: "تا حالا شده بخوای چیزی بهم بگی ولی خجالت بکشی؟",
    emoji: "🙈",
    yes: "آره، پیش اومده 🙈",
    no: "نه، راحت می‌گم 😄"
  }
];

const $ = id => document.getElementById(id);
const views = ["welcome", "game", "result", "proposal"];

let index = 0;
let score = 50;
let answers = [];
let finalChoice = null;
let sending = false;

const persian = n =>
  String(n).replace(/\d/g, d => "۰۱۲۳۴۵۶۷۸۹"[d]);

function show(id) {
  views.forEach(v => $(v).classList.toggle("hidden", v !== id));
  window.scrollTo({ top: 0, behavior: "smooth" });
}

function updateMeter() {
  $("meterFill").style.width = `${score}%`;
  $("meterHeart").style.left = `${score}%`;
  $("percent").textContent = `${persian(score)}٪`;
}

function renderQuestion() {
  const item = questions[index];

  $("stepLabel").textContent =
    `سؤال ${persian(index + 1)} از ${persian(questions.length)}`;

  $("questionNumber").textContent =
    persian(String(index + 1).padStart(2, "0"));

  $("questionEmoji").textContent = item.emoji;
  $("questionText").textContent = item.q;
  $("answers").innerHTML = "";

  [item.yes, item.no].forEach((label, choice) => {
    const button = document.createElement("button");
    button.className = "answer-btn";
    button.type = "button";
    button.textContent = label;
    button.addEventListener("click", () => choose(choice, button));
    $("answers").appendChild(button);
  });

  updateMeter();
}

function burst() {
  const host = $("heartBurst");
  const symbols = ["💗", "💕", "💘", "✨", "❤️"];

  for (let i = 0; i < 13; i++) {
    const particle = document.createElement("span");
    particle.className = "heart-particle";
    particle.textContent = symbols[i % symbols.length];
    particle.style.left = `${35 + Math.random() * 30}%`;
    particle.style.top = `${38 + Math.random() * 22}%`;
    particle.style.setProperty("--x", `${(Math.random() - 0.5) * 300}px`);
    particle.style.setProperty("--y", `${-70 - Math.random() * 230}px`);
    host.appendChild(particle);
    setTimeout(() => particle.remove(), 1200);
  }
}

function choose(choice, button) {
  if (button.disabled) return;

  [...$("answers").children].forEach(b => b.disabled = true);
  button.classList.add("selected");

  answers[index] = choice;
  score = Math.max(0, Math.min(100, score + (choice === 0 ? 10 : -10)));

  updateMeter();
  burst();

  setTimeout(() => {
    index++;

    if (index < questions.length) {
      renderQuestion();
    } else {
      showResult();
    }
  }, 850);
}

function showResult() {
  const positives = answers.filter(x => x === 0).length;
  const negatives = answers.length - positives;

  $("finalScore").textContent = `${persian(score)}٪`;
  $("positiveCount").textContent = persian(positives);
  $("negativeCount").textContent = persian(negatives);

  let message;

  if (positives >= 4) {
    message =
      "چه جواب‌های قشنگی! 💗 به نظر میاد از صحبت کردن و وقت گذروندن با هم حس خوبی داری. 🥹";
  } else if (positives >= 2) {
    message =
      "جواب‌هات یه ترکیب بامزه بود! 💕 شاید هنوز برای شناخت بیشتر همدیگه جا داشته باشیم.";
  } else {
    message =
      "ممنون که صادقانه جواب دادی! 🌷 مهم اینه که راحت باشی و همون حسی رو بگی که واقعاً داری.";
  }

  $("resultMessage").textContent = message;
  show("result");
  burst();
}

function makePayload() {
  return {
    name: "مبینا",
    answers: answers.map((answer, i) => ({
      question: questions[i].q,
      answer: answer === 0 ? questions[i].yes : questions[i].no,
      positive: answer === 0
    })),
    score,
    positiveCount: answers.filter(a => a === 0).length,
    negativeCount: answers.filter(a => a === 1).length,
    proposalResponse: finalChoice,
    completedAt: new Date().toISOString(),
    submissionId: crypto.randomUUID
      ? crypto.randomUUID()
      : `${Date.now()}-${Math.random().toString(16).slice(2)}`
  };
}

async function sendResult() {
  if (sending) return;

  sending = true;
  $("yesBtn").disabled = true;
  $("thinkBtn").disabled = true;
  $("sendStatus").textContent = "دارم نتیجه رو ارسال می‌کنم… 💌";

  try {
    const response = await fetch("/.netlify/functions/submit-result", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(makePayload())
    });

    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      throw new Error(data.error || "ارسال انجام نشد");
    }

    $("sendStatus").textContent =
      "نتیجه با موفقیت برای سازنده ارسال شد. 💗";

  } catch (error) {
    $("sendStatus").textContent =
      "نتونستم نتیجه رو ارسال کنم. لطفاً اتصال اینترنت رو بررسی کن و به سازنده خبر بده. 🌷";

    $("sendStatus").title = error.message;
    $("yesBtn").disabled = false;
    $("thinkBtn").disabled = false;
    sending = false;
  }
}

function answerProposal(choice) {
  if (finalChoice !== null) return;

  finalChoice = choice;

  $("responseBox").textContent =
    choice === "yes"
      ? "چه جواب قشنگی! ❤️ خوشحالم که این حس رو داری. امیدوارم هر اتفاقی می‌افته، قشنگ و از روی رضایت هر دومون باشه. 🥹"
      : "هیچ عجله‌ای نیست مبینا! 🙈 مهم اینه که با خیال راحت و وقتی خودت خواستی تصمیم بگیری. 🌷";

  $("responseBox").classList.remove("hidden");
  burst();
  sendResult();
}

$("startBtn").addEventListener("click", () => {
  index = 0;
  score = 50;
  answers = [];
  finalChoice = null;
  sending = false;

  $("responseBox").classList.add("hidden");
  $("responseBox").textContent = "";
  $("sendStatus").textContent = "";

  show("game");
  renderQuestion();
});

$("toProposalBtn").addEventListener("click", () => show("proposal"));
$("yesBtn").addEventListener("click", () => answerProposal("yes"));
$("thinkBtn").addEventListener("click", () => answerProposal("think"));
