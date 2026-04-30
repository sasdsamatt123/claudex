import { afterEach, beforeEach, describe, expect, it } from "vitest";
import fs from "node:fs";
import path from "node:path";
import { sandbox, type SandboxEnv } from "./helpers.js";
import { writeSecret, readSecret, hasSecret } from "../src/core/secrets.js";

describe("secrets (.env mode 0600)", () => {
  let env: SandboxEnv;
  let dir: string;
  beforeEach(() => {
    env = sandbox();
    dir = path.join(env.home, ".claudex", "profiles", "test");
  });
  afterEach(() => env.cleanup());

  it("writes and reads back a key", () => {
    writeSecret(dir, "sk-abc123");
    expect(hasSecret(dir)).toBe(true);
    expect(readSecret(dir)).toBe("sk-abc123");
  });

  it("uses mode 0600 (Unix only)", () => {
    if (process.platform === "win32") return;
    writeSecret(dir, "sk-test");
    const stat = fs.statSync(path.join(dir, ".env"));
    const mode = stat.mode & 0o777;
    expect(mode).toBe(0o600);
  });

  it("escapes shell-dangerous characters round-trip", () => {
    const dangerous = `weird-key-with$pecial"chars\`and\\backslash`;
    writeSecret(dir, dangerous);
    expect(readSecret(dir)).toBe(dangerous);
  });

  it("returns null when no key file", () => {
    expect(readSecret(dir)).toBeNull();
    expect(hasSecret(dir)).toBe(false);
  });
});
