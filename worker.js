// language: JavaScript, file: worker.js

export default {
  async fetch(request, env) {
    // CORS aur POST request handle karna
    if (request.method === "OPTIONS") {
      return new Response(null, {
        headers: {
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Methods": "POST, OPTIONS",
          "Access-Control-Allow-Headers": "Content-Type"
        }
      });
    }

    if (request.method !== "POST") {
      return new Response(JSON.stringify({ status: false, error: "Method Not Allowed" }), {
        status: 405,
        headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" }
      });
    }

    try {
      // Lua script se aane wala data padhna
      const formData = await request.formData();
      const base64Image = formData.get("base64_image");
      const caption = formData.get("caption") || "New Feedback";
      const botToken = formData.get("bot_token");
      const chatId = formData.get("chat_id");

      if (!base64Image || !botToken || !chatId) {
        return new Response(JSON.stringify({ status: false, error: "Missing required fields (image, bot_token, chat_id)" }), {
          status: 400,
          headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" }
        });
      }

      // Base64 image ko Blob (File) me convert karna
      const binaryStr = atob(base64Image);
      const bytes = new Uint8Array(binaryStr.length);
      for (let i = 0; i < binaryStr.length; i++) {
        bytes[i] = binaryStr.charCodeAt(i);
      }
      const blob = new Blob([bytes], { type: 'image/jpeg' });

      // Telegram ke liye FormData tayar karna
      const tgFormData = new FormData();
      tgFormData.append("chat_id", chatId);
      tgFormData.append("caption", caption);
      tgFormData.append("parse_mode", "HTML");
      tgFormData.append("photo", blob, "screenshot.jpg");

      // Telegram API par bhejna
      const tgRes = await fetch(`https://api.telegram.org/bot${botToken}/sendPhoto`, {
        method: "POST",
        body: tgFormData
      });

      const tgJson = await tgRes.json();

      // Lua script ko exactly is response ki zaroorat hai
      if (tgJson.ok) {
        return new Response(JSON.stringify({ status: true }), {
          status: 200,
          headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" }
        });
      } else {
        return new Response(JSON.stringify({ status: false, error: tgJson.description }), {
          status: 500,
          headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" }
        });
      }
    } catch (error) {
      return new Response(JSON.stringify({ status: false, error: error.message }), {
        status: 500,
        headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" }
      });
    }
  }
};
