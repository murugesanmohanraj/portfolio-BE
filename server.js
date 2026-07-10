require("dotenv").config();
const http = require("http");
const {
  getAssistantReply,
  checkLLMStatus,
} = require("./src/services/llm.service");

const PORT = process.env.PORT || 5000;

async function readBody(req) {
  if (req.body !== undefined) {
    return req.body;
  }

  if (req.method === "GET" || req.method === "HEAD") {
    return {};
  }

  return new Promise((resolve, reject) => {
    let body = "";
    req.on("data", (chunk) => {
      body += chunk;
    });
    req.on("end", () => {
      if (!body) {
        resolve({});
        return;
      }

      try {
        resolve(JSON.parse(body));
      } catch (error) {
        resolve({});
      }
    });
    req.on("error", reject);
  });
}

async function handleAssistantRequest(body) {
  const parsed = body || {};
  const question = parsed.question || parsed.message || "";
  const options = parsed.options || {};
  return getAssistantReply(question, options);
}

function getAnswer(question) {
  return getAssistantReply(question).answer;
}

async function handler(req, res) {
  const origin = req.headers.origin || "*";

  if (req.method === "OPTIONS") {
    res.writeHead(204, {
      "Access-Control-Allow-Origin": origin,
      "Access-Control-Allow-Methods": "GET,POST,OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
    });
    res.end();
    return;
  }

  const url = new URL(
    req.url || "/",
    `http://${req.headers.host || "localhost"}`,
  );
  const pathname = url.pathname;

  if (pathname === "/" || pathname === "/health") {
    res.writeHead(200, {
      "Content-Type": "application/json",
      "Access-Control-Allow-Origin": origin,
    });
    res.end(
      JSON.stringify({ status: "ok", service: "portfolio-assistant-backend" }),
    );
    return;
  }

  if (
    pathname === "/api/assistant-status" ||
    pathname === "/assistant-status" ||
    pathname === "/api/assistant/status"
  ) {
    try {
      const status = await checkLLMStatus();
      res.writeHead(200, {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": origin,
      });
      res.end(JSON.stringify(status));
    } catch (error) {
      res.writeHead(500, {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": origin,
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

  if (pathname === "/api/assistant" || pathname === "/assistant") {
    try {
      const body = await readBody(req);
      const reply = await handleAssistantRequest(body);
      res.writeHead(200, {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": origin,
      });
      res.end(JSON.stringify(reply));
    } catch (error) {
      res.writeHead(500, {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": origin,
      });
      res.end(
        JSON.stringify({
          answer: "The assistant is currently unavailable.",
          actions: [],
          suggestions: [],
        }),
      );
    }
    return;
  }

  res.writeHead(404, {
    "Content-Type": "application/json",
    "Access-Control-Allow-Origin": origin,
  });
  res.end(JSON.stringify({ error: "Not found" }));
}

if (require.main === module) {
  const server = http.createServer((req, res) => {
    handler(req, res).catch((error) => {
      res.writeHead(500, {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
      });
      res.end(JSON.stringify({ error: error?.message || String(error) }));
    });
  });

  server.listen(PORT, () => {
    console.log(`Portfolio assistant backend running on port ${PORT}`);
  });
}

module.exports = handler;
module.exports.getAnswer = getAnswer;
module.exports.getAssistantReply = getAssistantReply;
module.exports.checkLLMStatus = checkLLMStatus;
