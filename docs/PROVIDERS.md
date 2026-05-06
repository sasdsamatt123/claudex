# Providers

Bundled providers and where to get keys. All have **native Anthropic-compatible** endpoints; no proxy needed.

## Use-case → Provider map

`claudex recommend <intent>` ranks across all providers, but here's a quick reference:

| Use case | Top free pick | Top paid pick |
|---|---|---|
| `coding-fast` Hızlı kod / refactor | Z.ai · `glm-4.7-flash` | DeepSeek · `deepseek-v4-flash` |
| `refactor` Ağır refactor | MiniMax · `MiniMax-M2.7` (trial) | DeepSeek · `deepseek-v4-pro` |
| `long-context` >200K context | Z.ai · `glm-5.1` (paid) / Z.ai `glm-4.7-flash` (free) | Moonshot · `kimi-k2.5` |
| `cheap-agent` Yüksek hacim agent | OpenRouter · `z-ai/glm-4.5-air:free` | DeepSeek · `deepseek-v4-flash` |
| `vision` Multimodal | OpenRouter · `google/gemma-4-31b-it:free` | (yok bundled) |
| `multi-agent` Orchestration | OpenRouter · `nvidia/nemotron-3-super-120b-a12b:free` | OpenRouter · `anthropic/claude-opus-4.7` |
| `free-trial` Sıfır maliyet | Z.ai · `glm-4.7-flash` | — |
| `cheap-batch` Bulk processing | OpenRouter · `z-ai/glm-4.5-air:free` | DeepSeek · `deepseek-v4-flash` |


## Z.ai (Zhipu) — FREE FOREVER 🥇

- **Key URL**: https://z.ai/manage-apikey/apikey-list
- **Base URL**: `https://api.z.ai/api/anthropic`
- **Default models**: `glm-4.7-flash` (main), `glm-4.5-flash` (small)
- **Note**: GLM-4.7-Flash and GLM-4.5-Flash are free for all registered users, no card. Coding plan ($18/mo) unlocks GLM-5.1.

```
claudex add claude5 --provider zai
```

## MiniMax — FREE TRIAL until Nov 7 2026 🥈

- **Key URL**: https://platform.minimax.io/user-center/basic-information/interface-key
- **Base URL**: `https://api.minimax.io/anthropic`
- **Default models**: `MiniMax-M2.7` (main), `MiniMax-M2.7-highspeed` (small)
- **Note**: Trial credits expire 30 days from issue, but new credits are issued each cycle through Nov 7 2026. M2.7 matches Claude Opus 4.6 on SWE-Pro (56%).

```
claudex add claude6 --provider minimax
```

## OpenRouter — 32 free models

- **Key URL**: https://openrouter.ai/settings/keys
- **Base URL**: `https://openrouter.ai/api`
- **Default models**: `qwen/qwen3-coder:free` (main), `z-ai/glm-4.5-air:free` (small)
- **Limits**: 20 requests/min, 200 requests/day **per model**. Switch models when one hits the cap.
- **Note**: One key, dozens of free models. Full list: https://openrouter.ai/models?q=free

```
claudex add claude7 --provider openrouter
```

## DeepSeek — Cheap paid

- **Key URL**: https://platform.deepseek.com/api_keys
- **Base URL**: `https://api.deepseek.com/anthropic`
- **Default models**: `deepseek-v4-pro` (main), `deepseek-v4-flash` (small)
- **Pricing**: $0.27/M input, $1.10/M output for Pro (10× cache hit discount). Roughly 10× cheaper than Sonnet.

```
claudex add claude3 --provider deepseek
```

## Moonshot Kimi — Paid

- **Key URL**: https://platform.moonshot.ai/console/api-keys
- **Base URL**: `https://api.moonshot.ai/anthropic`
- **Default models**: `kimi-k2.5`
- **Note**: 1T-param MoE, optimized for long context (>200K). Kimi Code plan ~$19/mo.

```
claudex add claude8 --provider moonshot
```

## Anthropic (Official)

- **Key URL**: https://console.anthropic.com/settings/keys
- **Base URL**: (default — not overridden)
- **Models**: Whatever your subscription gives you
- **Note**: For users with **multiple separately-billed Anthropic API accounts** (e.g., personal + company, or different organizations). claudex sets `CLAUDE_CONFIG_DIR` per profile so the accounts don't collide. **Not for sharing or duplicating a single Pro/Max subscription** — Anthropic's [Consumer Terms](https://www.anthropic.com/legal/consumer-terms) prohibit that.

```
claudex add claude2 --provider anthropic --no-share
```

(`--no-share` so the second account doesn't share session/cache with the first; agents/commands/skills still get symlinked if you want shared tooling.)

---

## Adding a new provider

The whole registry is [`src/templates/providers.json`](../src/templates/providers.json) — pure data, no code. Open a PR adding your provider. See [CONTRIBUTING.md](../CONTRIBUTING.md).
