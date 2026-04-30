import os from "node:os";
import path from "node:path";

export interface ClaudexPaths {
  home: string;
  configFile: string;
  profilesFile: string;
  userProvidersFile: string;
  profilesDir: string;
  generatedDir: string;
  aliasesFile: string;
  backupsDir: string;
  mainClaudeDir: string;
}

export function getPaths(): ClaudexPaths {
  const explicit = process.env.CLAUDEX_HOME;
  const xdg = process.env.XDG_CONFIG_HOME;
  const home = explicit
    ? explicit
    : xdg
      ? path.join(xdg, "claudex")
      : path.join(os.homedir(), ".claudex");

  return {
    home,
    configFile: path.join(home, "config.json"),
    profilesFile: path.join(home, "profiles.json"),
    userProvidersFile: path.join(home, "providers.user.json"),
    profilesDir: path.join(home, "profiles"),
    generatedDir: path.join(home, "generated"),
    aliasesFile: path.join(home, "generated", "aliases.sh"),
    backupsDir: path.join(home, "backups"),
    mainClaudeDir: path.join(os.homedir(), ".claude"),
  };
}

export function profileDir(name: string): string {
  return path.join(getPaths().profilesDir, name);
}
