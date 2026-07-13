import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { generateText, getProviderLabel, getProviderStatus } from "./ai-provider";

describe("ai-provider", () => {
  const originalEnv = process.env;

  beforeEach(() => {
    vi.resetModules();
    process.env = {
      ...originalEnv,
      AI_REQUEST_RETRY_DELAY_MS: "0",
    };
    vi.stubGlobal("fetch", vi.fn());
  });

  afterEach(() => {
    process.env = originalEnv;
    vi.useRealTimers();
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  describe("Provider selection and configuration", () => {
    it("defaults to mock when AI_PROVIDER is missing or invalid", () => {
      delete process.env.AI_PROVIDER;
      expect(getProviderLabel()).toBe("mock");

      process.env.AI_PROVIDER = "invalid-provider";
      expect(getProviderLabel()).toBe("mock");
    });

    it("returns the correct provider when configured", () => {
      process.env.AI_PROVIDER = "openai";
      expect(getProviderLabel()).toBe("openai");

      process.env.AI_PROVIDER = "ollama";
      expect(getProviderLabel()).toBe("ollama");

      process.env.AI_PROVIDER = "mock";
      expect(getProviderLabel()).toBe("mock");
    });

    it("identifies remote ollama without api key correctly", () => {
      process.env.AI_PROVIDER = "ollama";
      process.env.OLLAMA_BASE_URL = "http://remote-server:11434";
      delete process.env.OLLAMA_API_KEY;

      const status = getProviderStatus();
      expect(status.provider).toBe("ollama");
      expect(status.ollamaRemote).toBe(true);
      expect(status.needsApiKeyWarning).toBe(true);
    });

    it("identifies local ollama properly", () => {
      process.env.AI_PROVIDER = "ollama";
      process.env.OLLAMA_BASE_URL = "http://localhost:11434";

      const status = getProviderStatus();
      expect(status.provider).toBe("ollama");
      expect(status.ollamaRemote).toBe(false);
      expect(status.needsApiKeyWarning).toBe(false);
    });
  });

  describe("generateText", () => {
    const input = { system: "sys", user: "usr", fallback: "fallback-text" };

    it("returns fallback immediately if provider is mock", async () => {
      process.env.AI_PROVIDER = "mock";
      const result = await generateText(input);
      expect(result).toBe("fallback-text");
      expect(fetch).not.toHaveBeenCalled();
    });

    describe("OpenAI", () => {
      beforeEach(() => {
        process.env.AI_PROVIDER = "openai";
        process.env.OPENAI_API_KEY = "test-key";
      });

      it("returns fallback if OPENAI_API_KEY is missing", async () => {
        delete process.env.OPENAI_API_KEY;
        const result = await generateText(input);
        expect(result).toBe("fallback-text");
      });

      it("calls openai fetch with an abort signal and returns response", async () => {
        const mockFetch = vi.mocked(fetch);
        mockFetch.mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            choices: [{ message: { content: "openai-response" } }],
          }),
        } as unknown as Response);

        const result = await generateText(input);
        expect(result).toBe("openai-response");
        expect(mockFetch).toHaveBeenCalledWith(
          expect.any(String),
          expect.objectContaining({
            method: "POST",
            signal: expect.any(AbortSignal),
            headers: expect.objectContaining({
              Authorization: "Bearer test-key",
            }),
          }),
        );
      });

      it("retries a transient server error and returns the next response", async () => {
        const mockFetch = vi.mocked(fetch);
        mockFetch
          .mockResolvedValueOnce({
            ok: false,
            status: 503,
          } as unknown as Response)
          .mockResolvedValueOnce({
            ok: true,
            json: async () => ({
              choices: [{ message: { content: "recovered-response" } }],
            }),
          } as unknown as Response);

        const result = await generateText(input);

        expect(result).toBe("recovered-response");
        expect(mockFetch).toHaveBeenCalledTimes(2);
      });

      it("does not retry a non-transient client error", async () => {
        process.env.AI_REQUEST_MAX_RETRIES = "3";
        const mockFetch = vi.mocked(fetch);
        mockFetch.mockResolvedValueOnce({
          ok: false,
          status: 400,
        } as unknown as Response);

        const result = await generateText(input);

        expect(result).toBe("fallback-text");
        expect(mockFetch).toHaveBeenCalledTimes(1);
      });

      it("aborts a request after the configured timeout and returns fallback", async () => {
        vi.useFakeTimers();
        process.env.AI_REQUEST_TIMEOUT_MS = "25";
        process.env.AI_REQUEST_MAX_RETRIES = "0";

        const mockFetch = vi.mocked(fetch);
        mockFetch.mockImplementation(
          (_input, init) =>
            new Promise<Response>((_resolve, reject) => {
              init?.signal?.addEventListener("abort", () => {
                const error = new Error("Request aborted");
                error.name = "AbortError";
                reject(error);
              });
            }),
        );

        const resultPromise = generateText(input);
        await vi.advanceTimersByTimeAsync(25);

        await expect(resultPromise).resolves.toBe("fallback-text");
        expect(mockFetch).toHaveBeenCalledTimes(1);
      });

      it("returns fallback after retryable failures are exhausted", async () => {
        process.env.AI_REQUEST_MAX_RETRIES = "1";
        const mockFetch = vi.mocked(fetch);
        mockFetch.mockResolvedValue({
          ok: false,
          status: 500,
        } as unknown as Response);

        const result = await generateText(input);

        expect(result).toBe("fallback-text");
        expect(mockFetch).toHaveBeenCalledTimes(2);
      });
    });

    describe("Ollama", () => {
      beforeEach(() => {
        process.env.AI_PROVIDER = "ollama";
      });

      it("calls ollama fetch with an abort signal and returns response", async () => {
        const mockFetch = vi.mocked(fetch);
        mockFetch.mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            response: "ollama-response",
          }),
        } as unknown as Response);

        const result = await generateText(input);
        expect(result).toBe("ollama-response");
        expect(mockFetch).toHaveBeenCalledWith(
          expect.stringContaining("/api/generate"),
          expect.objectContaining({
            method: "POST",
            signal: expect.any(AbortSignal),
            body: expect.stringContaining('"prompt":"usr"'),
          }),
        );
      });

      it("includes API key if configured", async () => {
        process.env.OLLAMA_API_KEY = "ollama-key";
        const mockFetch = vi.mocked(fetch);
        mockFetch.mockResolvedValueOnce({
          ok: true,
          json: async () => ({ response: "ollama-response" }),
        } as unknown as Response);

        await generateText(input);
        expect(mockFetch).toHaveBeenCalledWith(
          expect.any(String),
          expect.objectContaining({
            headers: expect.objectContaining({
              Authorization: "Bearer ollama-key",
            }),
          }),
        );
      });

      it("returns fallback after retryable failures are exhausted", async () => {
        process.env.AI_REQUEST_MAX_RETRIES = "1";
        const mockFetch = vi.mocked(fetch);
        mockFetch.mockResolvedValue({
          ok: false,
          status: 500,
        } as unknown as Response);

        const result = await generateText(input);

        expect(result).toBe("fallback-text");
        expect(mockFetch).toHaveBeenCalledTimes(2);
      });
    });
  });
});
