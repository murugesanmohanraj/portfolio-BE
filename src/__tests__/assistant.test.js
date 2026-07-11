const test = require("node:test");
const assert = require("node:assert/strict");
const portfolioContext = require("../data/portfolioContext");
const { buildPortfolioPrompt } = require("../services/prompt.service");
const { buildAssistantMessages } = require("../services/llm.service");
const { normalizeAssistantResponse } = require("../utils/responseFormatter");

test("buildPortfolioPrompt includes portfolio context and user question", () => {
  const prompt = buildPortfolioPrompt("Tell me about your React experience", {
    name: "Mohanraj Murugesan",
    role: "Senior Full Stack Engineer",
  });

  assert.match(prompt, /Mohanraj Murugesan/);
  assert.match(prompt, /React experience/);
  assert.match(prompt, /Return JSON/);
});

test("buildPortfolioPrompt includes relevant markdown knowledge excerpts", () => {
  const prompt = buildPortfolioPrompt("Tell me about the AI assistant", {
    knowledge: {
      projects: {
        "ai-portfolio-assistant":
          "# AI Portfolio Assistant\nThis doc explains the assistant in detail.",
      },
    },
  });

  assert.match(prompt, /Relevant knowledge excerpts:/);
  assert.match(prompt, /ai-portfolio-assistant/);
});

test("portfolioContext exports system prompt and markdown knowledge", () => {
  assert.ok(portfolioContext.systemPrompt);
  assert.ok(portfolioContext.knowledge);
  assert.ok(portfolioContext.knowledge.projects);
  assert.ok(portfolioContext.knowledge.projects["ai-portfolio-assistant"]);
});

test("buildAssistantMessages uses the portfolio system prompt", () => {
  const messages = buildAssistantMessages("What is your purpose?", {
    context: {},
  });
  assert.equal(messages.length, 2);
  assert.equal(messages[0].role, "system");
  assert.ok(
    messages[0].content.includes("AI Portfolio Assistant System Prompt"),
  );
  assert.equal(messages[1].role, "user");
  assert.ok(
    messages[1].content.includes("You are a helpful portfolio assistant for"),
  );
});

test("normalizeAssistantResponse returns a structured payload", () => {
  const payload = normalizeAssistantResponse({
    answer: "I have strong React experience.",
    actions: [{ type: "scroll", target: "projects" }],
    suggestions: ["Show React projects"],
  });

  assert.equal(payload.answer, "I have strong React experience.");
  assert.equal(payload.actions[0].type, "scroll");
  assert.deepEqual(payload.suggestions, ["Show React projects"]);
});
