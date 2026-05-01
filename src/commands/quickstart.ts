import prompts from "prompts";
import pc from "picocolors";
import { loadRegistry, getProvider, defaultMain, defaultSmall, type Provider } from "../core/providers.js";
import { loadProfiles } from "../core/profiles.js";
import { createProfile } from "./add.js";
import { t, getLang } from "../core/i18n.js";

const FREE_PROVIDER_ORDER = ["zai", "minimax", "openrouter"] as const;

export async function runQuickstart(): Promise<void> {
  const lang = getLang();
  const reg = loadRegistry();
  const targets = FREE_PROVIDER_ORDER
    .map((id) => getProvider(id))
    .filter((p): p is Provider => !!p);

  console.log("");
  console.log(pc.bold(`${targets.length} ${t("quickstart.intro")}`));
  console.log("");

  const profiles = loadProfiles();
  let installed = 0;

  for (let i = 0; i < targets.length; i++) {
    const provider = targets[i];
    const stepLabel = t("quickstart.step")
      .replace("{i}", String(i + 1))
      .replace("{n}", String(targets.length));
    console.log(
      pc.bold(stepLabel.replace("{name}", `${provider.displayName}`))
    );

    const existing = profiles.find((p) => p.providerId === provider.id);
    if (existing) {
      console.log(pc.dim(`   ${t("quickstart.providerExists")}: ${existing.name}`));
      const { skip } = await prompts({
        type: "confirm",
        name: "skip",
        message: lang === "tr" ? "Atlayalım mı?" : "Skip?",
        initial: true,
      });
      if (skip) {
        console.log(pc.dim(`   ${t("quickstart.skipped")}`));
        console.log("");
        continue;
      }
    }

    console.log(`   ${pc.cyan(provider.auth.keyUrl)}`);
    console.log(pc.dim(`   ${provider.auth.instructions[lang]}`));

    const { key } = await prompts({
      type: "password",
      name: "key",
      message: t("add.keyPrompt"),
    });
    const trimmed = (key ?? "").trim();
    if (!trimmed) {
      console.log(pc.dim(`   ${t("quickstart.skipped")}`));
      console.log("");
      continue;
    }

    const name = pickProfileName(provider, profiles, installed);
    const dir = createProfile({
      name,
      provider,
      key: trimmed,
      mainModel: defaultMain(provider),
      smallModel: defaultSmall(provider),
      share: true,
      existingCreatedAt: null,
    });
    profiles.push({
      name,
      providerId: provider.id,
      baseUrl: provider.baseUrl,
      mainModel: defaultMain(provider),
      smallModel: defaultSmall(provider),
      share: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });
    installed++;
    console.log(`   ${pc.green("✓")} ${pc.bold(name)} ${pc.dim(`→ ${defaultMain(provider) ?? "?"}`)}`);
    console.log(pc.dim(`   ${dir}`));
    console.log("");
  }

  console.log("");
  console.log(
    pc.green(t("quickstart.summary").replace("{n}", String(installed)))
  );
  if (installed > 0) {
    console.log(pc.dim("source ~/.zshrc"));
  }
}

function pickProfileName(
  provider: Provider,
  existing: { name: string }[],
  ordinal: number
): string {
  const base = `claude-${provider.id}`;
  const taken = new Set(existing.map((p) => p.name));
  if (!taken.has(base)) return base;
  // try claude-zai-2, claude-zai-3...
  for (let i = 2; i < 100; i++) {
    const candidate = `${base}-${i}`;
    if (!taken.has(candidate)) return candidate;
  }
  return `${base}-${Date.now()}-${ordinal}`;
}
