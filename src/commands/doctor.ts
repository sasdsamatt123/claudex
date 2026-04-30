import fs from "node:fs";
import path from "node:path";
import pc from "picocolors";
import { getPaths, profileDir } from "../core/paths.js";
import { detectShell, commandExists } from "../core/shell.js";
import { hasBlock } from "../core/rc-block.js";
import { hasSecret } from "../core/secrets.js";
import { loadProfiles } from "../core/profiles.js";
import { getProvider } from "../core/providers.js";
import { t, getLang } from "../core/i18n.js";

export async function runDoctor(): Promise<void> {
  const lang = getLang();
  console.log(pc.bold(t("doctor.header")));
  console.log("");

  // 1. Claude Code on PATH
  if (commandExists("claude")) {
    console.log(pc.green(t("doctor.claudeOk")));
  } else {
    console.log(pc.red(t("doctor.claudeMissing")));
  }

  // 2. ~/.claudex exists
  const paths = getPaths();
  if (fs.existsSync(paths.home)) {
    console.log(pc.green("✓"), pc.dim(paths.home));
  } else {
    console.log(pc.red("✗"), pc.dim(`${paths.home} (run: claudex init)`));
  }

  // 3. Shell rc has block
  const shell = detectShell();
  if (!shell.rcPath) {
    console.log(pc.yellow(`⚠ shell rc not detected (SHELL=${process.env.SHELL ?? "?"})`));
  } else if (hasBlock(shell.rcPath)) {
    console.log(pc.green(t("doctor.rcOk")), pc.dim(`(${shell.rcPath})`));
  } else {
    console.log(pc.red(t("doctor.rcMissing")), pc.dim(`(${shell.rcPath})`));
  }

  // 4. aliases.sh exists
  if (fs.existsSync(paths.aliasesFile)) {
    console.log(pc.green("✓"), pc.dim(paths.aliasesFile));
  } else {
    console.log(pc.red("✗"), pc.dim(`${paths.aliasesFile} (run: claudex init)`));
  }

  // 5. Per-profile checks
  const profiles = loadProfiles();
  if (profiles.length === 0) {
    console.log(pc.dim(`\n${t("list.empty")}`));
    return;
  }
  console.log("");
  for (const p of profiles) {
    const provider = getProvider(p.providerId);
    const dir = profileDir(p.name);
    const haveKey = !provider?.auth.needsKey || hasSecret(dir);
    const dirExists = fs.existsSync(dir);
    const ok = dirExists && haveKey;
    const status = ok ? pc.green("✓") : pc.red("✗");
    console.log(`${status} ${pc.bold(p.name)} ${pc.dim(`(${provider?.displayName ?? p.providerId})`)}`);
    if (!dirExists) console.log(pc.dim(`   profile dir missing: ${dir}`));
    if (!haveKey) console.log(pc.dim(`   key file missing: ${path.join(dir, ".env")}`));
    if (provider?.trialEndsAt) {
      const days = daysUntil(provider.trialEndsAt);
      if (days !== null && days <= 14 && days >= 0) {
        console.log(
          pc.yellow(`   ${t("doctor.trialWarn")} ${provider.trialEndsAt} (${days} ${lang === "tr" ? "gün" : "days"})`)
        );
      } else if (days !== null && days < 0) {
        console.log(pc.red(`   trial expired: ${provider.trialEndsAt}`));
      }
    }
  }
}

function daysUntil(iso: string): number | null {
  const t = Date.parse(iso);
  if (Number.isNaN(t)) return null;
  const ms = t - Date.now();
  return Math.floor(ms / 86400000);
}
