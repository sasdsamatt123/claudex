import pc from "picocolors";
import { loadRegistry, getProvider, tierLabel } from "../core/providers.js";
import { t, getLang } from "../core/i18n.js";

export async function runProvidersList(): Promise<void> {
  const lang = getLang();
  const reg = loadRegistry();
  console.log(pc.bold(t("providers.header")));
  console.log("");
  for (const p of reg.providers) {
    const tier = tierLabel(p.tier, lang);
    const tierColor =
      p.tier === "free"
        ? pc.green
        : p.tier === "trial"
          ? pc.yellow
          : pc.dim;
    console.log(`  ${pc.bold(p.id.padEnd(12))} ${tierColor(`[${tier}]`)} ${p.displayName}`);
    console.log(`  ${" ".repeat(12)} ${pc.dim(p.notes[lang])}`);
    if (p.trialEndsAt) {
      console.log(`  ${" ".repeat(12)} ${pc.yellow(`Trial ends: ${p.trialEndsAt}`)}`);
    }
    if (p.auth.needsKey) {
      console.log(`  ${" ".repeat(12)} ${pc.cyan(p.auth.keyUrl)}`);
    }
    console.log("");
  }
  console.log(pc.dim(`${reg.providers.length} providers · schema v${reg.schemaVersion} · updated ${reg.lastUpdated}`));
}

export async function runProvidersInfo(id: string): Promise<void> {
  const lang = getLang();
  const p = getProvider(id);
  if (!p) {
    console.error(pc.red(t("providers.notFound")), id);
    process.exitCode = 1;
    return;
  }
  const tier = tierLabel(p.tier, lang);
  console.log(pc.bold(p.displayName));
  console.log(pc.dim(`id: ${p.id} · tier: ${tier} · last verified: ${p.lastVerified}`));
  console.log("");
  if (p.baseUrl) {
    console.log(`${pc.bold("Base URL:")}  ${pc.cyan(p.baseUrl)}`);
  } else {
    console.log(`${pc.bold("Base URL:")}  ${pc.dim("(default Anthropic)")}`);
  }
  if (p.auth.needsKey) {
    console.log(`${pc.bold("Get key:")}   ${pc.cyan(p.auth.keyUrl)}`);
    console.log("");
    console.log(pc.dim(p.auth.instructions[lang]));
  }
  if (p.trialEndsAt) {
    console.log("");
    console.log(pc.yellow(`Trial ends: ${p.trialEndsAt}`));
  }
  console.log("");
  console.log(pc.bold(lang === "tr" ? "Modeller:" : "Models:"));
  for (const m of p.models) {
    const free = m.free ? pc.green(" free") : pc.dim(" paid");
    const ctx = m.context ? pc.dim(` ${Math.round(m.context / 1000)}K`) : "";
    const note = m.note ? pc.dim(` — ${m.note}`) : "";
    const role = pc.dim(` [${m.role}]`);
    console.log(`  ${m.id}${free}${ctx}${role}${note}`);
  }
  if (p.defaults.main || p.defaults.small) {
    console.log("");
    console.log(
      pc.dim(
        `defaults: main=${p.defaults.main ?? "—"}, small=${p.defaults.small ?? "—"}`
      )
    );
  }
  console.log("");
  console.log(pc.dim(p.notes[lang]));
}
