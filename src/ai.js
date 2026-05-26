import fetch from "node-fetch";

  const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
  const OPENAI_BASE_URL = process.env.OPENAI_BASE_URL || "https://api.openai.com/v1";

  export async function classifyPriority(subject, content) {
    if (!OPENAI_API_KEY) return "medium";
    try {
      const res = await fetch(`${OPENAI_BASE_URL}/chat/completions`, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${OPENAI_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "gpt-4o-mini",
          max_tokens: 20,
          messages: [
            {
              role: "system",
              content: `Classify ticket priority. Reply ONLY with one word: low, medium, high, or critical.`
            },
            {
              role: "user",
              content: `Subject: ${subject || "N/A"}\nContent: ${content || "N/A"}`
            }
          ],
          temperature: 0.1,
        }),
      });
      if (!res.ok) return "medium";
      const data = await res.json();
      const answer = data.choices?.[0]?.message?.content?.toLowerCase().trim() || "medium";
      if (["low", "medium", "high", "critical"].includes(answer)) return answer;
      return "medium";
    } catch (err) {
      console.error("[AI] classifyPriority error:", err.message);
      return "medium";
    }
  }

  export async function suggestTags(subject, content) {
    if (!OPENAI_API_KEY) return [];
    try {
      const res = await fetch(`${OPENAI_BASE_URL}/chat/completions`, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${OPENAI_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "gpt-4o-mini",
          max_tokens: 40,
          messages: [
            {
              role: "system",
              content: `Suggest 1-3 relevant tags for a support ticket. Reply ONLY as comma-separated tags, no explanation.`
            },
            {
              role: "user",
              content: `Subject: ${subject || "N/A"}\nContent: ${content || "N/A"}`
            }
          ],
          temperature: 0.2,
        }),
      });
      if (!res.ok) return [];
      const data = await res.json();
      const answer = data.choices?.[0]?.message?.content?.trim() || "";
      return answer.split(",").map(t => t.trim().toLowerCase()).filter(t => t.length > 1 && t.length < 25);
    } catch (err) {
      console.error("[AI] suggestTags error:", err.message);
      return [];
    }
  }

  export async function faqAnswer(question) {
    if (!OPENAI_API_KEY) return null;
    try {
      const res = await fetch(`${OPENAI_BASE_URL}/chat/completions`, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${OPENAI_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "gpt-4o-mini",
          max_tokens: 150,
          messages: [
            {
              role: "system",
              content: `You are a helpful support assistant for a Discord ticket bot called Resolvo Tool. Answer concisely in the same language as the user (German or English). If you cannot help, reply with "ESCALATE".`
            },
            { role: "user", content: question }
          ],
          temperature: 0.3,
        }),
      });
      if (!res.ok) return null;
      const data = await res.json();
      const answer = data.choices?.[0]?.message?.content?.trim();
      if (!answer || answer.toUpperCase().includes("ESCALATE")) return null;
      return answer;
    } catch (err) {
      console.error("[AI] faqAnswer error:", err.message);
      return null;
    }
  }

  export async function analyzeSentimentAI(text) {
    if (!OPENAI_API_KEY) return 0;
    try {
      const res = await fetch(`${OPENAI_BASE_URL}/chat/completions`, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${OPENAI_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "gpt-4o-mini",
          max_tokens: 10,
          messages: [
            {
              role: "system",
              content: "Rate the sentiment of this support message from -1 (very negative) to 1 (very positive). Reply ONLY with a number between -1 and 1."
            },
            { role: "user", content: text }
          ],
          temperature: 0.1,
        }),
      });
      if (!res.ok) return 0;
      const data = await res.json();
      const val = parseFloat(data.choices?.[0]?.message?.content);
      return isNaN(val) ? 0 : Math.max(-1, Math.min(1, val));
    } catch (err) {
      console.error("[AI] sentiment error:", err.message);
      return 0;
    }
  }
  