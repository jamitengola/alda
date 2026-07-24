export type JsonObject = Record<string, unknown>;

export async function readJsonObject(request: Request): Promise<JsonObject | null> {
  try {
    const body: unknown = await request.json();

    if (!body || typeof body !== "object" || Array.isArray(body)) {
      return null;
    }

    return body as JsonObject;
  } catch {
    return null;
  }
}

export function readString(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}
