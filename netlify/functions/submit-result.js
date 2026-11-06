
const json = (statusCode, body) => ({
  statusCode,
  headers: {
    "Content-Type": "application/json; charset=utf-8",
    "Cache-Control": "no-store"
  },
  body: JSON.stringify(body)
});

exports.handler = async (event) => {
  if (event.httpMethod !== "POST") {
    return json(405, { error: "Method not allowed" });
  }

  const token = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_CHAT_ID;

  if (!token || !chatId) {
    console.error("Telegram environment variables are missing");
    return json(500, { error: "تنظیمات تلگرام در سرور کامل نیست." });
  }

  let data;

  try {
    data = JSON.parse(event.body || "{}");
  } catch {
    return json(400, { error: "اطلاعات ارسالی نامعتبر است." });
  }

  if (
    !data ||
    data.name !== "مبینا" ||
    !Array.isArray(data.answers) ||
    data.answers.length !== 5 ||
    !["yes", "think"].includes(data.proposalResponse)
  ) {
    return json(400, { error: "اطلاعات تست کامل نیست." });
  }

  const escapeHtml = (value) =>
    String(value ?? "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;");

  const lines = [
    "💌 <b>نتیجه تست عاشقانه مبینا</b>",
    "",
    ...data.answers.map((item, index) =>
      `${index + 1}. ${escapeHtml(item.question)}\nپاسخ: ${escapeHtml(item.answer)}`
    ),
    "",
    `💗 امتیاز نهایی: <b>${Number(data.score) || 0}٪</b>`,
    `😍 پاسخ مثبت: ${Number(data.positiveCount) || 0}`,
    `🌷 پاسخ منفی: ${Number(data.negativeCount) || 0}`,
    `💞 پاسخ نهایی: <b>${data.proposalResponse === "yes" ? "بله ❤️" : "نیاز به فکر بیشتر 🙈"}</b>`,
    `📸 آیدی اینستاگرام: ${escapeHtml(data.instagram || "وارد نشده")}`,
    `🕒 زمان: ${escapeHtml(data.completedAt || new Date().toISOString())}`
  ];

  try {
    const response = await fetch(
      `https://api.telegram.org/bot${token}/sendMessage`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          chat_id: chatId,
          text: lines.join("\n"),
          parse_mode: "HTML"
        })
      }
    );

    const result = await response.json();

    if (!response.ok || !result.ok) {
      console.error("Telegram error:", result);
      return json(502, { error: "ارسال پیام تلگرام ناموفق بود." });
    }

    return json(200, { ok: true });

  } catch (error) {
    console.error("Telegram connection error:", error);
    return json(502, { error: "ارتباط با تلگرام برقرار نشد." });
  }
};
