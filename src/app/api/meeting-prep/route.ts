import { NextRequest, NextResponse } from "next/server";
import { generateText, getProviderLabel } from "@/lib/ai-provider";

export async function POST(request: NextRequest) {
  const body = (await request.json()) as {
    topic?: string;
    participants?: string;
    objective?: string;
    notes?: string;
  };

  const topic = body.topic?.trim() ?? "";
  const participants = body.participants?.trim() ?? "";
  const objective = body.objective?.trim() ?? "";
  const notes = body.notes?.trim() ?? "";

  if (!topic) {
    return NextResponse.json({ briefing: "Informe pelo menos o tema da reunião." });
  }

  const userPrompt = [
    `Tema da reunião: ${topic}`,
    participants ? `Participantes: ${participants}` : "",
    objective ? `Objetivo: ${objective}` : "",
    notes ? `Notas adicionais: ${notes}` : "",
  ]
    .filter(Boolean)
    .join("\n");

  const fallback = `## Briefing da reunião: ${topic}

### Resultado recomendado
${objective || "Sair da reunião com uma decisão clara, responsáveis definidos e um próximo passo calendarizado."}

### Participantes e interesses
${participants ? `- Participantes: ${participants}\n- Identifique quem decide, quem influencia e quem executará os próximos passos.` : "- Confirme quem tem poder de decisão, quem influencia o resultado e quem ficará responsável pela execução."}

### Pontos-chave para abordar
1. Contextualize o problema e explique por que ele precisa de decisão agora.
2. Apresente os dados ou evidências que sustentam a sua recomendação.
3. Mostre o impacto esperado, os riscos e as alternativas consideradas.
4. Termine com uma proposta concreta de decisão e próximos passos.

### Perguntas estratégicas
- Qual resultado seria considerado um sucesso por todos os participantes?
- Que restrições de prazo, orçamento ou recursos devemos considerar?
- O que ainda impede uma decisão nesta reunião?
- Quem será responsável por cada ação depois da reunião?

### Possíveis objeções e respostas
- **“Ainda não temos informação suficiente.”** Proponha uma decisão reversível ou um piloto com critérios de validação.
- **“O custo é elevado.”** Relacione o investimento com o custo de manter o problema sem solução.
- **“Precisamos de mais tempo.”** Defina exatamente que informação falta e marque uma data objetiva para decisão.

### Agenda sugerida — 30 minutos
1. Contexto e objetivo — 5 min
2. Evidências e opções — 10 min
3. Debate de riscos e objeções — 8 min
4. Decisão, responsáveis e prazos — 7 min

### Checklist final
- Levar os dados essenciais em formato simples.
- Preparar uma recomendação principal e uma alternativa.
- Confirmar a decisão por escrito no final.
${notes ? `- Considerar estas notas adicionais: ${notes}` : "- Reservar os últimos minutos para alinhar responsáveis e datas."}`;

  const briefing = await generateText({
    system: `Você é um preparador de reuniões profissional. Crie um briefing completo em português com:
1. **Pontos-chave** — tópicos essenciais a abordar
2. **Argumentos sugeridos** — baseados no objetivo
3. **Possíveis objeções** — e como respondê-las
4. **Perguntas estratégicas** — para conduzir a conversa
5. **Dicas táticas** — postura, timing, linguagem

Formate com Markdown. Seja prático e acionável.`,
    user: userPrompt,
    fallback,
  });

  return NextResponse.json({ briefing, provider: getProviderLabel() });
}
