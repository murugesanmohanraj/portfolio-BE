require("dotenv").config();
const http = require("http");
const {
  getAssistantReply,
  checkLLMStatus,
} = require("./src/services/llm.service");

const PORT = process.env.PORT || 5000;

async function handleAssistantRequest(body) {
  const parsed = body ? JSON.parse(body) : {};
  const question = parsed.question || parsed.message || "";
  const options = parsed.options || {};
  return getAssistantReply(question, options);
}

function getAnswer(question) {
  return getAssistantReply(question).answer;
}

const server = http.createServer(async (req, res) => {
  if (req.method === "OPTIONS") {
    res.writeHead(200, {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET,POST,OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
    });
    res.end();
    return;
  }

  if (req.url && req.url.startsWith("/api/assistant")) {
    if (req.url === "/api/assistant/status") {
      try {
        const status = await checkLLMStatus();
        res.writeHead(200, {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*",
        });
        res.end(JSON.stringify(status));
      } catch (error) {
        res.writeHead(500, {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*",
        });
        res.end(
          JSON.stringify({
            status: "error",
            detail: error?.message || String(error),
          }),
        );
      }
      return;
    }
    let body = "";
    req.on("data", (chunk) => {
      body += chunk;
    });

    req.on("end", async () => {
      try {
        const reply = await handleAssistantRequest(body);
        res.writeHead(200, {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*",
        });
        res.end(JSON.stringify(reply));
      } catch (error) {
        res.writeHead(500, {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*",
        });
        res.end(
          JSON.stringify({
            answer: "The assistant is currently unavailable.",
            actions: [],
            suggestions: [],
          }),
        );
      }
    });
    return;
  }

  res.writeHead(404, { "Content-Type": "application/json" });
  res.end(JSON.stringify({ error: "Not found" }));
});

if (require.main === module) {
  server.listen(PORT, () => {
    console.log(`Portfolio assistant backend running on port ${PORT}`);
  });
}

module.exports = {
  getAnswer,
  getAssistantReply,
  createServer: () => server,
};
