import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { generateText, getProviderLabel, getProviderStatus } from './ai-provider';

describe('ai-provider', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    vi.resetModules();
    process.env = { ...originalEnv };
    vi.stubGlobal('fetch', vi.fn());
  });

  afterEach(() => {
    process.env = originalEnv;
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  describe('Provider Selection and configuration', () => {
    it('defaults to mock when AI_PROVIDER is missing or invalid', () => {
      delete process.env.AI_PROVIDER;
      expect(getProviderLabel()).toBe('mock');

      process.env.AI_PROVIDER = 'invalid-provider';
      expect(getProviderLabel()).toBe('mock');
    });

    it('returns the correct provider when configured', () => {
      process.env.AI_PROVIDER = 'openai';
      expect(getProviderLabel()).toBe('openai');

      process.env.AI_PROVIDER = 'ollama';
      expect(getProviderLabel()).toBe('ollama');

      process.env.AI_PROVIDER = 'mock';
      expect(getProviderLabel()).toBe('mock');
    });

    it('identifies remote ollama without api key correctly', () => {
      process.env.AI_PROVIDER = 'ollama';
      process.env.OLLAMA_BASE_URL = 'http://remote-server:11434';
      delete process.env.OLLAMA_API_KEY;
      
      const status = getProviderStatus();
      expect(status.provider).toBe('ollama');
      expect(status.ollamaRemote).toBe(true);
      expect(status.needsApiKeyWarning).toBe(true);
    });

    it('identifies local ollama properly', () => {
      process.env.AI_PROVIDER = 'ollama';
      process.env.OLLAMA_BASE_URL = 'http://localhost:11434';
      
      const status = getProviderStatus();
      expect(status.provider).toBe('ollama');
      expect(status.ollamaRemote).toBe(false);
      expect(status.needsApiKeyWarning).toBe(false);
    });
  });

  describe('generateText', () => {
    const input = { system: 'sys', user: 'usr', fallback: 'fallback-text' };

    it('returns fallback immediately if provider is mock', async () => {
      process.env.AI_PROVIDER = 'mock';
      const result = await generateText(input);
      expect(result).toBe('fallback-text');
      expect(fetch).not.toHaveBeenCalled();
    });

    describe('OpenAI', () => {
      beforeEach(() => {
        process.env.AI_PROVIDER = 'openai';
        process.env.OPENAI_API_KEY = 'test-key';
      });

      it('throws/returns fallback if OPENAI_API_KEY is missing', async () => {
        delete process.env.OPENAI_API_KEY;
        const result = await generateText(input);
        expect(result).toBe('fallback-text');
      });

      it('calls openai fetch with correct arguments and returns response', async () => {
        const mockFetch = vi.mocked(fetch);
        mockFetch.mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            choices: [{ message: { content: 'openai-response' } }]
          })
        } as unknown as Response);

        const result = await generateText(input);
        expect(result).toBe('openai-response');
        expect(mockFetch).toHaveBeenCalledWith(
          expect.any(String),
          expect.objectContaining({
            method: 'POST',
            headers: expect.objectContaining({
              Authorization: 'Bearer test-key'
            })
          })
        );
      });

      it('returns fallback if fetch fails', async () => {
        const mockFetch = vi.mocked(fetch);
        mockFetch.mockResolvedValueOnce({
          ok: false,
          status: 500
        } as unknown as Response);

        const result = await generateText(input);
        expect(result).toBe('fallback-text');
      });
    });

    describe('Ollama', () => {
      beforeEach(() => {
        process.env.AI_PROVIDER = 'ollama';
      });

      it('calls ollama fetch with correct arguments and returns response', async () => {
        const mockFetch = vi.mocked(fetch);
        mockFetch.mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            response: 'ollama-response'
          })
        } as unknown as Response);

        const result = await generateText(input);
        expect(result).toBe('ollama-response');
        expect(mockFetch).toHaveBeenCalledWith(
          expect.stringContaining('/api/generate'),
          expect.objectContaining({
            method: 'POST',
            body: expect.stringContaining('"prompt":"usr"')
          })
        );
      });

      it('includes API key if configured', async () => {
        process.env.OLLAMA_API_KEY = 'ollama-key';
        const mockFetch = vi.mocked(fetch);
        mockFetch.mockResolvedValueOnce({
          ok: true,
          json: async () => ({ response: 'ollama-response' })
        } as unknown as Response);

        await generateText(input);
        expect(mockFetch).toHaveBeenCalledWith(
          expect.any(String),
          expect.objectContaining({
            headers: expect.objectContaining({
              Authorization: 'Bearer ollama-key'
            })
          })
        );
      });

      it('returns fallback if fetch fails', async () => {
        const mockFetch = vi.mocked(fetch);
        mockFetch.mockResolvedValueOnce({
          ok: false,
          status: 500
        } as unknown as Response);

        const result = await generateText(input);
        expect(result).toBe('fallback-text');
      });
    });
  });
});
