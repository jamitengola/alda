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

  const fallback = `## Briefing: ${topic}

### Pontos-chave para preparar
1. Definir claramente os objetivos da reunião
2. Preparar dados de suporte para seus argumentos
3. Antecipar possíveis objeções

### Perguntas para considerar
- Qual é o resultado ideal desta reunião?
- Quais concessões estou disposto a fazer?
- Quais dados preciso apresentar?

### Dicas
- Comece com uma agenda clara
- Mantenha o foco nos resultados
- Finalize com próximos passos concretos`;

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
