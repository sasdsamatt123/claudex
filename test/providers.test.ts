import { describe, expect, it } from "vitest";
import { loadRegistry, getProvider, defaultMain, defaultSmall } from "../src/core/providers.js";

describe("providers registry", () => {
  it("loads and validates the bundled providers.json", () => {
    const reg = loadRegistry();
    expect(reg.schemaVersion).toBe(1);
    expect(reg.providers.length).toBeGreaterThanOrEqual(6);
  });

  it("contains the six expected providers", () => {
    const reg = loadRegistry();
    const ids = reg.providers.map((p) => p.id);
    for (const required of ["anthropic", "zai", "minimax", "deepseek", "moonshot", "openrouter"]) {
      expect(ids).toContain(required);
    }
  });

  it("z.ai has free Flash defaults", () => {
    const p = getProvider("zai");
    expect(p).toBeTruthy();
    expect(defaultMain(p!)).toBe("glm-4.7-flash");
    expect(defaultSmall(p!)).toBe("glm-4.5-flash");
    expect(p!.tier).toBe("free");
  });

  it("MiniMax has trial expiry set", () => {
    const p = getProvider("minimax");
    expect(p).toBeTruthy();
    expect(p!.tier).toBe("trial");
    expect(p!.trialEndsAt).toBeTruthy();
  });

  it("OpenRouter exposes free models with :free suffix", () => {
    const p = getProvider("openrouter");
    expect(p).toBeTruthy();
    const free = p!.models.filter((m) => m.free);
    expect(free.length).toBeGreaterThan(0);
    for (const m of free) {
      expect(m.id).toMatch(/:free$/);
    }
  });

  it("anthropic provider needs no key (subscription path)", () => {
    const p = getProvider("anthropic");
    expect(p).toBeTruthy();
    expect(p!.auth.needsKey).toBe(false);
    expect(p!.baseUrl).toBeNull();
  });

  it("getProvider returns null for unknown id", () => {
    expect(getProvider("not-a-real-provider")).toBeNull();
  });
});
