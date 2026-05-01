import { describe, expect, it } from "vitest";
import { pingProvider } from "../src/core/validate.js";

describe("pingProvider", () => {
  it("posts to /v1/messages with the right headers and body", async () => {
    const calls: { url: string; init: RequestInit | undefined }[] = [];
    const fakeFetch: typeof fetch = async (input, init) => {
      calls.push({ url: String(input), init });
      return new Response(JSON.stringify({ id: "msg_test" }), {
        status: 200,
        headers: { "content-type": "application/json" },
      });
    };
    const res = await pingProvider({
      apiKey: "sk-test",
      model: "glm-4.7-flash",
      baseUrl: "https://api.z.ai/api/anthropic",
      fetchImpl: fakeFetch as typeof fetch,
    });
    expect(res.ok).toBe(true);
    expect(calls.length).toBe(1);
    expect(calls[0].url).toBe("https://api.z.ai/api/anthropic/v1/messages");
    const body = JSON.parse(String(calls[0].init?.body));
    expect(body.model).toBe("glm-4.7-flash");
    expect(body.max_tokens).toBe(1);
    const headers = calls[0].init?.headers as Record<string, string>;
    expect(headers["x-api-key"]).toBe("sk-test");
    expect(headers["Authorization"]).toBe("Bearer sk-test");
  });

  it("flags 401 as unauthorized", async () => {
    const fakeFetch = async () =>
      new Response("invalid key", { status: 401 });
    const res = await pingProvider({
      apiKey: "bad",
      model: "x",
      baseUrl: "https://example.com",
      fetchImpl: fakeFetch as typeof fetch,
    });
    expect(res.ok).toBe(false);
    if (!res.ok) {
      expect(res.reason).toMatch(/401/);
      expect(res.reason).toMatch(/unauthorized/i);
    }
  });

  it("flags 404 with a helpful message", async () => {
    const fakeFetch = async () =>
      new Response("not found", { status: 404 });
    const res = await pingProvider({
      apiKey: "x",
      model: "wrong-model",
      baseUrl: "https://example.com",
      fetchImpl: fakeFetch as typeof fetch,
    });
    expect(res.ok).toBe(false);
    if (!res.ok) {
      expect(res.reason).toMatch(/404/);
    }
  });

  it("handles thrown errors gracefully", async () => {
    const fakeFetch = async () => {
      throw new Error("ENOTFOUND");
    };
    const res = await pingProvider({
      apiKey: "x",
      model: "x",
      baseUrl: "https://example.com",
      fetchImpl: fakeFetch as typeof fetch,
    });
    expect(res.ok).toBe(false);
    if (!res.ok) {
      expect(res.reason).toMatch(/ENOTFOUND/);
    }
  });
});
