import { NextRequest, NextResponse } from "next/server";
import { generateText, getProviderLabel } from "@/lib/ai-provider";

type CoachingMode =
  | "coaching"
  | "objection"
  | "question"
  | "sales"
  | "pitch"
  | "negotiation";

export async function POST(request: NextRequest) {
  const body = (await request.json()) as {
    transcript?: string;
    mode?: CoachingMode;
  };

  const transcript = body.transcript?.trim() ?? "";
  const mode = body.mode ?? "coaching";

  if (!transcript) {
    return NextResponse.json({
      suggestion: "Aguardando fala para sugerir...",
      mode,
    });
  }

  const systemPrompts: Record<CoachingMode, string> = {
    coaching: `Você é um coach de reuniões profissional em tempo real. Analise o que foi dito e forneça:
1. Uma sugestão concreta de resposta ou próximo argumento (máx 2 frases)
2. Um ponto-chave para reforçar a posição do utilizador
3. Uma dica de linguagem corporal ou tom se relevante
Seja direto, prático e confiante. Responda em português.`,

    objection: `Você é especialista em gestão de objeções em vendas e negociações de alto nível.
Analise a objeção identificada e forneça:
1. Uma réplica persuasiva, empática e data-driven (máx 3 frases)
2. Uma técnica de reframing para transformar a objeção em oportunidade
3. Um dado ou argumento de suporte concreto
Seja confiante mas empático. Responda em português.`,

    question: `Você é um copiloto de reuniões profissionais. A pessoa recebeu uma pergunta difícil ou inesperada.
Sugira uma resposta:
1. Clara e confiante (máx 3 frases)
2. Que demonstre domínio do assunto
3. Que redirecione para os pontos fortes do utilizador
Responda em português.`,

    sales: `Você é um coach de vendas B2B de elite, especialista em enterprise sales.
Analise a conversa de venda em tempo real e forneça:
1. A próxima melhor ação/fala para avançar no pipeline (máx 2 frases)
2. Sinais de compra ou alerta que detectou no discurso
3. Uma pergunta de qualificação ou fechamento oportuna
Foque em MEDDIC/SPIN selling. Responda em português.`,

    pitch: `Você é coach de pitch para founders e executivos.
Analise a apresentação/pitch em tempo real e forneça:
1. Feedback imediato sobre clareza e impacto da mensagem (máx 2 frases)
2. Uma sugestão de storytelling ou dado para fortalecer o argumento
3. Alerta se o speaker está a divagar ou perder o foco
Seja direto e orientado a resultado. Responda em português.`,

    negotiation: `Você é especialista em negociação avançada (Harvard Negotiation Project).
Analise a negociação em tempo real e forneça:
1. Uma tática ou movimento estratégico para este momento (máx 2 frases)
2. Análise da posição da outra parte e possíveis interesses ocultos
3. Sugestão de ancoragem ou concessão estratégica se aplicável
Foque em criar valor mútuo. Responda em português.`,
  };

  const contextExcerpt = transcript.replace(/\s+/g, " ").slice(-180);

  const fallbackMessages: Record<CoachingMode, (excerpt: string) => string> = {
    coaching: (excerpt) => `### Próxima fala sugerida
“Quero reforçar o ponto principal e confirmar se estamos alinhados antes de avançarmos para a decisão.”

### Leitura do momento
O trecho mais recente foi: “${excerpt}”. Retome a ideia central e transforme-a numa pergunta objetiva.

### Presença
Fale com ritmo mais lento, mantenha contacto visual e termine a frase sem reduzir o tom de voz.`,

    objection: (excerpt) => `### Réplica sugerida
“Entendo a preocupação. Em vez de ignorarmos esse risco, proponho que definamos um piloto curto com critérios claros para medir o resultado.”

### Reframing
A objeção presente em “${excerpt}” pode ser tratada como um pedido de segurança, não como uma rejeição definitiva.

### Próximo passo
Pergunte: “Que evidência precisariam de ver para se sentirem confortáveis em avançar?”`,

    question: (excerpt) => `### Resposta sugerida
“É uma questão importante. A nossa abordagem parte de três pontos: impacto esperado, capacidade de execução e controlo de risco.”

### Como desenvolver
Use o trecho “${excerpt}” como contexto, responda primeiro à pergunta e só depois acrescente detalhes.

### Redirecionamento
Termine ligando a resposta ao resultado que a reunião precisa produzir.`,

    sales: (excerpt) => `### Próxima melhor ação
“Para percebermos se esta solução faz sentido, qual é hoje o impacto financeiro ou operacional deste problema?”

### Sinal observado
O trecho “${excerpt}” indica que ainda é necessário quantificar urgência, impacto e processo de decisão.

### Pergunta de qualificação
“Quem mais precisa participar da decisão e qual seria o prazo ideal para resolver isto?”`,

    pitch: (excerpt) => `### Ajuste imediato
Volte ao problema central e explique, numa frase, por que a solução é diferente das alternativas atuais.

### Reforço de impacto
Ligue “${excerpt}” a um resultado mensurável: tempo poupado, custo reduzido, risco evitado ou receita criada.

### Alerta
Evite acrescentar novas funcionalidades antes de confirmar que a audiência compreendeu o valor principal.`,

    negotiation: (excerpt) => `### Movimento estratégico
“Antes de discutirmos concessões, gostaria de compreender qual condição é realmente essencial para vocês.”

### Leitura da posição
O trecho “${excerpt}” pode esconder interesses de prazo, previsibilidade ou redução de risco.

### Concessão recomendada
Só ofereça uma concessão em troca de algo equivalente, como prazo, volume, compromisso ou decisão mais rápida.`,
  };

  const suggestion = await generateText({
    system: systemPrompts[mode] || systemPrompts.coaching,
    user: `Transcrição em tempo real: "${transcript}"`,
    fallback: (fallbackMessages[mode] || fallbackMessages.coaching)(contextExcerpt),
  });

  return NextResponse.json({
    suggestion,
    mode,
    provider: getProviderLabel(),
  });
}
