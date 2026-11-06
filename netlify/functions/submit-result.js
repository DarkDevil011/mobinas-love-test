const { getStore } = require("@netlify/blobs");

const json = (statusCode, body) => ({
  statusCode,
  headers: { "Content-Type": "application/json; charset=utf-8", "Cache-Control": "no-store" },
  body: JSON.stringify(body)
});

exports.handler = async (event) => {
  if (event.httpMethod !== "POST") return json(405, { error: "Method not allowed" });
  const token = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_CHAT_ID;
  if (!token || !chatId) return json(503, { error: "ارسال‌دهنده هنوز در تنظیمات سرور فعال نشده است." });

  let data;
  try { data = JSON.parse(event.body || "{}"); } catch { return json(400, { error: "درخواست نامعتبر است." }); }
  if (!data || data.name !== "مبینا" || !Array.isArray(data.answers) || data.answers.length !== 5 ||
      !["yes", "think"].includes(data.proposalResponse) ||
      !Number.isInteger(data.score) || data.score < 0 || data.score > 100 ||
      typeof data.submissionId !== "string" || data.submissionId.length > 100) {
    return json(400, { error: "اطلاعات تست کامل یا معتبر نیست." });
  }
  for (const a of data.answers) {
    if (!a || typeof a.question !== "string" || typeof a.answer !== "string" ||
        typeof a.positive !== "boolean" || a.question.length > 250 || a.answer.length > 250) {
      return json(400, { error: "پاسخ‌های ارسالی معتبر نیستند." });
    }
  }

  try {
    const store = getStore("mobina-love-test-submissions");
    const key = data.submissionId.replace(/[^a-zA-Z0-9_-]/g, "").slice(0, 100);
    if (!key) return json(400, { error: "شناسه ارسال نامعتبر است." });
    if (await store.get(key)) return json(200, { ok: true, duplicate: true });

    const faDate = data.completedAt ? new Date(data.completedAt) : new Date();
    const dateText = Number.isNaN(faDate.getTime()) ? new Date().toISOString() : faDate.toLocaleString("fa-IR", { timeZone: "Asia/Tehran" });
    const lines = [
      "💌 تست عاشقانه مبینا تکمیل شد!",
      "",
      "👩 نام: مبینا",
      "",
      "💗 پاسخ‌ها:",
      ...data.answers.map((a, i) => `${["۱","۲","۳","۴","۵"][i]}. ${a.answer}`),
      "",
      `📊 نتیجه نهایی: ${data.score} درصد`,
      `💞 پاسخ مثبت: ${data.positiveCount} | پاسخ منفی: ${data.negativeCount}`,
      `❤️ پاسخ به پیشنهاد رابطه: ${data.proposalResponse === "yes" ? "آرههههه 😍❤️" : "بذار بیشتر فکر کنم 🙈"}`,
      `🕰 تاریخ و ساعت: ${dateText}`
    ];
    const telegramResponse = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ chat_id: chatId, text: lines.join("\n") })
    });
    const telegramData = await telegramResponse.json().catch(() => ({}));
    if (!telegramResponse.ok || !telegramData.ok) {
      console.error("Telegram send failed", telegramData);
      return json(502, { error: "ارسال پیام تلگرام ناموفق بود." });
    }
    await store.set(key, JSON.stringify({ sentAt: new Date().toISOString() }));
    return json(200, { ok: true });
  } catch (error) {
    console.error("Submission function failed", error);
    return json(500, { error: "خطای داخلی هنگام ثبت نتیجه." });
  }
};
