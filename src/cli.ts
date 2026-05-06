import { Command, Option } from "commander";
import { setLang, detectLang, type Lang } from "./core/i18n.js";
import { runInit } from "./commands/init.js";
import { runAdd } from "./commands/add.js";
import { runList } from "./commands/list.js";
import { runRemove } from "./commands/remove.js";
import { runProvidersList, runProvidersInfo } from "./commands/providers.js";
import { runDoctor } from "./commands/doctor.js";
import { runRecommend } from "./commands/recommend.js";
import { runValidate } from "./commands/validate.js";
import { runQuickstart } from "./commands/quickstart.js";
import { runExport } from "./commands/export.js";
import { runImport } from "./commands/import.js";

const VERSION = "0.2.0";

setLang(detectLang());

const program = new Command();

program
  .name("claudex")
  .description(
    "Multi-provider, multi-profile Claude Code CLI. Bring your own keys."
  )
  .version(VERSION)
  .addOption(
    new Option("--lang <lang>", "Output language (tr|en)")
      .choices(["tr", "en"])
      .default(undefined)
  )
  .hook("preAction", (thisCommand) => {
    const lang = thisCommand.opts().lang as Lang | undefined;
    if (lang) setLang(lang);
  });

program
  .command("init")
  .description("Set up ~/.claudex and inject the shell rc managed block")
  .option("--force", "Overwrite even if managed block already present")
  .action(runInit);

program
  .command("add <name>")
  .description("Add a new claudex profile (interactive)")
  .option("-p, --provider <id>", "Provider id (e.g. zai, deepseek, openrouter)")
  .option("-m, --main-model <id>", "Main model id")
  .option("-s, --small-model <id>", "Small/background model id")
  .option("--share", "Symlink shared assets from ~/.claude/ (default if it exists)")
  .option("--no-share", "Do not symlink — create an isolated profile")
  .option("--key <key>", "API key (skip interactive prompt — careful with shell history)")
  .option("-y, --yes", "Assume yes for all prompts")
  .action(runAdd);

program
  .command("list")
  .alias("ls")
  .description("List all claudex profiles")
  .option("--json", "Output JSON")
  .action(runList);

program
  .command("remove <name>")
  .alias("rm")
  .description("Remove a claudex profile")
  .option("--keep-data", "Remove the alias but keep profile data")
  .option("-y, --yes", "Skip confirmation")
  .action(runRemove);

const providers = program
  .command("providers")
  .description("Browse available providers");

providers
  .command("list", { isDefault: true })
  .description("List all providers (default)")
  .action(runProvidersList);

providers
  .command("info <id>")
  .description("Show provider details + key URL + models")
  .action(runProvidersInfo);

program
  .command("doctor")
  .description("Diagnose the claudex setup and per-profile health")
  .action(runDoctor);

program
  .command("recommend [intent]")
  .description("Recommend top-3 (provider, model) pairs for an intent (interactive if omitted)")
  .option("--json", "Output JSON")
  .action((intent, opts) => runRecommend(intent, opts));

program
  .command("validate <name>")
  .description("Send a 1-token test request to verify the profile's key + model")
  .action(runValidate);

program
  .command("quickstart")
  .description("Guided setup of all bundled free providers (Z.ai, MiniMax, OpenRouter)")
  .action(runQuickstart);

program
  .command("export <name>")
  .description("Export a profile as a redacted (no-key) template")
  .option("-o, --output <file>", "Write to file instead of stdout")
  .action(runExport);

program
  .command("import <file>")
  .description("Load a profile template and create the profile (prompts for key)")
  .option("--rename <newName>", "Use a different profile name on import")
  .option("--key <key>", "API key (skip interactive prompt)")
  .option("-y, --yes", "Overwrite existing profile without confirmation")
  .action(runImport);

program.parseAsync(process.argv).catch((err) => {
  console.error(err?.stack ?? err);
  process.exit(1);
});
