# Skill 02 — Plano de Estudos Real via LLM

## Problema
A rota `/api/study-plan` devolve sempre as mesmas 4 tarefas fixas independentemente do objetivo.

## Objetivo
Usar o LLM (Ollama/OpenAI) para gerar planos de estudo personalizados e estruturados.

## Implementação

### Prompt do sistema
```
Você é um planejador de estudos especialista. Dado um objetivo de aprendizagem:
1. Divida em etapas semanais concretas
2. Atribua prioridade (alta/média/baixa) a cada tarefa
3. Defina prazos realistas a partir de hoje
4. Responda APENAS em JSON válido: { "tasks": [{ "title": "...", "dueDate": "YYYY-MM-DD", "priority": "alta|média|baixa" }] }
```

### Fluxo
1. User envia objetivo + duração opcional
2. API monta prompt com data atual
3. LLM gera JSON de tarefas
4. Parse do JSON com fallback para template fixo se parsing falhar
5. Retorna tasks ao frontend

### Validação
- JSON.parse com try/catch
- Se falhar, extrair JSON de dentro do texto com regex `/\{[\s\S]*\}/`
- Se ainda falhar, usar fallback determinístico atual

### Extras futuros
- Checkbox de conclusão de tarefa
- Recalcular plano quando tarefa é concluída
- Exportar como calendário (.ics)
