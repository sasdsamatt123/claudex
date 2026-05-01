import pc from "picocolors";
import { getProfile } from "../core/profiles.js";
import { profileDir } from "../core/paths.js";
import { readSecret, hasSecret } from "../core/secrets.js";
import { getProvider, defaultMain } from "../core/providers.js";
import { pingProvider } from "../core/validate.js";
import { t } from "../core/i18n.js";

export async function runValidate(name: string): Promise<void> {
  const profile = getProfile(name);
  if (!profile) {
    console.error(pc.red(t("remove.notFound")), name);
    process.exitCode = 1;
    return;
  }
  const provider = getProvider(profile.providerId);
  if (!provider) {
    console.error(pc.red(t("providers.notFound")), profile.providerId);
    process.exitCode = 1;
    return;
  }

  // Anthropic native — nothing to ping
  if (!provider.baseUrl || !provider.auth.needsKey) {
    console.log(pc.dim(t("validate.skipAnthropic")));
    return;
  }

  if (!hasSecret(profileDir(name))) {
    console.error(pc.red(t("validate.noKey")));
    process.exitCode = 1;
    return;
  }
  const key = readSecret(profileDir(name));
  if (!key) {
    console.error(pc.red(t("validate.noKey")));
    process.exitCode = 1;
    return;
  }

  const model = profile.mainModel ?? defaultMain(provider);
  if (!model) {
    console.error(pc.red("no main model on this profile"));
    process.exitCode = 1;
    return;
  }

  console.log(pc.dim(t("validate.pinging")));
  const res = await pingProvider({
    apiKey: key,
    model,
    baseUrl: provider.baseUrl,
  });
  if (res.ok) {
    console.log(pc.green(t("validate.ok")), pc.dim(`${res.latencyMs}ms · ${provider.displayName} · ${model}`));
  } else {
    console.log(pc.red(`${t("validate.fail")} ${res.reason}`));
    process.exitCode = 1;
  }
}
