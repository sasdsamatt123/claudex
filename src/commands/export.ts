import fs from "node:fs";
import path from "node:path";
import pc from "picocolors";
import { getProfile } from "../core/profiles.js";
import { t } from "../core/i18n.js";

export interface ExportOptions {
  output?: string;
}

export async function runExport(name: string, opts: ExportOptions = {}): Promise<void> {
  const profile = getProfile(name);
  if (!profile) {
    console.error(pc.red(t("export.notFound")), name);
    process.exitCode = 1;
    return;
  }

  const template = {
    schemaVersion: 1 as const,
    kind: "claudex-profile-template",
    name: profile.name,
    providerId: profile.providerId,
    mainModel: profile.mainModel,
    smallModel: profile.smallModel,
    share: profile.share,
    exportedAt: new Date().toISOString(),
  };
  const json = JSON.stringify(template, null, 2) + "\n";

  if (opts.output) {
    const out = path.resolve(opts.output);
    fs.writeFileSync(out, json, { mode: 0o644 });
    console.log(pc.green(t("export.success")), pc.dim(out));
  } else {
    process.stdout.write(json);
  }
}
