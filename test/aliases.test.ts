import { afterEach, beforeEach, describe, expect, it } from "vitest";
import fs from "node:fs";
import { sandbox, type SandboxEnv } from "./helpers.js";
import { regenerateAliases } from "../src/core/aliases.js";
import { upsertProfile, nowIso } from "../src/core/profiles.js";

describe("aliases.sh generator", () => {
  let env: SandboxEnv;
  beforeEach(() => {
    env = sandbox();
  });
  afterEach(() => env.cleanup());

  it("generates a function + alias for each profile", () => {
    upsertProfile({
      name: "claude5",
      providerId: "zai",
      baseUrl: "https://api.z.ai/api/anthropic",
      mainModel: "glm-4.7-flash",
      smallModel: "glm-4.5-flash",
      share: true,
      createdAt: nowIso(),
      updatedAt: nowIso(),
    });
    const path = regenerateAliases();
    const content = fs.readFileSync(path, "utf8");
    expect(content).toContain("__claudex_run_claude5() {");
    expect(content).toContain("alias claude5='__claudex_run_claude5'");
    expect(content).toContain('ANTHROPIC_BASE_URL="https://api.z.ai/api/anthropic"');
    expect(content).toContain('ANTHROPIC_MODEL="glm-4.7-flash"');
    expect(content).toContain('ANTHROPIC_SMALL_FAST_MODEL="glm-4.5-flash"');
    expect(content).toContain("CLAUDE_CONFIG_DIR=");
    expect(content).toContain("command claude");
  });

  it("does not include ANTHROPIC_BASE_URL for anthropic provider (default)", () => {
    upsertProfile({
      name: "claude2",
      providerId: "anthropic",
      baseUrl: null,
      mainModel: null,
      smallModel: null,
      share: false,
      createdAt: nowIso(),
      updatedAt: nowIso(),
    });
    const path = regenerateAliases();
    const content = fs.readFileSync(path, "utf8");
    expect(content).toContain("__claudex_run_claude2()");
    // env-set form (not the header comment mention)
    expect(content).not.toContain("ANTHROPIC_BASE_URL=");
    expect(content).not.toContain("ANTHROPIC_AUTH_TOKEN=");
    expect(content).toContain("CLAUDE_CONFIG_DIR=");
  });

  it("rewrites the file when profiles change (no append duplication)", () => {
    upsertProfile({
      name: "a",
      providerId: "zai",
      baseUrl: "https://api.z.ai/api/anthropic",
      mainModel: "glm-4.7-flash",
      smallModel: "glm-4.5-flash",
      share: false,
      createdAt: nowIso(),
      updatedAt: nowIso(),
    });
    regenerateAliases();
    const path = regenerateAliases();
    const content = fs.readFileSync(path, "utf8");
    const matches = content.match(/__claudex_run_a\(\)/g) ?? [];
    expect(matches.length).toBe(1);
  });
});
