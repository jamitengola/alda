import { NextResponse } from "next/server";
import { generateText } from "@/lib/ai-provider";

export async function POST(request: Request) {
  const { topic, action, question, answer } = (await request.json()) as {
    topic: string;
    action: "generate" | "feedback";
    question?: string;
    answer?: string;
  };

  if (action === "generate") {
    const text = await generateText({
      system:
        "Você é um entrevistador técnico experiente. Gere exatamente 5 perguntas de entrevista sobre o tema fornecido, variando entre perguntas técnicas, comportamentais e situacionais. Retorne APENAS um JSON array de strings, sem markdown, sem explicação. Exemplo: [\"Pergunta 1?\",\"Pergunta 2?\"]",
      user: `Tema da entrevista: ${topic}`,
      fallback: JSON.stringify([
        `O que você sabe sobre ${topic}?`,
        `Descreva um projeto onde aplicou ${topic}.`,
        `Quais os principais desafios de ${topic}?`,
        `Como você se mantém atualizado em ${topic}?`,
        `Explique ${topic} para alguém leigo.`,
      ]),
    });

    let questions: string[];
    try {
      questions = JSON.parse(text);
      if (!Array.isArray(questions)) throw new Error("not array");
    } catch {
      questions = [
        `O que você sabe sobre ${topic}?`,
        `Descreva um projeto onde aplicou ${topic}.`,
        `Quais os principais desafios de ${topic}?`,
        `Como você se mantém atualizado em ${topic}?`,
        `Explique ${topic} para alguém leigo.`,
      ];
    }

    return NextResponse.json({ questions });
  }

  // action === "feedback"
  const feedback = await generateText({
    system:
      "Você é um coach de entrevistas. Analise a resposta do candidato à pergunta e forneça: 1) Pontos fortes, 2) O que melhorar, 3) Uma resposta exemplar resumida. Seja construtivo e específico em português.",
    user: `Pergunta: ${question}\n\nResposta do candidato: ${answer}`,
    fallback:
      "Boa resposta! Tente ser mais específico com exemplos concretos da sua experiência. Estruture com a técnica STAR (Situação, Tarefa, Ação, Resultado).",
  });

  return NextResponse.json({ feedback });
}
