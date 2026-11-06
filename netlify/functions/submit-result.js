
"use strict";

// ======================================
// ساخت پاسخ JSON
// ======================================

const json = (statusCode, body) => ({
  statusCode,

  headers: {
    "Content-Type": "application/json; charset=utf-8",
    "Cache-Control": "no-store"
  },

  body: JSON.stringify(body)
});

// ======================================
// تبدیل متن به متن امن برای HTML تلگرام
// ======================================

const escapeHtml = value =>
  String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");

// ======================================
// اعتبارسنجی اطلاعات دریافتی
// ======================================

function validateData(data) {
  if (!data || typeof data !== "object") {
    return false;
  }

  if (data.name !== "مبینا") {
    return false;
  }

  if (
    !Array.isArray(data.answers) ||
    data.answers.length !== 5
  ) {
    return false;
  }

  if (
    !["yes", "think"].includes(data.proposalResponse)
  ) {
    return false;
  }

  if (
    !Number.isFinite(Number(data.score)) ||
    Number(data.score) < 0 ||
    Number(data.score) > 100
  ) {
    return false;
  }

  if (
    typeof data.instagram !== "string" ||
    data.instagram.length > 100
  ) {
    return false;
  }

  for (const answer of data.answers) {
    if (
      !answer ||
      typeof answer.question !== "string" ||
      typeof answer.answer !== "string" ||
      typeof answer.positive !== "boolean"
    ) {
      return false;
    }

    if (
      answer.question.length > 500 ||
      answer.answer.length > 500
    ) {
      return false;
    }
  }

  return true;
}

// ======================================
// تابع اصلی Netlify
// ======================================

exports.handler = async event => {

  // فقط درخواست POST مجاز است
  if (event.httpMethod !== "POST") {
    return json(405, {
      error: "Method not allowed"
    });
  }

  // دریافت تنظیمات تلگرام از Netlify
  const token = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_CHAT_ID;

  if (!token || !chatId) {

    console.error(
      "Telegram environment variables are missing"
    );

    return json(500, {
      error: "تنظیمات تلگرام در سرور کامل نیست."
    });

  }

  // خواندن اطلاعات ارسالی سایت
  let data;

  try {

    data = JSON.parse(event.body || "{}");

  } catch {

    return json(400, {
      error: "اطلاعات ارسالی نامعتبر است."
    });

  }

  // اعتبارسنجی اطلاعات
  if (!validateData(data)) {

    return json(400, {
      error: "اطلاعات تست کامل یا معتبر نیست."
    });

  }

  // ======================================
  // ساخت متن پیام تلگرام
  // ======================================

  const positives = data.answers.filter(
    item => item.positive === true
  ).length;

  const negatives = data.answers.filter(
    item => item.positive === false
  ).length;

  const lines = [

    "💌 <b>نتیجه تست عاشقانه مبینا</b>",

    "",

    ...data.answers.map((item, index) =>
      `${index + 1}. ${escapeHtml(item.question)}\n` +
      `پاسخ: ${escapeHtml(item.answer)}`
    ),

    "",

    `💗 امتیاز نهایی: <b>${Number(data.score)}٪</b>`,

    `😍 پاسخ مثبت: ${positives}`,

    `🌷 پاسخ منفی: ${negatives}`,

    "",

    `📸 آیدی اینستاگرام: ${
      escapeHtml(data.instagram.trim() || "وارد نشده")
    }`,

    "",

    `💞 پاسخ نهایی: <b>${
      data.proposalResponse === "yes"
        ? "بله ❤️"
        : "نیاز به فکر بیشتر 🙈"
    }</b>`,

    `🕒 زمان: ${escapeHtml(
      data.completedAt || new Date().toISOString()
    )}`

  ];

  const message = lines.join("\n");

  // ======================================
  // ارسال پیام به تلگرام
  // ======================================

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

          text: message,

          parse_mode: "HTML"

        })

      }
    );

    let result;

    try {

      result = await response.json();

    } catch {

      console.error(
        "Telegram returned an invalid response"
      );

      return json(502, {
        error: "پاسخ تلگرام معتبر نبود."
      });

    }

    if (!response.ok || !result.ok) {

      console.error(
        "Telegram API error:",
        result.description || response.status
      );

      return json(502, {
        error: "ارسال پیام تلگرام ناموفق بود."
      });

    }

    // ارسال موفق
    return json(200, {
      ok: true,
      message: "نتیجه با موفقیت ارسال شد."
    });

  } catch (error) {

    console.error(
      "Telegram connection error:",
      error.message
    );

    return json(502, {
      error: "ارتباط با تلگرام برقرار نشد."
    });

  }

};
