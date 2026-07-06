# Portfolio Assistant Backend

This backend powers the AI portfolio assistant used by the frontend.

## Setup

Create a `.env` file in the `Backend` folder to configure the LLM provider.

```env
LLM_PROVIDER=fallback
OPENAI_API_KEY=
OPENAI_MODEL=gpt-4o-mini
PORT=5000
```

- `LLM_PROVIDER=openai` enables live OpenAI responses.
- `OPENAI_API_KEY` should contain your OpenAI API key.
- `OPENAI_MODEL` can be changed when using OpenAI.
- `PORT` controls the backend port.

## Running locally

Install dependencies if needed, then from `Backend` run:

```bash
npm start
```

## API

The assistant endpoint is:

- `POST /api/assistant`

Request body:

```json
{
  "message": "Tell me about your React experience"
}
```

Response shape:

```json
{
  "answer": "string",
  "actions": [{ "label": "string", "type": "string" }],
  "suggestions": ["string"],
  "mode": "openai|fallback|unknown"
}
```
