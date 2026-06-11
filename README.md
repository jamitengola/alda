# ALDA — AI Meeting Coach

ALDA is an open source AI meeting coach for preparation, real-time guidance, transcription, summaries and follow-up automation. It is designed for professionals, developers and small teams who want to improve meeting outcomes without depending on closed productivity suites.

> Status: early open source prototype. Contributions, issues and ideas are welcome.

## Why ALDA exists

Many professionals lose value after meetings because preparation is rushed, decisions are not captured and follow-ups are inconsistent. ALDA explores how AI can help people prepare better, communicate clearly and leave each meeting with actionable next steps.

The project is especially useful as a reusable base for Portuguese-speaking and African developer communities that want to build AI productivity tools using local-first or cloud AI providers.

## Features

- **Live coaching** — real-time suggestions for sales, pitch, negotiation, objections and difficult conversations.
- **Meeting preparation** — strategic briefing and interview/meeting simulation.
- **Transcription and summaries** — capture meeting content and generate clear summaries.
- **Automatic follow-up** — draft emails, checklists and next actions after meetings.
- **Performance tracking** — measure improvement across coaching sessions.
- **Local and cloud AI** — use mock mode, local Ollama models or OpenAI.
- **Desktop mode** — Electron shell for a lightweight desktop experience.

## Tech stack

- Next.js
- React
- TypeScript
- Electron
- SQLite via `better-sqlite3`
- OpenAI-compatible AI provider layer
- Ollama support for local models

## Getting started

### 1. Clone the repository

```bash
git clone https://github.com/jamitengola/alda.git
cd alda
```

### 2. Install dependencies

```bash
npm install
```

### 3. Configure environment variables

```bash
cp .env.example .env.local
```

Choose one provider:

```bash
AI_PROVIDER=mock
# or
AI_PROVIDER=ollama
# or
AI_PROVIDER=openai
```

### 4. Run the web app

```bash
npm run dev
```

Open `http://localhost:3000`.

### 5. Run the desktop app

```bash
npm run desktop:dev
```

## AI providers

### Mock mode

Useful for development without cost or external dependencies.

```env
AI_PROVIDER=mock
```

### Ollama local mode

```bash
ollama pull llama3.1:8b
```

```env
AI_PROVIDER=ollama
OLLAMA_BASE_URL=http://localhost:11434
OLLAMA_MODEL=llama3.1:8b
```

### OpenAI cloud mode

```env
AI_PROVIDER=openai
OPENAI_API_KEY=your_api_key_here
OPENAI_MODEL=gpt-4.1-mini
```

## Project structure

```txt
src/app/assistente/     Live coaching modes
src/app/preparacao/     Meeting preparation and simulation
src/app/transcricao/    Transcription and meeting summaries
src/app/followup/       Follow-up generation
src/app/performance/    Coaching metrics
src/app/api/            AI APIs and backend routes
electron/main.cjs       Desktop app entry point
```

## Open source impact

ALDA can serve as a practical reference for developers who want to build AI-first productivity tools with:

- local-first AI support through Ollama;
- cloud AI support through OpenAI;
- a modern TypeScript/Next.js codebase;
- desktop packaging with Electron;
- reusable workflows for meeting assistants, coaching tools and follow-up automation.

The project is maintained publicly to encourage collaboration, learning and reuse by developers in Angola, Portuguese-speaking communities and the wider open source ecosystem.

## Roadmap

- [ ] Improve automated tests
- [ ] Add authentication with email code
- [ ] Add calendar integration for automatic meeting preparation
- [ ] Improve desktop overlay experience
- [ ] Add prompt evaluation examples
- [ ] Add Docker support
- [ ] Publish contributor guide examples
- [ ] Create release notes for stable versions

## Contributing

Contributions are welcome. You can help by:

- opening issues with bugs or ideas;
- improving documentation;
- adding tests;
- improving AI prompts;
- reviewing accessibility and user experience;
- proposing integrations with calendar, email or CRM tools.

Please read [`CONTRIBUTING.md`](CONTRIBUTING.md) before submitting a pull request.

## Security

Do not commit API keys, tokens, `.env.local` files or meeting data. If you find a security issue, please follow [`SECURITY.md`](SECURITY.md).

## License

This project is licensed under the MIT License. See [`LICENSE`](LICENSE).