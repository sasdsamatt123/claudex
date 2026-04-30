import { afterEach, beforeEach, describe, expect, it } from "vitest";
import fs from "node:fs";
import path from "node:path";
import { sandbox, type SandboxEnv } from "./helpers.js";
import { shareFromMainClaude, unshareFromMainClaude, SHARED_ENTRIES } from "../src/core/symlinks.js";

describe("symlinks (share-from-main-claude)", () => {
  let env: SandboxEnv;
  let mainClaude: string;
  let profile: string;

  beforeEach(() => {
    env = sandbox();
    mainClaude = path.join(env.home, ".claude");
    profile = path.join(env.home, ".claudex", "profiles", "claude5");
    fs.mkdirSync(mainClaude, { recursive: true });
    fs.mkdirSync(path.join(mainClaude, "agents"), { recursive: true });
    fs.mkdirSync(path.join(mainClaude, "commands"), { recursive: true });
    fs.writeFileSync(path.join(mainClaude, "CLAUDE.md"), "hi");
    fs.writeFileSync(path.join(mainClaude, "settings.json"), "{}");
  });
  afterEach(() => env.cleanup());

  it("creates symlinks for entries that exist in main", () => {
    const r = shareFromMainClaude(profile);
    expect(r.created).toContain("agents");
    expect(r.created).toContain("CLAUDE.md");
    expect(r.created).toContain("settings.json");
    const lst = fs.lstatSync(path.join(profile, "agents"));
    expect(lst.isSymbolicLink()).toBe(true);
  });

  it("skips entries that don't exist in main", () => {
    const r = shareFromMainClaude(profile);
    // 'plugins' wasn't created in main
    expect(r.skipped).toContain("plugins");
  });

  it("is idempotent — second call does not error", () => {
    shareFromMainClaude(profile);
    const r2 = shareFromMainClaude(profile);
    expect(r2.errors.length).toBe(0);
    // already-symlinked entries land in skipped this time
    expect(r2.skipped).toContain("agents");
  });

  it("does not overwrite real files / dirs that aren't claudex symlinks", () => {
    fs.mkdirSync(profile, { recursive: true });
    fs.writeFileSync(path.join(profile, "settings.json"), "{ \"local\": true }");
    const r = shareFromMainClaude(profile);
    const err = r.errors.find((e) => e.name === "settings.json");
    expect(err).toBeTruthy();
    // local file still intact
    expect(fs.readFileSync(path.join(profile, "settings.json"), "utf8")).toContain("local");
  });

  it("unshareFromMainClaude removes only symlinks", () => {
    shareFromMainClaude(profile);
    fs.writeFileSync(path.join(profile, "real-file.txt"), "keep me");
    unshareFromMainClaude(profile);
    expect(fs.existsSync(path.join(profile, "real-file.txt"))).toBe(true);
    for (const name of SHARED_ENTRIES) {
      const p = path.join(profile, name);
      if (fs.existsSync(p)) {
        const lst = fs.lstatSync(p);
        expect(lst.isSymbolicLink()).toBe(false);
      }
    }
  });
});
