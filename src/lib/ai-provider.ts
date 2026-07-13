type Provider = "mock" | "ollama" | "openai";

type GenerateTextInput = {
  system: string;
  user: string;
  fallback: string;
};

type ProviderStatus = {
  provider: Provider;
  ollamaRemote: boolean;
  needsApiKeyWarning: boolean;
};

type RequestPolicy = {
  timeoutMs: number;
  maxRetries: number;
  retryDelayMs: number;
};

const DEFAULT_TIMEOUT_MS = 15_000;
const DEFAULT_MAX_RETRIES = 1;
const DEFAULT_RETRY_DELAY_MS = 250;

function getProvider(): Provider {
  const raw = (process.env.AI_PROVIDER ?? "mock").toLowerCase();
  if (raw === "ollama" || raw === "openai" || raw === "mock") {
    return raw;
  }
  return "mock";
}

function parseIntegerEnv(
  name: string,
  fallback: number,
  minimum: number,
  maximum: number,
) {
  const value = Number.parseInt(process.env[name] ?? "", 10);
  if (!Number.isFinite(value)) return fallback;
  return Math.min(Math.max(value, minimum), maximum);
}

function getRequestPolicy(): RequestPolicy {
  return {
    timeoutMs: parseIntegerEnv("AI_REQUEST_TIMEOUT_MS", DEFAULT_TIMEOUT_MS, 1, 120_000),
    maxRetries: parseIntegerEnv("AI_REQUEST_MAX_RETRIES", DEFAULT_MAX_RETRIES, 0, 3),
    retryDelayMs: parseIntegerEnv(
      "AI_REQUEST_RETRY_DELAY_MS",
      DEFAULT_RETRY_DELAY_MS,
      0,
      5_000,
    ),
  };
}

function isRetryableStatus(status: number) {
  return status === 408 || status === 429 || status >= 500;
}

function wait(milliseconds: number) {
  if (milliseconds <= 0) return Promise.resolve();
  return new Promise<void>((resolve) => setTimeout(resolve, milliseconds));
}

async function fetchWithTimeout(
  input: Parameters<typeof fetch>[0],
  init: Parameters<typeof fetch>[1],
  timeoutMs: number,
) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);

  try {
    return await fetch(input, {
      ...init,
      signal: controller.signal,
    });
  } finally {
    clearTimeout(timeout);
  }
}

async function fetchWithRetry(
  input: Parameters<typeof fetch>[0],
  init: Parameters<typeof fetch>[1],
) {
  const policy = getRequestPolicy();
  let lastError: unknown;

  for (let attempt = 0; attempt <= policy.maxRetries; attempt += 1) {
    try {
      const response = await fetchWithTimeout(input, init, policy.timeoutMs);
      const shouldRetry =
        !response.ok &&
        isRetryableStatus(response.status) &&
        attempt < policy.maxRetries;

      if (!shouldRetry) return response;
    } catch (error) {
      lastError = error;
      if (attempt >= policy.maxRetries) throw error;
    }

    const delay = policy.retryDelayMs * 2 ** attempt;
    await wait(delay);
  }

  throw lastError instanceof Error
    ? lastError
    : new Error("AI provider request failed");
}

async function generateWithOpenAI(system: string, user: string) {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error("OPENAI_API_KEY não configurada");
  }

  const endpoint = process.env.OPENAI_BASE_URL ?? "https://api.openai.com/v1/chat/completions";
  const model = process.env.OPENAI_MODEL ?? "gpt-4o-mini";

  const response = await fetchWithRetry(endpoint, {
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

  const response = await fetchWithRetry(`${baseUrl}/api/generate`, {
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

function isLikelyRemoteUrl(url: string) {
  return !/localhost|127\.0\.0\.1|\[::1\]/i.test(url);
}

export function getProviderStatus(): ProviderStatus {
  const provider = getProvider();
  const baseUrl = process.env.OLLAMA_BASE_URL ?? "http://localhost:11434";
  const hasApiKey = Boolean(process.env.OLLAMA_API_KEY);
  const ollamaRemote = provider === "ollama" && isLikelyRemoteUrl(baseUrl);

  return {
    provider,
    ollamaRemote,
    needsApiKeyWarning: ollamaRemote && !hasApiKey,
  };
}
