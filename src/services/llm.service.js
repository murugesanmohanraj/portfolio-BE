const { buildPortfolioPrompt } = require("./prompt.service");
const { normalizeAssistantResponse } = require("../utils/responseFormatter");

async function getAssistantReply(userMessage, options = {}) {
  const prompt = buildPortfolioPrompt(userMessage, options.context);

  if (process.env.LLM_PROVIDER !== "openai") {
    const normalized = (userMessage || "").trim().toLowerCase();
    const actions = [];
    let answer =
      "I can help you explore the portfolio; ask about experience, React, projects, or skills.";

    if (!normalized) {
      answer =
        "Please ask a question about Mohanraj's experience, projects, or skills.";
      actions.push({ label: "View projects", type: "projects" });
      actions.push({ label: "See skills", type: "skills" });
      actions.push({ label: "Contact me", type: "contact" });
    } else if (normalized.includes("react")) {
      answer =
        "Mohanraj has strong React experience building interactive user interfaces, stateful applications, and polished frontend experiences.";
      actions.push({ label: "View projects", type: "projects" });
      actions.push({ label: "See skills", type: "skills" });
    } else if (normalized.includes("project")) {
      answer =
        "His portfolio includes React applications, interactive dashboards, and product-driven web experiences designed for strong UX.";
      actions.push({ label: "View projects", type: "projects" });
    } else if (normalized.includes("skill")) {
      answer =
        "His key skills include React, Node.js, JavaScript, GraphQL, and modern frontend engineering practices.";
      actions.push({ label: "See skills", type: "skills" });
    } else if (normalized.includes("contact") || normalized.includes("hire")) {
      answer =
        "You can get in touch through the contact section or by viewing the resume for more details.";
      actions.push({ label: "Contact me", type: "contact" });
      actions.push({ label: "Open resume", type: "resume" });
    } else {
      actions.push({ label: "View projects", type: "projects" });
      actions.push({ label: "See skills", type: "skills" });
    }

    return normalizeAssistantResponse({
      answer,
      actions,
      suggestions: ["Explore projects", "View resume", "Contact me"],
      mode: "fallback",
    });
  }

  const apiKey =
    process.env.AI_API_KEY ||
    process.env.BYNARA_API_KEY ||
    process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return normalizeAssistantResponse({
      answer:
        "The AI service is not configured yet. Please add AI_API_KEY, BYNARA_API_KEY, or OPENAI_API_KEY to enable live responses.",
      actions: [],
      suggestions: ["Try a simple question", "Use the fallback experience"],
      mode: "fallback",
    });
  }

  const baseUrl = (
    process.env.AI_API_BASE_URL ||
    process.env.OPENAI_API_BASE_URL ||
    "https://api.openai.com/v1"
  ).replace(/\/$/, "");
  const model =
    process.env.AI_MODEL || process.env.OPENAI_MODEL || "gpt-4o-mini";
  const endpoint = `${baseUrl}/chat/completions`;

  try {
    const response = await fetch(endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model,
        temperature: 0.3,
        messages: [
          { role: "system", content: "You are a helpful portfolio assistant." },
          { role: "user", content: prompt },
        ],
      }),
    });

    if (!response.ok) {
      const text = await response.text();
      console.error(
        `OpenAI request failed with ${response.status} ${response.statusText}: ${text}`,
      );
      throw new Error(`OpenAI request failed with ${response.status}`);
    }

    const data = await response.json();
    const content = data?.choices?.[0]?.message?.content || "";
    let parsed = null;
    // Try to parse JSON directly, but tolerate markdown/code fences or surrounding text.
    const tryParse = (txt) => {
      try {
        return JSON.parse(txt);
      } catch (e) {
        return null;
      }
    };

    // First, try raw content
    parsed = tryParse(content);

    // If raw parse failed, strip markdown code fences like ```json ... ```
    if (!parsed) {
      let cleaned = String(content || "").trim();
      cleaned = cleaned
        .replace(/^```(?:json)?\s*/i, "")
        .replace(/```\s*$/i, "");
      parsed = tryParse(cleaned);
      // If still not parsed, try extracting the first JSON object by braces
      if (!parsed) {
        const first = cleaned.indexOf("{");
        const last = cleaned.lastIndexOf("}");
        if (first !== -1 && last !== -1 && last > first) {
          const snippet = cleaned.slice(first, last + 1);
          parsed = tryParse(snippet);
        }
      }
    }

    if (!parsed) {
      console.warn(
        "OpenAI assistant: response content is not valid JSON after attempts; using raw content as answer.",
      );
      parsed = { answer: String(content) };
    }

    return normalizeAssistantResponse({
      ...parsed,
      mode: "openai",
    });
  } catch (error) {
    console.error("OpenAI assistant error:", error?.message || error);
    return normalizeAssistantResponse({
      answer:
        "The AI service was unavailable, so I switched to a fallback response.",
      actions: [],
      suggestions: ["Try again in a moment", "Explore the portfolio sections"],
      mode: "fallback",
    });
  }
}

module.exports = { getAssistantReply };

async function checkLLMStatus() {
  const apiKey =
    process.env.AI_API_KEY ||
    process.env.BYNARA_API_KEY ||
    process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return { status: "unconfigured", detail: "No API key configured" };
  }

  const baseUrl = (
    process.env.AI_API_BASE_URL ||
    process.env.OPENAI_API_BASE_URL ||
    "https://api.openai.com/v1"
  ).replace(/\/$/, "");
  const model =
    process.env.AI_MODEL || process.env.OPENAI_MODEL || "gpt-4o-mini";
  const endpoint = `${baseUrl}/chat/completions`;

  try {
    const response = await fetch(endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model,
        messages: [{ role: "user", content: "Ping" }],
        temperature: 0,
      }),
    });

    if (!response.ok) {
      const text = await response.text();
      return { status: "error", code: response.status, detail: text };
    }

    const data = await response.json();
    if (data?.choices && data.choices.length > 0) {
      return { status: "openai", detail: "ok" };
    }

    return { status: "unknown", detail: "unexpected response" };
  } catch (err) {
    return { status: "error", detail: err?.message || String(err) };
  }
}

module.exports.checkLLMStatus = checkLLMStatus;
