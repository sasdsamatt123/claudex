import { afterEach, beforeEach, describe, expect, it } from "vitest";
import fs from "node:fs";
import path from "node:path";
import { sandbox, type SandboxEnv } from "./helpers.js";
import { runExport } from "../src/commands/export.js";
import { runImport } from "../src/commands/import.js";
import { upsertProfile, getProfile, nowIso, removeProfile } from "../src/core/profiles.js";
import { writeSecret, hasSecret, readSecret } from "../src/core/secrets.js";
import { profileDir } from "../src/core/paths.js";

describe("export / import roundtrip", () => {
  let env: SandboxEnv;
  beforeEach(() => {
    env = sandbox();
    upsertProfile({
      name: "claude5",
      providerId: "zai",
      baseUrl: "https://api.z.ai/api/anthropic",
      mainModel: "glm-4.7-flash",
      smallModel: "glm-4.5-flash",
      share: false,
      createdAt: nowIso(),
      updatedAt: nowIso(),
    });
    writeSecret(profileDir("claude5"), "sk-original-key");
  });
  afterEach(() => env.cleanup());

  it("export writes a redacted JSON template (no key)", async () => {
    const out = path.join(env.home, "claude5.template.json");
    await runExport("claude5", { output: out });
    expect(fs.existsSync(out)).toBe(true);
    const tpl = JSON.parse(fs.readFileSync(out, "utf8"));
    expect(tpl.kind).toBe("claudex-profile-template");
    expect(tpl.name).toBe("claude5");
    expect(tpl.providerId).toBe("zai");
    expect(tpl.mainModel).toBe("glm-4.7-flash");
    expect(JSON.stringify(tpl)).not.toContain("sk-original-key");
  });

  it("export of a missing profile sets exitCode=1", async () => {
    const prev = process.exitCode;
    try {
      await runExport("does-not-exist");
      expect(process.exitCode).toBe(1);
    } finally {
      process.exitCode = prev;
    }
  });

  it("import recreates a profile with a new key", async () => {
    const out = path.join(env.home, "claude5.template.json");
    await runExport("claude5", { output: out });

    // remove the original
    removeProfile("claude5");
    fs.rmSync(profileDir("claude5"), { recursive: true, force: true });
    expect(getProfile("claude5")).toBeNull();
    expect(hasSecret(profileDir("claude5"))).toBe(false);

    // import with a new key
    await runImport(out, { key: "sk-new-imported-key", yes: true });
    const got = getProfile("claude5");
    expect(got).toBeTruthy();
    expect(got?.providerId).toBe("zai");
    expect(got?.mainModel).toBe("glm-4.7-flash");
    expect(readSecret(profileDir("claude5"))).toBe("sk-new-imported-key");
  });

  it("import with --rename creates a different profile", async () => {
    const out = path.join(env.home, "claude5.template.json");
    await runExport("claude5", { output: out });
    await runImport(out, { key: "sk-x", yes: true, rename: "claude-renamed" });
    expect(getProfile("claude-renamed")).toBeTruthy();
    expect(getProfile("claude5")).toBeTruthy(); // original still there
  });

  it("import rejects malformed JSON", async () => {
    const bad = path.join(env.home, "bad.json");
    fs.writeFileSync(bad, "{ not valid json");
    const prev = process.exitCode;
    try {
      await runImport(bad);
      expect(process.exitCode).toBe(1);
    } finally {
      process.exitCode = prev;
    }
  });
});
