import fs from "node:fs";
import path from "node:path";
import { getPaths } from "./paths.js";

const BEGIN_MARKER = "# >>> claudex managed block >>>";
const END_MARKER = "# <<< claudex managed block <<<";

export interface RcBlockResult {
  changed: boolean;
  alreadyPresent: boolean;
  backupPath: string | null;
}

function makeBlock(aliasesFile: string, fishVariant: boolean): string {
  if (fishVariant) {
    return [
      BEGIN_MARKER,
      `if test -f "${aliasesFile}"`,
      `    source "${aliasesFile}"`,
      "end",
      END_MARKER,
    ].join("\n");
  }
  return [
    BEGIN_MARKER,
    `[ -f "${aliasesFile}" ] && . "${aliasesFile}"`,
    END_MARKER,
  ].join("\n");
}

function timestamp(): string {
  const d = new Date();
  return d
    .toISOString()
    .replace(/[:.]/g, "-")
    .replace("T", "_")
    .replace("Z", "");
}

function backupRc(rcPath: string): string {
  const paths = getPaths();
  fs.mkdirSync(paths.backupsDir, { recursive: true });
  const base = path.basename(rcPath);
  const dest = path.join(paths.backupsDir, `${base}.${timestamp()}.bak`);
  fs.copyFileSync(rcPath, dest);
  return dest;
}

export function ensureBlock(rcPath: string, fishVariant = false): RcBlockResult {
  const paths = getPaths();
  const block = makeBlock(paths.aliasesFile, fishVariant);

  let content = "";
  let existed = false;
  try {
    content = fs.readFileSync(rcPath, "utf8");
    existed = true;
  } catch {
    // file doesn't exist; will be created
  }

  const hasBegin = content.includes(BEGIN_MARKER);
  const hasEnd = content.includes(END_MARKER);

  if (hasBegin && hasEnd) {
    const re = new RegExp(
      `${escapeRegex(BEGIN_MARKER)}[\\s\\S]*?${escapeRegex(END_MARKER)}`,
      "m"
    );
    const next = content.replace(re, block);
    if (next === content) {
      return { changed: false, alreadyPresent: true, backupPath: null };
    }
    const backupPath = existed ? backupRc(rcPath) : null;
    fs.writeFileSync(rcPath, next, { mode: 0o644 });
    return { changed: true, alreadyPresent: true, backupPath };
  }

  const backupPath = existed ? backupRc(rcPath) : null;
  const trail = content.length === 0 || content.endsWith("\n") ? "" : "\n";
  const next = `${content}${trail}\n${block}\n`;
  fs.writeFileSync(rcPath, next, { mode: 0o644 });
  return { changed: true, alreadyPresent: false, backupPath };
}

export function removeBlock(rcPath: string): RcBlockResult {
  let content = "";
  let existed = false;
  try {
    content = fs.readFileSync(rcPath, "utf8");
    existed = true;
  } catch {
    return { changed: false, alreadyPresent: false, backupPath: null };
  }

  const re = new RegExp(
    `\\n*${escapeRegex(BEGIN_MARKER)}[\\s\\S]*?${escapeRegex(END_MARKER)}\\n?`,
    "m"
  );
  if (!re.test(content)) {
    return { changed: false, alreadyPresent: false, backupPath: null };
  }
  const backupPath = existed ? backupRc(rcPath) : null;
  const next = content.replace(re, "\n");
  fs.writeFileSync(rcPath, next, { mode: 0o644 });
  return { changed: true, alreadyPresent: true, backupPath };
}

export function hasBlock(rcPath: string): boolean {
  try {
    const content = fs.readFileSync(rcPath, "utf8");
    return content.includes(BEGIN_MARKER) && content.includes(END_MARKER);
  } catch {
    return false;
  }
}

function escapeRegex(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

export const MARKERS = { begin: BEGIN_MARKER, end: END_MARKER };
