import { describe, expect, it } from "vitest";
import { loadRegistry } from "../src/core/providers.js";

describe("schema backwards compatibility", () => {
  it("v0.2 schema loads bundled providers.json with new optional fields", () => {
    const reg = loadRegistry();
    // every model should have useCases (possibly empty) and pricing (possibly null)
    for (const provider of reg.providers) {
      for (const model of provider.models) {
        expect(Array.isArray(model.useCases)).toBe(true);
        expect(model.pricing === null || typeof model.pricing === "object").toBe(true);
      }
    }
  });

  it("z.ai free Flash models declare useCases and null pricing", () => {
    const reg = loadRegistry();
    const zai = reg.providers.find((p) => p.id === "zai");
    expect(zai).toBeTruthy();
    const flash = zai!.models.find((m) => m.id === "glm-4.7-flash");
    expect(flash).toBeTruthy();
    expect(flash!.useCases.length).toBeGreaterThan(0);
    expect(flash!.useCases).toContain("coding-fast");
    expect(flash!.pricing).toBeNull();
  });

  it("DeepSeek paid models declare pricing with concrete numbers", () => {
    const reg = loadRegistry();
    const ds = reg.providers.find((p) => p.id === "deepseek");
    const pro = ds!.models.find((m) => m.id === "deepseek-v4-pro");
    expect(pro!.pricing).toBeTruthy();
    expect(pro!.pricing!.inputPer1M).toBe(0.27);
    expect(pro!.pricing!.outputPer1M).toBe(1.10);
  });

  it("MiniMax trial models flag pricing.trial=true", () => {
    const reg = loadRegistry();
    const mm = reg.providers.find((p) => p.id === "minimax");
    const m27 = mm!.models.find((m) => m.id === "MiniMax-M2.7");
    expect(m27!.pricing).toBeTruthy();
    expect(m27!.pricing!.trial).toBe(true);
  });
});
