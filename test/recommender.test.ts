import { describe, expect, it } from "vitest";
import { loadRegistry, USE_CASES, type UseCase } from "../src/core/providers.js";
import { recommend, isUseCase } from "../src/core/recommender.js";

describe("recommender", () => {
  const reg = loadRegistry();
  const fixedNow = new Date("2026-05-15");

  it("isUseCase guards against typos", () => {
    expect(isUseCase("coding-fast")).toBe(true);
    expect(isUseCase("nope")).toBe(false);
  });

  it("returns at most 3 results", () => {
    for (const intent of USE_CASES) {
      const r = recommend(reg, intent, { now: fixedNow });
      expect(r.length).toBeLessThanOrEqual(3);
    }
  });

  it("dedupes by provider — top-3 has no duplicate provider", () => {
    for (const intent of USE_CASES) {
      const r = recommend(reg, intent, { now: fixedNow });
      const providers = r.map((x) => x.provider.id);
      expect(new Set(providers).size).toBe(providers.length);
    }
  });

  it("ranks free models above paid for the same intent", () => {
    const r = recommend(reg, "coding-fast", { now: fixedNow });
    expect(r.length).toBeGreaterThan(0);
    expect(r[0].model.free).toBe(true);
  });

  it("free-trial intent returns only free or trial models", () => {
    const r = recommend(reg, "free-trial", { now: fixedNow });
    expect(r.length).toBeGreaterThan(0);
    for (const rec of r) {
      expect(rec.model.free || rec.provider.tier === "trial").toBe(true);
    }
  });

  it("vision intent returns gemma (the only vision-tagged model)", () => {
    const r = recommend(reg, "vision", { now: fixedNow });
    expect(r.length).toBeGreaterThan(0);
    expect(r[0].model.id).toBe("google/gemma-4-31b-it:free");
  });

  it("long-context intent prefers larger context windows", () => {
    const r = recommend(reg, "long-context", { now: fixedNow });
    expect(r.length).toBeGreaterThan(0);
    // Top result should have a large context (>= 200K)
    expect(r[0].model.context).toBeGreaterThanOrEqual(200000);
  });

  it("bogus intent yields empty result", () => {
    const r = recommend(reg, "not-a-real-intent" as UseCase, { now: fixedNow });
    expect(r).toEqual([]);
  });

  it("filters out trial-expired providers", () => {
    // pretend it's after MiniMax trial end date
    const past = new Date("2027-01-01");
    const r = recommend(reg, "free-trial", { now: past });
    for (const rec of r) {
      expect(rec.provider.id).not.toBe("minimax");
    }
  });

  it("scoring includes 'why' rationale strings", () => {
    const r = recommend(reg, "coding-fast", { now: fixedNow });
    expect(r[0].why.length).toBeGreaterThan(0);
    expect(r[0].why.some((w) => w === "FREE" || w === "TRIAL")).toBe(true);
  });
});
