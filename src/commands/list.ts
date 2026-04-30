import pc from "picocolors";
import { loadProfiles } from "../core/profiles.js";
import { getProvider, tierLabel } from "../core/providers.js";
import { hasSecret } from "../core/secrets.js";
import { profileDir } from "../core/paths.js";
import { t, getLang } from "../core/i18n.js";

export interface ListOptions {
  json?: boolean;
}

export async function runList(opts: ListOptions = {}): Promise<void> {
  const profiles = loadProfiles();
  if (opts.json) {
    console.log(JSON.stringify(profiles, null, 2));
    return;
  }
  if (profiles.length === 0) {
    console.log(pc.dim(t("list.empty")));
    return;
  }
  const lang = getLang();
  console.log(pc.bold(t("list.header")));
  console.log("");
  const rows: string[][] = [
    [
      lang === "tr" ? "İSİM" : "NAME",
      lang === "tr" ? "SAĞLAYICI" : "PROVIDER",
      "MAIN",
      "SMALL",
      lang === "tr" ? "PAYLAŞIM" : "SHARE",
      lang === "tr" ? "ANAHTAR" : "KEY",
    ],
  ];
  for (const p of profiles) {
    const provider = getProvider(p.providerId);
    const tier = provider ? tierLabel(provider.tier, lang) : "?";
    const keyStatus = hasSecret(profileDir(p.name)) ? pc.green("✓") : pc.red("✗");
    rows.push([
      pc.bold(p.name),
      `${provider?.displayName ?? p.providerId} ${pc.dim(`[${tier}]`)}`,
      p.mainModel ?? pc.dim("—"),
      p.smallModel ?? pc.dim("—"),
      p.share ? pc.green("✓") : pc.dim("—"),
      keyStatus,
    ]);
  }
  printTable(rows);
}

function printTable(rows: string[][]): void {
  const stripAnsi = (s: string) =>
    s.replace(/\[[0-9;]*m/g, "");
  const widths = rows[0].map((_, i) =>
    Math.max(...rows.map((r) => stripAnsi(r[i] ?? "").length))
  );
  const sep = "  ";
  for (let i = 0; i < rows.length; i++) {
    const row = rows[i]
      .map((cell, j) => {
        const padding = widths[j] - stripAnsi(cell).length;
        return cell + " ".repeat(Math.max(0, padding));
      })
      .join(sep);
    if (i === 0) console.log(pc.dim(row));
    else console.log(row);
  }
}
