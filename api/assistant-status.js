module.exports = async (req, res) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET,POST,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    res.status(204).end();
    return;
  }

  if (req.method !== "GET") {
    res.status(405).json({ error: "Method not allowed" });
    return;
  }

  try {
    // require inside handler to avoid module-load crashes in serverless runtime
    const { checkLLMStatus } = require("../src/services/llm.service");
    const status = await checkLLMStatus();
    res.status(200).json(status);
  } catch (err) {
    console.error("assistant-status error:", err);
    res.status(500).json({ error: err?.message || String(err) });
  }
};
