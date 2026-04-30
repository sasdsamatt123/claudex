import fs from "node:fs";
import prompts from "prompts";
import pc from "picocolors";
import { profileDir } from "../core/paths.js";
import { getProfile, removeProfile } from "../core/profiles.js";
import { unshareFromMainClaude } from "../core/symlinks.js";
import { regenerateAliases } from "../core/aliases.js";
import { t } from "../core/i18n.js";

export interface RemoveOptions {
  keepData?: boolean;
  yes?: boolean;
}

export async function runRemove(name: string, opts: RemoveOptions = {}): Promise<void> {
  const existing = getProfile(name);
  if (!existing) {
    console.error(pc.red(t("remove.notFound")), name);
    process.exitCode = 1;
    return;
  }

  if (!opts.yes) {
    const { ok } = await prompts({
      type: "confirm",
      name: "ok",
      message: `${t("remove.confirm")} ${pc.bold(name)}`,
      initial: false,
    });
    if (!ok) {
      console.log(t("common.cancelled"));
      return;
    }
  }

  removeProfile(name);
  regenerateAliases();

  if (!opts.keepData) {
    const dir = profileDir(name);
    if (fs.existsSync(dir)) {
      // unshare symlinks first so we don't accidentally rm -rf into ~/.claude
      unshareFromMainClaude(dir);
      try {
        fs.rmSync(dir, { recursive: true, force: true });
      } catch (e) {
        console.warn(pc.yellow(`⚠ failed to remove ${dir}: ${(e as Error).message}`));
      }
    }
  }
  console.log(pc.green(t("remove.success")), pc.bold(name));
}
