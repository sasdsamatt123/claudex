import os from "node:os";
import path from "node:path";
import fs from "node:fs";

export type ShellKind = "zsh" | "bash" | "fish" | "unknown";

export interface ShellInfo {
  kind: ShellKind;
  rcPath: string | null;
}

export function detectShell(): ShellInfo {
  const sh = (process.env.SHELL ?? "").toLowerCase();
  const home = os.homedir();

  if (sh.includes("zsh")) {
    return { kind: "zsh", rcPath: path.join(home, ".zshrc") };
  }
  if (sh.includes("bash")) {
    const bashrc = path.join(home, ".bashrc");
    const bashProfile = path.join(home, ".bash_profile");
    const rcPath = fs.existsSync(bashrc)
      ? bashrc
      : fs.existsSync(bashProfile)
        ? bashProfile
        : bashrc;
    return { kind: "bash", rcPath };
  }
  if (sh.includes("fish")) {
    return { kind: "fish", rcPath: path.join(home, ".config/fish/config.fish") };
  }
  return { kind: "unknown", rcPath: null };
}

export function commandExists(cmd: string): boolean {
  const PATH = process.env.PATH ?? "";
  const exts = process.platform === "win32" ? [".exe", ".cmd", ".bat", ""] : [""];
  for (const dir of PATH.split(path.delimiter)) {
    if (!dir) continue;
    for (const ext of exts) {
      const full = path.join(dir, cmd + ext);
      try {
        const st = fs.statSync(full);
        if (st.isFile()) return true;
      } catch {
        // ignore
      }
    }
  }
  return false;
}
