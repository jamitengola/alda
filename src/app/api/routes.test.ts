import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

vi.mock("@/lib/ai-provider", () => ({
  generateText: vi.fn(async ({ fallback }: { fallback: string }) => fallback),
  getProviderLabel: vi.fn(() => "mock"),
}));

import { generateText } from "@/lib/ai-provider";
import { POST as interviewPost } from "./interview-mode/route";
import { POST as coachingPost } from "./live-coaching/route";
import { POST as meetingPrepPost } from "./meeting-prep/route";

function nextJsonRequest(path: string, body: unknown): NextRequest {
  return new NextRequest(`http://localhost${path}`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });
}

function malformedNextRequest(path: string): NextRequest {
  return new NextRequest(`http://localhost${path}`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: "{not-json",
  });
}

describe("API routes", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("meeting preparation", () => {
    it("rejects malformed JSON with a predictable 400 response", async () => {
      const response = await meetingPrepPost(malformedNextRequest("/api/meeting-prep"));
      const body = (await response.json()) as { error: string };

      expect(response.status).toBe(400);
      expect(body.error).toBe("Payload JSON inválido.");
      expect(generateText).not.toHaveBeenCalled();
    });

    it("returns guidance when the meeting topic is missing", async () => {
      const response = await meetingPrepPost(nextJsonRequest("/api/meeting-prep", {}));
      const body = (await response.json()) as { briefing: string };

      expect(response.status).toBe(200);
      expect(body.briefing).toContain("tema da reunião");
      expect(generateText).not.toHaveBeenCalled();
    });

    it("uses the mock fallback for a valid request", async () => {
      const response = await meetingPrepPost(
        nextJsonRequest("/api/meeting-prep", {
          topic: "Lançamento do ALDA",
          objective: "Definir responsáveis",
        }),
      );
      const body = (await response.json()) as { briefing: string; provider: string };

      expect(response.status).toBe(200);
      expect(body.provider).toBe("mock");
      expect(body.briefing).toContain("Lançamento do ALDA");
      expect(generateText).toHaveBeenCalledOnce();
    });
  });

  describe("live coaching", () => {
    it("rejects malformed JSON", async () => {
      const response = await coachingPost(malformedNextRequest("/api/live-coaching"));

      expect(response.status).toBe(400);
      await expect(response.json()).resolves.toEqual({ error: "Payload JSON inválido." });
    });

    it("normalizes an unknown coaching mode", async () => {
      const response = await coachingPost(
        nextJsonRequest("/api/live-coaching", {
          transcript: "O cliente pediu garantias antes de avançar.",
          mode: "unsupported-mode",
        }),
      );
      const body = (await response.json()) as { mode: string; suggestion: string };

      expect(response.status).toBe(200);
      expect(body.mode).toBe("coaching");
      expect(body.suggestion).toContain("Próxima fala sugerida");
    });
  });

  describe("interview mode", () => {
    it("rejects malformed JSON", async () => {
      const response = await interviewPost(malformedNextRequest("/api/interview-mode"));

      expect(response.status).toBe(400);
      await expect(response.json()).resolves.toEqual({ error: "Payload JSON inválido." });
    });

    it("rejects unsupported actions", async () => {
      const response = await interviewPost(
        nextJsonRequest("/api/interview-mode", { action: "delete" }),
      );

      expect(response.status).toBe(400);
      await expect(response.json()).resolves.toEqual({ error: "Ação inválida." });
    });

    it("generates five deterministic mock questions", async () => {
      const response = await interviewPost(
        nextJsonRequest("/api/interview-mode", {
          action: "generate",
          topic: "ASP.NET Core",
        }),
      );
      const body = (await response.json()) as { questions: string[] };

      expect(response.status).toBe(200);
      expect(body.questions).toHaveLength(5);
      expect(body.questions[0]).toContain("ASP.NET Core");
    });
  });
});
