const test = require("node:test");
const assert = require("node:assert/strict");
const { getAssistantReply } = require("./server");

test("returns a helpful answer for React questions", async () => {
  const reply = await getAssistantReply("Tell me about React experience");
  assert.match(reply.answer.toLowerCase(), /react/);
  assert.ok(reply.actions.some((action) => action.type === "projects"));
});
