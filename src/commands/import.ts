import fs from "node:fs";
import path from "node:path";
import prompts from "prompts";
import pc from "picocolors";
import { z } from "zod";
import { getProvider } from "../core/providers.js";
import { getProfile, isValidName } from "../core/profiles.js";
import { createProfile } from "./add.js";
import { t, getLang } from "../core/i18n.js";

const TemplateSchema = z.object({
  schemaVersion: z.literal(1),
  kind: z.literal("claudex-profile-template"),
  name: z.string(),
  providerId: z.string(),
  mainModel: z.string().nullable(),
  smallModel: z.string().nullable(),
  share: z.boolean(),
  exportedAt: z.string().optional(),
});

export interface ImportOptions {
  yes?: boolean;
  rename?: string;
  key?: string;
}

export async function runImport(file: string, opts: ImportOptions = {}): Promise<void> {
  const lang = getLang();
  const abs = path.resolve(file);
  if (!fs.existsSync(abs)) {
    console.error(pc.red(`${t("import.invalidFile")} ${abs}`));
    process.exitCode = 1;
    return;
  }
  let parsed;
  try {
    const raw = JSON.parse(fs.readFileSync(abs, "utf8"));
    parsed = TemplateSchema.parse(raw);
  } catch (e) {
    console.error(pc.red(t("import.invalidFile")), pc.dim((e as Error).message));
    process.exitCode = 1;
    return;
  }

  const provider = getProvider(parsed.providerId);
  if (!provider) {
    console.error(pc.red(t("providers.notFound")), parsed.providerId);
    process.exitCode = 1;
    return;
  }

  // Resolve final name (rename collision)
  let name = opts.rename ?? parsed.name;
  if (!isValidName(name)) {
    console.error(pc.red(t("add.invalidName")));
    process.exitCode = 1;
    return;
  }
  const existing = getProfile(name);
  if (existing && !opts.yes) {
    const { ok } = await prompts({
      type: "confirm",
      name: "ok",
      message: t("import.profileExists"),
      initial: false,
    });
    if (!ok) {
      console.log(t("common.cancelled"));
      return;
    }
  }

  console.log(
    `${t("import.from")} ${pc.bold(parsed.name)} (${provider.displayName} · ${parsed.mainModel ?? "?"})`
  );

  // Get key
  let key: string | null = opts.key ?? null;
  if (provider.auth.needsKey && !key) {
    console.log(pc.dim(`ℹ ${provider.auth.keyUrl}`));
    console.log(pc.dim(`   ${provider.auth.instructions[lang]}`));
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

  const dir = createProfile({
    name,
    provider,
    key,
    mainModel: parsed.mainModel,
    smallModel: parsed.smallModel,
    share: parsed.share,
    existingCreatedAt: existing?.createdAt ?? null,
  });
  console.log(pc.green(t("import.success")), pc.bold(name), pc.dim(dir));
}
