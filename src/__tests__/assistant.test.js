const test = require("node:test");
const assert = require("node:assert/strict");
const { buildPortfolioPrompt } = require("../services/prompt.service");
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
