const { getAssistantReply } = require('../src/services/llm.service');

module.exports = async (req, res) => {
  // simple CORS handling so Netlify frontend can call this
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.status(204).end();
    return;
  }

  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  try {
    const body = req.body ? (typeof req.body === 'object' ? req.body : JSON.parse(req.body)) : {};
    const question = body.question || body.message || '';
    const options = body.options || {};

    const reply = await getAssistantReply(question, options);
    res.status(200).json(reply);
  } catch (err) {
    res.status(500).json({ error: err?.message || String(err) });
  }
};
