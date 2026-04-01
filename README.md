# ALDA — Coach de IA para Reuniões de Alto Impacto

Coaching em tempo real, preparação inteligente e follow-up automático — tudo invisível no seu Mac.

## O que faz

- **Coaching ao Vivo** — sugestões de IA em tempo real enquanto fala (vendas, pitch, negociação, objeções)
- **Preparação de Reunião** — briefing estratégico + simulação de entrevista
- **Transcrição + Resumo** — capture e resuma qualquer reunião
- **Follow-up Automático** — gere emails e checklists pós-reunião com um clique
- **Performance** — métricas e evolução das suas sessões de coaching

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

- `src/app/assistente/` — Coaching ao vivo com 6 modos (vendas, pitch, negociação, objeções, etc.)
- `src/app/preparacao/` — Briefing estratégico + simulação de entrevista
- `src/app/transcricao/` — Transcrição e resumo de reuniões
- `src/app/followup/` — Follow-up automático pós-reunião
- `src/app/performance/` — Métricas e evolução do coaching
- `src/app/api/*` — APIs de IA para cada módulo
- `electron/main.cjs` — App desktop macOS com overlay transparente

## Próximos passos

- Autenticação de utilizador (email + código)
- Modelo freemium (3 sessões/mês grátis)
- Integração com calendário para sugerir preparação automática
- Score de performance por sessão
