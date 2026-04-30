import fs from "node:fs";
import path from "node:path";
import { getPaths } from "./paths.js";

/**
 * Files & directories from ~/.claude/ that we mirror as symlinks into a profile dir.
 * Matches the user's existing ~/.claude-hesap1/ pattern.
 */
export const SHARED_ENTRIES = [
  "agents",
  "commands",
  "skills",
  "plugins",
  "projects",
  "CLAUDE.md",
  "settings.json",
  "mcp.json",
  "memory-config.json",
] as const;

export interface SymlinkResult {
  created: string[];
  skipped: string[];
  errors: { name: string; reason: string }[];
}

export function shareFromMainClaude(profileDir: string): SymlinkResult {
  const { mainClaudeDir } = getPaths();
  const result: SymlinkResult = { created: [], skipped: [], errors: [] };

  if (!fs.existsSync(mainClaudeDir)) {
    return result;
  }
  fs.mkdirSync(profileDir, { recursive: true });

  for (const name of SHARED_ENTRIES) {
    const src = path.join(mainClaudeDir, name);
    const dst = path.join(profileDir, name);

    if (!fs.existsSync(src)) {
      result.skipped.push(name);
      continue;
    }
    if (fs.existsSync(dst) || isSymlink(dst)) {
      try {
        const lst = fs.lstatSync(dst);
        if (lst.isSymbolicLink()) {
          const target = fs.readlinkSync(dst);
          if (target === src) {
            result.skipped.push(name);
            continue;
          }
          fs.unlinkSync(dst);
        } else {
          result.errors.push({ name, reason: "exists and is not a claudex symlink" });
          continue;
        }
      } catch (e) {
        result.errors.push({ name, reason: String(e) });
        continue;
      }
    }
    try {
      fs.symlinkSync(src, dst);
      result.created.push(name);
    } catch (e) {
      result.errors.push({ name, reason: String(e) });
    }
  }
  return result;
}

export function unshareFromMainClaude(profileDir: string): void {
  for (const name of SHARED_ENTRIES) {
    const dst = path.join(profileDir, name);
    if (isSymlink(dst)) {
      try {
        fs.unlinkSync(dst);
      } catch {
        // ignore
      }
    }
  }
}

function isSymlink(p: string): boolean {
  try {
    return fs.lstatSync(p).isSymbolicLink();
  } catch {
    return false;
  }
}
