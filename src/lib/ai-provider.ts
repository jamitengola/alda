type Provider = "mock" | "ollama" | "openai";

type GenerateTextInput = {
  system: string;
  user: string;
  fallback: string;
};

function getProvider(): Provider {
  const raw = (process.env.AI_PROVIDER ?? "mock").toLowerCase();
  if (raw === "ollama" || raw === "openai" || raw === "mock") {
    return raw;
  }
  return "mock";
}

async function generateWithOpenAI(system: string, user: string) {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error("OPENAI_API_KEY não configurada");
  }

  const endpoint = process.env.OPENAI_BASE_URL ?? "https://api.openai.com/v1/chat/completions";
  const model = process.env.OPENAI_MODEL ?? "gpt-4o-mini";

  const response = await fetch(endpoint, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model,
      temperature: 0.3,
      messages: [
        { role: "system", content: system },
        { role: "user", content: user },
      ],
    }),
  });

  if (!response.ok) {
    throw new Error(`OpenAI falhou: ${response.status}`);
  }

  const data = (await response.json()) as {
    choices?: Array<{ message?: { content?: string } }>;
  };

  return data.choices?.[0]?.message?.content?.trim() ?? "";
}

async function generateWithOllama(system: string, user: string) {
  const baseUrl = process.env.OLLAMA_BASE_URL ?? "http://localhost:11434";
  const model = process.env.OLLAMA_MODEL ?? "llama3.1:8b";
  const apiKey = process.env.OLLAMA_API_KEY;

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };

  if (apiKey) {
    headers.Authorization = `Bearer ${apiKey}`;
  }

  const response = await fetch(`${baseUrl}/api/generate`, {
    method: "POST",
    headers,
    body: JSON.stringify({
      model,
      system,
      prompt: user,
      stream: false,
      options: { temperature: 0.3 },
    }),
  });

  if (!response.ok) {
    throw new Error(`Ollama falhou: ${response.status}`);
  }

  const data = (await response.json()) as { response?: string };
  return data.response?.trim() ?? "";
}

export async function generateText(input: GenerateTextInput) {
  const provider = getProvider();

  if (provider === "mock") {
    return input.fallback;
  }

  try {
    if (provider === "openai") {
      const text = await generateWithOpenAI(input.system, input.user);
      return text || input.fallback;
    }

    const text = await generateWithOllama(input.system, input.user);
    return text || input.fallback;
  } catch {
    return input.fallback;
  }
}

export function getProviderLabel() {
  return getProvider();
}