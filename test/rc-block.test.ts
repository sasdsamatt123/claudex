import { afterEach, beforeEach, describe, expect, it } from "vitest";
import fs from "node:fs";
import path from "node:path";
import { sandbox, type SandboxEnv } from "./helpers.js";
import { ensureBlock, hasBlock, removeBlock, MARKERS } from "../src/core/rc-block.js";

describe("rc-block", () => {
  let env: SandboxEnv;
  let rc: string;

  beforeEach(() => {
    env = sandbox();
    rc = path.join(env.home, ".zshrc");
    fs.writeFileSync(rc, "# original user content\nexport FOO=bar\n");
  });
  afterEach(() => env.cleanup());

  it("inserts the managed block when missing", () => {
    const r = ensureBlock(rc);
    expect(r.changed).toBe(true);
    expect(r.alreadyPresent).toBe(false);
    const content = fs.readFileSync(rc, "utf8");
    expect(content).toContain(MARKERS.begin);
    expect(content).toContain(MARKERS.end);
    expect(content).toContain("export FOO=bar");
    expect(hasBlock(rc)).toBe(true);
  });

  it("is idempotent — re-running does not duplicate", () => {
    ensureBlock(rc);
    const r2 = ensureBlock(rc);
    expect(r2.alreadyPresent).toBe(true);
    const content = fs.readFileSync(rc, "utf8");
    const beginCount = (content.match(new RegExp(escape(MARKERS.begin), "g")) ?? []).length;
    expect(beginCount).toBe(1);
  });

  it("creates a backup when modifying", () => {
    const r = ensureBlock(rc);
    expect(r.backupPath).toBeTruthy();
    expect(fs.existsSync(r.backupPath!)).toBe(true);
  });

  it("preserves user content outside the managed block", () => {
    ensureBlock(rc);
    fs.appendFileSync(rc, "\nalias mycoolthing='echo hi'\n");
    const r = ensureBlock(rc);
    expect(r.alreadyPresent).toBe(true);
    const content = fs.readFileSync(rc, "utf8");
    expect(content).toContain("alias mycoolthing='echo hi'");
    expect(content).toContain("export FOO=bar");
  });

  it("removes only the managed block on removeBlock()", () => {
    ensureBlock(rc);
    fs.appendFileSync(rc, "alias keepme='echo'\n");
    removeBlock(rc);
    const content = fs.readFileSync(rc, "utf8");
    expect(content).not.toContain(MARKERS.begin);
    expect(content).not.toContain(MARKERS.end);
    expect(content).toContain("alias keepme='echo'");
    expect(content).toContain("export FOO=bar");
  });

  it("creates the rc file if it didn't exist", () => {
    fs.unlinkSync(rc);
    const r = ensureBlock(rc);
    expect(r.changed).toBe(true);
    expect(fs.existsSync(rc)).toBe(true);
    expect(hasBlock(rc)).toBe(true);
  });
});

function escape(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
