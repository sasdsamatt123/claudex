import fs from "node:fs";
import pc from "picocolors";
import { getPaths } from "../core/paths.js";
import { detectShell, commandExists } from "../core/shell.js";
import { ensureBlock } from "../core/rc-block.js";
import { regenerateAliases } from "../core/aliases.js";
import { t, getLang } from "../core/i18n.js";

export interface InitOptions {
  force?: boolean;
}

export async function runInit(_opts: InitOptions = {}): Promise<void> {
  console.log(pc.bold(t("init.start")));

  const paths = getPaths();
  const dirs = [
    paths.home,
    paths.profilesDir,
    paths.generatedDir,
    paths.backupsDir,
  ];
  for (const d of dirs) {
    fs.mkdirSync(d, { recursive: true });
  }
  fs.writeFileSync(
    `${paths.home}/.gitignore`,
    "profiles/*/.env\nbackups/\nproviders.user.json\n",
    { mode: 0o644 }
  );

  // initial config.json + profiles.json (if missing)
  if (!fs.existsSync(paths.configFile)) {
    const config = {
      schemaVersion: 1,
      lang: getLang(),
      createdAt: new Date().toISOString(),
    };
    fs.writeFileSync(paths.configFile, JSON.stringify(config, null, 2) + "\n");
  }
  if (!fs.existsSync(paths.profilesFile)) {
    fs.writeFileSync(
      paths.profilesFile,
      JSON.stringify({ schemaVersion: 1, profiles: [] }, null, 2) + "\n"
    );
  }

  console.log(pc.green(t("init.created")), pc.dim(paths.home));

  // regenerate (empty) aliases.sh so the rc block has something to source
  regenerateAliases();

  // shell rc block
  const shell = detectShell();
  if (!shell.rcPath) {
    console.log(
      pc.yellow(
        `⚠ Shell not detected (SHELL=${process.env.SHELL ?? "?"}). Add this line manually to your shell rc:\n  [ -f "${paths.aliasesFile}" ] && . "${paths.aliasesFile}"`
      )
    );
  } else {
    const result = ensureBlock(shell.rcPath, shell.kind === "fish");
    if (result.changed) {
      console.log(pc.green(t("init.rcAdded")), pc.dim(`(${shell.rcPath})`));
      if (result.backupPath) {
        console.log(pc.dim(`  backup: ${result.backupPath}`));
      }
    } else if (result.alreadyPresent) {
      console.log(pc.dim(t("init.rcExists")), pc.dim(`(${shell.rcPath})`));
    }
  }

  // Claude Code installed?
  if (!commandExists("claude")) {
    console.log(pc.yellow(t("init.noClaude")));
  }

  console.log("");
  console.log(pc.bold("▶ ") + t("init.next") + " " + pc.cyan(`~/.${shell.kind === "fish" ? "config/fish/config.fish" : shell.kind === "bash" ? "bashrc" : "zshrc"}`));
  console.log(pc.bold("▶ ") + "claudex add <name> --provider zai");
}
