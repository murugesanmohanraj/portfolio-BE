require("dotenv").config();
const { getAssistantReply } = require("../src/services/llm.service");

(async () => {
  try {
    const res = await getAssistantReply("Final check after relink");
    console.log("RESULT");
    console.log(JSON.stringify(res, null, 2));
  } catch (e) {
    console.error("TEST ERROR", e);
    process.exit(1);
  }
})();
