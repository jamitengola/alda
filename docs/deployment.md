# Deployment Guide

This guide explains how to deploy ALDA as a web application.

ALDA can run in three AI modes:

- `mock` — default mode for demos and development without external API keys.
- `ollama` — local or remote Ollama server.
- `openai` — OpenAI-compatible cloud provider.

## Recommended first deployment

For the first public demo, use `mock` mode. This allows anyone to try the app without paid API keys or a local model server.

```env
AI_PROVIDER=mock
NEXT_PUBLIC_APP_NAME=ALDA
NEXT_PUBLIC_APP_URL=https://your-demo-url.example.com
```

## Deploying to Vercel

1. Import the repository into Vercel.
2. Select the web application settings detected by Vercel.
3. Add the environment variables below.
4. Deploy the project.
5. Open the deployment URL and test the main workflows.

### Environment variables for mock mode

```env
AI_PROVIDER=mock
NEXT_PUBLIC_APP_NAME=ALDA
NEXT_PUBLIC_APP_URL=https://your-demo-url.example.com
```

### Environment variables for OpenAI-compatible mode

```env
AI_PROVIDER=openai
OPENAI_API_KEY=your_api_key_here
OPENAI_MODEL=gpt-4.1-mini
NEXT_PUBLIC_APP_NAME=ALDA
NEXT_PUBLIC_APP_URL=https://your-demo-url.example.com
```

Optional:

```env
OPENAI_BASE_URL=https://api.openai.com/v1/chat/completions
```

### Environment variables for Ollama mode

For a remote Ollama server:

```env
AI_PROVIDER=ollama
OLLAMA_BASE_URL=https://your-ollama-server.example.com
OLLAMA_MODEL=llama3.1:8b
OLLAMA_API_KEY=optional_api_key
NEXT_PUBLIC_APP_NAME=ALDA
NEXT_PUBLIC_APP_URL=https://your-demo-url.example.com
```

For local development:

```env
AI_PROVIDER=ollama
OLLAMA_BASE_URL=http://localhost:11434
OLLAMA_MODEL=llama3.1:8b
```

## Build command

```bash
npm run build
```

## Local production test

Before deploying, test the production build locally:

```bash
npm install
npm run build
npm run start
```

Open `http://localhost:3000`.

## Security notes

- Do not expose API keys in client-side code.
- Do not commit `.env.local` files.
- Do not use private meeting transcripts in public demos.
- Prefer `mock` mode for public demo environments unless a secure backend configuration is available.

## README demo link

When a public demo is available, update the README `Demo` section with the live URL.