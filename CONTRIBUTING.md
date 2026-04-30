# Contributing to claudex

Welcome! `claudex` is a small CLI; contributions of all sizes are welcome.

## Adding a new provider

The whole provider catalog lives in **one JSON file**:
[`src/templates/providers.json`](src/templates/providers.json)

To add a provider, open that file and append a new object:

```json
{
  "id": "myprovider",
  "displayName": "My Provider",
  "tier": "free",
  "trialEndsAt": null,
  "baseUrl": "https://api.example.com/anthropic",
  "envStyle": "anthropic",
  "auth": {
    "envVar": "ANTHROPIC_AUTH_TOKEN",
    "keyUrl": "https://example.com/api-keys",
    "needsKey": true,
    "instructions": {
      "tr": "Site → kayıt → API Keys → Create. Anahtarı buraya yapıştır.",
      "en": "Site → register → API Keys → Create. Paste key here."
    }
  },
  "models": [
    { "id": "model-pro", "role": "main", "free": false, "context": 128000 },
    { "id": "model-flash", "role": "small", "free": true }
  ],
  "defaults": { "main": "model-pro", "small": "model-flash" },
  "notes": {
    "tr": "Türkçe kısa açıklama.",
    "en": "Short English description."
  },
  "lastVerified": "2026-05-01"
}
```

### Requirements for a new provider

1. **Must have an Anthropic-compatible endpoint.** That's the whole reason this works without a proxy. If the provider only exposes OpenAI-format APIs, it can't be supported in v0.1 (proxy mode comes in v0.2).
2. **Verify by hand**: register, create a key, run `claudex add test --provider myprovider`, run `test --version`. If it doesn't work, don't open the PR.
3. **Update `lastVerified`** to today's date.
4. **Provide bilingual instructions** (TR + EN). One sentence each is fine; specifics like "Settings → API → Create" help.
5. **Run tests**: `npm test` — the providers test will validate your JSON shape.

### What gets reviewed

- JSON validity (zod schema check)
- Whether the URL really is Anthropic-compatible
- Whether the model defaults work for a fresh key
- Bilingual instruction quality

That's it. No code changes required.

## Bug reports

Use the [bug issue template](.github/ISSUE_TEMPLATE/bug.yml). Include:
- `claudex --version`
- `claudex doctor` output
- Your shell (`echo $SHELL`) and OS (`uname -a`)
- Reproduction steps

## Code contributions

```bash
git clone https://github.com/yourname/claudex.git
cd claudex
npm install
npm test       # all tests should pass
npm run lint   # tsc --noEmit, no errors
npm run build  # tsup → dist/
```

For larger changes, please open an issue first to discuss.

## Code style

- TypeScript strict mode
- ESM only (`type: "module"` in package.json)
- No emojis in source code (only in user-facing CLI strings if explicitly requested)
- Prefer `node:` prefixed imports for built-ins
- Tests use vitest with `forks` pool (env vars must be process-scoped)

## License

By contributing, you agree your contribution is licensed under MIT.
