import fs from "node:fs";
import os from "node:os";
import path from "node:path";

export interface SandboxEnv {
  home: string;
  cleanup: () => void;
}

/**
 * Pivot $HOME and $CLAUDEX_HOME to a tmpdir so the test never touches the
 * developer's actual ~/.claude or ~/.claudex.
 */
export function sandbox(): SandboxEnv {
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "claudex-test-"));
  const claudexHome = path.join(tmp, ".claudex");
  const prevHome = process.env.HOME;
  const prevCH = process.env.CLAUDEX_HOME;
  const prevXdg = process.env.XDG_CONFIG_HOME;

  process.env.HOME = tmp;
  process.env.CLAUDEX_HOME = claudexHome;
  delete process.env.XDG_CONFIG_HOME;

  return {
    home: tmp,
    cleanup: () => {
      if (prevHome === undefined) delete process.env.HOME;
      else process.env.HOME = prevHome;
      if (prevCH === undefined) delete process.env.CLAUDEX_HOME;
      else process.env.CLAUDEX_HOME = prevCH;
      if (prevXdg === undefined) delete process.env.XDG_CONFIG_HOME;
      else process.env.XDG_CONFIG_HOME = prevXdg;
      try {
        fs.rmSync(tmp, { recursive: true, force: true });
      } catch {
        // ignore
      }
    },
  };
}
