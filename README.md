# Agent Botty

A self-hosted workspace UI for Manus API v2.

## Deploy on Render

1. Push this repository to GitHub.
2. In Render, choose **New → Blueprint** and connect this repository.
3. Render reads `render.yaml`.
4. During initial setup, provide `MANUS_API_KEY` when Render prompts for it.
5. Deploy.

The API key is server-side only and is never exposed to browser JavaScript.

## Local development

```bash
cp .env.example .env
# add MANUS_API_KEY to .env
npm install
npm run dev
```

Open http://localhost:10000.

## API routes

- `GET /api/health`
- `POST /api/tasks`
- `POST /api/tasks/:taskId/messages`
- `GET /api/tasks/:taskId/messages`
- `POST /api/projects`

Manus task creation uses API v2 and the `x-manus-api-key` authentication header.
