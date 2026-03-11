# ALDA — Missão e Visão do Projeto

## O que é o ALDA
Assistente desktop pessoal para **tarefas e formações**, inspirado no Cluely.
Nome: ALDA (Assistente Local de Desenvolvimento e Aprendizagem).

## Público-alvo
O próprio criador (Jaime) — profissional que precisa:
- Resumir reuniões e aulas automaticamente
- Ter sugestões em tempo real durante chamadas
- Organizar planos de estudo com tarefas priorizadas
- Gerar follow-ups profissionais após sessões
- Acumular uma base de conhecimento pessoal consultável

## Princípios de design
1. **Offline-first**: funcionar 100% local com Ollama, sem depender de cloud
2. **Desktop-native**: system tray, atalhos globais, overlay flutuante
3. **Persistente**: dados nunca se perdem (SQLite local)
4. **Modular**: cada módulo é independente e acessível via sidebar
5. **Simples**: UI limpa, sem overengineering

## Stack
- Next.js 16 + TypeScript + Tailwind CSS (App Router)
- Electron (shell desktop)
- Ollama (LLM local) / OpenAI (cloud opcional)
- SQLite via better-sqlite3 (persistência)
- Web Speech API / Whisper (transcrição)

## Módulos (5 features core)
1. **Transcrição + Resumo** — upload áudio ou gravação ao vivo → resumo + ações
2. **Assistente Tempo Real** — captura contexto → sugere respostas durante chamadas
3. **Plano de Estudos** — objetivo → tarefas priorizadas com datas geradas por LLM
4. **Follow-up** — contexto da sessão → email/checklist profissional
5. **Base de Conhecimento** — adicionar notas → consultar com RAG (retrieval)

## Regra de ouro
Cada feature deve funcionar de ponta a ponta: input do utilizador → processamento (LLM quando aplicável) → resultado útil → persistido.
