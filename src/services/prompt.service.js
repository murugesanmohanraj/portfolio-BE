const portfolioContext = require("../data/portfolioContext");

function buildPortfolioPrompt(userMessage, overrides = {}) {
  const context = {
    ...portfolioContext,
    ...overrides,
  };

  const profile = context.profile || {};
  const name = profile.name || "Mohanraj";
  const role = profile.headline || profile.role || "";
  const summary = profile.summary || "";

  // flatten skills object into a single array
  let skillsList = [];
  if (context.skills && typeof context.skills === "object") {
    Object.values(context.skills).forEach((arr) => {
      if (Array.isArray(arr)) skillsList = skillsList.concat(arr);
    });
  }

  const skills = skillsList.join(", ");
  // Build a readable achievements summary (handle object or string entries)
  let achievementsList = [];
  if (Array.isArray(context.achievements)) {
    achievementsList = context.achievements.map((a) => {
      if (!a) return "";
      if (typeof a === "string") return a;
      return a.title || a.name || a.description || JSON.stringify(a);
    });
  }
  const highlights = achievementsList.join(" | ");

  // Career summary (if available)
  let careerSummary = "";
  if (context.careerFacts && context.careerFacts.experience) {
    const exp = context.careerFacts.experience;
    careerSummary =
      `${exp.years || ""} experience; current: ${exp.currentRole || ""} at ${exp.currentCompany || ""}`.trim();
  }

  // Suggestions
  const suggestionPrompts = (context.suggestions || [])
    .slice(0, 5)
    .map((s) => s.prompt || s)
    .join(" | ");

  const relevantKnowledge = getRelevantKnowledge(
    context.knowledge,
    userMessage,
  );
  const knowledgeSummary = relevantKnowledge.length
    ? relevantKnowledge
        .map((item) => `- ${item.title}: ${item.excerpt}`)
        .join("\n")
    : "- No specific markdown knowledge excerpt matched this question.";

  return `You are a helpful portfolio assistant for ${name}.\nYou are speaking as ${name} and should answer in a warm, concise, professional tone.\n\nPortfolio context:\n- Name: ${name}\n- Role: ${role}\n- Summary: ${summary}\n- Career: ${careerSummary}\n- Skills: ${skills}\n- Highlights: ${highlights}\n- FAQ count: ${(context.faqs || []).length}\n- Suggested prompts: ${suggestionPrompts}\n- Knowledge documents loaded: ${getKnowledgeCount(context.knowledge)}\n\nRelevant knowledge excerpts:\n${knowledgeSummary}\n\nUser message: ${userMessage}\n\nInstructions:\n- Answer naturally as a portfolio assistant.\n- Prefer structured facts from the JSON files (profile, experience, projects, skills, faqs, achievements, career-facts).\n- Use \`interview-answers.json\` for interview-style questions and \`recruiter-questions.json\` for recruiter-focused replies.\n- When relevant, use the markdown knowledge excerpts shown above to ground your response.\n- If the user asks for suggestions, return up to 3 items drawn from the suggestions list.\n- If it makes sense, return a small set of suggested actions to help the user navigate the site.\n- Return JSON only with this schema:\n{\n  "answer": "string",\n  "actions": [{ "type": "navigate|scroll|open|resume|contact", "target": "string" }],\n  "suggestions": ["string"]\n}`;
}

function flattenKnowledge(knowledge, prefix = "") {
  if (!knowledge || typeof knowledge !== "object") return [];
  return Object.entries(knowledge).flatMap(([key, value]) => {
    const pathKey = prefix ? `${prefix}/${key}` : key;
    if (typeof value === "string") {
      return [{ key: pathKey, title: pathKey, content: value }];
    }
    return flattenKnowledge(value, pathKey);
  });
}

function getKnowledgeCount(knowledge) {
  return flattenKnowledge(knowledge).length;
}

function getRelevantKnowledge(knowledge, userMessage) {
  const rawMessage = String(userMessage || "").toLowerCase();
  const tokens = [
    ...new Set(
      rawMessage
        .replace(/[^a-z0-9\s]/gi, " ")
        .split(/\s+/)
        .filter(Boolean),
    ),
  ];

  if (!tokens.length || !knowledge) return [];

  const scored = flattenKnowledge(knowledge)
    .map((doc) => {
      let score = 0;
      const source = `${doc.title} ${doc.content}`.toLowerCase();
      tokens.forEach((token) => {
        if (source.includes(token)) score += 1;
      });
      return { ...doc, score };
    })
    .filter((doc) => doc.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, 3);

  return scored.map((doc) => ({
    title: doc.key,
    excerpt:
      doc.content.replace(/\s+/g, " ").trim().slice(0, 400) +
      (doc.content.length > 400 ? "..." : ""),
  }));
}

module.exports = { buildPortfolioPrompt };
