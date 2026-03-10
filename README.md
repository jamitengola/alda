# ALDA Assistant (MVP)

MVP inspirado no fluxo do Cluely para produtividade em tarefas e formações, com foco em:

- Transcrição + resumo
- Assistente em tempo real (Q&A)
- Plano de estudos com tarefas
- Follow-up automático
- Base de conhecimento pessoal (RAG simples)

## Executar (Web)

```bash
npm install
npm run dev
```

Acesse `http://localhost:3000`.

## Modelos locais e cloud

O projeto suporta ambos por variável de ambiente:

- `AI_PROVIDER=mock` (sem custo, respostas mock)
- `AI_PROVIDER=ollama` (local/gratuito no teu computador)
- `AI_PROVIDER=openai` (cloud)

1. Copie `.env.example` para `.env.local`.
2. Escolha o provider.

### Exemplo local (Ollama)

```bash
ollama pull llama3.1:8b
cp .env.example .env.local
# edite: AI_PROVIDER=ollama
npm run dev
```

Para Ollama local (`localhost`), normalmente não precisa chave.
Se usar endpoint Ollama remoto/proxy com autenticação, preencha `OLLAMA_API_KEY`.

### Exemplo cloud (OpenAI)

```bash
cp .env.example .env.local
# edite: AI_PROVIDER=openai e OPENAI_API_KEY
npm run dev
```

## Executar (Desktop - Electron)

```bash
npm run desktop:dev
```

Esse comando sobe o Next.js e abre o app em uma janela desktop.

## Estrutura principal

- `src/app/page.tsx`: interface do MVP
- `src/app/api/*`: APIs mock dos 5 módulos
- `src/lib/knowledge-store.ts`: armazenamento em memória da base pessoal
- `electron/main.cjs`: processo principal do desktop

## Próximos passos recomendados

- Integrar STT real (ex.: Whisper/Azure Speech)
- Melhorar prompts e adicionar seleção de provider na interface
- Persistir dados em banco (SQLite/Postgres)
- Adicionar autenticação e workspace por usuário
