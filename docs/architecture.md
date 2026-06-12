# ALDA Architecture

ALDA is an AI-first meeting coach designed to run as a web application and as a lightweight desktop experience through Electron.

## Goals

- Help users prepare for meetings with structured AI guidance.
- Provide real-time coaching for pitches, sales, negotiations and difficult conversations.
- Generate meeting summaries, follow-ups and action items.
- Support both cloud AI and local AI models.
- Keep the codebase simple enough for learning, contribution and reuse.

## High-level architecture

```txt
User Interface
  ├── Next.js App Router pages
  ├── React components
  └── Desktop shell through Electron

Application Layer
  ├── Meeting preparation workflows
  ├── Live coaching workflows
  ├── Transcription and summary flows
  ├── Follow-up generation
  └── Performance tracking

AI Provider Layer
  ├── Mock provider for development
  ├── Ollama provider for local models
  └── OpenAI-compatible provider for cloud models

Data Layer
  └── SQLite through better-sqlite3
```

## Main folders

```txt
src/app/assistente/     Live coaching modes
src/app/preparacao/     Meeting preparation and simulation
src/app/transcricao/    Transcription and meeting summaries
src/app/followup/       Follow-up generation
src/app/performance/    Coaching metrics
src/app/api/            Backend routes and AI endpoints
electron/               Desktop application entry points
```

## AI provider strategy

ALDA is designed to avoid hard-coupling the application to a single AI provider.

Supported modes:

- `mock`: development without external cost or dependencies.
- `ollama`: local AI models for privacy and offline experimentation.
- `openai`: cloud AI through OpenAI-compatible APIs.

This makes the project useful for developers who want to study AI product architecture without being locked into one provider.

## Desktop strategy

Electron is used as a shell around the web application, allowing the project to evolve as both a browser-based tool and a desktop productivity assistant.

## Data strategy

SQLite is used to keep local development simple and to support local-first use cases. Future versions may add optional sync or external database support.

## Future improvements

- Add automated tests for API routes and AI provider logic.
- Add prompt evaluation examples.
- Add Docker support.
- Add calendar and email integrations.
- Improve desktop overlay mode.
- Add a stable plugin/integration architecture.
