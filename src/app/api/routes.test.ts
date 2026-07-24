import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

vi.mock("@/lib/ai-provider", () => ({
  generateText: vi.fn(async ({ fallback }: { fallback: string }) => fallback),
  getProviderLabel: vi.fn(() => "mock"),
}));

vi.mock("@/lib/db", () => ({
  saveSummary: vi.fn(() => "summary-1"),
  listSummaries: vi.fn(() => []),
  saveFollowup: vi.fn(() => "followup-1"),
  listFollowups: vi.fn(() => []),
  getTimeline: vi.fn(() => []),
  getTimelineItem: vi.fn(() => undefined),
}));

import { generateText } from "@/lib/ai-provider";
import {
  getTimeline,
  getTimelineItem,
  listFollowups,
  listSummaries,
  saveFollowup,
  saveSummary,
} from "@/lib/db";
import { POST as interviewPost } from "./interview-mode/route";
import { POST as coachingPost } from "./live-coaching/route";
import { POST as meetingPrepPost } from "./meeting-prep/route";
import {
  GET as summaryGet,
  POST as summaryPost,
} from "./transcribe-summary/route";
import {
  GET as followupGet,
  POST as followupPost,
} from "./follow-up/route";
import { GET as historyGet } from "./history/route";

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
    vi.mocked(saveSummary).mockReturnValue("summary-1");
    vi.mocked(saveFollowup).mockReturnValue("followup-1");
    vi.mocked(listSummaries).mockReturnValue([]);
    vi.mocked(listFollowups).mockReturnValue([]);
    vi.mocked(getTimeline).mockReturnValue([]);
    vi.mocked(getTimelineItem).mockReturnValue(undefined);
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

  describe("transcription and summary", () => {
    it("rejects malformed JSON", async () => {
      const response = await summaryPost(malformedNextRequest("/api/transcribe-summary"));

      expect(response.status).toBe(400);
      await expect(response.json()).resolves.toEqual({ error: "Payload JSON inválido." });
      expect(saveSummary).not.toHaveBeenCalled();
    });

    it("rejects an empty transcript", async () => {
      const response = await summaryPost(
        nextJsonRequest("/api/transcribe-summary", { transcript: "   " }),
      );

      expect(response.status).toBe(400);
      await expect(response.json()).resolves.toEqual({
        error: "Envie uma transcrição para gerar o resumo.",
      });
      expect(generateText).not.toHaveBeenCalled();
    });

    it("generates and persists a summary", async () => {
      const transcript = "A equipa aprovou o piloto. Jamite prepara o plano até sexta-feira.";
      const response = await summaryPost(
        nextJsonRequest("/api/transcribe-summary", { transcript }),
      );
      const body = (await response.json()) as {
        id: string;
        summary: string;
        provider: string;
      };

      expect(response.status).toBe(200);
      expect(body.id).toBe("summary-1");
      expect(body.provider).toBe("mock");
      expect(body.summary).toContain("Resumo executivo");
      expect(saveSummary).toHaveBeenCalledWith(transcript, body.summary, "mock");
    });

    it("returns persisted summaries", async () => {
      vi.mocked(listSummaries).mockReturnValue([{ id: "summary-1" }]);

      const response = await summaryGet();
      await expect(response.json()).resolves.toEqual({ items: [{ id: "summary-1" }] });
    });
  });

  describe("follow-up", () => {
    it("rejects malformed JSON", async () => {
      const response = await followupPost(malformedNextRequest("/api/follow-up"));

      expect(response.status).toBe(400);
      await expect(response.json()).resolves.toEqual({ error: "Payload JSON inválido." });
      expect(saveFollowup).not.toHaveBeenCalled();
    });

    it("requires meeting context", async () => {
      const response = await followupPost(
        nextJsonRequest("/api/follow-up", { context: "" }),
      );

      expect(response.status).toBe(400);
      await expect(response.json()).resolves.toEqual({
        error: "Informe o resumo ou contexto da reunião.",
      });
      expect(generateText).not.toHaveBeenCalled();
    });

    it("generates and persists a follow-up", async () => {
      const context = "Piloto aprovado. Jamite envia o plano até sexta-feira.";
      const response = await followupPost(
        nextJsonRequest("/api/follow-up", { context }),
      );
      const body = (await response.json()) as {
        id: string;
        followup: string;
        provider: string;
      };

      expect(response.status).toBe(200);
      expect(body.id).toBe("followup-1");
      expect(body.provider).toBe("mock");
      expect(body.followup).toContain("Follow-up da reunião");
      expect(saveFollowup).toHaveBeenCalledWith(context, body.followup, "mock");
    });

    it("returns persisted follow-ups", async () => {
      vi.mocked(listFollowups).mockReturnValue([{ id: "followup-1" }]);

      const response = await followupGet();
      await expect(response.json()).resolves.toEqual({ items: [{ id: "followup-1" }] });
    });
  });

  describe("unified history", () => {
    it("lists the timeline with sanitized search and bounded limit", async () => {
      vi.mocked(getTimeline).mockReturnValue([{ id: "summary-1", type: "transcription" }]);
      const request = new NextRequest(
        "http://localhost/api/history?q=%20ALDA%20&limit=500",
      );

      const response = await historyGet(request);

      expect(response.status).toBe(200);
      expect(getTimeline).toHaveBeenCalledWith("ALDA", 100);
      await expect(response.json()).resolves.toEqual({
        items: [{ id: "summary-1", type: "transcription" }],
      });
    });

    it("requires id and type together", async () => {
      const response = await historyGet(
        new NextRequest("http://localhost/api/history?id=summary-1"),
      );

      expect(response.status).toBe(400);
    });

    it("rejects unsupported history types", async () => {
      const response = await historyGet(
        new NextRequest("http://localhost/api/history?id=1&type=unknown"),
      );

      expect(response.status).toBe(400);
      await expect(response.json()).resolves.toEqual({
        error: "Tipo de histórico inválido.",
      });
    });

    it("returns 404 when a record does not exist", async () => {
      const response = await historyGet(
        new NextRequest(
          "http://localhost/api/history?id=summary-404&type=transcription",
        ),
      );

      expect(response.status).toBe(404);
      await expect(response.json()).resolves.toEqual({
        error: "Registo não encontrado.",
      });
    });

    it("returns a persisted record", async () => {
      const item = { id: "summary-1", summary: "Resumo" };
      vi.mocked(getTimelineItem).mockReturnValue(item);

      const response = await historyGet(
        new NextRequest(
          "http://localhost/api/history?id=summary-1&type=transcription",
        ),
      );

      expect(response.status).toBe(200);
      await expect(response.json()).resolves.toEqual({ item });
    });
  });
});
