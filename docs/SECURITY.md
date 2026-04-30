# Security

## What claudex does

- Stores each profile's API key in `~/.claudex/profiles/<name>/.env` with file mode `0600` (read/write owner only).
- Generates a shell function per profile that:
  - sources the `.env` only when the alias is invoked
  - exports the key into the spawned `claude` process via env, **not argv** (so it doesn't show up in `ps`)
  - never writes the key to shell history
- Writes `.gitignore` rules to `~/.claudex/.gitignore` covering `profiles/*/.env`, `backups/`, and `providers.user.json`.

## What claudex does NOT do (in v0.1)

- Encrypted secret storage. Keys are **plain text** on disk.
- Keychain / Secret Service integration. Coming in v0.2 as opt-in.
- Network calls during install or normal operation (no telemetry).

## Recommendations

1. **Enable disk encryption.** macOS FileVault, Linux LUKS / encrypted home directory.
2. **Don't commit `~/.claudex/`.** The auto-written `.gitignore` covers `.env` files but be careful if you ever script-rsync your dotfiles.
3. **Use per-purpose keys.** Most providers let you create multiple keys with different names; rotate when needed.
4. **Treat `~/.claudex/profiles/<name>/.env` like SSH private keys.** Mode 0600. Don't email them, paste them, or commit them.
5. **Watch shell history.** Never pass `--key sk-...` on the command line — that lands in `~/.zsh_history`. Use the interactive prompt instead.

## Reporting vulnerabilities

If you find a security issue, please open a private security advisory on GitHub rather than a public issue.

## What about a leaked key?

Every provider lets you revoke a key from the same dashboard you got it from. After revoking:

```bash
claudex remove <name>      # cleans up .env + alias
# then re-add with the new key:
claudex add <name> --provider <id>
```
