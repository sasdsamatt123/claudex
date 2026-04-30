import fs from "node:fs";
import path from "node:path";
import prompts from "prompts";
import pc from "picocolors";
import { getPaths, profileDir } from "../core/paths.js";
import { detectShell } from "../core/shell.js";
import { ensureBlock } from "../core/rc-block.js";
import { regenerateAliases } from "../core/aliases.js";
import { writeSecret } from "../core/secrets.js";
import { shareFromMainClaude } from "../core/symlinks.js";
import {
  loadRegistry,
  getProvider,
  defaultMain,
  defaultSmall,
  tierLabel,
  type Provider,
  type Model,
} from "../core/providers.js";
import {
  isValidName,
  getProfile,
  upsertProfile,
  nowIso,
} from "../core/profiles.js";
import { t, getLang } from "../core/i18n.js";

export interface AddOptions {
  provider?: string;
  mainModel?: string;
  smallModel?: string;
  share?: boolean;
  noShare?: boolean;
  yes?: boolean;
  key?: string;
}

export async function runAdd(name: string, opts: AddOptions = {}): Promise<void> {
  const lang = getLang();
  if (!isValidName(name)) {
    console.error(pc.red(t("add.invalidName")));
    process.exitCode = 1;
    return;
  }
  if (manualAliasCollides(name)) {
    console.error(pc.red(t("add.collision")));
    process.exitCode = 1;
    return;
  }

  const existing = getProfile(name);
  if (existing && !opts.yes) {
    const { ok } = await prompts({
      type: "confirm",
      name: "ok",
      message: t("add.exists"),
      initial: false,
    });
    if (!ok) {
      console.log(t("common.cancelled"));
      return;
    }
  }

  const registry = loadRegistry();
  let provider = opts.provider ? getProvider(opts.provider) : null;
  if (!provider) {
    const { providerId } = await prompts({
      type: "select",
      name: "providerId",
      message: t("add.pickProvider"),
      choices: registry.providers.map((p) => ({
        title: `${p.displayName}  ${pc.dim(`[${tierLabel(p.tier, lang)}]`)}`,
        description: p.notes[lang],
        value: p.id,
      })),
      initial: 0,
    });
    if (!providerId) {
      console.log(t("common.cancelled"));
      return;
    }
    provider = getProvider(providerId);
  }
  if (!provider) {
    console.error(pc.red(`provider not found: ${opts.provider}`));
    process.exitCode = 1;
    return;
  }

  // Show key URL + instructions
  if (provider.auth.needsKey) {
    console.log("");
    console.log(pc.bold(t("add.keyUrl")) + " " + pc.cyan(provider.auth.keyUrl));
    console.log(pc.dim(provider.auth.instructions[lang]));
    console.log("");
  }

  // Get key
  let key = opts.key ?? "";
  if (provider.auth.needsKey && !key) {
    const r = await prompts({
      type: "password",
      name: "key",
      message: t("add.keyPrompt"),
      validate: (v: string) => (v.trim().length > 0 ? true : "required"),
    });
    if (!r.key) {
      console.log(t("common.cancelled"));
      return;
    }
    key = r.key.trim();
  }

  // Pick models
  const mainCandidates = provider.models.filter((m) => m.role === "main");
  const smallCandidates = provider.models.filter((m) => m.role === "small");
  let mainModel = opts.mainModel ?? defaultMain(provider) ?? null;
  let smallModel = opts.smallModel ?? defaultSmall(provider) ?? null;

  if (mainCandidates.length > 1 && !opts.mainModel && !opts.yes) {
    const { picked } = await prompts({
      type: "select",
      name: "picked",
      message: t("add.mainModel"),
      choices: mainCandidates.map((m) => ({
        title: modelLabel(m),
        value: m.id,
      })),
      initial: indexOfDefault(mainCandidates, mainModel),
    });
    if (picked) mainModel = picked;
  }
  if (smallCandidates.length > 1 && !opts.smallModel && !opts.yes) {
    const { picked } = await prompts({
      type: "select",
      name: "picked",
      message: t("add.smallModel"),
      choices: smallCandidates.map((m) => ({
        title: modelLabel(m),
        value: m.id,
      })),
      initial: indexOfDefault(smallCandidates, smallModel),
    });
    if (picked) smallModel = picked;
  }

  // Share decision
  const mainClaudeExists = fs.existsSync(getPaths().mainClaudeDir);
  let share: boolean;
  if (opts.noShare) share = false;
  else if (opts.share) share = mainClaudeExists;
  else if (!mainClaudeExists) share = false;
  else if (opts.yes) share = true;
  else {
    const r = await prompts({
      type: "confirm",
      name: "share",
      message: t("add.share"),
      initial: true,
    });
    share = !!r.share;
  }

  // Persist
  const dir = profileDir(name);
  fs.mkdirSync(dir, { recursive: true });
  if (provider.auth.needsKey) {
    writeSecret(dir, key);
  }
  if (share) {
    const r = shareFromMainClaude(dir);
    for (const err of r.errors) {
      console.warn(pc.yellow(`⚠ symlink ${err.name}: ${err.reason}`));
    }
  }
  upsertProfile({
    name,
    providerId: provider.id,
    baseUrl: provider.baseUrl,
    mainModel: mainModel ?? null,
    smallModel: smallModel ?? null,
    share,
    createdAt: existing?.createdAt ?? nowIso(),
    updatedAt: nowIso(),
  });
  regenerateAliases();

  // ensure rc block
  const shell = detectShell();
  if (shell.rcPath) {
    ensureBlock(shell.rcPath, shell.kind === "fish");
  }

  // Output
  console.log("");
  console.log(pc.green(t("add.success")), pc.dim(dir));
  console.log(pc.green(t("add.aliasGen")), pc.bold(name));
  console.log(pc.green(t("add.rcUpdated")));
  console.log("");
  const sourceCmd =
    shell.kind === "fish"
      ? "source ~/.config/fish/config.fish"
      : shell.kind === "bash"
        ? "source ~/.bashrc"
        : "source ~/.zshrc";
  console.log(t("add.runIt"));
  console.log("  " + pc.cyan(sourceCmd));
  console.log("  " + pc.bold(name));
}

function modelLabel(m: Model): string {
  const free = m.free ? pc.green(" free") : pc.dim(" paid");
  const ctx = m.context ? pc.dim(` ${Math.round(m.context / 1000)}K`) : "";
  const note = m.note ? pc.dim(` — ${m.note}`) : "";
  return `${m.id}${free}${ctx}${note}`;
}

function indexOfDefault(list: Model[], def: string | null): number {
  if (!def) return 0;
  const i = list.findIndex((m) => m.id === def);
  return i >= 0 ? i : 0;
}

/** Detect collision with existing manual aliases that aren't ours. */
function manualAliasCollides(name: string): boolean {
  const shell = detectShell();
  if (!shell.rcPath) return false;
  let content: string;
  try {
    content = fs.readFileSync(shell.rcPath, "utf8");
  } catch {
    return false;
  }
  // strip our managed block from consideration
  const stripped = content.replace(
    /# >>> claudex managed block >>>[\s\S]*?# <<< claudex managed block <<</m,
    ""
  );
  const aliasRe = new RegExp(
    `^\\s*alias\\s+${name.replace(/[-]/g, "\\-")}\\s*=`,
    "m"
  );
  const fnRe = new RegExp(
    `^\\s*${name.replace(/[-]/g, "\\-")}\\s*\\(\\)\\s*\\{`,
    "m"
  );
  return aliasRe.test(stripped) || fnRe.test(stripped);
}
