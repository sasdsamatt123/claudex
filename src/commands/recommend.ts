import prompts from "prompts";
import pc from "picocolors";
import { loadRegistry, USE_CASES, type UseCase } from "../core/providers.js";
import { recommend, isUseCase, INTENT_LABELS, type Recommendation } from "../core/recommender.js";
import { loadProfiles } from "../core/profiles.js";
import { t, getLang } from "../core/i18n.js";

export interface RecommendOptions {
  json?: boolean;
}

export async function runRecommend(intent: string | undefined, opts: RecommendOptions = {}): Promise<void> {
  const lang = getLang();

  // Resolve intent
  let useCase: UseCase | null = null;
  if (intent) {
    if (!isUseCase(intent)) {
      console.error(pc.red(t("recommend.noMatches")));
      for (const id of USE_CASES) {
        console.log(`  ${pc.bold(id.padEnd(14))} ${INTENT_LABELS[id][lang]}`);
      }
      process.exitCode = 1;
      return;
    }
    useCase = intent;
  } else {
    const r = await prompts({
      type: "select",
      name: "v",
      message: t("recommend.pickIntent"),
      choices: USE_CASES.map((id) => ({
        title: INTENT_LABELS[id][lang],
        description: INTENT_LABELS[id].description[lang],
        value: id,
      })),
      initial: 0,
    });
    if (!r.v) {
      console.log(t("common.cancelled"));
      return;
    }
    useCase = r.v as UseCase;
  }

  const reg = loadRegistry();
  const recs = recommend(reg, useCase);

  if (opts.json) {
    console.log(
      JSON.stringify(
        recs.map((r) => ({
          provider: r.provider.id,
          model: r.model.id,
          score: Math.round(r.score),
          why: r.why,
          free: r.model.free,
          context: r.model.context ?? null,
          baseUrl: r.provider.baseUrl,
        })),
        null,
        2
      )
    );
    return;
  }

  if (recs.length === 0) {
    console.log(pc.yellow(t("recommend.noMatches")));
    for (const id of USE_CASES) {
      console.log(`  ${pc.bold(id.padEnd(14))} ${INTENT_LABELS[id][lang]}`);
    }
    return;
  }

  console.log("");
  console.log(pc.bold(t("recommend.topResults").replace("{n}", String(recs.length))));
  console.log("");

  const profiles = loadProfiles();
  for (let i = 0; i < recs.length; i++) {
    const rec = recs[i];
    const tier = rec.model.free
      ? pc.green("ÜCRETSİZ")
      : rec.provider.tier === "trial"
        ? pc.yellow("TRIAL")
        : pc.dim("PAID");
    const ctx = rec.model.context ? pc.dim(` ${Math.round(rec.model.context / 1000)}K`) : "";
    const trialEnd =
      rec.provider.tier === "trial" && rec.provider.trialEndsAt
        ? pc.yellow(`→${rec.provider.trialEndsAt}`)
        : "";
    const installed = profiles.find(
      (p) => p.providerId === rec.provider.id && p.mainModel === rec.model.id
    );
    const installedNote = installed
      ? "  " + pc.cyan(`${t("recommend.alreadyInstalled")} ${installed.name}`)
      : "";
    console.log(
      `  ${pc.bold(`${i + 1}.`)} ${rec.provider.displayName} · ${pc.bold(rec.model.id)}  ${tier}${trialEnd}${ctx}${installedNote}`
    );
    console.log(`     ${pc.dim(rec.why.join(" · "))}`);
  }
  console.log("");

  const choices = recs.map((r, i) => ({
    title: `${i + 1}. ${r.provider.displayName} · ${r.model.id}`,
    value: i,
  }));
  choices.push({ title: pc.dim("(skip / iptal)"), value: -1 });

  const { pick } = await prompts({
    type: "select",
    name: "pick",
    message: t("recommend.runIt"),
    choices,
    initial: 0,
  });
  if (pick === undefined || pick < 0) {
    console.log(t("common.cancelled"));
    return;
  }
  const chosen = recs[pick];
  const suggestedName = suggestProfileName(chosen, profiles.map((p) => p.name));
  const cmd = buildAddCommand(suggestedName, chosen);
  console.log("");
  console.log(pc.bold("Çalıştır:"));
  console.log("  " + pc.cyan(cmd));
}

function suggestProfileName(rec: Recommendation, taken: string[]): string {
  const base = `claude-${rec.provider.id}`;
  if (!taken.includes(base)) return base;
  for (let i = 2; i < 100; i++) {
    const candidate = `${base}-${i}`;
    if (!taken.includes(candidate)) return candidate;
  }
  return `${base}-${Date.now()}`;
}

function buildAddCommand(name: string, rec: Recommendation): string {
  const parts = [
    "claudex add",
    name,
    "--provider",
    rec.provider.id,
  ];
  if (rec.model.id !== rec.provider.defaults.main) {
    parts.push("--main-model", rec.model.id);
  }
  return parts.join(" ");
}
