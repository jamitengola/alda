# ALDA MVP — Core funcional

Este documento define o que significa **100% das funcionalidades essenciais da MVP**.

## Percurso principal

1. O utilizador prepara uma reunião e recebe um briefing estratégico.
2. Durante a reunião, recebe sugestões de coaching nos modos disponíveis.
3. A transcrição pode ser digitada ou capturada pelo reconhecimento de voz.
4. O ALDA gera um resumo estruturado e guarda-o localmente.
5. O resumo pode ser enviado directamente para o ecrã de follow-up sem ser colocado na URL.
6. O ALDA gera o follow-up, guarda-o localmente e permite copiar, descarregar ou abrir no cliente de email.
7. Resumos, follow-ups e sessões de coaching podem ser recuperados no histórico.

## Critérios concluídos

- [x] Preparação de reunião com resposta mock e fornecedores de IA configuráveis.
- [x] Coaching em tempo real com modos coaching, vendas, pitch, negociação, objeções e perguntas.
- [x] Geração de resumo a partir de transcrição.
- [x] Geração de follow-up a partir do resumo ou contexto.
- [x] Persistência local de resumos, follow-ups e métricas em SQLite.
- [x] Histórico unificado com pesquisa, limite seguro e detalhe por registo.
- [x] Validação de JSON e campos obrigatórios nas APIs essenciais.
- [x] Respostas HTTP previsíveis para pedidos inválidos e registos inexistentes.
- [x] Testes automatizados independentes de OpenAI e Ollama.
- [x] Lint, testes e build de produção executados na CI.
- [x] Fluxo resumo → follow-up sem conteúdo sensível na URL.
- [x] Exportação de resultados e envio para cliente de email.

## Fora do núcleo funcional

Os itens abaixo são importantes para distribuição e crescimento, mas não fazem parte do cálculo de conclusão funcional da MVP:

- assinatura e notarização do instalador macOS;
- instaladores Windows e Linux;
- publicação dos pacotes no GitHub Releases;
- demonstração pública na Vercel;
- screenshots e vídeo de demonstração;
- autenticação multiutilizador;
- integrações com calendário, email e CRM;
- sincronização cloud entre dispositivos.

## Validação

Executar:

```bash
npm ci
npm run lint
npm run test
npm run build
```

O modo recomendado para validação funcional sem chaves externas é:

```env
AI_PROVIDER=mock
```

A conclusão de 100% aplica-se ao escopo acima e não significa que todas as funcionalidades futuras do roadmap estejam concluídas.
