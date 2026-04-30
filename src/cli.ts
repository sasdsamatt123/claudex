import { Command, Option } from "commander";
import { setLang, detectLang, type Lang } from "./core/i18n.js";
import { runInit } from "./commands/init.js";
import { runAdd } from "./commands/add.js";
import { runList } from "./commands/list.js";
import { runRemove } from "./commands/remove.js";
import { runProvidersList, runProvidersInfo } from "./commands/providers.js";
import { runDoctor } from "./commands/doctor.js";

const VERSION = "0.1.0";

setLang(detectLang());

const program = new Command();

program
  .name("claudex")
  .description(
    "Multi-account, multi-provider Claude Code CLI. Bring your own keys."
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

program.parseAsync(process.argv).catch((err) => {
  console.error(err?.stack ?? err);
  process.exit(1);
});
