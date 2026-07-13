import { NextResponse } from "next/server";
import { generateText } from "@/lib/ai-provider";

export async function POST(request: Request) {
  const { topic, action, question, answer } = (await request.json()) as {
    topic?: string;
    action: "generate" | "feedback";
    question?: string;
    answer?: string;
  };

  const safeTopic = topic?.trim() || "o tema selecionado";

  if (action === "generate") {
    const mockQuestions = [
      `Explique os conceitos fundamentais de ${safeTopic} e quando os aplicaria num projeto real.`,
      `Descreva um projeto em que utilizou ${safeTopic}. Qual era o problema, qual foi a sua responsabilidade e qual resultado alcançou?`,
      `Quais são os erros ou riscos mais comuns ao trabalhar com ${safeTopic} e como os preveniria?`,
      `Imagine que uma solução baseada em ${safeTopic} apresenta falhas em produção. Como organizaria a investigação e a correção?`,
      `Como explicaria uma decisão técnica relacionada com ${safeTopic} a um gestor ou cliente sem conhecimento técnico?`,
    ];

    const text = await generateText({
      system:
        "Você é um entrevistador técnico experiente. Gere exatamente 5 perguntas de entrevista sobre o tema fornecido, variando entre perguntas técnicas, comportamentais e situacionais. Retorne APENAS um JSON array de strings, sem markdown, sem explicação. Exemplo: [\"Pergunta 1?\",\"Pergunta 2?\"]",
      user: `Tema da entrevista: ${safeTopic}`,
      fallback: JSON.stringify(mockQuestions),
    });

    let questions: string[];
    try {
      questions = JSON.parse(text);
      if (!Array.isArray(questions)) throw new Error("not array");
    } catch {
      questions = mockQuestions;
    }

    return NextResponse.json({ questions });
  }

  const answerWordCount = answer?.trim().split(/\s+/).filter(Boolean).length ?? 0;
  const questionContext = question?.trim() || "a pergunta apresentada";

  const fallback = `## Pontos fortes
- A resposta aborda diretamente ${questionContext}.
- Existe uma base que pode ser transformada numa resposta profissional e convincente.

## O que melhorar
- ${answerWordCount < 35 ? "A resposta está curta; acrescente contexto, uma ação concreta e o resultado alcançado." : "Reduza detalhes secundários e destaque com mais clareza a sua contribuição pessoal."}
- Inclua um exemplo verificável, uma decisão tomada e, quando possível, uma métrica de impacto.
- Evite respostas genéricas; explique o que fez, por que escolheu essa abordagem e o que aprendeu.

## Estrutura recomendada — STAR
1. **Situação:** contextualize o problema em uma ou duas frases.
2. **Tarefa:** explique qual era a sua responsabilidade.
3. **Ação:** descreva as decisões e ações que executou.
4. **Resultado:** apresente o impacto, idealmente com números ou evidências.

## Exemplo de melhoria
“Num projeto relacionado com ${safeTopic}, identifiquei um problema específico, defini uma abordagem, coordenei a execução e acompanhei os resultados. A solução melhorou o processo e deixou aprendizados que apliquei em trabalhos posteriores.”`;

  const feedback = await generateText({
    system:
      "Você é um coach de entrevistas. Analise a resposta do candidato à pergunta e forneça: 1) Pontos fortes, 2) O que melhorar, 3) Uma resposta exemplar resumida. Seja construtivo e específico em português.",
    user: `Pergunta: ${question}\n\nResposta do candidato: ${answer}`,
    fallback,
  });

  return NextResponse.json({ feedback });
}
