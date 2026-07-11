const { getAssistantReply } = require("../src/services/llm.service");

(async () => {
  try {
    const q = "Summarize Mohanraj's experience in two sentences.";
    console.log("Question:", q);
    console.log("Loading env:", {
      LLM_PROVIDER: process.env.LLM_PROVIDER,
      AI_API_BASE_URL: process.env.AI_API_BASE_URL,
      AI_MODEL: process.env.AI_MODEL,
      hasKey: !!process.env.AI_API_KEY,
    });
    console.log("Building request...");
    const res = await getAssistantReply(q, {});
    console.log("Assistant response:");
    console.log(JSON.stringify(res, null, 2));
  } catch (err) {
    console.error("Error running live test:", err);
    process.exit(1);
  }
})();
